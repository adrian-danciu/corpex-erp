import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { Observable } from "@apollo/client/utilities";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Apollo Client Configuration
 * Connects to the NestJS GraphQL API with JWT authentication
 */

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/graphql";
const httpLink = new HttpLink({ uri: apiUrl });
let refreshPromise: Promise<string | null> | null = null;

function shouldTreatAsAuthFailure(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((gqlError) => {
      const code = gqlError.extensions?.code;
      const status = (gqlError.extensions as { status?: number } | undefined)
        ?.status;
      const message = gqlError.message ?? "";

      return (
        code === "UNAUTHENTICATED" ||
        status === 401 ||
        /unauthor/i.test(message)
      );
    });
  }

  return ServerError.is(error) && error.statusCode === 401;
}

async function requestFreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken)
        }
      `,
      variables: { refreshToken },
    }),
  });

  if (!response.ok) return null;

  const result = (await response.json()) as {
    data?: { refreshToken?: string };
    errors?: Array<{ message?: string }>;
  };

  const accessToken = result.data?.refreshToken;
  if (!accessToken || result.errors?.length) return null;

  useAuthStore.getState().updateToken(accessToken);
  return accessToken;
}

function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= requestFreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Auth middleware to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Force-redirect to the login screen when the JWT is rejected by the API.
// Triggers on either a GraphQL error with code UNAUTHENTICATED / message
// "Unauthorized", or a network error with HTTP 401.
let redirectingToLogin = false;
function handleAuthFailure() {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  useAuthStore.getState().logout();
  // Full page navigation also wipes the Apollo cache, which is what we want
  // when the session ends.
  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
}

const errorLink = onError(({ error, operation, forward }) => {
  if (!shouldTreatAsAuthFailure(error)) return;

  const context = operation.getContext();
  if (context.authRetry || operation.operationName === "RefreshToken") {
    handleAuthFailure();
    return;
  }

  return new Observable<ApolloLink.Result>((observer) => {
    let subscription: { unsubscribe: () => void } | undefined;

    void refreshAccessToken()
      .then((accessToken) => {
        if (!accessToken) {
          handleAuthFailure();
          observer.error(error);
          return;
        }

        operation.setContext(({ headers = {} }) => ({
          authRetry: true,
          headers: {
            ...headers,
            authorization: `Bearer ${accessToken}`,
          },
        }));

        subscription = forward(operation).subscribe({
          next: (value) => observer.next(value),
          error: (retryError) => observer.error(retryError),
          complete: () => observer.complete(),
        });
      })
      .catch((refreshError) => {
        handleAuthFailure();
        observer.error(refreshError);
      });

    return () => {
      subscription?.unsubscribe();
    };
  });
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});

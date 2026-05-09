import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Apollo Client Configuration
 * Connects to the NestJS GraphQL API with JWT authentication
 */

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || "http://localhost:3000/graphql",
});

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

const errorLink = onError(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    for (const gqlError of error.errors) {
      const code = gqlError.extensions?.code;
      const status = (gqlError.extensions as { status?: number } | undefined)
        ?.status;
      const message = gqlError.message ?? "";
      if (
        code === "UNAUTHENTICATED" ||
        status === 401 ||
        /unauthor/i.test(message)
      ) {
        handleAuthFailure();
        return;
      }
    }
  }

  if (ServerError.is(error) && error.statusCode === 401) {
    handleAuthFailure();
  }
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

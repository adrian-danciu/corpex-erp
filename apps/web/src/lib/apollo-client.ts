import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

/**
 * Apollo Client Configuration
 * Connects to the NestJS GraphQL API with JWT authentication
 */

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql',
});

// Auth middleware to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem('accessToken');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

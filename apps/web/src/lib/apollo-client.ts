import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

/**
 * Apollo Client Configuration
 * Connects to the NestJS GraphQL API
 */

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

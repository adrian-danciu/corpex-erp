import { gql } from '@apollo/client';

/**
 * GraphQL mutation to create a new user
 */
export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
      id
      firstName
      lastName
      email
      role
      createdAt
      updatedAt
    }
  }
`;

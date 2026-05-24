import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      accessToken
      refreshToken
      user {
        id
        firstName
        lastName
        email
        role
        mustChangePassword
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken)
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      firstName
      lastName
      email
      role
      mustChangePassword
      createdAt
      updatedAt
    }
  }
`;

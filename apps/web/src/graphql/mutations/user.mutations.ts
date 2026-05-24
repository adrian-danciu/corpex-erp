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
      mustChangePassword
      createdAt
      updatedAt
    }
  }
`;

export const GENERATE_EMPLOYEE_ACCOUNT_MUTATION = gql`
  mutation GenerateEmployeeAccount($employeeId: String!) {
    generateEmployeeAccount(employeeId: $employeeId) {
      employeeId
      employeeName
      email
      initialPassword
      created
      message
    }
  }
`;

export const GENERATE_EMPLOYEE_ACCOUNTS_MUTATION = gql`
  mutation GenerateEmployeeAccounts($employeeIds: [String!]!) {
    generateEmployeeAccounts(employeeIds: $employeeIds) {
      employeeId
      employeeName
      email
      initialPassword
      created
      message
    }
  }
`;

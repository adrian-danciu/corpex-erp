import { gql } from "@apollo/client";

export const CREATE_EMPLOYEE_MUTATION = gql`
  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {
    createEmployee(createEmployeeInput: $createEmployeeInput) {
      id
      userId
      user {
        id
        firstName
        lastName
        email
        role
      }
      personalId
      dateOfBirth
      phoneNumber
      address
      city
      country
      position
      department
      contractType
      employmentDate
      contractEndDate
      salary
      annualLeaveDays
      remainingLeave
      managerId
      manager {
        id
        user {
          id
          firstName
          lastName
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_EMPLOYEE_MUTATION = gql`
  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {
    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {
      id
      userId
      user {
        id
        firstName
        lastName
        email
        role
      }
      personalId
      dateOfBirth
      phoneNumber
      address
      city
      country
      position
      department
      contractType
      employmentDate
      contractEndDate
      salary
      annualLeaveDays
      remainingLeave
      managerId
      manager {
        id
        user {
          id
          firstName
          lastName
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_EMPLOYEE_MUTATION = gql`
  mutation RemoveEmployee($id: String!) {
    removeEmployee(id: $id) {
      id
    }
  }
`;

export const GET_EMPLOYEES_QUERY = gql`
  query GetEmployees($pagination: PaginationInput) {
    employees(pagination: $pagination) {
      items {
        id
        userId
        user {
          id
          firstName
          lastName
          email
          role
        }
        personalId
        dateOfBirth
        phoneNumber
        address
        city
        country
        position
        department
        contractType
        employmentDate
        contractEndDate
        salary
        annualLeaveDays
        remainingLeave
        managerId
        manager {
          id
          user {
            id
            firstName
            lastName
          }
        }
        createdAt
        updatedAt
      }
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const GET_EMPLOYEE_QUERY = gql`
  query GetEmployee($id: String!) {
    employee(id: $id) {
      id
      userId
      user {
        id
        firstName
        lastName
        email
        role
      }
      personalId
      dateOfBirth
      phoneNumber
      address
      city
      country
      position
      department
      contractType
      employmentDate
      contractEndDate
      salary
      annualLeaveDays
      remainingLeave
      managerId
      manager {
        id
        user {
          id
          firstName
          lastName
        }
      }
      subordinates {
        id
        user {
          id
          firstName
          lastName
        }
        position
        department
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_EMPLOYEE_PROFILE_QUERY = gql`
  query GetMyEmployeeProfile {
    myEmployeeProfile {
      id
      userId
      user {
        id
        firstName
        lastName
        email
        role
      }
      personalId
      dateOfBirth
      phoneNumber
      address
      city
      country
      position
      department
      contractType
      employmentDate
      contractEndDate
      salary
      annualLeaveDays
      remainingLeave
      managerId
      manager {
        id
        user {
          id
          firstName
          lastName
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_EMPLOYEES_BY_DEPARTMENT_QUERY = gql`
  query GetEmployeesByDepartment($department: String!) {
    employeesByDepartment(department: $department) {
      id
      userId
      user {
        id
        firstName
        lastName
        email
        role
      }
      position
      department
      contractType
      employmentDate
      remainingLeave
    }
  }
`;

export const GET_MY_SUBORDINATES_QUERY = gql`
  query GetMySubordinates {
    mySubordinates {
      id
      userId
      user {
        id
        firstName
        lastName
        email
        role
      }
      position
      department
      contractType
      employmentDate
      remainingLeave
    }
  }
`;

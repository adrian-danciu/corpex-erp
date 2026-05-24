import { gql } from "@apollo/client";

export const EMPLOYEE_SUMMARY_FRAGMENT = gql`
  fragment EmployeeSummaryFields on Employee {
    id
    userId
    firstName
    lastName
    user {
      id
      firstName
      lastName
      email
      role
      mustChangePassword
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
    isContractor
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
`;

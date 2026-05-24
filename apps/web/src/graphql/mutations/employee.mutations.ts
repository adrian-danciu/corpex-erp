import { gql } from "@apollo/client";
import { EMPLOYEE_SUMMARY_FRAGMENT } from "../fragments/employee.fragments";

export const CREATE_EMPLOYEE_MUTATION = gql`
  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {
    createEmployee(createEmployeeInput: $createEmployeeInput) {
      ...EmployeeSummaryFields
    }
  }
  ${EMPLOYEE_SUMMARY_FRAGMENT}
`;

export const UPDATE_EMPLOYEE_MUTATION = gql`
  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {
    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {
      ...EmployeeSummaryFields
    }
  }
  ${EMPLOYEE_SUMMARY_FRAGMENT}
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
        ...EmployeeSummaryFields
      }
      meta {
        total
        skip
        take
      }
    }
  }
  ${EMPLOYEE_SUMMARY_FRAGMENT}
`;

export const GET_EMPLOYEE_QUERY = gql`
  query GetEmployee($id: String!) {
    employee(id: $id) {
      ...EmployeeSummaryFields
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
    }
  }
  ${EMPLOYEE_SUMMARY_FRAGMENT}
`;

export const GET_MY_EMPLOYEE_PROFILE_QUERY = gql`
  query GetMyEmployeeProfile {
    myEmployeeProfile {
      ...EmployeeSummaryFields
    }
  }
  ${EMPLOYEE_SUMMARY_FRAGMENT}
`;

export const GET_ORG_CHART_QUERY = gql`
  query GetOrgChart {
    employees(pagination: { skip: 0, take: 1000 }) {
      items {
        id
        firstName
        lastName
        position
        department
        managerId
      }
    }
  }
`;

export const GET_EMPLOYEES_BY_DEPARTMENT_QUERY = gql`
  query GetEmployeesByDepartment($department: String!) {
    employeesByDepartment(department: $department) {
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
      }
      position
      department
      contractType
      isContractor
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
      firstName
      lastName
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
      isContractor
      employmentDate
      remainingLeave
    }
  }
`;

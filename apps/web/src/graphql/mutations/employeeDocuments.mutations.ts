import { gql } from "@apollo/client";

const EMPLOYEE_DOCUMENT_FIELDS = gql`
  fragment EmployeeDocumentFields on EmployeeDocument {
    id
    employeeId
    type
    title
    fileName
    fileUrl
    mimeType
    size
    expiryDate
    notes
    uploadedById
    createdAt
    updatedAt
    employee {
      id
      firstName
      lastName
      position
      department
    }
    uploadedBy {
      id
      firstName
      lastName
      email
    }
  }
`;

export const GET_EMPLOYEE_DOCUMENTS_QUERY = gql`
  ${EMPLOYEE_DOCUMENT_FIELDS}
  query EmployeeDocuments($filter: EmployeeDocumentFilterInput) {
    employeeDocuments(filter: $filter) {
      ...EmployeeDocumentFields
    }
  }
`;

export const CREATE_EMPLOYEE_DOCUMENT_MUTATION = gql`
  ${EMPLOYEE_DOCUMENT_FIELDS}
  mutation CreateEmployeeDocument($input: CreateEmployeeDocumentInput!) {
    createEmployeeDocument(input: $input) {
      ...EmployeeDocumentFields
    }
  }
`;

export const DELETE_EMPLOYEE_DOCUMENT_MUTATION = gql`
  ${EMPLOYEE_DOCUMENT_FIELDS}
  mutation DeleteEmployeeDocument($id: String!) {
    deleteEmployeeDocument(id: $id) {
      ...EmployeeDocumentFields
    }
  }
`;

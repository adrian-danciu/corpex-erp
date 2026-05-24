import { gql } from "@apollo/client";
import {
  MILEAGE_LOG_FRAGMENT,
  VEHICLE_DOCUMENT_FRAGMENT,
  VEHICLE_EXPENSE_FRAGMENT,
  VEHICLE_LEASE_FRAGMENT,
  VEHICLE_SUMMARY_FRAGMENT,
} from "../fragments/fleet.fragments";

export const CREATE_VEHICLE_MUTATION = gql`
  mutation CreateVehicle($createVehicleInput: CreateVehicleInput!) {
    createVehicle(createVehicleInput: $createVehicleInput) {
      ...VehicleSummaryFields
    }
  }
  ${VEHICLE_SUMMARY_FRAGMENT}
`;

export const UPDATE_VEHICLE_MUTATION = gql`
  mutation UpdateVehicle($updateVehicleInput: UpdateVehicleInput!) {
    updateVehicle(updateVehicleInput: $updateVehicleInput) {
      ...VehicleSummaryFields
    }
  }
  ${VEHICLE_SUMMARY_FRAGMENT}
`;

export const DELETE_VEHICLE_MUTATION = gql`
  mutation DeleteVehicle($id: String!) {
    deleteVehicle(id: $id) {
      id
    }
  }
`;

export const CREATE_VEHICLE_DOCUMENT_MUTATION = gql`
  mutation CreateVehicleDocument($createVehicleDocumentInput: CreateVehicleDocumentInput!) {
    createVehicleDocument(createVehicleDocumentInput: $createVehicleDocumentInput) {
      ...VehicleDocumentFields
    }
  }
  ${VEHICLE_DOCUMENT_FRAGMENT}
`;

export const UPDATE_VEHICLE_DOCUMENT_MUTATION = gql`
  mutation UpdateVehicleDocument($updateVehicleDocumentInput: UpdateVehicleDocumentInput!) {
    updateVehicleDocument(updateVehicleDocumentInput: $updateVehicleDocumentInput) {
      ...VehicleDocumentFields
    }
  }
  ${VEHICLE_DOCUMENT_FRAGMENT}
`;

export const DELETE_VEHICLE_DOCUMENT_MUTATION = gql`
  mutation DeleteVehicleDocument($id: String!) {
    deleteVehicleDocument(id: $id) {
      id
    }
  }
`;

export const CREATE_MILEAGE_LOG_MUTATION = gql`
  mutation CreateMileageLog($createMileageLogInput: CreateMileageLogInput!) {
    createMileageLog(createMileageLogInput: $createMileageLogInput) {
      ...MileageLogFields
    }
  }
  ${MILEAGE_LOG_FRAGMENT}
`;

export const DELETE_MILEAGE_LOG_MUTATION = gql`
  mutation DeleteMileageLog($id: String!) {
    deleteMileageLog(id: $id) {
      id
    }
  }
`;

export const CREATE_VEHICLE_LEASE_MUTATION = gql`
  mutation CreateVehicleLease($createVehicleLeaseInput: CreateVehicleLeaseInput!) {
    createVehicleLease(createVehicleLeaseInput: $createVehicleLeaseInput) {
      ...VehicleLeaseFields
    }
  }
  ${VEHICLE_LEASE_FRAGMENT}
`;

export const UPDATE_VEHICLE_LEASE_MUTATION = gql`
  mutation UpdateVehicleLease($updateVehicleLeaseInput: UpdateVehicleLeaseInput!) {
    updateVehicleLease(updateVehicleLeaseInput: $updateVehicleLeaseInput) {
      ...VehicleLeaseFields
    }
  }
  ${VEHICLE_LEASE_FRAGMENT}
`;

export const DELETE_VEHICLE_LEASE_MUTATION = gql`
  mutation DeleteVehicleLease($id: String!) {
    deleteVehicleLease(id: $id) {
      id
    }
  }
`;

export const CREATE_VEHICLE_EXPENSE_MUTATION = gql`
  mutation CreateVehicleExpense($createVehicleExpenseInput: CreateVehicleExpenseInput!) {
    createVehicleExpense(createVehicleExpenseInput: $createVehicleExpenseInput) {
      ...VehicleExpenseFields
    }
  }
  ${VEHICLE_EXPENSE_FRAGMENT}
`;

export const DELETE_VEHICLE_EXPENSE_MUTATION = gql`
  mutation DeleteVehicleExpense($id: String!) {
    deleteVehicleExpense(id: $id) {
      id
    }
  }
`;

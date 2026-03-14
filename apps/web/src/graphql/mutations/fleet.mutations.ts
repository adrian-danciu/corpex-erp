import { gql } from "@apollo/client";

export const CREATE_VEHICLE_MUTATION = gql`
  mutation CreateVehicle($createVehicleInput: CreateVehicleInput!) {
    createVehicle(createVehicleInput: $createVehicleInput) {
      id
      plateNumber
      chassisNumber
      brand
      model
      year
      fuelType
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_VEHICLE_MUTATION = gql`
  mutation UpdateVehicle($updateVehicleInput: UpdateVehicleInput!) {
    updateVehicle(updateVehicleInput: $updateVehicleInput) {
      id
      plateNumber
      chassisNumber
      brand
      model
      year
      fuelType
      status
      updatedAt
    }
  }
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
      id
      vehicleId
      type
      expiryDate
      issuedDate
      provider
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_VEHICLE_DOCUMENT_MUTATION = gql`
  mutation UpdateVehicleDocument($updateVehicleDocumentInput: UpdateVehicleDocumentInput!) {
    updateVehicleDocument(updateVehicleDocumentInput: $updateVehicleDocumentInput) {
      id
      vehicleId
      type
      expiryDate
      issuedDate
      provider
      updatedAt
    }
  }
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
      id
      vehicleId
      date
      odometer
      notes
      createdAt
    }
  }
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
      id
      vehicleId
      provider
      startDate
      endDate
      monthlyRate
      notes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_VEHICLE_LEASE_MUTATION = gql`
  mutation UpdateVehicleLease($updateVehicleLeaseInput: UpdateVehicleLeaseInput!) {
    updateVehicleLease(updateVehicleLeaseInput: $updateVehicleLeaseInput) {
      id
      vehicleId
      provider
      startDate
      endDate
      monthlyRate
      notes
      updatedAt
    }
  }
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
      id
      vehicleId
      type
      amount
      date
      description
      createdAt
    }
  }
`;

export const DELETE_VEHICLE_EXPENSE_MUTATION = gql`
  mutation DeleteVehicleExpense($id: String!) {
    deleteVehicleExpense(id: $id) {
      id
    }
  }
`;

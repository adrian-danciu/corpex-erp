import { gql } from "@apollo/client";

export const VEHICLE_SUMMARY_FRAGMENT = gql`
  fragment VehicleSummaryFields on Vehicle {
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
`;

export const VEHICLE_DOCUMENT_FRAGMENT = gql`
  fragment VehicleDocumentFields on VehicleDocument {
    id
    vehicleId
    type
    expiryDate
    issuedDate
    provider
    createdAt
    updatedAt
  }
`;

export const MILEAGE_LOG_FRAGMENT = gql`
  fragment MileageLogFields on MileageLog {
    id
    vehicleId
    date
    odometer
    notes
    createdAt
  }
`;

export const VEHICLE_LEASE_FRAGMENT = gql`
  fragment VehicleLeaseFields on VehicleLease {
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
`;

export const VEHICLE_EXPENSE_FRAGMENT = gql`
  fragment VehicleExpenseFields on VehicleExpense {
    id
    vehicleId
    type
    amount
    date
    description
    createdAt
  }
`;

export const VEHICLE_DETAIL_FRAGMENT = gql`
  fragment VehicleDetailFields on Vehicle {
    ...VehicleSummaryFields
    documents {
      ...VehicleDocumentFields
    }
    mileageLogs {
      ...MileageLogFields
    }
    leases {
      ...VehicleLeaseFields
    }
    expenses {
      ...VehicleExpenseFields
    }
  }
  ${VEHICLE_SUMMARY_FRAGMENT}
  ${VEHICLE_DOCUMENT_FRAGMENT}
  ${MILEAGE_LOG_FRAGMENT}
  ${VEHICLE_LEASE_FRAGMENT}
  ${VEHICLE_EXPENSE_FRAGMENT}
`;

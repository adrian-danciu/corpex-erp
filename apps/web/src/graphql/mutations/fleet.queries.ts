import { gql } from "@apollo/client";

export const GET_VEHICLES_QUERY = gql`
  query GetVehicles($pagination: PaginationInput) {
    vehicles(pagination: $pagination) {
      items {
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
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const GET_VEHICLE_QUERY = gql`
  query GetVehicle($id: String!) {
    vehicle(id: $id) {
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
      documents {
        id
        vehicleId
        type
        expiryDate
        issuedDate
        provider
        createdAt
        updatedAt
      }
      mileageLogs {
        id
        vehicleId
        date
        odometer
        notes
        createdAt
      }
      leases {
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
      expenses {
        id
        vehicleId
        type
        amount
        date
        description
        createdAt
      }
    }
  }
`;

export const GET_EXPIRING_DOCUMENTS_QUERY = gql`
  query GetExpiringDocuments($daysAhead: Int!) {
    expiringDocuments(daysAhead: $daysAhead) {
      type
      count
    }
  }
`;

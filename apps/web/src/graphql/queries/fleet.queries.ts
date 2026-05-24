import { gql } from "@apollo/client";
import {
  VEHICLE_DETAIL_FRAGMENT,
  VEHICLE_SUMMARY_FRAGMENT,
} from "../fragments/fleet.fragments";

export const GET_VEHICLES_QUERY = gql`
  query GetVehicles($pagination: PaginationInput) {
    vehicles(pagination: $pagination) {
      items {
        ...VehicleSummaryFields
      }
      meta {
        total
        skip
        take
      }
    }
  }
  ${VEHICLE_SUMMARY_FRAGMENT}
`;

export const GET_VEHICLE_QUERY = gql`
  query GetVehicle($id: String!) {
    vehicle(id: $id) {
      ...VehicleDetailFields
    }
  }
  ${VEHICLE_DETAIL_FRAGMENT}
`;

export const GET_EXPIRING_DOCUMENTS_QUERY = gql`
  query GetExpiringDocuments($daysAhead: Int!) {
    expiringDocuments(daysAhead: $daysAhead) {
      type
      count
    }
  }
`;

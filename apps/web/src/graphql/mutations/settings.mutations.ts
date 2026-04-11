import { gql } from "@apollo/client";

export const GET_COMPANY_SETTINGS_QUERY = gql`
  query CompanySettings {
    companySettings {
      id
      companyName
      cui
      regCom
      address
      city
      country
      email
      phone
      bankName
      bankAccount
      defaultInvoiceSeries
      defaultCurrency
      defaultVatRate
      paymentTermsDays
      defaultAnnualLeaveDays
      defaultCountry
      updatedAt
    }
  }
`;

export const UPDATE_COMPANY_SETTINGS_MUTATION = gql`
  mutation UpdateCompanySettings($updateCompanySettingsInput: UpdateCompanySettingsInput!) {
    updateCompanySettings(updateCompanySettingsInput: $updateCompanySettingsInput) {
      id
      companyName
      cui
      regCom
      address
      city
      country
      email
      phone
      bankName
      bankAccount
      defaultInvoiceSeries
      defaultCurrency
      defaultVatRate
      paymentTermsDays
      defaultAnnualLeaveDays
      defaultCountry
      updatedAt
    }
  }
`;

export interface CompanySettings {
  companyName: string;
  cui: string;
  regCom: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  defaultInvoiceSeries: string;
  defaultCurrency: string;
  defaultVatRate: number;
  paymentTermsDays: number;
  defaultAnnualLeaveDays: number;
  defaultCountry: string;
  fleetExpiryThresholdItp: number;
  fleetExpiryThresholdRca: number;
  fleetExpiryThresholdCasco: number;
  fleetExpiryThresholdRovinieta: number;
  payrollTaxCasRate: number;
  payrollTaxCassRate: number;
  payrollTaxIncomeRate: number;
  payrollTaxCamRate: number;
  payrollPersonalDeduction: number;
  payrollTaxRuleVersion: string;
}

export interface CompanySettingsQueryResult {
  companySettings: CompanySettings;
}

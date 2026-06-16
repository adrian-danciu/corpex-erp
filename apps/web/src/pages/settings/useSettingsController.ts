import { useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import {
  GET_COMPANY_SETTINGS_QUERY,
  UPDATE_COMPANY_SETTINGS_MUTATION,
} from "@/graphql/mutations/settings.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import type {
  CompanySettings,
  CompanySettingsQueryResult,
} from "@/types/settings.types";

export type CompanySettingsFormValues = Pick<
  CompanySettings,
  | "companyName"
  | "cui"
  | "regCom"
  | "address"
  | "city"
  | "country"
  | "email"
  | "phone"
  | "bankName"
  | "bankAccount"
>;

export type InvoiceSettingsFormValues = Pick<
  CompanySettings,
  "defaultInvoiceSeries" | "defaultVatRate" | "paymentTermsDays"
>;

export type HrSettingsFormValues = Pick<
  CompanySettings,
  "defaultAnnualLeaveDays" | "defaultCountry"
>;

export type FleetSettingsFormValues = Pick<
  CompanySettings,
  | "fleetExpiryThresholdItp"
  | "fleetExpiryThresholdRca"
  | "fleetExpiryThresholdCasco"
  | "fleetExpiryThresholdRovinieta"
>;

export type PayrollSettingsFormValues = Pick<
  CompanySettings,
  | "payrollTaxCasRate"
  | "payrollTaxCassRate"
  | "payrollTaxIncomeRate"
  | "payrollTaxCamRate"
  | "payrollPersonalDeduction"
  | "payrollTaxRuleVersion"
>;

export function useSettingsController() {
  const { data, loading, error } = useQuery<CompanySettingsQueryResult>(
    GET_COMPANY_SETTINGS_QUERY,
  );

  const [updateSettings] = useMutationWithToast(
    UPDATE_COMPANY_SETTINGS_MUTATION,
    {
      refetchQueries: [{ query: GET_COMPANY_SETTINGS_QUERY }],
      successMessage: "Settings saved",
    },
  );

  const companyForm = useForm<CompanySettingsFormValues>();
  const invoiceForm = useForm<InvoiceSettingsFormValues>();
  const hrForm = useForm<HrSettingsFormValues>();
  const fleetForm = useForm<FleetSettingsFormValues>();
  const payrollForm = useForm<PayrollSettingsFormValues>();

  useEffect(() => {
    if (!data?.companySettings) return;

    const settings = data.companySettings;
    companyForm.reset({
      companyName: settings.companyName,
      cui: settings.cui,
      regCom: settings.regCom,
      address: settings.address,
      city: settings.city,
      country: settings.country,
      email: settings.email,
      phone: settings.phone,
      bankName: settings.bankName,
      bankAccount: settings.bankAccount,
    });
    invoiceForm.reset({
      defaultInvoiceSeries: settings.defaultInvoiceSeries,
      defaultVatRate: settings.defaultVatRate,
      paymentTermsDays: settings.paymentTermsDays,
    });
    hrForm.reset({
      defaultAnnualLeaveDays: settings.defaultAnnualLeaveDays,
      defaultCountry: settings.defaultCountry,
    });
    fleetForm.reset({
      fleetExpiryThresholdItp: settings.fleetExpiryThresholdItp,
      fleetExpiryThresholdRca: settings.fleetExpiryThresholdRca,
      fleetExpiryThresholdCasco: settings.fleetExpiryThresholdCasco,
      fleetExpiryThresholdRovinieta: settings.fleetExpiryThresholdRovinieta,
    });
    payrollForm.reset({
      payrollTaxCasRate: settings.payrollTaxCasRate,
      payrollTaxCassRate: settings.payrollTaxCassRate,
      payrollTaxIncomeRate: settings.payrollTaxIncomeRate,
      payrollTaxCamRate: settings.payrollTaxCamRate,
      payrollPersonalDeduction: settings.payrollPersonalDeduction,
      payrollTaxRuleVersion: settings.payrollTaxRuleVersion,
    });
  }, [data, companyForm, invoiceForm, hrForm, fleetForm, payrollForm]);

  const submit = async (values: Record<string, unknown>) => {
    try {
      await updateSettings({
        variables: { updateCompanySettingsInput: values },
      });
    } catch {
      // toast already shown
    }
  };

  const onCompanySubmit = (values: CompanySettingsFormValues) => submit(values);

  const onInvoiceSubmit = (values: InvoiceSettingsFormValues) =>
    submit({
      ...values,
      defaultVatRate: Number(values.defaultVatRate),
      paymentTermsDays: Number(values.paymentTermsDays),
    });

  const onHrSubmit = (values: HrSettingsFormValues) =>
    submit({
      ...values,
      defaultAnnualLeaveDays: Number(values.defaultAnnualLeaveDays),
    });

  const onFleetSubmit = (values: FleetSettingsFormValues) =>
    submit({
      fleetExpiryThresholdItp: Number(values.fleetExpiryThresholdItp),
      fleetExpiryThresholdRca: Number(values.fleetExpiryThresholdRca),
      fleetExpiryThresholdCasco: Number(values.fleetExpiryThresholdCasco),
      fleetExpiryThresholdRovinieta: Number(
        values.fleetExpiryThresholdRovinieta,
      ),
    });

  const onPayrollSubmit = (values: PayrollSettingsFormValues) =>
    submit({
      payrollTaxCasRate: Number(values.payrollTaxCasRate),
      payrollTaxCassRate: Number(values.payrollTaxCassRate),
      payrollTaxIncomeRate: Number(values.payrollTaxIncomeRate),
      payrollTaxCamRate: Number(values.payrollTaxCamRate),
      payrollPersonalDeduction: Number(values.payrollPersonalDeduction),
      payrollTaxRuleVersion: values.payrollTaxRuleVersion,
    });

  return {
    companyForm,
    error,
    fleetForm,
    hrForm,
    invoiceForm,
    loading,
    onCompanySubmit,
    onFleetSubmit,
    onHrSubmit,
    onInvoiceSubmit,
    onPayrollSubmit,
    payrollForm,
  };
}

export type SettingsController = ReturnType<typeof useSettingsController>;

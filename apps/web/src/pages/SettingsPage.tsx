import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@apollo/client/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Building2,
  Receipt,
  Users,
  Save,
  AlertCircle,
  Car,
  WalletCards,
} from "lucide-react";
import {
  GET_COMPANY_SETTINGS_QUERY,
  UPDATE_COMPANY_SETTINGS_MUTATION,
} from "@/graphql/mutations/settings.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";

interface CompanySettingsData {
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

export default function SettingsPage() {
  const { data, loading, error } = useQuery<{ companySettings: CompanySettingsData }>(
    GET_COMPANY_SETTINGS_QUERY,
  );

  const [updateSettings] = useMutationWithToast(
    UPDATE_COMPANY_SETTINGS_MUTATION,
    {
      refetchQueries: [{ query: GET_COMPANY_SETTINGS_QUERY }],
      successMessage: "Settings saved",
    },
  );

  const {
    register: regCompany,
    handleSubmit: submitCompany,
    reset: resetCompany,
  } = useForm<Pick<CompanySettingsData, "companyName" | "cui" | "regCom" | "address" | "city" | "country" | "email" | "phone" | "bankName" | "bankAccount">>();

  const {
    register: regInvoice,
    handleSubmit: submitInvoice,
    reset: resetInvoice,
  } = useForm<Pick<CompanySettingsData, "defaultInvoiceSeries" | "defaultVatRate" | "paymentTermsDays">>();

  const {
    register: regHr,
    handleSubmit: submitHr,
    reset: resetHr,
  } = useForm<Pick<CompanySettingsData, "defaultAnnualLeaveDays" | "defaultCountry">>();

  const {
    register: regFleet,
    handleSubmit: submitFleet,
    reset: resetFleet,
  } = useForm<Pick<CompanySettingsData, "fleetExpiryThresholdItp" | "fleetExpiryThresholdRca" | "fleetExpiryThresholdCasco" | "fleetExpiryThresholdRovinieta">>();

  const {
    register: regPayroll,
    handleSubmit: submitPayroll,
    reset: resetPayroll,
  } = useForm<Pick<CompanySettingsData, "payrollTaxCasRate" | "payrollTaxCassRate" | "payrollTaxIncomeRate" | "payrollTaxCamRate" | "payrollPersonalDeduction" | "payrollTaxRuleVersion">>();

  useEffect(() => {
    if (data?.companySettings) {
      const s = data.companySettings;
      resetCompany({
        companyName: s.companyName,
        cui: s.cui,
        regCom: s.regCom,
        address: s.address,
        city: s.city,
        country: s.country,
        email: s.email,
        phone: s.phone,
        bankName: s.bankName,
        bankAccount: s.bankAccount,
      });
      resetInvoice({
        defaultInvoiceSeries: s.defaultInvoiceSeries,
        defaultVatRate: s.defaultVatRate,
        paymentTermsDays: s.paymentTermsDays,
      });
      resetHr({
        defaultAnnualLeaveDays: s.defaultAnnualLeaveDays,
        defaultCountry: s.defaultCountry,
      });
      resetFleet({
        fleetExpiryThresholdItp: s.fleetExpiryThresholdItp,
        fleetExpiryThresholdRca: s.fleetExpiryThresholdRca,
        fleetExpiryThresholdCasco: s.fleetExpiryThresholdCasco,
        fleetExpiryThresholdRovinieta: s.fleetExpiryThresholdRovinieta,
      });
      resetPayroll({
        payrollTaxCasRate: s.payrollTaxCasRate,
        payrollTaxCassRate: s.payrollTaxCassRate,
        payrollTaxIncomeRate: s.payrollTaxIncomeRate,
        payrollTaxCamRate: s.payrollTaxCamRate,
        payrollPersonalDeduction: s.payrollPersonalDeduction,
        payrollTaxRuleVersion: s.payrollTaxRuleVersion,
      });
    }
  }, [data, resetCompany, resetInvoice, resetHr, resetFleet, resetPayroll]);

  const submit = async (values: Record<string, unknown>) => {
    try {
      await updateSettings({
        variables: { updateCompanySettingsInput: values },
      });
    } catch {
      // toast already shown
    }
  };

  const onCompanySubmit = (values: Record<string, unknown>) => submit(values);

  const onInvoiceSubmit = (values: Record<string, unknown>) =>
    submit({
      ...values,
      defaultVatRate: Number(values.defaultVatRate),
      paymentTermsDays: Number(values.paymentTermsDays),
    });

  const onHrSubmit = (values: Record<string, unknown>) =>
    submit({
      ...values,
      defaultAnnualLeaveDays: Number(values.defaultAnnualLeaveDays),
    });

  const onFleetSubmit = (values: Record<string, unknown>) =>
    submit({
      fleetExpiryThresholdItp: Number(values.fleetExpiryThresholdItp),
      fleetExpiryThresholdRca: Number(values.fleetExpiryThresholdRca),
      fleetExpiryThresholdCasco: Number(values.fleetExpiryThresholdCasco),
      fleetExpiryThresholdRovinieta: Number(
        values.fleetExpiryThresholdRovinieta,
      ),
    });

  const onPayrollSubmit = (values: Record<string, unknown>) =>
    submit({
      payrollTaxCasRate: Number(values.payrollTaxCasRate),
      payrollTaxCassRate: Number(values.payrollTaxCassRate),
      payrollTaxIncomeRate: Number(values.payrollTaxIncomeRate),
      payrollTaxCamRate: Number(values.payrollTaxCamRate),
      payrollPersonalDeduction: Number(values.payrollPersonalDeduction),
      payrollTaxRuleVersion: values.payrollTaxRuleVersion,
    });

  if (loading) return <PageLoading message="Loading settings..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your company and application settings
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="invoice" className="gap-2">
            <Receipt className="h-4 w-4" />
            Invoicing
          </TabsTrigger>
          <TabsTrigger value="hr" className="gap-2">
            <Users className="h-4 w-4" />
            HR
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <WalletCards className="h-4 w-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-2">
            <Car className="h-4 w-4" />
            Fleet alerts
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <form onSubmit={submitCompany(onCompanySubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Your company details used across invoices, documents, and reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="SC Corpex SRL" {...regCompany("companyName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cui">CUI (Tax ID)</Label>
                    <Input id="cui" placeholder="RO12345678" {...regCompany("cui")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regCom">Reg. Com.</Label>
                    <Input id="regCom" placeholder="J40/1234/2024" {...regCompany("regCom")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input id="companyEmail" type="email" placeholder="office@company.com" {...regCompany("email")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input id="companyPhone" placeholder="+40 XXX XXX XXX" {...regCompany("phone")} />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="Str. Exemplu nr. 1" {...regCompany("address")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Bucharest" {...regCompany("city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="Romania" {...regCompany("country")} />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" placeholder="Banca Transilvania" {...regCompany("bankName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account (IBAN)</Label>
                    <Input id="bankAccount" placeholder="RO49AAAA1B31007593840000" {...regCompany("bankAccount")} />
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Company Settings
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Invoice Settings */}{/* */}
        <TabsContent value="invoice">
          <form onSubmit={submitInvoice(onInvoiceSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Invoice Defaults</CardTitle>
                <CardDescription>
                  Default values applied when creating new invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultInvoiceSeries">Default Invoice Series</Label>
                    <Input id="defaultInvoiceSeries" placeholder="CORP" {...regInvoice("defaultInvoiceSeries")} />
                    <p className="text-xs text-muted-foreground">
                      The prefix used for invoice numbering (e.g. CORP-0001)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultVatRate">Default VAT Rate (%)</Label>
                    <Input id="defaultVatRate" type="number" placeholder="19" {...regInvoice("defaultVatRate", { valueAsNumber: true })} />
                    <p className="text-xs text-muted-foreground">
                      Standard VAT rate applied to invoice line items
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTermsDays">Payment Terms (days)</Label>
                    <Input id="paymentTermsDays" type="number" placeholder="30" {...regInvoice("paymentTermsDays", { valueAsNumber: true })} />
                    <p className="text-xs text-muted-foreground">
                      Default number of days until invoice due date
                    </p>
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Invoice Settings
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* HR Settings */}
        <TabsContent value="hr">
          <form onSubmit={submitHr(onHrSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>HR Defaults</CardTitle>
                <CardDescription>
                  Default values applied when creating new employee records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultAnnualLeaveDays">Annual Leave Days</Label>
                    <Input
                      id="defaultAnnualLeaveDays"
                      type="number"
                      placeholder="21"
                      {...regHr("defaultAnnualLeaveDays", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default annual leave allocation for new employees
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultCountry">Default Country</Label>
                    <Input id="defaultCountry" placeholder="Romania" {...regHr("defaultCountry")} />
                    <p className="text-xs text-muted-foreground">
                      Default country for new employee addresses
                    </p>
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save HR Settings
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="payroll">
          <form onSubmit={submitPayroll(onPayrollSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Payroll Tax Rules</CardTitle>
                <CardDescription>
                  Romanian payroll defaults used when generating new payroll periods. Existing payrolls keep the rates saved on each line.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="payrollTaxCasRate">CAS pension (%)</Label>
                    <Input id="payrollTaxCasRate" type="number" step="0.01" min="0" {...regPayroll("payrollTaxCasRate", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payrollTaxCassRate">CASS health (%)</Label>
                    <Input id="payrollTaxCassRate" type="number" step="0.01" min="0" {...regPayroll("payrollTaxCassRate", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payrollTaxIncomeRate">Income tax (%)</Label>
                    <Input id="payrollTaxIncomeRate" type="number" step="0.01" min="0" {...regPayroll("payrollTaxIncomeRate", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payrollTaxCamRate">CAM employer (%)</Label>
                    <Input id="payrollTaxCamRate" type="number" step="0.01" min="0" {...regPayroll("payrollTaxCamRate", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payrollPersonalDeduction">Personal deduction (EUR)</Label>
                    <Input id="payrollPersonalDeduction" type="number" step="0.01" min="0" {...regPayroll("payrollPersonalDeduction", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payrollTaxRuleVersion">Rule version</Label>
                    <Input id="payrollTaxRuleVersion" placeholder="RO_2026_STANDARD" {...regPayroll("payrollTaxRuleVersion")} />
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Payroll Rules
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Fleet expiry alert thresholds */}
        <TabsContent value="fleet">
          <form onSubmit={submitFleet(onFleetSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Fleet Document Expiry Alerts</CardTitle>
                <CardDescription>
                  Number of days before a vehicle document's expiry that a
                  notification is sent to fleet & management users. The daily
                  scan picks up the latest values.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fleetExpiryThresholdItp">ITP (days)</Label>
                    <Input
                      id="fleetExpiryThresholdItp"
                      type="number"
                      min="1"
                      placeholder="30"
                      {...regFleet("fleetExpiryThresholdItp", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fleetExpiryThresholdRca">RCA (days)</Label>
                    <Input
                      id="fleetExpiryThresholdRca"
                      type="number"
                      min="1"
                      placeholder="30"
                      {...regFleet("fleetExpiryThresholdRca", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fleetExpiryThresholdCasco">
                      CASCO (days)
                    </Label>
                    <Input
                      id="fleetExpiryThresholdCasco"
                      type="number"
                      min="1"
                      placeholder="30"
                      {...regFleet("fleetExpiryThresholdCasco", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fleetExpiryThresholdRovinieta">
                      Rovinietă (days)
                    </Label>
                    <Input
                      id="fleetExpiryThresholdRovinieta"
                      type="number"
                      min="1"
                      placeholder="7"
                      {...regFleet("fleetExpiryThresholdRovinieta", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Fleet Alert Settings
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@apollo/client/react";
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
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  GET_COMPANY_SETTINGS_QUERY,
  UPDATE_COMPANY_SETTINGS_MUTATION,
} from "@/graphql/mutations/settings.mutations";

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
  defaultCurrency: string;
  defaultVatRate: number;
  paymentTermsDays: number;
  defaultAnnualLeaveDays: number;
  defaultCountry: string;
}

export default function SettingsPage() {
  const { data, loading, error } = useQuery<{ companySettings: CompanySettingsData }>(
    GET_COMPANY_SETTINGS_QUERY,
  );

  const [updateSettings] = useMutation(UPDATE_COMPANY_SETTINGS_MUTATION, {
    refetchQueries: [{ query: GET_COMPANY_SETTINGS_QUERY }],
  });

  // Success states
  const [companySuccess, setCompanySuccess] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [hrSuccess, setHrSuccess] = useState(false);

  // Company form
  const {
    register: regCompany,
    handleSubmit: submitCompany,
    reset: resetCompany,
  } = useForm<Pick<CompanySettingsData, "companyName" | "cui" | "regCom" | "address" | "city" | "country" | "email" | "phone" | "bankName" | "bankAccount">>();

  // Invoice form
  const {
    register: regInvoice,
    handleSubmit: submitInvoice,
    reset: resetInvoice,
  } = useForm<Pick<CompanySettingsData, "defaultInvoiceSeries" | "defaultCurrency" | "defaultVatRate" | "paymentTermsDays">>();

  // HR form
  const {
    register: regHr,
    handleSubmit: submitHr,
    reset: resetHr,
  } = useForm<Pick<CompanySettingsData, "defaultAnnualLeaveDays" | "defaultCountry">>();

  // Populate forms when data loads
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
        defaultCurrency: s.defaultCurrency,
        defaultVatRate: s.defaultVatRate,
        paymentTermsDays: s.paymentTermsDays,
      });
      resetHr({
        defaultAnnualLeaveDays: s.defaultAnnualLeaveDays,
        defaultCountry: s.defaultCountry,
      });
    }
  }, [data, resetCompany, resetInvoice, resetHr]);

  const showSuccess = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 3000);
  };

  const onCompanySubmit = async (values: Record<string, unknown>) => {
    await updateSettings({ variables: { updateCompanySettingsInput: values } });
    showSuccess(setCompanySuccess);
  };

  const onInvoiceSubmit = async (values: Record<string, unknown>) => {
    await updateSettings({
      variables: {
        updateCompanySettingsInput: {
          ...values,
          defaultVatRate: Number(values.defaultVatRate),
          paymentTermsDays: Number(values.paymentTermsDays),
        },
      },
    });
    showSuccess(setInvoiceSuccess);
  };

  const onHrSubmit = async (values: Record<string, unknown>) => {
    await updateSettings({
      variables: {
        updateCompanySettingsInput: {
          ...values,
          defaultAnnualLeaveDays: Number(values.defaultAnnualLeaveDays),
        },
      },
    });
    showSuccess(setHrSuccess);
  };

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

                <div className="flex items-center gap-3">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Save Company Settings
                  </Button>
                  {companySuccess && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Saved successfully
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Invoice Settings */}
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
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Input id="defaultCurrency" placeholder="RON" {...regInvoice("defaultCurrency")} />
                    <p className="text-xs text-muted-foreground">
                      ISO currency code used for new invoices
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

                <div className="flex items-center gap-3">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Save Invoice Settings
                  </Button>
                  {invoiceSuccess && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Saved successfully
                    </span>
                  )}
                </div>
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

                <div className="flex items-center gap-3">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Save HR Settings
                  </Button>
                  {hrSuccess && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Saved successfully
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

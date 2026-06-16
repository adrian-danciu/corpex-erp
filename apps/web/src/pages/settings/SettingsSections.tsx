import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SettingsController } from "./useSettingsController";

type ControllerForm<K extends keyof SettingsController> =
  SettingsController[K];

interface CompanySettingsSectionProps {
  form: ControllerForm<"companyForm">;
  onSubmit: SettingsController["onCompanySubmit"];
}

export function CompanySettingsSection({
  form,
  onSubmit,
}: CompanySettingsSectionProps) {
  const { register, handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
              <Input
                id="companyName"
                placeholder="SC Corpex SRL"
                {...register("companyName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cui">CUI (Tax ID)</Label>
              <Input id="cui" placeholder="RO12345678" {...register("cui")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regCom">Reg. Com.</Label>
              <Input
                id="regCom"
                placeholder="J40/1234/2024"
                {...register("regCom")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="office@company.com"
                {...register("email")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                placeholder="+40 XXX XXX XXX"
                {...register("phone")}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Str. Exemplu nr. 1"
                {...register("address")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Bucharest" {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="Romania"
                {...register("country")}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="Banca Transilvania"
                {...register("bankName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account (IBAN)</Label>
              <Input
                id="bankAccount"
                placeholder="RO49AAAA1B31007593840000"
                {...register("bankAccount")}
              />
            </div>
          </div>

          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Company Settings
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

interface InvoiceSettingsSectionProps {
  form: ControllerForm<"invoiceForm">;
  onSubmit: SettingsController["onInvoiceSubmit"];
}

export function InvoiceSettingsSection({
  form,
  onSubmit,
}: InvoiceSettingsSectionProps) {
  const { register, handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
              <Label htmlFor="defaultInvoiceSeries">
                Default Invoice Series
              </Label>
              <Input
                id="defaultInvoiceSeries"
                placeholder="CORP"
                {...register("defaultInvoiceSeries")}
              />
              <p className="text-xs text-muted-foreground">
                The prefix used for invoice numbering (e.g. CORP-0001)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultVatRate">Default VAT Rate (%)</Label>
              <Input
                id="defaultVatRate"
                type="number"
                placeholder="19"
                {...register("defaultVatRate", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Standard VAT rate applied to invoice line items
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTermsDays">Payment Terms (days)</Label>
              <Input
                id="paymentTermsDays"
                type="number"
                placeholder="30"
                {...register("paymentTermsDays", { valueAsNumber: true })}
              />
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
  );
}

interface HrSettingsSectionProps {
  form: ControllerForm<"hrForm">;
  onSubmit: SettingsController["onHrSubmit"];
}

export function HrSettingsSection({ form, onSubmit }: HrSettingsSectionProps) {
  const { register, handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
                {...register("defaultAnnualLeaveDays", {
                  valueAsNumber: true,
                })}
              />
              <p className="text-xs text-muted-foreground">
                Default annual leave allocation for new employees
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCountry">Default Country</Label>
              <Input
                id="defaultCountry"
                placeholder="Romania"
                {...register("defaultCountry")}
              />
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
  );
}

interface PayrollSettingsSectionProps {
  form: ControllerForm<"payrollForm">;
  onSubmit: SettingsController["onPayrollSubmit"];
}

export function PayrollSettingsSection({
  form,
  onSubmit,
}: PayrollSettingsSectionProps) {
  const { register, handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Payroll Tax Rules</CardTitle>
          <CardDescription>
            Romanian payroll defaults used when generating new payroll periods.
            Existing payrolls keep the rates saved on each line.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="payrollTaxCasRate">CAS pension (%)</Label>
              <Input
                id="payrollTaxCasRate"
                type="number"
                step="0.01"
                min="0"
                {...register("payrollTaxCasRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payrollTaxCassRate">CASS health (%)</Label>
              <Input
                id="payrollTaxCassRate"
                type="number"
                step="0.01"
                min="0"
                {...register("payrollTaxCassRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payrollTaxIncomeRate">Income tax (%)</Label>
              <Input
                id="payrollTaxIncomeRate"
                type="number"
                step="0.01"
                min="0"
                {...register("payrollTaxIncomeRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payrollTaxCamRate">CAM employer (%)</Label>
              <Input
                id="payrollTaxCamRate"
                type="number"
                step="0.01"
                min="0"
                {...register("payrollTaxCamRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payrollPersonalDeduction">
                Personal deduction (EUR)
              </Label>
              <Input
                id="payrollPersonalDeduction"
                type="number"
                step="0.01"
                min="0"
                {...register("payrollPersonalDeduction", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payrollTaxRuleVersion">Rule version</Label>
              <Input
                id="payrollTaxRuleVersion"
                placeholder="RO_2026_STANDARD"
                {...register("payrollTaxRuleVersion")}
              />
            </div>
          </div>

          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Payroll Rules
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

interface FleetSettingsSectionProps {
  form: ControllerForm<"fleetForm">;
  onSubmit: SettingsController["onFleetSubmit"];
}

export function FleetSettingsSection({
  form,
  onSubmit,
}: FleetSettingsSectionProps) {
  const { register, handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Fleet Document Expiry Alerts</CardTitle>
          <CardDescription>
            Number of days before a vehicle document's expiry that a
            notification is sent to fleet & management users. The daily scan
            picks up the latest values.
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
                {...register("fleetExpiryThresholdItp", {
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
                {...register("fleetExpiryThresholdRca", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fleetExpiryThresholdCasco">CASCO (days)</Label>
              <Input
                id="fleetExpiryThresholdCasco"
                type="number"
                min="1"
                placeholder="30"
                {...register("fleetExpiryThresholdCasco", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fleetExpiryThresholdRovinieta">
                Rovinieta (days)
              </Label>
              <Input
                id="fleetExpiryThresholdRovinieta"
                type="number"
                min="1"
                placeholder="7"
                {...register("fleetExpiryThresholdRovinieta", {
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
  );
}

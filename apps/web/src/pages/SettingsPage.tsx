import { useState } from "react";
import {
  Building2,
  Car,
  Receipt,
  Users,
  WalletCards,
} from "lucide-react";
import { InlineError } from "@/components/common/InlineError";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CompanySettingsSection,
  FleetSettingsSection,
  HrSettingsSection,
  InvoiceSettingsSection,
  PayrollSettingsSection,
} from "./settings/SettingsSections";
import { useSettingsController } from "./settings/useSettingsController";

const SETTINGS_TABS = [
  { value: "company", label: "Company", icon: Building2 },
  { value: "invoice", label: "Invoicing", icon: Receipt },
  { value: "hr", label: "HR", icon: Users },
  { value: "payroll", label: "Payroll", icon: WalletCards },
  { value: "fleet", label: "Fleet alerts", icon: Car },
] as const;

type SettingsTabValue = (typeof SETTINGS_TABS)[number]["value"];

export default function SettingsPage() {
  const settings = useSettingsController();
  const [activeTab, setActiveTab] = useState<SettingsTabValue>("company");

  if (settings.loading) return <PageLoading message="Loading settings..." />;

  if (settings.error) {
    return (
      <div className="py-24">
        <InlineError>Failed to load settings</InlineError>
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

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SettingsTabValue)}
        className="space-y-6"
      >
        <div className="md:hidden">
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as SettingsTabValue)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select settings section" />
            </SelectTrigger>
            <SelectContent>
              {SETTINGS_TABS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsList className="hidden md:flex">
          {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="company">
          <CompanySettingsSection
            form={settings.companyForm}
            onSubmit={settings.onCompanySubmit}
          />
        </TabsContent>

        <TabsContent value="invoice">
          <InvoiceSettingsSection
            form={settings.invoiceForm}
            onSubmit={settings.onInvoiceSubmit}
          />
        </TabsContent>

        <TabsContent value="hr">
          <HrSettingsSection
            form={settings.hrForm}
            onSubmit={settings.onHrSubmit}
          />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollSettingsSection
            form={settings.payrollForm}
            onSubmit={settings.onPayrollSubmit}
          />
        </TabsContent>

        <TabsContent value="fleet">
          <FleetSettingsSection
            form={settings.fleetForm}
            onSubmit={settings.onFleetSubmit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

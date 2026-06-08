import { Controller } from "react-hook-form";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceCreateController } from "./useInvoiceCreateController";

type ClientProjectSectionProps = Pick<
  InvoiceCreateController,
  | "form"
  | "partners"
  | "partnersLoading"
  | "projects"
  | "selectPartner"
  | "selectedProjectId"
  | "importingCosts"
  | "importCostsFromProject"
>;

export function ClientProjectSection({
  form,
  partners,
  partnersLoading,
  projects,
  selectPartner,
  selectedProjectId,
  importingCosts,
  importCostsFromProject,
}: ClientProjectSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Client & Project</CardTitle>
        {selectedProjectId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={importCostsFromProject}
            disabled={importingCosts}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {importingCosts ? "Importing..." : "Import costs from project"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Client *</Label>
          <Controller
            name="partnerId"
            control={form.control}
            render={({ field }) => (
              <Select
                onValueChange={selectPartner}
                value={field.value}
                disabled={partnersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      partnersLoading ? "Loading clients..." : "Select a client"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} ({partner.cui})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.partnerId && (
            <p className="text-sm text-red-600">
              {form.formState.errors.partnerId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Linked project (optional)</Label>
          <Controller
            name="projectId"
            control={form.control}
            render={({ field }) => (
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "__none__" ? "" : value)
                }
                value={field.value || "__none__"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} — {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {selectedProjectId && (
            <p className="text-xs text-slate-500">
              Partner is auto-set from the project. Importing costs populates
              line items from issued materials, delivered services, and tagged
              vehicle expenses.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

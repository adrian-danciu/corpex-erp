import { Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceCreateController } from "./useInvoiceCreateController";

type InvoiceDetailsSectionProps = Pick<
  InvoiceCreateController,
  "form"
>;

export function InvoiceDetailsSection({
  form,
}: InvoiceDetailsSectionProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="series">Series</Label>
            <Input id="series" {...register("series")} />
            {errors.series && (
              <p className="text-sm text-red-600">{errors.series.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceType">Invoice Type *</Label>
            <Controller
              name="invoiceType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FISCAL">Fiscal Invoice</SelectItem>
                    <SelectItem value="PROFORMA">Proforma Invoice</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.invoiceType && (
              <p className="text-sm text-red-600">
                {errors.invoiceType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value="EUR" disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date *</Label>
            <Input id="issueDate" type="date" {...register("issueDate")} />
            {errors.issueDate && (
              <p className="text-sm text-red-600">{errors.issueDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate && (
              <p className="text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Delivery Date</Label>
            <Input
              id="deliveryDate"
              type="date"
              {...register("deliveryDate")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("notes")}
            placeholder="Additional notes for this invoice..."
            rows={3}
          />
        </CardContent>
      </Card>
    </>
  );
}

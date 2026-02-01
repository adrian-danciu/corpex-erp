import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPartnerSchema, type CreatePartnerFormData } from "@/lib/schemas/partner.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Partner } from "@/types/finance.types";

interface PartnerFormProps {
  defaultValues?: Partial<Partner>;
  onSubmit: (data: CreatePartnerFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function PartnerForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Create Partner",
}: PartnerFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreatePartnerFormData>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      cui: defaultValues?.cui ?? "",
      regCom: defaultValues?.regCom ?? "",
      address: defaultValues?.address ?? "",
      city: defaultValues?.city ?? "",
      country: defaultValues?.country ?? "Romania",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      contactPerson: defaultValues?.contactPerson ?? "",
      partnerType: defaultValues?.partnerType ?? undefined,
      bankName: defaultValues?.bankName ?? "",
      bankAccount: defaultValues?.bankAccount ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input id="name" {...register("name")} placeholder="SC Example SRL" />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partnerType">Partner Type *</Label>
            <Controller
              name="partnerType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="SUPPLIER">Supplier</SelectItem>
                    <SelectItem value="BOTH">Client & Supplier</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.partnerType && (
              <p className="text-sm text-red-600">{errors.partnerType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cui">CUI / CIF *</Label>
            <Input id="cui" {...register("cui")} placeholder="RO12345678" />
            {errors.cui && (
              <p className="text-sm text-red-600">{errors.cui.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="regCom">Reg. Com. (J-number)</Label>
            <Input id="regCom" {...register("regCom")} placeholder="J40/1234/2020" />
            {errors.regCom && (
              <p className="text-sm text-red-600">{errors.regCom.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address *</Label>
            <Input id="address" {...register("address")} placeholder="Street, number, building" />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input id="city" {...register("city")} placeholder="Bucharest" />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} placeholder="Romania" />
            {errors.country && (
              <p className="text-sm text-red-600">{errors.country.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input id="contactPerson" {...register("contactPerson")} placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="contact@example.com" />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} placeholder="+40 721 234 567" />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input id="bankName" {...register("bankName")} placeholder="BCR, BRD, ING..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccount">IBAN</Label>
            <Input id="bankAccount" {...register("bankAccount")} placeholder="RO49AAAA1B31007593840000" />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("notes")}
            placeholder="Any additional notes about this partner..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

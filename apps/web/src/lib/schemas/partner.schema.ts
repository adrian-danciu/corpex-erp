import { z } from "zod";

export const PartnerTypeEnum = {
  CLIENT: "CLIENT",
  SUPPLIER: "SUPPLIER",
  BOTH: "BOTH",
} as const;

export type PartnerTypeValue = (typeof PartnerTypeEnum)[keyof typeof PartnerTypeEnum];

export const createPartnerSchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name is too long"),

  cui: z
    .string()
    .min(1, "CUI is required")
    .regex(/^(RO)?[0-9]{2,10}$/, "Invalid CUI format (e.g. RO12345678 or 12345678)"),

  regCom: z
    .string()
    .regex(/^J[0-9]{1,2}\/[0-9]+\/[0-9]{4}$/, "Invalid format (e.g. J40/1234/2020)")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address is too long"),

  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City is too long"),

  country: z
    .string()
    .max(100, "Country is too long")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),

  contactPerson: z
    .string()
    .max(100, "Contact person name is too long")
    .optional()
    .or(z.literal("")),

  partnerType: z.enum([PartnerTypeEnum.CLIENT, PartnerTypeEnum.SUPPLIER, PartnerTypeEnum.BOTH], {
    message: "Partner type is required",
  }),

  isActive: z.boolean().optional(),

  bankName: z
    .string()
    .max(100, "Bank name is too long")
    .optional()
    .or(z.literal("")),

  bankAccount: z
    .string()
    .max(34, "IBAN is too long")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .max(1000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export type CreatePartnerFormData = z.infer<typeof createPartnerSchema>;

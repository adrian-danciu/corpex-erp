import { z } from "zod";

export const FuelTypeEnum = {
  DIESEL: "DIESEL",
  PETROL: "PETROL",
  ELECTRIC: "ELECTRIC",
  HYBRID: "HYBRID",
} as const;

export const VehicleStatusEnum = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  MAINTENANCE: "MAINTENANCE",
} as const;

export const DocumentTypeEnum = {
  ITP: "ITP",
  RCA: "RCA",
  CASCO: "CASCO",
  ROVINIETA: "ROVINIETA",
} as const;

export const ExpenseTypeEnum = {
  FUEL: "FUEL",
  REPAIR: "REPAIR",
  OTHER: "OTHER",
} as const;

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required").max(20),
  chassisNumber: z.string().min(1, "Chassis number is required").max(50),
  brand: z.string().min(1, "Brand is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  fuelType: z.enum([
    FuelTypeEnum.DIESEL,
    FuelTypeEnum.PETROL,
    FuelTypeEnum.ELECTRIC,
    FuelTypeEnum.HYBRID,
  ]),
});

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z
    .enum([
      VehicleStatusEnum.ACTIVE,
      VehicleStatusEnum.INACTIVE,
      VehicleStatusEnum.MAINTENANCE,
    ])
    .optional(),
});

export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;

export const createVehicleDocumentSchema = z.object({
  type: z.enum([
    DocumentTypeEnum.ITP,
    DocumentTypeEnum.RCA,
    DocumentTypeEnum.CASCO,
    DocumentTypeEnum.ROVINIETA,
  ]),
  expiryDate: z.string().min(1, "Expiry date is required"),
  issuedDate: z.string().optional().or(z.literal("")),
  provider: z.string().max(200).optional().or(z.literal("")),
});

export type CreateVehicleDocumentFormData = z.infer<typeof createVehicleDocumentSchema>;

export const updateVehicleDocumentSchema = z.object({
  expiryDate: z.string().optional(),
  issuedDate: z.string().optional().or(z.literal("")),
  provider: z.string().max(200).optional().or(z.literal("")),
});

export type UpdateVehicleDocumentFormData = z.infer<typeof updateVehicleDocumentSchema>;

export const createMileageLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  odometer: z.number().int().min(0, "Odometer must be a positive number"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type CreateMileageLogFormData = z.infer<typeof createMileageLogSchema>;

export const createVehicleLeaseSchema = z.object({
  provider: z.string().min(1, "Provider is required").max(200),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  monthlyRate: z.number().positive("Monthly rate must be positive"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type CreateVehicleLeaseFormData = z.infer<typeof createVehicleLeaseSchema>;

export const updateVehicleLeaseSchema = createVehicleLeaseSchema.partial();
export type UpdateVehicleLeaseFormData = z.infer<typeof updateVehicleLeaseSchema>;

export const createVehicleExpenseSchema = z.object({
  type: z.enum([
    ExpenseTypeEnum.FUEL,
    ExpenseTypeEnum.REPAIR,
    ExpenseTypeEnum.OTHER,
  ]),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type CreateVehicleExpenseFormData = z.infer<typeof createVehicleExpenseSchema>;

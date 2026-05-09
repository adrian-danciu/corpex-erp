import { z } from "zod";
import {
  ProjectMemberRole,
  ProjectTaskPriority,
} from "@/types/project.types";

export const createProjectSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code must be 20 characters or less")
    .regex(/^[A-Z0-9-]+$/i, "Letters, digits, and hyphens only"),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  partnerId: z.string().min(1, "Client is required"),
  budget: z.number().min(0, "Budget cannot be negative").optional(),
  currency: z.string().optional(),
  plannedStartDate: z.string().optional().or(z.literal("")),
  plannedEndDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal("")),
  budget: z.number().min(0).optional(),
  currency: z.string().optional(),
  plannedStartDate: z.string().optional().or(z.literal("")),
  plannedEndDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

export const requestMaterialSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  requestedQty: z.number().positive("Quantity must be greater than zero"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type RequestMaterialFormData = z.infer<typeof requestMaterialSchema>;

export const issueMaterialSchema = z.object({
  qty: z.number().positive("Quantity must be greater than zero"),
  unitCost: z.number().min(0).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type IssueMaterialFormData = z.infer<typeof issueMaterialSchema>;

export const assignVehicleSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type AssignVehicleFormData = z.infer<typeof assignVehicleSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  priority: z
    .enum([
      ProjectTaskPriority.LOW,
      ProjectTaskPriority.MEDIUM,
      ProjectTaskPriority.HIGH,
    ])
    .optional(),
  dueDate: z.string().optional().or(z.literal("")),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z
    .enum([ProjectMemberRole.PROJECT_MANAGER, ProjectMemberRole.MEMBER])
    .optional(),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(4000, "Post cannot exceed 4000 characters"),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;

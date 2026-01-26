import { z } from "zod";

/**
 * User roles enum
 * Defines the access levels for different user types
 * IMPORTANT: Must match backend GraphQL enum values (uppercase)
 */
export const UserRole = {
  USER: "USER",
  MANAGER: "MANAGER",
  FINANCE: "FINANCE",
  ADMIN: "ADMIN",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/**
 * User creation form validation schema
 * Used by IT department to create new user accounts
 */
export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long")
    .regex(/^[a-zA-Z\s-]+$/, "First name can only contain letters, spaces, and hyphens"),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long")
    .regex(/^[a-zA-Z\s-]+$/, "Last name can only contain letters, spaces, and hyphens"),

  role: z.enum([UserRole.USER, UserRole.MANAGER, UserRole.FINANCE, UserRole.ADMIN], {
    required_error: "Role is required",
    invalid_type_error: "Invalid role selected",
  }),
});

/**
 * Type inference from create user schema
 */
export type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * Complete user data including auto-generated fields
 * This is what gets sent to the backend
 */
export type UserCreationData = CreateUserFormData & {
  id: string;
  email: string;
  password: string;
};

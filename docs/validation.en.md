# Validation with Zod (English)

This project uses Zod schemas for frontend validation, integrated with React Hook Form via `@hookform/resolvers/zod`.

## Where schemas live
- Central exports: `apps/web/src/lib/schemas/index.ts`
- Auth schemas: `apps/web/src/lib/schemas/auth.schema.ts`

## Current schemas
Defined in `apps/web/src/lib/schemas/auth.schema.ts`:
- `loginSchema` -> `LoginFormData`
- `passwordResetRequestSchema` -> `PasswordResetRequestData` (future)
- `passwordResetSchema` -> `PasswordResetData` (future, includes password confirmation)

## How validation is wired
Example from `apps/web/src/components/auth/LoginForm.tsx`:
1) Import schema and inferred type:
   - `import { loginSchema, type LoginFormData } from "@/lib/schemas";`
2) Pass schema to React Hook Form via resolver:
   - `useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })`
3) Read validation errors from `formState.errors` and display messages.

## Error messages and UI
- Zod error messages are defined in the schema (e.g., `"Email is required"`).
- React Hook Form exposes them on `errors.<field>.message`.
- The UI uses conditional classes and inline text to show errors.

## Adding a new schema (pattern)
1) Create a file in `apps/web/src/lib/schemas/` (e.g., `user.schema.ts`).
2) Export the schema and inferred TypeScript type:
   - `export const userSchema = z.object({ ... })`
   - `export type UserFormData = z.infer<typeof userSchema>`
3) Re-export from `apps/web/src/lib/schemas/index.ts`.
4) In the form, use `zodResolver(userSchema)` and the inferred type in `useForm<...>()`.

## Notes for AI agents
- Only the login schema is currently used in UI code.
- Password reset schemas are defined but not yet hooked into components.

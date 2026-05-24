# Validation with Zod (English)

This project uses Zod schemas for frontend validation, integrated with React Hook Form via `@hookform/resolvers/zod`.

## Where schemas live
- Central exports: `apps/web/src/lib/schemas/index.ts`
- Auth schemas: `apps/web/src/lib/schemas/auth.schema.ts`
- Feature schemas: `fleet.schema.ts`, `invoice.schema.ts`, `partner.schema.ts`, `project.schema.ts`, `purchaseOrder.schema.ts`, `user.schema.ts`

## Current schemas
- `loginSchema` -> `LoginFormData`
- `passwordResetRequestSchema` -> `PasswordResetRequestData` (future)
- `passwordResetSchema` -> `PasswordResetData` (future, includes password confirmation)
- Fleet forms for vehicle, document, mileage, lease and expense workflows.
- Invoice create form and invoice line draft validation.
- Partner create/edit forms.
- Project create/update, member, material, vehicle, task and feed forms.
- Purchase order create/update/line/receipt forms.
- User create form.

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
- For watched form values used during render, prefer `useWatch({ control, name })` over calling `watch("field")` directly in JSX/render logic. This keeps React Hook Form subscriptions explicit and avoids React hooks lint noise.

## Adding a new schema (pattern)
1) Create a file in `apps/web/src/lib/schemas/` (e.g., `user.schema.ts`).
2) Export the schema and inferred TypeScript type:
   - `export const userSchema = z.object({ ... })`
   - `export type UserFormData = z.infer<typeof userSchema>`
3) Re-export from `apps/web/src/lib/schemas/index.ts`.
4) In the form, use `zodResolver(userSchema)` and the inferred type in `useForm<...>()`.

## Notes for AI agents
- Most feature forms now use Zod schemas and React Hook Form. Login remains a legacy plain-state form by design; see `docs/auth_implementation.md`.
- Keep schemas feature-specific until a validation rule is reused by multiple modules.

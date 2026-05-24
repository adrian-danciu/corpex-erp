# Validare cu Zod (Romana)

Proiectul foloseste scheme Zod pentru validare in frontend, integrate cu React Hook Form prin `@hookform/resolvers/zod`.

## Unde sunt schemele
- Exporturi centralizate: `apps/web/src/lib/schemas/index.ts`
- Scheme auth: `apps/web/src/lib/schemas/auth.schema.ts`
- Scheme pe feature: `fleet.schema.ts`, `invoice.schema.ts`, `partner.schema.ts`, `project.schema.ts`, `purchaseOrder.schema.ts`, `user.schema.ts`

## Schemele existente
- `loginSchema` -> `LoginFormData`
- `passwordResetRequestSchema` -> `PasswordResetRequestData` (future)
- `passwordResetSchema` -> `PasswordResetData` (future, include confirmare parola)
- Formulare Fleet pentru vehicul, document, kilometraj, leasing si cheltuieli.
- Formular de creare factura si validare pentru linii de factura.
- Formulare Partener create/edit.
- Formulare Project create/update, membri, materiale, vehicule, task-uri si feed.
- Formulare Purchase Order create/update/linii/receptii.
- Formular creare user.

## Cum este legata validarea
Exemplu din `apps/web/src/components/auth/LoginForm.tsx`:
1) Import schema si tipul inferat:
   - `import { loginSchema, type LoginFormData } from "@/lib/schemas";`
2) Schema este trecuta in React Hook Form prin resolver:
   - `useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })`
3) Erorile se citesc din `formState.errors` si se afiseaza in UI.

## Mesaje de eroare si UI
- Mesajele sunt definite in schema (ex: `"Email is required"`).
- React Hook Form le expune pe `errors.<field>.message`.
- UI foloseste clase conditionale si text inline pentru erori.
- Pentru valori urmarite in render, prefera `useWatch({ control, name })` in loc de `watch("field")` direct in JSX/render. Asa abonamentele React Hook Form raman explicite si nu apar warnings de React hooks lint.

## Adaugarea unei scheme noi (pattern)
1) Creeaza un fisier in `apps/web/src/lib/schemas/` (ex: `user.schema.ts`).
2) Exporta schema si tipul TypeScript inferat:
   - `export const userSchema = z.object({ ... })`
   - `export type UserFormData = z.infer<typeof userSchema>`
3) Re-exporta din `apps/web/src/lib/schemas/index.ts`.
4) In formular, foloseste `zodResolver(userSchema)` si tipul inferat in `useForm<...>()`.

## Note pentru agenti AI
- Majoritatea formularelor pe feature folosesc acum Zod si React Hook Form. Login ramane formular legacy cu state local intentionat; vezi `docs/auth_implementation.md`.
- Pastreaza schemele specifice feature-ului pana cand o regula de validare este reutilizata de mai multe module.

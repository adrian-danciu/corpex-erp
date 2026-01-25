# Validare cu Zod (Romana)

Proiectul foloseste scheme Zod pentru validare in frontend, integrate cu React Hook Form prin `@hookform/resolvers/zod`.

## Unde sunt schemele
- Exporturi centralizate: `apps/web/src/lib/schemas/index.ts`
- Scheme auth: `apps/web/src/lib/schemas/auth.schema.ts`

## Schemele existente
Definite in `apps/web/src/lib/schemas/auth.schema.ts`:
- `loginSchema` -> `LoginFormData`
- `passwordResetRequestSchema` -> `PasswordResetRequestData` (future)
- `passwordResetSchema` -> `PasswordResetData` (future, include confirmare parola)

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

## Adaugarea unei scheme noi (pattern)
1) Creeaza un fisier in `apps/web/src/lib/schemas/` (ex: `user.schema.ts`).
2) Exporta schema si tipul TypeScript inferat:
   - `export const userSchema = z.object({ ... })`
   - `export type UserFormData = z.infer<typeof userSchema>`
3) Re-exporta din `apps/web/src/lib/schemas/index.ts`.
4) In formular, foloseste `zodResolver(userSchema)` si tipul inferat in `useForm<...>()`.

## Note pentru agenti AI
- Doar schema de login este folosita in UI acum.
- Schemele de resetare parola sunt definite dar nu sunt conectate in componente.

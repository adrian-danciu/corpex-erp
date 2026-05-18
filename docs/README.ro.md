# Corpex ERP Docs (Romana)

Documentatia este in `docs/` si este gandita pentru dezvoltatori si agenti AI care trebuie sa inteleaga rapid proiectul.

## De unde incepi
- Structura proiectului si cum se leaga partile: `docs/structure.ro.md`
- Arhitectura si fluxul de date: `docs/architecture.ro.md`
- Librarii si tooling: `docs/libraries.ro.md`
- Scripturi care pot fi rulate: `docs/scripts.ro.md`
- Validare cu Zod: `docs/validation.ro.md`
- Sumarul ultimei implementari: `docs/superpowers/specs/2026-05-18-implementation-summary.md`

## Quick start (local)
1) Instaleaza dependintele pe fiecare app (Bun este standardul):
   - Web: `cd apps/web && bun install`
   - API: `cd apps/api && bun install`
2) Env API:
   - Creeaza `apps/api/.env` si seteaza `DATABASE_URL` pentru Postgres.
3) Ruleaza aplicatiile:
   - Web: `cd apps/web && bun run dev`
   - API: `cd apps/api && bun run start:dev`

## Note pentru agenti AI
- Repo-ul este un monorepo simplu cu doua aplicatii independente (`apps/web`, `apps/api`).
- Vezi `docs/architecture.ro.md` pentru fluxul frontend -> API -> DB.
- Adaugirile curente includ documente angajati, exporturi rapoarte, remindere pentru expirarea documentelor de angajat si modulul Payroll cu reguli romanesti de taxare si suport B2B contractor.

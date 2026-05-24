# Corpex ERP Docs (English)

These docs live under `docs/` and are meant for both developers and AI agents who need to understand the project fast.

## Where to start
- Project structure and how parts fit together: `docs/structure.en.md`
- Architecture and data flow: `docs/architecture.en.md`
- Libraries and tooling: `docs/libraries.en.md`
- Scripts you can run: `docs/scripts.en.md`
- Validation with Zod: `docs/validation.en.md`
- Current optimization plan/history: `docs/superpowers/plans/2026-05-23-codebase-optimization.md`

## Quick start (local)
1) Install dependencies per app (Bun is the standard):
   - Web: `cd apps/web && bun install`
   - API: `cd apps/api && bun install`
2) API env:
   - Create `apps/api/.env` and set `DATABASE_URL` for Postgres.
3) Run apps:
   - Web: `cd apps/web && bun run dev`
   - API: `cd apps/api && bun run start:dev`

## Notes for AI agents
- This repo is a lightweight monorepo with two independent apps (`apps/web`, `apps/api`).
- Look at `docs/architecture.en.md` for the intended frontend -> API -> DB flow.
- `AGENTS.md` is the fastest operational context file for coding sessions.
- Current implemented additions include employee document storage, report exports, employee document expiry reminders, supplier purchase orders with in-transit stock, defective-stock handling, project cost invoicing, and the Payroll module with Romanian tax rules and B2B contractor handling.
- The active codebase cleanup direction is: shared formatting/download utilities, URL-backed list filters, feature-local controller hooks, split oversized pages by workflow, common backend pagination helpers, and focused service tests before deeper refactors.

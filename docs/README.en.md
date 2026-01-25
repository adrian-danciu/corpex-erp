# Corpex ERP Docs (English)

These docs live under `docs/` and are meant for both developers and AI agents who need to understand the project fast.

## Where to start
- Project structure and how parts fit together: `docs/structure.en.md`
- Architecture and data flow: `docs/architecture.en.md`
- Libraries and tooling: `docs/libraries.en.md`
- Scripts you can run: `docs/scripts.en.md`
- Validation with Zod: `docs/validation.en.md`

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
- Several libraries are present in dependencies but are not yet wired in code (see `docs/architecture.en.md`).

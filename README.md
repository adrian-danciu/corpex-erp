# CORPEX ERP

<p align="center">
  <b>Modular ERP web application</b> built with <b>React + Vite</b> (frontend) and <b>NestJS + GraphQL + Prisma</b> (backend).
</p>

<p align="center">
  <a href="https://corpex-web.onrender.com">Live Demo</a>
  ·
  <a href="https://dbdiagram.io/d/CORPEX-6a0b77d6697f99c167a67415">DB Diagram (dbdiagram.io)</a>
  ·
  <a href="#getting-started">Getting Started</a>
  ·
  <a href="#modules">Modules</a>
  ·
  <a href="#docs">Docs</a>
</p>

---

## Overview

**CORPEX ERP** is an ERP (Enterprise Resource Planning) application designed around a modular structure (HR, Finance, Stock, Fleet, Projects, Payroll, Reporting, Notifications, Settings), so it can be extended and adapted to different operational needs.

### Architecture (high level)

```text
React (apps/web)  ──GraphQL──▶  NestJS (apps/api)  ──Prisma──▶  Postgres
       ▲                              │
       └──────────── JWT auth ────────┘
```

- Frontend uses **Apollo Client** to talk to the API.
- Backend exposes a **GraphQL** endpoint via **NestJS + Apollo Server**.
- Data is persisted in **Postgres** via **Prisma** (schema under `apps/api/prisma/schema.prisma`).

## Tech stack

### Frontend (`apps/web`)
- React + TypeScript
- Vite
- Apollo Client (GraphQL)
- Tailwind + Radix UI (shadcn/ui style components)
- Zustand (global state)
- React Hook Form + Zod (forms/validation)
- DnD Kit (kanban tasks)
- PDF/Excel exports (`@react-pdf/renderer`, `xlsx`)

### Backend (`apps/api`)
- NestJS + TypeScript
- Apollo Server (GraphQL)
- Prisma ORM
- Postgres (works well with Neon)
- Auth: Passport JWT + bcrypt
- Scheduling: `@nestjs/schedule` (expiry reminders, etc.)

### Runtime / tooling
- Bun (recommended)

## Modules

The backend registers these modules in `apps/api/src/app.module.ts` (and the frontend mirrors them via `src/pages/*` and `src/components/*`):

- **Auth**: JWT login, refresh tokens, protected routes.
- **Users**: user administration and RBAC.
- **HR / Employees**: employees, leave requests, approvals, employee documents.
- **Finance**: partners, invoices, payments.
- **Stock**: warehouses, products, stock movements, purchase orders and receptions (NIR), defective stock handling.
- **Fleet**: vehicles, vehicle documents, mileage logs, leases, expenses.
- **Projects**: projects hub (team, materials, vehicles, tasks kanban, feed, invoices/cost rollups).
- **Notifications**: in-app notifications + schedulers for expiry and events.
- **Reporting**: dashboard metrics + reporting exports.
- **Settings**: company-wide settings + payroll tax rules.
- **Payroll**: payroll periods and lines, Romanian gross-to-net rules, B2B contractor handling.

> For deeper implementation details, see `docs/architecture.en.md`.

## Database

### ER diagram

> Tip: click the image to zoom in.

![Database ER Diagram](docs/db-diagram.png)

- Source: https://dbdiagram.io/d/CORPEX-6a0b77d6697f99c167a67415
- Prisma schema: `apps/api/prisma/schema.prisma`

## Monorepo structure

```text
corpex-erp/
  apps/
    api/       # NestJS backend (GraphQL + Prisma)
    web/       # React frontend (Vite)
  docs/        # Project docs (EN + RO)
  render.yaml  # Render deployment config
```

## Getting started

### Prerequisites
- **Bun** installed
- **Postgres** database (local or hosted)

### Install dependencies

This is a lightweight monorepo with two independent apps; install per app:

```bash
cd apps/web && bun install
cd ../api && bun install
```

### Environment variables

#### Backend (`apps/api/.env`)

At minimum:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=your-secure-secret
PORT=3000
```

#### Frontend (`apps/web/.env`)

```bash
VITE_API_URL=http://localhost:3000/graphql
```

### Run locally

**Backend (watch mode):**

```bash
cd apps/api
bun run start:dev
```

**Frontend (dev server):**

```bash
cd apps/web
bun run dev
```

### Useful scripts

Scripts are defined per app (see `docs/scripts.en.md`):

- `apps/web`: `dev`, `build`, `lint`, `preview`
- `apps/api`: `start`, `start:dev`, `build`, `test`, `test:e2e`, etc.

## Docs

Developer docs live under `docs/`:

- `docs/structure.en.md` — repo structure, folder guide
- `docs/architecture.en.md` — module map, data flow, key domain behavior
- `docs/auth_implementation.md` — JWT + RBAC implementation details
- `docs/scripts.en.md` — commands and scripts

## Deployment

- Web deployment (Render): https://corpex-web.onrender.com
- The repo also includes `render.yaml` for Render configuration.

## Contributing

- Keep modules consistent with the pattern: `entities/` → `dto/` → `service` → `resolver` → module registration.
- Prefer adding module docs under `docs/` when implementing new business features.

---

### License

Currently marked as **UNLICENSED** in `apps/api/package.json`.

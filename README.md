# CORPEX ERP

An ERP (Enterprise Resource Planning) web application with a modular, customizable approach. The repo is a **TypeScript** monorepo built around a **React + Vite** web client and a **NestJS** API.

- **Live deployment:** https://corpex-web.onrender.com
- **DB diagram (dbdiagram.io):** https://dbdiagram.io/d/CORPEX-6a0b77d6697f99c167a67415

## Tech stack

### Frontend (`apps/web`)
- React
- Vite
- TypeScript

### Backend (`apps/api`)
- NestJS
- TypeScript

### Runtime / tooling
- Bun

## Monorepo structure

```text
apps/
  api/   # NestJS backend
  web/   # React frontend
```

## Getting started

### Prerequisites
- **Bun** installed (the project was initially created with Bun v1.3.6).

### Install dependencies

```bash
bun install
```

### Run the frontend (development)

```bash
bun run dev
```

### Run the backend

```bash
bun run start
```

## Notes
- This README is intentionally a high-level overview. More detailed docs (features/modules, environment variables, database setup, deployment steps, etc.) can be added as the project evolves.

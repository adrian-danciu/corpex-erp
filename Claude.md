# Instructions for Claude Code Sessions

## Starting a New Session

**IMPORTANT**: Before working on any task in this project, you MUST first read the project documentation to understand the codebase structure, architecture, and conventions.

### Step 1: Read the Documentation

Start by reading these docs in order:

1. [docs/README.en.md](docs/README.en.md) - Project overview and quick start
2. [docs/structure.en.md](docs/structure.en.md) - Project structure and file organization
3. [docs/architecture.en.md](docs/architecture.en.md) - System architecture and data flow
4. [docs/libraries.en.md](docs/libraries.en.md) - Libraries and tooling used
5. [docs/scripts.en.md](docs/scripts.en.md) - Available commands and scripts

### Step 2: Key Information to Remember

**Project Type**: Corpex ERP - Lightweight monorepo with independent apps

**Tech Stack**:
- **Runtime**: Bun (package manager and runtime)
- **Frontend** (apps/web): React + Vite, Apollo Client, Zustand, React Hook Form + Zod, shadcn/ui (Radix + Tailwind)
- **Backend** (apps/api): NestJS, GraphQL (Apollo Server), Prisma + PostgreSQL

**Current State**:
- GraphQL and Prisma are installed but NOT yet wired into NestJS modules
- API only has basic AppController and AppService
- Database schema exists with User and Role models

**Key Conventions**:
- Use Bun for all package management and scripts
- Follow the monorepo structure (apps/web and apps/api are independent)
- UI components follow shadcn/ui patterns
- Forms use React Hook Form + Zod validation
- State management with Zustand

**UI primitive rule (non-negotiable)**:
- ALWAYS use the shadcn/ui components in `apps/web/src/components/ui/` for buttons, inputs, tables, dialogs, selects, tabs, badges, cards, etc. Do NOT hand-roll `<table>`, `<button>`, or other primitives with raw Tailwind.
- BEFORE writing any UI, list `apps/web/src/components/ui/` to confirm which primitives exist. Use them.
- IF a needed shadcn component is missing from that folder (e.g. you need `Dropdown`, `Tooltip`, `Toast`, `Combobox`, etc. and it isn't there), STOP coding and tell the user to add it via the shadcn CLI. Do not invent a substitute or hand-roll the missing primitive.
- The same rule applies when refactoring existing pages — replace any hand-rolled primitives with the shadcn equivalent.

### Step 3: Proceed with the Task

After reading the documentation, you can proceed with the user's request while keeping the project conventions in mind.

---

## Quick Reference

- **Root**: `/home/aditza/Documents/Github/corpex-erp`
- **Frontend**: `apps/web`
- **Backend**: `apps/api`
- **Docs**: `docs/*.en.md` (English) or `docs/*.ro.md` (Romanian)
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **API Module**: `apps/api/src/app.module.ts`
- **UI Components**: `apps/web/src/components/ui/`

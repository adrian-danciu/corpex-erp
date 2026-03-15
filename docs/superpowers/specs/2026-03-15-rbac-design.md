# RBAC Redesign — Design Spec
**Date:** 2026-03-15
**Project:** CORPEX ERP
**Author:** Adrian Danciu

---

## Overview

Replace the existing 5-role system (ADMIN, MANAGER, HR, FINANCE, USER) with a 2-role system (ADMIN, USER) where USER access is determined by the employee's `department` and `position` fields. Department becomes a standardized enum rather than a free-text field.

---

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Full access to all modules and all operations including delete |
| `USER` | Access derived from linked Employee record's `department` and `position` |

---

## Departments (standardized enum)

`HR` | `FINANCE` | `WAREHOUSE` | `FLEET` | `MANAGEMENT` | `IT`

Replaces the current free-text `department` field on the `Employee` model.

---

## Permission Matrix

| Department | Employee Records | Leave Requests (own) | Leave Approvals (all) | Finance | Stock | Fleet | Reports | Dashboard |
|---|---|---|---|---|---|---|---|---|
| `HR` | write | write | write | none | none | none | HR only | ✅ |
| `FINANCE` | none | write | none | write | none | none | Finance only | ✅ |
| `WAREHOUSE` | none | write | none | none | write | none | Stock only | ✅ |
| `FLEET` | none | write | none | none | none | write | Fleet only | ✅ |
| `MANAGEMENT` | read | write | approve | read | read | read | all | ✅ |
| `IT` | none | write | none | none | none | none | none | ✅ |
| `ADMIN` (role) | write | write | approve | write | write | write | all | ✅ |

**Access levels:**
- `none` — no access, module hidden in sidebar and route blocked
- `read` — can view data, cannot create/edit/delete
- `write` — can create and edit (delete is ADMIN only everywhere)
- `approve` — can approve/reject leave requests (MANAGEMENT + HR + ADMIN)

---

## JWT Payload

At login, if the user has a linked Employee record, the JWT includes:

```ts
{
  sub: string;       // user id
  email: string;
  role: 'ADMIN' | 'USER';
  department: Department | null;  // from Employee.department
  position: string | null;        // from Employee.position
}
```

Users without a linked Employee record (role = USER, no employee) get dashboard-only access.

---

## Backend Changes

### Prisma Schema
- `Role` enum: remove MANAGER, HR, FINANCE → keep `ADMIN`, `USER`
- `Department` enum: `HR`, `FINANCE`, `WAREHOUSE`, `FLEET`, `MANAGEMENT`, `IT`
- `Employee.department` changes from `String` to `Department` enum

### Auth Service
- `login()` looks up the linked Employee record and includes `department` + `position` in the JWT payload
- JWT strategy extracts `department` + `position` from token and attaches to `req.user`

### Permission Config
Single file `apps/api/src/auth/permissions.config.ts`:
```ts
export const DEPARTMENT_PERMISSIONS: Record<Department, ModulePermissions> = { ... }
```
Maps each department to allowed modules and access levels.

### Guards
- `RolesGuard` updated to check `req.user.role` (ADMIN bypasses all) and `req.user.department` against permission config
- Applied to all resolvers with appropriate module tags

### Resolvers
All resolvers decorated with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` or equivalent module-level guard.

---

## Frontend Changes

### Auth Store
`user` object extended with `department: string | null` and `position: string | null` from JWT.

### Sidebar
`menuItems` roles array replaced with department-based visibility logic using the permission config (mirrored as a frontend constant).

### App.tsx Routes
`ProtectedRoute` updated to accept `requiredDepartments` in addition to the existing `requiredRole`.

### Employee Form
`department` field changed from free-text input to a dropdown with the 6 standardized options.

---

## Migration Notes

- Existing users with roles MANAGER, HR, FINANCE → converted to `USER` with appropriate Employee department set
- Existing ADMIN users → remain ADMIN
- Data migration script needed for `Role` enum change and `department` field type change

---

## Out of Scope (Phase 2)

- Position-based write granularity (employee vs manager within same department)
- Field-level permissions (e.g. hiding salary from non-HR)
- Per-user permission overrides



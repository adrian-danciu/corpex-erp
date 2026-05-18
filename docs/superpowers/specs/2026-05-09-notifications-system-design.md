# Notifications System — Design

**Date:** 2026-05-09
**Status:** Implemented, with 2026-05-18 extensions
**Owner:** Adrian Danciu

## 1. Goal

Add a cross-cutting notifications subsystem so users see when something they care about happened (leave decisions, task assignments, fleet expiries, employee-document expiries, low stock). Bundle in toast feedback for every CRUD operation so the app feels responsive and "real". Surface arriving notifications as toasts.

This is the first cross-cutting feature in CORPEX, and the thesis (Cap. 3.3) explicitly calls it out for fleet alerts and task notifications.

## 2. Scope

### In scope (v1, "Scope A")
- 6 notification event types:
  - `LEAVE_REQUEST_SUBMITTED` (recipients: direct manager + all HR/MANAGEMENT users with `leaveApprovals: true`)
  - `LEAVE_REQUEST_APPROVED` / `LEAVE_REQUEST_REJECTED` (recipient: requesting employee)
  - `PROJECT_TASK_ASSIGNED` (recipient: assignee, suppressed if assignee == creator)
  - `FLEET_DOCUMENT_EXPIRING` (recipients: all users with department FLEET or MANAGEMENT)
  - `EMPLOYEE_DOCUMENT_EXPIRING` (recipients: all users with department HR or MANAGEMENT)
  - `STOCK_BELOW_MINIMUM` (recipients: all users with department WAREHOUSE or MANAGEMENT)
- Three frontend surfaces backed by one `myNotifications` query: top-nav bell + dropdown, dashboard widget (5 latest), full inbox page (`/notifications`) with pagination + read/unread filter + type filter.
- Toast wiring for every CRUD mutation: success toast + error toast with **Retry** action. New incoming notifications during a poll surface as info toasts.
- Per-document-type fleet expiry thresholds editable in `CompanySettings` (ITP/RCA/CASCO/Rovinietă).
- Refresh cadence: bell click + login + 30 min background poll. **No** short-interval polling, **no** tab-focus refetch (intentional — see memory `feedback_polling_cadence`).

### Explicitly out of scope (deferred)
- Email/SMS delivery (in-app only).
- Push/WebSocket subscriptions (rejected for complexity vs. value at this scale).
- Project chatter notifications (material requests, feed posts, status changes) — Scope B/C, possibly later.
- Finance events (invoice overdue, payment received) — later.
- Audit log — separate future feature.
- Notification preferences/opt-outs per user — later if requested.
- Snooze / unread-after-X-days reset.

## 3. Architecture overview

```
┌──────────────────────────┐         ┌─────────────────────────┐
│   Triggering modules     │         │   Scheduler             │
│   (employees, projects,  │         │   (NestJS @nestjs/       │
│    stock)                │         │    schedule)            │
└────────────┬─────────────┘         └────────────┬────────────┘
             │                                    │
             │ notifyXxx(...) calls               │ daily 06:00 UTC: scan
             │                                    │ vehicle docs vs. thresholds
             ▼                                    ▼
       ┌─────────────────────────────────────────────────┐
       │   NotificationsService                          │
       │   - typed helper methods per event              │
       │   - de-dup on (recipientId, entityType, id)     │
       │   - precomputes linkPath                        │
       │   - persists Notification rows                  │
       └────────────────┬────────────────────────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  Postgres    │
                 │ Notification │
                 └──────┬───────┘
                        │
       ┌────────────────┴─────────────────┐
       │  GraphQL: myNotifications,       │
       │  myUnreadNotificationCount,      │
       │  markNotificationRead,           │
       │  markAllNotificationsRead        │
       └────────────────┬─────────────────┘
                        │ Apollo Client (poll 30 min + on-demand)
                        ▼
       ┌──────────────────────────────────────────────────┐
       │  Frontend                                        │
       │  - useNotifications() hook (single source)       │
       │  - <NotificationBell> in top nav                 │
       │  - <NotificationsWidget> on dashboard            │
       │  - <NotificationsPage> at /notifications         │
       │  - Diff detector → sonner info toasts            │
       │  - useMutationWithToast → success/error toasts   │
       └──────────────────────────────────────────────────┘
```

## 4. Backend

### 4.1 Prisma schema changes

```prisma
model Notification {
  id          String                   @id @default(uuid())
  recipientId String
  recipient   User                     @relation("UserNotifications", fields: [recipientId], references: [id], onDelete: Cascade)
  type        NotificationType
  title       String
  body        String?
  linkPath    String?
  entityType  NotificationEntityType?
  entityId    String?
  isRead      Boolean                  @default(false)
  readAt      DateTime?
  createdAt   DateTime                 @default(now())

  @@index([recipientId, isRead, createdAt])
  @@index([recipientId, entityType, entityId])
}

enum NotificationType {
  LEAVE_REQUEST_SUBMITTED
  LEAVE_REQUEST_APPROVED
  LEAVE_REQUEST_REJECTED
  PROJECT_TASK_ASSIGNED
  FLEET_DOCUMENT_EXPIRING
  EMPLOYEE_DOCUMENT_EXPIRING
  STOCK_BELOW_MINIMUM
}

enum NotificationEntityType {
  LEAVE_REQUEST
  PROJECT_TASK
  VEHICLE_DOCUMENT
  EMPLOYEE_DOCUMENT
  PRODUCT
}

// Add to existing User model:
//   notifications Notification[] @relation("UserNotifications")

// Add to existing CompanySettings model:
//   fleetExpiryThresholdItp       Int @default(30)
//   fleetExpiryThresholdRca       Int @default(30)
//   fleetExpiryThresholdCasco     Int @default(30)
//   fleetExpiryThresholdRovinieta Int @default(7)
```

Single migration: `add_notifications_and_fleet_thresholds`.

### 4.2 NotificationsModule structure

```
apps/api/src/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.resolver.ts
├── notifications.scheduler.ts        # cron jobs
├── notifications.constants.ts        # link-path builders, default copy templates
├── entities/
│   └── notification.entity.ts        # GraphQL ObjectType + enum registration
└── dto/
    ├── notification-filter.input.ts
    └── paginated-notification.dto.ts
```

`NotificationsService` exports the public API consumed by other modules:

```ts
class NotificationsService {
  // Internal core
  private async emit(rows: EmitRow[]): Promise<void>; // dedup + bulk insert

  // Typed helpers (other modules call these)
  notifyLeaveSubmitted(leaveRequest, employee, approverUserIds: string[]): Promise<void>;
  notifyLeaveDecision(leaveRequest, status: 'APPROVED' | 'REJECTED'): Promise<void>;
  notifyTaskAssigned(task, project): Promise<void>;
  notifyDocumentExpiring(doc, vehicle, recipientUserIds: string[]): Promise<void>;
  notifyStockBelowMinimum(product, warehouse, recipientUserIds: string[]): Promise<void>;

  // Read API (resolver)
  myNotifications(userId, pagination, filter): Promise<PaginatedNotification>;
  myUnreadCount(userId): Promise<number>;
  markRead(userId, id): Promise<Notification>;
  markAllRead(userId): Promise<number>;
}
```

**De-duplication rule** (in `emit`): for each `(recipientId, entityType, entityId)` triple, skip if a row already exists with `isRead = false` AND `createdAt > now - 24h`. Means a user gets at most one unread notification per entity per 24h window. Avoids spamming on repeat events (e.g. cron runs daily, stock movements drop the same product below min five times).

### 4.3 Recipient resolution

A small helper `getApproversForLeaveRequest(employeeId)` in `NotificationsService`:
1. Look up the employee's `Employee.managerId` → resolve to that manager's User ID (if any).
2. Find all User IDs whose `Employee.department ∈ {HR, MANAGEMENT}` (these are the `leaveApprovals: true` departments per [permissions.config.ts](apps/api/src/auth/permissions.config.ts)).
3. Union, dedupe.

Similar helpers:
- `getFleetWatchers()` → users in FLEET or MANAGEMENT.
- `getHrWatchers()` → users in HR or MANAGEMENT.
- `getStockWatchers()` → users in WAREHOUSE or MANAGEMENT.

### 4.4 Event integration points

| Event | Triggered in | Recipient logic |
|---|---|---|
| `LEAVE_REQUEST_SUBMITTED` | `LeaveRequestsService.create()` after Prisma write | `getApproversForLeaveRequest(employeeId)` |
| `LEAVE_REQUEST_APPROVED` / `..._REJECTED` | `LeaveRequestsService.approve()` / `.reject()` | requesting employee's User ID |
| `PROJECT_TASK_ASSIGNED` | `ProjectTasksService.create()` and `.update()` (when `assigneeId` first set or changed) | `task.assigneeId` (skip if same as `task.createdById`) |
| `FLEET_DOCUMENT_EXPIRING` | Scheduler, daily | `getFleetWatchers()` |
| `EMPLOYEE_DOCUMENT_EXPIRING` | Scheduler, daily | `getHrWatchers()` |
| `STOCK_BELOW_MINIMUM` | `StockMovementsService` after a movement that lowers `currentStock` to `< minimumStock` | `getStockWatchers()` |

### 4.5 Scheduler (cron)

Install `@nestjs/schedule`. One scheduler class:

```ts
@Injectable()
export class NotificationsScheduler {
  @Cron('0 6 * * *', { timeZone: 'Europe/Bucharest' }) // daily 06:00 local
  async scanFleetDocumentExpiry() {
    const settings = await this.settingsService.get();
    const today = startOfDay(new Date());
    const docs = await this.prisma.vehicleDocument.findMany({
      where: { expiryDate: { gte: today } },
      include: { vehicle: true },
    });
    const expiring = docs.filter(d => {
      const threshold = thresholdFor(d.type, settings); // ITP/RCA/CASCO/Rovinietă
      const cutoff = addDays(today, threshold);
      return d.expiryDate <= cutoff;
    });
    if (!expiring.length) return;
    const recipients = await this.notificationsService.getFleetWatchers();
    for (const doc of expiring) {
      await this.notificationsService.notifyDocumentExpiring(doc, doc.vehicle, recipients);
    }
  }
}
```

Stock-below-minimum is **event-driven**, not scheduled — `StockMovementsService` calls `notifyStockBelowMinimum` after every movement that crosses the threshold. The 24h dedup prevents spam.

### 4.6 GraphQL surface

```graphql
type Notification {
  id: ID!
  type: NotificationType!
  title: String!
  body: String
  linkPath: String
  entityType: NotificationEntityType
  entityId: String
  isRead: Boolean!
  readAt: DateTime
  createdAt: DateTime!
}

input NotificationFilter {
  isRead: Boolean
  type: NotificationType
}

type PaginatedNotification {
  items: [Notification!]!
  total: Int!
}

extend type Query {
  myNotifications(pagination: PaginationInput, filter: NotificationFilter): PaginatedNotification!
  myUnreadNotificationCount: Int!
}

extend type Mutation {
  markNotificationRead(id: ID!): Notification!
  markAllNotificationsRead: Int!
}
```

All four guarded with `@UseGuards(JwtAuthGuard)`. Service methods take `userId` from `@CurrentUser()` — never trust a client-supplied recipient.

### 4.7 Settings extension

`SettingsService` and `SettingsResolver` extend the existing `CompanySettings` shape with the four threshold fields. Frontend Settings page (admin-only) gets a new "Fleet expiry alerts" section.

## 5. Frontend

### 5.1 Toast infrastructure

- Mount `<Toaster richColors closeButton position="bottom-right" />` once in `App.tsx` (above `<BrowserRouter>`).
- New file `apps/web/src/lib/toast.ts`:
  ```ts
  export const toastSuccess = (msg: string) => toast.success(msg);
  export const toastError = (msg: string, retry?: () => void) =>
    toast.error(msg, retry ? { action: { label: 'Retry', onClick: retry } } : undefined);
  export const toastInfo = (msg: string, onClick?: () => void) =>
    toast(msg, onClick ? { action: { label: 'Open', onClick } } : undefined);
  ```
- New hook `apps/web/src/hooks/useMutationWithToast.ts`:
  ```ts
  // wraps useMutation; on completion fires toastSuccess(successMessage);
  // on error fires toastError(err.message, () => mutate(lastVars))
  ```
  Used by every mutation-firing page. Existing pages get a small refactor pass to adopt it (or at least call the toast helpers directly).

### 5.2 Notifications hook + queries

`apps/web/src/graphql/mutations/notifications.mutations.ts`:
- `MY_NOTIFICATIONS_QUERY` (paginated)
- `MY_UNREAD_COUNT_QUERY`
- `MARK_NOTIFICATION_READ_MUTATION`
- `MARK_ALL_NOTIFICATIONS_READ_MUTATION`

`apps/web/src/hooks/useNotifications.ts`:
- Wraps the two queries and two mutations.
- `useQuery(MY_NOTIFICATIONS_QUERY, { pollInterval: 1_800_000 })` — 30 min.
- Exposes `notifications, unreadCount, refetch, markRead, markAllRead`.
- Internally tracks the previous notification ID set; on each refetch, the new IDs are passed to a callback so callers can fire toasts (used by the bell wrapper).

`apps/web/src/hooks/useNewNotificationToasts.ts`:
- Subscribes to `useNotifications` deltas and fires `toastInfo(title, () => navigate(linkPath))` for each new item.
- Mounted once inside `DashboardLayout` so it's active on every authenticated page.

Login flow: after `loginMutation` resolves and the token is stored, `apolloClient.refetchQueries({ include: [MY_NOTIFICATIONS_QUERY, MY_UNREAD_COUNT_QUERY] })` is called. Implemented in `LoginForm.tsx`.

### 5.3 Components

```
apps/web/src/components/notifications/
├── NotificationBell.tsx          # icon + unread badge in top nav, opens dropdown
├── NotificationDropdown.tsx      # popover, latest 10, "Mark all read", "View all"
├── NotificationItem.tsx          # one row: icon (by type), title, time-ago, click → linkPath
└── NotificationTypeIcon.tsx      # maps NotificationType → Lucide icon

apps/web/src/components/dashboard/
└── NotificationsWidget.tsx        # first 5 + "Show more →" link

apps/web/src/pages/
└── NotificationsPage.tsx          # /notifications inbox: pagination + filter (type, read state)
```

`NotificationItem` click handler:
```ts
const handleClick = () => {
  if (!notification.isRead) markRead(notification.id);
  if (notification.linkPath) navigate(notification.linkPath);
};
```

### 5.4 Routing

- New route in `App.tsx`: `/notifications` → `NotificationsPage`, protected (any logged-in user).
- `NotificationBell` mounted in the existing top nav inside `DashboardLayout`.
- `NotificationsWidget` added to `DashboardPage`.

### 5.5 shadcn primitives

`<NotificationDropdown>` uses the shadcn popover primitive.

Current primitives used by this feature:
- `apps/web/src/components/ui/popover.tsx`
- `apps/web/src/components/ui/tooltip.tsx`
- `apps/web/src/components/ui/checkbox.tsx`

## 6. Polling cadence (locked)

| Trigger | Action |
|---|---|
| User clicks bell icon | refetch dropdown query |
| User login (post-auth) | refetch + reset poll timer |
| Background, every 30 min | poll |
| Tab focus | **NO** (intentional — multi-tab workflow makes this noisy) |
| Short interval (e.g. 30s) | **NO** (excessive for low-event-rate ERP) |

## 7. Build order

Each step is independently testable.

1. **Prisma migration**: add `Notification` model, enums, `User.notifications` relation, `CompanySettings` four threshold fields. Generate client. Apply migration.
2. **NotificationsModule (read API only)**: module + service `myNotifications/myUnreadCount/markRead/markAllRead` + resolver. No event emission yet. Verify in GraphQL Playground by manually inserting a row.
3. **Frontend toast foundation**: mount `<Toaster />`, write `lib/toast.ts`, write `useMutationWithToast`, refactor 2–3 existing CRUD pages (e.g. Vehicles, Partners) to use it. Verify success + error + retry flows.
4. **Frontend notifications UI (no events yet)**: use the `popover` shadcn primitive. Build `NotificationBell`, `NotificationDropdown`, `NotificationItem`, `useNotifications` hook with 30 min poll. Mount bell in `DashboardLayout`. Verify it loads (will be empty).
5. **Backend events — easy ones**: leave submit/approve/reject + project task assigned. Update `LeaveRequestsService` and `ProjectTasksService` to call `NotificationsService.notifyXxx`. Verify by submitting/approving leaves and assigning tasks → notifications appear in bell within 30 min (or on click).
6. **Backend scheduler**: install `@nestjs/schedule`, register in `AppModule`, add `NotificationsScheduler` with the daily fleet expiry cron. Manual trigger endpoint (or temporary `@Cron('* * * * *')`) for local testing.
7. **Backend stock alerts**: hook into `StockMovementsService` to emit when `currentStock < minimumStock` after a movement.
8. **Settings UI**: extend `SettingsPage` with "Fleet expiry alerts" section (4 number inputs). Update settings GraphQL mutation. Verify thresholds persist and the cron uses them.
9. **Inbox page**: build `NotificationsPage` at `/notifications` with pagination + filters. Wire from "View all" link in dropdown.
10. **Dashboard widget**: `NotificationsWidget` (5 latest + "Show more"). Add to `DashboardPage`.
11. **Toast on incoming notifications**: `useNewNotificationToasts` hook. Mount in `DashboardLayout`. Verify a leave submission in another browser session pops a toast in the approver's session within 30 min (or on bell click).
12. **Employee document expiry extension**: added on 2026-05-18. Employee documents support `expiryDate`; the scheduler emits `EMPLOYEE_DOCUMENT_EXPIRING` to HR/MANAGEMENT users.

Each step is a candidate for one PR / one commit boundary in the implementation plan.

## 8. Risks & open questions

- **Leave-approval routing:** the design notifies the direct manager AND all HR/MANAGEMENT users. If multiple approvers act in parallel, the second approval will fail (already prevented by current `LeaveRequestsService`). Acceptable.
- **Cron timezone:** server runs UTC by default; using `timeZone: 'Europe/Bucharest'` requires Node ICU locale data. If unavailable on Render, fall back to UTC and run at 04:00 UTC (= 06:00 EET / 07:00 EEST).
- **Notification volume:** with the 24h dedup, daily fleet cron should produce a bounded number of rows. Stock alerts could be chatty if many products are below min — dedup mitigates. Inbox pagination handles long-term.
- **Migration on Neon serverless:** existing migrations work via `prisma migrate deploy`; this one adds two new tables (Notification + enum) and four columns on CompanySettings. Low risk.
- **UI primitive drift:** notification dropdown depends on `popover`; payroll tax breakdown depends on `tooltip`; HR contractor input depends on `checkbox`.

## 9. Files touched / created (summary)

### Created (backend)
- `apps/api/prisma/migrations/<ts>_add_notifications/`
- `apps/api/src/notifications/notifications.module.ts`
- `apps/api/src/notifications/notifications.service.ts`
- `apps/api/src/notifications/notifications.resolver.ts`
- `apps/api/src/notifications/notifications.scheduler.ts`
- `apps/api/src/notifications/notifications.constants.ts`
- `apps/api/src/notifications/entities/notification.entity.ts`
- `apps/api/src/notifications/dto/notification-filter.input.ts`
- `apps/api/src/notifications/dto/paginated-notification.dto.ts`

### Modified (backend)
- `apps/api/prisma/schema.prisma` (Notification model, enums, User relation, CompanySettings fields)
- `apps/api/src/app.module.ts` (register `NotificationsModule`, `ScheduleModule.forRoot()`)
- `apps/api/src/employees/leave-requests.service.ts` (emit on create/approve/reject)
- `apps/api/src/projects/project-tasks.service.ts` (emit on assignment)
- `apps/api/src/stock/stock-movements.service.ts` (emit on threshold crossing)
- `apps/api/src/settings/settings.service.ts` + entity + dto (4 threshold fields)
- `apps/api/package.json` (`@nestjs/schedule`)

### Created (frontend)
- `apps/web/src/components/notifications/NotificationBell.tsx`
- `apps/web/src/components/notifications/NotificationDropdown.tsx`
- `apps/web/src/components/notifications/NotificationItem.tsx`
- `apps/web/src/components/notifications/NotificationTypeIcon.tsx`
- `apps/web/src/components/dashboard/NotificationsWidget.tsx`
- `apps/web/src/pages/NotificationsPage.tsx`
- `apps/web/src/hooks/useNotifications.ts`
- `apps/web/src/hooks/useNewNotificationToasts.ts`
- `apps/web/src/hooks/useMutationWithToast.ts`
- `apps/web/src/lib/toast.ts`
- `apps/web/src/graphql/mutations/notifications.mutations.ts`
- `apps/web/src/types/notifications.types.ts`
- `apps/web/src/components/ui/popover.tsx` (via shadcn CLI)

### Modified (frontend)
- `apps/web/src/App.tsx` (mount `<Toaster />`, add `/notifications` route)
- `apps/web/src/components/layout/DashboardLayout.tsx` (mount `<NotificationBell>`, `useNewNotificationToasts`)
- `apps/web/src/pages/DashboardPage.tsx` (add `<NotificationsWidget>`)
- `apps/web/src/pages/SettingsPage.tsx` (fleet thresholds section)
- `apps/web/src/components/auth/LoginForm.tsx` (refetch notification queries post-login)
- `apps/web/src/lib/schemas/index.ts` + a new `settings.schema.ts` for the threshold form
- 2–3 existing CRUD pages refactored to `useMutationWithToast` as a reference (Vehicles, Partners)

## 10. Acceptance criteria

- [ ] Submitting a leave request creates `LEAVE_REQUEST_SUBMITTED` rows for the direct manager + all HR/MANAGEMENT users.
- [ ] Approving/rejecting a leave creates a `LEAVE_REQUEST_APPROVED` / `..._REJECTED` row for the requester.
- [ ] Assigning a project task to someone other than the creator creates `PROJECT_TASK_ASSIGNED`.
- [ ] Daily cron at 06:00 Europe/Bucharest emits `FLEET_DOCUMENT_EXPIRING` for any document whose `expiryDate` falls within its type's threshold window. Per dedup rule: no new row if an unread one already exists for the same `(recipientId, VEHICLE_DOCUMENT, documentId)` within the last 24h.
- [ ] A stock movement that drops `currentStock` below `minimumStock` emits `STOCK_BELOW_MINIMUM`. Per dedup rule: no new row if an unread one already exists for the same `(recipientId, PRODUCT, productId)` within the last 24h.
- [ ] Bell icon shows accurate unread count, refreshes on click, on login, and every 30 min.
- [ ] Clicking a notification marks it read and navigates to its `linkPath`.
- [ ] `/notifications` page shows paginated list with filters; "Mark all read" works.
- [ ] Dashboard widget shows the latest 5 with "Show more →" link.
- [ ] Every successful CRUD mutation in the touched pages shows a green toast.
- [ ] Every failed mutation shows a red toast with a working **Retry** action.
- [ ] A new notification arriving via the 30 min poll surfaces as an info toast that, when clicked, navigates to `linkPath`.
- [ ] Admin can edit the 4 fleet thresholds in Settings; the cron picks up new values on its next run.

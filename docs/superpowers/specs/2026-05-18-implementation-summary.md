# Implementation Summary - 2026-05-18

**Status:** Implemented locally  
**Scope:** Document storage, exports, employee-document reminders, payroll, Romanian payroll tax rules, B2B contractor payroll handling

This document records the major project changes added on 2026-05-18 so future sessions can understand the current product state quickly.

## 1. Project Context

- Added root `CODEX.md` as the fast orientation document for future Codex sessions.
- `CODEX.md` summarizes the stack, repo map, modules, permissions model, daily commands, and important implementation patterns.

## 2. Employee Document Storage

Added HR document storage for employee records.

Backend:
- Added `EmployeeDocument` Prisma model.
- Added `EmployeeDocumentType` enum:
  - `ID_CARD`
  - `CONTRACT`
  - `MEDICAL_CERTIFICATE`
  - `DIPLOMA`
  - `TRAINING`
  - `OTHER`
- Added upload endpoint for employee documents.
- Added GraphQL service/resolver for document CRUD/listing.
- Added relation from `Employee` to documents and from `User` to uploaded documents.

Frontend:
- Added `/documents` menu item/page.
- Added employee document panel in employee detail.
- Added employee document GraphQL documents and TypeScript types.

Migration:
- `20260518120000_add_employee_documents`

## 3. Employee Document Expiry Reminders

Extended employee documents with expiry tracking and notifications.

Backend:
- Added optional `expiryDate` to `EmployeeDocument`.
- Added notification type `EMPLOYEE_DOCUMENT_EXPIRING`.
- Added notification entity type `EMPLOYEE_DOCUMENT`.
- Extended notification scheduler to scan employee documents that expire soon.
- Recipients are HR and Management users.

Frontend:
- Employee document create/list UI supports expiry date.
- Notification UI knows how to display employee-document expiry notifications.

Migration:
- `20260518123000_add_employee_document_expiry`

## 4. Report Exports

Added PDF/Excel exports for report data.

Frontend:
- Added `xlsx`.
- Added lazy-loaded export helper in `apps/web/src/lib/report-export.tsx`.
- Reports can export:
  - HR Employee report
  - Stock Inventory report
  - Fleet Vehicle report
- Export code is dynamically imported so the heavy export libraries do not inflate the initial route as much.

Verification:
- Web typecheck passed.
- Web build passed.

## 5. Payroll Module

Added a new Payroll module end to end.

Backend:
- Added `PayrollPeriod` Prisma model.
- Added `PayrollLine` Prisma model.
- Added `PayrollStatus` enum:
  - `DRAFT`
  - `APPROVED`
  - `PAID`
- Added Payroll Nest module, resolver, service, DTOs, and GraphQL entities.
- Registered `PayrollModule` in `AppModule`.
- Added department permissions:
  - HR: write
  - Finance: write
  - Management: write
  - Warehouse/Fleet/IT: none
- Added mutations:
  - `generatePayroll`
  - `updatePayrollLine`
  - `approvePayroll`
  - `markPayrollPaid`
  - `deletePayrollPeriod`
- Deleting payroll is only allowed for `DRAFT` periods.

Frontend:
- Added `/payroll` route.
- Added Payroll sidebar item.
- Added payroll period list and detail page.
- Added draft generation by month/year.
- Added line editing for draft payroll:
  - bonus
  - manual deductions
  - notes
- Added approve and mark-paid actions.
- Added draft delete action with confirmation.
- Added Payroll PDF/Excel export.

Migrations:
- `20260518130000_add_payroll_module`

## 6. Romanian Payroll Tax Foundation

The payroll engine now treats `Employee.salary` as the employee's gross monthly salary.

Added payroll tax settings to `CompanySettings`:
- `payrollTaxCasRate` default `25`
- `payrollTaxCassRate` default `10`
- `payrollTaxIncomeRate` default `10`
- `payrollTaxCamRate` default `2.25`
- `payrollPersonalDeduction` default `0`
- `payrollTaxRuleVersion` default `RO_2026_STANDARD`

Added Settings UI tab:
- `Settings -> Payroll`
- Admin can edit payroll tax rates and rule version.

Payroll line calculation now stores a snapshot of:
- gross salary
- bonus
- unpaid leave deduction
- taxable gross
- CAS rate and amount
- CASS rate and amount
- income tax rate and amount
- CAM rate and amount
- manual deductions
- net amount
- total employer/company cost
- tax rule version

Formula for standard employees:
- `taxableGross = grossSalary + bonus - unpaidLeaveDeduction`
- `CAS = taxableGross * CAS%`
- `CASS = taxableGross * CASS%`
- `incomeTax = (taxableGross - CAS - CASS - personalDeduction) * incomeTax%`
- `CAM = taxableGross * CAM%`
- `net = taxableGross - CAS - CASS - incomeTax - manualDeductions`
- `totalEmployerCost = taxableGross + CAM`

Migration:
- `20260518133000_add_romanian_payroll_tax_fields`

## 7. Required Employee Salary and EUR Payroll

Employee salary is now required and displayed as gross EUR salary.

Backend:
- `Employee.salary` is now non-null.
- Create employee requires `salary`.
- Backend rejects salary `<= 0`.
- Payroll generation only includes employees with salary greater than `0`.
- New payroll periods default to `EUR`.

Frontend:
- Create Employee shows `Gross Salary (EUR) *`.
- Employee detail/edit shows gross salary in EUR.
- Payroll generation sends `currency: "EUR"`.

Migrations:
- `20260518134500_require_employee_salary_and_default_payroll_eur`
- `20260518135500_update_payroll_periods_to_eur`

Note:
- Existing employees with missing salary were backfilled to `0` during migration. They should be edited to a real gross EUR salary before payroll generation.

## 8. B2B Contractor Payroll Handling

Added a contractor flag to employees so B2B collaborators can be handled without salary payroll taxes.

Backend:
- Added `Employee.isContractor Boolean @default(false)`.
- Create/update employee supports `isContractor`.
- Payroll calculation checks `employee.isContractor`.
- Contractors get:
  - CAS `0`
  - CASS `0`
  - income tax `0`
  - CAM `0`
  - net amount equal to taxable gross minus manual deductions

Frontend:
- Create Employee form has a `B2B contractor` checkbox.
- Employee detail/edit form has a `B2B contractor` checkbox.
- Employee detail shows payroll type:
  - `B2B contractor`
  - `Employment contract`
- Payroll tax tooltip says taxes are not withheld for contractors.

Migration:
- `20260518141000_add_employee_contractor_flag`

Important:
- Existing payroll periods are snapshots. Marking an employee as contractor does not automatically recalculate old payroll periods. Generate a new payroll period or edit a draft line after changing the employee type.

## 9. Payroll UI Refinements

Payroll now presents totals more clearly.

Summary cards:
- Gross
- Bonus
- Employee Taxes
- Net
- CAM
- Total Employer Cost

Table:
- Employee taxes column shows only the total.
- Tooltip shows CAS, CASS, and income tax breakdown.
- CAM is displayed as a separate column.
- Total Employer Cost is shown separately from gross.

Tooltip:
- The CAM summary label has a tooltip with the full Romanian name:
  - `Contribuția Asiguratorie pentru Muncă`

## 10. Verification Performed

Repeatedly verified after each major feature slice:

API:
- `bunx prisma generate`
- `bunx prisma migrate deploy`
- `bun run typecheck`
- `bun run build`

Web:
- `bun run typecheck`
- `bun run build`

Known recurring build note:
- Vite still warns that the main frontend chunk is larger than 500 kB. The report export code is lazy-loaded, but the app still has a large primary bundle.

## 11. Current Restart Notes

Backend restart is required after GraphQL schema changes:
- payroll module and mutations
- employee document GraphQL changes
- employee `salary`/`isContractor` fields
- settings payroll tax fields

Frontend usually only needs a browser refresh unless the dev server did not hot reload a changed route/component.

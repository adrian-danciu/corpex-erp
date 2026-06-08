import { describe, expect, it } from "bun:test";
import {
  dueDateInDays,
  getInvoiceSourceLabel,
} from "../src/components/projects/tabs/invoices/invoice-tab.utils";

describe("invoice tab utilities", () => {
  it("calculates a due date from an explicit base date", () => {
    expect(dueDateInDays(30, new Date("2026-06-08T12:00:00.000Z"))).toBe(
      "2026-07-08",
    );
  });

  it("returns labels for every project invoice source", () => {
    expect(getInvoiceSourceLabel("PROJECT_MATERIAL")).toBe("Material");
    expect(getInvoiceSourceLabel("PROJECT_SERVICE")).toBe("Service");
    expect(getInvoiceSourceLabel("VEHICLE_EXPENSE")).toBe("Vehicle expense");
  });
});

import { formatMoney } from "@/lib/formatters";

export const DEFAULT_CURRENCY = "EUR";

export { formatMoney };

/**
 * Returns the app currency (always EUR) and a `formatMoney` helper.
 *
 * Behavior:
 *  - All money values display in EUR. Currency fields are kept in records for
 *    compatibility, but app-level creation flows always submit EUR.
 */
export function useCurrency() {
  return { currency: DEFAULT_CURRENCY, formatMoney };
}

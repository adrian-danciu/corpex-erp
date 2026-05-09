export const DEFAULT_CURRENCY = "EUR";

export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/**
 * Returns the app currency (always EUR) and a `formatMoney` helper.
 *
 * Behavior:
 *  - Records that have their own `currency` field (Project, Invoice) display
 *    in their stated currency — pass it as the second arg to `formatMoney`.
 *  - Records without a currency field (product prices, stock value, vehicle
 *    expenses) display in EUR by default.
 */
export function useCurrency() {
  return { currency: DEFAULT_CURRENCY, formatMoney };
}

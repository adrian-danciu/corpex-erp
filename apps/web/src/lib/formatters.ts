import { formatDistanceToNow } from "date-fns";

const DEFAULT_LOCALE = "ro-RO";
const DEFAULT_CURRENCY = "EUR";
const EMPTY_VALUE = "—";

type DateInput = string | number | Date | null | undefined;

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    ...options,
  }).format(amount);
}

export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return `${amount.toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string {
  if (!value) return EMPTY_VALUE;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(
    new Date(value),
  );
}

export function formatDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string {
  if (!value) return EMPTY_VALUE;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
}

export function formatRelativeTime(value: DateInput): string {
  if (!value) return EMPTY_VALUE;
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toLocaleString(DEFAULT_LOCALE, {
    maximumFractionDigits: value >= 10 || unitIndex === 0 ? 0 : 1,
  })} ${units[unitIndex]}`;
}

export function formatQuantity(qty: number, unit: string): string {
  return `${qty.toLocaleString(DEFAULT_LOCALE)} ${unit}`;
}

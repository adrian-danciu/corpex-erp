export interface UnitOption {
  value: string;
  label: string;
}

// Curated list of units. Free-form values from existing data (e.g. "ream")
// still display correctly, but new entries are forced to one of these.
export const UNITS: UnitOption[] = [
  { value: "pcs", label: "pcs" },
  { value: "sqm", label: "sqm" },
  { value: "lm", label: "lm" },
  { value: "m", label: "m" },
  { value: "cbm", label: "cbm" },
  { value: "kg", label: "kg" },
  { value: "t", label: "t" },
  { value: "l", label: "l" },
  { value: "set", label: "set" },
  { value: "pkg", label: "pkg" },
  { value: "box", label: "box" },
  { value: "hr", label: "hr" },
];

export const DEFAULT_UNIT = "pcs";

export function formatQtyWithUnit(qty: number, unit: string): string {
  return `${qty.toLocaleString()} ${unit}`;
}

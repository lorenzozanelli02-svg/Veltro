export type Unit = "cm" | "in";

export function formatLength(cm: number, unit: Unit): string {
  if (unit === "in") return `${(cm / 2.54).toFixed(1).replace(/\.0$/, "")}`;
  return `${Number.isInteger(cm) ? cm : cm.toFixed(1)}`;
}

export function formatRange(min: number | null, max: number | null, unit: Unit): string {
  if (min != null && max != null && min !== max)
    return `${formatLength(min, unit)}–${formatLength(max, unit)}`;
  const v = min ?? max;
  return v == null ? "—" : formatLength(v, unit);
}

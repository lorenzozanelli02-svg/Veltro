import {
  NUMERIC_COLUMNS,
  SIZE_CHART_COLUMNS,
  normaliseCategory,
  normaliseGender,
  type SizeChartInput,
} from "./types";

export type FieldErrors = string[];

function text(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function num(v: unknown): number | null | "invalid" {
  const s = text(v);
  if (s == null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : "invalid";
}

/** Validate one SizeChart row coming from a CSV line or the admin form. */
export function parseSizeRow(raw: Record<string, unknown>): { row?: SizeChartInput; errors: FieldErrors } {
  const errors: string[] = [];
  const brand = text(raw.brand);
  const sizeLabel = text(raw.size_label);
  const gender = normaliseGender(String(raw.gender ?? ""));
  const category = normaliseCategory(String(raw.category ?? ""));
  if (!brand) errors.push("brand is required");
  if (!sizeLabel) errors.push("size_label is required");
  if (!gender) errors.push(`gender must be "men" or "women" (got "${text(raw.gender) ?? ""}")`);
  if (!category) errors.push(`category must be tops, bottoms or dresses (got "${text(raw.category) ?? ""}")`);

  const numbers: Record<string, number | null> = {};
  for (const c of NUMERIC_COLUMNS) {
    const n = num(raw[c]);
    if (n === "invalid") errors.push(`${c} must be a number (got "${text(raw[c])}")`);
    else if (n != null && n < 0) errors.push(`${c} can't be negative`);
    else numbers[c] = n;
  }
  for (const m of ["chest", "waist", "hips"]) {
    const lo = numbers[`${m}_min_cm`];
    const hi = numbers[`${m}_max_cm`];
    if (lo != null && hi != null && lo > hi) errors.push(`${m}_min_cm is larger than ${m}_max_cm`);
  }
  if (errors.length) return { errors };

  return {
    errors,
    row: {
      brand: brand!,
      gender: gender!,
      category: category!,
      region: text(raw.region)?.toUpperCase() ?? null,
      size_label: sizeLabel!,
      chest_min_cm: numbers.chest_min_cm,
      chest_max_cm: numbers.chest_max_cm,
      waist_min_cm: numbers.waist_min_cm,
      waist_max_cm: numbers.waist_max_cm,
      hips_min_cm: numbers.hips_min_cm,
      hips_max_cm: numbers.hips_max_cm,
      inside_leg_cm: numbers.inside_leg_cm,
      foot_length_cm: numbers.foot_length_cm,
      source_url: text(raw.source_url),
      last_checked: text(raw.last_checked),
      notes: text(raw.notes),
    },
  };
}

export function checkHeaders(headers: string[]): string[] {
  const errors: string[] = [];
  const clean = headers.map((h) => h.replace(/^﻿/, "").trim());
  const missing = SIZE_CHART_COLUMNS.filter((c) => !clean.includes(c));
  const unknown = clean.filter((h) => h !== "" && !(SIZE_CHART_COLUMNS as readonly string[]).includes(h));
  if (missing.length) errors.push(`Missing columns: ${missing.join(", ")}`);
  if (unknown.length) errors.push(`Unknown columns: ${unknown.join(", ")}`);
  return errors;
}

export const GENDERS = ["women", "men"] as const;
export const CATEGORIES = ["tops", "bottoms", "dresses"] as const;
export type Gender = (typeof GENDERS)[number];
export type Category = (typeof CATEGORIES)[number];
export type Measure = "chest" | "waist" | "hips";

export const SIZE_CHART_COLUMNS = [
  "brand",
  "gender",
  "category",
  "region",
  "size_label",
  "chest_min_cm",
  "chest_max_cm",
  "waist_min_cm",
  "waist_max_cm",
  "hips_min_cm",
  "hips_max_cm",
  "inside_leg_cm",
  "foot_length_cm",
  "source_url",
  "last_checked",
  "notes",
] as const;

export const NUMERIC_COLUMNS = [
  "chest_min_cm",
  "chest_max_cm",
  "waist_min_cm",
  "waist_max_cm",
  "hips_min_cm",
  "hips_max_cm",
  "inside_leg_cm",
  "foot_length_cm",
] as const;

export type SizeChartInput = {
  brand: string;
  gender: string;
  category: string;
  region: string | null;
  size_label: string;
  chest_min_cm: number | null;
  chest_max_cm: number | null;
  waist_min_cm: number | null;
  waist_max_cm: number | null;
  hips_min_cm: number | null;
  hips_max_cm: number | null;
  inside_leg_cm: number | null;
  foot_length_cm: number | null;
  source_url: string | null;
  last_checked: string | null;
  notes: string | null;
};

export type SizeChartRow = SizeChartInput & { id: number };

export type Brand = {
  id: number;
  name: string;
  slug: string;
  shop_url: string | null;
};

export type FitResult = "too_small" | "perfect" | "too_big";
export const FIT_RESULTS: FitResult[] = ["too_small", "perfect", "too_big"];

export function isGender(v: unknown): v is Gender {
  return typeof v === "string" && (GENDERS as readonly string[]).includes(v);
}
export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

/** Accept common spellings from CSV files and normalise them. */
export function normaliseGender(v: string): Gender | null {
  const s = v.trim().toLowerCase();
  if (["men", "man", "mens", "men's", "male", "m"].includes(s)) return "men";
  if (["women", "woman", "womens", "women's", "female", "f", "w"].includes(s)) return "women";
  return null;
}
export function normaliseCategory(v: string): Category | null {
  const s = v.trim().toLowerCase();
  if (["tops", "top"].includes(s)) return "tops";
  if (["bottoms", "bottom", "trousers", "pants", "jeans"].includes(s)) return "bottoms";
  if (["dresses", "dress"].includes(s)) return "dresses";
  return null;
}

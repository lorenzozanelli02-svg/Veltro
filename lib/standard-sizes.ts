import type { Category, Gender, SizeChartRow } from "./types";

/**
 * Generic body-measurement ranges for standard UK / EU / US sizes.
 * Only used as a fallback when a brand has no chart data, and every result
 * that uses it is labelled as an estimate. Ranges are in cm.
 */
type StandardSize = {
  labels: Record<StandardRegion, string>;
  chest?: [number, number];
  waist?: [number, number];
  hips?: [number, number];
};

export const STANDARD_REGIONS = ["UK", "EU", "US"] as const;
export type StandardRegion = (typeof STANDARD_REGIONS)[number];
export const STANDARD_BRAND = "Standard sizing";

const WOMEN: StandardSize[] = [
  { labels: { UK: "4", EU: "32", US: "0" }, chest: [76, 79], waist: [58, 61], hips: [83, 86] },
  { labels: { UK: "6", EU: "34", US: "2" }, chest: [79, 82], waist: [61, 64], hips: [86, 89] },
  { labels: { UK: "8", EU: "36", US: "4" }, chest: [82, 86], waist: [64, 68], hips: [89, 93] },
  { labels: { UK: "10", EU: "38", US: "6" }, chest: [86, 90], waist: [68, 72], hips: [93, 97] },
  { labels: { UK: "12", EU: "40", US: "8" }, chest: [90, 95], waist: [72, 77], hips: [97, 102] },
  { labels: { UK: "14", EU: "42", US: "10" }, chest: [95, 100], waist: [77, 82], hips: [102, 107] },
  { labels: { UK: "16", EU: "44", US: "12" }, chest: [100, 105], waist: [82, 87], hips: [107, 112] },
  { labels: { UK: "18", EU: "46", US: "14" }, chest: [105, 111], waist: [87, 93], hips: [112, 118] },
  { labels: { UK: "20", EU: "48", US: "16" }, chest: [111, 117], waist: [93, 99], hips: [118, 124] },
  { labels: { UK: "22", EU: "50", US: "18" }, chest: [117, 123], waist: [99, 105], hips: [124, 130] },
];

const MEN_TOPS: StandardSize[] = [
  { labels: { UK: "XS", EU: "44", US: "XS" }, chest: [86, 91], waist: [71, 76], hips: [86, 91] },
  { labels: { UK: "S", EU: "46", US: "S" }, chest: [91, 97], waist: [76, 81], hips: [91, 97] },
  { labels: { UK: "M", EU: "48", US: "M" }, chest: [97, 104], waist: [81, 89], hips: [97, 104] },
  { labels: { UK: "L", EU: "52", US: "L" }, chest: [104, 112], waist: [89, 97], hips: [104, 112] },
  { labels: { UK: "XL", EU: "54", US: "XL" }, chest: [112, 120], waist: [97, 106], hips: [112, 120] },
  { labels: { UK: "XXL", EU: "56", US: "XXL" }, chest: [120, 128], waist: [106, 116], hips: [120, 128] },
];

const MEN_BOTTOMS: StandardSize[] = [
  { labels: { UK: "28", EU: "42", US: "28" }, waist: [70, 73], hips: [86, 89] },
  { labels: { UK: "30", EU: "44", US: "30" }, waist: [75, 78], hips: [91, 94] },
  { labels: { UK: "32", EU: "46", US: "32" }, waist: [80, 83], hips: [96, 99] },
  { labels: { UK: "34", EU: "48", US: "34" }, waist: [85, 88], hips: [101, 104] },
  { labels: { UK: "36", EU: "50", US: "36" }, waist: [90, 93], hips: [106, 109] },
  { labels: { UK: "38", EU: "52", US: "38" }, waist: [95, 98], hips: [111, 114] },
  { labels: { UK: "40", EU: "54", US: "40" }, waist: [100, 104], hips: [116, 119] },
];

function tableFor(gender: Gender, category: Category): StandardSize[] {
  if (gender === "women") return WOMEN;
  return category === "bottoms" ? MEN_BOTTOMS : MEN_TOPS;
}

export function asStandardRegion(region: string | null | undefined): StandardRegion | null {
  const r = (region ?? "").trim().toUpperCase();
  if (r === "UK" || r === "GB") return "UK";
  if (r === "EU" || r === "FR" || r === "DE" || r === "IT") return "EU";
  if (r === "US" || r === "USA") return "US";
  return null;
}

export function standardRows(gender: Gender, category: Category, region: StandardRegion): SizeChartRow[] {
  return tableFor(gender, category).map((s, i) => ({
    id: -(i + 1),
    brand: STANDARD_BRAND,
    gender,
    category,
    region,
    size_label: s.labels[region],
    chest_min_cm: s.chest?.[0] ?? null,
    chest_max_cm: s.chest?.[1] ?? null,
    waist_min_cm: s.waist?.[0] ?? null,
    waist_max_cm: s.waist?.[1] ?? null,
    hips_min_cm: s.hips?.[0] ?? null,
    hips_max_cm: s.hips?.[1] ?? null,
    inside_leg_cm: null,
    foot_length_cm: null,
    source_url: null,
    last_checked: null,
    notes: "Generic standard sizing (estimate)",
  }));
}

function cleanLabel(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/^(UK|EU|US|USA)\s*/, "")
    .replace(/^W\s*(?=\d)/, "")
    .replace(/^X{2}L$/, "XXL")
    .replace(/^2XL$/, "XXL");
}

/** Find the standard size whose label matches a brand's size label, e.g. "UK 10" or "M". */
export function standardRowForLabel(
  gender: Gender,
  category: Category,
  label: string,
  preferredRegion: string | null,
): SizeChartRow | null {
  const wanted = cleanLabel(label);
  const preferred = asStandardRegion(preferredRegion);
  const regions: StandardRegion[] = preferred
    ? [preferred, ...STANDARD_REGIONS.filter((r) => r !== preferred)]
    : [...STANDARD_REGIONS];
  for (const region of regions) {
    const match = standardRows(gender, category, region).find((r) => cleanLabel(r.size_label) === wanted);
    if (match) return match;
  }
  return null;
}

import {
  asStandardRegion,
  standardRowForLabel,
  standardRows,
  type StandardRegion,
} from "./standard-sizes";
import type { Category, Gender, Measure, SizeChartRow } from "./types";

/** How close (cm) the body midpoint can be to a range edge before we suggest the neighbouring size. */
const EDGE_TOLERANCE_CM = 1;

export type Range = { min: number; max: number; mid: number };

export type SizeRef = { label: string; region: string | null };

export type BasisMeasurement = Range & { measure: Measure; primary: boolean };

export type ConversionResult = {
  ok: true;
  recommended: SizeRef;
  /** Neighbouring size when the body sits on the edge of a range or in a gap between sizes. */
  alternate: (SizeRef & { direction: "up" | "down" }) | null;
  confidence: "official" | "estimate";
  measure: Measure;
  basis: BasisMeasurement[];
  /** Secondary measurements that point to a different size. */
  secondary: { measure: Measure; size: SizeRef }[];
  notes: string[];
};

export type ConversionError = { ok: false; error: string };

export function primaryOrder(category: Category): Measure[] {
  return category === "bottoms" ? ["waist", "hips"] : ["chest", "waist", "hips"];
}

export function rangeOf(row: SizeChartRow, m: Measure): Range | null {
  const a = row[`${m}_min_cm`];
  const b = row[`${m}_max_cm`];
  if (a == null && b == null) return null;
  let min = (a ?? b) as number;
  let max = (b ?? a) as number;
  if (min > max) [min, max] = [max, min];
  return { min, max, mid: (min + max) / 2 };
}

/** Region codes that don't help the shopper read a size label. */
const GENERIC_REGIONS = new Set(["INT", "INTL", "INTERNATIONAL", "ALPHA", "LETTER"]);

function toRef(row: SizeChartRow): SizeRef {
  const region = row.region?.trim() || null;
  return { label: row.size_label, region: region && !GENERIC_REGIONS.has(region.toUpperCase()) ? region : null };
}

export function displaySize(s: SizeRef): string {
  if (!s.region) return s.label;
  return s.label.toUpperCase().startsWith(s.region.toUpperCase()) ? s.label : `${s.region} ${s.label}`;
}

/** Keep one region from a brand's rows so we never mix e.g. UK and EU labels in one answer. */
export function pickRegionRows(rows: SizeChartRow[], preferredRegion: string | null): SizeChartRow[] {
  const regions = new Map<string, number>();
  for (const r of rows) {
    const key = (r.region ?? "").trim().toUpperCase();
    regions.set(key, (regions.get(key) ?? 0) + 1);
  }
  if (regions.size <= 1) return rows;
  const pref = (preferredRegion ?? "").trim().toUpperCase();
  let chosen = regions.has(pref) && pref !== "" ? pref : "";
  if (!chosen) {
    // Most common region wins; ties keep the first one seen.
    let best = -1;
    for (const [key, count] of regions) {
      if (count > best) {
        best = count;
        chosen = key;
      }
    }
  }
  return rows.filter((r) => (r.region ?? "").trim().toUpperCase() === chosen);
}

type Match = {
  row: SizeChartRow;
  alternate: { row: SizeChartRow; direction: "up" | "down" } | null;
  outside: "below" | "above" | null;
};

/** Find the size whose range contains `mid`, falling back to the closest midpoint. */
export function matchSize(mid: number, rows: SizeChartRow[], m: Measure): Match | null {
  const sized = rows
    .map((row) => ({ row, r: rangeOf(row, m) }))
    .filter((x): x is { row: SizeChartRow; r: Range } => x.r !== null)
    .sort((a, b) => a.r.mid - b.r.mid || a.r.min - b.r.min);
  if (sized.length === 0) return null;

  const closestBy = (list: typeof sized) =>
    list.reduce((best, x) => (Math.abs(x.r.mid - mid) < Math.abs(best.r.mid - mid) ? x : best));

  const neighbour = (idx: number, step: -1 | 1) => {
    const label = sized[idx].row.size_label;
    for (let i = idx + step; i >= 0 && i < sized.length; i += step) {
      if (sized[i].row.size_label !== label) return sized[i].row;
    }
    return null;
  };

  const containing = sized.filter((x) => x.r.min <= mid && mid <= x.r.max);
  if (containing.length > 0) {
    const best = closestBy(containing);
    const idx = sized.indexOf(best);
    let alternate: Match["alternate"] = null;
    if (best.r.max > best.r.min) {
      const toLower = mid - best.r.min;
      const toUpper = best.r.max - mid;
      if (toLower <= EDGE_TOLERANCE_CM && toLower <= toUpper) {
        const down = neighbour(idx, -1);
        if (down) alternate = { row: down, direction: "down" };
      } else if (toUpper <= EDGE_TOLERANCE_CM) {
        const up = neighbour(idx, 1);
        if (up) alternate = { row: up, direction: "up" };
      }
    }
    return { row: best.row, alternate, outside: null };
  }

  const best = closestBy(sized);
  if (mid < sized[0].r.min) return { row: best.row, alternate: null, outside: "below" };
  if (mid > sized[sized.length - 1].r.max) return { row: best.row, alternate: null, outside: "above" };

  // In a gap between two sizes: recommend the closer one, offer the other.
  const upperIdx = sized.findIndex((x) => x.r.min > mid);
  const lower = sized[upperIdx - 1];
  const upper = sized[upperIdx];
  const other = best.row === upper.row ? { row: lower.row, direction: "down" as const } : { row: upper.row, direction: "up" as const };
  return {
    row: best.row,
    alternate: other.row.size_label !== best.row.size_label ? other : null,
    outside: null,
  };
}

export type ConvertInput = {
  gender: Gender;
  category: Category;
  source: SizeChartRow;
  targetBrand: string;
  /** All SizeChart rows for the target brand, gender and category (may be empty). */
  targetRows: SizeChartRow[];
};

export function convertSize(input: ConvertInput): ConversionResult | ConversionError {
  const { gender, category, source, targetBrand } = input;
  const order = primaryOrder(category);
  const notes: string[] = [];
  const genderWord = gender === "women" ? "women's" : "men's";

  // 1. Body measurements from the source size, or standard sizing if the brand has none.
  let sourceRow = source;
  let estimated = false;
  if (!order.some((m) => rangeOf(source, m))) {
    const std = standardRowForLabel(gender, category, source.size_label, source.region);
    if (!std) {
      return {
        ok: false,
        error: `We don't have measurements for ${source.brand} size ${displaySize(toRef(source))} yet, so we can't convert it.`,
      };
    }
    sourceRow = std;
    estimated = true;
    notes.push(`We don't have measurements for ${source.brand} size ${displaySize(toRef(source))}, so we used standard sizing for it.`);
  }

  // 2. Primary measurement: first one in the order that both brands have.
  let pool = input.targetRows;
  let measure = order.find((m) => rangeOf(sourceRow, m) && pool.some((r) => rangeOf(r, m)));
  if (!measure) {
    const region: StandardRegion =
      asStandardRegion(pickRegionRows(pool, source.region)[0]?.region) ?? asStandardRegion(source.region) ?? "UK";
    pool = standardRows(gender, category, region);
    measure = order.find((m) => rangeOf(sourceRow, m) && pool.some((r) => rangeOf(r, m)));
    estimated = true;
    notes.push(
      `We don't have ${targetBrand}'s size chart for ${genderWord} ${category} yet, so this is a standard ${region} size.`,
    );
  }
  if (!measure) {
    return { ok: false, error: "There isn't enough measurement data to compare these sizes." };
  }

  const sourceRange = rangeOf(sourceRow, measure)!;
  const candidates = pickRegionRows(
    pool.filter((r) => rangeOf(r, measure)),
    source.region,
  );
  const match = matchSize(sourceRange.mid, candidates, measure)!;
  const recommended = toRef(match.row);

  if (match.outside) {
    notes.push(
      `Your ${measure} measurement is ${match.outside === "below" ? "smaller" : "larger"} than ${targetBrand}'s size range, so this is their closest size.`,
    );
  }

  // 3. Secondary measurements (waist, hips) where both sides have them.
  const regionKey = (match.row.region ?? "").trim().toUpperCase();
  const sameRegion = pool.filter((r) => (r.region ?? "").trim().toUpperCase() === regionKey);
  const secondary: ConversionResult["secondary"] = [];
  for (const m of ["waist", "hips"] as const) {
    if (m === measure) continue;
    const r = rangeOf(sourceRow, m);
    if (!r) continue;
    const m2 = matchSize(r.mid, sameRegion, m);
    if (m2 && m2.row.size_label !== match.row.size_label) {
      secondary.push({ measure: m, size: toRef(m2.row) });
    }
  }

  const basis: BasisMeasurement[] = [];
  for (const m of ["chest", "waist", "hips"] as const) {
    const r = rangeOf(sourceRow, m);
    if (r) basis.push({ ...r, measure: m, primary: m === measure });
  }

  return {
    ok: true,
    recommended,
    alternate: match.alternate ? { ...toRef(match.alternate.row), direction: match.alternate.direction } : null,
    confidence: estimated ? "estimate" : "official",
    measure,
    basis,
    secondary,
    notes,
  };
}

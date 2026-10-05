import { describe, expect, it } from "vitest";
import { convertSize, matchSize, pickRegionRows } from "@/lib/convert";
import { standardRowForId, standardSizeOptions } from "@/lib/standard-sizes";
import type { SizeChartRow } from "@/lib/types";

let nextId = 1;
function row(brand: string, size: string, m: Partial<SizeChartRow> = {}): SizeChartRow {
  return {
    id: nextId++,
    brand,
    gender: "women",
    category: "tops",
    region: "UK",
    size_label: size,
    chest_min_cm: null,
    chest_max_cm: null,
    waist_min_cm: null,
    waist_max_cm: null,
    hips_min_cm: null,
    hips_max_cm: null,
    inside_leg_cm: null,
    foot_length_cm: null,
    source_url: null,
    last_checked: null,
    notes: null,
    ...m,
  };
}
const chest = (min: number, max: number) => ({ chest_min_cm: min, chest_max_cm: max });
const waist = (min: number, max: number) => ({ waist_min_cm: min, waist_max_cm: max });
const hips = (min: number, max: number) => ({ hips_min_cm: min, hips_max_cm: max });

const target = [
  row("B", "8", { ...chest(80, 84), ...waist(62, 66) }),
  row("B", "10", { ...chest(84, 88), ...waist(66, 70) }),
  row("B", "12", { ...chest(88, 93), ...waist(70, 75) }),
  row("B", "14", { ...chest(93, 98), ...waist(75, 80) }),
];

describe("convertSize", () => {
  it("uses the chest midpoint for tops and finds the containing size", () => {
    const source = row("A", "M", { ...chest(88, 92) }); // mid 90
    const res = convertSize({ gender: "women", category: "tops", source, targetBrand: "B", targetRows: target });
    expect(res.ok && res.recommended.label).toBe("12");
    expect(res.ok && res.confidence).toBe("official");
    expect(res.ok && res.measure).toBe("chest");
    expect(res.ok && res.alternate).toBeNull();
  });

  it("offers the neighbouring size when within 1 cm of the edge", () => {
    const up = convertSize({ gender: "women", category: "tops", source: row("A", "S", chest(86, 89)), targetBrand: "B", targetRows: target });
    // mid 87.5, range 84–88 → 0.5 cm from top edge → suggest 12
    expect(up.ok && up.recommended.label).toBe("10");
    expect(up.ok && up.alternate).toMatchObject({ label: "12", direction: "up" });

    const down = convertSize({ gender: "women", category: "tops", source: row("A", "S", chest(88, 89)), targetBrand: "B", targetRows: target });
    // mid 88.5 sits in 12 (88–93), 0.5 cm above its lower edge → suggest 10
    expect(down.ok && down.recommended.label).toBe("12");
    expect(down.ok && down.alternate).toMatchObject({ label: "10", direction: "down" });
  });

  it("uses the bottoms primary measurement (waist)", () => {
    const bottoms = [
      row("B", "28", { category: "bottoms", ...waist(70, 74) }),
      row("B", "30", { category: "bottoms", ...waist(75, 79) }),
    ];
    const res = convertSize({ gender: "women", category: "bottoms", source: row("A", "S", { category: "bottoms", ...waist(76, 78), ...chest(1, 2) }), targetBrand: "B", targetRows: bottoms });
    expect(res.ok && res.recommended.label).toBe("30");
    expect(res.ok && res.measure).toBe("waist");
  });

  it("falls back to waist when chest is missing", () => {
    const res = convertSize({ gender: "women", category: "tops", source: row("A", "M", waist(71, 73)), targetBrand: "B", targetRows: target });
    expect(res.ok && res.measure).toBe("waist");
    expect(res.ok && res.recommended.label).toBe("12");
  });

  it("picks the closest midpoint when the value falls in a gap", () => {
    const gappy = [row("B", "S", chest(80, 84)), row("B", "M", chest(90, 94))];
    const res = convertSize({ gender: "women", category: "tops", source: row("A", "X", chest(84, 86)), targetBrand: "B", targetRows: gappy });
    // mid 85: S mid 82 (3 away), M mid 92 (7 away)
    expect(res.ok && res.recommended.label).toBe("S");
    expect(res.ok && res.alternate).toMatchObject({ label: "M", direction: "up" });
  });

  it("reports when a secondary measurement disagrees", () => {
    const source = row("A", "M", { ...chest(85, 87), ...waist(72, 74) }); // chest → 10, waist → 12
    const res = convertSize({ gender: "women", category: "tops", source, targetBrand: "B", targetRows: target });
    expect(res.ok && res.recommended.label).toBe("10");
    expect(res.ok && res.secondary).toEqual([{ measure: "waist", size: { label: "12", region: "UK" } }]);
  });

  it("uses standard sizing and labels an estimate when the target has no data", () => {
    const res = convertSize({ gender: "women", category: "tops", source: row("A", "M", chest(87, 89)), targetBrand: "C", targetRows: [] });
    expect(res.ok && res.confidence).toBe("estimate");
    expect(res.ok && res.recommended).toEqual({ label: "10", region: "UK" });
  });

  it("uses standard sizing for the source when it has no measurements", () => {
    const res = convertSize({ gender: "women", category: "tops", source: row("A", "UK 12"), targetBrand: "B", targetRows: target });
    expect(res.ok && res.confidence).toBe("estimate");
    // standard UK 12 chest 90–95 → mid 92.5 → B size 12 (88–93), 0.5 from top → offer 14
    expect(res.ok && res.recommended.label).toBe("12");
    expect(res.ok && res.alternate?.label).toBe("14");
  });

  it("never invents a conversion when the source size is unknown", () => {
    const res = convertSize({ gender: "women", category: "tops", source: row("A", "Petite Wide"), targetBrand: "B", targetRows: target });
    expect(res.ok).toBe(false);
  });

  it("keeps a single region and prefers the source region", () => {
    const multi = [
      row("B", "10", { region: "UK", ...chest(84, 88) }),
      row("B", "38", { region: "EU", ...chest(84, 88) }),
      row("B", "40", { region: "EU", ...chest(88, 92) }),
    ];
    expect(pickRegionRows(multi, "UK").map((r) => r.size_label)).toEqual(["10"]);
    expect(pickRegionRows(multi, "US").map((r) => r.size_label)).toEqual(["38", "40"]);
  });

  it("flags measurements outside the brand's range", () => {
    const m = matchSize(120, target, "chest");
    expect(m?.row.size_label).toBe("14");
    expect(m?.outside).toBe("above");
  });
});

describe("brands without a chart", () => {
  it("round-trips standard size ids", () => {
    const opts = standardSizeOptions("women", "tops");
    expect(opts.some((o) => o.label === "UK 10")).toBe(true);
    const id = opts.find((o) => o.label === "EU 38")!.id;
    expect(standardRowForId("women", "tops", id)).toMatchObject({ region: "EU", size_label: "38" });
    expect(standardRowForId("women", "tops", "12")).toBeNull();
    expect(standardRowForId("women", "tops", "std:UK:nope")).toBeNull();
  });

  it("converts from a brand without a chart using standard sizing and labels an estimate", () => {
    const std = standardRowForId("women", "tops", "std:UK:10")!;
    const r = convertSize({
      gender: "women",
      category: "tops",
      source: { ...std, brand: "No Chart Co" },
      sourceBrandWithoutChart: "No Chart Co",
      targetBrand: "B",
      targetRows: target,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.confidence).toBe("estimate");
    expect(r.recommended.label).toBe("10");
    expect(r.notes.join(" ")).toContain("No Chart Co");
  });
});

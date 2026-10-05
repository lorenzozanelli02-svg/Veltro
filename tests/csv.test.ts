import { describe, expect, it } from "vitest";
import { parseSizeChartCsv, toCsv } from "@/lib/csv";
import { SIZE_CHART_COLUMNS } from "@/lib/types";

const header = SIZE_CHART_COLUMNS.join(",");

describe("parseSizeChartCsv", () => {
  it("parses a valid file and normalises values", () => {
    const csv = `${header}\nAcme,Women,Top,uk,10,84,88,,,93,97,,,https://x.test,2026-01-01,`;
    const res = parseSizeChartCsv(csv);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows[0]).toMatchObject({ brand: "Acme", gender: "women", category: "tops", region: "UK", chest_min_cm: 84, waist_min_cm: null });
    expect(parseSizeChartCsv(toCsv(res.rows)).ok).toBe(true);
  });

  it("rejects wrong headers", () => {
    const res = parseSizeChartCsv("brand,size\nA,1");
    expect(res.ok).toBe(false);
    expect(!res.ok && res.errors[0]).toMatch(/Missing columns/);
  });

  it("reports bad rows with line numbers", () => {
    const res = parseSizeChartCsv(`${header}\nAcme,kids,tops,UK,10,abc,88,,,,,,,,,`);
    expect(res.ok).toBe(false);
    expect(!res.ok && res.errors[0]).toMatch(/^Line 2: gender.*chest_min_cm must be a number/);
  });
});

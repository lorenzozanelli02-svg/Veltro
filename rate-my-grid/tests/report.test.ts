import { describe, expect, it } from "vitest";
import { mockReport } from "@/lib/mock";
import { ReportSchema, toPublicReport, type StoredReport } from "@/lib/report";

const answers = { customer: "Busy mums who want to get fit", offer: "Online coaching", frequency: "weekly", action: "book" } as const;

function stored(paid: boolean): StoredReport {
  return {
    id: "a".repeat(22),
    createdAt: new Date().toISOString(),
    goal: "clients",
    answers,
    report: mockReport("clients", answers),
    paid,
  };
}

describe("report schema", () => {
  it("accepts the mock report for every goal", () => {
    for (const goal of ["clients", "product", "brand", "local"] as const) {
      expect(ReportSchema.safeParse(mockReport(goal, answers)).success).toBe(true);
    }
  });

  it("rejects a bio over Instagram's 150 characters", () => {
    const report = mockReport("clients", answers);
    report.full.bio.text = "x".repeat(151);
    expect(ReportSchema.safeParse(report).success).toBe(false);
  });

  it("rejects a plan that doesn't cover days 1 to 30 in order", () => {
    const report = mockReport("clients", answers);
    report.full.plan.days[3].day = 9;
    expect(ReportSchema.safeParse(report).success).toBe(false);
  });
});

describe("toPublicReport", () => {
  it("leaves the paid sections out until the report is paid for", () => {
    const view = toPublicReport(stored(false));
    expect(view.full).toBeNull();
    expect(JSON.stringify(view)).not.toContain(stored(false).report.full.bio.text);
  });

  it("includes the paid sections once paid", () => {
    expect(toPublicReport(stored(true)).full).not.toBeNull();
  });
});

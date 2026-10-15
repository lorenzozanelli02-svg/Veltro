import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { profileData } from "@/lib/analysis-prompt";
import { analyzeAccount } from "@/lib/analyze";
import { compareEngagement } from "@/lib/benchmarks";
import { analysisSampling } from "@/lib/config";
import { findCta } from "@/lib/cta";
import { GOAL_IDS } from "@/lib/goals";
import { checkCompleteness } from "@/lib/lookup/completeness";
import { mockImage, mockProfile } from "@/lib/lookup/mock";
import type { LookupResult } from "@/lib/lookup/types";
import { mockAiAnalysis } from "@/lib/mock";
import { allChecks, rubricFor } from "@/lib/rubric";
import { fitBio, quoteIsIn, scoreAnalysis, verifyEvidence, type ScoringContext } from "@/lib/scoring";

const now = new Date("2026-10-14T12:00:00Z");
const answers = { customer: "Busy mums who want to get fit", offer: "Online coaching", frequency: "weekly", action: "book" } as const;

async function lookup(change: (p: ReturnType<typeof mockProfile>) => void = () => {}): Promise<LookupResult> {
  const profile = mockProfile("sam.coach", now);
  change(profile);
  const images = await Promise.all([mockImage("avatar", 64), ...profile.posts.map((p) => mockImage(p.id, 64))]);
  return { profile, images, fetchedAt: now.toISOString(), provider: "mock" };
}

async function profileContext(): Promise<ScoringContext> {
  const result = await lookup();
  return { kind: "profile", profile: result.profile, ...profileData(result, now) };
}

describe("data check", () => {
  it("passes a complete lookup", async () => {
    expect(checkCompleteness(await lookup())).toEqual({ ok: true });
  });

  it("fails when the bio or counts weren't returned", async () => {
    const result = await lookup((p) => {
      p.bio = null;
      p.followers = null;
    });
    const check = checkCompleteness(result);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.missing).toEqual(["your bio", "your follower count"]);
  });

  it("accepts an empty bio, which is a real answer", async () => {
    expect(checkCompleteness(await lookup((p) => (p.bio = ""))).ok).toBe(true);
  });

  it("needs 9 recent posts with pictures and dates", async () => {
    const result = await lookup();
    result.images = result.images.slice(0, 8); // the avatar and 7 posts
    const check = checkCompleteness(result);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check).toMatchObject({ missing: ["enough of your recent posts"], postsUsable: 7, postsNeeded: 9 });
  });

  it("only needs every post when an account has fewer than 9", async () => {
    const result = await lookup((p) => {
      p.posts = p.posts.slice(0, 4);
      p.postsCount = 4;
    });
    expect(checkCompleteness(result).ok).toBe(true);
  });
});

describe("benchmarks and calls to action", () => {
  it("compares engagement with accounts of the same size", () => {
    expect(compareEngagement(3912, 1.2)).toMatchObject({ range: "1,000 to 10,000 followers", position: "below" });
    expect(compareEngagement(3912, 3)).toMatchObject({ position: "within" });
    expect(compareEngagement(250_000, 2)).toMatchObject({ range: "100,000 to 500,000 followers", position: "above" });
    expect(compareEngagement(null, 3)).toBeNull();
  });

  it("spots calls to action on whole words only", () => {
    expect(findCta("Book your free call today")).toBe("book");
    expect(findCta("DM me START for details")).toBe("dm me");
    expect(findCta("Link in bio 👆")).toBe("link in bio");
    expect(findCta("Found you on Facebook")).toBeNull();
    expect(findCta("Monday motivation 💪 #fitness")).toBeNull();
  });
});

describe("the rubric", () => {
  it("has five categories of 20 points for every goal, adding up to 100", () => {
    for (const goal of GOAL_IDS) {
      const categories = rubricFor(goal);
      expect(categories).toHaveLength(5);
      for (const c of categories) expect(c.checks.reduce((sum, check) => sum + check.points, 0)).toBe(20);
    }
  });

  it("uses unique check ids, and partly is worth less than met", () => {
    const ids = allChecks().map((c) => c.check.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { check } of allChecks()) expect(check.partly).toBeLessThan(check.points);
  });
});

describe("evidence", () => {
  it("matches quotes despite case, spacing, curly quotes and lost emoji joiners", () => {
    expect(quoteIsIn("Coach 💪 | Mum of 2 | 🏋️‍♀️\nLiving my best life ✨", "coach 💪 | mum of 2")).toBe(true);
    expect(quoteIsIn("Living my best life ✨", "“Living  my best life”")).toBe(true);
    expect(quoteIsIn("Coach | Mum of 2 | Living my best life", "Coach … best life")).toBe(true);
    expect(quoteIsIn("Coach | Mum of 2", "Personal trainer")).toBe(false);
  });

  it("rejects evidence that isn't really in their profile", async () => {
    const ctx = await profileContext();
    expect(verifyEvidence({ kind: "bio", quote: "Helping busy mums" }, ctx)).toBeNull();
    expect(verifyEvidence({ kind: "post", post: 13, caption_quote: "", detail: "A selfie" }, ctx)).toBeNull();
    expect(verifyEvidence({ kind: "post", post: 1, caption_quote: "Client win", detail: "" }, ctx)).toBeNull();
    expect(verifyEvidence({ kind: "screenshot", screenshot: 1, detail: "Bio" }, ctx)).toBeNull();
  });

  it("keeps evidence that is, ready to show", async () => {
    const ctx = await profileContext();
    expect(verifyEvidence({ kind: "bio", quote: "Coach 💪 | Mum of 2" }, ctx)).toEqual({ kind: "bio", label: "Your bio", text: "Coach 💪 | Mum of 2" });
    expect(verifyEvidence({ kind: "post", post: 2, caption_quote: "Client win!", detail: "" }, ctx)).toMatchObject({ label: "Post 2", text: "“Client win!”" });
    expect(verifyEvidence({ kind: "fact", fact: "engagement_rate" }, ctx)).toMatchObject({ label: "Engagement rate" });
    expect(verifyEvidence({ kind: "screenshot", screenshot: 2, detail: "Grid" }, { kind: "screenshots", count: 3 })).toMatchObject({ label: "Screenshot 2" });
  });
});

describe("scoring", () => {
  it("scores measurable checks from the numbers and adds up the total on the server", async () => {
    const ctx = await profileContext();
    const { report } = scoreAnalysis("clients", mockAiAnalysis("clients", answers, ctx).report!, ctx);
    const frequency = report.categories.consistency.checks.find((c) => c.id === "consistency_frequency")!;
    expect(frequency).toMatchObject({ measured: true, result: "partly", points: 2 });
    expect(frequency.reason).toContain("1.4 times a week");
    expect(report.categories.callToAction.checks.find((c) => c.id === "cta_captions")).toMatchObject({ measured: true, result: "not_met", points: 0 });

    const categories = Object.values(report.categories);
    for (const c of categories) expect(c.score).toBe(c.checks.reduce((sum, check) => sum + check.points, 0));
    expect(report.score).toBe(categories.reduce((sum, c) => sum + c.score, 0));
    expect(report.facts.find((f) => f.id === "posts_per_week")?.value).toBe("1.4");
  });

  it("drops feedback without evidence but keeps the judgement", async () => {
    const ctx = await profileContext();
    const ai = mockAiAnalysis("clients", answers, ctx).report!;
    ai.checks.bio_who = { result: "not_met", reason: "Made-up reason", evidence: [{ kind: "bio", quote: "Words that aren't there" }] };
    ai.free_fixes[0].evidence = [{ kind: "post", post: 40, caption_quote: "", detail: "Nope" }];
    ai.keep[0].evidence = [];
    const { report, audit } = scoreAnalysis("clients", ai, ctx);
    const who = report.categories.bio.checks.find((c) => c.id === "bio_who")!;
    expect(who).toMatchObject({ result: "not_met", reason: null, evidence: [] });
    expect(report.freeFixes).toHaveLength(2);
    expect(report.freeFixes.every((f) => f.evidence.length > 0)).toBe(true);
    expect(report.full.keep).toHaveLength(1);
    expect(audit.unverifiedChecks).toEqual(["bio_who"]);
    expect(audit.droppedFeedback).toBe(3);
  });

  it("gives the same score every time for the same answers", async () => {
    const ctx = await profileContext();
    const scores = Array.from({ length: 3 }, () => scoreAnalysis("local", mockAiAnalysis("local", answers, ctx).report!, ctx).report.score);
    expect(new Set(scores).size).toBe(1);
  });

  it("keeps a rewritten bio within 150 characters, keeping the call to action", () => {
    const long = `Helping busy mums get fit in 20 minutes a day, with no gym and no guilt\n✅ 200+ women coached online across the UK and Ireland\n🏆 Featured in Women's Health\nBook a free call 👇`;
    const fitted = fitBio(long);
    expect([...fitted].length).toBeLessThanOrEqual(150);
    expect(fitted.endsWith("Book a free call 👇")).toBe(true);
  });
});

describe("analysis", () => {
  beforeEach(() => vi.stubEnv("MOCK_AI_DELAY_MS", "0"));
  afterEach(() => vi.unstubAllEnvs());

  it("runs end to end on mocks: judged, verified, scored", async () => {
    const outcome = await analyzeAccount({ goal: "clients", answers, source: { kind: "profile", lookup: await lookup() } });
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.report.score).toBeGreaterThan(0);
      expect(outcome.audit).toEqual({ droppedFeedback: 0, unverifiedChecks: [], droppedEvidence: 0 });
    }
  });

  it("only sends a temperature to models that accept one", () => {
    expect(analysisSampling("claude-opus-5-5")).toEqual({});
    expect(analysisSampling("claude-sonnet-5-5")).toEqual({});
    expect(analysisSampling("claude-sonnet-4-6")).toEqual({ temperature: 0 });
  });
});

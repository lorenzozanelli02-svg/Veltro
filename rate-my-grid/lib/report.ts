import { z } from "zod";
import { GOAL_IDS, AnswersSchema } from "./goals";

const Score = z.number().int().min(0).max(100);
const Text = (max: number) => z.string().trim().min(1).max(max);

export const CATEGORIES = [
  { key: "bio", label: "Bio" },
  { key: "content", label: "Content" },
  { key: "consistency", label: "Consistency" },
  { key: "callToAction", label: "Call to action" },
  { key: "goalFit", label: "Fit with goal" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

/** Where a piece of feedback comes from in their profile, ready to show (e.g. "Bio" / "Coach | Mum of 2"). */
export const EvidenceSchema = z.object({
  kind: z.enum(["bio", "name", "post", "fact", "screenshot"]),
  label: Text(60),
  text: z.string().trim().max(400),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

/** One rubric check, scored. `measured` checks were scored in code from the numbers, not by the AI. */
const CheckSchema = z.object({
  id: z.string(),
  label: z.string(),
  result: z.enum(["met", "partly", "not_met"]),
  points: z.number().int().min(0),
  max: z.number().int().min(1),
  // Null when the AI's reason had no evidence we could verify: the score stands, the comment is dropped.
  reason: z.string().nullable(),
  evidence: z.array(EvidenceSchema),
  measured: z.boolean(),
});

export type CheckScore = z.infer<typeof CheckSchema>;

const Category = z.object({
  score: z.number().int().min(0),
  max: z.number().int().min(1),
  checks: z.array(CheckSchema).min(1),
});

export type CategoryScore = z.infer<typeof Category>;

// Every piece of feedback carries at least one piece of evidence; anything without is dropped before saving.
const Fix = z.object({
  title: Text(90),
  problem: Text(320),
  fix: Text(420),
  evidence: z.array(EvidenceSchema).min(1),
});

const Point = z.object({ point: Text(120), why: Text(320), evidence: z.array(EvidenceSchema).min(1) });

export const POST_FORMATS = ["Reel", "Carousel", "Single image", "Story"] as const;
export const PLAN_FORMATS = ["Reel", "Carousel", "Single image", "Stories", "Engage", "Rest"] as const;

const PostIdea = z.object({
  title: Text(110),
  format: z.enum(POST_FORMATS),
  hook: Text(200),
  why: Text(280),
});

const PlanDay = z.object({
  day: z.number().int().min(1).max(30),
  format: z.enum(PLAN_FORMATS),
  task: Text(220),
});

/** The paid sections. Generated with the free score but only sent to the browser once payment is confirmed. */
export const FullReportSchema = z.object({
  keep: z.array(Point).max(5),
  stop: z.array(Point).max(5),
  start: z.array(Point).max(5),
  bio: z.object({
    // Instagram limits: 64 characters for the name field, 150 for the bio.
    name: Text(64),
    text: Text(150).refine((t) => [...t].length <= 150, "Bio is over 150 characters"),
    why: Text(320),
  }),
  postIdeas: z.array(PostIdea).min(1).max(10),
  plan: z.object({
    summary: Text(320),
    days: z
      .array(PlanDay)
      .min(1)
      .max(30)
      .refine((days) => days.every((d, i) => d.day === i + 1), "Plan days must run from day 1 in order"),
  }),
});

const FactSchema = z.object({ id: z.string(), label: z.string(), value: z.string(), note: z.string().optional() });

const BenchmarkSchema = z.object({
  range: z.string(),
  low: z.number(),
  high: z.number(),
  rate: z.number(),
  position: z.enum(["below", "within", "above"]),
});

export const ReportSchema = z.object({
  /** Which version of lib/rubric.ts scored it. */
  rubricVersion: z.number().int(),
  /** Out of 100: the category points added up on the server. */
  score: Score,
  verdict: Text(110),
  categories: z.object({
    bio: Category,
    content: Category,
    consistency: Category,
    callToAction: Category,
    goalFit: Category,
  }),
  freeFixes: z.array(Fix).max(3),
  /** The account's numbers, worked out on the server (username lookups only). */
  facts: z.array(FactSchema),
  benchmark: BenchmarkSchema.nullable(),
  full: FullReportSchema,
});

export type Report = z.infer<typeof ReportSchema>;
export type FullReport = z.infer<typeof FullReportSchema>;

/** What was scored: uploaded screenshots, or a public profile looked up by username. */
export const ReportSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("screenshots"), count: z.number().int() }),
  z.object({
    kind: z.literal("profile"),
    username: z.string(),
    fullName: z.string(),
    avatar: z.string().nullable(),
    followers: z.number().nullable(),
    postsCount: z.number().nullable(),
    postsAnalysed: z.number().int(),
    engagementRate: z.number().nullable(),
    postsLast30Days: z.number().int(),
  }),
]);

export type ReportSource = z.infer<typeof ReportSourceSchema>;

export const StoredReportSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  goal: z.enum(GOAL_IDS),
  answers: AnswersSchema,
  report: ReportSchema,
  paid: z.boolean(),
  paidAt: z.string().optional(),
  checkoutSessionId: z.string().optional(),
  demo: z.boolean().optional(),
  source: ReportSourceSchema.optional(),
});

export type StoredReport = z.infer<typeof StoredReportSchema>;

/** Everything the browser may see. `full` stays null until the report is paid for. */
export type PublicReport = Omit<Report, "full"> & {
  id: string;
  createdAt: string;
  goal: StoredReport["goal"];
  paid: boolean;
  demo: boolean;
  source: ReportSource | null;
  full: FullReport | null;
};

export function toPublicReport(stored: StoredReport): PublicReport {
  const { full, ...free } = stored.report;
  return {
    ...free,
    id: stored.id,
    createdAt: stored.createdAt,
    goal: stored.goal,
    paid: stored.paid,
    demo: stored.demo ?? false,
    source: stored.source ?? null,
    full: stored.paid ? full : null,
  };
}

export type ScoreBand = "strong" | "okay" | "weak";

/** Strong from 70%, okay from 45%. Works for the total (out of 100) and for a category (out of 20). */
export function scoreBand(score: number, max = 100): ScoreBand {
  const percent = (score / max) * 100;
  if (percent >= 70) return "strong";
  if (percent >= 45) return "okay";
  return "weak";
}

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

const Category = z.object({ score: Score, note: Text(280) });

const Fix = z.object({
  title: Text(90),
  problem: Text(320),
  fix: Text(420),
});

const Point = z.object({ point: Text(120), why: Text(320) });

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
  keep: z.array(Point).min(1).max(5),
  stop: z.array(Point).min(1).max(5),
  start: z.array(Point).min(1).max(5),
  bio: z.object({
    // Instagram limits: 64 characters for the name field, 150 for the bio.
    name: Text(64),
    text: Text(150),
    why: Text(320),
  }),
  postIdeas: z.array(PostIdea).length(10),
  plan: z.object({
    summary: Text(320),
    days: z
      .array(PlanDay)
      .length(30)
      .refine((days) => days.every((d, i) => d.day === i + 1), "Plan days must run 1 to 30 in order"),
  }),
});

export const ReportSchema = z.object({
  score: Score,
  verdict: Text(110),
  categories: z.object({
    bio: Category,
    content: Category,
    consistency: Category,
    callToAction: Category,
    goalFit: Category,
  }),
  freeFixes: z.array(Fix).min(2).max(3),
  full: FullReportSchema,
});

export type Report = z.infer<typeof ReportSchema>;
export type FullReport = z.infer<typeof FullReportSchema>;

/** What an analysis returns: a report, or a clear reason we couldn't score the screenshots. */
export type AnalysisOutcome =
  | { status: "ok"; report: Report }
  | { status: "not_instagram" | "unreadable"; message: string };

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

export function scoreBand(score: number): ScoreBand {
  if (score >= 70) return "strong";
  if (score >= 45) return "okay";
  return "weak";
}

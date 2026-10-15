import { NextResponse } from "next/server";
import { z } from "zod";
import type { AnalysisSource } from "@/lib/analysis-prompt";
import { analyzeAccount } from "@/lib/analyze";
import { aiMode } from "@/lib/config";
import { AnswersSchema, GOAL_IDS } from "@/lib/goals";
import { newReportId } from "@/lib/ids";
import { readScreenshots } from "@/lib/images";
import { parseInstagramHandle } from "@/lib/instagram-handle";
import { lookupProfile } from "@/lib/lookup";
import { profileMetrics } from "@/lib/lookup/metrics";
import { ANALYSIS_LIMITS, checkRateLimit, visitorKey } from "@/lib/ratelimit";
import type { ReportSource } from "@/lib/report";
import { saveReport } from "@/lib/store";

// Reading the account and writing the full report can take a minute or two.
export const maxDuration = 300;

const error = (status: number, code: string, message: string, extra?: Record<string, unknown>, headers?: HeadersInit) =>
  NextResponse.json({ error: code, message, ...extra }, { status, headers });

/**
 * Scores an account from either a username (looked up, usually straight from the 24-hour cache the
 * lookup step just filled) or 2 to 5 uploaded screenshots.
 */
export async function POST(request: Request) {
  const visitor = visitorKey(request.headers);
  // Only real analyses cost money, so only those are rate limited.
  if (aiMode() === "live") {
    const limit = await checkRateLimit(visitor, ANALYSIS_LIMITS);
    if (!limit.ok) {
      const message =
        limit.scope === "global"
          ? "We've hit today's limit for new scores. Please try again tomorrow."
          : "You've run a few scores in a row. Please wait a little and try again.";
      return error(429, "rate_limited", message, undefined, { "Retry-After": String(limit.retryAfterSeconds) });
    }
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "bad_request", "That didn't come through. Please try again.");
  }

  const goal = z.enum(GOAL_IDS).safeParse(form.get("goal"));
  let answersJson: unknown = null;
  try {
    answersJson = JSON.parse(String(form.get("answers") ?? ""));
  } catch {}
  const answers = AnswersSchema.safeParse(answersJson);
  if (!goal.success || !answers.success) {
    return error(400, "bad_request", "Some answers are missing. Go back and check the questions.");
  }

  let source: AnalysisSource;
  let reportSource: ReportSource;
  const handle = form.get("username");
  if (typeof handle === "string") {
    const parsed = parseInstagramHandle(handle);
    if (!parsed.ok) return error(400, "invalid", parsed.message);
    // The lookup also checks the data is complete (bio, counts, 9 recent posts with pictures and dates).
    const lookup = await lookupProfile(parsed.username, visitor);
    // Any lookup problem, including incomplete data, sends the browser to screenshot upload instead.
    if (lookup.status !== "ok") return error(422, lookup.status, lookup.message, { fallback: "screenshots" });
    const { profile } = lookup.result;
    const metrics = profileMetrics(profile);
    const avatar = lookup.result.images.find((img) => img.id === "avatar");
    source = { kind: "profile", lookup: lookup.result };
    reportSource = {
      kind: "profile",
      username: profile.username,
      fullName: profile.fullName,
      avatar: avatar ? `data:${avatar.mediaType};base64,${avatar.data}` : null,
      followers: profile.followers,
      postsCount: profile.postsCount,
      postsAnalysed: metrics.postsAnalysed,
      engagementRate: metrics.engagementRate,
      postsLast30Days: metrics.postsLast30Days,
    };
  } else {
    // Screenshots only ever live in this function's memory. They're never written to disk or storage,
    // and are gone as soon as this request finishes.
    const screenshots = await readScreenshots(form.getAll("screenshots"));
    if (!screenshots.ok) return error(400, "bad_upload", screenshots.error);
    source = { kind: "screenshots", screenshots: screenshots.images };
    reportSource = { kind: "screenshots", count: screenshots.images.length };
  }

  let outcome;
  try {
    outcome = await analyzeAccount({ goal: goal.data, answers: answers.data, source });
  } catch (err) {
    console.error("analysis failed", err);
    return error(502, "analysis_failed", "Something went wrong while scoring your profile. Please try again.");
  }

  if (outcome.status !== "ok") return error(422, outcome.status, outcome.message);

  const id = newReportId();
  await saveReport({
    id,
    createdAt: new Date().toISOString(),
    goal: goal.data,
    answers: answers.data,
    report: outcome.report,
    paid: false,
    demo: aiMode() === "mock",
    source: reportSource,
  });
  return NextResponse.json({ id });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuthorised } from "@/lib/admin";
import { analyzeAccount } from "@/lib/analyze";
import { AnswersSchema, GOAL_IDS } from "@/lib/goals";
import { parseInstagramHandle } from "@/lib/instagram-handle";
import { lookupProfile } from "@/lib/lookup";
import { CATEGORIES } from "@/lib/report";

// A lookup plus a full analysis.
export const maxDuration = 300;

const Body = z.object({ username: z.string(), goal: z.enum(GOAL_IDS), answers: AnswersSchema });

/**
 * For the hidden test page: scores one username exactly as the site would (same lookup, data check,
 * analysis and scoring), without saving a report and without the visitor rate limits.
 */
export async function POST(request: Request) {
  if (!adminAuthorised(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ ok: false, error: "unauthorised", message: "Wrong or missing admin token." }, { status: 401 });
  }
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ ok: false, error: "bad_request", message: "Missing username, goal or answers." }, { status: 400 });

  const handle = parseInstagramHandle(body.data.username);
  if (!handle.ok) return NextResponse.json({ ok: false, username: body.data.username, error: "invalid", message: handle.message });
  const username = handle.username;
  const started = Date.now();

  const lookup = await lookupProfile(username, "admin", { skipRateLimit: true });
  if (lookup.status !== "ok") return NextResponse.json({ ok: false, username, error: lookup.status, message: lookup.message });

  try {
    const outcome = await analyzeAccount({ goal: body.data.goal, answers: body.data.answers, source: { kind: "profile", lookup: lookup.result } });
    if (outcome.status !== "ok") return NextResponse.json({ ok: false, username, error: outcome.status, message: outcome.message });
    const { report } = outcome;
    const fact = (id: string) => report.facts.find((f) => f.id === id)?.value ?? null;
    return NextResponse.json({
      ok: true,
      username,
      cachedLookup: lookup.cached,
      score: report.score,
      verdict: report.verdict,
      rubricVersion: report.rubricVersion,
      categories: Object.fromEntries(
        CATEGORIES.map(({ key }) => {
          const c = report.categories[key];
          return [key, { score: c.score, max: c.max, checks: c.checks.map(({ evidence: _e, ...check }) => check) }];
        }),
      ),
      engagement: report.benchmark,
      postsPerWeek: fact("posts_per_week"),
      fixes: report.freeFixes.map((f) => f.title),
      audit: outcome.audit,
      meta: { ...outcome.meta, totalMs: Date.now() - started },
    });
  } catch (err) {
    console.error("admin analysis failed", err);
    return NextResponse.json({ ok: false, username, error: "analysis_failed", message: err instanceof Error ? err.message : "Analysis failed" });
  }
}

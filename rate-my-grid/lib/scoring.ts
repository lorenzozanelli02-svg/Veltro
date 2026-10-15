import type { AiAnalysis, AiEvidence } from "./analysis-schema";
import type { Fact } from "./facts";
import type { GoalId } from "./goals";
import type { ProfileMetrics } from "./lookup/metrics";
import type { Profile } from "./lookup/types";
import { ReportSchema, type CategoryScore, type CheckScore, type Evidence, type Report } from "./report";
import { pointsFor, RUBRIC_VERSION, rubricFor, type RubricCategoryKey } from "./rubric";

/**
 * Turns the AI's judgements into a scored report:
 * - measured checks are scored here from the numbers (username lookups);
 * - every piece of evidence is checked against the real profile (quotes must really be in the bio or
 *   caption, posts and screenshots must exist, facts must be ones we gave it), and feedback left with
 *   no evidence is dropped;
 * - points come from the rubric, and the total is added up here, out of 100.
 */

/** What we know about the account, to verify evidence against. */
export type ScoringContext =
  | { kind: "profile"; profile: Profile; metrics: ProfileMetrics; facts: Fact[] }
  | { kind: "screenshots"; count: number };

/** What was thrown away or couldn't be checked, for the admin test page and the logs. */
export type ScoringAudit = { droppedFeedback: number; unverifiedChecks: string[]; droppedEvidence: number };

// Emoji variation selectors and joiners are often lost when a quote is copied, so they're ignored.
const normalise = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[︎️‍]/g, "")
    .replace(/[“”"'‘’`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** True when every part of the quote (split at "..." or "…") appears, in order, in the text. */
export function quoteIsIn(text: string, quote: string) {
  const haystack = normalise(text);
  const parts = quote.split(/\.{3}|…/).map(normalise).filter(Boolean);
  if (!parts.length) return false;
  let from = 0;
  for (const part of parts) {
    const at = haystack.indexOf(part, from);
    if (at === -1) return false;
    from = at + part.length;
  }
  return true;
}

// The note on its own when it already contains the value ("33% Reels and videos, ..."), otherwise both.
const factText = (fact: Fact) => (!fact.note ? fact.value : fact.note.startsWith(fact.value) ? fact.note : `${fact.value} (${fact.note})`);

const clip = (text: string, max: number) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).trimEnd()}…`;
};

/** Checks one piece of evidence against the profile and turns it into something to show. Null if it doesn't hold up. */
export function verifyEvidence(e: AiEvidence, ctx: ScoringContext): Evidence | null {
  switch (e.kind) {
    case "bio": {
      if (ctx.kind === "screenshots") return e.quote.trim() ? { kind: "bio", label: "Your bio", text: clip(e.quote, 400) } : null;
      const bio = ctx.profile.bio ?? "";
      if (!e.quote.trim()) return bio.trim() ? null : { kind: "bio", label: "Your bio", text: "(empty)" };
      return quoteIsIn(bio, e.quote) ? { kind: "bio", label: "Your bio", text: clip(e.quote, 400) } : null;
    }
    case "name": {
      if (!e.quote.trim()) return null;
      if (ctx.kind === "profile" && !quoteIsIn(ctx.profile.fullName, e.quote)) return null;
      return { kind: "name", label: "Your name field", text: clip(e.quote, 400) };
    }
    case "post": {
      const quote = e.caption_quote.trim();
      const detail = e.detail.trim();
      if (ctx.kind === "screenshots") return detail || quote ? { kind: "post", label: "A recent post", text: clip(quote ? `“${quote}”` : detail, 400) } : null;
      const post = ctx.profile.posts[e.post - 1];
      if (!post) return null;
      if (quote && !quoteIsIn(post.caption, quote)) return null;
      if (!quote && !detail) return null;
      return { kind: "post", label: `Post ${e.post}`, text: clip(quote ? `“${quote}”` : detail, 400) };
    }
    case "fact": {
      if (ctx.kind === "screenshots") return null;
      const fact = ctx.facts.find((f) => f.id === e.fact);
      return fact ? { kind: "fact", label: fact.label, text: clip(factText(fact), 400) } : null;
    }
    case "screenshot": {
      if (ctx.kind === "profile" || e.screenshot < 1 || e.screenshot > ctx.count || !e.detail.trim()) return null;
      return { kind: "screenshot", label: `Screenshot ${e.screenshot}`, text: clip(e.detail, 400) };
    }
  }
}

/** Keeps the bio within Instagram's 150 characters: drop middle lines first (keeping the call to action), then shorten. */
export function fitBio(text: string, max = 150) {
  const length = (t: string) => [...t].length;
  let lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  while (length(lines.join("\n")) > max && lines.length > 2) lines = [lines[0], ...lines.slice(2)];
  let result = lines.join("\n");
  while (length(result) > max) {
    const [first, ...rest] = result.split("\n");
    const words = first.split(" ");
    if (words.length <= 1) return [...result].slice(0, max).join("");
    result = [words.slice(0, -1).join(" "), ...rest].join("\n");
  }
  return result;
}

export function scoreAnalysis(goal: GoalId, ai: NonNullable<AiAnalysis["report"]>, ctx: ScoringContext): { report: Report; audit: ScoringAudit } {
  const audit: ScoringAudit = { droppedFeedback: 0, unverifiedChecks: [], droppedEvidence: 0 };
  const verifyAll = (items: AiEvidence[]) => {
    const verified = items.map((e) => verifyEvidence(e, ctx)).filter((e): e is Evidence => e !== null);
    audit.droppedEvidence += items.length - verified.length;
    return verified;
  };

  const categories = {} as Record<RubricCategoryKey, CategoryScore>;
  let total = 0;
  let totalMax = 0;
  for (const category of rubricFor(goal)) {
    const checks: CheckScore[] = category.checks.map((check) => {
      const base = { id: check.id, label: check.label, max: check.points };
      if (check.measure && ctx.kind === "profile") {
        const m = check.measure({ profile: ctx.profile, metrics: ctx.metrics });
        const fact = ctx.facts.find((f) => f.id === m.fact);
        return {
          ...base,
          result: m.result,
          points: pointsFor(check, m.result),
          reason: m.reason,
          evidence: fact ? [{ kind: "fact", label: fact.label, text: clip(factText(fact), 400) }] : [],
          measured: true,
        };
      }
      const answer = ai.checks[check.id];
      if (!answer) {
        audit.unverifiedChecks.push(check.id);
        return { ...base, result: "not_met", points: 0, reason: null, evidence: [], measured: false };
      }
      const evidence = verifyAll(answer.evidence);
      // The judgement stands, but a comment we can't tie to their profile isn't shown.
      if (!evidence.length) {
        audit.unverifiedChecks.push(check.id);
        if (answer.reason.trim()) audit.droppedFeedback++;
      }
      return {
        ...base,
        result: answer.result,
        points: pointsFor(check, answer.result),
        reason: evidence.length ? clip(answer.reason, 320) : null,
        evidence,
        measured: false,
      };
    });
    const score = checks.reduce((sum, c) => sum + c.points, 0);
    const max = checks.reduce((sum, c) => sum + c.max, 0);
    categories[category.key] = { score, max, checks };
    total += score;
    totalMax += max;
  }

  const withEvidence = <T extends { evidence: AiEvidence[] }>(items: T[], limit: number) =>
    items
      .map((item) => ({ ...item, evidence: verifyAll(item.evidence) }))
      .filter((item) => {
        if (item.evidence.length) return true;
        audit.droppedFeedback++;
        return false;
      })
      .slice(0, limit);

  const points = (items: NonNullable<AiAnalysis["report"]>["keep"]) =>
    withEvidence(items, 5).map((p) => ({ point: clip(p.point, 120), why: clip(p.why, 320), evidence: p.evidence }));

  const days = [...ai.plan.days].sort((a, b) => a.day - b.day).slice(0, 30);

  const report: Report = {
    rubricVersion: RUBRIC_VERSION,
    score: Math.round((total / totalMax) * 100),
    verdict: clip(ai.verdict, 110),
    categories,
    freeFixes: withEvidence(ai.free_fixes, 3).map((f) => ({
      title: clip(f.title, 90),
      problem: clip(f.problem, 320),
      fix: clip(f.fix, 420),
      evidence: f.evidence,
    })),
    facts: ctx.kind === "profile" ? ctx.facts : [],
    benchmark: ctx.kind === "profile" ? ctx.metrics.benchmark : null,
    full: {
      keep: points(ai.keep),
      stop: points(ai.stop),
      start: points(ai.start),
      bio: { name: clip(ai.bio.name, 64), text: fitBio(ai.bio.text), why: clip(ai.bio.why, 320) },
      postIdeas: ai.post_ideas.slice(0, 10).map((p) => ({ title: clip(p.title, 110), format: p.format, hook: clip(p.hook, 200), why: clip(p.why, 280) })),
      plan: {
        summary: clip(ai.plan.summary, 320),
        days: days.map((d, i) => ({ day: i + 1, format: d.format, task: clip(d.task, 220) })),
      },
    },
  };
  return { report: ReportSchema.parse(report), audit };
}

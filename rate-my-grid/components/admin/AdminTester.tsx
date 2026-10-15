"use client";

import { ChevronDown, Loader2, Play, Repeat } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { ACTIONS, FREQUENCIES, GOALS, goalById, type Answers, type GoalId } from "@/lib/goals";
import { CATEGORIES, scoreBand, type CategoryKey } from "@/lib/report";
import { buttonClass } from "../Button";

type CheckRow = { id: string; label: string; result: "met" | "partly" | "not_met"; points: number; max: number; reason: string | null; measured: boolean };

type Run =
  | {
      ok: true;
      username: string;
      cachedLookup: boolean;
      score: number;
      verdict: string;
      categories: Record<CategoryKey, { score: number; max: number; checks: CheckRow[] }>;
      engagement: { rate: number; low: number; high: number; position: "below" | "within" | "above" } | null;
      postsPerWeek: string | null;
      fixes: string[];
      audit: { droppedFeedback: number; unverifiedChecks: string[]; droppedEvidence: number };
      meta: { model: string; ms: number; totalMs: number; inputTokens: number | null; outputTokens: number | null };
    }
  | { ok: false; username: string; error: string; message: string };

type Row = { status: "queued" | "running" | "done"; run?: Run; repeats?: { running: boolean; runs: Run[] }; open?: boolean };

const TOKEN_KEY = "rmg-admin-token";
const SHORT: Record<CategoryKey, string> = { bio: "Bio", content: "Content", consistency: "Consist.", callToAction: "CTA", goalFit: "Fit" };
const BAND_TEXT = { strong: "text-accent", okay: "text-warn", weak: "text-bad" } as const;
const RESULT_TEXT = { met: "text-accent", partly: "text-warn", not_met: "text-bad" } as const;

const hint = (text: string) => text.replace(/^e\.g\.\s*/, "");
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const field = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px] text-ink focus:border-accent focus:outline-none";

/** Spread of a set of numbers, coloured: within 2 points is steady, within 5 is fair, more is a problem. */
function Spread({ values }: { values: number[] }) {
  const spread = Math.max(...values) - Math.min(...values);
  const tone = spread <= 2 ? "text-accent" : spread <= 5 ? "text-warn" : "text-bad";
  return <span className={`font-semibold tabular-nums ${tone}`}>±{spread}</span>;
}

function RunDetails({ run }: { run: Extract<Run, { ok: true }> }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="space-y-3 text-sm">
        <p className="font-display text-xl leading-tight font-extrabold uppercase">&ldquo;{run.verdict}&rdquo;</p>
        <p className="text-muted">
          Fixes: <span className="text-ink/90">{run.fixes.join(" · ") || "none"}</span>
        </p>
        <p className="text-muted">
          Evidence: {run.audit.droppedEvidence} item{run.audit.droppedEvidence === 1 ? "" : "s"} rejected, {run.audit.droppedFeedback} comment
          {run.audit.droppedFeedback === 1 ? "" : "s"} dropped
          {run.audit.unverifiedChecks.length ? ` (no evidence for: ${run.audit.unverifiedChecks.join(", ")})` : ""}.
        </p>
        <p className="text-muted">
          {run.meta.model} · analysis {seconds(run.meta.ms)} · total {seconds(run.meta.totalMs)}
          {run.meta.inputTokens !== null && ` · ${run.meta.inputTokens.toLocaleString("en-GB")} in / ${run.meta.outputTokens?.toLocaleString("en-GB")} out tokens`}
          {run.cachedLookup ? " · lookup from cache" : " · fresh lookup"}
        </p>
      </div>
      <div className="space-y-4">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <p className="text-sm font-semibold">
              {label} <span className="text-muted tabular-nums">{run.categories[key].score}/{run.categories[key].max}</span>
            </p>
            <ul className="mt-1.5 space-y-1 text-sm">
              {run.categories[key].checks.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span className={`w-12 shrink-0 tabular-nums ${RESULT_TEXT[c.result]}`}>
                    {c.points}/{c.max}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold">{c.label}</span>
                    {c.measured && <span className="ml-1.5 text-xs text-muted">(measured)</span>}
                    {c.reason && <span className="text-muted"> · {c.reason}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The same account scored three times: totals and categories side by side, and the checks that changed. */
function Repeats({ runs, running }: { runs: Run[]; running: boolean }) {
  const ok = runs.filter((r): r is Extract<Run, { ok: true }> => r.ok);
  const failed = runs.filter((r) => !r.ok);
  const changed = ok.length
    ? CATEGORIES.flatMap(({ key }) =>
        ok[0].categories[key].checks
          .filter((check) => ok.some((r) => r.categories[key].checks.find((c) => c.id === check.id)?.result !== check.result))
          .map((check) => ({ label: check.label, results: ok.map((r) => r.categories[key].checks.find((c) => c.id === check.id)?.result ?? "?") })),
      )
    : [];
  return (
    <div className="rounded-xl border border-line bg-bg/60 p-4">
      <p className="text-sm font-semibold">
        Consistency: {ok.length} of 3 runs done{running && <Loader2 aria-hidden="true" className="ml-2 inline size-4 animate-spin text-accent" />}
      </p>
      {ok.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="text-sm tabular-nums">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1 pr-6 font-medium">Run</th>
                <th className="py-1 pr-6 font-medium">Total</th>
                {CATEGORIES.map(({ key }) => (
                  <th key={key} className="py-1 pr-6 font-medium">
                    {SHORT[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ok.map((r, i) => (
                <tr key={i}>
                  <td className="py-1 pr-6 text-muted">{i + 1}</td>
                  <td className="py-1 pr-6 font-semibold">{r.score}</td>
                  {CATEGORIES.map(({ key }) => (
                    <td key={key} className="py-1 pr-6">
                      {r.categories[key].score}
                    </td>
                  ))}
                </tr>
              ))}
              {ok.length > 1 && (
                <tr className="border-t border-line">
                  <td className="py-1 pr-6 text-muted">Spread</td>
                  <td className="py-1 pr-6">
                    <Spread values={ok.map((r) => r.score)} />
                  </td>
                  {CATEGORIES.map(({ key }) => (
                    <td key={key} className="py-1 pr-6">
                      <Spread values={ok.map((r) => r.categories[key].score)} />
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {ok.length > 1 && (
        <p className="mt-3 text-sm text-muted">
          {changed.length === 0
            ? "Every check got the same result each time."
            : `Checks that changed: ${changed.map((c) => `${c.label} (${c.results.join(" / ").replaceAll("_", " ")})`).join("; ")}.`}
        </p>
      )}
      {failed.map((f, i) => (
        <p key={i} className="mt-2 text-sm text-bad">
          {!f.ok && f.message}
        </p>
      ))}
    </div>
  );
}

export function AdminTester({ needsToken, demo }: { needsToken: boolean; demo: boolean }) {
  const [token, setToken] = useState("");
  const [goal, setGoal] = useState<GoalId>("clients");
  const [answers, setAnswers] = useState<Answers>({
    customer: hint(goalById("clients").customerHint),
    offer: hint(goalById("clients").offerHint),
    frequency: "weekly-plus",
    action: "book",
  });
  const [list, setList] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(TOKEN_KEY) ?? "");
    } catch {}
  }, []);

  const update = (username: string, change: (row: Row) => Row) => setRows((all) => ({ ...all, [username]: change(all[username] ?? { status: "queued" }) }));

  async function score(username: string): Promise<Run> {
    try {
      const res = await fetch("/api/admin/score", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ username, goal, answers }),
      });
      return (await res.json()) as Run;
    } catch {
      return { ok: false, username, error: "network", message: "The request failed." };
    }
  }

  async function scoreAll() {
    const names = [...new Set(list.split(/[\s,]+/).map((n) => n.trim()).filter(Boolean))];
    if (!names.length) return;
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {}
    setBusy(true);
    setOrder(names);
    setRows(Object.fromEntries(names.map((n) => [n, { status: "queued" } as Row])));
    // Two at a time: quick enough, without hammering the lookup or the API.
    const queue = [...names];
    const worker = async () => {
      for (let name = queue.shift(); name; name = queue.shift()) {
        update(name, (r) => ({ ...r, status: "running" }));
        const run = await score(name);
        update(name, (r) => ({ ...r, status: "done", run }));
      }
    };
    await Promise.all([worker(), worker()]);
    setBusy(false);
  }

  async function runThree(username: string) {
    update(username, (r) => ({ ...r, open: true, repeats: { running: true, runs: [] } }));
    // One after another, so all three use the same cached lookup and only the AI varies.
    for (let i = 0; i < 3; i++) {
      const run = await score(username);
      update(username, (r) => ({ ...r, repeats: { running: i < 2, runs: [...(r.repeats?.runs ?? []), run] } }));
    }
  }

  return (
    <div className="space-y-8">
      {demo && (
        <p className="rounded-2xl border border-warn/40 bg-warn/8 px-4 py-3 text-sm leading-relaxed text-warn">
          The AI isn&rsquo;t connected, so these are mock answers: every run of the same account scores the same. Set ANTHROPIC_API_KEY to test the real
          thing.
        </p>
      )}

      <div className="grid gap-4 rounded-2xl border border-line bg-surface/80 p-5 sm:p-6 lg:grid-cols-2">
        {needsToken && (
          <label className="block lg:col-span-2">
            <span className="text-sm font-semibold">Admin token</span>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" className={`mt-1.5 ${field}`} />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-semibold">Goal</span>
          <select
            value={goal}
            onChange={(e) => {
              const next = e.target.value as GoalId;
              setGoal(next);
              setAnswers((a) => ({ ...a, customer: hint(goalById(next).customerHint), offer: hint(goalById(next).offerHint) }));
            }}
            className={`mt-1.5 ${field}`}
          >
            {GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Ideal customer</span>
          <input value={answers.customer} onChange={(e) => setAnswers({ ...answers, customer: e.target.value })} className={`mt-1.5 ${field}`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">What they sell</span>
          <input value={answers.offer} onChange={(e) => setAnswers({ ...answers, offer: e.target.value })} className={`mt-1.5 ${field}`} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">Posts</span>
            <select value={answers.frequency} onChange={(e) => setAnswers({ ...answers, frequency: e.target.value as Answers["frequency"] })} className={`mt-1.5 ${field}`}>
              {FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Next step</span>
            <select value={answers.action} onChange={(e) => setAnswers({ ...answers, action: e.target.value as Answers["action"] })} className={`mt-1.5 ${field}`}>
              {ACTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold">Usernames or profile links, one per line</span>
          <textarea
            value={list}
            onChange={(e) => setList(e.target.value)}
            rows={4}
            placeholder={"natgeo\n@someone\nhttps://instagram.com/another"}
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[15px] text-ink focus:border-accent focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
          <button type="button" onClick={scoreAll} disabled={busy || !list.trim()} className={buttonClass({ size: "sm" })}>
            {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Play aria-hidden="true" className="size-4" />}
            {busy ? "Scoring" : "Score them all"}
          </button>
          <p className="text-sm text-muted">Each run is a real analysis, and a real lookup unless the account was looked up in the last 24 hours.</p>
        </div>
      </div>

      {order.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[56rem] text-left text-sm tabular-nums">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-3 py-3 font-medium">Total</th>
                {CATEGORIES.map(({ key }) => (
                  <th key={key} className="px-3 py-3 font-medium">
                    {SHORT[key]}
                  </th>
                ))}
                <th className="px-3 py-3 font-medium">Engagement</th>
                <th className="px-3 py-3 font-medium">Posts/wk</th>
                <th className="px-3 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.map((name) => {
                const row = rows[name];
                const run = row?.run;
                return (
                  <Fragment key={name}>
                    <tr className="align-top">
                      <td className="px-4 py-3 font-semibold">@{run?.username ?? name}</td>
                      {run?.ok ? (
                        <>
                          <td className={`px-3 py-3 text-base font-bold ${BAND_TEXT[scoreBand(run.score)]}`}>{run.score}</td>
                          {CATEGORIES.map(({ key }) => (
                            <td key={key} className={`px-3 py-3 ${BAND_TEXT[scoreBand(run.categories[key].score, run.categories[key].max)]}`}>
                              {run.categories[key].score}
                            </td>
                          ))}
                          <td className="px-3 py-3">
                            {run.engagement ? (
                              <span>
                                {run.engagement.rate}% <span className="text-muted">({run.engagement.position})</span>
                              </span>
                            ) : (
                              "–"
                            )}
                          </td>
                          <td className="px-3 py-3">{run.postsPerWeek ?? "–"}</td>
                          <td className="px-3 py-3 text-muted">{seconds(run.meta.totalMs)}</td>
                        </>
                      ) : (
                        <td colSpan={9} className="px-3 py-3 text-muted">
                          {row?.status === "running" ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 aria-hidden="true" className="size-4 animate-spin text-accent" />
                              Scoring
                            </span>
                          ) : row?.status === "queued" ? (
                            "Waiting"
                          ) : (
                            <span className="text-bad">{run && !run.ok ? `${run.error}: ${run.message}` : ""}</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {run?.ok && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => runThree(name)}
                              disabled={row?.repeats?.running}
                              className={buttonClass({ size: "sm", variant: "secondary", className: "min-h-8 px-3 text-xs whitespace-nowrap" })}
                            >
                              <Repeat aria-hidden="true" className="size-3.5" />
                              Run 3×
                            </button>
                            <button
                              type="button"
                              onClick={() => update(name, (r) => ({ ...r, open: !r.open }))}
                              aria-expanded={Boolean(row?.open)}
                              className={buttonClass({ size: "sm", variant: "secondary", className: "min-h-8 px-3 text-xs whitespace-nowrap" })}
                            >
                              Details
                              <ChevronDown aria-hidden="true" className={`size-3.5 transition-transform ${row?.open ? "rotate-180" : ""}`} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {row?.open && run?.ok && (
                      <tr>
                        <td colSpan={12} className="space-y-4 bg-surface/50 px-4 py-5">
                          {row.repeats && <Repeats runs={row.repeats.runs} running={row.repeats.running} />}
                          <RunDetails run={run} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnswersSchema, GOAL_IDS, type GoalId } from "@/lib/goals";
import { parseInstagramHandle } from "@/lib/instagram-handle";
import type { ProfilePreview } from "@/lib/lookup/types";
import { Logo } from "../Logo";
import { AccountStep } from "./AccountStep";
import { Analyzing } from "./Analyzing";
import { DetailsStep, EMPTY_ANSWERS, type DraftAnswers } from "./DetailsStep";
import { GoalStep } from "./GoalStep";
import { UploadStep, type Shot, type SubmitError } from "./UploadStep";

const STEPS = ["goal", "details", "account"] as const;
type Step = (typeof STEPS)[number];
const STEP_LABELS: Record<Step, string> = { goal: "Your goal", details: "Questions", account: "Your account" };

const DRAFT_KEY = "rmg-draft";

/**
 * The scoring flow. It lives on the home page and takes over the screen while `?step=` is set, so the
 * phone's back gesture moves between steps and every step has a real URL.
 */
export function ScoreFlow() {
  const router = useRouter();
  const param = useSearchParams().get("step");
  const step = (STEPS as readonly string[]).includes(param ?? "") ? (param as Step) : null;

  const [restored, setRestored] = useState(false);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [answers, setAnswers] = useState<DraftAnswers>(EMPTY_ANSWERS);
  const [shots, setShots] = useState<Shot[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);

  // The account step: look up a username, or upload screenshots when that isn't possible.
  const [mode, setMode] = useState<"username" | "screenshots">("username");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [looking, setLooking] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfilePreview | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const forwardSteps = useRef(0);

  const open = step !== null || analyzing;

  // Instagram's in-app browser sometimes reloads the page; keep the goal and answers for this tab.
  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
      if (draft && GOAL_IDS.includes(draft.goal)) setGoal(draft.goal);
      if (draft?.answers) setAnswers({ ...EMPTY_ANSWERS, ...draft.answers });
      if (typeof draft?.handle === "string") setHandle(draft.handle);
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ goal, answers, handle }));
    } catch {}
  }, [restored, goal, answers, handle]);

  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-flow", open);
    return () => document.documentElement.removeAttribute("data-flow");
  }, [open]);

  useEffect(() => {
    if (open) window.scrollTo(0, 0);
  }, [open, step, analyzing, mode, profile]);

  // Arriving on a later step without the earlier answers (a shared link, a reload): go back to what's missing.
  useEffect(() => {
    if (!restored || analyzing) return;
    if ((step === "details" || step === "account") && !goal) router.replace("/?step=goal", { scroll: false });
    else if (step === "account" && !AnswersSchema.safeParse(answers).success) router.replace("/?step=details", { scroll: false });
  }, [restored, analyzing, step, goal, answers, router]);

  function go(next: Step) {
    forwardSteps.current += 1;
    router.push(`/?step=${next}`, { scroll: false });
  }

  function back() {
    if (forwardSteps.current > 0) {
      forwardSteps.current -= 1;
      router.back();
      return;
    }
    const index = step ? STEPS.indexOf(step) : 0;
    router.replace(index > 0 ? `/?step=${STEPS[index - 1]}` : "/", { scroll: false });
  }

  /** Never a dead end: whenever a lookup can't be used, explain why and offer screenshot upload. */
  function switchToScreenshots(message: string | null) {
    setNotice(message);
    setProfile(null);
    setMode("screenshots");
  }

  function switchToUsername() {
    setNotice(null);
    setError(null);
    setMode("username");
  }

  async function lookUp() {
    const parsed = parseInstagramHandle(handle);
    if (!parsed.ok) {
      setHandleError(parsed.message);
      return;
    }
    setHandleError(null);
    setError(null);
    setLooking(parsed.username);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: parsed.username }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.profile) setProfile(data.profile);
      else if (res.status === 400) setHandleError(data.message ?? "That doesn't look like an Instagram username.");
      else switchToScreenshots(data.message ?? `We couldn't look up @${parsed.username} just now. Add a few screenshots instead.`);
    } catch {
      switchToScreenshots("We couldn't reach Instagram just now. Add a few screenshots instead and you'll still get your score.");
    }
    setLooking(null);
  }

  async function submit() {
    if (!goal) return;
    setError(null);
    setAnalyzing(true);
    const form = new FormData();
    form.set("goal", goal);
    form.set("answers", JSON.stringify(answers));
    if (mode === "username" && profile) form.set("username", profile.username);
    else shots.forEach((shot, i) => form.append("screenshots", shot.blob, `screenshot-${i + 1}.jpg`));
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.id === "string") {
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {}
        router.push(`/r/${data.id}`);
        return;
      }
      if (data.fallback === "screenshots") {
        switchToScreenshots(data.message ?? null);
        setAnalyzing(false);
        return;
      }
      setError({
        code: data.error ?? "error",
        message: data.message ?? "Something went wrong while scoring your profile. Please try again.",
      });
    } catch {
      setError({ code: "network", message: "We lost the connection. Check your signal and try again." });
    }
    setAnalyzing(false);
  }

  if (!open) return null;

  const index = step ? STEPS.indexOf(step) : STEPS.length - 1;

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(80%_70%_at_50%_0%,rgb(221_42_123/0.1),transparent_70%)]" />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        {/* Phone: back, logo, close. Computer: logo on the left, the steps in the middle, close on the right. */}
        <header className="flex h-16 items-center justify-between lg:h-20">
          {analyzing ? (
            <span className="size-11 lg:hidden" />
          ) : (
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              className="-ml-2.5 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink lg:hidden"
            >
              <ArrowLeft aria-hidden="true" className="size-6" />
            </button>
          )}
          <Link href="/" aria-label="Rate My Grid, home">
            <Logo className="text-lg sm:text-xl lg:text-2xl" />
          </Link>
          {!analyzing && (
            <ol className="hidden items-center gap-3 lg:flex" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3" aria-current={i === index ? "step" : undefined}>
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${i <= index ? "bg-ig text-white" : "bg-raised text-muted ring-1 ring-line"}`}
                  >
                    {i < index ? <Check aria-hidden="true" className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`text-sm ${i === index ? "font-semibold text-ink" : "text-muted"}`}>{STEP_LABELS[s]}</span>
                  {i < STEPS.length - 1 && <span aria-hidden="true" className={`h-px w-10 ${i < index ? "bg-accent" : "bg-line"}`} />}
                </li>
              ))}
            </ol>
          )}
          <Link
            href="/"
            aria-label="Close"
            className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
          >
            <X aria-hidden="true" className="size-6" />
          </Link>
        </header>

        {!analyzing && (
          <div className="flex gap-1.5 lg:hidden" aria-label={`Step ${index + 1} of ${STEPS.length}`} role="img">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= index ? "bg-ig" : "bg-line"}`} />
            ))}
          </div>
        )}

        <main key={analyzing ? "analyzing" : step} className="animate-rise flex-1 pt-8 pb-6 lg:pt-10 lg:pb-20">
          {!analyzing && (
            <button
              type="button"
              onClick={back}
              className="mb-8 hidden items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink lg:inline-flex"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </button>
          )}
          {analyzing ? (
            <Analyzing profile={mode === "username" ? profile : null} />
          ) : step === "goal" ? (
            <GoalStep
              value={goal}
              onChoose={(g) => {
                setGoal(g);
                go("details");
              }}
            />
          ) : step === "details" && goal ? (
            <DetailsStep goal={goal} value={answers} onChange={setAnswers} onDone={() => go("account")} />
          ) : step === "account" && mode === "username" ? (
            <AccountStep
              handle={handle}
              onHandleChange={(value) => {
                setHandle(value);
                setHandleError(null);
              }}
              handleError={handleError}
              looking={looking}
              profile={profile}
              onLookup={lookUp}
              onReset={() => {
                setProfile(null);
                setHandle("");
              }}
              onScore={submit}
              onUseScreenshots={() => switchToScreenshots(null)}
            />
          ) : step === "account" ? (
            <UploadStep
              shots={shots}
              onShotsChange={setShots}
              error={error}
              notice={notice}
              onSubmit={submit}
              onUseUsername={switchToUsername}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnswersSchema, GOAL_IDS, type GoalId } from "@/lib/goals";
import { Logo } from "../Logo";
import { Analyzing } from "./Analyzing";
import { DetailsStep, EMPTY_ANSWERS, type DraftAnswers } from "./DetailsStep";
import { GoalStep } from "./GoalStep";
import { UploadStep, type Shot, type SubmitError } from "./UploadStep";

const STEPS = ["goal", "details", "upload"] as const;
type Step = (typeof STEPS)[number];

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
  const forwardSteps = useRef(0);

  const open = step !== null || analyzing;

  // Instagram's in-app browser sometimes reloads the page; keep the goal and answers for this tab.
  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
      if (draft && GOAL_IDS.includes(draft.goal)) setGoal(draft.goal);
      if (draft?.answers) setAnswers({ ...EMPTY_ANSWERS, ...draft.answers });
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ goal, answers }));
    } catch {}
  }, [restored, goal, answers]);

  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-flow", open);
    return () => document.documentElement.removeAttribute("data-flow");
  }, [open]);

  useEffect(() => {
    if (open) window.scrollTo(0, 0);
  }, [open, step, analyzing]);

  // Arriving on a later step without the earlier answers (a shared link, a reload): go back to what's missing.
  useEffect(() => {
    if (!restored || analyzing) return;
    if ((step === "details" || step === "upload") && !goal) router.replace("/?step=goal", { scroll: false });
    else if (step === "upload" && !AnswersSchema.safeParse(answers).success) router.replace("/?step=details", { scroll: false });
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

  async function submit() {
    if (!goal) return;
    setError(null);
    setAnalyzing(true);
    const form = new FormData();
    form.set("goal", goal);
    form.set("answers", JSON.stringify(answers));
    shots.forEach((shot, i) => form.append("screenshots", shot.blob, `screenshot-${i + 1}.jpg`));
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
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(80%_70%_at_50%_0%,rgb(59_229_132/0.1),transparent_70%)]" />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 sm:px-6">
        <header className="flex h-16 items-center justify-between">
          {analyzing ? (
            <span className="size-11" />
          ) : (
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              className="-ml-2.5 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden="true" className="size-6" />
            </button>
          )}
          <Logo className="text-lg sm:text-xl" />
          <Link
            href="/"
            aria-label="Close"
            className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
          >
            <X aria-hidden="true" className="size-6" />
          </Link>
        </header>

        {!analyzing && (
          <div className="flex gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`} role="img">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= index ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
        )}

        <main key={analyzing ? "analyzing" : step} className="animate-rise flex-1 pt-8 pb-6">
          {analyzing ? (
            <Analyzing />
          ) : step === "goal" ? (
            <GoalStep
              value={goal}
              onChoose={(g) => {
                setGoal(g);
                go("details");
              }}
            />
          ) : step === "details" && goal ? (
            <DetailsStep goal={goal} value={answers} onChange={setAnswers} onDone={() => go("upload")} />
          ) : step === "upload" ? (
            <UploadStep shots={shots} onShotsChange={setShots} error={error} onSubmit={submit} />
          ) : null}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading your bio",
  "Checking your grid",
  "Looking at your recent posts",
  "Counting your calls to action",
  "Comparing to accounts that convert",
  "Writing your fixes",
];

/** The bar creeps towards 95% and never claims to be finished; the page moves on when the score is ready. */
function useProgress() {
  const [progress, setProgress] = useState(0.03);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const seconds = (Date.now() - start) / 1000;
      setProgress(0.03 + 0.92 * (1 - Math.exp(-seconds / 28)));
    }, 250);
    return () => clearInterval(timer);
  }, []);
  return progress;
}

export function Analyzing() {
  const [index, setIndex] = useState(0);
  const progress = useProgress();

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <div className="relative size-36" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-2xl" />
        <svg viewBox="0 0 120 120" className="relative size-full animate-spin overflow-visible [animation-duration:1.6s]">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-line)" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="80 247"
            style={{ filter: "drop-shadow(0 0 6px var(--color-accent))" }}
          />
        </svg>
      </div>

      <p className="mt-10 text-xs font-semibold tracking-[0.22em] text-accent uppercase">Scoring your profile</p>
      <p key={index} aria-live="polite" className="animate-rise mt-3 min-h-[2.2em] font-display text-4xl leading-none font-extrabold uppercase sm:text-5xl">
        {MESSAGES[index]}&hellip;
      </p>

      <div className="mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Analysis progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">This usually takes under a minute. Keep this page open.</p>
    </div>
  );
}

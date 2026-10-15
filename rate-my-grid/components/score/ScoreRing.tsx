import { useId } from "react";
import { scoreBand, type ScoreBand } from "@/lib/report";
import { CountUp } from "./PlayWhenVisible";

/** Colour for a score's number: pink when strong, Instagram's yellow when middling, red when weak. */
export const BAND_TEXT: Record<ScoreBand, string> = {
  strong: "text-accent",
  okay: "text-warn",
  weak: "text-bad",
};

/** What a score means, in a few words. */
export const BAND_LABEL: Record<ScoreBand, string> = {
  strong: "Working well",
  okay: "Needs work",
  weak: "Holding you back",
};

/**
 * Big score out of 100 inside a ring that fills to the score in the Instagram gradient, like an activity
 * ring. With `countUp`, the number counts up as the ring fills.
 */
export function ScoreRing({
  score,
  className = "",
  label = true,
  countUp = false,
}: {
  score: number;
  className?: string;
  label?: boolean;
  countUp?: boolean;
}) {
  const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (c * score) / 100;
  return (
    <div className={`@container relative aspect-square ${className}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90 overflow-visible" aria-hidden="true">
        <defs>
          {/* Yellow at the bottom left to purple at the top right, like the Instagram logo (the SVG is rotated -90°). */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#feda77" />
            <stop offset="30%" stopColor="#f58529" />
            <stop offset="60%" stopColor="#dd2a7b" />
            <stop offset="100%" stopColor="#8134af" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="ring-fill"
          style={{ "--c": c, filter: "drop-shadow(0 0 6px rgb(221 42 123 / 0.7))" } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[38cqw] leading-[0.85] font-extrabold tabular-nums">
          {countUp ? (
            <>
              <span className="sr-only">Score: {score}</span>
              <CountUp to={score} />
            </>
          ) : (
            <>
              <span className="sr-only">Score: </span>
              {score}
            </>
          )}
        </span>
        {label && <span className="mt-[2cqw] text-[8cqw] font-semibold tracking-[0.18em] text-muted uppercase">out of 100</span>}
      </div>
    </div>
  );
}

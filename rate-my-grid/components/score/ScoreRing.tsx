import { scoreBand, type ScoreBand } from "@/lib/report";

export const BAND_COLOR: Record<ScoreBand, string> = {
  strong: "var(--color-accent)",
  okay: "var(--color-warn)",
  weak: "var(--color-bad)",
};

export const BAND_TEXT: Record<ScoreBand, string> = {
  strong: "text-accent",
  okay: "text-warn",
  weak: "text-bad",
};

/** Big score out of 100 inside a ring that fills to the score, like an activity ring. */
export function ScoreRing({ score, className = "", label = true }: { score: number; className?: string; label?: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (c * score) / 100;
  const color = BAND_COLOR[scoreBand(score)];
  return (
    <div className={`@container relative aspect-square ${className}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90 overflow-visible" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="ring-fill"
          style={{ "--c": c, filter: `drop-shadow(0 0 6px ${color})` } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[38cqw] leading-[0.85] font-extrabold tabular-nums">
          <span className="sr-only">Score: </span>
          {score}
        </span>
        {label && <span className="mt-[2cqw] text-[8cqw] font-semibold tracking-[0.18em] text-muted uppercase">out of 100</span>}
      </div>
    </div>
  );
}

import { Check, Minus, X } from "lucide-react";
import { CATEGORIES, scoreBand, type CategoryKey, type CheckScore } from "@/lib/report";
import { EvidenceList } from "../report/EvidenceList";
import { BAND_TEXT } from "./ScoreRing";

export type CategoryTag = { text: string; tone: "good" | "bad" };

const TAG_TONE: Record<CategoryTag["tone"], string> = {
  good: "bg-accent/12 text-accent ring-accent/30",
  bad: "bg-bad/12 text-bad ring-bad/30",
};

const RESULT = {
  met: { icon: Check, tone: "text-accent bg-accent/12 ring-accent/30", label: "Met" },
  partly: { icon: Minus, tone: "text-warn bg-warn/12 ring-warn/30", label: "Partly" },
  not_met: { icon: X, tone: "text-bad bg-bad/12 ring-bad/30", label: "Not met" },
} as const;

type CategoryInput = { score: number; max: number; checks?: CheckScore[] };

/** One rubric check: met, partly or not, its points, why, and what that's based on. */
function CheckRow({ check }: { check: CheckScore }) {
  const { icon: Icon, tone, label } = RESULT[check.result];
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ring-1 ${tone}`}>
        <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.75} />
        <span className="sr-only">{label}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] leading-snug font-semibold">{check.label}</p>
          <span className="shrink-0 text-sm font-semibold text-muted tabular-nums">
            {check.points}/{check.max}
          </span>
        </div>
        {check.reason && <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{check.reason}</p>}
        <EvidenceList evidence={check.evidence} className="mt-1.5" />
      </div>
    </li>
  );
}

/**
 * The five category scores as bars (each out of 20). With `detail`, every check in the rubric is listed
 * under its category, with its points and the evidence behind it.
 */
export function CategoryBars({
  categories,
  detail = false,
  tags = {},
}: {
  categories: Record<CategoryKey, CategoryInput>;
  detail?: boolean;
  /** Small labels beside a category's name, e.g. "Strongest". */
  tags?: Partial<Record<CategoryKey, CategoryTag>>;
}) {
  return (
    <ul className={detail ? "space-y-10" : "space-y-3.5"}>
      {CATEGORIES.map(({ key, label }, i) => {
        const { score, max, checks } = categories[key];
        const percent = Math.round((score / max) * 100);
        const tag = tags[key];
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-4">
              <span className={`flex items-center gap-2 font-semibold ${detail ? "text-base sm:text-lg" : "text-sm sm:text-[15px]"}`}>
                {label}
                {tag && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] uppercase ring-1 ${TAG_TONE[tag.tone]}`}>
                    {tag.text}
                  </span>
                )}
              </span>
              <span className={`font-display text-xl leading-none font-bold tabular-nums ${BAND_TEXT[scoreBand(score, max)]}`}>
                {score}
                <span className="text-sm text-muted">/{max}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              {/* The gradient spans the whole track, so low scores stay orange and only high ones reach purple. */}
              <div
                className="bar-fill h-full rounded-full bg-ig"
                // One after another, top to bottom.
                style={{ width: `${percent}%`, backgroundSize: `${10000 / Math.max(percent, 1)}% 100%`, animationDelay: `${250 + i * 90}ms` }}
              />
            </div>
            {detail && checks && (
              <ul className="mt-5 space-y-4">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

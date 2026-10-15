import { CATEGORIES, scoreBand, type CategoryKey, type Report } from "@/lib/report";
import { BAND_TEXT } from "./ScoreRing";

export type CategoryTag = { text: string; tone: "good" | "bad" };

const TAG_TONE: Record<CategoryTag["tone"], string> = {
  good: "bg-accent/12 text-accent ring-accent/30",
  bad: "bg-bad/12 text-bad ring-bad/30",
};

export function CategoryBars({
  categories,
  notes = false,
  tags = {},
}: {
  categories: Report["categories"];
  notes?: boolean;
  /** Small labels beside a category's name, e.g. "Strongest". */
  tags?: Partial<Record<CategoryKey, CategoryTag>>;
}) {
  return (
    <ul className={notes ? "space-y-6" : "space-y-3.5"}>
      {CATEGORIES.map(({ key, label }, i) => {
        const { score, note } = categories[key];
        const tag = tags[key];
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-2 text-sm font-semibold sm:text-[15px]">
                {label}
                {tag && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] uppercase ring-1 ${TAG_TONE[tag.tone]}`}>
                    {tag.text}
                  </span>
                )}
              </span>
              <span className={`font-display text-xl leading-none font-bold tabular-nums ${BAND_TEXT[scoreBand(score)]}`}>{score}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              {/* The gradient spans the whole track, so low scores stay orange and only high ones reach purple. */}
              <div
                className="bar-fill h-full rounded-full bg-ig"
                // One after another, top to bottom.
                style={{ width: `${score}%`, backgroundSize: `${10000 / Math.max(score, 1)}% 100%`, animationDelay: `${250 + i * 90}ms` }}
              />
            </div>
            {notes && note && <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{note}</p>}
          </li>
        );
      })}
    </ul>
  );
}

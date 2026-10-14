import { CATEGORIES, scoreBand, type Report } from "@/lib/report";
import { BAND_TEXT } from "./ScoreRing";

export function CategoryBars({ categories, notes = false }: { categories: Report["categories"]; notes?: boolean }) {
  return (
    <ul className={notes ? "space-y-6" : "space-y-3.5"}>
      {CATEGORIES.map(({ key, label }) => {
        const { score, note } = categories[key];
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-semibold sm:text-[15px]">{label}</span>
              <span className={`font-display text-xl leading-none font-bold tabular-nums ${BAND_TEXT[scoreBand(score)]}`}>{score}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              {/* The gradient spans the whole track, so low scores stay orange and only high ones reach purple. */}
              <div
                className="bar-fill h-full rounded-full bg-ig"
                style={{ width: `${score}%`, backgroundSize: `${10000 / Math.max(score, 1)}% 100%` }}
              />
            </div>
            {notes && note && <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{note}</p>}
          </li>
        );
      })}
    </ul>
  );
}

import { CATEGORIES, scoreBand, type Report } from "@/lib/report";
import { BAND_COLOR, BAND_TEXT } from "./ScoreRing";

export function CategoryBars({ categories, notes = false }: { categories: Report["categories"]; notes?: boolean }) {
  return (
    <ul className={notes ? "space-y-6" : "space-y-3.5"}>
      {CATEGORIES.map(({ key, label }) => {
        const { score, note } = categories[key];
        const band = scoreBand(score);
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-semibold sm:text-[15px]">{label}</span>
              <span className={`font-display text-xl leading-none font-bold tabular-nums ${BAND_TEXT[band]}`}>{score}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className="bar-fill h-full rounded-full" style={{ width: `${score}%`, background: BAND_COLOR[band] }} />
            </div>
            {notes && note && <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{note}</p>}
          </li>
        );
      })}
    </ul>
  );
}

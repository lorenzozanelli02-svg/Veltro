import { EXAMPLE } from "@/lib/example";
import { CategoryBars } from "../score/CategoryBars";
import { ScoreRing } from "../score/ScoreRing";

export function ExampleCard() {
  return (
    <figure aria-label="Example result" className="relative mx-auto w-full max-w-sm lg:max-w-md">
      <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[3rem] bg-accent/10 blur-3xl" />
      <div className="rounded-3xl border border-line bg-surface/90 p-5 shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-raised px-3 py-1 text-xs font-semibold text-muted ring-1 ring-line">Example result</span>
          <span className="text-xs font-medium text-muted">Goal: Get clients</span>
        </div>
        <div className="mt-5 flex items-center gap-5">
          <ScoreRing score={EXAMPLE.score} className="w-30 shrink-0 sm:w-34" />
          <p className="font-display text-[1.6rem] leading-[0.95] font-extrabold uppercase sm:text-3xl">
            &ldquo;Great content. <span className="text-ig">Nobody knows how to hire you.</span>&rdquo;
          </p>
        </div>
        <div className="mt-6">
          <CategoryBars categories={EXAMPLE.categories} />
        </div>
        <div className="mt-6 rounded-2xl border border-accent/25 bg-accent/5 p-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Fix #1</p>
          <p className="mt-1.5 text-[15px] leading-snug text-ink/90">{EXAMPLE.fix}</p>
        </div>
      </div>
    </figure>
  );
}

import { EXAMPLE } from "@/lib/example";
import { CategoryBars } from "../score/CategoryBars";
import { ScoreRing } from "../score/ScoreRing";

export function ExampleCard() {
  return (
    <figure aria-label="Example result" className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent/8 blur-3xl" />
      <div className="glass rounded-3xl p-5 shadow-2xl shadow-black/60 sm:p-7">
        <div className="flex items-center justify-between gap-3 font-mono text-[11px] tracking-[0.18em] text-soft/80 uppercase sm:text-xs">
          <span>Example result</span>
          <span>Goal: Get clients</span>
        </div>
        <div className="mt-6 flex items-center gap-5">
          <ScoreRing score={EXAMPLE.score} className="w-28 shrink-0 sm:w-34" />
          <p className="text-xl leading-snug font-light text-slate-50 sm:text-2xl">
            &ldquo;Great content. <span className="text-ig">Nobody knows how to hire you.</span>&rdquo;
          </p>
        </div>
        <div className="mt-7">
          <CategoryBars categories={EXAMPLE.categories} />
        </div>
        <div className="mt-7 rounded-2xl border border-accent/25 bg-accent/6 p-4">
          <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase sm:text-xs">Fix #1</p>
          <p className="mt-1.5 text-[15px] leading-snug text-ink/90">{EXAMPLE.fix}</p>
        </div>
      </div>
    </figure>
  );
}

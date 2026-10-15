import { ArrowDown, Lock } from "lucide-react";
import { EXAMPLE } from "@/lib/example";
import { scoreBand, type ScoreBand } from "@/lib/report";
import { CategoryBars } from "../score/CategoryBars";
import { PlayWhenVisible } from "../score/PlayWhenVisible";
import { BAND_LABEL, ScoreRing } from "../score/ScoreRing";

const BAND_CHIP: Record<ScoreBand, string> = {
  strong: "bg-accent/12 text-accent ring-accent/30",
  okay: "bg-warn/12 text-warn ring-warn/30",
  weak: "bg-bad/12 text-bad ring-bad/30",
};

/** A drawn head-and-shoulders picture: the example is a made-up account, so no real photo. */
function Avatar() {
  return (
    <span aria-hidden="true" className="shrink-0 rounded-full bg-ig p-[2px]">
      <svg viewBox="0 0 40 40" className="block size-11 rounded-full border-2 border-surface">
        <defs>
          <linearGradient id="example-avatar" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#f6c39b" />
            <stop offset="100%" stopColor="#c4626f" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill="url(#example-avatar)" />
        <circle cx="20" cy="16" r="7" fill="#fff" fillOpacity="0.85" />
        <path d="M7 40c1-8 6-12 13-12s12 4 13 12z" fill="#fff" fillOpacity="0.85" />
      </svg>
    </span>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${className}`}>{children}</p>;
}

/**
 * A full example result, so people see exactly what they'll get: the score and verdict, how each part
 * scored, the first free fix and a taste of the paid report. It animates when it scrolls into view.
 */
export function ExampleCard() {
  const band = scoreBand(EXAMPLE.score);
  return (
    <figure aria-label="Example result for a made-up fitness coach" className="relative mx-auto w-full max-w-md md:max-w-4xl">
      <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[3rem] bg-accent/10 blur-3xl" />
      <PlayWhenVisible className="rounded-3xl border border-line bg-surface/90 p-5 text-left shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-6 md:p-8">
        {/* The account being scored. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar />
            <div className="min-w-0">
              <p className="leading-tight font-semibold">{EXAMPLE.account.description}</p>
              <p className="mt-0.5 text-sm text-muted">
                {EXAMPLE.account.followers.toLocaleString("en-GB")} followers &middot; {EXAMPLE.account.postsLast30Days} posts in 30 days
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-raised px-3 py-1 text-muted ring-1 ring-line">Example result</span>
            <span className="rounded-full bg-raised px-3 py-1 text-ink/90 ring-1 ring-line">Goal: {EXAMPLE.goalLabel}</span>
          </div>
        </div>

        <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-10">
          {/* The score, the verdict and how each part scored. */}
          <div>
            <div className="flex items-center gap-5">
              <ScoreRing score={EXAMPLE.score} countUp className="w-28 shrink-0 sm:w-32" />
              <div className="min-w-0">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] uppercase ring-1 ${BAND_CHIP[band]}`}>
                  {BAND_LABEL[band]}
                </span>
                <p className="mt-2.5 font-display text-[1.55rem] leading-[0.95] font-extrabold uppercase sm:text-[1.75rem]">
                  &ldquo;Great content. <span className="text-ig">Nobody knows how to hire you.</span>&rdquo;
                </p>
              </div>
            </div>
            <div className="mt-7">
              <CategoryBars
                categories={EXAMPLE.categories}
                tags={{ content: { text: "Strongest", tone: "good" }, callToAction: { text: "Weakest", tone: "bad" } }}
              />
            </div>
          </div>

          {/* What to do about it. */}
          <div className="flex flex-col gap-4">
            <div className="animate-rise rounded-2xl border border-accent/25 bg-accent/5 p-4 sm:p-5" style={{ animationDelay: "700ms" }}>
              <Label className="text-accent">Fix #1 &middot; your biggest win</Label>
              <p className="mt-2 leading-snug font-semibold">{EXAMPLE.fix.title}</p>
              <dl className="mt-3 space-y-2.5 text-[15px] leading-snug">
                <div>
                  <dt className="text-xs font-semibold text-muted">What we saw</dt>
                  <dd className="mt-0.5 text-ink/80">{EXAMPLE.fix.problem}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-accent">Do this</dt>
                  <dd className="mt-0.5 text-ink">{EXAMPLE.fix.fix}</dd>
                </div>
              </dl>
            </div>

            <div className="animate-rise rounded-2xl border border-line bg-raised/50 p-4 sm:p-5" style={{ animationDelay: "900ms" }}>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-muted">Your bio, rewritten</Label>
                <span className="inline-flex items-center gap-1 rounded-full bg-raised px-2.5 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-line">
                  <Lock aria-hidden="true" className="size-3" />
                  Full report
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">Now</p>
              <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-line text-ink/55">{EXAMPLE.bio.before}</p>
              <ArrowDown aria-hidden="true" className="my-2 size-4 text-accent" />
              <p className="text-xs font-semibold text-accent">Rewritten</p>
              <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-line text-ink">{EXAMPLE.bio.after}</p>
            </div>

            <p className="text-sm leading-relaxed text-muted">
              Your free score includes two more fixes like this. The full report adds what to keep, stop and start, 10 post
              ideas and a 30-day plan.
            </p>
          </div>
        </div>
      </PlayWhenVisible>
    </figure>
  );
}

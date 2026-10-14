import { Ban, Check, ChevronDown, Plus } from "lucide-react";
import type { FullReport } from "@/lib/report";
import { Eyebrow } from "../Eyebrow";
import { CopyButton } from "./CopyButton";

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-3 text-3xl leading-tight font-light tracking-tight text-balance text-slate-50 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const KSS = [
  { key: "keep", label: "Keep", icon: Check, tone: "text-good", ring: "border-good/30" },
  { key: "stop", label: "Stop", icon: Ban, tone: "text-bad", ring: "border-bad/30" },
  { key: "start", label: "Start", icon: Plus, tone: "text-warn", ring: "border-warn/30" },
] as const;

const FORMAT_TONE: Record<string, string> = {
  Reel: "bg-accent/12 text-accent ring-accent/30",
  Carousel: "bg-warn/10 text-warn ring-warn/30",
  "Single image": "bg-ink/8 text-ink ring-line",
  Story: "bg-ink/8 text-ink ring-line",
  Stories: "bg-ink/8 text-ink ring-line",
  Engage: "bg-ink/8 text-muted ring-line",
  Rest: "bg-transparent text-muted ring-line",
};

function Format({ value }: { value: string }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] tracking-[0.08em] ring-1 ${FORMAT_TONE[value] ?? FORMAT_TONE.Rest}`}>
      {value}
    </span>
  );
}

export function FullReportView({ full }: { full: FullReport }) {
  const weeks = [0, 1, 2, 3, 4].map((w) => full.plan.days.slice(w * 7, w * 7 + 7)).filter((d) => d.length);

  return (
    <div className="space-y-16">
      <Section id="kss" eyebrow="Your breakdown" title={<>Keep. Stop. <span className="text-ig">Start.</span></>}>
        <div className="grid gap-4">
          {KSS.map(({ key, label, icon: Icon, tone, ring }) => (
            <div key={key} className={`rounded-2xl border bg-slate-950/60 p-5 backdrop-blur-sm sm:p-6 ${ring}`}>
              <p className={`flex items-center gap-2 text-2xl font-light ${tone}`}>
                <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
                {label}
              </p>
              <ul className="mt-4 space-y-4">
                {full[key].map((item) => (
                  <li key={item.point}>
                    <p className="leading-snug font-medium text-slate-50">{item.point}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-soft">{item.why}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="bio" eyebrow="Copy and paste" title={<>Your new <span className="text-ig">bio</span></>}>
        <div className="rounded-2xl border border-accent/30 bg-slate-950/60 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">Name field</p>
              <p className="mt-1.5 font-medium break-words text-slate-50">{full.bio.name}</p>
            </div>
            <CopyButton text={full.bio.name} label="Copy name" className="shrink-0" />
          </div>
          <div className="mt-6 flex flex-col items-start gap-3 border-t border-slate-400/15 pt-6 sm:flex-row sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Bio <span className="tabular-nums">({[...full.bio.text].length}/150)</span>
              </p>
              <p className="mt-1.5 text-[17px] leading-relaxed break-words whitespace-pre-line">{full.bio.text}</p>
            </div>
            <CopyButton text={full.bio.text} label="Copy bio" className="shrink-0" />
          </div>
          <p className="mt-6 border-t border-slate-400/15 pt-5 text-[15px] leading-relaxed text-soft">{full.bio.why}</p>
        </div>
      </Section>

      <Section id="ideas" eyebrow="Made for your goal" title={<>10 post <span className="text-ig">ideas</span></>}>
        <ol className="grid gap-3">
          {full.postIdeas.map((idea, i) => (
            <li key={idea.title} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs tracking-[0.2em] text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <Format value={idea.format} />
              </div>
              <h3 className="mt-2 leading-snug font-medium text-slate-50">{idea.title}</h3>
              <p className="mt-2 border-l-2 border-accent/50 pl-3 text-[15px] leading-relaxed text-ink/90">&ldquo;{idea.hook}&rdquo;</p>
              <p className="mt-3 text-sm leading-relaxed text-soft">{idea.why}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="plan" eyebrow="Next 30 days" title={<>Your posting <span className="text-ig">plan</span></>}>
        <p className="text-[15px] leading-relaxed text-soft">{full.plan.summary}</p>
        <div className="mt-8 grid gap-5">
          {weeks.map((days, w) => (
            <details key={w} open={w < 2} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-xs tracking-[0.2em] text-accent uppercase">Week {w + 1}</span>
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  Days {days[0].day}&ndash;{days.at(-1)!.day}
                  <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <ol className="glass mt-3 divide-y divide-slate-400/10 overflow-hidden rounded-2xl">
                {days.map((d) => (
                  <li key={d.day} className="flex gap-4 px-4 py-3.5 sm:px-5">
                    <span className="w-14 shrink-0 font-mono text-xs leading-6 tracking-[0.12em] text-muted uppercase tabular-nums">Day {d.day}</span>
                    <div className="min-w-0 flex-1">
                      <Format value={d.format} />
                      <p className="mt-1.5 text-[15px] leading-relaxed">{d.task}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}

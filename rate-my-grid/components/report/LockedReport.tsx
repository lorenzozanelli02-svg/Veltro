import { Lock } from "lucide-react";
import { SITE } from "@/lib/site";
import { ButtonLink } from "../Button";
import { Check } from "../landing/Check";
import { UnlockButton } from "./UnlockButton";

const INCLUDED = [
  "What to keep, stop and start doing",
  "A rewritten bio you can copy and paste",
  "10 post ideas built around your goal",
  "A 30-day posting plan",
];

const SECTIONS = [
  { title: "Keep", tone: "text-good", bars: ["85%", "70%", "78%"] },
  { title: "Stop", tone: "text-bad", bars: ["80%", "62%"] },
  { title: "Start", tone: "text-warn", bars: ["74%", "88%", "58%"] },
  { title: "Your new bio", tone: "text-slate-50", bars: ["60%", "90%", "45%"] },
  { title: "10 post ideas", tone: "text-slate-50", bars: ["80%", "65%", "75%", "55%"] },
  { title: "30-day plan", tone: "text-slate-50", bars: ["70%", "85%", "60%"] },
];

/**
 * Placeholder shapes, blurred, behind the unlock card. The real paid sections are never sent to the
 * browser before payment, so there's nothing here to un-blur.
 */
function Placeholder() {
  return (
    <div aria-hidden="true" className="pointer-events-none grid gap-4 select-none blur-[5px]">
      {SECTIONS.map(({ title, tone, bars }) => (
        <div key={title} className="glass rounded-2xl p-6">
          <p className={`text-2xl font-light ${tone}`}>{title}</p>
          <div className="mt-4 space-y-3">
            {bars.map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-slate-400/25" style={{ width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LockedReport({ id, unlockHref }: { id: string; unlockHref?: string }) {
  return (
    <div className="grid *:col-start-1 *:row-start-1">
      <Placeholder />
      <div className="relative z-10 flex items-start justify-center pt-10 sm:pt-16">
        <div className="w-full max-w-md rounded-3xl border border-accent/30 bg-slate-950/90 p-6 shadow-2xl shadow-black/70 backdrop-blur-md sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/30">
            <Lock aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-5 text-3xl leading-tight font-light tracking-tight text-slate-50 sm:text-4xl">
            Your full report is <span className="text-ig">ready</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-soft">It&rsquo;s already written for your account. Unlock it once and keep it.</p>
          <ul className="mt-6 space-y-3.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink/90">
                <Check />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            {unlockHref ? (
              <ButtonLink href={unlockHref} className="w-full">
                Unlock full report · {SITE.price.label}
              </ButtonLink>
            ) : (
              <UnlockButton id={id} price={SITE.price.label} />
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted">One-time payment. No subscription. Secure checkout by Stripe.</p>
        </div>
      </div>
    </div>
  );
}

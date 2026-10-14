import { Lock } from "lucide-react";
import { SITE } from "@/lib/site";
import { Check } from "../landing/Check";
import { UnlockButton } from "./UnlockButton";

const INCLUDED = [
  "What to keep, stop and start doing",
  "A rewritten bio you can copy and paste",
  "10 post ideas built around your goal",
  "A 30-day posting plan",
];

/**
 * Placeholder shapes, blurred, behind the unlock card. The real paid sections are never sent to the
 * browser before payment, so there's nothing here to un-blur.
 */
function Placeholder() {
  const bar = (w: string) => <div className="h-3 rounded-full bg-muted/30" style={{ width: w }} />;
  return (
    <div aria-hidden="true" className="pointer-events-none space-y-10 select-none blur-[5px]">
      {["Keep", "Stop", "Start"].map((title) => (
        <div key={title} className="rounded-2xl border border-line bg-surface p-6">
          <p className="font-display text-2xl font-extrabold text-accent uppercase">{title}</p>
          <div className="mt-4 space-y-3">
            {bar("85%")}
            {bar("70%")}
            {bar("78%")}
          </div>
        </div>
      ))}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <p className="font-display text-2xl font-extrabold uppercase">Your new bio</p>
        <div className="mt-4 space-y-3">
          {bar("60%")}
          {bar("90%")}
          {bar("45%")}
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6">
        <p className="font-display text-2xl font-extrabold uppercase">10 post ideas</p>
        <div className="mt-4 space-y-3">
          {bar("80%")}
          {bar("65%")}
          {bar("75%")}
          {bar("55%")}
        </div>
      </div>
    </div>
  );
}

export function LockedReport({ id }: { id: string }) {
  return (
    <div className="grid *:col-start-1 *:row-start-1">
      <Placeholder />
      <div className="relative z-10 flex items-start justify-center px-1 pt-14">
        <div className="w-full max-w-md rounded-3xl border border-accent/30 bg-surface/95 p-6 shadow-2xl shadow-black/70 backdrop-blur-md sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/30">
            <Lock aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-5 font-display text-4xl leading-[0.95] font-extrabold uppercase">
            Your full report is <span className="text-ig">ready</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">Already written from your screenshots. Unlock it once and keep it.</p>
          <ul className="mt-6 space-y-3.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink/90">
                <Check />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <UnlockButton id={id} price={SITE.price.label} />
          </div>
          <p className="mt-3 text-center text-xs text-muted">One-time payment. No subscription. Secure checkout by Stripe.</p>
        </div>
      </div>
    </div>
  );
}

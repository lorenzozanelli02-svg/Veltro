import { FadeIn, WordReveal } from "@/components/ui/digital-serenity-animated-landing-page";

/** A step's thin headline, revealed word by word, with `accent` at the end in the Instagram gradient. */
export function StepHeading({ title, accent, children }: { title: string; accent?: string; children?: React.ReactNode }) {
  return (
    <div>
      <WordReveal
        as="h1"
        text={title}
        accent={accent}
        start={60}
        stagger={70}
        className="block text-[2.25rem] leading-[1.08] font-light tracking-tight text-balance text-slate-50 sm:text-5xl sm:font-extralight lg:text-6xl"
      />
      {children && (
        <FadeIn at={250}>
          <p className="mt-4 text-base leading-relaxed text-soft lg:mt-6 lg:text-lg">{children}</p>
        </FadeIn>
      )}
    </div>
  );
}

/**
 * Phone: one column. Computer: the step's title and help on the left, what you fill in on the right,
 * like a normal website form.
 */
export function StepLayout({
  title,
  accent,
  intro,
  aside,
  children,
}: {
  title: string;
  accent?: string;
  intro: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 xl:gap-24">
      <div className="lg:sticky lg:top-10 lg:self-start">
        <StepHeading title={title} accent={accent}>
          {intro}
        </StepHeading>
        {aside && <FadeIn at={350}>{aside}</FadeIn>}
      </div>
      <FadeIn at={150} className="mt-8 lg:mt-1">
        {children}
      </FadeIn>
    </div>
  );
}

/** The sticky button bar at the bottom of a step on phones; a normal row on bigger screens. */
export const STEP_ACTIONS =
  "sticky bottom-0 z-10 -mx-4 bg-linear-to-t from-black/85 from-50% to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-none sm:px-0";

/** Small monospaced label used inside the steps. */
export function MonoTag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-mono text-xs tracking-[0.2em] text-soft/80 uppercase ${className}`}>{children}</p>;
}

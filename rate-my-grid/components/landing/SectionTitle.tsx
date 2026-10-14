import { WordReveal } from "@/components/ui/digital-serenity-animated-landing-page";
import { Eyebrow } from "../Eyebrow";

/** A section's mono label and thin headline, revealed word by word when it scrolls into view. */
export function SectionTitle({ eyebrow, id, text, accent, className = "" }: { eyebrow: string; id: string; text: string; accent?: string; className?: string }) {
  return (
    <div className={`max-w-3xl ${className}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <WordReveal
        as="h2"
        id={id}
        text={text}
        accent={accent}
        start={100}
        stagger={90}
        className="mt-5 block text-4xl leading-[1.1] font-light tracking-tight text-balance text-slate-50 sm:text-5xl sm:font-extralight lg:text-6xl"
      />
    </div>
  );
}

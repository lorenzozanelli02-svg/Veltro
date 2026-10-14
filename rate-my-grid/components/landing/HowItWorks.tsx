import { AtSign, MessageSquareText, Target } from "lucide-react";
import { FadeIn, RevealOnScroll } from "@/components/ui/digital-serenity-animated-landing-page";
import { SectionTitle } from "./SectionTitle";

const STEPS = [
  {
    icon: Target,
    title: "Pick your goal",
    text: "Clients, sales, a personal brand or a busier shop. You're scored against what you actually want.",
  },
  {
    icon: MessageSquareText,
    title: "Answer four questions",
    text: "Who you want to reach, what you sell, how often you post and what people should do next.",
  },
  {
    icon: AtSign,
    title: "Add your username",
    text: "We read your bio and your last 12 posts. Private account? Upload a few screenshots instead.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-8 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="How it works" id="how-title" text="Your score in three" accent="steps" />
        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <FadeIn at={500 + i * 150} className="glass h-full rounded-2xl p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-soft/80 tabular-nums">0{i + 1}</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-linear-to-r from-slate-400/30 to-transparent" />
                  <Icon aria-hidden="true" className="size-5 text-accent" strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 text-xl font-normal text-slate-50">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
              </FadeIn>
            </li>
          ))}
        </ol>
      </RevealOnScroll>
    </section>
  );
}

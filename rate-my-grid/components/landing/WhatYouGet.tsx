import { Clock, EyeOff, Target } from "lucide-react";
import { FadeIn, RevealOnScroll, WordReveal } from "@/components/ui/digital-serenity-animated-landing-page";
import { SITE } from "@/lib/site";
import { ButtonLink } from "../Button";
import { Check } from "./Check";
import { ExampleCard } from "./ExampleCard";
import { SectionTitle } from "./SectionTitle";

const FREE = [
  "Your overall score out of 100, with an honest one-line verdict",
  "Scores for your bio, content, consistency, call to action and fit with your goal",
  "Your two or three most important fixes",
];

const FULL = [
  "What to keep, stop and start doing",
  "A rewritten bio you can copy and paste",
  "10 post ideas built around your goal",
  "A 30-day posting plan you can actually stick to",
];

const TRUST = [
  { icon: EyeOff, title: "No login or password", text: "We only look at what's public on your profile. We never connect to your account." },
  { icon: Clock, title: "Nothing kept for long", text: "Profile data is deleted after 24 hours. Uploaded screenshots are never stored." },
  { icon: Target, title: "Judged on your goal", text: "A bakery and a business coach need different things. You're scored on yours." },
];

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map((item) => (
        <li key={item} className="flex gap-3.5 text-[15px] leading-relaxed text-ink/90">
          <Check />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function WhatYouGet() {
  return (
    <section id="what-you-get" aria-labelledby="get-title" className="scroll-mt-8 px-4 pb-24 sm:px-6 sm:pb-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <RevealOnScroll>
          <SectionTitle eyebrow="What you get" id="get-title" text={`Free score. Full fix for`} accent={`${SITE.price.label}.`} />

          <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
            <FadeIn at={450}>
              <ExampleCard />
            </FadeIn>
            <div className="grid gap-4">
              <FadeIn at={600} className="glass rounded-3xl p-6 sm:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-2xl font-light text-slate-50">Your score</p>
                  <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">Free</p>
                </div>
                <List items={FREE} />
              </FadeIn>
              <FadeIn
                at={750}
                className="rounded-3xl border border-accent/30 bg-[radial-gradient(120%_120%_at_50%_0%,rgb(221_42_123/0.14),transparent_60%)] p-6 backdrop-blur-sm sm:p-8"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-2xl font-light text-slate-50">Full report</p>
                  <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">{SITE.price.label} one-time</p>
                </div>
                <List items={FULL} />
              </FadeIn>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <ul className="mt-16 grid gap-8 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <FadeIn at={100 + i * 150} className="flex gap-4">
                  <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
                  <div>
                    <h3 className="font-medium text-slate-50">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted">{text}</p>
                  </div>
                </FadeIn>
              </li>
            ))}
          </ul>
        </RevealOnScroll>

        <RevealOnScroll className="glass relative mt-20 overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-20">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_50%_0%,rgb(221_42_123/0.14),transparent_70%)]" />
          <WordReveal
            as="h2"
            text="Ready to see your"
            accent="score?"
            start={100}
            stagger={100}
            className="block text-4xl leading-[1.1] font-light tracking-tight text-balance text-slate-50 sm:text-5xl sm:font-extralight"
          />
          <FadeIn at={650}>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-soft sm:text-lg">It takes about a minute, and the score is free.</p>
            <ButtonLink href="/?step=goal" className="mt-9 w-full max-w-xs sm:w-auto sm:max-w-none sm:min-w-60">
              Get my score
            </ButtonLink>
          </FadeIn>
        </RevealOnScroll>
      </div>
    </section>
  );
}

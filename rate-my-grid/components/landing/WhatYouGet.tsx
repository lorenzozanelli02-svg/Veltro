import { Clock, EyeOff, Target } from "lucide-react";
import { SITE } from "@/lib/site";
import { ButtonLink } from "../Button";
import { Eyebrow } from "../Eyebrow";
import { Check } from "./Check";

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

export function WhatYouGet() {
  return (
    <section id="what-you-get" aria-labelledby="get-title" className="scroll-mt-8 px-4 pb-24 sm:px-6 sm:pb-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Eyebrow>What you get</Eyebrow>
          <h2 id="get-title" className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase text-balance sm:text-5xl lg:text-6xl">
            Free score. <span className="text-ig">Full fix for {SITE.price.label}.</span>
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-surface/80 p-6 sm:p-8">
            <p className="font-display text-2xl font-extrabold uppercase">Your score</p>
            <p className="mt-1 text-sm font-semibold text-accent">Free</p>
            <ul className="mt-6 space-y-4">
              {FREE.map((item) => (
                <li key={item} className="flex gap-3.5 text-[15px] leading-relaxed text-ink/90">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-accent/30 bg-[radial-gradient(120%_120%_at_50%_0%,rgb(221_42_123/0.12),transparent_60%)] p-6 sm:p-8">
            <p className="font-display text-2xl font-extrabold uppercase">Full report</p>
            <p className="mt-1 text-sm font-semibold text-accent">{SITE.price.label} one-time &middot; unlocks instantly</p>
            <ul className="mt-6 space-y-4">
              {FULL.map((item) => (
                <li key={item} className="flex gap-3.5 text-[15px] leading-relaxed text-ink/90">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={2} />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-3xl border border-accent/25 bg-[radial-gradient(120%_140%_at_50%_0%,rgb(221_42_123/0.14),transparent_60%)] px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="font-display text-4xl leading-[0.95] font-extrabold uppercase text-balance sm:text-5xl">
            Ready to see <span className="text-ig">your score?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink/80 sm:text-lg">
            It takes about a minute, and the score is free.
          </p>
          <ButtonLink href="/?step=goal" className="mt-8 w-full sm:w-auto">
            Get my score
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

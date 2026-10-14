import { Check } from "lucide-react";
import Link from "next/link";
import { ExampleCard } from "./ExampleCard";
import { HeroForm } from "./HeroForm";

const PROMISES = ["Free score", "No sign-up", "We never ask for your password"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Floodlight glow from the top centre, and a faint grid that fades out towards the edges. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(40%_45%_at_25%_0%,rgb(245_133_41/0.14),transparent_70%),radial-gradient(40%_50%_at_75%_0%,rgb(129_52_175/0.22),transparent_72%),radial-gradient(60%_55%_at_50%_0%,rgb(221_42_123/0.18),transparent_72%)]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(241_245_242/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(241_245_242/0.035)_1px,transparent_1px)] mask-[radial-gradient(55%_45%_at_50%_22%,black,transparent)] bg-size-[56px_56px]"
      />

      <div className="mx-auto max-w-4xl px-4 pt-28 text-center sm:px-6 sm:pt-36 lg:pt-44">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-muted uppercase sm:text-[13px]">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-ig" />
          For coaches and small businesses
        </p>
        <h1
          id="hero-title"
          className="mt-6 font-display text-[2.75rem] leading-[0.92] font-extrabold tracking-[0.005em] uppercase text-balance sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
        >
          Is your Instagram actually <span className="text-ig">getting you clients?</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-lg">
          Get an honest score out of 100 and exactly what to fix, judged on what you want Instagram to do for you. It
          takes about 60 seconds.
        </p>

        <div className="mt-9 sm:mt-10">
          <HeroForm />
        </div>

        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {PROMISES.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check aria-hidden="true" className="size-4 text-accent" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Private account?{" "}
          <Link href="/?step=goal" className="font-semibold text-ink underline-offset-4 hover:text-accent hover:underline">
            Start here and add screenshots instead
          </Link>
        </p>
      </div>

      {/* What they'll get, just under the form. */}
      <div className="mx-auto max-w-md px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-28">
        <ExampleCard />
      </div>
    </section>
  );
}

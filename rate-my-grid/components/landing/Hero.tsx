import { ButtonLink } from "../Button";
import { Eyebrow } from "../Eyebrow";
import { ExampleCard } from "./ExampleCard";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Floodlight glow from the top, and a faint grid that fades out towards the edges. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(70%_55%_at_50%_0%,rgb(59_229_132/0.17),transparent_72%)]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(241_245_242/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(241_245_242/0.035)_1px,transparent_1px)] mask-[radial-gradient(60%_50%_at_50%_20%,black,transparent)] bg-size-[56px_56px]"
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-24 pb-20 sm:px-6 sm:pt-32 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:px-8 lg:pt-40 lg:pb-32">
        <div className="max-w-xl">
          <Eyebrow>For coaches and small businesses</Eyebrow>
          <h1
            id="hero-title"
            className="mt-4 font-display text-[2.6rem] leading-[0.92] font-extrabold tracking-[0.005em] uppercase text-balance sm:text-6xl lg:text-[4.25rem] xl:text-7xl"
          >
            Is your Instagram actually getting you clients? <span className="text-accent">Get your score in 60 seconds.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/80 sm:text-lg">
            Upload a few screenshots. Get an honest score out of 100, judged on what you want Instagram to do for you, and
            exactly what to fix.
          </p>
          <div className="mt-8">
            <ButtonLink href="/?step=goal" className="w-full sm:w-auto">
              Get my score
            </ButtonLink>
            <p className="mt-4 text-sm text-muted">Free score &middot; No sign-up &middot; We never ask for your password</p>
          </div>
        </div>
        <ExampleCard />
      </div>
    </section>
  );
}

import { Eyebrow } from "../Eyebrow";

const STEPS = [
  {
    title: "Pick your goal",
    text: "Clients, sales, a personal brand or a busier shop. You're scored against what you actually want.",
  },
  {
    title: "Answer four questions",
    text: "Who you want to reach, what you sell, how often you post and what people should do next.",
  },
  {
    title: "Upload 2 to 5 screenshots",
    text: "Your profile, your grid and a recent post. Your score is ready in about a minute.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-8 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-title" className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase text-balance sm:text-5xl lg:text-6xl">
            Your score in <span className="text-accent">three steps</span>
          </h2>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-line bg-surface/80 p-6">
              <span className="font-display text-3xl font-extrabold text-accent tabular-nums">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

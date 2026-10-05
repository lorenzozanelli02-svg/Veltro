import { ArrowRight, ArrowUpRight, BadgeCheck, MessageSquareHeart, Ruler, ScanLine, UserRoundX } from "lucide-react";
import Link from "next/link";
import { Converter } from "@/components/Converter";
import { getOptionsIndex, listPublicBrands } from "@/lib/data";

export const dynamic = "force-dynamic";

const TRUST = [
  { icon: BadgeCheck, text: "Official size charts" },
  { icon: Ruler, text: "Compared in cm" },
  { icon: UserRoundX, text: "No sign-up" },
];

const STEPS = [
  { title: "Start with what fits", text: "Choose men or women, a category, and a brand and size you already own and love." },
  { title: "We read the charts", text: "We take the chest, waist and hip measurements behind your size from the brand’s official chart." },
  { title: "Get your size", text: "We find the size in the other brand that covers the same body, and tell you when you’re between two." },
];

const PROMISES = [
  {
    icon: ScanLine,
    title: "Estimates, clearly labelled",
    text: "No chart for a brand yet? We use standard UK, EU and US sizing and say so on the result.",
  },
  {
    icon: MessageSquareHeart,
    title: "“Did this fit?”",
    text: "One tap after every result tells us how it went, so recommendations keep getting better.",
  },
  {
    icon: UserRoundX,
    title: "No account. Ever.",
    text: "Open the page, get your size, go shopping. Nothing to sign up for and nothing to install.",
  },
];

export default function Home() {
  const index = getOptionsIndex();
  const brands = listPublicBrands();

  return (
    <>
      {/* Hero + converter */}
      <section className="relative">
        <div className="mx-auto grid w-full max-w-6xl gap-x-16 px-4 pt-3 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:pt-20">
          <div className="lg:pt-6">
            <p className="hidden items-center gap-3 text-[13px] font-medium uppercase tracking-[0.14em] text-muted sm:flex">
              <span className="ruler h-3 w-14 text-accent" aria-hidden="true" />
              The size converter for clothes
            </p>
            <h1 className="font-display text-[42px] leading-[0.98] tracking-[-0.015em] text-balance sm:mt-5 sm:text-7xl lg:text-[104px]">
              Your size, <em className="text-accent">in any brand.</em>
            </h1>
            <p className="mt-2 text-[15px] leading-snug text-muted sm:mt-6 sm:max-w-md sm:text-lg sm:leading-relaxed">
              Tell us what fits.<span className="hidden sm:inline"> We compare official body measurements</span>
              <span className="sm:hidden"> We&rsquo;ll do the maths.</span>
              <span className="hidden sm:inline"> and find your size in the brand you&rsquo;re buying from.</span>
            </p>
            <ul className="mt-10 hidden flex-wrap gap-x-6 gap-y-3 lg:flex">
              {TRUST.map((t) => (
                <li key={t.text} className="flex items-center gap-2 text-[15px] font-medium text-ink">
                  <t.icon aria-hidden="true" className="size-[18px] text-accent" />
                  {t.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 sm:mt-10 lg:mt-0">
            <div className="sm:rounded-[28px] sm:border sm:border-line sm:bg-white sm:p-6 sm:shadow-[0_1px_2px_rgba(17,17,16,0.04),0_30px_60px_-30px_rgba(17,17,16,0.22)]">
              <Converter index={index} />
            </div>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 lg:hidden">
              {TRUST.map((t) => (
                <li key={t.text} className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                  <t.icon aria-hidden="true" className="size-4 text-accent" />
                  {t.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Brand ticker */}
      {brands.length > 0 && (
        <section aria-label="Brands we cover" className="mt-20 border-y border-line py-5 sm:mt-28">
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <ul aria-hidden="true" className="animate-marquee flex w-max">
              {[0, 1].map((copy) =>
                Array.from({ length: Math.max(1, Math.ceil(12 / brands.length)) }).flatMap((_, rep) =>
                  brands.map((b) => (
                    <li key={`${copy}-${rep}-${b.id}`} className="flex shrink-0 items-center gap-10 pr-10 font-display text-3xl text-ink sm:text-4xl">
                      {b.name}
                      <span className="size-1.5 rounded-full bg-accent" />
                    </li>
                  )),
                ),
              )}
            </ul>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="mx-auto mt-24 w-full max-w-6xl scroll-mt-20 px-4 sm:mt-32 sm:px-6">
        <div className="reveal max-w-2xl">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-accent">How it works</p>
          <h2 id="how-title" className="mt-3 font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-6xl">
            Three steps. <em className="text-muted">About ten seconds.</em>
          </h2>
        </div>
        <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal border-t border-ink pt-5">
              <span className="font-display text-7xl leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Measured, not guessed */}
      <section aria-labelledby="measure-title" className="mx-auto mt-28 w-full max-w-6xl px-4 sm:mt-36 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          <div className="reveal">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-accent">Measured, not guessed</p>
            <h2 id="measure-title" className="mt-3 font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-6xl">
              A 10 here is an M there.
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
              Size labels mean different things at every brand. Body measurements don&rsquo;t. We store each brand&rsquo;s official
              chest, waist and hip ranges in centimetres, then match the body behind your size, not the number on the label.
            </p>
            <Link href="/brands" className="group mt-8 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-ink">
              <span className="underline decoration-line decoration-2 underline-offset-[6px] transition-colors duration-200 group-hover:decoration-accent">
                Browse the size charts
              </span>
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <MeasureDiagram />
        </div>
      </section>

      {/* Promises */}
      <section aria-label="Why people use Veltro" className="mx-auto mt-28 w-full max-w-6xl px-4 sm:mt-36 sm:px-6">
        <ul className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-3">
          {PROMISES.map((p) => (
            <li key={p.title} className="reveal bg-white p-7 sm:p-8">
              <p.icon aria-hidden="true" className="size-6 text-accent" />
              <h3 className="mt-6 font-display text-[28px] leading-tight">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Brand guides */}
      {brands.length > 0 && (
        <section aria-labelledby="guides" className="mx-auto mt-28 w-full max-w-6xl px-4 sm:mt-36 sm:px-6">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-accent">Size guides</p>
              <h2 id="guides" className="mt-3 font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-6xl">
                Every chart, in one place.
              </h2>
            </div>
            <Link
              href="/brands"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-5 text-[15px] font-medium transition-colors duration-200 hover:border-ink"
            >
              All brands
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {brands.slice(0, 8).map((b) => (
              <li key={b.id} className="reveal">
                <Link
                  href={`/brands/${b.slug}`}
                  className="group flex aspect-[5/4] flex-col justify-between rounded-[22px] border border-line bg-white p-5 transition-[border-color,box-shadow] duration-200 hover:border-ink hover:shadow-[0_18px_40px_-24px_rgba(17,17,16,0.35)]"
                >
                  <span className="font-display text-5xl leading-none text-ink transition-colors duration-200 group-hover:text-accent">
                    {b.name.trim()[0]?.toUpperCase()}
                  </span>
                  <span className="flex items-end justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{b.name}</span>
                      <span className="text-[13px] text-muted">Size guide</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-faint transition-colors duration-200 group-hover:text-accent" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Request a brand */}
      <section aria-labelledby="request-title" className="mx-auto mt-28 w-full max-w-6xl px-4 sm:mt-36 sm:px-6">
        <div className="reveal relative overflow-hidden rounded-[32px] bg-accent px-6 py-14 text-white sm:px-14 sm:py-20">
          <div className="ruler absolute inset-x-0 top-0 h-5 text-white/35" aria-hidden="true" />
          <h2 id="request-title" className="max-w-2xl font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-7xl">
            Can&rsquo;t find your brand?
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/85">
            Tell us which one. The most requested brands get their size charts added first.
          </p>
          <Link
            href="/brand-request"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            Request a brand
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

/* Illustration of how two brands' size bands line up against one body measurement. */
const SCALE = { min: 80, max: 96 };
const BODY = 87;
const EXAMPLE_BRANDS = [
  { name: "Brand A", region: "UK", sizes: [["8", 80, 84], ["10", 84, 88], ["12", 88, 92], ["14", 92, 96]] },
  { name: "Brand B", region: "", sizes: [["S", 80, 85], ["M", 85, 90], ["L", 90, 96]] },
] as const;
const pct = (cm: number) => ((cm - SCALE.min) / (SCALE.max - SCALE.min)) * 100;

function MeasureDiagram() {
  const ticks = Array.from({ length: (SCALE.max - SCALE.min) / 4 + 1 }, (_, i) => SCALE.min + i * 4);
  return (
    <figure className="reveal rounded-[28px] border border-line bg-soft p-5 sm:p-8">
      <div className="relative">
        {/* Body marker */}
        <div className="pointer-events-none absolute inset-y-0 z-10 -ml-px w-0.5 bg-ink" style={{ left: `${pct(BODY)}%` }} aria-hidden="true">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-white">
            Your chest · {BODY} cm
          </span>
        </div>

        <div className="space-y-5 pt-10">
          {EXAMPLE_BRANDS.map((brand) => (
            <div key={brand.name}>
              <p className="mb-2 text-[13px] font-semibold text-muted">
                {brand.name}
                {brand.region && <span className="font-normal"> · {brand.region} sizes</span>}
              </p>
              <div className="flex h-14 gap-1">
                {brand.sizes.map(([label, from, to]) => {
                  const hit = from <= BODY && BODY < to;
                  return (
                    <div
                      key={label}
                      className={`flex items-center justify-center rounded-xl text-lg font-semibold ${
                        hit ? "bg-accent text-white shadow-[0_10px_24px_-10px_rgba(194,65,12,0.7)]" : "bg-white text-muted"
                      }`}
                      style={{ width: `${pct(to) - pct(from)}%` }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Scale */}
        <div className="mt-5" aria-hidden="true">
          <div className="ruler h-3 text-faint" />
          <div className="relative mt-1.5 h-4 text-[11px] tabular-nums text-faint">
            {ticks.map((t) => (
              <span key={t} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${pct(t)}%` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-5 text-[13px] leading-relaxed text-muted">
        Illustration: the same 87 cm chest is a UK 10 at one brand and an M at another.
      </figcaption>
    </figure>
  );
}

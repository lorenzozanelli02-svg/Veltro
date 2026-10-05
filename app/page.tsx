import { Ruler, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";
import { Converter } from "@/components/Converter";
import { getOptionsIndex, listPublicBrands } from "@/lib/data";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: Shirt, title: "Start with what fits", text: "Pick a brand and a size you already own and love." },
  { icon: Ruler, title: "We read the charts", text: "We compare official body measurements between the two brands." },
  { icon: Sparkles, title: "Get your size", text: "See your size, plus a tip when you're between two sizes." },
];

export default function Home() {
  const index = getOptionsIndex();
  const brands = listPublicBrands().slice(0, 24);
  return (
    <>
      <section className="mx-auto w-full max-w-md px-4 pt-2 sm:pt-10">
        <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.035em] text-balance sm:text-4xl">
          Your size, in <span className="text-accent">any brand.</span>
        </h1>
        <p className="mb-4 mt-1.5 text-[15px] leading-snug text-muted sm:mb-6 sm:text-base">
          Tell us what fits. We&rsquo;ll do the maths.
        </p>
        <Converter index={index} />
      </section>

      <section aria-labelledby="how" className="mx-auto mt-20 w-full max-w-5xl px-4 sm:px-6">
        <h2 id="how" className="text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
          How it works
        </h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-[var(--radius-card)] bg-soft p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-accent shadow-[0_0_0_1px_var(--color-line)]">
                  <s.icon aria-hidden="true" className="size-[18px]" />
                </span>
                <span className="text-xs font-semibold text-faint tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {brands.length > 0 && (
        <section aria-labelledby="guides" className="mx-auto mt-16 w-full max-w-5xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 id="guides" className="text-xl font-semibold tracking-tight">
              Brand size guides
            </h2>
            <Link href="/brands" className="text-sm font-medium text-accent hover:underline">
              All brands
            </Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {brands.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/brands/${b.slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm font-medium transition-colors hover:border-ink"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

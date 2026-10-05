import type { Metadata } from "next";
import Link from "next/link";
import { listPublicBrands } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brand size guides",
  description: "Size charts and size converters for every brand we cover.",
  alternates: { canonical: "/brands" },
};

export default function BrandsPage() {
  const brands = listPublicBrands();
  const byLetter = new Map<string, typeof brands>();
  for (const b of brands) {
    const letter = /[a-z]/i.test(b.name[0]) ? b.name[0].toUpperCase() : "#";
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), b]);
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-16">
      <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-accent">Size guides</p>
      <h1 className="mt-3 font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-7xl">Every brand we cover.</h1>
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">Pick a brand to see its full size chart and convert your size.</p>
      {brands.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-soft p-6 text-muted">
          No brands yet.{" "}
          <Link href="/brand-request" className="font-medium text-accent hover:underline">
            Request one
          </Link>
          .
        </p>
      ) : (
        <div className="mt-12 space-y-12">
          {[...byLetter.entries()].map(([letter, list]) => (
            <section key={letter} aria-label={letter}>
              <h2 className="border-b border-line pb-2 font-display text-4xl leading-none text-accent">{letter}</h2>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/brands/${b.slug}`}
                      className="group flex min-h-14 items-center justify-between rounded-[var(--radius-control)] border border-line px-5 font-medium transition-colors duration-200 hover:border-ink"
                    >
                      {b.name}
                      <span aria-hidden="true" className="text-faint transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-accent">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <p className="mt-10 text-sm text-muted">
        Can&rsquo;t find your brand?{" "}
        <Link href="/brand-request" className="font-medium text-accent hover:underline">
          Tell us and we&rsquo;ll add it.
        </Link>
      </p>
    </div>
  );
}

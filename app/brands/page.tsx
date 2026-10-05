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
    <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6">
      <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Brand size guides</h1>
      <p className="mt-2 max-w-xl text-muted">Pick a brand to see its full size chart and convert your size.</p>
      {brands.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-soft p-6 text-muted">
          No brands yet.{" "}
          <Link href="/brand-request" className="font-medium text-accent hover:underline">
            Request one
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {[...byLetter.entries()].map(([letter, list]) => (
            <section key={letter} aria-label={letter}>
              <h2 className="text-sm font-semibold text-faint">{letter}</h2>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/brands/${b.slug}`}
                      className="flex min-h-12 items-center justify-between rounded-[var(--radius-control)] border border-line px-4 font-medium transition-colors hover:border-ink"
                    >
                      {b.name}
                      <span aria-hidden="true" className="text-faint">→</span>
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

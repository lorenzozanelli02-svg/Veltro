import { ArrowUpRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Converter } from "@/components/Converter";
import { SizeChartTable } from "@/components/SizeChartTable";
import { getAllRowsForBrand, getBrandBySlug, getOptionsIndex, sortedChart } from "@/lib/data";
import { SITE } from "@/lib/site";
import { CATEGORIES, GENDERS, type Category, type Gender, type SizeChartRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const GENDER_WORD: Record<Gender, string> = { women: "Women's", men: "Men's" };

function groups(rows: SizeChartRow[]) {
  const out: { gender: Gender; category: Category; rows: SizeChartRow[] }[] = [];
  for (const g of GENDERS)
    for (const c of CATEGORIES) {
      const list = rows.filter((r) => r.gender === g && r.category === c);
      if (list.length) out.push({ gender: g, category: c, rows: sortedChart(list, c) });
    }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = getBrandBySlug((await params).slug);
  if (!brand) return { title: "Brand not found" };
  const rows = getAllRowsForBrand(brand.name);
  const kinds = groups(rows).map((g) => `${GENDER_WORD[g.gender].toLowerCase()} ${g.category}`);
  const what = kinds.length ? kinds.slice(0, 3).join(", ") : "clothing";
  return {
    title: `${brand.name} size guide and converter`,
    description: `${brand.name} size chart for ${what} in cm and inches. Convert your size from another brand to find your ${brand.name} size.`,
    alternates: { canonical: `/brands/${brand.slug}` },
    openGraph: { title: `${brand.name} size guide and converter | ${SITE.name}` },
  };
}

export default async function BrandPage({ params }: Props) {
  const brand = getBrandBySlug((await params).slug);
  if (!brand) notFound();
  const rows = getAllRowsForBrand(brand.name);
  const chartGroups = groups(rows);
  const first = chartGroups[0];
  const sources = [...new Set(rows.map((r) => r.source_url).filter(Boolean))] as string[];
  const checked = rows.map((r) => r.last_checked).filter(Boolean).sort().at(-1);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted sm:pt-12">
        <Link href="/brands" className="hover:text-ink">
          Brands
        </Link>{" "}
        / <span className="text-ink">{brand.name}</span>
      </nav>
      <header className="mt-3 max-w-2xl">
        <h1 className="font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-7xl">
          {brand.name} <em className="text-accent">size guide</em>
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          The full {brand.name} size chart, plus a converter that finds your {brand.name} size from a brand you already wear.
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="convert" className="rounded-[28px] border border-line p-4 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_30px_60px_-30px_rgba(17,17,16,0.22)] sm:p-6 lg:sticky lg:top-20">
          <h2 id="convert" className="mb-4 font-display text-[28px] leading-tight">
            Find your {brand.name} size
          </h2>
          <Converter
            index={getOptionsIndex()}
            preset={{ gender: first?.gender, category: first?.category, toBrand: brand.name }}
          />
        </section>

        <section aria-labelledby="charts" className="min-w-0">
          <h2 id="charts" className="sr-only">
            {brand.name} size charts
          </h2>
          {chartGroups.length === 0 ? (
            <p className="rounded-2xl bg-soft p-6 text-muted">We don&rsquo;t have {brand.name}&rsquo;s size chart yet.</p>
          ) : (
            <div className="space-y-10">
              {chartGroups.map((g) => (
                <SizeChartTable key={`${g.gender}-${g.category}`} rows={g.rows} caption={`${GENDER_WORD[g.gender]} ${g.category}`} />
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 text-sm text-muted">
            {brand.shop_url && (
              <a
                href={brand.shop_url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink px-6 text-base font-semibold text-white transition-colors hover:bg-black sm:w-auto sm:self-start"
              >
                Shop {brand.name}
                <ArrowUpRight aria-hidden="true" className="size-5" />
              </a>
            )}
            {sources.length > 0 && (
              <p>
                Source:{" "}
                {sources.map((s, i) => (
                  <span key={s}>
                    {i > 0 && ", "}
                    <a href={s} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-ink">
                      {brand.name} official size chart
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  </span>
                ))}
                {checked && <> · Last checked {checked}</>}
              </p>
            )}
            <p>Sizes are a guide. Fit varies by item and style.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

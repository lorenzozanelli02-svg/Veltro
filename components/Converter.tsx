"use client";

import { ArrowDown, ChevronDown, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OptionsIndex } from "@/lib/data";
import { standardSizeOptions } from "@/lib/standard-sizes";
import type { Category, Gender } from "@/lib/types";
import { Combobox } from "./Combobox";
import { ResultCard, type ConvertResponse } from "./ResultCard";
import { Segmented } from "./Segmented";

const CATEGORY_LABELS: Record<Category, string> = { tops: "Tops", bottoms: "Bottoms", dresses: "Dresses" };

export type ConverterPreset = {
  gender?: Gender;
  category?: Category;
  fromBrand?: string;
  toBrand?: string;
};

export function Converter({ index, preset = {} }: { index: OptionsIndex; preset?: ConverterPreset }) {
  const [gender, setGender] = useState<Gender>(preset.gender ?? "women");
  const [category, setCategory] = useState<Category>(preset.category ?? "tops");
  const [fromBrand, setFromBrand] = useState(preset.fromBrand ?? "");
  const [sizeId, setSizeId] = useState("");
  const [toBrand, setToBrand] = useState(preset.toBrand ?? "");
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [submitted, setSubmitted] = useState<{ gender: Gender; category: Category } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () =>
      (Object.keys(CATEGORY_LABELS) as Category[]).filter(
        (c) => c !== "dresses" || gender === "women" || index[gender].dresses.some((b) => !b.estimate),
      ),
    [gender, index],
  );
  const activeCategory = categories.includes(category) ? category : "tops";
  const brands = index[gender][activeCategory];
  const brandNames = useMemo(() => brands.map((b) => b.name), [brands]);
  const estimateTags = useMemo(
    () => Object.fromEntries(brands.filter((b) => b.estimate).map((b) => [b.name, "Estimate"])),
    [brands],
  );
  const fromOption = brands.find((b) => b.name === fromBrand);
  // A brand without a chart offers standard sizes, grouped by region ("UK 10" -> UK).
  const sizeGroups = useMemo(() => {
    if (!fromOption?.estimate) return null;
    const groups = new Map<string, { id: string; label: string }[]>();
    for (const s of standardSizeOptions(gender, activeCategory)) {
      const region = s.label.split(" ")[0];
      groups.set(region, [...(groups.get(region) ?? []), s]);
    }
    return [...groups.entries()];
  }, [fromOption, gender, activeCategory]);
  const sizes = sizeGroups ? sizeGroups.flatMap(([, list]) => list) : (fromOption?.sizes ?? []);

  // Keep selections valid when gender or category changes.
  useEffect(() => {
    if (fromBrand && !brandNames.includes(fromBrand)) setFromBrand("");
    if (toBrand && !brandNames.includes(toBrand)) setToBrand("");
  }, [brandNames, fromBrand, toBrand]);
  useEffect(() => {
    if (sizeId && !sizes.some((s) => String(s.id) === sizeId)) setSizeId("");
  }, [sizes, sizeId]);

  function resetOutcome() {
    setResult(null);
    setError(null);
    setMissing([]);
  }

  async function findSize(e: React.FormEvent) {
    e.preventDefault();
    const gaps = [!fromBrand && "fromBrand", !sizeId && "size", !toBrand && "toBrand"].filter(Boolean) as string[];
    setMissing(gaps);
    if (gaps.length) {
      setError("Choose your brand, your size and the brand you're buying from.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, category: activeCategory, sourceId: sizeId, fromBrand, toBrand }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(data);
        setSubmitted({ gender, category: activeCategory });
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!result || !resultRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    resultRef.current.focus({ preventScroll: true });
  }, [result]);

  const noBrands = brands.length === 0;
  const requestLink = (
    <Link href="/brand-request" className="font-medium text-accent underline-offset-2 hover:underline">
      Request it
    </Link>
  );

  return (
    <div>
      <form onSubmit={findSize} noValidate className="flex flex-col gap-3">
        <div className="grid gap-2">
          <Segmented
            name="gender"
            legend="Shopping for"
            value={gender}
            onChange={(g) => {
              setGender(g);
              resetOutcome();
            }}
            options={[
              { value: "women", label: "Women" },
              { value: "men", label: "Men" },
            ]}
          />
          <Segmented
            name="category"
            legend="Category"
            value={activeCategory}
            onChange={(c) => {
              setCategory(c);
              resetOutcome();
            }}
            options={categories.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          />
        </div>

        {noBrands ? (
          <p className="rounded-[var(--radius-control)] bg-soft px-4 py-5 text-center text-[15px] text-muted">
            No brands yet for {gender === "women" ? "women's" : "men's"} {activeCategory}. {requestLink}
          </p>
        ) : (
          <>
            <div className="mt-1">
              <p id="i-wear" className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
                I wear
              </p>
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2" role="group" aria-labelledby="i-wear">
                <Combobox
                  id="from-brand"
                  label="Brand you wear"
                  value={fromBrand}
                  options={brandNames}
                  tags={estimateTags}
                  invalid={missing.includes("fromBrand") && !fromBrand}
                  onChange={(v) => {
                    setFromBrand(v);
                    setSizeId("");
                    resetOutcome();
                  }}
                  placeholder="Brand"
                  emptyText={<>Not listed yet. {requestLink}</>}
                />
                <div className="relative">
                  <label htmlFor="from-size" className="sr-only">
                    Your size
                  </label>
                  <select
                    id="from-size"
                    value={sizeId}
                    disabled={!fromBrand}
                    aria-invalid={(missing.includes("size") && !sizeId) || undefined}
                    onChange={(e) => {
                      setSizeId(e.target.value);
                      resetOutcome();
                    }}
                    className={`h-12 w-full cursor-pointer appearance-none truncate rounded-[var(--radius-control)] border bg-white pl-3.5 pr-8 text-base text-ink outline-none transition-colors focus:border-ink disabled:cursor-not-allowed disabled:bg-soft disabled:text-faint ${
                      missing.includes("size") && !sizeId && fromBrand ? "border-danger" : "border-line"
                    }`}
                  >
                    <option value="">Size</option>
                    {sizeGroups
                      ? sizeGroups.map(([region, list]) => (
                          <optgroup key={region} label={`${region} sizes`}>
                            {list.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      : sizes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <ArrowDown aria-hidden="true" className="size-3.5 text-faint" />
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">I&rsquo;m buying from</p>
              </div>
              <Combobox
                id="to-brand"
                label="Brand you're buying from"
                value={toBrand}
                options={brandNames}
                tags={estimateTags}
                invalid={missing.includes("toBrand") && !toBrand}
                onChange={(v) => {
                  setToBrand(v);
                  resetOutcome();
                }}
                placeholder="Brand"
                emptyText={<>Not listed yet. {requestLink}</>}
              />
              <p className="mt-2 text-[13px] text-muted">
                Can&rsquo;t find your brand?{" "}
                <Link href="/brand-request" className="font-medium text-ink underline decoration-line underline-offset-[3px] hover:decoration-ink">
                  Tell us and we&rsquo;ll add it.
                </Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent text-[17px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_6px_16px_-6px_rgba(194,65,12,0.55)] transition-[background-color,transform] duration-150 hover:bg-accent-hover active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
            >
              {loading && <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />}
              {loading ? "Finding your size…" : "Find my size"}
            </button>

            <p role="alert" aria-live="polite" className={`text-center text-sm text-danger ${error ? "" : "sr-only"}`}>
              {error}
            </p>
          </>
        )}
      </form>

      {result && submitted && (
        <div ref={resultRef} tabIndex={-1} className="scroll-mt-4 pt-6 outline-none">
          <ResultCard result={result} gender={submitted.gender} category={submitted.category} />
        </div>
      )}
    </div>
  );
}

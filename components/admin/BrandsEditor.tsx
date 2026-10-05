"use client";

import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BrandWithStats } from "@/lib/data";
import { btnDanger, btnPrimary, btnSecondary, field, td, th } from "./ui";

type Draft = { name: string; slug: string; shop_url: string };

export function BrandsEditor() {
  const [brands, setBrands] = useState<BrandWithStats[]>([]);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", slug: "", shop_url: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/brands");
    if (res.ok) setBrands((await res.json()).brands);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function start(b: BrandWithStats | null) {
    setError(null);
    setEditing(b ? b.id : "new");
    setDraft(b ? { name: b.name, slug: b.slug, shop_url: b.shop_url ?? "" } : { name: "", slug: "", shop_url: "" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(editing === "new" ? "/api/admin/brands" : `/api/admin/brands/${editing}`, {
      method: editing === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) return setError((await res.json()).error ?? "Save failed");
    setEditing(null);
    load();
  }

  async function remove(b: BrandWithStats) {
    const msg = b.row_count
      ? `Delete ${b.name} and its ${b.row_count} size chart rows? This can't be undone.`
      : `Delete ${b.name}?`;
    if (!confirm(msg)) return;
    await fetch(`/api/admin/brands/${b.id}`, { method: "DELETE" });
    load();
  }

  const form = (
    <form onSubmit={save} className="grid gap-3 rounded-2xl border border-ink p-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
      <div>
        <label htmlFor="b-name" className="mb-1 block text-xs font-medium text-muted">Name</label>
        <input id="b-name" className={field} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </div>
      <div>
        <label htmlFor="b-slug" className="mb-1 block text-xs font-medium text-muted">URL slug</label>
        <input id="b-slug" className={field} placeholder="auto" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
      </div>
      <div>
        <label htmlFor="b-url" className="mb-1 block text-xs font-medium text-muted">Shop URL (affiliate link)</label>
        <input id="b-url" className={field} type="url" inputMode="url" placeholder="https://" value={draft.shop_url} onChange={(e) => setDraft({ ...draft, shop_url: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className={btnPrimary}>Save</button>
        <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
      </div>
      {error && <p role="alert" className="text-sm text-danger sm:col-span-4">{error}</p>}
    </form>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="mt-1 text-sm text-muted">Brands are created automatically when you import size data. Add shop links here.</p>
        </div>
        <button type="button" className={btnPrimary} onClick={() => start(null)}>
          <Plus aria-hidden="true" className="size-4" /> Add brand
        </button>
      </div>
      {editing === "new" && <div className="mt-4">{form}</div>}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-soft">
            <tr>
              {["Brand", "Page", "Size rows", "Shop URL", ""].map((h) => (
                <th key={h} scope="col" className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {brands.map((b) =>
              editing === b.id ? (
                <tr key={b.id}>
                  <td colSpan={5} className="p-2">{form}</td>
                </tr>
              ) : (
                <tr key={b.id}>
                  <td className={`${td} font-medium`}>{b.name}</td>
                  <td className={td}>
                    <Link href={`/brands/${b.slug}`} className="text-muted underline underline-offset-2 hover:text-ink">/brands/{b.slug}</Link>
                  </td>
                  <td className={`${td} tabular-nums`}>{b.row_count}</td>
                  <td className={`${td} max-w-[18rem] truncate`}>
                    {b.shop_url ? (
                      <a href={b.shop_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-ink">
                        {b.shop_url} <ExternalLink aria-hidden="true" className="size-3" />
                      </a>
                    ) : (
                      <span className="text-faint">Not set</span>
                    )}
                  </td>
                  <td className={`${td} text-right`}>
                    <button type="button" className={`${btnSecondary} min-h-9`} onClick={() => start(b)}>Edit</button>
                    <button type="button" className={btnDanger} onClick={() => remove(b)}>Delete</button>
                  </td>
                </tr>
              ),
            )}
            {brands.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">No brands yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

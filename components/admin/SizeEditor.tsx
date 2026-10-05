"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, GENDERS, SIZE_CHART_COLUMNS, type SizeChartRow } from "@/lib/types";
import { btnPrimary, btnSecondary, field, td, th } from "./ui";

type Draft = Record<(typeof SIZE_CHART_COLUMNS)[number], string>;

const EMPTY: Draft = Object.fromEntries(SIZE_CHART_COLUMNS.map((c) => [c, ""])) as Draft;

function toDraft(r: SizeChartRow): Draft {
  return Object.fromEntries(SIZE_CHART_COLUMNS.map((c) => [c, r[c] == null ? "" : String(r[c])])) as Draft;
}

function range(a: number | null, b: number | null) {
  if (a == null && b == null) return "—";
  return a === b || b == null || a == null ? String(a ?? b) : `${a}–${b}`;
}

export function SizeEditor() {
  const [rows, setRows] = useState<SizeChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ brand: "", gender: "", category: "" });
  const [editing, setEditing] = useState<{ id: number | null; draft: Draft } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams(Object.entries(filter).filter(([, v]) => v));
    const res = await fetch(`/api/admin/sizes?${q}`);
    if (res.ok) setRows((await res.json()).rows);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    const res = await fetch(editing.id ? `/api/admin/sizes/${editing.id}` : "/api/admin/sizes", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing.draft),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? "Save failed");
    setEditing(null);
    load();
  }

  async function remove(r: SizeChartRow) {
    if (!confirm(`Delete ${r.brand} ${r.gender} ${r.category} size ${r.size_label}?`)) return;
    await fetch(`/api/admin/sizes/${r.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Size chart</h1>
          <p className="mt-1 text-sm text-muted">{loading ? "Loading…" : `${rows.length} rows`}</p>
        </div>
        <button type="button" className={btnPrimary} onClick={() => { setError(null); setEditing({ id: null, draft: { ...EMPTY, brand: filter.brand, gender: filter.gender, category: filter.category } }); }}>
          <Plus aria-hidden="true" className="size-4" /> Add row
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_10rem_10rem]">
        <label className="sr-only" htmlFor="f-brand">Filter by brand</label>
        <input id="f-brand" className={field} placeholder="Filter by exact brand name" value={filter.brand} onChange={(e) => setFilter({ ...filter, brand: e.target.value })} />
        <label className="sr-only" htmlFor="f-gender">Gender</label>
        <select id="f-gender" className={field} value={filter.gender} onChange={(e) => setFilter({ ...filter, gender: e.target.value })}>
          <option value="">All genders</option>
          {GENDERS.map((g) => <option key={g}>{g}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-category">Category</label>
        <select id="f-category" className={field} value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {editing && (
        <form onSubmit={save} className="mt-5 rounded-2xl border border-ink p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing.id ? `Edit row #${editing.id}` : "New row"}</h2>
            <button type="button" aria-label="Close editor" className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-soft" onClick={() => setEditing(null)}>
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SIZE_CHART_COLUMNS.map((c) => (
              <div key={c} className={c === "source_url" || c === "notes" ? "col-span-2" : ""}>
                <label htmlFor={`e-${c}`} className="mb-1 block font-mono text-xs text-muted">{c}</label>
                {c === "gender" || c === "category" ? (
                  <select id={`e-${c}`} className={field} value={editing.draft[c]} required onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, [c]: e.target.value } })}>
                    <option value="">Choose…</option>
                    {(c === "gender" ? GENDERS : CATEGORIES).map((v) => <option key={v}>{v}</option>)}
                  </select>
                ) : (
                  <input
                    id={`e-${c}`}
                    className={field}
                    value={editing.draft[c]}
                    inputMode={c.endsWith("_cm") ? "decimal" : undefined}
                    type={c === "last_checked" ? "date" : "text"}
                    required={c === "brand" || c === "size_label"}
                    onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, [c]: e.target.value } })}
                  />
                )}
              </div>
            ))}
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save row"}</button>
            <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-soft">
            <tr>
              {["Brand", "Gender", "Category", "Region", "Size", "Chest", "Waist", "Hips", "Leg", "Foot", "Checked", ""].map((h) => (
                <th key={h} scope="col" className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-soft/60">
                <td className={`${td} font-medium`}>{r.brand}</td>
                <td className={td}>{r.gender}</td>
                <td className={td}>{r.category}</td>
                <td className={td}>{r.region ?? "—"}</td>
                <td className={`${td} font-semibold`}>{r.size_label}</td>
                <td className={`${td} tabular-nums`}>{range(r.chest_min_cm, r.chest_max_cm)}</td>
                <td className={`${td} tabular-nums`}>{range(r.waist_min_cm, r.waist_max_cm)}</td>
                <td className={`${td} tabular-nums`}>{range(r.hips_min_cm, r.hips_max_cm)}</td>
                <td className={`${td} tabular-nums`}>{r.inside_leg_cm ?? "—"}</td>
                <td className={`${td} tabular-nums`}>{r.foot_length_cm ?? "—"}</td>
                <td className={td}>{r.last_checked ?? "—"}</td>
                <td className={`${td} text-right`}>
                  <button type="button" aria-label={`Edit ${r.brand} ${r.size_label}`} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-white" onClick={() => { setError(null); setEditing({ id: r.id, draft: toDraft(r) }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <Pencil aria-hidden="true" className="size-4" />
                  </button>
                  <button type="button" aria-label={`Delete ${r.brand} ${r.size_label}`} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-danger hover:bg-red-50" onClick={() => remove(r)}>
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-muted">No rows match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

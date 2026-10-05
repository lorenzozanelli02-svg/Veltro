"use client";

import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { SIZE_CHART_COLUMNS } from "@/lib/types";
import { btnPrimary, btnSecondary } from "./ui";

const MODES = [
  { value: "append", label: "Add rows", help: "Keep everything that's already there and add these rows." },
  { value: "replace_brands", label: "Replace brands in this file", help: "Delete existing rows for each brand in the file, then add these rows." },
  { value: "replace_all", label: "Replace the whole table", help: "Delete every SizeChart row, then add these rows." },
];

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("append");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setErrors(["Choose a CSV file first."]);
    if (mode === "replace_all" && !confirm("This deletes every row in the size chart before importing. Continue?")) return;
    setBusy(true);
    setErrors([]);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: await file.text(), mode }),
      });
      const data = await res.json();
      if (!res.ok) setErrors(data.errors ?? [data.error ?? "Import failed"]);
      else setMessage(`Imported ${data.inserted} rows${data.deleted ? `, replaced ${data.deleted} existing rows` : ""}.`);
    } catch {
      setErrors(["Couldn't reach the server."]);
    } finally {
      setBusy(false);
    }
  }

  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(SIZE_CHART_COLUMNS.join(",") + "\n")}`;

  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-8 text-center transition-colors hover:border-ink has-[:focus-visible]:border-accent">
        <Upload aria-hidden="true" className="size-6 text-muted" />
        <span className="font-medium">{file ? file.name : "Choose a CSV file"}</span>
        <span className="text-sm text-muted">{file ? `${(file.size / 1024).toFixed(1)} KB` : "or drop it here"}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setErrors([]);
            setMessage(null);
          }}
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Import mode</legend>
        {MODES.map((m) => (
          <label key={m.value} className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 has-[:checked]:border-ink">
            <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="mt-1 accent-[var(--color-accent)]" />
            <span>
              <span className="block text-[15px] font-medium">{m.label}</span>
              <span className="block text-sm text-muted">{m.help}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Importing…" : "Import CSV"}
        </button>
        <a href={template} download="SizeChart-template.csv" className={btnSecondary}>
          <Download aria-hidden="true" className="size-4" /> Template
        </a>
        <a href="/api/admin/export" className={btnSecondary}>
          <Download aria-hidden="true" className="size-4" /> Export current data
        </a>
      </div>

      {message && (
        <p role="status" className="rounded-xl bg-good-soft p-3 text-[15px] text-good">
          {message}
        </p>
      )}
      {errors.length > 0 && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-danger">
          <p className="font-semibold">Nothing was imported. Fix these problems and try again:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

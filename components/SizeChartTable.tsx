"use client";

import type { SizeChartRow } from "@/lib/types";
import { formatRange } from "@/lib/units";
import { Segmented } from "./Segmented";
import { useUnit } from "./useUnit";

type Col = { key: string; label: string; value: (r: SizeChartRow) => [number | null, number | null] };

const COLS: Col[] = [
  { key: "chest", label: "Chest", value: (r) => [r.chest_min_cm, r.chest_max_cm] },
  { key: "waist", label: "Waist", value: (r) => [r.waist_min_cm, r.waist_max_cm] },
  { key: "hips", label: "Hips", value: (r) => [r.hips_min_cm, r.hips_max_cm] },
  { key: "leg", label: "Inside leg", value: (r) => [r.inside_leg_cm, r.inside_leg_cm] },
  { key: "foot", label: "Foot length", value: (r) => [r.foot_length_cm, r.foot_length_cm] },
];

export function SizeChartTable({ rows, caption }: { rows: SizeChartRow[]; caption: string }) {
  const [unit, setUnit] = useUnit();
  const cols = COLS.filter((c) => rows.some((r) => c.value(r).some((v) => v != null)));
  const multiRegion = new Set(rows.map((r) => r.region ?? "")).size > 1;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-[30px] leading-tight">{caption}</h3>
        <div className="w-28 shrink-0">
          <Segmented
            name={`unit-${caption}`}
            legend="Units"
            size="sm"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "cm", label: "cm" },
              { value: "in", label: "in" },
            ]}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[22rem] border-collapse text-left text-[15px]">
          <caption className="sr-only">
            {caption}, measurements in {unit === "cm" ? "centimetres" : "inches"}
          </caption>
          <thead className="bg-soft text-[13px] text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Size{!multiRegion && rows[0]?.region ? ` (${rows[0].region})` : ""}
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className="px-4 py-2.5 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="px-4 py-3 font-semibold">
                  {multiRegion && r.region ? `${r.region} ${r.size_label}` : r.size_label}
                </th>
                {cols.map((c) => {
                  const [a, b] = c.value(r);
                  return (
                    <td key={c.key} className="px-4 py-3 tabular-nums text-ink">
                      {a == null && b == null ? <span className="text-faint">—</span> : formatRange(a, b, unit)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Papa from "papaparse";
import { SIZE_CHART_COLUMNS, type SizeChartInput, type SizeChartRow } from "./types";
import { checkHeaders, parseSizeRow } from "./validate";

export type CsvParseResult =
  | { ok: true; rows: SizeChartInput[] }
  | { ok: false; errors: string[] };

const MAX_REPORTED_ERRORS = 50;

export function parseSizeChartCsv(text: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const headerErrors = checkHeaders(parsed.meta.fields ?? []);
  if (headerErrors.length) return { ok: false, errors: headerErrors };

  const errors: string[] = [];
  for (const e of parsed.errors) {
    if (e.code !== "UndetectableDelimiter") errors.push(`Line ${(e.row ?? 0) + 2}: ${e.message}`);
  }
  const rows: SizeChartInput[] = [];
  parsed.data.forEach((raw, i) => {
    const { row, errors: rowErrors } = parseSizeRow(raw);
    if (rowErrors.length) errors.push(`Line ${i + 2}: ${rowErrors.join("; ")}`);
    else if (row) rows.push(row);
  });
  if (rows.length === 0 && errors.length === 0) errors.push("The file has no data rows.");
  if (errors.length) {
    const extra = errors.length - MAX_REPORTED_ERRORS;
    return {
      ok: false,
      errors: extra > 0 ? [...errors.slice(0, MAX_REPORTED_ERRORS), `…and ${extra} more`] : errors,
    };
  }
  return { ok: true, rows };
}

export function toCsv(rows: (SizeChartRow | SizeChartInput)[]): string {
  return Papa.unparse({
    fields: [...SIZE_CHART_COLUMNS],
    data: rows.map((r) => SIZE_CHART_COLUMNS.map((c) => r[c] ?? "")),
  });
}

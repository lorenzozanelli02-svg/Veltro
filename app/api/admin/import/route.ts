import { NextResponse } from "next/server";
import { adminGuard, bad, readJson } from "@/lib/api";
import { parseSizeChartCsv } from "@/lib/csv";
import { importSizeRows, type ImportMode } from "@/lib/data";

const MODES: ImportMode[] = ["append", "replace_brands", "replace_all"];

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const b = await readJson(req);
  if (!b || typeof b.csv !== "string") return bad("Upload a CSV file.");
  const mode = MODES.includes(b.mode as ImportMode) ? (b.mode as ImportMode) : "append";
  const parsed = parseSizeChartCsv(b.csv);
  if (!parsed.ok) return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 422 });
  if (b.dryRun) return NextResponse.json({ ok: true, dryRun: true, rows: parsed.rows.length });
  const result = importSizeRows(parsed.rows, mode);
  return NextResponse.json({ ok: true, ...result });
}

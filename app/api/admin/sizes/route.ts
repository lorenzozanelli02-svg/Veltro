import { NextResponse } from "next/server";
import { adminGuard, bad, readJson } from "@/lib/api";
import { insertSizeRow, listSizeRows } from "@/lib/data";
import { parseSizeRow } from "@/lib/validate";

export async function GET(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const q = new URL(req.url).searchParams;
  const rows = listSizeRows({
    brand: q.get("brand") ?? undefined,
    gender: q.get("gender") ?? undefined,
    category: q.get("category") ?? undefined,
  });
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const b = await readJson(req);
  if (!b) return bad("Invalid request");
  const { row, errors } = parseSizeRow(b);
  if (!row) return bad(errors.join("; "));
  return NextResponse.json({ id: insertSizeRow(row) });
}

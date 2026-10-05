import { NextResponse } from "next/server";
import { adminGuard, bad, readJson } from "@/lib/api";
import { deleteSizeRow, updateSizeRow } from "@/lib/data";
import { parseSizeRow } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await adminGuard();
  if (denied) return denied;
  const id = Number((await params).id);
  const b = await readJson(req);
  if (!b) return bad("Invalid request");
  const { row, errors } = parseSizeRow(b);
  if (!row) return bad(errors.join("; "));
  if (!updateSizeRow(id, row)) return bad("Row not found", 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await adminGuard();
  if (denied) return denied;
  deleteSizeRow(Number((await params).id));
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { adminGuard, bad, cleanUrl, readJson, str } from "@/lib/api";
import { deleteBrand, getBrandByName, updateBrand } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await adminGuard();
  if (denied) return denied;
  const id = Number((await params).id);
  const b = await readJson(req);
  const name = str(b?.name, 120);
  const slug = str(b?.slug, 120) ?? "";
  const shopUrl = cleanUrl(b?.shop_url);
  if (!name) return bad("Brand name is required.");
  if (shopUrl === "invalid") return bad("Shop URL must start with http:// or https://");
  const clash = getBrandByName(name);
  if (clash && clash.id !== id) return bad("Another brand already has that name.");
  try {
    updateBrand(id, { name, slug, shop_url: shopUrl });
  } catch (e) {
    return bad((e as Error).message, 404);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await adminGuard();
  if (denied) return denied;
  deleteBrand(Number((await params).id));
  return NextResponse.json({ ok: true });
}

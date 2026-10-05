import { NextResponse } from "next/server";
import { adminGuard, bad, cleanUrl, readJson, str } from "@/lib/api";
import { createBrand, getBrandByName, listBrands } from "@/lib/data";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json({ brands: listBrands() });
}

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const b = await readJson(req);
  const name = str(b?.name, 120);
  const shopUrl = cleanUrl(b?.shop_url);
  if (!name) return bad("Brand name is required.");
  if (shopUrl === "invalid") return bad("Shop URL must start with http:// or https://");
  if (getBrandByName(name)) return bad("That brand already exists.");
  return NextResponse.json({ id: createBrand(name, shopUrl) });
}

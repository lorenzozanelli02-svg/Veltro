import { NextResponse } from "next/server";
import { bad, readJson, str } from "@/lib/api";
import { addBrandRequest } from "@/lib/data";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b) return bad("Invalid request");
  // Honeypot field: real people never fill it in.
  if (str(b.website)) return NextResponse.json({ ok: true });
  const brand = str(b.brand_name, 120);
  const email = str(b.email, 200);
  if (!brand) return bad("Please enter a brand name.");
  if (email && !EMAIL.test(email)) return bad("That email address doesn't look right.");
  addBrandRequest(brand, email);
  return NextResponse.json({ ok: true });
}

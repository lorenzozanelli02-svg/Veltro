import { NextResponse } from "next/server";
import { bad, readJson, str } from "@/lib/api";
import { addFitFeedback } from "@/lib/data";
import { FIT_RESULTS, isCategory, isGender, type FitResult } from "@/lib/types";

export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b) return bad("Invalid request");
  const from_brand = str(b.from_brand, 200);
  const from_size = str(b.from_size, 100);
  const to_brand = str(b.to_brand, 200);
  const recommended_size = str(b.recommended_size, 100);
  if (!from_brand || !from_size || !to_brand || !recommended_size) return bad("Missing fields");
  if (!isGender(b.gender) || !isCategory(b.category)) return bad("Invalid gender or category");
  if (!FIT_RESULTS.includes(b.fit_result as FitResult)) return bad("Invalid fit result");
  addFitFeedback({
    from_brand,
    from_size,
    to_brand,
    recommended_size,
    gender: b.gender,
    category: b.category,
    fit_result: b.fit_result as FitResult,
  });
  return NextResponse.json({ ok: true });
}

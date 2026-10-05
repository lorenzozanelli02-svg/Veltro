import { NextResponse } from "next/server";
import { bad, readJson, str } from "@/lib/api";
import { convertSize, displaySize } from "@/lib/convert";
import { getBrandByName, getBrandRows, getSizeRow } from "@/lib/data";
import { isCategory, isGender } from "@/lib/types";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("Invalid request");
  const { gender, category } = body;
  const sourceId = Number(body.sourceId);
  const toBrand = str(body.toBrand, 200);
  if (!isGender(gender) || !isCategory(category)) return bad("Choose men or women and a category.");
  if (!Number.isInteger(sourceId) || !toBrand) return bad("Choose your brand, size and the brand you're buying from.");

  const source = getSizeRow(sourceId);
  if (!source || source.gender !== gender || source.category !== category) {
    return bad("That size isn't in our database any more. Please choose it again.", 404);
  }
  const brand = getBrandByName(toBrand);
  const targetRows = getBrandRows(toBrand, gender, category);
  const result = convertSize({ gender, category, source, targetBrand: brand?.name ?? toBrand, targetRows });
  if (!result.ok) return bad(result.error, 422);

  return NextResponse.json({
    ...result,
    from: { brand: source.brand, size: displaySize({ label: source.size_label, region: source.region }) },
    to: { brand: brand?.name ?? toBrand, slug: brand?.slug ?? null, shopUrl: brand?.shop_url ?? null },
  });
}

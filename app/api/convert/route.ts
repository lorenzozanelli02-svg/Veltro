import { NextResponse } from "next/server";
import { bad, readJson, str } from "@/lib/api";
import { convertSize, displaySize } from "@/lib/convert";
import { getAllRowsForBrand, getBrandByName, getBrandRows, getSizeRow } from "@/lib/data";
import { standardRowForId } from "@/lib/standard-sizes";
import { isCategory, isGender } from "@/lib/types";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("Invalid request");
  const { gender, category } = body;
  const sourceId = str(body.sourceId, 50);
  const toBrand = str(body.toBrand, 200);
  if (!isGender(gender) || !isCategory(category)) return bad("Choose men or women and a category.");
  if (!sourceId || !toBrand) return bad("Choose your brand, size and the brand you're buying from.");

  // A "std:" id means the shopper's brand has no chart, so their size maps to standard sizing.
  let source = standardRowForId(gender, category, sourceId);
  let sourceBrandWithoutChart: string | undefined;
  if (source) {
    const fromBrand = getBrandByName(str(body.fromBrand, 200) ?? "");
    if (!fromBrand || getBrandRows(fromBrand.name, gender, category).length > 0) {
      return bad("That size isn't in our database any more. Please choose it again.", 404);
    }
    source = { ...source, brand: fromBrand.name };
    sourceBrandWithoutChart = fromBrand.name;
  } else {
    const id = Number(sourceId);
    source = Number.isInteger(id) ? getSizeRow(id) : null;
    if (!source || source.gender !== gender || source.category !== category) {
      return bad("That size isn't in our database any more. Please choose it again.", 404);
    }
  }
  const brand = getBrandByName(toBrand);
  const targetRows = getBrandRows(toBrand, gender, category);
  const result = convertSize({
    gender,
    category,
    source,
    sourceBrandWithoutChart,
    targetBrand: brand?.name ?? toBrand,
    targetRows,
  });
  if (!result.ok) return bad(result.error, 422);

  return NextResponse.json({
    ...result,
    from: { brand: source.brand, size: displaySize({ label: source.size_label, region: source.region }) },
    to: {
      brand: brand?.name ?? toBrand,
      // Only link to a brand page that has a chart to show.
      slug: brand && getAllRowsForBrand(brand.name).length > 0 ? brand.slug : null,
      shopUrl: brand?.shop_url ?? null,
    },
  });
}

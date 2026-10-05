import { getDb } from "./db";
import { primaryOrder, rangeOf } from "./convert";
import { slugify } from "./slug";
import {
  CATEGORIES,
  GENDERS,
  SIZE_CHART_COLUMNS,
  type Brand,
  type Category,
  type FitResult,
  type Gender,
  type SizeChartInput,
  type SizeChartRow,
} from "./types";

/* ---------------------------------- Size chart ---------------------------------- */

/** `id` is a SizeChart row id, or a standard size id (see `standardSizeId`) for brands without a chart. */
export type SizeOption = { id: string; label: string };
/**
 * `estimate` brands have no chart for this gender and category yet: their `sizes` is empty and the
 * converter offers `standardSizeOptions` instead, so results use standard sizing.
 */
export type BrandOption = { name: string; slug: string; estimate: boolean; sizes: SizeOption[] };
export type OptionsIndex = Record<Gender, Record<Category, BrandOption[]>>;

function sortRows(rows: SizeChartRow[], category: Category): SizeChartRow[] {
  const order = primaryOrder(category);
  const key = (r: SizeChartRow) => {
    for (const m of order) {
      const range = rangeOf(r, m);
      if (range) return range.mid;
    }
    return Number.POSITIVE_INFINITY;
  };
  return [...rows].sort(
    (a, b) =>
      (a.region ?? "").localeCompare(b.region ?? "") || key(a) - key(b) || a.id - b.id,
  );
}

/**
 * Every brand for the converter dropdowns, grouped by gender and category. Brands with chart data list
 * their own sizes; every other known brand is marked as an estimate.
 */
export function getOptionsIndex(): OptionsIndex {
  const db = getDb();
  ensureBrands();
  const rows = db.prepare("SELECT * FROM SizeChart").all() as SizeChartRow[];
  const brands = db.prepare("SELECT name, slug FROM Brands").all() as Brand[];
  const slugs = new Map(brands.map((b) => [b.name.toLowerCase(), b.slug]));
  const index = {} as OptionsIndex;
  for (const g of GENDERS) {
    index[g] = {} as Record<Category, BrandOption[]>;
    for (const c of CATEGORIES) {
      const byBrand = new Map<string, SizeChartRow[]>();
      for (const r of rows) {
        if (r.gender !== g || r.category !== c) continue;
        const list = byBrand.get(r.brand) ?? [];
        list.push(r);
        byBrand.set(r.brand, list);
      }
      const charted: BrandOption[] = [...byBrand.entries()].map(([name, list]) => {
        const multiRegion = new Set(list.map((r) => r.region ?? "")).size > 1;
        return {
          name,
          slug: slugs.get(name.toLowerCase()) ?? slugify(name),
          estimate: false,
          sizes: sortRows(list, c).map((r) => ({
            id: String(r.id),
            label: multiRegion && r.region ? `${r.region} ${r.size_label}` : r.size_label,
          })),
        };
      });
      const chartedNames = new Set(charted.map((b) => b.name.toLowerCase()));
      const estimated: BrandOption[] = brands
        .filter((b) => !chartedNames.has(b.name.toLowerCase()))
        .map((b) => ({ name: b.name, slug: b.slug, estimate: true, sizes: [] }));
      index[g][c] = [...charted, ...estimated].sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  return index;
}

export function getSizeRow(id: number): SizeChartRow | null {
  return (getDb().prepare("SELECT * FROM SizeChart WHERE id = ?").get(id) as SizeChartRow) ?? null;
}

export function getBrandRows(brand: string, gender: Gender, category: Category): SizeChartRow[] {
  return getDb()
    .prepare("SELECT * FROM SizeChart WHERE brand = ? COLLATE NOCASE AND gender = ? AND category = ?")
    .all(brand, gender, category) as SizeChartRow[];
}

export function getAllRowsForBrand(brand: string): SizeChartRow[] {
  const rows = getDb()
    .prepare("SELECT * FROM SizeChart WHERE brand = ? COLLATE NOCASE")
    .all(brand) as SizeChartRow[];
  return rows;
}

export function sortedChart(rows: SizeChartRow[], category: Category) {
  return sortRows(rows, category);
}

export type SizeChartFilter = { brand?: string; gender?: string; category?: string };

export function listSizeRows(filter: SizeChartFilter = {}): SizeChartRow[] {
  const where: string[] = [];
  const args: string[] = [];
  if (filter.brand) {
    where.push("brand = ? COLLATE NOCASE");
    args.push(filter.brand);
  }
  if (filter.gender) {
    where.push("gender = ?");
    args.push(filter.gender);
  }
  if (filter.category) {
    where.push("category = ?");
    args.push(filter.category);
  }
  const sql = `SELECT * FROM SizeChart ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY brand COLLATE NOCASE, gender, category, region, id`;
  return getDb().prepare(sql).all(...args) as SizeChartRow[];
}

const INSERT_ROW = `INSERT INTO SizeChart (${SIZE_CHART_COLUMNS.join(", ")}) VALUES (${SIZE_CHART_COLUMNS.map((c) => `@${c}`).join(", ")})`;

export function insertSizeRow(row: SizeChartInput): number {
  const db = getDb();
  const info = db.prepare(INSERT_ROW).run(row);
  ensureBrands();
  return Number(info.lastInsertRowid);
}

export function updateSizeRow(id: number, row: SizeChartInput): boolean {
  const db = getDb();
  const sets = SIZE_CHART_COLUMNS.map((c) => `${c} = @${c}`).join(", ");
  const info = db.prepare(`UPDATE SizeChart SET ${sets} WHERE id = @id`).run({ ...row, id });
  ensureBrands();
  return info.changes > 0;
}

export function deleteSizeRow(id: number): boolean {
  return getDb().prepare("DELETE FROM SizeChart WHERE id = ?").run(id).changes > 0;
}

export type ImportMode = "append" | "replace_brands" | "replace_all";

export function importSizeRows(rows: SizeChartInput[], mode: ImportMode): { inserted: number; deleted: number } {
  const db = getDb();
  const insert = db.prepare(INSERT_ROW);
  const run = db.transaction(() => {
    let deleted = 0;
    if (mode === "replace_all") {
      deleted = db.prepare("DELETE FROM SizeChart").run().changes;
    } else if (mode === "replace_brands") {
      const del = db.prepare("DELETE FROM SizeChart WHERE brand = ? COLLATE NOCASE");
      for (const brand of new Set(rows.map((r) => r.brand.toLowerCase()))) deleted += del.run(brand).changes;
    }
    for (const r of rows) insert.run(r);
    return { inserted: rows.length, deleted };
  });
  const result = run();
  ensureBrands();
  return result;
}

/* ------------------------------------ Brands ------------------------------------ */

/** Make sure every brand in SizeChart has a Brands row (with a unique slug). */
export function ensureBrands(): void {
  const db = getDb();
  const missing = db
    .prepare(
      `SELECT DISTINCT s.brand FROM SizeChart s
       WHERE NOT EXISTS (SELECT 1 FROM Brands b WHERE b.name = s.brand COLLATE NOCASE)`,
    )
    .all() as { brand: string }[];
  if (missing.length === 0) return;
  const insert = db.prepare("INSERT OR IGNORE INTO Brands (name, slug) VALUES (?, ?)");
  db.transaction(() => {
    for (const { brand } of missing) insert.run(brand, uniqueSlug(slugify(brand)));
  })();
}

function uniqueSlug(base: string, exceptId?: number): string {
  const db = getDb();
  const taken = db.prepare("SELECT id FROM Brands WHERE slug = ?");
  let slug = base;
  for (let i = 2; ; i++) {
    const row = taken.get(slug) as { id: number } | undefined;
    if (!row || row.id === exceptId) return slug;
    slug = `${base}-${i}`;
  }
}

export type BrandWithStats = Brand & { row_count: number };

export function listBrands(): BrandWithStats[] {
  ensureBrands();
  return getDb()
    .prepare(
      `SELECT b.id, b.name, b.slug, b.shop_url,
              (SELECT COUNT(*) FROM SizeChart s WHERE s.brand = b.name COLLATE NOCASE) AS row_count
       FROM Brands b ORDER BY b.name COLLATE NOCASE`,
    )
    .all() as BrandWithStats[];
}

/** Brands that have size chart data, for public pages. */
export function listPublicBrands(): Brand[] {
  return listBrands().filter((b) => b.row_count > 0);
}

export function getBrandBySlug(slug: string): Brand | null {
  ensureBrands();
  return (getDb().prepare("SELECT id, name, slug, shop_url FROM Brands WHERE slug = ?").get(slug) as Brand) ?? null;
}

export function getBrandByName(name: string): Brand | null {
  ensureBrands();
  return (
    (getDb().prepare("SELECT id, name, slug, shop_url FROM Brands WHERE name = ? COLLATE NOCASE").get(name) as Brand) ??
    null
  );
}

export function createBrand(name: string, shopUrl: string | null): number {
  const info = getDb()
    .prepare("INSERT INTO Brands (name, slug, shop_url) VALUES (?, ?, ?)")
    .run(name, uniqueSlug(slugify(name)), shopUrl);
  return Number(info.lastInsertRowid);
}

/** Update a brand; renaming it also renames its SizeChart rows. */
export function updateBrand(id: number, data: { name: string; slug: string; shop_url: string | null }): void {
  const db = getDb();
  const current = db.prepare("SELECT * FROM Brands WHERE id = ?").get(id) as Brand | undefined;
  if (!current) throw new Error("Brand not found");
  db.transaction(() => {
    db.prepare("UPDATE Brands SET name = ?, slug = ?, shop_url = ? WHERE id = ?").run(
      data.name,
      uniqueSlug(slugify(data.slug || data.name), id),
      data.shop_url,
      id,
    );
    if (current.name !== data.name) {
      db.prepare("UPDATE SizeChart SET brand = ? WHERE brand = ? COLLATE NOCASE").run(data.name, current.name);
    }
  })();
}

/** Delete a brand and all of its SizeChart rows. */
export function deleteBrand(id: number): void {
  const db = getDb();
  const current = db.prepare("SELECT * FROM Brands WHERE id = ?").get(id) as Brand | undefined;
  if (!current) return;
  db.transaction(() => {
    db.prepare("DELETE FROM SizeChart WHERE brand = ? COLLATE NOCASE").run(current.name);
    db.prepare("DELETE FROM Brands WHERE id = ?").run(id);
  })();
}

/* -------------------------------- Brand requests -------------------------------- */

export function addBrandRequest(brandName: string, email: string | null): void {
  getDb().prepare("INSERT INTO BrandRequest (brand_name, email) VALUES (?, ?)").run(brandName, email);
}

export type BrandRequestSummary = {
  brand_name: string;
  requests: number;
  emails: number;
  last_requested: string;
};

export function brandRequestSummary(): BrandRequestSummary[] {
  return getDb()
    .prepare(
      `SELECT MIN(brand_name) AS brand_name, COUNT(*) AS requests,
              COUNT(NULLIF(TRIM(COALESCE(email, '')), '')) AS emails,
              MAX(created_date) AS last_requested
       FROM BrandRequest
       GROUP BY LOWER(TRIM(brand_name))
       ORDER BY requests DESC, last_requested DESC`,
    )
    .all() as BrandRequestSummary[];
}

export type BrandRequestRow = { id: number; brand_name: string; email: string | null; created_date: string };

export function listBrandRequests(): BrandRequestRow[] {
  return getDb().prepare("SELECT * FROM BrandRequest ORDER BY created_date DESC, id DESC").all() as BrandRequestRow[];
}

export function deleteBrandRequestsFor(brandName: string): void {
  getDb().prepare("DELETE FROM BrandRequest WHERE LOWER(TRIM(brand_name)) = LOWER(TRIM(?))").run(brandName);
}

/* --------------------------------- Fit feedback --------------------------------- */

export type FitFeedbackInput = {
  from_brand: string;
  from_size: string;
  to_brand: string;
  recommended_size: string;
  gender: Gender;
  category: Category;
  fit_result: FitResult;
};

export function addFitFeedback(f: FitFeedbackInput): void {
  getDb()
    .prepare(
      `INSERT INTO FitFeedback (from_brand, from_size, to_brand, recommended_size, gender, category, fit_result)
       VALUES (@from_brand, @from_size, @to_brand, @recommended_size, @gender, @category, @fit_result)`,
    )
    .run(f);
}

export type FitFeedbackSummary = {
  from_brand: string;
  to_brand: string;
  gender: string;
  category: string;
  total: number;
  too_small: number;
  perfect: number;
  too_big: number;
};

export function fitFeedbackSummary(): FitFeedbackSummary[] {
  return getDb()
    .prepare(
      `SELECT from_brand, to_brand, gender, category, COUNT(*) AS total,
              SUM(fit_result = 'too_small') AS too_small,
              SUM(fit_result = 'perfect') AS perfect,
              SUM(fit_result = 'too_big') AS too_big
       FROM FitFeedback
       GROUP BY from_brand COLLATE NOCASE, to_brand COLLATE NOCASE, gender, category
       ORDER BY total DESC`,
    )
    .all() as FitFeedbackSummary[];
}

export function adminCounts() {
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    rows: one("SELECT COUNT(*) AS n FROM SizeChart"),
    brands: one("SELECT COUNT(DISTINCT brand COLLATE NOCASE) AS n FROM SizeChart"),
    requests: one("SELECT COUNT(*) AS n FROM BrandRequest"),
    feedback: one("SELECT COUNT(*) AS n FROM FitFeedback"),
  };
}

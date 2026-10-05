# Veltro — clothing size converter

A mobile-first web app. A shopper picks a brand and a size that fits them, then the brand they want to buy from. The app recommends their size in that brand using official size-chart measurements.

Built with Next.js (App Router), React, Tailwind CSS and SQLite (`better-sqlite3`).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

Sign in at `/admin` with `ADMIN_PASSWORD`, open **CSV import** and upload your size chart. To try the app with test data, `samples/sample-sizechart.csv` contains fictional brands (“Demo Label A–D”). Don't import it into production.

```bash
npm test          # conversion + CSV unit tests
npm run typecheck
npm run build && npm start
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin`. The admin area stays disabled until this is set. Changing it signs everyone out. |
| `DATABASE_PATH` | SQLite file location (default `./data/veltro.db`). Must be on a persistent disk in production. |
| `NEXT_PUBLIC_SITE_URL` | Public URL, used for canonical links and `sitemap.xml`. |

The app name and tagline are in `lib/site.ts`. Colours are tokens in `app/globals.css` (`--color-accent`).

## Database

Tables are created automatically on first run (`lib/db.ts`):

- **SizeChart**: `brand, gender, category, region, size_label, chest_min_cm, chest_max_cm, waist_min_cm, waist_max_cm, hips_min_cm, hips_max_cm, inside_leg_cm, foot_length_cm, source_url, last_checked, notes`. All measurement fields are nullable numbers.
- **Brands**: `name, slug, shop_url`. A row is created automatically for every brand in SizeChart. Add affiliate links in **Admin → Brands**.
- **BrandRequest**: `brand_name, email, created_date`
- **FitFeedback**: `from_brand, from_size, to_brand, recommended_size, gender, category, fit_result, created_date`

### CSV import

The header row must contain exactly the 16 SizeChart columns (in any order). `gender` is `men`/`women` and `category` is `tops`/`bottoms`/`dresses`; common variants such as “Womens” or “Dress” are normalised. If any row has an error, nothing is imported and the errors are listed with line numbers. Import modes: add rows, replace the brands in the file, or replace the whole table.

## Conversion logic (`lib/convert.ts`)

1. Look up the user's SizeChart row.
2. Primary measurement: chest for tops and dresses, waist for bottoms, then the next available one (waist, then hips) that both brands have.
3. Take the midpoint of that measurement's min and max.
4. In the target brand (keeping one region, preferring the source's), pick the size whose range contains the midpoint. If the midpoint falls in a gap or outside every range, pick the closest midpoint.
5. Within 1 cm of a range edge (or in a gap), also show the neighbouring size with “Between sizes? Go up for a looser fit, down for a tighter fit.”
6. Check waist and hips as secondary measurements where both brands have them, and mention any that point to a different size.
7. Fallback: if either brand has no usable measurements, use the built-in standard UK/EU/US table (`lib/standard-sizes.ts`) and label the result “Estimate based on standard sizing”. No other measurements are ever invented.

## Deploying

SQLite needs a persistent disk, so use a host with one (a VPS, Railway, Render or Fly.io with a volume) and point `DATABASE_PATH` at it. Serverless hosts with an ephemeral filesystem, such as Vercel, will lose data.

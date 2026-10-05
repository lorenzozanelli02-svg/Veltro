import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS SizeChart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  gender TEXT NOT NULL,
  category TEXT NOT NULL,
  region TEXT,
  size_label TEXT NOT NULL,
  chest_min_cm REAL,
  chest_max_cm REAL,
  waist_min_cm REAL,
  waist_max_cm REAL,
  hips_min_cm REAL,
  hips_max_cm REAL,
  inside_leg_cm REAL,
  foot_length_cm REAL,
  source_url TEXT,
  last_checked TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_sizechart_lookup ON SizeChart (gender, category, brand COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS Brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  slug TEXT NOT NULL UNIQUE,
  shop_url TEXT
);

CREATE TABLE IF NOT EXISTS BrandRequest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_name TEXT NOT NULL,
  email TEXT,
  created_date TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS FitFeedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_brand TEXT NOT NULL,
  from_size TEXT NOT NULL,
  to_brand TEXT NOT NULL,
  recommended_size TEXT NOT NULL,
  gender TEXT NOT NULL,
  category TEXT NOT NULL,
  fit_result TEXT NOT NULL CHECK (fit_result IN ('too_small', 'perfect', 'too_big')),
  created_date TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const globalForDb = globalThis as unknown as { __veltroDb?: Database.Database };

export function getDb(): Database.Database {
  if (globalForDb.__veltroDb) return globalForDb.__veltroDb;
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "veltro.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  globalForDb.__veltroDb = db;
  return db;
}

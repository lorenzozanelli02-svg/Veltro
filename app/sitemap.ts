import type { MetadataRoute } from "next";
import { listPublicBrands } from "@/lib/data";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/brands`, priority: 0.8 },
    ...listPublicBrands().map((b) => ({ url: `${base}/brands/${b.slug}`, priority: 0.7 })),
    { url: `${base}/brand-request`, priority: 0.3 },
    { url: `${base}/about`, priority: 0.3 },
    { url: `${base}/privacy`, priority: 0.1 },
  ];
}

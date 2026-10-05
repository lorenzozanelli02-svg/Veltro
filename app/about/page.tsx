import { BadgeCheck, Ruler, UserRoundX } from "lucide-react";
import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import HeroSection from "@/components/ui/glassmorphism-trust-hero";
import { listPublicBrands, siteStats } from "@/lib/data";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Only show a fit rate once enough people have reported back for it to mean something. */
const MIN_FIT_REPORTS = 10;

export const metadata: Metadata = {
  title: "About",
  description: `How ${SITE.name} converts clothing sizes between brands.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const stats = siteStats();
  const brands = listPublicBrands();
  return (
    <>
      <HeroSection
        badge={
          <>
            About {SITE.name}
            <Ruler aria-hidden="true" className="h-3.5 w-3.5 text-orange-300" />
          </>
        }
        title={
          <span className="font-display font-normal tracking-[-0.01em]">
            One body.
            <br />
            <span className="bg-gradient-to-br from-white via-white to-orange-300 bg-clip-text text-transparent">Every brand&rsquo;s</span>
            <br />
            size for it.
          </span>
        }
        description={
          <>
            A UK 10 at one shop is an M at the next. {SITE.name} compares the official chest, waist and hip measurements
            behind each size, so you can order the right one the first time.
          </>
        }
        primaryCta={{ label: "Find my size", href: "/" }}
        secondaryCta={{ label: "Browse size charts", href: "/brands" }}
        highlight={
          stats.brands > 0
            ? { value: String(stats.brands), label: stats.brands === 1 ? "Brand with an official size chart" : "Brands with official size charts", icon: BadgeCheck }
            : null
        }
        meter={
          stats.fitReports >= MIN_FIT_REPORTS
            ? { label: `Perfect fit, from ${stats.fitReports} reports`, value: (stats.perfectFits / stats.fitReports) * 100 }
            : null
        }
        stats={[
          { value: String(stats.sizes), label: "Sizes charted" },
          { value: "3", label: "Categories" },
          { value: "cm", label: "Measured in" },
        ]}
        tags={[
          { label: "OFFICIAL CHARTS", icon: BadgeCheck, iconClassName: "text-orange-300" },
          { label: "NO SIGN-UP", icon: UserRoundX, iconClassName: "text-orange-300" },
        ]}
        trustTitle="Size guides for"
        clients={brands.map((b) => ({ name: b.name }))}
        backgroundImage={null}
      />
      <Prose title={`How ${SITE.name} works`} headingLevel="h2">
        <p>
          [Placeholder] {SITE.name} helps you find your size in a new brand by comparing it with a size you already know fits. We
          use each brand&rsquo;s official size chart, so recommendations are based on real body measurements rather than guesswork.
        </p>
        <h2>How the conversion works</h2>
        <p>
          [Placeholder] We look up the body measurements for the size you wear, take the middle of the range, and find the size
          in the other brand that covers the same measurement. If you&rsquo;re close to the edge of a size, we&rsquo;ll tell you.
        </p>
        <h2>Where the data comes from</h2>
        <p>[Placeholder] Size charts are collected from each brand&rsquo;s website and checked regularly.</p>
        <h2>Affiliate links</h2>
        <p>[Placeholder] Some &ldquo;Shop&rdquo; links may be affiliate links. This never changes the size we recommend.</p>
      </Prose>
    </>
  );
}

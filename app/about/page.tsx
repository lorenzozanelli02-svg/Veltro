import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `How ${SITE.name} converts clothing sizes between brands.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Prose title={`About ${SITE.name}`}>
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
  );
}

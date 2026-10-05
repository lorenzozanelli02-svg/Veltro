import type { Metadata } from "next";
import { BrandRequestForm } from "@/components/BrandRequestForm";

export const metadata: Metadata = {
  title: "Request a brand",
  description: "Can't find your brand? Tell us and we'll add its size chart.",
  alternates: { canonical: "/brand-request" },
};

export default function BrandRequestPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-8 sm:pt-16">
      <h1 className="font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-6xl">
        Can&rsquo;t find <em className="text-accent">your brand?</em>
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">Tell us and we&rsquo;ll add it. The most requested brands go first.</p>
      <BrandRequestForm />
    </div>
  );
}

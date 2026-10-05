import type { Metadata } from "next";
import { BrandRequestForm } from "@/components/BrandRequestForm";

export const metadata: Metadata = {
  title: "Request a brand",
  description: "Can't find your brand? Tell us and we'll add its size chart.",
  alternates: { canonical: "/brand-request" },
};

export default function BrandRequestPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-4">
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Can&rsquo;t find your brand?</h1>
      <p className="mt-2 text-muted">Tell us and we&rsquo;ll add it. The most requested brands go first.</p>
      <BrandRequestForm />
    </div>
  );
}

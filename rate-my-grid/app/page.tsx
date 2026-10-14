import { Suspense } from "react";
import { ScoreFlow } from "@/components/flow/ScoreFlow";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhatYouGet } from "@/components/landing/WhatYouGet";

export default function Home() {
  return (
    <>
      {/* Hidden while the scoring flow is open; the flow renders in its place. */}
      <div className="relative flex flex-1 flex-col flow-open:hidden">
        <Header />
        <main className="flex-1">
          <Hero />
          <HowItWorks />
          <WhatYouGet />
        </main>
        <Footer />
      </div>
      <Suspense fallback={null}>
        <ScoreFlow />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import HeroSection from "@/components/ui/glassmorphism-trust-hero";

export const metadata: Metadata = {
  title: "Glassmorphism hero demo",
  robots: { index: false, follow: false },
};

// Renders the hero directly: the demo wrapper's own h-screen scroll box would nest inside the page scroll.
export default function GlassmorphismHeroDemoPage() {
  return <HeroSection />;
}

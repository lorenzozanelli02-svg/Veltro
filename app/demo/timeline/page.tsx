import type { Metadata } from "next";
import TimelineDemo from "@/components/ui/timeline-demo";

export const metadata: Metadata = {
  title: "Timeline demo",
  robots: { index: false, follow: false },
};

export default function TimelineDemoPage() {
  return <TimelineDemo />;
}

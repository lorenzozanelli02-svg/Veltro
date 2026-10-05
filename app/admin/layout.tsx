import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 pt-2 sm:px-6">{children}</div>;
}

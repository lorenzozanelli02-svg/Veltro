import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${SITE.name} handles your data.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Prose title="Privacy policy">
      <p>[Placeholder] Last updated: [date].</p>
      <h2>What we collect</h2>
      <p>
        [Placeholder] You don&rsquo;t need an account to use {SITE.name}. When you tell us whether a size fitted, we store the
        brands, sizes and your answer, without anything that identifies you. If you request a brand and choose to leave your
        email, we store it so we can let you know when the brand is added.
      </p>
      <h2>Cookies</h2>
      <p>[Placeholder] We don&rsquo;t use advertising cookies. Your cm/inch preference is saved in your browser only.</p>
      <h2>Contact</h2>
      <p>[Placeholder] Questions? Email [contact address].</p>
    </Prose>
  );
}

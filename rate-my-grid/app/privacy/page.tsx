import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    title: "Looking up an account",
    body: "When you type a username, we fetch that account's public profile through Apify, a data service: name, bio, link, follower and post counts, and the latest posts with their images, captions, likes and comments. We keep it for 24 hours so looking it up again is quick, then delete it. Private accounts can't be looked up.",
  },
  {
    title: "Your screenshots",
    body: "If you upload screenshots instead, we send them to our AI provider, Anthropic, to score your profile. They're held in memory only while that happens and are never saved by us. Profile data and images from a lookup are sent to Anthropic in the same way. Anthropic processes them under its commercial terms, which don't allow it to train its models on them.",
  },
  {
    title: "Your report",
    body: "We store your goal, your answers and the report we write, under a private link that only you have. Free reports are deleted after 30 days, unlocked reports after a year.",
  },
  {
    title: "Payments",
    body: "Payments are handled by Stripe. We never see your card details. Stripe tells us the payment went through, and your email address if you entered one at checkout, so we can help if something goes wrong.",
  },
  {
    title: "Abuse protection",
    body: "We count how many scores and lookups come from each IP address for a short time, to stop the service being abused. Those counts expire within a day.",
  },
  {
    title: "No accounts, no tracking",
    body: "There's no sign-up, we never ask for your Instagram password, and we don't use advertising or tracking cookies.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header nav={false} />
      <main className="flex-1 px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-5xl leading-[1.05] font-extralight tracking-tight text-slate-50 sm:text-6xl">
            Privacy, <span className="text-ig">plainly</span>
          </h1>
          <div className="mt-10 space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="text-lg font-medium text-slate-50">{s.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
              </section>
            ))}
            <section>
              <h2 className="text-lg font-medium text-slate-50">Questions or deletion requests</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Email{" "}
                <a href={`mailto:${SITE.contactEmail}`} className="text-accent underline-offset-4 hover:underline">
                  {SITE.contactEmail}
                </a>{" "}
                with your report link and we&rsquo;ll delete it.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

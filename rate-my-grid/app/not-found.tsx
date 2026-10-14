import { ButtonLink } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header nav={false} />
      <main className="flex flex-1 items-center px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-5xl leading-[1.05] font-extralight tracking-tight text-slate-50">
            Nothing <span className="text-ig">here</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            This link doesn&rsquo;t exist or has expired. Free scores are kept for 30 days, unlocked reports for a year.
          </p>
          <ButtonLink href="/?step=goal" className="mt-8">
            Get a new score
          </ButtonLink>
        </div>
      </main>
      <Footer />
    </>
  );
}

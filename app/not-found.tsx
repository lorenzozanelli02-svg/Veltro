import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-16 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Page not found</h1>
      <p className="mt-2 text-muted">That page doesn&rsquo;t exist, or the brand has been removed.</p>
      <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-ink px-5 font-medium text-white">
        Go to the size converter
      </Link>
    </div>
  );
}

export const SITE = {
  name: "Rate My Grid",
  description:
    "Upload a few screenshots and get an honest score out of 100 for how well your Instagram gets you customers, plus exactly what to fix.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // TODO: replace with a real inbox before launch. Shown on the privacy page.
  contactEmail: "hello@example.com",
  // One-time unlock. Stripe Checkout charges exactly this, so the page and the payment always match.
  price: { amount: 1500, currency: "gbp", label: "£15" },
};

import DigitalSerenity from "@/components/ui/digital-serenity-animated-landing-page";
import { ButtonLink } from "../Button";

export function Hero() {
  return (
    <DigitalSerenity
      eyebrow="Your Instagram, scored."
      heading="Is your Instagram actually getting you"
      headingAccent="clients?"
      headingId="hero-title"
      subheading="Get your score out of 100 and exactly what to fix in 60 seconds."
      action={
        <ButtonLink href="/?step=goal" className="w-full max-w-xs sm:w-auto sm:max-w-none sm:min-w-60">
          Get my score
        </ButtonLink>
      }
      note="Free score · No sign-up · No password"
    />
  );
}

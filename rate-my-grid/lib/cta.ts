/**
 * Phrases that count as a call to action in a caption or bio: something that asks the reader to take a
 * step towards buying, booking or getting in touch. Matched case-insensitively on whole words.
 *
 * Edit freely. Likes, saves and "follow for more" don't count: they don't move anyone towards a sale.
 */
export const CTA_PHRASES = [
  // Getting in touch
  "dm me",
  "dm us",
  "send me a dm",
  "send us a dm",
  "message me",
  "message us",
  "get in touch",
  "contact me",
  "contact us",
  "email me",
  "email us",
  "whatsapp",
  "call us",
  "call me",
  // Booking and enquiring
  "book",
  "booking",
  "book now",
  "free call",
  "discovery call",
  "consultation",
  "enquire",
  "inquire",
  "apply",
  "spaces left",
  "spots left",
  // Buying and signing up
  "shop now",
  "shop the",
  "order now",
  "to order",
  "pre-order",
  "buy now",
  "sign up",
  "join",
  "register",
  "grab yours",
  "get yours",
  "download",
  // Pointing at a link
  "link in bio",
  "link in my bio",
  "link in our bio",
  "tap the link",
  "click the link",
  // Comment-to-get-it prompts
  "comment",
  "reply with",
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATTERN = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${CTA_PHRASES.map(escape).join("|")})(?=$|[^\\p{L}\\p{N}])`, "iu");

/** The first call-to-action phrase in the text, or null. */
export function findCta(text: string): string | null {
  const match = PATTERN.exec(text);
  return match ? match[1].toLowerCase() : null;
}

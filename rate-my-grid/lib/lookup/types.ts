export type PostType = "Reel" | "Video" | "Carousel" | "Image";

export type ProfilePost = {
  id: string;
  type: PostType;
  caption: string;
  /** null when the account hides like counts. */
  likes: number | null;
  comments: number | null;
  views: number | null;
  postedAt: string | null;
  imageUrl: string | null;
  url: string | null;
  isPinned: boolean;
};

export type Profile = {
  username: string;
  fullName: string;
  /** "" when the account has no bio; null when the lookup didn't return the field at all. */
  bio: string | null;
  avatarUrl: string | null;
  externalUrl: string | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  category: string | null;
  isVerified: boolean;
  isBusiness: boolean;
  /** Number of story highlights, when the lookup returns it. */
  highlights: number | null;
  /** Newest first, up to 12. */
  posts: ProfilePost[];
};

/** A downloaded image, already shrunk to a JPEG. `id` is a post id, or "avatar" for the profile picture. */
export type LookupImage = { id: string; mediaType: "image/jpeg"; data: string };

export type LookupResult = {
  profile: Profile;
  images: LookupImage[];
  fetchedAt: string;
  provider: "apify" | "mock";
};

/** "incomplete": the lookup worked but left out something the score needs (see completeness.ts). */
export type LookupFailure = "private" | "not_found" | "timeout" | "failed" | "rate_limited" | "unavailable" | "incomplete";

export type LookupOutcome =
  | { status: "ok"; result: LookupResult; cached: boolean }
  | { status: LookupFailure; message: string };

/** What a scraping provider returns before images are downloaded. */
export type ProviderResult =
  | { status: "ok"; profile: Profile; costUsd: number | null; costDetail?: Record<string, unknown> }
  | { status: "private" | "not_found" | "timeout" | "failed"; detail: string; costUsd: number | null; costDetail?: Record<string, unknown> };

/** The safe summary the browser gets back from a lookup. */
export type ProfilePreview = {
  username: string;
  fullName: string;
  bio: string;
  avatar: string | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  postsFound: number;
  category: string | null;
  isVerified: boolean;
};

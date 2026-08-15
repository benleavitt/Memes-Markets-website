/** Where you can find the show. Order is the order they appear in the platform bar. */

export type PlatformId =
  | "youtube"
  | "twitch"
  | "x"
  | "instagram"
  | "spotify"
  | "apple"
  | "substack";

export interface Platform {
  id: PlatformId;
  /** Used as the accessible name, so it reads as a destination, not an icon. */
  label: string;
  handle: string;
  href: string;
}

/**
 * The show's own channel, pulled out of the list because the footer prints its
 * handle as text rather than as an icon. It is the handle for the show — note
 * the `Pod` suffix, which is not decoration: youtube.com/@MemesandMarkets is a
 * 404, so dropping it gives you a dead link that looks right.
 */
export const SHOW_CHANNEL: Platform = {
  id: "youtube",
  label: "YouTube",
  handle: "@MemesandMarketsPod",
  href: "https://www.youtube.com/@MemesandMarketsPod",
};

export const PLATFORMS: Platform[] = [
  SHOW_CHANNEL,
  {
    id: "twitch",
    label: "Twitch",
    handle: "memesandmarkets",
    href: "https://www.twitch.tv/memesandmarkets",
  },
  { id: "x", label: "X", handle: "@Memesandmkts", href: "https://x.com/Memesandmkts" },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@memesandmkts",
    href: "https://www.instagram.com/memesandmkts",
  },
  {
    id: "spotify",
    label: "Spotify",
    handle: "Memes and Markets",
    href: "https://open.spotify.com/show/1GSfFx3sQoG2bYAbIYUocN",
  },
  {
    id: "apple",
    label: "Apple Podcasts",
    handle: "Memes and Markets",
    href: "https://podcasts.apple.com/us/podcast/memes-and-markets/id1840280923",
  },
  {
    id: "substack",
    label: "Substack",
    handle: "memesandmarkets.com",
    href: "https://memesandmarkets.com",
  },
];

export const HOSTS = "Keith D & Ben Leavitt";
export const SCHEDULE = "Live Tuesdays & Thursdays";
export const POSITIONING = "Where culture, tech & financial markets intersect";

/** Required verbatim in every footer. */
export const DISCLAIMER =
  "For education and entertainment only. Not financial, legal, tax, or investment advice.";

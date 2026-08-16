import { SCHEDULE_HOUR_ET } from "@/lib/live";

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
/**
 * Printed on /partner as the fallback route when the form is unavailable, so it
 * is a PUBLIC address and will be scraped. Swapping it for a dedicated one
 * (partners@ on the domain, say) is a change to this line only.
 */
export const CONTACT_EMAIL = "memesmarketsteam@gmail.com";
/**
 * The hour comes from lib/live.ts rather than being typed again here. That file
 * already owns the schedule — it is what computes the next slot and decides how
 * long a live-status answer may be cached — so a second copy of "12" is a second
 * thing to remember when the show moves.
 */
export const SCHEDULE = `Live Tuesdays & Thursdays ${SCHEDULE_HOUR_ET}PM ET`;
export const POSITIONING = "Where culture, tech & financial markets intersect";

/** Required verbatim in every footer. */
export const DISCLAIMER =
  "For education and entertainment only. Not financial, legal, tax, or investment advice.";

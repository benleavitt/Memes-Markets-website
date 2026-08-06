import { XMLParser } from "fast-xml-parser";
import fallback from "../content/episodes-fallback.json";

/**
 * Episode data from the channel's public RSS feed. No API key, no quota, no
 * secret to rotate. Returns the 15 most recent uploads; we show 12.
 *
 *   YouTube RSS ──parse──> Episode[] ──┐
 *                                      ├─> hero orbit
 *   episodes-fallback.json ────────────┘
 *
 * The fallback is committed, not a nicety: without it, a first deploy against a
 * broken feed renders an empty hero. ISR only protects you after one good build.
 */

export const CHANNEL_ID = "UCpDHJbeyWBab2qr6y2d6_yQ";
const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export interface Episode {
  id: string;
  title: string;
  published: string;
  url: string;
  /** maxres is not generated for every upload; callers must handle the fallback. */
  thumbnail: string;
  thumbnailFallback: string;
}

export function thumbnailUrls(id: string) {
  return {
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    thumbnailFallback: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

function toEpisode(id: string, title: string, published: string): Episode {
  return {
    id,
    title,
    published,
    url: `https://www.youtube.com/watch?v=${id}`,
    ...thumbnailUrls(id),
  };
}

/** Parse a YouTube channel feed. Exported so it can be tested without a network. */
export function parseFeed(xml: string): Episode[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);
  const raw = doc?.feed?.entry;
  if (!raw) return [];

  const entries = Array.isArray(raw) ? raw : [raw];
  return entries
    .map((e) => {
      const id = e?.["yt:videoId"];
      const title = e?.title;
      const published = e?.published;
      if (typeof id !== "string" || !id) return null;
      return toEpisode(id, String(title ?? "Untitled episode"), String(published ?? ""));
    })
    .filter((e): e is Episode => e !== null);
}

/**
 * Fetch the feed. Never throws and never returns an empty list: a network error,
 * a malformed body, or an empty feed all fall through to the committed dataset.
 */
export async function getEpisodes(limit = 12): Promise<Episode[]> {
  try {
    const res = await fetch(FEED, {
      // ISR: rebuild the page at most once an hour.
      next: { revalidate: 3600 },
      headers: { "user-agent": "memesandmarkets.com" },
    });
    if (!res.ok) return fallbackEpisodes(limit);
    const parsed = parseFeed(await res.text());
    return parsed.length > 0 ? parsed.slice(0, limit) : fallbackEpisodes(limit);
  } catch {
    return fallbackEpisodes(limit);
  }
}

export function fallbackEpisodes(limit = 12): Episode[] {
  return fallback.episodes
    .slice(0, limit)
    .map((e) => toEpisode(e.id, e.title, e.published));
}

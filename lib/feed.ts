import { XMLParser } from "fast-xml-parser";

/**
 * The YouTube feed: its address, its shape, and how to parse it.
 *
 * Split out from episodes.ts so this file imports nothing but the XML parser.
 * episodes.ts imports the committed fallback JSON, and a JSON import without an
 * import attribute cannot be loaded by plain Node — which would force
 * scripts/refresh-episodes.mjs to carry its own copy of the parser.
 *
 * That copy is exactly what must not exist. The scheduled job's whole job is to
 * prove the parser still understands what YouTube is serving; a job running a
 * different parser proves nothing about the site.
 */

export const CHANNEL_ID = "UCpDHJbeyWBab2qr6y2d6_yQ";
export const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
/** Sent on every request so the channel owner can identify the traffic. */
export const FEED_UA = "memesandmarkets.com";

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

export function toEpisode(id: string, title: string, published: string): Episode {
  return {
    id,
    title,
    published,
    url: `https://www.youtube.com/watch?v=${id}`,
    ...thumbnailUrls(id),
  };
}

/** Parse a YouTube channel feed. Pure, so it can be tested without a network. */
export function parseFeed(xml: string): Episode[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);
  const raw = doc?.feed?.entry;
  if (!raw) return [];

  // A channel with exactly one upload gives an object, not an array.
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

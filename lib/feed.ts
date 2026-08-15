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

/**
 * Pull the text out of a parsed node.
 *
 * WHY THIS IS NOT `String(node)`, which is what it used to be. The parser runs
 * with `ignoreAttributes: false`, so a bare `<title>x</title>` comes back as the
 * string "x" — but `<title type="text">x</title>`, which is the ordinary Atom
 * spelling and something YouTube could start emitting on any Tuesday, comes back
 * as `{ "#text": "x", "@_type": "text" }`. `String()` on that is the literal
 * "[object Object]", rendered across every card on the belt.
 *
 * That failure was invisible from both ends: the site swallows feed errors by
 * design, and the scheduled job only asserts that entries exist and carry dates,
 * so it would have stayed green through the whole thing. Unwrapping here, and
 * checking titles in scripts/refresh-episodes.mjs, closes it from both sides.
 */
function text(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (node && typeof node === "object" && "#text" in node) {
    return text((node as Record<string, unknown>)["#text"]);
  }
  return "";
}

/** Parse a YouTube channel feed. Pure, so it can be tested without a network. */
export function parseFeed(xml: string): Episode[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Every value in this feed is an opaque string — an id, a title, a date.
    // Left on, the parser turns an all-digit video id or title into a number,
    // which is never what we want and was previously dropped outright.
    parseTagValue: false,
  });
  const doc = parser.parse(xml);
  const raw = doc?.feed?.entry;
  if (!raw) return [];

  // A channel with exactly one upload gives an object, not an array.
  const entries = Array.isArray(raw) ? raw : [raw];
  return entries
    .map((e) => {
      const id = text(e?.["yt:videoId"]).trim();
      if (!id) return null;
      const title = text(e?.title).trim();
      return toEpisode(id, title || "Untitled episode", text(e?.published).trim());
    })
    .filter((e): e is Episode => e !== null);
}

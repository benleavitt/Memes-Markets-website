import { XMLParser } from "fast-xml-parser";

/**
 * The Substack publication's RSS feed: where it is, and how to read it.
 *
 * Imports nothing but the XML parser, same discipline as lib/feed.ts, so a
 * plain-Node script could load it without tripping over a JSON import.
 *
 * WHY THE SITE SHOWS POSTS AT ALL. The footer has promised "straight from our
 * Substack" since the day it was written, with nothing behind it. Nine real
 * essays with titles like "Media Literate is the New Wealthy" are a better
 * argument for signing up than any sentence about signing up.
 */

/** Substack serves RSS at <publication>/feed. */
export function feedUrl(publication: string): string {
  return `${publication.replace(/\/$/, "")}/feed`;
}

export interface Post {
  title: string;
  url: string;
  /** ISO date. */
  published: string;
  /** First line or so of the post, already stripped of markup. */
  excerpt: string;
}

/**
 * How stale the newest post may be before the section hides itself.
 *
 * THIS IS THE WHOLE POINT OF THE COMPONENT, so it is worth being explicit. The
 * publication ran at about 1.7 posts a week for five weeks and then stopped for
 * six months. A "latest from the newsletter" block whose newest entry is six
 * months old does not advertise a newsletter, it advertises an abandoned one —
 * and it does that on the same page as a form asking people to subscribe.
 *
 * 45 days is deliberately loose against a twice-weekly cadence: it survives a
 * holiday, an illness, a fortnight of nobody feeling like writing. What it does
 * not survive is the newsletter quietly ending, which is exactly the thing the
 * site should stop saying out loud.
 *
 * The section returns by itself on the next post. Nobody has to remember it.
 */
export const FRESH_DAYS = 45;

export function isFresh(posts: Post[], now: Date = new Date()): boolean {
  const newest = posts[0];
  if (!newest) return false;
  const at = new Date(newest.published).getTime();
  if (Number.isNaN(at)) return false;
  return now.getTime() - at <= FRESH_DAYS * 86_400_000;
}

const NAMED: Record<string, string> = {
  nbsp: " ",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  mdash: "—",
  ndash: "–",
  hellip: "…",
};

/**
 * Collapse HTML and whitespace into one readable line.
 *
 * Numeric entities are decoded generically rather than enumerated. The first
 * attempt listed a few by hand and mapped `&#8220;` onto a straight quote, which
 * silently flattened Substack's typography — the title reads
 * `The “Post-Pastor” Theory`, and it came out with programmer quotes. Anything
 * hand-listed is a list of the entities somebody happened to think of.
 *
 * `&amp;` is decoded LAST, after every other entity, or `&amp;#8220;` would
 * become `&#8220;` and then get decoded a second time.
 */
function plain(html: string, max: number): string {
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (whole, name) => NAMED[name.toLowerCase()] ?? whole)
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  // Cut on a word boundary rather than mid-word, then strip a trailing comma or
  // similar so the ellipsis does not read as a typo.
  return `${text.slice(0, text.lastIndexOf(" ", max)).replace(/[\s,;:.]+$/, "")}…`;
}

/**
 * Parse a Substack RSS feed. Pure, so it is testable without a network.
 *
 * Substack wraps titles and descriptions in CDATA and its items are in document
 * order, newest first — but that ordering is the feed's promise, not ours, so
 * this sorts rather than trusting it. `isFresh` reads posts[0] and a feed that
 * arrived out of order would hide a live newsletter or show a dead one.
 */
export function parsePosts(xml: string): Post[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item;
  if (!raw) return [];

  const items = Array.isArray(raw) ? raw : [raw];
  return items
    .map((item) => {
      const title = item?.title;
      const url = item?.link;
      const published = item?.pubDate;
      if (typeof url !== "string" || !url) return null;
      const at = new Date(String(published ?? ""));
      if (Number.isNaN(at.getTime())) return null;
      return {
        title: plain(String(title ?? "Untitled"), 120),
        url,
        published: at.toISOString(),
        excerpt: plain(String(item?.description ?? ""), 150),
      };
    })
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.published.localeCompare(a.published));
}

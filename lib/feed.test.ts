import { describe, expect, it } from "vitest";
import fallbackData from "../content/episodes-fallback.json";
import { parseFeed, thumbnailUrls } from "./feed";

/**
 * parseFeed is the single point where the site's understanding of YouTube's
 * format lives, and scripts/refresh-episodes.mjs raises the alarm by asserting it
 * still returns something. That makes these tests the definition of what "the
 * feed still works" means — so they cover the shapes that actually vary between
 * real channels, not just the happy path.
 */

const entry = (id: string, title: string, published: string) => `
  <entry>
    <id>yt:video:${id}</id>
    <yt:videoId>${id}</yt:videoId>
    <title>${title}</title>
    <published>${published}</published>
  </entry>`;

const feed = (...entries: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Memes &amp; Markets</title>
  <published>2025-09-11T15:56:49+00:00</published>
  ${entries.join("\n")}
</feed>`;

describe("parseFeed", () => {
  it("reads id, title and date, and derives the urls", () => {
    const [ep] = parseFeed(
      feed(entry("abc123", "Episode one", "2026-08-07T07:32:52+00:00")),
    );
    expect(ep).toMatchObject({
      id: "abc123",
      title: "Episode one",
      published: "2026-08-07T07:32:52+00:00",
      url: "https://www.youtube.com/watch?v=abc123",
      ...thumbnailUrls("abc123"),
    });
  });

  it("keeps feed order, newest first", () => {
    const eps = parseFeed(
      feed(
        entry("new", "Newest", "2026-08-07T00:00:00+00:00"),
        entry("mid", "Middle", "2026-08-05T00:00:00+00:00"),
        entry("old", "Oldest", "2026-08-01T00:00:00+00:00"),
      ),
    );
    expect(eps.map((e) => e.id)).toEqual(["new", "mid", "old"]);
  });

  it("handles a channel with exactly one upload", () => {
    // The XML parser hands back an object rather than an array for a single
    // entry. Treating that as an array is a classic way to return nothing.
    const eps = parseFeed(feed(entry("solo", "Only episode", "2026-08-07T00:00:00Z")));
    expect(eps).toHaveLength(1);
    expect(eps[0]?.id).toBe("solo");
  });

  it("skips entries with no video id rather than emitting a broken link", () => {
    const orphan = "<entry><title>No id here</title></entry>";
    const eps = parseFeed(feed(orphan, entry("ok", "Fine", "2026-08-07T00:00:00Z")));
    expect(eps.map((e) => e.id)).toEqual(["ok"]);
  });

  it("falls back to a placeholder title rather than rendering undefined", () => {
    const untitled =
      "<entry><yt:videoId>x1</yt:videoId><published>2026-08-07T00:00:00Z</published></entry>";
    expect(parseFeed(feed(untitled))[0]?.title).toBe("Untitled episode");
  });

  it("returns nothing for an empty feed, a non-feed, or junk", () => {
    // Each of these is what the refresh script treats as the alarm condition.
    expect(parseFeed(feed())).toEqual([]);
    expect(parseFeed("<html><body>Sorry</body></html>")).toEqual([]);
    expect(parseFeed("")).toEqual([]);
  });

  it("returns nothing if the entry element is ever renamed", () => {
    // The realistic shape of a YouTube format change: still XML, still 200, but
    // the element we key off is gone. This must be empty so the job goes red.
    const renamed = `<?xml version="1.0"?><feed><item><yt:videoId>a</yt:videoId></item></feed>`;
    expect(parseFeed(renamed)).toEqual([]);
  });
});

describe("committed fallback", () => {
  it("is well formed, non-empty, and newest first", () => {
    const eps = fallbackData.episodes;
    expect(eps.length).toBeGreaterThan(0);
    for (const e of eps) {
      expect(e.id).toMatch(/^[\w-]{6,}$/);
      expect(e.title.trim()).not.toBe("");
      expect(Number.isNaN(Date.parse(e.published))).toBe(false);
    }
    const dates = eps.map((e) => Date.parse(e.published));
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it("has no duplicate video ids", () => {
    const ids = fallbackData.episodes.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

import { describe, expect, it } from "vitest";
import { FRESH_DAYS, feedUrl, isFresh, parsePosts } from "./posts";

/**
 * Trimmed from the real feed at memesandmarkets.com/feed. The two items are
 * verbatim — including the trailing space in the second title, and the fact
 * that its quotes are plain ASCII rather than typographic.
 *
 * The third item is the only invented one, and it is labelled as such. It
 * carries the entities the real feed actually uses, counted across the whole of
 * it: &#8217; x231, &#8212; x63, &#8220; and &#8221; x30 each, &#8230; x15,
 * &#8594; x5, and a handful of emoji codepoints. That census is why the decoder
 * handles numeric entities generically rather than by a hand-written list — the
 * first version listed a few and flattened all sixty curly quotes into
 * programmer quotes.
 */
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title><![CDATA[Memes & Markets]]></title>
  <item>
    <title><![CDATA[The AI Proof Skill Stack]]></title>
    <link>https://www.memesandmarkets.com/p/the-ai-proof-skill-stack</link>
    <pubDate>Tue, 03 Feb 2026 16:20:19 GMT</pubDate>
    <description><![CDATA[<p>How to become the person with unlimited opportunities in an ever changing world.</p>]]></description>
  </item>
  <item>
    <title><![CDATA[The "Post-Pastor" Theory ]]></title>
    <link>https://www.memesandmarkets.com/p/the-post-pastor-theory</link>
    <pubDate>Sun, 01 Feb 2026 17:39:45 GMT</pubDate>
    <description><![CDATA[<p>The New Golden Rule</p>]]></description>
  </item>
  <item>
    <title><![CDATA[Entity zoo &#8212; not a real post]]></title>
    <link>https://www.memesandmarkets.com/p/entities</link>
    <pubDate>Sat, 31 Jan 2026 09:00:00 GMT</pubDate>
    <description><![CDATA[<p>It&#8217;s the &#8220;quoted&#8221; bit&nbsp;&#8594; and an ellipsis&#8230; &amp; an ampersand.</p>]]></description>
  </item>
</channel></rss>`;

describe("feedUrl", () => {
  it("appends /feed, with or without a trailing slash", () => {
    expect(feedUrl("https://www.memesandmarkets.com")).toBe(
      "https://www.memesandmarkets.com/feed",
    );
    expect(feedUrl("https://www.memesandmarkets.com/")).toBe(
      "https://www.memesandmarkets.com/feed",
    );
  });
});

describe("parsePosts", () => {
  it("reads a real feed", () => {
    const posts = parsePosts(FEED);
    expect(posts).toHaveLength(3);
    expect(posts[0]).toMatchObject({
      title: "The AI Proof Skill Stack",
      url: "https://www.memesandmarkets.com/p/the-ai-proof-skill-stack",
      published: "2026-02-03T16:20:19.000Z",
    });
  });

  it("strips markup out of the excerpt", () => {
    const excerpt = parsePosts(FEED)[0]?.excerpt ?? "";
    expect(excerpt).not.toMatch(/[<>]/);
    expect(excerpt).toBe(
      "How to become the person with unlimited opportunities in an ever changing world.",
    );
  });

  it("trims the trailing space the real feed puts in a title", () => {
    expect(parsePosts(FEED)[1]?.title).toBe('The "Post-Pastor" Theory');
  });

  /**
   * The decoder's real job. Every entity here appears in the live feed, and
   * getting any of them wrong shows up as mojibake on the homepage.
   */
  it("decodes the entities the live feed actually uses", () => {
    const post = parsePosts(FEED)[2];
    expect(post?.title).toBe("Entity zoo — not a real post");
    expect(post?.excerpt).toBe(
      "It’s the “quoted” bit → and an ellipsis… & an ampersand.",
    );
    expect(post?.excerpt).not.toMatch(/&#?\w+;/);
  });

  it("cuts the excerpt on a word boundary, never mid-word", () => {
    const excerpt = parsePosts(FEED)[0]?.excerpt ?? "";
    if (excerpt.endsWith("…")) {
      expect(excerpt).not.toMatch(/[a-z]…$/i);
    }
  });

  /**
   * Sorted rather than trusted. isFresh reads posts[0], so a feed that arrived
   * out of order could hide a live newsletter or advertise a dead one.
   */
  it("sorts newest first even when the feed does not", () => {
    const items = [...FEED.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m) => m[0]);
    const reversed = FEED.replace(/<item>[\s\S]*<\/item>/, items.reverse().join("\n"));
    const posts = parsePosts(reversed);
    expect(posts[0]?.title).toBe("The AI Proof Skill Stack");
    expect(posts.at(-1)?.title).toBe("Entity zoo — not a real post");
  });

  it("drops entries with no link or an unusable date rather than guessing", () => {
    const broken = `<rss version="2.0"><channel>
      <item><title>No link</title><pubDate>Tue, 03 Feb 2026 16:20:19 GMT</pubDate></item>
      <item><title>No date</title><link>https://example.com/a</link></item>
      <item><title>Bad date</title><link>https://example.com/b</link><pubDate>whenever</pubDate></item>
    </channel></rss>`;
    expect(parsePosts(broken)).toHaveLength(0);
  });

  it("survives every wrong shape rather than throwing into a page render", () => {
    for (const junk of ["", "<html>not rss</html>", "<rss></rss>"]) {
      expect(parsePosts(junk)).toEqual([]);
    }
  });

  it("handles a publication with exactly one post, which is an object not an array", () => {
    const single = `<rss version="2.0"><channel>
      <item><title>Only one</title><link>https://example.com/1</link>
      <pubDate>Tue, 03 Feb 2026 16:20:19 GMT</pubDate></item>
    </channel></rss>`;
    expect(parsePosts(single)).toHaveLength(1);
  });
});

/**
 * The gate that decides whether the homepage says anything about the newsletter
 * at all. Wrong in either direction is a visible mistake: too strict and a live
 * newsletter is invisible, too loose and the site advertises a dead one.
 */
describe("isFresh", () => {
  const at = (iso: string) => [{ title: "t", url: "u", published: iso, excerpt: "" }];

  it("is fresh the day a post lands", () => {
    expect(isFresh(at("2026-08-16T00:00:00Z"), new Date("2026-08-16T12:00:00Z"))).toBe(
      true,
    );
  });

  it("survives a normal gap in publishing", () => {
    // Three weeks off, against a twice-weekly cadence.
    expect(isFresh(at("2026-07-26T00:00:00Z"), new Date("2026-08-16T00:00:00Z"))).toBe(
      true,
    );
  });

  it(`hides once the newest post is over ${FRESH_DAYS} days old`, () => {
    expect(isFresh(at("2026-06-01T00:00:00Z"), new Date("2026-08-16T00:00:00Z"))).toBe(
      false,
    );
    // The publication's real state when this was written: 195 days quiet.
    expect(isFresh(at("2026-02-03T16:20:19Z"), new Date("2026-08-16T00:00:00Z"))).toBe(
      false,
    );
  });

  it("hides on an empty or unusable feed rather than throwing", () => {
    expect(isFresh([])).toBe(false);
    expect(isFresh(at("not a date"))).toBe(false);
  });
});

import { PUBLICATION } from "./newsletter";
import { type Post, feedUrl, isFresh, parsePosts } from "./posts";

/**
 * Recent newsletter posts for the homepage.
 *
 * NO FALLBACK FILE, unlike the episodes — and the difference is deliberate.
 * getEpisodes must never return empty because the orbit IS the hero; a hole
 * there is a broken page. This section is additive: the newsletter signup sits
 * in the footer either way, and a site with no posts block is simply a site
 * without one. Committing a fallback would also mean committing dated post
 * titles that could outlive their own freshness check, which is the one thing
 * this feature exists to avoid.
 *
 * So every failure — unreachable, unparseable, empty, stale — collapses to the
 * same answer: an empty array, and the component renders nothing.
 */
export async function getRecentPosts(limit = 3): Promise<Post[]> {
  try {
    const res = await fetch(feedUrl(PUBLICATION), {
      headers: { "user-agent": "memesandmarkets.com" },
      // Same hourly window as the episodes and the channel stats.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const posts = parsePosts(await res.text());
    // The freshness gate. See FRESH_DAYS in lib/posts.ts for why it exists.
    if (!isFresh(posts)) return [];
    return posts.slice(0, limit);
  } catch {
    return [];
  }
}

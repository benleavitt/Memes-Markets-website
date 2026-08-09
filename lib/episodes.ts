import fallback from "../content/episodes-fallback.json";
import { FEED, FEED_UA, parseFeed, toEpisode } from "./feed";

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
 *
 * It is kept current by scripts/refresh-episodes.mjs on a schedule — see the
 * pipeline note below. A fallback nobody refreshes is a fallback that quietly
 * gets worse every week, and it is only ever read on the day it matters most.
 *
 * FRESHNESS. Two mechanisms, and it is worth knowing which does what:
 *
 *   ISR (below)          the live site re-pulls the feed at most hourly, with no
 *                        rebuild. This is what keeps the orbit current.
 *   refresh-episodes     a scheduled job re-commits the fallback and fails loudly
 *                        if the feed stops parsing. This is what stops a YouTube
 *                        format change from silently freezing the orbit forever.
 *
 * Neither is push-based. If the orbit ever needs to update within seconds of an
 * upload rather than within the hour, the route is YouTube's WebSub hub
 * (pubsubhubbub.appspot.com) posting to a handler that calls revalidatePath("/").
 * That needs a public URL and a resubscribe cron, so it is deliberately not built
 * while the site is local-only.
 */

export type { Episode } from "./feed";
export { CHANNEL_ID, parseFeed, thumbnailUrls } from "./feed";

import type { Episode } from "./feed";

/**
 * Fetch the feed. Never throws and never returns an empty list: a network error,
 * a malformed body, or an empty feed all fall through to the committed dataset.
 *
 * That silence is deliberate for the visitor — a hero of real-but-old episodes
 * beats an empty one — but it means a broken feed is invisible from the site
 * alone. The scheduled refresh job is what turns that silence into an alarm.
 */
export async function getEpisodes(limit = 12): Promise<Episode[]> {
  try {
    const res = await fetch(FEED, {
      // ISR: rebuild the page at most once an hour.
      next: { revalidate: 3600 },
      headers: { "user-agent": FEED_UA },
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

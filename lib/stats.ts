import fallback from "../content/channel-stats-fallback.json";
import { type ChannelStats, parseStats, statsUrl } from "./channel";
import { CHANNEL_ID } from "./feed";

/**
 * Audience numbers for the social-proof band.
 *
 *   YouTube Data API ──> ChannelStats ──┐
 *                                       ├─> <SocialProof/>
 *   channel-stats-fallback.json ────────┘
 *
 * WHY AN API KEY HERE WHEN THE EPISODES NEED NONE. The RSS feed carries uploads
 * and nothing else — no subscriber count, no view total. Those live only behind
 * `channels?part=statistics`, which is one quota unit per call against a free
 * daily allowance of ten thousand. At the hourly revalidate below that is 24
 * calls a day, so the quota is not a constraint worth designing around.
 *
 * The alternative was scraping the channel page, which is where these numbers
 * were first read from. That is fine for looking something up once and wrong to
 * build on: it breaks whenever YouTube reshuffles its markup, and it breaks
 * silently, leaving plausible-looking stale numbers on the page. Numbers that
 * quietly go wrong are worse than no numbers, because nobody re-checks a figure
 * that has always been there.
 *
 * NO KEY IS A NORMAL STATE, not an error. Without one this serves the committed
 * fallback, so the band renders real — if ageing — figures from the day it was
 * captured. Same bargain as the episode fallback, and the same caveat: it is
 * only as good as the last time somebody refreshed it. `npm run stats:refresh`.
 *
 * THE PARSER LIVES IN channel.ts, not here. This file imports JSON, which plain
 * Node cannot load without an import attribute, so anything importing this file
 * is unusable from scripts/refresh-stats.mjs. See the note in channel.ts.
 */

export type { ChannelStats } from "./channel";
export { compact, parseStats } from "./channel";

/**
 * How long a fetched figure may be reused, in seconds.
 *
 * TEN MINUTES, NOT AN HOUR, AND THE REASON IS THE PARTNER PAGE. These numbers
 * render on two routes — the audience band on `/` and the fact row on
 * `/partner` — and Next caches each rendered route separately. Whichever page
 * is asked for first starts its own window, so with an hour-long one the two
 * could sit up to an hour out of step: `/` frozen at 104 episodes while
 * `/partner`, regenerated later, already said 105. Same API, same key, same
 * function; two snapshots taken at different moments.
 *
 * Next derives a route's revalidate from the shortest fetch inside it, so this
 * one constant sets the window for BOTH pages and caps the drift between them.
 * It does not make them identical — only a purge of both routes at the same
 * instant would, which is `revalidateTag` and a caller to trigger it — but ten
 * minutes is short enough that nobody catches the two pages disagreeing.
 *
 * The quota does not care: both routes share one Data Cache entry for this URL,
 * so it is ~144 calls a day against a free 10,000, and the hourly episode feed
 * is untouched — a route regenerating early still reads RSS from its own cache.
 */
export const STATS_REVALIDATE = 600;

export const FALLBACK_STATS: ChannelStats = {
  subscribers: fallback.subscribers,
  views: fallback.views,
  videos: fallback.videos,
  capturedAt: fallback.capturedAt,
  source: "fallback",
};

/**
 * Never throws, never returns nothing. Same contract as getEpisodes, for the
 * same reason: a band of real-but-old numbers beats a hole in the page.
 */
export async function getChannelStats(): Promise<ChannelStats> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return FALLBACK_STATS;

  try {
    const res = await fetch(statsUrl(CHANNEL_ID, key), {
      next: { revalidate: STATS_REVALIDATE },
    });
    if (!res.ok) return FALLBACK_STATS;
    return parseStats(await res.json()) ?? FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}

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
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_STATS;
    return parseStats(await res.json()) ?? FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}

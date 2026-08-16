import fallback from "../content/channel-stats-fallback.json";
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
 */

export interface ChannelStats {
  subscribers: number;
  views: number;
  videos: number;
  /** ISO date the numbers were captured. Only meaningful for the fallback. */
  capturedAt: string;
  /** Where these came from, so the page can be honest if it is guessing. */
  source: "youtube" | "fallback";
}

const ENDPOINT = "https://www.googleapis.com/youtube/v3/channels";

export const FALLBACK_STATS: ChannelStats = {
  subscribers: fallback.subscribers,
  views: fallback.views,
  videos: fallback.videos,
  capturedAt: fallback.capturedAt,
  source: "fallback",
};

/**
 * Parse the API's statistics object. Split out and exported so every branch is
 * testable without a key or a network — see lib/stats.test.ts.
 *
 * YouTube returns these counts as STRINGS, and `subscriberCount` is absent
 * entirely on a channel that hides it. A missing or unparseable field falls back
 * rather than rendering NaN, which is the one outcome worse than a stale number.
 */
export function parseStats(body: unknown): ChannelStats | null {
  const stats = (
    body as { items?: Array<{ statistics?: Record<string, unknown> }> } | null
  )?.items?.[0]?.statistics;
  if (!stats) return null;

  const num = (value: unknown): number | null => {
    if (typeof value === "number") {
      return Number.isFinite(value) && value >= 0 ? value : null;
    }
    // The empty-string guard is load-bearing: Number("") is 0, not NaN, so
    // without it an absent count renders as a confident "0 subscribers".
    if (typeof value !== "string" || value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const subscribers = num(stats.subscriberCount);
  const views = num(stats.viewCount);
  const videos = num(stats.videoCount);
  if (subscribers === null || views === null || videos === null) return null;

  return {
    subscribers,
    views,
    videos,
    capturedAt: new Date().toISOString().slice(0, 10),
    source: "youtube",
  };
}

/**
 * Never throws, never returns nothing. Same contract as getEpisodes, for the
 * same reason: a band of real-but-old numbers beats a hole in the page.
 */
export async function getChannelStats(): Promise<ChannelStats> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return FALLBACK_STATS;

  try {
    const url = `${ENDPOINT}?part=statistics&id=${CHANNEL_ID}&key=${key}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return FALLBACK_STATS;
    return parseStats(await res.json()) ?? FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}

/**
 * "16.3K", "333K", "1.2M".
 *
 * Rounded DOWN throughout. 16,999 subscribers shown as "17K" is a claim to
 * subscribers who do not exist, and this is a number sponsors read; 16.3K is
 * both true and unimpeachable. One decimal below 100K, none above, because
 * "333.3K" reads as false precision on a number that moves hourly.
 */
export function compact(n: number): string {
  if (n < 1_000) return String(Math.floor(n));
  if (n < 100_000) {
    const k = Math.floor(n / 100) / 10;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  if (n < 1_000_000) return `${Math.floor(n / 1_000)}K`;
  const m = Math.floor(n / 100_000) / 10;
  return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
}

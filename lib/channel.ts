/**
 * The channel's public statistics: the endpoint, the shape, and how to read it.
 *
 * Split out from stats.ts for exactly the reason feed.ts is split out from
 * episodes.ts — and the reason is worth restating, because the split looks like
 * fussiness right up until it does not. stats.ts imports the committed fallback
 * JSON, and a JSON import without an import attribute cannot be loaded by plain
 * Node. So scripts/refresh-stats.mjs, which runs under plain Node, cannot import
 * anything that reaches stats.ts.
 *
 * Without this file the script would need its own copy of the parser, and a job
 * running a different parser proves nothing about what the site can read.
 *
 * THIS FILE IMPORTS NOTHING AT ALL, including the channel id, which is why
 * statsUrl takes it as an argument. Node's ESM resolver does not accept a
 * relative import without a file extension, so even `from "./feed"` would fail
 * here with ERR_MODULE_NOT_FOUND under the script. Bare package specifiers are
 * fine — feed.ts imports fast-xml-parser and loads correctly — but a relative
 * one is not.
 */

export const STATS_ENDPOINT = "https://www.googleapis.com/youtube/v3/channels";

export function statsUrl(channelId: string, key: string): string {
  return `${STATS_ENDPOINT}?part=statistics&id=${channelId}&key=${key}`;
}

export interface ChannelStats {
  subscribers: number;
  views: number;
  videos: number;
  /** ISO date the numbers were captured. Only meaningful for the fallback. */
  capturedAt: string;
  /** Where these came from, so the page can be honest if it is guessing. */
  source: "youtube" | "fallback";
}

/**
 * Parse the API's statistics object.
 *
 * YouTube returns every count as a STRING, and omits `subscriberCount` entirely
 * on a channel that hides it. A missing or unparseable field returns null so the
 * caller can fall back, rather than rendering NaN — or worse, a confident zero.
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

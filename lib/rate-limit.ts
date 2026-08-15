/**
 * A fixed-window request limiter.
 *
 * Built for /api/subscribe, which is the one route on this site that causes a
 * side effect somewhere else — it puts an address on a mailing list. Before this
 * it had no limit at all, and the honeypot was the only thing in the way, which a
 * script defeats by simply not sending the field it is hiding from.
 *
 * WHAT THIS IS AND IS NOT. The counters live in module scope, so on Vercel they
 * are per-isolate: a caller spread across several edge locations gets several
 * budgets, and a cold start resets one. That makes this a brake, not a gate. It
 * is the right shape for the actual threat here, which is one script hammering
 * one endpoint, and it is worth being clear that it is not protection against a
 * distributed effort. A real gate needs shared state — Vercel KV or Upstash — and
 * this module is deliberately the only thing that would have to change.
 *
 * Fixed window rather than sliding: it costs one integer per caller instead of a
 * list of timestamps, and the imprecision at a window boundary does not matter
 * for a form a person submits once.
 */

export interface RateLimitVerdict {
  ok: boolean;
  /** Seconds until this key is allowed again. 0 when `ok`. */
  retryAfter: number;
}

export interface RateLimitOptions {
  /** Requests allowed per window. */
  limit: number;
  windowMs: number;
  /**
   * Keys tracked before the sweep runs. A bound is the point: without one, a
   * caller rotating its address every request grows this map until the isolate
   * dies, which turns the defence into the vulnerability.
   */
  maxKeys?: number;
}

interface Window {
  count: number;
  resetAt: number;
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: RateLimitOptions) {
  const windows = new Map<string, Window>();

  /** Drop everything already expired. Cheap, and only ever runs at the ceiling. */
  const sweep = (at: number) => {
    for (const [key, window] of windows) {
      if (window.resetAt <= at) windows.delete(key);
    }
    // Still full of live windows: this is either real traffic or a rotating
    // caller, and either way holding more entries helps nobody.
    if (windows.size >= maxKeys) windows.clear();
  };

  return function take(key: string, at: number = Date.now()): RateLimitVerdict {
    const existing = windows.get(key);

    if (!existing || existing.resetAt <= at) {
      if (windows.size >= maxKeys) sweep(at);
      windows.set(key, { count: 1, resetAt: at + windowMs });
      return { ok: true, retryAfter: 0 };
    }

    if (existing.count >= limit) {
      return { ok: false, retryAfter: Math.ceil((existing.resetAt - at) / 1000) };
    }

    existing.count += 1;
    return { ok: true, retryAfter: 0 };
  };
}

/**
 * Who is asking.
 *
 * `x-forwarded-for` is a list, appended to by each proxy, so the FIRST entry is
 * the original client. It is also caller-supplied and therefore forgeable — on
 * Vercel the platform rewrites it, so it can be trusted there, but nothing in
 * this function can verify that. Which is the honest reason the limiter above is
 * documented as a brake.
 *
 * Falls back to a single shared bucket rather than to "unlimited": if the header
 * is missing entirely, something unusual is happening and one shared budget is
 * the safer failure.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

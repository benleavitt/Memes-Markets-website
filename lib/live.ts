/**
 * Live status and the broadcast schedule.
 *
 *   Twitch Helix ──> /api/live-status (edge, cached) ──> <LivePlayer/>
 *                          │
 *   FORCE_LIVE ────────────┘   override, so a Twitch outage or a demo
 *                              never blanks the hero
 *
 * Twitch rather than YouTube on purpose. YouTube's `search?eventType=live` costs
 * 100 quota units per call, which is ruinous at any real traffic. Twitch Helix
 * `GET /streams` is one cheap call, and the show goes out on both at once, so it
 * is a sound proxy for "are they on air".
 *
 * The offline countdown never touches the network. It is derived from the fixed
 * Tue/Thu 12:00 ET schedule, so the player renders something true even with no
 * credentials configured at all.
 */

export const SCHEDULE_DAYS = [2, 4] as const; // Tue, Thu (JS getUTCDay)
export const SCHEDULE_HOUR_ET = 12;
const SHOW_LENGTH_MS = 3 * 60 * 60 * 1000;

export interface LiveStatus {
  live: boolean;
  title?: string;
  viewers?: number;
  /** Where the answer came from, so the UI can be honest when it is guessing. */
  source: "twitch" | "forced" | "offline" | "error";
}

/**
 * Minutes that America/New_York is behind UTC on a given instant.
 * Uses Intl rather than a hardcoded -5/-4 so DST transitions are correct.
 */
export function etOffsetMinutes(at: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  // "GMT-05:00" / "GMT-4" / "GMT"
  const m = name?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return -300;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** The next Tuesday or Thursday 12:00 ET at or after `from`. */
export function nextSlot(from: Date = new Date()): Date {
  for (let i = 0; i <= 8; i++) {
    const probe = new Date(from.getTime() + i * 86_400_000);
    const offset = etOffsetMinutes(probe);
    // Midnight ET on the probe's ET calendar day, expressed as a UTC instant.
    const etNow = new Date(probe.getTime() + offset * 60_000);
    const day = etNow.getUTCDay();
    if (!SCHEDULE_DAYS.includes(day as 2 | 4)) continue;

    const midnightEtUtc = Date.UTC(
      etNow.getUTCFullYear(),
      etNow.getUTCMonth(),
      etNow.getUTCDate(),
    );
    const slot = new Date(midnightEtUtc + SCHEDULE_HOUR_ET * 3_600_000 - offset * 60_000);
    if (slot.getTime() >= from.getTime()) return slot;
  }
  // Unreachable for a twice-weekly schedule, but never return a bogus date.
  return new Date(from.getTime() + 7 * 86_400_000);
}

/** True while a scheduled broadcast would still be running. Used to tighten caching. */
export function inBroadcastWindow(at: Date = new Date()): boolean {
  const next = nextSlot(new Date(at.getTime() - SHOW_LENGTH_MS));
  return next.getTime() <= at.getTime();
}

/**
 * "Tuesday 12PM ET".
 *
 * Currently unused by any component: the player's offline countdown was removed
 * when it became live-only. Kept, and kept tested, because the schedule maths it
 * formats is the awkward part and the next thing that wants to print a slot
 * should not have to rewrite it.
 */
export function formatSlot(slot: Date): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
  }).format(slot);
  return `${weekday} ${SCHEDULE_HOUR_ET}PM ET`;
}

/**
 * How long the edge should cache a live-status answer.
 *
 * 20s inside the broadcast window, 5 minutes outside it. The moment the show
 * goes live is the highest-traffic minute of the week, and a flat 60s cache
 * meant up to a minute of visitors seeing "offline" and the wrong CTA.
 */
export function cacheSeconds(at: Date = new Date()): number {
  return inBroadcastWindow(at) ? 20 : 300;
}

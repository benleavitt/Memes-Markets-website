import { describe, expect, it } from "vitest";
import {
  SCHEDULE_HOUR_ET,
  cacheSeconds,
  etOffsetMinutes,
  formatSlot,
  inBroadcastWindow,
  nextSlot,
} from "./live";

/** What hour is it in New York at this instant? */
function etHour(d: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(d),
  );
}
function etWeekday(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
  }).format(d);
}

describe("etOffsetMinutes", () => {
  it("is -300 in winter and -240 in summer (DST)", () => {
    expect(etOffsetMinutes(new Date("2026-01-15T12:00:00Z"))).toBe(-300);
    expect(etOffsetMinutes(new Date("2026-07-15T12:00:00Z"))).toBe(-240);
  });
});

describe("nextSlot", () => {
  it("always lands on a Tuesday or Thursday at noon Eastern", () => {
    // Walk a full year at odd hours so DST boundaries and week wraps are covered.
    for (let i = 0; i < 365; i += 7) {
      const from = new Date(Date.UTC(2026, 0, 1, 3, 17) + i * 86_400_000);
      const slot = nextSlot(from);
      expect(["Tuesday", "Thursday"]).toContain(etWeekday(slot));
      expect(etHour(slot)).toBe(SCHEDULE_HOUR_ET);
      expect(slot.getTime()).toBeGreaterThanOrEqual(from.getTime());
    }
  });

  it("survives the spring-forward boundary", () => {
    // US DST begins 2026-03-08. A slot found either side must still be noon ET.
    const before = nextSlot(new Date("2026-03-06T18:00:00Z"));
    const after = nextSlot(new Date("2026-03-09T18:00:00Z"));
    expect(etHour(before)).toBe(SCHEDULE_HOUR_ET);
    expect(etHour(after)).toBe(SCHEDULE_HOUR_ET);
    expect(etWeekday(after)).toBe("Tuesday");
  });

  it("returns today's slot when it has not started yet", () => {
    // 2026-08-04 is a Tuesday. 09:00 ET is 13:00 UTC (EDT, -4).
    const slot = nextSlot(new Date("2026-08-04T13:00:00Z"));
    expect(etWeekday(slot)).toBe("Tuesday");
    expect(slot.toISOString()).toBe("2026-08-04T16:00:00.000Z");
  });

  it("rolls to Thursday once Tuesday's slot has passed", () => {
    const slot = nextSlot(new Date("2026-08-04T17:00:00Z")); // 13:00 ET, past noon
    expect(etWeekday(slot)).toBe("Thursday");
  });

  it("is never more than a week out", () => {
    const from = new Date("2026-08-07T20:00:00Z"); // Friday evening
    const slot = nextSlot(from);
    expect(slot.getTime() - from.getTime()).toBeLessThanOrEqual(7 * 86_400_000);
  });
});

describe("inBroadcastWindow", () => {
  it("is true just after a slot starts and false well before", () => {
    expect(inBroadcastWindow(new Date("2026-08-04T16:30:00Z"))).toBe(true);
    expect(inBroadcastWindow(new Date("2026-08-04T06:00:00Z"))).toBe(false);
  });

  it("closes three hours after the slot", () => {
    expect(inBroadcastWindow(new Date("2026-08-04T18:59:00Z"))).toBe(true);
    expect(inBroadcastWindow(new Date("2026-08-04T19:30:00Z"))).toBe(false);
  });
});

describe("cacheSeconds", () => {
  it("tightens inside the window so going live is not masked by a stale cache", () => {
    expect(cacheSeconds(new Date("2026-08-04T16:30:00Z"))).toBe(20);
    expect(cacheSeconds(new Date("2026-08-04T06:00:00Z"))).toBe(300);
  });
});

describe("formatSlot", () => {
  it("reads as the offline copy does", () => {
    expect(formatSlot(new Date("2026-08-04T16:00:00Z"))).toBe("Tuesday 12PM ET");
  });
});

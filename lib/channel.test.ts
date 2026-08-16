import { describe, expect, it } from "vitest";
import { compact, parseStats } from "./channel";

/**
 * The shape below is verbatim from `channels?part=statistics`. It is worth
 * keeping whole: every count arrives as a STRING, which is the detail that would
 * otherwise be rediscovered by rendering "16300" as NaN.
 */
const REAL_BODY = {
  kind: "youtube#channelListResponse",
  items: [
    {
      kind: "youtube#channel",
      id: "UCpDHJbeyWBab2qr6y2d6_yQ",
      statistics: {
        viewCount: "333318",
        subscriberCount: "16300",
        hiddenSubscriberCount: false,
        videoCount: "102",
      },
    },
  ],
};

describe("parseStats", () => {
  it("reads the counts out of a real response", () => {
    const stats = parseStats(REAL_BODY);
    expect(stats).toMatchObject({
      subscribers: 16300,
      views: 333318,
      videos: 102,
      source: "youtube",
    });
  });

  it("stamps the capture date so a stale figure can be spotted", () => {
    expect(parseStats(REAL_BODY)?.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("gives up rather than inventing a number when one is missing", () => {
    // A channel that hides its subscriber count omits the field entirely. The
    // caller then serves the fallback, which is honest; a 0 would not be.
    const hidden = {
      items: [{ statistics: { viewCount: "1", videoCount: "2" } }],
    };
    expect(parseStats(hidden)).toBeNull();
  });

  it("survives every wrong shape rather than throwing into a page render", () => {
    for (const junk of [null, undefined, {}, { items: [] }, "<html>", 42, []]) {
      expect(parseStats(junk)).toBeNull();
    }
  });

  it("rejects counts that are not numbers", () => {
    for (const bad of ["", "many", Number.NaN, -5, {}]) {
      const body = {
        items: [
          { statistics: { subscriberCount: bad, viewCount: "1", videoCount: "2" } },
        ],
      };
      expect(parseStats(body)).toBeNull();
    }
  });
});

describe("compact", () => {
  it("formats the numbers actually on the page", () => {
    expect(compact(16_300)).toBe("16.3K");
    expect(compact(333_318)).toBe("333K");
    expect(compact(102)).toBe("102");
  });

  /**
   * The load-bearing property. These numbers are read by sponsors, so rounding
   * up would overstate the audience — 16,999 is not 17K.
   */
  it("never rounds up", () => {
    expect(compact(16_999)).toBe("16.9K");
    expect(compact(999)).toBe("999");
    expect(compact(1_999)).toBe("1.9K");
    expect(compact(999_999)).toBe("999K");
    expect(compact(1_999_999)).toBe("1.9M");
  });

  it("drops a trailing .0 rather than printing 17.0K", () => {
    expect(compact(17_000)).toBe("17K");
    expect(compact(1_000)).toBe("1K");
    expect(compact(2_000_000)).toBe("2M");
  });

  it("stops using decimals once the number is big enough not to need them", () => {
    expect(compact(100_000)).toBe("100K");
    expect(compact(250_500)).toBe("250K");
  });
});

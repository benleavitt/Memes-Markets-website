import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "./rate-limit";

/**
 * The clock is passed in on every call rather than mocked, so these run in real
 * time and describe the boundary behaviour exactly — which is the part of a fixed
 * window that is easy to get subtly wrong.
 */

describe("createRateLimiter", () => {
  it("allows up to the limit and refuses the one after", () => {
    const take = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(take("a", 0).ok).toBe(true);
    expect(take("a", 1_000).ok).toBe(true);
    expect(take("a", 2_000).ok).toBe(true);
    expect(take("a", 3_000).ok).toBe(false);
  });

  it("reports how long to wait, rounded up to whole seconds", () => {
    const take = createRateLimiter({ limit: 1, windowMs: 60_000 });
    take("a", 0);
    expect(take("a", 500)).toEqual({ ok: false, retryAfter: 60 });
    expect(take("a", 59_500)).toEqual({ ok: false, retryAfter: 1 });
  });

  it("keeps callers apart", () => {
    const take = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(take("a", 0).ok).toBe(true);
    expect(take("b", 0).ok).toBe(true);
    expect(take("a", 0).ok).toBe(false);
  });

  it("opens a fresh window once the old one expires", () => {
    const take = createRateLimiter({ limit: 2, windowMs: 60_000 });
    take("a", 0);
    take("a", 0);
    expect(take("a", 59_999).ok).toBe(false);
    expect(take("a", 60_000).ok).toBe(true);
  });

  it("does not grow without bound when every key is different", () => {
    // The failure this guards against is the defence becoming the vulnerability:
    // a caller rotating its address once per request used to be free memory growth.
    const take = createRateLimiter({ limit: 1, windowMs: 1_000, maxKeys: 50 });
    for (let i = 0; i < 5_000; i++) take(`caller-${i}`, i * 10);
    // Still answering correctly after the sweeps.
    expect(take("fresh", 100_000).ok).toBe(true);
    expect(take("fresh", 100_100).ok).toBe(false);
  });
});

describe("clientKey", () => {
  it("takes the original client, not the nearest proxy", () => {
    const h = new Headers({
      "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178",
    });
    expect(clientKey(h)).toBe("203.0.113.5");
  });

  it("handles a single address and stray whitespace", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "  203.0.113.5 " }))).toBe(
      "203.0.113.5",
    );
  });

  it("falls back to x-real-ip, then to one shared bucket", () => {
    expect(clientKey(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    // Deliberately not "unlimited" — a missing header is odd, and one shared
    // budget is the safer way to be wrong.
    expect(clientKey(new Headers())).toBe("unknown");
  });

  it("ignores an empty forwarded header rather than keying on the empty string", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": " , " }))).toBe("unknown");
  });
});

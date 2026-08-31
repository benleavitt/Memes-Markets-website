import { describe, expect, it } from "vitest";
import { looksLikeEmail, redirectedAwayFrom } from "./newsletter";

/**
 * What survives now the signup writes to a sheet instead of Substack.
 *
 * interpret(), redactAddresses() and the fixtures pinning Substack's response
 * shapes went with the API call — nothing parses their responses any more. The
 * local email check still guards the route, and redirectedAwayFrom still tells
 * the posts strip when the publication is sending it to the wrong host.
 */

describe("looksLikeEmail", () => {
  it("accepts ordinary addresses, including tags and subdomains", () => {
    for (const ok of [
      "a@b.co",
      "keith@memesandmarkets.com",
      "ben+markets@mail.example.co.uk",
    ]) {
      expect(looksLikeEmail(ok)).toBe(true);
    }
  });

  it("rejects the obvious junk that is not worth a round trip", () => {
    for (const bad of ["", "   ", "nope", "no-at-sign.com", "a@b", "two@@at.com"]) {
      expect(looksLikeEmail(bad)).toBe(false);
    }
  });

  it("ignores surrounding whitespace, which people paste in constantly", () => {
    expect(looksLikeEmail("  someone@example.com  ")).toBe(true);
  });
});

/**
 * The failure that took the newsletter down at the domain move: the publication
 * still had www.memesandmarkets.com as an enforced custom domain, the site took
 * that domain over, and Substack dutifully redirected the feed onto a Next 404.
 * From a status code alone that is indistinguishable from a quiet newsletter.
 */
describe("redirectedAwayFrom", () => {
  const feed = "https://memesandmarketspod.substack.com/feed";

  it("catches a publication redirecting onto a host that is not Substack", () => {
    expect(redirectedAwayFrom(feed, "https://www.memesandmarkets.com/feed")).toBe(true);
  });

  it("is quiet when nothing redirected", () => {
    expect(redirectedAwayFrom(feed, feed)).toBe(false);
  });

  it("allows Substack to move us around its own hosts", () => {
    for (const landed of [
      "https://substack.com/feed",
      "https://another.substack.com/feed",
    ]) {
      expect(redirectedAwayFrom(feed, landed)).toBe(false);
    }
  });

  it("is not fooled by a lookalike host", () => {
    // endsWith(".substack.com") rather than includes("substack.com").
    expect(redirectedAwayFrom(feed, "https://substack.com.evil.test/feed")).toBe(true);
  });

  it("says nothing rather than throwing on an unparseable url", () => {
    expect(redirectedAwayFrom(feed, "")).toBe(false);
    expect(redirectedAwayFrom("", feed)).toBe(false);
  });
});

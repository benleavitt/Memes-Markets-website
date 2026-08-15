import { describe, expect, it } from "vitest";
import { interpret, looksLikeEmail, redactAddresses } from "./newsletter";

/**
 * Substack's subscribe endpoint is undocumented, so these tests are the record of
 * what we currently believe it returns. The shapes below were taken from real
 * responses, not invented — if signups start failing, check these against a live
 * call before changing anything else.
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

describe("interpret", () => {
  /**
   * Verbatim from a live signup on 2026-08-15, kept whole rather than trimmed to
   * the two fields we read — the next person to debug this wants to see exactly
   * what Substack sends, including the parts we ignore.
   *
   * `requires_confirmation: false` is the important one. It is why no
   * confirmation email arrives for this publication, and why the success copy
   * must not promise one.
   */
  const REAL_SUCCESS = {
    email: "someone@example.com",
    prompt_to_login: false,
    requires_confirmation: false,
    subscription_id: 1472858009,
    didSignup: true,
    referral_token: "8x78jc",
    hasAppInstalled: false,
    conversion_id: "node-QDyzIXER0r7UXpPdKKqlmhpecWo8mjnl",
  };

  it("treats a real signup response as a signup needing no confirmation", () => {
    expect(interpret(200, REAL_SUCCESS)).toEqual({
      ok: true,
      requiresConfirmation: false,
    });
  });

  it("reports a confirmation step when Substack says it sent one", () => {
    expect(interpret(200, { ...REAL_SUCCESS, requires_confirmation: true })).toEqual({
      ok: true,
      requiresConfirmation: true,
    });
  });

  it("assumes no confirmation when the field is missing or not a boolean", () => {
    for (const body of [{ didSignup: true }, { requires_confirmation: "yes" }, null]) {
      expect(interpret(200, body)).toEqual({ ok: true, requiresConfirmation: false });
    }
  });

  it("surfaces one message when Substack rejects the address", () => {
    // The real 400 body: one bad address produces two errors. Showing both reads
    // as two separate faults.
    const body = {
      errors: [
        {
          location: "body",
          param: "email",
          value: "not-an-email",
          msg: "Please enter a valid email",
        },
        {
          location: "body",
          param: "email",
          value: "not-an-email",
          msg: "We were unable to validate your email domain",
        },
      ],
    };
    expect(interpret(400, body)).toEqual({
      ok: false,
      message: "Please enter a valid email",
      field: true,
    });
  });

  it("blames the field only when the error is about the email", () => {
    const body = { errors: [{ param: "captcha", msg: "Nope" }] };
    expect(interpret(400, body)).toEqual({ ok: false, message: "Nope", field: false });
  });

  it("does not blame the visitor for an unexplained failure", () => {
    const result = interpret(500, null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe(false);
  });

  it("prefers the error list over the status code", () => {
    // A 200 carrying errors would otherwise be reported as a successful signup.
    const result = interpret(200, { errors: [{ param: "email", msg: "Blocked" }] });
    expect(result).toEqual({ ok: false, message: "Blocked", field: true });
  });

  it("survives a body of the wrong shape entirely", () => {
    for (const junk of ["<html>", 42, [], { errors: "not-an-array" }]) {
      expect(interpret(500, junk).ok).toBe(false);
    }
    expect(interpret(200, "<html>")).toEqual({ ok: true, requiresConfirmation: false });
  });
});

/**
 * The route logs Substack's message so a failing integration is not silent. These
 * pin the promise that an address cannot ride along in it, whatever Substack
 * decides to put there.
 */
describe("redactAddresses", () => {
  it("removes an address wherever it appears in the sentence", () => {
    expect(redactAddresses("someone@example.com was rejected")).toBe(
      "[address] was rejected",
    );
    expect(redactAddresses("We could not validate ben+markets@mail.example.co.uk")).toBe(
      "We could not validate [address]",
    );
  });

  it("handles more than one, and addresses in punctuation", () => {
    expect(redactAddresses("a@b.co and c@d.co")).toBe("[address] and [address]");
    expect(redactAddresses("rejected (keith@example.com)")).toBe("rejected ([address])");
    expect(redactAddresses('"ben@example.com" is blocked')).toBe(
      '"[address]" is blocked',
    );
  });

  it("leaves ordinary messages alone", () => {
    for (const msg of [
      "Please enter a valid email",
      "We were unable to validate your email domain",
      "",
    ]) {
      expect(redactAddresses(msg)).toBe(msg);
    }
  });
});

import { describe, expect, it } from "vitest";
import { interpret, looksLikeEmail } from "./newsletter";

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
  it("treats a 200 as a signup", () => {
    expect(interpret(200, { didSignup: true })).toEqual({ ok: true });
  });

  it("treats a 200 with no body as a signup", () => {
    expect(interpret(200, null)).toEqual({ ok: true });
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
    expect(interpret(200, "<html>")).toEqual({ ok: true });
  });
});

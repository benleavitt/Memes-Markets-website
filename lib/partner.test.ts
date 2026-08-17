import { describe, expect, it } from "vitest";
import { LIMITS, validate } from "./partner";

const GOOD = {
  name: "Sam Rivera",
  email: "sam@example.co.uk",
  organisation: "Example Capital",
  kind: "Sponsorship",
  message: "We run a brokerage and would like to talk about a Q4 read.",
};

describe("validate", () => {
  it("accepts a complete enquiry and trims what it returns", () => {
    const result = validate({ ...GOOD, name: "  Sam Rivera  " });
    expect(result.ok).toBe(true);
    expect(result.enquiry).toEqual({ ...GOOD, name: "Sam Rivera" });
  });

  it("treats the company field as optional", () => {
    const result = validate({ ...GOOD, organisation: "" });
    expect(result.ok).toBe(true);
    expect(result.enquiry?.organisation).toBe("");
  });

  /**
   * `kind` reaches the sheet as a column people filter on, so an arbitrary
   * string would quietly poison the one field that makes the sheet sortable.
   */
  it("only accepts a kind from the list", () => {
    for (const kind of ["Anything", "", null, 7, "sponsorship"]) {
      const result = validate({ ...GOOD, kind });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.field).toBe("kind");
    }
  });

  it("names the field that is wrong, so the form can mark it", () => {
    expect(validate({ ...GOOD, name: "  " })).toMatchObject({ field: "name" });
    expect(validate({ ...GOOD, email: "nope" })).toMatchObject({ field: "email" });
    expect(validate({ ...GOOD, message: "" })).toMatchObject({ field: "message" });
  });

  it("bounds every free-text field", () => {
    expect(validate({ ...GOOD, name: "a".repeat(LIMITS.name + 1) }).ok).toBe(false);
    expect(
      validate({ ...GOOD, organisation: "a".repeat(LIMITS.organisation + 1) }).ok,
    ).toBe(false);
    expect(validate({ ...GOOD, message: "a".repeat(LIMITS.message + 1) }).ok).toBe(false);
    // And accepts a message right up to the bound.
    expect(validate({ ...GOOD, message: "a".repeat(LIMITS.message) }).ok).toBe(true);
  });

  it("does not throw on a body of the wrong shape entirely", () => {
    for (const junk of [{}, { name: 1, email: [], kind: {} }]) {
      expect(validate(junk as Record<string, unknown>).ok).toBe(false);
    }
  });
});

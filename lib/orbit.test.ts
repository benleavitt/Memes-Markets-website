import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ORBIT, nearestIndex, project, projectAll, spinToFront } from "./orbit";

describe("project", () => {
  it("puts card 0 nearest the viewer at rest", () => {
    const s = project(0, 0);
    expect(s.z).toBeCloseTo(1);
    expect(s.scale).toBeCloseTo(1);
    expect(s.opacity).toBeCloseTo(1);
    expect(s.x).toBeCloseTo(0);
  });

  it("puts the opposite card furthest away", () => {
    const s = project(ORBIT.COUNT / 2, 0);
    expect(s.z).toBeCloseTo(-1);
    expect(s.scale).toBeLessThan(1);
    expect(s.opacity).toBeLessThan(0.2);
    expect(s.x).toBeCloseTo(0);
  });

  it("squashes edge-on cards to MIN_SQUASH and never below", () => {
    const edge = project(ORBIT.COUNT / 4, 0);
    expect(edge.z).toBeCloseTo(0);
    expect(edge.squash).toBeCloseTo(ORBIT.MIN_SQUASH);
    for (let i = 0; i < ORBIT.COUNT; i++) {
      expect(project(i, 0).squash).toBeGreaterThanOrEqual(ORBIT.MIN_SQUASH);
    }
  });

  it("fades edge-on cards so they read as depth, not slivers", () => {
    const edge = project(ORBIT.COUNT / 4, 0);
    const front = project(0, 0);
    expect(edge.opacity).toBeLessThan(front.opacity * 0.2);
  });

  it("keeps opacity inside [0.04, 1] for every card at every rotation", () => {
    for (let step = 0; step < 48; step++) {
      const spin = (step / 48) * Math.PI * 2;
      for (let i = 0; i < ORBIT.COUNT; i++) {
        const { opacity, scale } = project(i, spin);
        expect(opacity).toBeGreaterThanOrEqual(0.04);
        expect(opacity).toBeLessThanOrEqual(1);
        expect(scale).toBeGreaterThan(0);
        expect(Number.isFinite(scale)).toBe(true);
      }
    }
  });

  it("is periodic: spinning a full turn returns the same geometry", () => {
    const a = project(3, 0.4);
    const b = project(3, 0.4 + Math.PI * 2);
    expect(b.x).toBeCloseTo(a.x);
    expect(b.y).toBeCloseTo(a.y);
    expect(b.scale).toBeCloseTo(a.scale);
  });

  it("bulges toward the viewer past the 90 degree mark", () => {
    // Real perspective pushes the widest screen offset PAST 90 degrees, peaking
    // around 75. Sampled with a fractional index because with 12 cards no card
    // actually sits there — among real card positions the widest is the 90 one.
    const at90 = Math.abs(project(ORBIT.COUNT / 4, 0).x);
    const at75 = Math.abs(project((ORBIT.COUNT * 75) / 360, 0).x);
    const at60 = Math.abs(project(ORBIT.COUNT / 6, 0).x);
    expect(at75).toBeGreaterThan(at90);
    expect(at75).toBeGreaterThan(at60);
  });
});

describe("projectAll", () => {
  it("returns every card sorted back to front", () => {
    const all = projectAll(0);
    expect(all).toHaveLength(ORBIT.COUNT);
    const zs = all.map((s) => s.z);
    expect(zs).toEqual([...zs].sort((a, b) => a - b));
    expect(new Set(all.map((s) => s.index)).size).toBe(ORBIT.COUNT);
  });
});

describe("spinToFront / nearestIndex", () => {
  it("round-trips every card", () => {
    for (let i = 0; i < ORBIT.COUNT; i++) {
      expect(nearestIndex(spinToFront(i))).toBe(i);
      expect(project(i, spinToFront(i)).z).toBeCloseTo(1);
    }
  });

  it("snaps to the nearest card from an arbitrary rotation", () => {
    const step = (Math.PI * 2) / ORBIT.COUNT;
    expect(nearestIndex(-step * 2.4)).toBe(2);
    expect(nearestIndex(-step * 2.6)).toBe(3);
  });

  it("handles rotations beyond a full turn in both directions", () => {
    expect(nearestIndex(spinToFront(5) - Math.PI * 2)).toBe(5);
    expect(nearestIndex(spinToFront(5) + Math.PI * 4)).toBe(5);
  });
});

/**
 * The hero renders from CSS, not from this file.
 *
 * That is the arrangement — the belt is `rotateY() translateZ()` on the
 * compositor, and the browser does the 3D — but it left this module claiming to
 * be the single source of truth for numbers nothing at runtime reads. The site
 * imports ORBIT.COUNT and nothing else; RADIUS, DEPTH and the rest lived here as
 * documentation and again, independently, as literals in app/globals.css, kept in
 * agreement by a comment in each pointing at the other.
 *
 * These tests are what makes the claim true. Change one side and the suite goes
 * red, which is the whole difference between a source of truth and a copy.
 */
const CSS = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** A declaration inside one rule, anchored so a `:has()` mention cannot match. */
function declaration(selector: string, property: string): string {
  const block = CSS.match(new RegExp(`^\\${selector}\\s*\\{([^}]*)\\}`, "m"))?.[1];
  if (block === undefined) throw new Error(`no rule for ${selector} in globals.css`);
  const value = block.match(new RegExp(`(?:^|;)\\s*${property}\\s*:([^;]*)`))?.[1];
  if (value === undefined) {
    throw new Error(`${selector} has no ${property} in globals.css`);
  }
  return value.trim();
}

/** A custom property, which must be declared exactly once to be a source of truth. */
function customProperty(name: string): string {
  const found = [...CSS.matchAll(new RegExp(`${name}\\s*:([^;]*)`, "g"))];
  expect(found, `${name} should be declared once in globals.css`).toHaveLength(1);
  return (found[0]?.[1] ?? "").trim();
}

describe("ORBIT matches the CSS the hero actually renders from", () => {
  it("radius", () => {
    expect(customProperty("--mm-orbit-r")).toBe(`${ORBIT.RADIUS}px`);
  });

  it("camera distance", () => {
    expect(declaration(".mm-orbit-stage", "perspective")).toBe(`${ORBIT.DEPTH}px`);
  });

  it("card width", () => {
    expect(declaration(".mm-orbit-slot", "width")).toBe(`${ORBIT.CARD_W}px`);
    // The slot is centred on the belt, so its negative margin is half its width.
    expect(declaration(".mm-orbit-slot", "margin-left")).toBe(`-${ORBIT.CARD_W / 2}px`);
  });

  it("vertical semi-axis follows the tilt the CSS applies", () => {
    // RADIUS_Y is documented as RADIUS * sin(tilt). Read the tilt back out of the
    // transform rather than trusting the comment.
    const tilt = declaration(".mm-orbit-belt", "transform").match(
      /rotateX\((-?[\d.]+)deg\)/,
    )?.[1];
    expect(tilt, "belt transform should carry a rotateX").toBeDefined();
    const expected = ORBIT.RADIUS * Math.sin((Math.abs(Number(tilt)) * Math.PI) / 180);
    expect(ORBIT.RADIUS_Y).toBeCloseTo(expected, 0);
  });

  it("leaves a gap between the front cards at this radius", () => {
    // The reason RADIUS is 470 and not the 345 it started at. Below about 435 the
    // circumference stops fitting COUNT cards and neighbours overlap on screen.
    const circumference = 2 * Math.PI * ORBIT.RADIUS;
    expect(circumference).toBeGreaterThan(ORBIT.COUNT * ORBIT.CARD_W);
  });
});

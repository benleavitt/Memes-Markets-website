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

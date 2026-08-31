import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The brand mark on the social cards.
 *
 * lib/og.tsx cannot be imported here — it pulls in next/og, which does not load
 * under a plain node test environment. So this reads the source and checks the
 * path it uses, the same way lib/orbit.test.ts checks globals.css rather than
 * trusting a comment.
 *
 * The failure this guards against is silent by design: renderOg falls back to a
 * red dot when the file cannot be read, precisely so a missing image never fails
 * a build. That is the right behaviour and it means moving or renaming the logo
 * would quietly strip the mark from every link anyone shares, with nothing red
 * anywhere to say so.
 */
const SOURCE = readFileSync(new URL("./og.tsx", import.meta.url), "utf8");

describe("the OG card's brand mark", () => {
  it("reads a file that exists", () => {
    const call = SOURCE.match(/join\(process\.cwd\(\),([^)]*)\)/)?.[1];
    expect(call, "lib/og.tsx should build the logo path with path.join").toBeDefined();

    const segments = [...(call ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
    expect(segments.length).toBeGreaterThan(0);

    const path = join(process.cwd(), ...segments);
    expect(existsSync(path), `${segments.join("/")} is missing`).toBe(true);
  });

  it("still has a fallback, so a missing file cannot fail a build", () => {
    // If this ever stops being true, the test above stops being a warning and
    // starts being the only thing between a moved file and a broken deploy.
    expect(SOURCE).toContain("catch");
    expect(SOURCE).toMatch(/LOGO \?/);
  });
});

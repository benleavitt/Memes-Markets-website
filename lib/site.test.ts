import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * siteUrl decides the canonical URL for metadata, OG images, JSON-LD and the
 * sitemap, and isLiveSite decides whether a deployment is allowed to be indexed.
 * Getting the second one wrong puts staging into Google, so both are pinned here.
 *
 * The module reads process.env at call time, but resetModules keeps each case
 * honest even if that ever changes.
 */
const load = async () => {
  vi.resetModules();
  return await import("./site");
};

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_ENV",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_URL",
];

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  vi.unstubAllEnvs();
});

const set = (vars: Record<string, string>) => {
  for (const key of ENV_KEYS) delete process.env[key];
  for (const [k, v] of Object.entries(vars)) process.env[k] = v;
};

describe("siteUrl", () => {
  it("falls back to localhost when nothing is set", async () => {
    set({});
    expect((await load()).siteUrl()).toBe("http://localhost:3000");
  });

  it("uses the custom domain above everything else", async () => {
    set({
      NEXT_PUBLIC_SITE_URL: "https://memesandmarkets.tv",
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "mm.vercel.app",
      VERCEL_URL: "mm-abc123.vercel.app",
    });
    expect((await load()).siteUrl()).toBe("https://memesandmarkets.tv");
  });

  it("adds the protocol and drops a trailing slash", async () => {
    set({ NEXT_PUBLIC_SITE_URL: "memesandmarkets.tv/" });
    expect((await load()).siteUrl()).toBe("https://memesandmarkets.tv");
  });

  it("prefers the stable production host over this deployment's own URL", async () => {
    // Otherwise every redeploy publishes a different canonical URL for one page.
    set({
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "mm.vercel.app",
      VERCEL_URL: "mm-abc123.vercel.app",
    });
    expect((await load()).siteUrl()).toBe("https://mm.vercel.app");
  });

  it("uses the branch alias on staging, not the per-deploy URL", async () => {
    // The branch URL is stable between pushes; VERCEL_URL is not.
    set({
      VERCEL_ENV: "preview",
      VERCEL_PROJECT_PRODUCTION_URL: "mm.vercel.app",
      VERCEL_BRANCH_URL: "mm-git-staging-charles.vercel.app",
      VERCEL_URL: "mm-abc123.vercel.app",
    });
    expect((await load()).siteUrl()).toBe("https://mm-git-staging-charles.vercel.app");
  });

  it("falls back to the deployment URL when there is no branch alias", async () => {
    set({ VERCEL_ENV: "preview", VERCEL_URL: "mm-abc123.vercel.app" });
    expect((await load()).siteUrl()).toBe("https://mm-abc123.vercel.app");
  });
});

describe("isLiveSite", () => {
  it("is true only for a production deployment", async () => {
    set({ VERCEL_ENV: "production" });
    expect((await load()).isLiveSite()).toBe(true);
  });

  it("is false on staging and previews, so they stay out of the index", async () => {
    set({ VERCEL_ENV: "preview" });
    expect((await load()).isLiveSite()).toBe(false);
  });

  it("is false locally even though NODE_ENV may say production", async () => {
    // The trap this guards: a staging build is a production Node build.
    set({});
    vi.stubEnv("NODE_ENV", "production");
    expect((await load()).isLiveSite()).toBe(false);
  });
});

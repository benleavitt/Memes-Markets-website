import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Compiles every route once before any worker starts. See the file for why
  // that is not the same thing as raising the expect timeout.
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    /**
     * A throwaway measurement id, so the consent tests have something to consent
     * ABOUT. The banner and the tag are both gated on NEXT_PUBLIC_GA_ID — a site
     * with no analytics shows no cookie notice — so without this the whole
     * "cookie consent" describe block would be testing an empty page.
     *
     * It is deliberately not a real id. The tests stub googletagmanager.com, so
     * nothing is ever sent anywhere; this only has to be non-empty.
     *
     * CAVEAT: `reuseExistingServer` means a dev server already running without
     * this var gets reused, and those tests then fail. That is the right failure
     * — loud rather than silently skipped — but it is worth knowing before
     * debugging it as a code fault.
     */
    env: { NEXT_PUBLIC_GA_ID: "G-E2ETESTONLY" },
  },
});

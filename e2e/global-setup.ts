import type { FullConfig } from "@playwright/test";

/**
 * Compile every route once, before any test runs.
 *
 * `next dev` builds a route the first time something asks for it. The suite runs
 * against a dev server that playwright.config starts fresh per run, so the first
 * test to click through to /about, /partner, /privacy or /terms pays that compile
 * inside a 5s expect timeout — and with several workers triggering compiles at
 * once, it loses. The symptom is a navigation assertion failing with the router
 * still sitting on the previous URL, which reads exactly like a broken link and
 * is not one. Different tests drew the short straw on different runs, which is
 * what made it look like flakiness rather than one cause.
 *
 * Warming them here serially, before any worker starts, means every route is
 * already built by the time a test touches it. That is preferable to raising the
 * expect timeout: a real broken link still fails in five seconds.
 *
 * A route added to the app but not listed here does not break anything — it just
 * goes back to paying its own compile in whichever test reaches it first.
 */
const ROUTES = [
  "/",
  "/about",
  "/partner",
  "/privacy",
  "/terms",
  "/subscribed",
  // The API routes matter as much as the pages, and are easier to forget. The
  // newsletter spec fills the form, submits, and asserts on the message that
  // comes back — and an uncompiled /api/subscribe left the button sitting on
  // "Sending…" well past the 5s the assertion allows. The failure named the
  // message, not the route, so it read as a broken form.
  //
  // GET is deliberate: /api/subscribe only answers POST, so this returns 405 —
  // but the module is compiled either way, which is the whole point, and a GET
  // cannot put an address anywhere near Substack.
  "/api/live-status",
  "/api/subscribe",
];

/** Roughly a minute. The server may still be booting when this starts. */
const ATTEMPTS = 60;
const GAP_MS = 1_000;

export default async function globalSetup(config: FullConfig): Promise<void> {
  const base = config.projects[0]?.use.baseURL ?? "http://localhost:3000";

  for (const route of ROUTES) {
    const url = new URL(route, base).toString();

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const res = await fetch(url);
        // ANY answer means the route compiled and the server is up, which is all
        // this step is asking. Retrying until a route returns 2xx would spin for
        // a full minute on /api/subscribe, which correctly answers 405 to a GET.
        // Drained on purpose: the response is streamed, and abandoning it can
        // leave the compile unfinished, which defeats the point of warming.
        await res.text();
        break;
      } catch {
        // Not listening yet. webServer and this step can race on a cold start.
      }
      await new Promise((resolve) => setTimeout(resolve, GAP_MS));
    }
  }
}

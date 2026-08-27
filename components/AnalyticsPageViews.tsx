"use client";

import { trackPageView } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Reports a page view when the App Router changes route.
 *
 * See trackPageView in lib/analytics.ts for why this is needed at all: the tag
 * sends one page_view on load, and every navigation after that happens without
 * one.
 *
 * THE FIRST PATHNAME IS SKIPPED. `gtag('config', ...)` has already reported the
 * landing page by the time this mounts, so sending another here would count
 * every entry twice — which is worse than the bug it fixes, because a doubled
 * number looks plausible and nobody goes looking for it.
 *
 * It remembers the last path REPORTED rather than a "have I run yet" flag, and
 * that is load-bearing under React Strict Mode. Strict Mode mounts, unmounts and
 * remounts every component in development; a boolean flag survives that in the
 * ref, so the second run would see "already started" and report a view for the
 * landing page — the exact double count this is meant to prevent, visible only
 * in development and easy to carry into a wrong conclusion. Comparing the path
 * makes a repeat run a no-op no matter what caused it.
 *
 * `usePathname` only, never `useSearchParams`. Reading search params in a
 * component this high in the tree opts the whole app out of static rendering in
 * Next 15, which is a real cost for this site — and the only route here that
 * carries a query string is /subscribed?state=, which is noindex and reports
 * the outcome of a form rather than a page anyone browses to.
 *
 * Nothing is sent without a measurement id: app/layout.tsx does not mount this
 * without one, and trackPageView goes through `window.gtag?.()` regardless.
 */
export function AnalyticsPageViews() {
  const pathname = usePathname();
  /** null until the first render settles; then the last path actually reported. */
  const reported = useRef<string | null>(null);

  useEffect(() => {
    if (reported.current === null) {
      // The landing page. The tag has already counted this one.
      reported.current = pathname;
      return;
    }
    if (reported.current === pathname) return;
    reported.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
}

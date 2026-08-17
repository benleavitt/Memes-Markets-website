/**
 * Event tracking, provider-agnostic.
 *
 * The provider is now Google Analytics 4, and the indirection this file was
 * built for paid off exactly as intended: wiring it was a change to the one
 * function below, not a hunt through every component that calls it.
 *
 * CONSENT IS NOT CHECKED HERE, and that is deliberate rather than an oversight.
 * Google's Consent Mode owns that decision — components/Analytics.tsx defaults
 * analytics_storage to denied, and the banner flips it. Adding a second gate
 * here would mean two sources of truth for the same question, and the one in
 * this file would be the one that quietly went stale.
 *
 * Every send is still conditional on gtag EXISTING, which it does not without
 * NEXT_PUBLIC_GA_ID. A site with no measurement id sends nothing from here.
 */

export type AnalyticsEvent =
  /** Which of the seven platforms actually wins. The main thing worth knowing. */
  | "platform_click"
  /** The single primary CTA, which opens the info panel. */
  | "cta_more_info"
  /** The live link inside that panel. */
  | "cta_watch_live"
  /** Did anyone touch the sphere, and how — drag, keyboard, or scroll. */
  | "orbit_interact"
  /** An episode opened from the orbit rather than the list below it. */
  | "episode_open"
  /** Which press piece or guest appearance in the info panel got opened. */
  | "press_click";

type Props = Record<string, string | number | boolean | undefined>;

export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    // Visible on purpose: the point of this branch is to prove events fire,
    // without a dev session polluting the real property's numbers.
    console.debug("[analytics]", event, props ?? {});
    return;
  }

  window.gtag?.("event", event, props ?? {});
}

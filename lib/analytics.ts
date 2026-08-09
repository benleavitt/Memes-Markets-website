/**
 * Event tracking, provider-agnostic.
 *
 * No provider is wired yet, and that is deliberate: picking one is a product and
 * privacy decision, not an engineering one. What this file does is put the call
 * sites in the right places now, so choosing Plausible, Vercel Analytics or
 * anything else later is a change to ONE function rather than a hunt through
 * every component.
 *
 * To wire Plausible:
 *   window.plausible?.(event, { props });
 * To wire Vercel Analytics:
 *   import { track as va } from "@vercel/analytics"; va(event, props);
 *
 * Until then it is a no-op in production and a console line in development, so
 * you can confirm the events fire before paying for somewhere to send them.
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
  | "episode_open";

type Props = Record<string, string | number | boolean | undefined>;

export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    // Visible on purpose: the point of this branch is to prove events fire.
    console.debug("[analytics]", event, props ?? {});
    return;
  }

  // Wire a provider here. Intentionally empty rather than pretending to send.
}

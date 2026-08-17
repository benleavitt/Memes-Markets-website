/**
 * Google's gtag, as this site actually uses it.
 *
 * Hand-declared rather than pulling in @types/gtag.js: three call shapes are the
 * whole surface here, and a types-only dependency for that is more supply chain
 * than it is worth.
 *
 * Optional throughout, because it genuinely may not exist — without
 * NEXT_PUBLIC_GA_ID, components/Analytics.tsx renders nothing and no bootstrap
 * ever defines it. Every call site uses `window.gtag?.(...)`.
 */
type ConsentState = "granted" | "denied";

interface ConsentSettings {
  ad_storage?: ConsentState;
  ad_user_data?: ConsentState;
  ad_personalization?: ConsentState;
  analytics_storage?: ConsentState;
  wait_for_update?: number;
}

interface Window {
  gtag?: {
    (command: "consent", action: "default" | "update", settings: ConsentSettings): void;
    (command: "event", name: string, params?: Record<string, unknown>): void;
    (command: "config", targetId: string, config?: Record<string, unknown>): void;
    (command: "js", date: Date): void;
  };
  dataLayer?: unknown[];
}

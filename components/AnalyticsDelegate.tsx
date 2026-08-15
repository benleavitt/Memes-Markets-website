"use client";

import { type AnalyticsEvent, track } from "@/lib/analytics";
import { useEffect } from "react";

/**
 * One click listener for the whole document.
 *
 * The obvious way to track a click is an onClick handler, but in the App Router
 * that forces the component holding it across the server/client boundary. Doing
 * that to PlatformBar and LiveCta cost ~2kB of JS to learn which of seven links
 * someone pressed — a bad trade on a page whose entire pitch is that it is fast.
 *
 * Instead: markup declares intent, this island reads it.
 *
 *   <a data-analytics="platform_click" data-analytics-platform="youtube">
 *
 * Those components go back to being server components that ship zero JS, and
 * adding tracking to anything new is an attribute rather than a boundary change.
 *
 * Capture phase, so the event is recorded even if something downstream stops
 * propagation before the click reaches document.
 */
export function AnalyticsDelegate() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      // A click the orbit is swallowing is the tail of a drag, not an episode
      // being opened. This listener is on `document`, so OrbitSphere's
      // stopPropagation cannot reach it and the two used to disagree — every
      // flick that ended over a card logged an episode open that never happened.
      // See SWALLOW_ATTR in components/hero/OrbitSphere.tsx.
      if (target.closest("[data-swallow-click]")) return;

      const el = target.closest<HTMLElement>("[data-analytics]");
      if (!el) return;

      const event = el.dataset.analytics as AnalyticsEvent | undefined;
      if (!event) return;

      const props: Record<string, string> = {};
      for (const [key, value] of Object.entries(el.dataset)) {
        if (key === "analytics" || !key.startsWith("analytics") || value === undefined) {
          continue;
        }
        // data-analytics-platform -> dataset.analyticsPlatform -> "platform"
        props[key.slice("analytics".length).toLowerCase()] = value;
      }
      track(event, props);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

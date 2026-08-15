"use client";

import { useLiveStatus } from "@/lib/use-live-status";

/**
 * "Watch live now". Renders ONLY while the show is actually on air.
 *
 * It used to render unconditionally, which meant the site spent most of the week
 * shouting WATCH LIVE NOW at people who would click it and land on a channel
 * that was not broadcasting. A permanent live badge teaches visitors to ignore
 * the one that means it.
 *
 * Off air it returns null rather than switching to a countdown or a subscribe
 * link: this is the panel's only CTA, and a button that changes its mind about
 * what it does is worse than a row that is simply quieter when nothing is on.
 *
 * "Live" comes from Twitch — see lib/live.ts for why Twitch and not YouTube —
 * while the link goes to YouTube, which is the show's main channel and where
 * `/live` always resolves to whatever is currently broadcasting. The show goes
 * out to both at once, so the two agree in practice.
 *
 * Contrast note, load-bearing: white on the brand red (#FF0000) is 4.0:1, which
 * is short of the 4.5:1 WCAG AA needs for normal text. Rather than dull the brand
 * red, the label is set at 19px/700 — that clears the 18.66px bold threshold for
 * "large text", where the requirement drops to 3:1. Do not shrink this label
 * without also switching the fill to --mm-accent-deep (#C40000, 5.7:1).
 */
export function LiveCta({
  href = "https://www.youtube.com/@MemesandMarketsPod/live",
  children = "Watch live now",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  const { live } = useLiveStatus();
  if (!live) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      data-analytics="cta_watch_live"
      data-testid="live-cta"
      className="inline-flex items-center gap-3 rounded-[10px] px-8 py-4 uppercase transition-transform duration-150 hover:scale-[1.02] active:scale-100"
      style={{
        background: "var(--mm-accent)",
        color: "var(--mm-text-on-accent)",
        fontFamily: "var(--mm-font-display)",
        fontWeight: 700,
        fontSize: "19px",
        letterSpacing: "0.02em",
        lineHeight: 1.2,
      }}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ background: "var(--mm-text-on-accent)" }}
      />
      {children}
    </a>
  );
}

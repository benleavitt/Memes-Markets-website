"use client";

/**
 * The one primary CTA on the homepage. There is deliberately only ever one.
 *
 * Contrast note, load-bearing: white on the brand red (#FF0000) is 4.0:1, which
 * is short of the 4.5:1 WCAG AA needs for normal text. Rather than dull the brand
 * red, the label is set at 19px/700 — that clears the 18.66px bold threshold for
 * "large text", where the requirement drops to 3:1. Do not shrink this label
 * without also switching the fill to --mm-accent-deep (#C40000, 5.7:1).
 */
import { track } from "@/lib/analytics";

export function LiveCta({
  href = "https://www.youtube.com/@MemesandMarketsPod/live",
  children = "Watch live now",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => track("cta_watch_live")}
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

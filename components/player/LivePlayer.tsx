"use client";

import { useLiveStatus } from "@/lib/use-live-status";
import { useEffect, useState } from "react";

const DISMISS_KEY = "mm-player-dismissed";
const TWITCH_CHANNEL = "memesandmarkets";

/**
 * The floating live player. Pinned bottom-left, survives navigation.
 *
 * ONLY EXISTS WHILE THE SHOW IS ON AIR. It used to render an offline face too —
 * a countdown to the next slot and a Subscribe button — which meant a permanent
 * card sitting over the bottom-left corner of every page for the ~99% of the
 * week when nothing is broadcasting. The schedule it carried is still on the
 * page: "Live Tuesdays & Thursdays" sits under the wordmark. What is gone is the
 * card that claimed the corner to say nothing is happening.
 *
 * That makes going live the only thing that can make this appear, which is the
 * point — it is now a signal rather than furniture.
 *
 * It is mounted in the ROOT LAYOUT, outside {children}. That is the entire reason
 * this project is on the App Router: moving Home <-> About swaps the page slot
 * and never unmounts this component, so a playing stream keeps playing. The
 * Playwright spec in e2e/player.spec.ts is what stops that quietly regressing.
 *
 *   <body>
 *     {children}      <- swaps on navigation
 *     <LivePlayer/>   <- does not
 *   </body>
 *
 * Note that the early return below is INSIDE this component rather than around
 * it in the layout. Hoisting it would defeat the whole arrangement: the layout
 * would then mount and unmount the player as the status changed, and a stream
 * would restart from scratch every time.
 *
 * Autoplay policy means the embed can only start muted. The mute toggle is the
 * user gesture that unmutes it, which is why it is a real control and not decor.
 */
export function LivePlayer() {
  const status = useLiveStatus();
  const [dismissed, setDismissed] = useState(true); // assume hidden until we've read storage
  const [muted, setMuted] = useState(true);

  // sessionStorage, not localStorage: dismissing means "not this visit", not
  // "never again". A returning viewer should see that the show is live.
  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed || !status.live) return null;

  return (
    <aside
      aria-label="Live now"
      data-testid="live-player"
      data-live="true"
      className="fixed bottom-6 left-6 z-40 hidden w-[340px] overflow-hidden rounded-[16px] sm:block"
      style={{
        background: "var(--mm-surface)",
        border: "2px solid var(--mm-accent)",
        boxShadow: "0 0 28px rgb(255 0 0 / 35%), 0 16px 40px -10px rgb(0 0 0 / 60%)",
      }}
    >
      <div
        className="flex items-center gap-2 py-2.5 pr-2.5 pl-3.5"
        style={{ background: "var(--mm-surface-raised)" }}
      >
        <span className="type-mono-label grow" style={{ color: "var(--mm-text)" }}>
          M&amp;M / Live now
        </span>

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          aria-label={muted ? "Unmute stream" : "Mute stream"}
          className="grid size-7 place-items-center rounded-[6px]"
          style={{ color: muted ? "var(--mm-text-3)" : "var(--mm-text)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3 9v6h4l5 4V5L7 9H3z" />
            {muted ? (
              <path d="M22.5 9.9 21.1 8.5l-2.6 2.6-2.6-2.6-1.4 1.4 2.6 2.6-2.6 2.6 1.4 1.4 2.6-2.6 2.6 2.6 1.4-1.4-2.6-2.6z" />
            ) : (
              <path d="M15.5 12a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM13 2.3v2.1a7.5 7.5 0 0 1 0 15.2v2.1a9.6 9.6 0 0 0 0-19.4z" />
            )}
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          aria-label="Dismiss player"
          className="grid size-7 place-items-center rounded-[6px]"
          style={{ color: "var(--mm-text-2)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3.5">
        <div
          className="relative overflow-hidden rounded-[10px]"
          style={{ aspectRatio: "16 / 9", background: "var(--mm-surface-raised)" }}
        >
          <iframe
            key={muted ? "muted" : "unmuted"}
            title="Memes & Markets live stream"
            src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=localhost&parent=memesandmarkets.com&autoplay=true&muted=${muted}`}
            allow="autoplay; fullscreen"
            className="absolute inset-0 size-full border-0"
          />

          <span
            className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1"
            style={{ background: "var(--mm-accent)" }}
          >
            <span className="size-1.5 rounded-full" style={{ background: "#fff" }} />
            <span className="type-label-sm" style={{ color: "var(--mm-text-on-accent)" }}>
              Live
            </span>
          </span>
        </div>

        <div>
          <p className="type-heading-sm" style={{ color: "var(--mm-text)" }}>
            {status.title ?? "Memes & Markets is live"}
          </p>
          <p className="type-body-sm mt-1" style={{ color: "var(--mm-text-2)" }}>
            Memes &amp; Markets
            {status.viewers !== undefined && (
              <span className="type-mono-ticker-sm" style={{ color: "var(--mm-text-3)" }}>
                {" · "}
                {status.viewers.toLocaleString("en-GB")} watching
              </span>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}

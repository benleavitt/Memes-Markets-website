"use client";

import { type LiveStatus, formatSlot, nextSlot } from "@/lib/live";
import { useEffect, useState } from "react";

const DISMISS_KEY = "mm-player-dismissed";
const POLL_MS = 60_000;
const TWITCH_CHANNEL = "memesandmarkets";

/**
 * The persistent floating player. Pinned bottom-left, survives navigation.
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
 * Autoplay policy means the embed can only start muted. The mute toggle is the
 * user gesture that unmutes it, which is why it is a real control and not decor.
 */
export function LivePlayer() {
  // Starts on the offline face rather than null. The countdown is computed
  // locally from the fixed schedule, so it is already true before any network
  // call — there is no reason to render nothing while waiting. It also stops the
  // player being invisible for the first few seconds on a cold server, which was
  // making the E2E flaky for a reason that was really a product flaw.
  const [status, setStatus] = useState<LiveStatus>({ live: false, source: "offline" });
  const [dismissed, setDismissed] = useState(true); // assume hidden until we've read storage
  const [muted, setMuted] = useState(true);
  const [slot, setSlot] = useState<string | null>(null);

  // sessionStorage, not localStorage: dismissing means "not this visit", not
  // "never again". A returning viewer should see that the show is live.
  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    setSlot(formatSlot(nextSlot()));
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/live-status");
        if (!res.ok) return;
        const json = (await res.json()) as LiveStatus;
        if (alive) setStatus(json);
      } catch {
        // Offline face is the safe default; never surface a fetch error here.
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (dismissed) return null;

  const live = status.live;

  return (
    <aside
      aria-label={live ? "Live now" : "Next broadcast"}
      data-testid="live-player"
      data-live={live ? "true" : "false"}
      className="fixed bottom-6 left-6 z-40 hidden w-[340px] overflow-hidden rounded-[16px] sm:block"
      style={{
        background: "var(--mm-surface)",
        border: `${live ? 2 : 1}px solid ${live ? "var(--mm-accent)" : "var(--mm-border-strong)"}`,
        boxShadow: live
          ? "0 0 28px rgb(255 0 0 / 35%), 0 16px 40px -10px rgb(0 0 0 / 60%)"
          : "0 10px 24px -6px rgb(0 0 0 / 45%)",
      }}
    >
      <div
        className="flex items-center gap-2 py-2.5 pr-2.5 pl-3.5"
        style={{ background: "var(--mm-surface-raised)" }}
      >
        <span
          className="type-mono-label grow"
          style={{ color: live ? "var(--mm-text)" : "var(--mm-text-2)" }}
        >
          M&amp;M / {live ? "Live now" : "Off air"}
        </span>

        {live && (
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
        )}

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
          {live ? (
            <iframe
              key={muted ? "muted" : "unmuted"}
              title="Memes & Markets live stream"
              src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=localhost&parent=memesandmarkets.com&autoplay=true&muted=${muted}`}
              allow="autoplay; fullscreen"
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="type-label-sm" style={{ color: "var(--mm-text-2)" }}>
                  Next live
                </p>
                <p
                  className="type-mono-data-lg mt-1"
                  style={{ color: "var(--mm-accent)" }}
                >
                  {slot ?? "—"}
                </p>
              </div>
            </div>
          )}

          {live && (
            <span
              className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1"
              style={{ background: "var(--mm-accent)" }}
            >
              <span className="size-1.5 rounded-full" style={{ background: "#fff" }} />
              <span
                className="type-label-sm"
                style={{ color: "var(--mm-text-on-accent)" }}
              >
                Live
              </span>
            </span>
          )}
        </div>

        <div>
          <p className="type-heading-sm" style={{ color: "var(--mm-text)" }}>
            {live
              ? (status.title ?? "Memes & Markets is live")
              : `Next live ${slot ?? "Tuesday 12PM ET"}`}
          </p>
          <p className="type-body-sm mt-1" style={{ color: "var(--mm-text-2)" }}>
            Memes &amp; Markets
            {live && status.viewers !== undefined && (
              <span className="type-mono-ticker-sm" style={{ color: "var(--mm-text-3)" }}>
                {" · "}
                {status.viewers.toLocaleString("en-GB")} watching
              </span>
            )}
          </p>
        </div>

        {!live && (
          <a
            href="https://www.youtube.com/@MemesandMarketsPod?sub_confirmation=1"
            target="_blank"
            rel="noreferrer noopener"
            className="type-label-lg grid place-items-center rounded-[6px] py-2.5 uppercase"
            style={{ background: "var(--mm-accent)", color: "var(--mm-text-on-accent)" }}
          >
            Set reminder
          </a>
        )}
      </div>
    </aside>
  );
}

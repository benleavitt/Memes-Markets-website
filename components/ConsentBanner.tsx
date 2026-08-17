"use client";

import { setConsent, useConsent } from "@/lib/consent";
import Link from "next/link";

/**
 * The cookie notice. Shown only while the choice is undecided.
 *
 * Deliberately small, bottom-right, and NOT a modal. A full-screen scrim that
 * blocks the page until someone clicks is the pattern that trains people to hit
 * "accept" without reading, which produces consent that is worth nothing to
 * anybody. This can be ignored; the site works untouched behind it.
 *
 * Both buttons are equally weighted for the same reason. A grey "decline" beside
 * a red "accept" is a dark pattern with a legal name — consent has to be freely
 * given, and a choice the design pushes you towards is not that.
 *
 * Bottom-RIGHT, because the live player occupies bottom-left whenever the show
 * is on air, and the one moment this site is busiest is exactly when it is live.
 */
export function ConsentBanner() {
  const consent = useConsent();

  // `null` covers both "server" and "undecided". On the server that means the
  // banner is never in the initial HTML, so there is nothing to mismatch when
  // the client hydrates and discovers a stored choice.
  if (consent !== null) return null;

  return (
    <aside
      aria-label="Cookies"
      className="fixed right-4 bottom-4 z-50 w-[min(380px,calc(100vw-2rem))] rounded-[14px] border p-5"
      style={{
        background: "var(--mm-surface)",
        borderColor: "var(--mm-border-strong)",
        boxShadow: "0 20px 50px -12px rgb(0 0 0 / 70%)",
      }}
    >
      <p className="type-body-sm" style={{ color: "var(--mm-text-2)" }}>
        We would like to use Google Analytics to see which pages people actually read. It
        sets cookies, so only with your agreement. Everything else on the site works
        either way.{" "}
        <Link
          href="/privacy"
          className="underline decoration-[var(--mm-border-strong)] underline-offset-4 transition-colors duration-150 hover:decoration-[var(--mm-accent)]"
          style={{ color: "var(--mm-text)" }}
        >
          Privacy
        </Link>
      </p>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="type-label-lg flex-1 rounded-[10px] border px-4 py-2.5 uppercase transition-colors duration-150 hover:border-[var(--mm-accent)]"
          style={{
            background: "var(--mm-surface-raised)",
            borderColor: "var(--mm-border)",
            color: "var(--mm-text)",
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="type-label-lg flex-1 rounded-[10px] border px-4 py-2.5 uppercase transition-colors duration-150 hover:border-[var(--mm-accent)]"
          style={{
            background: "var(--mm-surface-raised)",
            borderColor: "var(--mm-border)",
            color: "var(--mm-text)",
          }}
        >
          Decline
        </button>
      </div>
    </aside>
  );
}

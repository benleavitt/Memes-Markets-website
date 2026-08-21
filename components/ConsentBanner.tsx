"use client";

import { openConsentSettings, setConsent, useConsent } from "@/lib/consent";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * The cookie notice. Shown only while the choice is undecided.
 *
 * A full-width bar along the bottom, and NOT a modal. A full-screen scrim that
 * blocks the page until someone clicks is the pattern that trains people to hit
 * "accept" without reading, which produces consent that is worth nothing to
 * anybody. This can be ignored; the site works untouched behind it.
 *
 * REJECT AND ACCEPT ARE THE SAME BUTTON, in size, colour and weight. That is a
 * legal requirement rather than a taste: consent has to be freely given, and a
 * design that makes one answer louder than the other is not asking a question.
 * "Cookie settings" is quieter than both because it is a detour, not an answer.
 *
 * THE BAR PUBLISHES ITS OWN HEIGHT as --mm-consent-bar-h. The live player is
 * fixed to bottom-left and a full-width bar would sit straight on top of it —
 * and a first visit during a live show is exactly when both are on screen. The
 * player reads that variable and lifts itself clear. Measured rather than
 * hard-coded because this copy wraps to two lines on a narrow window and three
 * on a phone.
 */
export function ConsentBanner() {
  const consent = useConsent();
  const ref = useRef<HTMLElement>(null);

  const undecided = consent === null;

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!undecided || !el) {
      root.style.removeProperty("--mm-consent-bar-h");
      return;
    }

    const observer = new ResizeObserver(() => {
      root.style.setProperty(
        "--mm-consent-bar-h",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--mm-consent-bar-h");
    };
  }, [undecided]);

  // `null` covers both "server" and "undecided". On the server that means the
  // banner is never in the initial HTML, so there is nothing to mismatch when
  // the client hydrates and discovers a stored choice.
  if (!undecided) return null;

  return (
    <aside
      ref={ref}
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t"
      style={{
        background: "var(--mm-surface)",
        borderColor: "var(--mm-border-strong)",
        boxShadow: "0 -20px 50px -12px rgb(0 0 0 / 70%)",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="lg:max-w-[62ch]">
          <h2 className="type-heading-sm" style={{ color: "var(--mm-text)" }}>
            About cookies on this site
          </h2>
          <p className="type-body-sm mt-2" style={{ color: "var(--mm-text-2)" }}>
            We use cookies to count visits and see which pages people actually read.
            Nothing else on the site depends on them. Read our{" "}
            <Link href="/privacy" className={LINK} style={{ color: "var(--mm-text)" }}>
              Privacy Policy
            </Link>
            , choose what you allow in{" "}
            <button type="button" onClick={openConsentSettings} className={LINK}>
              Cookie settings
            </button>
            , or accept everything. You can change your preferences at any time.
          </p>
        </div>

        {/* Reversed on mobile so the two real answers sit under the thumb and the
            detour is last, without changing the reading order for a screen
            reader — which is what `flex-col-reverse` over source order buys. */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <button
            type="button"
            onClick={openConsentSettings}
            className="type-label-lg cursor-pointer px-2 py-2.5 uppercase underline decoration-[var(--mm-border-strong)] underline-offset-4 transition-colors duration-150 hover:decoration-[var(--mm-accent)]"
            style={{ color: "var(--mm-text-2)" }}
          >
            Cookie settings
          </button>
          <ConsentAction onClick={() => setConsent("denied")}>Reject all</ConsentAction>
          <ConsentAction onClick={() => setConsent("granted")}>Accept all</ConsentAction>
        </div>
      </div>
    </aside>
  );
}

const LINK =
  "cursor-pointer underline decoration-[var(--mm-border-strong)] underline-offset-4 transition-colors duration-150 hover:decoration-[var(--mm-accent)]";

/**
 * One button, used for both answers. Sharing the component is the cheapest way
 * to keep the promise in the header comment true: the two cannot drift apart
 * visually without someone deliberately taking them apart.
 */
export function ConsentAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="type-label-lg cursor-pointer rounded-[10px] border px-6 py-2.5 uppercase transition-colors duration-150 hover:border-[var(--mm-accent)] sm:min-w-[132px]"
      style={{
        background: "var(--mm-surface-raised)",
        borderColor: "var(--mm-border)",
        color: "var(--mm-text)",
      }}
    >
      {children}
    </button>
  );
}

"use client";

import { track } from "@/lib/analytics";
import { useCallback, useEffect, useRef } from "react";

/**
 * The hero's single primary CTA, and the panel it opens.
 *
 * Built on native <dialog> + showModal(). That buys the things a hand-rolled
 * overlay gets wrong: focus moves into the panel and returns to the button on
 * close, Escape closes it, the rest of the page goes inert to assistive tech, and
 * it renders in the top layer so no z-index on the orbit can climb over it.
 *
 * The panel content arrives as `children` from the server page rather than being
 * imported here. This component is the only part that needs "use client", so the
 * panel's markup, host photos and press slots stay out of the client bundle.
 *
 * Contrast note, load-bearing: white on the brand red (#FF0000) is 4.0:1, short
 * of the 4.5:1 AA needs for normal text. The label is set at 19px/700, which
 * clears the 18.66px bold threshold for "large text" where the bar drops to 3:1.
 * Do not shrink this label without switching the fill to --mm-accent-deep
 * (#C40000, 5.7:1).
 */
export function MoreInfo({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  // showModal() makes the page inert, but the document behind the dialog still
  // scrolls on wheel. Lock it while the panel is up, and release on `close` so
  // Escape and the backdrop unlock it too, not just the X button.
  const open = useCallback(() => {
    track("cta_more_info");
    document.documentElement.style.overflow = "hidden";
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const unlock = () => {
      document.documentElement.style.overflow = "";
    };
    el.addEventListener("close", unlock);
    return () => {
      el.removeEventListener("close", unlock);
      unlock();
    };
  }, []);

  // Click on the backdrop closes. The event target is the dialog itself only when
  // the pointer landed outside the panel, so compare against its box rather than
  // trusting the target — a click on padding inside the panel also reports the
  // dialog as the target.
  const onClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target !== e.currentTarget) return;
    const box = e.currentTarget.getBoundingClientRect();
    const inside =
      e.clientX >= box.left &&
      e.clientX <= box.right &&
      e.clientY >= box.top &&
      e.clientY <= box.bottom;
    if (!inside) e.currentTarget.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="mm-cta inline-flex items-center gap-3 rounded-[10px] px-8 py-4 uppercase transition-transform duration-150 hover:scale-[1.02] active:scale-100"
      >
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ background: "var(--mm-text-on-accent)" }}
        />
        More info
      </button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled natively
          by <dialog>; this listener only adds click-outside-to-close. */}
      <dialog
        ref={ref}
        className="mm-panel"
        aria-labelledby="info-title"
        onClick={onClick}
      >
        <div className="mm-panel-head">
          <h2 id="info-title" className="type-mono-label uppercase">
            Memes &amp; Markets
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="mm-panel-close"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M5 5 19 19M19 5 5 19" />
            </svg>
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}

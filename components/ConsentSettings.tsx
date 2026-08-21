"use client";

import { ConsentAction } from "@/components/ConsentBanner";
import {
  closeConsentSettings,
  setConsent,
  useConsent,
  useConsentSettingsOpen,
} from "@/lib/consent";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

/**
 * The categories dialog, opened from the banner or from the footer link.
 *
 * TWO CATEGORIES, BECAUSE THE SITE HAS TWO. Every consent panel of this shape
 * on the web offers four or five — marketing, personalisation, functional — and
 * this site sets none of them: components/Analytics.tsx hard-denies ad_storage,
 * ad_user_data and ad_personalization and nothing ever flips them. Padding the
 * list out to look thorough would be inventing disclosures for tracking that
 * does not happen, which is the same lie as an invented episode number.
 *
 * Unlike the banner this one IS a modal, and the distinction is the point. The
 * banner interrupts you, so it must not trap you. This was asked for, so a scrim
 * and a focus trap are the correct behaviour rather than a dark pattern.
 */
export function ConsentSettings() {
  const open = useConsentSettingsOpen();
  const consent = useConsent();

  if (!open) return null;
  return <Dialog consent={consent} />;
}

/**
 * Split out so the draft state below is created fresh each time the dialog
 * opens. Held in the parent it would keep a toggle from a previous visit to the
 * panel, and show it to someone whose stored choice had since changed.
 *
 * A NATIVE <dialog>, driven by showModal(). The first version of this hand-rolled
 * the modal parts on a div — a focus trap, an Escape listener, and restoring
 * focus to whatever opened it. The platform does all three, correctly, including
 * the cases the hand-rolled trap got wrong: shadow roots, iframes, and the
 * browser's own find-in-page. Everything below is the part the platform does not
 * do.
 */
function Dialog({ consent }: { consent: "granted" | "denied" | null }) {
  const [analytics, setAnalytics] = useState(consent === "granted");
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    // Guarded: React runs effects twice in development, and showModal() throws
    // InvalidStateError on a dialog that is already open.
    if (el && !el.open) el.showModal();

    // NO close() ON CLEANUP, deliberately. React removing the element drops it
    // from the top layer by itself, and close() here would fire onClose below —
    // which closes the store, which unmounts this — so the pair became a loop
    // that shut the dialog in the same tick it opened. That is what the second
    // development pass turned from a latent bug into a dead panel.
  }, []);

  const choose = (value: "granted" | "denied") => {
    setConsent(value);
    closeConsentSettings();
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard path is Escape, handled natively and reported through onClose; a keydown handler here would be a second, worse copy of it.
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Fires for Escape as well as close(), so the store never drifts out of
      // step with what is actually on screen.
      onClose={closeConsentSettings}
      // Click on the backdrop. A native dialog's ::backdrop reports the dialog
      // itself as the target, so this is the whole check.
      //
      onClick={(e) => {
        if (e.target === ref.current) closeConsentSettings();
      }}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-[560px] overflow-y-auto rounded-[16px] border p-6 backdrop:bg-black/70"
      style={{
        background: "var(--mm-surface)",
        borderColor: "var(--mm-border-strong)",
        boxShadow: "0 20px 60px -12px rgb(0 0 0 / 80%)",
        color: "var(--mm-text)",
      }}
    >
      <h2 id={titleId} className="type-heading-sm" style={{ color: "var(--mm-text)" }}>
        Cookie settings
      </h2>
      <p className="type-body-sm mt-2" style={{ color: "var(--mm-text-2)" }}>
        What each category does, and what happens if you turn it off. The{" "}
        <Link
          href="/privacy"
          className="underline decoration-[var(--mm-border-strong)] underline-offset-4 hover:decoration-[var(--mm-accent)]"
          style={{ color: "var(--mm-text)" }}
        >
          Privacy Policy
        </Link>{" "}
        has the long version.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Category
          name="Strictly necessary"
          detail="Remembers the choice you make here, and whether you closed the live player. No cookies — both are stored in your browser and never sent anywhere."
          checked
          locked
        />
        <Category
          name="Analytics"
          detail="Google Analytics, to count visits and see which pages get read. Turned off, it still loads but sets no cookies and no identifier that could follow you between visits."
          checked={analytics}
          onChange={setAnalytics}
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ConsentAction onClick={() => choose("denied")}>Reject all</ConsentAction>
        <ConsentAction onClick={() => choose(analytics ? "granted" : "denied")}>
          Save choices
        </ConsentAction>
        <ConsentAction onClick={() => choose("granted")}>Accept all</ConsentAction>
      </div>
    </dialog>
  );
}

function Category({
  name,
  detail,
  checked,
  locked,
  onChange,
}: {
  name: string;
  detail: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 rounded-[12px] border p-4"
      style={{ background: "var(--mm-surface-raised)", borderColor: "var(--mm-border)" }}
    >
      <div>
        <p className="type-label-lg uppercase" style={{ color: "var(--mm-text)" }}>
          {name}
        </p>
        <p className="type-body-sm mt-1.5" style={{ color: "var(--mm-text-2)" }}>
          {detail}
        </p>
      </div>

      {locked ? (
        // Not a disabled switch: a control you can reach but cannot move is
        // worse than a label saying it does not move. Screen readers get the
        // same sentence sighted users do.
        <span
          className="type-mono-ticker-sm shrink-0 uppercase"
          style={{ color: "var(--mm-text-3)" }}
        >
          Always on
        </span>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={name}
          onClick={() => onChange?.(!checked)}
          className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-150"
          style={{
            // accent-deep, not accent: white-on-accent is 4.0:1 and this sits
            // next to small text. The deep tone is the one that carries.
            background: checked ? "var(--mm-accent-deep)" : "var(--mm-surface)",
            borderColor: checked ? "var(--mm-accent-deep)" : "var(--mm-border-strong)",
          }}
        >
          <span
            aria-hidden="true"
            className="absolute top-1/2 block h-4 w-4 -translate-y-1/2 rounded-full transition-[left] duration-150"
            style={{
              left: checked ? "calc(100% - 1.25rem)" : "0.25rem",
              background: "var(--mm-text)",
            }}
          />
        </button>
      )}
    </div>
  );
}

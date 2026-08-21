"use client";

import { openConsentSettings } from "@/lib/consent";

/**
 * The footer's "Cookies" link. A button, not a Link — there is no page to go to,
 * it opens the dialog in components/ConsentSettings.tsx.
 *
 * This is what makes the banner's closing promise true. "You can change your
 * preferences at any time" is a claim about the site, and without a way back in
 * it would be a false one: the banner never returns once a choice is stored.
 *
 * Styled as the sibling of Privacy and Terms because it belongs to the same set
 * — things you go looking for deliberately — and the footer already argues for
 * why those are quiet text links rather than buttons.
 */
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className="type-mono-ticker-sm cursor-pointer uppercase underline decoration-[var(--mm-border-strong)] underline-offset-4 transition-colors duration-150 hover:text-[var(--mm-text-2)] hover:decoration-[var(--mm-accent)]"
      style={{ color: "var(--mm-text-3)" }}
    >
      Cookies
    </button>
  );
}

"use client";

import { CONSENT_KEY } from "@/lib/consent-key";
import { useSyncExternalStore } from "react";

/**
 * Whether the visitor has agreed to analytics cookies.
 *
 * localStorage, not sessionStorage — unlike the player's dismissal, which means
 * "not this visit", a consent decision is meant to last. Re-asking someone who
 * already said no every time they come back is both annoying and, in spirit,
 * not really taking no for an answer.
 *
 * Three states, and the third one matters: `null` is UNDECIDED, which is not the
 * same as denied. Denied means the visitor was asked and said no; undecided
 * means the banner is still up. Collapsing them would make the banner reappear
 * forever for anyone who declined.
 */

const KEY = CONSENT_KEY;

export type Consent = "granted" | "denied" | null;

let snapshot: Consent = null;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): Consent {
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Safari in private mode, and anyone who has blocked storage outright.
    // Treated as undecided: the banner shows, and a choice simply will not stick.
    return null;
  }
}

function emit() {
  for (const l of listeners) l();
}

export function setConsent(value: Exclude<Consent, null>) {
  snapshot = value;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // See read(). The choice still applies for this page view.
  }
  // Tell Google. gtag is defined by the bootstrap in components/Analytics.tsx,
  // which runs beforeInteractive, so it exists by the time anyone can click.
  window.gtag?.("consent", "update", {
    analytics_storage: value === "granted" ? "granted" : "denied",
  });
  emit();
}

function subscribe(listener: () => void): () => void {
  // The first subscriber is also the first moment localStorage is readable —
  // this module is imported by client components, but its top level still runs
  // during SSR, where `localStorage` does not exist.
  if (!hydrated) {
    hydrated = true;
    snapshot = read();
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => snapshot;
/**
 * Always undecided on the server. The banner renders nothing until it has read
 * real storage, which is what keeps the server and client markup identical —
 * guessing "granted" here would flash a banner at people who already declined.
 */
const getServerSnapshot = (): Consent => null;

export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Whether the categories dialog is open.
 *
 * A second tiny store rather than React state in a provider, because the dialog
 * is opened from two places that share no ancestor: the banner, and the footer
 * link that sits on every page. Threading a context through the root layout for
 * one boolean would cost more than it saves.
 *
 * Not persisted. Which categories you chose is worth remembering; whether the
 * panel happened to be open when you closed the tab is not.
 */
let settingsOpen = false;
const settingsListeners = new Set<() => void>();

function emitSettings() {
  for (const l of settingsListeners) l();
}

export function openConsentSettings() {
  settingsOpen = true;
  emitSettings();
}

export function closeConsentSettings() {
  settingsOpen = false;
  emitSettings();
}

function subscribeSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

export function useConsentSettingsOpen(): boolean {
  // Closed on the server, so the dialog is never in the initial HTML.
  return useSyncExternalStore(
    subscribeSettings,
    () => settingsOpen,
    () => false,
  );
}

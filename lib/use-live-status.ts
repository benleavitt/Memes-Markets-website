"use client";

import type { LiveStatus } from "@/lib/live";
import { useSyncExternalStore } from "react";

/**
 * "Is the show on air?", shared by every component that asks.
 *
 * Two things now depend on the answer — the floating player and the Watch live
 * CTA — and both are hidden entirely when the show is off air. If each ran its
 * own polling effect they would double the calls to /api/live-status for an
 * answer that is identical, and they could briefly disagree: one polls, the
 * other has not yet, and for a moment the page shows a player with no CTA.
 *
 * So the poll lives here, once, at module scope. Components subscribe through
 * useSyncExternalStore and all read the same snapshot, so they appear and
 * disappear in the same frame no matter how many of them there are.
 *
 * The interval only runs while something is subscribed. Every subscriber
 * unmounting stops it, which matters because the CTA lives inside a <dialog>
 * that spends most of its life closed.
 */

const POLL_MS = 60_000;

/**
 * Off air is the safe default and the server snapshot. It is what renders before
 * the first fetch answers, which means both consumers start hidden and appear
 * once the show is confirmed live — never the other way round. A CTA that
 * flashes on and then vanishes would be worse than one that arrives a moment
 * late.
 */
const OFFLINE: LiveStatus = { live: false, source: "offline" };

let snapshot: LiveStatus = OFFLINE;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function emit() {
  for (const l of listeners) l();
}

async function poll() {
  try {
    const res = await fetch("/api/live-status");
    if (!res.ok) return;
    const next = (await res.json()) as LiveStatus;
    // Reference equality is what useSyncExternalStore compares, so only replace
    // the snapshot when something actually changed. Otherwise every poll would
    // re-render both consumers once a minute for no reason.
    if (
      next.live === snapshot.live &&
      next.title === snapshot.title &&
      next.viewers === snapshot.viewers &&
      next.source === snapshot.source
    ) {
      return;
    }
    snapshot = next;
    emit();
  } catch {
    // Keep the last known answer. A failed poll is not evidence of going off air,
    // and blanking the player on one dropped request would flicker.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    poll();
    timer = setInterval(poll, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => OFFLINE;

export function useLiveStatus(): LiveStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

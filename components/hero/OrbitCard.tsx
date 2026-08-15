"use client";

import type { Episode } from "@/lib/episodes";
import Image from "next/image";
import { useState } from "react";

/**
 * One episode on the orbit belt.
 *
 * A real <a>, not a canvas draw. That is the whole reason the sphere is built
 * from DOM: each card is crawlable, focusable, and reads as
 * "<title>, published <date>, link" to a screen reader. A WebGL sphere would
 * need all twelve duplicated into hidden markup to achieve the same thing.
 *
 * Radii are concentric: 24 outer, 16 inner, 8 padding. 24 - 8 = 16, so the
 * curves stay parallel. Mismatched nesting is why nested rounded rectangles
 * usually look subtly wrong.
 *
 * maxresdefault is not generated for every upload, so a 404 swaps to hqdefault
 * rather than leaving a hole in the belt.
 */
export function OrbitCard({
  episode,
  priority,
}: { episode: Episode; priority: boolean }) {
  const [src, setSrc] = useState(episode.thumbnail);

  return (
    <a
      href={episode.url}
      target="_blank"
      rel="noreferrer noopener"
      data-analytics="episode_open"
      data-analytics-id={episode.id}
      data-analytics-surface="orbit"
      // Without this, dragging the belt from on top of a card starts a native
      // link/image drag instead, and the belt stops following the pointer.
      draggable={false}
      className="mm-orbit-card group block w-[210px] rounded-[24px] border p-2 no-underline"
      style={{
        background: "var(--mm-surface)",
        borderColor: "var(--mm-border)",
        boxShadow: "0 10px 24px -6px rgb(0 0 0 / 45%)",
      }}
    >
      <span className="relative block overflow-hidden rounded-[16px]">
        <Image
          src={src}
          onError={() => setSrc(episode.thumbnailFallback)}
          alt=""
          width={194}
          height={109}
          sizes="210px"
          priority={priority}
          draggable={false}
          className="block h-auto w-full"
          style={{ background: "var(--mm-surface-raised)" }}
        />
        <span
          aria-hidden="true"
          className="absolute right-2 bottom-2 grid size-[30px] place-items-center rounded-full border transition-colors duration-150 group-hover:border-transparent group-hover:bg-[var(--mm-accent)]"
          style={{ background: "var(--mm-base)", borderColor: "var(--mm-border-strong)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="11"
            height="11"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 3.5 20.5 12 6 20.5z" />
          </svg>
        </span>
      </span>

      <span className="mt-[11px] block px-1 pb-[3px]">
        <span className="type-label-lg block" style={{ color: "var(--mm-text)" }}>
          {episode.title}
        </span>
        {/* --mm-text-2, not --mm-text-3. The card's ground is --mm-surface, where
            tertiary grey measures 4.44:1 — under the 4.5:1 AA needs for 12px text.
            (On --mm-base it is 4.76:1, which is why the contrast pass missed it.)
            The date still reads as secondary to a white title without it. */}
        <span
          className="type-mono-ticker-sm mt-[5px] block uppercase"
          style={{ color: "var(--mm-text-2)" }}
        >
          {formatDate(episode.published)}
        </span>
      </span>
    </a>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { PLATFORMS } from "@/content/platforms";

/**
 * "Find M&M" — one pill holding every platform the show is on.
 *
 * Each button is a real link with the platform name and handle as its accessible
 * name, so a screen reader hears "YouTube, @MemesandMarketsPod, link" rather than
 * seven unlabelled graphics.
 *
 * Sizing is load-bearing on small screens. Seven 52px buttons plus the label do
 * not fit 390px, and the overflow pushed the whole page into horizontal scroll.
 * Below `sm` the label and divider drop out and the buttons go to 40px:
 *   7 x 40 + 6 x 6 gaps + 16 padding = 332px, inside the 342px content width.
 *
 * The bevel is a 1px lit edge along the top inside face, which is what makes the
 * squares read as raised rather than as flat outlines.
 */
export function PlatformBar() {
  return (
    <nav
      aria-label="Where to find Memes & Markets"
      className="flex max-w-full items-center gap-1.5 rounded-full border px-2 py-[10px] sm:gap-2 sm:pr-[10px] sm:pl-5"
      style={{ background: "var(--mm-surface)", borderColor: "var(--mm-border)" }}
    >
      <span
        className="type-mono-label hidden select-none sm:inline"
        style={{ color: "var(--mm-text-2)" }}
        aria-hidden="true"
      >
        Find M&amp;M
      </span>
      <span
        className="hidden h-[26px] w-px shrink-0 sm:block"
        style={{ background: "var(--mm-border)" }}
        aria-hidden="true"
      />
      <ul className="flex items-center gap-1.5 sm:gap-2">
        {PLATFORMS.map((p) => (
          <li key={p.id}>
            <a
              href={p.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${p.label} — ${p.handle}`}
              data-analytics="platform_click"
              data-analytics-platform={p.id}
              data-analytics-surface="hero"
              className="group relative grid size-10 place-items-center rounded-[10px] border transition-colors duration-150 hover:border-[var(--mm-accent)] hover:text-[var(--mm-text)] sm:size-[52px]"
              style={{
                background: "var(--mm-surface-raised)",
                borderColor: "var(--mm-border)",
                color: "var(--mm-text-2)",
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1.5 top-px h-px opacity-90 transition-colors duration-150 group-hover:bg-[var(--mm-accent)] sm:inset-x-[7px]"
                style={{ background: "var(--mm-border-strong)" }}
              />
              <PlatformIcon id={p.id} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

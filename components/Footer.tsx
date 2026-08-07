import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { DISCLAIMER, HIGHLIGHTS, HOSTS, PLATFORMS, SCHEDULE } from "@/content/platforms";
import Image from "next/image";
import Link from "next/link";

/**
 * Lives in the root layout, so it renders on every page and the disclaimer can
 * never go missing from one of them. That line is a legal requirement, not copy.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t" style={{ borderColor: "var(--mm-border)" }}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pt-16 pb-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {/* The master in Assets/ is a 4267px square that is mostly transparent
                padding — at 44px the mark rendered ~19px wide and read as missing.
                public/brand/mm-logo.png is cropped to the ink bounds, hence 522x640. */}
            <Image
              src="/brand/mm-logo.png"
              alt=""
              width={522}
              height={640}
              className="h-11 w-auto shrink-0"
            />
            <div>
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--mm-font-display)",
                  fontWeight: 900,
                  fontSize: "22px",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                Memes &amp; Markets
              </p>
              <p className="type-body-sm mt-1" style={{ color: "var(--mm-text-2)" }}>
                {HOSTS} · {SCHEDULE}
              </p>
            </div>
          </div>

          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link className="type-label-lg uppercase hover:underline" href="/about">
              About
            </Link>
            <a
              className="type-label-lg uppercase hover:underline"
              style={{ color: "var(--mm-text-2)" }}
              href={HIGHLIGHTS.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {HIGHLIGHTS.handle}
            </a>
          </nav>

          <ul className="flex flex-wrap items-center gap-2">
            {PLATFORMS.map((p) => (
              <li key={p.id}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${p.label} — ${p.handle}`}
                  className="grid size-10 place-items-center rounded-[10px] border transition-colors duration-150 hover:border-[var(--mm-accent)] hover:text-[var(--mm-text)] sm:size-11"
                  style={{
                    background: "var(--mm-surface-raised)",
                    borderColor: "var(--mm-border)",
                    color: "var(--mm-text-2)",
                  }}
                >
                  <PlatformIcon id={p.id} size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <hr style={{ borderColor: "var(--mm-border)" }} />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="type-body-sm" style={{ color: "var(--mm-text-2)" }}>
            {DISCLAIMER}
          </p>
          <p
            className="type-mono-ticker-sm uppercase whitespace-nowrap"
            style={{ color: "var(--mm-text-3)" }}
          >
            © {new Date().getFullYear()} Memes &amp; Markets
          </p>
        </div>
      </div>
    </footer>
  );
}

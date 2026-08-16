import Image from "next/image";
import Link from "next/link";

/**
 * The way back to the homepage, for the pages that are not it.
 *
 * DELIBERATELY NOT A NAV BAR. The structural rule for this site is that there
 * isn't one — the wordmark is the header (see CLAUDE.md, and the note at the top
 * of hero/Wordmark.tsx). On the homepage the wordmark does that job at full
 * bleed. On /about and /partner there was nothing at all: the About page's own
 * h1 reads "Memes & Markets" but it is a page title, not a control, and /partner
 * did not even have that. Anyone arriving on a subpage from a pasted link was
 * stuck, unless they thought to scroll past the whole page to the footer.
 *
 * So this is the same wordmark, shrunk, and made clickable. It keeps the rule
 * rather than breaking it: the header is still the mark, and the mark now goes
 * home, which is where a logo in the top-left has gone on every website for
 * twenty-five years.
 *
 * Not rendered on the homepage — a second, smaller wordmark directly above the
 * full-bleed one would read as a mistake.
 */
export function SiteHeader() {
  return (
    <header className="mx-auto w-full max-w-[1200px] px-6 pt-8">
      <Link
        href="/"
        // The accessible name says where it goes. "Memes & Markets" alone would
        // announce as the brand and leave a screen reader user guessing whether
        // it is a link home or a link to the podcast.
        aria-label="Memes & Markets — back to the homepage"
        className="group inline-flex items-center gap-3 no-underline"
      >
        {/* Decorative: the wordmark beside it already carries the name, so a
            second announcement of it would just repeat. */}
        <Image
          src="/brand/mm-logo.png"
          alt=""
          width={522}
          height={640}
          className="h-8 w-auto shrink-0"
        />
        <span
          className="mm-wordmark uppercase transition-colors duration-150"
          style={{
            color: "var(--mm-text)",
            fontWeight: 900,
            fontSize: "19px",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          Memes &amp; Markets
        </span>
        {/* The affordance. A left-pointing chevron and the word "Home" would say
            it louder, but this is the brand lockup — the arrow is enough once it
            is beside a mark that visibly responds to a pointer, and it keeps the
            top of the page from turning into chrome. */}
        <span
          aria-hidden="true"
          className="type-mono-label transition-colors duration-150 group-hover:text-[var(--mm-accent)]"
          style={{ color: "var(--mm-text-3)" }}
        >
          ← Home
        </span>
      </Link>
    </header>
  );
}

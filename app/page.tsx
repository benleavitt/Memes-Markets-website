import { OrbitSphere } from "@/components/hero/OrbitSphere";
import { PlatformBar } from "@/components/hero/PlatformBar";
import { Wordmark } from "@/components/hero/Wordmark";
import { LiveCta } from "@/components/ui/LiveCta";
import { POSITIONING, SCHEDULE } from "@/content/platforms";
import { getEpisodes } from "@/lib/episodes";

/**
 * Home. No nav bar — the wordmark is the header (tbpn.com model).
 *
 *   wordmark        full bleed, edge to edge
 *   tagline         two-tone: positioning white, schedule muted
 *   platform bar    one pill, seven platforms
 *   CTA             exactly one
 *   episode list    the plain, always-works route to the episodes. Phase 2
 *                   layers the orbit sphere on top of this, it does not
 *                   replace it — a canvas is invisible to a screen reader.
 */
export default async function Home() {
  const episodes = await getEpisodes(12);

  return (
    <main id="main">
      <section className="flex flex-col items-center pt-16 pb-24">
        <Wordmark />

        {/* Two-tone, one line on desktop. On mobile it breaks between the two
            halves rather than mid-phrase, which is why the separator is its own
            element that only shows once both fit on a line. */}
        <p className="type-heading-lg mt-7 flex flex-col items-center gap-1 px-6 text-center text-balance sm:flex-row sm:justify-center sm:gap-3">
          <span style={{ color: "var(--mm-text)" }}>{POSITIONING}</span>
          <span
            aria-hidden="true"
            className="hidden sm:inline"
            style={{ color: "var(--mm-text-3)" }}
          >
            ·
          </span>
          <span style={{ color: "var(--mm-text-2)" }}>{SCHEDULE}</span>
        </p>

        <div className="mt-10 px-6">
          <PlatformBar />
        </div>

        <div className="mt-12 px-6">
          <LiveCta />
        </div>

        <div className="mt-10 w-full">
          <OrbitSphere episodes={episodes} />
        </div>

        <p
          className="type-mono-label mt-2 flex items-center gap-2.5"
          style={{ color: "var(--mm-text-2)" }}
        >
          Drag to spin
          <span
            aria-hidden="true"
            className="size-[5px] rounded-full"
            style={{ background: "var(--mm-accent)" }}
          />
          <span style={{ color: "var(--mm-text-3)" }}>{episodes.length} episodes</span>
          <span className="sr-only">
            , or focus an episode and use the left and right arrow keys to turn the
            carousel. Every episode is also listed below.
          </span>
        </p>
      </section>

      <section
        aria-labelledby="episodes-heading"
        className="mx-auto w-full max-w-[1200px] px-6 pb-24"
      >
        <h2
          id="episodes-heading"
          className="type-mono-label"
          style={{ color: "var(--mm-accent)" }}
        >
          Latest episodes
        </h2>
        <ul className="mt-8 grid gap-px" style={{ background: "var(--mm-border)" }}>
          {episodes.map((e) => (
            <li key={e.id} style={{ background: "var(--mm-base)" }}>
              <a
                href={e.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex flex-col gap-1 py-5 transition-colors duration-150 hover:bg-[var(--mm-surface)] sm:flex-row sm:items-baseline sm:gap-6"
              >
                <time
                  dateTime={e.published}
                  className="type-mono-ticker-sm shrink-0 uppercase sm:w-28"
                  style={{ color: "var(--mm-text-3)" }}
                >
                  {formatDate(e.published)}
                </time>
                <span className="type-heading-sm" style={{ color: "var(--mm-text)" }}>
                  {e.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
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

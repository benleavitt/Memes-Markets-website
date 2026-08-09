import { OrbitSphere } from "@/components/hero/OrbitSphere";
import { PlatformBar } from "@/components/hero/PlatformBar";
import { Wordmark } from "@/components/hero/Wordmark";
import { InfoPanelContent } from "@/components/info/InfoPanelContent";
import { MoreInfo } from "@/components/info/MoreInfo";
import { POSITIONING, SCHEDULE } from "@/content/platforms";
import { getEpisodes } from "@/lib/episodes";
import { JsonLd, podcastSeriesSchema } from "@/lib/schema";

/**
 * Home. No nav bar — the wordmark is the header (tbpn.com model).
 *
 *   wordmark        full bleed, edge to edge
 *   tagline         two-tone: positioning white, schedule muted
 *   platform bar    one pill, seven platforms
 *   CTA             exactly one — More info, which opens the panel
 *   orbit           twelve episodes on the belt
 *
 * The plain episode list that used to sit below the orbit is gone. The a11y
 * argument it existed for still holds, but the orbit already satisfies it: every
 * card is a real <a> with the title and date in the markup, not a canvas draw.
 * See the note at the top of OrbitCard.
 *
 * InfoPanelContent is passed as children rather than imported by MoreInfo, so the
 * panel's markup renders on the server and only the dialog shell ships as JS.
 */
export default async function Home() {
  const episodes = await getEpisodes(12);

  return (
    <main id="main">
      <JsonLd data={podcastSeriesSchema(episodes)} />
      <section className="flex flex-col items-center pt-8 pb-16">
        <Wordmark />

        {/* Two-tone, one line on desktop. On mobile it breaks between the two
            halves rather than mid-phrase, which is why the separator is its own
            element that only shows once both fit on a line. */}
        <p className="type-heading-lg mm-hero-tagline mt-4 flex flex-col items-center gap-1 px-6 text-center text-balance sm:flex-row sm:justify-center sm:gap-3">
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

        <div className="mt-6 px-6">
          <PlatformBar />
        </div>

        <div className="mt-7 px-6">
          <MoreInfo>
            <InfoPanelContent />
          </MoreInfo>
        </div>

        <div className="mt-5 w-full">
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
            carousel. Every episode is a link with its title and publication date.
          </span>
        </p>
      </section>
    </main>
  );
}

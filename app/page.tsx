import { NewsletterPosts } from "@/components/NewsletterPosts";
import { OrbitSphere } from "@/components/hero/OrbitSphere";
import { PlatformBar } from "@/components/hero/PlatformBar";
import { SocialProof } from "@/components/hero/SocialProof";
import { Wordmark } from "@/components/hero/Wordmark";
import { InfoPanelContent } from "@/components/info/InfoPanelContent";
import { MoreInfo } from "@/components/info/MoreInfo";
import { POSITIONING, SCHEDULE } from "@/content/platforms";
import { getEpisodes } from "@/lib/episodes";
import { getRecentPosts } from "@/lib/newsletter-posts";
import { ORBIT } from "@/lib/orbit";
import { JsonLd, podcastSeriesSchema } from "@/lib/schema";
import { getChannelStats } from "@/lib/stats";
import type { Metadata } from "next";

/**
 * The homepage's canonical, stated absolutely.
 *
 * app/layout.tsx sets `canonical: "./"` so every route declares itself, which is
 * right for /about, /partner, /privacy and /terms and WRONG here. Next resolves
 * the relative form against the route's internal name, and the root route's is
 * `/index` — so the homepage shipped `<link rel="canonical" href=".../index">`,
 * and `/index` answers 200 with the same page. The most important URL on the site
 * was pointing its ranking signals at an address nothing links to.
 *
 * A literal "/" resolves against metadataBase instead of the route, which fixes
 * both halves: `/` claims itself, and `/index` now also points at `/` rather than
 * at itself, so the duplicate consolidates the right way.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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
  // ORBIT.COUNT rather than a literal 12: it is what the belt is drawn around,
  // and lib/orbit.test.ts checks it against the CSS the hero actually renders from.
  // Both are on the same hourly ISR window, so they are one round of work rather
  // than two — and neither can fail the render: each falls back to committed data.
  const [episodes, stats, posts] = await Promise.all([
    getEpisodes(ORBIT.COUNT),
    getChannelStats(),
    getRecentPosts(),
  ]);

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

        {/* The caption used to carry a red dot and an episode count as well. Both
            are gone: the count restated something the orbit is already showing,
            and the dot was there to separate it from the instruction. What is
            left is the one thing a visitor cannot work out by looking. */}
        <p className="type-mono-label mt-2" style={{ color: "var(--mm-text-2)" }}>
          Drag to spin
          <span className="sr-only">
            , or focus an episode and use the left and right arrow keys to turn the
            carousel. Every episode is a link with its title and publication date.
          </span>
        </p>
      </section>

      {/* BELOW the globe, not above it. It sat above the orbit for a while on the
          argument that the audience should be the first thing a visitor
          registers — but that put a row of statistics between the one CTA and
          the sphere the hero is built around, and the hero stopped reading as a
          hero. The numbers land better once the show has introduced itself. */}
      <SocialProof stats={stats} />

      {/* Renders nothing unless the newsletter is actually running — see
          FRESH_DAYS in lib/posts.ts. */}
      <NewsletterPosts posts={posts} />
    </main>
  );
}

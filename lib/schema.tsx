import { HOSTS, POSITIONING, SCHEDULE } from "@/content/platforms";
import type { Episode } from "@/lib/episodes";
import { siteUrl } from "@/lib/site";

/**
 * JSON-LD. Google has a first-class understanding of PodcastSeries, and this is
 * how the show gets to appear as a podcast rather than as a generic web page.
 *
 * Everything here is derived from real data. `numberOfEpisodes` is deliberately
 * absent rather than guessed: the RSS feed returns the most recent 15, so we
 * genuinely do not know the total from this source, and a wrong count in
 * structured data is worse than no count.
 */

export function podcastSeriesSchema(episodes: Episode[]) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: "Memes & Markets",
    alternateName: "M&M",
    url: siteUrl(),
    description: `${POSITIONING}. ${SCHEDULE}.`,
    inLanguage: "en",
    webFeed:
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCpDHJbeyWBab2qr6y2d6_yQ",
    author: HOSTS.split(" & ").map((name) => ({ "@type": "Person", name })),
    sameAs: [
      "https://www.youtube.com/@MemesandMarketsPod",
      "https://www.twitch.tv/memesandmarkets",
      "https://x.com/Memesandmkts",
      "https://www.instagram.com/memesandmkts",
      "https://open.spotify.com/show/1GSfFx3sQoG2bYAbIYUocN",
      "https://podcasts.apple.com/us/podcast/memes-and-markets/id1840280923",
    ],
    hasPart: episodes.map((e) => ({
      "@type": "PodcastEpisode",
      name: e.title,
      url: e.url,
      datePublished: e.published,
      image: e.thumbnail,
      partOfSeries: { "@type": "PodcastSeries", name: "Memes & Markets", url: siteUrl() },
    })),
  };
}

export function aboutSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${siteUrl()}/about`,
    name: "About Memes & Markets",
    mainEntity: {
      "@type": "PodcastSeries",
      name: "Memes & Markets",
      url: siteUrl(),
      author: HOSTS.split(" & ").map((name) => ({ "@type": "Person", name })),
    },
  };
}

/**
 * Rendered with dangerouslySetInnerHTML because JSON-LD must reach the DOM as a
 * raw script body; JSX would escape the quotes and Google would see nothing.
 * The input is our own structured data, never user input.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must reach the DOM as a raw script body; the payload is our own typed data, and < is escaped below.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { AUDIENCE } from "@/content/social";
import { type ChannelStats, compact } from "@/lib/stats";

/**
 * The audience, one signal per platform.
 *
 * IT SAYS WHAT EACH NUMBER IS. The first version printed "36K INSTAGRAM", which
 * is not social proof — it is a number and a logo, and the reader has to guess
 * whether it means followers, posts, views or something else. Every cell now
 * names the metric, so the row reads as a set of claims rather than a set of
 * figures.
 *
 * EVERY PLATFORM CELL COUNTS FOLLOWERS. There is a real case for showing
 * TikTok's likes instead — it distributes by interest rather than by follower
 * graph, so 5,059 followers understates an account whose videos have earned
 * 60.4K likes — and this file argued for it until the show said otherwise. One
 * row of six reads better when every cell counts the same thing, and a reader
 * comparing "60.4K likes" against "36K followers" is doing conversion work
 * nobody asked them for. content/social.ts keeps the likes figure and the
 * argument, so neither has to be reconstructed.
 *
 * WHERE THEY COME FROM. Subscribers, views and episode count are read live from
 * the YouTube Data API on hourly ISR. The other three are typed into
 * content/social.ts by a person, because none of those platforms publishes a
 * figure that can be fetched. A `value: null` renders nothing at all.
 *
 * BELOW THE GLOBE. It spent a while above the orbit, on the argument that the
 * audience should be the first thing a visitor registers. That was true and
 * still cost more than it bought: a row of statistics between the one CTA and
 * the sphere the hero is built around, and the hero stopped reading as a hero.
 * It stays one row of small type regardless — the numbers are proof, not the
 * pitch.
 */
export function SocialProof({ stats }: { stats: ChannelStats }) {
  const items = [
    {
      key: "yt-subs",
      icon: "youtube" as const,
      value: compact(stats.subscribers),
      metric: "Subscribers",
      platform: "YouTube",
    },
    {
      key: "yt-views",
      icon: "youtube" as const,
      value: compact(stats.views),
      metric: "Total views",
      platform: "YouTube",
    },
    ...AUDIENCE.filter((a): a is typeof a & { value: number } => a.value !== null).map(
      (a) => ({
        key: a.platform,
        icon: a.platform,
        value: compact(a.value),
        metric: a.metric,
        platform: a.platformLabel,
      }),
    ),
    {
      key: "episodes",
      icon: null,
      value: compact(stats.videos),
      metric: "Episodes",
      // The channel opened in September 2025, so this cell is really a cadence
      // claim: a hundred-odd episodes in under a year. "Published" said nothing
      // — the date is what makes the number mean something.
      platform: "Since Sep 2025",
    },
  ];

  return (
    <section
      aria-labelledby="audience-heading"
      className="mx-auto w-full max-w-[1200px] px-6 pt-8"
    >
      {/* A visible heading, not just an aria-label. Without one the row reads as
          decoration a visitor scrolls past; naming it is what makes it land as a
          claim about the show. */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3">
        <h2
          id="audience-heading"
          className="type-mono-label"
          style={{ color: "var(--mm-text)" }}
        >
          The audience
        </h2>
        <p className="type-mono-ticker-sm" style={{ color: "var(--mm-text-3)" }}>
          Across our platforms
        </p>
      </div>

      <ul
        className="grid grid-cols-2 gap-px border sm:[grid-template-columns:repeat(var(--mm-cells),minmax(0,1fr))]"
        style={
          {
            background: "var(--mm-border)",
            borderColor: "var(--mm-border)",
            // Real, rather than a fixed grid-cols-N: the row length follows how
            // many platforms have a number, so an unknown one leaves no hole.
            "--mm-cells": items.length,
          } as React.CSSProperties
        }
      >
        {items.map((item) => (
          <li
            key={item.key}
            className="flex flex-col items-center gap-1 px-3 py-4"
            style={{ background: "var(--mm-base)" }}
          >
            <span
              className="mm-wordmark leading-none"
              style={{
                color: "var(--mm-text)",
                fontWeight: 900,
                fontSize: "clamp(22px, 2.4vw, 32px)",
                letterSpacing: "-0.03em",
              }}
            >
              {item.value}
            </span>

            {/* The metric is the brighter of the two lines: "Followers" is the
                claim, "Instagram" is where it applies. */}
            <span
              className="type-mono-ticker-sm mt-1 text-center uppercase"
              style={{ color: "var(--mm-text)" }}
            >
              {item.metric}
            </span>
            <span
              className="type-mono-ticker-sm flex items-center gap-1.5 text-center"
              style={{ color: "var(--mm-text-3)" }}
            >
              {item.icon && <PlatformIcon id={item.icon} size={11} />}
              {item.platform}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

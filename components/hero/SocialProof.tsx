import { type ChannelStats, compact } from "@/lib/stats";

/**
 * The audience, in three numbers.
 *
 * Sits BELOW the orbit rather than in the hero proper. The fold above is already
 * spoken for — wordmark, tagline, platform bar, the one CTA — and every element
 * added up there pushes the sphere towards the bottom of a laptop screen, which
 * the notes in Wordmark.tsx and globals.css spend a lot of care avoiding. Anyone
 * evaluating the show for a sponsorship scrolls; nobody decides on the strength
 * of a number they saw before the logo.
 *
 * The figures come from lib/stats.ts and are never written by hand. If the API
 * is unreachable this renders the committed fallback, which is real but dated —
 * see the note there. Nothing here invents a number, and nothing rounds up.
 */
export function SocialProof({ stats }: { stats: ChannelStats }) {
  const items = [
    { value: compact(stats.subscribers), label: "Subscribers" },
    { value: compact(stats.views), label: "Views" },
    { value: compact(stats.videos), label: "Episodes" },
  ];

  return (
    <section
      aria-label="Audience"
      className="mx-auto w-full max-w-[1200px] px-6 pt-14 pb-2"
    >
      <ul
        className="grid grid-cols-3 gap-px border"
        style={{ background: "var(--mm-border)", borderColor: "var(--mm-border)" }}
      >
        {items.map((item) => (
          <li
            key={item.label}
            className="flex flex-col items-center gap-2 px-4 py-7 sm:py-9"
            style={{ background: "var(--mm-base)" }}
          >
            {/* Fluid rather than a token step: three numbers side by side on a
                390px screen have about 110px each, and the fixed 40px of
                type-display-md wraps "333K" onto two lines there. */}
            <span
              className="mm-wordmark leading-none"
              style={{
                color: "var(--mm-text)",
                fontWeight: 900,
                fontSize: "clamp(28px, 5.2vw, 52px)",
                letterSpacing: "-0.03em",
              }}
            >
              {item.value}
            </span>
            <span
              className="type-mono-label text-center"
              style={{ color: "var(--mm-text-2)" }}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Says where the numbers are from without turning it into a disclaimer.
          "YouTube" is the honest scope — these are channel figures, not a total
          across seven platforms, and a sponsor reading them should know that. */}
      <p
        className="type-mono-ticker-sm mt-4 text-center"
        style={{ color: "var(--mm-text-3)" }}
      >
        On YouTube, since September 2025
      </p>
    </section>
  );
}

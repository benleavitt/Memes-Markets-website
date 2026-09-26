import { ExternalArrow } from "@/components/ui/ExternalArrow";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { HQ } from "@/content/community";

/**
 * Memes & Markets HQ, the members-only Discord — on Home.
 *
 * BELOW THE AUDIENCE ROW, NOT IN THE HERO. The hero has exactly one CTA and a
 * sphere it is built around, and a paid community pushed in above the fold
 * would be a second pitch competing with the first. Down here it lands as the
 * next step: the row above says how many people follow the show, this says
 * where the ones who want more than following go. "The audience", then "The
 * community".
 *
 * The heading row copies SocialProof's — mono label on the left, a quiet
 * qualifier on the right — so the two sections read as one page, not as a
 * block pasted onto it.
 *
 * A server component, like SocialProof: the click is recorded by
 * AnalyticsDelegate from the data attributes, so none of this ships as JS.
 */
export function JoinHq() {
  return (
    <section
      aria-labelledby="hq-heading"
      className="mx-auto w-full max-w-[1200px] px-6 pt-16 pb-12"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3">
        <h2
          id="hq-heading"
          className="type-mono-label"
          style={{ color: "var(--mm-text)" }}
        >
          The community
        </h2>
        <p
          className="type-mono-ticker-sm flex items-center gap-1.5"
          style={{ color: "var(--mm-text-3)" }}
        >
          <PlatformIcon id="discord" size={12} />
          Members-only Discord
        </p>
      </div>

      <div
        className="mm-hq grid gap-10 rounded-[24px] border p-6 sm:p-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12"
        style={{ borderColor: "var(--mm-border)" }}
      >
        <div className="flex flex-col items-start">
          {/* The product's name, set as a brand mark — it is one. Same face as
              every other place "Memes & Markets" is the mark rather than text. */}
          <p
            // Balanced, so a phone breaks it "Memes & / Markets HQ" rather than
            // leaving "HQ" alone on the second line.
            className="mm-wordmark text-balance uppercase"
            style={{
              color: "var(--mm-text)",
              fontWeight: 900,
              fontSize: "clamp(30px, 3.6vw, 48px)",
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
            }}
          >
            {HQ.name}
          </p>
          <p
            className="type-body-lg mt-5 max-w-[44ch]"
            style={{ color: "var(--mm-text-2)" }}
          >
            {HQ.pitch}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
            <a
              href={HQ.href}
              target="_blank"
              rel="noreferrer noopener"
              data-analytics="cta_join_hq"
              data-analytics-surface="home"
              className="mm-cta-light type-label-lg inline-flex items-center gap-3 rounded-[10px] px-6 py-3.5 uppercase no-underline"
            >
              <PlatformIcon id="discord" size={18} />
              Join the HQ
              <ExternalArrow />
            </a>
            {/* Where the click goes, said before it happens. Nobody should find
                out they have left the site from the address bar of a checkout. */}
            <span className="type-mono-ticker-sm" style={{ color: "var(--mm-text-3)" }}>
              Membership via Whop
            </span>
          </div>

          <p
            className="type-body-sm mt-5 max-w-[52ch]"
            style={{ color: "var(--mm-text-2)" }}
          >
            {HQ.pricing}
          </p>
        </div>

        <div className="flex flex-col">
          <h3
            className="type-mono-label border-b pb-3"
            style={{ color: "var(--mm-text)", borderColor: "var(--mm-border)" }}
          >
            What you get
          </h3>
          {/* One hairline between rows, same construction as the press list in
              the info panel: gap-px over a border-coloured background. */}
          <ul
            className="mt-5 grid gap-px overflow-hidden rounded-[14px] border"
            style={{ background: "var(--mm-border)", borderColor: "var(--mm-border)" }}
          >
            {HQ.perks.map((perk, i) => (
              <li
                key={perk}
                className="flex items-baseline gap-4 px-5 py-4"
                style={{ background: "var(--mm-base)" }}
              >
                <span
                  aria-hidden="true"
                  className="type-mono-ticker-sm shrink-0"
                  style={{ color: "var(--mm-accent)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="type-heading-sm" style={{ color: "var(--mm-text)" }}>
                  {perk}
                </span>
              </li>
            ))}
          </ul>
          {/* The listing's own disclaimer, because this is the one place on the
              site that sells market talk. The footer's line covers the site; this
              covers what is behind the paywall. */}
          <p className="type-mono-ticker-sm mt-4" style={{ color: "var(--mm-text-3)" }}>
            Nothing in the community is financial, tax, or legal advice.
          </p>
        </div>
      </div>
    </section>
  );
}

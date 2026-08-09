import { LiveCta } from "@/components/ui/LiveCta";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { HOST_LIST } from "@/content/hosts";
import { PLATFORMS } from "@/content/platforms";
import { PRESS_SLOTS } from "@/content/press";
import Image from "next/image";

/**
 * Everything inside the More info panel. Split out from the dialog shell so the
 * shell stays about focus, Escape and scroll-lock, and this stays about layout.
 *
 *   studio still   16:9, full width of the panel
 *   hosted by      two cards, real photos
 *   selected press eight slots, all placeholders — see content/press.ts
 *   newsletter     one field
 *   footer row     wordmark and the seven platforms
 *
 * Two columns from `md` up, matching the reference: hosts on the left, press on
 * the right. Below that they stack, because four press rows beside two host cards
 * on a phone is a column of slivers.
 */
export function InfoPanelContent() {
  return (
    <div className="px-5 pb-6 sm:px-8 sm:pb-8">
      <StudioStill />

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-8">
        <section aria-labelledby="info-hosts">
          <PanelHeading id="info-hosts">Hosted by</PanelHeading>
          <ul className="mt-5 grid grid-cols-2 gap-4">
            {HOST_LIST.map((host) => (
              <li key={host.name}>
                {/* 4/3, matching the About page. The source photos are landscape;
                    a portrait crop takes the frame down to foreheads. */}
                <div
                  className="relative overflow-hidden rounded-[14px]"
                  style={{
                    aspectRatio: "4 / 3",
                    background: "var(--mm-surface-raised)",
                  }}
                >
                  <Image
                    src={host.photo}
                    alt={`${host.name}, ${host.role.toLowerCase()} of Memes & Markets`}
                    fill
                    sizes="(min-width: 768px) 220px, 45vw"
                    className="object-cover object-top"
                  />
                </div>
                <p
                  className="type-mono-ticker-sm mt-3 uppercase"
                  style={{ color: "var(--mm-text)" }}
                >
                  {host.name}
                </p>
                <p
                  className="type-mono-ticker-sm mt-1 uppercase"
                  style={{ color: "var(--mm-text-3)" }}
                >
                  {host.role}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="info-press">
          <PanelHeading id="info-press">Selected press</PanelHeading>
          {/* gap-px over a border-coloured background: one hairline between cells,
              never a doubled 2px seam where two borders meet. */}
          <ul
            className="mt-5 grid grid-cols-2 gap-px border"
            style={{ background: "var(--mm-border)", borderColor: "var(--mm-border)" }}
          >
            {PRESS_SLOTS.map((slot) => (
              <li
                key={slot.id}
                className="grid h-[68px] place-items-center px-3"
                style={{ background: "var(--mm-base)" }}
              >
                {slot.logo ? (
                  <Image
                    src={slot.logo}
                    alt={slot.name}
                    width={132}
                    height={28}
                    className="h-auto max-h-7 w-auto"
                  />
                ) : (
                  <span
                    className="type-mono-ticker-sm text-center uppercase"
                    style={{ color: "var(--mm-text-3)" }}
                  >
                    {slot.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="info-newsletter" className="mt-10">
        <div className="grid gap-5 md:grid-cols-2 md:items-center md:gap-8">
          <PanelHeading id="info-newsletter">Get the newsletter</PanelHeading>
          <div>
            <p className="type-body-md" style={{ color: "var(--mm-text-2)" }}>
              What actually moved, twice a week, in the time it takes to finish a coffee.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>

      <div
        className="mt-10 flex flex-col items-start gap-6 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--mm-border)" }}
      >
        <div className="flex flex-wrap items-center gap-5">
          <p className="type-heading-lg uppercase" style={{ letterSpacing: "-0.02em" }}>
            Memes &amp; Markets
          </p>
          {/* The live route did not disappear with the old hero CTA, it moved here. */}
          <LiveCta />
        </div>
        <ul className="flex flex-wrap items-center gap-2">
          {PLATFORMS.map((p) => (
            <li key={p.id}>
              <a
                href={p.href}
                target="_blank"
                rel="noreferrer noopener"
                data-analytics="platform_click"
                data-analytics-platform={p.id}
                data-analytics-surface="info_panel"
                aria-label={`${p.label}, ${p.handle}`}
                className="grid size-9 place-items-center rounded-[8px] border transition-colors duration-150 hover:border-transparent hover:bg-[var(--mm-accent)]"
                style={{
                  background: "var(--mm-surface)",
                  borderColor: "var(--mm-border)",
                  color: "var(--mm-text)",
                }}
              >
                <PlatformIcon id={p.id} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="type-mono-ticker-sm mt-6" style={{ color: "var(--mm-text-3)" }}>
        For education and entertainment only. Not financial, legal, tax, or investment
        advice.
      </p>
    </div>
  );
}

function PanelHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="type-mono-label border-b pb-3 uppercase"
      style={{ color: "var(--mm-text)", borderColor: "var(--mm-border)" }}
    >
      {children}
    </h3>
  );
}

/**
 * Placeholder for the studio still. Drawn rather than shipped as an image file so
 * it is unmistakably a placeholder — a stock photo here would quietly become the
 * final asset. Replace the whole component with an <Image> when the real frame
 * exists.
 */
function StudioStill() {
  return (
    <div
      className="relative mx-auto grid w-full place-items-center overflow-hidden rounded-[16px] border"
      style={{
        aspectRatio: "16 / 9",
        // Capped so the still does not eat the whole panel on a short viewport —
        // the hosts and press rows should be reachable without scrolling first.
        // Constrains the WIDTH, not the height: capping height against a fixed
        // aspect-ratio just stretches the box wider than 16:9.
        maxWidth: "calc(42vh * 16 / 9)",
        borderColor: "var(--mm-border)",
        background:
          "repeating-linear-gradient(45deg, var(--mm-surface) 0 12px, var(--mm-surface-raised) 12px 24px)",
      }}
    >
      <p
        className="type-mono-ticker-sm px-6 text-center uppercase"
        style={{ color: "var(--mm-text-3)" }}
      >
        Studio still — 16:9 placeholder
      </p>
    </div>
  );
}

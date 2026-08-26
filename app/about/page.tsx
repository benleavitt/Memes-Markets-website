import { SiteHeader } from "@/components/SiteHeader";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { DEVELOPER } from "@/content/credits";
import { HOST_LIST } from "@/content/hosts";
import { HOSTS, PLATFORMS, POSITIONING, SCHEDULE } from "@/content/platforms";
import { JsonLd, aboutSchema } from "@/lib/schema";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description: `${POSITIONING}. Hosted by ${HOSTS}.`,
};

/**
 * About.
 *
 *   hero        who the show is, in one line
 *   hosted by   two cards, real photos
 *   as heard on the distribution row, deliberately low contrast
 *
 * The footer comes from the root layout, so the legal disclaimer is on this page
 * without this file having to remember it.
 */
export default function About() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1200px] px-6 pt-16 pb-24">
        <JsonLd data={aboutSchema()} />
        <section>
          <p className="type-mono-label" style={{ color: "var(--mm-accent)" }}>
            About
          </p>
          <h1 className="type-display-lg mm-wordmark mt-4 max-w-[18ch] text-balance">
            Memes &amp; Markets
          </h1>
          <p
            className="type-body-lg mt-6 max-w-[62ch]"
            style={{ color: "var(--mm-text-2)" }}
          >
            {POSITIONING}. {SCHEDULE}, live and unedited, hosted by {HOSTS}.
          </p>
        </section>

        <section aria-labelledby="hosts-heading" className="mt-24">
          <h2
            id="hosts-heading"
            className="type-mono-label"
            style={{ color: "var(--mm-accent)" }}
          >
            Hosted by
          </h2>
          {/* items-start, so each card ends where its own bio ends.
              A CSS grid stretches every item to the tallest row by default, and
              the bios are not the same length — Ben's runs four paragraphs
              against Keith's three. Back when Ben's ran six that left 369px of
              empty card under Keith, which does not read as whitespace; it reads
              as content that failed to load. The gap is much smaller now, but
              ragged bottoms are still the honest shape for two biographies of
              different lengths, and the next rewrite may widen it again. */}
          <ul className="mt-8 grid items-start gap-6 md:grid-cols-2">
            {HOST_LIST.map((host, i) => (
              <li
                key={host.name}
                className="overflow-hidden rounded-[24px] border p-2"
                style={{
                  background: "var(--mm-surface)",
                  borderColor: "var(--mm-border)",
                }}
              >
                {/* Concentric radii again: 24 outer minus 8 padding = 16 inner. */}
                <div
                  className="relative overflow-hidden rounded-[16px]"
                  style={{ aspectRatio: "4 / 3", background: "var(--mm-surface-raised)" }}
                >
                  <Image
                    src={host.photo}
                    alt={`${host.name}, ${host.role.toLowerCase()} of Memes & Markets`}
                    fill
                    sizes="(min-width: 768px) 580px, 100vw"
                    // The first host photo is the LCP element on this page. Without
                    // priority Next lazy-loads it and the largest paint waits on a
                    // request it could have started in the document head.
                    priority={i === 0}
                    className="object-cover object-top"
                  />
                </div>
                <div className="px-3 pt-5 pb-3">
                  <h3 className="type-heading-lg">{host.name}</h3>
                  <p
                    className="type-mono-ticker-sm mt-1 uppercase"
                    style={{ color: "var(--mm-accent)" }}
                  >
                    {host.role}
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    {host.bio.map((para) => (
                      <p
                        key={para}
                        className="type-body-md"
                        style={{ color: "var(--mm-text-2)" }}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                  {host.links && host.links.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-4">
                      {host.links.map((l) => (
                        <li key={l.href}>
                          <a
                            className="type-label-lg uppercase hover:underline"
                            href={l.href}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="heard-heading" className="mt-24">
          <h2
            id="heard-heading"
            className="type-mono-label"
            style={{ color: "var(--mm-text-3)" }}
          >
            As heard on
          </h2>
          <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-5">
            {PLATFORMS.map((p) => (
              <li key={p.id}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${p.label} — ${p.handle}`}
                  className="flex items-center gap-2.5 opacity-55 transition-opacity duration-150 hover:opacity-100"
                  style={{ color: "var(--mm-text-2)" }}
                >
                  <PlatformIcon id={p.id} size={20} />
                  <span className="type-heading-sm">{p.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* The same credit as the footer, given the room this page has for it.
            Last, and in the same low-contrast register as "As heard on" above:
            this is the show's page about the show, and a developer credit that
            competed with the hosts for attention would be reading the room
            wrong. The link still goes straight to the contact section. */}
        <section aria-labelledby="credits-heading" className="mt-24">
          <h2
            id="credits-heading"
            className="type-mono-label"
            style={{ color: "var(--mm-text-3)" }}
          >
            Site credits
          </h2>
          <p
            className="type-body-lg mt-6 max-w-[62ch]"
            style={{ color: "var(--mm-text-2)" }}
          >
            Designed and built by{" "}
            <a
              href={DEVELOPER.href}
              target="_blank"
              rel="author noreferrer noopener"
              className="underline decoration-[var(--mm-border-strong)] underline-offset-4 transition-colors duration-150 hover:decoration-[var(--mm-accent)]"
              style={{ color: "var(--mm-text)" }}
            >
              {DEVELOPER.name}
            </a>
            . The link goes straight to his contact page.
          </p>
        </section>
      </main>
    </>
  );
}

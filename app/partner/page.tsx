import { SiteHeader } from "@/components/SiteHeader";
import { PartnerForm } from "@/components/ui/PartnerForm";
import { CONTACT_EMAIL, HOSTS, POSITIONING, SCHEDULE } from "@/content/platforms";
import { getChannelStats } from "@/lib/stats";
import { compact } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner with the show",
  description: `Sponsorship, partnership and collaboration enquiries for Memes & Markets. ${POSITIONING}. Hosted by ${HOSTS}.`,
};

/**
 * Where sponsorship and collaboration enquiries land.
 *
 * A page of its own rather than a section in the More info panel. The panel is a
 * modal a visitor opens to browse; this is a destination someone arrives at with
 * intent, often from a link pasted into an email, and it needs its own URL to be
 * pasteable at all.
 *
 * The numbers are repeated at the top on purpose. Everything else on the site
 * addresses an audience; this page addresses a buyer, and a buyer's first
 * question is the size of the audience. Making them scroll back to the homepage
 * for it is the sort of thing that loses an enquiry.
 */
export default async function Partner() {
  const stats = await getChannelStats();

  // No lifetime view total — see the note in components/hero/SocialProof.tsx.
  // It came out of both places at once on purpose: a buyer who sees a number on
  // the landing page and not on the page they were sent to reads it as the show
  // quietly dropping the figure that got worse.
  const facts = [
    { value: compact(stats.subscribers), label: "YouTube subscribers" },
    { value: compact(stats.videos), label: "Episodes" },
    { value: "2x", label: "Live every week" },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[900px] px-6 pt-16 pb-24">
        <p className="type-mono-label" style={{ color: "var(--mm-accent)" }}>
          Partnerships
        </p>
        <h1 className="type-display-lg mm-wordmark mt-4 text-balance">
          Work with the show
        </h1>
        <p
          className="type-body-lg mt-6 max-w-[62ch]"
          style={{ color: "var(--mm-text-2)" }}
        >
          {POSITIONING}. {SCHEDULE}, live and unedited, hosted by {HOSTS}. If you want to
          reach an audience that turns up twice a week to argue about markets, tell us
          what you have in mind.
        </p>

        {/* Column count follows the number of facts rather than a literal 4,
            which is what left a hole here the moment one was removed. Same
            --mm-cells trick as the audience band, and the same odd-count rule
            so the last cell is never stranded in a half-width box on a phone. */}
        <ul
          className="mt-12 grid grid-cols-2 gap-px border [&>li:last-child:nth-child(odd)]:col-span-2 sm:[grid-template-columns:repeat(var(--mm-cells),minmax(0,1fr))] sm:[&>li:last-child:nth-child(odd)]:col-span-1"
          style={
            {
              background: "var(--mm-border)",
              borderColor: "var(--mm-border)",
              "--mm-cells": facts.length,
            } as React.CSSProperties
          }
        >
          {facts.map((fact) => (
            <li
              key={fact.label}
              className="flex flex-col items-center gap-2 px-3 py-6"
              style={{ background: "var(--mm-base)" }}
            >
              <span
                className="mm-wordmark leading-none"
                style={{
                  color: "var(--mm-text)",
                  fontWeight: 900,
                  fontSize: "clamp(24px, 4vw, 36px)",
                  letterSpacing: "-0.03em",
                }}
              >
                {fact.value}
              </span>
              <span
                className="type-mono-ticker-sm text-center uppercase"
                style={{ color: "var(--mm-text-2)" }}
              >
                {fact.label}
              </span>
            </li>
          ))}
        </ul>

        <section aria-labelledby="enquiry-heading" className="mt-16">
          <h2
            id="enquiry-heading"
            className="type-mono-label border-b pb-3"
            style={{ color: "var(--mm-text)", borderColor: "var(--mm-border)" }}
          >
            Send an enquiry
          </h2>
          <div className="mt-8">
            <PartnerForm contactEmail={CONTACT_EMAIL} />
          </div>
        </section>
      </main>
    </>
  );
}

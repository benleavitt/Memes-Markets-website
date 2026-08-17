import { LegalPage, LegalSection } from "@/components/LegalPage";
import { CONTACT_EMAIL, DISCLAIMER, HOSTS } from "@/content/platforms";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms of use for the Memes & Markets website, and what the show is and is not.",
};

/**
 * Like the privacy page: written from what the site does, not from a template,
 * and explicitly not legal advice.
 *
 * The financial-advice section is the one that carries real weight. This is a
 * show about markets, and DISCLAIMER — the sentence CLAUDE.md requires verbatim
 * in every footer — is imported rather than retyped, so the strongest statement
 * on the site cannot drift out of sync with its own terms page.
 */
export default function Terms() {
  return (
    <LegalPage eyebrow="Terms" title="Terms of use" updated="2026-08-17">
      <LegalSection id="t-advice" heading="This is not financial advice">
        <p style={{ color: "var(--mm-text)" }}>{DISCLAIMER}</p>
        <p>
          Everything on this site and in the show is opinion and commentary. The hosts are
          not your financial adviser, broker, accountant or lawyer, and nothing said here
          is a recommendation to buy, sell or hold anything.
        </p>
        <p>
          Markets lose people money. If you act on something you heard on a podcast
          without doing your own work or talking to someone qualified and regulated, that
          decision and its consequences are yours.
        </p>
      </LegalSection>

      <LegalSection id="t-use" heading="Using the site">
        <p>
          Read it, share it, link to it. What you may not do is scrape it at a scale that
          degrades it for other people, try to break into any part of it, or use the forms
          to send anything unlawful or abusive.
        </p>
        <p>
          The two forms are rate-limited, so an automated attempt to hammer either will
          simply be refused.
        </p>
      </LegalSection>

      <LegalSection id="t-content" heading="Who owns what">
        <p>
          The show, its name, its artwork and its episodes belong to {HOSTS}. Quoting or
          embedding an episode with attribution is welcome; republishing it as your own is
          not.
        </p>
        <p>
          Guest appearances, press coverage and anything else linked from here belong to
          whoever made them, and their terms apply on their sites.
        </p>
      </LegalSection>

      <LegalSection id="t-links" heading="Links to other places">
        <p>
          This site links out to YouTube, Twitch, Spotify, Apple Podcasts, Substack, X,
          Instagram and various publications. We do not control any of them and are not
          responsible for what they show you or what they do with your data once you are
          there.
        </p>
      </LegalSection>

      <LegalSection id="t-availability" heading="No promises about uptime">
        <p>
          The site is provided as it is. We try to keep it working and accurate, but we do
          not guarantee it will be available, error-free, or that the episode listings and
          audience figures are correct at any given moment — several of them are pulled
          live from other people&rsquo;s services and are only as good as what those
          services return.
        </p>
      </LegalSection>

      <LegalSection id="t-changes" heading="Changes">
        <p>
          These terms and the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy page
          </Link>{" "}
          may change. The date at the top is when either last did.
        </p>
      </LegalSection>

      <LegalSection id="t-contact" heading="Getting in touch">
        <p>
          Email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-4"
            style={{ color: "var(--mm-text)" }}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p style={{ color: "var(--mm-text-3)" }}>
          These terms describe how the site is meant to be used, in plain language. They
          are not legal advice and have not been reviewed by a lawyer.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

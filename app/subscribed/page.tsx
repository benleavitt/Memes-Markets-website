import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Newsletter",
  // Nothing here is worth indexing, and the URL carries the outcome of a form.
  robots: { index: false, follow: false },
};

/**
 * Where /api/subscribe sends a submission made without JavaScript.
 *
 * With JS the form answers in place and nobody ever sees this page. It exists so
 * the footer signup is not silently broken for anyone whose scripts failed to
 * load — which is also the only state in which the box is reachable at all
 * without JS, since the panel copy lives inside a dialog that needs showModal().
 */

const OUTCOMES = {
  /**
   * "Recorded", not "subscribed". The address is written to a sheet the show
   * controls and imported into Substack in batches — see lib/newsletter.ts for
   * why it cannot go straight there. Promising a subscription that has not
   * happened yet is the failure this page already made once, in the other
   * direction, by describing a confirmation email nobody was ever sent.
   */
  ok: {
    heading: "You're on the list",
    body: "New readers are added to the newsletter before each issue goes out, so you'll get the next one. There is no confirmation email to look for.",
  },
  invalid: {
    heading: "That address did not look right",
    body: "Have another go — it needs to be a full email address.",
  },
  busy: {
    heading: "That is a lot of tries",
    body: "The signup box is rate limited. Give it a few minutes and go again — nothing is wrong with your address.",
  },
  error: {
    heading: "That did not go through",
    body: "The address was not saved, so please try again in a moment.",
  },
  /**
   * A bare visit, with no state at all. Falling through to `error` would tell
   * somebody who submitted nothing that their signup had failed.
   */
  none: {
    heading: "Nothing to report",
    body: "This page shows the result of a newsletter signup. The box is in the footer of every page.",
  },
} as const;

type Outcome = keyof typeof OUTCOMES;

function isOutcome(value: string | undefined): value is Outcome {
  return value !== undefined && Object.hasOwn(OUTCOMES, value);
}

export default async function Subscribed({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  // An unrecognised state is treated as no state: it means someone edited the URL
  // or a link went stale, neither of which is a failed signup.
  const outcome = OUTCOMES[isOutcome(state) ? state : "none"];

  return (
    <main id="main" className="mx-auto w-full max-w-[680px] px-6 pt-24 pb-24">
      <p className="type-mono-label" style={{ color: "var(--mm-accent)" }}>
        Newsletter
      </p>
      <h1 className="type-display-lg mt-4 text-balance">{outcome.heading}</h1>
      <p className="type-body-lg mt-6" style={{ color: "var(--mm-text-2)" }}>
        {outcome.body}
      </p>
      <Link
        href="/"
        className="mm-cta mt-10 inline-flex items-center rounded-[10px] px-8 py-4 uppercase no-underline transition-transform duration-150 hover:scale-[1.02] active:scale-100"
      >
        Back to the show
      </Link>
    </main>
  );
}

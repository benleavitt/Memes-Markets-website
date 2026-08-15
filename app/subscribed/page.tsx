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
   * Two success states, because Substack has two. `ok` is the one this
   * publication actually produces: no double opt-in, so the subscriber is live
   * immediately and no email is sent. `confirm` is what a publication with
   * double opt-in returns. The route picks between them from Substack's own
   * `requires_confirmation` — see lib/newsletter.ts.
   */
  ok: {
    heading: "You're subscribed",
    body: "You'll get the next issue in your inbox. There is no confirmation email to look for.",
  },
  confirm: {
    heading: "Check your inbox",
    body: "Substack has sent a confirmation link. The subscription is not active until you click it.",
  },
  invalid: {
    heading: "That address did not look right",
    body: "Have another go — it needs to be a full email address.",
  },
  error: {
    heading: "That did not go through",
    body: "Substack could not take the signup just now. Nothing was saved, so please try again.",
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
  const outcome = OUTCOMES[isOutcome(state) ? state : "error"];

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

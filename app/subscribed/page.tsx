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
  ok: {
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
  return value === "ok" || value === "invalid" || value === "error";
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

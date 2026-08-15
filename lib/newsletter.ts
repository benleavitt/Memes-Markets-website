/**
 * Substack subscription.
 *
 * The publication is a Substack on a custom domain, so its subscribe endpoint
 * lives at <publication>/api/v1/free — the same call the official embed makes.
 *
 * WHY THIS IS PROXIED THROUGH OUR OWN ROUTE rather than posted from the browser:
 * the endpoint sends no Access-Control-Allow-Origin, so a fetch from the page is
 * blocked outright. The alternatives were a Substack <iframe>, which cannot be
 * styled and drops a third-party frame on the homepage, or a plain form POST
 * straight to Substack, which navigates the visitor off the site. A server route
 * keeps the visitor here and lets the form answer in the brand's own voice.
 *
 * The endpoint is undocumented. It is what every Substack embed on the web calls,
 * so it is unlikely to vanish quietly, but it carries no compatibility promise —
 * if subscriptions ever start failing, `interpret` below is the first place to
 * look, and lib/newsletter.test.ts pins the shapes we currently understand.
 */

/**
 * Override if the publication moves. Note the marketing site and the Substack
 * currently both claim memesandmarkets.com — see the note in the README of this
 * change; whichever wins, this constant is the only thing that needs to know.
 */
export const PUBLICATION =
  process.env.SUBSTACK_PUBLICATION_URL ?? "https://www.memesandmarkets.com";

export const SUBSCRIBE_ENDPOINT = `${PUBLICATION}/api/v1/free`;

export type SubscribeResult =
  /**
   * `requiresConfirmation` mirrors Substack's own `requires_confirmation`, and
   * exists because this site spent its whole life telling people the opposite of
   * the truth. A publication without double opt-in answers a signup with
   * `{"didSignup":true,"requires_confirmation":false,...}` — the subscriber is
   * live that instant and NO email is ever sent. Copy promising "check your
   * inbox for a confirmation link" therefore describes an email that will never
   * arrive, which reads exactly like a broken integration.
   *
   * Substack tells us which flow it used, so the copy follows the flag rather
   * than a guess baked into a string.
   */
  | { ok: true; requiresConfirmation: boolean }
  /** `field` true means the address itself is the problem, so blame the input. */
  | { ok: false; message: string; field: boolean };

/**
 * The email check is deliberately loose: one @, something either side, a dot in
 * the domain. Substack does the real validation — including whether the domain
 * can receive mail — and rejecting locally on a stricter pattern than theirs
 * would turn valid addresses into "invalid email" for no reason. This only exists
 * to avoid a pointless round trip on obvious junk.
 */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Strip anything email-shaped out of a string before it reaches a log.
 *
 * /api/subscribe is deliberate about never logging an address, but the one thing
 * it does log is Substack's own `msg` — third-party text, whose contents are not
 * this codebase's to promise anything about. The observed 400 bodies keep the
 * address in a separate `value` field that `interpret` already drops, so nothing
 * leaks today; this makes that true by construction instead of by observation.
 *
 * Deliberately looser than `looksLikeEmail`: that one decides whether to spend a
 * round trip and should not reject valid addresses, this one decides what reaches
 * a log and should over-match rather than miss one.
 */
export function redactAddresses(text: string): string {
  return text.replace(/[^\s@<>()[\]",;:]+@[^\s@<>()[\]",;:]+/g, "[address]");
}

interface SubstackError {
  msg?: string;
  param?: string;
}

/**
 * Map a Substack response onto something the form can show. Pure and exported so
 * every branch is testable without touching the network.
 */
export function interpret(status: number, body: unknown): SubscribeResult {
  const errors = (body as { errors?: SubstackError[] } | null)?.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    // Substack returns two errors for one bad address ("not a valid email" plus
    // "could not validate your email domain"). Showing both reads as two separate
    // faults, so take the first and treat it as a field-level problem.
    const first = errors[0];
    return {
      ok: false,
      message: first?.msg ?? "That address was not accepted.",
      field: first?.param === "email",
    };
  }

  if (status >= 200 && status < 300) {
    // Strictly `=== true`. A body that never mentions the field, or is not an
    // object at all, means no confirmation step — which is the safer default:
    // it tells the visitor they are subscribed rather than sending them looking
    // for an email that is not coming.
    const flag = (body as { requires_confirmation?: unknown } | null)
      ?.requires_confirmation;
    return { ok: true, requiresConfirmation: flag === true };
  }

  // Reached Substack, but it is unhappy for a reason it did not spell out. Not
  // the visitor's fault, so do not point at the field.
  return {
    ok: false,
    message: "Substack could not take that signup just now. Please try again.",
    field: false,
  };
}

/**
 * Sent so the publication owner can tell this traffic apart from the embed's in
 * Substack's logs, and so the request is not a UA-less POST from a datacentre —
 * which is the shape most likely to be quietly rate-limited. Same reasoning as
 * FEED_UA in lib/feed.ts.
 */
export const SUBSCRIBE_UA = "memesandmarkets.com signup form";

/** POST an address to Substack. Server-side only — see the CORS note above. */
export async function subscribe(email: string): Promise<SubscribeResult> {
  const res = await fetch(SUBSCRIBE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": SUBSCRIBE_UA,
      // The endpoint is the embed's. Sending where the embed would say it came
      // from keeps the request consistent with first_url/current_url below.
      referer: PUBLICATION,
      origin: PUBLICATION,
    },
    body: JSON.stringify({
      email,
      first_url: PUBLICATION,
      first_referrer: "",
      current_url: PUBLICATION,
      current_referrer: "",
      referral_code: "",
      // What the embed sends. Substack uses it for signup attribution.
      source: "embed",
    }),
    cache: "no-store",
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // A non-JSON body is fine as long as the status was a success.
  }
  return interpret(res.status, body);
}

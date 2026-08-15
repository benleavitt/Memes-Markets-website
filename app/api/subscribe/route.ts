import {
  SUBSCRIBE_ENDPOINT,
  looksLikeEmail,
  redactAddresses,
  subscribe,
} from "@/lib/newsletter";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Newsletter signup, proxied to Substack.
 *
 * Exists because Substack's subscribe endpoint sends no CORS headers, so the
 * browser cannot call it directly. See lib/newsletter.ts for the full reasoning.
 *
 * Accepts JSON from the enhanced form, and urlencoded from a plain form POST so
 * the box still works with JavaScript off.
 *
 * This route puts an address into a third-party list, so it is worth being clear
 * about what it does NOT do: it never stores the email, never logs it, and never
 * echoes it back. It is a pass-through to Substack and nothing else.
 *
 * WHAT GUARDS IT, in the order they run:
 *
 *   1. rate limit    per caller, before anything is read. See lib/rate-limit.ts.
 *   2. origin check  a browser on another site cannot post here.
 *   3. size check    content-length, before the body is buffered.
 *   4. honeypot      a field no person can see.
 *   5. shape check   one @, a dot in the domain.
 *
 * The honeypot used to be the whole list, which is thin for an endpoint whose
 * side effect lands in somebody's inbox: a script defeats it by not sending the
 * field, and this publication runs WITHOUT double opt-in — lib/newsletter.test.ts
 * pins `requires_confirmation: false` — so there is no confirmation step standing
 * between a caller and a stranger's address being subscribed.
 */

/** Bounded because Substack will not accept anything near this anyway. */
const MAX_EMAIL = 320;
/**
 * Checked against content-length BEFORE the body is read. The old bound was
 * applied to the parsed email, which is a validation rule and not the memory
 * guard its comment claimed — `await request.json()` has already buffered
 * everything by then. A few hundred bytes of JSON is a generous ceiling for a
 * body containing one address and one honeypot.
 */
const MAX_BODY = 2_048;

/**
 * Ten attempts per ten minutes per caller. A person submitting this form uses one
 * or two, and a few more if they typo; the ceiling sits well above that because a
 * shared office, campus or household address is a single caller here. It is still
 * low enough that bulk signup abuse stops being worth scripting.
 *
 * Raised outside production because e2e/player.spec.ts posts a bad address to
 * this route on every run, and a developer re-running the suite should not be
 * throttled by a guard that test is not about. The limiter itself is covered by
 * lib/rate-limit.test.ts, which does not need a server to exercise it.
 */
const take = createRateLimiter({
  limit: process.env.NODE_ENV === "production" ? 10 : 100,
  windowMs: 10 * 60_000,
});

function json(status: number, body: Record<string, unknown>, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

/**
 * Same-origin only, when the caller tells us where it came from.
 *
 * A missing Origin is allowed through: non-browser clients omit it, and refusing
 * them here would buy nothing a script cannot trivially restore. The rate limit
 * is what covers that case. What this DOES stop is a page on another domain
 * posting the form on a visitor's behalf.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host") ?? new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const wantsHtml = !(request.headers.get("content-type") ?? "").includes(
    "application/json",
  );

  const limit = take(clientKey(request.headers));
  if (!limit.ok) {
    return wantsHtml
      ? redirect(request, "busy")
      : json(
          429,
          {
            ok: false,
            message: "That is a lot of tries. Give it a few minutes and go again.",
            field: false,
          },
          { "retry-after": String(limit.retryAfter) },
        );
  }

  if (!sameOrigin(request)) {
    return json(403, { ok: false, message: "Wrong origin.", field: false });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY) {
    return json(413, { ok: false, message: "That request was too large.", field: false });
  }

  let email = "";
  let honeypot = "";

  try {
    if (!wantsHtml) {
      const body = (await request.json()) as Record<string, unknown>;
      email = String(body.email ?? "");
      honeypot = String(body.company ?? "");
    } else {
      // No-JS submission: the browser navigated here, so it needs somewhere to go.
      const form = await request.formData();
      email = String(form.get("email") ?? "");
      honeypot = String(form.get("company") ?? "");
    }
  } catch {
    return wantsHtml
      ? redirect(request, "error")
      : json(400, { ok: false, message: "Could not read that request." });
  }

  email = email.trim();

  // Honeypot. A real person never fills a field they cannot see, so a bot that
  // fills everything gets a cheerful 200 and goes away rather than learning that
  // the field is what gave it away.
  if (honeypot) {
    return wantsHtml ? redirect(request, "ok") : json(200, { ok: true });
  }

  if (email.length > MAX_EMAIL || !looksLikeEmail(email)) {
    return wantsHtml
      ? redirect(request, "invalid")
      : json(400, {
          ok: false,
          message: "That does not look like an email address.",
          field: true,
        });
  }

  try {
    const result = await subscribe(email);
    // Substack refusing a signup is otherwise completely silent: the visitor sees
    // a sentence under the field and nobody who could fix it ever hears. The
    // message is Substack's own text, so it goes through redactAddresses first —
    // this route is careful never to log an address, and that promise should not
    // depend on what a third party chooses to put in a string.
    if (!result.ok) {
      console.warn(
        `[subscribe] Substack declined a signup (${result.field ? "address" : "other"}): ${redactAddresses(result.message)}`,
      );
    }
    if (wantsHtml) {
      // Keep the no-JS wording honest about whose fault it was: Substack
      // rejecting the address is not the same as Substack being unavailable.
      if (result.ok) {
        return redirect(request, result.requiresConfirmation ? "confirm" : "ok");
      }
      return redirect(request, result.field ? "invalid" : "error");
    }
    return json(result.ok ? 200 : 400, result);
  } catch (err) {
    // Substack unreachable. Not the visitor's fault and not worth a stack trace
    // in their face — but it must not be invisible to us either.
    console.error(
      `[subscribe] could not reach Substack at ${SUBSCRIBE_ENDPOINT}:`,
      err instanceof Error ? err.message : err,
    );
    return wantsHtml
      ? redirect(request, "error")
      : json(502, {
          ok: false,
          message: "Could not reach Substack just now. Please try again.",
          field: false,
        });
  }
}

/**
 * Where a no-JS submission lands. A real page rather than a query param on the
 * homepage: the footer form lives in the root layout, and layouts do not receive
 * searchParams, so there is nowhere on the homepage that could server-render the
 * outcome for someone without JavaScript.
 */
function redirect(request: Request, state: string) {
  const url = new URL(`/subscribed?state=${state}`, request.url);
  // Built by hand rather than with Response.redirect(): that helper returns a
  // response whose headers are guarded immutable, and Next throws
  // "TypeError: immutable" when it then tries to attach its own headers.
  return new Response(null, {
    status: 303,
    headers: { location: url.toString(), "cache-control": "no-store" },
  });
}

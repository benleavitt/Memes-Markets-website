import { SUBSCRIBE_ENDPOINT, looksLikeEmail, subscribe } from "@/lib/newsletter";

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
 */

/** Bounded so a huge body cannot be used to make us hold memory at the edge. */
const MAX_EMAIL = 320;

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  let email = "";
  let honeypot = "";
  let wantsHtml = false;

  try {
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      email = String(body.email ?? "");
      honeypot = String(body.company ?? "");
    } else {
      const form = await request.formData();
      email = String(form.get("email") ?? "");
      honeypot = String(form.get("company") ?? "");
      // No-JS submission: the browser navigated here, so it needs somewhere to go.
      wantsHtml = true;
    }
  } catch {
    return json(400, { ok: false, message: "Could not read that request." });
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
    // address is deliberately not included — see the note at the top of this
    // file — so this says what went wrong, never to whom.
    if (!result.ok) {
      console.warn(`[subscribe] Substack declined a signup: ${result.message}`);
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

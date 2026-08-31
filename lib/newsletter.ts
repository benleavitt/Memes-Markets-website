/**
 * The newsletter: where the publication lives, and where a signup is recorded.
 *
 * THE SIGNUP DOES NOT GO TO SUBSTACK. It cannot: Substack has no supported API
 * for adding a subscriber, and the undocumented endpoint behind its embed now
 * sits behind Cloudflare bot management, which blocks every server-side POST.
 * That was measured rather than assumed — the identical request succeeds from a
 * browser and fails from any server, on any publication, whatever headers are
 * sent, including on a publication with no custom domain at all.
 *
 * So addresses are written to a Google Sheet the show controls and imported into
 * Substack in batches. See `subscribe` below, and scripts/sheet-webhook.gs.
 *
 * PUBLICATION is still needed: the recent-posts strip reads the publication's
 * RSS feed, and the footer links to it.
 */

/**
 * The publication's own Substack address.
 *
 * IT USED TO BE https://www.memesandmarkets.com, AND THAT BROKE THE DAY THE SITE
 * MOVED ONTO THAT DOMAIN. The Substack and the marketing site both claimed it;
 * the site won. Signups then POSTed to our own domain, where /api/v1/free is a
 * 404, and the posts strip fetched /feed and got the same.
 *
 * The subdomain cannot be taken away by a DNS change, so it is the default now.
 * It does not work yet either: the publication still has www.memesandmarkets.com
 * set as an ENFORCED custom domain — Substack's own API reports
 * custom_domain_optional: false — so the subdomain 301s here. Releasing it in
 * Substack > Settings > Domain is a prerequisite for anything below working.
 */
export const PUBLICATION =
  process.env.SUBSTACK_PUBLICATION_URL ?? "https://memesandmarketspod.substack.com";

export type SubscribeResult =
  | { ok: true }
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
 * Did the request end up somewhere that is not the publication?
 *
 * Substack redirects its subdomain to whatever custom domain is configured, and
 * this one's custom domain is now the marketing site — so a feed fetch lands on
 * our own 404. Any substack.com host counts as arrival; being moved around their
 * own estate is their business.
 */
export function redirectedAwayFrom(requested: string, landed: string): boolean {
  let asked: URL;
  let arrived: URL;
  try {
    asked = new URL(requested);
    arrived = new URL(landed);
  } catch {
    return false;
  }
  if (arrived.host === asked.host) return false;
  return !(arrived.host === "substack.com" || arrived.host.endsWith(".substack.com"));
}

/**
 * Record a subscriber.
 *
 * NOT a Substack signup, and the difference matters enough that the copy on the
 * form says so. Substack has no supported API for adding a subscriber, and the
 * undocumented endpoint its embed uses now sits behind Cloudflare bot
 * management, which blocks every server-side POST — measured: the identical
 * request succeeds from a browser and fails from any server, on any publication,
 * whatever headers are sent.
 *
 * The alternatives were an iframe of Substack's own form, which was tried and
 * dropped because a cross-origin frame takes all of the site's design with it,
 * or a browser-side post we could not read the answer to. So the address is
 * written to a sheet we control and imported into Substack in batches. It costs
 * a manual step and buys a form that works, looks like the rest of the site, and
 * does not depend on a third party's bot rules.
 *
 * Deliberately the same webhook and secret as the partnership form: one Apps
 * Script deployment, two tabs, chosen by `list`. See scripts/sheet-webhook.gs.
 */
export async function subscribe(email: string): Promise<SubscribeResult> {
  const webhook = process.env.PARTNER_SHEET_WEBHOOK;
  if (!webhook) {
    // Not configured is a deployment mistake, not a visitor's problem. Loud in
    // the logs, and honest on the page — the alternative is thanking somebody
    // for an address that went nowhere.
    console.error(
      "[subscribe] PARTNER_SHEET_WEBHOOK is not set — the address was NOT recorded.",
    );
    return {
      ok: false,
      field: false,
      message: "The signup box is not accepting addresses right now. Please try later.",
    };
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // The secret travels in the body, not a header: Apps Script drops custom
    // request headers across the 302 it answers with, so a header-based check
    // would reject every genuine write. See scripts/sheet-webhook.gs.
    body: JSON.stringify({
      list: "subscribers",
      email,
      source: "website",
      secret: process.env.PARTNER_SHEET_SECRET ?? "",
      receivedAt: new Date().toISOString(),
    }),
    // Apps Script answers a POST with a 302 to script.googleusercontent.com and
    // the real body is behind it. Without following, every write looks like a
    // failure and the visitor is told to try again on an address that landed.
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`[subscribe] the sheet webhook answered HTTP ${res.status}`);
    return {
      ok: false,
      field: false,
      message: "That did not save. Please try again.",
    };
  }

  return { ok: true };
}

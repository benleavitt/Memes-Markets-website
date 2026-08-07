import { type LiveStatus, cacheSeconds } from "@/lib/live";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Is the show on air?
 *
 * One Twitch Helix call, answered from the edge cache. At 20s inside the
 * broadcast window, ten thousand visitors cost about 180 upstream calls an hour;
 * without the cache they would cost ten thousand.
 *
 * Every failure path returns 200 with `live: false`. The player is chrome on a
 * marketing page — it must never be the reason the page errors, and an outage at
 * Twitch must not read to a visitor as "the site is broken".
 */

let cachedToken: { value: string; expiresAt: number } | null = null;

async function appToken(id: string, secret: string): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000)
    return cachedToken.value;
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

function reply(status: LiveStatus, at: Date) {
  const seconds = cacheSeconds(at);
  return Response.json(status, {
    headers: {
      // max-age=0 is load-bearing. With only s-maxage, the BROWSER caches the
      // response too and keeps showing a stale answer, which defeats the whole
      // point of tightening the window at go-live. max-age=0 forces the client to
      // revalidate every poll while s-maxage still lets the edge absorb the load.
      "cache-control": `public, max-age=0, must-revalidate, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
    },
  });
}

export async function GET() {
  const now = new Date();

  // Demo switch, and the manual override for when Twitch is the thing that is down.
  if (process.env.FORCE_LIVE === "true") {
    return reply({ live: true, source: "forced" }, now);
  }

  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  const login = process.env.TWITCH_USER_LOGIN ?? "memesandmarkets";

  // Not configured yet is a normal state, not an error. Phase 3 ships before the
  // credentials exist; the player shows its offline face and the countdown, which
  // is computed locally and is still true.
  if (!id || !secret) return reply({ live: false, source: "offline" }, now);

  try {
    const token = await appToken(id, secret);
    if (!token) return reply({ live: false, source: "error" }, now);

    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`,
      {
        headers: { "client-id": id, authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return reply({ live: false, source: "error" }, now);

    const json = (await res.json()) as {
      data?: Array<{ title?: string; viewer_count?: number; type?: string }>;
    };
    const stream = json.data?.[0];
    if (!stream || stream.type !== "live") {
      return reply({ live: false, source: "twitch" }, now);
    }
    return reply(
      {
        live: true,
        title: stream.title,
        viewers: stream.viewer_count,
        source: "twitch",
      },
      now,
    );
  } catch {
    return reply({ live: false, source: "error" }, now);
  }
}

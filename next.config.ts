import type { NextConfig } from "next";

/**
 * Response headers live HERE rather than in vercel.json.
 *
 * They used to be in vercel.json, which applies them at Vercel's routing layer —
 * on top of whatever the function already returned. That is how a blanket
 * `cache-control: no-store` on `/api/(.*)` came to sit over the schedule-aware
 * `s-maxage` that app/api/live-status/route.ts computes, cancelling the edge
 * cache the route exists to use. Both API routes set their own cache-control on
 * every path they return, so there is nothing for a platform rule to add.
 *
 * Keeping them in Next also means they apply to `next dev`, so a CSP that breaks
 * the site breaks it locally rather than on the first deploy.
 */
const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * `script-src` carries 'unsafe-inline' rather than a nonce, and that is a
 * deliberate trade rather than an oversight. A nonce has to be minted per
 * request, which means middleware on every route, which makes every page
 * dynamic — and this site is static plus hourly ISR. Paying for that to harden
 * two inline scripts we author ourselves (Next's hydration bootstrap and the
 * JSON-LD in lib/schema.tsx, which already escapes `<`) is the wrong way round.
 *
 * The directives that do the work here are the other ones: `frame-src` pins
 * embedding to Twitch, `connect-src 'self'` means nothing on the page can phone
 * anywhere else, and `form-action 'self'` stops the newsletter form being
 * repointed. Revisit the nonce the day an analytics provider is wired.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is HMR's, and only in dev.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // React writes inline style attributes throughout; Tailwind ships as a file.
  "style-src 'self' 'unsafe-inline'",
  // next/image serves optimised thumbnails from this origin; i.ytimg.com is the
  // unoptimised fallback path, and data:/blob: cover the OG renderer.
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self'",
  // The Twitch player's own requests happen inside the iframe, under its own
  // origin, so they are not governed by this.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src https://player.twitch.tv https://*.twitch.tv",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Same claim as the x-frame-options below, which is kept for old clients.
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const config: NextConfig = {
  reactStrictMode: true,
  // The version is not a secret, but it is not anyone's business either.
  poweredByHeader: false,
  images: {
    // Thumbnails render ~210px wide on the orbit; next/image resizes and
    // converts to AVIF so we never ship a 1280x720 jpeg for a 210px card.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "content-security-policy", value: csp },
          { key: "x-content-type-options", value: "nosniff" },
          { key: "referrer-policy", value: "strict-origin-when-cross-origin" },
          { key: "x-frame-options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default config;

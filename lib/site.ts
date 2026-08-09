/**
 * Where this deployment thinks it lives, and whether it is the real thing.
 *
 * One resolver, because the canonical URL is used by four separate things —
 * metadataBase, OG images, JSON-LD, and the sitemap — and they must never
 * disagree. They previously all hardcoded https://memesandmarkets.com, which is
 * the Substack, not this site.
 *
 * BUYING A DOMAIN LATER is the case this is built for. The order below means a
 * deploy today gets correct absolute URLs on its .vercel.app address with no
 * configuration at all, and the day a domain is pointed at the project the only
 * change is setting NEXT_PUBLIC_SITE_URL in the Production environment.
 *
 *   1. NEXT_PUBLIC_SITE_URL          the custom domain, once there is one
 *   2. VERCEL_PROJECT_PRODUCTION_URL the project's stable production host
 *   3. VERCEL_BRANCH_URL             the branch alias — stable per branch, so
 *                                    staging keeps one address between deploys
 *   4. VERCEL_URL                    this specific deployment
 *   5. localhost
 *
 * VERCEL_BRANCH_URL is preferred over VERCEL_URL on purpose: VERCEL_URL changes
 * on every single push, so a preview that used it would advertise a canonical
 * URL that is stale the moment the next commit lands.
 */

const withProtocol = (host: string) =>
  host.startsWith("http") ? host : `https://${host}`;

/** Vercel's own environment. "development" when running locally. */
export function deployEnv(): "production" | "preview" | "development" {
  const env = process.env.VERCEL_ENV;
  if (env === "production" || env === "preview") return env;
  return "development";
}

/**
 * The live public site, as opposed to staging, a preview, or a laptop. Anything
 * that must only ever happen on the real site — being indexed, most obviously —
 * should ask this rather than checking NODE_ENV, which is "production" for a
 * staging build too.
 */
export function isLiveSite(): boolean {
  return deployEnv() === "production";
}

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return withProtocol(explicit).replace(/\/$/, "");

  // On a production deployment, always claim the project's production host even
  // if this particular deployment has its own URL — otherwise every redeploy
  // publishes a different canonical URL for the same page.
  if (deployEnv() === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return withProtocol(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  const branch = process.env.VERCEL_BRANCH_URL;
  if (branch) return withProtocol(branch);

  const deployment = process.env.VERCEL_URL;
  if (deployment) return withProtocol(deployment);

  return "http://localhost:3000";
}

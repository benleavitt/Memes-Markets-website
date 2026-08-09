import { isLiveSite, siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

/**
 * Keeps staging and preview deployments out of the index.
 *
 * This is the thing that most often goes wrong the moment a project gains a
 * second public environment: staging is a fully working copy of the site on a
 * crawlable URL, so Google indexes it and starts serving it alongside — or
 * instead of — production, splitting the ranking and showing visitors an
 * unreleased build.
 *
 * It checks VERCEL_ENV, not NODE_ENV: a staging build is a *production* Node
 * build, so NODE_ENV is "production" there too and would wave it straight
 * through. See lib/site.ts.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isLiveSite()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

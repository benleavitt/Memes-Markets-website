import { siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

/**
 * Every indexable page. There is no longer a /subscribed landing
 * spot for a form post, carries robots: noindex, and means nothing on its own.
 *
 * Absolute URLs come from siteUrl(), so this follows the custom domain the day
 * one is set rather than needing to be found and edited.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    // Above /about on purpose: this is the page the site most wants found by
    // someone searching for a way to sponsor the show.
    { url: `${base}/partner`, changeFrequency: "monthly", priority: 0.8 },
    // Included but ranked last. Search engines expect a site to have these and
    // note their absence; nobody is searching for them, so they should not
    // compete with the pages that matter.
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

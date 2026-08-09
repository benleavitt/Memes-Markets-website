import { siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

/**
 * The two real pages. /subscribed is deliberately absent — it is the landing
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
  ];
}

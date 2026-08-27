import { Analytics } from "@/components/Analytics";
import { AnalyticsDelegate } from "@/components/AnalyticsDelegate";
import { AnalyticsPageViews } from "@/components/AnalyticsPageViews";
import { ConsentBanner } from "@/components/ConsentBanner";
import { ConsentSettings } from "@/components/ConsentSettings";
import { Footer } from "@/components/Footer";
import { LivePlayer } from "@/components/player/LivePlayer";
import { POSITIONING, SCHEDULE } from "@/content/platforms";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";
import { Archivo, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font at build time: no render-blocking request to Google,
// and no layout shift, which matters because the wordmark's size is derived from
// Raleway's metrics — a fallback face would not reach the page edges.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
// The wordmark, and nothing else. Raleway ships 100-900; 900 is the Heavy cut,
// and it is the only weight anything asks for, so it is the only one downloaded.
const raleway = Raleway({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-raleway",
  display: "swap",
});
// 500 and 600, and nothing else: they are the only mono weights the site renders,
// through .type-mono-ticker-sm and .type-mono-label. The generated type scale also
// defines .type-mono-body (400), .type-mono-data-lg (700) and .type-mono-ticker
// (500), but none of the three has a call site anywhere in the codebase, and
// next/font preloads every weight it is handed — so declaring four meant two font
// files fetched on every page to render nothing. Add a weight back the same day
// something actually asks for it.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Memes & Markets",
    template: "%s — Memes & Markets",
  },
  description: `${POSITIONING}. ${SCHEDULE}, hosted by Keith D and Ben Leavitt.`,
  /**
   * Canonical URL, resolved per route against metadataBase.
   *
   * "./" rather than a literal: Next resolves it to whatever path is being
   * rendered, so every page declares itself canonical without each one having to
   * remember to. A hardcoded absolute URL here would point all five pages at the
   * homepage, which is worse than having no tag at all.
   *
   * IT MATTERS BECAUSE THIS SITE HAS MORE THAN ONE ADDRESS. Production is a
   * *.vercel.app host today and a custom domain later, and lib/site.ts resolves
   * whichever is live at build time. Without a canonical, the same page indexed
   * under two hosts competes with itself and splits its own ranking — the exact
   * problem DEPLOY.md already documents for staging.
   *
   * Query strings drop out, which is what we want: /subscribed?state=ok and
   * ?state=invalid are one page, and it carries robots:noindex anyway.
   */
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "Memes & Markets",
    title: "Memes & Markets",
    description: `${POSITIONING}. ${SCHEDULE}.`,
  },
  // Without this X falls back to a small square summary card, so the 1200x630
  // art that app/opengraph-image.tsx renders never gets shown on the platform
  // the show actually posts to. The image itself is picked up from the OG tags —
  // this only tells X how to frame it.
  twitter: {
    card: "summary_large_image",
    title: "Memes & Markets",
    description: `${POSITIONING}. ${SCHEDULE}.`,
  },
  /**
   * Google Search Console's meta-tag verification, when a token is configured.
   *
   * Next drops the tag entirely when the value is undefined, so an unconfigured
   * site ships no empty verification tag. The DNS TXT route is the alternative
   * and needs nothing here — it also survives a change of host, which this does
   * not, so it is the better option if the domain is under your control.
   */
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
  },
};

/**
 * Root shell.
 *
 *   <body>
 *     backdrop        fixed, never re-renders
 *     {children}      Home or About swaps here
 *     <Footer/>       every page, so the disclaimer cannot go missing
 *     <LivePlayer/>   Phase 3 — mounts OUTSIDE {children} so navigating
 *                     Home <-> About never unmounts the stream
 *     <ConsentBanner/> only with a GA id, and only while the choice is undecided
 *     <ConsentSettings/> the categories dialog, opened from the banner or the
 *                     footer link. Outlives the banner: it is how a decided
 *                     visitor changes their mind.
 *     <AnalyticsPageViews/> reports client-side route changes, which the tag
 *                     itself does not see
 *     <Analytics/>    GA4, and nothing at all without a measurement id
 *   </body>
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read once: the banner and the tag must agree about whether GA exists.
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${raleway.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <div className="mm-backdrop" aria-hidden="true" />
        <a href="#main" className="mm-skip-link">
          Skip to content
        </a>
        {children}
        <Footer />
        <LivePlayer />
        <AnalyticsDelegate />
        {/* BOTH are gated on the measurement id, not just the tag.
            The banner asks a specific question — "may we use Google Analytics" —
            and with no id configured there is no Google Analytics to ask about.
            Showing it anyway would put a false statement in front of every
            visitor and harvest consent for something that does not run, which is
            worse than not asking: a cookie notice on a site that sets no cookies
            is the kind of thing that teaches people to dismiss them all. */}
        {gaId && <ConsentBanner />}
        {/* Not gated on the banner: the whole point of the footer link is that
            it works long after the banner is gone. Still gated on the id, for
            the same reason the banner is — there is nothing to configure. */}
        {gaId && <ConsentSettings />}
        {/* The tag reports the landing page and nothing after it. Every footer
            link is a next/link, so without this the four subpages would look
            almost unvisited. See lib/analytics.ts. */}
        {gaId && <AnalyticsPageViews />}
        <Analytics gaId={gaId} />
      </body>
    </html>
  );
}

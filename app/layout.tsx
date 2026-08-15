import { AnalyticsDelegate } from "@/components/AnalyticsDelegate";
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
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  openGraph: {
    type: "website",
    siteName: "Memes & Markets",
    title: "Memes & Markets",
    description: `${POSITIONING}. ${SCHEDULE}.`,
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
 *   </body>
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      </body>
    </html>
  );
}

import { Footer } from "@/components/Footer";
import { POSITIONING, SCHEDULE } from "@/content/platforms";
import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font at build time: no render-blocking request to Google,
// and no layout shift, which matters because the wordmark's size is derived from
// Archivo's metrics — a fallback face would not reach the page edges.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://memesandmarkets.com"),
  title: {
    default: "Memes & Markets — Web3's live podcast",
    template: "%s — Memes & Markets",
  },
  description: `${POSITIONING}. ${SCHEDULE}, hosted by Keith D and Ben Leavitt.`,
  openGraph: {
    type: "website",
    siteName: "Memes & Markets",
    title: "Memes & Markets — Web3's live podcast",
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
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <div className="mm-backdrop" aria-hidden="true" />
        <a href="#main" className="mm-skip-link">
          Skip to content
        </a>
        {children}
        <Footer />
        {/* <LivePlayer /> — Phase 3 */}
      </body>
    </html>
  );
}

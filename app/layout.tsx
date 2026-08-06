import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memes & Markets",
  description:
    "Where culture, tech & financial markets intersect. Live Tuesdays & Thursdays.",
};

/**
 * Root shell. The live player will mount here in Phase 3 — outside {children},
 * so a Home <-> About navigation never unmounts it and the stream keeps playing.
 * That is the whole reason this project is on the App Router.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mm-backdrop" aria-hidden="true" />
        {children}
        {/* <LivePlayer /> — Phase 3 */}
      </body>
    </html>
  );
}

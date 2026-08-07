import { HOSTS, POSITIONING, SCHEDULE } from "@/content/platforms";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: `${POSITIONING}. Hosted by ${HOSTS}.`,
};

/**
 * Stub. Phase 4 builds this out — studio hero, host cards with per-host social
 * rows, "as heard on", newsletter capture.
 *
 * It exists now rather than in Phase 4 because the footer links here from every
 * page, and shipping Phase 1 with a link to a 404 is worse than shipping a thin
 * page. It also gives Phase 3's load-bearing E2E ("player survives Home → About")
 * a second route to navigate to.
 */
export default function About() {
  return (
    <main id="main" className="mx-auto w-full max-w-[1200px] px-6 pt-24 pb-24">
      <h1 className="type-display-lg text-balance">About the show</h1>
      <p className="type-body-lg mt-6 max-w-[62ch]" style={{ color: "var(--mm-text-2)" }}>
        {POSITIONING}. {SCHEDULE}, hosted by {HOSTS}.
      </p>
    </main>
  );
}

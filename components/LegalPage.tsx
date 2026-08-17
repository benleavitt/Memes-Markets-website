import { SiteHeader } from "@/components/SiteHeader";

/**
 * Shell for /privacy and /terms.
 *
 * Narrower than the rest of the site — 68 characters rather than the About
 * page's full width. These are the only pages here anyone reads a paragraph at a
 * time, and a legal document set at 1200px is one people scan and give up on.
 */
export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  /** ISO date. Rendered, and used as the <time> value. */
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[720px] px-6 pt-16 pb-24">
        <p className="type-mono-label" style={{ color: "var(--mm-accent)" }}>
          {eyebrow}
        </p>
        <h1 className="type-display-md mm-wordmark mt-4 text-balance">{title}</h1>
        <p
          className="type-mono-ticker-sm mt-4 uppercase"
          style={{ color: "var(--mm-text-3)" }}
        >
          Last updated{" "}
          <time dateTime={updated}>
            {new Date(updated).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </time>
        </p>

        <div className="mt-12 flex flex-col gap-10">{children}</div>
      </main>
    </>
  );
}

/** One numbered-feeling block. No numbers: nothing here cross-references. */
export function LegalSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="type-mono-label border-b pb-3"
        style={{ color: "var(--mm-text)", borderColor: "var(--mm-border)" }}
      >
        {heading}
      </h2>
      <div
        className="type-body-md mt-5 flex flex-col gap-4"
        style={{ color: "var(--mm-text-2)" }}
      >
        {children}
      </div>
    </section>
  );
}

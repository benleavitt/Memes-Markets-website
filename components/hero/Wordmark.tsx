/**
 * Full-bleed wordmark. There is no nav bar — this IS the header.
 *
 * Sized with pure CSS, no JS measurement and therefore no layout shift.
 * "MEMES & MARKETS" set in Archivo Black at -5% tracking has a fixed
 * width-to-font-size ratio, so the font size that exactly fills the container is
 * just `containerWidth / ratio`.
 *
 *   ratio = 2241px wide / 220px font-size = 10.186
 *
 * Measured in Figma (file qUhg8iR0L0TAOqv3QQ7pAM, style `display/wordmark`).
 * If the string, the family, or the tracking changes, re-measure — nothing else
 * in the layout will tell you it drifted, the text will just stop reaching the edge.
 *
 * `cqw` rather than `vw` because vw includes the scrollbar, which would push the
 * text a few px wider than the page and cause a horizontal scroll.
 */
const RATIO = 10.186;
/**
 * Fraction of the container the wordmark spans.
 *
 * It used to be a hard 1 — glyphs literally on the page margin. At 1 the mark is
 * about 108px tall on a 1512px laptop, and it is the single biggest consumer of
 * space above the globe: every pixel here pushes the orbit towards the fold.
 * Backing off to 0.9 keeps it unmistakably the header and buys ~11px back.
 *
 * This is the dial to turn if the hero wants to feel bigger or smaller. Below
 * about 0.8 it stops reading as a full-bleed wordmark and starts reading as a
 * centred heading, which is a different design.
 */
const FILL = 0.9;
const TEXT = "Memes & Markets";

export function Wordmark({ as: Tag = "h1" }: { as?: "h1" | "p" }) {
  return (
    <div
      className="w-full [container-type:inline-size]"
      style={{ paddingInline: "var(--mm-space-5)" }}
    >
      <Tag
        className="text-[var(--mm-text)] uppercase"
        style={{
          fontFamily: "var(--mm-font-display)",
          fontWeight: 900,
          // minus the two paddings, so FILL is measured against the usable width
          fontSize: `calc((100cqw - 2 * var(--mm-space-5)) / ${RATIO} * ${FILL})`,
          lineHeight: 0.78,
          letterSpacing: "-0.05em",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {TEXT}
      </Tag>
    </div>
  );
}

/**
 * Full-bleed wordmark. There is no nav bar — this IS the header.
 *
 * Sized with pure CSS, no JS measurement and therefore no layout shift.
 * "MEMES & MARKETS" set in Raleway Heavy at -5% tracking has a fixed
 * width-to-font-size ratio, so the font size that exactly fills the container is
 * just `containerWidth / ratio`.
 *
 *   ratio = 8692px wide / 1000px font-size = 8.692
 *
 * Measured in the browser against the loaded Raleway 900 face, using the exact
 * CSS below. It replaced 10.186, which was Archivo Black's. Raleway Heavy is the
 * narrower face per em, so the same container now resolves to a LARGER font-size
 * — 121px where Archivo got 103px on a 1280px viewport. The mark spans the same
 * width it always did; it is the cap height, and so the hero's height, that grew.
 * That is the trade the family change makes, and FILL below is the dial to
 * unwind it with if the hero starts crowding the fold.
 *
 * If the string, the family, or the tracking changes, re-measure — nothing else
 * in the layout will tell you it drifted, the text will just stop reaching the
 * edge. To re-measure: render the string at a known font-size with this exact
 * CSS and divide the resulting width by that font-size.
 *
 * `cqw` rather than `vw` because vw includes the scrollbar, which would push the
 * text a few px wider than the page and cause a horizontal scroll.
 */
const RATIO = 8.692;
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
        className="mm-wordmark text-[var(--mm-text)] uppercase"
        style={{
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

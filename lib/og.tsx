import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Shared renderer for both OG cards, so the two route files stay thin and the
 * brand is defined once.
 *
 * Two families, matching the site: the title is the wordmark and so is Raleway
 * Heavy, everything around it is Archivo, exactly as .mm-wordmark splits them in
 * the page itself.
 *
 * Fetched from Google's CSS endpoint at build time. Sending no modern
 * User-Agent makes Google serve TTF rather than woff2, which is what satori can
 * parse. If a fetch fails for any reason the card still renders in the default
 * face — a slightly off-brand preview beats a build that dies over a social
 * image.
 */
async function googleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`,
      { headers: { "user-agent": "Mozilla/4.0" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * The brand mark, inlined as a data URI.
 *
 * Read from disk rather than fetched: satori has no network of its own, and
 * pointing it at our own /brand/mm-logo.png would make every social card depend
 * on the site being up to render a picture of the site. The OG routes run on the
 * Node runtime — neither exports `runtime`, and next/og defaults to Node — so the
 * filesystem is there.
 *
 * Read once at module load. It is 20kB, and the alternative is re-reading it for
 * every card.
 *
 * Falls back to null on any failure, and the card then draws the plain red dot it
 * used to. Same bargain as the fonts above: a slightly off-brand preview beats a
 * build that dies over a social image.
 */
const LOGO: string | null = (() => {
  try {
    const png = readFileSync(join(process.cwd(), "public", "brand", "mm-logo.png"));
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
})();

/** Source is 522x640, so height drives it and the width follows the ratio. */
const LOGO_H = 44;
const LOGO_W = Math.round((522 / 640) * LOGO_H);

export async function renderOg({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const [wordmark, body] = await Promise.all([
    googleFont("Raleway", 900),
    googleFont("Archivo", 400),
  ]);
  const fonts = [
    wordmark && {
      name: "Raleway",
      data: wordmark,
      weight: 900 as const,
      style: "normal" as const,
    },
    body && {
      name: "Archivo",
      data: body,
      weight: 400 as const,
      style: "normal" as const,
    },
  ].filter(Boolean) as Array<{
    name: string;
    data: ArrayBuffer;
    weight: 400 | 900;
    style: "normal";
  }>;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#0B0B0D",
        // The hero glow, flattened. No blur filter: satori does not run one.
        backgroundImage:
          "radial-gradient(60% 55% at 50% 32%, rgba(255,0,0,0.20) 0%, rgba(255,0,0,0.06) 45%, rgba(11,11,13,0) 72%)",
        padding: "72px 80px",
        fontFamily: body ? "Archivo" : "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* The mark, where a red dot used to stand in for one. The dot is kept as
            the fallback so the row never collapses if the file cannot be read. */}
        {LOGO ? (
          <img src={LOGO} width={LOGO_W} height={LOGO_H} alt="" />
        ) : (
          <div
            style={{ width: 10, height: 10, borderRadius: 999, background: "#FF0000" }}
          />
        )}
        <div
          style={{
            color: "#FF0000",
            fontSize: 24,
            fontWeight: 400,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
      </div>

      {/* The wordmark. Raleway is a narrower face than Archivo at the same size,
          so this is 112px where the Archivo version was 104 — it lands at roughly
          the width the card was drawn around. */}
      <div
        style={{
          color: "#FFFFFF",
          fontFamily: wordmark ? "Raleway" : "sans-serif",
          fontSize: 112,
          fontWeight: 900,
          letterSpacing: -4,
          lineHeight: 1,
          marginTop: 28,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#8A8A93",
          fontSize: 34,
          fontWeight: 400,
          marginTop: 28,
          maxWidth: 900,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "auto",
          paddingTop: 40,
          borderTop: "1px solid rgba(255,255,255,0.12)",
          color: "#7C7C85",
          fontSize: 24,
        }}
      >
        memesandmarkets.com
      </div>
    </div>,
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}

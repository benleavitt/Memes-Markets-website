import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Shared renderer for both OG cards, so the two route files stay thin and the
 * brand is defined once.
 *
 * The font is fetched from Google's CSS endpoint at build time. Sending no
 * modern User-Agent makes Google serve TTF rather than woff2, which is what
 * satori can parse. If that fetch fails for any reason the card still renders in
 * the default face — a slightly off-brand preview beats a build that dies over a
 * social image.
 */
async function archivo(weight: 400 | 900): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Archivo:wght@${weight}`,
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

export async function renderOg({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const [black, regular] = await Promise.all([archivo(900), archivo(400)]);
  const fonts = [
    black && {
      name: "Archivo",
      data: black,
      weight: 900 as const,
      style: "normal" as const,
    },
    regular && {
      name: "Archivo",
      data: regular,
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
        fontFamily: fonts.length ? "Archivo" : "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{ width: 10, height: 10, borderRadius: 999, background: "#FF0000" }}
        />
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

      <div
        style={{
          color: "#FFFFFF",
          fontSize: 104,
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

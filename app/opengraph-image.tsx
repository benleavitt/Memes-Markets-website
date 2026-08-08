import { POSITIONING, SCHEDULE } from "@/content/platforms";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Memes & Markets — Web3's live podcast";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOg({
    eyebrow: "Web3's live podcast",
    title: "Memes & Markets",
    subtitle: `${POSITIONING}. ${SCHEDULE}.`,
  });
}

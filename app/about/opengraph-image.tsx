import { HOSTS, SCHEDULE } from "@/content/platforms";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "About Memes & Markets";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOg({
    eyebrow: "About",
    title: "Hosted by",
    subtitle: `${HOSTS}. ${SCHEDULE}, live and unedited.`,
  });
}

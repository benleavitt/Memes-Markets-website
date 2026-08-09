import { POSITIONING, SCHEDULE } from "@/content/platforms";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Memes & Markets";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  // The eyebrow carried a tagline that has been dropped from the brand. The slot
  // takes the schedule rather than being left blank — an empty eyebrow leaves a
  // visible gap above the title in the card — and the subtitle drops to the
  // positioning line alone so the two do not repeat each other.
  return renderOg({
    eyebrow: SCHEDULE,
    title: "Memes & Markets",
    subtitle: POSITIONING,
  });
}

import type { PlatformId } from "@/content/platforms";

/**
 * The one number that best gauges the show on each platform, and why it is that
 * number rather than another.
 *
 * "Followers" everywhere would be tidy and would misrepresent two of these.
 * Every platform rewards something different, so the signal a person in the
 * industry actually looks at differs too:
 *
 *   YouTube    subscribers and lifetime views. Subscribers are the standing
 *              audience, views are the reach; a channel is judged on both, and
 *              neither alone tells you much.
 *   Instagram  followers. Reach is gated by the follower graph first, so the
 *              follower count is still the number the platform is read on.
 *   X          followers. Same reasoning.
 *   TikTok     followers, by the show's own call. The case for likes is real —
 *              TikTok distributes by interest rather than by who follows you, so
 *              5,059 followers understates an account whose videos have earned
 *              60.4K likes. But one row of six numbers reads better when every
 *              cell counts the same kind of thing: a reader comparing "60.4K
 *              likes" against "36K followers" has to do conversion work nobody
 *              asked them for. Consistency won. The likes figure stays in the
 *              comment below so the argument need not be reconstructed.
 *
 * WHY THESE ARE HAND-TYPED, when YouTube's are read live. YouTube publishes
 * `channels?part=statistics` behind a free read-only key. The other three do not
 * publish a fetchable figure at all — X's follower count is gone from the served
 * HTML and its old free syndication endpoint now answers 200 with an empty body;
 * Instagram's needs a Facebook app and a business account; TikTok serves a JS
 * shell and answers 400 to both oEmbed and ?__a=1. All four were tried.
 *
 * So they are correct on `capturedAt` and drift after. `value: null` renders the
 * cell not at all — no zero, no dash, no placeholder.
 */

export interface Audience {
  /** tiktok is not in PlatformId: the show has no TikTok link on the site yet. */
  platform: PlatformId | "tiktok";
  /** The platform, as it names itself. */
  platformLabel: string;
  /** What the number counts. Shown on the page — this is the point. */
  metric: string;
  value: number | null;
}

/** The day these were last read off the profiles. ISO. */
export const AUDIENCE_CAPTURED_AT = "2026-08-17";

/**
 * PRECISION VARIES AND compact() ROUNDS DOWN, so nothing here can overstate.
 * Instagram, X and TikTok print rounded figures on their own profiles — "36K",
 * "14.8K", "60.4K" — so these are the platforms' own display values rather than
 * measurements.
 *
 * There is deliberately no combined total. Adding four figures of different
 * precision produces one number more confident than any of its parts: if
 * Instagram's "36K" is really 35,500, a headline "72K" overstates the audience
 * by a thousand people. Four numbers a sponsor can check against four profiles
 * beat one they cannot.
 */
export const AUDIENCE: Audience[] = [
  // instagram.com/memesandmkts — "36K followers", 299 posts.
  {
    platform: "instagram",
    platformLabel: "Instagram",
    metric: "Followers",
    value: 36_000,
  },
  // x.com/Memesandmkts — "14.8K Followers".
  { platform: "x", platformLabel: "X", metric: "Followers", value: 14_800 },
  // tiktok.com/@memesandmarkets — 5,059 followers, exact: TikTok prints this one
  // in full rather than rounding it. The profile also shows 60.4K likes; the note
  // above covers why followers is what the page displays.
  { platform: "tiktok", platformLabel: "TikTok", metric: "Followers", value: 5_059 },
];

/**
 * Memes & Markets HQ — the show's members-only Discord, sold as a monthly
 * membership on Whop.
 *
 * Its own file rather than an entry in PLATFORMS. That list is "where to find
 * the show" — free, public, and drawn in the hero bar, the footer icons and the
 * About page's "As heard on" row. A paid community in that row would read as one
 * more place to listen, and it is not one.
 *
 * WHY A LINK AND NOT WHOP'S EMBEDDED CHECKOUT. Whop does offer one — a loader
 * script plus a `data-whop-checkout-plan-id` div that mounts an iframe. It was
 * weighed and passed over for the reasons components/ui/NewsletterCta.tsx gives
 * about Substack's embed, plus two of its own: the frame is cross-origin, so it
 * renders in Whop's design in the middle of this one; the CSP in next.config.ts
 * would have to open script-src and frame-src to Whop; and a third-party payment
 * frame sets cookies that /privacy does not mention and the consent banner does
 * not ask about. Whop's own page also carries the reviews and does the Discord
 * connection after checkout, so sending people there loses nothing.
 *
 * NO PRICE, on purpose. The listing runs "OG pricing" — the price rises $5 each
 * month as the community grows — so any figure typed here is wrong within weeks,
 * and Whop's structured data carries no price to fetch. The mechanism is stated
 * instead, which stays true however the number moves. The member count is left
 * off for the same reason.
 *
 * The copy is the show's own, from the listing's description, lightly trimmed.
 * If the listing changes what membership includes, change `perks` to match.
 */
export const HQ = {
  name: "Memes & Markets HQ",
  href: "https://whop.com/memes-and-markets/memes-and-markets-hq-membership/",
  /** Who it is for — the listing's line, shortened. */
  pitch:
    "The members-only Discord for people who already follow the show and want to join the conversation.",
  /**
   * The listing's "What you get", less "Access to all member channels" — true,
   * but it is what joining anything means, and it pushed the one that gets a
   * smile down the list.
   */
  perks: [
    "What Keith and Ben are watching in the markets",
    "Market breakdowns and discussion with other members",
    "Access to Keith, Ben and the team",
    "Memes",
  ],
  pricing: "The rate goes up as the community grows.",
} as const;

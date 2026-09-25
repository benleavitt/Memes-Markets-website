/**
 * Who built the site.
 *
 * Its own file rather than a line in platforms.ts, which is about where to find
 * the SHOW. This is about who made the thing the show sits in, and the two have
 * no reason to change together.
 *
 * The link goes to the contact page specifically, not the portfolio's front
 * page. Someone clicking a credit in a footer has already decided they are
 * interested; landing them at the top of a site they then have to scroll and
 * hunt through is how that interest gets lost.
 */
export const DEVELOPER = {
  /**
   * First name only, by his own request. It reads as a person rather than a
   * byline, which is the right weight for a credit sitting in a footer next to
   * the legal links. The link still goes to the full portfolio.
   */
  name: "Charles",
  /**
   * A page of its own, not the `#contact` fragment this used to point at. Both
   * answer 200; this is the address as given rather than a guess at the
   * canonical one.
   */
  href: "https://www.ochanda-charles.me/contact",
} as const;

/**
 * Press coverage and guest appearances, for the More info panel.
 *
 * These are set as type, not mastheads. Dropping CBC's and CTV's logos in would
 * assert "these broadcasters covered the show" — the coverage is real but it is
 * about Ben personally, years before Memes & Markets existed, so the logo wall
 * would be claiming something the entries themselves do not. Naming the outlet
 * and saying plainly who appeared makes the same point without the overclaim.
 * Same instinct as rule 4 in CLAUDE.md.
 *
 * `href` is optional on purpose. Every current entry has one, but an entry
 * without a link still prints — it just isn't clickable — so an appearance whose
 * episode URL nobody has yet can go in the list rather than being guessed at.
 */

export interface PressItem {
  id: string;
  /** The outlet, spelled the way it spells itself. */
  outlet: string;
  /** One line: who appeared, or what the piece was about. */
  note: string;
  /** The piece itself. Without it the entry is not a link. */
  href?: string;
}

/*
 * Two guest appearances are still missing on purpose — Age of Abundance and Ari
 * Gutman, both Keith D & Ben. They are real, but neither show publishes an
 * episode URL that names its guests, so there is nothing to point at. Add them
 * the moment someone has the links; nothing else needs to change.
 */
export const PRESS_ITEMS: PressItem[] = [
  {
    id: "log-out",
    outlet: "The Log Out Podcast",
    note: "Keith D on how the betting economy targets young men",
    href: "https://www.youtube.com/watch?v=jDT7SMMSMJs",
  },
  {
    id: "ctv",
    outlet: "CTV News",
    note: "Ben on clearing student debt with YouTube",
    href: "https://youtu.be/vjODgoQ93-g",
  },
  {
    id: "cbc",
    outlet: "CBC News",
    note: "Guelph grad uses YouTube to pay off student loan",
    href: "https://www.cbc.ca/news/canada/kitchener-waterloo/youtube-student-debt-loan-ben-leavitt-1.5412954",
  },
  {
    id: "starter-story",
    outlet: "Starter Story",
    note: "Ben on growing a micro-SaaS to $17K a month",
    // Canonical watch URL. The link as supplied carried `si=` — a share token
    // that attributes the click back to whoever copied it — and `feature=youtu.be`.
    // Neither belongs in a link the whole site sends traffic through.
    href: "https://www.youtube.com/watch?v=4KfFB-dh71Y",
  },
];

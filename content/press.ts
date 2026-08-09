/**
 * Press slots for the More info panel.
 *
 * Deliberately unbranded placeholders. Real mastheads here would assert "these
 * publications covered the show" — a claim the site cannot currently make, and
 * dropping a real newspaper's logo in before the coverage exists is a fabricated
 * credential rather than a design placeholder. See rule 4 in CLAUDE.md: the same
 * reason we never invent episode numbers.
 *
 * To fill one in: replace `name`, drop an SVG into public/press/, set `logo`, and
 * point `href` at the actual piece.
 */

export interface PressSlot {
  id: string;
  /** Shown until a logo exists. */
  name: string;
  /** Path under public/press/. Renders instead of `name` once set. */
  logo?: string;
  /** The coverage itself. Without it the slot is not a link. */
  href?: string;
}

export const PRESS_SLOTS: PressSlot[] = [
  { id: "press-01", name: "Press slot 01" },
  { id: "press-02", name: "Press slot 02" },
  { id: "press-03", name: "Press slot 03" },
  { id: "press-04", name: "Press slot 04" },
  { id: "press-05", name: "Press slot 05" },
  { id: "press-06", name: "Press slot 06" },
  { id: "press-07", name: "Press slot 07" },
  { id: "press-08", name: "Press slot 08" },
];

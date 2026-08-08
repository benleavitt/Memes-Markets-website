/**
 * The two hosts.
 *
 * No per-host social handles here on purpose. The brief only ever supplied
 * show-level accounts, and inventing personal ones would put fake links on a
 * real person's bio. Add them when you have them and the cards will render them.
 */

export interface Host {
  name: string;
  role: string;
  bio: string;
  /** In public/brand/, cropped from the originals in Assets/. */
  photo: string;
  /** Optional per-host links. Empty until real handles are supplied. */
  links?: Array<{ label: string; href: string }>;
}

export const HOST_LIST: Host[] = [
  {
    name: "Keith D",
    role: "Co-host",
    bio: "Digs into the monetary system, Bitcoin and where the money actually goes. Asks the question the guest was hoping to avoid.",
    photo: "/brand/keith-d.jpg",
  },
  {
    name: "Ben Leavitt",
    role: "Co-host",
    bio: "Chases the culture side: what the internet is doing to markets, work and everyone's attention span. Keeps the show honest about the memes.",
    photo: "/brand/ben-leavitt.jpg",
  },
];

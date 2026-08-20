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
  /**
   * Paragraphs, not one string. The supplied bios arrive as several — Keith's as
   * three, Ben's as four — and joining them into a single block would run a career
   * history, a résumé and a thesis together into a wall nobody reads.
   *
   * They are not the same length, and the cards sit side by side on md and up.
   * The grid rows stretch, so the shorter card's photo stays aligned with the
   * longer one's; only the whitespace below the shorter bio grows.
   */
  bio: string[];
  /** In public/brand/, cropped from the originals in Assets/. */
  photo: string;
  /** Optional per-host links. Empty until real handles are supplied. */
  links?: Array<{ label: string; href: string }>;
}

export const HOST_LIST: Host[] = [
  {
    name: "Keith D",
    role: "Co-host",
    bio: [
      "Keith D is a former licensed investment broker representative, entrepreneur, and creator focused on the intersection of money, technology, and human behaviour.",
      "After starting his career in digital marketing, he saw the potential of crypto, started working in decentralized finance and security tokens before entering traditional finance. He later began teaching financial education and grew his YouTube channel from zero to 100,000 subscribers in 107 days.",
      "Keith brings a simple thesis to everything he builds: financial freedom isn’t just a knowledge problem, it’s a behaviour problem.",
    ],
    photo: "/brand/keith-d.jpg",
  },
  {
    name: "Ben Leavitt",
    role: "Co-host",
    bio: [
      "Ben Leavitt is a creator, entrepreneur, and social media strategist with 95,000+ YouTube subscribers and 100,000+ TikTok followers, where he teaches social media and has worked with leading creators, podcasters, and brands.",
      "For the past eight years, he has run Bunny Media, helping podcasters and software companies grow through YouTube, with clients including Peter Diamandis, Rich Roll, and a16z.",
      "Ben is also the co-host of Memes & Markets and founder of FollowBuddy, Step Pals, and No Dice.",
      "He’s obsessed with human behaviour, building products that solve real problems, and advocating for better social media hygiene, conscious consumption, and digital literacy.",
    ],
    photo: "/brand/ben-leavitt.jpg",
  },
];

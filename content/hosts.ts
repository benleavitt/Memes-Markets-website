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
   * three, Ben's as six — and joining them into a single block would run a career
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
      "Keith D is a former licensed investment broker representative, entrepreneur, and creator focused on the intersection of money, technology, and human behavior.",
      "After starting his career in digital marketing, he saw the potential of crypto, started working in decentralized finance and security tokens before entering traditional finance. He later began teaching financial education and grew his YouTube channel from zero to 100,000 subscribers in 107 days.",
      "Keith brings a simple thesis to everything he builds: financial freedom isn’t just a knowledge problem, it’s a behavior problem.",
    ],
    photo: "/brand/keith-d.jpg",
  },
  {
    name: "Ben Leavitt",
    role: "Co-host",
    bio: [
      "Ben Leavitt is a creator, entrepreneur, and social media strategist obsessed with one question: why do people do what they do?",
      "He has built an audience of more than 95,000 subscribers on YouTube and 100,000+ followers on TikTok, where he teaches social media strategy and has collaborated with some of the world’s largest creators, podcasters, and brands.",
      "For the past eight years, Ben has also run Bunny Media, a social media agency focused on helping podcasters and software companies scale through YouTube. Through Bunny Media, he has worked with names including Peter Diamandis, Rich Roll, a16z, and many others.",
      "He is the co-host of Memes & Markets, a live-stream podcast exploring markets, technology, culture, and the ideas shaping the world.",
      "Ben is also the founder of three consumer apps: FollowBuddy, which helps people find who unfollowed them on Instagram without handing over their Instagram password; Step Pals, a Tamagotchi-inspired walking app that turns daily steps into caring for a virtual pet; and No Dice, an app designed to help people quit gambling and doomscrolling and replace destructive habits with healthier ones that move them toward their goals.",
      "Across everything he builds, Ben is interested in the intersection of human behavior, technology, content, and conscious choice. He is a major advocate for better social media hygiene, greater social media literacy, and helping people become more intentional about what they consume online — rather than allowing algorithms to make those choices for them.",
    ],
    photo: "/brand/ben-leavitt.jpg",
  },
];

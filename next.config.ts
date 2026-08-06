import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    // Thumbnails render ~210px wide on the orbit; next/image resizes and
    // converts to AVIF so we never ship a 1280x720 jpeg for a 210px card.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
    formats: ["image/avif", "image/webp"],
  },
};

export default config;

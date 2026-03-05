import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "pbs.twimg.com" },
      { hostname: "abs.twimg.com" },
      { hostname: "video.twimg.com" },
    ],
  },
}

export default nextConfig

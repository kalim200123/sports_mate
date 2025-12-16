import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.dev.kovo.co.kr",
      },
    ],
  },
};

export default nextConfig;

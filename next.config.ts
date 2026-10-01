import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.emenu.ae" },
      { protocol: "https", hostname: "cdn2.emenu.ae" },
    ],
  },
};

export default nextConfig;

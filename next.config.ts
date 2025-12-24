import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable strict mode which can cause double renders
  experimental: {
    turbo: {
      // Reduce aggressive rebuilds
      loaders: {},
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@nitipcuy/adapters",
    "@nitipcuy/application",
    "@nitipcuy/domain",
  ],
};

export default nextConfig;

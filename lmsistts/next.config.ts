// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  serverActions: {
    bodySizeLimit: "100mb", // harus string, >1MB
  },

  experimental: {
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100MB
  },

  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

export default nextConfig;


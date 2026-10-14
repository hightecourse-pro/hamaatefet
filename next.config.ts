import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Forum posts may carry an image (the composer's "צירוף תמונה").
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

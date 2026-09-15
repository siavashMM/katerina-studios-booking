import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 480, 640, 768, 960, 1280, 1440, 1920],
    qualities: [65, 75, 85],
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;

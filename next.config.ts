import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        // Vercel Blob storage
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // Allow any https image for flexibility during dev
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

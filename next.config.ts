import type { NextConfig } from "next";

const isDesktopExport = process.env.PULSEFORGE_DESKTOP_EXPORT === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isDesktopExport
    ? {
        output: "export",
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default nextConfig;

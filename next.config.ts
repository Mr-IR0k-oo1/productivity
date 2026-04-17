import type { NextConfig } from "next";

const isDesktopExport = process.env.PULSEFORGE_DESKTOP_EXPORT === "true";
const apiUrl = process.env.API_URL?.trim();

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
  async rewrites() {
    if (process.env.NODE_ENV === "production" || !apiUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isDesktopExport = process.env.ORBIT_DESKTOP_EXPORT === "true";

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
    if (process.env.NODE_ENV === "production") {
      return [];
    }

    const apiUrl = process.env.API_URL?.trim() || "http://localhost:8787";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

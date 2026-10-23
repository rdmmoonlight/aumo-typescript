import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },

  ...(isDev && {
    async rewrites() {
      const AUTH_TARGET = process.env.AUTH_API_URL || "http://localhost:8080";
      const ACCOUNTING_TARGET = process.env.ACCOUNTING_API_URL || "http://localhost:5100";
      const DEFAULT_TARGET = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      return [
        {
          source: "/api/auth/:path*",
          destination: `${AUTH_TARGET.replace(/\/$/, "")}/api/auth/:path*`,
        },
        {
          source: "/api/periods/:path*",
          destination: `${ACCOUNTING_TARGET.replace(/\/$/, "")}/api/periods/:path*`,
        },
        {
          source: "/api/chart-of-accounts/:path*",
          destination: `${ACCOUNTING_TARGET.replace(/\/$/, "")}/api/chart-of-accounts/:path*`,
        },
        {
          source: "/api/reports/:path*",
          destination: `${ACCOUNTING_TARGET.replace(/\/$/, "")}/api/reports/:path*`,
        },
        {
          source: "/api/summary/:path*",
          destination: `${ACCOUNTING_TARGET.replace(/\/$/, "")}/api/summary/:path*`,
        },
        {
          source: "/api/:path*",
          destination: `${DEFAULT_TARGET.replace(/\/$/, "")}/api/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
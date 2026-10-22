import type { NextConfig } from "next";

const getBackendTarget = (): string => {
  let target =
    process.env.NEXT_PUBLIC__WEB_API_URL ||
    process.env.WEB_API_URL ||
    process.env.NEXT_PUBLIC_WEB_API_URL ||
    "http://localhost:5000";

  if (!target.includes("localhost") && target.startsWith("http://")) {
    target = target.replace("http://", "https://");
  }

  return target;
};

const nextConfig: NextConfig = {
  async rewrites() {
    const backendTarget = getBackendTarget();

    return [
      {
        source: "/api/:path*",
        destination: `${backendTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

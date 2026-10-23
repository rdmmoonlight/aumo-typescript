import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Mengaktifkan Next.js Static Export untuk Production Build
  output: "export",

  // Trailing slash konsisten untuk kebutuhan Nginx static routing
  trailingSlash: false,

  // Menonaktifkan optimasi gambar bawaan Server Next.js
  images: {
    unoptimized: true,
  },

  // Rewrites hanya aktif saat mode development (`next dev`)
  ...(isDev && {
    async rewrites() {
      // Menggunakan fallback URL jika NEXT_PUBLIC_API_URL tidak terdefinisi
      const backendTarget =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      // Memastikan trailing slash pada backendTarget dibersihkan agar tidak double slash
      const cleanTarget = backendTarget.replace(/\/$/, "");

      return [
        {
          source: "/api/:path*",
          destination: `${cleanTarget}/api/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
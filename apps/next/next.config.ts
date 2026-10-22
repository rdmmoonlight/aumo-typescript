import type { NextConfig } from "next";

const isExport = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Wajib untuk mengaktifkan Next.js Static Export
  output: "export",

  // Opsional: Memastikan trailing slash konsisten dengan Nginx try_files ($uri.html / $uri/index.html)
  trailingSlash: false,

  // Menonaktifkan optimasi gambar bawaan Next.js Server (karena butuh Node.js server)
  images: {
    unoptimized: true,
  },

  // Rewrites hanya aktif saat 'next dev' (Local Development tanpa Nginx)
  ...(isExport
    ? {}
    : {
      async rewrites() {
        const backendTarget =
          process.env.NEXT_PUBLIC_WEB_API_URL ||
          process.env.WEB_API_URL ||
          "http://localhost:5000";

        return [
          {
            source: "/api/:path*",
            destination: `${backendTarget}/api/:path*`,
          },
        ];
      },
    }),
};

export default nextConfig;
import analog from "@analogjs/platform";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  build: {
    target: ["es2020"],
  },
  resolve: {
    mainFields: ["module"],
  },
  plugins: [
    analog({
      ssr: false,
      static: true,
      prerender: { routes: [] },
      // Prefix bawaan Analog adalah "api" (Nitro) dan akan menelan /api/* di
      // dev sebelum proxy di bawah. Pindahkan ke prefix yang tidak dipakai
      // agar /api sepenuhnya milik backend (Go auth + Nest).
      apiPrefix: "analog-internal",
    }),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ["typescript"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    include: ["**/*.spec.ts"],
    reporters: ["default"],
  },
  server: {
    port: 3000,
    // Dev memakai jalur yang sama dengan produksi: browser -> /api -> gateway
    // Nginx (auth_request, pemotongan prefix, X-User-Id). Jalankan gateway
    // lewat `docker compose up --build` (port 10000), atau ubah target
    // dengan DEV_API_TARGET.
    proxy: {
      "/api": {
        target: process.env["DEV_API_TARGET"] ?? "http://localhost:10000",
        changeOrigin: true,
      },
    },
  },
}));
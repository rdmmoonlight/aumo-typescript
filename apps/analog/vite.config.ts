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
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
}));
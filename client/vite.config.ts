import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
const apiProxyTarget = process.env.VITE_DEV_API_PROXY || "http://31.57.97.59:3010";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": { target: apiProxyTarget, changeOrigin: true },
      "/health": { target: apiProxyTarget, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      "/api": { target: apiProxyTarget, changeOrigin: true },
      "/health": { target: apiProxyTarget, changeOrigin: true },
    },
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    sourcemap: false,
  },
});

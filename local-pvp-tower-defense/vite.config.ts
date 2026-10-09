import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Хосты, с которых можно открывать dev-сервер и `vite preview` кроме localhost.
 * `.e2b.app` покрывает облачный предпросмотр, через который открывается игра;
 * без этого Vite отвечает 403 «Blocked request». Локально (localhost) ничего менять не нужно.
 */
const PREVIEW_HOSTS = [".e2b.app"];

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    allowedHosts: PREVIEW_HOSTS,
  },
  preview: {
    allowedHosts: PREVIEW_HOSTS,
  },
});

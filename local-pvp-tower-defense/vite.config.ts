import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Хосты, с которых можно открывать dev-сервер и `vite preview` кроме localhost.
 * `.e2b.app` покрывает облачный предпросмотр, через который открывается игра;
 * без этого Vite отвечает 403 «Blocked request». Локально (localhost) ничего менять не нужно.
 */
const PREVIEW_HOSTS = [".e2b.app"];

/**
 * Сборка создаёт одну самодостаточную страницу dist/dev.html (весь код, стили и шрифты внутри).
 * Плагин кладёт её в два места: index.html в корне проекта — игра открывается двойным кликом
 * без установки, и dist/index.html — для `npm run preview`. Временный dist/dev.html удаляется.
 */
function publishStandalone(): Plugin {
  return {
    name: "publish-standalone",
    apply: "build",
    closeBundle() {
      const built = path.resolve(__dirname, "dist/dev.html");
      fs.copyFileSync(built, path.resolve(__dirname, "dist/index.html"));
      fs.copyFileSync(built, path.resolve(__dirname, "index.html"));
      fs.rmSync(built);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), publishStandalone()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      // Исходная страница — dev.html. Из неё собирается готовый index.html.
      input: path.resolve(__dirname, "dev.html"),
    },
  },
  server: {
    allowedHosts: PREVIEW_HOSTS,
  },
  preview: {
    allowedHosts: PREVIEW_HOSTS,
  },
});

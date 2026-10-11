import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Хосты предпросмотра этой среды (иначе Vite отвечает 403)
const PREVIEW_HOSTS = ['.e2b.app'];

// После сборки копируем dist/dev.html в dist/index.html и в корневой index.html.
// Итог: index.html — самодостаточная игра (код, стили, шрифты, звуки),
// открывается двойным кликом, интернет и установка не нужны.
function publishStandalone(): Plugin {
  return {
    name: 'publish-standalone',
    apply: 'build',
    closeBundle() {
      const built = path.join(__dirname, 'dist', 'dev.html');
      if (!fs.existsSync(built)) return;
      const data = fs.readFileSync(built);
      fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), data);
      fs.writeFileSync(path.join(__dirname, 'index.html'), data);
      fs.unlinkSync(built);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), publishStandalone()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      // исходная страница — dev.html, а не index.html
      input: path.resolve(__dirname, 'dev.html'),
    },
  },
  server: {
    allowedHosts: PREVIEW_HOSTS,
  },
  preview: {
    allowedHosts: PREVIEW_HOSTS,
  },
});

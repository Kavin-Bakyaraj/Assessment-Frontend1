import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [react(),svgr()],
  assetsInclude: ["**/*.xlsx"],
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // Vaqtincha: xatoni aniqlash uchun kod qisqartirilmaydi (keyin qaytariladi)
  build: { minify: false, sourcemap: true },
});

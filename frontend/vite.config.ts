import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['sunday.scheung.dev'],
    port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
    proxy: {
      '/api': {
        target: 'http://backend:9001', // Backend server
        changeOrigin: true,
        rewrite: (path) => path, // Ensures /api is not stripped
      },
    }
  },
});

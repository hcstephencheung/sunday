import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Hosts the dev server answers to: the public domain, the local Caddy site and,
// when remote access is set up, the tailnet name (TAILNET_HOST, passed in by
// docker-compose.dev.yml).
const allowedHosts = ['sunday.scheung.dev', 'sunday.localhost'];
if (process.env.TAILNET_HOST) {
  allowedHosts.push(process.env.TAILNET_HOST);
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts,
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    proxy: {
      '/api': {
        target: 'http://backend:9000', // Backend server
        changeOrigin: true,
        rewrite: (path) => path, // Ensures /api is not stripped
      },
    }
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const API = 'http://localhost:3333';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'ConFin - Controle Financeiro Familiar',
        short_name: 'ConFin',
        description: 'Controle as despesas da família em tempo real.',
        lang: 'pt-BR',
        theme_color: '#059669',
        background_color: '#0b1120',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1000 },
  server: {
    host: true, // permite abrir pelo celular na mesma rede Wi-Fi
    proxy: {
      '/api': API,
      '/socket.io': { target: API, ws: true },
    },
  },
});

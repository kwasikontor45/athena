import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Precache all built assets — hashed filenames make this safe
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Activate new SW immediately, take control of all open tabs
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Network-first for HTML so deploys are picked up without a second refresh
        navigationPreload: false,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'athena-html',
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      manifest: {
        name: 'Athena',
        short_name: 'Athena',
        description: 'Computer literacy training — files, email, browser, and more.',
        theme_color: '#1a1a24',
        background_color: '#1a1a24',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})

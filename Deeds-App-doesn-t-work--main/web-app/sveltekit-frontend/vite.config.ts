import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      sveltekit(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'WardenNet - Legal Case Management',
          short_name: 'WardenNet',
          description: 'Advanced legal case management system for prosecutors',
          theme_color: '#3b82f6',
          background_color: '#1e293b',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/favicon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/favicon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ],
          shortcuts: [
            {
              name: 'New Case',
              short_name: 'New Case',
              description: 'Create a new case file',
              url: '/cases/new',
              icons: [{ src: '/favicon.png', sizes: '192x192' }]
            },
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'View case dashboard',
              url: '/dashboard',
              icons: [{ src: '/favicon.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      rollupOptions: {
        external: ['pdf-parse']
      }
    },
    ssr: {
      noExternal: []
    },
    server: {
      port: 5173, // Standard port for consistency
      host: 'localhost', // Restrict to localhost only
      strictPort: true, // Fail if port is already in use instead of using another port
    },
    preview: {
      port: 4173,
    },
  };
});
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';

const runtimeCaching = [
  {
    urlPattern: ({ request }) =>
      request.mode === 'navigate' ||
      request.headers.get('x-portfolio-prefetch') === 'html' ||
      request.headers.get('accept')?.includes('text/html'),
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'mumumu-portfolio-pages-v5',
      expiration: { maxEntries: 40 },
      cacheableResponse: { statuses: [200] },
    },
  },
  {
    urlPattern: ({ request, url }) =>
      url.origin === self.location.origin &&
      (['font', 'image', 'script', 'style'].includes(request.destination) ||
        url.pathname.startsWith('/_astro/') ||
        url.pathname.endsWith('.css')),
    handler: 'CacheFirst',
    options: {
      cacheName: 'mumumu-portfolio-assets-v5',
      expiration: { maxEntries: 160 },
      cacheableResponse: { statuses: [200] },
    },
  },
];

export default defineConfig({
  site: 'https://mumumu6.net',
  output: 'static',
  integrations: [
    mdx(),
    sitemap(),
    AstroPWA({
      filename: 'sw.js',
      // Astro does not rewrite static HTML with Vite's injected registration
      // tag, so the existing client entry imports the virtual registration module.
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      scope: '/',
      manifest: false,
      workbox: {
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css}'],
        navigateFallback: undefined,
        runtimeCaching,
        skipWaiting: false,
        sourcemap: false,
      },
    }),
  ],
  // Prefetch only opted-in pages. The page response is prefetched; images keep
  // their own loading="lazy"/loading="eager" policy.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});

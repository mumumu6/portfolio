import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import AstroPWA from '@vite-pwa/astro'

const defaultThemeColor = '#090d12'

const runtimeCaching = [
  {
    // This is a static site. Return prefetched or previously visited HTML
    // immediately instead of revalidating on every Astro transition.
    urlPattern: ({ request, url }) =>
      url.origin === self.location.origin &&
      (request.mode === 'navigate' ||
        request.headers.get('sec-purpose')?.includes('prefetch') ||
        request.headers.get('accept')?.includes('text/html')),
    handler: 'CacheFirst',
    options: {
      cacheName: 'mumumu-portfolio-pages-v2',
      expiration: {
        maxEntries: 40,
        maxAgeSeconds: 60 * 60,
      },
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
]

export default defineConfig({
  site: 'https://mumumu6.net',
  output: 'static',
  build: {
    // Inline small route styles so ClientRouter can swap immediately without
    // waiting for several extra stylesheet requests. Larger styles remain cached assets.
    inlineStylesheets: 'auto',
  },
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
      manifest: {
        name: 'mumumu portfolio',
        short_name: 'mumumu',
        description:
          'mumumuの制作物、技術記事、活動記録をまとめたポートフォリオ。',
        lang: 'ja',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: defaultThemeColor,
        background_color: defaultThemeColor,
        icons: [
          {
            src: '/icons/mumumu-256.webp',
            sizes: '256x256',
            type: 'image/webp',
            purpose: 'any',
          },
        ],
      },
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
})

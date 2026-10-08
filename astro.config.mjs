import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import AstroPWA from '@vite-pwa/astro'

const defaultThemeColor = '#090d12'

const runtimeCaching = [
  {
    // 静的サイトのため、先読み済み・訪問済みの HTML は
    // 遷移のたびに再検証せず、キャッシュからすぐに返す。
    urlPattern: ({ request, url }) =>
      url.origin === self.location.origin &&
      (request.mode === 'navigate' ||
        (request.destination === '' &&
          (url.pathname === '/' ||
            /^\/(?:blog|works)(?:\/[^/]+)?\/?$/.test(url.pathname) ||
            /^\/(?:experience|thoughts)\/?$/.test(url.pathname)))),
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
      // 全ページで使う画像候補も保持できるよう、現在の生成物数より余裕を持たせる。
      expiration: { maxEntries: 500 },
      cacheableResponse: { statuses: [200] },
    },
  },
]

export default defineConfig({
  site: 'https://mumumu6.net',
  output: 'static',
  image: {
    domains: [
      'files.speakerdeck.com',
      'gocon.github.io',
      'gocon.jp',
      'yt3.googleusercontent.com',
    ],
  },
  build: {
    // 小さなページ用スタイルをインライン化し、CSS の追加取得を待たずに遷移する。
    // 大きなスタイルは別ファイルにしてキャッシュを利用する。
    inlineStylesheets: 'auto',
  },
  integrations: [
    mdx(),
    sitemap(),
    AstroPWA({
      filename: 'sw.js',
      // Astro の静的 HTML には Vite の登録タグが挿入されないため、
      // クライアント側で仮想モジュールを読み込み、Service Worker を登録する。
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
        // 全ページの JS/CSS をインストール時に先読みしない。
        // 実際に使ったページ資産は runtimeCaching の CacheFirst で保存する。
        globPatterns: [],
        navigateFallback: undefined,
        runtimeCaching,
        skipWaiting: false,
        sourcemap: false,
      },
    }),
  ],
  vite: {
    server: {
      // Cloudflare Quick Tunnel のホスト名で開発サーバを開けるようにする。
      allowedHosts: ['.trycloudflare.com'],
    },
  },
  prefetch: {
    // 内部の詳細リンクだけ hover で HTML を先読みする。
    // タッチ操作の先読みは page-enhancements に任せる。
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  experimental: {
    clientPrerender: true,
  },
})

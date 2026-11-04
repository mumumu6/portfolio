import type { ViteUserConfig } from 'vite-plus'

export const fmt = {
  printWidth: 80,
  semi: false,
  singleQuote: true,
  astro: true,
  ignorePatterns: [
    'node_modules/',
    '.astro/',
    '.wrangler/',
    'dist/',
    'dev-dist/',
    'src/collections/content/generated/trap-posts.json',
  ],
} satisfies NonNullable<ViteUserConfig['fmt']>

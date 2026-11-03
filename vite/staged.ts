import type { ViteUserConfig } from 'vite-plus'

export const staged = {
  '*.{js,mjs,ts,astro}': [
    'vp fmt --no-error-on-unmatched-pattern',
    'vp lint --fix',
  ],
  '*.{css,md,mdx,json,jsonc,yml,yaml,toml}': [
    'vp fmt --no-error-on-unmatched-pattern',
  ],
} satisfies NonNullable<ViteUserConfig['staged']>

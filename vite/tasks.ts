import type { ViteUserConfig } from 'vite-plus'

export const run = {
  tasks: {
    dev: {
      command: 'astro dev',
      cache: false,
    },
    stop: {
      command: 'astro dev stop',
      cache: false,
    },
    'build:ci': {
      command: 'vp run validate:ai && vp run check && vp run build',
      cache: false,
    },
    build: {
      command: 'astro build',
      cache: {
        input: [{ auto: true }, '!node_modules/.astro/assets/**'],
        output: [{ auto: true }, '!node_modules/.astro/assets/**'],
      },
    },
    perf: {
      command:
        'vp run build && vp exec lhci autorun --config=./lighthouserc.json',
      cache: false,
    },
    'workers:deploy': { command: 'wrangler deploy', cache: false },
    preview: {
      command: 'astro preview',
      cache: false,
    },
    check: {
      command: 'vp check && astro check',
    },
    lint: {
      command: 'vp lint src scripts && eslint "src/**/*.{astro,mdx}"',
    },
    'lint:fix': {
      command:
        'vp lint src scripts --fix && eslint "src/**/*.{astro,mdx}" --fix',
    },
    fmt: { command: 'vp fmt', cache: false },
    'fmt:check': {
      command: 'vp fmt --check',
    },
    'validate:ai': {
      command: 'vpx scripts/validate-ai-content.mjs',
    },
    'sync:blog': { command: 'vpx scripts/sync-blog.mjs', cache: false },
    prepare: { command: 'vp config --no-agent', cache: false },
  },
} satisfies NonNullable<ViteUserConfig['run']>

import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mumumu6.net',
  output: 'static',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});

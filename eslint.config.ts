import astro from 'eslint-plugin-astro'
import * as mdx from 'eslint-plugin-mdx'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import type { Linter } from 'eslint'

const config = [
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    ...mdx.flat,
    files: ['src/**/*.mdx'],
  },
  {
    files: ['src/**/*.mdx'],
    ...jsxA11y.flatConfigs.recommended,
    settings: {
      'jsx-a11y': {
        components: {
          ResponsiveImage: 'img',
        },
      },
    },
  },
]

export default config satisfies Linter.Config[]

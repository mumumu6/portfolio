import strictTypeScript from 'oxlint-config-presets/@typescript-eslint/strict.json' with { type: 'json' }
import type { ViteUserConfig } from 'vite-plus'

export const lint = {
  extends: [strictTypeScript],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    pedantic: 'warn',
    perf: 'warn',
  },
  env: {
    astro: true,
    browser: true,
    node: true,
  },
  rules: {
    'unicorn/no-useless-spread': 'off',
  },
  overrides: [
    {
      files: [
        'src/pages/**/*.astro',
        'src/pages/**/*.ts',
        'src/components/**/*.astro',
        'src/components/**/*.ts',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'astro:content',
                message:
                  'Content Collectionsはrepository/astro経由で読み込んでください。',
              },
            ],
            patterns: [
              {
                group: [
                  '@/collections/content',
                  '@/collections/content/**',
                  '**/collections/content/**',
                ],
                message:
                  '実データを直接importせず、Repository経由で読み込んでください。',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/collections/content/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/repository', '@/repository/**', '**/repository/**'],
                message: '実データからRepositoryへ依存させないでください。',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/repository/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'astro:content',
                message:
                  'Repositoryの契約と共通処理はAstro実装に依存させないでください。',
              },
            ],
            patterns: [
              {
                group: [
                  '@/repository/astro',
                  '@/repository/astro/**',
                  '@/collections/content',
                  '@/collections/content/**',
                  '**/repository/astro/**',
                  '**/collections/content/**',
                ],
                message:
                  'Repositoryの契約・共通処理から実装や実データへ依存させないでください。',
              },
            ],
          },
        ],
      },
    },
  ],
} satisfies NonNullable<ViteUserConfig['lint']>

import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

export const blogs = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/collections/content/blogs',
    generateId: ({ entry }) => {
      const segments = entry.split('/')
      if (segments.length !== 2 || !segments[0]) {
        throw new Error(`Blog entry path must be <slug>/<file>: ${entry}`)
      }

      return segments[0]
    },
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).optional(),
      cover: image(),
      coverAlt: z.string(),
    }),
})

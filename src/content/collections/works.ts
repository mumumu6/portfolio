import { defineCollection, type SchemaContext } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const workImage = ({ image }: SchemaContext) =>
  z.object({
    src: image(),
    alt: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    caption: z.string().optional(),
  })

export const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: (context) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      publishedAt: z.coerce.date(),
      status: z.enum(['active', 'wip', 'paused', 'archived']),
      tags: z.array(z.string()),
      cover: workImage(context),
      gallery: z.array(workImage(context)).default([]),
      links: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
          }),
        )
        .default([]),
      comments: z
        .array(
          z.object({
            label: z.string(),
            date: z.coerce.date().optional(),
            body: z.string(),
          }),
        )
        .min(1),
      highlights: z.array(z.string()).default([]),
      warning: z.string().optional(),
    }),
})

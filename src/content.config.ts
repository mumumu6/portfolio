import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    cover: image(),
    coverAlt: z.string(),
    coverWidth: z.number().int().positive(),
    coverHeight: z.number().int().positive(),
  }),
});

const workImage = ({ image }: SchemaContext) => z.object({
  src: image(),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  caption: z.string().optional(),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: (context) => z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    status: z.enum(['active', 'wip', 'paused', 'archived']),
    tags: z.array(z.string()),
    cover: workImage(context),
    gallery: z.array(workImage(context)).default([]),
    links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })).default([]),
    comments: z.array(z.object({
      label: z.string(),
      date: z.coerce.date().optional(),
      body: z.string(),
    })).min(1),
    highlights: z.array(z.string()).default([]),
    warning: z.string().optional(),
  }),
});

export const collections = { blogs, works };

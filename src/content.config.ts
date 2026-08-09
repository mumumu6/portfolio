import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
});

const workImage = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    status: z.enum(['active', 'paused', 'archived']),
    tags: z.array(z.string()),
    cover: workImage,
    gallery: z.array(workImage).default([]),
    links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })).default([]),
    note: z.string(),
    updates: z.array(z.object({
      label: z.string(),
      body: z.string(),
    })).default([]),
    highlights: z.array(z.string()).default([]),
    warning: z.string().optional(),
  }),
});

export const collections = { blog, works };

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
  srcset: z.array(z.object({
    src: z.string(),
    width: z.number().int().positive(),
  })).optional(),
  caption: z.string().optional(),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    status: z.enum(['active', 'wip', 'paused', 'archived']),
    tags: z.array(z.string()),
    cover: workImage,
    gallery: z.array(workImage).default([]),
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

export const collections = { blog, works };

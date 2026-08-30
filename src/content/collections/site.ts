import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const site = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/site' }),
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    affiliations: z.array(z.string()),
    links: z.array(
      z.object({
        label: z.string(),
        icon: z.string(),
        href: z.url(),
      }),
    ),
  }),
});

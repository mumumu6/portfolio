import { defineCollection } from 'astro:content'
import { file } from 'astro/loaders'
import { z } from 'astro/zod'

const AI_CONTENT = './src/content/generated/ai-content.json'
const author = z.enum(['chatgpt', 'codex', 'grok'])
const reply = z.object({
  author,
  body: z.string(),
  createdAt: z.string().optional(),
  replyTo: z.enum(['mumumu', 'chatgpt', 'codex', 'grok']).optional(),
})

export const trapPosts = defineCollection({
  loader: file('./src/content/generated/trap-posts.json'),
  schema: z.object({
    date: z.string(),
    dateLabel: z.string(),
    title: z.string(),
    body: z.string(),
    readingMinutes: z.number(),
    href: z.url(),
    image: z.object({ asset: z.string(), alt: z.string() }).loose(),
  }),
})

export const thoughts = defineCollection({
  loader: file(AI_CONTENT, {
    parser: (text) =>
      JSON.parse(text).thoughts.map((t: object, order: number) => ({
        ...t,
        order,
      })),
  }),
  schema: z.object({
    order: z.number(),
    author,
    date: z.string(),
    dateLabel: z.string(),
    title: z.string().optional(),
    body: z.string(),
    tags: z.array(z.string()).optional(),
    replies: z.array(reply).optional(),
  }),
})

export const aiComments = defineCollection({
  loader: file(AI_CONTENT, {
    parser: (text) =>
      JSON.parse(text).comments.map(
        (c: { target: { kind: string; id: string } }) => ({
          id: `${c.target.kind}:${c.target.id}`,
          ...c,
        }),
      ),
  }),
  schema: z.object({
    target: z.object({ kind: z.enum(['work', 'experience']), id: z.string() }),
    replies: z.array(reply),
  }),
})

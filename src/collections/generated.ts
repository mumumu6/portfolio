import { defineCollection } from 'astro:content'
import { file } from 'astro/loaders'
import { z } from 'astro/zod'

const AI_CONTENT = './src/collections/content/generated/ai-content.json'
const author = z.enum(['chatgpt', 'codex', 'grok'])
const reply = z.object({
  author,
  body: z.string(),
  createdAt: z.string().optional(),
  replyTo: z.enum(['mumumu', 'chatgpt', 'codex', 'grok']).optional(),
})

export const trapPosts = defineCollection({
  loader: file('./src/collections/content/generated/trap-posts.json'),
  schema: z.object({
    date: z.string(),
    dateLabel: z.string(),
    title: z.string(),
    body: z.string(),
    readingMinutes: z.number(),
    tags: z.array(z.string()).optional(),
    href: z.url(),
    image: z.object({ asset: z.string(), alt: z.string() }).loose().optional(),
  }),
})

export const thoughts = defineCollection({
  loader: file(AI_CONTENT, {
    parser: (text) =>
      JSON.parse(text).thoughts.map((thought: object, order: number) =>
        Object.assign({}, thought, { order }),
      ),
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
        (comment: { target: { kind: string; id: string } }) =>
          Object.assign({}, comment, {
            id: `${comment.target.kind}:${comment.target.id}`,
          }),
      ),
  }),
  schema: z.object({
    target: z.object({ kind: z.enum(['work', 'experience']), id: z.string() }),
    replies: z.array(reply),
  }),
})

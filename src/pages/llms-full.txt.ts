import type { APIRoute } from 'astro'
import { blogRepository } from '@/repository/astro/blog'
import { workRepository } from '@/repository/astro/work'
import { toAgentMarkdown } from '@/repository/agent-markdown'

const blogSection = (
  post: Awaited<ReturnType<typeof blogRepository.listDocuments>>[number],
  site: URL,
): string[] => [
  `## ${post.data.title}`,
  '',
  `- URL: ${new URL(`/blog/${post.id}/`, site).href}`,
  `- Markdown: ${new URL(`/blog/${post.id}.md`, site).href}`,
  `- 公開日: ${post.data.publishedAt.toISOString().slice(0, 10)}`,
  `- 概要: ${post.data.description}`,
  '',
  toAgentMarkdown(post.body ?? ''),
  '',
]

const workSection = (
  work: Awaited<ReturnType<typeof workRepository.listDocuments>>[number],
  site: URL,
): string[] => [
  `## ${work.data.title}`,
  '',
  `- URL: ${new URL(`/works/${work.id}/`, site).href}`,
  `- Markdown: ${new URL(`/works/${work.id}.md`, site).href}`,
  `- 公開日: ${work.data.publishedAt.toISOString().slice(0, 10)}`,
  `- 概要: ${work.data.summary}`,
  '',
  ...(work.data.highlights.length > 0
    ? [
        '',
        '### 主な特徴',
        '',
        ...work.data.highlights.map((item) => `- ${item}`),
      ]
    : []),
  ...(work.data.links.length > 0
    ? [
        '',
        '### リンク',
        '',
        ...work.data.links.map((link) => `- [${link.label}](${link.href})`),
      ]
    : []),
  toAgentMarkdown(work.body ?? ''),
  '',
  '---',
  '',
]

export const GET: APIRoute = async ({ site }) => {
  if (!site)
    throw new Error('Configure site in astro.config to generate llms-full.txt.')

  const [posts, works] = await Promise.all([
    blogRepository.listDocuments(),
    workRepository.listDocuments(),
  ])
  const sections = [
    '# mumumu portfolio — 全文',
    '',
    '> 自サイトで公開しているブログ記事と制作物の本文です。外部サイトの記事本文は含めず、元のリンクを案内します。',
    '',
  ]
  for (const post of posts) sections.push(...blogSection(post, site))
  for (const work of works) sections.push(...workSection(work, site))

  return new Response(sections.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

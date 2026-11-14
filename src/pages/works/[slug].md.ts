import type { APIRoute, GetStaticPaths } from 'astro'
import { workRepository, type WorkDocument } from '@/repository/astro/work'
import { toAgentMarkdown } from '@/repository/agent-markdown'

export const getStaticPaths: GetStaticPaths = async () => {
  const works = await workRepository.listDocuments()

  return works.map((work) => ({
    params: { slug: work.id },
    props: { work },
  }))
}

export const GET: APIRoute = ({ props, site }) => {
  const { work } = props as { work: WorkDocument }
  const { title, summary, publishedAt, tags, highlights, links } = work.data
  const canonical = new URL(`/works/${work.id}/`, site)
  const markdown = [
    `# ${title}`,
    '',
    `- URL: ${canonical.href}`,
    `- 公開日: ${publishedAt.toISOString().slice(0, 10)}`,
    `- タグ: ${tags.join('、')}`,
    '',
    summary,
    ...(highlights.length > 0
      ? [
          '',
          '## 主な特徴',
          '',
          ...highlights.map((highlight) => `- ${highlight}`),
        ]
      : []),
    ...(links.length > 0
      ? [
          '',
          '## リンク',
          '',
          ...links.map((link) => `- [${link.label}](${link.href})`),
        ]
      : []),
    '',
    toAgentMarkdown(work.body ?? ''),
    '',
  ].join('\n')

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}

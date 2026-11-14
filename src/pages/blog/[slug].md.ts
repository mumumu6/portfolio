import type { APIRoute, GetStaticPaths } from 'astro'
import { blogRepository } from '@/repository/astro/blog'
import { toAgentMarkdown } from '@/repository/agent-markdown'

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await blogRepository.listDocuments()

  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }))
}

export const GET: APIRoute = ({ props, site }) => {
  const { post } = props
  const { title, description, publishedAt, updatedAt, tags = [] } = post.data
  const canonical = new URL(`/blog/${post.id}/`, site)
  const markdown = [
    `# ${title}`,
    '',
    `- URL: ${canonical.href}`,
    `- 公開日: ${publishedAt.toISOString().slice(0, 10)}`,
    ...(updatedAt ? [`- 更新日: ${updatedAt.toISOString().slice(0, 10)}`] : []),
    ...(tags.length > 0 ? [`- タグ: ${tags.join('、')}`] : []),
    '',
    description,
    '',
    toAgentMarkdown(post.body ?? ''),
    '',
  ].join('\n')

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}

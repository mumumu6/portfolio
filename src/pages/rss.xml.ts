import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { blogRepository } from '@/repository/astro/blog'

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Configure site in astro.config to generate RSS.')

  const posts = await blogRepository.listPosts()

  return rss({
    title: 'mumumuのブログ',
    description: 'mumumuの技術記事と制作記録。traP Blogの記事を含みます。',
    site,
    items: posts.map((post) => ({
      title: post.title ?? post.href ?? post.id,
      link: post.href ?? `/blog/${post.id}/`,
      pubDate: new Date(`${post.date}T00:00:00.000Z`),
      description: post.body,
      categories: post.tags,
    })),
  })
}

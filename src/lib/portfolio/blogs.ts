import { getCollection } from 'astro:content'
import generatedBlogPosts from '@/data/generated/blogs.json'
import { resolveBlogImage } from '@/lib/portfolio/images'
import type { BlogEntry } from '@/lib/portfolio/types'
import { estimateReadingMinutes } from '@/lib/portfolio/utils'

const localBlogPosts: BlogEntry[] = (await getCollection('blogs')).map(
  (post) => {
    const data = post.data
    const publishedAt = data.publishedAt.toISOString().slice(0, 10)

    return {
      id: post.id,
      kind: 'blog',
      author: 'mumumu',
      date: publishedAt,
      dateLabel: publishedAt.replaceAll('-', '.'),
      title: data.title,
      body: data.description,
      readingMinutes: estimateReadingMinutes(post.body ?? data.description),
      tags: data.tags,
      href: `/blog/${post.id}/`,
      sourceLabel: 'この記事を読む',
      image: {
        src: data.cover,
        alt: data.coverAlt,
      },
    }
  },
)

export const blogPosts: BlogEntry[] = [
  ...generatedBlogPosts.map<BlogEntry>((post) =>
    Object.assign({}, post, {
      image: resolveBlogImage(post.image),
      kind: 'blog' as const,
      author: 'mumumu' as const,
      sourceLabel: 'traP Blogで読む',
    }),
  ),
  ...localBlogPosts,
].toSorted((a, b) => b.date.localeCompare(a.date))

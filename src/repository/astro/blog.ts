import { getCollection, render, type CollectionEntry } from 'astro:content'
import { resolveBlogImage } from '@/repository/astro/images'
import { estimateReadingMinutes } from '@/repository/utils'
import type { BlogEntry, BlogRepository } from '@/repository/blog'

export type BlogDocument = CollectionEntry<'blogs'>
type RenderedBlogDocument = Awaited<ReturnType<typeof render>>

export const blogRepository: BlogRepository<
  BlogDocument,
  RenderedBlogDocument
> = {
  listDocuments: () => getCollection('blogs'),
  renderDocument: (post) => render(post),
  listPosts: async () => {
    const localPosts = (await getCollection('blogs')).map<BlogEntry>((post) => {
      const { data } = post
      const date = data.publishedAt.toISOString().slice(0, 10)

      return {
        id: post.id,
        kind: 'blog',
        author: 'mumumu',
        date,
        dateLabel: date.replaceAll('-', '.'),
        title: data.title,
        body: data.description,
        readingMinutes: estimateReadingMinutes(post.body ?? data.description),
        tags: data.tags,
        href: `/blog/${post.id}/`,
        sourceLabel: 'この記事を読む',
        image: { src: data.cover, alt: data.coverAlt },
      }
    })
    const syncedPosts = (await getCollection('trapPosts')).map<BlogEntry>(
      ({ id, data: post }) =>
        Object.assign({}, post, {
          id,
          kind: 'blog' as const,
          author: 'mumumu' as const,
          image: resolveBlogImage(post.image),
          sourceLabel: 'traP Blogで読む',
        }),
    )

    return [...syncedPosts, ...localPosts].toSorted((a, b) =>
      b.date.localeCompare(a.date),
    )
  },
}

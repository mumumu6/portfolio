import { getCollection } from 'astro:content';
import generatedBlogPosts from '@/data/generated/blog.json';
import { getAiReplies } from '@/lib/portfolio/ai';
import { resolveBlogImage } from '@/lib/portfolio/images';
import type { BlogFrontmatter, FeedEntry } from '@/lib/portfolio/types';
import { estimateReadingMinutes, toExcerpt } from '@/lib/portfolio/utils';

const localBlogPosts: FeedEntry[] = (await getCollection('blogs')).map((post) => {
  const data = post.data as BlogFrontmatter;
  const publishedAt = data.publishedAt.toISOString().slice(0, 10);

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
    linkLabel: '記事を読む',
    sourceLabel: 'この記事を読む',
    image: {
      src: data.cover,
      alt: data.coverAlt,
      width: data.coverWidth,
      height: data.coverHeight,
    },
    replies: getAiReplies('blog', post.id),
  };
});

export const blogPosts: FeedEntry[] = [
  ...generatedBlogPosts.map((post) => ({
    ...post,
    image: resolveBlogImage(post.image),
    body: toExcerpt(post.body),
    kind: 'blog' as const,
    author: 'mumumu' as const,
    href: `/blog/${post.id}/`,
    sourceHref: post.href,
    sourceLabel: 'traP Blogで読む',
    replies: getAiReplies('blog', post.id),
  })),
  ...localBlogPosts,
].sort((a, b) => b.date.localeCompare(a.date));

import { getCollection } from 'astro:content';
import { getAiReplies } from '@/lib/portfolio/ai';
import type { WorkEntry } from '@/lib/portfolio/types';

const workDocuments = await getCollection('works');

export const works: WorkEntry[] = workDocuments
  .map((work) => {
    const publishedAt = work.data.publishedAt.toISOString().slice(0, 10);
    const latestComment = work.data.comments.at(-1)!;

    return {
      id: work.id,
      kind: 'work' as const,
      author: 'mumumu' as const,
      date: publishedAt,
      dateLabel: publishedAt.slice(0, 7).replace('-', '.'),
      title: work.data.title,
      body: work.data.summary,
      tags: work.data.tags,
      href: `/works/${work.id}/`,
      linkLabel: '詳細を見る',
      image: work.data.cover,
      status: work.data.status,
      comment: {
        label: latestComment.label,
        body: latestComment.body,
        date: latestComment.date?.toISOString().slice(0, 10),
      },
      replies: getAiReplies('work', work.id),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

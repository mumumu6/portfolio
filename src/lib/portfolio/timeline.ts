import { getCollection } from 'astro:content';
import { getAiReplies } from '@/lib/portfolio/ai';
import type { FeedEntry } from '@/lib/portfolio/types';

export const getExperiences = async (): Promise<FeedEntry[]> => {
  const entries = await getCollection('experiences');

  return entries
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((entry) => ({
      id: entry.id,
      kind: 'experience' as const,
      author: 'mumumu' as const,
      date: entry.data.date.toISOString().slice(0, 10),
      dateLabel: entry.data.date.toISOString().slice(0, 7).replace('-', '.'),
      title: entry.data.title,
      body: entry.body?.trim() ?? '',
      tags: entry.data.tags,
      replies: getAiReplies('experience', entry.id),
    }));
};

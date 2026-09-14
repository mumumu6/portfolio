import { getCollection } from 'astro:content'
import { getAiReplies } from '@/lib/portfolio/ai'
import type { TimelineEntry } from '@/lib/portfolio/types'

export const getExperiences = async (): Promise<TimelineEntry[]> => {
  const entries = await getCollection('experiences')

  return entries
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map<TimelineEntry>((entry) => ({
      id: entry.id,
      kind: 'experience',
      author: 'mumumu',
      date: entry.data.date.toISOString().slice(0, 10),
      dateLabel: entry.data.date.toISOString().slice(0, 7).replace('-', '.'),
      title: entry.data.title,
      body: entry.body?.trim() ?? '',
      tags: entry.data.tags,
      replies: getAiReplies('experience', entry.id),
    }))
}

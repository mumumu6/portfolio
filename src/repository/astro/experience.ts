import { getCollection } from 'astro:content'
import { aiContentRepository } from '@/repository/astro/ai'
import type {
  ExperienceRepository,
  TimelineEntry,
} from '@/repository/experience'

export const experienceRepository: ExperienceRepository = {
  listExperiences: async () => {
    const entries = await getCollection('experiences')
    const sorted = entries.toSorted(
      (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
    )

    return Promise.all(
      sorted.map<Promise<TimelineEntry>>(async (entry) => ({
        id: entry.id,
        kind: 'experience',
        author: 'mumumu',
        date: entry.data.date.toISOString().slice(0, 10),
        dateLabel: entry.data.date.toISOString().slice(0, 7).replace('-', '.'),
        title: entry.data.title,
        body: entry.body?.trim() ?? '',
        tags: entry.data.tags,
        replies: await aiContentRepository.getReplies('experience', entry.id),
      })),
    )
  },
}

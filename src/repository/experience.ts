import type { EntryBase, Reply } from '@/repository/shared'

export type TimelineEntry = EntryBase & {
  kind: 'experience' | 'thought'
  replies?: Reply[] | undefined
}

export interface ExperienceRepository {
  listExperiences(): Promise<TimelineEntry[]>
}

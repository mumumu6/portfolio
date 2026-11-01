import type { EntryKind, Reply } from '@/repository/shared'
import type { TimelineEntry } from '@/repository/experience'

export interface AiContentRepository {
  listThoughts(): Promise<TimelineEntry[]>
  getReplies(
    kind: Extract<EntryKind, 'work' | 'experience'>,
    id: string,
  ): Promise<Reply[] | undefined>
}

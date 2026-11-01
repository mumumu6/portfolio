import { getCollection } from 'astro:content'
import type { AiContentRepository } from '@/repository/ai'
import type { TimelineEntry } from '@/repository/experience'
import type { EntryKind, Reply } from '@/repository/shared'

type AiCommentTargetKind = Extract<EntryKind, 'work' | 'experience'>

const repliesByTarget = new Map(
  (await getCollection('aiComments')).map((entry) => [
    entry.id,
    entry.data.replies,
  ]),
)

const thoughts: TimelineEntry[] = (await getCollection('thoughts'))
  .toSorted((a, b) => a.data.order - b.data.order)
  .map(({ id, data }) => {
    const { order: _order, ...thought } = data
    return Object.assign({}, thought, { id, kind: 'thought' as const })
  })

export const aiContentRepository: AiContentRepository = {
  listThoughts: () => Promise.resolve(thoughts),
  getReplies: (
    kind: AiCommentTargetKind,
    id: string,
  ): Promise<Reply[] | undefined> =>
    Promise.resolve(repliesByTarget.get(`${kind}:${id}`)),
}

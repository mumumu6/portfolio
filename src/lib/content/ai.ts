import { getCollection, getEntry } from 'astro:content'
import type { EntryKind, Reply, TimelineEntry } from '@/lib/portfolio/types'

type AiCommentTargetKind = Extract<EntryKind, 'work' | 'experience'>

export const getAiReplies = async (
  kind: AiCommentTargetKind,
  id: string,
): Promise<Reply[] | undefined> =>
  (await getEntry('aiComments', `${kind}:${id}`))?.data.replies

export const thoughts: TimelineEntry[] = (await getCollection('thoughts'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ id, data: { order: _order, ...thought } }) => ({
    id,
    ...thought,
    kind: 'thought',
  }))

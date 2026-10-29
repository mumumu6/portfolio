import { getCollection } from 'astro:content'
import type { EntryKind, Reply, TimelineEntry } from '@/lib/portfolio/types'

type AiCommentTargetKind = Extract<EntryKind, 'work' | 'experience'>

// getEntry はコメントが無い id でも警告を出す。無いのが普通なので、一覧から引く。
const repliesByTarget = new Map(
  (await getCollection('aiComments')).map((entry) => [
    entry.id,
    entry.data.replies,
  ]),
)

export const getAiReplies = async (
  kind: AiCommentTargetKind,
  id: string,
): Promise<Reply[] | undefined> => repliesByTarget.get(`${kind}:${id}`)

export const thoughts: TimelineEntry[] = (await getCollection('thoughts'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ id, data: { order: _order, ...thought } }) => ({
    id,
    ...thought,
    kind: 'thought',
  }))

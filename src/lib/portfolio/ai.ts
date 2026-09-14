import generatedAiContent from '@/data/generated/ai-content.json'
import type { EntryKind, Reply, TimelineEntry } from '@/lib/portfolio/types'

type PublishedAiContent = {
  comments: Array<{
    target: { kind: Exclude<EntryKind, 'thought'>; id: string }
    replies: Reply[]
  }>
  thoughts: Array<Omit<TimelineEntry, 'kind'>>
}

const aiContent = generatedAiContent as PublishedAiContent

export const getAiReplies = (kind: Exclude<EntryKind, 'thought'>, id: string) =>
  aiContent.comments.find(
    (comment) => comment.target.kind === kind && comment.target.id === id,
  )?.replies

export const thoughts: TimelineEntry[] = aiContent.thoughts.map((thought) => ({
  ...thought,
  kind: 'thought',
}))

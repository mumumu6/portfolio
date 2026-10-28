import type { Reply, WorkThreadItem } from '@/lib/portfolio/types'

export type WorkComment = {
  label: string
  body: string
  date?: Date | undefined
}

export const getLatestWorkComment = (comments: readonly WorkComment[]) =>
  comments.reduce<WorkComment | undefined>((latest, comment) => {
    if (!latest) return comment

    const latestTime = latest.date?.getTime() ?? Number.NEGATIVE_INFINITY
    const commentTime = comment.date?.getTime() ?? Number.NEGATIVE_INFINITY
    return commentTime >= latestTime ? comment : latest
  }, undefined)

export const buildWorkThreadItems = (
  comments: readonly WorkComment[],
  aiReplies: readonly Reply[],
  publishedAt: Date,
): WorkThreadItem[] => {
  const publishedDate = publishedAt.toISOString().slice(0, 10)
  const makerReplies = comments.map((comment) => ({
    ...comment,
    date: comment.date ?? publishedAt,
  }))

  return [
    ...makerReplies.map<WorkThreadItem>((reply, index) => ({
      kind: 'maker',
      author: 'mumumu',
      body: reply.body,
      label: reply.label,
      date: reply.date.toISOString().slice(0, 10),
      replyTo: undefined,
      sourceOrder: index,
    })),
    ...aiReplies.map<WorkThreadItem>((reply, index) => ({
      kind: 'ai',
      author: reply.author,
      body: reply.body,
      label: undefined,
      date: reply.createdAt ?? publishedDate,
      replyTo: reply.replyTo,
      sourceOrder: comments.length + index,
    })),
  ].sort(
    (a, b) => a.date.localeCompare(b.date) || a.sourceOrder - b.sourceOrder,
  )
}

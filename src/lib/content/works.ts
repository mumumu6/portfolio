import { getCollection } from 'astro:content'
import type { WorkEntry } from '@/lib/portfolio/types'
import { getLatestWorkComment } from '@/lib/portfolio/work-thread'

const workDocuments = await getCollection('works')

export const works: WorkEntry[] = workDocuments
  .map<WorkEntry>((work) => {
    const publishedAt = work.data.publishedAt.toISOString().slice(0, 10)
    const latestComment = getLatestWorkComment(work.data.comments)

    return {
      id: work.id,
      kind: 'work',
      author: 'mumumu',
      date: publishedAt,
      dateLabel: publishedAt.slice(0, 7).replace('-', '.'),
      title: work.data.title,
      body: work.data.summary,
      href: `/works/${work.id}/`,
      image: work.data.cover,
      status: work.data.status,
      comment: latestComment
        ? {
            label: latestComment.label,
            body: latestComment.body,
            date: latestComment.date?.toISOString().slice(0, 10),
          }
        : undefined,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

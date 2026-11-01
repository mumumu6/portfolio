import { getCollection, render, type CollectionEntry } from 'astro:content'
import type { WorkEntry, WorkRepository } from '@/repository/work'

export type WorkDocument = CollectionEntry<'works'>
type RenderedWorkDocument = Awaited<ReturnType<typeof render>>

export const workRepository: WorkRepository<
  WorkDocument,
  RenderedWorkDocument
> = {
  listDocuments: () => getCollection('works'),
  renderDocument: (work) => render(work),
  listWorks: async () =>
    (await getCollection('works'))
      .map<WorkEntry>((work) => {
        const publishedAt = work.data.publishedAt.toISOString().slice(0, 10)
        const latestComment = work.data.comments.at(-1)
        if (!latestComment)
          throw new Error(`Work ${work.id} must include at least one comment.`)

        return {
          id: work.id,
          kind: 'work',
          author: 'mumumu',
          date: publishedAt,
          dateLabel: publishedAt.slice(0, 7).replace('-', '.'),
          title: work.data.title,
          body: work.data.summary,
          tags: work.data.tags,
          href: `/works/${work.id}/`,
          image: work.data.cover,
          status: work.data.status,
          comment: {
            label: latestComment.label,
            body: latestComment.body,
            date: latestComment.date?.toISOString().slice(0, 10),
          },
        }
      })
      .toSorted((a, b) => b.date.localeCompare(a.date)),
}

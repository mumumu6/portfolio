import type { EntryBase, FeedImage } from '@/repository/shared'

export type WorkStatus = 'active' | 'wip' | 'paused' | 'archived'

export const statusLabels = {
  active: '公開中',
  wip: '開発中',
  paused: '更新停止中',
  archived: '旧版',
} satisfies Record<WorkStatus, string>

export type WorkEntry = EntryBase & {
  kind: 'work'
  title: string
  href: string
  image: FeedImage
  status: WorkStatus
  comment: {
    label: string
    body: string
    date?: string | undefined
  }
}

export interface WorkRepository<Document, RenderedDocument> {
  listWorks(): Promise<WorkEntry[]>
  listDocuments(): Promise<Document[]>
  renderDocument(document: Document): Promise<RenderedDocument>
}

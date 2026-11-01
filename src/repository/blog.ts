import type { EntryBase } from '@/repository/shared'

export type BlogEntry = EntryBase & {
  kind: 'blog'
}

export interface BlogRepository<Document, RenderedDocument> {
  listPosts(): Promise<BlogEntry[]>
  listDocuments(): Promise<Document[]>
  renderDocument(document: Document): Promise<RenderedDocument>
}

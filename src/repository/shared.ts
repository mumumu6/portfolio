import type { ImageMetadata } from 'astro'

export type AuthorId = 'mumumu' | 'chatgpt' | 'codex' | 'grok'
export type EntryKind = 'work' | 'blog' | 'experience' | 'thought'

export type Reply = {
  author: AuthorId
  body: string
  createdAt?: string | undefined
  replyTo?: AuthorId | undefined
}

export type FeedImage = {
  src: ImageMetadata
  alt: string
}

export type EntryBase = {
  id: string
  author: AuthorId
  date: string
  dateLabel: string
  title?: string | undefined
  body: string
  tags?: string[] | undefined
  href?: string | undefined
  sourceLabel?: string | undefined
  readingMinutes?: number | undefined
  image?: FeedImage | undefined
}

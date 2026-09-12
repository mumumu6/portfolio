import type { WorkStatus } from '@/lib/portfolio/constants'
import type { ImageMetadata } from 'astro'

export type AuthorId = 'mumumu' | 'chatgpt' | 'codex'
export type EntryKind = 'work' | 'blog' | 'experience' | 'thought'

export type Reply = {
  author: Exclude<AuthorId, 'mumumu'>
  body: string
  createdAt?: string | undefined
  replyTo?: AuthorId | undefined
}

export type FeedImage = {
  src: ImageMetadata
  alt: string
}

export type FeedEntry = {
  id: string
  kind: EntryKind
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
  replies?: Reply[] | undefined
}

export type WorkEntry = FeedEntry & {
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

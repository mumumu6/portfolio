import type { WorkStatus } from '@/lib/portfolio/constants'
import type { ImageMetadata } from 'astro'

export type AuthorId = 'mumumu' | 'chatgpt' | 'codex'
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

type EntryBase = {
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
  replies?: Reply[] | undefined
}

export type BlogEntry = EntryBase & {
  kind: 'blog'
}

export type TimelineEntry = EntryBase & {
  kind: 'experience' | 'thought'
}

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

export type PortfolioEntry = BlogEntry | TimelineEntry | WorkEntry

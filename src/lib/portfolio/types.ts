import type { WorkStatus } from '@/lib/portfolio/constants'
import type { ImageMetadata } from 'astro'

export type AuthorId = 'mumumu' | 'chatgpt' | 'codex'
export type EntryKind = 'work' | 'blog' | 'experience' | 'thought'

export type Reply = {
  author: Exclude<AuthorId, 'mumumu'>
  body: string
  createdAt?: string | undefined
  replyTo?: AuthorId | undefined
  /** Legacy nesting hint retained while older generated content is migrated. */
  depth?: 1 | 2 | undefined
}

export type FeedImage = {
  src: ImageMetadata
  alt: string
  width?: number | undefined
  height?: number | undefined
  source?: string | undefined
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
  linkLabel?: string | undefined
  sourceHref?: string | undefined
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

export type BlogFrontmatter = {
  title: string
  description: string
  publishedAt: Date
  updatedAt?: Date | undefined
  tags?: string[] | undefined
  cover: ImageMetadata
  coverAlt: string
  coverWidth: number
  coverHeight: number
}

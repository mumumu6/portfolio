import type { WorkStatus } from '@/lib/portfolio/constants';
import type { ImageMetadata } from 'astro';

export type AuthorId = 'mumumu' | 'chatgpt' | 'codex';
export type EntryKind = 'work' | 'blog' | 'experience' | 'thought';

export type Reply = {
  author: Exclude<AuthorId, 'mumumu'>;
  body: string;
  createdAt?: string;
  replyTo?: AuthorId;
  /** Legacy nesting hint retained while older generated content is migrated. */
  depth?: 1 | 2;
};

export type FeedImage = {
  src: ImageMetadata;
  variants?: Array<{
    width: number;
    avif: ImageMetadata;
    webp: ImageMetadata;
  }>;
  alt: string;
  width?: number;
  height?: number;
  source?: string;
};

export type FeedEntry = {
  id: string;
  kind: EntryKind;
  author: AuthorId;
  date: string;
  dateLabel: string;
  title?: string;
  body: string;
  tags?: string[];
  href?: string;
  linkLabel?: string;
  sourceHref?: string;
  sourceLabel?: string;
  readingMinutes?: number;
  image?: FeedImage;
  replies?: Reply[];
};

export type WorkEntry = FeedEntry & {
  kind: 'work';
  title: string;
  href: string;
  image: FeedImage;
  status: WorkStatus;
  comment: {
    label: string;
    body: string;
    date?: string;
  };
};

export type BlogFrontmatter = {
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags?: string[];
  cover: ImageMetadata;
  coverAlt: string;
  coverWidth: number;
  coverHeight: number;
};

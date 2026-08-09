import { getCollection } from 'astro:content';
import generatedBlogPosts from './generated/blog.json';
import generatedAiContent from './generated/ai-content.json';

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
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    srcset?: Array<{ src: string; width: number }>;
    source?: string;
  };
  replies?: Reply[];
};

export type WorkEntry = FeedEntry & {
  kind: 'work';
  title: string;
  href: string;
  image: NonNullable<FeedEntry['image']>;
  status: 'active' | 'paused' | 'archived';
  note: string;
};

type PublishedAiContent = {
  comments: Array<{
    target: { kind: Exclude<EntryKind, 'thought'>; id: string };
    replies: Reply[];
  }>;
  thoughts: Array<Omit<FeedEntry, 'kind'>>;
};

const aiContent = generatedAiContent as PublishedAiContent;
const getAiReplies = (kind: Exclude<EntryKind, 'thought'>, id: string) =>
  aiContent.comments.find((comment) => comment.target.kind === kind && comment.target.id === id)?.replies;

export const profile = {
  name: 'mumumu',
  bio: 'Webサイトを作って遊んでいます。競プロや機械学習、Kaggleにも興味があります。',
  affiliations: ['東京科学大学 情報理工学院', 'デジタル創作同好会 traP'],
  links: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/mumumu6' },
    { label: 'X', icon: 'x', href: 'https://twitter.com/mumumu_no_mu66' },
  ],
};

const workDocuments = await getCollection('works');

export const works: WorkEntry[] = workDocuments
  .map((work) => {
    const publishedAt = work.data.publishedAt.toISOString().slice(0, 10);
    return {
      id: work.id,
      kind: 'work' as const,
      author: 'mumumu' as const,
      date: publishedAt,
      dateLabel: publishedAt.slice(0, 7).replace('-', '.'),
      title: work.data.title,
      body: work.data.summary,
      tags: work.data.tags,
      href: `/works/${work.id}`,
      linkLabel: '詳細を見る',
      image: work.data.cover,
      status: work.data.status,
      note: work.data.updates.at(-1)?.body ?? work.data.note,
      replies: getAiReplies('work', work.id),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export type BlogFrontmatter = {
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags?: string[];
  cover: string;
  coverAlt: string;
  coverWidth: number;
  coverHeight: number;
};

const localBlogPosts: FeedEntry[] = (await getCollection('blog')).map((post) => {
  const data = post.data as BlogFrontmatter;
  const publishedAt = data.publishedAt.toISOString().slice(0, 10);
  return {
    id: post.id,
    kind: 'blog',
    author: 'mumumu',
    date: publishedAt,
    dateLabel: publishedAt.replaceAll('-', '.'),
    title: data.title,
    body: data.description,
    tags: data.tags,
    href: `/blog/${post.id}`,
    linkLabel: '記事を読む',
    image: {
      src: data.cover,
      alt: data.coverAlt,
      width: data.coverWidth,
      height: data.coverHeight,
    },
    replies: getAiReplies('blog', post.id),
  };
});

export const blogPosts: FeedEntry[] = [
  ...generatedBlogPosts.map((post) => ({
    ...post,
    kind: 'blog' as const,
    author: 'mumumu' as const,
    replies: getAiReplies('blog', post.id),
  })),
  ...localBlogPosts,
].sort((a, b) => b.date.localeCompare(a.date));

export const experiences: FeedEntry[] = [
  {
    id: 'llm-competition-2025',
    kind: 'experience',
    author: 'mumumu',
    date: '2025-07-01',
    dateLabel: '2025.07',
    title: '松尾研 LLM開発コンペ 2025',
    body: 'LLM開発コンペに参加し、12チーム中5位になりました。',
    tags: ['LLM', 'Competition'],
  },
  {
    id: 'joined-trap',
    kind: 'experience',
    author: 'mumumu',
    date: '2024-04-02',
    dateLabel: '2024.04',
    title: 'デジタル創作同好会 traPに入部',
    body: 'チーム開発や技術記事、イベントを通して、作って公開する活動を始めました。',
  },
  {
    id: 'entered-science-tokyo',
    kind: 'experience',
    author: 'mumumu',
    date: '2024-04-01',
    dateLabel: '2024.04',
    title: '東京工業大学 情報理工学院に入学',
    body: '情報工学を学びながら、Web開発や機械学習に取り組んでいます。',
  },
  {
    id: 'graduated-high-school',
    kind: 'experience',
    author: 'mumumu',
    date: '2024-03-01',
    dateLabel: '2024.03',
    title: '高校卒業',
    body: 'ここから現在の活動へつながっています。',
  },
].map((entry) => ({ ...entry, replies: getAiReplies('experience', entry.id) })) as FeedEntry[];

export const thoughts: FeedEntry[] = aiContent.thoughts.map((thought) => ({
  ...thought,
  kind: 'thought',
}));

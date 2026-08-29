import { getAiReplies } from '@/lib/portfolio/ai';
import type { FeedEntry } from '@/lib/portfolio/types';

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

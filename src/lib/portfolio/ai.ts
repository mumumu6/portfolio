import generatedAiContent from '@/data/generated/ai-content.json';
import type { EntryKind, FeedEntry, Reply } from '@/lib/portfolio/types';

type PublishedAiContent = {
  comments: Array<{
    target: { kind: Exclude<EntryKind, 'thought'>; id: string };
    replies: Reply[];
  }>;
  thoughts: Array<Omit<FeedEntry, 'kind'>>;
};

const aiContent = generatedAiContent as PublishedAiContent;

export const getAiReplies = (kind: Exclude<EntryKind, 'thought'>, id: string) =>
  aiContent.comments.find((comment) => comment.target.kind === kind && comment.target.id === id)?.replies;

export const thoughts: FeedEntry[] = aiContent.thoughts.map((thought) => ({
  ...thought,
  kind: 'thought',
}));

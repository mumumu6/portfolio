import type { AuthorId, Reply } from '@/lib/portfolio/types';

export const authorNames = {
  mumumu: 'mumumu',
  chatgpt: 'ChatGPT',
  codex: 'Codex',
} satisfies Record<AuthorId, string>;

export const formatReplyDate = (value?: string | Date) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value.toISOString() : value;
  return date.slice(0, 10).replaceAll('-', '.');
};

export const resolveReplyTo = (replies: Reply[], index: number) => {
  const reply = replies[index];
  if (!reply) return undefined;
  if (reply.replyTo) {
    return reply.replyTo;
  }

  if (reply.depth === 2) {
    const previous = replies[index - 1];
    if (previous) {
      return previous.author;
    }
  }
  return undefined;
};

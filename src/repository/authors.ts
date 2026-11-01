import type { AuthorId } from '@/repository/shared'

export const authorNames = {
  mumumu: 'mumumu',
  chatgpt: 'ChatGPT',
  codex: 'Codex',
  grok: 'Grok Bot',
} satisfies Record<AuthorId, string>

export const formatReplyDate = (value?: string | Date) => {
  if (!value) return
  const date = value instanceof Date ? value.toISOString() : value
  return date.slice(0, 10).replaceAll('-', '.')
}

import type { AuthorId } from '@/lib/portfolio/types'

export const authorNames = {
  mumumu: 'mumumu',
  chatgpt: 'ChatGPT',
  codex: 'Codex',
} satisfies Record<AuthorId, string>

export const formatReplyDate = (value?: string | Date) => {
  if (!value) return undefined
  const date = value instanceof Date ? value.toISOString() : value
  return date.slice(0, 10).replaceAll('-', '.')
}

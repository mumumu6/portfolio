export const toExcerpt = (value: string) => {
  const text = value.trim().replace(/[.…]+$/u, '')
  return text ? `${text}…` : ''
}

export const estimateReadingMinutes = (value: string) => {
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const japaneseCharacters =
    text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)
      ?.length ?? 0
  const otherWords = text
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(japaneseCharacters / 500 + otherWords / 200))
}

export const groupEntriesByPeriod = <T extends { date: string }>(
  entries: T[],
  getPeriod: (entry: T) => string,
) => {
  const grouped = entries.reduce<Record<string, T[]>>((groups, entry) => {
    const period = getPeriod(entry)
    ;(groups[period] ??= []).push(entry)
    return groups
  }, {})

  return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
}

export const estimateReadingMinutes = (value: string) => {
  const text = value
    .replaceAll(/<[^>]*>/gu, ' ')
    .replaceAll(/!\[[^\]]*\]\([^)]*\)/gu, ' ')
    .replaceAll(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replaceAll(/[`*_>#~|-]/gu, ' ')
    .replaceAll(/\s+/gu, ' ')
    .trim()
  const japaneseCharacters =
    text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)
      ?.length ?? 0
  const otherWords = text
    .replaceAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ')
    .split(/\s+/u)
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

  return Object.entries(grouped).toSorted(([a], [b]) => b.localeCompare(a))
}

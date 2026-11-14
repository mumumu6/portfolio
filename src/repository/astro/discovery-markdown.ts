/** Convert the small set of presentation components used in MDX into readable Markdown. */
export const toDiscoveryMarkdown = (source: string): string =>
  source
    .replaceAll(/^import\s.+\n/gmu, '')
    .replaceAll(/<ResponsivePair\s*>|<\/ResponsivePair>/gu, '')
    .replaceAll(
      /<ResponsiveImage\b([\s\S]*?)\s*\/>/gu,
      (_match, attributes: string) => {
        const alt = attributes.match(/\balt="([^"]*)"/u)?.[1]
        return alt ? `\nImage: ${alt}\n` : ''
      },
    )
    .replaceAll(
      /<LinkPreviewCard\b([\s\S]*?)\s*\/>/gu,
      (_match, attributes: string) => {
        const href = attributes.match(/\bhref="([^"]*)"/u)?.[1]
        const label = attributes.match(/\blabel="([^"]*)"/u)?.[1]
        return href ? `[${label || href}](${href})` : ''
      },
    )
    .replaceAll(
      /<YouTubeEmbed\b[^>]*\bid="([^"]+)"[^>]*\s*\/>/gu,
      (_match, id: string) => `https://www.youtube.com/watch?v=${id}`,
    )
    .replaceAll(/<\/?div\s*>/gu, '')
    .replaceAll(/\n{3,}/gu, '\n\n')
    .trim()

/** Convert the MDX subset used by this site into portable, readable Markdown. */
export const toAgentMarkdown = (source: string): string =>
  source
    // MDX imports are implementation details and are not Markdown.
    .replaceAll(/^import\s.+?\sfrom\s+['"][^'"]+['"]\s*;?\s*$/gmu, '')
    // Preserve the destination of visual link cards as a regular Markdown link.
    .replaceAll(
      /<LinkPreviewCard\b([\s\S]*?)\s*\/>/gu,
      (_match, attributes: string) => {
        const href = attributes.match(/\bhref="([^"]+)"/u)?.[1]
        return href ? `[${href}](${href})` : ''
      },
    )
    // Turn image components into useful alt text instead of exposing JSX.
    .replaceAll(
      /<ResponsiveImage\b([\s\S]*?)\s*\/>/gu,
      (_match, attributes: string) => {
        const alt = attributes.match(/\balt="([^"]*)"/u)?.[1]
        return alt ? `\n\n> 画像: ${alt}\n\n` : ''
      },
    )
    // Preserve video destinations when removing the presentation component.
    .replaceAll(
      /<YouTubeEmbed\b([\s\S]*?)\s*\/>/gu,
      (_match, attributes: string) => {
        const id = attributes.match(/\bid="([^"]+)"/u)?.[1]
        return id ? `[YouTube動画](https://www.youtube.com/watch?v=${id})` : ''
      },
    )
    // These wrappers only arrange visual layout; their child content is useful.
    .replaceAll(
      /<ResponsivePair\s*>([\s\S]*?)<\/ResponsivePair>/gu,
      (_match, content: string) =>
        content.replaceAll(/<\/?div\s*>/gu, '').replaceAll(/^  /gmu, ''),
    )
    .replaceAll(/\n{3,}/gu, '\n\n')
    .trim()

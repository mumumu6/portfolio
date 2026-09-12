type OgpData = {
  title?: string
  description?: string
  image?: string
  imageWidth?: number
  imageHeight?: number
  siteName?: string
}

const cache = new Map<string, Promise<OgpData>>()

const decodeHtml = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")

const getMetaContent = (html: string, property: string) => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedProperty}["'][^>]+content=["']([^"']*)["'][^>]*>` +
      `|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapedProperty}["'][^>]*>`,
    'i',
  )
  const match = html.match(pattern)
  return match?.[1] ?? match?.[2]
}

const getTitle = (html: string) =>
  html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]

const loadOgp = async (href: string): Promise<OgpData> => {
  try {
    const response = await fetch(href, {
      headers: { accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return {}

    const html = (await response.text()).slice(0, 1_000_000)
    const title = getMetaContent(html, 'og:title') ?? getTitle(html)
    const description =
      getMetaContent(html, 'og:description') ??
      getMetaContent(html, 'description')
    const image = getMetaContent(html, 'og:image')
    const imageWidth = Number(getMetaContent(html, 'og:image:width'))
    const imageHeight = Number(getMetaContent(html, 'og:image:height'))
    const siteName = getMetaContent(html, 'og:site_name')
    const data: OgpData = {}

    if (title?.trim()) data.title = decodeHtml(title.trim())
    if (description?.trim()) data.description = decodeHtml(description.trim())
    if (image) data.image = new URL(image, href).href
    if (Number.isFinite(imageWidth) && imageWidth > 0)
      data.imageWidth = imageWidth
    if (Number.isFinite(imageHeight) && imageHeight > 0)
      data.imageHeight = imageHeight
    if (siteName?.trim()) data.siteName = decodeHtml(siteName.trim())

    return data
  } catch {
    return {}
  }
}

export const getOgp = (href: string) => {
  const cached = cache.get(href)
  if (cached) return cached

  const request = loadOgp(href)
  cache.set(href, request)
  return request
}

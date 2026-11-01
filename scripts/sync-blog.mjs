import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { XMLParser } from 'fast-xml-parser'
import sharp from 'sharp'

const RSS_URL = 'https://trap.jp/author/mumumu/rss/'
const MAX_POSTS = 20
const IMAGE_TRANSFORM_VERSION = 6
const BLOG_IMAGE_WIDTHS = [1440]
const BLOG_IMAGE_FORMATS = ['webp']
const root = fileURLToPath(new URL('..', import.meta.url))
const outputFile = path.join(
  root,
  'src/collections/content/generated/trap-posts.json',
)
const imageDirectory = path.join(root, 'src/assets/images/blog')

const asArray = (value) =>
  value === null || value === undefined
    ? []
    : Array.isArray(value)
      ? value
      : [value]
const asText = (value) =>
  typeof value === 'string' ? value : String(value ?? '')

const cleanText = (value) =>
  asText(value)
    .replaceAll(/<[^>]*>/gu, ' ')
    .replaceAll(/&#x([0-9a-f]+);/giu, (_, hexCode) =>
      String.fromCodePoint(Number.parseInt(hexCode, 16)),
    )
    .replaceAll(/&#([0-9]+);/gu, (_, decimalCode) =>
      String.fromCodePoint(Number(decimalCode)),
    )
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll(/\s+/gu, ' ')
    .trim()

const excerpt = (value, limit = 140) => {
  const characters = [...cleanText(value)]
  const clipped = characters.slice(0, limit).join('')
  const sentenceEnds = [...clipped.matchAll(/[。！？!?]/gu)]
  const lastSentenceEnd = sentenceEnds.at(-1)?.index
  const text = (
    lastSentenceEnd !== undefined && lastSentenceEnd >= 48
      ? clipped.slice(0, lastSentenceEnd + 1)
      : clipped
  ).replace(/[.…]+$/u, '')
  return text ? `${text}…` : ''
}

const estimateReadingMinutes = (value) => {
  const text = cleanText(value)
  const japaneseCharacters =
    text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)
      ?.length ?? 0
  const otherWords = text
    .replaceAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ')
    .split(/\s+/u)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(japaneseCharacters / 500 + otherWords / 200))
}

const formatDate = (value) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const get = (type) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

const readPreviousPosts = async () => {
  try {
    return JSON.parse(await readFile(outputFile, 'utf8'))
  } catch {
    return []
  }
}

const downloadImage = async (url, id) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'mumumu-portfolio-blog-sync/1.0' },
  })
  if (!response.ok)
    throw new Error(`OGP image fetch failed (${response.status}): ${url}`)

  const source = Buffer.from(await response.arrayBuffer())
  const pipeline = sharp(source).rotate()
  const asset = `trap-${id}`

  await Promise.all(
    BLOG_IMAGE_WIDTHS.flatMap((width) =>
      BLOG_IMAGE_FORMATS.map(async (format) => {
        const filename = `${asset}-${width}.${format}`
        const resized = pipeline
          .clone()
          .resize({ width, withoutEnlargement: true })
        const encoded =
          format === 'avif'
            ? resized.avif({ quality: 55, effort: 5 })
            : resized.webp({ quality: width === 1440 ? 88 : 84, effort: 5 })
        await encoded.toFile(path.join(imageDirectory, filename))
      }),
    ),
  )

  return {
    asset,
    source: url,
    transformVersion: IMAGE_TRANSFORM_VERSION,
  }
}

const response = await fetch(RSS_URL, {
  headers: { 'user-agent': 'mumumu-portfolio-blog-sync/1.0' },
})
if (!response.ok)
  throw new Error(`RSS fetch failed (${response.status}): ${RSS_URL}`)

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  processEntities: true,
})
const feed = parser.parse(await response.text())
const items = asArray(feed?.rss?.channel?.item).slice(0, MAX_POSTS)
const previousPosts = await readPreviousPosts()
const previousById = new Map(previousPosts.map((post) => [post.id, post]))

await mkdir(path.dirname(outputFile), { recursive: true })
await mkdir(imageDirectory, { recursive: true })
const existingFiles = new Set(await readdir(imageDirectory))

const posts = []
for (const item of items) {
  const href = asText(item.link)
  const url = new URL(href)
  const rawId =
    url.pathname.split('/').findLast((segment) => segment !== '') ??
    asText(item.guid)
  const postId = rawId.replaceAll(/[^a-zA-Z0-9-]/gu, '')
  if (!postId) throw new Error(`Could not determine post id: ${href}`)

  const id = `trap-${postId}`
  const media = asArray(item['media:content'])[0]
  const imageUrl = asText(media?.['@_url'])
  const previousImage = previousById.get(id)?.image
  let image

  if (imageUrl) {
    const expectedFiles = BLOG_IMAGE_WIDTHS.flatMap((width) =>
      BLOG_IMAGE_FORMATS.map((format) => `trap-${postId}-${width}.${format}`),
    )
    const canReuse =
      previousImage?.source === imageUrl &&
      previousImage?.transformVersion === IMAGE_TRANSFORM_VERSION &&
      expectedFiles.every((file) => existingFiles.has(file))
    let generated = previousImage
    if (!canReuse) {
      // Keep image downloads sequential to avoid sending a burst of requests to the source host.
      // eslint-disable-next-line no-await-in-loop -- Preserve sequential downloads.
      generated = await downloadImage(imageUrl, postId)
      for (const file of expectedFiles) existingFiles.add(file)
    }
    image = { ...generated, alt: cleanText(item.title) }
  }

  const date = formatDate(item.pubDate)
  const description = cleanText(item.description)
  const excerptSource = /[。！？.!?]$/u.test(description)
    ? description
    : (item['content:encoded'] ?? item.description)
  posts.push({
    id,
    date,
    dateLabel: date.replaceAll('-', '.'),
    title: cleanText(item.title),
    body: excerpt(excerptSource),
    readingMinutes: estimateReadingMinutes(
      item['content:encoded'] ?? item.description,
    ),
    tags: asArray(item.category)
      .map((category) => cleanText(category))
      .filter(Boolean)
      .slice(0, 4),
    href,
    ...(image ? { image } : {}),
  })
}

const activeImages = new Set(
  posts
    .map((post) => post.image?.asset)
    .filter(Boolean)
    .flatMap((asset) =>
      BLOG_IMAGE_WIDTHS.flatMap((width) =>
        BLOG_IMAGE_FORMATS.map((format) => `${asset}-${width}.${format}`),
      ),
    ),
)
const staleImages = (await readdir(imageDirectory)).filter(
  (file) =>
    /^trap-[a-zA-Z0-9-]+-\d+\.(?:avif|webp)$/u.test(file) &&
    !activeImages.has(file),
)
await Promise.all(
  staleImages.map((file) => rm(path.join(imageDirectory, file))),
)

await writeFile(outputFile, `${JSON.stringify(posts, null, 2)}\n`)
console.log(`Synced ${posts.length} posts from ${RSS_URL}`)

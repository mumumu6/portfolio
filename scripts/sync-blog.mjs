import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import sharp from 'sharp';

const RSS_URL = 'https://trap.jp/author/mumumu/rss/';
const MAX_POSTS = 20;
const IMAGE_TRANSFORM_VERSION = 2;
const root = fileURLToPath(new URL('..', import.meta.url));
const outputFile = path.join(root, 'src/data/generated/blog.json');
const imageDirectory = path.join(root, 'public/images/blog');

const asArray = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const asText = (value) => typeof value === 'string' ? value : String(value ?? '');

const cleanText = (value) => asText(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
  .replace(/&#([0-9]+);/g, (_, value) => String.fromCodePoint(Number.parseInt(value, 10)))
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const excerpt = (value, limit = 140) => {
  const characters = [...cleanText(value)];
  const clipped = characters.slice(0, limit).join('');
  const sentenceEnds = [...clipped.matchAll(/[。！？!?]/gu)];
  const lastSentenceEnd = sentenceEnds.at(-1)?.index;
  const text = (lastSentenceEnd !== undefined && lastSentenceEnd >= 48
    ? clipped.slice(0, lastSentenceEnd + 1)
    : clipped
  ).replace(/[.…]+$/u, '');
  return text ? `${text}…` : '';
};

const estimateReadingMinutes = (value) => {
  const text = cleanText(value);
  const japaneseCharacters = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
  const otherWords = text
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(japaneseCharacters / 500 + otherWords / 200));
};

const formatDate = (value) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

const readPreviousPosts = async () => {
  try {
    return JSON.parse(await readFile(outputFile, 'utf8'));
  } catch {
    return [];
  }
};

const downloadImage = async (url, id) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'mumumu-portfolio-blog-sync/1.0' },
  });
  if (!response.ok) throw new Error(`OGP image fetch failed (${response.status}): ${url}`);

  const source = Buffer.from(await response.arrayBuffer());
  const smallName = `trap-${id}-480.webp`;
  const largeName = `trap-${id}-1024.webp`;
  const pipeline = sharp(source).rotate();

  const [, large] = await Promise.all([
    pipeline.clone().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toFile(path.join(imageDirectory, smallName)),
    pipeline.clone().resize({ width: 1024, withoutEnlargement: true }).webp({ quality: 88, effort: 5 }).toFile(path.join(imageDirectory, largeName)),
  ]);

  return {
    src: `/images/blog/${largeName}`,
    width: large.width,
    height: large.height,
    srcset: [
      { src: `/images/blog/${smallName}`, width: 480 },
      { src: `/images/blog/${largeName}`, width: 1024 },
    ],
    source: url,
    transformVersion: IMAGE_TRANSFORM_VERSION,
  };
};

const response = await fetch(RSS_URL, {
  headers: { 'user-agent': 'mumumu-portfolio-blog-sync/1.0' },
});
if (!response.ok) throw new Error(`RSS fetch failed (${response.status}): ${RSS_URL}`);

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true, processEntities: true });
const feed = parser.parse(await response.text());
const items = asArray(feed?.rss?.channel?.item).slice(0, MAX_POSTS);
const previousPosts = await readPreviousPosts();
const previousById = new Map(previousPosts.map((post) => [post.id, post]));

const withImageDimensions = async (image) => {
  if (image.width && image.height) return image;
  const metadata = await sharp(path.join(root, 'public', image.src.replace(/^\//, ''))).metadata();
  return { ...image, width: metadata.width, height: metadata.height };
};

await mkdir(path.dirname(outputFile), { recursive: true });
await mkdir(imageDirectory, { recursive: true });

const posts = [];
for (const item of items) {
  const href = asText(item.link);
  const url = new URL(href);
  const rawId = url.pathname.split('/').filter(Boolean).at(-1) ?? asText(item.guid);
  const postId = rawId.replace(/[^a-zA-Z0-9-]/g, '');
  if (!postId) throw new Error(`Could not determine post id: ${href}`);

  const id = `trap-${postId}`;
  const media = asArray(item['media:content'])[0];
  const imageUrl = asText(media?.['@_url']);
  const previousImage = previousById.get(id)?.image;
  let image;

  if (imageUrl) {
    const expectedFiles = [`trap-${postId}-480.webp`, `trap-${postId}-1024.webp`];
    const existingFiles = new Set(await readdir(imageDirectory));
    const canReuse = previousImage?.source === imageUrl
      && previousImage?.transformVersion === IMAGE_TRANSFORM_VERSION
      && expectedFiles.every((file) => existingFiles.has(file));
    const generated = canReuse ? await withImageDimensions(previousImage) : await downloadImage(imageUrl, postId);
    image = { ...generated, alt: cleanText(item.title) };
  }

  const date = formatDate(item.pubDate);
  const description = cleanText(item.description);
  const excerptSource = /[。！？.!?]$/u.test(description)
    ? description
    : item['content:encoded'] ?? item.description;
  posts.push({
    id,
    date,
    dateLabel: date.replaceAll('-', '.'),
    title: cleanText(item.title),
    body: excerpt(excerptSource),
    readingMinutes: estimateReadingMinutes(item['content:encoded'] ?? item.description),
    tags: asArray(item.category).map(cleanText).filter(Boolean).slice(0, 4),
    href,
    linkLabel: '記事を読む',
    ...(image ? { image } : {}),
  });
}

const activeImages = new Set(posts.flatMap((post) => post.image?.srcset?.map((source) => path.basename(source.src)) ?? []));
for (const file of await readdir(imageDirectory)) {
  if (/^trap-[a-zA-Z0-9-]+-(480|1024)\.webp$/.test(file) && !activeImages.has(file)) {
    await rm(path.join(imageDirectory, file));
  }
}

await writeFile(outputFile, `${JSON.stringify(posts, null, 2)}\n`);
console.log(`Synced ${posts.length} posts from ${RSS_URL}`);

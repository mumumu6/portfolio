import { getCollection } from 'astro:content';

const site = 'https://mumumu6.net';

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export async function GET() {
  const [posts, works] = await Promise.all([
    getCollection('blog'),
    getCollection('works'),
  ]);

  const staticUrls = ['/', '/works/', '/blog/', '/experience/', '/thoughts/'];
  const urls: Array<{ loc: string; lastmod?: string }> = [
    ...staticUrls.map((path) => ({ loc: new URL(path, site).href })),
    ...posts.map((post) => {
      const data = post.data as { publishedAt: Date; updatedAt?: Date };
      return {
        loc: new URL(`/blog/${post.id}/`, site).href,
        lastmod: (data.updatedAt ?? data.publishedAt).toISOString().slice(0, 10),
      };
    }),
    ...works.map((work) => ({
      loc: new URL(`/works/${work.id}/`, site).href,
      lastmod: work.data.updates.at(-1)?.date?.toISOString().slice(0, 10)
        ?? work.data.publishedAt.toISOString().slice(0, 10),
    })),
  ];

  const body = urls.map(({ loc, lastmod }) => [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    '  </url>',
  ].join('\n')).join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}

import type { APIRoute } from 'astro'
import { blogRepository } from '@/repository/astro/blog'
import { workRepository } from '@/repository/astro/work'

type SiteUrl = URL

const blogLinks = async (site: SiteUrl): Promise<string[]> => {
  const posts = await blogRepository.listPosts()
  return posts
    .filter(
      (post): post is typeof post & { href: string } =>
        post.href?.startsWith('/blog/') ?? false,
    )
    .map((post) => {
      const articleUrl = new URL(post.href, site)
      const markdownUrl = new URL(`${post.href.replace(/\/$/u, '')}.md`, site)
      const title = post.title?.trim() || post.href || post.id
      return `- [${title}](${articleUrl.href}): ${post.body} ([Markdown](${markdownUrl.href}))`
    })
}

const workLinks = async (site: SiteUrl): Promise<string[]> => {
  const works = await workRepository.listWorks()
  return works.map((work) => {
    const articleUrl = new URL(work.href, site)
    const markdownUrl = new URL(`${work.href.replace(/\/$/u, '')}.md`, site)
    return `- [${work.title}](${articleUrl.href}): ${work.body} ([Markdown](${markdownUrl.href}))`
  })
}

export const GET: APIRoute = async ({ site }) => {
  if (!site)
    throw new Error('Configure site in astro.config to generate llms.txt.')

  const [posts, works] = await Promise.all([blogLinks(site), workLinks(site)])

  const lines = [
    '# mumumu portfolio',
    '',
    '> mumumuのプロフィール、制作物、技術記事、活動記録をまとめた日本語のポートフォリオです。',
    '',
    '## 主要ページ',
    '',
    `- [ホーム](${new URL('/', site).href}): プロフィールと最新の活動`,
    `- [ブログ](${new URL('/blog/', site).href}): 技術記事と参加記録`,
    `- [制作物](${new URL('/works/', site).href}): 開発したプロジェクト`,
    `- [活動履歴](${new URL('/experience/', site).href}): 学業・競技・インターン`,
    `- [AI日記](${new URL('/thoughts/', site).href}): ChatGPTとCodexによる記録`,
    `- [RSS](${new URL('/rss.xml', site).href}): ブログ更新フィード`,
    '',
    '## ブログ記事',
    '',
    ...posts,
    '',
    '## 制作物',
    '',
    ...works,
    '',
    '## 全文',
    '',
    `- [Markdown全文](${new URL('/llms-full.txt', site).href}): 自サイトで公開しているブログ記事と制作物の本文`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

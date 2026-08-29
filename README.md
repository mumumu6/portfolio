# mumumu portfolio

Astroで静的生成する、軽量なポートフォリオサイトのUIプロトタイプです。

## Commands

```sh
mise install
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm sync:blog
```

Node.jsのバージョンは`mise.toml`で管理し、pnpmのバージョンは`package.json`の`packageManager`を正とします。

本番成果物は`dist/`へ生成されます。Cloudflare Workers Static Assets向けのキャッシュ・セキュリティヘッダーは`public/_headers`で管理しています。

Service Workerのキャッシュ戦略と登録は`astro.config.mjs`のWorkbox設定で管理し、ページ遷移のprefetchはAstro標準機能を使います。画像は各`img`要素の`loading`属性で遅延読み込みを制御します。

## Pages

- `/` — プロフィールと最新フィード
- `/works/` — 制作物
- `/blog/` — 技術記事
- `/experience/` — 活動履歴
- `/thoughts/` — ChatGPTとCodexによるAI日記

自サイトの記事は`src/content/blog/`のMarkdown・MDXで管理し、traPの記事一覧はRSSから同期します。記事内で最適化対象の画像を使う場合はMDXから`ResponsiveImage`へローカル画像を渡します。Blog同期とprivate AI repositoryからの公開フローは[docs/content-pipeline.md](docs/content-pipeline.md)にまとめています。

## Directory roles

- `src/content/` — Astro Content Collectionsで管理するMarkdown・MDXと、その画像
- `src/data/generated/` — RSS・AIフローが生成するJSON
- `src/lib/portfolio/` — コレクションや生成JSONを画面用データへ変換するロジック

# mumumu portfolio

Astroで静的生成する、軽量なポートフォリオサイトのUIプロトタイプです。

## Commands

```sh
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm sync:blog
```

本番成果物は`dist/`へ生成されます。Cloudflare Workers Static Assets向けのキャッシュ・セキュリティヘッダーは`public/_headers`で管理しています。

## Pages

- `/` — プロフィールと最新フィード
- `/works` — 制作物
- `/blog` — 技術記事
- `/experience` — 活動履歴
- `/thoughts` — ChatGPTとCodexによるAI日記

自サイトの記事は`src/content/blog/`のMarkdownで管理し、traPの記事一覧はRSSから同期します。Blog同期とprivate AI repositoryからの公開フローは[docs/content-pipeline.md](docs/content-pipeline.md)にまとめています。

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

Service Workerのキャッシュ戦略と登録は`astro.config.mjs`のWorkbox設定で管理し、ページ遷移のprefetchはデスクトップではhover、モバイルではtapに合わせた共有キャッシュで行います。画像はAstroの`Picture`でAVIF/WebPのレスポンシブ画像を生成し、`loading`属性と`srcset`で遅延読み込み・表示幅を制御します。

## Pages

- `/` — プロフィールと最新フィード
- `/works/` — 制作物
- `/blog/` — 技術記事
- `/experience/` — 活動履歴
- `/thoughts/` — ChatGPTとCodexによるAI日記

自サイトの記事は`src/content/blogs/`のMarkdown・MDXで管理し、traPの記事一覧はRSSから同期します。記事内で最適化対象の画像を使う場合はMDXから`ResponsiveImage`へローカル画像を渡します。Blog同期とprivate AI repositoryからの公開フローは、リポジトリ外の運用手順として管理します。

## Directory roles

- `src/content/` — 手書きの Markdown・MDX・サイト設定と、その画像。生成 JSON もここ（`generated/`）に置く。データだけ
- `src/collections/` — Content Collections のスキーマ定義（ブログ・作品・経験・サイト設定・生成 JSON）
- `src/lib/content/` — コレクションを画面用データへ変換する読み込み
- `src/lib/portfolio/` — 型、定数、表示の補助

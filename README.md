# mumumu portfolio

Astroで静的生成する、軽量なポートフォリオサイトのUIプロトタイプです。

## Commands

Vite+のグローバルCLIを公式インストーラーで入れてください。

```sh
curl -fsSL https://vite.plus | bash
vp install
vp run prepare
vp run dev
vp run check
vp run build
vp run sync:blog
```

Node.jsのバージョンは`package.json`の`devEngines.runtime`、pnpmのバージョンは`packageManager`で管理します。Vite+のプロジェクト用ツールチェーンはpnpm catalogで固定しています。CIでは公式の`setup-vp`を使います。

本番成果物は`dist/`へ生成されます。Cloudflare Workers Static Assets向けのキャッシュ・セキュリティヘッダーは`public/_headers`で管理しています。

Service Workerのキャッシュ戦略と登録は`astro.config.mjs`のWorkbox設定で管理し、ページ遷移のprefetchはデスクトップではhover、モバイルではtapに合わせた共有キャッシュで行います。画像はAstroの`Picture`でAVIF/WebPのレスポンシブ画像を生成し、`loading`属性と`srcset`で遅延読み込み・表示幅を制御します。

## Pages

- `/` — プロフィールと最新フィード
- `/works/` — 制作物
- `/blog/` — 技術記事
- `/experience/` — 活動履歴
- `/thoughts/` — ChatGPTとCodexによるAI日記

自サイトの記事は`src/collections/content/blogs/`のMarkdown・MDXで管理し、traPの記事一覧はRSSから同期します。記事内で最適化対象の画像を使う場合はMDXから`ResponsiveImage`へローカル画像を渡します。Blog同期とprivate AI repositoryからの公開フローは、リポジトリ外の運用手順として管理します。

## Directory roles

- `src/collections/content/` — 手書きのMarkdown・MDX・プロフィール設定、およびRSS・AIフローが生成するJSON
- `src/collections/` — Astro Content Collectionsのローダーとスキーマ
- `src/repository/` — データ型・取得契約・ページ用の共通処理
- `src/repository/astro/` — Astro Content Collectionsから取得し、ページ用データを組み立てる実装

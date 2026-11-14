# Agent-readable な個人サイトに関する調査

調査日: 2026-11-14
対象: 個人ポートフォリオ・ブログを、ブラウザーとAIエージェントの両方から読みやすくする方法

## 要約

- 「Agent Ready」は単一の正式規格ではない。実務上は、検索・クロール可能性、HTMLだけでも読める本文、アクセシビリティと明確なメタデータ、必要に応じたMarkdown表現・発見用インデックスを組み合わせる考え方。
- Markdownを静的に用意する最も単純な形は、既存のHTMLページに対応する `.md` リソースを生成し、HTMLの `<link rel="alternate" type="text/markdown">` で案内すること。HTTPで `Accept: text/markdown` に応じて同じURLから返す場合は、`Content-Type: text/markdown` と `Vary: Accept` が必要。
- `/llms.txt` はサイト概要と重要ページへの導線を人・エージェント向けにまとめる低コストの提案形式。ただし、Google Searchは検索・生成AI機能でこれを特別扱いしないと明言している。検索順位向上策とは扱わず、エージェントが直接サイトを調べるときの案内として保守できる範囲で使う。
- ユーザーが示した UNV の事例は、Markdown・Linkヘッダーを加えた後、Cloudflareのスキャナー評価が57から86、Vercelの評価が69から70へ変化したという単一サイトの事例。評価器の採点改善は、エージェントの読解精度や発見数が同じだけ上がる証明ではない。
- このAstroサイトはすでに静的生成で、記事本文がMarkdown/MDX管理。ソースから素直にMarkdownを出せるため、HTMLを逆変換するより、同じContent CollectionからHTMLと `.md` を作る方針が適する。

## 20件の読み物・一次資料

### 実装例・実務記事

1. [WebサイトをAgent Readyにしよう — UNV](https://unvalley.me/ja/blog/1793627906)（2026-11-12） — ユーザー指定の記事。Cloudflare `isitagentready.com` と Vercel `is-agentic.com` で個人ブログを採点し、Markdownコンテンツネゴシエーション、Linkヘッダー、`Vary: Accept`、記事/トップのJSON-LD、Markdownの404を順に対応。スキャナー値が変わった一例を載せる。DNS-AIDや企業向けAbout/Contact/Privacyは個人ブログでは優先度を下げている。
2. [静的サイトのLLMO対策：Markdown出し分け・llms.txt・Content Signalsを実装 — Zenn](https://zenn.dev/takamasa_aiso/articles/20261101_static-site-markdown-for-ai-agents)（2026-11-01） — Next.js静的出力で `.md` をビルド生成し、`Accept`、`Link`、`Vary`、`Content-Signal` を設定した実装報告。サイトマップ全件が `llms.txt` に含まれるかビルド検証する。Cloudflare Pagesの静的配信での具体例。
3. [個人開発アプリを AI に見つけてもらう — llms.txt と Markdown ルートの実装 — Zenn](https://zenn.dev/azuma317/articles/llms-txt-nextjs-ai-discoverable)（2026-03-10） — 個人開発アプリのNext.jsで `llms.txt` と公開記事のMarkdownルートを実装した事例。小規模サイトで必要な最小範囲を考える参考。
4. [Designing a Repository for Distributing Agent Skills: CLI/ZIP Distribution and an Official Site Built with Astro — Zenn](https://zenn.dev/imkohenauser/articles/mtp-agent-skills-with-astro-starlight-docs)（2026年ごろ） — Astro/Starlightドキュメントサイトで `llms.txt` とCopy Markdownを提供する理由を説明。ページをエージェントが取得できない場合の手動コピー手段も用意し、`llms.txt` はGoogle SEO目的ではないと切り分けている。
5. [LLMS.txt: AI時代のWebサイト最適化ガイド — Zenn](https://zenn.dev/minedia/articles/llmtxt-in-action) — llms.txt / llms-full.txt の形式と、Markdownを使った索引の考え方を解説。LLM効果の予測的な主張は、規格・実測済みの事実と分けて読む。
6. [Creating an “Ask AI” Button with Just 4 Anchor Tags — Zenn](https://zenn.dev/kakenami/articles/ask-ai-prefill-links) — URLに本文を詰めず、公開URLと `llms.txt` をAIへの入力導線に使う事例。llms.txtは技術的なファイルであると同時に、公開情報をどう説明するかというコンテンツ設計だと指摘。

### Markdown配信・HTTPの一次資料

7. [The `/llms.txt` file, v2](https://llmstxt.org/)（提案、2024-09-03、v2更新2026-08-10） — ルート等に簡潔なMarkdown案内を置き、詳細ページへリンクする提案。詳細ページのMarkdown twinも提案する。標準化団体によるHTTP規格ではなく、採用判断は用途ごとに行う。
8. [AnswerDotAI/llms-txt — proposal source repository](https://github.com/AnswerDotAI/llms-txt) — 提案のソース、例、変更履歴。形式や変更を確認するときの一次資料。
9. [Introducing Markdown for Agents — Cloudflare Blog](https://blog.cloudflare.com/markdown-for-agents/)（2026-02-12） — Cloudflareが `Accept: text/markdown` によるエッジ変換を発表。Markdown応答の `Content-Type`、`Vary: Accept`、トークン数ヘッダー等を紹介。
10. [Markdown for Agents — Cloudflare Docs](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) — Cloudflare配信での動作、ヘッダー、YAML frontmatter、JSON-LD保持を説明。自サイトで同じ機能を実装する場合にも、キャッシュとメタデータの扱いが参考になる。
11. [A developer toolkit to make your website agent-ready — Chrome for Developers](https://developer.chrome.com/blog/agent-ready-toolkit/)（2026-06-22） — LighthouseのAgentic browsing監査とDevToolsを使った検証を案内。エージェントの操作性はファイル追加だけでなく、アクセシビリティツリーや名前付きコントロール等も含む。
12. [Content negotiation — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation) — `Accept` に基づくサーバー主導の表現選択と、選択条件を `Vary` でキャッシュに伝える役割を説明。
13. [Accept header — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept) — `Accept` のMIMEタイプとquality値の意味を説明。ヘッダーは単純な部分文字列判定でなく、複数メディアタイプを含むHTTP値として扱う。
14. [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) — `Accept`、`Content-Type`、コンテンツネゴシエーションの標準的な定義。
15. [RFC 7763: The text/markdown Media Type](https://www.rfc-editor.org/rfc/rfc7763) — `text/markdown` MIMEタイプの登録とMarkdown文書のメディアタイプを定義。
16. [RFC 8288: Web Linking](https://www.rfc-editor.org/rfc/rfc8288) — HTTP `Link` ヘッダーの関係性。Markdown siblingを `rel="alternate"` と `type="text/markdown"` で案内する根拠。
17. [CommonMark Spec](https://spec.commonmark.org/current/)（0.31.2、2024-01-28） — Markdown方言間の差異を減らすための仕様とテスト例。出力は装飾HTMLの再変換でなく、見出し・段落・リスト・コード・リンクが素直なCommonMarkになるようにする。

### クロール・構造化情報・現行スタック

18. [Google Search: AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — Google SearchのAI機能に出るために `llms.txt`、特別なAI用マークアップ、Markdownは不要で、Google Searchはそれらを使わないと記載。これはGoogle Searchの説明であり、別の直接アクセス型エージェントに対するMarkdown提供の有用性とは別問題。
19. [Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots) — OpenAIの `OAI-SearchBot`、`GPTBot` 等の用途とrobots.txtによる制御を説明。検索流入のクローラー制御とモデル学習向けクローラー制御は個別に考える。
20. [Person — Schema.org](https://schema.org/Person) — Personエンティティの構造化情報の語彙。個人ポートフォリオの本人名、URL、sameAs、所属等をJSON-LDで機械可読にする際の語彙参照。
21. [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — AstroでMarkdown/MDX記事を型付きコレクションから取得し、静的ルートを生成する公式ガイド。現行コンテンツをHTMLとMarkdown出力の共通入力にできる。
22. [AI agent support matrix — acceptmarkdown.com](https://acceptmarkdown.com/status)（更新表示2026-06-22） — エージェントが `Accept: text/markdown` を送るか、HTML内のMarkdown alternateを追うかを実測した一覧。クライアント・バージョン依存の観測であり、将来も固定とは限らない。Codex CLIは当該調査では alternate linkを追う部分対応とされるため、HTMLの `<link>` 併記が役立つ。

## サイト向けの判断

### 優先する

1. **公開ページをHTMLだけで完結させる。** JavaScriptを実行しなくても、プロフィール、記事本文、見出し、リンク、日付がHTMLに存在するようにする。本文Markdownをsource of truthに保ち、装飾DOMに依存しない。
2. **記事・プロフィールから `.md` を静的生成する。** Content Collectionから本文を組み立て、Frontmatterにタイトル、概要、公開日、canonical HTML URLを載せる。コードブロック、リンク、引用、画像のaltとcaptionを保ち、ナビゲーションや装飾文は含めない。
3. **HTMLでMarkdown siblingを案内する。** 各ページの `<head>` に `<link rel="alternate" type="text/markdown" href="…">` を入れる。エージェントがHTMLを先に取るケースにも道を作る。必要ならHTTP `Link` ヘッダーも加える。
4. **同じURLでネゴシエーションするなら正しくキャッシュを分ける。** `Accept` に `text/markdown` が含まれる場合のみMarkdownを選び、応答を `Content-Type: text/markdown; charset=utf-8` とし、HTML・Markdown両応答に `Vary: Accept` を付ける。q値を考慮し、別ページ・アセット・APIを誤って書き換えない。静的 `.md` と明示リンクは最初の実装ではシンプルな代替になる。
5. **`/llms.txt` は小さく保守可能に作る。** 自己紹介、サイトの対象読者、プロフィール/作品/記事一覧への優先リンクをまとめる。可能ならビルド生成してリンク切れを防ぐ。網羅記事ダンプの `llms-full.txt` はコンテキスト量と更新コストに見合う場合のみ。
6. **正確なメタデータ・JSON-LD・クローラー方針を揃える。** `Person`、`BlogPosting` など実ページに合うJSON-LDをHTMLに置き、見える本文と矛盾させない。robots.txt、sitemap、canonical、OGメタデータを整備し、各AIクローラーの目的別ポリシーを明示する。
7. **スキャナーの点数だけで完了判定しない。** Cloudflare/Vercelのエージェント監査と併せ、HTMLと `.md` の内容一致、`curl -H 'Accept: text/markdown'`、キャッシュ経由のHTML/Markdown混線、404、リンク、アクセシビリティを確認する。利用状況はアクセスログで観測する。

### 初回PRの適切なスコープ

- `/llms.txt` を生成し、主要な公開URL（トップ、プロフィール/経験、作品、ブログ一覧、記事）を優先順で案内する。
- `/blog/<slug>.md` と `/works/<slug>.md` など、本文のある詳細ページに静的Markdown twinを生成する。トップ・一覧のMarkdownは要約リンク集とし、全コンテンツの巨大な連結を避ける。
- 各HTMLページにalternate linkを追加する。ホスティングの静的配信だけでAccept negotiationに無理がある場合、まず `.md` URLを直接提供してから、リライト/ミドルウェアが確実に使えると確認できた範囲でネゴシエーションを追加する。
- 生成漏れとURL整合性をビルド時に検証する。エラー・404ページも意図したHTTPステータスと適切な表現を返す。
- `Content-Signal`、DNS-AID、MCP Server Card等の新しい運用・ポリシー機能は、実際の配信基盤のサポートとサイト所有者の利用方針を確認してから別途判断する。

## 注意点・不確実性

- `llms.txt` は提案形式で、検索エンジンや各会話AIが必ず読む約束はない。Google Searchに関する効果をうたう根拠にはしない。
- 「Markdownを返す」ことはエージェントの取得コストや本文抽出を改善し得るが、発見・引用・ランキングを保証しない。ユーザー指定記事もスキャナーの採点結果を報告しており、制御実験ではない。
- `Accept` 対応クライアントの一覧は変化する。静的な調査表は実利用のアクセスログと比べて確認する。
- `Content-Signal` の意味やホスティング実装は発展途上。サイト所有者の公開・学習利用方針を決めず、既定値を機械的に追加しない。
- 参考文献の「記事」は事例・解説を含む。規格、クローラー仕様、Googleの検索方針については、各項目に示した一次資料を優先する。

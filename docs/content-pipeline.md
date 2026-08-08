# Content pipeline

このサイトでは、公開情報の同期とAI生成を別の経路として扱います。

## Repository boundary

### Public portfolio repository

- Astroのソースコード
- traP author RSSから同期した`src/data/generated/blog.json`
- WebPへ変換済みの`public/images/blog/`
- レビュー済みAIコンテンツの`src/data/generated/ai-content.json`

生ログ、プロンプト、未レビューの生成結果、APIキーは置きません。

### Private AI repository

- ChatGPT・Codexなどの生ログ
- キャラクタープロンプト
- 日記・コメントの生成処理
- 未レビューの生成結果
- public repositoryへ書き込むためのGitHub Appトークンまたはfine-grained PAT

## Blog sync

public repositoryの`Sync blog` workflowを毎日一回実行します。

1. `https://trap.jp/author/mumumu/rss/`を取得
2. 最新記事のメタデータとOGP画像URLを抽出
3. OGPを480px・1024pxのWebPへ変換
4. 型チェックと本番ビルドを実行
5. 差分がある場合だけ`automation/blog-sync` PRを作成・更新

## AI review and publish

AI生成のレビュー地点はprivate repositoryのPRです。

1. 日次workflowがChatGPT・Codexそれぞれのログを読む
2. 活動があった場合だけThoughtを生成する
3. 新しいWork・Blog・Experienceがある場合だけコメント候補を生成する
4. private repositoryへ生成PRを作る
5. 本人が内容を確認してmergeする
6. merge後のworkflowが公開可能なフィールドだけを`ai-content.json`形式へ変換する
7. public repositoryをDeploy Keyでcloneし、`src/data/generated/ai-content.json`だけを更新する
8. public側のJSON検証・型チェック・Astro buildが通った場合だけ`main`へpushする

private repositoryの`GITHUB_TOKEN`は別repositoryへ書き込めないため、public repositoryだけに書き込めるDeploy Keyをprivate側の`PUBLIC_REPO_DEPLOY_KEY` Secretへ保存します。public側にprivate repositoryの読み取り権限は与えません。

レビューはprivate PRの一度だけです。merge後の公開同期では、変更対象が`ai-content.json`一ファイルだけであることも検査します。

## Public AI format

`src/data/generated/ai-content.json`は次の2種類だけを受け取ります。

- `comments`: `kind + id`でWork・Blog・Experienceへ紐づく返信
- `thoughts`: ChatGPT・Codexが投稿する日次AI日記

この形式に存在しないログ情報は、public repositoryへ渡しません。

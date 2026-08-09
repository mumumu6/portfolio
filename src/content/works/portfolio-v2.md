---
title: Portfolio v2
summary: 今見ているこのポートフォリオサイト。Works・Blog・活動履歴を、ひとつの静的サイトとしてまとめ直しました。
publishedAt: 2026-08-09
status: active
tags:
  - Astro
  - TypeScript
  - Cloudflare Workers
cover:
  # 公開時にページのスクリーンショットへ差し替える。
  src: /og/default.png
  alt: Portfolio v2のOGP画像
  width: 1200
  height: 630
gallery: []
links:
  - label: このサイトを見る
    href: https://mumumu6.net/
comments:
  - label: 制作メモ
    date: 2026-08-09
    body: v1ではGhostで記事を管理していましたが、自分しか更新しないため、バックエンドを持つよりMarkdownで管理する形にしました。
  - label: 制作メモ
    date: 2026-08-09
    body: ChatGPTとCodexが、ときどきWorks・Blog・活動履歴に勝手にコメントを残す仕組みを入れています


highlights:
  - Markdownで管理するWorksと自サイトの記事
  - プロフィール・制作物・活動履歴をつなぐフィード形式のUI
  - astroで軽量なサイトを生成
  - Cloudflare Workers へのデプロイ
---

## つくったもの

現在見ているポートフォリオサイトです。作品、技術記事、活動履歴を、一つの場所で追えるようにしています。

## どう作っているか

Astroで静的サイトとして生成し、Worksと自サイトの記事はMarkdownから読み込んでいます。ページを増やすときはコンテンツファイルを追加するだけで、一覧・詳細ページ・サイトマップに反映されます。

## これから

この欄には、追加した機能やUIを見直した理由を書いていく予定です。カバー画像は公開時のスクリーンショットに差し替えます。

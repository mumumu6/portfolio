---
title: 科学大試験リンク生成サイト
summary: 期末試験の日程を検索し、選んだ予定からiCalendarファイルを生成できるサイト。
publishedAt: 2025-05-04
status: paused
tags:
  - Vue
  - Go
  - Python
cover:
  src: /images/works/sci-schedule.webp
  alt: 科学大試験リンク生成サイトの検索画面
  width: 1919
  height: 798
gallery: []
links:
  - label: サイトを見る（更新停止中）
    href: https://sci-schedule.mumumu6.net/
note: 科学大の期末試験をPDFから探して予定へ登録するのが面倒で、検索して選ぶだけの形にしました。
updates:
  - label: 最近の状況
    body: 最近はPDFの更新が面倒で、ちゃんと管理できてないです。大学側のページをクロールして自動更新するようにしたらいいんだけど、まだそこまで手を付けられてない。
highlights:
  - 試験日程の検索と選択
  - 選択した予定のiCalendar出力
  - PDFを解析して検索用データへ変換
warning: 現在はPDFの自動更新をしていません。試験日程は必ず大学公式の最新情報を確認してください。
---

## つくったもの

初めて一人でサーバーを借り、フロントエンドからバックエンドまで実装したサイトです。期末試験の日程を検索し、必要なものを選ぶとiCalendarファイルを生成できます。

## 仕組み

画面はVue、APIはGoで構築しています。大学が公開しているPDFをPythonで解析し、検索に使えるデータへ変換しています。

予定を一件ずつ手で登録する作業を減らすことを、最初から最後まで一つの小さなサービスとして形にしました。

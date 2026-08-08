---
title: 初投稿！このサイトブログが書けます！
description: このサイトの旧ブログ機能を紹介した最初の記事です。
publishedAt: 2025-04-30
tags:
  - Portfolio
  - Ghost
  - Next.js
cover: /images/posts/first-post-cover.webp
coverAlt: 旧ポートフォリオサイトの画面
coverWidth: 1280
coverHeight: 529
---

## このサイトブログが書けます

記事はmarkdownで可能な表現をいくつか再現していて

> こういうのとか

- 箇条書も
  - こんなふうに
    - できます

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  cout << "Hello" << endl;
}
```

他にもコードブロックも表現できます。

---

ブログ記事は以下のようなghostのadminサイト上で書くことができ、書いたものをフロントエンドでghostのapiを用いて取得しています。

<img src="/images/posts/first-post-editor.webp" alt="Ghostのブログ管理画面" width="1400" height="596" loading="lazy" decoding="async">

## 苦労したとこ

ghostさんは当然ですが私のwebページに合うページを渡してくれるわけではなくhtmlのみを返してくれるんですね。なのでnextでいい感じにしてあげないといけません。

[mumumu6.net — mumumuの作品や活動をまとめたサイト](https://mumumu6.net/)

こういうのいい感じに解析してカードに整えないといけないので大変でした。私の所属しているサークルのtrapでもghostを使っているのですがtrapのブログと比べると表現できることや管理画面のuiなどが全然違います。trap凄すぎ～

今後必要があるたび機能を追加していこうと思います。

他にもnext.js、ssgをしようとするとaxiosは使えないのでghostのsdkをfetchに書き換えてあげる必要があったりします。(私は詰まった。)

それとvercelにデプロイしているのですが、確率でなぜかghostへのfetchにしっぱいしてデプロイ失敗するんですよね～なんでだろう

## 終わりに

今後ブログを書いたり何か作品を載せたり、自慢したい経歴があったら更新しようと思うのでよろしくお願いします！

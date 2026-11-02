# tax-accountant-office
静的サイトジェネレータとしてHugoを使用
## ビルド
- ビルドを行う: `hugo` 
- プレビュー用ビルドを行う: `hugo server -D` *アドレスはlocalhostになる
* GitHub Actionsで、自動でHugoのビルドを行いGitHub Pagesに公開する (初回はSettings->PagesからGithubActionを選択すること)
## ディレクトリ構成
```
├── content # ページ内容
│   ├── _index.md # rootページ (ダミーが必要)
│   ├── article # 記事の内容
│   │   ├── _index.md
│   │   ├── test1.md
│   │   └── test2.md
│   ├── contact.md # ダミーファイルが必要
│   ├── profile.md
│   └── service.md
├── layouts # htmlテンプレート
│   ├── _default
│   │   ├── baseof.html # htmlの基礎の共通部分
│   │   ├── single.html # ページごとに違う部分
│   │   └── taxonomy.html # /tags/<tag>ページ(特定タグの記事一覧)
│   ├── article
│   │   ├── list.html # /article/ページの記事一覧用
│   │   └── single.html
│   ├── contact # htmlページをsingle.htmlとしておく
│   │   └── single.html
│   ├── index.html # rootページの本体
│   ├── partials # 共通のパーツ
│   │   ├── footer.html
│   │   └── header.html
│   ├── profile
│   │   └── single.html
│   └── service
│       └── single.html
├── public # ビルドされたサイト
├── static # そのままpublicにコピーされるファイル（画像は EXIF を外し、表示サイズの約2倍に縮小してから置く）
├── originals # 元画像の置き場（公開されない。メタデータ除去済み）
├── hugo.toml # 設定ファイル (config.tomlと同じ)
```

## AIO / SEO の仕組み（検索・AI回答での見つかりやすさ）
事務所情報（住所・営業時間・登録番号・業務内容など）は **`hugo.toml` の `[params]` が唯一の元データ**。フッター・トップの事務所概要・JSON-LD・llms.txt はすべてここから作られるので、変更は `hugo.toml` だけでよい（画面と構造化データが食い違わない）。

| もの | 場所 |
|---|---|
| `<head>`（title / description / canonical / OGP / twitter / favicon / RSS） | `layouts/partials/head.html` |
| JSON-LD（事務所・代表者・WebSite・各ページ・パンくず・FAQ・記事） | `layouts/partials/jsonld.html` |
| `/llms.txt`（記事一覧は自動生成） | `layouts/index.llms.txt`（出力形式は `hugo.toml` の `outputFormats.LLMS`） |
| `/robots.txt`（AI クローラーも許可） | `static/robots.txt` |
| IndexNow のキーファイル | `static/<キー>.txt`（デプロイ後に `.github/workflows/hugo.yml` が通知） |
| ビルド結果のチェック | `python3 scripts/check_seo.py public tax-maeda.com`（CI でも実行） |
| OGP 画像・favicon | `static/images/og.png`、`static/favicon.ico`、`static/images/icon-*.png` |

### 記事を書くとき（front matter）
```yaml
---
title: "記事タイトル"
date: 2025-10-25          # 公開日
lastmod: 2025-12-29       # 内容を直したら必ずこの日付を更新する（画面の「更新」日・sitemap・JSON-LD に出る）
description: "検索結果・AI 回答に出る要約（60〜120字）"
tags: ["税金"]
sources:                  # 出典（国税庁など）。記事末尾の「参考（出典）」と JSON-LD の citation に出る
  - title: "国税庁 タックスアンサー No.2072 青色申告特別控除"
    url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2072.htm"
---
```
- 画像（`imgx` ショートコード）には必ず `alt="…"` を付ける。表や図の中身は、画像ではなく HTML の表か本文にする。
- 表の見出し行は `<thead>` に入れる（`<td>` のままでよい。ビルド時に `<th>` へ変換される）。
- FAQ は front matter の `faq:`（`q` / `a`）に書くと、ページに表示され `FAQPage` の JSON-LD にもなる（業務内容ページで使用）。

### 検索エンジンへの登録
Search Console / Bing Webmaster の所有権確認用のメタタグは、`hugo.toml` の `googleSiteVerification` / `bingSiteVerification` に値を入れると全ページの `<head>` に出る。

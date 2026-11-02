# tax-accountant-office
静的サイトジェネレータとしてHugoを使用
## ビルド
- ビルドを行う: `hugo` 
- プレビュー用ビルドを行う: `hugo server -D` *アドレスはlocalhostになる
* GitHub Actionsで、自動でHugoのビルドを行いGitHub Pagesに公開する (初回はSettings->PagesからGithubActionを選択すること)
## ディレクトリ構成
```
├── content # ページ内容
│   ├── _index.md # rootページ (ダミーが必要)
│   ├── guide # 税務ガイド（旧「お役立ち豆知識」。旧 URL /article/… は aliases で転送）
│   │   ├── _index.md # /guide/ （ハブの一覧）
│   │   └── <ハブ名>/ # テーマのハブ。nenmatsu / kaigyo-setsuritsu / shohizei-shotokuzei
│   │       ├── _index.md # ハブのページ（導入文・相談枠の文言。layout: hub）
│   │       └── <記事>.md # 記事。URL は年を含めない固定にして、毎年中身を更新する
│   ├── service # 業務内容
│   │   ├── _index.md # /service/ （一覧・よくある質問）
│   │   └── komon.md / ipo-ma.md / kaigyo-setsuritsu.md / kyuyo-nenmatsu.md
│   ├── contact.md # ダミーファイルが必要
│   ├── privacy.md # 個人情報の取扱い
│   └── profile.md
├── layouts # htmlテンプレート
│   ├── _default
│   │   ├── baseof.html # htmlの基礎の共通部分
│   │   └── single.html # 汎用ページ（個人情報の取扱いなど）
│   ├── guide
│   │   ├── list.html # /guide/ ページ（ハブのカード）
│   │   ├── hub.html # ハブのページ（導入文・記事一覧・相談枠）
│   │   └── single.html # 記事
│   ├── service
│   │   ├── list.html # /service/ ページ
│   │   └── single.html # 業務内容の個別ページ
│   ├── contact # htmlページをsingle.htmlとしておく
│   │   └── single.html
│   ├── index.html # rootページの本体
│   ├── partials # 共通のパーツ
│   │   ├── breadcrumb.html / cta.html / hub_cards.html / service_cards.html
│   │   ├── article_dates.html / head.html / jsonld.html
│   │   └── footer.html / header.html
│   └── profile
│       └── single.html
├── public # ビルドされたサイト
├── static # そのままpublicにコピーされるファイル（画像は EXIF を外し、表示サイズの約2倍に縮小してから置く）
├── originals # 元画像の置き場（公開されない。メタデータ除去済み）
├── hugo.toml # 設定ファイル (config.tomlと同じ)
```

タグは使わない（`disableKinds`）。記事の分類は「ハブ」＝ `content/guide/<ハブ名>/` のディレクトリで行う。

### 業務内容を足す・変える
`hugo.toml` の `[[params.services]]`（name / path / topic / summary）を編集し、`content/service/<名前>.md` を作る。トップ・業務内容ページ・お問い合わせフォームの「ご相談内容」・JSON-LD・llms.txt に反映される。

### 計測（GA4）
- `head.html` が `content_group`（ハブ名）と `content_type`（記事の種別 = front matter の `genre`）を送る。GA4 でカスタムディメンションに登録すると、ハブ別・種別ごとに見られる。
- `static/script.js` が次のイベントを送る（本番ドメインのみ。氏名・メール・本文は送らない）: `form_start` / `form_validation_error` / `generate_lead`（キーイベントに設定する）/ `form_send_failed` / `cta_click`。
- 相談への導線は、リンクに `data-cta="場所"` を付けると `cta_click` で数えられる。
- 「どの記事から問い合わせたか」は、直前に読んだ `/guide/…` のパスを `sessionStorage` に覚えて `generate_lead` の `source_guide` に付ける。

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
weight: 1                 # ハブ内の並び順
genre: annual             # annual（年度更新）/ evergreen（常設）/ procedure（手続）/ decision（判断・比較）。GA4 の content_type に出る
aliases:                  # 旧 URL からの転送（URL を変えたときだけ）
  - /article/old-slug/
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

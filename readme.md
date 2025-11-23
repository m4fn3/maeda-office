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
├── static # そのままpublicにコピーされるファイル
├── hugo.toml # 設定ファイル (config.tomlと同じ)
```
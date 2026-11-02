#!/usr/bin/env python3
"""ビルド結果（public/）の AIO / SEO まわりの整合性チェック。

使い方:  hugo --minify && python3 scripts/check_seo.py [public ディレクトリ] [期待するホスト]
失敗があれば終了コード 1（GitHub Actions のビルドを止める）。
"""
import glob
import json
import os
import re
import sys
from urllib.parse import urlparse

public = sys.argv[1] if len(sys.argv) > 1 else "public"
host = sys.argv[2] if len(sys.argv) > 2 else "tax-maeda.com"
errors = []


def err(msg):
    errors.append(msg)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


# --- 必須ファイル
for name in ["robots.txt", "llms.txt", "sitemap.xml", "index.xml", "favicon.ico", "images/og.png"]:
    if not os.path.exists(os.path.join(public, name)):
        err(f"{name} がありません")

if os.path.exists(os.path.join(public, "robots.txt")):
    robots = read(os.path.join(public, "robots.txt"))
    if f"Sitemap: https://{host}/sitemap.xml" not in robots:
        err("robots.txt の Sitemap の URL が違います")

# --- 公開する JPEG に EXIF（位置情報・撮影機種など）が残っていないか
for path in glob.glob(os.path.join(public, "**/*.jp*g"), recursive=True):
    with open(path, "rb") as f:
        head = f.read(200000)
    if b"Exif\x00\x00" in head or b"<x:xmpmeta" in head:
        err(f"{os.path.relpath(path, public)}: EXIF/XMP が残っています（位置情報などの恐れ）")

# --- sitemap
if os.path.exists(os.path.join(public, "sitemap.xml")):
    sitemap = read(os.path.join(public, "sitemap.xml"))
    for loc in re.findall(r"<loc>([^<]+)</loc>", sitemap):
        if urlparse(loc).netloc != host:
            err(f"sitemap に別ホストの URL があります: {loc}")
        if "/tags/" in loc:
            err(f"sitemap にタグページがあります: {loc}")
    if "<lastmod>" not in sitemap:
        err("sitemap に lastmod がありません")

# --- 各 HTML
pages = [p for p in glob.glob(os.path.join(public, "**/index.html"), recursive=True)]
for path in pages:
    rel = os.path.relpath(path, public)
    html = read(path)
    if len(re.findall(r"<link rel=canonical ", html)) != 1:
        err(f"{rel}: canonical が1つではありません")
    if not re.search(r'<meta name=description content="?[^">]+', html):
        err(f"{rel}: meta description がありません")
    if "localhost" in html:
        err(f"{rel}: localhost の URL が混ざっています")
    # 見出し行以外の th / 空の alt（装飾でない画像）
    for img in re.findall(r"<img [^>]*>", html):
        if "alt=" not in img:
            err(f"{rel}: alt のない画像があります: {img[:80]}")

    ld = re.findall(r"<script type=application/ld\+json>(.*?)</script>", html, re.S)
    if len(ld) != 1:
        err(f"{rel}: JSON-LD が1つではありません（{len(ld)}）")
        continue
    try:
        data = json.loads(ld[0])
    except json.JSONDecodeError as e:
        err(f"{rel}: JSON-LD が JSON として不正です: {e}")
        continue
    graph = data.get("@graph", [])
    ids = {n["@id"] for n in graph if "@id" in n}
    types = {t for n in graph for t in (n["@type"] if isinstance(n["@type"], list) else [n["@type"]])}
    for need in ["AccountingService", "Person", "WebSite"]:
        if need not in types:
            err(f"{rel}: JSON-LD に {need} がありません")

    def walk(o):
        if isinstance(o, dict):
            if set(o.keys()) == {"@id"} and o["@id"] not in ids:
                err(f"{rel}: JSON-LD の参照先がありません: {o['@id']}")
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(graph)
    for n in graph:
        if n.get("@type") == "OpeningHoursSpecification" or "openingHoursSpecification" in n:
            spec = n.get("openingHoursSpecification", n)
            for k in ("opens", "closes"):
                if not re.fullmatch(r"\d\d:\d\d", spec.get(k, "")):
                    err(f"{rel}: 営業時間の形式が不正です: {spec.get(k)}")
    if rel.startswith("article/") and rel != "article/index.html":
        if "Article" not in types:
            err(f"{rel}: 記事なのに Article がありません")
        if "BreadcrumbList" not in types:
            err(f"{rel}: BreadcrumbList がありません")
        # 画面上の更新日と JSON-LD の dateModified が一致しているか
        art = next(n for n in graph if n.get("@type") == "Article")
        if f"datetime={art['dateModified']}" not in html:
            err(f"{rel}: 画面の更新日と dateModified が一致しません")

print(f"チェックしたページ: {len(pages)}")
if errors:
    print("NG:")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print("OK")

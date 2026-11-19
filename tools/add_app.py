#!/usr/bin/env python3
"""
公開したアプリ・ゲームをまとめサイトに載せる下書きを作る。

  python3 tools/add_app.py --appstore 6777381732 --slug tabilm
  python3 tools/add_app.py --appstore 6760962104 --slug canopy --platform mac
  python3 tools/add_app.py --roblox 91644825581037 --slug pet-heist

やること:
  1. ストア (App Store は jp / us、Roblox は公開 API) から名前・説明・アイコン・スクショを取る
  2. assets/icons/<slug>.jpg と assets/shots/<slug>-N.jpg に保存する
  3. apps.js の APPS の末尾に 1 件足す (色はアイコンから選ぶ。説明文は下書きなので必ず書き直す)
  4. tools/og.sh でシェア用の画像を作り直す

説明文 (sub / desc / en) と motif は下書きのまま公開しない。書き方は README の「アプリを足す」。
"""
import argparse
import colorsys
import io
import json
import os
import re
import subprocess
import sys
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "kizzz9-portfolio-tool"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


def get_json(url):
    return json.loads(get(url))


def save_jpg(data, path, max_side=None):
    im = Image.open(io.BytesIO(data)).convert("RGB")
    if max_side:
        im.thumbnail((max_side, max_side))
    im.save(path, "JPEG", quality=85, optimize=True)


def first_sentences(text, n=2):
    text = re.sub(r"\s+", " ", text.replace("◆", " ").replace("■", " ")).strip()
    parts = [p for p in re.split(r"(?<=[。.!?！？])\s*", text) if p]
    ascii_text = sum(c.isascii() for c in text) > len(text) * 0.7
    return (" " if ascii_text else "").join(parts[:n]).strip()


def split_title(title):
    """「Tabilm - 旅のしおりと自動Vlog」→ ("Tabilm", "旅のしおりと自動Vlog")"""
    m = re.split(r"\s*[-–—:：]\s*", title, maxsplit=1)
    return (m[0], m[1]) if len(m) == 2 else (title, "")


def pick_colors(icon_path):
    """アイコンでいちばん目立つ色を bg に、読める文字色を ink に、2 番目の色を pop にする。"""
    im = Image.open(icon_path).convert("RGB").resize((64, 64))
    pal = im.quantize(6).convert("RGB").getcolors(64 * 64)
    scored = []
    for count, (r, g, b) in pal:
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if l < 0.06 or l > 0.94:
            continue
        mid = 1.0 if 0.18 < l < 0.78 else 0.35  # 白っぽい色・黒っぽい色は舞台の色に向かない
        scored.append((count * (0.2 + s * 1.5) * mid, (r, g, b)))
    scored.sort(reverse=True)
    if not scored:
        return {"bg": "#15181c", "ink": "#ffffff", "pop": "#ffffff"}
    bg = scored[0][1]
    lum = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]
    ink = (20, 20, 24) if lum > 150 else (246, 244, 240)
    pop = scored[1][1] if len(scored) > 1 else ink
    hx = lambda c: "#%02x%02x%02x" % c
    return {"bg": hx(bg), "ink": hx(ink), "pop": hx(pop)}


def from_appstore(app_id, slug, platform, max_shots):
    jp = get_json(f"https://itunes.apple.com/lookup?id={app_id}&country=jp&lang=ja_jp")["results"]
    us = get_json(f"https://itunes.apple.com/lookup?id={app_id}&country=us")["results"]
    if not jp and not us:
        sys.exit(f"App Store に id {app_id} が見つからない (まだ公開前か、地域が違う)")
    a = (jp or us)[0]
    e = (us or jp)[0]
    kind = a.get("kind", "")
    if platform is None:
        platform = "mac" if kind == "mac-software" else "ios"
    name, sub = split_title(a["trackName"])
    en_name, en_sub = split_title(e["trackName"])

    art = a.get("artworkUrl512") or a.get("artworkUrl100")
    if platform == "mac":
        # Mac のアイコンは形ごと透過 PNG で取る (JPEG だと角の外が白くなる)
        icon = f"assets/icons/{slug}.png"
        im = Image.open(io.BytesIO(get(re.sub(r"/[^/]+$", "/512x512bb.png", art)))).convert("RGBA")
        im.save(os.path.join(ROOT, icon), optimize=True)
    else:
        icon = f"assets/icons/{slug}.jpg"
        save_jpg(get(re.sub(r"/[^/]+$", "/512x512bb.jpg", art)), os.path.join(ROOT, icon))

    shots = []
    urls = a.get("screenshotUrls") or a.get("ipadScreenshotUrls") or []
    size = "1280x800bb.jpg" if platform == "mac" else "600x1300bb.jpg"
    for i, u in enumerate(urls[:max_shots]):
        p = f"assets/shots/{slug}-{i + 1}.jpg"
        save_jpg(get(re.sub(r"/[^/]+$", "/" + size, u)), os.path.join(ROOT, p))
        shots.append(p)

    entry = {
        "platform": platform,
        "name": name,
        "sub": sub,
        "desc": first_sentences(a.get("description", "")),
        "url": f"https://apps.apple.com/app/id{app_id}",
        "store": "Mac App Store" if platform == "mac" else "App Store",
        "icon": icon,
        "iconShape": "free" if platform == "mac" else "ios",
        "genre": a.get("primaryGenreName", ""),
        "year": int(a.get("releaseDate", "2026")[:4]),
        "shots": shots,
        "mediaShape": "wide" if platform == "mac" else "tall",
        "en": {"sub": en_sub, "desc": first_sentences(e.get("description", "")), "genre": e.get("primaryGenreName", "")},
    }
    if en_name != name:
        entry["en"]["name"] = en_name
    if shots:
        entry["poster"] = shots[0]
    return entry


def from_roblox(place_id, slug, max_shots):
    uni = get_json(f"https://apis.roblox.com/universes/v1/places/{place_id}/universe")["universeId"]
    g = get_json(f"https://games.roblox.com/v1/games?universeIds={uni}")["data"][0]
    icon = f"assets/icons/{slug}.jpg"
    ic = get_json(f"https://thumbnails.roblox.com/v1/games/icons?universeIds={uni}&size=512x512&format=Png")["data"][0]["imageUrl"]
    save_jpg(get(ic), os.path.join(ROOT, icon))
    th = get_json(f"https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds={uni}&countPerUniverse={max_shots}&size=768x432&format=Png")
    shots = []
    for i, t in enumerate(th["data"][0]["thumbnails"][:max_shots]):
        p = f"assets/shots/{slug}-{i + 1}.jpg"
        save_jpg(get(t["imageUrl"]), os.path.join(ROOT, p))
        shots.append(p)
    entry = {
        "platform": "roblox",
        "name": g["name"],
        "sub": "",
        "desc": first_sentences(g.get("description", "")),
        "url": f"https://www.roblox.com/games/{place_id}",
        "store": "Roblox",
        "icon": icon,
        "iconShape": "ios",
        "genre": "" if g.get("genre") in (None, "All") else g["genre"],
        "year": int(g.get("created", "2026")[:4]),
        "mediaShape": "wide",
        "en": {"sub": "", "desc": ""},
    }
    if shots:
        entry["poster"] = shots[0]
        entry["shots"] = shots[1:]  # 1 枚目は右の大きな画像に使う
    return entry


def to_js(entry):
    lines = ["  {"]
    for k, v in entry.items():
        if k == "en":
            lines.append("    en: {")
            for ek, ev in v.items():
                lines.append(f"      {ek}: {json.dumps(ev, ensure_ascii=False)},")
            lines.append("    },")
        else:
            lines.append(f"    {k}: {json.dumps(v, ensure_ascii=False)},")
    lines.append("  },")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="まとめサイトにアプリを足す下書きを作る")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--appstore", help="App Store の id (apps.apple.com/app/id の数字)")
    src.add_argument("--roblox", help="Roblox の place id (roblox.com/games/ の数字)")
    ap.add_argument("--slug", required=True, help="ファイル名に使う英小文字の名前 (例: tabilm)")
    ap.add_argument("--platform", choices=["ios", "mac", "roblox"], help="省略時はストアから判定")
    ap.add_argument("--shots", type=int, default=7, help="取るスクショの数")
    ap.add_argument("--no-og", action="store_true", help="シェア用の画像を作り直さない")
    args = ap.parse_args()

    os.makedirs(os.path.join(ROOT, "assets/icons"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "assets/shots"), exist_ok=True)
    apps_js = os.path.join(ROOT, "apps.js")
    src_js = open(apps_js, encoding="utf-8").read()
    if f'assets/icons/{args.slug}.' in src_js or f'assets/shots/{args.slug}-' in src_js:
        sys.exit(f"{args.slug} はもう apps.js にある")

    entry = from_appstore(args.appstore, args.slug, args.platform, args.shots) if args.appstore \
        else from_roblox(args.roblox, args.slug, args.shots)
    entry["motif"] = "circle"  # TODO: bg.js の MOTIFS から選ぶか、新しく足す
    entry["color"] = pick_colors(os.path.join(ROOT, entry["icon"]))

    end = src_js.rindex("];")
    src_js = src_js[:end] + "  // TODO: sub / desc / en / motif / support / video は下書き。書き直してからこの行を消す\n" + to_js(entry) + "\n" + src_js[end:]
    open(apps_js, "w", encoding="utf-8").write(src_js)
    print(f"apps.js に {entry['name']} を足した ({entry['platform']}, スクショ {len(entry.get('shots', []))} 枚, 色 {entry['color']['bg']})")

    if not args.no_og:
        subprocess.run([os.path.join(ROOT, "tools/og.sh")], check=False)


if __name__ == "__main__":
    main()

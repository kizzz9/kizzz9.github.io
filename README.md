# kizzz9.github.io

公開しているアプリとゲームのまとめページ。素の HTML/CSS/JS で、ビルドは不要。

## アプリを足す

1. アイコン (正方形、512px くらい) を `assets/icons/` に置く
2. `apps.js` の `APPS` に 1 件足す。書き方はファイル先頭のコメントと既存の項目を参照
3. 動画があれば mp4 を `assets/videos/` に置いて `video` に書く。縦型のプレビューは次のコマンドで 1〜2MB に縮む

```bash
ffmpeg -i 元の動画.mp4 -vf "scale=-2:1280" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart assets/videos/名前.mp4
ffmpeg -ss 3 -i assets/videos/名前.mp4 -frames:v 1 -q:v 4 assets/posters/名前.jpg
```

4. スクショは `assets/shots/` に置いて `shots` に並べる (説明文の下に横並びで出る)
5. サポートページがあれば `support` に URL を書く
6. `motif` でトップ右に出る図形を選ぶ (tree / moon / mountain / record / paw / egg / plane / note / circle)。新しい形は `bg.js` の `MOTIFS` に足す

プラットフォームを増やすときは `SECTIONS` に 1 行足す。アプリが 0 件のプラットフォームは表示されない。

## 手元で見る

```bash
python3 -m http.server 8000
```

## 消してはいけないもの

- `.nojekyll`: これが無いと `.well-known/` が配信されない
- `.well-known/apple-app-site-association`: Runback の共有リンク (ユニバーサルリンク)
- `app-ads.txt`: AdMob

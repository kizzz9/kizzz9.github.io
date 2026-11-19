#!/bin/sh
# シェア用の画像 assets/og.png を tools/og.html から書き出す (アプリを足したら実行する)
cd "$(dirname "$0")/.." || exit 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --allow-file-access-from-files --window-size=1200,630 --virtual-time-budget=8000 \
  --screenshot="$PWD/assets/og.png" "file://$PWD/tools/og.html" 2>/dev/null
echo "assets/og.png"

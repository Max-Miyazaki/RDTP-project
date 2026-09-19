#!/bin/sh
# Academic Gates — メモリーバース第1回の惑星画像を取り直す
#
#   sh Academic-Gate_hp/tools/fetch-memoryverse-images.sh
#
# 保存先は **image/memoryverse/**（元スクリプトの img/memoryverse/ ではない）。
# このサイトの画像フォルダは image/ 一つで、html/ からは ../image/… で参照する
# 規約のため（image/my-pic.jpg と同じ。DESIGN.md §47.8）。
#
# 取得済みの画像はリポジトリに入っているので、通常このスクリプトを走らせる必要は
# ない。差し替えたくなったとき、または Wikimedia 側でファイルが更新されたときだけ。
#
# ライセンス：8枚は NASA（パブリックドメイン。出典表記は記事の figcaption にある）。
# 火星のみ ESA/MPS for OSIRIS Team による CC BY-SA 4.0。
# いずれも **改変していない**（Wikimedia の 500px サムネイルをそのまま保存）。
# 縮小・加工したら、記事末の出典に改変した旨を書き足すこと（CC BY-SA 4.0 の要件）。
#
# 実測（2026-09-19 時点）：9枚で合計 376.2 KB、最大は earth.jpg の 80.9 KB。
set -eu
cd "$(dirname "$0")/.."          # Academic-Gate_hp/ へ
DEST=image/memoryverse
BASE=https://upload.wikimedia.org/wikipedia/commons/thumb
mkdir -p "$DEST"

get() {
    # $1 保存名 / $2 Wikimedia の thumb パス
    code=$(curl -sSL -A "MemoryverseStudy/1.0" -o "$DEST/$1.jpg" -w '%{http_code}' "$BASE/$2")
    if [ "$code" != "200" ]; then
        echo "✗ $1.jpg  HTTP $code" >&2
        return 1
    fi
    printf '  %-12s %s bytes\n' "$1.jpg" "$(wc -c < "$DEST/$1.jpg" | tr -d ' ')"
}

get sun     "b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/500px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg"
get mercury "3/30/Mercury_in_color_-_Prockter07_centered.jpg/500px-Mercury_in_color_-_Prockter07_centered.jpg"
get venus   "9/98/Venus_as_captured_by_Mariner_10.jpg/500px-Venus_as_captured_by_Mariner_10.jpg"
get earth   "9/97/The_Earth_seen_from_Apollo_17.jpg/500px-The_Earth_seen_from_Apollo_17.jpg"
get mars    "0/02/OSIRIS_Mars_true_color.jpg/500px-OSIRIS_Mars_true_color.jpg"
get jupiter "8/84/Hubble_Visible_View_of_Jupiter.jpg/500px-Hubble_Visible_View_of_Jupiter.jpg"
get saturn  "c/c7/Saturn_during_Equinox.jpg/500px-Saturn_during_Equinox.jpg"
get uranus  "2/2c/Uranus_-_Voyager_2.jpg/500px-Uranus_-_Voyager_2.jpg"
get neptune "0/06/Neptune.jpg/500px-Neptune.jpg"

# du はブロック単位で丸めるので（9ファイルで 508K と出る）、実バイト数を出す
total=$(cat "$DEST"/*.jpg | wc -c | tr -d ' ')
echo "保存しました：$DEST/  （9枚 合計 $total bytes ≒ $((total / 1024)) KB）"

#!/bin/sh
# Academic Gates — キャッシュバスターを一括で上げる
#   sh Academic-Gate_hp/tools/bump.sh        次の番号へ（r53 → r54）
#   sh Academic-Gate_hp/tools/bump.sh 60     指定の番号へ
# html 全ページの ?v=rNN と README の Current 表記を同時に書き換える。
set -eu
cd "$(dirname "$0")/../.."          # リポジトリ直下へ
SITE=Academic-Gate_hp

cur=$(grep -o 'v=r[0-9][0-9]*' "$SITE/html/index.html" | head -1 | sed 's/^v=r//')
if [ $# -ge 1 ]; then next=$(echo "$1" | sed 's/^r//'); else next=$((cur + 1)); fi
[ "$cur" = "$next" ] && { echo "すでに r$cur です。"; exit 0; }

files=$(grep -rl "v=r$cur" "$SITE/html" || true)
[ -z "$files" ] && { echo "r$cur を参照している html が見つかりません。"; exit 1; }

n=0
for f in $files; do
    perl -i -pe "s/v=r$cur\b/v=r$next/g" "$f"
    c=$(grep -c "v=r$next" "$f" || true)
    n=$((n + c))
    echo "  $f  ($c 箇所)"
done
perl -i -pe "s/\(Current: \*\*\`r$cur\`\*\*\.\)/(Current: **\`r$next\`**.)/" "$SITE/README.md"

echo "r$cur → r$next  ($(echo "$files" | grep -c .) ファイル / $n 箇所 ＋ README)"

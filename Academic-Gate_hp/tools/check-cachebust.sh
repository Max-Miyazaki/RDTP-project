#!/bin/sh
# Academic Gates — キャッシュバスター取りこぼし検査
#
# 規約: css/ js/ を変更したら html の ?v=rNN を上げる（README「Cache busting」）。
# この検査は「ステージ済みの内容」を見る。tools/hooks/pre-commit から呼ばれるほか、
# 手で `sh Academic-Gate_hp/tools/check-cachebust.sh` と叩いても同じ結果になる。
#
# 落とすのは次の2つだけ。
#   (1) css / js に実質的な変更があるのに ?v= が据え置き
#   (2) html 間で ?v= が食い違っている（一部のページだけ上げ忘れ）
# CSS のコメントだけの変更は (1) の対象外にしてある（今日の作業で実際に起きた
# ケース。コメントが古いまま配信されても害が無いため）。判定は DESIGN.md §45。

set -u
SITE=Academic-Gate_hp
REF="$SITE/html/index.html"        # 代表ページ。全ページ同じ版を使う規約
fail=0

# 初回コミット（HEAD が無い）では比較対象が無いので何もしない
git rev-parse -q --verify HEAD >/dev/null 2>&1 || exit 0

ver() { grep -o 'v=r[0-9][0-9]*' 2>/dev/null | head -1 | sed 's/^v=//'; }

# --- (2) html の版が全ページ揃っているか -------------------------------------
# ステージしたページだけでなく index 全体を見る。1ページだけ上げた場合、
# ステージ分だけを見比べても「1種類しか無い」ので取りこぼすため。
vers=""
for f in $(git ls-files "$SITE/html" | grep '\.html$'); do
    v=$(git show ":$f" 2>/dev/null | ver)
    [ -n "$v" ] && vers="$vers $v"
done
uniq_vers=$(echo "$vers" | tr ' ' '\n' | grep -v '^$' | sort -u)
if [ "$(echo "$uniq_vers" | grep -c .)" -gt 1 ]; then
    echo "✗ html の ?v= が揃っていません: $(echo "$uniq_vers" | tr '\n' ' ')" >&2
    echo "  すべてのページが同じ版を指す規約です。tools/bump.sh を実行してください。" >&2
    fail=1
fi

# --- (1) css / js を変えたのに版が据え置きになっていないか -------------------
assets=$(git diff --cached --name-only --diff-filter=ACMR \
         | grep -E "^$SITE/(css|js)/.*\.(css|js)$" || true)
[ -z "$assets" ] && exit $fail

# CSS はコメントだけの変更を除外する。JS は（正規表現リテラルや文字列の中の
# // を誤って落とす危険があるので）コメント除去をせず、変更があれば対象にする。
# 末尾の改行の有無で差が出ないよう、前後の空白も落としてから比べる
strip_css() { perl -0777 -pe 's{/\*.*?\*/}{}gs; s/\s+/ /g; s/^ //; s/ $//' 2>/dev/null || cat; }

substantive=""
for f in $assets; do
    case "$f" in
        *.css)
            if git cat-file -e "HEAD:$f" 2>/dev/null; then
                a=$(git show "HEAD:$f" | strip_css)
                b=$(git show ":$f"     | strip_css)
                [ "$a" = "$b" ] && continue      # コメント／空白だけの差 → 対象外
            fi
            ;;
    esac
    substantive="$substantive $f"
done
[ -z "$substantive" ] && exit $fail

old=$(git show "HEAD:$REF" 2>/dev/null | ver)
new=$(git show ":$REF"     2>/dev/null | ver)
[ -z "$new" ] && new="$old"              # html を一切ステージしていない場合
if [ "$old" != "$new" ]; then exit $fail; fi

echo "✗ css / js を変更しましたが ?v= が $old のままです。" >&2
echo "  対象:$substantive" >&2
echo "" >&2
echo "  → sh $SITE/tools/bump.sh   （全 html と README を r$(echo "$old" | sed 's/r//;s/$//' | awk '{print $1+1}') に上げます）" >&2
echo "  → コメント修正などで本当に不要なら  git commit --no-verify" >&2
exit 1

#!/bin/sh
# Academic Gates — 日本語のページを写して、英語版の下書きの元を作る（DESIGN.md §139）
#   sh Academic-Gate_hp/tools/make-en.sh cyber_1-1.html
# html/<名前> を html/en/<名前> に写し、次の2つだけを直す。本文は日本語のまま（翻訳はこのあと）
#   - <html lang="ja"> → <html lang="en">
#   - 「../」で始まる href・src に「../」を1つ足す（css・js・image・favicon は html/ の1つ上にあるため。
#     同じフォルダのページへのリンク（cyber.html など）はそのまま＝英語版どうしのリンクになる）
# 写さないもの：日本語限定のページ（js/i18n.js の jaOnly）・すでに英語版があるページ・国のページ
# 写したあとは、翻訳 → 対応表の en に1行 → hreflang を両方の head に → node Academic-Gate_hp/tools/check-i18n.js（§138 の⑤）
# 写したときに、元にした日本語版のハッシュを英語版の head（<meta name="ag-ja-hash">）に書く（§139.10）
set -eu
cd "$(dirname "$0")/../.."          # リポジトリ直下へ
SITE=Academic-Gate_hp

[ $# -eq 1 ] || { echo "使い方：sh $SITE/tools/make-en.sh <html/ の中のファイル名>"; exit 1; }
name=$(basename "$1")
src="$SITE/html/$name"
dst="$SITE/html/en/$name"
[ -f "$src" ] || { echo "$src がありません。"; exit 1; }
[ -e "$dst" ] && { echo "$dst はすでにあります。上書きしません。"; exit 1; }

# 種類は対応表（js/i18n.js）で判定する
kind=$(node -e '
const vm = require("vm"), fs = require("fs");
const ctx = { document: { documentElement: { getAttribute: () => "ja" } } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1], "utf8"), ctx);
console.log(vm.runInContext("AG_I18N", ctx).kind(process.argv[2]));
' "$SITE/js/i18n.js" "$name")
[ "$kind" = "both" ] || { echo "$name は共通ページではありません（${kind}）。英語版は作りません。"; exit 1; }
grep -q '<base href=' "$src" && { echo "$name は <base> を使っています。この道具では写せません。"; exit 1; }

mkdir -p "$SITE/html/en"
perl -0pe 's/<html lang="ja"/<html lang="en"/; s/(\s(?:href|src)=")\.\.\//$1..\/..\//g' "$src" > "$dst"
grep -q '<html lang="en"' "$dst" || { rm -f "$dst"; echo "<html lang=\"ja\"> が見つからず、写すのをやめました。"; exit 1; }
# 元にした日本語版のハッシュを英語版の head に記録する（日本語版が後から変わったら check-i18n が知らせる。§139.10）
node "$SITE/tools/check-i18n.js" --stamp "$name"
echo "$src → $dst"
echo "次：本文を翻訳し、js/i18n.js の AG_PAGE_LANG.en に '$name' を足し、両方の head に hreflang を入れて、check-i18n を通す"

# 教材記事の作成指示書（Academic Gates：サイバーセキュリティ基礎・物理数学）

- 版：2026-11-18（サイトの r189 の時点）
- 正本：サイトのリポジトリの `docs/lesson-authoring/lesson-authoring-guide.md`。ダウンロードフォルダなどにあるものは写し
- 一緒に渡すもの：ひな形 `lesson-template-cyber.html`（サイバーセキュリティ基礎）、`lesson-template-physmath.html`（物理数学）

## 目次

0. この指示書の使い方
1. 作るものと渡し方
2. 記事の種類と、日本語・英語の順番
3. ファイル名・番号・リンク
4. ページの構成
5. 部品と書き方（両シリーズ共通）
6. サイバーセキュリティ基礎だけの決まりと部品
7. 物理数学だけの決まりと部品
8. 画像
9. :root の変数（名前と値）
10. 作らないもの・書かないもの
11. 英語版
12. 用語集
13. 完成したときの確認チェックリスト
- 付録A　ひな形の3つの CSS の扱い
- 付録B　目次（番号・題・英語名・公開状況）

---

## 0. この指示書の使い方

- あなた（記事を書く側）は、サイトのリポジトリを見られない。必要なことはこの指示書とひな形にすべて書いてある。ここに無いことは、推測で決めずに質問する
- **記事は、ひな形 HTML を複製して書く。** 一から HTML を組まない。ひな形の CSS・スクリプト・外側の構造は、公開中の記事と同じもの
- 完成した HTML は、サイトの担当が組み込む。組み込みで使われるのは次の部分だけ：
  - `<title>`、`<meta name="description">`、`<body>` の `data-node`
  - 目次レールの `.brand` と `.toc` の中身
  - `<main>` の中身（`.lesson-hero`、`<section>`（§01〜）、`.foot`。サイバーセキュリティ基礎は先頭の `dg-sprite` も）
  - `<head>` の「B'. この記事で足した部品」の `<style>`（中身があれば）
  - それ以外（`<head>` の A・B・C の CSS、単体表示用のヘッダー・フッター、末尾のスクリプト）は、サイトのものに置き換わる。**そこを書き換えても、サイトには反映されない**
- ひな形に無い形を発明しない。どうしても新しい部品が要るときは「B'」に CSS を足し、渡すときに報告する（§1）

## 1. 作るものと渡し方

- 1つの記事（節）＝ 1つの HTML ファイル
  - サイバーセキュリティ基礎：`cyber_X-Y.html`（例：`cyber_0-2.html`）
  - 物理数学：`phys-math_N-M.html`（例：`phys-math_11-1.html`）
- 保存先：**ダウンロードフォルダ**（ダウンロードできるファイルとして渡す）
- 画像は HTML の中に data URI で埋め込む（§8）。英語の札を描いたスクリーンショットがあれば、別のファイルとしても渡す：`cyber_X-Y_sNN_en.jpg`（§8）
- 英語版の HTML を頼まれたとき（日本語版が確定した後。§2）は `cyber_X-Y_en.html` として渡す
- 渡すときに、次を短く報告する
  1. 記事の種類（共通／日本語限定／英語限定）
  2. 「B'」に足した部品があれば、その名前と理由
  3. 未公開の節を本文で参照した箇所（リンクを付けていないこと）
  4. 埋め込んだ画像の一覧（`data-file`・縦横の画素数）と、英語の札の画像の有無
  5. 用語集（§12）に無い語を英訳したときは、その語と訳（英語版のとき）
  6. §13 のチェックリストの結果

## 2. 記事の種類と、日本語・英語の順番

- 記事の種類は3つ。**ファイルの冒頭（`<!DOCTYPE html>` のすぐ下）のコメント**で示す。ひな形の1行目のコメントを、どれか1つに書き換える

```html
<!DOCTYPE html>
<!-- 記事の種類：共通（日本語・英語） -->
```

| 種類 | コメントの書き方 | 意味 |
|---|---|---|
| 共通 | `記事の種類：共通（日本語・英語）` | 日本語版と英語版の両方を作る。サイバーセキュリティ基礎と物理数学の記事はふつうこれ |
| 日本語限定 | `記事の種類：日本語限定` | 日本語版だけ。翻訳しない |
| 英語限定 | `記事の種類：英語限定` | 英語版だけ。翻訳しない |

- **共通の記事は、日本語版を先に確定させ、英語版はその後に作る。** 日本語版が確定する前に英語版を作らない
  - 確定した後に日本語版を直したときは、英語版も同じように直す（英語版だけが古いまま、を作らない）
- スクリーンショットに札（赤枠の番号と説明の文字）を描くときは、日本語版の画像と、英語の札を描いた画像の2種類を作る（§8）

## 3. ファイル名・番号・リンク

### 番号

- `X-Y` は「章-節」。章と節の番号と題は、付録Bの目次にあるものを使う。番号や題を自分で作らない（目次に無い節を書くよう頼まれたら確認する）
  - サイバーセキュリティ基礎は 0章から（0章 準備編）、物理数学は 1章から
- `<body>` の `data-node` はファイル名から `.html` を除いたもの：`data-node="cyber_0-2"`、`data-node="phys-math_11-1"`

### title と description

| | サイバーセキュリティ基礎 | 物理数学 |
|---|---|---|
| `<title>` | `0-1 ビット・バイトと2進数・16進数｜サイバーセキュリティ基礎 0章 \| Academic Gates` | `10-2 条件付きの変分と場の変分｜物理数学I 10章 \| Academic Gates` |
| description | 内容を2〜3文。末尾に `サイバーセキュリティ基礎 0章（準備編）／0-1。` | 扱う内容を語で並べて1〜2文。末尾に `物理数学I 10章／10-2。` |

（`|` の前後は半角スペース、`｜` は全角）

### 小節の番号

- 本文は小節に分け、`§01`・`§02`… と2桁で番号を付ける（`<div class="sec-head"><span class="idx">§01</span><h2>…</h2></div>`）
- `<section>` の id は `s1`・`s2`…（ひな形のとおり）。目次レールの `href="#s1"` と一致させる
- 本文の中で別の小節を指すときは「§03」、別の節を指すときは「1-4 §05」のように書く

### リンク

- 行き先は、ファイル名だけの相対パスで書く：`<a href="cyber_1-1.html">1-1「パケットとIP」</a>`（`../` も `https://` も付けない）
- **公開済みの節にだけリンクを付ける。** 公開状況は付録Bの表。まだ無い節は、題や番号を文字で書くだけにする（「次の 0-2 では…」）
  - 迷ったら付けない（リンク切れになるより、後で足すほうがよい）
- 目次のページ（`cyber.html`・`phys-math.html`）へのリンクは付けてよい
- 前後の節へのボタン（「前の節」「次の節」「目次へ」）と、レールの上の「← サイバーセキュリティ基礎」は、**サイトが自動で付ける。記事には書かない**
- 記事の中で前後の節を案内するときは、本文の最後に `.transfer` の囲みで書く（§5）

## 4. ページの構成

ひな形の構成をそのまま使う。上から順に：

```
<body data-page="study" class="is-article" data-node="cyber_X-Y">
  単体表示用のヘッダー（「講座一覧」ボタン1つ）……組み込むと消える
  <button class="menu-btn btn" id="menuBtn">この記事の目次 ≡</button>   ……スマホでレールを開くボタン
  <div class="scrim" id="scrim"></div>
  <div class="wrap">
    <nav class="rail" id="rail">           ……左の目次レール
      .brand（記事の題＋小さい行）
      .progress-wrap（読み進めたバー）
      <ul class="toc" id="toc">（部分けの見出し li.part と、小節へのリンク）
    </nav>
    <main class="main">
      （サイバーのみ）<svg class="dg-sprite">……図のアイコン。消さない
      <div class="lesson-hero">（eyebrow・h1・sub・lead）
      <section id="s1">§01 …</section>
      …
      <section id="sN">最後の小節（まとめ・最終チェック・transfer・.foot）</section>
    </main>
  </div>
  単体表示用のフッター……組み込むと消える
  <script>（コピー・目次の追従・解答／ヒントの開閉）</script>
```

### lesson-hero（記事の冒頭）

```html
<div class="lesson-hero">
  <div class="eyebrow">サイバーセキュリティ基礎 ／ 0章 準備編：コンピューターの基礎 ／ SECTION 0-1</div>
  <h1>0-1　ビット・バイトと2進数・16進数<span class="sub">コンピューターの数の数え方を、手で計算して身につける</span></h1>
  <p class="lead">導入の1段落目（具体的なものから入る）。</p>
  <p>導入の2段落目（この節で何を学び、何を確かめるか）。</p>
</div>
```

- eyebrow：`シリーズ名 ／ 章 ／ SECTION X-Y`。区切りは全角の「／」の前後に半角スペース
  - 物理数学は `物理数学 I ／ 10章 変分法 ／ SECTION 10-2`
- h1：`番号＋全角スペース＋題`。`<span class="sub">` に副題（1行）
- `.lead` は最初の段落だけ。2段落目以降は普通の `<p>`
- 物理数学は、導入の最後に `<p>読み方：解答は必ず閉じたまま、紙で挑戦してください。</p>` を置く

### 目次レール

```html
<div class="brand">0-1　ビット・バイトと2進数・16進数<small>サイバーセキュリティ基礎 ／ 0章 準備編：コンピューターの基礎</small></div>
…
<ul class="toc" id="toc">
  <li class="part">基礎概念</li>
  <li><a href="#s1"><span class="n">01</span>ビット — 0 と 1 だけで表す</a></li>
  <li><a href="#s2"><span class="n">02</span>2進数 — 桁の重みで読む</a></li>
  <li class="part">手を動かす</li>
  <li><a href="#s5"><span class="n">05</span>端末で計算して確かめる</a></li>
  <li class="part">仕上げ</li>
  <li><a href="#s8"><span class="n">08</span>まとめとチェック</a></li>
</ul>
```

- `.brand` の `<small>`：サイバーは `シリーズ名 ／ 章`、物理数学は `SECTION 10-2 / CONSTR. & FIELD` のような英大文字の短い札（`&` は `&amp;`）
- 部分けの見出し（`li.part`）で小節をまとめる。いま使っている見出しの例
  - サイバー：基礎概念／手を動かす／防御の視点／この先へ／仕上げ
  - 物理数学：導入／土台／使ってみる／仕上げ（ほかに、記事に合わせた短い名詞句）
- 最後の部は「仕上げ」にする
- 目次の項目の文は、本文の `h2` と同じ（長ければ短くしてよい）。項目の数は小節の数と同じ

### 末尾

- 最後の小節は「まとめとチェック」（サイバー）／「チェックリストとふりかえり」（物理数学）。中身は §6・§7
- その小節の最後に `.transfer`（次へ・前へ）、さらにその後ろに `.foot`（`</section>` の内側）

```html
<div class="transfer"><span class="lab">次へ：0-2 文字とデータの表し方</span>
<p>次の 0-2 では、…を学びます。</p></div>
<div class="transfer"><span class="lab">前へ：1-3 UDP・ICMP と主要プロトコル</span>
<p><a href="cyber_1-3.html">1-3「UDP・ICMP と主要プロトコル」</a>：前の節の内容を1文で。</p></div>

<div class="foot"><p>Academic Gates ／ サイバーセキュリティ基礎 0章 準備編：コンピューターの基礎 ／ 0-1「ビット・バイトと2進数・16進数」。（演習の環境の説明）。自分が管理していないネットワークや機器には、この講座の操作を行わないでください。</p></div>
```

- `.transfer` のリンクは、行き先が公開済みのときだけ、本文の先頭に付ける（見出し `.lab` には付けない）
- 章の最後の節では「次へ：次の章の最初の節」に、章のまとめの1〜2文を添える

## 5. 部品と書き方（両シリーズ共通）

### 囲み（.box）

| class | 色 | 用途 | いま使っている見出し（.lab）の例 |
|---|---|---|---|
| `box target` | 緑 | その小節の要点・到達目標・定義 | この節で押さえること／定義：○○ |
| `box principle` | 桃 | 最後の確認・前提・定義 | 最終チェック／前提として使うもの／定義：○○ |
| `box warn` | 琥珀 | 注意・よくある誤り・失敗したとき・後片付け・立ち位置 | うまくいかないとき／後片付け／よくある誤り／この教材の立ち位置 |
| `box teach` | 紫（見出しの前に ◎ が自動で付く） | 補足・用語の由来・「なぜ〜か」 | 2進数を書くときの約束／traceroute の仕組み |

```html
<div class="box target"><span class="lab">この節で押さえること</span>
<ul style="margin:6px 0 0">
  <li>要点を言い切りの1文で。</li>
</ul></div>

<div class="box teach"><span class="lab">補足の題</span>
<p>本文。</p></div>
```

- 囲みの中が箇条書きのときは `<ul style="margin:6px 0 0">`（最終チェックは `margin:8px 0 0`）
- 囲みを入れ子にしない。色を直書きしない（4種類のどれかを使う）

### 本文の文字

- 強調は `<strong>`（太字＋白）。斜体は使わない
- コマンド名・値・ファイル名・アドレスは `<code>`（等幅・青）：`<code>192.168.128.3</code>`
- 補足の小さい字：`<p style="font-size:13.5px;color:var(--ink-faint)">…</p>`
- `<` `>` `&` は `&lt;` `&gt;` `&amp;` と書く（出力例・コマンドの中でも）
- 略語は初出で開く：`MAC アドレス（MAC：Media Access Control：媒体アクセス制御）`

### 表

```html
<div class="table-scroll"><table class="mini-table">
  <caption>表の題（あれば）</caption>
  <thead><tr><th>見出し</th><th>見出し</th></tr></thead>
  <tbody><tr><td>セル</td><td>セル</td></tr></tbody>
</table></div>
```

- 表は必ず `<div class="table-scroll">` で包む（スマホで表だけ横に送れる）
- 列が多く折り返したくない表は `<table class="mini-table" style="white-space:nowrap">`

### 図（.fig）

- コードで描く図は、ページの中の SVG で描く（`<figure class="fig">` の中に `<svg>`、下に `<figcaption>`）
- `<svg>` には `role="img"` と `aria-label`（図の内容を1文で）を付ける
- 図の中の文字は `<text>`。11px より小さくしない
- 形と色の細かい決まりはシリーズで違う（§6・§7）
- 画像（スクリーンショット）は `<figure class="fig"><img …></figure>`（§8）。拡大の切り抜きは `<figure class="fig zoom">`（幅 560px まで）

### 問題と解答

```html
<h3>計算ドリル（§02・全3問）</h3>

<div class="drill"><p><span class="qn">問1</span>問題文。<br>(a) …　(b) …</p>
<div class="attempt" style="margin:10px 0 4px"><span class="lab">自分の答えを出してから</span>
<div class="controls"><button class="ctl-btn" data-sol>解答を見る</button></div>
<div class="sol"><p>(a) … ＝ <strong>答え</strong></p></div></div></div>
```

- 解答（`.sol`）は最初は閉じている（CSS で隠れている。開いておく指定をしない）。「解答を見る」を押すと開き、ボタンが「閉じる」になる
- 問題の番号は小節ごとに 問1 から
- 見出しは「計算ドリル（§02・全3問）」「応用問題（§06・全4問）」の形（いまの記事の形）
- `.drill`・`.attempt`・`.sol` の閉じタグの数に注意（上の形で `</div></div></div>`）

### 手順（.step）

- サイバー：コマンドの前の見出し（§6）
- 物理数学：解答の中の式変形の段（§7）

## 6. サイバーセキュリティ基礎だけの決まりと部品

### 演習の環境と、注意書きの入れ方

- 演習の環境：Kali Linux と Parrot OS の仮想マシン。内部ネットワークは Host-Only の `192.168.128.0/24`（Kali `192.168.128.2`、Parrot `192.168.128.3`）。インターフェース名は Kali が `eth1`、Parrot が `enp0s2`。Parrot の NAT 側の出口は Mac の `192.168.64.1`
- **演習は、自分が管理する環境（自分の仮想マシンやラボ）の中だけで行う。** 記事には次の2か所で書く
  1. 手を動かす小節の最初の段落：どの仮想マシンの端末で行うか、通信をするか（するなら内部ネットワークの中だけ、外へ出るならその内容）
  2. `.foot`：演習を行った環境を書き、最後の文は必ず次の文にする
     「自分が管理していないネットワークや機器には、この講座の操作を行わないでください。」

### コマンドとコピーボタン（.cmdbox）

```html
<div class="step">
  <span class="sh"><span class="sn">COMMAND</span>このコマンドで何をするか</span>
  <div class="cmdbox" data-copy="echo $((2#1010))"><code class="cmd">echo $((2#1010))</code></div>
</div>
```

- コピーボタンはスクリプトが自動で付ける。HTML にボタンを書かない
- `data-copy` がコピーされる文字列。**画面の表示と同じ文字列にし、先頭に `$` や `#` のプロンプトを付けない**
- `"` を含むコマンドは、`data-copy` の中で `&quot;` と書く：`data-copy="python3 -c &quot;print(1)&quot;"`
- 1つの枠に1つのコマンド（`;` でつないだ1行はよい）
- `.sn` の札：`COMMAND`（ふつう）、`端末A`・`端末B`（端末を2つ使うとき）、`準備`
- 手順には `<h3>手順1：…</h3>` の見出しを付ける

### 出力例（.out）

```html
<div class="out"><span class="lab">出力例</span>enp0s2           UP             5e:f1:1e:25:27:db &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt;</div>
```

- コピーの対象ではない。改行はそのまま書く（`white-space:pre-wrap`）
- 複数のコマンドの結果をまとめるときは `出力例（4つのコマンドの結果を順に）`
- 自分の環境で変わる値（MAC アドレスなど）は、本文でそう書く

### 分解表（.anat）

```html
<div class="table-scroll"><table class="mini-table anat">
  <caption>コマンドの分解</caption>
  <thead><tr><th>部分</th><th>意味</th></tr></thead>
  <tbody>
    <tr><td><code>-br</code></td><td><strong>brief</strong>（簡潔）。1行にまとめて表示する。</td></tr>
  </tbody>
</table></div>
```

- 見出しは「コマンドの分解」「出力の読み方」。オプションは元の英語も書く
- 前の節と同じ部分は短く書き、「（1-1 §04）」のように出てきた場所を添える（見出しを「コマンドの分解（1-1 と同じ部分は短く）」にしてよい）

### 図（SVG。.fig.dg）

```html
<figure class="fig dg">
  <svg viewBox="0 0 760 170" role="img" aria-label="図の内容を1文で">…</svg>
  <figcaption><strong>図1</strong>　図の説明。</figcaption>
</figure>
```

- `class="fig dg"`、`viewBox` の幅は **760**（高さは中身に合わせる）。スマホでは図だけ横に送れ、「← 図は横にスクロールできます →」が自動で出る
- 図の番号は記事の中で通し番号：`<strong>図1</strong>`＋全角スペース
- アイコン：`<use href="#i-pc" x=".." y=".." width="64" height="64" style="color:#4d94ff"/>`（`#i-pc` `#i-router` `#i-globe` `#i-server` `#i-person` `#i-term`）
- 矢印：`marker-end="url(#m-blue)"`（`m-blue` `m-green` `m-amber` `m-purple` `m-pink` `m-gray`）
- 色は次の組（線・枠の色／その上の文字の色）。枠の塗りは同じ色で `fill-opacity=".08"〜".13"`

| 意味の例 | 線・枠 | 文字 |
|---|---|---|
| 青（Kali・送る側・原理） | `#4d94ff` | `#a8c9ff` |
| 緑（通った・正しい・導出） | `#72e3ad` | `#9ff0cf` |
| 琥珀（Parrot・注意・言えること） | `#ffb46b` | `#ffd3a3` |
| 紫（層・補足） | `#a48bff` | `#cbbcff` |
| 桃（攻撃・重要） | `#ff6fa5` | `#ffb3cf` |
| 白・灰 | 線 `rgba(255,255,255,.55)`、薄い枠 `rgba(255,255,255,.35)`、薄い塗り `rgba(255,255,255,.04)` | 見出し `#fff`、本文 `rgba(255,255,255,.72)` |

- 図の中の字：大きさ 11.5〜17、等幅の字（コマンド・アドレス）は `font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"`
- 1つの記事の中で、同じものは同じ色にする（Kali は青、Parrot は琥珀、など）。色の意味は figcaption に書く

### 原理・導出・言えることの枠（.road）

本文の中に1つずつ置き、最後の小節で1枚の図（道筋の図）にまとめる。

```html
<div class="road p"><div class="rh"><span><span class="rk">P1</span>原理を1文で</span><span class="tag">原理 ― 覚える</span></div><div class="rb"><p class="st"><strong>どんな決まりか</strong>：設計上の約束／規格／数学の定義。</p><p class="st"><strong>由来</strong>：いつ・誰が・どの規格で。</p></div></div>

<div class="road d"><div class="rh"><span><span class="rk">D1</span>導けることを1文で</span><span class="tag">導出 ― 自分で導ける</span></div><div class="rb"><p class="use">使う原理：P1</p><p class="st"><strong>導き方</strong>：…</p><p class="chg">原理がちがったら：…</p></div></div>

<div class="road c"><div class="rh"><span><span class="rk">C1</span>言えることを1文で</span><span class="tag">言えること ― 説明できる</span></div><div class="rb"><p class="use">根拠：D1</p><p class="st">…</p></div></div>
```

- P（原理・青）／D（導出・緑）／C（言えること・橙）。番号は記事の中で通し
- 問題の札：`<span class="qt re">再現：D2</span>`（緑）、`<span class="qt ap">応用：P3 → C1</span>`（橙）。解答の先頭に `<p class="qu">使う：P2・D2</p>`
- 最終チェックの最初の項目は「**何も見ずに**、原理 P1〜Pn を（どんな決まりか・由来も含めて）書き出し、そこから D1〜 を順に導き、C1〜 を説明できるか」

### 問題の解答の決まり

- **手計算の問題の解答には、確かめるためのコマンドを載せない。** 解答は計算の過程と答えだけにする。コマンドで確かめるのは本文の「手を動かす」小節で行う
- 解答の補足に、その数が記事のどこに出てくるかを添えてよい（「(b) の 128 は §06 の IPv4 アドレスに出てくる数です」）

### 最後の小節（まとめとチェック）

1. （.road を使った記事は）`<h3>この記事の道筋（ふり返り）</h3>` と道筋の図
2. 要点の箇条書き（`<ul>`）
3. `box principle`「最終チェック」（各項目の末尾に（§03）のように小節）
4. `.transfer`（次へ／前へ）
5. `.foot`

## 7. 物理数学だけの決まりと部品

### 数式（MathJax）

- インライン：`\( … \)`、別行立て：`\[ … \]`。`$…$` は使わない
- **等号が2つ以上つながる式変形は、別行立て `\[ … \]` で書く。** インラインに押し込むと狭い画面で読めなくなる。インラインに残してよいのは `\(f(5)=25\)` のような単発の値や記号まで
- 解答の中の式変形は、ラベルだけの段落 → 別行立ての式 → 補足は別の段落、の形にする。行末の句点「。」は落とす

```html
<p>(a)</p>
\[ (x^2)'e^{-x}+x^2(e^{-x})'=2xe^{-x}-x^2e^{-x}=x(2-x)e^{-x} \]
<p style="margin:4px 0"><span style="font-size:13.5px;color:var(--ink-faint)">補足…</span></p>
```

- 長い式は `\begin{aligned}…\end{aligned}` で折る
- 数式の中の `<` は、すぐ後ろが英字なら `&lt;` と書く（`0<a` は HTML のタグの始まりと読まれて壊れる。`0<\theta`・`h<0` はそのままでよい）
- 図の中（SVG）では MathJax は動かない。変数は `<text font-style="italic">x</text>` のように斜体の文字で書く

### 例題（ヒントつき）

```html
<div class="attempt"><span class="lab">まず自力で</span>
<p>例題の問題文。</p>
<div class="controls">
  <button class="ctl-btn amber" data-hint>ヒントを表示</button>
  <button class="ctl-btn" data-sol>解答を見る</button>
</div>
<div class="hint"><span class="hn">HINT 1</span><p>最初のヒント。</p></div>
<div class="hint"><span class="hn">HINT 2</span><p>次のヒント。</p></div>
<div class="sol">
  <div class="step"><div class="sh"><span class="sn">1</span>手順の題</div>
  <div class="why">なぜ：この手順を選ぶ理由。</div>
  \[ … \]
  </div>
</div>
</div>
```

- ヒントは1つずつ開く（「次のヒント (1/2)」→「ヒントは以上」。スクリプトが自動で）。ヒントに答えそのものを書かない
- 解答は `.step`（番号 1, 2, …）に分け、各段に `.why`（「なぜ：…」）を付ける。最後の段は「検算する」にすることが多い

### 小節と最後の小節

- 計算ドリル：`<h3>計算ドリル（§01・全2問）</h3>`、問題は §5 の形
- 最後の小節「チェックリストとふりかえり」
  1. `<h3>この記事で答えられるようになるべき問い</h3>` と `box principle`「最終チェック」
  2. （章の最後の記事に置くことがある。8-4・9-4・10-2）`<h3>N章のふりかえり</h3>`
  3. `<h3>学習サイクルの推奨手順</h3>` と番号付きの箇条書き（解答を開かず紙で挑戦 → ヒントを1つずつ → この記事の進め方 → 翌日、何も見ずに再現）
  4. `box warn`「この教材の立ち位置」（扱わなかったことと、どの科目で扱うか）
  5. `.foot`：`Academic Gates ／ 物理数学I N章 章の題 ／ N-M「記事の題」。演習問題は本教材独自の構成です。`
- 最後の問題は口頭試問の形（「次の3つを、公式を見ずに自分の言葉で説明せよ」）にすることが多い
- 後の章とのつながりは `.transfer`（`.lab` は「転用」）で書く

### 図（SVG）

```html
<figure class="fig">
  <svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="図の内容を1文で">…</svg>
  <figcaption>図の説明（色と意味の対応）。</figcaption>
</figure>
```

- `viewBox` の幅は **640**。小さい図は幅 330 にして `style="max-width:340px;margin:0 auto"` を付ける
- 色は変数で書く：軸 `var(--ink-faint)`、主な曲線 `var(--accent)`（青）、条件・2つ目 `var(--good)`（緑）、注目点 `var(--amber)`（琥珀）、強調 `var(--key)`（桃）、文字 `var(--ink)`・`var(--ink-soft)`
- 図の番号（図1）は付けない（いまの物理数学の記事の形）
- コマンドの枠（.cmdbox）・.road の枠は使わない

### その他

- スマホで目次を開くボタンの文字は「目次」（ひな形のまま）
- 共通の記事だが、物理数学の英語版はまだ1本も無い。英語版を作るときは §11 に従う

## 8. 画像

- スクリーンショットは HTML の中に data URI で埋め込んでよい：`src="data:image/jpeg;base64,…"`
- **`<img>` には次の5つを必ず付ける**

```html
<figure class="fig">
  <img src="data:image/jpeg;base64,…" data-file="cyber_0-1_s05.jpg" width="1400" height="728" loading="lazy" alt="Parrot のデスクトップ。端末に、echo と printf と python3 で変換した結果が表示されている">
  <figcaption>操作した順に番号を付けています。<br>
    <strong>赤枠①</strong>：手順1。2進数・16進数を10進数に直した結果（10、255、255、65535）。</figcaption>
</figure>
```

| 属性 | 決まり |
|---|---|
| `data-file` | ファイル名。`<シリーズ>_<X-Y>_s<小節2桁>.<拡張子>`（例：`cyber_0-1_s05.jpg`）。同じ小節に2枚目からは `_2`・`_3`（例：`cyber_0-1_s05_2.png`）。受け渡しのための名前で、サイトでの置き場所と名前は組み込む側が決める |
| `width`・`height` | 画像の**実際の画素数**（縮小して表示されても、元の画素数を書く）。書かないと、読み込みのときに段組みがずれ、目次から飛んだ先がずれる |
| `loading` | `lazy` |
| `alt` | 何が写っているかを1〜2文で（「Parrot のデスクトップ。端末に…が表示されている」）。札の文字をそのまま並べない |
| `src` | data URI。スクリーンショットは JPEG、拡大の切り抜き・文字の細かいものは PNG |

- 大きさ：スクリーンショットは幅 1400px 前後（いまの記事は 1400×728 など）。拡大の切り抜きは `class="fig zoom"` に入れる
- 札（赤枠と番号）：赤い枠と ①② の番号を画像に描き込む。番号は操作した順。figcaption の最初に「操作した順に番号を付けています。」、続けて `<strong>赤枠①</strong>：…` を札ごとに1行

### 英語版の画像（札があるとき）

- 札を描いたスクリーンショットは、**日本語の札の画像と、英語の札の画像の2種類**を作る
- 英語版の画像は、日本語版と**同じ縦横の画素数**、札の**位置・大きさ・色・形を同じ**にし、札の文字だけを英語にする（英語の文が長いときは短く訳す。札の位置を動かさない）
- ファイル名は、日本語版の名前の末尾（拡張子の前）に `_en`：`cyber_0-1_s05.jpg` → `cyber_0-1_s05_en.jpg`
- 英語の札の画像は、別のファイルとしてダウンロードフォルダに渡す（§1）。英語版の HTML を作るときは、その画像を埋め込み、`data-file` も `_en` の名前にする

## 9. :root の変数（名前と値）

記事の CSS は、サイトと同じ名前・同じ値の変数を使う。**値を変えない。新しい変数を足さない**（足すと組み込みで消える）。

### ページの style が持つ変数（教材の部品用。ひな形の「B」）

| 変数 | 値 | 使う所 |
|---|---|---|
| `--surface-2` | `rgba(255,255,255,.045)` | 表の見出し・code・解答の地 |
| `--ink-soft` | `rgba(255,255,255,.68)` | 本文の文字 |
| `--ink-faint` | `rgba(255,255,255,.46)` | 小さい補足・番号・foot |
| `--line-soft` | `rgba(255,255,255,.05)` | 小節の区切り線 |
| `--accent-deep` | `#a8c9ff` | code の文字 |
| `--accent-tint` | `rgba(77,148,255,.12)` | 目次の現在地 |
| `--amber` / `--amber-tint` / `--amber-line` | `#ffb46b` / `rgba(255,160,70,.08)` / `rgba(255,160,70,.32)` | warn・attempt・ヒント |
| `--good` / `--good-tint` / `--good-line` | `#72e3ad` / `rgba(114,227,173,.08)` / `rgba(114,227,173,.28)` | target |
| `--key` / `--key-tint` / `--key-line` | `#ff6fa5` / `rgba(255,61,139,.08)` / `rgba(255,61,139,.28)` | principle |
| `--teach` / `--teach-tint` / `--teach-line` | `#a48bff` / `rgba(123,77,255,.11)` / `rgba(123,77,255,.38)` | teach |
| `--mono` | `ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace` | code・コマンド・出力例 |
| `--rail-w` | `250px` | 目次レールの幅 |

### サイト共通の変数（css/style.css が持つ。ひな形の「A」）

| 変数 | 値 | 使う所 |
|---|---|---|
| `--bg` | `#000000` | 地 |
| `--surface` | `rgba(255,255,255,0.02)` | 囲み・図・問題の地 |
| `--nav-bg` | `rgba(10,10,14,0.60)` | 目次ボタン |
| `--hairline` / `--hairline-strong` | `rgba(255,255,255,0.14)` / `rgba(255,255,255,0.24)` | 線（下の `--line` / `--line-strong` の元） |
| `--text-primary` | `#ffffff` | 見出し（下の `--ink` の元） |
| `--text-secondary` / `--text-tertiary` | `rgba(255,255,255,0.62)` / `rgba(255,255,255,0.48)` | サイトの部品の文字 |
| `--accent` | `#3d8bff` | リンク・番号の丸・解答の左の線 |
| `--glow-cool` | `rgba(61,139,255,.26)` | ボタンの光 |
| `--font-body` / `--font-display` | `'Inter Tight','Noto Sans JP',system-ui,sans-serif` | 字体 |
| `--nav-clearance` | `92px` | 上のヘッダーの分の余白 |
| `--radius-pill` / `--radius-lg` / `--radius-md` / `--radius-sm` | `999px` / `24px` / `16px` / `8px` | 角丸 |
| `--ease` / `--dur` | `cubic-bezier(0.22,1,0.36,1)` / `.32s` | 動き |
| `--space-1`〜`--space-16` | `.5rem`・`1rem`・`1.5rem`・`2rem`・`3rem`・`4rem`・`6rem`・`8rem` | 余白（記事ではほぼ使わない） |

### 教材共通のテーマの変数（css/lesson-theme.css が持つ。ひな形の「C」）

| 変数 | 値 |
|---|---|
| `--ink` | `var(--text-primary)`（#fff） |
| `--line` | `var(--hairline)` |
| `--line-strong` | `var(--hairline-strong)` |
| `--on-accent` | `#001227`（青い丸の上の文字） |
| `--rail-bg` | `rgba(8,8,12,.96)`（スマホで開いたレールの地） |

## 10. 作らないもの・書かないもの

- **ヘッダー・フッター・星空の背景は作らない。** ひな形の単体表示用のヘッダー・フッターは、そのまま使う（組み込むとサイトの部品に置き換わる）。星空はサイトが描くので、ひな形には無い
- **「講座一覧」のボタンは1つだけ**（ひな形のヘッダーのもの）。記事の中に、講座一覧・戻る・前後の節へのボタンを作らない（サイトが自動で付ける）
- テーマの切り替え（ライト／ダーク）のボタンを作らない
- `<header>`・`<footer>` の要素を記事の中で使わない（サイトのヘッダー・フッター用。使うと浮いたナビの形になる）。`class` に `card`・`hero`・`btn` を使わない（サイトの部品と同じ名前。目次ボタンの `btn` だけはひな形のまま）
- **量や進捗を示す数字を書かない**：全○章・全○節・約○節、公開した数、進捗率、「○節中○節目」など。シリーズの大きさで読者を圧倒しないため
  - 小節の中の問題の数（「計算ドリル（§02・全3問）」）は、いまの記事の形として残す
- 注釈（`<!-- -->`）の中に、生のスタイルタグ・スクリプトタグを書かない（「記事の style より後ろ」のように、山かっこ無しで書く）。組み込みの切り出しで本物のタグとして残り、CSS が丸ごと捨てられたことがある
- ひな形の A・B・C の CSS とスクリプトを書き換えない。インラインの `style=""` は、ひな形にある形（余白・小さい字・`white-space:nowrap`）以外に使わない

## 11. 英語版

- 共通の記事だけ。**日本語版が確定してから作る**（§2）
- 作り方：確定した日本語版の HTML を複製して、文を英訳する。構造・class・id・図の座標・画像の縦横は変えない
- 変えるところ
  - `<html lang="en">`
  - `<title>`：`0-1 Bits, Bytes, Binary and Hexadecimal | Cybersecurity Fundamentals Ch. 0 | Academic Gates`
  - `description`、`.brand`（`0-1　Bits, …<small>Cybersecurity Fundamentals / Ch. 0 Prerequisites: Computer Basics</small>`）、目次レールの文（部の見出し：Core concepts／Hands-on／Looking ahead／Wrap-up など）
  - eyebrow：`Cybersecurity Fundamentals / Ch. 0 Prerequisites: Computer Basics / SECTION 0-1`（区切りは半角の ` / `）
  - 本文・表・図の説明・`alt`・図の `aria-label`
  - 図の番号：`<strong>Figure 1</strong>`
  - スマホで目次を開くボタン：`Contents`
  - スクリプトと CSS の中の日本語：「閉じる」→ `Close`、コピーボタンの「コピー」→ `Copy`・「コピーしました」→ `Copied`・「コマンドをコピー」→ `Copy the command`、図の案内「← 図は横にスクロールできます →」→ `← Scroll the figure sideways →`（物理数学は「ヒントを表示」などのボタンの文も訳し、§1 の報告に載せる）
  - `.foot` の最後の文：`Only practice the techniques in this course on networks and devices that you own or have explicit permission to test.`
- **変えないもの**：コマンド、`data-copy` の中身、出力例、コードの中の文字
- **SVG の図の中の文字も英訳する**（日本語版の図は変えない）。英訳して長くなった文字が、図の外に出ていない・枠からはみ出していない・ほかの文字と重なっていないことを確かめる。入らないときは訳を短くする（例：「例1：255」→ `Ex. 1: 255`）
- スクリーンショットは、英語の札を描いた `_en` の画像を使う（§8）。英語の札の画像が無いときだけ、日本語版の画像を使い、figcaption の末尾に札の意味を英語で添える：`<strong>Labels in the image</strong> (in Japanese): ① “…”, ② “…”.`
- リンク：英語版のある節にだけ付ける（付録Bの「英語版」の列。いまは 0-1 だけ）。英語版が無い節は、リンクを外して題の後ろに ` (coming soon)` を付ける
- 訳語は §12 の用語集に従う。用語集に無い語は、記事の中で1つの訳に揃え、§1 の報告に載せる

## 12. 用語集（記事で使う語。サイトの用語集から）

### シリーズ・章・共通の語

| 日本語 | 英語 | メモ |
|---|---|---|
| サイバーセキュリティ基礎 | Cybersecurity Fundamentals | シリーズ名 |
| 物理数学 | Mathematics for Physics | シリーズ名 |
| 情報科学／物理学 | Informatics / Physics | 分野名 |
| N章 〇〇 | Ch. N 〇〇 | 章の題は付録B |
| 部 I | Part I | |
| 0章 準備編：コンピューターの基礎 | Ch. 0 Prerequisites: Computer Basics | |
| 準備中 | Coming soon | 「（準備中）」は ` (coming soon)` |
| 次へ／〇章へ | Next / On to Chapter N | `.transfer` の見出し |
| 前の節・次の節（サイバーの単位）／前の記事・次の記事（物理数学の単位）／〇〇の目次へ | Previous section・Next section / Previous article・Next article / Contents of 〇〇 | サイトが自動で付ける部分（記事には書かない） |
| 末尾の注意「自分が管理していないネットワークや機器には、この講座の操作を行わないでください。」 | Only practice the techniques in this course on networks and devices that you own or have explicit permission to test. | `.foot` の最後の文 |

### サイバーセキュリティ基礎の用語（2026-11-13 確定）

| 日本語 | 英語 | メモ |
|---|---|---|
| ビット／バイト | bit / byte | 単位の書き方は b / B |
| 2進数／10進数／16進数／8進数 | binary / decimal / hexadecimal（hex）/ octal | 「16進数2桁」は 2 hex digits |
| 桁の重み | place value | |
| 基数 | base | |
| 位取り記数法 | positional notation | |
| オクテット | octet | |
| 〜通り | values（「256 通り」→ 256 values） | 表の見出しは Values |
| 算術展開 | arithmetic expansion | |
| 原理 ― 覚える／導出 ― 自分で導ける／言えること ― 説明できる | Principle — memorize / Derivation — derive it yourself / Conclusion — explain it | P・D・C の札はそのまま |
| 使う原理／使う／根拠 | Principle used / Uses / Basis | |
| 問N／再現／応用 | QN / Reproduce / Apply | |
| 解答を見る／閉じる／自分の答えを出してから | Show answer / Close / Work out your own answer first | |
| 計算ドリル／応用問題 | Calculation drill / Applied problems | |
| コマンドの分解／出力の読み方／出力例 | Command breakdown / Reading the output / Example output | |
| 手順N／赤枠① | Step N / Red box ① | |
| この節で押さえること／最終チェック／うまくいかないとき | Key points of this section / Final check / If it does not work | |
| 内部ネットワーク | internal network | |

### 物理数学の用語

- 物理数学の英語版はまだ無く、記事の中の語（ヒントを表示、まず自力で、転用、学習サイクルの推奨手順 など）の訳は決まっていない。英語版を作るときは、上の共通の語（解答を見る／閉じる／計算ドリル／最終チェック など）はそのまま使い、残りは訳を決めて §1 の報告に載せる
- 章・記事の題の英語は、付録Bの表（下書き）を使う

## 13. 完成したときの確認チェックリスト

ファイルを単体で（ダブルクリックして）ブラウザで開き、幅 1440px 前後と 390px（スマホ）で確かめる。

### 形

- [ ] 冒頭のコメントに記事の種類がある（§2）
- [ ] ファイル名・`data-node`・`<title>`・description・eyebrow・`.brand`・h1 の番号と題が、付録Bの目次と一致している
- [ ] 小節が §01 から連番で、`<section id>` と目次レールの `href` と番号（`.n`）が一致している
- [ ] 目次レールに部分けの見出し（`li.part`）があり、最後の部が「仕上げ」
- [ ] 最後の小節に、最終チェック・`.transfer`・`.foot` がある。`.foot` の書き方がシリーズの形（§6・§7）
- [ ] ひな形の A・B・C の CSS とスクリプトを書き換えていない。足した CSS は「B'」だけ
- [ ] `<header>`・`<footer>` の要素、「講座一覧」の2つ目、前後の節へのボタン、量や進捗の数字が無い（§10）
- [ ] 注釈の中に生のスタイルタグ・スクリプトタグが無い

### 動き

- [ ] **コピーボタン**：すべての `.cmdbox` にボタンが出て、押すとコマンドだけ（`$` なし）がコピーされる。`data-copy` と表示が同じ
- [ ] **目次レール**：すべてのリンクを押して、その小節の見出しがヘッダーの下に来る。読み進めると現在地の強調が移り、上のバーが伸びる。390px では「この記事の目次」（物理数学は「目次」）で開き、項目を押すと閉じる
- [ ] **解答**：すべての「解答を見る」が開閉する（開くと「閉じる」）。最初はすべて閉じている。物理数学はヒントが1つずつ開く
- [ ] **数式**（物理数学）：すべて数式として表示され、赤い文字のエラーや、生の `\(` が残っていない
- [ ] 390px で**ページが横にスクロールしない**（表と図は、その中だけ横に送れてよい）
- [ ] ブラウザの開発者ツールのコンソールにエラーが無い

### 中身

- [ ] **リンク切れが無い**：本文のリンクは、付録Bで公開済みの節（または目次のページ）だけ。未公開の節は文字だけ
- [ ] 手計算の問題の解答に、確かめるためのコマンドが無い（サイバー）
- [ ] 演習の環境を、手を動かす小節の最初と `.foot` に書いた。`.foot` の最後が決まった注意の文（サイバー）
- [ ] 等号が2つ以上つながる式変形が、別行立てになっている（物理数学）
- [ ] すべての `<img>` に `data-file`・`width`・`height`（実際の画素数）・`loading="lazy"`・`alt` がある。figcaption に赤枠の説明がある
- [ ] すべての図の `<svg>` に `role="img"` と `aria-label` がある
- [ ] 英語版（作ったとき）：図の中の文字・`alt`・`aria-label` まで英訳した。図の中の文字がはみ出していない・重なっていない。札の画像は `_en` で、日本語版と同じ縦横の画素数・同じ札の位置。リンクは英語版のある節だけ。訳語が用語集どおり

---

## 付録A　ひな形の3つの CSS の扱い

ひな形の `<head>` には、サイトと同じ順で3つの CSS がある。単体で開いてもサイトとほぼ同じ見た目になるように、サイトの共通部品の代わりをページの中に持たせてある。

| ブロック | 中身 | 組み込んだとき |
|---|---|---|
| A. サイト共通の代わり（`<style id="standin-site-common">`） | css/style.css のうち記事に効く部分（変数・字・余白・ボタン）と、単体表示用のヘッダー・フッター | 消える。サイトの css/style.css に置き換わる |
| B. ページの style | 公開中の記事（cyber_0-1.html／phys-math_10-2.html）の style と同じ。部品と教材の変数 | ページに残る（サイトの公開中のものを使うので、書き換えても反映されない） |
| B'. この記事で足した部品 | ふつうは空 | ページに残る |
| C. 教材共通のテーマの代わり（`<style id="standin-lesson-theme">`） | css/lesson-theme.css のうち記事に効く部分（`--ink` `--line` など） | 消える。サイトの css/lesson-theme.css に置き換わる |

単体で開いたときにサイトと違うのは、星空が無いことと、ヘッダー・フッターが簡単な代わりであることだけ。

## 付録B　目次（番号・題・英語名・公開状況）

2026-11-18 時点。「公開」の節にだけリンクを付けてよい。この後に公開された節は、依頼のときに知らせる。

### B-1 サイバーセキュリティ基礎（cyber.html。部 → 章 → 節）

| 番号・題（日本語） | 英語 | 日本語版 | 英語版 |
|---|---|---|---|
| **部：基礎 — ネットワークとセキュリティの土台** | **Foundations — the groundwork of networks and security** | | |
| **0章 準備編：コンピューターの基礎** | **Ch. 0 Prerequisites: Computer Basics** | | |
| 0-1 ビット・バイトと2進数・16進数 | 0-1 Bits, Bytes, Binary and Hexadecimal | 公開（cyber_0-1.html） | 公開 |
| 0-2 文字とデータの表し方（文字コード・16進ダンプ） | 0-2 Representing Characters and Data (Character Encodings and Hex Dumps) | 未公開 | 未公開 |
| 0-3 Linux の基本操作 | 0-3 Linux Basics | 未公開 | 未公開 |
| 0-4 プロセスとメモリ | 0-4 Processes and Memory | 未公開 | 未公開 |
| **1章 ネットワークの仕組み** | **Ch. 1 How Networks Work** | | |
| 1-1 パケットとIP：通信で実際に起きていること | 1-1 Packets and IP: What Actually Happens in Network Communication | 公開（cyber_1-1.html） | 未公開 |
| 1-2 TCPとポート、3-wayハンドシェイク | 1-2 TCP, Ports, and the 3-Way Handshake | 公開（cyber_1-2.html） | 未公開 |
| 1-3 UDP・ICMP と主要プロトコル | 1-3 UDP, ICMP, and Key Protocols | 公開（cyber_1-3.html） | 未公開 |
| 1-4 階層モデル（OSI / TCP-IP）で全体を捉える | 1-4 Seeing the Whole Picture with Layer Models (OSI / TCP-IP) | 公開（cyber_1-4.html） | 未公開 |
| **2章 演習環境とツールの基礎** | **Ch. 2 The Lab Environment and Basic Tools** | | |
| 2-1 演習ラボの全体像 | 2-1 Overview of the Practice Lab | 未公開 | 未公開 |
| 2-2 ネットワーク設定とサービス管理の基礎 | 2-2 Basics of Network Configuration and Service Management | 未公開 | 未公開 |
| 2-3 レッド／ブルー／パープルチーム | 2-3 Red, Blue and Purple Teams | 未公開 | 未公開 |
| **部：偵察 — 攻撃の入口と、その検知** | **Reconnaissance — how attacks begin, and how to detect them** | | |
| **3章 情報収集（フットプリンティング）** | **Ch. 3 Information Gathering (Footprinting)** | | |
| 3-1 パッシブ偵察 | 3-1 Passive Reconnaissance | 未公開 | 未公開 |
| 3-2 アクティブ偵察の基礎 | 3-2 Basics of Active Reconnaissance | 未公開 | 未公開 |
| 3-3 ソーシャルエンジニアリングとフィッシング | 3-3 Social Engineering and Phishing | 未公開 | 未公開 |
| **4章 ホスト発見とポートスキャン** | **Ch. 4 Host Discovery and Port Scanning** | | |
| 4-1 ホスト発見（ping sweep / ARP スキャン） | 4-1 Host Discovery (Ping Sweeps / ARP Scans) | 未公開 | 未公開 |
| 4-2 SYNスキャンの攻防（教科書レベル） | 4-2 Attacking and Defending with SYN Scans (Textbook Level) | 未公開 | 未公開 |
| 4-3 各種スキャン手法の比較 | 4-3 Comparing Scan Techniques | 未公開 | 未公開 |
| 4-4 サービス・OS 特定とバナーグラビング | 4-4 Service and OS Detection, and Banner Grabbing | 未公開 | 未公開 |
| **5章 スキャンの検知と防御** | **Ch. 5 Detecting and Defending Against Scans** | | |
| 5-1 tcpdump / tshark でスキャンを観測する | 5-1 Observing Scans with tcpdump / tshark | 未公開 | 未公開 |
| 5-2 スキャン検知のしきい値設計 | 5-2 Designing Thresholds for Scan Detection | 未公開 | 未公開 |
| 5-3 nftables でレート制限・ドロップ | 5-3 Rate Limiting and Dropping with nftables | 未公開 | 未公開 |
| **部：パケット解析 — 通信を「見る」** | **Packet Analysis — “seeing” network traffic** | | |
| **6章 パケットキャプチャ** | **Ch. 6 Packet Capture** | | |
| 6-1 tcpdump / tshark の基礎 | 6-1 tcpdump / tshark Basics | 未公開 | 未公開 |
| 6-2 Wireshark の読み方と表示フィルタ | 6-2 Reading Wireshark and Using Display Filters | 未公開 | 未公開 |
| **7章 プロトコルの観察** | **Ch. 7 Observing Protocols** | | |
| 7-1 TCP / UDP / ICMP の挙動をパケットで追う | 7-1 Following TCP / UDP / ICMP Behavior in Packets | 未公開 | 未公開 |
| 7-2 平文プロトコルの盗聴と暗号化の重要性 | 7-2 Sniffing Plaintext Protocols, and Why Encryption Matters | 未公開 | 未公開 |
| 7-3 暗号と TLS（HTTPS と証明書） | 7-3 Cryptography and TLS (HTTPS and Certificates) | 未公開 | 未公開 |
| **部：L2・ネットワークの攻防** | **Attack and Defense at L2 and on the Network** | | |
| **8章 ARP と中間者攻撃（MITM）** | **Ch. 8 ARP and Man-in-the-Middle Attacks (MITM)** | | |
| 8-1 ARP の仕組みと ARP スプーフィング | 8-1 How ARP Works, and ARP Spoofing | 未公開 | 未公開 |
| 8-2 MITM の検知と防御 | 8-2 Detecting and Preventing MITM | 未公開 | 未公開 |
| **9章 その他のネットワーク脅威** | **Ch. 9 Other Network Threats** | | |
| 9-1 DHCP / DNS スプーフィング | 9-1 DHCP / DNS Spoofing | 未公開 | 未公開 |
| 9-2 ネットワーク分離（VLAN / セグメンテーション） | 9-2 Network Isolation (VLANs / Segmentation) | 未公開 | 未公開 |
| 9-3 DoS / DDoS の原理と緩和 | 9-3 How DoS / DDoS Works, and Mitigation | 未公開 | 未公開 |
| **部：サービスへの攻撃と防御（原理・検知・対策）** | **Attacks on Services and How to Defend Them (Principles, Detection, Countermeasures)** | | |
| **10章 認証への攻撃** | **Ch. 10 Attacks on Authentication** | | |
| 10-1 ブルートフォースの原理 | 10-1 How Brute Force Works | 未公開 | 未公開 |
| 10-2 認証ログの読み方と fail2ban | 10-2 Reading Authentication Logs, and fail2ban | 未公開 | 未公開 |
| 10-3 パスワードとハッシュの安全な扱い | 10-3 Handling Passwords and Hashes Safely | 未公開 | 未公開 |
| **11章 Web アプリケーションの脆弱性** | **Ch. 11 Web Application Vulnerabilities** | | |
| 11-1 SQL インジェクションの原理と安全なコード | 11-1 How SQL Injection Works, and Writing Safe Code | 未公開 | 未公開 |
| 11-2 XSS / CSRF の原理と対策 | 11-2 How XSS / CSRF Work, and Countermeasures | 未公開 | 未公開 |
| 11-3 アクセス制御とセッション管理の不備 | 11-3 Broken Access Control and Session Management | 未公開 | 未公開 |
| 11-4 コマンドインジェクション・パストラバーサル・SSRF | 11-4 Command Injection, Path Traversal and SSRF | 未公開 | 未公開 |
| 11-5 入力検証・WAF による防御 | 11-5 Defending with Input Validation and a WAF | 未公開 | 未公開 |
| **12章 既知脆弱性とエクスプロイト** | **Ch. 12 Known Vulnerabilities and Exploits** | | |
| 12-1 脆弱性・CVE・パッチ管理の基礎 | 12-1 Basics of Vulnerabilities, CVEs and Patch Management | 未公開 | 未公開 |
| 12-2 C 言語と機械語の読み方 | 12-2 Reading C and Machine Code | 未公開 | 未公開 |
| 12-3 メモリ破壊：バッファオーバーフローの原理と防御 | 12-3 Memory Corruption: How Buffer Overflows Work and How to Defend Against Them | 未公開 | 未公開 |
| 12-4 エクスプロイトの仕組み（原理理解） | 12-4 How Exploits Work (Understanding the Principle) | 未公開 | 未公開 |
| 12-5 Metasploit の構造理解と、検知側の痕跡 | 12-5 Understanding Metasploit’s Structure, and the Traces It Leaves for Defenders | 未公開 | 未公開 |
| **部：侵入後 — ポストエクスプロイトと、その防御** | **After the Breach — Post-Exploitation, and Defending Against It** | | |
| **13章 権限昇格・横展開の理解と防御** | **Ch. 13 Understanding and Defending Against Privilege Escalation and Lateral Movement** | | |
| 13-1 権限昇格の原理と対策 | 13-1 How Privilege Escalation Works, and Countermeasures | 未公開 | 未公開 |
| 13-2 横展開（ラテラルムーブメント）の理解と防御 | 13-2 Understanding and Defending Against Lateral Movement | 未公開 | 未公開 |
| **14章 マルウェアと永続化・痕跡** | **Ch. 14 Malware, Persistence and Traces** | | |
| 14-1 マルウェアの種類と仕組み | 14-1 Types of Malware and How They Work | 未公開 | 未公開 |
| 14-2 マルウェアの静的解析 | 14-2 Static Malware Analysis | 未公開 | 未公開 |
| 14-3 マルウェアの動的解析 | 14-3 Dynamic Malware Analysis | 未公開 | 未公開 |
| 14-4 永続化手法の理解と検知 | 14-4 Understanding and Detecting Persistence Techniques | 未公開 | 未公開 |
| 14-5 ログ改ざん・痕跡消去と、改ざん検知 | 14-5 Log Tampering, Covering Tracks, and Detecting Tampering | 未公開 | 未公開 |
| **部：検知と防御の設計（ブルーチーム）** | **Designing Detection and Defense (Blue Team)** | | |
| **15章 侵入検知システム（IDS / IPS）** | **Ch. 15 Intrusion Detection Systems (IDS / IPS)** | | |
| 15-1 IDS/IPS の仕組み（Suricata 入門） | 15-1 How IDS/IPS Work (Introduction to Suricata) | 未公開 | 未公開 |
| 15-2 検知ルールの作成と閾値設定 | 15-2 Writing Detection Rules and Setting Thresholds | 未公開 | 未公開 |
| 15-3 回避手法の理解と、検知の強化 | 15-3 Understanding Evasion Techniques, and Strengthening Detection | 未公開 | 未公開 |
| **16章 ログと監視** | **Ch. 16 Logging and Monitoring** | | |
| 16-1 ログの集約（SIEM 的な考え方） | 16-1 Centralizing Logs (SIEM-Style Thinking) | 未公開 | 未公開 |
| 16-2 ログから侵入を追跡する | 16-2 Tracing an Intrusion Through Logs | 未公開 | 未公開 |
| 16-3 アラート設計と運用 | 16-3 Designing and Running Alerts | 未公開 | 未公開 |
| **17章 サーバー・サービスの要塞化（ハードニング）** | **Ch. 17 Hardening Servers and Services** | | |
| 17-1 SSH サーバーの安全設定 | 17-1 Securing an SSH Server | 未公開 | 未公開 |
| 17-2 Web サーバー／サービスの安全設定 | 17-2 Securing Web Servers and Services | 未公開 | 未公開 |
| 17-3 最小権限・パッチ管理・構成管理の基本 | 17-3 Basics of Least Privilege, Patch Management and Configuration Management | 未公開 | 未公開 |
| **18章 防御の設計とまとめ** | **Ch. 18 Designing Defenses, and Wrap-Up** | | |
| 18-1 ファイアウォール設計（nftables 多層フィルタ） | 18-1 Firewall Design (Multi-Layer Filtering with nftables) | 未公開 | 未公開 |
| 18-2 多層防御とサイバーキルチェーン | 18-2 Defense in Depth and the Cyber Kill Chain | 未公開 | 未公開 |
| 18-3 中小企業のための実践セキュリティチェックリスト | 18-3 A Practical Security Checklist for Small Businesses | 未公開 | 未公開 |
| **19章 総合演習（キャップストーン）** | **Ch. 19 Capstone Exercises** | | |
| 19-1 攻撃シナリオ通し | 19-1 An End-to-End Attack Scenario | 未公開 | 未公開 |
| 19-2 防御シナリオ通し | 19-2 An End-to-End Defense Scenario | 未公開 | 未公開 |
| 19-3 攻防の突き合わせ | 19-3 Matching Attack Against Defense | 未公開 | 未公開 |

### B-2 物理数学（phys-math.html。章 → 記事）

| 番号・題（日本語） | 英語（下書き。layout.js の CRUMBS） | 日本語版 | 英語版 |
|---|---|---|---|
| **1章 微分** | **Ch. 1 Differentiation** | | |
| 1-1 微分の基礎 | 1-1 Basics of Differentiation | 公開（phys-math_1-1.html） | 未公開 |
| 1-2 物理でよく使う関数の微分 | 1-2 Derivatives of Functions Common in Physics | 公開（phys-math_1-2.html） | 未公開 |
| **2章 積分** | **Ch. 2 Integration** | | |
| 2-1 積分の基礎 | 2-1 Basics of Integration | 公開（phys-math_2-1.html） | 未公開 |
| 2-2 積分の技法 | 2-2 Integration Techniques | 公開（phys-math_2-2.html） | 未公開 |
| **3章 近似と展開** | **Ch. 3 Approximation and Expansion** | | |
| 3-1 近似と展開 | 3-1 Approximation and Expansion | 公開（phys-math_3-1.html） | 未公開 |
| **4章 複素数とオイラーの公式** | **Ch. 4 Complex Numbers and Euler's Formula** | | |
| 4-1 複素数とオイラーの公式 | 4-1 Complex Numbers and Euler's Formula | 公開（phys-math_4-1.html） | 未公開 |
| 4-2 複素数で振動を扱う | 4-2 Treating Oscillations with Complex Numbers | 公開（phys-math_4-2.html） | 未公開 |
| **5章 常微分方程式** | **Ch. 5 Ordinary Differential Equations** | | |
| 5-1 1階の微分方程式 | 5-1 First-Order Differential Equations | 公開（phys-math_5-1.html） | 未公開 |
| 5-2 2階線形微分方程式 | 5-2 Second-Order Linear Differential Equations | 公開（phys-math_5-2.html） | 未公開 |
| 5-3 強制振動と共鳴 | 5-3 Forced Oscillation and Resonance | 公開（phys-math_5-3.html） | 未公開 |
| **6章 多変数関数の微分** | **Ch. 6 Differentiation of Multivariable Functions** | | |
| 6-1 偏微分と全微分 | 6-1 Partial and Total Derivatives | 公開（phys-math_6-1.html） | 未公開 |
| 6-2 多変数微分の応用 | 6-2 Applications of Multivariable Differentiation | 公開（phys-math_6-2.html） | 未公開 |
| **7章 多重積分と座標系** | **Ch. 7 Multiple Integrals and Coordinate Systems** | | |
| 7-1 重積分 | 7-1 Multiple Integrals | 公開（phys-math_7-1.html） | 未公開 |
| 7-2 座標系の取り替えとヤコビアン | 7-2 Changing Coordinates and the Jacobian | 公開（phys-math_7-2.html） | 未公開 |
| **8章 ベクトル解析** | **Ch. 8 Vector Analysis** | | |
| 8-1 ベクトルと場 | 8-1 Vectors and Fields | 公開（phys-math_8-1.html） | 未公開 |
| 8-2 grad | 8-2 grad | 公開（phys-math_8-2.html） | 未公開 |
| 8-3 div と rot | 8-3 div and rot | 公開（phys-math_8-3.html） | 未公開 |
| 8-4 ガウスの定理とストークスの定理 | 8-4 Gauss's Theorem and Stokes' Theorem | 公開（phys-math_8-4.html） | 未公開 |
| **9章 線形代数の物理的な使い方** | **Ch. 9 Using Linear Algebra in Physics** | | |
| 9-1 行列は線形変換 | 9-1 Matrices Are Linear Transformations | 公開（phys-math_9-1.html） | 未公開 |
| 9-2 固有値と対角化 | 9-2 Eigenvalues and Diagonalization | 公開（phys-math_9-2.html） | 未公開 |
| 9-3 物理で出会う行列 | 9-3 Matrices You Meet in Physics | 公開（phys-math_9-3.html） | 未公開 |
| 9-4 添字で計算する行列の公式 | 9-4 Matrix Identities in Index Notation | 公開（phys-math_9-4.html） | 未公開 |
| **10章 変分法** | **Ch. 10 Calculus of Variations** | | |
| 10-1 変分法 | 10-1 Calculus of Variations | 公開（phys-math_10-1.html） | 未公開 |
| 10-2 条件付きの変分と場の変分 | 10-2 Constrained Variations and Variations of Fields | 公開（phys-math_10-2.html） | 未公開 |

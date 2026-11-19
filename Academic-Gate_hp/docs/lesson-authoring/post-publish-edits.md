# 公開後の修正の記録（Academic Gates の教材）

- 正本：サイトのリポジトリの `docs/lesson-authoring/post-publish-edits.md`。ダウンロードフォルダなどにあるものは写し
- 決まり（DESIGN.md §140.12、指示書 §1）
  - **公開後の記事は、サイトの HTML が正本。** 公開後の微調整は、サイトの Claude Code が記事（`html/…`）を直接直す
  - 直接直したときは、この表に、日付・記事・直した箇所（直す前と直した後の文）・コミット ID を記録する。英語版も直した場合はそれも書く
  - 記事を作るチャットで、公開済みの記事を作り直したり大きく直したりするときは、手元の作業ファイルではなく、**公開中の記事（とこの記録）から始める**
    （公開中の記事は https://max-phy.jp/Academic-Gate_hp/html/<ファイル名> 、英語版は …/html/en/<ファイル名>）

---

## 2026-11-19　cyber_0-1.html「ビット・バイトと2進数・16進数」（コミット `ad7a968`）

日本語版を直し、英語版（en/cyber_0-1.html）の同じ箇所も同じ意味に直した。英語版の「元にした日本語版のハッシュ」を更新した。

### 1. 2つの状態の説明（§01 の本文）

電流の言い方は実際の回路の仕組みと合わないため削除した。

| | 日本語 | 英語 |
|---|---|---|
| 前 | コンピューターの中では、電気が「流れている／流れていない」、電圧が「高い／低い」のように、**2つの状態**だけを区別して情報を扱っています。 | Inside a computer, information is handled by telling apart just **two states**: current flowing or not flowing, voltage high or low. |
| 後 | コンピューターの中では、電圧が「高い」か「低い」かの**2つの状態**だけを区別して、情報を扱っています。 | Inside a computer, information is handled by telling apart just **two states**: whether the voltage is “high” or “low”. |

### 2. 原理 P1 の「由来」（§01）

続く「bit」の由来の文（シャノンとテューキー）はそのまま。

| | 日本語 | 英語 |
|---|---|---|
| 前 | 由来：2つの状態だけなら、電圧が多少ぶれても読みまちがえにくい（雑音に強い）ため、今のコンピューターはこの方式。 | Origin: with only two states, a little noise in the voltage is unlikely to cause a misreading (it is robust against noise), so today’s computers work this way. |
| 後 | 由来：2つの状態だけを使うのは、電圧のぶれに強いからです。たとえば 3.3V で動く回路の代表的な規格では、2.0V 以上を「1」、0.8V 以下を「0」と読みます。雑音で電圧が 3.3V から 2.9V に下がっても、2.0V 以上なので「1」のままです。もし同じ 0〜3.3V を10段階に分けて、10進数の1桁を直接表そうとすると、段階の間は約 0.33V しかなく、少しぶれただけで隣の数字と読みまちがえてしまいます。 | Origin: only two states are used because they hold up well against fluctuations in voltage. For example, in a typical standard for circuits that run on 3.3 V, 2.0 V or more is read as “1” and 0.8 V or less as “0”. Even if noise pulls the voltage down from 3.3 V to 2.9 V, it is still 2.0 V or more, so it stays “1”. If the same 0–3.3 V were instead divided into 10 levels to represent one decimal digit directly, the levels would be only about 0.33 V apart, and a small fluctuation would be enough to misread a digit as its neighbor. |

### 3. 8桁で止める理由（§02 の図4 の説明）

「8 桁すべてが 1 の 11111111 は、8つの重みを全部足して 255。」の直後に足した（§03 へのページ内リンク付き）。

| | 日本語 | 英語 |
|---|---|---|
| 前 | （なし） | （なし） |
| 後 | ここで8桁で止めているのは、コンピューターがデータを8ビットずつのまとまり（1バイト。§03 で扱います）で扱うからです。8桁の2進数で表せるのは 0〜255 の256通りで、1バイトに入る数の範囲はこれで決まります。 | The reason we stop at 8 digits here is that computers handle data in groups of 8 bits (1 byte, covered in §03). An 8-digit binary number can represent the 256 values from 0 to 255, and that sets the range of numbers that fit in one byte. |

### 4. 0b・0x の印と由来

- `0b` と `0x` が本文で最初に出てくるのは、どちらも §02 の囲み「2進数を書くときの約束」の同じ文：「…前に 0b を付けて 0b1010 のように書くことがあります（§04 の 16進数の 0x と同じ考え方）。」
  その文の直後に、新しい段落として足した（もとの「また、桁数をそろえるために…」は次の段落に分けた）
- §04 の囲み「16進数の書き方の約束」の、`0x` の項目の次に、由来の項目を足した

| 場所 | 日本語（後） | 英語（後） |
|---|---|---|
| §02 の囲み | 先頭の 0b は「この後ろは2進数」という印です。b は binary（2進数）の頭文字。先頭の 0 は、プログラムが「数字で始まるものは数、文字で始まるものは名前」と見分けるための決まりで、b だけで始めると名前と区別がつきません。先頭の 0x は「この後ろは16進数」という印です（16進数は §04 で扱います）。x は hexadecimal（16進数）から取った文字です。 | The leading 0b is a prefix meaning “what follows is binary”. The b is the first letter of binary. The leading 0 follows a rule that programs use to tell things apart — “anything that starts with a digit is a number; anything that starts with a letter is a name” — so a prefix starting with b alone could not be told apart from a name. The leading 0x is a prefix meaning “what follows is hexadecimal” (hexadecimal is covered in §04). The x is taken from hexadecimal. |
| §04 の囲み | 0x という書き方は、1970年代に C 言語で使われ始めました。C 言語では先頭が 0 だけだと8進数（例：0755）と読まれるので、x を足して16進数と区別しました。今は Python や Linux のコマンドの出力など、多くの場所で使われています。2進数の 0b は、これにならって後から広まった書き方です。 | The 0x notation came into use with the C language in the 1970s. In C, a number starting with just 0 is read as octal (for example, 0755), so an x was added to tell hexadecimal apart. Today it is used in many places, such as Python and the output of Linux commands. The 0b for binary is a later notation modeled on it. |

（前はどちらも「なし」。§02 の囲みのもとの文は変えていない）

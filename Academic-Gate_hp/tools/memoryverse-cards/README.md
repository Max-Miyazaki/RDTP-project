# メモリーバース 国のカード（3章）

国ごとに、層1〜3を重ねた地図（SVG）と国のページ（HTML）を生成する。設計の理由は `DESIGN.md` §100。

| 層 | 中身 | 元データ |
|---|---|---|
| 層1 位置と形 | 国境・海岸線・隣国 | Natural Earth v5.1.2（パブリックドメイン） |
| 層2 骨組み | 川・湖・高速道路・主要幹線・高速鉄道・主要鉄道 | OpenStreetMap（ODbL）、Geofabrik の国の抽出 |
| 層3 区画 | 1級行政区分・地方・都市 | Natural Earth v5.1.2 |

**生成物**（リポジトリに入れるもの）

- `image/memoryverse/cards/<国>.svg`（図が2枚以上の国は `<国>-<図>.svg`。例：`jpn-main.svg`・`jpn-ryukyu.svg`）
- `html/country/<国>.html`（**手で直さない**。直すなら `page_tpl.html` か `countries.py`）

**入れないもの**：取ってきたデータと途中のファイル（`data/`、`*.osm.pbf`、`*.geojsonseq`）。サイズが大きいことと、
OSM のデータベースそのものを配らないため（ODbL）。`.gitignore` に入っている。

## 用意するもの

- `osmium-tool`（macOS：`brew install osmium-tool`）
- Python 3 と `shapely`（2.x）・`pyproj`・`numpy`（`python3 -m venv .venv && .venv/bin/pip install shapely pyproj numpy`）
- `curl`

## 走らせ方

リポジトリの `Academic-Gate_hp/` で：

```sh
zsh  tools/memoryverse-cards/extract.sh JPN          # 1) 取得（無ければ）と osmium での絞り込み
.venv/bin/python tools/memoryverse-cards/prep.py JPN # 2) 層2の選別（川15本・湖10…）と数え上げ
.venv/bin/python tools/memoryverse-cards/draw.py JPN # 3) SVG と国のページを書き出す
```

- データは `tools/memoryverse-cards/data/` に置かれる（別の場所にしたいときは `MVCARDS_DATA=/path` を付ける）。
  日本の抽出は約2.4GB、チャドは約130MB
- `extract.sh` は Geofabrik の `*-latest.osm.pbf` を取り、MD5 を確かめる。**抽出の時刻**（`fileinfo.json` の
  `osmosis_replication_timestamp`）がカードの出典に書かれる。取り直したいときは `data/<国>/osm/` の `.osm.pbf` を消す
- `draw.py` はキャッシュバスター（`?v=rNN`）を `html/index.html` から読む。版を上げたあと（`tools/bump.sh`）に
  作り直さなくても、`bump.sh` が `html/country/` も書き換える
- `prep.py` の結果は `data/<国>/stats.json`（川・湖の名前と長さ・面積、道路と鉄道の区間数と名前の割合）、
  `draw.py` の結果は `data/<国>/report.json`（SVG の大きさ、置いたラベルの数、切り詰めの重複）に出る

## 絞り込みの基準（世界共通。国ごとに変えない）

| 層2の中身 | OSM のタグ | 絞り込み |
|---|---|---|
| 川 | `waterway=river` | その国の中の長さで**長い順に15本**。同じ名前の区間はつないでから測る |
| 湖 | `natural=water` かつ `water=lake` | その国の中の面積で**広い順に10** |
| 高速道路 | `highway=motorway` | 全部（`motorway_link` は除く） |
| 主要幹線 | `highway=trunk` | 全部（`trunk_link` は除く） |
| 高速鉄道 | `railway=rail` かつ `highspeed=yes` | 全部 |
| 主要鉄道 | `railway=rail` かつ `usage=main` | 全部（`highspeed=yes` と重なるものは高速鉄道に入れる） |

- **本数で切る**のは、「主要な川」の長さが国によって違うため（日本で100km以上と決めるとチャドでは0本になる）
- 「その国」は Natural Earth v5.1.2 の国境を0.1度広げた範囲（海上の橋・河口・国境の川のため）。国境は実効支配で
  描く（2-1 §08）ので、係争地ではその範囲に入らない地域の層2も描かれない
- 名前は `name:ja`、無ければ `name`。名前の無いものは線だけ引く。川は**名前ごと**に数える（1本の川でも区間で名前が
  変われば別。信濃川と千曲川、Chari と「Chari شاري」）
- 0のものは埋めない。ボタンを薄くして「なし」、図には何も足さない
- 層1・層3：都市は Natural Earth の人口（`POP_MAX`）の多い順に20。地方は Natural Earth の `region`

**ラベル**（`prep_util.py` の `first_script`・`clip_len`・`clip_tail`、`draw.py` の置き方）

- 動かないものから置く：湖→川→高速鉄道→高速道路→主要鉄道→主要幹線。同じ種類の中は長い順。重なるもの・図の枠から出るものは飛ばす
- 文字体系が混ざった名前は、空白で区切った語の文字体系が変わったところで切って先頭だけ（`JR` のような3文字までの
  大文字の略号は数えない。「JR東北本線」のように1語の中で漢字かなと混ざるものは切らない）。1つの文字体系だけの名前はそのまま
- 1行は全角14文字（半角は0.5文字）まで。超えたら末尾を「…」。切り詰めた結果、同じ図の中で同じ文字列になったものだけ、
  後ろを残して先頭を「…」にする

**図**：正距円筒図法。標準緯線は国の面積で重みをつけた球面上の重心（`centroid.py`）。経度を cos φ₀ 倍に縮めたうえで
1度 = 44px（どの国も同じ縮尺）。格子は1度・5度・30度（30度が 2-1 の升目）。

## 国を足す

1. 標準緯線を出す：`.venv/bin/python tools/memoryverse-cards/centroid.py <ADM0_A3>`（例：`TCD` → `[15.28, 18.64]`）
2. `countries.py` の `COUNTRIES` に1項目足す。必要なのは：
   - `geofabrik`（Geofabrik のパス。例：`africa/chad-latest.osm.pbf`）
   - `phi0`（1の緯度）、`panels`（図の範囲。国の外形に0.5度ほど余白。離島が遠い国は図を分け、**同じ縮尺**のまま）
   - `name`・`description`（ページの `<title>` と説明）、`admin1_word`（「州」「県」など。ボタンの名前）
   - `regions`（Natural Earth の `region` を日本語に。無い国は `{}`）、`region_fill`（`region` が欠けている区分の補い）
   - `notes`（図の外の島・係争地の注記）、`src13`・`fig`（出典欄の文）
3. `extract.sh` → `prep.py` → `draw.py` を走らせ、`data/<国>/stats.json` の数と `report.json` を見る
4. ブラウザで `html/country/<国>.html` を開き、層の切り替え・0の表示・ラベルを確かめる

#!/bin/zsh
# 国のカード：データの取得と絞り込み（層2の素材）
#   使い方：zsh tools/memoryverse-cards/extract.sh JPN
# 1) Natural Earth v5.1.2（層1・層3）と Geofabrik の国の抽出（層2）を、無ければ取ってくる
# 2) osmium で層2のタグだけに絞り、GeoJSON（seq）に書き出す
# 取ってきたものと途中のファイルは data/ に置く。リポジトリには入れない（サイズと ODbL。.gitignore）。
set -e
HERE=${0:A:h}
CC=${1:?国コードを渡す（例：JPN）}
PY=${PYTHON:-python3}
eval "$(cd $HERE && $PY -c "
from countries import COUNTRIES, NE
c = COUNTRIES['$CC']
print(f\"WD='{c['dir']}'; NE='{NE}'; GF='{c['geofabrik']}'\")
")"

# --- Natural Earth v5.1.2（タグで固定。版を変えるときはここと README を直す）
mkdir -p $NE
for f in ne_10m_admin_0_countries ne_10m_admin_1_states_provinces ne_10m_populated_places; do
  [[ -s $NE/$f.geojson ]] || curl -fsSL -o $NE/$f.geojson \
    https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/$f.geojson
done

# --- Geofabrik の抽出（*-latest は日付つきのファイルへ転送されるので -L で追う）
mkdir -p $WD/osm
cd $WD/osm
PBF=${GF:t}
if [[ ! -s $PBF ]]; then
  curl -fL -o $PBF https://download.geofabrik.de/$GF
  curl -fsL -o $PBF.md5 https://download.geofabrik.de/$GF.md5
  [[ "$(md5 -q $PBF 2>/dev/null || md5sum $PBF | cut -d' ' -f1)" == "$(cut -d' ' -f1 $PBF.md5)" ]] || { echo "MD5 が合わない: $PBF" >&2; exit 1; }
fi
# ファイルの日付（Geofabrik の抽出の時刻）はここに残り、カードの出典に書かれる
osmium fileinfo -e -j $PBF > fileinfo.json

# --- 層2のタグだけに絞る（参照するノード・メンバーも含む）
osmium tags-filter -O $PBF \
  w/waterway=river \
  w/natural=water r/natural=water \
  w/highway=motorway,trunk \
  w/railway=rail \
  -o l2.osm.pbf
osmium tags-filter -O l2.osm.pbf w/waterway=river -o river.osm.pbf
osmium tags-filter -O l2.osm.pbf w/natural=water r/natural=water -o water.osm.pbf
osmium tags-filter -O l2.osm.pbf w/highway=motorway,trunk -o road.osm.pbf
osmium tags-filter -O l2.osm.pbf w/railway=rail -o rail.osm.pbf
osmium export -O river.osm.pbf --geometry-types=linestring -f geojsonseq -o river.geojsonseq
osmium export -O water.osm.pbf --geometry-types=polygon     -f geojsonseq -o water.geojsonseq
osmium export -O road.osm.pbf  --geometry-types=linestring -f geojsonseq -o road.geojsonseq
osmium export -O rail.osm.pbf  --geometry-types=linestring -f geojsonseq -o rail.geojsonseq
echo "$CC: $(python3 -c "import json;print(json.load(open('fileinfo.json'))['header']['option'].get('osmosis_replication_timestamp'))")"

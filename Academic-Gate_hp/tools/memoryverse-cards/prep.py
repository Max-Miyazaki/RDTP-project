# 層2（OSM）の絞り込み。結果を data/<国>/prep.pkl に保存し、数を stats.json に出す。
#   使い方：python prep.py JPN   （先に extract.sh JPN。README.md）
import json, pickle, os, sys
from collections import defaultdict
from shapely.geometry import shape, LineString, MultiLineString, Polygon, MultiPolygon, GeometryCollection
from shapely.ops import unary_union, linemerge
from shapely.prepared import prep
from shapely import STRtree
from pyproj import Geod

D = os.path.dirname(os.path.abspath(__file__))
from countries import COUNTRIES, NE
CC = sys.argv[1] if len(sys.argv) > 1 else 'JPN'
WD = COUNTRIES[CC]['dir']
G = Geod(ellps='WGS84')


from prep_util import lines_of, polys_of, merge


def name_of(p):
    return p.get('name:ja') or p.get('name') or None


def read_seq(fn):
    with open(os.path.join(WD, 'osm', fn)) as f:
        for ln in f:
            ln = ln.lstrip('\x1e').strip()
            if ln:
                yield json.loads(ln)


# その国 = Natural Earth v5.1.2 の国（バチカン・ジブラルタルだけ OSM の輪郭。countries.py の outline_osm、DESIGN.md §112）。
# ★ 数えるのは国の輪郭の中だけ（DESIGN.md §113）。帯で数えると、小さい国に隣の国のものが入る（バチカンに高速道路81km、サンマリノに鉄道）。
#   選ぶ：川は0.1度の帯で選ぶ（国境になっている川はその国の骨組みの一部。ルクセンブルクのモーゼル川・ウール川・ザウアー川）。
#         道路・鉄道・湖は輪郭にかかるものだけ。描くのはどれも帯まで（線を国境で切らない）。
#   国境になっている川の長さは、粗い国境の線のどちら側に入ったかで変わる（モーゼル川はドイツで257km、ルクセンブルクで3.4km）
from countries import outline
JP = outline(CC).buffer(0)
JPP = prep(JP)
JPBUF = JP.buffer(0.1)       # 描く範囲（線を国境でぷつりと切らない）
JPB = prep(JPBUF)
JPIN = JP.buffer(0.02)       # 湖の面積を測る範囲（国境をまたぐ湖を国境で切らないため）


def in_japan(g):
    # 道路・鉄道・湖：国の輪郭にかかるものだけを選ぶ（帯の中だけにあるもの＝隣の国のものは選ばない）
    return JPP.intersects(g)


def in_band(g):
    # 川：帯で選ぶ
    return JPB.intersects(g)


def clip(g):
    # 描くのは帯まで
    return g if JPB.contains(g) else g.intersection(JPBUF)


def inlen(g):
    # 数えるのは国の輪郭の中の長さだけ
    return glen(g if JPP.contains(g) else g.intersection(JP))


def glen(g):
    return sum(G.geometry_length(l) for l in lines_of(g))


# ---------- 川：同じ名前の区間をつなぎ、つながった塊ごとに長さを測る ----------
# ★ 同じ川かどうかは OSM の `name` で決める（無ければ `name:ja`）。ラベルは、その塊の区間に入っている `name:ja`
#   （無ければ `name`）。`name:ja` で束ねると、一部の区間にだけ日本語名が入った川が割れる（ライン川が「Rhein」
#   「ライン川」の2本になった。§101.7）。名前そのものが区間で変わる川（信濃川と千曲川）は、`name` が違うので別のまま。
by_name = defaultdict(list)
ja_of = defaultdict(list)                      # key → [(区間, name:ja)]（日本語名が入っている区間だけ）
n_river_ways = 0
for f in read_seq('river.geojsonseq'):
    g = shape(f['geometry'])
    if not in_band(g):
        continue
    n_river_ways += 1
    g = clip(g)
    if lines_of(g):
        p = f['properties']
        key = p.get('name') or p.get('name:ja') or None
        by_name[key].append(g)
        if key and p.get('name:ja'):
            ja_of[key].append((g, p['name:ja']))


def river_label(key, geom):
    """塊のラベル：その塊に重なる区間の name:ja のうち、長さがいちばん長いもの。無ければ name"""
    if not key or key not in ja_of:
        return key
    tally = defaultdict(float)
    near = geom.buffer(1e-6)
    for g, ja in ja_of[key]:
        if near.intersects(g):
            tally[ja] += glen(g)
    return max(tally, key=tally.get) if tally else key

rivers = []
for nm, ls in by_name.items():
    parts = lines_of(merge(unary_union(ls)))
    if nm is None:
        clusters = [[p] for p in parts]           # 名前が無いものは連続する区間だけをつなぐ
    else:
        # 同じ名前でも離れた別の川は分ける（端が 0.01度≒1km 以内なら同じ川とみなす）
        tree = STRtree(parts)
        par = list(range(len(parts)))
        def root(i):
            while par[i] != i:
                par[i] = par[par[i]]; i = par[i]
            return i
        for i, p in enumerate(parts):
            for j in tree.query(p, predicate='dwithin', distance=0.01):
                a, b = root(i), root(int(j))
                if a != b:
                    par[a] = b
        cl = defaultdict(list)
        for i, p in enumerate(parts):
            cl[root(i)].append(p)
        clusters = list(cl.values())
    for c in clusters:
        mg = MultiLineString(c)
        # 順位（上位15本）は帯の中の長さで決め、数（len_km）は輪郭の中の長さ
        rivers.append({'name': river_label(nm, mg), 'key': nm, 'geom': mg, 'len_km': inlen(mg) / 1000, 'len_band_km': glen(mg) / 1000})
rivers.sort(key=lambda r: -r['len_band_km'])
# ★ 国の中の長さが0km の川は選ばない（DESIGN.md §113.6）。距離（帯）だけでは、国境の川と近くの川を区別できない
#   （バチカンにテヴェレ川が載る）。「無いものを有ると言う」ほうが「有るものを載せ損ねる」より重いので、0km は外す。
#   外したために帯の上位15本から消えた川は、国のページに名前を書く（載せ損ねたことも書く）
out_top = [r for r in rivers[:15] if r['len_km'] <= 0]
rivers = [r for r in rivers if r['len_km'] > 0]
river_top = rivers[:15]

# ---------- 湖：natural=water かつ water=lake、広い順に10 ----------
lakes = []
for f in read_seq('water.geojsonseq'):
    p = f['properties']
    if p.get('water') != 'lake':
        continue
    g = shape(f['geometry'])
    if not g.is_valid:
        g = g.buffer(0)
    if not in_japan(g):
        continue
    # 選ぶのは国の輪郭にかかる湖だけ（上の in_japan）。面積はこれまでどおり国の形を約2km 広げた範囲で測る
    # （国境をまたぐ湖を国境で切らない。この規則を変えるかは未決。DESIGN.md §113）
    gi = g if JPIN.contains(g) else g.intersection(JPIN)
    a = sum(abs(G.geometry_area_perimeter(p)[0]) for p in polys_of(gi)) / 1e6
    lakes.append({'name': name_of(p), 'geom': g, 'area_km2': a, 'id': f.get('id') or p.get('@id')})
lakes.sort(key=lambda r: -r['area_km2'])
lake_top = lakes[:10]

# ---------- 道路・鉄道：全部（link は除く） ----------
def collect(fn, pick):
    out = defaultdict(list)
    for f in read_seq(fn):
        p = f['properties']
        k = pick(p)
        if not k:
            continue
        g = shape(f['geometry'])
        if not in_japan(g):
            continue
        g = clip(g)
        if lines_of(g):
            out[k].append({'name': name_of(p), 'geom': g, 'ref': p.get('ref')})
    return out

roads = collect('road.geojsonseq', lambda p: p.get('highway') if p.get('highway') in ('motorway', 'trunk') else None)
rails = collect('rail.geojsonseq', lambda p: 'hsr' if p.get('highspeed') == 'yes' else ('main' if p.get('usage') == 'main' else None))
segs = {'motorway': roads['motorway'], 'trunk': roads['trunk'], 'hsr': rails['hsr'], 'main': rails['main']}

stats = {'river_ways': n_river_ways, 'rivers_named': sum(1 for r in river_top if r['name']), 'lakes_named': sum(1 for r in lake_top if r['name']),
         'lake_ways_total': len(lakes), 'river_candidates': len(rivers),
         'rivers': [(r['name'], round(r['len_km'], 1)) for r in river_top],
         'rivers_outside': [(r['name'], round(r['len_band_km'], 1)) for r in out_top],
         'rivers_outside_keys': [r['key'] for r in out_top],
         'rivers_next': [(r['name'], round(r['len_km'], 1)) for r in rivers[15:25]],
         'lakes': [(r['name'], round(r['area_km2'], 1)) for r in lake_top],
         'lakes_next': [(r['name'], round(r['area_km2'], 1)) for r in lakes[10:16]]}
for k, v in segs.items():
    tot = sum(inlen(s['geom']) for s in v)
    named = [s for s in v if s['name']]
    ntot = sum(inlen(s['geom']) for s in named)
    names = defaultdict(float)
    for s in named:
        names[s['name']] += inlen(s['geom']) / 1000
    stats[k] = {'ways': len(v), 'named_ways': len(named), 'named_share_ways': round(len(named) / max(1, len(v)), 3),
                'km': round(tot / 1000), 'named_share_km': round(ntot / max(1, tot), 3), 'n_names': len(names),
                'top_names': sorted(((n, round(l)) for n, l in names.items()), key=lambda x: -x[1])[:25]}

pickle.dump({'river_top': river_top, 'lake_top': lake_top, 'segs': segs}, open(os.path.join(WD, 'prep.pkl'), 'wb'))
json.dump(stats, open(os.path.join(WD, 'stats.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(stats, ensure_ascii=False, indent=1))

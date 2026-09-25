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


# その国の範囲 = Natural Earth v5.1.2 の国（海上の橋・河口・国境の川のため 0.1度だけ広げる）
ne0 = json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))
JP = shape(next(f for f in ne0['features'] if f['properties']['ADM0_A3'] == CC)['geometry'])
JPBUF = JP.buffer(0.1)
JPB = prep(JPBUF)
JPIN = JP.buffer(0.02)       # 湖の面積を測る範囲（国の中のぶんだけ）


def in_japan(g):
    return JPB.intersects(g)


def clip(g):
    # 国の外に出た部分は測らない（川の長さは「その国で」の長さ）
    return g if JPB.contains(g) else g.intersection(JPBUF)


def glen(g):
    return sum(G.geometry_length(l) for l in lines_of(g))


# ---------- 川：同じ名前の区間をつなぎ、つながった塊ごとに長さを測る ----------
by_name = defaultdict(list)
n_river_ways = 0
for f in read_seq('river.geojsonseq'):
    g = shape(f['geometry'])
    if not in_japan(g):
        continue
    n_river_ways += 1
    g = clip(g)
    if lines_of(g):
        by_name[name_of(f['properties'])].append(g)

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
        rivers.append({'name': nm, 'geom': MultiLineString(c), 'len_km': glen(MultiLineString(c)) / 1000})
rivers.sort(key=lambda r: -r['len_km'])
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
         'rivers_next': [(r['name'], round(r['len_km'], 1)) for r in rivers[15:25]],
         'lakes': [(r['name'], round(r['area_km2'], 1)) for r in lake_top],
         'lakes_next': [(r['name'], round(r['area_km2'], 1)) for r in lakes[10:16]]}
for k, v in segs.items():
    tot = sum(glen(s['geom']) for s in v)
    named = [s for s in v if s['name']]
    ntot = sum(glen(s['geom']) for s in named)
    names = defaultdict(float)
    for s in named:
        names[s['name']] += glen(s['geom']) / 1000
    stats[k] = {'ways': len(v), 'named_ways': len(named), 'named_share_ways': round(len(named) / max(1, len(v)), 3),
                'km': round(tot / 1000), 'named_share_km': round(ntot / max(1, tot), 3), 'n_names': len(names),
                'top_names': sorted(((n, round(l)) for n, l in names.items()), key=lambda x: -x[1])[:25]}

pickle.dump({'river_top': river_top, 'lake_top': lake_top, 'segs': segs}, open(os.path.join(WD, 'prep.pkl'), 'wb'))
json.dump(stats, open(os.path.join(WD, 'stats.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(stats, ensure_ascii=False, indent=1))

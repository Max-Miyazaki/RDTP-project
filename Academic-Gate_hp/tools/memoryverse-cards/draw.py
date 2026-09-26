# 国のカードを描く：SVG（image/memoryverse/cards/）と国のページ（html/country/）を書き出す。
#   層1・層3 = Natural Earth v5.1.2、層2 = OpenStreetMap（prep.py が絞り込んだ prep.pkl）
#   使い方：python draw.py JPN   （README.md）
import json, math, pickle, os, re, sys
from collections import defaultdict
from shapely.geometry import shape, box, LineString, MultiLineString, Polygon, MultiPolygon
from shapely.ops import unary_union, linemerge, polylabel
from shapely import affinity, set_precision
from prep_util import lines_of, polys_of, merge, label_name, first_script, clip_len, clip_tail
from svgutil import fmt, rel, d_lines, d_polys
from html import escape

from countries import COUNTRIES, NE, SVG_DIR, PAGE_DIR, SITE

D = os.path.dirname(os.path.abspath(__file__))
CC = sys.argv[1] if len(sys.argv) > 1 else 'JPN'
C = COUNTRIES[CC]
WD = C['dir']
os.makedirs(SVG_DIR, exist_ok=True)
os.makedirs(PAGE_DIR, exist_ok=True)
P = pickle.load(open(os.path.join(WD, 'prep.pkl'), 'rb'))
INFO = json.load(open(os.path.join(WD, 'osm/fileinfo.json')))
STATS = json.load(open(os.path.join(WD, 'stats.json')))

PHI0 = C['phi0']
K = math.cos(math.radians(PHI0))        # 日本 0.7941、チャド 0.9647
ZOOM = C.get('zoom', 1)                  # 1度44pxのままでは図にならない国だけ倍率を上げる（図とカードに明記。§100.11）
S = 44.0 * ZOOM                          # 圧縮後 1度あたり 44px（どの国も同じ。ZOOM の国だけその倍）
FINE = C.get('fine')
# 1級区分をまとめる単位の呼び名（日本は「地方」、フランスは「地域圏」）と、地図の上の書き方
RWORD = C.get('region_word', '地方')
RSUF = C.get('region_suffix', '地方')     # 名前の後ろに付ける語（日本「東北」＋「地方」）
RFS, RLS = C.get('region_fs', 15), C.get('region_ls', 3)                     # 倍率を上げた国の細い格子の間隔（度）
ML, MR, MT, MB = 46, 14, 26, 26          # 余白（緯度ラベル・経度ラベル・見出し）
PANELS = C['panels']

# ---------------- Natural Earth ----------------
ne0 = json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))
JP = None                                # その国（名前は日本の試作のときのまま）
NEI = []
for f in ne0['features']:
    g = shape(f['geometry'])
    if f['properties']['ADM0_A3'] == CC:
        JP = g
    else:
        NEI.append((f['properties']['NAME_JA'], g))
ne1 = json.load(open(os.path.join(NE, 'ne_10m_admin_1_states_provinces.geojson')))
PREF = []
for f in ne1['features']:
    p = f['properties']
    if p['adm0_a3'] != CC:
        continue
    reg = p['region'] or C['region_fill'].get(p['name_ja'])
    PREF.append({'name': label_name(p['name_ja'] or p['name']), 'region': C['regions'].get(reg), 'geom': shape(f['geometry']).buffer(0)})
REGIONS = defaultdict(list)
for p in PREF:
    if p['region']:
        REGIONS[p['region']].append(p['geom'])
REGIONS = {k: unary_union(v) for k, v in REGIONS.items()}
PREF_ALL = unary_union([p['geom'] for p in PREF])
COAST = PREF_ALL.boundary.buffer(0.004)
def inner_lines(polys):
    if not polys:
        return MultiLineString()
    return unary_union([g.boundary for g in polys]).difference(COAST)
PREF_LINES = inner_lines([p['geom'] for p in PREF])
REG_LINES = inner_lines(list(REGIONS.values()))

pp = json.load(open(os.path.join(NE, 'ne_10m_populated_places.geojson')))
CITIES = []
for f in pp['features']:
    q = f['properties']
    if q['ADM0_A3'] == CC:
        nm = re.sub(C['city_strip'], '', q['NAME_JA']) if C['city_strip'] else (q['NAME_JA'] or q['NAME'])
        CITIES.append({'name': label_name(nm), 'lon': q['LONGITUDE'], 'lat': q['LATITUDE'], 'pop': q['POP_MAX']})
CITIES.sort(key=lambda c: -c['pop'])
CITIES = CITIES[:20]                     # 都市：人口（POP_MAX）の多い順に20
print(CC, 'admin1', len(PREF), 'named', sum(1 for p in PREF if p['name']), 'regions', len(REGIONS), 'cities', len(CITIES))


HOME = {k: max(PANELS, key=lambda pk: g.intersection(box(PANELS[pk]['lon'][0], PANELS[pk]['lat'][0], PANELS[pk]['lon'][1], PANELS[pk]['lat'][1])).area)
        for k, g in REGIONS.items()}


# ---------------- 描画の道具 ----------------
class Panel:
    def __init__(self, key):
        c = PANELS[key]
        self.key, self.title = key, c['title']
        self.lon0, self.lon1 = c['lon']
        self.lat0, self.lat1 = c['lat']
        self.bb = box(self.lon0, self.lat0, self.lon1, self.lat1)
        self.w = (self.lon1 - self.lon0) * K * S
        self.h = (self.lat1 - self.lat0) * S
        self.W, self.H = ML + self.w + MR, MT + self.h + MB
        self.boxes = defaultdict(list)       # ラベルの衝突判定（グループごと）

    def xy(self, lon, lat):
        return ML + (lon - self.lon0) * K * S, MT + (self.lat1 - lat) * S

    def proj(self, g):
        # 経度→x、緯度→y（線形）なのでアフィン変換で済む
        return affinity.affine_transform(g, [K * S, 0, 0, -S, ML - self.lon0 * K * S, MT + self.lat1 * S])

    def netproj(self, g, tol):
        # 線網の間引き：図の上で 0.5px の格子に寄せてから重なりを消し、つなぎ直す。
        # 上り下りの2本の車線・複線の線路は同じ線になり、交差点で細切れになった区間もつながる。
        g = g.intersection(self.bb)
        if g.is_empty:
            return g
        return merge(unary_union(set_precision(self.proj(g), 0.5))).simplify(tol, preserve_topology=False)

    def clipproj(self, g, tol=0.3):
        g = g.intersection(self.bb)
        if g.is_empty:
            return g
        return self.proj(g).simplify(tol, preserve_topology=False)


def tw(text, fs):
    """文字幅の見積もり（全角 = fs、半角 = 0.62fs。欧文の太めの字に合わせて少し広めに見る）"""
    return sum(fs if ord(ch) > 0x2000 else fs * 0.62 for ch in text)


def overlaps(a, b, pad=2):
    return not (a[2] + pad < b[0] or b[2] + pad < a[0] or a[3] + pad < b[1] or b[3] + pad < a[1])


def try_place(pn, group, text, fs, cx, cy, anchor='middle'):
    w = tw(text, fs)
    x0 = cx - w / 2 if anchor == 'middle' else cx
    bx = (x0, cy - fs * 0.9, x0 + w, cy + fs * 0.25)
    if bx[0] < ML + 1 or bx[2] > ML + pn.w - 1 or bx[1] < MT + 1 or bx[3] > MT + pn.h - 1:
        return False
    if any(overlaps(bx, o) for o in pn.boxes[group]):
        return False
    pn.boxes[group].append(bx)
    return True


# ---------------- 各パネル ----------------
L2_STYLE = {
    'lake':     'fill="#5fd0ff" fill-opacity=".55" stroke="#5fd0ff" stroke-width=".6"',
    'river':    'fill="none" stroke="#5fd0ff" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"',
    'trunk':    'fill="none" stroke="#a7784a" stroke-width=".7" stroke-linejoin="round" stroke-opacity=".9"',
    'motorway': 'fill="none" stroke="#ffb46b" stroke-width="1.3" stroke-linejoin="round"',
    'main':     'fill="none" stroke="#8fe3c9" stroke-width=".9" stroke-dasharray="3 2"',
    'hsr':      'fill="none" stroke="#8fe3c9" stroke-width="1.8" stroke-dasharray="6 2.5"',
}
LBL_FILL = {'lake': '#9be3ff', 'river': '#9be3ff', 'trunk': '#d9a577', 'motorway': '#ffc98f', 'main': '#b6f0dd', 'hsr': '#b6f0dd'}
TOL = {'river': .35, 'trunk': .5, 'motorway': .5, 'main': .5, 'hsr': .5}
KIND_ORDER = ['lake', 'river', 'trunk', 'motorway', 'main', 'hsr']   # 描く順（下から）


def label_text(el, x, y, text, fs, fill, anchor='middle', extra=''):
    el.append(f'<text x="{fmt(x)}" y="{fmt(y)}" font-size="{fs}" fill="{fill}" text-anchor="{anchor}"{extra}>{escape(text, quote=False)}</text>')


NAMES_ALL, NAMES_PLACED = defaultdict(set), defaultdict(set)   # 図に入る区分・都市の名前と、置けた名前（図をまたいで1回）


def scale_bar(pn):
    """縮尺の棒：図の幅の3分の1に収まる長さ（100・50・20・10・5・2・1・0.5km から）。右下の角に置く"""
    km_px = S / (math.pi * 6371.0088 / 180)                 # 1km が何 px か（南北。標準緯線上では東西も同じ）
    km = next(k for k in (100, 50, 20, 10, 5, 2, 1, 0.5) if k * km_px <= min(120, pn.w / 3))
    L = km * km_px
    return km, L, ML + pn.w - 12 - L, MT + pn.h - 12


def build(pn):
    E = []   # SVG 要素
    W, H = pn.W, pn.H
    E.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(W)} {fmt(H)}" width="{fmt(W)}" height="{fmt(H)}" '
             f'class="cc-map" role="img" aria-label="{C['name']}（{pn.title}）：位置と形・骨組み・区画の3層">')
    E.append('<style>.cc-map text{font-family:"Hiragino Sans","Noto Sans JP",system-ui,sans-serif;paint-order:stroke;stroke:#000;stroke-width:2.6px;stroke-linejoin:round}</style>')
    E.append(f'<clipPath id="cc-{CC.lower()}-{pn.key}"><rect x="{ML}" y="{MT}" width="{fmt(pn.w)}" height="{fmt(pn.h)}"/></clipPath>')
    E.append(f'<rect x="{ML}" y="{MT}" width="{fmt(pn.w)}" height="{fmt(pn.h)}" fill="#05080d"/>')

    # 格子：1度・5度・30度
    g1, g5, g30 = [], [], []
    for lon in range(math.ceil(pn.lon0), math.floor(pn.lon1) + 1):
        x, _ = pn.xy(lon, 0)
        (g30 if lon % 30 == 0 else g5 if lon % 5 == 0 else g1).append(f'M{fmt(x)} {MT}V{fmt(MT + pn.h)}')
    for lat in range(math.ceil(pn.lat0), math.floor(pn.lat1) + 1):
        _, y = pn.xy(0, lat)
        (g30 if lat % 30 == 0 else g5 if lat % 5 == 0 else g1).append(f'M{ML} {fmt(y)}H{fmt(ML + pn.w)}')
    E.append('<g class="grid">')
    E.append(f'<path d="{"".join(g1)}" stroke="rgba(255,255,255,.06)" stroke-width=".5" fill="none"/>')
    E.append(f'<path d="{"".join(g5)}" stroke="rgba(255,255,255,.16)" stroke-width=".8" fill="none"/>')
    if g30:
        E.append(f'<path d="{"".join(g30)}" stroke="rgba(255,255,255,.42)" stroke-width="1.3" fill="none"/>')
    lab = []
    if FINE:
        # 倍率を上げた国：1度・5度の線はほとんど枠に入らないので、細い格子（FINE 度ごと）を引いてラベルもそれに付ける
        d = max(0, -int(math.floor(math.log10(FINE) + 1e-9)))
        gf = []
        for i in range(math.ceil(pn.lon0 / FINE - 1e-9), math.floor(pn.lon1 / FINE + 1e-9) + 1):
            lon = round(i * FINE, 6)
            x, _ = pn.xy(lon, 0)
            gf.append(f'M{fmt(x)} {MT}V{fmt(MT + pn.h)}')
            if x < ML + pn.w - 22:
                label_text(lab, x, MT + pn.h + 15, (f'東経{lon:.{d}f}°' if lon >= 0 else f'西経{-lon:.{d}f}°'), 9.5, 'rgba(255,255,255,.55)', extra=' stroke="none"')
        for i in range(math.ceil(pn.lat0 / FINE - 1e-9), math.floor(pn.lat1 / FINE + 1e-9) + 1):
            lat = round(i * FINE, 6)
            _, y = pn.xy(0, lat)
            gf.append(f'M{ML} {fmt(y)}H{fmt(ML + pn.w)}')
            label_text(lab, ML - 5, y + 3.5, (f'北緯{lat:.{d}f}°' if lat >= 0 else f'南緯{-lat:.{d}f}°'), 9.5, 'rgba(255,255,255,.55)', 'end', ' stroke="none"')
        E.insert(len(E) - (3 if g30 else 2), f'<path d="{"".join(gf)}" stroke="rgba(255,255,255,.07)" stroke-width=".6" stroke-dasharray="2 3" fill="none"/>')
    else:
        for lon in range(math.ceil(pn.lon0), math.floor(pn.lon1) + 1):
            if lon % 5 == 0:
                x, _ = pn.xy(lon, 0)
                label_text(lab, x, MT + pn.h + 15, (f'東経{lon}°' if lon >= 0 else f'西経{-lon}°'), 10, 'rgba(255,255,255,.55)', extra=' stroke="none"')
        for lat in range(math.ceil(pn.lat0), math.floor(pn.lat1) + 1):
            if lat % 5 == 0:
                _, y = pn.xy(0, lat)
                label_text(lab, ML - 5, y + 3.5, (f'北緯{lat}°' if lat >= 0 else f'南緯{-lat}°'), 10, 'rgba(255,255,255,.55)', 'end', ' stroke="none"')
    E += lab
    E.append('</g>')

    E.append(f'<g clip-path="url(#cc-{CC.lower()}-{pn.key})">')
    # ---- 層1：隣国・日本の陸と海岸線 ----
    E.append('<g class="L1">')
    nd = ''.join(d_polys(pn.clipproj(g, .3)) for _, g in NEI if g.intersects(pn.bb))
    E.append(f'<path class="nei" d="{nd}" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.18)" stroke-width=".7" stroke-linejoin="round"/>')
    E.append(f'<path class="land" d="{d_polys(pn.clipproj(JP, .25))}" fill="rgba(61,139,255,.16)" stroke="#6aa9ff" stroke-width=".8" stroke-linejoin="round"/>')
    E.append('</g>')

    # ---- 層2：骨組み（OSM） ----
    _, L_, x0_, y0_ = scale_bar(pn)
    for grp in ('L2', 'L3'):                 # 縮尺の棒と「100 km」の文字の上にはラベルを置かない
        pn.boxes[grp].append((x0_ - 3, y0_ - 18, x0_ + L_ + 3, y0_ + 3))
    items = []    # ラベル候補 (長さpx, 種類, 名前, 候補点の列)
    E.append('<g class="L2">')
    geoms = {'lake': [l['geom'] for l in P['lake_top']], 'river': [r['geom'] for r in P['river_top']]}
    for k in ('trunk', 'motorway', 'main', 'hsr'):
        geoms[k] = [s['geom'] for s in P['segs'][k]]
    for k in KIND_ORDER:
        if k == 'lake':
            d = ''.join(d_polys(pn.clipproj(g, .2)) for g in geoms[k] if g.intersects(pn.bb))
        else:
            merged = merge(geoms[k])
            d = d_lines(pn.netproj(merged, TOL[k]) if k != 'river' else pn.clipproj(merged, TOL[k]))
        E.append(f'<g class="k-{k}"><path d="{d}" {L2_STYLE[k]}/></g>')
    E.append('</g>')

    # ラベル候補
    for l in P['lake_top']:
        if l['name'] and l['geom'].intersects(pn.bb):
            g = pn.proj(max(polys_of(l['geom'].intersection(pn.bb)), key=lambda p: p.area))
            pt = polylabel(g, 0.5)
            items.append((1e9 + l['area_km2'], 'lake', first_script(l['name']), [(pt.x, pt.y + 13), (pt.x, pt.y - 6), (pt.x + 30, pt.y + 4)]))
    def line_cands(k, nm, gs):
        g = pn.clipproj(merge(gs), .35)
        ls = lines_of(g)
        if not ls:
            return
        tot = sum(l.length for l in ls)
        if tot < 25:            # 図の中で25px（約50km）未満の断片には付けない
            return
        main = max(ls, key=lambda l: l.length)
        cands = []
        for t in (.5, .38, .62, .26, .74, .15, .85):
            p = main.interpolate(t, normalized=True)
            cands += [(p.x, p.y - 4), (p.x, p.y + 12)]
        items.append((tot, k, first_script(nm), cands))
    for r in P['river_top']:
        if r['name']:
            line_cands('river', r['name'], [r['geom']])
    for k in ('trunk', 'motorway', 'main', 'hsr'):
        byn = defaultdict(list)
        for s in P['segs'][k]:
            if s['name'] and s['geom'].intersects(pn.bb):
                byn[s['name']].append(s['geom'])
        for nm, gs in byn.items():
            line_cands(k, nm, gs)
    PRI = {'lake': 0, 'river': 1, 'hsr': 2, 'motorway': 3, 'main': 4, 'trunk': 5}   # 水→高速鉄道→高速道路→主要鉄道→主要幹線、同じ種類の中は長い順
    items.sort(key=lambda it: (PRI[it[1]], -it[0]))
    # 置く → 切り詰めで同じ図の中に同じ文字列ができたら、その名前だけ後ろを残して切り直し、置き直す。
    # 後ろを残してもまだ同じなら、そのまま（無理に区別しない）。
    tails = set()
    pn.dups = []
    for _round in range(3):
        pn.boxes['L2'] = []
        lbl = defaultdict(list)
        placed = defaultdict(int)
        shown = defaultdict(set)          # 表示した文字列 → 元の名前
        for _, k, raw, cands in items:
            nm = clip_tail(raw) if raw in tails else clip_len(raw)
            fs = 10 if k in ('lake', 'river') else 9
            for cx, cy in cands:
                if try_place(pn, 'L2', nm, fs, cx, cy):
                    label_text(lbl[k], cx, cy, nm, fs, LBL_FILL[k])
                    placed[k] += 1
                    shown[nm].add(raw)
                    break
        dup = {t: r for t, r in shown.items() if len(r) > 1 and t.endswith('…')}
        new = set().union(*dup.values()) - tails if dup else set()
        pn.dups.append({t: sorted(r) for t, r in shown.items() if len(r) > 1})
        if not new:
            break
        tails |= new
    pn.tails = sorted(tails)
    pn.placed = dict(placed)
    pn.cand = defaultdict(int)
    for _, k, _, _ in items:
        pn.cand[k] += 1

    # ---- 層3：区画（Natural Earth） ----
    E.append('<g class="L3">')
    E.append(f'<path class="pref-line" d="{d_lines(pn.clipproj(PREF_LINES, .5))}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width=".7"/>')
    reg = [f'<path d="{d_lines(pn.clipproj(REG_LINES, .3))}" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="1.5" stroke-linejoin="round"/>']
    city, prefn = [], []
    pts = []
    for c in CITIES:
        if pn.bb.contains(shape({'type': 'Point', 'coordinates': (c['lon'], c['lat'])})):
            x, y = pn.xy(c['lon'], c['lat'])
            pts.append((c, x, y))
            pn.boxes['L3'].append((x - 2, y - 2, x + 2, y + 2))
    for c, x, y in pts:
        city.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="2.3" fill="#fff"/>')
        w = tw(c['name'], 10)
        for (dx, dy, an) in ((6, 3.5, 'start'), (-6, 3.5, 'end'), (0, -7, 'middle'), (0, 14, 'middle')):
            bx = x + dx - (w if an == 'end' else 0) if an != 'middle' else x
            if try_place(pn, 'L3', c['name'], 10, bx, y + dy, 'start' if an != 'middle' else 'middle'):
                label_text(city, x + dx, y + dy, c['name'], 10, '#fff', an, ' font-weight="600"')
                NAMES_PLACED['city'].add(c['name'])
                break
        NAMES_ALL['city'].add(c['name'])
    for p in PREF:
        gi = p['geom'].intersection(pn.bb)
        if gi.is_empty:
            continue
        big = max(polys_of(pn.proj(gi)), key=lambda q: q.area)
        NAMES_ALL['prefname'].add(p['name'])    # 小さすぎて置かないものも「データにはある」に数える
        if big.area < 40:
            continue
        pt = polylabel(big, 0.3)
        w = tw(p['name'], 9)
        for dx, dy in ((0, 3), (0, 13), (0, -7), (w * .6, 3), (-w * .6, 3), (w * .6, 13), (-w * .6, -7), (0, 23), (0, -17)):
            if try_place(pn, 'L3', p['name'], 9, pt.x + dx, pt.y + dy):
                label_text(prefn, pt.x + dx, pt.y + dy, p['name'], 9, 'rgba(255,255,255,.8)')
                pn.placed['prefname'] = pn.placed.get('prefname', 0) + 1
                NAMES_PLACED['prefname'].add(p['name'])
                break
    # 地方名：都市・都道府県名を置いたあと、その地方の中の空いている所に置く
    for k, g in REGIONS.items():
        gi = g.intersection(pn.bb)
        if gi.is_empty:
            continue
        if HOME[k] != pn.key:          # 地方名は、その地方の面積をいちばん多く含む図にだけ置く
            continue
        big = max(polys_of(pn.proj(gi)), key=lambda p: p.area)
        w = tw(k + RSUF, RFS) + RLS * len(k + RSUF)
        pl = polylabel(big, 0.5)
        best = None
        near = big.buffer(30)          # 中に空きが無ければ、すぐ外（海の上）にも置ける
        others = unary_union([pn.proj(h) for kk, h in REGIONS.items() if kk != k and h.intersects(pn.bb)])
        x0, y0, x1, y1 = near.bounds
        for gx in range(int(x0), int(x1) + 1, 4):
            for gy in range(int(y0), int(y1) + 1, 4):
                pt = shape({'type': 'Point', 'coordinates': (gx, gy)})
                if not near.contains(pt) or others.contains(pt):
                    continue
                bx = (gx - w / 2, gy - 13, gx + w / 2, gy + 3)
                if bx[0] < ML + 2 or bx[2] > ML + pn.w - 2 or bx[1] < MT + 2 or bx[3] > MT + pn.h - 2:
                    continue
                hits = sum(overlaps(bx, o, 1) for o in pn.boxes['L3'])
                score = (hits, 0 if big.contains(pt) else 1, math.hypot(gx - pl.x, gy - pl.y))
                if best is None or score < best[0]:
                    best = (score, gx, gy, bx)
        NAMES_ALL['region'].add(k)
        if best is None or best[0][0] > 0:   # 図の中に入る場所が無い、またはどこに置いても重なる（小さい図に長い名前）——置かずに数える
            pn.placed['region_skipped'] = pn.placed.get('region_skipped', 0) + 1
            continue
        _, gx, gy, bx = best
        pn.boxes['L3'].append(bx)
        NAMES_PLACED['region'].add(k)
        reg.append(f'<text x="{fmt(gx)}" y="{fmt(gy)}" font-size="{RFS}" font-weight="700" fill="rgba(255,255,255,.34)" text-anchor="middle" letter-spacing="{RLS}" stroke="none">{k}{RSUF}</text>')
    E.append('<g class="k-region">' + ''.join(reg) + '</g>')
    E.append('</g>')

    # ラベルは層ごと・種類ごとに最前面へ
    E.append('<g class="L2 lbl">' + ''.join(f'<g class="k-{k}">' + ''.join(v) + '</g>' for k, v in lbl.items()) + '</g>')
    E.append('<g class="L3 lbl"><g class="k-prefname">' + ''.join(prefn) + '</g><g class="k-city">' + ''.join(city) + '</g></g>')
    E.append('</g>')   # clip

    # 枠・見出し・縮尺
    E.append(f'<rect x="{ML}" y="{MT}" width="{fmt(pn.w)}" height="{fmt(pn.h)}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1"/>')
    E.append(f'<text x="{ML}" y="{MT - 9}" font-size="12" fill="#fff" font-weight="600" stroke="none">{pn.title}</text>')
    if ZOOM != 1:
        E.append(f'<text x="{fmt(ML + pn.w)}" y="{MT - 9}" font-size="11" fill="#ffd166" font-weight="600" text-anchor="end" stroke="none">この図だけ {ZOOM}倍（1度＝{int(S):,}px）</text>')
    km, L, x0, y0 = scale_bar(pn)
    E.append(f'<path d="M{fmt(x0)} {fmt(y0 - 4)}V{fmt(y0)}H{fmt(x0 + L)}V{fmt(y0 - 4)}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.2"/>')
    E.append(f'<text x="{fmt(x0 + L / 2)}" y="{fmt(y0 - 7)}" font-size="9.5" fill="rgba(255,255,255,.75)" text-anchor="middle">{km:g} km</text>')
    E.append('</svg>')
    return '\n'.join(E)


def svg_name(key):
    # 図が1枚の国は tcd.svg、2枚以上は jpn-main.svg / jpn-ryukyu.svg
    return f'{CC.lower()}.svg' if len(PANELS) == 1 else f'{CC.lower()}-{key}.svg'


svgs = {}
report = {}
for key in PANELS:
    pn = Panel(key)
    s = build(pn)
    fn = os.path.join(SVG_DIR, svg_name(key))
    open(fn, 'w').write(s)
    svgs[key] = pn
    report[key] = {'file': os.path.relpath(fn, SITE), 'size_kb': round(os.path.getsize(fn) / 1024, 1), 'W': round(pn.W), 'H': round(pn.H),
                   'labels_placed': pn.placed, 'dup_rounds': pn.dups, 'tail_cut': pn.tails, 'label_candidates': dict(pn.cand)}
print(json.dumps(report, ensure_ascii=False, indent=1))
json.dump(report, open(os.path.join(WD, 'report.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------- 国のページ ----------------
# キャッシュバスターはサイトの代表ページ（html/index.html）と同じ版にそろえる（tools/bump.sh が html/ 以下を一括で上げる）
VER = re.search(r'v=(r\d+)', open(os.path.join(SITE, 'html', 'index.html')).read()).group(1)
ts = INFO['header']['option'].get('osmosis_replication_timestamp') or INFO['data']['timestamp']['last']
COUNT = {'river': len(STATS['rivers']), 'lake': len(STATS['lakes']),
         'motorway': STATS['motorway']['ways'], 'trunk': STATS['trunk']['ways'],
         'hsr': STATS['hsr']['ways'], 'main': STATS['main']['ways'],
         'region': len(REGIONS), 'prefname': len(PREF), 'city': len(CITIES)}
SUBS = [('L2', 'river', '川', 'border-color:#5fd0ff', ''), ('L2', 'lake', '湖', 'border-top-width:6px;border-color:rgba(95,208,255,.6)', ''),
        ('L2', 'motorway', '高速道路', 'border-color:#ffb46b', ''), ('L2', 'trunk', '主要幹線', 'border-color:#a7784a;border-top-width:1px', ''),
        ('L2', 'hsr', '高速鉄道', 'border-color:#8fe3c9;border-top-width:3px', ' dash'), ('L2', 'main', '主要鉄道', 'border-color:#8fe3c9;border-top-width:1px', ' dash'),
        None,
        ('L3', 'region', RWORD, '', ''), ('L3', 'prefname', C['admin1_word'] + '名', '', ''), ('L3', 'city', '都市', '', '')]
btn = []
for sb in SUBS:
    if sb is None:
        btn.append('<span class="cc-sep"></span>')
        continue
    L, k, lab, sw, dash = sb
    swh = f'<i class="cc-sw{dash}" style="{sw}"></i>' if sw else ''
    if COUNT[k] == 0:     # 無いものは無いと見せる：押せないボタンに「なし」。図には何も足さない
        btn.append(f'<button class="cc-sub cc-zero" data-layer="{L}" data-k="{k}" aria-pressed="false" disabled title="この国のデータに無い">{swh}{lab}<em>なし</em></button>')
    else:
        btn.append(f'<button class="cc-sub" data-layer="{L}" data-k="{k}" aria-pressed="true">{swh}{lab}</button>')
NAMES = {'river': '川', 'lake': '湖', 'motorway': '高速道路', 'trunk': '主要幹線', 'hsr': '高速鉄道', 'main': '主要鉄道', 'region': RWORD, 'prefname': C['admin1_word'] + '名', 'city': '都市'}
zeros = [NAMES[k] for k in COUNT if COUNT[k] == 0]
zero_html = (f'<p class="cc-zeros">この国のデータに<b>無いもの</b>：{"・".join(zeros)}（0なので線も名前も描いていない）</p>') if zeros else ''
# 図は枠だけを書き、SVG は js/country-card.js がカードを開いたときに取りに行く（§100）。
# 枠の縦横比を先に決めておくので、届くまでのあいだ下の段落が跳ねない。
figs = ''.join(
    f'<div class="cc-scroll"><div class="cc-fig" style="--w:{round(pn.W)};--h:{round(pn.H)}" '
    f'data-src="../image/memoryverse/cards/{svg_name(k)}?v={VER}">'
    f'<p class="cc-status">地図を読み込み中…</p><p class="cc-fallback">地図を読み込めませんでした</p></div></div>'
    for k, pn in svgs.items())
notes = ''.join(f'<p class="cc-note">{n}</p>' for n in C['notes'])
# 入りきらずに置かなかったラベル（データにはある）。「なし」（データに無い）と混ざらないよう書き分ける
tot = lambda k: len(NAMES_ALL[k])
got = lambda k: len(NAMES_PLACED[k] & NAMES_ALL[k])
miss = [(lab, tot(k), got(k)) for k, lab in (('region', RWORD + '名'), ('prefname', C['admin1_word'] + '名'), ('city', '都市名'))
        if tot(k) and got(k) < tot(k)]
l2 = sum(pn.cand.get(k, 0) for pn in svgs.values() for k in ('river', 'lake', 'motorway', 'trunk', 'hsr', 'main'))
l2got = sum(pn.placed.get(k, 0) for pn in svgs.values() for k in ('river', 'lake', 'motorway', 'trunk', 'hsr', 'main'))
if miss or l2got < l2:
    parts = '、'.join(f'{lab}は{t}のうち{g}' for lab, t, g in miss)
    notes += ('<p class="cc-note"><b>この縮尺で入りきらないラベルは置いていない。データには全部ある</b>'
              + (f'（層3：{parts}を表示）' if parts else '')
              + '。層2の川・湖・道路・鉄道の名前も、動かないものから長い順に置き、重なるものは飛ばしている。'
              + 'ボタンの<b>「なし」はデータに無いもの</b>で、これとは別。</p>')
if ZOOM == 1:
    notes += f'<p class="cc-note">{"2枚は同じ縮尺" if len(PANELS) > 1 else "縮尺"}（経度を cos {PHI0}° = {K:.4f} 倍に縮めたうえで、1度 = 44px。どの国も同じ）。細い格子は1度、中くらいは5度、太い線は30度（2-1 の升目）。</p>'
else:
    notes += f'<p class="cc-note"><b>この国の図だけ {ZOOM}倍</b>（経度を cos {PHI0}° = {K:.4f} 倍に縮めたうえで、1度 = {int(S):,}px。ほかの国のページは1度 = 44px）。1度44pxのままだと国が{C["zoom_why"]}になり、形が読めないため。点線の格子は{FINE:g}度ごと。</p>'
html = open(os.path.join(D, 'page_tpl.html')).read()
for a_, b_ in {'{{NAME}}': C['name'], '{{DESCRIPTION}}': C['description'], '{{CC}}': CC.lower(), '{{VER}}': VER,
               '{{UP_HREF}}': C.get('up_href', 'memoryverse.html'), '{{UP_LABEL}}': C.get('up_label', 'メモリーバース'),
               '{{BUTTONS}}': ''.join(btn), '{{ZEROS}}': zero_html, '{{FIGS}}': figs, '{{NOTES}}': notes,
               '{{SRC13}}': C['src13'], '{{PBF}}': C['geofabrik'].split('/')[-1], '{{OSM_TS}}': ts, '{{PHI0}}': f'{PHI0}', '{{FIG}}': C['fig']}.items():
    html = html.replace(a_, b_)
assert '{{' not in html, re.findall(r'\{\{\w+\}\}', html)
out = os.path.join(PAGE_DIR, f'{CC.lower()}.html')
open(out, 'w').write(html)
print('page', os.path.relpath(out, SITE), 'ver', VER, 'OSM', ts, 'counts', COUNT)

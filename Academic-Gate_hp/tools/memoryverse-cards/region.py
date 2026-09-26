# 地域のカード（3章の地域の記事に置く図）を描く。いまは 3-1 西ヨーロッパだけ。
#   python region.py 3-1
# 書き出すもの（image/memoryverse/cards/）：
#   r3-1-shape.svg     04「9か国の形と位置」の図（層1 形）
#   r3-1-capitals.svg  05「首都」の図（層1 形＋層3 首都）
#   r3-1-zoom.svg      04 の拡大図（層2。モナコとリヒテンシュタイン。倍率を図の中に書く）
#   data/r3-1-cmp.svg  06 の見比べる図（展開図のまま／真上から見た形）。記事の中にそのまま埋め込むので
#                      image/ には置かない（2-1 §07 の比較図と同じ扱い。色は記事の CSS 変数）
# 縮尺は国のページと同じ「圧縮後1度＝44px」。標準緯線は地域の中心（本土の重心を丸めた値）。
import json, math, os, sys
from shapely.geometry import shape, box, Point, Polygon, MultiPolygon
from shapely.ops import unary_union, polylabel
from shapely import affinity
from pyproj import Geod
from countries import NE, SVG_DIR, DATA
from prep_util import polys_of
from svgutil import fmt, d_polys, d_lines

G = Geod(ellps='WGS84')
S = 44.0
ML, MR, MT, MB = 46, 14, 26, 26

REGIONS = {
    '3-1': {
        'title': '西ヨーロッパ',
        'phi0': 49.0,                                  # 9か国の本土の重心は北緯48.50度・東経6.21度
        'lon': (-5.6, 17.6), 'lat': (41.2, 55.4),
        'members': [  # ADM0_A3, 名前, ラベルの置き方（None＝本土の内側、('in', lon, lat)＝国の中のその点、(lon, lat)＝その点に置いて引き出し線）
            ('FRA', 'フランス', None), ('BEL', 'ベルギー', None), ('NLD', 'オランダ', ('in', 6.05, 52.75)),
            ('LUX', 'ルクセンブルク', (7.9, 49.95)), ('MCO', 'モナコ', (7.4, 42.75)), ('CHE', 'スイス', ('in', 8.35, 46.45)),
            ('LIE', 'リヒテンシュタイン', (11.2, 46.55)), ('DEU', 'ドイツ', None), ('AUT', 'オーストリア', None),
        ],
        'point_only': ['MCO', 'LIE'],                  # この縮尺では点になる国（ラベルは引き出し線で）
        # 首都：kind = capital（首都）/ seat（政府・議会の所在地。首都とは別）
        'capitals': [
            ('パリ', 2.3314, 48.8686, 'capital', 'r'), ('ブリュッセル', 4.3314, 50.8353, 'capital', 'l'),
            ('アムステルダム', 4.9147, 52.3519, 'capital', 'r'), ('ハーグ（政府・議会）', 4.2700, 52.0800, 'seat', 'l'),
            ('ルクセンブルク市', 6.1300, 49.6117, 'capital', 'r'), ('モナコ（都市国家）', 7.4069, 43.7396, 'capital', 'r'),
            ('ベルン（連邦都市）', 7.4670, 46.9167, 'capital', 'l'), ('ファドゥーツ', 9.5167, 47.1337, 'capital', 'r'),
            ('ベルリン', 13.3996, 52.5238, 'capital', 'r'), ('ウィーン', 16.3647, 48.2020, 'capital', 'r'),
        ],
        # 拡大図：（ADM0_A3, 名前, 倍率, 経度の範囲, 緯度の範囲, 細い格子の間隔, 縮尺の棒 km, 隣国のラベル）
        'zoom': [
            ('LIE', 'リヒテンシュタイン', 20, (9.36, 9.73), (46.99, 47.33), 0.1, 5, [('スイス', 9.43, 47.05), ('オーストリア', 9.66, 47.29)]),
            ('MCO', 'モナコ', 100, (7.345, 7.46), (43.70, 43.782), 0.02, 1, [('フランス', 7.39, 43.772)]),
        ],
    },
}


def load():
    ne0 = json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))
    C = {}
    for f in ne0['features']:
        p = f['properties']
        C[p['ADM0_A3']] = (shape(f['geometry']).buffer(0), p)
    return C


def area(g):
    return abs(G.geometry_area_perimeter(g)[0])


def mainland(g):
    return max(polys_of(g), key=area)


def tw(text, fs):
    return sum(fs if ord(ch) > 0x2000 else fs * 0.62 for ch in text)


class Frame:
    """正距円筒（標準緯線 phi0）で、1度＝S×zoom px の枠"""
    def __init__(self, lon, lat, phi0, zoom=1, ml=ML, mr=MR, mt=MT, mb=MB):
        self.lon0, self.lon1 = lon
        self.lat0, self.lat1 = lat
        self.K = math.cos(math.radians(phi0))
        self.s = S * zoom
        self.ml, self.mt = ml, mt
        self.w = (self.lon1 - self.lon0) * self.K * self.s
        self.h = (self.lat1 - self.lat0) * self.s
        self.W, self.H = ml + self.w + mr, mt + self.h + mb
        self.bb = box(self.lon0, self.lat0, self.lon1, self.lat1)
        self.boxes = []

    def xy(self, lon, lat):
        return self.ml + (lon - self.lon0) * self.K * self.s, self.mt + (self.lat1 - lat) * self.s

    def proj(self, g):
        return affinity.affine_transform(g, [self.K * self.s, 0, 0, -self.s, self.ml - self.lon0 * self.K * self.s, self.mt + self.lat1 * self.s])

    def cp(self, g, tol=0.25):
        g = g.intersection(self.bb)
        return g if g.is_empty else self.proj(g).simplify(tol, preserve_topology=False)

    def free(self, bx, pad=2):
        if bx[0] < self.ml + 2 or bx[2] > self.ml + self.w - 2 or bx[1] < self.mt + 2 or bx[3] > self.mt + self.h - 2:
            return False
        return not any(not (bx[2] + pad < o[0] or o[2] + pad < bx[0] or bx[3] + pad < o[1] or o[3] + pad < bx[1]) for o in self.boxes)


def text(x, y, t, fs, fill, anchor='middle', extra=''):
    return f'<text x="{fmt(x)}" y="{fmt(y)}" font-size="{fs}" fill="{fill}" text-anchor="{anchor}"{extra}>{t}</text>'


def grid(fr, fine=None):
    """格子：1度・5度・30度（2-1 の升目）。拡大図は細い格子（fine 度ごと）も引き、ラベルもそれに付ける。"""
    E, g1, g5, g30, gf, lab = [], [], [], [], [], []
    def deg_lines(step):
        lons = [round(v * step, 6) for v in range(math.ceil(fr.lon0 / step - 1e-9), math.floor(fr.lon1 / step + 1e-9) + 1)]
        lats = [round(v * step, 6) for v in range(math.ceil(fr.lat0 / step - 1e-9), math.floor(fr.lat1 / step + 1e-9) + 1)]
        return lons, lats
    lons, lats = deg_lines(1)
    for lon in lons:
        x, _ = fr.xy(lon, 0)
        (g30 if lon % 30 == 0 else g5 if lon % 5 == 0 else g1).append(f'M{fmt(x)} {fmt(fr.mt)}V{fmt(fr.mt + fr.h)}')
    for lat in lats:
        _, y = fr.xy(0, lat)
        (g30 if lat % 30 == 0 else g5 if lat % 5 == 0 else g1).append(f'M{fmt(fr.ml)} {fmt(y)}H{fmt(fr.ml + fr.w)}')
    ew = lambda v, d: (f'東経{v:.{d}f}°' if v >= 0 else f'西経{-v:.{d}f}°')
    ns = lambda v, d: (f'北緯{v:.{d}f}°' if v >= 0 else f'南緯{-v:.{d}f}°')
    if fine:
        d = max(0, -int(math.floor(math.log10(fine) + 1e-9)))
        flons, flats = deg_lines(fine)
        for lon in flons:
            x, _ = fr.xy(lon, 0)
            gf.append(f'M{fmt(x)} {fmt(fr.mt)}V{fmt(fr.mt + fr.h)}')
            if x > fr.ml + fr.w - 22:                    # 右端で切れるラベルは付けない
                continue
            lab.append(text(x, fr.mt + fr.h + 15, ew(lon, d), 9.5, 'rgba(255,255,255,.55)', extra=' stroke="none"'))
        for lat in flats:
            _, y = fr.xy(0, lat)
            gf.append(f'M{fmt(fr.ml)} {fmt(y)}H{fmt(fr.ml + fr.w)}')
            lab.append(text(fr.ml - 5, y + 3.5, ns(lat, d), 9.5, 'rgba(255,255,255,.55)', 'end', ' stroke="none"'))
    else:
        for lon in lons:
            if lon % 5 == 0:
                x, _ = fr.xy(lon, 0)
                lab.append(text(x, fr.mt + fr.h + 15, ew(lon, 0), 10, 'rgba(255,255,255,.55)', extra=' stroke="none"'))
        for lat in lats:
            if lat % 5 == 0:
                _, y = fr.xy(0, lat)
                lab.append(text(fr.ml - 5, y + 3.5, ns(lat, 0), 10, 'rgba(255,255,255,.55)', 'end', ' stroke="none"'))
    E.append('<g class="grid">')
    if gf:
        E.append(f'<path d="{"".join(gf)}" stroke="rgba(255,255,255,.07)" stroke-width=".6" stroke-dasharray="2 3" fill="none"/>')
    E.append(f'<path d="{"".join(g1)}" stroke="rgba(255,255,255,.06)" stroke-width=".5" fill="none"/>')
    E.append(f'<path d="{"".join(g5)}" stroke="rgba(255,255,255,.16)" stroke-width=".8" fill="none"/>')
    if g30:
        E.append(f'<path d="{"".join(g30)}" stroke="rgba(255,255,255,.42)" stroke-width="1.3" fill="none"/>')
    E += lab
    E.append('</g>')
    return E


def scale_bar(fr, km):
    px = km / (math.pi * 6371.0088 / 180) * fr.s          # 南北の km（標準緯線上では東西も同じ）
    x0, y0 = fr.ml + fr.w - 12 - px, fr.mt + fr.h - 12
    return [f'<path d="M{fmt(x0)} {fmt(y0 - 4)}V{fmt(y0)}H{fmt(x0 + px)}V{fmt(y0 - 4)}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.2"/>',
            text(x0 + px / 2, y0 - 7, f'{km} km', 9.5, 'rgba(255,255,255,.75)')]


STYLE = '<style>.cc-map text{font-family:"Hiragino Sans","Noto Sans JP",system-ui,sans-serif;paint-order:stroke;stroke:#000;stroke-width:2.6px;stroke-linejoin:round}</style>'
LAND = 'fill="rgba(61,139,255,.16)" stroke="#6aa9ff" stroke-width=".8" stroke-linejoin="round"'
NEI = 'fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.18)" stroke-width=".7" stroke-linejoin="round"'


def main_map(key, R, C, capitals):
    fr = Frame(R['lon'], R['lat'], R['phi0'])
    cid = f'cc-r{key.replace("-", "")}-{"cap" if capitals else "shape"}'
    E = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(fr.W)} {fmt(fr.H)}" width="{fmt(fr.W)}" height="{fmt(fr.H)}" class="cc-map" role="img" '
         f'aria-label="{R["title"]}の{len(R["members"])}か国の{"首都" if capitals else "形と位置"}">', STYLE,
         f'<clipPath id="{cid}"><rect x="{ML}" y="{MT}" width="{fmt(fr.w)}" height="{fmt(fr.h)}"/></clipPath>',
         f'<rect x="{ML}" y="{MT}" width="{fmt(fr.w)}" height="{fmt(fr.h)}" fill="#05080d"/>']
    E += grid(fr)
    E.append(f'<g clip-path="url(#{cid})">')
    mem = {a3 for a3, _, _ in R['members']}
    nei = ''.join(d_polys(fr.cp(g)) for a3, (g, p) in C.items() if a3 not in mem and g.intersects(fr.bb))
    land = ''.join(d_polys(fr.cp(C[a3][0])) for a3 in mem)
    E.append('<g class="L1">')
    E.append(f'<path d="{nei}" {NEI}/>')
    E.append(f'<path d="{land}" {LAND}/>')
    # 点になる国：輪で位置を示す
    for a3 in R['point_only']:
        c = mainland(C[a3][0]).centroid
        x, y = fr.xy(c.x, c.y)
        E.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="3.2" fill="none" stroke="#6aa9ff" stroke-width="1.3"/>')
    E.append('</g>')
    # 国名
    L1 = []
    for a3, nm, at in R['members']:
        m = mainland(C[a3][0])
        fs = 12.5
        if at is None:
            pt = polylabel(fr.proj(m), 0.5)
            x, y = pt.x, pt.y + 4
        elif at[0] == 'in':                            # 首都のラベルと重ならないよう、国の中の別の点に置く
            x, y = fr.xy(at[1], at[2])
        else:
            c = m.representative_point() if a3 not in R['point_only'] else m.centroid
            cx, cy = fr.xy(c.x, c.y)
            x, y = fr.xy(*at)
            fs = 11
            L1.append(f'<path d="M{fmt(cx)} {fmt(cy)}L{fmt(x)} {fmt(y - 4 if y > cy else y + 1)}" stroke="rgba(255,255,255,.55)" stroke-width=".8" fill="none"/>')
        w = tw(nm, fs)
        fr.boxes.append((x - w / 2, y - fs, x + w / 2, y + 3))
        L1.append(text(x, y, nm, fs, '#fff', extra=' font-weight="600"'))
    E.append('<g class="L1 lbl">' + ''.join(L1) + '</g>')
    if capitals:
        L3 = []
        for nm, lon, lat, kind, side in R['capitals']:
            x, y = fr.xy(lon, lat)
            if kind == 'seat':
                L3.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="3" fill="#05080d" stroke="#ffd166" stroke-width="1.4"/>')
            else:
                L3.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="3.4" fill="#ffd166" stroke="#000" stroke-width=".8"/>')
            fs = 10.5
            w = tw(nm, fs)
            order = {'r': [(6, 4, 'start'), (-6, 4, 'end'), (0, -7, 'middle'), (0, 15, 'middle')],
                     'l': [(-6, 4, 'end'), (6, 4, 'start'), (0, 15, 'middle'), (0, -7, 'middle')],
                     'b': [(0, 15, 'middle'), (0, -7, 'middle'), (6, 4, 'start'), (-6, 4, 'end')]}[side]
            order = order + [(6, -8, 'start'), (6, 15, 'start'), (-6, -8, 'end'), (-6, 15, 'end'), (0, -12, 'middle'), (0, 20, 'middle')]
            for dx, dy, an in order:
                x0 = x + dx - (w if an == 'end' else w / 2 if an == 'middle' else 0)
                bx = (x0, y + dy - fs, x0 + w, y + dy + 3)
                if fr.free(bx):
                    fr.boxes.append(bx)
                    L3.append(text(x + dx, y + dy, nm, fs, '#ffd166', an, ' font-weight="600"'))
                    break
            else:
                raise SystemExit(f'首都のラベルが置けない：{nm}')
        E.append('<g class="L3">' + ''.join(L3) + '</g>')
    E.append('</g>')
    E.append(f'<rect x="{ML}" y="{MT}" width="{fmt(fr.w)}" height="{fmt(fr.h)}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1"/>')
    E.append(text(ML, MT - 9, f'{R["title"]}の{len(R["members"])}か国', 12, '#fff', 'start', ' font-weight="600" stroke="none"'))
    E += scale_bar(fr, 100)
    E.append('</svg>')
    return '\n'.join(E), fr


def zoom_map(key, R, C):
    """拡大図：国ごとに別の枠。枠ごとに倍率を書く（この図だけ○倍）"""
    parts, W, Hmax = [], 0, 0
    frames = []
    for a3, nm, z, lon, lat, fine, km, labels in R['zoom']:
        fr = Frame(lon, lat, R['phi0'], zoom=z, ml=ML + W + (24 if W else 0), mt=MT + 20)
        frames.append((a3, nm, z, fine, km, labels, fr))
        W = fr.ml + fr.w + MR
        Hmax = max(Hmax, fr.mt + fr.h + MB)
    E = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(W)} {fmt(Hmax)}" width="{fmt(W)}" height="{fmt(Hmax)}" class="cc-map" role="img" aria-label="拡大図：'
         + '・'.join(f'{nm}（{z}倍）' for _, nm, z, *_ in R['zoom']) + '">', STYLE, '<g class="L2">']
    for a3, nm, z, fine, km, labels, fr in frames:
        cid = f'cc-r{key.replace("-", "")}-z{a3.lower()}'
        E.append(f'<clipPath id="{cid}"><rect x="{fmt(fr.ml)}" y="{fmt(fr.mt)}" width="{fmt(fr.w)}" height="{fmt(fr.h)}"/></clipPath>')
        E.append(f'<rect x="{fmt(fr.ml)}" y="{fmt(fr.mt)}" width="{fmt(fr.w)}" height="{fmt(fr.h)}" fill="#05080d"/>')
        E += grid(fr, fine)
        E.append(f'<g clip-path="url(#{cid})">')
        nei = ''.join(d_polys(fr.cp(g, .5)) for o, (g, p) in C.items() if o != a3 and g.intersects(fr.bb))
        E.append(f'<path d="{nei}" {NEI}/>')
        E.append(f'<path d="{d_polys(fr.cp(C[a3][0], .5))}" {LAND}/>')
        for t, lo, la in labels:
            x, y = fr.xy(lo, la)
            E.append(text(x, y, t, 10.5, 'rgba(255,255,255,.6)'))
        pt = polylabel(fr.proj(mainland(C[a3][0])), 0.5)
        E.append(text(pt.x, pt.y + 5, nm if len(nm) < 7 else nm[:5] + '​' + nm[5:], 12, '#fff', extra=' font-weight="600"'))
        E.append('</g>')
        E.append(f'<rect x="{fmt(fr.ml)}" y="{fmt(fr.mt)}" width="{fmt(fr.w)}" height="{fmt(fr.h)}" fill="none" stroke="#ffd166" stroke-width="1.2" stroke-dasharray="5 3"/>')
        E.append(text(fr.ml, fr.mt - 22, nm, 12, '#fff', 'start', ' font-weight="600" stroke="none"'))
        E.append(text(fr.ml, fr.mt - 8, f'この図だけ {z}倍（1度＝{int(S * z):,}px）', 10.5, '#ffd166', 'start', ' font-weight="600" stroke="none"'))
        E += scale_bar(fr, km)
    E.append('</g></svg>')
    return '\n'.join(E), frames


def cmp_fig(R, C):
    """06：左＝展開図のまま（赤道の縮尺）、右＝地域の中心を真上から見た形（正射図法）。左右とも赤道での1度を同じ長さに。
    2-1 §07 のグリーンランドとコンゴ民主共和国の図と同じ形式・同じ色（記事の CSS 変数）。"""
    s = 11.0                                           # 赤道での1度 = 11px（左右とも）
    lat0, lon0 = 48.50, 6.21                          # 9か国の本土の重心
    mem = [a3 for a3, _, _ in R['members']]
    # 左：経度・緯度をそのまま（正距円筒・赤道の縮尺）
    geoms = [C[a3][0].intersection(box(R['lon'][0], R['lat'][0], R['lon'][1], R['lat'][1])) for a3 in mem]
    Lx0, Lx1, Ly0, Ly1 = R['lon'][0] + 0.4, R['lon'][1] - 0.4, R['lat'][0] + 0.3, R['lat'][1] - 0.3
    lw, lh = (Lx1 - Lx0) * s, (Ly1 - Ly0) * s
    ox, oy = 20, 34
    left = [affinity.affine_transform(g, [s, 0, 0, -s, ox - Lx0 * s, oy + Ly1 * s]) for g in geoms]
    # 右：正射図法（中心を正面に）。半径 = 1ラジアンぶんの長さ＝ s×180/π
    Rr = s * 180 / math.pi
    p0, l0 = math.radians(lat0), math.radians(lon0)
    def ortho(lo, la):
        p, l = math.radians(la), math.radians(lo)
        x = Rr * math.cos(p) * math.sin(l - l0)
        y = Rr * (math.cos(p0) * math.sin(p) - math.sin(p0) * math.cos(p) * math.cos(l - l0))
        return x, y
    from shapely.ops import transform
    def ortho_xy(xs, ys, zs=None):
        pts = [ortho(a, b) for a, b in zip(xs, ys)]
        return [p[0] for p in pts], [p[1] for p in pts]
    right0 = [transform(ortho_xy, g) for g in geoms]
    ub = unary_union(right0).bounds
    rx = ox + lw + 60                                  # 左右のあいだ
    right = [affinity.affine_transform(g, [1, 0, 0, -1, rx - ub[0], oy + lh / 2 + (ub[1] + ub[3]) / 2]) for g in right0]
    W = rx + (ub[2] - ub[0]) + 20
    H = oy + lh + 52
    sep = ox + lw + 30
    # 面積の比（展開図の上の見かけの面積 / 実際の面積、正射図法の誤差）
    true_a = sum(area(g) for g in geoms)                 # 楕円体の上の実際の面積
    M = math.pi * 6371008.8 / 180 / s                     # 図の1px が何 m か（赤道での1度 ≒ 111.2km）
    left_a = sum(g.area for g in left) * M ** 2
    right_a = sum(g.area for g in right) * M ** 2
    ratio_left, ratio_right = left_a / true_a, right_a / true_a
    col = 'fill="var(--accent-tint)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"'
    E = [f'<svg viewBox="0 0 {fmt(W)} {fmt(H)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{R["title"]}の9か国を、展開図での見え方（左）と真上から見た形（右）で同じ縮尺に並べた図">',
         f'<text class="cmp-h" x="{fmt(ox + lw / 2)}" y="20" font-size="12.5" fill="var(--ink)" text-anchor="middle">展開図での見え方（赤道の縮尺）</text>',
         f'<text class="cmp-h" x="{fmt(rx + (ub[2] - ub[0]) / 2)}" y="20" font-size="12.5" fill="var(--ink)" text-anchor="middle">真上から見た形</text>',
         f'<line x1="{fmt(sep)}" y1="8" x2="{fmt(sep)}" y2="{fmt(H - 30)}" stroke="var(--line)" stroke-width="1"/>',
         '<g class="cmp-r1">']
    E.append(f'<path d="{"".join(d_polys(g.simplify(.15)) for g in left)}" {col}/>')
    E.append(f'<path d="{"".join(d_polys(g.simplify(.15)) for g in right)}" {col}/>')
    E.append(f'<text class="cmp-v" x="{fmt(ox + lw / 2)}" y="{fmt(oy + lh + 16)}" font-size="10.5" fill="var(--ink-faint)" text-anchor="middle">面積が約{ratio_left:.2f}倍に見える</text>')
    E.append(f'<text class="cmp-v" x="{fmt(rx + (ub[2] - ub[0]) / 2)}" y="{fmt(oy + lh + 16)}" font-size="10.5" fill="var(--ink-faint)" text-anchor="middle">約{true_a / 1e10:.0f}万km²（9か国）</text>')
    E.append('</g>')
    bar = 5 * s
    bx0 = sep - bar / 2
    E.append('<g class="cmp-scale">')
    E.append(f'<line x1="{fmt(bx0)}" y1="{fmt(H - 14)}" x2="{fmt(bx0 + bar)}" y2="{fmt(H - 14)}" stroke="var(--ink-faint)" stroke-width="1.5"/>')
    E.append(f'<line x1="{fmt(bx0)}" y1="{fmt(H - 18)}" x2="{fmt(bx0)}" y2="{fmt(H - 10)}" stroke="var(--ink-faint)"/><line x1="{fmt(bx0 + bar)}" y1="{fmt(H - 18)}" x2="{fmt(bx0 + bar)}" y2="{fmt(H - 10)}" stroke="var(--ink-faint)"/>')
    E.append(text(bx0 + bar + 8, H - 10, '赤道での5度（約556km）', 10, 'var(--ink-faint)', 'start'))
    E.append(text(bx0 - 8, H - 10, '左右とも同じ縮尺', 10, 'var(--ink-faint)', 'end'))
    E.append('</g></svg>')
    return '\n'.join(E), {'ratio_left': ratio_left, 'ratio_right': ratio_right, 'true_km2': true_a / 1e6, 'W': W, 'H': H}


if __name__ == '__main__':
    key = sys.argv[1] if len(sys.argv) > 1 else '3-1'
    R = REGIONS[key]
    C = load()
    os.makedirs(SVG_DIR, exist_ok=True)
    out = {}
    for name, (svg, fr) in {'shape': main_map(key, R, C, False), 'capitals': main_map(key, R, C, True)}.items():
        fn = os.path.join(SVG_DIR, f'r{key}-{name}.svg')
        open(fn, 'w').write(svg)
        out[name] = {'W': round(fr.W, 1), 'H': round(fr.H, 1), 'kb': round(os.path.getsize(fn) / 1024, 1)}
    svg, frames = zoom_map(key, R, C)
    fn = os.path.join(SVG_DIR, f'r{key}-zoom.svg')
    open(fn, 'w').write(svg)
    out['zoom'] = {'kb': round(os.path.getsize(fn) / 1024, 1), 'frames': [(nm, z, round(fr.w), round(fr.h)) for _, nm, z, _, _, _, fr in frames]}
    svg, info = cmp_fig(R, C)
    fn = os.path.join(DATA, f'r{key}-cmp.svg')
    open(fn, 'w').write(svg)
    out['cmp'] = {k: (round(v, 4) if isinstance(v, float) else v) for k, v in info.items()}
    out['cmp']['kb'] = round(os.path.getsize(fn) / 1024, 1)
    print(json.dumps(out, ensure_ascii=False, indent=1))

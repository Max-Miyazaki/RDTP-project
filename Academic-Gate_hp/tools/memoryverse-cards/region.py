# 地域のカード（3章の地域の記事に置く図）を描く。3-1 西ヨーロッパ・3-2 南ヨーロッパ。
#   python region.py 3-1
# 書き出すもの（image/memoryverse/cards/）：
#   r3-1-shape.svg     04「9か国の形と位置」の図（層1 形。国名は国のページへのリンク）
#   r3-1-capitals.svg  05「首都」の図（層1 形＋層3 首都）
#   r3-1-zoom.svg      04 の拡大図（層2。モナコとリヒテンシュタイン。倍率を図の中に書く）
#   （§06「横断する軸」の見比べる図 data/r3-*-cmp.svg は、3章から §06 を削ったので作らない。DESIGN.md §118）
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
    '3-2': {
        'title': '南ヨーロッパ',
        'phi0': 42.0,                                  # 17か国の本土の重心は北緯42.20度・東経6.62度
        'center': (42.20, 6.62),
        'lon': (-10.0, 28.9), 'lat': (34.5, 47.4),
        'members': [
            ('AND', 'アンドラ', (1.55, 43.55)), ('ITA', 'イタリア', ('in', 13.9, 42.35)), ('SMR', 'サンマリノ', (13.55, 44.15)), ('VAT', 'バチカン', (11.1, 41.05)),
            ('MLT', 'マルタ', (14.45, 35.2)), ('SVN', 'スロベニア', (13.9, 46.9)), ('HRV', 'クロアチア', ('in', 16.2, 45.55)),
            ('BIH', 'ボスニア・ヘルツェゴビナ', (17.8, 46.75)), ('MNE', 'モンテネグロ', (17.6, 42.25)), ('ALB', 'アルバニア', (18.15, 41.3)),
            ('SRB', 'セルビア', ('in', 20.95, 44.05)), ('KOS', 'コソボ', (22.75, 43.35)), ('MKD', '北マケドニア', (24.3, 42.25)),
            ('GRC', 'ギリシャ', ('in', 22.2, 39.3)), ('PRT', 'ポルトガル', ('in', -8.0, 39.85)), ('GIB', 'ジブラルタル', (-7.4, 35.6)), ('ESP', 'スペイン', ('in', -3.6, 40.0)),
        ],
        'point_only': ['AND', 'SMR', 'VAT', 'MLT', 'GIB'],
        'capitals': [
            ('アンドラ・ラ・ベリャ', 1.5165, 42.5, 'capital', 'r'), ('ローマ', 12.4813, 41.8979, 'capital', 'r'), ('サンマリノ市', 12.4418, 43.9361, 'capital', 'r'),
            ('バチカン（都市国家）', 12.4534, 41.9033, 'capital', 'l'), ('バレッタ', 14.5147, 35.8997, 'capital', 'r'), ('リュブリャナ', 14.515, 46.0553, 'capital', 'l'),
            ('ザグレブ', 16.0, 45.8, 'capital', 'r'), ('サラエヴォ', 18.383, 43.85, 'capital', 'l'), ('ポドゴリツァ', 19.2663, 42.466, 'capital', 'l'),
            ('ティラナ', 19.8189, 41.3275, 'capital', 'l'), ('ベオグラード', 20.466, 44.8206, 'capital', 'r'), ('プリシュティナ', 21.166, 42.6667, 'capital', 'r'),
            ('スコピエ', 21.4335, 42.0, 'capital', 'r'), ('アテネ', 23.7314, 37.9853, 'capital', 'r'), ('リスボン', -9.1468, 38.7247, 'capital', 'b'),
            ('マドリード', -3.6853, 40.402, 'capital', 'r'),
        ],
        'zoom': [
            ('AND', 'アンドラ', 20, (1.36, 1.81), (42.39, 42.69), 0.1, 10, [('フランス', 1.66, 42.665), ('スペイン', 1.44, 42.41)]),
            ('SMR', 'サンマリノ', 50, (12.37, 12.51), (43.875, 44.0), 0.05, 5, [('イタリア', 12.395, 43.99)]),
            ('MLT', 'マルタ', 20, (14.14, 14.61), (35.76, 36.12), 0.1, 10, []),
        ],
    },
    '3-3': {
        'title': '北ヨーロッパ',
        'phi0': 62.0,                                  # 15単位の本土の重心は北緯61.59度・東経12.17度
        'center': (61.59, 12.17),
        'lon': (-25.0, 32.0), 'lat': (48.6, 71.5),
        'members': [
            ('DNK', 'デンマーク', None), ('NOR', 'ノルウェー', ('in', 9.2, 61.6)), ('SWE', 'スウェーデン', ('in', 15.4, 63.4)),
            ('ALD', 'オーランド諸島', (18.2, 61.2)), ('LTU', 'リトアニア', None), ('LVA', 'ラトビア', None), ('EST', 'エストニア', ('in', 25.9, 58.8)),
            ('FIN', 'フィンランド', ('in', 26.6, 64.2)), ('ISL', 'アイスランド', None), ('IRL', 'アイルランド', None),
            ('FRO', 'フェロー諸島', (-7.0, 63.4)), ('IMN', 'マン島', (-5.6, 53.75)), ('GGY', 'ガーンジー', (-4.6, 49.95)),
            ('GBR', 'イギリス', ('in', -1.6, 52.6)), ('JEY', 'ジャージー', (-3.7, 49.05)),
        ],
        'point_only': ['IMN', 'GGY', 'JEY'],
        # 首都：kind = capital（首都）/ seat（国でない単位の政府・議会の所在地。3-3 §05）
        'capitals': [
            ('コペンハーゲン', 12.5615, 55.6805, 'capital', 'r'), ('オスロ', 10.748, 59.9186, 'capital', 'l'), ('ストックホルム', 18.0954, 59.3527, 'capital', 'b'),
            ('マリエハムン', 19.949, 60.097, 'seat', 'r'), ('ヴィリニュス', 25.3166, 54.6834, 'capital', 'r'), ('リガ', 24.1, 56.95, 'capital', 'l'),
            ('タリン', 24.728, 59.4339, 'capital', 'b'), ('ヘルシンキ', 24.9322, 60.1775, 'capital', 'r'), ('レイキャヴィーク', -21.95, 64.15, 'capital', 'b'),
            ('ダブリン', -6.2509, 53.335, 'capital', 'l'), ('トースハウン', -6.82, 62.03, 'seat', 'b'), ('ダグラス', -4.48, 54.1504, 'seat', 'r'),
            ('セントピーターポート', -2.539, 49.4568, 'seat', 'r'), ('ロンドン', -0.1187, 51.5019, 'capital', 'r'), ('セントヘリア', -2.1102, 49.1857, 'seat', 'r'),
        ],
        'zoom': [
            ('IMN', 'マン島', 10, (-4.86, -4.25), (54.02, 54.45), 0.2, 10, []),
            ('GGY', 'ガーンジー（本島）', 50, (-2.70, -2.48), (49.40, 49.53), 0.05, 2, []),
            ('JEY', 'ジャージー', 20, (-2.27, -1.98), (49.15, 49.29), 0.1, 5, []),
        ],
    },
    '3-4': {
        'title': '東ヨーロッパ',
        'phi0': 49.0,                                  # 9か国（ロシアを除く）の本土の重心は北緯49.34度・東経25.66度（2-1 付録Aの「北49° 東26°」）
        'center': (49.34, 25.66),
        'lon': (11.6, 40.6), 'lat': (40.8, 56.6),
        'members': [
            ('CZE', 'チェコ', None), ('HUN', 'ハンガリー', None), ('POL', 'ポーランド', None), ('SVK', 'スロバキア', None),
            ('ROU', 'ルーマニア', None), ('BGR', 'ブルガリア', ('in', 25.9, 42.75)), ('BLR', 'ベラルーシ', None), ('MDA', 'モルドバ', ('in', 28.25, 47.85)), ('UKR', 'ウクライナ', None),
        ],
        'point_only': [],
        'capitals': [
            ('プラハ', 14.464, 50.085, 'capital', 'r'), ('ブダペスト', 19.081, 47.502, 'capital', 'r'), ('ワルシャワ', 20.998, 52.252, 'capital', 'r'),
            ('ブラチスラヴァ', 17.117, 48.15, 'capital', 'l'), ('ブカレスト', 26.098, 44.435, 'capital', 'r'), ('ソフィア', 23.315, 42.685, 'capital', 'r'),
            ('ミンスク', 27.565, 53.902, 'capital', 'r'), ('キシナウ', 28.858, 47.005, 'capital', 'r'),
            ('キーウ', 30.515, 50.435, 'capital', 'r'),       # Natural Earth の日本語名は「キエフ」。外務省の表記（2022年3月31日）に（§125）
        ],
        'zoom': [],
    },
}


def load():
    ne0 = json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))
    C = {}
    for f in ne0['features']:
        p = f['properties']
        C[p['ADM0_A3']] = (shape(f['geometry']).buffer(0), p)
    # 層1を OSM の輪郭で描く単位は、国のページと同じ輪郭にする（オーランド。DESIGN.md §112.1）
    from countries import COUNTRIES, outline
    for a3, c in COUNTRIES.items():
        if c.get('outline_osm') and a3 in C and os.path.exists(os.path.join(c['dir'], 'outline.geojson')):
            C[a3] = (outline(a3).buffer(0), C[a3][1])
    return C


def area(g):
    return abs(G.geometry_area_perimeter(g)[0])


def mainland(g):
    return max(polys_of(g), key=area)


def tw(text, fs):
    # 文字幅の見積もり。draw.py と同じく、キリル文字・ギリシャ文字も全角として数える（DESIGN.md §126。地域のカードのラベルは日本語だけ）
    return sum(fs if (ord(ch) > 0x2000 or 0x0370 <= ord(ch) < 0x0530) else fs * 0.62 for ch in text)


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


def nonstate(R, C):
    """主権国家でない単位（Natural Earth で、主権の名前 SOVEREIGNT が単位の名前 ADMIN と違う、または TYPE が Disputed）。
    1つでもあれば、見出しを「か国」ではなく「単位」にする（DESIGN.md §100.0・§123）。TYPE が Sovereign country かどうかでは分けない
    （フランス・オランダ・デンマーク・フィンランド・イギリスは TYPE が Country）"""
    return [a3 for a3, _, _ in R['members'] if C[a3][1]['SOVEREIGNT'] != C[a3][1]['ADMIN'] or C[a3][1]['TYPE'] == 'Disputed']


def main_map(key, R, C, capitals):
    fr = Frame(R['lon'], R['lat'], R['phi0'])
    ns = nonstate(R, C)
    unit = '単位' if ns else 'か国'
    cid = f'cc-r{key.replace("-", "")}-{"cap" if capitals else "shape"}'
    E = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(fr.W)} {fmt(fr.H)}" width="{fmt(fr.W)}" height="{fmt(fr.H)}" class="cc-map" role="img" '
         f'aria-label="{R["title"]}の{len(R["members"])}{unit}の{"首都" if capitals else "形と位置"}" data-nonstate="{" ".join(ns)}">', STYLE,
         f'<clipPath id="{cid}"><rect x="{ML}" y="{MT}" width="{fmt(fr.w)}" height="{fmt(fr.h)}"/></clipPath>',
         f'<rect x="{ML}" y="{MT}" width="{fmt(fr.w)}" height="{fmt(fr.h)}" fill="#05080d"/>']
    E += grid(fr)
    E.append(f'<g clip-path="url(#{cid})">')
    mem = [a3 for a3, _, _ in R['members']]          # 並びを決めておく（set だと実行ごとに順が変わり、SVG が毎回変わる）
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
        # 国名はその国のページへのリンク（面積に関係なく、点になる国も同じ。記事の中に埋め込むので、記事から見た相対パス。DESIGN.md §118）
        L1.append(f'<a class="cc-cty" href="country/{a3.lower()}.html"><title>{nm}の国のページへ</title>'
                  + text(x, y, nm, fs, '#fff', extra=' font-weight="600"') + '</a>')
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
    E.append(text(ML, MT - 9, f'{R["title"]}の{len(R["members"])}{unit}', 12, '#fff', 'start', ' font-weight="600" stroke="none"'))
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
        # 見出し（この図だけ○倍）が枠より長いときは、その分だけ幅を取る（枠が狭いと右で切れた。ジャージー。§121）
        W = max(fr.ml + fr.w, fr.ml + tw(f'この図だけ {z}倍（1度＝{int(S * z):,}px）', 10.5)) + MR
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
        # 国名はその国のページへのリンク（地図本体の main_map と同じ。拡大図だけ付け忘れていた。DESIGN.md §118）
        E.append(f'<a class="cc-cty" href="country/{a3.lower()}.html"><title>{nm}の国のページへ</title>'
                 + text(pt.x, pt.y + 5, nm if len(nm) < 7 else nm[:5] + '​' + nm[5:], 12, '#fff', extra=' font-weight="600"') + '</a>')
        E.append('</g>')
        E.append(f'<rect x="{fmt(fr.ml)}" y="{fmt(fr.mt)}" width="{fmt(fr.w)}" height="{fmt(fr.h)}" fill="none" stroke="#ffd166" stroke-width="1.2" stroke-dasharray="5 3"/>')
        E.append(f'<a class="cc-cty" href="country/{a3.lower()}.html"><title>{nm}の国のページへ</title>'
                 + text(fr.ml, fr.mt - 22, nm, 12, '#fff', 'start', ' font-weight="600" stroke="none"') + '</a>')
        E.append(text(fr.ml, fr.mt - 8, f'この図だけ {z}倍（1度＝{int(S * z):,}px）', 10.5, '#ffd166', 'start', ' font-weight="600" stroke="none"'))
        E += scale_bar(fr, km)
    E.append('</g></svg>')
    return '\n'.join(E), frames


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
    if R['zoom']:                                     # 拡大図が要る単位が無い地域（3-4 東ヨーロッパ）は拡大図を作らない
        svg, frames = zoom_map(key, R, C)
        fn = os.path.join(SVG_DIR, f'r{key}-zoom.svg')
        open(fn, 'w').write(svg)
        out['zoom'] = {'kb': round(os.path.getsize(fn) / 1024, 1), 'frames': [(nm, z, round(fr.w), round(fr.h)) for _, nm, z, _, _, _, fr in frames]}
    print(json.dumps(out, ensure_ascii=False, indent=1))

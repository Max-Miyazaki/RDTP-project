# 全球のカード（2章の記事に置く図）を描く。いまは 2-2 プレートと大地形だけ。
#   python earth.py 2-2
# 枠は 2-1 と同じ全球の正距円筒図法（左端が西経180度、横2・縦1。2-1 の 2048×1024 の枠を半分の 1024×512 で）。
# 2-1 の30度の升目がそのまま重なる。書き出すもの：
#   image/memoryverse/cards/e2-2-plates.svg     04 プレートの配置（層1 大きい7つ／層2 残り／層3 境界の線と造山帯）
#   image/memoryverse/cards/e2-2-quakes.svg     06 地震と火山（層1 地震／層2 火山／層3 境界の線）
#   image/memoryverse/cards/e2-2-landforms.svg  07 大地形（層1 山脈／層2 高原／層3 砂漠。境界の線は薄く下敷き）
#   data/e2-2-bound3.svg                         05 の図（境界の3つの動きと代表的な場所。記事に埋め込む）
# データ（data/earth/ に置く。リポジトリには入れない）：PB2002（Bird 2003、fraxen/tectonicplates の GeoJSON と
# 原データの PB2002_steps.dat）、Natural Earth v5.1.2（ne_10m_geography_regions_polys・ne_50m_land）、
# USGS の地震（M6.0以上・1900年から）、Smithsonian GVP の完新世の火山（非商業限定。DESIGN.md §102）
import csv, json, math, os, sys
from collections import defaultdict
from shapely.geometry import shape, box, LineString, MultiLineString
from shapely.ops import unary_union, polylabel
from shapely import affinity
from countries import DATA, SVG_DIR
from prep_util import polys_of, lines_of, merge
from svgutil import fmt, d_polys, d_lines, rel

E = os.path.join(DATA, 'earth')
W, H = 1024.0, 512.0
ML, MR, MT, MB = 34, 12, 18, 22

# PB2002 の7分類 → 教材の3つ（DESIGN.md §102、記事の §05 と付録A）
THREE = {'OSR': 'div', 'CRB': 'div', 'SUB': 'conv', 'OCB': 'conv', 'CCB': 'conv', 'OTF': 'tr', 'CTF': 'tr'}
COL = {'div': '#6ee7b7', 'conv': '#ff6b6b', 'tr': '#ffd166'}
BIG7 = ['PA', 'AN', 'AF', 'NA', 'EU', 'AU', 'SA']
PLATE_JA = {
    'PA': '太平洋', 'AN': '南極', 'AF': 'アフリカ', 'NA': '北アメリカ', 'EU': 'ユーラシア', 'AU': 'オーストラリア', 'SA': '南アメリカ',
    'SO': 'ソマリア', 'NZ': 'ナスカ', 'IN': 'インド', 'SU': 'スンダ', 'PS': 'フィリピン海', 'AM': 'アムール', 'AR': 'アラビア',
    'OK': 'オホーツク', 'CA': 'カリブ', 'CO': 'ココス', 'YA': '揚子江', 'SC': 'スコシア', 'CL': 'カロリン', 'ND': '北アンデス',
    'AP': 'アルティプラノ', 'BH': 'バーズヘッド', 'MS': 'モルッカ海', 'BS': 'バンダ海', 'TO': 'トンガ', 'JF': 'ファンデフカ',
    'AT': 'アナトリア', 'AS': 'エーゲ海', 'BU': 'ビルマ', 'SW': 'サウスサンドウィッチ', 'KE': 'ケルマデック', 'MN': 'マヌス',
    'NB': '北ビスマルク', 'SB': '南ビスマルク', 'SS': 'ソロモン海', 'WL': 'ウッドラーク', 'NH': 'ニューヘブリディーズ',
    'MA': 'マリアナ', 'ON': '沖縄', 'TI': 'ティモール', 'MO': 'マオケ', 'GP': 'ガラパゴス', 'EA': 'イースター', 'JZ': 'フアンフェルナンデス',
    'PM': 'パナマ', 'RI': 'リベラ', 'CR': 'コンウェイ礁', 'NI': 'ニウアフォオウ', 'FT': 'フツナ', 'BR': 'バルモラル礁', 'SL': 'シェトランド'}
PLATE_FILL = {'PA': '#3d8bff', 'AN': '#90a4ae', 'AF': '#ffb46b', 'NA': '#4dd0e1', 'EU': '#b388ff', 'AU': '#f06292', 'SA': '#81c784'}
OROGEN_JA = {
    'Persia-Tibet-Burma': 'ペルシア・チベット・ビルマ', 'Ninety East-Sumatra': '東経90度海嶺・スマトラ', 'Alps': 'アルプス',
    'Alaska-Yukon': 'アラスカ・ユーコン', 'New Hebrides-Fiji': 'ニューヘブリディーズ・フィジー', 'west central Atlantic': '大西洋中部の西',
    'Gorda-California-Nevada': 'ゴルダ・カリフォルニア・ネバダ', 'Puna-Sierras Pampeanas': 'プナ・パンパ山脈', 'Peru': 'ペルー',
    'Philippines': 'フィリピン', 'Laptev Sea': 'ラプテフ海', 'western Aleutians': 'アリューシャン西部', 'Rivera-Cocos': 'リベラ・ココス'}


def X(lon):
    return ML + (lon + 180) / 360 * W


def Y(lat):
    return MT + (90 - lat) / 180 * H


def proj(g):
    return affinity.affine_transform(g, [W / 360, 0, 0, -H / 180, ML + W / 2, MT + H / 2])


FRAME = box(-180, -90, 180, 90)


def cp(g, tol=0.3):
    g = g.intersection(FRAME)
    return g if g.is_empty else proj(g).simplify(tol, preserve_topology=False)


def text(x, y, t, fs, fill, anchor='middle', extra=''):
    return f'<text x="{fmt(x)}" y="{fmt(y)}" font-size="{fs}" fill="{fill}" text-anchor="{anchor}"{extra}>{t}</text>'


def tw(t, fs):
    return sum(fs if ord(c) > 0x2000 else fs * 0.62 for c in t)


class Boxes:
    def __init__(self):
        self.b = []

    def free(self, bx, pad=2):
        if bx[0] < ML + 1 or bx[2] > ML + W - 1 or bx[1] < MT + 1 or bx[3] > MT + H - 1:
            return False
        return not any(not (bx[2] + pad < o[0] or o[2] + pad < bx[0] or bx[3] + pad < o[1] or o[3] + pad < bx[1]) for o in self.b)

    def place(self, x, y, t, fs):
        w = tw(t, fs)
        bx = (x - w / 2, y - fs * 0.9, x + w / 2, y + fs * 0.25)
        if self.free(bx):
            self.b.append(bx)
            return True
        return False


STYLE = '<style>.cc-map text{font-family:"Hiragino Sans","Noto Sans JP",system-ui,sans-serif;paint-order:stroke;stroke:#000;stroke-width:2.6px;stroke-linejoin:round}</style>'


def head(cid, label):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(ML + W + MR)} {fmt(MT + H + MB)}" width="{fmt(ML + W + MR)}" height="{fmt(MT + H + MB)}" class="cc-map" role="img" aria-label="{label}">',
            STYLE, f'<clipPath id="{cid}"><rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}"/></clipPath>',
            f'<rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}" fill="#05080d"/>']


def grid():
    """2-1 と同じ30度の升目（赤道と東経0度は太く）。ラベルも 2-1 と同じ書き方（30°E・30°N）"""
    g, mj, lab = [], [], []
    for lon in range(-180, 181, 30):
        (mj if lon == 0 else g).append(f'M{fmt(X(lon))} {MT}V{fmt(MT + H)}')
        t = '0°' if lon == 0 else '180°' if abs(lon) == 180 else (f'{lon}°E' if lon > 0 else f'{-lon}°W')
        lab.append(text(X(lon), MT + H + 14, t, 9.5, 'rgba(255,255,255,.55)', extra=' stroke="none"'))
    for lat in range(-90, 91, 30):
        (mj if lat == 0 else g).append(f'M{ML} {fmt(Y(lat))}H{fmt(ML + W)}')
        t = '0°' if lat == 0 else (f'{lat}°N' if lat > 0 else f'{-lat}°S')
        lab.append(text(ML - 4, Y(lat) + 3.5, t, 9.5, 'rgba(255,255,255,.55)', 'end', ' stroke="none"'))
    return ['<g class="grid">', f'<path d="{"".join(g)}" stroke="rgba(255,255,255,.2)" stroke-width=".8" fill="none"/>',
            f'<path d="{"".join(mj)}" stroke="rgba(255,255,255,.35)" stroke-width="1" fill="none"/>'] + lab + ['</g>']


def load():
    D = {}
    D['plates'] = json.load(open(os.path.join(E, 'PB2002_plates.json')))['features']
    D['orogens'] = json.load(open(os.path.join(E, 'PB2002_orogens.json')))['features']
    D['land'] = unary_union([shape(f['geometry']) for f in json.load(open(os.path.join(E, 'ne_50m_land.geojson')))['features']])
    D['regions'] = json.load(open(os.path.join(E, 'ne_10m_geography_regions_polys.geojson')))['features']
    # 境界のステップ（7分類）。経度が±180度をまたぐステップは2つに分ける
    steps = defaultdict(list)
    for ln in open(os.path.join(E, 'PB2002_steps.dat.txt')):
        t = ln.split()
        if not t:
            continue
        lo1, la1, lo2, la2 = map(float, t[2:6])
        c = THREE[t[-1].lstrip(':').rstrip('*')]
        if abs(lo2 - lo1) > 180:
            m = la1 + (la2 - la1) * ((180 - abs(lo1)) / (360 - abs(lo2 - lo1)))
            s = 1 if lo1 > 0 else -1
            steps[c].append(((lo1, la1), (180 * s, m)))
            steps[c].append(((-180 * s, m), (lo2, la2)))
        else:
            steps[c].append(((lo1, la1), (lo2, la2)))
    D['steps'] = {c: merge(unary_union([LineString(s) for s in v])) for c, v in steps.items()}   # つながるステップは1本の線に
    q = []
    for r in csv.DictReader(open(os.path.join(E, 'usgs_m6.csv'))):
        q.append((float(r['longitude']), float(r['latitude']), float(r['mag'])))
    D['quakes'] = q
    v = []
    fn = os.path.join(E, 'gvp_holocene.csv')
    if os.path.exists(fn):
        for r in csv.DictReader(open(fn)):
            try:
                v.append((float(r['Longitude']), float(r['Latitude']), r.get('Volcano_Name', '')))
            except (ValueError, KeyError):
                pass
    D['volcanoes'] = v
    return D


def land_base(D, fill='rgba(255,255,255,.07)', stroke='rgba(255,255,255,.22)', tol=.4):
    return f'<path d="{d_polys(cp(D["land"], tol))}" fill="{fill}" stroke="{stroke}" stroke-width=".5" stroke-linejoin="round"/>'


def boundaries(D, width=1.3, opacity=1, tol=.3):
    out = []
    for c in ('div', 'conv', 'tr'):
        out.append(f'<path d="{d_lines(cp(D["steps"][c], tol))}" fill="none" stroke="{COL[c]}" stroke-width="{width}" stroke-opacity="{opacity}" stroke-linecap="round" stroke-linejoin="round"/>')
    return ''.join(out)


def plates_svg(D):
    E_ = head('cc-e22-plates', 'プレートの配置：大きい7つ・残りの小さいプレート・境界の線と造山帯')
    E_ += grid()
    E_.append('<g clip-path="url(#cc-e22-plates)">')
    by = defaultdict(list)
    for f in D['plates']:
        by[f['properties']['Code']].append(shape(f['geometry']).buffer(0))
    by = {c: unary_union(v) for c, v in by.items()}
    bx = Boxes()
    big, small, lab1, lab2 = [], [], [], []
    for c in BIG7:
        big.append(f'<path d="{d_polys(cp(by[c], .4))}" fill="{PLATE_FILL[c]}" fill-opacity=".22" stroke="none"/>')
    for c, g in by.items():
        if c not in BIG7:
            small.append(d_polys(cp(g, .4)))
    E_.append('<g class="L1">' + ''.join(big) + '</g>')
    E_.append(f'<g class="L2"><path d="{"".join(small)}" fill="rgba(255,255,255,.13)" stroke="rgba(255,255,255,.35)" stroke-width=".5"/></g>')
    E_.append(f'<g class="base">{land_base(D, "rgba(255,255,255,.05)", "rgba(255,255,255,.18)")}</g>')
    # 造山帯（分けられなかった場所）：斜線
    E_.append('<defs><pattern id="cc-e22-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
              '<line x1="0" y1="0" x2="0" y2="6" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/></pattern></defs>')
    og = ''.join(d_polys(cp(shape(f['geometry']).buffer(0), .3)) for f in D['orogens'])
    E_.append(f'<g class="L3"><path d="{og}" fill="url(#cc-e22-hatch)" stroke="#fff" stroke-opacity=".6" stroke-width=".8" stroke-dasharray="3 2"/>{boundaries(D)}</g>')
    # ラベル：大きい7つ → 残り（面積順、置ける分だけ）→ 造山帯
    order = sorted(by, key=lambda c: -by[c].area)
    placed = {'big': 0, 'small': 0, 'orogen': 0}
    for c in BIG7:
        g = max(polys_of(cp(by[c], .4)), key=lambda p: p.area)
        pt = polylabel(g, 1)
        if bx.place(pt.x, pt.y + 5, PLATE_JA[c] + 'プレート', 14):
            lab1.append(text(pt.x, pt.y + 5, PLATE_JA[c] + 'プレート', 14, '#fff', extra=' font-weight="700"'))
            placed['big'] += 1
    for c in order:
        if c in BIG7:
            continue
        g = max(polys_of(cp(by[c], .4)), key=lambda p: p.area)
        if g.area < 60:
            continue
        pt = polylabel(g, 0.5)
        if bx.place(pt.x, pt.y + 4, PLATE_JA[c], 10):
            lab2.append(text(pt.x, pt.y + 4, PLATE_JA[c], 10, 'rgba(255,255,255,.85)'))
            placed['small'] += 1
    lab3 = []
    for f in sorted(D['orogens'], key=lambda f: -shape(f['geometry']).area):
        g = max(polys_of(cp(shape(f['geometry']).buffer(0), .3)), key=lambda p: p.area)
        nm = OROGEN_JA[f['properties']['Name']]
        c = g.centroid
        for dy in (0, -12, 12, -24, 24):
            if bx.place(c.x, c.y + dy, nm, 9):
                lab3.append(text(c.x, c.y + dy, nm, 9, '#fff', extra=' font-style="italic"'))
                placed['orogen'] += 1
                break
    E_.append('<g class="L1 lbl">' + ''.join(lab1) + '</g><g class="L2 lbl">' + ''.join(lab2) + '</g><g class="L3 lbl">' + ''.join(lab3) + '</g>')
    E_.append('</g>')
    E_.append(f'<rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}" fill="none" stroke="rgba(255,255,255,.3)"/>')
    E_.append('</svg>')
    return '\n'.join(E_), placed


def dots(pts, sw, color, op):
    d = ''.join(f'M{fmt(X(lo))} {fmt(Y(la))}h0' for lo, la in pts)
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-opacity="{op}" stroke-width="{sw}" stroke-linecap="round"/>'


def quakes_svg(D):
    E_ = head('cc-e22-quakes', '地震（M6.0以上）と火山（完新世）と境界の線')
    E_ += grid()
    E_.append('<g clip-path="url(#cc-e22-quakes)">')
    E_.append(land_base(D))
    E_.append(f'<g class="L3">{boundaries(D, 1.1, .85)}</g>')
    q6 = [(lo, la) for lo, la, m in D['quakes'] if m < 7]
    q7 = [(lo, la) for lo, la, m in D['quakes'] if m >= 7]
    E_.append('<g class="L1">' + dots(q6, 2.2, '#ff8a8a', .55) + dots(q7, 4.2, '#ff5252', .75) + '</g>')
    if D['volcanoes']:
        vd = ''.join(f'M{fmt(X(lo))} {fmt(Y(la) - 2.2)}l1.9 3.3h-3.8z' for lo, la, _ in D['volcanoes'])
        E_.append(f'<g class="L2"><path d="{vd}" fill="#ffb46b" fill-opacity=".9" stroke="#000" stroke-width=".4"/></g>')
    else:
        E_.append('<g class="L2"></g>')
    E_.append('</g>')
    E_.append(f'<rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}" fill="none" stroke="rgba(255,255,255,.3)"/>')
    E_.append('</svg>')
    return '\n'.join(E_)


LF = {'Range/mtn': ('L1', '#d4a373', .55), 'Plateau': ('L2', '#8fa3c7', .45), 'Desert': ('L3', '#f2d27b', .45)}


def landforms_svg(D):
    E_ = head('cc-e22-land', '大地形：山脈・高原・砂漠（境界の線を薄く下敷きに）')
    E_ += grid()
    E_.append('<g clip-path="url(#cc-e22-land)">')
    E_.append(land_base(D))
    E_.append(f'<g class="base">{boundaries(D, .9, .35)}</g>')
    feats = defaultdict(list)
    for f in D['regions']:
        c = f['properties']['FEATURECLA']
        if c in LF:
            feats[c].append(f)
    labs = defaultdict(list)
    bx = Boxes()
    placed = {}
    for c, (L, col, op) in LF.items():
        d = ''.join(d_polys(cp(shape(f['geometry']).buffer(0), .3)) for f in feats[c])
        E_.append(f'<g class="{L}"><path d="{d}" fill="{col}" fill-opacity="{op}" stroke="{col}" stroke-width=".6" stroke-opacity=".9"/></g>')
    # ラベル：各分類の大きい順（面積）に、置けるだけ
    n = 0
    for c in ('Range/mtn', 'Desert', 'Plateau'):
        L, col, _ = LF[c]
        k = 0
        for f in sorted(feats[c], key=lambda f: -shape(f['geometry']).area)[:40]:
            g = max(polys_of(cp(shape(f['geometry']).buffer(0), .3)), key=lambda p: p.area)
            if g.area < 25:
                continue
            nm = f['properties']['NAME_JA']
            pt = polylabel(g, 0.5)
            for dy in (0, -10, 10):
                if bx.place(pt.x, pt.y + 3 + dy, nm, 9.5):
                    labs[L].append(text(pt.x, pt.y + 3 + dy, nm, 9.5, col, extra=' font-weight="600"'))
                    k += 1
                    break
        placed[c] = (len(feats[c]), k)
    E_.append(''.join(f'<g class="{L} lbl">' + ''.join(v) + '</g>' for L, v in labs.items()))
    E_.append('</g>')
    E_.append(f'<rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}" fill="none" stroke="rgba(255,255,255,.3)"/>')
    E_.append('</svg>')
    return '\n'.join(E_), placed


# 05 の図：代表的な場所（経度・緯度は PB2002 のその分類の線の上にあることを earth.py で確かめる）
PLACES = [
    ('div', '大西洋中央海嶺', -42.1, 30.1), ('div', 'アイスランド', -18.0, 64.8), ('div', '東アフリカ大地溝帯', 36.5, 5.3), ('div', '東太平洋海膨', -112.5, -20.0),
    ('conv', '日本海溝', 143.8, 38.3), ('conv', 'ペルー・チリ海溝', -71.5, -22.0), ('conv', 'ヒマラヤ（衝突）', 85.0, 27.9),
    ('tr', 'サンアンドレアス断層', -121.0, 36.5), ('tr', 'アルパイン断層', 170.0, -43.5), ('tr', '北アナトリア断層', 36.0, 40.9),
]


def bound3_svg(D):
    """記事に埋め込む図（色は固定。背景は記事の図の枠）。viewBox は 640 幅に縮める"""
    s = 640 / (ML + W + MR)
    E_ = [f'<svg viewBox="0 0 640 {fmt((MT + H + MB) * s)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="プレートの境界を3つの動き（広がる・沈み込む・すれ違う）で色分けした全球の図と、代表的な場所">',
          f'<g transform="scale({s:.5f})">', f'<rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}" fill="#05080d"/>']
    E_ += grid()
    E_.append(land_base(D, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.25)', 1.2))   # 記事に埋め込むので粗く（640幅に縮めて見る）
    E_.append(boundaries(D, 1.8, 1, .9))
    bx = Boxes()
    for i, (c, nm, lo, la) in enumerate(PLACES, 1):
        x, y = X(lo), Y(la)
        E_.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="9" fill="{COL[c]}" stroke="#000" stroke-width="1.2"/>')
        E_.append(f'<text x="{fmt(x)}" y="{fmt(y + 4.5)}" font-size="12" font-weight="700" fill="#000" text-anchor="middle">{i}</text>')
    E_.append(f'<rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}" fill="none" stroke="rgba(255,255,255,.3)"/>')
    E_.append('</g></svg>')
    return '\n'.join(E_)


if __name__ == '__main__':
    D = load()
    os.makedirs(SVG_DIR, exist_ok=True)
    out = {}
    svg, placed = plates_svg(D)
    open(os.path.join(SVG_DIR, 'e2-2-plates.svg'), 'w').write(svg)
    out['plates'] = placed
    open(os.path.join(SVG_DIR, 'e2-2-quakes.svg'), 'w').write(quakes_svg(D))
    svg, placed = landforms_svg(D)
    open(os.path.join(SVG_DIR, 'e2-2-landforms.svg'), 'w').write(svg)
    out['landforms'] = placed
    open(os.path.join(DATA, 'e2-2-bound3.svg'), 'w').write(bound3_svg(D))
    out['quakes'] = len(D['quakes'])
    out['volcanoes'] = len(D['volcanoes'])
    for fn in ('e2-2-plates.svg', 'e2-2-quakes.svg', 'e2-2-landforms.svg'):
        out[fn] = round(os.path.getsize(os.path.join(SVG_DIR, fn)) / 1024, 1)
    out['e2-2-bound3.svg'] = round(os.path.getsize(os.path.join(DATA, 'e2-2-bound3.svg')) / 1024, 1)
    print(json.dumps(out, ensure_ascii=False))

# 2-3 気候と海流：全球のカード5枚と、記事に埋め込む図1枚、記事の数値を作る。
#   python climate.py
# 枠は 2-1・2-2 と同じ全球の正距円筒図法（earth.py の head・grid・land_base をそのまま使う）。書き出すもの：
#   image/memoryverse/cards/e2-3-bands.svg     §04 気候の帯（層1 年降水量／層2 年平均気温の等温線／層3 帯の境目と回帰線）
#   image/memoryverse/cards/e2-3-dry.svg       §06 乾きすぎる場所（層1 中央値基準／層2 平均基準／層3 帯の境目）
#   image/memoryverse/cards/e2-3-temp.svg      §07 暖かすぎる・寒すぎる場所（層1 標高1000m未満／層2 全部の陸／層3 1000m以上の高地）
#   image/memoryverse/cards/e2-3-koppen.svg    §08 ケッペンと帯（層1 5分類／層2 帯が予想する分類／層3 食い違う場所）
#   image/memoryverse/cards/e2-3-currents.svg  §09 海流（層1 流線／層2 名前／層3 観測の無い海域）
#   data/e2-3-profile.svg                      §05 の図（緯度ごとの平均と中央値。記事に埋め込む）
#   data/e2-3-numbers.json                     記事に書く数値のすべて
# データ（data/earth/ に置く。リポジトリには入れない）。DESIGN.md §104：
#   cru/cru_ts4.09.{1991.2000,2001.2010,2011.2020}.{tmp,pre}.dat.nc   CRU TS 4.09（OGL v3）
#   gdp_annual_v3.10.nc        NOAA Global Drifter Program の気候値 版3.10（ERDDAP drifter_annualmeans の U,V,N,eU,eV。CC BY 4.0）
#   etopo2022_60s_every5.npy   ETOPO 2022 60秒（表面）を5つおきに取った 2160×4320（南が上の行から）。CC0。無ければ OPeNDAP で取る
#   ne_50m_land.geojson・ne_10m_geography_regions_polys.geojson・ne_10m_geography_marine_polys.geojson（Natural Earth v5.1.2）
import json, math, os, sys
import numpy as np, netCDF4, shapely
from shapely.geometry import shape, box, Point, LineString
from shapely.ops import unary_union, polylabel
from shapely.strtree import STRtree
import earth
from earth import X, Y, ML, MT, W, H, head, grid, land_base, text, Boxes, cp
from countries import DATA, SVG_DIR
from svgutil import fmt, d_polys, rel

E_ = os.path.join(DATA, 'earth')
NY, NX = 360, 720
LAT = 89.75 - 0.5 * np.arange(NY); LON = -179.75 + 0.5 * np.arange(NX)        # 北が上・西経180度から（2-1 の枠）
AREA = (111.19 * 0.5) ** 2 * np.cos(np.radians(LAT))[:, None] * np.ones((1, NX))  # 0.5度のセルの面積（km²）
CUTS_N, CUTS_S = [15.5, 32.0, 45.5, 64.0], [18.5, 34.0]                         # 記事の帯の境目（下の segment で出た値）
BAND_N = ['熱帯', '乾いた帯', '中緯度の帯', '冷たい帯', '極の帯']                # 名前は本教材が付けたもの
BAND_S = ['熱帯', '乾いた帯', '温和な帯']
TROPIC = 23.44
R_DRY, D_TEMP, LOW, AMIN = 1 / 3, 5.0, 1000.0, 100000                           # 外れ値の基準（§104）
NUM = {}


# ---------------------------------------------------------------- 気温・降水量（CRU TS 4.09、1991–2020 の平年値）
def cru(v):
    parts = []
    for d in ('1991.2000', '2001.2010', '2011.2020'):
        ds = netCDF4.Dataset(os.path.join(E_, 'cru', f'cru_ts4.09.{d}.{v}.dat.nc'))
        assert ds.variables['lat'][0] < 0 and abs(ds.variables['lon'][0] + 179.75) < 1e-6
        parts.append(np.ma.filled(ds.variables[v][:].astype('f8'), np.nan))
    x = np.concatenate(parts)[:, ::-1, :]
    assert x.shape[0] == 360
    return np.stack([np.nanmean(x[m::12], 0) for m in range(12)])


def elevation():
    """0.5度のセルごとの陸の標高（海面より上の点だけの平均）。海底を混ぜると海岸のセルが低く出るため"""
    fn = os.path.join(E_, 'etopo2022_60s_every5.npy')
    if not os.path.exists(fn):
        d = netCDF4.Dataset('https://www.ngdc.noaa.gov/thredds/dodsC/global/ETOPO2022/60s/60s_surface_elev_netcdf/ETOPO_2022_v1_60s_N90W180_surface.nc')
        np.save(fn, np.ma.filled(d.variables['z'][::5, ::5].astype('f4'), np.nan))
    e = np.load(fn).reshape(360, 6, 720, 6)
    pos = np.where(e > 0, e, np.nan)
    with np.errstate(all='ignore'):
        m = np.where(np.isfinite(pos).sum((1, 3)) > 0, np.nanmean(pos, (1, 3)), 0)
    return m[::-1]


def koppen(Tm, Pm, land):
    """Peel, Finlayson & McMahon (2007) Table 1 の主分類。B を最初に決める（同論文 p.1637）"""
    T, P = Tm.mean(0), Pm.sum(0); Thot, Tcold = Tm.max(0), Tm.min(0)
    amjjas = Tm[3:9].mean(0) > np.concatenate([Tm[9:], Tm[:3]]).mean(0)              # 夏＝暖かい方の半年
    Ps = np.where(amjjas, Pm[3:9].sum(0), np.concatenate([Pm[9:], Pm[:3]]).sum(0)); Pw = P - Ps
    Pth = np.where(Pw >= 0.7 * P, 2 * T, np.where(Ps >= 0.7 * P, 2 * T + 28, 2 * T + 14))
    K = np.full((NY, NX), '', '<U1')
    K[land & (Thot < 10)] = 'E'
    K[land & (Thot >= 10) & (Tcold <= 0)] = 'D'
    K[land & (Thot >= 10) & (Tcold > 0) & (Tcold < 18)] = 'C'
    K[land & (Tcold >= 18)] = 'A'
    K[land & (P < 10 * Pth)] = 'B'
    return K


def rowf(a, m, f):
    return np.array([f(a[i][m[i]]) if m[i].any() else np.nan for i in range(NY)])


# ---------------------------------------------------------------- 帯の区切り（半球ごとに、行の中央値の縦の並びを k 本に最適に切る）
def segment(T, P, land, k, hemi):
    n = land.sum(1)
    feat = np.stack([rowf(T, land, np.median), rowf(np.log(np.maximum(P, 1)), land, np.median)], 1)
    rows = (np.where((LAT > 0) & (n > 0) & (LAT < 84))[0][::-1] if hemi == 'N' else np.where((LAT < 0) & (LAT > -60) & (n > 0))[0])
    Xf = feat[rows]; Xf = (Xf - Xf.mean(0)) / Xf.std(0)
    wt = (n[rows] * np.cos(np.radians(LAT[rows]))).astype(float); m = len(rows)
    cw = np.r_[0, np.cumsum(wt)]; cx = np.vstack([np.zeros(2), np.cumsum(Xf * wt[:, None], 0)]); cxx = np.r_[0, np.cumsum((Xf ** 2).sum(1) * wt)]
    cost = lambda i, j: (cxx[j] - cxx[i] - ((cx[j] - cx[i]) ** 2).sum() / (cw[j] - cw[i])) if cw[j] > cw[i] else 0
    D = np.full((k + 1, m + 1), np.inf); B = np.zeros((k + 1, m + 1), int); D[0, 0] = 0
    for q in range(1, k + 1):
        for j in range(q * 4, m + 1):
            for i in range((q - 1) * 4, j - 3):
                c = D[q - 1, i] + cost(i, j)
                if c < D[q, j]: D[q, j] = c; B[q, j] = i
    cuts = []; j = m
    for q in range(k, 0, -1): i = B[q, j]; cuts.append(i); j = i
    tot = cost(0, m)
    return round(1 - D[k, m] / tot, 3), [abs(float(LAT[rows][c] + (0.25 if LAT[rows][c] > 0 else -0.25))) for c in sorted(cuts)[1:]]


def band_index():
    band = np.full((NY, NX), -1); names = []
    for h, cuts, nm in (('N', CUTS_N, BAND_N), ('S', CUTS_S, BAND_S)):
        edges = [0] + cuts + [90 if h == 'N' else 60]
        for b in range(len(edges) - 1):
            lo, hi = edges[b], edges[b + 1]
            rows = (LAT >= lo) & (LAT < hi) if h == 'N' else (LAT < -lo) & (LAT >= -hi)
            band[rows, :] = len(names); names.append((h, nm[b], lo, hi))
    return band, names


# ---------------------------------------------------------------- 外れ値のかたまり
def clusters(mask):
    seen = np.zeros_like(mask); out = []
    for i0, j0 in zip(*np.where(mask)):
        if seen[i0, j0]: continue
        st = [(i0, j0)]; seen[i0, j0] = 1; cells = []
        while st:
            i, j = st.pop(); cells.append((i, j))
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    a, b = i + di, (j + dj) % NX
                    if 0 <= a < NY and mask[a, b] and not seen[a, b]: seen[a, b] = 1; st.append((a, b))
        out.append(cells)
    return out


# かたまりの呼び名（本教材が付ける）。中心に近いものを選ぶ。無ければ Natural Earth の地形の名前の多いもの
NAMES = [
    (25.6, 14.2, 'サハラの中心部'), (24.1, 29.3, 'サハラ〜アラビア〜アフリカの角〜イラン〜トゥラン'), (40.0, 91.3, 'チベット・ゴビ・タリム'),
    (5.1, 43.0, 'アフリカの角'), (43.3, 61.0, 'トゥラン低地'), (-18.0, -72.0, 'アンデス・アタカマ'), (-43.0, -68.0, 'パタゴニア'),
    (-50.8, -70.0, 'パタゴニア南部'), (-23.5, 15.5, 'ナミブ'), (-8.0, -39.0, 'カーチンガ'), (80.4, -38.2, 'グリーンランド北部'),
    (33.5, 55.1, 'イランの砂漠'), (33.0, -115.0, 'ソノラ・グレートベースン'), (30.1, 62.3, 'バルチスタン'), (18.8, 53.3, 'ルブアルハリ'),
    (-27.9, 135.3, 'オーストラリア中央部'), (46.1, 86.1, 'ジュンガル盆地'),
    (58.8, 21.4, '北西ヨーロッパ'), (57.6, 22.7, '北西ヨーロッパ'), (33.1, 45.4, 'メソポタミア'), (65.0, -19.0, 'アイスランド'),
    (54.7, -132.2, 'アラスカ・BC の海岸'), (58.1, 132.7, '東シベリア'), (57.3, 129.6, '東シベリア'), (55.6, -70.0, 'カナダ東部'),
    (62.3, -93.8, 'ハドソン湾のまわり'), (26.9, 112.0, '中国南部'), (42.2, 127.8, '朝鮮半島北部・中国東北部'), (46.9, 136.8, 'シホテアリン'),
    (-19.0, 13.0, 'ナミビアの海岸'), (33.0, 90.9, 'チベット'), (-17.4, -71.2, 'アンデス'), (72.3, -41.2, 'グリーンランドの氷床'),
    (49.1, 98.6, 'モンゴル・アルタイ'), (21.9, -101.8, 'メキシコ高原'), (9.7, 38.2, 'エチオピア高原'), (-1.0, 36.0, 'ケニアの高地'),
    (38.8, -106.5, 'ロッキー'), (39.3, 61.7, 'トゥラン'), (30.2, 73.2, 'パンジャーブ・タール'), (41.7, 12.0, 'イタリア'),
    (33.1, 57.3, 'イラン'), (38.1, -7.0, 'イベリア'), (33.4, 6.8, 'サハラ北部'), (37.1, 25.6, 'エーゲ海のまわり'), (29.6, -2.7, 'サハラ西部'),
    (73.8, 57.9, 'ロシアの北極海沿岸'), (32.9, 43.1, 'メソポタミア・アラビア'), (48.4, 109.2, 'モンゴル高原'), (-12.5, 17.0, 'ビエ高原'),
    (-4.0, 28.5, 'ミトゥンバ山地'), (16.0, 44.0, 'アラビアの高地'), (19.5, -104.5, 'シエラマドレ'), (27.5, 118.5, '武夷山'), (14.9, -89.7, 'グアテマラの高地'),
]


def name_of(la, lo, km2):
    best = min(NAMES, key=lambda n: math.hypot(n[0] - la, (n[1] - lo) * math.cos(math.radians(la))))
    return best[2] if math.hypot(best[0] - la, (best[1] - lo) * math.cos(math.radians(la))) < 6 else None


def report(mask, val):
    res = []
    for cells in clusters(mask):
        ii = np.array([c[0] for c in cells]); jj = np.array([c[1] for c in cells]); wv = AREA[ii, jj]
        if wv.sum() < AMIN: continue
        ang = np.radians(LON[jj])
        la = float((LAT[ii] * wv).sum() / wv.sum()); lo = float(np.degrees(np.arctan2((np.sin(ang) * wv).sum(), (np.cos(ang) * wv).sum())))
        res.append({'km2': int(wv.sum()), 'lat': round(la, 1), 'lon': round(lo, 1), 'val': round(float((val[ii, jj] * wv).sum() / wv.sum()), 2),
                    'elev': int((ELEV[ii, jj] * wv).sum() / wv.sum()), 'name': name_of(la, lo, wv.sum()), 'cells': cells})
    res.sort(key=lambda r: -r['km2'])
    return res


def cells_geom(cells, step=0.5):
    """セルの集まりを多角形に（同じ行で続くセルは1つの長方形にまとめてから合わせる）"""
    rows = {}
    for i, j in cells: rows.setdefault(i, []).append(j)
    bx = []
    for i, js in rows.items():
        js.sort(); s = js[0]; p = js[0]
        for j in js[1:] + [None]:
            if j is not None and j == p + 1: p = j; continue
            bx.append(box(LON[s] - step / 2, LAT[i] - step / 2, LON[p] + step / 2, LAT[i] + step / 2))
            if j is not None: s = p = j
    return unary_union(bx)


# ---------------------------------------------------------------- 海流（NOAA Global Drifter Program 版3.10）
def currents():
    d = netCDF4.Dataset(os.path.join(E_, 'gdp_annual_v3.10.nc'))
    U = np.ma.filled(d.variables['U'][:], np.nan).T; V = np.ma.filled(d.variables['V'][:], np.nan).T
    N = np.ma.filled(d.variables['N'][:], 0).T
    la = np.asarray(d.variables['latitude'][:], float); lo = np.asarray(d.variables['longitude'][:], float)
    U[N < 5] = np.nan; V[N < 5] = np.nan                                              # 1平方度あたり5日未満は使わない
    def coarsen(a):
        ny = a.shape[0] // 2 * 2; b = a[:ny].reshape(ny // 2, 2, a.shape[1] // 2, 2)
        with np.errstate(all='ignore'): return np.where(np.isfinite(b).sum((1, 3)) >= 2, np.nanmean(b, (1, 3)), np.nan)
    def smooth(a):
        ny, nx = a.shape; pad = np.pad(a, ((1, 1), (0, 0)), constant_values=np.nan); pad = np.concatenate([pad[:, -1:], pad, pad[:, :1]], 1)
        st = np.stack([pad[1 + di:1 + di + ny, 1 + dj:1 + dj + nx] for di in (-1, 0, 1) for dj in (-1, 0, 1)])
        with np.errstate(all='ignore'): return np.where(np.isfinite(a) & (np.isfinite(st).sum(0) >= 5), np.nanmean(st, 0), np.nan)
    Us, Vs = smooth(coarsen(U)), smooth(coarsen(V)); lat0 = la[0] + 0.125; lon0 = lo[0] + 0.125
    NYc, NXc = Us.shape; spd = np.hypot(Us, Vs)

    def sample(x, y):
        fi = (y - lat0) / 0.5; fj = ((x - lon0) % 360) / 0.5; i = int(np.floor(fi)); j = int(np.floor(fj))
        if i < 0 or i + 1 >= NYc: return None
        j1 = (j + 1) % NXc; j %= NXc; ti = fi - i; tj = fj - np.floor(fj)
        q = [(Us[i, j], Vs[i, j]), (Us[i, j1], Vs[i, j1]), (Us[i + 1, j], Vs[i + 1, j]), (Us[i + 1, j1], Vs[i + 1, j1])]
        if any(not np.isfinite(a) for a, b in q): return None
        w = [(1 - ti) * (1 - tj), (1 - ti) * tj, ti * (1 - tj), ti * tj]
        return sum(wk * a for wk, (a, b) in zip(w, q)), sum(wk * b for wk, (a, b) in zip(w, q))
    def mapvel(x, y):   # 正距円筒図法の上の向き（経度方向は 1/cos φ 倍）
        s = sample(x, y)
        if s is None: return None
        u, v = s; sp = math.hypot(u, v); mu = u / max(math.cos(math.radians(y)), 0.2); m = math.hypot(mu, v)
        return (mu / m, v / m, sp) if m > 0 else None
    DSEP, STEP, VMIN, MINLEN, RES = 2.4, 0.2, 0.05, 3.0, 0.25
    GH, GW = int(180 / RES), int(360 / RES); near_sep = np.zeros((GH, GW), bool); near_test = np.zeros((GH, GW), bool)
    gidx = lambda x, y: (int((y + 90) / RES), int(((x + 180) % 360) / RES))
    def stamp(mask, pts, r):
        k = int(np.ceil(r / RES))
        for x, y in pts:
            i0, j0 = gidx(x, y)
            for di in range(-k, k + 1):
                for dj in range(-k, k + 1):
                    if (di * di + dj * dj) * RES * RES <= r * r and 0 <= i0 + di < GH: mask[i0 + di, (j0 + dj) % GW] = True
    def trace(x, y, sgn):
        pts = []; sps = []
        for _ in range(4000):
            a = mapvel(x, y)
            if a is None or a[2] < VMIN: break
            b = mapvel(x + sgn * a[0] * STEP / 2, y + sgn * a[1] * STEP / 2)
            if b is None or b[2] < VMIN: break
            x, y = x + sgn * b[0] * STEP, y + sgn * b[1] * STEP; x = (x + 180) % 360 - 180
            i, j = gidx(x, y)
            if not (0 <= i < GH) or near_test[i, j]: break
            if len(pts) > 20 and any(abs(x - px) < STEP * .6 and abs(y - py) < STEP * .6 for px, py in pts[:-10]): break
            pts.append((x, y)); sps.append(b[2])
        return pts, sps
    seeds = sorted(((spd[i, j], lon0 + j * 0.5, lat0 + i * 0.5) for i in range(NYc) for j in range(NXc) if np.isfinite(spd[i, j]) and spd[i, j] >= VMIN), reverse=True)
    lines = []
    for s, x, y in seeds:
        i, j = gidx(x, y)
        if near_sep[i, j]: continue
        f, fs = trace(x, y, 1); b, bs = trace(x, y, -1)
        pts = b[::-1] + [(x, y)] + f; ss = bs[::-1] + [s] + fs
        if len(pts) * STEP < MINLEN: continue
        lines.append((pts, ss)); stamp(near_sep, pts, DSEP); stamp(near_test, pts, DSEP / 2)

    # 名前：教科書で使われる25の名前を候補にし、候補の場所から4度以内で、言われる向き（±45度）に流れる最も速いところが 0.10 m/s 以上なら付ける
    CAND = [('メキシコ湾流', 37.5, -68, 60), ('北大西洋海流', 50, -30, 45), ('ラブラドル海流', 55, -54, 160), ('カナリア海流', 24, -20, 215),
            ('北赤道海流（大西洋）', 14, -40, 270), ('赤道反流（大西洋）', 7, -25, 90), ('南赤道海流（大西洋）', -3, -25, 275), ('ブラジル海流', -30, -47, 200),
            ('ベンゲラ海流', -25, 11, 330), ('アガラス海流', -33, 28, 230), ('南極周極流', -53, 60, 90), ('ソマリ海流', 5, 50, 30),
            ('南赤道海流（インド洋）', -12, 80, 270), ('西オーストラリア海流', -28, 110, 0), ('東オーストラリア海流', -30, 154, 180),
            ('黒潮', 33, 139, 60), ('親潮', 42, 147, 220), ('北太平洋海流', 40, -165, 90), ('カリフォルニア海流', 35, -125, 160),
            ('北赤道海流（太平洋）', 14, -150, 270), ('赤道反流（太平洋）', 7, -120, 90), ('南赤道海流（太平洋）', -3, -120, 270),
            ('ペルー海流', -20, -78, 345), ('アラスカ海流', 57, -145, 300), ('東グリーンランド海流', 68, -25, 210)]
    def boxv(la_, lo_):
        i0 = int(round((la_ - lat0) / 0.5)); j0 = int(round(((lo_ - lon0) % 360) / 0.5)); u = []; v = []
        for i in range(i0 - 2, i0 + 3):
            for j in range(j0 - 2, j0 + 3):
                if 0 <= i < NYc and np.isfinite(Us[i, j % NXc]): u.append(Us[i, j % NXc]); v.append(Vs[i, j % NXc])
        if len(u) < 5: return 0, 0
        u = float(np.mean(u)); v = float(np.mean(v)); return math.hypot(u, v), (math.degrees(math.atan2(u, v)) + 360) % 360
    labels = []
    for nm, la_, lo_, exp in CAND:
        best = (0, 0, la_, lo_)
        for dla in np.arange(-4, 4.01, 0.5):
            for dlo in np.arange(-4, 4.01, 0.5):
                s, b = boxv(la_ + dla, lo_ + dlo)
                if abs((b - exp + 180) % 360 - 180) <= 45 and s > best[0]: best = (s, b, la_ + dla, lo_ + dlo)
        labels.append({'name': nm, 'speed': round(best[0], 3), 'bearing': round(best[1]), 'lat': float(best[2]), 'lon': float(best[3]), 'named': best[0] >= 0.10})

    # 線の無い海域：観測が足りない（漂流ブイの格子の外を含む）／観測はあるが 0.05 m/s より遅い
    spd_g = np.full((NY, NX), np.nan)
    for i in range(NYc):
        ii = int(round((89.75 - (lat0 + i * 0.5)) / 0.5))
        if 0 <= ii < NY:
            for j in range(NXc): spd_g[ii, int(round(((lon0 + j * 0.5 + 180) % 360 - 0.25) / 0.5)) % NX] = spd[i, j]
    landg = shapely.contains_xy(LANDGEOM, *np.meshgrid(LON, LAT))
    casp = (LAT[:, None] >= 36) & (LAT[:, None] <= 47.5) & (LON[None, :] >= 46) & (LON[None, :] <= 55.5)   # カスピ海は湖なので海から外す
    ocean = ~landg & ~casp
    A = ocean & ~np.isfinite(spd_g); B = ocean & np.isfinite(spd_g) & (spd_g < VMIN)
    tot = AREA[ocean].sum()
    gaps = {'no_obs_pct': round(float(AREA[A].sum() / tot * 100), 1), 'no_obs_km2': int(AREA[A].sum()),
            'slow_pct': round(float(AREA[B].sum() / tot * 100), 1), 'lines_pct': round(float(AREA[ocean & ~A & ~B].sum() / tot * 100), 1)}
    return lines, labels, A, gaps


# ---------------------------------------------------------------- 描く
def svg_open(cid, label):
    return head(cid, label)


def svg_close(out):
    out.append(f'<rect x="{ML}" y="{MT}" width="{fmt(W)}" height="{fmt(H)}" fill="none" stroke="rgba(255,255,255,.3)"/>')
    out.append('</svg>')
    return '\n'.join(out)


def poly_path(g, tol=.6):
    return d_polys(cp(g, tol))


def area_labels(bx, items, fs=10.5, fill='#fff', keys=None):
    out = []
    for r in items:
        if not r.get('name'): continue
        g = r['geom']
        big = max(getattr(g, 'geoms', [g]), key=lambda p: p.area)
        try: pt = polylabel(big, 0.2)
        except Exception: pt = big.representative_point()
        x, y = X(pt.x), Y(pt.y)
        for dy in (0, -12, 12, -24, 24):
            if bx.place(x, y + dy + 4, r['name'], fs):
                out.append(text(x, y + dy + 4, r['name'], fs, fill, 'middle', ' font-weight="600"')); break
    return out


def band_lines(color='#fff', names=True, bx=None):
    out = []
    for h, cuts in (('N', CUTS_N), ('S', CUTS_S)):
        for c in cuts:
            la = c if h == 'N' else -c
            out.append(f'<path d="M{ML} {fmt(Y(la))}H{fmt(ML + W)}" stroke="{color}" stroke-width="1.3" stroke-opacity=".85"/>')
            if bx is not None:
                t = f'{c:g}°{h}'
                bx.place(ML + W - 26, Y(la) - 3, t, 9.5)
                out.append(text(ML + W - 4, Y(la) - 3, t, 9.5, 'rgba(255,255,255,.85)', 'end'))
    if names and bx is not None:
        for h, cuts, nm, top in (('N', CUTS_N, BAND_N, 84), ('S', CUTS_S, BAND_S, 60)):
            edges = [0] + cuts + [top]
            for b in range(len(edges) - 1):
                mid = (edges[b] + edges[b + 1]) / 2 * (1 if h == 'N' else -1)
                t = nm[b] + ('（北）' if h == 'N' and nm[b] in ('熱帯', '乾いた帯') else '（南）' if h == 'S' and nm[b] in ('熱帯', '乾いた帯') else '')
                out.append(text(ML + 8, Y(mid) + 4, t, 10.5, '#fff', 'start', ' font-weight="600"'))
    return out


def tropics():
    out = []
    for la, t in ((TROPIC, '北回帰線 23.44°'), (-TROPIC, '南回帰線 23.44°')):
        out.append(f'<path d="M{ML} {fmt(Y(la))}H{fmt(ML + W)}" stroke="#ffb46b" stroke-width="1.2" stroke-dasharray="6 4"/>')
        out.append(text(ML + W / 2 + 180, Y(la) + (13 if la > 0 else -5), t, 9.5, '#ffb46b', 'middle'))
    return out


def fill_classes(classes, colors, step=1.0, opacity=.8):
    """0.5度の分類を1度にまとめて塗る（4つのうち多いもの。陸が2つ未満のセルは塗らない）"""
    out = []
    ny, nx = NY // 2, NX // 2
    for key, col in colors.items():
        cells = []
        for I in range(ny):
            for J in range(nx):
                sub = classes[2 * I:2 * I + 2, 2 * J:2 * J + 2].ravel()
                sub = [s for s in sub if s != '' and s is not None]
                if len(sub) < 2: continue
                vals, cnt = np.unique(sub, return_counts=True)
                if vals[np.argmax(cnt)] == key: cells.append((I, J))
        if not cells: continue
        rows = {}
        for I, J in cells: rows.setdefault(I, []).append(J)
        bx_ = []
        for I, Js in rows.items():
            Js.sort(); s = p = Js[0]
            for J in Js[1:] + [None]:
                if J is not None and J == p + 1: p = J; continue
                bx_.append(box(-180 + s, 90 - I - 1, -180 + p + 1, 90 - I))
                if J is not None: s = p = J
        g = unary_union(bx_).intersection(LAND_S)
        out.append(f'<path d="{poly_path(g, .8)}" fill="{col}" fill-opacity="{opacity}"/>')
    return out


def contour(T, land, t, step=1.0):
    """t℃以上の陸（1度）の境目の線。海岸線にあたる辺は描かない"""
    ny, nx = NY // 2, NX // 2
    with np.errstate(all='ignore'):
        T1 = np.nanmean(np.where(land, T, np.nan).reshape(ny, 2, nx, 2), (1, 3))
    segs = []
    for I in range(ny):
        for J in range(nx):
            v = T1[I, J]
            if not np.isfinite(v): continue
            for dI, dJ in ((0, 1), (1, 0)):
                I2, J2 = I + dI, (J + dJ) % nx
                if I2 >= ny or not np.isfinite(T1[I2, J2]): continue
                if (v >= t) != (T1[I2, J2] >= t):
                    x0, y0 = -180 + J + 1, 90 - I - 1
                    segs.append(LineString([(x0, y0 + 1), (x0, y0)]) if dJ else LineString([(-180 + J, 90 - I - 1), (-180 + J + 1, 90 - I - 1)]))
    return shapely.line_merge(shapely.union_all(segs)) if segs else None


def draw_all(C):
    out_sizes = {}
    # ---- 1 帯
    o = svg_open('b', '気候の帯：年降水量・年平均気温・帯の境目（CRU TS 4.09 の1991〜2020年の平年値から本教材が作成）')
    o.append(land_base({'land': LANDGEOM}))
    PCOL = {'1': '#c98f4a', '2': '#b6a766', '3': '#6fa77a', '4': '#3f8fb4', '5': '#2f5db8'}
    pc = np.full((NY, NX), '', '<U1'); P = C['P']
    for k, (a, b) in zip('12345', ((0, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 1e9))): pc[C['land'] & (P >= a) & (P < b)] = k
    leg = []
    for i, (k, t) in enumerate(zip('12345', ('250mm未満', '250〜500', '500〜1000', '1000〜2000', '2000mm以上'))):
        x = ML + 10 + i * 92; y = MT + H - 12
        leg.append(f'<rect x="{x}" y="{y - 9}" width="12" height="10" fill="{PCOL[k]}"/>'); leg.append(text(x + 16, y, t, 10, '#fff', 'start'))
    o.append('<g class="L1" clip-path="url(#b)">' + ''.join(fill_classes(pc, PCOL, opacity=.85)) + '</g><g class="L1">' + ''.join(leg) + '</g>')
    o += grid()
    iso = []
    for t, col in ((0, '#9ad0ff'), (10, '#ffe08a'), (20, '#ff9a6b')):
        g = contour(C['T'], C['land'], t)
        if g is not None: iso.append(f'<path d="{"".join(rel(list(l.coords)) for l in getattr(cp(g, .6), "geoms", [cp(g, .6)]))}" fill="none" stroke="{col}" stroke-width="1.4"/>')
    for i, (t, col) in enumerate(((0, '#9ad0ff'), (10, '#ffe08a'), (20, '#ff9a6b'))):
        x = ML + W - 200 + i * 64; y = MT + H - 12
        iso.append(f'<path d="M{x} {y - 4}h16" stroke="{col}" stroke-width="2"/>'); iso.append(text(x + 20, y, f'{t}℃', 10, '#fff', 'start'))
    o.append('<g class="L2">' + ''.join(iso) + '</g>')
    bx = Boxes()
    o.append('<g class="L3">' + ''.join(band_lines(bx=bx)) + ''.join(tropics()) + '</g>')
    out_sizes['e2-3-bands.svg'] = svg_close(o)

    # ---- 2 乾きすぎ
    o = svg_open('d', '乾きすぎる場所：年降水量が同じ緯度の陸の中央値（層1）・平均（層2）の3分の1以下（CRU TS 4.09 から本教材が作成）')
    o.append(land_base({'land': LANDGEOM})); o += grid()
    bx = Boxes()
    for r in C['P_median'] + C['P_mean']: r['geom'] = cells_geom(r['cells']).intersection(LAND_S)
    l1 = [f'<path d="{poly_path(r["geom"])}" fill="#ffb46b" fill-opacity=".6" stroke="#ffb46b" stroke-width=".8"/>' for r in C['P_median']]
    l2 = [f'<path d="{poly_path(r["geom"])}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="4 3"/>' for r in C['P_mean']]
    o.append('<g class="L1" clip-path="url(#d)">' + ''.join(l1) + ''.join(area_labels(bx, C['P_median'])) + '</g>')
    lab2 = []
    for r in C['P_mean']:
        if r['km2'] > 10e6: lab2.append(dict(r, name='平均だと1つの塊'))
        elif r['name'] in ('オーストラリア中央部', 'ジュンガル盆地'): lab2.append(r)
    o.append('<g class="L2" clip-path="url(#d)">' + ''.join(l2) + ''.join(area_labels(bx, lab2, fill='#e8e8e8')) + '</g>')
    o.append('<g class="L3">' + ''.join(band_lines(color='rgba(255,255,255,.55)', names=False)) + '</g>')
    out_sizes['e2-3-dry.svg'] = svg_close(o)

    # ---- 3 暖かすぎ・寒すぎ
    o = svg_open('t', '暖かすぎる・寒すぎる場所：年平均気温が同じ緯度の陸の中央値より5℃以上高い・低い（CRU TS 4.09・ETOPO 2022 から本教材が作成）')
    o.append(land_base({'land': LANDGEOM}))
    hi = cells_geom(list(zip(*np.where(C['land'] & (C['elev'] >= LOW))))).intersection(LAND_S)
    o.append('<defs><pattern id="hh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="rgba(255,255,255,.45)" stroke-width="1.2"/></pattern></defs>')
    o.append(f'<g class="L3" clip-path="url(#t)"><path d="{poly_path(hi, .8)}" fill="url(#hh)" stroke="rgba(255,255,255,.35)" stroke-width=".5"/></g>')
    o += grid()
    bx = Boxes()
    for key in ('T_low_warm', 'T_low_cold', 'T_all_warm', 'T_all_cold'):
        for r in C[key]: r['geom'] = cells_geom(r['cells']).intersection(LAND_S)
    l1 = [f'<path d="{poly_path(r["geom"])}" fill="{c}" fill-opacity=".62" stroke="{c}" stroke-width=".8"/>' for key, c in (('T_low_warm', '#ff6b6b'), ('T_low_cold', '#5fb0ff')) for r in C[key]]
    o.append('<g class="L1" clip-path="url(#t)">' + ''.join(l1) + ''.join(area_labels(bx, C['T_low_warm'] + C['T_low_cold'])) + '</g>')
    l2 = [f'<path d="{poly_path(r["geom"])}" fill="none" stroke="{c}" stroke-width="1.3" stroke-dasharray="4 3"/>' for key, c in (('T_all_warm', '#ffb0b0'), ('T_all_cold', '#a8d4ff')) for r in C[key]]
    top = [r for r in C['T_all_cold'] if r['name'] in ('チベット', 'アンデス', 'グリーンランドの氷床', 'エチオピア高原', 'メキシコ高原')]
    o.append('<g class="L2" clip-path="url(#t)">' + ''.join(l2) + ''.join(area_labels(bx, top, fill='#dfefff')) + '</g>')
    out_sizes['e2-3-temp.svg'] = svg_close(o)

    # ---- 4 ケッペンと帯
    o = svg_open('k', 'ケッペンの5分類（CRU TS 4.09 から Peel ほか 2007 の規則で本教材が計算）と、緯度の帯が予想する分類、食い違う場所')
    o.append(land_base({'land': LANDGEOM}))
    KCOL = {'A': '#3d7bd9', 'B': '#e0894a', 'C': '#7cc46a', 'D': '#8f7be8', 'E': '#b8c4cc'}
    o.append('<g class="L1" clip-path="url(#k)">' + ''.join(fill_classes(C['K'], KCOL, opacity=.85)) + '</g>')
    o.append('<defs><pattern id="kh" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4" stroke="#fff" stroke-width="1.1"/></pattern></defs>')
    o.append(f'<g class="L3" clip-path="url(#k)"><path d="{poly_path(C["mismatch_geom"], .8)}" fill="url(#kh)" fill-opacity=".8"/></g>')
    o += grid()
    band, names = band_index(); l2 = []
    for b, (h, nm, lo, hi_) in enumerate(names):
        g_ = C['band_pred'][b]
        y0, y1 = (Y(hi_ if h == 'N' else -lo), Y(lo if h == 'N' else -hi_))
        hi2 = min(hi_, 84 if h == 'N' else 60)
        l2.append(f'<rect x="{ML}" y="{fmt(Y(hi2 if h == "N" else -lo))}" width="14" height="{fmt(abs(Y(lo if h == "N" else -hi2) - Y(hi2 if h == "N" else -lo)))}" fill="{KCOL[g_]}"/>')
        mid = (lo + hi2) / 2 * (1 if h == 'N' else -1)
        sfx = ('（北）' if h == 'N' else '（南）') if nm in ('熱帯', '乾いた帯') else ''
        l2.append(text(ML + 20, Y(mid) + 4, f'{nm}{sfx}→{g_}', 10.5, '#fff', 'start', ' font-weight="600"'))
    o.append('<g class="L2">' + ''.join(band_lines(color='rgba(255,255,255,.7)', names=False)) + ''.join(l2) + '</g>')
    lg = []
    for i, (g_, col) in enumerate(KCOL.items()):
        x = ML + W - 190 + i * 37; y = MT + H - 12
        lg.append(f'<rect x="{x}" y="{y - 9}" width="10" height="10" fill="{col}"/>'); lg.append(text(x + 13, y, g_, 10, '#fff', 'start'))
    o.append('<g class="L1">' + ''.join(lg) + '</g>')
    out_sizes['e2-3-koppen.svg'] = svg_close(o)

    # ---- 5 海流
    o = svg_open('c', '海流の流線（NOAA Global Drifter Program の年平均の速度場 版3.10 から本教材が作成）。流れの名前は本教材が付けたもの')
    o.append('<defs><pattern id="ch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="rgba(255,255,255,.42)" stroke-width="1.3"/></pattern></defs>')
    o.append(land_base({'land': LANDGEOM}))
    gap = cells_geom(list(zip(*np.where(C['gapA'])))).difference(LANDGEOM)
    o.append(f'<g class="L3" clip-path="url(#c)"><path d="{poly_path(gap, 1.5)}" fill="url(#ch)" stroke="rgba(255,255,255,.18)" stroke-width=".4"/></g>')
    o += grid()
    COL = '#7fd8ff'; paths = []; arrows = []
    for pts, sp in sorted(C['lines'], key=lambda L: sum(L[1]) / len(L[1])):
        s = sorted(sp)[len(sp) // 2]; w = .55 + 2.0 * min(s / .6, 1); op = .35 + .6 * min(s / .5, 1)
        cur = [pts[0]]; pieces = []
        for p in pts[1:]:
            if abs(p[0] - cur[-1][0]) > 180: pieces.append(cur); cur = [p]
            else: cur.append(p)
        pieces.append(cur)
        for pc in pieces:
            if len(pc) < 2: continue
            xy = list(LineString([(X(x), Y(y)) for x, y in pc]).simplify(.5).coords)
            paths.append(f'<path d="{rel(xy)}" stroke-width="{w:.2f}" stroke-opacity="{op:.2f}"/>')
        acc = 0
        for k in range(1, len(pts) - 1):
            x0, y0 = X(pts[k - 1][0]), Y(pts[k - 1][1]); x1, y1 = X(pts[k][0]), Y(pts[k][1]); seg = math.hypot(x1 - x0, y1 - y0)
            if seg > 50: continue
            acc += seg
            if acc >= 45:
                acc = 0; a = math.atan2(y1 - y0, x1 - x0); r = 2.2 + 1.6 * min(sp[k] / .6, 1)
                P3 = [(x1 + math.cos(a) * r, y1 + math.sin(a) * r), (x1 + math.cos(a + 2.5) * r, y1 + math.sin(a + 2.5) * r), (x1 + math.cos(a - 2.5) * r, y1 + math.sin(a - 2.5) * r)]
                arrows.append(f'M{fmt(P3[0][0])} {fmt(P3[0][1])}L{fmt(P3[1][0])} {fmt(P3[1][1])}L{fmt(P3[2][0])} {fmt(P3[2][1])}Z')
    o.append(f'<g class="L1" clip-path="url(#c)" fill="none" stroke="{COL}" stroke-linecap="round" stroke-linejoin="round">' + ''.join(paths) + '</g>')
    o.append(f'<g class="L1"><path clip-path="url(#c)" d="{"".join(arrows)}" fill="{COL}" fill-opacity=".85"/></g>')
    bx = Boxes(); lab = []
    for L in C['labels']:
        if not L['named']: continue
        x, y = X(L['lon']), Y(L['lat'])
        for dy in (-9, 15, -20, 26, -31, 37):
            if bx.place(x, y + dy, L['name'], 11):
                lab.append(f'<path d="M{fmt(x)} {fmt(y)}L{fmt(x)} {fmt(y + dy + (3 if dy < 0 else -10))}" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>')
                lab.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="1.8" fill="#fff"/>')
                lab.append(text(x, y + dy, L['name'], 11, '#ffffff', 'middle', ' font-weight="600"')); break
        else: print('名前を置けなかった：', L['name'])
    o.append('<g class="L2">' + ''.join(lab) + '</g>')
    out_sizes['e2-3-currents.svg'] = svg_close(o)
    return out_sizes


def profile_svg(prof):
    """§05 の図：緯度ごとの年降水量（陸の平均と中央値）と、250mm未満の陸の割合。色は記事の CSS 変数"""
    Wp, Hp, L, R, T0, B0 = 640, 330, 48, 22, 14, 58
    x = lambda la: L + (la + 60) / 150 * (Wp - L - R)                     # 横軸は南緯60度〜北緯90度
    y = lambda mm: T0 + (1 - mm / 2400) * (Hp - T0 - B0 - 60)
    yb = lambda pct: Hp - B0 + 2 + (1 - pct / 100) * 38                   # 下の棒は緯度の目盛の上で止める
    out = [f'<svg viewBox="0 0 {Wp} {Hp}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="緯度ごとの年降水量。陸の平均と中央値、250mm未満の陸の割合（CRU TS 4.09、1991〜2020年から本教材が作成）">']
    out.append(f'<rect x="{fmt(x(20))}" y="{T0}" width="{fmt(x(30) - x(20))}" height="{fmt(yb(0) - T0)}" fill="var(--amber-tint)" stroke="var(--amber-line)"/>')
    out.append(f'<text x="{fmt((x(20) + x(30)) / 2)}" y="{T0 + 12}" font-size="10" fill="var(--amber)" text-anchor="middle">北緯20〜30度</text>')
    for mm in (0, 500, 1000, 1500, 2000):
        out.append(f'<path d="M{L} {fmt(y(mm))}H{Wp - R}" stroke="var(--line)" stroke-width=".8"/>')
        out.append(f'<text x="{L - 6}" y="{fmt(y(mm) + 3.5)}" font-size="9.5" fill="var(--ink-faint)" text-anchor="end">{mm}</text>')
    out.append(f'<text x="{L - 6}" y="{T0 + 4}" font-size="9.5" fill="var(--ink-faint)" text-anchor="end">mm/年</text>')
    for la in range(-60, 91, 30):
        t = '0°' if la == 0 else (f'{la}°N' if la > 0 else f'{-la}°S')
        out.append(f'<path d="M{fmt(x(la))} {T0}V{fmt(yb(0))}" stroke="var(--line)" stroke-width=".6"/>')
        out.append(f'<text x="{fmt(x(la))}" y="{Hp - 3}" font-size="9.5" fill="var(--ink-faint)" text-anchor="middle">{t}</text>')
    pts_m = ' '.join(f'{fmt(x(p["lat"]))},{fmt(y(p["mean"]))}' for p in prof)
    pts_d = ' '.join(f'{fmt(x(p["lat"]))},{fmt(y(p["median"]))}' for p in prof)
    out.append(f'<polyline points="{pts_m}" fill="none" stroke="var(--ink-soft)" stroke-width="1.6" stroke-dasharray="5 4"/>')
    out.append(f'<polyline points="{pts_d}" fill="none" stroke="var(--accent)" stroke-width="2.2"/>')
    for p in prof:
        out.append(f'<rect x="{fmt(x(p["lat"]) - 1.1)}" y="{fmt(yb(p["dry"]))}" width="2.2" height="{fmt(yb(0) - yb(p["dry"]))}" fill="var(--amber)" fill-opacity=".75"/>')
    out.append(f'<path d="M{L} {fmt(yb(0))}H{Wp - R}" stroke="var(--line-strong)"/>')
    out.append(f'<text x="{L - 6}" y="{fmt(yb(50) + 3)}" font-size="9.5" fill="var(--ink-faint)" text-anchor="end">50%</text>')
    out.append(f'<text x="{fmt(x(-58))}" y="{fmt(yb(100) + 9)}" font-size="10" fill="var(--amber)">250mm未満の陸の割合</text>')
    out.append(f'<text x="{fmt(x(40))}" y="{fmt(y(2150))}" font-size="10.5" fill="var(--accent)">— 中央値</text>')
    out.append(f'<text x="{fmt(x(40))}" y="{fmt(y(1950))}" font-size="10.5" fill="var(--ink-soft)">- - 平均</text>')
    out.append('</svg>')
    return '\n'.join(out)


def main():
    global LANDGEOM, LAND_S
    LANDGEOM = unary_union([shape(f['geometry']) for f in json.load(open(os.path.join(E_, 'ne_50m_land.geojson')))['features']])
    LAND_S = LANDGEOM.simplify(0.15)
    Tm, Pm = cru('tmp'), cru('pre')
    T, P = Tm.mean(0), Pm.sum(0)
    land = np.isfinite(T) & np.isfinite(P) & (LAT[:, None] > -60)
    global ELEV
    elev = ELEV = elevation()
    K = koppen(Tm, Pm, land)
    NUM['land_cells'] = int(land.sum()); NUM['land_km2'] = int(AREA[land].sum())
    NUM['koppen_share'] = {g: round(float(AREA[land & (K == g)].sum() / AREA[land].sum() * 100), 1) for g in 'ABCDE'}
    # 帯
    NUM['segment'] = {'N': segment(T, P, land, 5, 'N'), 'S': segment(T, P, land, 3, 'S')}
    assert NUM['segment']['N'][1] == CUTS_N and NUM['segment']['S'][1] == CUTS_S, NUM['segment']
    prof = []
    for i in range(NY):
        if land[i].any() and -60 < LAT[i] < 84:
            p = P[i][land[i]]; prof.append({'lat': float(LAT[i]), 'mean': float(p.mean()), 'median': float(np.median(p)), 'dry': float((p < 250).mean() * 100)})
    sm = []
    for k in range(0, len(prof)):
        win = [q for q in prof if abs(q['lat'] - prof[k]['lat']) <= 1.25]
        sm.append({'lat': prof[k]['lat'], **{f: sum(q[f] for q in win) / len(win) for f in ('mean', 'median', 'dry')}})
    NUM['profile5'] = []
    for b in range(85, -60, -5):
        r = (LAT < b) & (LAT >= b - 5); m = land[r]
        if m.any():
            p = P[r][m]; t = T[r][m]
            NUM['profile5'].append([f'{b-5}〜{b}', round(float(p.mean())), round(float(np.median(p))), round(float((p < 250).mean() * 100)), round(float(np.median(t)), 1)])
    band, names = band_index()
    ok = land & (band >= 0)
    NUM['bands'] = []; pred = np.full((NY, NX), '', '<U1'); band_pred = []
    for b, (h, nm, lo, hi) in enumerate(names):
        m = ok & (band == b); sh = {g: float(AREA[m & (K == g)].sum() / AREA[m].sum()) for g in 'ABCDE'}; g = max(sh, key=sh.get)
        pred[band == b] = g; band_pred.append(g)
        NUM['bands'].append({'h': h, 'name': nm, 'lo': lo, 'hi': hi, 'pred': g, 'shares': {k: round(v * 100, 1) for k, v in sh.items() if v >= .005},
                             'P_med': round(float(np.median(P[m]))), 'T_med': round(float(np.median(T[m])), 1), 'km2': int(AREA[m].sum())})
    NUM['agree'] = round(float(AREA[ok & (pred == K)].sum() / AREA[ok].sum() * 100), 1)
    nb = ok & (K != 'B'); NUM['agree_noB'] = round(float(AREA[nb & (pred == K)].sum() / AREA[nb].sum() * 100), 1)
    hit = tot = 0
    for i in range(NY):
        if land[i].any(): hit += max(AREA[i][land[i] & (K[i] == g)].sum() for g in 'ABCDE'); tot += AREA[i][land[i]].sum()
    NUM['ceiling'] = round(float(hit / tot * 100), 1)
    mism = ok & (pred != K)
    # 外れ値
    C = {'T': T, 'P': P, 'land': land, 'elev': elev, 'K': K, 'band_pred': band_pred}
    for ref, f in (('median', np.median), ('mean', np.mean)):
        r = P / rowf(P, land, f)[:, None]; C[f'P_{ref}'] = report(land & (r <= R_DRY), r)
    low = land & (elev < LOW)
    for lab, m in (('low', low), ('all', land)):
        d = T - rowf(T, m, np.median)[:, None]
        C[f'T_{lab}_warm'] = report(m & (d >= D_TEMP), d); C[f'T_{lab}_cold'] = report(m & (d <= -D_TEMP), d)
    dmean = T - rowf(T, land, np.mean)[:, None]
    NUM['T_all_mean_warm'] = [{k: v for k, v in r.items() if k != 'cells'} for r in report(land & (dmean >= D_TEMP), dmean)]
    NUM['low_share'] = round(float(AREA[low].sum() / AREA[land].sum() * 100), 1)
    for k in ('P_median', 'P_mean', 'T_low_warm', 'T_low_cold', 'T_all_warm', 'T_all_cold'):
        NUM[k] = [{kk: vv for kk, vv in r.items() if kk != 'cells'} for r in C[k]]
    r2030 = (LAT[:, None] >= 20) & (LAT[:, None] < 30) & land
    asia = r2030 & (LON[None, :] >= 70) & (LON[None, :] <= 125)
    NUM['monsoon_2030'] = {'asia_land_pct': round(float(AREA[asia].sum() / AREA[r2030].sum() * 100), 1),
                           'asia_water_pct': round(float((AREA * P)[asia].sum() / (AREA * P)[r2030].sum() * 100), 1),
                           'mean_all': round(float(P[r2030].mean())), 'mean_without_asia': round(float(P[r2030 & ~asia].mean())),
                           'median_all': round(float(np.median(P[r2030]))), 'median_without_asia': round(float(np.median(P[r2030 & ~asia])))}
    outl = np.zeros((NY, NX), bool)
    for k in ('P_median', 'T_low_warm', 'T_low_cold'):
        for r in C[k]:
            for i, j in r['cells']: outl[i, j] = True
    NUM['overlap'] = {'outlier_share_of_land': round(float(AREA[ok & outl].sum() / AREA[ok].sum() * 100), 1),
                      'mismatch_rate_in_outliers': round(float(AREA[ok & outl & mism].sum() / AREA[ok & outl].sum() * 100), 1),
                      'mismatch_rate_elsewhere': round(float(AREA[ok & ~outl & mism].sum() / AREA[ok & ~outl].sum() * 100), 1),
                      'mismatch_share_in_outliers': round(float(AREA[ok & outl & mism].sum() / AREA[ok & mism].sum() * 100), 1)}
    # 食い違いはどこに集まるか：帯の境目から3度以内と、過半の分類が無い2つの帯（中緯度の帯・極の帯）
    cuts_all = np.array(CUTS_N + [-c for c in CUTS_S])
    near = (np.min(np.abs(LAT[:, None] - cuts_all[None, :]), 1) <= 3)[:, None] * np.ones((1, NX), bool)
    mixed = np.zeros((NY, NX), bool)
    for b, (h, nm, lo, hi) in enumerate(names):
        if nm in ('中緯度の帯', '極の帯'): mixed |= band == b
    pairs = {}
    for b, (h, nm, lo, hi) in enumerate(names):
        for g in 'ABCDE':
            a = AREA[mism & (band == b) & (K == g)].sum()
            if a > 0: pairs[f'{nm}（{"北" if h == "N" else "南"}）{band_pred[b]}→{g}'] = round(float(a / AREA[mism].sum() * 100), 1)
    NUM['mismatch'] = {'pct_of_land': round(float(AREA[mism].sum() / AREA[ok].sum() * 100), 1),
                       'near3_land': round(float(AREA[ok & near].sum() / AREA[ok].sum() * 100), 1),
                       'near3_rate': round(float(AREA[mism & near].sum() / AREA[ok & near].sum() * 100), 1),
                       'far_rate': round(float(AREA[mism & ~near].sum() / AREA[ok & ~near].sum() * 100), 1),
                       'near3_share': round(float(AREA[mism & near].sum() / AREA[mism].sum() * 100), 1),
                       'mixed_land': round(float(AREA[ok & mixed].sum() / AREA[ok].sum() * 100), 1),
                       'mixed_share': round(float(AREA[mism & mixed].sum() / AREA[mism].sum() * 100), 1),
                       'either_share': round(float(AREA[mism & (mixed | near)].sum() / AREA[mism].sum() * 100), 1),
                       'either_land': round(float(AREA[ok & (mixed | near)].sum() / AREA[ok].sum() * 100), 1),
                       'pairs': dict(sorted(pairs.items(), key=lambda x: -x[1])[:10])}
    st = {}
    for v in ('tmp', 'pre'):
        parts = [np.ma.filled(netCDF4.Dataset(os.path.join(E_, 'cru', f'cru_ts4.09.{d}.{v}.dat.nc')).variables['stn'][:].astype('f8'), np.nan) for d in ('1991.2000', '2001.2010', '2011.2020')]
        sn = np.nanmean(np.concatenate(parts), 0)[::-1]
        st[v] = round(float(AREA[land & (sn < 0.5)].sum() / AREA[land].sum() * 100), 1)
    NUM['stations_lt_half'] = st
    # 回帰線の上の国（演習2）
    Cn = json.load(open(os.path.join(E_, '..', 'ne', 'ne_10m_admin_0_countries.geojson')))['features'] if os.path.exists(os.path.join(E_, '..', 'ne', 'ne_10m_admin_0_countries.geojson')) else []
    if Cn:
        Ct = STRtree([shape(f['geometry']) for f in Cn]); NUM['tropics'] = {}
        for la in (TROPIC, -TROPIC):
            i = int(np.argmin(abs(LAT - la))); rowres = {}
            for j in range(NX):
                if not land[i, j]: continue
                for q in Ct.query(Point(LON[j], la), predicate='intersects'):
                    nm = Cn[q]['properties'].get('NAME_JA'); rowres.setdefault(nm, []).append((P[i, j], K[i, j], LON[j]))
            NUM['tropics']['N' if la > 0 else 'S'] = sorted([(nm, round(float(np.median([a for a, b, c in v]))), max(set(b for a, b, c in v), key=[b for a, b, c in v].count), round(float(np.mean([c for a, b, c in v])), 1)) for nm, v in rowres.items()], key=lambda r: r[3])
    # 食い違う場所（0.5度）
    C['mismatch_geom'] = cells_geom(list(zip(*np.where(mism)))).intersection(LAND_S)
    # 海流
    lines, labels, gapA, gaps = currents()
    C['lines'] = lines; C['labels'] = labels; C['gapA'] = gapA
    NUM['currents'] = {'lines': len(lines), 'labels': labels, 'gaps': gaps}
    sizes = draw_all(C)
    for fn, s in sizes.items():
        open(os.path.join(SVG_DIR, fn), 'w').write(s)
    open(os.path.join(DATA, 'e2-3-profile.svg'), 'w').write(profile_svg(sm))
    json.dump(NUM, open(os.path.join(DATA, 'e2-3-numbers.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({fn: round(len(s.encode()) / 1024, 1) for fn, s in sizes.items()}, ensure_ascii=False))


if __name__ == '__main__':
    main()

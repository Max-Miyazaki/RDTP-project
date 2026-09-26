# 標準緯線を決める：国の**本土**（面積がいちばん大きい陸のかたまり）の、面積で重みをつけた球面上の重心。
# 本土の中を細かい格子で埋め、各升目の面積（cos φ に比例）で単位ベクトルを重みづけして平均し、緯度経度に戻す。
# 本土だけにするのは、海外領土や遠い離島を含めると中心が本土から離れるため（フランスは領土の全体だと
# 西経6.6度・北緯43.0度の大西洋の上、本土だけなら東経2.5度・北緯46.6度。DESIGN.md §100.10）。
# 本土＝面積がいちばん大きい部分。面積を比べるだけなので、国ごとの判断が入らない。
#   使い方：python centroid.py JPN TCD
import json, math, os, sys
import numpy as np
from shapely.geometry import shape
from shapely import contains_xy
from pyproj import Geod
from countries import NE
from prep_util import polys_of

G = Geod(ellps='WGS84')


def mainland(g):
    """面積（楕円体の上）がいちばん大きい部分"""
    return max(polys_of(g), key=lambda p: abs(G.geometry_area_perimeter(p)[0]))


def centroid(g, step=0.02):
    x0, y0, x1, y1 = g.bounds
    xs = np.arange(x0 + step / 2, x1, step)
    ys = np.arange(y0 + step / 2, y1, step)
    X, Y = np.meshgrid(xs, ys)
    m = contains_xy(g, X, Y)
    lon, lat = np.radians(X[m]), np.radians(Y[m])
    w = np.cos(lat)
    v = np.array([(w * np.cos(lat) * np.cos(lon)).sum(), (w * np.cos(lat) * np.sin(lon)).sum(), (w * np.sin(lat)).sum()])
    return math.degrees(math.atan2(v[2], math.hypot(v[0], v[1]))), math.degrees(math.atan2(v[1], v[0]))


if __name__ == '__main__':
    ne0 = json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))
    for a3 in sys.argv[1:]:
        g = shape(next(f for f in ne0['features'] if f['properties']['ADM0_A3'] == a3)['geometry'])
        m = mainland(g)
        print(a3, '本土', [round(v, 2) for v in centroid(m)], '（参考：領土の全体', [round(v, 2) for v in centroid(g)], '）',
              '本土の範囲', [round(v, 2) for v in m.bounds])

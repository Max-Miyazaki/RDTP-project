# 面積で重みをつけた球面上の重心：国の中を細かい格子で埋め、各升目の面積（cos φ に比例）で
# 単位ベクトルを重みづけして平均し、緯度経度に戻す。
import json, math, os, sys
import numpy as np
from shapely.geometry import shape
from shapely import contains_xy
from countries import NE


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
        print(a3, [round(v, 2) for v in centroid(g)], [round(v, 2) for v in g.bounds])

# 層1を OSM の「海岸線で閉じた島」から作る（島だけの単位で、行政の境界が海まで含むもの。いまはオーランド諸島だけ。DESIGN.md §112.1）
#   python outline_coast.py ALD     （extract.sh が呼ぶ。data/<国>/osm/coast.geojson・adm.geojson を読み、data/<国>/outline.geojson に書く）
# 行政の境界（countries.py の outline_osm のリレーション）の中にある、海岸線（natural=coastline）で閉じた島を集める。
# 描く最大の倍率で1px 四方に満たない島は見えないので描かない（outline_coast の min_km2。オーランドは10倍で1km＝約4px なので 0.0625km²）
import json, os, sys
from shapely.geometry import shape, mapping
from shapely.ops import unary_union, linemerge, polygonize
from pyproj import Geod
from countries import COUNTRIES

G = Geod(ellps='WGS84')
area = lambda g: abs(G.geometry_area_perimeter(g)[0]) / 1e6
CC = sys.argv[1]
c = COUNTRIES[CC]
osm = os.path.join(c['dir'], 'osm')
adm = [f for f in json.load(open(os.path.join(osm, 'adm.geojson')))['features'] if str(f['properties'].get('@id')) == str(c['outline_osm'])]
adm = unary_union([shape(f['geometry']) for f in adm])
lines = [shape(f['geometry']) for f in json.load(open(os.path.join(osm, 'coast.geojson')))['features']]
isl = [p for p in polygonize(linemerge(unary_union(lines))) if adm.contains(p.representative_point())]
tot = sum(area(p) for p in isl)
keep = [p for p in isl if area(p) >= c['outline_coast']['min_km2']]
land = unary_union(keep).simplify(c['outline_coast'].get('tol', 0))
json.dump({'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'geometry': mapping(land),
           'properties': {'@id': str(c['outline_osm']), 'islands_all': len(isl), 'km2_all': round(tot, 1),
                          'islands': len(keep), 'km2': round(sum(area(p) for p in keep), 1)}}]},
          open(os.path.join(c['dir'], 'outline.geojson'), 'w'))
print(CC, 'islands', len(isl), round(tot, 1), 'km2 -> kept', len(keep), round(sum(area(p) for p in keep), 1), 'km2')

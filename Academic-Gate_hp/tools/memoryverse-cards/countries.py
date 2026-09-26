# 国ごとの設定。基準（絞り込み・縮尺・色）は共通で、ここに書くのは国の違いだけ。
import os

TOOL = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(TOOL, '..', '..'))          # Academic-Gate_hp/
# 取ってきたデータ（.osm.pbf・Natural Earth・途中の GeoJSON）の置き場。リポジトリには入れない（.gitignore）。
DATA = os.environ.get('MVCARDS_DATA', os.path.join(TOOL, 'data'))
NE = os.path.join(DATA, 'ne')
SVG_DIR = os.path.join(SITE, 'image', 'memoryverse', 'cards')    # 生成物：SVG
PAGE_DIR = os.path.join(SITE, 'html', 'country')                 # 生成物：国のページ

COUNTRIES = {
    'JPN': {
        'dir': os.path.join(DATA, 'JPN'),
        'name': '日本',
        'description': '日本の国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（都道府県・地方・都市）の3層を重ねた地図。メモリーバース 3章。',
        'geofabrik': 'asia/japan-latest.osm.pbf',
        'phi0': 36.63,          # 本土（本州）の重心。領土の全体では 37.43（§100.10）
        'panels': {
            'main':   {'lon': (128.2, 146.6), 'lat': (29.9, 46.2), 'title': '本土'},
            'ryukyu': {'lon': (122.4, 130.4), 'lat': (23.6, 30.4), 'title': '南西諸島（本土と同じ縮尺）'},
        },
        # Natural Earth の region を日本語に。沖縄は Natural Earth どおり独立した地方（9地方）
        'regions': {'Hokkaido': '北海道', 'Tohoku': '東北', 'Kanto': '関東', 'Chubu': '中部', 'Kinki': '近畿',
                    'Chugoku': '中国', 'Shikoku': '四国', 'Kyushu': '九州', 'Okinawa': '沖縄'},
        # データの欠けを埋める（区分は変えない）：佐賀県・長崎県は region が空
        'region_fill': {'佐賀県': 'Kyushu', '長崎県': 'Kyushu'},
        'admin1_word': '都道府県',
        'city_strip': r'[都市]$',
        'notes': [
            '図の外にある島：<b>南鳥島</b>（北緯24.3度・東経154.0度）、<b>沖ノ鳥島</b>（北緯20.4度・東経136.1度）。どちらも2枚の図の範囲より外にある。',
            'この地図の国境は、2-1 で決めたとおり実効支配で描いています。北方領土（実効支配はロシア、日本が主張）と竹島（実効支配は韓国、日本が主張）は日本の範囲に含めていないので、そこでは層2の川や道路も描かれません。日本の地図帳とは描き方が異なります。尖閣諸島（日本が実効支配）は日本の側ですが、この縮尺では1〜2pxの点です。',
        ],
        'src13': '国境・海岸線・47都道府県・9地方（佐賀県・長崎県は地方の値が無いため九州として補った）・都市（人口 POP_MAX の多い順に20）',
        'fig': '本土は東経128.2〜146.6度・北緯29.9〜46.2度、南西諸島は東経122.4〜130.4度・北緯23.6〜30.4度',
    },
    'TCD': {
        'dir': os.path.join(DATA, 'TCD'),
        'name': 'チャド',
        'description': 'チャドの国のページ。位置と形・骨組み（川・湖・道路）・区画（州・都市）の3層を重ねた地図。メモリーバース 3章。',
        'geofabrik': 'africa/chad-latest.osm.pbf',
        'phi0': 15.28,          # 1つのかたまりなので領土の全体と同じ
        'panels': {
            'main': {'lon': (12.9, 24.5), 'lat': (6.9, 24.0), 'title': 'チャド全土'},
        },
        'regions': {},
        'region_fill': {},
        'admin1_word': '州',
        'city_strip': None,
        'notes': [],
        'src13': '国境・22州・都市（人口 POP_MAX の多い順に20。Natural Earth にチャドの都市は19しか無い）。州をまとめる地方の区分は Natural Earth に無い',
        'fig': '東経12.9〜24.5度・北緯6.9〜24.0度',
    },
}

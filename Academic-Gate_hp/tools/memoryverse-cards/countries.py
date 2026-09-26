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

# ---- 3-1 西ヨーロッパの9か国（本土の重心の経度で東経0度から東回り）----
# 倍率（zoom）：1度44pxのままでは図にならない国だけ上げる（§100.11）。
#   1) 上げるのは、1度44pxで図の長いほうの辺が 100px 未満になる国だけ（ルクセンブルク32・リヒテンシュタイン9・モナコ2px）。
#      ベルギー（126px）・オランダ（145px）・スイス（157px）は小さいが形は読めるので、地域のカードと同じ縮尺のまま
#   2) 倍率は、長いほうの辺が 300〜700px に収まる、10・20・50・100・200倍のうちいちばん小さいもの
#   上げた国は、図とカードの注記に「この図だけ○倍」と書く。
W31 = dict(up_href='memoryverse_3-1.html', up_label='3-1 西ヨーロッパ')
FR_REG = {'Hauts-de-France': 'オー＝ド＝フランス', 'Grand Est': 'グラン・テスト', "Provence-Alpes-Côte-d'Azur": 'プロヴァンス＝アルプ＝コート・ダジュール',
          'Auvergne-Rhône-Alpes': 'オーヴェルニュ＝ローヌ＝アルプ', 'Nouvelle-Aquitaine': 'ヌーヴェル＝アキテーヌ', 'Occitanie': 'オクシタニー',
          'Bourgogne-Franche-Comté': 'ブルゴーニュ＝フランシュ＝コンテ', 'Pays de la Loire': 'ペイ・ド・ラ・ロワール', 'Bretagne': 'ブルターニュ',
          'Normandie': 'ノルマンディー', 'Île-de-France': 'イル＝ド＝フランス', 'Centre-Val de Loire': 'サントル＝ヴァル・ド・ロワール', 'Corse': 'コルス',
          'Guyane française': '仏領ギアナ', 'Martinique': 'マルティニーク', 'Guadeloupe': 'グアドループ', 'Réunion': 'レユニオン', 'Mayotte': 'マヨット'}
COUNTRIES.update({
    'FRA': dict(W31, dir=os.path.join(DATA, 'FRA'), name='フランス', geofabrik='europe/france-latest.osm.pbf', phi0=46.57,
        description='フランスの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（県・地域圏・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (-5.5, 9.9), 'lat': (41.0, 51.4), 'title': '本土とコルシカ島'}},
        regions=FR_REG, region_fill={}, region_word='地域圏', region_suffix='', region_fs=11, region_ls=1,
        admin1_word='県', city_strip=None,
        notes=['図の外にある海外県（Natural Earth でフランスの形に含まれる5つ）：<b>仏領ギアナ</b>（北緯3.9度・西経53.0度）、<b>グアドループ</b>（北緯16.2度・西経61.6度）、<b>マルティニーク</b>（北緯14.6度・西経61.0度）、<b>レユニオン</b>（南緯21.1度・東経55.5度）、<b>マヨット</b>（南緯12.8度・東経45.1度）。埋める加工はしない。ニューカレドニアや仏領ポリネシアなどは Natural Earth では別の単位で、この図には入れていない。'],
        src13='国境・海岸線・96県（本土）と5つの海外県・地域圏・都市（人口 POP_MAX の多い順に20）',
        fig='東経−5.5〜9.9度・北緯41.0〜51.4度（本土とコルシカ島）'),
    'BEL': dict(W31, dir=os.path.join(DATA, 'BEL'), name='ベルギー', geofabrik='europe/belgium-latest.osm.pbf', phi0=50.64,
        description='ベルギーの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・地域・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (2.2, 6.7), 'lat': (49.2, 51.8), 'title': 'ベルギー全土'}},
        regions={'Flemish': 'フランデレン', 'Walloon': 'ワロン', 'Capital Region': 'ブリュッセル首都圏'}, region_fill={},
        region_word='地域', region_suffix='地域', region_fs=13, region_ls=2, admin1_word='州', city_strip=None, notes=[],
        src13='国境・10州とブリュッセル首都圏地域・3つの地域（フランデレン・ワロン・ブリュッセル首都圏）・都市（人口 POP_MAX の多い順に20。Natural Earth にベルギーの都市は10しか無い）',
        fig='東経2.2〜6.7度・北緯49.2〜51.8度'),
    'NLD': dict(W31, dir=os.path.join(DATA, 'NLD'), name='オランダ', geofabrik='europe/netherlands-latest.osm.pbf', phi0=52.28,
        description='オランダの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (3.0, 7.5), 'lat': (50.5, 53.8), 'title': '本土（ヨーロッパの部分）'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None,
        notes=['図の外にあるカリブ海の特別自治体（Natural Earth でオランダの形に含まれる3つ）：<b>ボネール</b>（北緯12.2度・西経68.2度）、<b>シント・ユースタティウス</b>（北緯17.5度・西経63.0度）、<b>サバ</b>（北緯17.6度・西経63.2度）。埋める加工はしない。アルバ・キュラソー・シント・マールテンはオランダ王国の中の別の構成国で、Natural Earth でも別の単位。',
               '首都はアムステルダム（憲法第32条）、政府と議会はハーグにある（3-1 §05）。'],
        src13='国境・12州とカリブ海の3つの特別自治体・都市（人口 POP_MAX の多い順に20。Natural Earth にオランダの都市は14しか無い）',
        fig='東経3.0〜7.5度・北緯50.5〜53.8度（ヨーロッパの部分）'),
    'LUX': dict(W31, dir=os.path.join(DATA, 'LUX'), name='ルクセンブルク', geofabrik='europe/luxembourg-latest.osm.pbf', phi0=49.77,
        zoom=10, fine=0.2, zoom_why='幅約22px',
        description='ルクセンブルクの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画・都市の3層を重ねた地図（この国の図だけ10倍）。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (5.6, 6.62), 'lat': (49.36, 50.26), 'title': 'ルクセンブルク全土'}},
        regions={}, region_fill={}, admin1_word='区', city_strip=None,
        notes=['層3の3つの「区」（ルクセンブルク・ディーキルヒ・グレーヴェンマハ）は、<b>2015年10月3日に廃止された区分</b>です。Natural Earth v5.1.2 がこの区分のままなので、直さずに描いています。いまは国と100の基礎自治体（コミューン）のあいだに行政の段がありません。'],
        src13='国境・3つの区（2015年に廃止された区分。Natural Earth のまま）・都市（人口 POP_MAX の多い順に20。Natural Earth にルクセンブルクの都市は3しか無い）',
        fig='東経5.6〜6.62度・北緯49.36〜50.26度'),
    'MCO': dict(W31, dir=os.path.join(DATA, 'MCO'), name='モナコ', geofabrik='europe/monaco-latest.osm.pbf', phi0=43.74,
        zoom=200, fine=0.01, zoom_why='約1px の点',
        description='モナコの国のページ。位置と形・骨組み・区画の3層を重ねた地図（この国の図だけ200倍）。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (7.355, 7.449), 'lat': (43.71, 43.772), 'title': 'モナコ全土'}},
        regions={}, region_fill={}, admin1_word='区', city_strip=None,
        notes=['国境と海岸線は Natural Earth（1:1000万）の形で、モナコは12の点で描かれています。200倍に広げると角ばって見えるのはそのためです（層2の OSM の線はもっと細かい）。'],
        src13='国境・都市（Natural Earth にモナコの1級区分・都市は1つずつ）',
        fig='東経7.355〜7.449度・北緯43.71〜43.772度'),
    'CHE': dict(W31, dir=os.path.join(DATA, 'CHE'), name='スイス', geofabrik='europe/switzerland-latest.osm.pbf', phi0=46.80,
        description='スイスの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (5.6, 10.8), 'lat': (45.5, 48.1), 'title': 'スイス全土'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None,
        notes=['スイスの憲法には首都の定めが無く、ベルンは「連邦都市」（政府と議会の所在地）です（3-1 §05）。'],
        src13='国境・26州（カントン）・都市（人口 POP_MAX の多い順に20）',
        fig='東経5.6〜10.8度・北緯45.5〜48.1度'),
    'LIE': dict(W31, dir=os.path.join(DATA, 'LIE'), name='リヒテンシュタイン', geofabrik='europe/liechtenstein-latest.osm.pbf', phi0=47.14,
        zoom=50, fine=0.05, zoom_why='幅約4px',
        description='リヒテンシュタインの国のページ。位置と形・骨組み・区画（基礎自治体）の3層を重ねた地図（この国の図だけ50倍）。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (9.44, 9.66), 'lat': (47.02, 47.29), 'title': 'リヒテンシュタイン全土'}},
        regions={}, region_fill={}, admin1_word='自治体', city_strip=None, notes=[],
        src13='国境・11の基礎自治体（ゲマインデ）・都市（Natural Earth にリヒテンシュタインの都市は1つ）',
        fig='東経9.44〜9.66度・北緯47.02〜47.29度'),
    'DEU': dict(W31, dir=os.path.join(DATA, 'DEU'), name='ドイツ', geofabrik='europe/germany-latest.osm.pbf', phi0=51.03,
        description='ドイツの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (5.5, 15.4), 'lat': (47.0, 55.3), 'title': 'ドイツ全土'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None, notes=[],
        src13='国境・16州・都市（人口 POP_MAX の多い順に20）',
        fig='東経5.5〜15.4度・北緯47.0〜55.3度'),
    'AUT': dict(W31, dir=os.path.join(DATA, 'AUT'), name='オーストリア', geofabrik='europe/austria-latest.osm.pbf', phi0=47.59,
        description='オーストリアの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (9.2, 17.5), 'lat': (46.1, 49.3), 'title': 'オーストリア全土'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None, notes=[],
        src13='国境・9州・都市（人口 POP_MAX の多い順に20。Natural Earth にオーストリアの都市は9しか無い）',
        fig='東経9.2〜17.5度・北緯46.1〜49.3度'),
})

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
        'terms': '<b>区分の呼び名</b>：この国の区分は<b>都道府県</b>（47）。地図の名前がそのまま現地の呼び名で、ほかの国のページと違い、日本語が原語。', 'terms_reading': False,
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
        'terms': '<b>区分の呼び名</b>：Natural Earth では、22の区分が <b>Préfecture</b>（プレフェクテュール）とあり、アラビア語の名前は <b dir="rtl">إقليم</b>（イクリーム）で始まる。いまの公式の呼び名かは確かめていない。', 'terms_reading': True,
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
    'FRA': dict(W31, dir=os.path.join(DATA, 'FRA'),
        terms='<b>区分の呼び名</b>：この国の区分は <b>département</b>（デパルトマン）と呼ばれ、本土に96、海外に5ある。本土の96は13のまとまりに分かれる（Natural Earth に region として入っている。層3の「地域圏」）。', terms_reading=True, name='フランス', geofabrik='europe/france-latest.osm.pbf', phi0=46.57,
        description='フランスの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（県・地域圏・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (-5.5, 9.9), 'lat': (41.0, 51.4), 'title': '本土とコルシカ島'}},
        regions=FR_REG, region_fill={}, region_word='地域圏', region_suffix='', region_fs=11, region_ls=1,
        admin1_word='県', city_strip=None,
        notes=['図の外にある海外県（Natural Earth でフランスの形に含まれる5つ）：<b>仏領ギアナ</b>（北緯3.9度・西経53.0度）、<b>グアドループ</b>（北緯16.2度・西経61.6度）、<b>マルティニーク</b>（北緯14.6度・西経61.0度）、<b>レユニオン</b>（南緯21.1度・東経55.5度）、<b>マヨット</b>（南緯12.8度・東経45.1度）。埋める加工はしない。ニューカレドニアや仏領ポリネシアなどは Natural Earth では別の単位で、この図には入れていない。'],
        src13='国境・海岸線・96県（本土）と5つの海外県・地域圏・都市（人口 POP_MAX の多い順に20）',
        fig='東経−5.5〜9.9度・北緯41.0〜51.4度（本土とコルシカ島）'),
    'BEL': dict(W31, dir=os.path.join(DATA, 'BEL'),
        terms='<b>区分の呼び名</b>：10の <b>provincie</b>（オランダ語、プロヴィンシー）／<b>province</b>（フランス語、プロヴァンス）と、首都の <b>Hoofdstedelijk Gewest</b>（オランダ語）／<b>Région Capitale</b>（フランス語）。<b>どの言葉で呼ぶかは地域で違う</b>——フランデレンの5州はオランダ語、ワロンの5州はフランス語、ブリュッセルは両方。', terms_reading=True, name='ベルギー', geofabrik='europe/belgium-latest.osm.pbf', phi0=50.64,
        description='ベルギーの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・地域・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (2.2, 6.7), 'lat': (49.2, 51.8), 'title': 'ベルギー全土'}},
        regions={'Flemish': 'フランデレン', 'Walloon': 'ワロン', 'Capital Region': 'ブリュッセル首都圏'}, region_fill={},
        region_word='地域', region_suffix='地域', region_fs=13, region_ls=2, admin1_word='州', city_strip=None, notes=[],
        src13='国境・10州とブリュッセル首都圏地域・3つの地域（フランデレン・ワロン・ブリュッセル首都圏）・都市（人口 POP_MAX の多い順に20。Natural Earth にベルギーの都市は10しか無い）',
        fig='東経2.2〜6.7度・北緯49.2〜51.8度'),
    'NLD': dict(W31, dir=os.path.join(DATA, 'NLD'),
        terms='<b>区分の呼び名</b>：12の <b>Provincie</b>（プロヴィンシー）と、カリブ海の3つの <b>Bijzondere Gemeenten</b>（ビゾンデレ・ヘメーンテン、特別自治体）。', terms_reading=True, name='オランダ', geofabrik='europe/netherlands-latest.osm.pbf', phi0=52.28,
        description='オランダの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (3.0, 7.5), 'lat': (50.5, 53.8), 'title': '本土（ヨーロッパの部分）'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None,
        notes=['図の外にあるカリブ海の特別自治体（Natural Earth でオランダの形に含まれる3つ）：<b>ボネール</b>（北緯12.2度・西経68.2度）、<b>シント・ユースタティウス</b>（北緯17.5度・西経63.0度）、<b>サバ</b>（北緯17.6度・西経63.2度）。埋める加工はしない。アルバ・キュラソー・シント・マールテンはオランダ王国の中の別の構成国で、Natural Earth でも別の単位。',
               '首都はアムステルダム（憲法第32条）、政府と議会はハーグにある（3-1 §05）。'],
        src13='国境・12州とカリブ海の3つの特別自治体・都市（人口 POP_MAX の多い順に20。Natural Earth にオランダの都市は14しか無い）',
        fig='東経3.0〜7.5度・北緯50.5〜53.8度（ヨーロッパの部分）'),
    'LUX': dict(W31, dir=os.path.join(DATA, 'LUX'),
        terms='<b>区分の呼び名</b>：地図の3つの区分は <b>District</b>（ディストリクト）と呼ばれていた（2015年に廃止。上の注記）。ルクセンブルク語の呼び名は Natural Earth に入っていない。', terms_reading=True, name='ルクセンブルク', geofabrik='europe/luxembourg-latest.osm.pbf', phi0=49.77,
        zoom=10, fine=0.2, zoom_why='幅約22px',
        rivers_outside_note=('Our（ウール川）は国境の川で（OpenStreetMap の国境の線に沿って流れる。52.5km のうち48.8km）、国の外にあるわけではない。'
                             '<b>Natural Earth の粗い国境の線の外側に入るため、この図には描いていない。</b>Prüm（プリュム川）はドイツ側を流れる川で'
                             '（国境の線に沿うのは0.2km）、国の外にある。同じ東の国境の川でも、Mosel（モーゼル川）と Sauer（ザウアー川）は国の中に一部が入るので描いている。'),
        description='ルクセンブルクの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画・都市の3層を重ねた地図（この国の図だけ10倍）。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (5.6, 6.62), 'lat': (49.36, 50.26), 'title': 'ルクセンブルク全土'}},
        regions={}, region_fill={}, admin1_word='区', city_strip=None,
        notes=['層3の3つの「区」（ルクセンブルク・ディーキルヒ・グレーヴェンマハ）は、<b>2015年10月3日に廃止された区分</b>です。Natural Earth v5.1.2 がこの区分のままなので、直さずに描いています。いまは国と100の基礎自治体（コミューン）のあいだに行政の段がありません。'],
        src13='国境・3つの区（2015年に廃止された区分。Natural Earth のまま）・都市（人口 POP_MAX の多い順に20。Natural Earth にルクセンブルクの都市は3しか無い）',
        fig='東経5.6〜6.62度・北緯49.36〜50.26度'),
    'MCO': dict(W31, dir=os.path.join(DATA, 'MCO'),
        terms='<b>区分の呼び名</b>：Natural Earth に区分の種類が入っていない。', terms_reading=False, name='モナコ', geofabrik='europe/monaco-latest.osm.pbf', phi0=43.74,
        zoom=200, fine=0.01, zoom_why='約1px の点',
        description='モナコの国のページ。位置と形・骨組み・区画の3層を重ねた地図（この国の図だけ200倍）。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (7.355, 7.449), 'lat': (43.71, 43.772), 'title': 'モナコ全土'}},
        regions={}, region_fill={}, admin1_word='区', city_strip=None,
        notes=['国境と海岸線は Natural Earth（1:1000万）の形で、モナコは12の点で描かれています。200倍に広げると角ばって見えるのはそのためです（層2の OSM の線はもっと細かい）。'],
        src13='国境・都市（Natural Earth にモナコの1級区分・都市は1つずつ）',
        fig='東経7.355〜7.449度・北緯43.71〜43.772度'),
    'CHE': dict(W31, dir=os.path.join(DATA, 'CHE'),
        terms='<b>区分の呼び名</b>：26の区分は、Natural Earth では <b>Canton</b>（フランス語）・<b>Kanton</b>（ドイツ語）・<b>Chantun</b>（ロマンシュ語）とある（読みはカントン、チャントゥン）。<b>どの言葉を使うかは州ごとに違う</b>が、どの州がどの言葉かは Natural Earth に入っていない。イタリア語の呼び名も入っていない。', terms_reading=True, name='スイス', geofabrik='europe/switzerland-latest.osm.pbf', phi0=46.80,
        description='スイスの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (5.6, 10.8), 'lat': (45.5, 48.1), 'title': 'スイス全土'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None,
        notes=['スイスの憲法には首都の定めが無く、ベルンは「連邦都市」（政府と議会の所在地）です（3-1 §05）。'],
        src13='国境・26州（カントン）・都市（人口 POP_MAX の多い順に20）',
        fig='東経5.6〜10.8度・北緯45.5〜48.1度'),
    'LIE': dict(W31, dir=os.path.join(DATA, 'LIE'),
        terms='<b>区分の呼び名</b>：Natural Earth に区分の種類が入っていない。', terms_reading=False, name='リヒテンシュタイン', geofabrik='europe/liechtenstein-latest.osm.pbf', phi0=47.14,
        zoom=50, fine=0.05, zoom_why='幅約4px',
        description='リヒテンシュタインの国のページ。位置と形・骨組み・区画（基礎自治体）の3層を重ねた地図（この国の図だけ50倍）。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (9.44, 9.66), 'lat': (47.02, 47.29), 'title': 'リヒテンシュタイン全土'}},
        regions={}, region_fill={}, admin1_word='自治体', city_strip=None, notes=[],
        src13='国境・11の基礎自治体・都市（Natural Earth にリヒテンシュタインの都市は1つ）',
        fig='東経9.44〜9.66度・北緯47.02〜47.29度'),
    'DEU': dict(W31, dir=os.path.join(DATA, 'DEU'),
        terms='<b>区分の呼び名</b>：16の区分は <b>Land</b>（ラント）。', terms_reading=True, name='ドイツ', geofabrik='europe/germany-latest.osm.pbf', phi0=51.03,
        description='ドイツの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (5.5, 15.4), 'lat': (47.0, 55.3), 'title': 'ドイツ全土'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None, notes=[],
        src13='国境・16州・都市（人口 POP_MAX の多い順に20）',
        fig='東経5.5〜15.4度・北緯47.0〜55.3度'),
    'AUT': dict(W31, dir=os.path.join(DATA, 'AUT'),
        terms='<b>区分の呼び名</b>：9の区分は <b>Bundesland</b>（ブンデスラント）／<b>Land</b>（ラント）。Natural Earth では「Bundesländ|Länd」と綴りが崩れている。', terms_reading=True, name='オーストリア', geofabrik='europe/austria-latest.osm.pbf', phi0=47.59,
        description='オーストリアの国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画（州・都市）の3層を重ねた地図。メモリーバース 3-1 西ヨーロッパ。',
        panels={'main': {'lon': (9.2, 17.5), 'lat': (46.1, 49.3), 'title': 'オーストリア全土'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None, notes=[],
        src13='国境・9州・都市（人口 POP_MAX の多い順に20。Natural Earth にオーストリアの都市は9しか無い）',
        fig='東経9.2〜17.5度・北緯46.1〜49.3度'),
})


def outline(cc):
    """その国の輪郭。Natural Earth v5.1.2 の国。ただし outline_osm のある国（バチカン・ジブラルタル）は OSM の輪郭
    （Natural Earth の形が使えないため。extract.sh が data/<国>/outline.geojson に切り出す。DESIGN.md §112）"""
    import json
    from shapely.geometry import shape
    c = COUNTRIES[cc]
    if c.get('outline_osm'):
        fs = json.load(open(os.path.join(c['dir'], 'outline.geojson')))['features']
        f = next(f for f in fs if str(f['properties'].get('@id')) == str(c['outline_osm']) and f['geometry']['type'] in ('Polygon', 'MultiPolygon'))
        return shape(f['geometry'])
    ne0 = json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))
    return shape(next(f for f in ne0['features'] if f['properties']['ADM0_A3'] == cc)['geometry'])


# ---- 3-2 南ヨーロッパの17か国（本土の重心の経度で東経0度から東回り。東経0度より西のポルトガル・ジブラルタル・スペインが最後）----
# 倍率は §100.11 の規則（100px 未満だけ、300〜700px に収まる 10・20・50・100・200・1000倍のうち最小）。
#   スロベニア96px・北マケドニア84px・モンテネグロ75px は、10倍で700px を超えるので上げない（DESIGN.md §112.2）
# 地方（region）：Natural Earth の region が**全部の区分に入っている国だけ**使う。一部にしか無い・誤りがある国は使わず、注記に書く
W32 = dict(up_href='memoryverse_3-2.html', up_label='3-2 南ヨーロッパ')
D32 = lambda nm, extra='': f'{nm}の国のページ。位置と形・骨組み（川・湖・道路・鉄道）・区画の3層を重ねた地図{extra}。メモリーバース 3-2 南ヨーロッパ。'
IT_REG = {'Abruzzo': 'アブルッツォ', 'Apulia': 'プーリア', 'Basilicata': 'バジリカータ', 'Calabria': 'カラブリア', 'Campania': 'カンパーニア',
          'Emilia-Romagna': 'エミリア＝ロマーニャ', 'Friuli-Venezia Giulia': 'フリウリ＝ヴェネツィア・ジュリア', 'Lazio': 'ラツィオ', 'Liguria': 'リグーリア',
          'Lombardia': 'ロンバルディア', 'Marche': 'マルケ', 'Molise': 'モリーゼ', 'Piemonte': 'ピエモンテ', 'Sardegna': 'サルデーニャ', 'Sicily': 'シチリア',
          'Toscana': 'トスカーナ', 'Trentino-Alto Adige': 'トレンティーノ＝アルト・アディジェ', 'Umbria': 'ウンブリア', "Valle d'Aosta": 'ヴァッレ・ダオスタ', 'Veneto': 'ヴェネト'}
ES_REG = {'Andalucía': 'アンダルシア', 'Aragón': 'アラゴン', 'Asturias': 'アストゥリアス', 'Canary Is.': 'カナリア諸島', 'Cantabria': 'カンタブリア',
          'Castilla y León': 'カスティーリャ・イ・レオン', 'Castilla-La Mancha': 'カスティーリャ＝ラ・マンチャ', 'Cataluña': 'カタルーニャ', 'Ceuta': 'セウタ',
          'Extremadura': 'エストレマドゥーラ', 'Foral de Navarra': 'ナバラ', 'Galicia': 'ガリシア', 'Islas Baleares': 'バレアレス諸島', 'La Rioja': 'ラ・リオハ',
          'Madrid': 'マドリード', 'Melilla': 'メリリャ', 'Murcia': 'ムルシア', 'País Vasco': 'バスク', 'Valenciana': 'バレンシア'}
SI_REG = {k: k for k in ['Gorenjska', 'Goriška', 'Jugovzhodna Slovenija', 'Koroška', 'Notranjsko-kraška', 'Obalno-kraška', 'Osrednjeslovenska',
                         'Podravska', 'Pomurska', 'Savinjska', 'Spodnjeposavska', 'Zasavska']}
NOREG = lambda have, tot, what: f'Natural Earth の region（区分をまとめる単位）は、{tot}の区分のうち{have}にしか入っていない{what}ので、この図には使っていない（層3の「地方」は「なし」と出る）。'
CITYN = lambda nm, n: f'都市（人口 POP_MAX の多い順に20。Natural Earth に{nm}の都市は{n}しか無い）' if n < 20 else '都市（人口 POP_MAX の多い順に20）'
BORDER = 'この地図の国境は、2-1 §08 で決めたとおり実効支配で描いています。'
COUNTRIES.update({
    'AND': dict(W32, dir=os.path.join(DATA, 'AND'), name='アンドラ', geofabrik='europe/andorra-latest.osm.pbf', phi0=42.54,
        zoom=50, fine=0.05, zoom_why='幅約12px', description=D32('アンドラ', '（この国の図だけ50倍）'),
        terms='<b>区分の呼び名</b>：Natural Earth に区分の種類が入っていない（7つの区分がある）。', terms_reading=False,
        panels={'main': {'lon': (1.363, 1.808), 'lat': (42.386, 42.692), 'title': 'アンドラ全土'}},
        regions={}, region_fill={}, admin1_word='区', city_strip=None, notes=[],
        src13='国境・7つの区・' + CITYN('アンドラ', 1), fig='東経1.363〜1.808度・北緯42.386〜42.692度'),
    'ITA': dict(W32, dir=os.path.join(DATA, 'ITA'), name='イタリア', geofabrik='europe/italy-latest.osm.pbf', phi0=43.48,
        description=D32('イタリア'),
        terms='<b>区分の呼び名</b>：Natural Earth では110の区分の種類が <b>Province</b>（プロヴィンチェ）とあり、20のまとまりが region に入っている（層3の「州」）。', terms_reading=True,
        panels={'main': {'lon': (6.203, 18.917), 'lat': (35.089, 47.485), 'title': '本土・シチリア島・サルデーニャ島'}},
        regions=IT_REG, region_fill={}, region_word='州', region_suffix='', region_fs=12, region_ls=1, admin1_word='県', city_strip=None,
        notes=['サンマリノとバチカンは、イタリアに囲まれた別の国（3-2 §06）。この図ではイタリアの中の小さな穴になる。'],
        src13='国境・海岸線・110県・20州・' + CITYN('イタリア', 56), fig='東経6.203〜18.917度・北緯35.089〜47.485度'),
    'SMR': dict(W32, rivers_outside_note='どれもイタリア側を流れる川で（国から1〜11km）、国の外にある。', dir=os.path.join(DATA, 'SMR'), name='サンマリノ', geofabrik='europe/italy-latest.osm.pbf', phi0=43.94,
        zoom=100, fine=0.02, zoom_why='縦約4px', description=D32('サンマリノ', '（この国の図だけ100倍）'),
        terms='<b>区分の呼び名</b>：Natural Earth に区分の種類が入っていない（9つの区分がある）。', terms_reading=False,
        panels={'main': {'lon': (12.373, 12.505), 'lat': (43.879, 43.995), 'title': 'サンマリノ全土'}},
        regions={}, region_fill={}, admin1_word='区', city_strip=None,
        notes=['サンマリノは、周りをすべてイタリアに囲まれている（3-2 §06）。層2は OpenStreetMap のイタリアの抽出（サンマリノを含む）から、この国の輪郭の中を数えている。'],
        src13='国境・9つの区・' + CITYN('サンマリノ', 1), fig='東経12.373〜12.505度・北緯43.879〜43.995度'),
    'VAT': dict(W32, rivers_outside_note='どれもイタリア（ローマ）を流れる川で、国の外にある（テヴェレ川は国から0.6km）。', dir=os.path.join(DATA, 'VAT'), name='バチカン', geofabrik='europe/italy-latest.osm.pbf', phi0=41.90,
        zoom=1000, fine=0.002, zoom_why='約0.4px の点', description=D32('バチカン', '（この国の図だけ1000倍）'),
        outline_osm=36989, outline_why='Natural Earth（1:1000万）の輪郭は7つの点・0.01km² しかなく、形として使えないため。OpenStreetMap の輪郭は257の点・0.49km²。',
        terms='<b>区分の呼び名</b>：Natural Earth に区分の種類が入っていない（国全体で1つ）。', terms_reading=False,
        panels={'main': {'lon': (12.444, 12.460), 'lat': (41.899, 41.909), 'title': 'バチカン全土'}},
        regions={}, region_fill={}, admin1_word='区分', city_strip=None,
        notes=['バチカンは、周りをすべてイタリア（ローマ）に囲まれている（3-2 §06）。層2は OpenStreetMap のイタリアの抽出から、この国の輪郭の中を数えている。'],
        src13='区分（国全体で1つ）・' + CITYN('バチカン', 1) + '。層3の区分の線は Natural Earth の形なので、層1（OpenStreetMap）の輪郭とは重ならない', fig='東経12.444〜12.460度・北緯41.899〜41.909度'),
    'MLT': dict(W32, dir=os.path.join(DATA, 'MLT'), name='マルタ', geofabrik='europe/malta-latest.osm.pbf', phi0=35.89,
        zoom=50, fine=0.05, zoom_why='幅約14px', description=D32('マルタ', '（この国の図だけ50倍）'),
        terms='<b>区分の呼び名</b>：Natural Earth に区分の種類が入っていない（68の区分があり、3つのまとまりが region に入っている。層3の「地域」）。', terms_reading=False,
        panels={'main': {'lon': (14.138, 14.613), 'lat': (35.755, 36.122), 'title': 'マルタ島・ゴゾ島'}},
        regions={'Malta Xlokk': 'Malta Xlokk', 'Malta Majjistral': 'Malta Majjistral', 'Gozo': 'Gozo'}, region_fill={}, region_word='地域', region_suffix='', region_fs=12, region_ls=1,
        admin1_word='区', city_strip=None, notes=[],
        src13='国境・海岸線・68の区・3つの地域・' + CITYN('マルタ', 1), fig='東経14.138〜14.613度・北緯35.755〜36.122度'),
    'SVN': dict(W32, rivers_outside_note='Sotla / Sutla は国境の川で（OpenStreetMap の国境の線に沿って流れる。59.8km のうち58.0km）、国の外にあるわけではない。<b>Natural Earth の粗い国境の線の外側に入るため、この図には描いていない。</b>', dir=os.path.join(DATA, 'SVN'), name='スロベニア', geofabrik='europe/slovenia-latest.osm.pbf', phi0=46.12,
        description=D32('スロベニア'),
        terms='<b>区分の呼び名</b>：Natural Earth では193の区分のうち181の種類が <b>Opcine</b>（オプチネ）、12が <b>Statisticna Regije</b>（スタティスティチュナ・レギイェ）とあり、12のまとまりが region に入っている（層3の「統計地域」）。', terms_reading=True,
        panels={'main': {'lon': (12.965, 16.915), 'lat': (45.024, 47.264), 'title': 'スロベニア全土'}},
        regions=SI_REG, region_fill={}, region_word='統計地域', region_suffix='', region_fs=11, region_ls=1, admin1_word='自治体', city_strip=None,
        notes=['1度44pxで幅約96px と小さいが、形は読めるので倍率を上げていない（ベルギー126px と同じ扱い。拡大表示で詳しく見られる）。'],
        src13='国境・海岸線・193の区分・12の統計地域・' + CITYN('スロベニア', 2), fig='東経12.965〜16.915度・北緯45.024〜47.264度'),
    'HRV': dict(W32, dir=os.path.join(DATA, 'HRV'), name='クロアチア', geofabrik='europe/croatia-latest.osm.pbf', phi0=45.15,
        description=D32('クロアチア'),
        terms='<b>区分の呼び名</b>：Natural Earth では20の区分の種類が <b>Županija</b>（ジュパニヤ）、首都の1つが <b>Grad</b>（グラード）。', terms_reading=True,
        panels={'main': {'lon': (13.101, 19.808), 'lat': (42.016, 46.947), 'title': 'クロアチア全土'}},
        regions={}, region_fill={}, admin1_word='郡', city_strip=None,
        notes=['南の端のドゥブロヴニクのあたりは、ボスニア・ヘルツェゴビナの海岸（ネウム）で本土から切れている。モンテネグロと接するのはこの部分だけ。',
               NOREG(1, 21, '（しかもスロベニアの地域名 Jugovzhodna Slovenija が入っている）')],
        src13='国境・海岸線・21の区分・' + CITYN('クロアチア', 10), fig='東経13.101〜19.808度・北緯42.016〜46.947度'),
    'BIH': dict(W32, dir=os.path.join(DATA, 'BIH'), name='ボスニア・ヘルツェゴビナ', geofabrik='europe/bosnia-herzegovina-latest.osm.pbf', phi0=44.17,
        description=D32('ボスニア・ヘルツェゴビナ'),
        terms='<b>区分の呼び名</b>：Natural Earth では18の区分の種類が <b>Županija|kanton</b>・<b>Canton</b>（10）、<b>Region</b>（7）、<b>Condominium</b>（1、ブルチコ）とばらばらで、2つのまとまりが region に入っている（層3の「構成体」。Natural Earth の綴りは Repuplika Srpska）。', terms_reading=False,
        panels={'main': {'lon': (15.316, 20.019), 'lat': (42.159, 45.685), 'title': 'ボスニア・ヘルツェゴビナ全土'}},
        regions={'Federacija Bosna i Hercegovina': 'ボスニア・ヘルツェゴビナ連邦', 'Repuplika Srpska': 'スルプスカ共和国'}, region_fill={},
        region_word='構成体', region_suffix='', region_fs=12, region_ls=1, admin1_word='区分', city_strip=None,
        notes=['海に面しているのは、南のネウムのあたりだけ（Natural Earth の形で約18km）。'],
        src13='国境・海岸線・18の区分・2つの構成体・' + CITYN('ボスニア・ヘルツェゴビナ', 6), fig='東経15.316〜20.019度・北緯42.159〜45.685度'),
    'MNE': dict(W32, rivers_outside_note='Lumi i Cemit は国境の川ではなく（OpenStreetMap の国境の線に沿うのは0.6km）、ほとんどがアルバニア側を流れる（国の中は0.1km）。', dir=os.path.join(DATA, 'MNE'), name='モンテネグロ', geofabrik='europe/montenegro-latest.osm.pbf', phi0=42.78,
        description=D32('モンテネグロ'),
        terms='<b>区分の呼び名</b>：Natural Earth では21の区分の種類が <b>Opština</b>（オプシュティナ）。', terms_reading=True,
        panels={'main': {'lon': (18.034, 20.755), 'lat': (41.452, 43.948), 'title': 'モンテネグロ全土'}},
        regions={}, region_fill={}, admin1_word='自治体', city_strip=None,
        notes=['1度44pxで縦約75px と小さいが、倍率を上げていない（10倍だと700px を超え、規則の倍率に合わない。拡大表示で詳しく見られる）。'],
        src13='国境・海岸線・21の自治体・' + CITYN('モンテネグロ', 1), fig='東経18.034〜20.755度・北緯41.452〜43.948度'),
    'ALB': dict(W32, dir=os.path.join(DATA, 'ALB'), name='アルバニア', geofabrik='europe/albania-latest.osm.pbf', phi0=41.14,
        description=D32('アルバニア'),
        terms='<b>区分の呼び名</b>：Natural Earth では12の区分の種類が <b>Qark</b>（チャルク）。', terms_reading=True,
        panels={'main': {'lon': (18.872, 21.437), 'lat': (39.237, 43.055), 'title': 'アルバニア全土'}},
        regions={}, region_fill={}, admin1_word='州', city_strip=None, notes=[],
        src13='国境・海岸線・12州・' + CITYN('アルバニア', 26), fig='東経18.872〜21.437度・北緯39.237〜43.055度'),
    'SRB': dict(W32, dir=os.path.join(DATA, 'SRB'), name='セルビア', geofabrik='europe/serbia-latest.osm.pbf', phi0=44.21,
        description=D32('セルビア'),
        terms='<b>区分の呼び名</b>：Natural Earth では24の区分の種類が <b>Okrug</b>（オクルグ）、首都ベオグラードが <b>Grad</b>（グラード）。', terms_reading=True,
        panels={'main': {'lon': (18.445, 23.385), 'lat': (41.835, 46.574), 'title': 'セルビア全土'}},
        regions={}, region_fill={}, admin1_word='郡', city_strip=None,
        notes=[BORDER + 'セルビアはコソボを自国の一部と主張しているが、この地図ではコソボを別の区域として描いている（3-2 §06）。', NOREG(11, 25, '')],
        src13='国境・25の区分・' + CITYN('セルビア', 7), fig='東経18.445〜23.385度・北緯41.835〜46.574度'),
    'KOS': dict(W32, dir=os.path.join(DATA, 'KOS'), name='コソボ', geofabrik='europe/kosovo-latest.osm.pbf', phi0=42.57,
        zoom=10, fine=0.2, zoom_why='縦約62px', description=D32('コソボ', '（この国の図だけ10倍）'),
        terms='<b>区分の呼び名</b>：Natural Earth では30の区分の種類が <b>Okrug</b>（オクルグ）とある。', terms_reading=True,
        panels={'main': {'lon': (19.815, 21.983), 'lat': (41.634, 43.473), 'title': 'コソボ全土'}},
        regions={}, region_fill={}, admin1_word='区分', city_strip=None,
        notes=[BORDER + 'コソボは自らの政府が治めていて、セルビアが自国の一部と主張している。承認している国の数は、数える人で違う（3-2 §06）。',
               'Natural Earth の region（7つ）は、セルビア語の地名（Đakovica・Uroševac など）で入っている。どちらかの言葉の地名だけを図に出すことになるので、使っていない（層3の「地方」は「なし」と出る）。'],
        src13='国境・30の区分・' + CITYN('コソボ', 3), fig='東経19.815〜21.983度・北緯41.634〜43.473度'),
    'MKD': dict(W32, rivers_outside_note='Елешница は国境の川ではなく（OpenStreetMap の国境の線に沿う部分は無い）、国の外を流れる。', dir=os.path.join(DATA, 'MKD'), name='北マケドニア', geofabrik='europe/macedonia-latest.osm.pbf', phi0=41.60,
        description=D32('北マケドニア'),
        terms='<b>区分の呼び名</b>：Natural Earth では84の区分の種類が <b>Statistical Region</b>（72）・<b>Municipality</b>（10）・<b>Opština</b>（2、オプシュティナ）とばらばら。', terms_reading=True,
        panels={'main': {'lon': (20.044, 23.410), 'lat': (40.449, 42.770), 'title': '北マケドニア全土'}},
        regions={}, region_fill={}, admin1_word='自治体', city_strip=None,
        notes=['1度44pxで幅約84px と小さいが、倍率を上げていない（10倍だと700px を超え、規則の倍率に合わない。拡大表示で詳しく見られる）。', NOREG(69, 84, '')],
        src13='国境・84の区分・' + CITYN('北マケドニア', 3), fig='東経20.044〜23.410度・北緯40.449〜42.770度'),
    'GRC': dict(W32, dir=os.path.join(DATA, 'GRC'), name='ギリシャ', geofabrik='europe/greece-latest.osm.pbf', phi0=39.46,
        description=D32('ギリシャ'),
        terms='<b>区分の呼び名</b>：Natural Earth では13の区分の種類が <b>Diamerismata</b>（ディアメリスマタ）、1つ（アトス山）が <b>Aftonomi Monastiki Politia</b>（自治修道院国家）。', terms_reading=True,
        panels={'main': {'lon': (19.226, 28.640), 'lat': (34.415, 42.150), 'title': '本土とエーゲ海・イオニア海・クレタ島'}},
        regions={}, region_fill={}, admin1_word='地方', city_strip=None, notes=[NOREG(4, 14, '')],
        src13='国境・海岸線・14の区分・' + CITYN('ギリシャ', 30), fig='東経19.226〜28.640度・北緯34.415〜42.150度'),
    'PRT': dict(W32, dir=os.path.join(DATA, 'PRT'), name='ポルトガル', geofabrik='europe/portugal-latest.osm.pbf', phi0=39.66,
        description=D32('ポルトガル', '（マデイラの図だけ10倍）'),
        terms='<b>区分の呼び名</b>：Natural Earth では18の区分の種類が <b>Distrito</b>（ディシュトリト）、2つ（アゾレス・マデイラ）が <b>Regiões autônoma</b>（自治地域）。', terms_reading=True,
        panels={'main': {'lon': (-9.897, -5.806), 'lat': (36.566, 42.554), 'title': '本土'},
                'azores': {'lon': (-31.685, -24.612), 'lat': (36.534, 40.128), 'title': 'アゾレス諸島（本土と同じ縮尺）'},
                'madeira': {'lon': (-17.332, -16.195), 'lat': (32.412, 33.191), 'title': 'マデイラ諸島', 'zoom': 10, 'fine': 0.2, 'zoom_why': '幅約36px'}},
        regions={}, region_fill={}, admin1_word='県', city_strip=None,
        notes=['図の外にある島：<b>セルヴァジェン諸島</b>（北緯30.1度・西経15.9度。マデイラ自治地域）。', NOREG(18, 20, '（「Norte, Centro」のように2つが並んだ値もある）')],
        src13='国境・海岸線・18県と2つの自治地域・' + CITYN('ポルトガル', 24), fig='本土は西経9.897〜5.806度・北緯36.566〜42.554度、アゾレス諸島は西経31.685〜24.612度・北緯36.534〜40.128度、マデイラ諸島は西経17.332〜16.195度・北緯32.412〜33.191度'),
    'GIB': dict(W32, rivers_outside_note='どれもスペイン側を流れる川で（国から6km 以上）、国の外にある。', dir=os.path.join(DATA, 'GIB'), name='ジブラルタル', geofabrik='europe/spain-latest.osm.pbf', phi0=36.14,
        zoom=200, fine=0.01, zoom_why='縦約2px', description=D32('ジブラルタル', '（この図だけ200倍）'),
        outline_osm=6358272, outline_why='Natural Earth（1:1000万）の輪郭は3.69km² で形が粗いため。OpenStreetMap の陸の境界（boundary=land_area、6.59km²）を使う。領海まで含む境界（93.7km²）は使わない。',
        terms='<b>区分の呼び名</b>：Natural Earth に区分の種類が入っていない（全体で1つ）。', terms_reading=False,
        panels={'main': {'lon': (-5.373, -5.332), 'lat': (36.103, 36.161), 'title': 'ジブラルタル全土'}},
        regions={}, region_fill={}, admin1_word='区分', city_strip=None,
        notes=['ジブラルタルはイギリスの海外領土で、スペインが主権を主張している（3-2 §06）。Natural Earth でも国ではなく係争の単位（Disputed）として入っている。層2は OpenStreetMap のスペインの抽出から、この輪郭の中を数えている。'],
        src13='区分（全体で1つ）・' + CITYN('ジブラルタル', 1) + '。層3の区分の線は Natural Earth の形なので、層1（OpenStreetMap）の輪郭とは重ならない', fig='西経5.373〜5.332度・北緯36.103〜36.161度'),
    'ESP': dict(W32, dir=os.path.join(DATA, 'ESP'), name='スペイン', geofabrik='europe/spain-latest.osm.pbf', phi0=40.36,
        description=D32('スペイン'),
        terms='<b>区分の呼び名</b>：Natural Earth では52の区分のうち50の種類が <b>Comunidad Autónoma</b>（コムニダ・アウトノマ）、2つ（セウタ・メリリャ）が <b>Ciudades Autónomas</b>（シウダデス・アウトノマス）とある。ただし50の区分は自治州そのものではなく、自治州の名前は region のほうに入っている（層3の「自治州」、19）。種類の欄と区分の単位が合っていない。', terms_reading=True,
        panels={'main': {'lon': (-9.692, 4.737), 'lat': (34.772, 44.193), 'title': '本土・バレアレス諸島・セウタ・メリリャ'},
                'canarias': {'lon': (-18.567, -13.018), 'lat': (27.242, 29.689), 'title': 'カナリア諸島（本土と同じ縮尺）'}},
        regions=ES_REG, region_fill={}, region_word='自治州', region_suffix='', region_fs=12, region_ls=1, admin1_word='県', city_strip=None,
        notes=['<b>セウタ</b>（北緯35.9度・西経5.3度）と<b>メリリャ</b>（北緯35.3度・西経2.9度）は、アフリカの北岸にあるスペインの都市で、本土の図に入っている。モロッコと陸で接するのは、この2つの部分だけ。'],
        src13='国境・海岸線・52の区分・19の自治州・' + CITYN('スペイン', 49), fig='本土は西経9.692度〜東経4.737度・北緯34.772〜44.193度、カナリア諸島は西経18.567〜13.018度・北緯27.242〜29.689度'),
})

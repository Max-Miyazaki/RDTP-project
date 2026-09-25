from shapely.geometry import LineString, Polygon


def lines_of(g):
    """入れ物（Multi*・GeometryCollection）を再帰的にほどいて LineString だけを返す。点や面は捨てる。"""
    if g is None or g.is_empty:
        return []
    if isinstance(g, LineString):
        return [g]
    if hasattr(g, 'geoms'):
        out = []
        for h in g.geoms:
            out += lines_of(h)
        return out
    return []


def polys_of(g):
    if g is None or g.is_empty:
        return []
    if isinstance(g, Polygon):
        return [g]
    if hasattr(g, 'geoms'):
        out = []
        for h in g.geoms:
            out += polys_of(h)
        return out
    return []




def merge(g):
    """線をつなぐ。入れ物の種類（LineString 1本・GeometryCollection など）に関係なく線だけを渡す。"""
    from shapely.geometry import MultiLineString
    from shapely.ops import linemerge
    ls = lines_of(g) if not isinstance(g, list) else [l for h in g for l in lines_of(h)]
    return linemerge(MultiLineString(ls)) if ls else MultiLineString()


# ---------------- ラベルの名前 ----------------
import unicodedata


def char_script(ch):
    """文字の文字体系。文字でないもの（空白・数字・記号・括弧）は None。"""
    if not unicodedata.category(ch).startswith(('L', 'M')):
        return None
    o = ord(ch)
    if 0x3040 <= o <= 0x30FF or 0x3400 <= o <= 0x9FFF or 0xF900 <= o <= 0xFAFF or 0xFF66 <= o <= 0xFF9F or o in (0x3005, 0x30F6, 0x30F5):
        return 'CJK'
    if 0xFF21 <= o <= 0xFF5A:
        return 'Latin'
    n = unicodedata.name(ch, '')
    for s in ('LATIN', 'ARABIC', 'CYRILLIC', 'GREEK', 'HEBREW', 'HANGUL', 'THAI', 'DEVANAGARI', 'ETHIOPIC', 'GEORGIAN', 'ARMENIAN', 'TIFINAGH'):
        if n.startswith(s):
            return s.capitalize()
    return 'Other'


def token_script(tok):
    ss = [char_script(c) for c in tok]
    ss = [x for x in ss if x]
    if not ss:
        return None
    if 'CJK' in ss:            # 「JR東北本線」のように漢字かなとローマ字が1語の中で混ざるのは日本語の名前
        return 'CJK'
    letters = [c for c in tok if char_script(c)]
    if len(letters) <= 3 and all('A' <= c <= 'Z' for c in letters):
        return None            # JR・RN などの大文字の略号は、文字種の切り替えに数えない
    return max(set(ss), key=ss.count)


def first_script(name):
    """空白で区切った語の文字体系が途中で変わったら、そこで切って先頭の1つだけ残す。
    1つの文字体系だけの名前（アラビア文字だけ・キリル文字だけ）はそのまま。"""
    import re
    cur = None
    for m in re.finditer(r'\S+', name):
        sc = token_script(m.group())
        if sc and cur and sc != cur:
            out = name[:m.start()].rstrip(' \u3000-–—/;,:(（')
            return out or name
        cur = cur or sc
    return name


def clip_len(name, limit=14):
    """1行の上限：全角14文字（半角は0.5文字）。超えたら末尾を「…」にする。"""
    w = lambda c: 1 if ord(c) > 0x2000 else 0.5
    if sum(w(c) for c in name) <= limit:
        return name
    out, tot = '', 0
    for c in name:
        if tot + w(c) > limit - 1:
            break
        out += c
        tot += w(c)
    return out.rstrip(' \u3000-–—/;,:(（') + '…'


def label_name(name):
    return clip_len(first_script(name))


def clip_tail(name, limit=14):
    """後ろを残して、先頭を「…」にする（切り詰めで見分けがつかなくなったものだけに使う）。
    語の途中から始まらないよう、残す部分の最初の区切りまで進める。"""
    w = lambda c: 1 if ord(c) > 0x2000 else 0.5
    if sum(w(c) for c in name) <= limit:
        return name
    out, tot = '', 0
    for c in reversed(name):
        if tot + w(c) > limit - 1:
            break
        out = c + out
        tot += w(c)
    cut = len(name) - len(out)
    if name[cut - 1] not in ' 　-–—/;,:' and ' ' in out:
        out = out[out.index(' ') + 1:]          # 語の途中なら次の語の頭から
    return '…' + out.lstrip(' 　-–—/;,:)）')

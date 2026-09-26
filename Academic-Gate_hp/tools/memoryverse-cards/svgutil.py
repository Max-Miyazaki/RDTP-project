# SVG のパスを書く道具（draw.py と region.py で共通）
from prep_util import lines_of, polys_of


def fmt(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s


def rel(pts, close=False):
    """点列を相対座標のパスにする（0.1px 単位に丸め、丸めで重なる点は落とす）。"""
    q = [(round(x * 10), round(y * 10)) for x, y in pts]
    q = [q[0]] + [b for a, b in zip(q, q[1:]) if a != b]
    if len(q) < (3 if close else 2):
        return ''
    f = lambda v: fmt(v / 10)
    out = f'M{f(q[0][0])} {f(q[0][1])}l' + ' '.join(f'{f(b[0] - a[0])} {f(b[1] - a[1])}' for a, b in zip(q, q[1:]))
    return (out + 'z') if close else out


def d_lines(g):
    # 短い断片も落とさない（2px 未満を落とすと線全体の1〜2割が消え、途切れて見える。§100）
    return ''.join(rel(l.coords) for l in lines_of(g))


def d_polys(g):
    out = []
    for p in polys_of(g):
        for ring in [p.exterior, *p.interiors]:
            out.append(rel(list(ring.coords)[:-1], close=True))
    return ''.join(out)

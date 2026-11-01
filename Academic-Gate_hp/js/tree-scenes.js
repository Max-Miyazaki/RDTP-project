/* ============================================================================
   tree-scenes.js — ホームの粒子（DESIGN.md §135）

   01 種（回る球）→ 02 根 → 03 学問の樹 → 04 私の枝（研究の階層）→ 05 実り → 06 一歩。
   粒子は場面ごとに目標の位置を持ち、スクロールに合わせて次の目標へ移る。

   ★ 形は自分では決めない。js/academic-tree.js が描いた SVG の線と名前の位置、
   js/research.js の階層のカード、05 のカードの箱から粒子を撒くので、粒子と HTML は
   同じ座標から出ている。描き直し（'treelayout'）のたびに撒き直す。
   ★ 座標はページ（文書）の px。各場面の目標は、その場面の箱の左上からの位置で持ち、
   箱の位置（uOff）とスクロール量（uScroll）は毎フレーム uniform で渡す（正投影）。

   移り方（§135.7・§135.8）
     01→02  球が種のように縮んで根の種の位置へ集まり、根が種から先へ伸びる
     03→04  木が大分類の色ごとの光の線にほどけて画面に散らばり、曲線を描いて THEME へ集まり、04 の形へ落ち着く
     05→06  実の粒子が舞い上がり、らせん状にブラックホールへ吸い込まれて降着円盤になる
     ほか   画面全体へ散って大きく渦を巻き、次の形へ収束する
   止まっている場面でも、旧ホームと同じ curl noise でゆらゆら揺れる。

   動かない環境（動きを減らす設定・WebGL 無し・読み込み失敗）では何もしない。
   そのときは academic-tree.js の静的な SVG がそのまま残る。
   ============================================================================ */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var seedEl = document.querySelector('.home-seed__glyph');
    var rootsBox = document.querySelector('[data-roots]');
    var treeBox = document.querySelector('[data-tree]');
    var vizBox = document.querySelector('[data-branch-viz]');
    var figBox = document.querySelector('[data-branch]');
    var fruitsBox = document.querySelector('[data-fruits]');
    var stepBox = document.getElementById('step');
    var stepInner = stepBox && stepBox.querySelector('.home-step__inner');
    if (!seedEl || !rootsBox || !treeBox || !vizBox || !figBox || !fruitsBox || !stepBox || !stepInner) return;
    if (!hasWebGL()) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'scene-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var star = document.getElementById('starfield');
    (star ? star.parentNode.insertBefore(canvas, star.nextSibling) : document.body.insertBefore(canvas, document.body.firstChild));

    loadThree().then(init).catch(function () { canvas.remove(); });

    function hasWebGL() {
        try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
        catch (e) { return false; }
    }
    /* Three.js は 0.160.0 に固定（DESIGN.md §11b）。jsdelivr が落ちていれば unpkg。 */
    function loadThree() {
        return new Promise(function (resolve, reject) {
            if (window.THREE) return resolve();
            function attempt(url, next) {
                var s = document.createElement('script'); s.src = url; s.async = true;
                s.onload = function () { window.THREE ? resolve() : (next ? attempt(next, null) : reject()); };
                s.onerror = function () { next ? attempt(next, null) : reject(); };
                document.head.appendChild(s);
            }
            attempt('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js', 'https://unpkg.com/three@0.160.0/build/three.min.js');
        });
    }

    function init() {
        var isMobile = window.innerWidth <= 768;
        var lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
        var urlN = parseInt((location.search.match(/[?&]n=(\d+)/) || [])[1], 10);
        var N = urlN || (isMobile ? 36000 : lowPower ? 50000 : 80000);
        var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

        /* ---- 色。番号は粒子の属性に入れる（0 白 / 1 光の青 / 2 幹の青 / 3〜9 分類 / 10〜13 実） */
        var CATS = ['formal', 'natural', 'life', 'engineering', 'humanities', 'social', 'arts'];
        var PAL = ['#e8f6ff', '#5fd0ff', '#3d8bff', '#8fb3ff', '#5fd9e6', '#63e0bd', '#a9c6ea', '#b8a4ff', '#d7a8ff', '#ff9ec4',
            '#5fd0ff', '#8fb3ff', '#ff9ec4', '#63e0bd',    // 実の色は CSS の --fruit-0〜3 と同じ
            '#6f8cff', '#4fdd8a', '#ffb547', '#ff5f52'];   // 14〜17 研究の階層（450・520・590・650nm、CSS の --nm-*。§135.9）
        var NP = PAL.length, NAT = 4;
        var NM = [17, 16, 15, 14];   // 階層の下（基礎分野）から上（テーマ）への色番号
        var kN = 80000 / N;   // 粒子数が少ない画面では、1粒を明るくして見た目の濃さを揃える
        function catIndex(cat) { var i = CATS.indexOf(cat); return i < 0 ? 2 : 3 + i; }

        /* ---- 乱数（毎回同じ撒き方） */
        var st = 0x2f6b1a37;
        function rnd() { st |= 0; st = st + 0x6D2B79F5 | 0; var t = Math.imul(st ^ st >>> 15, 1 | st); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
        function gauss(s) { return (rnd() + rnd() + rnd() - 1.5) * 1.15 * s; }

        /* ---- 線を折れ線にして、長さで重み付けして撒く ---------------------- */
        function poly(path, step) {
            var len = path.getTotalLength(), n = Math.max(2, Math.ceil(len / step)), pts = [];
            for (var i = 0; i <= n; i++) { var p = path.getPointAtLength(len * i / n); pts.push(p.x, p.y); }
            return { pts: pts, n: n, len: len };
        }
        function fromPts(pts) {   // [x,y, x,y, …] の折れ線（等間隔でなくてよい）を、長さで均した形に
            var cum = [0], len = 0;
            for (var k = 2; k < pts.length; k += 2) { len += Math.hypot(pts[k] - pts[k - 2], pts[k + 1] - pts[k - 1]); cum.push(len); }
            var n = Math.max(2, Math.ceil(len / 4)), out = [], j = 0;
            for (var i = 0; i <= n; i++) {
                var s = len * i / n; while (j < cum.length - 2 && cum[j + 1] < s) j++;
                var u = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
                out.push(pts[j * 2] + (pts[j * 2 + 2] - pts[j * 2]) * u, pts[j * 2 + 1] + (pts[j * 2 + 3] - pts[j * 2 + 1]) * u);
            }
            return { pts: out, n: n, len: len };
        }
        function onPoly(pl, t) {
            var f = t * pl.n, i = Math.min(pl.n - 1, Math.floor(f)), u = f - i, k = i * 2;
            var x0 = pl.pts[k], y0 = pl.pts[k + 1], x1 = pl.pts[k + 2], y1 = pl.pts[k + 3];
            var dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1;
            return { x: x0 + dx * u, y: y0 + dy * u, nx: -dy / dl, ny: dx / dl };
        }
        // 角の丸い長方形の輪郭（左上から時計回り）
        function rrect(x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2); var pts = [], seg = 6;
            function arc(cx, cy, a0) { for (var i = 0; i <= seg; i++) { var a = a0 + Math.PI / 2 * i / seg; pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
            arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
            pts.push(pts[0], pts[1]);
            return fromPts(pts);
        }
        function picker(items, weight) {
            var cdf = [], tot = 0;
            items.forEach(function (it) { tot += weight(it); cdf.push(tot); });
            return function () { var r = rnd() * tot, lo = 0, hi = cdf.length - 1; while (lo < hi) { var m = (lo + hi) >> 1; if (cdf[m] < r) lo = m + 1; else hi = m; } return items[lo]; };
        }
        function total(a) { return a.reduce(function (s, l) { return s + l.len; }, 0); }
        // 箱 root から見た el の位置（offsetTop の連鎖。getBoundingClientRect はフェードイン前の translateY を含むので使わない）
        function rel(el, root) {
            var x = 0, y = 0, e = el;
            while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
            if (e !== root) { var a = el.getBoundingClientRect(), b = root.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: el.offsetWidth, h: el.offsetHeight }; }
            return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
        }

        /* 場面ごとの目標：[x, y, z, w]（箱の左上からの px）
           z = floor(順番×63)×4 + 明るさ（明るさは 0〜4 未満）。順番は「伸びる」移り方で先に動く粒子ほど小さい
           w = 色番号 + 揺れの段/10（色は四捨五入で読む）。段 0 名前・実の近く / 1 枝 / 2 にじみ / 3 塵 / 4 流れ（光が線を伝う） */
        var S = [0, 1, 2, 3, 4, 5].map(function () { return new Float32Array(N * 4); });
        var Z0 = new Float32Array(N);    // 01 の球の奥行き
        var seedA = new Float32Array(N);
        for (var i = 0; i < N; i++) seedA[i] = rnd();
        function put(k, i, x, y, b, c, sway, d) {
            var A = S[k];
            A[i * 4] = x; A[i * 4 + 1] = y;
            A[i * 4 + 2] = Math.floor(Math.max(0, Math.min(1, d || 0)) * 63) * 4 + Math.max(0, Math.min(3.99, b));
            A[i * 4 + 3] = c + (sway == null ? 1 : sway) / 10;
        }
        var pivots = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
        var R0 = 150, rootSeed = { x: 0, y: 16 };

        // 01 種：旧ホームの宇宙の球（体積のある球と、明るい塊）を青・シアンで。まわりを回る輪と、淡い塵
        function buildSeed() {
            st = 0x11;
            R0 = seedEl.offsetWidth / 2 || 150;
            for (var i = 0; i < N; i++) {
                var r = rnd(), u, th, s3, rn, x, y, z;
                if (r < 0.03) { put(0, i, gauss(R0 * 0.06), gauss(R0 * 0.06), 0.35, 0, 0); Z0[i] = gauss(R0 * 0.06); }
                else if (r < 0.66) {
                    // 体積の一様分布（中心ほど重なって明るく見える）。中心へ向かって1粒を暗くして白飛びを防ぐ（旧と同じ考え方）
                    var vr = Math.cbrt(rnd()); rn = vr > 0.9 ? 0.9 + (vr - 0.9) * 0.5 : vr;
                    u = rnd() * 2 - 1; th = rnd() * 6.2832; s3 = Math.sqrt(1 - u * u);
                    var dx = s3 * Math.cos(th), dy = u, dz = s3 * Math.sin(th);
                    var clump = 0.5 + 0.5 * Math.sin(dx * 5.0 + dz * 3.0) * Math.cos(dy * 6.0 + dx * 4.0);
                    var shell = 0.72 + 0.28 * Math.sin(rn * 17.0);
                    x = dx * rn * R0; y = dy * rn * R0; z = dz * rn * R0;
                    put(0, i, x, y, (0.05 + 0.22 * rn * rn) * shell * (0.6 + 0.9 * clump) * kN, rn < 0.55 ? 1 : 2, 1);
                    Z0[i] = z;
                }
                else if (r < 0.9) {
                    // 輪：球の外側を、球より速く回る（シェーダで回す）
                    var a = rnd() * 6.2832, rr = R0 * (1.35 + 0.55 * Math.pow(rnd(), 0.7));
                    put(0, i, Math.cos(a) * rr, gauss(R0 * 0.025), 0.05 * kN, rnd() < 0.6 ? 1 : 0, 2);
                    Z0[i] = Math.sin(a) * rr;
                }
                else {
                    var a2 = rnd() * 6.2832, rad = R0 * 0.8 + 380 * Math.pow(rnd(), 1.6);
                    put(0, i, Math.cos(a2) * rad * 1.8, Math.sin(a2) * rad * 0.6, 0.03 + 0.05 * (1 - rad / 500), rnd() < 0.5 ? 1 : 2, 3);
                    Z0[i] = 0;
                }
            }
            pivots[0] = [0, 0];
        }

        // 02 根：根の線・種・土の中の塵。順番は種からの距離（種に近い所から伸びる）
        function buildRoots() {
            st = 0x22;
            var W = rootsBox.clientWidth, H = rootsBox.clientHeight;
            var lines = [].map.call(rootsBox.querySelectorAll('.root:not(.root--path)'), function (p) {
                var pl = poly(p, 4); pl.w = parseFloat(p.getAttribute('stroke-width')) || 1; return pl;
            });
            if (!lines.length) return false;
            var pick = picker(lines, function (l) { return l.len * (0.4 + l.w); });
            var seed = { x: W / 2, y: 16 }; rootSeed = seed;
            var far = Math.hypot(W / 2, H);
            var bR = Math.min(0.5, 2.2 * total(lines) / (N * 0.6));
            for (var i = 0; i < N; i++) {
                var r = rnd();
                if (r < 0.6) {
                    var l = pick(), q = onPoly(l, rnd()), j = gauss(l.w * 0.9), x = q.x + q.nx * j, y = q.y + q.ny * j;
                    put(1, i, x, y, bR * (0.6 + 0.25 * l.w), 1, 1, Math.hypot(x - seed.x, y - seed.y) / far);
                }
                else if (r < 0.65) put(1, i, seed.x + gauss(4), seed.y + gauss(4), 1.0, 0, 0, 0);
                else { var x2 = seed.x + gauss(W * 0.3), y2 = seed.y + Math.abs(gauss(H * 0.5)); put(1, i, x2, y2, 0.035, 2, 3, Math.hypot(x2 - seed.x, y2 - seed.y) / far); }
            }
            pivots[1] = [W / 2, H * 0.4];
            return true;
        }

        // 03 学問の樹：幹・枝・小枝（分類の色）・種・枝先の葉
        var LEVEL_W = [4, 2.4, 1.5, 1], LEVEL_B = [0.5, 0.42, 0.34, 0.3];
        function buildTree() {
            st = 0x33;
            var L = window.__tree;
            var paths = treeBox.querySelectorAll('.tree__branches .tree-branch');
            if (!L || !paths.length) return false;
            var lines = [].map.call(paths, function (p) {
                var pl = poly(p, 4), m = /tree-branch--(\d)/.exec(p.getAttribute('class')), lv = m ? +m[1] : 3;
                var cm = /--tint-([a-z]+)/.exec(p.getAttribute('style') || '');
                pl.w = LEVEL_W[lv] || 1; pl.b = LEVEL_B[lv] || 0.3; pl.c = cm ? catIndex(cm[1]) : 2;
                return pl;
            });
            var pick = picker(lines, function (l) { return l.len * (0.5 + l.w * 0.6); });
            var tips = L.nodes.filter(function (n) { return n.kind !== 'cat'; });
            var tip = picker(tips, function () { return 1; });
            for (var i = 0; i < N; i++) {
                var r = rnd();
                if (r < 0.70) { var l = pick(), q = onPoly(l, rnd()), j = gauss(l.w * 0.8); put(2, i, q.x + q.nx * j, q.y + q.ny * j, l.b, l.c, 1); }
                else if (r < 0.74) put(2, i, L.seed.x + gauss(4), L.seed.y + gauss(4), 1.0, 0, 0);
                else {
                    // 葉：名前の茎側の端（小枝の先）に寄せる。名前の文字の下には入れない
                    var t = tip(), dir = t.align === 'left' ? 1 : -1;
                    put(2, i, t.x - dir * (6 + Math.abs(gauss(8))), t.y + gauss(7), 0.16, catIndex(t.cat), 0);
                }
            }
            pivots[2] = [L.fork.x, L.fork.y];
            return true;
        }

        // 04 私の枝：小さな木（物理学の枝だけ明るい）→ 伸びた枝 → 研究の階層の層と層の接続を昇り、
        // テーマのカードのまわりから星空へ光が散る。カードの中（文字の後ろ）には撒かない
        function buildBranch() {
            st = 0x44;
            var fr = rel(figBox, vizBox), g = figBox.querySelector('.branch-mini');
            if (!g) return false;
            var s = +g.getAttribute('data-s'), tx = +g.getAttribute('data-tx'), ty = +g.getAttribute('data-ty');
            function svgLines(sel, scaled) {
                return [].map.call(figBox.querySelectorAll(sel), function (p) {
                    var pl = poly(p, scaled ? 4 / s : 4);
                    for (var k = 0; k < pl.pts.length; k += 2) {
                        if (scaled) { pl.pts[k] = tx + pl.pts[k] * s; pl.pts[k + 1] = ty + pl.pts[k + 1] * s; }
                        pl.pts[k] += fr.x; pl.pts[k + 1] += fr.y;
                    }
                    if (scaled) pl.len *= s;
                    var cm = /--tint-([a-z]+)/.exec(p.getAttribute('style') || '');
                    pl.c = cm ? catIndex(cm[1]) : 2;
                    return pl;
                });
            }
            var mine = svgLines('.mini-branch.is-mine', true), rest = svgLines('.mini-branch:not(.is-mine)', true), ext = svgLines('.branch-ext', false)[0];
            var tiers = [].map.call(vizBox.querySelectorAll('.rs-tier'), function (t) {
                return [].map.call(t.querySelectorAll('.rs-card'), function (c) { return rel(c, vizBox); });
            }).reverse();   // 下（基礎分野）から上（テーマ）へ
            if (!mine.length || !ext || tiers.length < 2) return false;
            var X = tiers[0][0].x + tiers[0][0].w / 2;   // 階層の中心線（基礎分野のカードの中央）
            var yTop = tiers[tiers.length - 1][0].y, yBot = fr.y + fr.h;
            function dOf(y) { return Math.max(0, Math.min(1, (yBot - y) / Math.max(1, yBot - yTop))); }
            // 昇る道：伸びた枝 → 各層では中心線にかかるカードの輪郭（左右の両側）か、カードのあいだの隙間 → 層と層のあいだ
            ext.c = NAT; ext.c2 = NM[0]; ext.grad = 'along';   // 枝の色から基礎分野の赤へ
            var route = [ext], outlines = [];
            tiers.forEach(function (row, k) {
                // 中心線にかかるカード（スマホで縦に積まれた層では、その全部）は道の輪郭、ほかは淡い輪郭
                var hits = row.filter(function (c) { return c.x <= X && X <= c.x + c.w; });
                var top = Math.min.apply(null, row.map(function (c) { return c.y; })), bot = Math.max.apply(null, row.map(function (c) { return c.y + c.h; }));
                row.forEach(function (c) { var o = rrect(c.x - 2, c.y - 2, c.w + 4, c.h + 4, 16); o.c = NM[k]; (hits.indexOf(c) < 0 ? outlines : route).push(o); });
                if (!hits.length) { var v = fromPts([X, bot, X, top]); v.c = NM[k]; route.push(v); }
                if (k < tiers.length - 1) {
                    var up = tiers[k + 1], ub = Math.max.apply(null, up.map(function (c) { return c.y + c.h; }));
                    // 層のあいだ：下の層の色から上の層の色へ（下から上へ、エネルギーが上がる）
                    var lk = fromPts([X, top, X, ub]); lk.c = NM[k]; lk.c2 = NM[k + 1]; lk.grad = 'along';
                    route.push(lk);
                }
            });
            var theme = tiers[tiers.length - 1][0];
            if (!outlines.length) outlines = route;
            var pR = picker(route, function (l) { return l.len; }), pO = picker(outlines, function (l) { return l.len; });
            var pm = picker(mine, function (l) { return l.len; }), pr = picker(rest, function (l) { return l.len; });
            var bRoute = Math.min(0.9, 3.4 * total(route) / (N * 0.34)), bMine = Math.min(0.9, 3.4 * total(mine) / (N * 0.1));
            var bO = Math.min(0.5, 0.7 * total(outlines) / (N * 0.16)), bRest = Math.min(0.5, 0.45 * total(rest) / (N * 0.16));
            for (var i = 0; i < N; i++) {
                var r = rnd(), l, q, j, x, y;
                if (r < 0.34) {
                    l = pR(); var tt = rnd(); q = onPoly(l, tt); j = gauss(1.1); x = q.x + q.nx * j; y = q.y + q.ny * j;
                    // 線の上の位置で色を混ぜる（1粒は1色なので、割合でグラデーションに見せる）
                    var col = l.grad ? (rnd() < Math.pow(tt, l === ext ? 1.6 : 1) ? l.c2 : l.c) : l.c;
                    put(3, i, x, y, bRoute, col, 4, dOf(y));
                }
                else if (r < 0.44) { l = pm(); q = onPoly(l, rnd()); j = gauss(1); x = q.x + q.nx * j; y = q.y + q.ny * j; put(3, i, x, y, bMine, l.c === 2 ? 2 : NAT, 1, dOf(y)); }
                else if (r < 0.60) { l = pO(); q = onPoly(l, rnd()); j = gauss(1); x = q.x + q.nx * j; y = q.y + q.ny * j; put(3, i, x, y, bO, l.c || 2, 1, dOf(y)); }
                else if (r < 0.76) { l = pr(); q = onPoly(l, rnd()); j = gauss(0.8); x = q.x + q.nx * j; y = q.y + q.ny * j; put(3, i, x, y, bRest, l.c, 1, dOf(y) * 0.3); }
                else if (r < 0.86) {
                    // テーマのカードの上から星空へ散る光（上へ行くほど淡い）
                    var up = Math.abs(gauss(isMobile ? 70 : 110));
                    put(3, i, theme.x + theme.w / 2 + gauss(theme.w * 0.32), theme.y - 6 - up, (0.05 + 0.14 * rnd()) * Math.sqrt(kN) * (1 - Math.min(1, up / 260)), rnd() < 0.5 ? 0 : NM[3], 3, 1);
                }
                else put(3, i, X, theme.y - 4, 0, 0, 0, 1);
            }
            pivots[3] = [X, (yTop + yBot) / 2];
            return true;
        }

        // 05 実り：カードの輪郭を流れる光（カードの色）・各カードの上の実・上の枝。カードの中には撒かない
        function buildFruits() {
            st = 0x55;
            var fs = [].map.call(fruitsBox.querySelectorAll('.fruit'), function (c) { return { x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), i: +c.getAttribute('data-i') }; });
            var bough = [].map.call(fruitsBox.querySelectorAll('.fruit-bough, .fruit-stem'), function (p) { return poly(p, 4); });
            var cards = [].map.call(fruitsBox.querySelectorAll('[data-fruit]'), function (c) {
                var o = rrect(c.offsetLeft - 3, c.offsetTop - 3, c.offsetWidth + 6, c.offsetHeight + 6, 26); o.i = +c.dataset.fruit; return o;
            });
            if (!fs.length || !bough.length || !cards.length) return false;
            var bB = Math.min(0.6, 0.55 * total(bough) / (N * 0.12)), pb = picker(bough, function (l) { return l.len; });
            var pc = picker(cards, function (l) { return l.len; }), bC = Math.min(0.8, 3.0 * total(cards) / (N * 0.4));
            var top = Math.min.apply(null, fs.map(function (f) { return f.y; }));
            for (var i = 0; i < N; i++) {
                var r = rnd(), f = fs[Math.floor(rnd() * fs.length)], l, q, t;
                if (r < 0.12) { l = pb(); q = onPoly(l, rnd()); put(4, i, q.x + q.nx * gauss(0.9), q.y + q.ny * gauss(0.9), bB, 2, 1); }
                else if (r < 0.34) put(4, i, f.x + gauss(5.5), f.y + gauss(5.5), 0.03 * kN, 10 + f.i, 0);
                else if (r < 0.44) put(4, i, f.x + gauss(18), f.y + gauss(18), 0.016 * kN, 10 + f.i, 2);
                else if (r < 0.84) {
                    // 輪郭：外側へ寄せて撒く（内側はカードの黒い下地に隠れる）。順番は輪郭の上の位置＝光が回る位相
                    l = pc(); t = rnd(); q = onPoly(l, t);
                    var off = Math.abs(gauss(2.2));
                    put(4, i, q.x - q.nx * off, q.y - q.ny * off, bC, 10 + l.i, 4, t);
                }
                else put(4, i, f.x, f.y, 0, 10 + f.i, 0);
            }
            pivots[4] = [fruitsBox.clientWidth / 2, top];
            return true;
        }

        // 06 一歩：ブラックホールの降着円盤（旧ホームの §34 を移植、§135.10）。粒子は円盤の上の (半径, 最初の角度) だけを持ち、
        // 角度はシェーダで θ = θ0 + 時間 × ω(r)、ω ∝ r^-1.5（ケプラー回転：内側ほど速い）で進める。傾けて投影する。
        // 塊（clump）は狭い半径に集まった粒子で、内側の塊が外側を追い越すので、差のある回転が目に見える。
        // 色は内縁で白、内側でシアン、中ほどで青、外縁で淡い赤（内側ほど高温）
        var bh = { cx: 0, cy: 0, rin: 300, rout: 520, cosI: 0.5 };
        function buildStep() {
            st = 0x66;
            if (!stepBox.__bh) return false;
            bh = stepBox.__bh;
            var RIN = bh.rin, ROUT = bh.rout, span = ROUT - RIN, clumps = [];
            for (var c = 0; c < 9; c++) clumps.push([RIN + span * Math.pow(rnd(), 0.8) * 0.85, rnd() * 6.2832, 0.5 + rnd()]);
            for (var i = 0; i < N; i++) {
                var r = rnd(), rr, th, x;
                if (r < 0.12) { rr = RIN * (1 + Math.abs(gauss(0.025))); th = rnd() * 6.2832; }
                else if (r < 0.4) { var cc = clumps[Math.floor(rnd() * clumps.length)]; rr = cc[0] + (rnd() * 2 - 1) * span * 0.05 * cc[2]; th = cc[1] + (rnd() * 2 - 1) * 0.45 * cc[2]; }
                else { rr = RIN + span * Math.pow(rnd(), 1.7); th = rnd() * 6.2832; }
                x = Math.max(0, Math.min(1, (rr - RIN) / span));
                var col = x < 0.06 ? 0 : x < 0.3 ? 1 : x < 0.78 ? 2 : NM[0];
                var b = (0.05 + 0.3 * Math.pow(1 - x, 2.2)) * kN * (col === NM[0] ? 0.7 : 1);
                // 順番（d）は粒子ごとの乱数：05 からの移り目で、吸い込まれる時期をずらす
                put(5, i, rr, th, b, col, 0, rnd());
            }
            pivots[5] = [bh.cx, bh.cy];
            return true;
        }

        /* ---- Three.js ------------------------------------------------------ */
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        var attrs = S.map(function (A, k) { var a = new THREE.BufferAttribute(A, 4); geo.setAttribute('aS' + k, a); return a; });
        var aZ = new THREE.BufferAttribute(Z0, 1); geo.setAttribute('aZ0', aZ);
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seedA, 1));

        var vertexShader = [
            'precision highp float;',
            'attribute vec4 aS0, aS1, aS2, aS3, aS4, aS5; attribute float aSeed, aZ0;',
            'uniform float uF, uTime, uScroll, uW, uH, uSize, uDPR, uHot, uR;',
            'uniform vec4 uBH; uniform vec2 uThemeC;',   // uThemeC：04 の THEME のカードの中心（ページの座標）   // ブラックホール：中心（06 の section の左上から）・内縁の半径・cos(傾き)
            'uniform vec2 uOff[6]; uniform vec2 uPiv[6]; uniform vec2 uRootSeed;',
            'uniform vec3 uPointer;',
            'uniform vec4 uQ[16]; uniform float uFilB;',   // 文字の箱（束が後ろを通るとき暗くする）と、束の明るさ
            'uniform vec3 uPal[' + NP + '];',
            'varying vec3 vCol; varying float vB;',
            // 旧ホーム（scroll-scenes.js）と同じ 3D simplex noise の curl
            'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
            'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
            'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
            'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
            'float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
            '  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);',
            '  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);',
            '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
            '  float ns_=0.142857142857;vec3 ns=ns_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
            '  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
            '  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
            '  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
            '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
            '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}',
            'vec3 snoiseVec3(vec3 p){return vec3(snoise(p),snoise(p+17.1),snoise(p-43.7));}',
            'vec3 curl(vec3 p){const float e=0.6;vec3 p0=snoiseVec3(p);vec3 px=snoiseVec3(p+vec3(e,0.,0.));vec3 py=snoiseVec3(p+vec3(0.,e,0.));vec3 pz=snoiseVec3(p+vec3(0.,0.,e));',
            '  return vec3((py.z-p0.z)-(pz.y-p0.y),(pz.x-p0.x)-(px.z-p0.z),(px.y-p0.y)-(py.x-p0.x))/e;}',
            'float bOf(float z){ return mod(z,4.0); }',
            'float dOf(float z){ return floor(z/4.0)/63.0; }',
            'float codeOf(float w){ return floor(fract(w)*10.0+0.5); }',
            'float swayOf(float w){ float c=codeOf(w); return c<0.5?0.35:(c>3.5?1.0:c); }',
            // 段4（流れ）：光の帯が順番の向きへ進む
            'float flowOf(float w, float d){ return codeOf(w)>3.5 ? 0.3+0.7*pow(0.5+0.5*sin(6.2832*(d*4.0-uTime*0.45)),3.0) : 1.0; }',
            'mat2 rot(float a){ return mat2(cos(a),-sin(a),sin(a),cos(a)); }',
            // 文字の箱の中なら 1、外へ 40px かけて 0
            'float inText(vec2 p){ float q=0.0; for(int i=0;i<16;i++){ vec4 r=uQ[i]; vec2 lo=r.xy-p, hi=p-r.zw; float o=max(max(lo.x,hi.x),max(lo.y,hi.y)); q=max(q, 1.0-smoothstep(0.0,40.0,o)); } return q; }',
            // 01：球（と輪）を Y 軸まわりに回し、少し傾けて遠近をつける。塵は平面でゆっくり回る
            'vec4 seedStage(){',
            '  vec2 c=uOff[0]; float b=bOf(aS0.z);',
            '  if(codeOf(aS0.w)>2.5){ return vec4(c+rot(uTime*0.025*(0.6+aSeed))*aS0.xy, b, aS0.w); }',
            '  vec3 q=vec3(aS0.x, aS0.y, aZ0); float spd=length(q)>1.3*uR ? 0.42 : 0.2;',
            '  q.xz=rot(uTime*spd)*q.xz; q.yz=rot(0.38)*q.yz;',
            '  float s=900.0/(900.0+q.z); float near=clamp(0.5-q.z/(2.6*uR),0.0,1.0);',
            '  return vec4(c+q.xy*s, b*mix(0.5,1.35,near), aS0.w); }',
            'vec4 stageOf(int k){',
            '  if(k==0) return seedStage();',
            '  if(k==1) return vec4(aS1.xy+uOff[1], bOf(aS1.z), aS1.w); if(k==2) return vec4(aS2.xy+uOff[2], bOf(aS2.z), aS2.w);',
            '  if(k==3) return vec4(aS3.xy+uOff[3], bOf(aS3.z), aS3.w); if(k==4) return vec4(aS4.xy+uOff[4], bOf(aS4.z), aS4.w);',
            // 06：降着円盤。ケプラー回転（角速度は r^-1.5、時間に比例して進むだけなので滑らか）。近づいてくる側（左）を少し明るく
            '  float rr=aS5.x, th=aS5.y+uTime*0.22*pow(uBH.z/rr,1.5);',
            '  vec2 q=vec2(rr*cos(th), rr*sin(th)*uBH.w+(aSeed-0.5)*5.0);',
            // スマホでは締めの文が影に収まらず円盤の上に載るので、文字の箱の後ろの円盤は 15% まで暗く（PC では影の中なので効かない）
            '  vec2 wp=uOff[5]+uBH.xy+q;',
            '  return vec4(wp, bOf(aS5.z)*(1.0-0.28*cos(th))*mix(1.0,0.15,inText(wp)), aS5.w); }',
            'float zOf(int k){ if(k==0) return aS0.z; if(k==1) return aS1.z; if(k==2) return aS2.z; if(k==3) return aS3.z; if(k==4) return aS4.z; return aS5.z; }',
            'vec3 palOf(float i){ int k=int(i+0.5); vec3 c=uPal[0];',
            '  for(int j=1;j<' + NP + ';j++){ if(j==k) c=uPal[j]; } return c; }',
            'void main(){',
            '  float F=clamp(uF,0.0,5.0); int iA=int(floor(F)); if(iA>4) iA=4;',
            '  float f=F-float(iA);',
            '  vec4 A=stageOf(iA), B=stageOf(iA+1);',
            '  float dA=dOf(zOf(iA)), dB=dOf(zOf(iA+1));',
            '  float bA=A.z*flowOf(A.w,dA), bB=B.z*flowOf(B.w,dB);',
            // 場面の近くでは形を保ち（0〜0.22 と 0.78〜1）、そのあいだで移る
            '  float te=smoothstep(0.14,0.86,f);',   // 形を保つのは場面の前後 14%。移り目を長めにとる
            '  vec2 p; float b; float sw=0.0; float mixT=te; float zd=0.0; vec3 colX=vec3(-1.0);',
            '  if(iA==0){',
            // 01→02：球が種のように縮んで根の種へ集まり（前半）、種から近い順に根が伸びる（後半）
            '    float u1=smoothstep(0.0,0.5,te), u2=smoothstep(0.5,1.0,te);',
            '    float g=smoothstep(dB*0.65, dB*0.65+0.35, u2);',
            '    vec2 rs=uRootSeed+uOff[1];',
            '    p = te<0.5 ? mix(A.xy, rs, u1) : mix(rs, B.xy, g);',
            '    b = te<0.5 ? mix(bA, bA*0.5, u1) : mix(bA*0.5, bB, g); mixT = te<0.5 ? 0.0 : g;',
            '  } else if(iA==2){',
            // 03→04（§135.11）：ばらけて、THEME へ集まる。
            //  ① ばらける（te 0〜0.35）：木の粒子は大分類の色ごとに 2 本ずつ（計 16 本）の「ゆるくうねる光の線」へ移り、線は画面全体に散らばる。粒子は線に沿って流れる
            //  ② 集まる（0.42〜0.85）：各線が曲線を描きながら（中心のまわりに回りつつ縮んで）THEME のカードへ寄る。線の形は保つ。色は大分類の色から THEME の青へ
            //  ③ 落ち着く（0.82〜1）：THEME に近い粒子から順に、04 のふだんの形（各層の輪郭・物理学の小さな枝）へ。初期宇宙から下の層へ灯っていく
            '    float h1=fract(sin(aSeed*12.9898)*43758.5453), h2=fract(sin(aSeed*78.233)*24634.6345), h3=fract(sin(aSeed*39.425)*11743.21);',
            '    float grp=clamp(floor(A.w+0.05)-2.0, 0.0, 7.0), lid=grp*2.0+floor(h1*2.0);',
            '    float r1=fract(sin(lid*17.13+1.0)*43758.5453), r2=fract(sin(lid*31.7+2.0)*24634.6345), r3=fract(sin(lid*7.77+3.0)*11743.21);',
            '    vec2 vc=vec2(uW*0.5, uScroll+uH*0.5);',
            '    vec2 ctr=vc+(vec2(r1,r2)-0.5)*vec2(uW*0.78,uH*0.72);',
            '    float ang=r3*6.2832+uTime*0.05*(r1-0.5); vec2 dr=vec2(cos(ang),sin(ang)), nr=vec2(-dr.y,dr.x);',
            '    float len=(0.32+0.26*r2)*length(vec2(uW,uH)), sl=fract(h2+uTime*0.04*(0.6+0.8*r1));',
            '    vec2 Ls=ctr+dr*(sl-0.5)*len+nr*(uH*0.07*sin(6.2832*(sl*1.3+r1)+uTime*0.5)+(h3-0.5)*3.0);',
            '    float sc=smoothstep(0.0,0.35,te), cv=smoothstep(0.42,0.85,te);',
            // 線の先頭（sl が小さい側）から順に THEME へ流れ込む。尾はまだ遠くにあるので、最後まで曲がった光の流れとして見える。
            // 近づくほど THEME のまわりを回る（らせん状に寄る）
            '    float k=smoothstep(0.0,1.0,cv*1.5-sl*0.5);',
            '    float th=k*(1.6+1.4*r1)*(r2<0.5?-1.0:1.0);',
            '    vec2 Lc=uThemeC+rot(th)*(Ls-uThemeC)*(1.0-k);',
            '    vec2 P1=mix(A.xy, Lc, sc);',
            '    float dn=clamp(length(B.xy-uThemeC)/(uH*1.2),0.0,1.0), g=smoothstep(0.82+0.12*dn, 0.88+0.12*dn, te);',
            '    p=mix(P1,B.xy,g);',
            '    float lb=uFilB*(0.75+0.5*h3);',
            '    b=mix(mix(bA,lb,sc), bB, g); mixT=g;',
            '    colX=mix(mix(palOf(A.w), palOf(14.0), cv), palOf(B.w), g);',
            '    b*=mix(1.0, 0.1, (1.0-smoothstep(0.92,1.0,g))*smoothstep(0.0,0.1,sc)*inText(p));',
            '  } else if(iA==4){',
            // 05→06（§135.10）：実と輪郭の粒子が舞い上がり、ブラックホールのまわりを回りながら半径を縮めて（らせん状に吸い込まれ）、
            // 降着円盤のいまの位置に着く。円盤の面で考えて、角度を 1.5 周ぶん余分に回す
            '    vec2 C=uOff[5]+uBH.xy;',
            '    float g=smoothstep(dB*0.35, dB*0.35+0.65, te), g2=smoothstep(0.2,1.0,g);',
            '    vec2 p0=A.xy+vec2(sin(aSeed*31.0+uTime)*18.0, -140.0*smoothstep(0.0,0.4,g));',
            '    vec2 va=(p0-C)/vec2(1.0,uBH.w), vb=(B.xy-C)/vec2(1.0,uBH.w);',
            '    float ra=length(va), rb=length(vb), aa=atan(va.y,va.x), ab=atan(vb.y,vb.x);',
            '    float dA2=ab-aa; dA2-=6.2832*floor((dA2+3.14159)/6.2832);',
            '    float an=aa+(dA2+6.2832*1.5)*g2, rad=mix(ra,rb,g2);',
            '    p=C+vec2(cos(an),sin(an)*uBH.w)*rad;',
            '    b=mix(bA,bB,g2); mixT=g2;',
            '    b*=mix(1.0, 0.1, (1.0-smoothstep(0.9,1.0,g2))*step(0.001,g)*inText(p));',
            '  } else {',
            // 捩れた線の束（§135.9）：粒子は 3 本の束 × 各 4 本の線（計 12 本）のどれかに乗り、線に沿って流れる。
            // 束は画面をうねりながら横切り、4 本の線は束の芯のまわりを捩れ合う。移り目の真ん中（0.3〜0.7）は束のまま保ち、
            // 両端で前の形から束へ、束から次の形へ。束は画面に固定（スクロールしても画面の中にある）
            '    float env=smoothstep(0.0,0.3,te)*(1.0-smoothstep(0.7,1.0,te)); sw=env;',
            '    float h1=fract(sin(aSeed*12.9898)*43758.5453), h2=fract(sin(aSeed*78.233)*24634.6345), h3=fract(sin(aSeed*39.425)*11743.21);',
            '    float fid=floor(h1*12.0), bu=floor(fid/4.0), sd=mod(fid,4.0);',
            '    float sl=fract(h2+uTime*0.05*(0.8+0.4*h3));',   // 線の上の位置（流れる）
            '    float an=-0.42+bu*0.42+0.12*sin(uTime*0.11+bu*1.7);',
            '    vec2 dr=vec2(cos(an),sin(an)), nr=vec2(-dr.y,dr.x);',
            '    vec2 vc=vec2(uW*0.5, uScroll+uH*0.5);',
            '    float Lf=1.3*length(vec2(uW,uH));',
            '    vec2 fp=vc+dr*(sl-0.5)*Lf + nr*((bu-1.0)*uH*0.26 + uH*0.16*sin(6.2832*sl*(0.9+0.35*bu)+uTime*0.35+bu*2.1));',
            '    float tw=6.2832*(sl*(2.2+0.8*bu)-uTime*0.22)+sd*1.5708;',   // 束の芯のまわりの捩れ
            '    float rad=(22.0+9.0*bu)*(0.75+0.25*sin(6.2832*sl*1.3+bu));',
            // 1本の線の太さは ±1.5px（線どうしが混ざって帯にならないように）
            '    fp+=nr*rad*sin(tw)+dr*rad*0.35*cos(tw)+nr*(h3-0.5)*3.0;',
            '    p=mix(mix(A.xy,B.xy,te), fp, env);',
            '    b=mix(mix(bA,bB,te), uFilB*(0.75+0.5*h3), env);',
            // 文字の後ろを通るあいだは暗く。移り目の入り口から早めに効かせる（形から束へ動き出した明るい粒子が文字を横切るため）
            '    b*=mix(1.0, 0.1, smoothstep(0.0,0.12,env)*inText(p));',
            '  }',
            // 揺らぎ（旧ホームと同じ式）。名前の近くは小さく、塵は大きく。渦の途中は大きく散らす
            '  float spd=0.9+aSeed*0.6;',
            '  vec3 cn=curl(vec3(mix(A.xy,B.xy,mixT)*0.0019, uTime*0.15*spd)+aSeed*7.0);',
            '  p+=cn.xy*2.4*mix(swayOf(A.w),swayOf(B.w),mixT)*(1.0-0.8*sw);',   // 束の中では揺らぎを抑える（線の形を保つ）
            // ポインタ：近くの粒子をゆるく押しのける
            '  vec2 dp=p-uPointer.xy; float gp=exp(-dot(dp,dp)/(2.0*85.0*85.0))*uPointer.z;',
            '  p+=normalize(dp+vec2(0.0001))*gp*34.0;',
            // 05：カードに触れているあいだ、その実と輪郭を明るく
            '  float hot=max(step(abs(floor(A.w+0.05)-uHot),0.1)*(1.0-mixT), step(abs(floor(B.w+0.05)-uHot),0.1)*mixT); b*=1.0+1.8*hot;',
            '  vCol = colX.x>=0.0 ? colX : mix(palOf(A.w),palOf(B.w),mixT);',
            '  vB=b;',
            '  gl_Position=vec4(p.x/uW*2.0-1.0, 1.0-(p.y-uScroll)/uH*2.0, 0.0, 1.0);',
            '  gl_PointSize=uSize*uDPR*(0.75+0.5*aSeed)*(1.0+0.6*step(0.9,b))*(1.0+0.45*zd);',   // 03→04 の手前の粒子は大きく
            '}'
        ].join('\n');
        var fragmentShader = [
            'precision highp float;',
            'varying vec3 vCol; varying float vB;',
            'void main(){ vec2 uv=gl_PointCoord-0.5; float d=length(uv); if(d>0.5) discard;',
            '  float k=min(1.0, vB*smoothstep(0.5,0.0,d)); vec3 c=vCol*k;',
            // 乗算済みの色（c）と、α＝いちばん明るい色の成分。色が α を超えない正しい乗算済みの画素にする（§135.6）
            '  gl_FragColor=vec4(c, max(c.r,max(c.g,c.b))); }'
        ].join('\n');

        var uniforms = {
            uF: { value: 0 }, uTime: { value: 0 }, uScroll: { value: 0 },
            uW: { value: window.innerWidth }, uH: { value: window.innerHeight },
            uSize: { value: isMobile ? 2.6 : 2.4 }, uDPR: { value: DPR },
            uOff: { value: [0, 1, 2, 3, 4, 5].map(function () { return new THREE.Vector2(); }) },
            uPiv: { value: [0, 1, 2, 3, 4, 5].map(function () { return new THREE.Vector2(); }) },
            uRootSeed: { value: new THREE.Vector2() }, uR: { value: 150 },
            uPointer: { value: new THREE.Vector3(-9999, -9999, 0) },
            uHot: { value: -1 }, uBH: { value: new THREE.Vector4(0, 0, 300, 0.5) }, uThemeC: { value: new THREE.Vector2() },
            uQ: { value: Array.apply(null, Array(16)).map(function () { return new THREE.Vector4(-1e5, -1e5, -1e5, -1e5); }) },
            uFilB: { value: (isMobile ? 0.5 : 0.42) * Math.sqrt(kN) },   // 束の1粒の明るさ（束に重なるので、ひと粒は控えめでも線は明るい）
            uPal: { value: PAL.map(function (h) { return new THREE.Color(h); }) }
        };
        var material = new THREE.ShaderMaterial({
            uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader,
            transparent: true, depthWrite: false, depthTest: false,
            // 乗算済みの色をそのまま足す（色も α も One×One）。§135.6
            blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
            blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor
        });
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setClearColor(0x000000, 0);
        var scene = new THREE.Scene(), camera = new THREE.Camera();
        var points = new THREE.Points(geo, material); points.frustumCulled = false; scene.add(points);

        /* ---- 撒き直し（形が描き直されたとき） -------------------------------- */
        var builds = 0, builtW = 0;
        function rebuild() {
            builds++; builtW = treeBox.clientWidth;
            buildSeed();
            var ok = buildRoots() && buildTree() && buildBranch() && buildFruits() && buildStep();
            attrs.forEach(function (a) { a.needsUpdate = true; }); aZ.needsUpdate = true;
            pivots.forEach(function (p, k) { uniforms.uPiv.value[k].set(p[0], p[1]); });
            uniforms.uR.value = R0; uniforms.uRootSeed.value.set(rootSeed.x, rootSeed.y);
            uniforms.uBH.value.set(bh.cx, bh.cy, bh.rin, bh.cosI);
            return ok;
        }
        var rebuildTimer = null;
        document.addEventListener('treelayout', function () {
            clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 60);
        });

        /* ---- 箱の位置とスクロール → 場面の番号 ---------------------------------- */
        var centers = [0, 0, 0, 0, 0, 0], K = 6;
        var themeCard = vizBox.querySelector('.rs-tier--theme .rs-card') || vizBox;
        // 束や飛んでいる粒子が後ろを通るとき暗くする文字の箱（最大 16）。研究の階層の層ラベルと凡例も
        var textEls = [].slice.call(document.querySelectorAll('.home-seed__inner, .home-block__head, .tree-note, .home-step__inner, .home-branch__more, .roots__tip, [data-branch-viz] .rs-tier__label')).slice(0, 16);
        function readBoxes() {
            var sy = window.scrollY, sx = window.scrollX, o = uniforms.uOff.value, H = window.innerHeight;
            var g = seedEl.getBoundingClientRect();
            o[0].set(g.left + g.width / 2 + sx, g.top + g.height / 2 + sy);
            centers[0] = g.top + g.height / 2 + sy;
            [rootsBox, treeBox, vizBox, fruitsBox, stepBox].forEach(function (b, k) {
                var r = b.getBoundingClientRect();
                o[k + 1].set(r.left + sx, r.top + sy);
                centers[k + 1] = r.top + sy + r.height / 2;
            });
            var thc = themeCard.getBoundingClientRect();
            uniforms.uThemeC.value.set(thc.left + thc.width / 2 + sx, thc.top + thc.height / 2 + sy);
            textEls.forEach(function (e, k) { var q = e.getBoundingClientRect(); uniforms.uQ.value[k].set(q.left + sx, q.top + sy, q.right + sx, q.bottom + sy); });
            // 縦長の木は中心で揃えると、上の方を読んでいるあいだ形が崩れたままになる。
            // 木の上端が画面の中ほどに来たところを、この場面の中心にする
            var t = treeBox.getBoundingClientRect();
            centers[2] = t.top + sy + Math.min(t.height, H) * 0.35;
            // 04 も縦に長いので、階層の上端が画面の中ほどに来たところで形が整うように
            var v = vizBox.getBoundingClientRect();
            centers[3] = v.top + sy + Math.min(v.height, H) * 0.45;
            // 06 はページの最後。いちばん下まで送っても中心に届かないときは、届く所まで上げる
            var maxMid = document.documentElement.scrollHeight - H + H / 2;
            centers[5] = Math.min(centers[5], maxMid - 1);
            for (var k = 1; k < K; k++) centers[k] = Math.max(centers[k], centers[k - 1] + 1);
        }
        function sceneFor(mid) {
            if (mid <= centers[0]) return 0;
            for (var k = 0; k < K - 1; k++) if (mid < centers[k + 1]) return k + (mid - centers[k]) / Math.max(1, centers[k + 1] - centers[k]);
            return K - 1;
        }

        /* ---- ポインタ（マウスは乗っているあいだ、タッチは触れているあいだ） ---- */
        var ptr = { x: -9999, y: -9999, on: 0, s: 0 };
        window.addEventListener('pointermove', function (e) {
            if (e.pointerType === 'touch' && !e.isPrimary) return;
            ptr.x = e.clientX; ptr.y = e.clientY + window.scrollY;
            if (e.pointerType === 'mouse') ptr.on = 1;
        }, { passive: true });
        window.addEventListener('pointerdown', function (e) { ptr.x = e.clientX; ptr.y = e.clientY + window.scrollY; ptr.on = 1; }, { passive: true });
        ['pointerup', 'pointercancel'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (e.pointerType !== 'mouse') ptr.on = 0; }, { passive: true }); });
        document.documentElement.addEventListener('pointerleave', function () { ptr.on = 0; });

        /* ---- 描く ------------------------------------------------------------ */
        var fEased = 0, clock = 0, lastT = null, running = false, raf = null, fpsN = 0, fpsT = 0, fps = 0;
        function frame(now) {
            raf = null; if (!running) return;
            if (lastT == null) lastT = now;
            var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;
            fpsN++; fpsT += dt; if (fpsT > 1) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
            readBoxes();
            var target = sceneFor(window.scrollY + window.innerHeight / 2);
            // 追いつく速さに上限（1秒に 0.8 場面）：素早くスクロールしても、移り目の束が一瞬で終わらず
            // 0.5 秒ほど見えてから次の形へ。ふつうの速さのスクロールは上限より遅いので、そのまま追従する
            // 03→04 は「ばらける」と「集まる」の2段なので、ここだけ上限を 0.45 場面/秒に（それぞれが約 0.5 秒見える。§135.11）
            var gap = target - fEased, stepF = gap * Math.min(1, dt * 2.6), cap = dt * (fEased > 2.05 && fEased < 2.95 ? 0.45 : 0.8);
            fEased += Math.max(-cap, Math.min(cap, stepF));
            ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * Math.min(1, dt * 4);
            uniforms.uF.value = fEased; uniforms.uTime.value = clock; uniforms.uScroll.value = window.scrollY;
            uniforms.uPointer.value.set(ptr.x, ptr.y, ptr.s);
            uniforms.uHot.value = fruitsBox.dataset.hot ? 10 + (+fruitsBox.dataset.hot) : -1;
            renderer.render(scene, camera);
            raf = requestAnimationFrame(frame);
        }
        function start() { if (running) return; running = true; lastT = null; raf = requestAnimationFrame(frame); }
        function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                DPR = Math.min(window.devicePixelRatio || 1, 1.5);
                renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight);
                uniforms.uW.value = window.innerWidth; uniforms.uH.value = window.innerHeight; uniforms.uDPR.value = DPR;
            }, 120);
        });
        document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

        if (!rebuild()) { canvas.remove(); return; }
        readBoxes(); fEased = sceneFor(window.scrollY + window.innerHeight / 2);
        start();
        // 最初の1枚が描けてから、静的な SVG を粒子に譲る（白い間をつくらない）
        requestAnimationFrame(function () {
            canvas.classList.add('is-ready');
            document.documentElement.classList.add('has-particles');
        });

        // 計測・撮影用
        window.__field = {
            count: N,
            fps: function () { return fps; },
            sceneF: function () { return fEased; },
            scrollFor: function (f) { readBoxes(); var k = Math.min(K - 2, Math.floor(f)), u = f - k; return centers[k] + (centers[k + 1] - centers[k]) * u - window.innerHeight / 2; },
            pause: stop, resume: start,
            builds: function () { return builds; }, builtW: function () { return builtW; },
            // 木の葉（小枝の先）の目標を、ページの座標で返す（名前との位置合わせの確認用）
            tips: function () {
                readBoxes(); var o = uniforms.uOff.value[2], L = window.__tree;
                return L.nodes.map(function (n) { return { e: n.e, x: n.x + o.x, y: n.y + o.y, align: n.align }; });
            }
        };
    }
})();

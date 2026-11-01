/* ============================================================================
   academic-tree.js — index.html の「学問の樹」（DESIGN.md §135）

   ★ データは index.html の入れ子のリスト（.tree__data）だけ。ここはそれを読んで
   形を決める。分類・学問・細分野を足すと、枝の数も配置も自動で変わる。
     分類   li.tree-cat[data-cat]  > h3.tree-cat__name
     学問   li[data-key]           > .tree-node（<a> ならリンク、<span> なら準備中）

   やること
     1. 名前（HTML の要素）を木の枝先に並べる。文字は canvas に描かない
     2. 枝・幹・種を SVG で描く（静止した完成形）。粒子のエンジンが
        動けない場合（動きを減らす設定・WebGL 無し）はこれがそのまま木になる
     3. 02 の根（.roots）を描き、先に「学び方」を置く
     4. 04 の小さな木（物理学の枝が星空へ伸びる）と、05 の実（カードの上の枝と実）を描く
     5. 配置を window.__tree に出し、描き直すたびに 'treelayout' を送る
        （js/tree-scenes.js の粒子は、この SVG の線そのものから位置を取る）

   広い画面：分類ごとの列を横に7本並べ、列の上端を弧に揃える（樹冠）。
   狭い画面：中央の幹から左右に分類を振り分ける縦長の木。
   ============================================================================ */
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');
    var SVGNS = 'http://www.w3.org/2000/svg';

    /* ---- フェードイン（self-intro.js と同じ条件・閾値） ------------------ */
    (function initReveals() {
        var els = document.querySelectorAll('.reveal');
        if (!els.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-visible'); }); return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        els.forEach(function (el) { io.observe(el); });
    })();

    /* ---- 決まった乱数（毎回同じ根の形にする） ----------------------------- */
    function prng(a) {
        return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    }

    function el(name, attrs) {
        var e = document.createElementNS(SVGNS, name);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }
    function f1(n) { return Math.round(n * 10) / 10; }
    function curve(p0, p1, p2, p3) {
        return 'M' + f1(p0.x) + ' ' + f1(p0.y) + 'C' + f1(p1.x) + ' ' + f1(p1.y) + ' ' + f1(p2.x) + ' ' + f1(p2.y) + ' ' + f1(p3.x) + ' ' + f1(p3.y);
    }

    /* ======================================================================
       学問の樹
       ====================================================================== */
    var tree = document.querySelector('[data-tree]');
    if (tree) initTree(tree);

    function readTree(box) {
        return [].map.call(box.querySelectorAll('.tree__data > .tree-cat'), function (c) {
            // 分類 → 学問の2段（§135.8 で細分野をやめた）
            var ul = c.querySelector(':scope > ul');
            var subjects = ul ? [].filter.call(ul.children, function (li) { return li.tagName === 'LI'; }).map(function (li) {
                return { li: li, node: li.querySelector(':scope > .tree-node'), key: li.dataset.key || '' };
            }) : [];
            return { li: c, cat: c.dataset.cat || '', label: c.querySelector(':scope > .tree-cat__name'), subjects: subjects };
        });
    }

    function initTree(box) {
        var cats = readTree(box);
        if (!cats.length) return;
        var svg = el('svg', { class: 'tree__svg', 'aria-hidden': 'true', focusable: 'false' });
        box.insertBefore(svg, box.firstChild);
        box.classList.add('is-laid');


        var lastW = -1;
        function layout() {
            var W = box.clientWidth;
            if (!W || W === lastW) return;
            lastW = W;
            var L = W >= 900 ? layoutWide(cats, W) : layoutTall(cats, W);
            draw(L, W);
            window.__tree = L;
            // 04 の小さな木は、画面の幅に関係なく横に広い形で描く（縦長の木を縮めると細すぎる）
            window.__treeWide = layoutWide(cats, 1000); window.__treeWide.width = 1000;
            box.dispatchEvent(new CustomEvent('treelayout', { bubbles: true }));
        }

        /* ---- 名前の箱の大きさ（is-laid で絶対配置になったあとに測る） ---- */
        function size(e) { return { w: e.offsetWidth, h: e.offsetHeight }; }
        function place(e, x, y) { e.style.left = f1(x) + 'px'; e.style.top = f1(y) + 'px'; }
        var ROW = 36, TWIG = 14;

        /* 広い画面：列ごとに、下に分類名、その上に学問・細分野を積む。
           列の下端（＝分類の節）を弧に並べて、中央ほど高い樹冠にする。 */
        function layoutWide(cats, W) {
            var n = cats.length, colW = W / n, arcH = 64, top = 8;
            var cols = cats.map(function (c, i) {
                var rows = c.subjects;
                var h = rows.length * ROW;
                var t = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0;
                return { c: c, rows: rows, h: h, lift: arcH * (1 - t * t), stemX: colW * i + 14 };
            });
            var A = top + Math.max.apply(null, cols.map(function (k) { return k.h + k.lift; }));
            var fork = { x: W / 2, y: A + 130 }, seed = { x: W / 2, y: A + 290 };
            return build(cols.map(function (k) {
                var base = A - k.lift;                         // 積み上げの下端
                var y = base - k.h, items = [];
                k.rows.forEach(function (r) {
                    items.push({ n: r, x: k.stemX + TWIG, y: y + ROW / 2, align: 'left' });
                    y += ROW;
                });
                var lab = { x: k.stemX + TWIG, y: base + 4 + ROW / 2 };
                return { c: k.c, stemX: k.stemX, items: items, label: lab, side: 1 };
            }), fork, seed, seed.y + 34, 'wide');
        }

        /* 狭い画面：中央の幹の左右へ、分類を交互に（短い側へ）積む。
           どの分類も「上に学問、下に分類名」。枝は幹から分類名へ上がる。 */
        function layoutTall(cats, W) {
            var mid = W / 2, gap = 30, h = [8, 8], cols = [];
            cats.forEach(function (c, i) {
                var side = h[1] < h[0] ? 1 : h[0] < h[1] ? 0 : (i % 2 ? 0 : 1);
                var rows = c.subjects;
                var y = h[side], items = [];
                var stemX = side ? mid + 20 : mid - 20, dir = side ? 1 : -1;
                rows.forEach(function (r) {
                    items.push({ n: r, x: stemX + dir * TWIG, y: y + ROW / 2, align: side ? 'left' : 'right' });
                    y += ROW;
                });
                var lab = { x: stemX + dir * TWIG, y: y + 4 + ROW / 2 };
                h[side] = y + 4 + ROW + gap;
                cols.push({ c: c, stemX: stemX, items: items, label: lab, side: dir });
            });
            var bottom = Math.max(h[0], h[1]) + 40;
            var seed = { x: mid, y: bottom + 60 };
            return build(cols, { x: mid, y: bottom }, seed, seed.y + 34, 'tall');
        }

        /* 配置から、名前の位置と枝の線を作る */
        function build(cols, fork, seed, H, mode) {
            var branches = [], nodes = [];
            // 幹
            branches.push({ level: 0, cat: '', d: curve(seed, { x: seed.x + 6, y: seed.y - (seed.y - fork.y) * 0.4 }, { x: fork.x - 6, y: fork.y + (seed.y - fork.y) * 0.4 }, fork) });
            cols.forEach(function (k) {
                var cat = k.c.cat, lab = k.label, node = { x: k.stemX, y: lab.y };
                // 枝：幹（広い画面は分かれ目、狭い画面は分類名の高さの少し下）から分類の節へ
                var from = mode === 'wide' ? fork : { x: fork.x, y: Math.min(fork.y, lab.y + 46) };
                branches.push({ level: 1, cat: cat, d: curve(from, { x: from.x, y: from.y - (mode === 'wide' ? 60 : 20) }, { x: node.x, y: node.y + (mode === 'wide' ? 80 : 26) }, node) });
                // 列の茎：分類の節から、いちばん上の名前まで
                var topY = k.items.length ? k.items[0].y : node.y;
                branches.push({ level: 2, cat: cat, d: 'M' + f1(node.x) + ' ' + f1(node.y) + 'L' + f1(node.x) + ' ' + f1(topY) });
                // 小枝：茎から分類名・学問へ
                branches.push({ level: 3, cat: cat, d: 'M' + f1(node.x) + ' ' + f1(lab.y) + 'L' + f1(lab.x) + ' ' + f1(lab.y) });
                nodes.push({ e: k.c.label, x: lab.x, y: lab.y, align: k.side > 0 ? 'left' : 'right', cat: cat, kind: 'cat' });
                k.items.forEach(function (it) {
                    branches.push({ level: 3, cat: cat, key: it.n.key, d: 'M' + f1(k.stemX) + ' ' + f1(it.y) + 'L' + f1(it.x) + ' ' + f1(it.y) });
                    nodes.push({ e: it.n.node, x: it.x, y: it.y, align: it.align, cat: cat, kind: 'subject', key: it.n.key });
                });
            });
            // 狭い画面では幹が分かれ目より上へ続き、いちばん上の枝の根元まで伸びる
            if (mode === 'tall') {
                var topFrom = Math.min.apply(null, cols.map(function (k) { return Math.min(fork.y, k.label.y + 46); }));
                branches.splice(1, 0, { level: 0, cat: '', d: 'M' + f1(fork.x) + ' ' + f1(fork.y) + 'L' + f1(fork.x) + ' ' + f1(topFrom - 10) });
            }
            return { mode: mode, height: H, seed: seed, fork: fork, branches: branches, nodes: nodes, cols: cols };
        }

        function draw(L, W) {
            box.style.height = Math.ceil(L.height) + 'px';
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Math.ceil(L.height));
            svg.setAttribute('width', W); svg.setAttribute('height', Math.ceil(L.height));
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            var gB = el('g', { class: 'tree__branches' });
            svg.appendChild(gB);
            L.branches.forEach(function (b) {
                var p = el('path', { d: b.d, class: 'tree-branch tree-branch--' + b.level });
                if (b.cat) p.style.setProperty('--tint', 'var(--tint-' + b.cat + ')');
                if (b.key) p.setAttribute('data-key', b.key);
                gB.appendChild(p);
            });
            var s = L.seed;
            svg.appendChild(el('circle', { class: 'tree-seed__halo', cx: s.x, cy: s.y, r: 22 }));
            svg.appendChild(el('circle', { class: 'tree-seed', cx: s.x, cy: s.y, r: 4.5 }));

            // 名前：x は茎側の端（left なら左端、right なら右端）、y は中央
            L.nodes.forEach(function (nd) {
                var z = size(nd.e);
                place(nd.e, nd.align === 'left' ? nd.x : nd.x - z.w, nd.y - z.h / 2);
            });
        }

        function relayout() { lastW = -1; layout(); }
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(relayout);
        layout();
        if ('ResizeObserver' in window) new ResizeObserver(layout).observe(box);
        else window.addEventListener('resize', layout);
    }

    /* ======================================================================
       02 の根：種から下へ枝分かれする根。1本だけ「学び方」へ伸ばす
       ====================================================================== */
    var roots = document.querySelector('[data-roots]');
    if (roots) initRoots(roots);

    function initRoots(box) {
        var tip = box.querySelector('.roots__tip');
        var svg = el('svg', { class: 'roots__svg', 'aria-hidden': 'true', focusable: 'false' });
        box.insertBefore(svg, box.firstChild);
        box.classList.add('is-laid');
        var lastW = -1;

        function draw() {
            var W = box.clientWidth; if (!W || W === lastW) return; lastW = W;
            var H = box.clientHeight;
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
            svg.setAttribute('width', W); svg.setAttribute('height', H);
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            var rnd = prng(20261101);
            // 根は横に画面の大部分、下にも長く（§135.8）。長さは正規化した単位で決め、横と縦で別の倍率をかける
            var seed = { x: W / 2, y: 16 }, SX = W * 0.17, SY = (H - 30) * 0.31;

            function grow(x, y, ang, len, depth, width) {
                var ex = x + Math.sin(ang) * len * SX, ey = y + Math.cos(ang) * len * SY;
                var bend = (rnd() - 0.5) * len * Math.min(SX, SY) * 0.5;
                var cx = (x + ex) / 2 + Math.cos(ang) * bend, cy = (y + ey) / 2 - Math.sin(ang) * bend;
                svg.appendChild(el('path', { class: 'root', d: 'M' + f1(x) + ' ' + f1(y) + 'Q' + f1(cx) + ' ' + f1(cy) + ' ' + f1(ex) + ' ' + f1(ey), 'stroke-width': f1(width) }));
                if (depth <= 0) return;
                var k = 2 + (rnd() < 0.35 ? 1 : 0);
                for (var i = 0; i < k; i++) grow(ex, ey, ang + (rnd() - 0.5) * 1.1, len * (0.55 + rnd() * 0.2), depth - 1, width * 0.62);
            }
            [-1.2, -0.7, -0.25, 0.2, 0.65, 1.15].forEach(function (a) { grow(seed.x, seed.y, a + (rnd() - 0.5) * 0.15, 0.95 + rnd() * 0.25, 3, 2.4); });

            // 「学び方」へ伸びる1本：種から右下の名前の左端へ
            var tz = { w: tip.offsetWidth, h: tip.offsetHeight };
            var tx = Math.min(W - tz.w - 4, W / 2 + Math.max(60, W * 0.2)), ty = H - tz.h - 6;
            tip.style.left = f1(tx) + 'px'; tip.style.top = f1(ty) + 'px';
            var end = { x: tx, y: ty + tz.h / 2 };
            svg.appendChild(el('path', { class: 'root root--path', d: curve(seed, { x: seed.x + 6, y: seed.y + (end.y - seed.y) * 0.55 }, { x: end.x - (end.x - seed.x) * 0.45, y: end.y }, end) }));
            svg.appendChild(el('circle', { class: 'tree-seed__halo', cx: seed.x, cy: seed.y, r: 18 }));
            svg.appendChild(el('circle', { class: 'tree-seed', cx: seed.x, cy: seed.y, r: 4 }));
            box.dispatchEvent(new CustomEvent('treelayout', { bubbles: true }));
        }
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { lastW = -1; draw(); });
        draw();
        if ('ResizeObserver' in window) new ResizeObserver(draw).observe(box);
        else window.addEventListener('resize', draw);
    }
})();

/* ==========================================================================
   04 私の枝・05 実り（§135.5）。どちらも静的な SVG を描き、粒子のエンジンはそこから形を取る。
   ========================================================================== */
(function () {
    'use strict';
    var SVGNS = 'http://www.w3.org/2000/svg';
    function el(name, attrs) { var e = document.createElementNS(SVGNS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function f1(n) { return Math.round(n * 10) / 10; }
    function done(box) { box.dispatchEvent(new CustomEvent('treelayout', { bubbles: true })); }
    function watch(box, draw) {
        var lastW = -1, lastH = -1;
        // 高さだけが変わったときも描き直す（字の読み込みやカードの「準備中」で、カードの高さが後から変わる）
        function go(force) { var W = box.clientWidth, H = box.clientHeight; if (!W || (!force && W === lastW && H === lastH)) return; lastW = W; lastH = H; draw(W, H); }
        document.addEventListener('treelayout', function (e) { if (e.target.matches && e.target.matches('[data-tree]')) go(true); });
        if ('ResizeObserver' in window) new ResizeObserver(function () { go(false); }).observe(box);
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { go(true); });
        go(true);
    }

    /* ---- 04：階層の下に学問の樹を小さく描き、物理学の枝（幹・自然科学の枝と茎・物理学の小枝）だけを
       明るくして、物理学から上へ、階層のいちばん下（基礎分野のカードの下辺の中央）まで伸ばす ---- */
    var fig = document.querySelector('[data-branch]');
    if (fig) {
        var svg = el('svg', { class: 'branch__svg', 'aria-hidden': 'true', focusable: 'false' });
        fig.insertBefore(svg, fig.firstChild);
        var tagP = fig.querySelector('.branch__tag--physics');
        fig.classList.add('is-laid');
        watch(fig, function (W, H) {
            var L = window.__treeWide; if (!L) return;
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
            var s = Math.min(W * 0.98 / L.width, H * 0.72 / L.height);
            var tx = (W - L.width * s) / 2, ty = H - L.height * s;
            var g = el('g', { class: 'branch-mini', transform: 'translate(' + f1(tx) + ' ' + f1(ty) + ') scale(' + s.toFixed(4) + ')', 'data-s': s, 'data-tx': tx, 'data-ty': ty });
            svg.appendChild(g);
            L.branches.forEach(function (b) {
                var mine = b.level === 0 || (b.cat === 'natural' && b.level <= 2) || b.key === 'physics';
                var p = el('path', { d: b.d, class: 'mini-branch mini-branch--' + b.level + (mine ? ' is-mine' : '') });
                if (b.cat) p.style.setProperty('--tint', 'var(--tint-' + b.cat + ')');
                g.appendChild(p);
            });
            var pn = L.nodes.filter(function (n) { return n.key === 'physics'; })[0];
            var P = { x: tx + pn.x * s, y: ty + pn.y * s };
            // 伸びる先：基礎分野のカードの下辺の中央（図の上端より上。図と階層のあいだの余白をまたぐ）
            var fc = document.querySelector('[data-branch-viz] .rs-tier--foundations .rs-card');
            var T = { x: W / 2, y: 0 };
            if (fc) {
                var a = 0, t = 0, e = fc; while (e && e !== fig.offsetParent) { a += e.offsetLeft; t += e.offsetTop; e = e.offsetParent; }
                T = { x: a + fc.offsetWidth / 2 - fig.offsetLeft, y: t + fc.offsetHeight - fig.offsetTop };
            }
            // 伸びた枝の色：物理学の枝（自然科学の色）から、流れ込む基礎分野の赤（650nm）へ（§135.9）
            var grad = el('linearGradient', { id: 'branch-ext-grad', gradientUnits: 'userSpaceOnUse', x1: f1(P.x), y1: f1(P.y), x2: f1(T.x), y2: f1(T.y) });
            var s0 = el('stop', { offset: '0' }), s1 = el('stop', { offset: '0.45' }), s2 = el('stop', { offset: '1' });
            s0.style.stopColor = 'var(--tint-natural)'; s1.style.stopColor = 'var(--tint-natural)'; s2.style.stopColor = 'var(--nm-650)';
            grad.appendChild(s0); grad.appendChild(s1); grad.appendChild(s2);
            var defs = el('defs', {}); defs.appendChild(grad); svg.appendChild(defs);
            var ext = el('path', { class: 'branch-ext', d: 'M' + f1(P.x) + ' ' + f1(P.y) + 'C' + f1(P.x) + ' ' + f1(P.y - (P.y - T.y) * 0.5) + ' ' + f1(T.x) + ' ' + f1(T.y + (P.y - T.y) * 0.5) + ' ' + f1(T.x) + ' ' + f1(T.y) });
            ext.style.stroke = 'url(#branch-ext-grad)';
            svg.appendChild(ext);
            // 名前：物理学は枝先の右
            tagP.style.left = f1(P.x + 8) + 'px'; tagP.style.top = f1(P.y - tagP.offsetHeight / 2) + 'px';
            fig.__branch = { P: P, T: T, s: s, tx: tx, ty: ty };
            done(fig);
        });
    }

    /* ---- 05：カードの行ごとに、上に1本の枝。各カードの上辺の中央に、そのカードの実 ---- */
    var grid = document.querySelector('[data-fruits]');
    if (grid) {
        var fsvg = el('svg', { class: 'fruits__svg', 'aria-hidden': 'true', focusable: 'false' });
        grid.insertBefore(fsvg, grid.firstChild);
        var cards = [].slice.call(grid.querySelectorAll('[data-fruit]'));
        watch(grid, function (W, H) {
            while (fsvg.firstChild) fsvg.removeChild(fsvg.firstChild);
            fsvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); fsvg.setAttribute('width', W); fsvg.setAttribute('height', H);
            // offsetTop/Left で測る（getBoundingClientRect はフェードイン前の translateY(22px) を含んでしまう）
            var rows = [];
            cards.forEach(function (c) {
                var top = c.offsetTop, left = c.offsetLeft, w = c.offsetWidth;
                var row = rows.filter(function (q) { return Math.abs(q.top - top) < 4; })[0];
                if (!row) rows.push(row = { top: top, items: [] });
                row.items.push({ i: +c.dataset.fruit, cx: left + w / 2, l: left, r: left + w });
            });
            rows.forEach(function (row) {
                var l = Math.min.apply(null, row.items.map(function (o) { return o.l; })) + 12;
                var rr = Math.max.apply(null, row.items.map(function (o) { return o.r; })) - 12;
                var y = row.top - 30, sag = 10;
                fsvg.appendChild(el('path', { class: 'fruit-bough', d: 'M' + f1(l) + ' ' + f1(y) + 'Q' + f1((l + rr) / 2) + ' ' + f1(y + sag * 2) + ' ' + f1(rr) + ' ' + f1(y) }));
                row.items.forEach(function (o) {
                    // 枝のその位置の高さ（二次曲線の y）から、実まで短い柄を下ろす
                    var t = (o.cx - l) / Math.max(1, rr - l), by = y + 2 * sag * 2 * t * (1 - t) * 0.5 * 2;
                    var fy = row.top - 11;
                    fsvg.appendChild(el('path', { class: 'fruit-stem', d: 'M' + f1(o.cx) + ' ' + f1(by) + 'L' + f1(o.cx) + ' ' + f1(fy - 6) }));
                    var c = el('circle', { class: 'fruit', cx: f1(o.cx), cy: f1(fy), r: 7, 'data-i': o.i });
                    c.style.setProperty('--fruit', 'var(--fruit-' + o.i + ')');
                    fsvg.appendChild(c);
                });
            });
            done(grid);
        });
        // カードに触れたら、その実が光る（粒子のエンジンは同じ合図を data-hot で受け取る）
        cards.forEach(function (c) {
            function on(v) {
                grid.dataset.hot = v ? c.dataset.fruit : '';
                [].forEach.call(fsvg.querySelectorAll('.fruit'), function (f) { f.classList.toggle('is-hot', v && f.getAttribute('data-i') === c.dataset.fruit); });
            }
            c.addEventListener('pointerenter', function () { on(true); });
            c.addEventListener('pointerleave', function () { on(false); });
            c.addEventListener('focusin', function () { on(true); });
            c.addEventListener('focusout', function () { on(false); });
        });
    }

    /* ---- 06：ブラックホール（§135.10）。締めの文の箱から大きさを決める。
       PC：内縁（事象の地平面の影）が締めの文を包む大きさ。外縁は画面幅の 4 割以上。傾きは文の高さが影に収まるように
       スマホ：外縁を画面幅に合わせる（文は影に収まらないので、影・暗がり・粒子の減光で読めるようにする）
       粒子のエンジンは step.__bh を使う（中心は section の左上から、半径は px、cosI は円盤の傾き） ---- */
    var bhBox = document.querySelector('[data-bh]');
    if (bhBox) {
        var step = bhBox.parentNode, inner = step.querySelector('.home-step__inner');
        var bsvg = el('svg', { class: 'bh__svg', 'aria-hidden': 'true', focusable: 'false' });
        bhBox.appendChild(bsvg);
        watch(step, function (W, H) {
            var vw = document.documentElement.clientWidth;
            var cx = inner.offsetLeft + inner.offsetWidth / 2, cy = inner.offsetTop + inner.offsetHeight / 2;
            var rin, rout, cosI;
            if (vw > 600) {
                var tw = Math.min(inner.offsetWidth, inner.querySelector('h2').offsetWidth + 40);
                rin = Math.max(tw / 2 + 50, 250);
                cosI = Math.max(0.42, Math.min(0.92, (inner.offsetHeight / 2 + 36) / rin));
                rout = Math.max(rin * 1.7, vw * 0.4);
            } else {
                rout = vw * 0.54; rin = rout / 1.75; cosI = 0.55;
            }
            step.__bh = { cx: cx, cy: cy, rin: rin, rout: rout, cosI: cosI };
            while (bsvg.firstChild) bsvg.removeChild(bsvg.firstChild);
            var w = rout * 2 + 40, h = rout * 2 * cosI + 40;
            bsvg.setAttribute('width', f1(w)); bsvg.setAttribute('height', f1(h)); bsvg.setAttribute('viewBox', '0 0 ' + f1(w) + ' ' + f1(h));
            bsvg.style.left = f1(cx - w / 2) + 'px'; bsvg.style.top = f1(cy - h / 2) + 'px';
            var defs = el('defs', {});
            var k = rin / rout;
            var gr = el('radialGradient', { id: 'bh-ring' });
            // §135.14：内側＝青から外側＝赤への虹（粒子の円盤と同じ並び）
            var q = function (t) { return k + (1 - k) * t; };
            [[0, 'transparent', 0], [k * 0.995, 'transparent', 0], [k, '#9b6bff', 0.5], [q(0.12), '#5a7dff', 0.5], [q(0.3), '#4fd8ff', 0.42], [q(0.48), '#4fdd8a', 0.34], [q(0.64), '#ffe14d', 0.28], [q(0.8), '#ffa040', 0.2], [q(0.92), '#ff5f52', 0.12], [1, '#ff5f52', 0]].forEach(function (st) {
                var e = el('stop', { offset: f1(Math.min(1, st[0]) * 1000) / 1000 }); e.style.stopColor = st[1]; e.style.stopOpacity = st[2]; gr.appendChild(e);
            });
            // 影：中心は黒、縁で背景へなじむ
            var gh = el('radialGradient', { id: 'bh-hole' });
            [[0, 0.96], [0.82, 0.92], [1, 0]].forEach(function (st) { var e = el('stop', { offset: st[0] }); e.style.stopColor = '#000'; e.style.stopOpacity = st[1]; gh.appendChild(e); });
            defs.appendChild(gr); defs.appendChild(gh); bsvg.appendChild(defs);
            bsvg.appendChild(el('ellipse', { class: 'bh__ring', cx: f1(w / 2), cy: f1(h / 2), rx: f1(rout), ry: f1(rout * cosI), fill: 'url(#bh-ring)' }));
            bsvg.appendChild(el('ellipse', { class: 'bh__hole', cx: f1(w / 2), cy: f1(h / 2), rx: f1(rin * 1.02), ry: f1(rin * cosI * 1.02), fill: 'url(#bh-hole)' }));
            done(step);
        });
    }
})();

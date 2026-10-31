/* ============================================================================
   academic-tree.js — index.html の「学問の樹」（DESIGN.md §135）

   ★ データは index.html の入れ子のリスト（.tree__data）だけ。ここはそれを読んで
   形を決める。分類・学問・細分野を足すと、枝の数も配置も自動で変わる。
     分類   li.tree-cat[data-cat]  > h3.tree-cat__name
     学問   li[data-key]           > .tree-node（<a> ならリンク、<span> なら準備中）
     細分野 その li の中の ul > li[data-key]（最大3段）
     またぐ線 li[data-cross="相手の key …"]

   やること
     1. 名前（HTML の要素）を木の枝先に並べる。文字は canvas に描かない
     2. 枝・幹・種・またぐ線を SVG で描く（静止した完成形）。粒子のエンジンが
        動けない場合（動きを減らす設定・WebGL 無し）はこれがそのまま木になる
     3. 02 の根（.roots）を描き、先に「学び方」を置く
     4. 配置を window.__tree に出す（粒子のエンジンが同じ形を使うため）

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
            function nodesOf(ul, depth) {
                if (!ul) return [];
                return [].filter.call(ul.children, function (li) { return li.tagName === 'LI'; }).map(function (li) {
                    return {
                        li: li, depth: depth,
                        node: li.querySelector(':scope > .tree-node'),
                        key: li.dataset.key || '',
                        cross: (li.dataset.cross || '').split(/\s+/).filter(Boolean),
                        subs: depth < 3 ? nodesOf(li.querySelector(':scope > ul'), depth + 1) : []
                    };
                });
            }
            return { li: c, cat: c.dataset.cat || '', label: c.querySelector(':scope > .tree-cat__name'), subjects: nodesOf(c.querySelector(':scope > ul'), 2) };
        });
    }

    function initTree(box) {
        var cats = readTree(box);
        if (!cats.length) return;
        var svg = el('svg', { class: 'tree__svg', 'aria-hidden': 'true', focusable: 'false' });
        box.insertBefore(svg, box.firstChild);
        box.classList.add('is-laid');

        var byKey = {};
        cats.forEach(function (c) { (function walk(list) { list.forEach(function (n) { if (n.key) byKey[n.key] = n; walk(n.subs); }); })(c.subjects); });

        var lastW = -1;
        function layout() {
            var W = box.clientWidth;
            if (!W || W === lastW) return;
            lastW = W;
            var L = W >= 900 ? layoutWide(cats, W) : layoutTall(cats, W);
            draw(L, W);
            window.__tree = L;
        }

        /* ---- 名前の箱の大きさ（is-laid で絶対配置になったあとに測る） ---- */
        function size(e) { return { w: e.offsetWidth, h: e.offsetHeight }; }
        function place(e, x, y) { e.style.left = f1(x) + 'px'; e.style.top = f1(y) + 'px'; }
        function rowsOf(list) { var r = []; (function walk(l) { l.forEach(function (n) { r.push(n); walk(n.subs); }); })(list); return r; }

        var ROW = 36, SUBROW = 31, SUBX = 20, TWIG = 14;

        /* 広い画面：列ごとに、下に分類名、その上に学問・細分野を積む。
           列の下端（＝分類の節）を弧に並べて、中央ほど高い樹冠にする。 */
        function layoutWide(cats, W) {
            var n = cats.length, colW = W / n, arcH = 64, top = 8;
            var cols = cats.map(function (c, i) {
                var rows = rowsOf(c.subjects);
                var h = rows.reduce(function (s, r) { return s + (r.depth > 2 ? SUBROW : ROW); }, 0);
                var t = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0;
                return { c: c, rows: rows, h: h, lift: arcH * (1 - t * t), stemX: colW * i + 14 };
            });
            var A = top + Math.max.apply(null, cols.map(function (k) { return k.h + k.lift; }));
            var fork = { x: W / 2, y: A + 130 }, seed = { x: W / 2, y: A + 290 };
            return build(cols.map(function (k) {
                var base = A - k.lift;                         // 積み上げの下端
                var y = base - k.h, items = [];
                k.rows.forEach(function (r) {
                    var rh = r.depth > 2 ? SUBROW : ROW;
                    items.push({ n: r, x: k.stemX + TWIG + (r.depth > 2 ? SUBX : 0), y: y + rh / 2, align: 'left' });
                    y += rh;
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
                var rows = rowsOf(c.subjects);
                var y = h[side], items = [];
                var stemX = side ? mid + 20 : mid - 20, dir = side ? 1 : -1;
                rows.forEach(function (r) {
                    var rh = r.depth > 2 ? SUBROW : ROW;
                    items.push({ n: r, x: stemX + dir * (TWIG + (r.depth > 2 ? SUBX : 0)), y: y + rh / 2, align: side ? 'left' : 'right' });
                    y += rh;
                });
                var lab = { x: stemX + dir * TWIG, y: y + 4 + ROW / 2 };
                h[side] = y + 4 + ROW + gap;
                cols.push({ c: c, stemX: stemX, items: items, label: lab, side: dir });
            });
            var bottom = Math.max(h[0], h[1]) + 40;
            var seed = { x: mid, y: bottom + 60 };
            return build(cols, { x: mid, y: bottom }, seed, seed.y + 34, 'tall');
        }

        /* 配置から、名前の位置・枝の線・またぐ線を作る */
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
                // 小枝：茎から分類名・学問・細分野へ
                branches.push({ level: 3, cat: cat, d: 'M' + f1(node.x) + ' ' + f1(lab.y) + 'L' + f1(lab.x) + ' ' + f1(lab.y) });
                nodes.push({ e: k.c.label, x: lab.x, y: lab.y, align: k.side > 0 ? 'left' : 'right', cat: cat, kind: 'cat' });
                k.items.forEach(function (it) {
                    var sub = it.n.depth > 2;
                    var sx = sub ? k.stemX + k.side * (TWIG * 0.5) : k.stemX;
                    branches.push({ level: sub ? 4 : 3, cat: cat, d: 'M' + f1(sx) + ' ' + f1(it.y - (sub ? 14 : 0)) + 'Q' + f1(sx) + ' ' + f1(it.y) + ' ' + f1(it.x) + ' ' + f1(it.y) });
                    nodes.push({ e: it.n.node, x: it.x, y: it.y, align: it.align, cat: cat, kind: sub ? 'sub' : 'subject', key: it.n.key, depth: it.n.depth });
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

            var gB = el('g', { class: 'tree__branches' }), gX = el('g', { class: 'tree__cross' });
            svg.appendChild(gB); svg.appendChild(gX);
            L.branches.forEach(function (b) {
                var p = el('path', { d: b.d, class: 'tree-branch tree-branch--' + b.level });
                if (b.cat) p.style.setProperty('--tint', 'var(--tint-' + b.cat + ')');
                gB.appendChild(p);
            });
            var s = L.seed;
            svg.appendChild(el('circle', { class: 'tree-seed__halo', cx: s.x, cy: s.y, r: 22 }));
            svg.appendChild(el('circle', { class: 'tree-seed', cx: s.x, cy: s.y, r: 4.5 }));

            // 名前：x は茎側の端（left なら左端、right なら右端）、y は中央
            var rect = {};
            L.nodes.forEach(function (nd) {
                var z = size(nd.e);
                var x = nd.align === 'left' ? nd.x : nd.x - z.w;
                place(nd.e, x, nd.y - z.h / 2);
                if (nd.key) rect[nd.key] = { l: x, r: x + z.w, y: nd.y, cx: x + z.w / 2 };
            });

            // 分野をまたぐ線：向かい合う端どうしを、ゆるい弧で結ぶ
            [].forEach.call(svg.querySelectorAll('.tree-cross'), function (p) { p.remove(); });
            Object.keys(byKey).forEach(function (k) {
                byKey[k].cross.forEach(function (to) {
                    var a = rect[k], b = rect[to];
                    if (!a || !b) return;
                    var d;
                    if (b.l >= a.r || a.l >= b.r) {          // 横に離れている
                        var A = b.l >= a.r ? { x: a.r, y: a.y } : { x: a.l, y: a.y };
                        var B = b.l >= a.r ? { x: b.l, y: b.y } : { x: b.r, y: b.y };
                        var my = Math.min(A.y, B.y) - 26;
                        d = curve(A, { x: A.x + (B.x - A.x) * 0.3, y: my }, { x: A.x + (B.x - A.x) * 0.7, y: my }, B);
                    } else {                                 // 同じ列：外側にふくらませる
                        var R = Math.max(a.r, b.r) + 34;
                        d = curve({ x: a.r, y: a.y }, { x: R, y: a.y }, { x: R, y: b.y }, { x: b.r, y: b.y });
                    }
                    var p = el('path', { d: d, class: 'tree-cross', 'data-a': k, 'data-b': to });
                    gX.appendChild(p);
                });
            });
        }

        // 分野をまたぐ線：どちらかの名前に触れたら、線と相手を光らせる
        function hot(key, on) {
            [].forEach.call(svg.querySelectorAll('.tree-cross[data-a="' + key + '"], .tree-cross[data-b="' + key + '"]'), function (p) {
                p.classList.toggle('is-hot', on);
                [p.getAttribute('data-a'), p.getAttribute('data-b')].forEach(function (k2) {
                    if (byKey[k2] && byKey[k2].node) byKey[k2].node.classList.toggle('is-hot', on);
                });
            });
        }
        Object.keys(byKey).forEach(function (k) {
            var nd = byKey[k].node; if (!nd) return;
            ['pointerenter', 'focus'].forEach(function (ev) { nd.addEventListener(ev, function () { hot(k, true); }); });
            ['pointerleave', 'blur'].forEach(function (ev) { nd.addEventListener(ev, function () { hot(k, false); }); });
        });

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
            var seed = { x: W / 2, y: 16 }, unit = Math.min(H * 0.34, W * 0.16);

            function grow(x, y, ang, len, depth, width) {
                var ex = x + Math.sin(ang) * len, ey = y + Math.cos(ang) * len;
                var bend = (rnd() - 0.5) * len * 0.5;
                var cx = (x + ex) / 2 + Math.cos(ang) * bend, cy = (y + ey) / 2 - Math.sin(ang) * bend;
                svg.appendChild(el('path', { class: 'root', d: 'M' + f1(x) + ' ' + f1(y) + 'Q' + f1(cx) + ' ' + f1(cy) + ' ' + f1(ex) + ' ' + f1(ey), 'stroke-width': f1(width) }));
                if (depth <= 0) return;
                var k = 2 + (rnd() < 0.35 ? 1 : 0);
                for (var i = 0; i < k; i++) grow(ex, ey, ang + (rnd() - 0.5) * 1.1, len * (0.55 + rnd() * 0.2), depth - 1, width * 0.62);
            }
            [-1.05, -0.5, 0, 0.45].forEach(function (a) { grow(seed.x, seed.y, a + (rnd() - 0.5) * 0.2, unit * (0.85 + rnd() * 0.3), 3, 2.2); });

            // 「学び方」へ伸びる1本：種から右下の名前の左端へ
            var tz = { w: tip.offsetWidth, h: tip.offsetHeight };
            var tx = Math.min(W - tz.w - 4, W / 2 + Math.max(60, W * 0.2)), ty = H - tz.h - 6;
            tip.style.left = f1(tx) + 'px'; tip.style.top = f1(ty) + 'px';
            var end = { x: tx, y: ty + tz.h / 2 };
            svg.appendChild(el('path', { class: 'root root--path', d: curve(seed, { x: seed.x + 6, y: seed.y + (end.y - seed.y) * 0.55 }, { x: end.x - (end.x - seed.x) * 0.45, y: end.y }, end) }));
            svg.appendChild(el('circle', { class: 'tree-seed__halo', cx: seed.x, cy: seed.y, r: 18 }));
            svg.appendChild(el('circle', { class: 'tree-seed', cx: seed.x, cy: seed.y, r: 4 }));
        }
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { lastW = -1; draw(); });
        draw();
        if ('ResizeObserver' in window) new ResizeObserver(draw).observe(box);
        else window.addEventListener('resize', draw);
    }
})();

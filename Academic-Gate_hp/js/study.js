/* ============================================================================
   study.js — 勉強の軌跡（study.html。DESIGN.md §136）

   データは js/disciplines.js（ホームの学問の樹と共有）。ここは書き出しと動きだけ。
     1. [data-study]     に7つの大分類と複合分野（THEMES）のセクションを書く
     2. [data-study-bar] に追従する分野バーを書く（いま見ている大分類のチップを強調。
                          スマホではバーを横に送れて、強調したチップが見える位置へ自動で寄る）
     3. 精神の圏域（ROOTS）の根の線を、カードの位置から SVG で描く
     4. フェードイン（self-intro.js と同じ条件・閾値）

   学問の3つの状態（disciplines.js）
     独自のページあり → 大きなカード（「ここから読む」＋ 学問のページへ）
     テーマの中で扱う → 実線のチップ（テーマの中の該当する部へ）
     準備中           → 破線のチップ
   量（記事数・章数・公開数）は出さない。
   ============================================================================ */
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var SVGNS = 'http://www.w3.org/2000/svg';

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
    var AR = '<span aria-hidden="true">→</span>';

    var themeOf = {};
    DISCIPLINE_THEMES.forEach(function (t) { themeOf[t.key] = t; });
    var catOf = {};
    DISCIPLINES.forEach(function (c) { c.subjects.forEach(function (s) { catOf[s.key] = { cat: c, subject: s }; }); });

    /* ---- 1. セクション ---------------------------------------------------- */
    function head(id, en, ja, lead) {
        return '<div class="sd-cat__head">' +
            '<p class="sd-cat__en">' + esc(en) + '</p>' +
            '<h2 id="' + id + '-h" lang="ja">' + esc(ja) + '</h2>' +
            '<p class="sd-cat__lead" lang="ja">' + esc(lead) + '</p></div>';
    }

    // 「ここから読む」（最初の記事）と、学問・テーマのページへ
    function go(start, page, pageLabel) {
        var h = '<div class="sd-go">';
        if (start) h += '<a class="sd-go__start" href="' + start.href + '"><span class="sd-go__label">ここから読む</span>' +
            '<span class="sd-go__to" lang="ja">' + esc(start.label) + '</span>' + AR + '</a>';
        if (page) h += '<a class="sd-go__page" href="' + page + '" lang="ja">' + esc(pageLabel) + ' ' + AR + '</a>';
        return h + '</div>';
    }

    function card(s) {
        return '<li><article class="sd-card">' +
            '<p class="sd-card__en">' + esc(s.en || '') + '</p>' +
            '<h3 lang="ja">' + esc(s.ja) + '</h3>' +
            '<p class="sd-card__intro" lang="ja">' + esc(s.intro || '') + '</p>' +
            go(s.start, s.page, s.ja + 'のページへ') + '</article></li>';
    }

    function catSection(c) {
        var pages = c.subjects.filter(function (s) { return s.page; });
        var inTheme = c.subjects.filter(function (s) { return !s.page && s.theme; });
        var soon = c.subjects.filter(function (s) { return !s.page && !s.theme; });
        var body = '';
        if (pages.length) body += '<ul class="sd-cards">' + pages.map(card).join('') + '</ul>';
        // テーマごとにまとめる（いまは「地球と人類」だけ）
        var byTheme = {};
        inTheme.forEach(function (s) { (byTheme[s.theme] = byTheme[s.theme] || []).push(s); });
        Object.keys(byTheme).forEach(function (k) {
            var t = themeOf[k];
            body += '<div class="sd-group"><p class="sd-group__label" lang="ja">テーマ「' + esc(t.ja) + '」の中で扱う</p>' +
                '<ul class="sd-chips">' + byTheme[k].map(function (s) {
                    return '<li><a class="sd-chip is-theme" href="' + s.href + '" lang="ja">' + esc(s.ja) + ' ' + AR + '</a></li>';
                }).join('') + '</ul></div>';
        });
        if (soon.length) {
            body += '<div class="sd-group"><p class="sd-group__label" lang="ja">準備中</p>' +
                '<ul class="sd-chips">' + soon.map(function (s) {
                    return '<li><span class="sd-chip is-soon" lang="ja">' + esc(s.ja) + '</span></li>';
                }).join('') + '</ul></div>';
        }
        return '<section class="sd-cat reveal" id="' + c.cat + '" data-cat="' + c.cat + '" aria-labelledby="' + c.cat + '-h">' +
            head(c.cat, c.en, c.ja, c.lead) + '<div class="sd-cat__body">' + body + '</div></section>';
    }

    // 複合分野のカード：縁は、関係する学問の大分類の色を順に混ぜたグラデーション
    function themeCard(t) {
        var cats = [];
        t.subjects.forEach(function (k) { var c = catOf[k] && catOf[k].cat.cat; if (c && cats.indexOf(c) < 0) cats.push(c); });
        var edge = cats.length > 1
            ? 'linear-gradient(120deg, ' + cats.map(function (c) { return 'var(--tint-' + c + ')'; }).join(', ') + ')'
            : 'var(--tint-' + (cats[0] || 'formal') + ')';
        return '<li><article class="sd-theme" style="--edge: ' + edge + '">' +
            '<p class="sd-card__en">' + esc(t.en) + '</p>' +
            '<h3 lang="ja">' + esc(t.ja) + '</h3>' +
            '<p class="sd-card__intro" lang="ja">' + esc(t.intro) + '</p>' +
            '<ul class="sd-chips sd-theme__subjects" aria-label="関係する学問">' + t.subjects.map(function (k) {
                var x = catOf[k]; if (!x) return '';
                return '<li data-cat="' + x.cat.cat + '"><a class="sd-chip is-tinted" href="' + (x.subject.href || t.page) + '" lang="ja">' + esc(x.subject.ja) + '</a></li>';
            }).join('') + '</ul>' +
            go(t.start, t.page, 'テーマのページへ') + '</article></li>';
    }

    function themesSection() {
        if (!DISCIPLINE_THEMES.length) return '';
        return '<section class="sd-cat sd-cat--themes reveal" id="themes" data-cat="themes" aria-labelledby="themes-h">' +
            head('themes', 'Themes', '複合分野', 'ひとつの学問に収まらない問いを、いくつもの分野を重ねて読む。') +
            '<div class="sd-cat__body"><ul class="sd-cards sd-cards--themes">' + DISCIPLINE_THEMES.map(themeCard).join('') + '</ul></div></section>';
    }

    var box = document.querySelector('[data-study]');
    if (!box) return;
    box.outerHTML = DISCIPLINES.map(catSection).join('') + themesSection();

    /* ---- 2. 追従する分野バー ------------------------------------------------ */
    var bar = document.querySelector('[data-study-bar]');
    var sections = [].slice.call(document.querySelectorAll('.sd-cat[id]'));
    var chips = [];
    if (bar) {
        var items = DISCIPLINES.map(function (c) { return [c.cat, c.ja]; });
        var extra = [];
        if (DISCIPLINE_THEMES.length) extra.push(['themes', '複合分野']);
        if (document.getElementById('roots')) extra.push(['roots', '精神の圏域']);
        function li(it) { return '<li><a class="sd-bar__chip" href="#' + it[0] + '" data-cat="' + it[0] + '" lang="ja">' + esc(it[1]) + '</a></li>'; }
        bar.innerHTML = '<ul class="sd-bar__list">' + items.map(li).join('') +
            (extra.length ? '<li class="sd-bar__sep" aria-hidden="true"></li>' + extra.map(li).join('') : '') + '</ul>';
        bar.hidden = false;
        var list = bar.querySelector('.sd-bar__list');
        chips = [].slice.call(bar.querySelectorAll('.sd-bar__chip'));

        // バーの位置：ヘッダー（浮いたピル）のすぐ下。ヘッダーの高さは画面幅で変わるので測る。
        // ★ ヘッダーは layout.js が DOMContentLoaded で書き出すので、ここを読む時点ではまだ無い。測るたびに探す
        var header = null, watched = false;
        function measure() {
            header = header || document.querySelector('header');
            if (header && !watched && 'ResizeObserver' in window) { watched = true; new ResizeObserver(function () { measure(); }).observe(header); }
            var top = header ? Math.round(header.getBoundingClientRect().bottom) + 6 : 84;
            root.style.setProperty('--sd-bar-top', top + 'px');
            root.style.setProperty('--sd-bar-bottom', (top + bar.offsetHeight) + 'px');
            edges();
        }

        // 横に送れることが分かるように、続きがある側の端だけを薄くする
        function edges() {
            var max = list.scrollWidth - list.clientWidth;
            bar.classList.toggle('fade-l', list.scrollLeft > 2);
            bar.classList.toggle('fade-r', max > 2 && list.scrollLeft < max - 2);
        }
        list.addEventListener('scroll', edges, { passive: true });

        // チップを押したら、そのセクションの見出しがバーのすぐ下に来るように送る
        bar.addEventListener('click', function (e) {
            var a = e.target.closest('.sd-bar__chip');
            if (!a) return;
            var sec = document.getElementById(a.getAttribute('href').slice(1));
            if (!sec) return;
            e.preventDefault();
            var y = target(sec);
            window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
            if (history.replaceState) history.replaceState(null, '', '#' + sec.id);
            setActive(sec.id, true);
        });

        // 送り先：セクションの見出しが、バーのすぐ下（16px あけて）に来る位置
        // ★ バーは送った先では上に貼り付いているので、いまの位置ではなく貼り付いたときの下端で測る。
        //   まだフェードインしていないセクションは 22px 下にずれているので、その分を引く
        function target(sec) {
            var h = sec.querySelector('.sd-cat__head') || sec;
            var m = /matrix\(([^)]+)\)/.exec(getComputedStyle(sec).transform), ty = m ? parseFloat(m[1].split(',')[5]) || 0 : 0;
            var stuck = parseFloat(getComputedStyle(root).getPropertyValue('--sd-bar-top')) + bar.offsetHeight;
            return h.getBoundingClientRect().top - ty + window.scrollY - (stuck + 16);
        }

        // スクロールスパイ：バーの下から画面の 3 割の位置を越えた最後のセクション
        var current = '', lock = 0;
        function setActive(id, fromClick) {
            if (fromClick) lock = Date.now() + 900;      // 送っている途中で強調が途中のチップを渡り歩かないように
            if (id === current) return;
            current = id;
            chips.forEach(function (c) {
                var on = c.getAttribute('href') === '#' + id;
                c.classList.toggle('is-on', on);
                if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
                if (on) {
                    // バーの中だけを横に送る（scrollIntoView はページまで動かすので使わない）
                    var x = c.parentNode.offsetLeft - (list.clientWidth - c.offsetWidth) / 2;
                    list.scrollTo({ left: Math.max(0, x), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
                }
            });
        }
        function spy() {
            if (Date.now() < lock) return;
            var line = bar.getBoundingClientRect().bottom + (window.innerHeight - bar.getBoundingClientRect().bottom) * 0.3;
            var id = '';
            sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) id = s.id; });
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4 && sections.length) {
                id = sections[sections.length - 1].id;
            }
            setActive(id);
        }
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return; ticking = true;
            requestAnimationFrame(function () { ticking = false; spy(); });
        }, { passive: true });
        window.addEventListener('resize', function () { measure(); spy(); });
        measure(); spy();
        // 字の読み込みでバーの高さが、読み込みの途中ではヘッダーの位置が変わるので、測り直す
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); spy(); });
        document.addEventListener('DOMContentLoaded', function () { measure(); spy(); });
        window.addEventListener('load', function () { measure(); spy(); });
        // ハッシュ付きで開いたとき：バーの下へ合わせ直す
        if (location.hash && document.getElementById(location.hash.slice(1))) {
            var s0 = document.getElementById(location.hash.slice(1));
            if (s0.classList.contains('sd-cat')) {
                requestAnimationFrame(function () {
                    window.scrollTo(0, Math.max(0, target(s0)));
                });
            }
        }
    }

    /* ---- 3. 精神の圏域の根 ------------------------------------------------- */
    var rootsBox = document.querySelector('[data-study-roots]');
    if (rootsBox) initRoots(rootsBox);

    function el(name, attrs) { var e = document.createElementNS(SVGNS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function f1(n) { return Math.round(n * 10) / 10; }
    // 決まった乱数（毎回同じ根の形にする。academic-tree.js と同じ）
    function prng(a) {
        return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    }

    function initRoots(box) {
        var svg = el('svg', { class: 'sd-roots__svg', 'aria-hidden': 'true', focusable: 'false' });
        box.insertBefore(svg, box.firstChild);
        box.classList.add('is-laid');
        var cards = [].slice.call(box.querySelectorAll('.sd-root'));
        var lastW = -1, lastH = -1;

        function draw() {
            var W = box.clientWidth, H = box.clientHeight;
            if (!W || (W === lastW && H === lastH)) return;
            lastW = W; lastH = H;
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
            svg.setAttribute('width', W); svg.setAttribute('height', H);
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            var b0 = box.getBoundingClientRect();
            var rs = cards.map(function (c) { var r = c.getBoundingClientRect(); return { x: r.left - b0.left, y: r.top - b0.top, w: r.width, h: r.height, soon: c.classList.contains('is-soon') }; });
            // カードが横に並んでいれば（PC）上の中央の種から扇形に、縦に積まれていれば（スマホ）左の種から下へ
            var row = rs.every(function (r) { return Math.abs(r.y - rs[0].y) < 4; });
            var seed = row ? { x: W / 2, y: 10 } : { x: 10, y: 10 };
            var rnd = prng(20261109);

            // 細い飾りの根（ホームの 02 と同じ、種から枝分かれして細くなる線）
            function grow(x, y, ang, len, depth, width) {
                var ex = x + Math.sin(ang) * len, ey = y + Math.cos(ang) * len;
                var bend = (rnd() - 0.5) * len * 0.5;
                var cx = (x + ex) / 2 + Math.cos(ang) * bend, cy = (y + ey) / 2 - Math.sin(ang) * bend;
                svg.appendChild(el('path', { class: 'sd-rootline', d: 'M' + f1(x) + ' ' + f1(y) + 'Q' + f1(cx) + ' ' + f1(cy) + ' ' + f1(ex) + ' ' + f1(ey), 'stroke-width': f1(width) }));
                if (depth <= 0) return;
                for (var i = 0; i < 2; i++) grow(ex, ey, ang + (rnd() - 0.5) * 1.1, len * (0.55 + rnd() * 0.2), depth - 1, width * 0.62);
            }
            // スマホでは左の細い余白（34px）の中に収める
            var fan = row ? [-1.25, -0.6, 0.6, 1.25] : [-0.15, 0.3];
            fan.forEach(function (a) { grow(seed.x, seed.y, a + (rnd() - 0.5) * 0.15, row ? 46 : 26, row ? 2 : 1, 1.6); });

            // 種からカードへ伸びる根：ページのある技能は明るい点線、準備中は薄い点線
            rs.forEach(function (r) {
                var end = row ? { x: r.x + r.w / 2, y: r.y } : { x: r.x, y: r.y + Math.min(30, r.h / 2) };
                var d = row
                    ? 'M' + f1(seed.x) + ' ' + f1(seed.y) + 'C' + f1(seed.x) + ' ' + f1((seed.y + end.y) / 2) + ' ' + f1(end.x) + ' ' + f1(seed.y + (end.y - seed.y) * 0.4) + ' ' + f1(end.x) + ' ' + f1(end.y)
                    : 'M' + f1(seed.x) + ' ' + f1(seed.y) + 'C' + f1(seed.x) + ' ' + f1(end.y - 10) + ' ' + f1(seed.x + 2) + ' ' + f1(end.y) + ' ' + f1(end.x) + ' ' + f1(end.y);
                svg.appendChild(el('path', { class: 'sd-rootline sd-rootline--path' + (r.soon ? ' is-soon' : ''), d: d }));
            });
            svg.appendChild(el('circle', { class: 'tree-seed__halo', cx: seed.x, cy: seed.y, r: 14 }));
            svg.appendChild(el('circle', { class: 'tree-seed', cx: seed.x, cy: seed.y, r: 3.5 }));
        }
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { lastW = -1; draw(); });
        draw();
        if ('ResizeObserver' in window) new ResizeObserver(draw).observe(box);
        else window.addEventListener('resize', draw);
    }

    /* ---- 4. フェードイン（self-intro.js と同じ） --------------------------- */
    var els = document.querySelectorAll('.reveal');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
        [].forEach.call(els, function (e) { e.classList.add('is-visible'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        [].forEach.call(els, function (e) { io.observe(e); });
    }
})();

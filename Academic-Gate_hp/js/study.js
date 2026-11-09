/* ============================================================================
   study.js — 勉強の軌跡（study.html。DESIGN.md §136）

   データは js/disciplines.js（ホームの学問の樹と共有）。ここは書き出しと動きだけ。
     1. [data-study]     に7つの大分類と複合分野（THEMES）のセクションを書く
     2. [data-study-bar] に追従する分野バーを書く（いま見ている大分類のチップを強調。
                          スマホではバーを横に送れて、強調したチップが見える位置へ自動で寄る）
     3. 精神の圏域（ROOTS）の根の線を、カードの位置から SVG で描く
     4. フェードイン（self-intro.js と同じ条件・閾値）

   学問の2つの状態（disciplines.js）。どの大分類も、すべての学問を同じ大きさのタイルで並べる（§136.3・§136.7）
     独自のページあり → 大分類の色の実線のタイル。PC はカーソル・フォーカスで、スマホはタップで
                        詳しい内容（英語名・説明・「ここから読む」・学問のページへ）が浮き出る。開くのは1つだけ
     準備中           → 破線の控えめなタイル。押しても何も起きない（カーソルで「準備中」）
   複合分野（テーマ）はタイトルと一言だけ。学問とは結び付けない（§136.7）
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

    // 学問のタイル。2行目の小さな字が状態（独自ページ＝英語名、準備中＝カーソルで「準備中」）
    function tile(s) {
        var name = '<span class="sd-tile__name" lang="ja">' + esc(s.ja) + '</span>';
        if (s.page) {
            var id = 'sd-pop-' + s.key;
            return '<li class="sd-tilebox">' +
                '<button class="sd-tile is-page" type="button" aria-expanded="false" aria-controls="' + id + '">' + name +
                '<span class="sd-tile__meta">' + esc(s.en || '') + '</span><span class="sd-tile__mark" aria-hidden="true"></span></button>' +
                '<div class="sd-pop" id="' + id + '" role="group" aria-label="' + esc(s.ja) + '">' +
                '<p class="sd-card__en">' + esc(s.en || '') + '</p>' +
                '<p class="sd-card__intro" lang="ja">' + esc(s.intro || '') + '</p>' +
                go(s.start, s.page, s.ja + 'のページへ') + '</div></li>';
        }
        return '<li class="sd-tilebox"><span class="sd-tile is-soon">' + name +
            '<span class="sd-tile__meta" lang="ja">準備中</span></span></li>';
    }

    function catSection(c) {
        return '<section class="sd-cat reveal" id="' + c.cat + '" data-cat="' + c.cat + '" aria-labelledby="' + c.cat + '-h">' +
            head(c.cat, c.en, c.ja, c.lead) +
            '<div class="sd-cat__body"><ul class="sd-tiles">' + c.subjects.map(tile).join('') + '</ul></div></section>';
    }

    // 複合分野のカード：タイトルと一言だけ。縁は、テーマであることを示す複数の大分類の色のグラデーション（§136.7）。
    // ページができたら（disciplines.js に page を足すと）カード全体がそのページへのリンクになる
    function themeCard(t) {
        var cats = t.edge || [];
        var edge = cats.length > 1
            ? 'linear-gradient(120deg, ' + cats.map(function (c) { return 'var(--tint-' + c + ')'; }).join(', ') + ')'
            : cats.length ? 'var(--tint-' + cats[0] + ')' : 'var(--hairline-strong)';
        var inner = '<p class="sd-card__en">' + esc(t.en) + '</p>' +
            '<h3 lang="ja">' + esc(t.ja) + '</h3>' +
            '<p class="sd-card__intro" lang="ja">' + esc(t.intro) + '</p>' +
            (t.page ? '' : '<p class="sd-theme__soon" lang="ja">準備中</p>');
        return '<li>' + (t.page
            ? '<a class="sd-theme is-linked" href="' + t.page + '" style="--edge: ' + edge + '">' + inner + '</a>'
            : '<article class="sd-theme is-soon" style="--edge: ' + edge + '">' + inner + '</article>') + '</li>';
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

    /* ---- 1b. 独自ページのある学問のタイルを開く ------------------------------
       開くのはページ全体で1つだけ。中身（.sd-pop）は、ふだんはタイルの li の中にある。
       PC（カーソルのある端末）：カーソル・フォーカスで、タイルのすぐ下に「重ねて」出す（.sd-tiles が基準。
         周りは動かさない。カーソルで開くので、動くと指の下のタイルがずれてしまう）。中身へカーソルを移す
         途中で閉じないように、タイルと中身の間の隙間は中身の ::before で埋め、閉じるのは 220ms 遅らせる
       スマホ：タップで、そのタイルの行のすぐ下に「差し込んで」なめらかに開く（.sd-popslot。高さを
         0fr → 1fr で動かす）。重ねると下のタイルが隠れて、ほかの学問を押せなくなるため。
         もう一度タップ・ほかのタイル・外側のタップ・Esc で閉じる */
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    var openBox = null, closeTimer = 0, quiet = false;   // quiet：Esc で閉じてタイルへ戻したフォーカスで、また開かないように
    function place(li) {
        var btn = li.querySelector('.sd-tile'), pop = li.querySelector('.sd-pop'), list = li.parentNode;
        var top = btn.offsetTop + btn.offsetHeight + 8;
        var left = Math.max(0, Math.min(btn.offsetLeft, list.clientWidth - pop.offsetWidth));
        pop.style.top = top + 'px';
        pop.style.left = left + 'px';
    }
    // スマホ：タイルの行の終わり（いちばん右のタイル）の後ろに、行いっぱいの差し込み口を作って中身を移す
    function slotFor(li) {
        var list = li.parentNode;
        var boxes = [].filter.call(list.children, function (c) { return c.classList.contains('sd-tilebox'); });
        var cols = getComputedStyle(list).gridTemplateColumns.split(' ').length || 1;
        var i = boxes.indexOf(li), end = boxes[Math.min(boxes.length - 1, Math.floor(i / cols) * cols + cols - 1)];
        var slot = document.createElement('li');
        slot.className = 'sd-popslot';
        slot.innerHTML = '<div class="sd-popslot__in"></div>';
        end.parentNode.insertBefore(slot, end.nextSibling);
        slot.firstChild.appendChild(li.querySelector('.sd-pop'));
        li._slot = slot;
        void slot.offsetHeight;                       // 0fr の状態を一度描いてから開く（なめらかに）
        slot.classList.add('is-open');
    }
    function unslot(li) {
        var slot = li._slot; if (!slot) return;
        li._slot = null;
        slot.classList.remove('is-open');
        function back() { li.appendChild(slot.querySelector('.sd-pop')); slot.remove(); }
        if (reduceMotion.matches) back(); else setTimeout(back, 300);
    }
    function openTile(li) {
        clearTimeout(closeTimer);
        if (openBox && openBox !== li) closeTile(openBox);
        li.classList.add('is-open');
        li.querySelector('.sd-tile').setAttribute('aria-expanded', 'true');
        if (canHover.matches) { place(li); li.closest('.sd-cat').classList.add('has-open'); }   // 次のセクションより手前に出す
        else slotFor(li);
        openBox = li;
    }
    function closeTile(li) {
        li.classList.remove('is-open');
        li.querySelector('.sd-tile').setAttribute('aria-expanded', 'false');
        li.closest('.sd-cat').classList.remove('has-open');
        unslot(li);
        if (openBox === li) openBox = null;
    }
    function closeLater(li) {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(function () { if (!li.matches(':hover') && !li.contains(document.activeElement)) closeTile(li); }, 220);
    }
    [].forEach.call(document.querySelectorAll('.sd-tile.is-page'), function (btn) {
        var li = btn.parentNode;
        li.addEventListener('mouseenter', function () { if (canHover.matches) openTile(li); });
        li.addEventListener('mouseleave', function () { if (canHover.matches && openBox === li) closeLater(li); });
        li.addEventListener('focusin', function () { if (canHover.matches && !quiet) openTile(li); });
        li.addEventListener('focusout', function (e) { if (openBox === li && !li.contains(e.relatedTarget)) closeLater(li); });
        btn.addEventListener('click', function (e) {
            // カーソルのある端末でのマウスのクリックは、開いたままにするだけ（カーソルで開いた直後に閉じないように）。
            // キーボード（Enter・Space：detail が 0）とタップは開閉を切り替える
            if (canHover.matches && e.detail > 0) { openTile(li); return; }
            if (openBox === li) closeTile(li); else openTile(li);
        });
    });
    document.addEventListener('click', function (e) {
        if (openBox && !openBox.contains(e.target) && !(openBox._slot && openBox._slot.contains(e.target))) closeTile(openBox);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && openBox) { var b = openBox.querySelector('.sd-tile'); closeTile(openBox); quiet = true; b.focus(); quiet = false; }
    });
    window.addEventListener('resize', function () { if (openBox && canHover.matches) place(openBox); });

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

        // スクロールスパイ：バーの下の線（120px か、画面の 3 割の近い方）を越えた最後のセクション
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
            // ★ 線はバーの下 120px まで（画面の 3 割だと、タイルにして短くなった PC のセクションでは
            //   次のセクションの頭まで越えてしまい、ひとつ先のチップが光った。§136.7）
            var bb = bar.getBoundingClientRect().bottom;
            var line = bb + Math.min(120, (window.innerHeight - bb) * 0.3);
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
        // ハッシュ付きで開いたとき：バーの下へ合わせ直す。
        // ★ 初めて開くとき（字・ヘッダーがまだ）は、すぐ合わせても後から上の高さが変わってずれる
        //   （実際の画面で #themes が形式科学の位置に止まった）。読み込みの終わりと字の読み込みの後にも合わせ直す。
        //   読む人が自分で動かしたら、それ以降は合わせない
        var s0 = location.hash && document.getElementById(location.hash.slice(1));
        if (s0 && s0.classList.contains('sd-cat')) {
            var moved = false;
            ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
                window.addEventListener(ev, function () { moved = true; }, { once: true, passive: true });
            });
            var align = function () { if (!moved) window.scrollTo(0, Math.max(0, target(s0))); };
            requestAnimationFrame(align);
            window.addEventListener('load', function () { measure(); align(); });
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(align); });
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

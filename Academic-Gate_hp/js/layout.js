/* ---------------------------------------------------------------------------
   Shared header + footer (Option A) — one canonical copy, injected on every page.

   Load order: this file is included immediately BEFORE main.js and AFTER the
   #site-nav / #site-footer placeholders in the body. At that point the document is
   already parsed ('interactive'), so inject() runs synchronously on execution — the
   <header>/<footer> markup exists in the DOM before main.js registers its
   DOMContentLoaded handlers (which query .menu-toggle / .nav-menu / header). No
   ordering race: injection is done by the time any handler runs.

   With JS disabled this file never runs; a <noscript> fallback nav inside each
   placeholder keeps the site navigable.

   Active state comes from document.body.dataset.page (every page carries data-page).
   --------------------------------------------------------------------------- */
(function () {
    'use strict';

    // data-page → the nav link to mark active. An article page (body.is-article) that
    // belongs under a nav item maps to that item — e.g. a 教材 page would use
    // data-page="study" so 勉強の軌跡 stays highlighted while reading it.
    var ACTIVE = {
        index: 'index.html', 'self-intro': 'self-intro.html', study: 'study.html',
        videos: 'videos.html', blog: 'blog.html', sns: 'sns.html'
    };

    /* --- 階層（パンくず）の定義 ------------------------------------------------
       key は各ページの body[data-node]。ページを足すときは、ここに1行足せば
       レールの上部リンクも上部のパンくずも通る。href が無いノードは対応する
       ページが無い層（章など）で、リンクにせず薄い文字で出す。
       label は既存のパンくずの文言をそのまま使う（サイト側の呼び名を変えない）。
       title は前後リンクで使う長い名前。 */
    var CRUMBS = {
        'study':           { label: '勉強の軌跡',   href: 'study.html' },
        'physics':         { label: '物理学',       href: 'study_physics.html',    parent: 'study' },
        'phys-math':       { label: '物理数学',     href: 'phys-math.html',        parent: 'physics', unit: '記事' },
        'phys-math:ch1':   { label: '1章 微分',                                    parent: 'phys-math' },
        'phys-math_1-1':   { label: 'SECTION 1-1',  href: 'phys-math_1-1.html',    parent: 'phys-math:ch1',
                             title: '1-1　微分の基礎' },
        'phys-math_1-2':   { label: 'SECTION 1-2',  href: 'phys-math_1-2.html',    parent: 'phys-math:ch1',
                             title: '1-2　物理でよく使う関数の微分' },
        // まだ書いていない記事。href の代わりに soon を立てると、ツリーと前後リンクに
        // 「（準備中）」として出る。書き上がったら soon を消して href を入れる。
        'phys-math:ch2':   { label: '2章 積分',                                    parent: 'phys-math' },
        'phys-math_2-1':   { label: 'SECTION 2-1',  href: 'phys-math_2-1.html',    parent: 'phys-math:ch2',
                             title: '2-1　積分の基礎' },
        'phys-math_2-2':   { label: 'SECTION 2-2',  href: 'phys-math_2-2.html',    parent: 'phys-math:ch2',
                             title: '2-2　積分の技法' },
        'phys-math:ch3':   { label: '3章 近似と展開',                              parent: 'phys-math' },
        'phys-math_3-1':   { label: 'SECTION 3-1',  href: 'phys-math_3-1.html',    parent: 'phys-math:ch3',
                             title: '3-1　近似と展開' },
        'phys-math:ch4':   { label: '4章 複素数とオイラーの公式',                  parent: 'phys-math' },
        'phys-math_4-1':   { label: 'SECTION 4-1',  href: 'phys-math_4-1.html',    parent: 'phys-math:ch4',
                             title: '4-1　複素数とオイラーの公式' },
        'phys-math_4-2':   { label: 'SECTION 4-2',  href: 'phys-math_4-2.html',    parent: 'phys-math:ch4',
                             title: '4-2　複素数で振動を扱う' },
        'phys-math:ch5':   { label: '5章 常微分方程式',                            parent: 'phys-math' },
        'phys-math_5-1':   { label: 'SECTION 5-1',  href: 'phys-math_5-1.html',    parent: 'phys-math:ch5',
                             title: '5-1　1階の微分方程式' },
        'phys-math_5-2':   { label: 'SECTION 5-2',  href: 'phys-math_5-2.html',    parent: 'phys-math:ch5',
                             title: '5-2　2階線形微分方程式' },
        'skills':          { label: '精神の圏域',   href: 'study_skills.html',     parent: 'study' },
        'mnemonics':       { label: '記憶術',       href: 'skills_mnemonics.html', parent: 'skills' },
        'memoryverse':     { label: 'メモリーバース', href: 'memoryverse.html',    parent: 'mnemonics', unit: '回' },
        'memoryverse:ch1': { label: '1章 太陽系',                                  parent: 'memoryverse' },
        'memoryverse_1-1': { label: '第1回',        href: 'memoryverse_1-1.html',  parent: 'memoryverse:ch1',
                             title: '第1回　太陽系の骨格' },
        'memoryverse_1-2': { label: '第2回',        href: 'memoryverse_1-2.html',  parent: 'memoryverse:ch1',
                             title: '第2回　岩石惑星を深める' },
        'memoryverse_1-3': { label: '第3回',        href: 'memoryverse_1-3.html',  parent: 'memoryverse:ch1',
                             title: '第3回　巨大惑星を深める' },
        'memoryverse_1-4': { label: '第4回',        href: 'memoryverse_1-4.html',  parent: 'memoryverse:ch1',
                             title: '第4回　小天体' },
        'memoryverse_1-5': { label: '第5回',        href: 'memoryverse_1-5.html',  parent: 'memoryverse:ch1',
                             title: '第5回　太陽と全体の統合' },
        'memoryverse:ch2': { label: '2章 地球',                                    parent: 'memoryverse' },
        'memoryverse_2-1': { label: '2-1',          href: 'memoryverse_2-1.html',  parent: 'memoryverse:ch2',
                             title: '2-1　地球の骨格' },
    };

    // node から根までの並び（根が先頭）。
    function chain(node) {
        var out = [], seen = {};
        while (node && CRUMBS[node] && !seen[node]) { seen[node] = 1; out.unshift(node); node = CRUMBS[node].parent; }
        return out;
    }

    // レール用：1階層上へ戻る1行だけ。ページを持たない層（章）は飛ばして、
    // いちばん近い「ページのある親」へ返す。全体の階層は右のサイトナビが持つ。
    function upHtml(keys, cls) {
        for (var i = keys.length - 2; i >= 0; i--) {
            if (CRUMBS[keys[i]].href) {
                // ← は .ar で包む。ホバーでこの矢印だけを左へずらすため（§68.2）。
                // 読み上げには label だけ渡ればよいので aria-hidden。
                return '<nav class="' + cls + '"><a href="' + CRUMBS[keys[i]].href + '">' +
                       '<span class="ar" aria-hidden="true">←</span>' +
                       CRUMBS[keys[i]].label + '</a></nav>';
            }
        }
        return '';
    }

    /* --- 右側のサイトナビ（ツリー）------------------------------------------
       CRUMBS から親子を組み立てて描く。テーブルに1行足せばツリーに出る。
       ページのある層はリンク、無い層（章）は見出しで、押すと開閉する。 */
    function childrenOf(key) {
        return Object.keys(CRUMBS).filter(function (k) { return CRUMBS[k].parent === key; });
    }
    function treeHtml(key, cur, open) {
        var c = CRUMBS[key], kids = childrenOf(key), name = c.title || c.label;
        var isOpen = open[key] ? ' open' : '';
        var h = '<li class="nd' + (kids.length ? ' has' : '') + isOpen + '">' +
            '<div class="rw">' +
            (kids.length
                ? '<button class="tw" type="button" aria-expanded="' + (open[key] ? 'true' : 'false') +
                  '" aria-label="' + name + 'の下を開く"></button>'
                : '<span class="tw tw--leaf" aria-hidden="true"></span>') +
            (c.href
                ? '<a href="' + c.href + '"' + (key === cur ? ' class="cur" aria-current="page"' : '') + '>' + name + '</a>'
                : c.soon
                    ? '<span class="soon">' + name + '（準備中）</span>'
                    : '<button class="hd" type="button">' + name + '</button>') +
            '</div>';
        if (kids.length) {
            h += '<div class="kids"><ul>' + kids.map(function (k) { return treeHtml(k, cur, open); }).join('') + '</ul></div>';
        }
        return h + '</li>';
    }
    function siteNavHtml(cur) {
        var open = {}, keys = chain(cur);
        keys.forEach(function (k) { open[k] = true; });        // 現在地まで自動で展開
        var roots = Object.keys(CRUMBS).filter(function (k) { return !CRUMBS[k].parent; });
        return '<button class="sitenav-tab" id="sitenavTab" type="button" aria-expanded="false" aria-controls="sitenav">サイト構成</button>' +
            '<div class="sitenav-scrim" id="sitenavScrim"></div>' +
            '<aside class="sitenav" id="sitenav" aria-label="サイトの階層">' +
                '<div class="sitenav__hd"><span>サイトの階層</span>' +
                    '<button class="sitenav__x" type="button" aria-label="閉じる">✕</button></div>' +
                '<nav class="sitenav__body"><ul class="tree">' +
                    roots.map(function (k) { return treeHtml(k, cur, open); }).join('') +
                '</ul></nav>' +
            '</aside>';
    }
    function mountSiteNav(cur) {
        document.body.insertAdjacentHTML('beforeend', siteNavHtml(cur));
        var tab = document.getElementById('sitenavTab'),
            box = document.getElementById('sitenav'),
            scrim = document.getElementById('sitenavScrim'),
            x = box.querySelector('.sitenav__x');
        function set(on) {
            document.body.classList.toggle('sitenav-open', on);
            tab.setAttribute('aria-expanded', on ? 'true' : 'false');
            if (on) { var f = box.querySelector('.cur') || x; if (f) f.focus(); } else { tab.focus(); }
        }
        tab.addEventListener('click', function () { set(!document.body.classList.contains('sitenav-open')); });
        scrim.addEventListener('click', function () { set(false); });
        x.addEventListener('click', function () { set(false); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('sitenav-open')) set(false);
        });
        box.addEventListener('click', function (e) {
            var t = e.target.closest('.tw, .hd');
            if (!t) return;
            var li = t.closest('.nd'), on = !li.classList.contains('open');
            li.classList.toggle('open', on);
            var tw = li.querySelector('.tw');
            if (tw && tw.tagName === 'BUTTON') tw.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
    }

    /* --- 記事末尾の前後リンク（§67）------------------------------------------
       同じ親を持つ並び順がそのまま前後になる。途中に記事を挿しても、テーブルの
       行を挿した位置で前後が繋ぎ変わる。真ん中はいちばん近い「ページのある親」。 */
    function seriesOf(key) {
        var k = CRUMBS[key].parent;
        while (k && !CRUMBS[k].href) k = CRUMBS[k].parent;
        return k;
    }
    function navCell(cls, cap, text, href) {
        return href
            ? '<a class="' + cls + '" href="' + href + '"><b>' + cap + '</b>' + text + '</a>'
            : '<span class="' + cls + ' soon"><b>' + cap + '</b>' + text + '（準備中）</span>';
    }
    // シリーズの中の記事を、章をまたいで表の順に並べたもの（＝前後の順）。
    function leavesOf(key, out) {
        var kids = childrenOf(key);
        if (!kids.length) { out.push(key); return out; }
        kids.forEach(function (k) { leavesOf(k, out); });
        return out;
    }
    function lessonNavHtml(cur) {
        var ser = seriesOf(cur), unit = (ser && CRUMBS[ser].unit) || '記事';
        var sib = ser ? leavesOf(ser, []) : childrenOf(CRUMBS[cur].parent), i = sib.indexOf(cur);
        var prev = i > 0 ? sib[i - 1] : null, next = i < sib.length - 1 ? sib[i + 1] : null;
        var nm = function (k) { return CRUMBS[k].title || CRUMBS[k].label; };
        var cells = [];
        var AR = function (d) { return '<span class="ar" aria-hidden="true">' + d + '</span>'; };
        if (prev) cells.push(navCell('prev', '前の' + unit, AR('←') + nm(prev), CRUMBS[prev].href));
        if (ser) cells.push(navCell('mid', 'シリーズ', CRUMBS[ser].label + 'の目次へ', CRUMBS[ser].href));
        if (next) cells.push(navCell('next', '次の' + unit, nm(next) + (CRUMBS[next].href ? AR('→') : ''), CRUMBS[next].href));
        if (!cells.length) return '';
        return '<nav class="lesson-nav' + (cells.length === 2 ? ' two' : '') + '" aria-label="前後の' + unit + '">' +
               cells.join('') + '</nav>';
    }
    function mountLessonNav(cur) {
        // .foot の位置は記事によって違う（物理は最後の section の中、
        // メモリーバースは .main 直下）。深さを問わず、その直後に置く。
        var foot = document.querySelector('.foot');
        if (!foot || !CRUMBS[cur].parent) return;
        var h = lessonNavHtml(cur);
        if (h) foot.insertAdjacentHTML('afterend', h);
    }

    /* --- まだ行き先が無いカードに「準備中」を付ける（§75）-----------------------
       ★ 手で書かない。判定は2通りで、どちらも自動：
         ① <a> ではない（＝ href が無い）カード。分野や技能の未着手分はこれ。
            これらはページでは無いので CRUMBS に行が無く、表からは引けない。
         ② <a> だが、行き先が CRUMBS で soon になっているページ。今は該当なし。
            （書き上がって soon を消すと、カードも自動で普通の表示に戻る） */
    function markSoonCards() {
        var byHref = {};
        Object.keys(CRUMBS).forEach(function (k) {
            if (CRUMBS[k].href) byHref[CRUMBS[k].href] = k;
        });
        [].forEach.call(document.querySelectorAll('.study-card'), function (c) {
            var href = c.getAttribute('href');
            var soon = !href;
            if (href) {
                var k = byHref[href.split('#')[0]];
                soon = !!(k && CRUMBS[k].soon);
            }
            if (!soon || c.querySelector('.card-soon')) return;
            c.classList.add('is-soon');
            c.insertAdjacentHTML('beforeend', '<span class="card-soon">準備中</span>');
        });
    }

    function mountCrumbs() {
        var node = (document.body && document.body.dataset && document.body.dataset.node) || '';
        if (!node || !CRUMBS[node]) return;
        var keys = chain(node);
        var rail = document.querySelector('.rail');
        mountSiteNav(node);
        mountLessonNav(node);
        if (rail) {
            if (keys.length > 1) rail.insertAdjacentHTML('afterbegin', upHtml(keys, 'rail-up'));
        } else {
            // レールが無いページ（分野・シリーズの一覧）は、h1 の上に同じ1行を置く。
            // 最上位（親が無い）なら何も出ない。
            var head = document.querySelector('.page-header'), h1 = head && head.querySelector('h1');
            var h = keys.length > 1 ? upHtml(keys, 'page-up') : '';
            if (h1 && h) h1.insertAdjacentHTML('beforebegin', h);
        }
    }

    var NAV_ITEMS = [
        ['index.html', 'ホーム'], ['self-intro.html', '自己紹介'], ['study.html', '勉強の軌跡'],
        ['videos.html', '動画'], ['blog.html', 'ブログ'], ['sns.html', '各種SNS']
    ];

    function navHtml(activeHref) {
        var lis = NAV_ITEMS.map(function (it) {
            var cls = it[0] === activeHref ? ' class="active"' : '';
            return '<li><a href="' + it[0] + '"' + cls + '>' + it[1] + '</a></li>';
        }).join('');
        return '<header>' +
            '<a class="logo" href="index.html">Academic Gates</a>' +
            '<nav>' +
                '<button class="menu-toggle" aria-label="メニューを開く" aria-expanded="false" aria-controls="nav-menu">' +
                    '<span></span><span></span><span></span>' +
                '</button>' +
                '<ul class="nav-menu" id="nav-menu">' + lis + '</ul>' +
            '</nav>' +
            '<a href="sns.html" class="btn btn-nav-cta">Connect <span class="btn-disc" aria-hidden="true">→</span></a>' +
        '</header>';
    }

    function footerHtml() {
        return '<footer>' +
            '<div class="footer-inner">' +
                '<div class="footer-brand">' +
                    '<span class="logo">Academic Gates</span>' +
                    '<p class="footer-tagline" lang="ja">学術領域の世界への入口を開くプラットフォーム。</p>' +
                '</div>' +
                '<nav class="footer-nav" aria-label="フッターナビゲーション">' +
                    '<span class="footer-col-label">Explore</span>' +
                    '<a href="index.html">ホーム</a>' +
                    '<a href="self-intro.html">自己紹介</a>' +
                    '<a href="study.html">勉強の軌跡</a>' +
                    '<a href="videos.html">動画</a>' +
                    '<a href="blog.html">ブログ</a>' +
                    '<a href="sns.html">各種SNS</a>' +
                '</nav>' +
                '<div class="footer-social">' +
                    '<span class="footer-col-label">Connect</span>' +
                    // X account deleted. Commented out rather than removed so it is trivially
                    // restorable if a new account is made. Matching card in html/sns.html.
                    // '<a href="https://x.com/miya_max_study" target="_blank" rel="noopener">X</a>' +
                    '<a href="https://www.instagram.com/daily_life_of_miya/" target="_blank" rel="noopener">Instagram</a>' +
                    '<a href="https://www.youtube.com/@miya-max-active" target="_blank" rel="noopener">YouTube</a>' +
                '</div>' +
            '</div>' +
            '<div class="footer-copy">&copy; 2025 Academic Gates. All rights reserved.</div>' +
        '</footer>';
    }

    function inject() {
        var page = (document.body && document.body.dataset && document.body.dataset.page) || '';
        var activeHref = ACTIVE[page] || '';
        var navSlot = document.getElementById('site-nav');
        var footSlot = document.getElementById('site-footer');
        if (navSlot) navSlot.innerHTML = navHtml(activeHref);
        if (footSlot) footSlot.innerHTML = footerHtml();

        // 教材ページのテーマ切替ボタンを、いま書き出したヘッダーの中へ移設する。
        // theme.js は <head> で読むので、この inject() より先に DOMContentLoaded
        // リスナーを登録している。そのままだとボタンがヘッダーを見つけられない。
        // 読み込んでいないページでは undefined なので何も起きない。
        if (typeof window.__agMountThemeBtn === 'function') window.__agMountThemeBtn();

        mountCrumbs();
        markSoonCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();

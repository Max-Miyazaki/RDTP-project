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
        'study':           { label: '勉強の軌跡',   href: 'study.html',
                             en: 'Learning Journey' },
        'physics':         { label: '物理学',       href: 'study_physics.html',    parent: 'study',
                             en: 'Physics' },
        'phys-math':       { label: '物理数学',     href: 'phys-math.html',        parent: 'physics', unit: '記事', unitEn: 'article',
                             en: 'Mathematics for Physics' },
        'phys-math:ch1':   { label: '1章 微分',                                    parent: 'phys-math',
                             en: 'Ch. 1 Differentiation' },
        'phys-math_1-1':   { label: 'SECTION 1-1',  href: 'phys-math_1-1.html',    parent: 'phys-math:ch1',
                             title: '1-1　微分の基礎',
                             titleEn: '1-1　Basics of Differentiation' },
        'phys-math_1-2':   { label: 'SECTION 1-2',  href: 'phys-math_1-2.html',    parent: 'phys-math:ch1',
                             title: '1-2　物理でよく使う関数の微分',
                             titleEn: '1-2　Derivatives of Functions Common in Physics' },
        // まだ書いていない記事。href の代わりに soon を立てると、ツリーと前後リンクに
        // 「（準備中）」として出る。書き上がったら soon を消して href を入れる。
        'phys-math:ch2':   { label: '2章 積分',                                    parent: 'phys-math',
                             en: 'Ch. 2 Integration' },
        'phys-math_2-1':   { label: 'SECTION 2-1',  href: 'phys-math_2-1.html',    parent: 'phys-math:ch2',
                             title: '2-1　積分の基礎',
                             titleEn: '2-1　Basics of Integration' },
        'phys-math_2-2':   { label: 'SECTION 2-2',  href: 'phys-math_2-2.html',    parent: 'phys-math:ch2',
                             title: '2-2　積分の技法',
                             titleEn: '2-2　Integration Techniques' },
        'phys-math:ch3':   { label: '3章 近似と展開',                              parent: 'phys-math',
                             en: 'Ch. 3 Approximation and Expansion' },
        'phys-math_3-1':   { label: 'SECTION 3-1',  href: 'phys-math_3-1.html',    parent: 'phys-math:ch3',
                             title: '3-1　近似と展開',
                             titleEn: '3-1　Approximation and Expansion' },
        'phys-math:ch4':   { label: '4章 複素数とオイラーの公式',                  parent: 'phys-math',
                             en: 'Ch. 4 Complex Numbers and Euler\'s Formula' },
        'phys-math_4-1':   { label: 'SECTION 4-1',  href: 'phys-math_4-1.html',    parent: 'phys-math:ch4',
                             title: '4-1　複素数とオイラーの公式',
                             titleEn: '4-1　Complex Numbers and Euler\'s Formula' },
        'phys-math_4-2':   { label: 'SECTION 4-2',  href: 'phys-math_4-2.html',    parent: 'phys-math:ch4',
                             title: '4-2　複素数で振動を扱う',
                             titleEn: '4-2　Treating Oscillations with Complex Numbers' },
        'phys-math:ch5':   { label: '5章 常微分方程式',                            parent: 'phys-math',
                             en: 'Ch. 5 Ordinary Differential Equations' },
        'phys-math_5-1':   { label: 'SECTION 5-1',  href: 'phys-math_5-1.html',    parent: 'phys-math:ch5',
                             title: '5-1　1階の微分方程式',
                             titleEn: '5-1　First-Order Differential Equations' },
        'phys-math_5-2':   { label: 'SECTION 5-2',  href: 'phys-math_5-2.html',    parent: 'phys-math:ch5',
                             title: '5-2　2階線形微分方程式',
                             titleEn: '5-2　Second-Order Linear Differential Equations' },
        'phys-math_5-3':   { label: 'SECTION 5-3',  href: 'phys-math_5-3.html',    parent: 'phys-math:ch5',
                             title: '5-3　強制振動と共鳴',
                             titleEn: '5-3　Forced Oscillation and Resonance' },
        'phys-math:ch6':   { label: '6章 多変数関数の微分',                        parent: 'phys-math',
                             en: 'Ch. 6 Differentiation of Multivariable Functions' },
        'phys-math_6-1':   { label: 'SECTION 6-1',  href: 'phys-math_6-1.html',    parent: 'phys-math:ch6',
                             title: '6-1　偏微分と全微分',
                             titleEn: '6-1　Partial and Total Derivatives' },
        'phys-math_6-2':   { label: 'SECTION 6-2',  href: 'phys-math_6-2.html',    parent: 'phys-math:ch6',
                             title: '6-2　多変数微分の応用',
                             titleEn: '6-2　Applications of Multivariable Differentiation' },
        'phys-math:ch7':   { label: '7章 多重積分と座標系',                        parent: 'phys-math',
                             en: 'Ch. 7 Multiple Integrals and Coordinate Systems' },
        'phys-math_7-1':   { label: 'SECTION 7-1',  href: 'phys-math_7-1.html',    parent: 'phys-math:ch7',
                             title: '7-1　重積分',
                             titleEn: '7-1　Multiple Integrals' },
        'phys-math_7-2':   { label: 'SECTION 7-2',  href: 'phys-math_7-2.html',    parent: 'phys-math:ch7',
                             title: '7-2　座標系の取り替えとヤコビアン',
                             titleEn: '7-2　Changing Coordinates and the Jacobian' },
        'phys-math:ch8':   { label: '8章 ベクトル解析',                            parent: 'phys-math',
                             en: 'Ch. 8 Vector Analysis' },
        'phys-math_8-1':   { label: 'SECTION 8-1',  href: 'phys-math_8-1.html',    parent: 'phys-math:ch8',
                             title: '8-1　ベクトルと場',
                             titleEn: '8-1　Vectors and Fields' },
        'phys-math_8-2':   { label: 'SECTION 8-2',  href: 'phys-math_8-2.html',    parent: 'phys-math:ch8',
                             title: '8-2　grad',
                             titleEn: '8-2　grad' },
        'phys-math_8-3':   { label: 'SECTION 8-3',  href: 'phys-math_8-3.html',    parent: 'phys-math:ch8',
                             title: '8-3　div と rot',
                             titleEn: '8-3　div and rot' },
        'phys-math_8-4':   { label: 'SECTION 8-4',  href: 'phys-math_8-4.html',    parent: 'phys-math:ch8',
                             title: '8-4　ガウスの定理とストークスの定理',
                             titleEn: '8-4　Gauss\'s Theorem and Stokes\' Theorem' },
        'phys-math:ch9':   { label: '9章 線形代数の物理的な使い方',                parent: 'phys-math',
                             en: 'Ch. 9 Using Linear Algebra in Physics' },
        'phys-math_9-1':   { label: 'SECTION 9-1',  href: 'phys-math_9-1.html',    parent: 'phys-math:ch9',
                             title: '9-1　行列は線形変換',
                             titleEn: '9-1　Matrices Are Linear Transformations' },
        'phys-math_9-2':   { label: 'SECTION 9-2',  href: 'phys-math_9-2.html',    parent: 'phys-math:ch9',
                             title: '9-2　固有値と対角化',
                             titleEn: '9-2　Eigenvalues and Diagonalization' },
        'phys-math_9-3':   { label: 'SECTION 9-3',  href: 'phys-math_9-3.html',    parent: 'phys-math:ch9',
                             title: '9-3　物理で出会う行列',
                             titleEn: '9-3　Matrices You Meet in Physics' },
        'phys-math_9-4':   { label: 'SECTION 9-4',  href: 'phys-math_9-4.html',    parent: 'phys-math:ch9',
                             title: '9-4　添字で計算する行列の公式',
                             titleEn: '9-4　Matrix Identities in Index Notation' },
        'phys-math:ch10':  { label: '10章 変分法',                                 parent: 'phys-math',
                             en: 'Ch. 10 Calculus of Variations' },
        'phys-math_10-1':  { label: 'SECTION 10-1', href: 'phys-math_10-1.html',   parent: 'phys-math:ch10',
                             title: '10-1　変分法',
                             titleEn: '10-1　Calculus of Variations' },
        'phys-math_10-2':  { label: 'SECTION 10-2', href: 'phys-math_10-2.html',   parent: 'phys-math:ch10',
                             title: '10-2　条件付きの変分と場の変分',
                             titleEn: '10-2　Constrained Variations and Variations of Fields' },
        // 情報科学（DESIGN.md §137）。親は addDisciplines() が形式科学の下へ付け替える。
        // サイバーセキュリティ基礎の節は、書き上げたものから cyber:chN の下に足す（まだ無い章は行ごと足さない）。
        'informatics':     { label: '情報科学',     href: 'study_informatics.html', parent: 'study',
                             en: 'Informatics' },
        'cyber':           { label: 'サイバーセキュリティ基礎', href: 'cyber.html', parent: 'informatics', unit: '節', unitEn: 'section',
                             en: 'Cybersecurity Fundamentals' },
        'cyber:ch1':       { label: '1章 ネットワークの仕組み',                     parent: 'cyber',
                             en: 'Ch. 1 How Networks Work' },
        'cyber_1-1':       { label: 'SECTION 1-1',  href: 'cyber_1-1.html',        parent: 'cyber:ch1',
                             title: '1-1　パケットとIP',
                             titleEn: '1-1　Packets and IP' },
        'cyber_1-2':       { label: 'SECTION 1-2',  href: 'cyber_1-2.html',        parent: 'cyber:ch1',
                             title: '1-2　TCPとポート、3-wayハンドシェイク',
                             titleEn: '1-2　TCP, Ports, and the 3-Way Handshake' },
        'cyber_1-3':       { label: 'SECTION 1-3',  href: 'cyber_1-3.html',        parent: 'cyber:ch1',
                             title: '1-3　UDP・ICMP と主要プロトコル',
                             titleEn: '1-3　UDP, ICMP, and Key Protocols' },
        'cyber_1-4':       { label: 'SECTION 1-4',  href: 'cyber_1-4.html',        parent: 'cyber:ch1',
                             title: '1-4　階層モデル（OSI / TCP-IP）で全体を捉える',
                             titleEn: '1-4　Seeing the Whole Picture with Layer Models (OSI / TCP-IP)' },
        // 複合分野：学問分野と精神の圏域のあいだの枠（DESIGN.md §103）。いまは「地球と人類」だけ。
        'composite':       { label: '複合分野',     href: 'study_composite.html',  parent: 'study',
                             en: 'Themes' },
        // 地球と人類は構成を検討中なので、リンクなしの準備中（§136.7）。earthhuman.html は古いリンクのために残してある
        //  （タイトルと「準備中」だけ）。ページを書いたら soon を消して href: 'earthhuman.html' を戻す。
        'earthhuman':      { label: '地球と人類',   soon: true, file: 'earthhuman.html',                    parent: 'composite',
                             en: 'Earth & Humankind' },
        'skills':          { label: '精神の圏域',   href: 'study_skills.html',     parent: 'study',
                             en: 'Orbis Mentis' },
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
        'memoryverse_2-2': { label: '2-2',          href: 'memoryverse_2-2.html',  parent: 'memoryverse:ch2',
                             title: '2-2　プレートと大地形' },
        'memoryverse_2-3': { label: '2-3',          href: 'memoryverse_2-3.html',  parent: 'memoryverse:ch2',
                             title: '2-3　気候と海流' },
        // 3章は地域の記事だけを登録する。国のページ（html/country/）は登録しない——約200枚で木が使えなくなるため。
        // 国のページへは記事から入り、国のページは記事へ戻る1本の導線を持つ（DESIGN.md §100.2）。
        'memoryverse:ch3': { label: '3章 各地域',                                  parent: 'memoryverse' },
        'memoryverse_3-1': { label: '3-1',          href: 'memoryverse_3-1.html',  parent: 'memoryverse:ch3',
                             title: '3-1　西ヨーロッパ' },
        'memoryverse_3-2': { label: '3-2',          href: 'memoryverse_3-2.html',  parent: 'memoryverse:ch3',
                             title: '3-2　南ヨーロッパ' },
        'memoryverse_3-3': { label: '3-3',          href: 'memoryverse_3-3.html',  parent: 'memoryverse:ch3',
                             title: '3-3　北ヨーロッパ' },
        'memoryverse_3-4': { label: '3-4',          href: 'memoryverse_3-4.html',  parent: 'memoryverse:ch3',
                             title: '3-4　東ヨーロッパ' },
    };

    /* --- 学問の7大分類と34の学問を、勉強の軌跡の下に差し込む（DESIGN.md §136.4）----
       データは js/disciplines.js（ホームの学問の樹・勉強の軌跡と共有）。全ページで layout.js より先に読む。
       - 大分類は href を持たない層（章と同じ）→ ツリーでは開閉する見出し。「一つ上へ」・前後リンクは飛ばす
       - 独自ページのある学問は、CRUMBS の既存の行（例：physics）をその大分類の下へ付け替える
       - ページの無い学問は soon（リンクなし・控えめな色）。学問を複合分野（テーマ）に結び付けない（§136.7）
       - 並びは 7大分類 → 複合分野 → 精神の圏域（勉強の軌跡のページと同じ順） */
    (function addDisciplines() {
        if (typeof DISCIPLINES === 'undefined' || !CRUMBS.study) return;
        var byHref = {};
        Object.keys(CRUMBS).forEach(function (k) { if (CRUMBS[k].href) byHref[CRUMBS[k].href] = k; });
        var out = { study: CRUMBS.study };
        DISCIPLINES.forEach(function (c) {
            var ck = 'cat:' + c.cat;
            out[ck] = { label: c.ja, en: c.en, parent: 'study' };
            c.subjects.forEach(function (sj) {
                var own = sj.page && byHref[sj.page];
                if (own) { CRUMBS[own].parent = ck; out[own] = CRUMBS[own]; return; }
                var row = { label: sj.ja, en: sj.en, parent: ck };
                if (sj.page) row.href = sj.page; else row.soon = true;
                out['subject:' + sj.key] = row;
            });
        });
        Object.keys(CRUMBS).forEach(function (k) { if (!out[k]) out[k] = CRUMBS[k]; });
        CRUMBS = out;
    })();

    /* --- ページの言語に合わせる（DESIGN.md §139）--------------------------------
       - 反対の言語の限定ページ（英語のページから見た日本語限定など）の行は、その下の行ごと消す
       - 英語のページでは名前を en / titleEn に替え、英語版がまだ無いページは soon（Coming soon）にする
       日本語のページでは、英語限定のページが無いあいだは何も変わらない */
    var I18N = AG_I18N;
    (function localize() {
        var gone = {};
        // 切り替えボタンが上の階層をたどるときのために、置き換える前の行き先と日本語名を残す
        Object.keys(CRUMBS).forEach(function (k) {
            var c = CRUMBS[k];
            c.page = c.href || c.file;
            c.ja = c.label;
        });
        Object.keys(CRUMBS).forEach(function (k) {
            var f = CRUMBS[k].href || CRUMBS[k].file;
            if (f && !I18N.listed(f)) gone[k] = 1;
        });
        Object.keys(CRUMBS).forEach(function (k) {
            for (var p = k; p; p = CRUMBS[p] && CRUMBS[p].parent) if (gone[p]) { delete CRUMBS[k]; return; }
        });
        if (I18N.lang === 'ja') return;
        Object.keys(CRUMBS).forEach(function (k) {
            var c = CRUMBS[k];
            c.label = I18N.pick(c.label, c.en || (/[^\x00-\x7f]/.test(c.label) ? '' : c.label));
            if (c.title) c.title = I18N.pick(c.title, c.titleEn);
            if (c.unit) c.unit = I18N.pick(c.unit, c.unitEn);
            if (c.href && !I18N.href(c.href)) { delete c.href; c.soon = true; }
        });
    })();

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
                  '" aria-label="' + I18N.t('sitenav.expand', { name: name }) + '"></button>'
                : '<span class="tw tw--leaf" aria-hidden="true"></span>') +
            (c.href
                ? '<a href="' + c.href + '"' + (key === cur ? ' class="cur" aria-current="page"' : '') + '>' + name + '</a>'
                : c.soon
                    ? '<span class="soon">' + name + I18N.t('soon.paren') + '</span>'
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
        return '<button class="sitenav-tab" id="sitenavTab" type="button" aria-expanded="false" aria-controls="sitenav">' + I18N.t('sitenav.tab') + '</button>' +
            '<div class="sitenav-scrim" id="sitenavScrim"></div>' +
            '<aside class="sitenav" id="sitenav" aria-label="' + I18N.t('sitenav.title') + '">' +
                '<div class="sitenav__hd"><span>' + I18N.t('sitenav.title') + '</span>' +
                    '<button class="sitenav__x" type="button" aria-label="' + I18N.t('sitenav.close') + '">✕</button></div>' +
                '<nav class="sitenav__body"><ul class="tree">' +
                    roots.map(function (k) { return treeHtml(k, cur, open); }).join('') +
                '</ul></nav>' +
            '</aside>';
    }
    function mountSiteNav(cur) {
        document.body.insertAdjacentHTML('beforeend', siteNavHtml(cur));
        var tab = document.getElementById('sitenavTab'),
            hdBtn = document.getElementById('sitenavHdBtn'),   // 幅 768px 以下ではこちら（ヘッダーの中）
            box = document.getElementById('sitenav'),
            scrim = document.getElementById('sitenavScrim'),
            x = box.querySelector('.sitenav__x'),
            opener = tab;
        function set(on) {
            document.body.classList.toggle('sitenav-open', on);
            [tab, hdBtn].forEach(function (b) { if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
            if (on) { var f = box.querySelector('.cur') || x; if (f) f.focus(); } else if (opener) { opener.focus(); }
        }
        function toggleFrom(btn) {
            return function () {
                opener = btn;
                // モバイルのメニューが開いていたら閉じる（パネルと重ねない）
                var mt = document.querySelector('.menu-toggle'), nm = document.querySelector('.nav-menu');
                if (mt && nm) { mt.setAttribute('aria-expanded', 'false'); nm.classList.remove('active'); }
                set(!document.body.classList.contains('sitenav-open'));
            };
        }
        tab.addEventListener('click', toggleFrom(tab));
        if (hdBtn) hdBtn.addEventListener('click', toggleFrom(hdBtn));
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
            : '<span class="' + cls + ' soon"><b>' + cap + '</b>' + text + I18N.t('soon.paren') + '</span>';
    }
    // シリーズの中の記事を、章をまたいで表の順に並べたもの（＝前後の順）。
    function leavesOf(key, out) {
        var kids = childrenOf(key);
        if (!kids.length) { out.push(key); return out; }
        kids.forEach(function (k) { leavesOf(k, out); });
        return out;
    }
    function lessonNavHtml(cur) {
        var ser = seriesOf(cur), unit = (ser && CRUMBS[ser].unit) || I18N.pick('記事', 'article');
        var sib = ser ? leavesOf(ser, []) : childrenOf(CRUMBS[cur].parent), i = sib.indexOf(cur);
        var prev = i > 0 ? sib[i - 1] : null, next = i < sib.length - 1 ? sib[i + 1] : null;
        var nm = function (k) { return CRUMBS[k].title || CRUMBS[k].label; };
        var cells = [];
        var AR = function (d) { return '<span class="ar" aria-hidden="true">' + d + '</span>'; };
        if (prev) cells.push(navCell('prev', I18N.t('lesson.prev', { unit: unit }), AR('←') + nm(prev), CRUMBS[prev].href));
        if (ser) cells.push(navCell('mid', I18N.t('lesson.series'), I18N.t('lesson.toc', { name: CRUMBS[ser].label }), CRUMBS[ser].href));
        if (next) cells.push(navCell('next', I18N.t('lesson.next', { unit: unit }), nm(next) + (CRUMBS[next].href ? AR('→') : ''), CRUMBS[next].href));
        if (!cells.length) return '';
        return '<nav class="lesson-nav' + (cells.length === 2 ? ' two' : '') + '" aria-label="' + I18N.t('lesson.label', { unit: unit }) + '">' +
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
                // ③ 行き先が反対の言語の限定ページなら、カードごと出さない。
                //    いまの言語の版がまだ無い共通ページなら「準備中」にして、リンクを外す（§139）
                if (!I18N.listed(href)) { c.remove(); return; }
                if (!I18N.href(href)) { c.removeAttribute('href'); soon = true; }
                var k = byHref[href.split('#')[0]];
                soon = soon || !!(k && CRUMBS[k].soon);
            }
            if (!soon || c.querySelector('.card-soon')) return;
            c.classList.add('is-soon');
            c.insertAdjacentHTML('beforeend', '<span class="card-soon">' + I18N.t('soon') + '</span>');
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

    // ナビ・フッターの6ページ。名前は i18n.js の nav.*。
    // 英語のページで、英語版がまだ無いページは日本語版へ（ナビは一覧ではないので「準備中」にしない。§139）
    var NAV_ITEMS = ['index.html', 'self-intro.html', 'study.html', 'videos.html', 'blog.html', 'sns.html'].map(function (f) {
        return [f, I18N.t('nav.' + f.replace('.html', ''))];
    });
    function navLink(f) {
        return I18N.href(f) ? 'href="' + f + '"' : 'href="../' + f + '" hreflang="ja"';
    }

    // サイト構成のパネルを持つページか（body[data-node] が CRUMBS にある）
    function hasSiteNav() {
        var node = (document.body && document.body.dataset && document.body.dataset.node) || '';
        return !!(node && CRUMBS[node]);
    }

    /* --- 日本語・英語の切り替え（DESIGN.md §139.7）------------------------------
       英語のホーム（en/index.html）があるときだけ出す。押したときの行き先は3通り：
         pair ：このページに相手の言語版がある → そのページへ
         note ：共通ページだが相手の言語版がまだ無い → 移動せず、ボタンの下に案内と、
                相手の言語版がある一番近い上の階層（無ければホーム）へのリンク
         jump ：このページは今の言語の限定ページ → 相手の言語版がある一番近い上の階層へそのまま移動
       選んだ言語は localStorage（ag-lang）に覚える。勝手に転送はしない */
    var LANG_KEY = 'ag-lang';
    function langTarget() {
        var other = I18N.lang === 'ja' ? 'en' : 'ja';
        if (!I18N.has('index.html', 'en')) return null;
        var m = location.pathname.match(/\/html\/(?:en\/)?(.*)$/);
        var f = (m && m[1]) || 'index.html';
        if (/\/$/.test(f) || !f) f += 'index.html';
        // 相手の言語のページへの href（ページの基準は html/ か html/en/。国のページは <base> で html/）
        var pre = other === 'en' ? 'en/' : '../';
        var name = function (k, page) {
            var nav = /^(index|self-intro|study|videos|blog|sns)\.html$/.exec(page);
            if (nav) return I18N.t('nav.' + nav[1], null, other);
            var c = k && CRUMBS[k];
            return c ? (other === 'en' ? (c.en || c.ja) : c.ja) : I18N.t('nav.index', null, other);
        };
        if (I18N.has(f, other)) return { mode: 'pair', other: other, href: pre + f };
        var node = (document.body && document.body.dataset && document.body.dataset.node) || '', page = 'index.html', key = null;
        for (var k = CRUMBS[node] && CRUMBS[node].parent; k && CRUMBS[k]; k = CRUMBS[k].parent) {
            if (CRUMBS[k].page && I18N.has(CRUMBS[k].page, other)) { page = CRUMBS[k].page; key = k; break; }
        }
        return { mode: I18N.kind(f) === 'both' ? 'note' : 'jump', other: other, href: pre + page, name: name(key, page) };
    }
    function langHtml(tg) {
        if (!tg) return '';
        var cur = I18N.lang, o = tg.other, up = function (l) { return l.toUpperCase(); };
        var full = I18N.t('lang.' + o, null, o);
        var alt = tg.mode === 'note'
            ? '<button class="lang-switch__alt js-lang" type="button" lang="' + o + '" aria-label="' + full + '" aria-expanded="false" aria-controls="lang-note">' + up(o) + '</button>'
            : '<a class="lang-switch__alt js-lang" href="' + tg.href + '" hreflang="' + o + '" lang="' + o + '" aria-label="' + full +
              (tg.mode === 'jump' ? ' — ' + tg.name : '') + '">' + up(o) + '</a>';
        var note = tg.mode !== 'note' ? '' :
            '<div class="lang-note" id="lang-note" lang="' + o + '" hidden>' +
                '<p>' + I18N.t('lang.missing', null, o) + '</p>' +
                '<a class="js-lang-go" href="' + tg.href + '" hreflang="' + o + '">' + I18N.t('lang.goto', { name: tg.name }, o) + ' <span aria-hidden="true">→</span></a>' +
                '<button class="lang-note__x" type="button" aria-label="' + I18N.t('lang.close', null, o) + '">✕</button>' +
            '</div>';
        // 並びはどちらの言語でも JA / EN（いまの言語は明るい字、相手の言語がリンク）
        var curHtml = '<span class="lang-switch__cur" lang="' + cur + '" aria-current="true">' + up(cur) + '</span>';
        var sep = '<span class="lang-switch__sep" aria-hidden="true">/</span>';
        return '<div class="lang-switch" role="group" aria-label="' + I18N.t('lang.group') + '">' +
                (cur === 'ja' ? curHtml + sep + alt : alt + sep + curHtml) +
            '</div>' + note;
    }
    // モバイルで幅が足りないとき（375px 未満でサイト構成のボタンもあるページ）は、メニューの最後の行に同じものを出す（CSS で切り替え）
    function langMenuHtml(tg) {
        if (!tg) return '';
        var o = tg.other, full = I18N.t('lang.' + o, null, o);
        return '<li class="nav-lang">' + (tg.mode === 'note'
            ? '<button class="js-lang" type="button" lang="' + o + '" aria-expanded="false" aria-controls="lang-note">' + full + '</button>'
            : '<a class="js-lang" href="' + tg.href + '" hreflang="' + o + '" lang="' + o + '">' + full + '</a>') + '</li>';
    }
    function mountLang(tg) {
        if (!tg) return;
        var note = document.getElementById('lang-note');
        var remember = function () { try { localStorage.setItem(LANG_KEY, tg.other); } catch (e) { } };
        [].forEach.call(document.querySelectorAll('.js-lang, .js-lang-go'), function (el) {
            if (el.tagName === 'A') { el.addEventListener('click', remember); return; }
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                var on = note.hidden;
                // モバイルのメニューが開いていたら閉じる（案内と重ねない）
                var mt = document.querySelector('.menu-toggle'), nm = document.querySelector('.nav-menu');
                if (mt && nm) { mt.setAttribute('aria-expanded', 'false'); nm.classList.remove('active'); }
                setNote(on);
            });
        });
        if (!note) return;
        function setNote(on) {
            note.hidden = !on;
            [].forEach.call(document.querySelectorAll('button.js-lang'), function (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
            if (on) note.querySelector('a').focus();
        }
        note.querySelector('.lang-note__x').addEventListener('click', function () { setNote(false); document.querySelector('.lang-switch button.js-lang').focus(); });
        document.addEventListener('click', function (e) { if (!note.hidden && !note.contains(e.target)) setNote(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !note.hidden) setNote(false); });
    }

    function navHtml(activeHref, tg) {
        var lis = NAV_ITEMS.map(function (it) {
            var cls = it[0] === activeHref ? ' class="active"' : '';
            return '<li><a ' + navLink(it[0]) + cls + '>' + it[1] + '</a></li>';
        }).join('');
        return '<header>' +
            '<a class="logo" ' + navLink('index.html') + '>Academic Gates</a>' +
            '<nav>' +
                '<button class="menu-toggle" aria-label="' + I18N.t('nav.menu') + '" aria-expanded="false" aria-controls="nav-menu">' +
                    '<span></span><span></span><span></span>' +
                '</button>' +
                '<ul class="nav-menu" id="nav-menu">' + lis + langMenuHtml(tg) + '</ul>' +
            '</nav>' +
            langHtml(tg) +
            (hasSiteNav() ? '<button class="sitenav-hdbtn" id="sitenavHdBtn" type="button" aria-expanded="false" aria-controls="sitenav">' + I18N.t('sitenav.tab') + '</button>' : '') +
            '<a ' + navLink('sns.html') + ' class="btn btn-nav-cta">Connect <span class="btn-disc" aria-hidden="true">→</span></a>' +
        '</header>';
    }

    function footerHtml() {
        return '<footer>' +
            '<div class="footer-inner">' +
                '<div class="footer-brand">' +
                    '<span class="logo">Academic Gates</span>' +
                    '<p class="footer-tagline"' + (I18N.lang === 'ja' ? ' lang="ja"' : '') + '>' + I18N.t('footer.tagline') + '</p>' +
                '</div>' +
                '<nav class="footer-nav" aria-label="' + I18N.t('footer.label') + '">' +
                    '<span class="footer-col-label">Explore</span>' +
                    NAV_ITEMS.map(function (it) { return '<a ' + navLink(it[0]) + '>' + it[1] + '</a>'; }).join('') +
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
        var tg = langTarget();
        if (navSlot) navSlot.innerHTML = navHtml(activeHref, tg);
        if (footSlot) footSlot.innerHTML = footerHtml();

        // 教材ページのテーマ切替ボタンを、いま書き出したヘッダーの中へ移設する。
        // theme.js は <head> で読むので、この inject() より先に DOMContentLoaded
        // リスナーを登録している。そのままだとボタンがヘッダーを見つけられない。
        // 読み込んでいないページでは undefined なので何も起きない。
        if (typeof window.__agMountThemeBtn === 'function') window.__agMountThemeBtn();

        mountCrumbs();
        markSoonCards();
        mountLang(tg);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();

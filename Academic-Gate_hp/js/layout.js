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

    // data-page → the nav link to mark active. Section notes (peskin) highlight 勉強の軌跡.
    var ACTIVE = {
        index: 'index.html', 'self-intro': 'self-intro.html', study: 'study.html',
        videos: 'videos.html', blog: 'blog.html', sns: 'sns.html', peskin: 'study.html'
    };

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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();

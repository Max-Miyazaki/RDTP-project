/* メモリーバース 3章 国のカード（DESIGN.md §100）
   ・層のボタン（層1〜3）と中身のボタン（川・湖・…）で、カードの中の図の表示を切り替える
   ・図（SVG）は別ファイル。カードが画面に近づいたときに fetch で取ってきて枠に差し込む。
     <img> では層の切り替え（SVG の中の class を CSS で消す）が効かないので、中身を文書に入れる。
     取ってくるまでは「読み込み中」、失敗したら「地図を読み込めませんでした」（2-1 の .planet-img .fallback と同じ考え方）
   国のページ（html/country/*.html）と、あとで地域の記事に差し込むカードの両方で使う。 */
(function () {
    'use strict';

    function on(b) { return b.getAttribute('aria-pressed') === 'true'; }
    function set(b, v) { b.setAttribute('aria-pressed', v ? 'true' : 'false'); }

    function setupButtons(card) {
        var subs = [].slice.call(card.querySelectorAll('.cc-sub'));
        var lays = [].slice.call(card.querySelectorAll('.cc-lay'));
        function render() {
            subs.forEach(function (b) { card.classList.toggle('off-' + b.dataset.k, !on(b)); });
            lays.forEach(function (b) { card.classList.toggle('off-' + b.dataset.layer, !on(b)); });
        }
        // 層のボタン：層と中身を一緒に切り替える（中身が個別に消えたままだと、層だけ点けても何も出ないため）。
        // 0のもの（disabled）は点けない。
        lays.forEach(function (b) {
            b.addEventListener('click', function () {
                var v = !on(b);
                set(b, v);
                subs.forEach(function (s) { if (s.dataset.layer === b.dataset.layer && !s.disabled) set(s, v); });
                render();
            });
        });
        // 中身のボタン：その項目だけ。層は、中身が1つでも出ていれば出す
        subs.forEach(function (s) {
            if (s.disabled) return;
            s.addEventListener('click', function () {
                set(s, !on(s));
                var L = lays.filter(function (b) { return b.dataset.layer === s.dataset.layer; })[0];
                if (L) set(L, subs.some(function (x) { return x.dataset.layer === s.dataset.layer && on(x); }));
                render();
            });
        });
        render();
    }

    function loadFigure(fig) {
        if (fig.dataset.state) return;
        fig.dataset.state = 'loading';
        // 相対パスは文書の base に対して解決される（国のページは <base href="../">）
        fetch(fig.dataset.src).then(function (r) {
            if (!r.ok) throw new Error(r.status);
            return r.text();
        }).then(function (text) {
            if (text.indexOf('<svg') < 0) throw new Error('not svg');
            fig.insertAdjacentHTML('afterbegin', text.slice(text.indexOf('<svg')));
            fig.classList.add('is-loaded');
            fig.dataset.state = 'loaded';
        }).catch(function () {
            fig.classList.add('is-failed');
            fig.dataset.state = 'failed';
        });
    }

    function loadCard(card) {
        [].forEach.call(card.querySelectorAll('.cc-fig[data-src]'), loadFigure);
    }

    function init() {
        var cards = [].slice.call(document.querySelectorAll('.cc-card'));
        cards.forEach(setupButtons);
        if (!('IntersectionObserver' in window)) { cards.forEach(loadCard); return; }
        // 最初にカードが画面に近づいたときに取りに行く（2-1 の地図の loading="lazy" と同じ考え方）
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { io.unobserve(e.target); loadCard(e.target); }
            });
        }, { rootMargin: '400px 0px' });
        cards.forEach(function (c) { io.observe(c); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

/* ============================================================================
   accordion.js — 目次のアコーディオン（入れ子対応）

   study.html と分野ページ（study_*.html）が共有する。もともと study.html に
   インラインで書いていたものを、分野ページが増えるたびに複製しないよう切り出した。

   規約:
   - トグルは <button class="accordion-toggle">、その「次の兄弟要素」が中身。
   - 開閉は display の切り替えだが、aria-expanded を必ず同期させる。
   - <button> なので Tab で辿れ、Enter / Space で開閉できる（キーボード操作は
     ブラウザ既定のまま。独自のキーハンドラは持たない）。
   - 閉じている中身は display:none なので、Tab 順からも支援技術からも外れる。

   URL のハッシュ（例 study_physics.html#phys-math）が閉じたアコーディオンの
   中身を指しているときは、祖先も含めて開いてからスクロールする。記事から科目へ
   戻る導線が「開いていないので何も見えない」状態に着地しないようにするため。
   ============================================================================ */
(function () {
    'use strict';

    function bind(toggle) {
        var content = toggle.nextElementSibling;
        if (!content) return;

        // 初期状態は収納
        content.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');

        toggle.addEventListener('click', function () {
            var open = content.style.display === 'block';
            content.style.display = open ? 'none' : 'block';
            toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
    }

    function openFromHash() {
        var id = (window.location.hash || '').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;

        // 対象そのものと、その祖先にある閉じたアコーディオンを開く
        var el = target;
        while (el && el !== document.body) {
            if (el.className && (' ' + el.className + ' ').indexOf(' accordion-content ') > -1) {
                var toggle = el.previousElementSibling;
                if (toggle && (' ' + toggle.className + ' ').indexOf(' accordion-toggle ') > -1) {
                    el.style.display = 'block';
                    toggle.setAttribute('aria-expanded', 'true');
                }
            }
            el = el.parentElement;
        }
        target.scrollIntoView();
    }

    function init() {
        var toggles = document.querySelectorAll('.accordion-toggle');
        for (var i = 0; i < toggles.length; i++) bind(toggles[i]);
        openFromHash();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

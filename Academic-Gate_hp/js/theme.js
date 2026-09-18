/* Academic Gates — ライト／ダーク切り替え（教材ページ専用）
 * <head> の中で、CSS より前に同期読み込みすること（defer / async を付けない）。
 * 表示前にテーマを決めるので、一瞬ダークが見える現象を防げる。
 * 選んだテーマは localStorage("ag-theme") に保存される。
 *
 * 本体6ページには読み込ませないこと。css/style.css にライト用の値が無いので、
 * ボタンだけ出て何も起きない状態になる（DESIGN.md §20.4）。
 * 2段構え：(1) テーマ決定は <head> で同期に、(2) ボタン設置は layout.js が
 * ヘッダーを書き出したあと（DOMContentLoaded）に行う。
 */
(function () {
    var KEY = 'ag-theme';
    var root = document.documentElement;
    var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;

    function saved() {
        try { var t = localStorage.getItem(KEY); return (t === 'light' || t === 'dark') ? t : null; }
        catch (e) { return null; }
    }
    function system() { return mq && mq.matches ? 'light' : 'dark'; }
    function apply(t) { root.setAttribute('data-theme', t); }

    // 1. 表示前に決める（保存 > 端末設定 > ダーク）
    apply(saved() || system());

    // まだ選んでいない人は、端末設定の変更に追従する
    if (mq && mq.addEventListener) {
        mq.addEventListener('change', function () { if (!saved()) { apply(system()); sync(); } });
    }

    // 2. ボタンを置く
    var btn;
    function sync() {
        if (!btn) return;
        var light = root.getAttribute('data-theme') === 'light';
        btn.textContent = light ? '☾' : '☀';
        btn.setAttribute('aria-label', light ? 'ダークモードに切り替え' : 'ライトモードに切り替え');
        btn.title = btn.getAttribute('aria-label');
    }

    // 何度呼ばれても安全。ヘッダーがあればその中へ、無ければ左下へ。
    // layout.js がヘッダーを書き出した「後」にもう一度呼ばれ、そこで移設される。
    function mount() {
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-btn';
            btn.addEventListener('click', function () {
                var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                apply(t);
                try { localStorage.setItem(KEY, t); } catch (e) { }
                sync();
            });
        }

        var header = document.querySelector('header');
        var connect = header && header.querySelector('.btn-nav-cta');
        if (header) {
            // 浮遊ナビの中（Connect ボタンの前）
            btn.classList.remove('theme-btn--float');
            header.insertBefore(btn, connect || null);
        } else if (!btn.parentElement) {
            // ヘッダーがまだ無い／そもそも無いページ：画面左下に固定
            btn.classList.add('theme-btn--float');
            document.body.appendChild(btn);
        }
        sync();
    }

    // layout.js から呼ばれるフック。**順序の理由**：layout.js もヘッダーの注入を
    // DOMContentLoaded で行うが、このファイルは <head> にあるぶんリスナー登録が
    // 先になり、mount() のほうが inject() より先に走ってしまう。待ち合わせを
    // ポーリングではなく明示的な呼び出しで確定させる。
    window.__agMountThemeBtn = mount;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();
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
            // 押せない層のボタン（取得待ちなど）は切り替えない。層は消えたまま（render で off-* が付く）
            if (b.disabled) return;
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

    // 拡大表示の中の拡大・移動（DESIGN.md §108）。SVG の viewBox を動かす。ライブラリは使わない。
    // ★ ラベルは逆に縮めて、画面の上の大きさを保つ（文字まで大きくなると、重なりが解けない）。縮める中心は text-anchor に合わせた端
    //   （左寄せのラベルは左端）なので、ラベルは指しているものの横から離れない。
    // ★ 縮尺を「1度＝◯px（覚えるための縮尺 1度◯px の◯倍）」で出す。覚えるための縮尺から離れていることが分かるように。
    var ZMAX = 16;
    function zoomable(fig) {
        var svg = fig.querySelector('svg');
        if (!svg || fig._zoom) return fig._zoom;
        var v0 = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);   // [x, y, w, h] 全体
        var v = v0.slice(), mixed = fig.dataset.deg === 'mixed', deg = Number(fig.dataset.deg) || 44;
        // 点の横に置いた都市名は、文字の端ではなく点を中心に縮め戻す（でないと拡大につれて点から離れる）
        [].forEach.call(svg.querySelectorAll('text[data-ax]'), function (t) {
            var b = t.getBBox();
            if (!b.width || !b.height) return;
            t.style.transformOrigin = ((t.dataset.ax - b.x) / b.width * 100).toFixed(2) + '% ' + ((t.dataset.ay - b.y) / b.height * 100).toFixed(2) + '%';
        });
        var bar = document.createElement('div'), out = document.createElement('div');
        bar.className = 'cc-zoombar';
        bar.innerHTML = '<button type="button" data-z="in" aria-label="拡大">＋</button><button type="button" data-z="out" aria-label="縮小">−</button>'
                      + '<button type="button" data-z="fit">全体を表示</button>';
        out.className = 'cc-zoomscale';
        fig.appendChild(bar); fig.appendChild(out);
        function px() { return svg.getBoundingClientRect().width / v[2]; }     // 画面の1px あたりの SVG 単位の逆数
        function z() { return v0[2] / v[2]; }
        function clamp() {
            v[0] = Math.min(Math.max(v[0], v0[0]), v0[0] + v0[2] - v[2]);
            v[1] = Math.min(Math.max(v[1], v0[1]), v0[1] + v0[3] - v[3]);
        }
        function draw() {
            clamp();
            svg.setAttribute('viewBox', v.map(function (n) { return +n.toFixed(3); }).join(' '));
            // 文字と点の大きさ：全体表示のときの大きさを保つ。ただし全体表示が作った大きさ（SVG の1単位＝1px）より小さい
            // 画面（390px など）では、拡大につれて作った大きさまでは大きくなり、そこから先は保つ
            var ppu = px(), s = Math.max(ppu / z(), Math.min(ppu, 1));
            svg.style.setProperty('--inv', (s / ppu).toFixed(4));
            svg.style.touchAction = z() > 1.001 ? 'none' : 'pan-y';        // 全体のときは縦に送れる（日本は2枚を縦に並べる）
            var p1 = deg * px();
            out.textContent = mixed ? '全体表示の' + z().toFixed(1) + '倍（枠ごとの倍率は図の中）'      // 拡大図：枠ごとに縮尺が違うので1度の長さは出さない
                : '1度＝' + Math.round(p1).toLocaleString() + 'px（覚えるための縮尺 1度' + deg.toLocaleString() + 'px の'
                            + (p1 / deg).toFixed(1) + '倍）';
        }
        function zoomAt(f, cx, cy) {                                         // cx, cy は svg の左上からの画面上の px
            var nz = Math.min(Math.max(z() * f, 1), ZMAX), k = px();
            var sx = v[0] + cx / k, sy = v[1] + cy / k;
            v[2] = v0[2] / nz; v[3] = v0[3] / nz;
            var k2 = svg.getBoundingClientRect().width / v[2];
            v[0] = sx - cx / k2; v[1] = sy - cy / k2;
            draw();
        }
        function center(f) { var r = svg.getBoundingClientRect(); zoomAt(f, r.width / 2, r.height / 2); }
        bar.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return;
            if (b.dataset.z === 'in') center(1.6); else if (b.dataset.z === 'out') center(1 / 1.6);
            else { v = v0.slice(); draw(); }
        });
        svg.addEventListener('wheel', function (e) {
            if (!fig.closest('.cc-card').classList.contains('is-full')) return;
            e.preventDefault();
            var r = svg.getBoundingClientRect();
            zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
        }, { passive: false });
        svg.addEventListener('dblclick', function (e) {
            if (!fig.closest('.cc-card').classList.contains('is-full')) return;
            var r = svg.getBoundingClientRect(); zoomAt(2, e.clientX - r.left, e.clientY - r.top);
        });
        // ドラッグで移動、2本の指でつまんで拡大（Pointer Events）
        // ★ 国名のリンク（地域のカード。DESIGN.md §118）と区別する：押しただけでは捕まえず、4px 以上動いてから地図を動かす。
        //   動かしたあとの click は取り消す（リンクに飛ばない）。押した時点で setPointerCapture すると、click が svg に吸われてリンクが効かない
        var pts = {}, last = null, moved = false, MOVE = 4;
        function mid() { var a = Object.values(pts); return a.length < 2 ? null : { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; }
        svg.addEventListener('pointerdown', function (e) {
            if (!fig.closest('.cc-card').classList.contains('is-full')) return;
            if (Object.keys(pts).length === 0) moved = false;
            pts[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
            if (Object.keys(pts).length >= 2) {                                   // 2本目の指：つまむ操作。リンクではない
                moved = true;
                Object.keys(pts).forEach(function (id) { try { svg.setPointerCapture(Number(id)); } catch (err) {} });
                last = mid();
            }
        });
        svg.addEventListener('click', function (e) {
            if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
        }, true);
        svg.addEventListener('pointermove', function (e) {
            if (!(e.pointerId in pts)) return;
            var p = pts[e.pointerId], n = Object.keys(pts).length, r = svg.getBoundingClientRect();
            if (n < 2 && !moved) {
                if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < MOVE) return;   // まだクリックかもしれない
                if (e.pointerType === 'touch' && z() <= 1.001) return;               // 全体のときの1本指はページの縦送りに任せる
                moved = true; try { svg.setPointerCapture(e.pointerId); } catch (err) {}
            }
            if (n >= 2) {
                pts[e.pointerId] = { x: e.clientX, y: e.clientY };
                var m = mid();
                if (last && last.d > 0) {
                    var k = px(); v[0] -= (m.x - last.x) / k; v[1] -= (m.y - last.y) / k;      // 指の中点の移動
                    zoomAt(m.d / last.d, m.x - r.left, m.y - r.top);                              // 指の間隔の変化
                }
                last = m; e.preventDefault(); return;
            }
            if (e.pointerType === 'touch' && z() <= 1.001) return;                               // 全体のときの1本指はページの縦送りに任せる
            var k1 = px(); v[0] -= (e.clientX - p.x) / k1; v[1] -= (e.clientY - p.y) / k1;
            pts[e.pointerId] = { x: e.clientX, y: e.clientY }; draw();
        });
        function up(e) { delete pts[e.pointerId]; last = mid(); }
        svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
        fig._zoom = {
            reset: function () { v = v0.slice(); draw(); },
            end: function () { v = v0.slice(); svg.setAttribute('viewBox', v0.join(' ')); svg.style.removeProperty('--inv'); svg.style.touchAction = ''; },
            draw: draw
        };
        return fig._zoom;
    }

    // 画面いっぱいに広げる（国のページの .cc-full のボタン。DESIGN.md §107）。カードまるごとを overlay にするので、
    // 層のボタンはそのまま効く。閉じると元の場所に戻り、読んでいた位置も戻す（画面を勝手に送らない）。
    function setupFull(card) {
        var btn = card.querySelector('.cc-full');
        if (!btn) return;
        var ph = null, y = 0;
        function onKey(e) { if (e.key === 'Escape') close(); }
        function open() {
            y = window.scrollY;
            ph = document.createElement('div');                    // カードが抜けたぶん、本文が詰まらないように
            ph.style.height = card.offsetHeight + 'px';
            card.parentNode.insertBefore(ph, card);
            card.classList.add('is-full');
            card.setAttribute('role', 'dialog');
            card.setAttribute('aria-modal', 'true');
            document.body.classList.add('cc-full-open');
            // 図の高さから引く分：上のボタンの段と、下の注記（省いたラベルの断り・OSM の表示）を測って足す（余白 12+8+10、注記ごとに 8）
            var below = [].reduce.call(card.querySelectorAll('.cc-full-attr'), function (n, e) { return n + e.offsetHeight + 8; }, 0);
            card.style.setProperty('--cc-ctl-h', (card.querySelector('.cc-ctl').offsetHeight + below + 34) + 'px');
            btn.textContent = '閉じる ✕';
            btn.setAttribute('aria-expanded', 'true');
            loadCard(card);
            // 図が読み込まれていれば拡大・移動を付ける（まだなら読み込み後に付ける）
            [].forEach.call(card.querySelectorAll('.cc-fig'), function wait(fig) {
                if (fig.querySelector('svg')) { var zz = zoomable(fig); if (zz) requestAnimationFrame(zz.reset); }
                else if (card.classList.contains('is-full')) setTimeout(function () { wait(fig); }, 150);
            });
            document.addEventListener('keydown', onKey);
            btn.focus();
        }
        function close() {
            [].forEach.call(card.querySelectorAll('.cc-fig'), function (fig) { if (fig._zoom) fig._zoom.end(); });
            card.classList.remove('is-full');
            card.removeAttribute('role');
            card.removeAttribute('aria-modal');
            card.style.removeProperty('--cc-ctl-h');
            document.body.classList.remove('cc-full-open');
            if (ph) { ph.remove(); ph = null; }
            btn.textContent = '拡大 ⤢';
            btn.setAttribute('aria-expanded', 'false');
            document.removeEventListener('keydown', onKey);
            window.scrollTo({ top: y, behavior: 'instant' });
            btn.focus({ preventScroll: true });
        }
        btn.addEventListener('click', function () { card.classList.contains('is-full') ? close() : open(); });
    }

    // 横に送れるときだけ、図の上に1行「横に送ると続きが見られます →」を出す（2-1 §07 の .fig.is-scrollable と同じ文言・同じ考え方。
    // 3-2 の地域のカードは1234px で本文の列を超え、最初に西半分しか見えない。幅に収まる図には出さない。DESIGN.md §115）
    function setupHint(card) {
        [].forEach.call(card.querySelectorAll('.cc-scroll'), function (sc) {
            var hint = document.createElement('p');
            hint.className = 'cc-scroll-hint';
            hint.textContent = '横に送ると続きが見られます →';
            hint.hidden = true;
            sc.parentNode.insertBefore(hint, sc);
            function upd() {
                // 広げた表示（is-full）では送らないので出さない。層を切って図が消えているときも出さない
                hint.hidden = card.classList.contains('is-full') || sc.offsetParent === null || sc.scrollWidth - sc.clientWidth <= 1;
            }
            window.addEventListener('resize', upd);
            new MutationObserver(upd).observe(card, { attributes: true, attributeFilter: ['class'] });
            if ('ResizeObserver' in window) new ResizeObserver(upd).observe(sc);
            upd();
        });
    }

    function init() {
        var cards = [].slice.call(document.querySelectorAll('.cc-card'));
        cards.forEach(setupButtons);
        cards.forEach(setupFull);
        cards.forEach(setupHint);
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

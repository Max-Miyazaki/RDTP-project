/* ============================================================================
   toc-preview.js — シリーズの目次のプレビュー（DESIGN.md §141）

   目次の右の欄（.toc-preview）に、カーソルかフォーカスが来た節の行（.toc-row）の
   プレビューを出す。中身：節番号・題・説明の全文・部と章・公開／準備中、
   公開済みなら「この節で学ぶこと」（記事の §の見出し）と「読む →」。

   ★ §の見出しはデータとして持たない。記事のページを取りに行き、その記事の
     目次レール（.rail の .toc）から読む。記事を公開しても、目次の側は何も
     書き足さなくてよい（記事の見出しを直しても、ずれない）。取ったものは
     このページを開いている間だけ覚えておく。取れなければ（file:// で開いた、
     通信に失敗した）その欄を出さないだけで、ほかは動く。
   ★ ちらつかせない：行から外れても空に戻さない（最後に選んだ行を出したまま）。
     カーソルが行の上を通り過ぎるだけでは切り替えず、少し止まったら切り替える。
     フォーカス（キーボード）はすぐに切り替える。
   ★ 何も選んでいないときは、最初に読む節（最初の公開済みの行）を「ここから読む」として出す。
   ★ 欄は aria-hidden。読み上げ・キーボードでは行そのもの（題と説明の全文を持つリンク）を使う。
   ★ 768px 以下では欄が display:none なので何もしない（記事も取りに行かない）。

   layout.js より後に読むこと（layout.js が「準備中」の札と、英語のページで英語版の無い行のリンクを外す）。
   ============================================================================ */
(function () {
    'use strict';
    var I18N = window.AG_I18N;

    function init() {
        var layout = document.querySelector('.toc-layout');
        var aside = layout && layout.querySelector('.toc-preview');
        if (!aside) return;
        var rows = [].slice.call(layout.querySelectorAll('.toc-row'));
        if (!rows.length) return;
        var unit = layout.getAttribute('data-unit') || '';
        var cache = {};          // href → Promise<[{n, t}] | null>
        var current = null;      // いまプレビューしている行
        var timer = 0;
        var DWELL = 70;          // カーソルがこの時間止まったら切り替える（ms）

        aside.setAttribute('aria-hidden', 'true');
        aside.innerHTML = '<div class="toc-preview__card"></div>';
        var card = aside.firstChild;

        function visible() { return aside.offsetParent !== null; }
        function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
        function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

        function info(row) {
            var part = row.closest('.toc-part'), ch = row.closest('.toc-ch');
            var where = [];
            if (part) {
                var no = txt(part.querySelector('.toc-part__no')), h = txt(part.querySelector('.toc-part__head h2'));
                where.push(no ? no + '　' + h : h);
            }
            if (ch) where.push(txt(ch.querySelector('h2, h3')));
            return {
                no: txt(row.querySelector('.toc-row__no')),
                title: txt(row.querySelector('.toc-row__title')),
                desc: txt(row.querySelector('.toc-row__desc')),
                where: where.filter(Boolean).join(' ／ '),
                href: row.getAttribute('href'),
                soon: !row.getAttribute('href') || row.classList.contains('is-soon')
            };
        }

        // 記事の目次レールから §の見出しを読む
        function sections(href) {
            if (cache[href]) return cache[href];
            cache[href] = fetch(href, { credentials: 'same-origin' }).then(function (r) {
                if (!r.ok) throw new Error(r.status);
                return r.text();
            }).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var out = [].map.call(doc.querySelectorAll('.rail .toc a[href^="#"]'), function (a) {
                    var n = a.querySelector('.n');
                    var t = a.cloneNode(true);
                    var tn = t.querySelector('.n');
                    if (tn) tn.remove();
                    return { n: txt(n), t: txt(t) };
                });
                return out.length ? out : null;
            }).catch(function () { return null; });
            return cache[href];
        }

        function render(row, opts) {
            var d = info(row);
            var kicker = (opts && opts.start ? I18N.t('study.start') + ' ／ ' : '') + d.where;
            var h = '';
            if (kicker) h += '<p class="toc-preview__kicker">' + esc(kicker) + '</p>';
            h += '<p class="toc-preview__no">SECTION ' + esc(d.no) + '</p>';
            h += '<h3 class="toc-preview__title">' + esc(d.title) + '</h3>';
            if (d.desc) h += '<p class="toc-preview__desc">' + esc(d.desc) + '</p>';
            h += '<span class="toc-preview__status">' + esc(d.soon ? I18N.t('soon') : I18N.t('toc.open')) + '</span>';
            if (!d.soon) {
                h += '<div class="toc-preview__secs is-loading" hidden><p class="toc-preview__lab">' + esc(I18N.t('toc.learn', { unit: unit })) + '</p><ol></ol></div>';
                h += '<a class="btn toc-preview__read" href="' + esc(d.href) + '" tabindex="-1">' + esc(I18N.t('toc.read')) +
                    ' <span class="btn-disc" aria-hidden="true">→</span></a>';
            }
            card.className = 'toc-preview__card' + (d.soon ? ' is-soon' : '');
            card.innerHTML = h;
            // 切り替えの動き（reduced motion では CSS が止める）。最初の表示では動かさない
            if (opts && opts.animate) {
                card.classList.remove('is-swapping');
                void card.offsetWidth;
                card.classList.add('is-swapping');
            }
            if (current) current.classList.remove('is-previewed');
            current = row;
            if (!(opts && opts.start)) row.classList.add('is-previewed');
            if (!d.soon) {
                var box = card.querySelector('.toc-preview__secs');
                sections(d.href).then(function (list) {
                    if (current !== row || !box.isConnected) return;
                    if (!list) { box.remove(); return; }
                    box.querySelector('ol').innerHTML = list.map(function (s) {
                        return '<li><span class="n">' + esc(s.n) + '</span><span>' + esc(s.t) + '</span></li>';
                    }).join('');
                    box.hidden = false;
                    box.classList.remove('is-loading');
                });
            }
        }

        function pick(row, immediate) {
            clearTimeout(timer);
            if (!row || !visible()) return;
            // 最初に出していた「ここから読む」の行に来たときは、中身はそのままで行の強調だけ付ける
            if (row === current) { row.classList.add('is-previewed'); return; }
            if (immediate) render(row, { animate: true });
            else timer = setTimeout(function () { render(row, { animate: true }); }, DWELL);
        }

        layout.addEventListener('pointerover', function (e) {
            if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
            pick(e.target.closest && e.target.closest('.toc-row'), false);
        });
        layout.addEventListener('focusin', function (e) {
            pick(e.target.closest && e.target.closest('.toc-row'), true);
        });

        // 何も選んでいないとき：最初に読む節
        function start() {
            var first = rows.filter(function (r) { return r.getAttribute('href') && !r.classList.contains('is-soon'); })[0] || rows[0];
            if (visible()) render(first, { start: true });
        }
        start();
        // 768px 以下から広げたとき、まだ何も出していなければ出す
        window.addEventListener('resize', function () { if (!card.firstChild && visible()) start(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

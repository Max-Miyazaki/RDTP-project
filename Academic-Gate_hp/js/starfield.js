/* ============================================================================
   starfield.js — the always-present cosmic baseline.
   Paints plain WHITE stars (r 0.25–1.35px, opacity 0.15–0.60) ONCE into a single
   <canvas id="starfield">, then leaves it alone — no twinkle, no per-frame work,
   no colour tints. Values match the lesson pages ("1-1 微分の基礎") so the site and
   the教材 share one sky. Repaints only on a debounced resize. No radial-gradient
   stacking (see DESIGN.md §D: a canvas bitmap is one static GPU-composited layer).
   Loaded on every page. Degrades to the CSS ambient glow when JS is off.
   On reading pages (body.is-article) the field additionally steps back behind the
   text column — see COLUMN_* below; the matching blur/opacity lives in style.css.
   ============================================================================ */
(function () {
    'use strict';

    var canvas = document.getElementById('starfield');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cap DPR so the bitmap stays cheap on high-density phones.
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    // Deterministic PRNG so the sky is stable across repaints within a session.
    var seed = 0x9e3779b9;
    function rand() {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return ((seed >>> 0) % 100000) / 100000;
    }

    // --- Reading-page masking -------------------------------------------------
    // style.css blurs and dims this canvas on body.is-article; a blurred dot behind
    // a fraction line is still a blurred dot, so the stars that would sit behind the
    // copy are thinned out here instead. The column is re-measured on every paint,
    // so a resize (or any reflow that moves it) re-masks against the new geometry.
    var IS_ARTICLE = !!(document.body && document.body.className &&
        (' ' + document.body.className + ' ').indexOf(' is-article ') > -1);
    var COLUMN_PAD = 24;     // css px of breathing room added to each side
    var COLUMN_SKIP = 0.8;   // drop this share of the stars that land inside it
    var COLUMN_ALPHA = 0.4;  // and dim whatever survives
    var BLUR_BUMP = 0.3;     // blur(1.2px) eats the thinnest dots — grow them back

    // Left/right edges of every reading column, in css px, padded. x only: the
    // canvas is position:fixed and the page never scrolls sideways, so a vertical
    // band is the whole story and stays correct at any scroll offset.
    // `.rail` is matched WITHOUT a `main >` prefix on purpose: a 教材 page's table-
    // of-contents rail is a SIBLING of <main>, not a child of it (`.wrap > nav.rail
    // + main.main`), so `main > .rail` would never match. Its text needs the same
    // treatment as the body column — see DESIGN.md §36.
    function columns() {
        if (!IS_ARTICLE) return [];
        var secs = document.querySelectorAll('main > section, .rail');
        var out = [];
        for (var i = 0; i < secs.length; i++) {
            var r = secs[i].getBoundingClientRect();
            if (r.width > 0) out.push([r.left - COLUMN_PAD, r.right + COLUMN_PAD]);
        }
        return out;
    }

    function inColumn(cols, x) {
        for (var i = 0; i < cols.length; i++) {
            if (x >= cols[i][0] && x <= cols[i][1]) return true;
        }
        return false;
    }

    function paint() {
        var w = window.innerWidth;
        var h = window.innerHeight;

        canvas.width = Math.floor(w * DPR);
        canvas.height = Math.floor(h * DPR);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // ~1 star per 11000 css px², never more than 200.
        var count = Math.min(200, Math.round((w * h) / 11000));
        seed = 0x9e3779b9; // reset so a resize regenerates the same field
        var cols = columns();

        for (var i = 0; i < count; i++) {
            var x = rand() * w;
            var y = rand() * h;
            var r = 0.25 + rand() * 1.10;                 // 0.25–1.35px
            var alpha = 0.15 + rand() * 0.45;             // 0.15–0.60

            if (cols.length && inColumn(cols, x)) {
                if (rand() < COLUMN_SKIP) continue;       // 4 in 5 never get drawn
                alpha *= COLUMN_ALPHA;
            }
            if (IS_ARTICLE) r += BLUR_BUMP;

            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    paint();

    // Debounced repaint on resize only (§D: otherwise never touched).
    var resizeTimer = null;
    window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(paint, 200);
    });
})();

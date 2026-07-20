/* ============================================================================
   starfield.js — the always-present cosmic baseline.
   Paints tiny 1–2px stars (white / blue / dim red, 0.2–0.6 opacity) ONCE into a
   single <canvas id="starfield">, then leaves it alone. Repaints only on a
   debounced resize. No per-frame work, no radial-gradient stacking (see DESIGN.md
   §D: a canvas bitmap is composited by the GPU as one static layer).
   Loaded on every page. Degrades to the CSS ambient glow when JS is off.
   ============================================================================ */
(function () {
    'use strict';

    var canvas = document.getElementById('starfield');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cap DPR so the bitmap stays cheap on high-density phones.
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    // Deterministic PRNG so the sky is stable across repaints within a session.
    var seed = 0x9e3779b9;
    function rand() {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return ((seed >>> 0) % 100000) / 100000;
    }

    var TINTS = [
        'rgba(255,255,255,',   // white
        'rgba(120,170,255,',   // blue
        'rgba(255,120,90,'     // dim red
    ];
    // Relative frequency: mostly white, some blue, few red.
    var TINT_PICK = [0, 0, 0, 0, 1, 1, 1, 2];

    function paint() {
        var w = window.innerWidth;
        var h = window.innerHeight;

        canvas.width = Math.floor(w * DPR);
        canvas.height = Math.floor(h * DPR);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // Very low density: ~1 star per 9000 css px², clamped.
        var count = Math.min(420, Math.max(90, Math.round((w * h) / 9000)));
        seed = 0x9e3779b9; // reset so a resize regenerates the same field

        for (var i = 0; i < count; i++) {
            var x = rand() * w;
            var y = rand() * h;
            var r = rand() < 0.18 ? 1.6 : 0.9;           // mostly 1px, few 2px
            var alpha = 0.2 + rand() * 0.4;               // 0.2–0.6
            var tint = TINTS[TINT_PICK[(rand() * TINT_PICK.length) | 0]];

            ctx.beginPath();
            ctx.fillStyle = tint + alpha.toFixed(3) + ')';
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

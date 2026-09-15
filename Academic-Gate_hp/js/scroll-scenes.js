/* ============================================================================
   scroll-scenes.js — index.html full-page flow field (Round 13).

   ONE THREE.WebGLRenderer + ONE THREE.Points that runs the WHOLE PAGE. A curl-
   noise flow field drifts every particle continuously; each stage is an ATTRACTOR
   the flow concentrates into and releases. EIGHT stages (Round-20; 7→8, the 専門 split; was ten at Round-17 —
   network, orbits(専門), strata(Notes), and the Projects section were removed and
   基礎+専門 merged into one block), hero → footer:

     0 宇宙 cosmos       volumetric sphere (warm core through cool volume)
     1 自然 nature       undulating waves (travelling surface, 揺らぎ)
     2 情報基盤 infra    ordered lattice with streaming
     3 基礎/専門 merged  DISPERSAL — the lattice releases into dense unstructured drift
     4 Blog             stream (a directed current)
     5 Videos           waveforms (oscillating signal bands)
     6 convergence      gather inward to one bright form — arrival (final-message)

   Below the hero the field drops to a CALM register (dimmer, slower) but stays
   DENSE. Past the last stage the convergence holds behind the footer.

   Progressive: reduced-motion → no Three.js; no WebGL / JS-off → CSS glow. Content
   is never gated behind JS.
   ============================================================================ */
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    (function initReveals() {
        var els = document.querySelectorAll('.reveal');
        if (!els.length) return;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-visible'); }); return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        els.forEach(function (el) { io.observe(el); });
    })();

    var canvas = document.getElementById('scene-canvas');
    if (!canvas) return;
    var hero = document.querySelector('.hero');
    var visibleScenes = [];
    if (reduceMotion) { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }

    function loadThree() {
        return new Promise(function (resolve, reject) {
            if (window.THREE) return resolve();
            function attempt(url, next) {
                var s = document.createElement('script'); s.src = url; s.async = true;
                s.onload = function () { window.THREE ? resolve() : (next ? attempt(next, null) : reject()); };
                s.onerror = function () { next ? attempt(next, null) : reject(); };
                document.head.appendChild(s);
            }
            attempt('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js', 'https://unpkg.com/three@0.160.0/build/three.min.js');
        });
    }
    function hasWebGL() {
        try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
        catch (e) { return false; }
    }
    loadThree().then(function () { if (!hasWebGL()) { dropCanvas(); return; } try { init(); } catch (e) { dropCanvas(); } }).catch(dropCanvas);
    function dropCanvas() { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }

    /* ====================================================================== */
    function init() {
        var isMobile = window.innerWidth <= 768;
        var lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
        var urlN = parseInt((location.search.match(/[?&]n=(\d+)/) || [])[1], 10);
        var COUNT = urlN || (isMobile ? 70000 : lowPower ? 110000 : 200000);
        var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

        // Hero text scenes (4) drive the readable-copy opacity.
        visibleScenes = Array.prototype.filter.call(hero.querySelectorAll('.scene[data-stage]'), function (s) { return s.offsetParent !== null; });
        if (visibleScenes.length < 2) { dropCanvas(); return; }
        // Seven stage centre elements (Round-17, was ten): 3 hero scenes (network removed) +
        // 4 index-region blocks — the merged 基礎/専門 block, blog, videos, and the closing
        // .final-message promoted to the convergence stage.
        var indexBlocks = Array.prototype.slice.call(document.querySelectorAll('.index-region .index-block, .index-region .final-message'));
        var stageEls = visibleScenes.concat(indexBlocks);
        // Motif per surviving stage, in DOM order. Dropped motifs: network, orbits, strata.
        var stages = ['cosmos', 'nature', 'infra', 'foundation', 'specialty', 'stream', 'waveforms', 'drift'].slice(0, stageEls.length);   // Round-26: stage 7 orbits -> drift (流). orbits/convergence/sea kept as inert dead code below.
        var K = stages.length;
        var HERO_K = visibleScenes.length;   // stages 0..HERO_K-1 are the hero

        /* ---- Seeded PRNG (mulberry32) ---------------------------------- */
        var seedState = 0x51ed270b;
        function rnd() {
            seedState = seedState + 0x6d2b79f5 | 0;
            var t = Math.imul(seedState ^ seedState >>> 15, 1 | seedState);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
        function gauss(s) { return (rnd() + rnd() + rnd() - 1.5) * s; }
        var TAU = Math.PI * 2, S = isMobile ? 2.05 : 3.5;
        // ARM-2 (Round-32 prototype): corrugate the waveforms sheet in z so it is never fully edge-on.
        // WAVE_CORR_AMP = 0 → the current flat sheet (toggle; current form stays reachable/intact). Attribute-free.
        var WAVE_CORR_AMP = 0.6, WAVE_CORR_FREQ = 0.8;
        // Reference the SNAPPORT centre, not the raw viewport centre: scroll-padding-top insets
        // the snapport by --nav-clearance, so `scroll-snap-align: center` rests a scene's centre
        // pad/2 below the true viewport centre. Matching that here makes a snap rest land on an
        // exact integer sceneF (a PURE motif, no cross-blend toward the neighbour) — without it
        // the network rested at sceneF 1.955 and the 4.5% nature blend smeared its thin edges.
        var SNAP_INSET = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        function midOf() { return window.scrollY + (window.innerHeight + SNAP_INSET) / 2; }

        /* ---- Precomputed structures for the motifs --------------------- */
        // NETWORK: centre-dense radial nodes (density peaks in the middle, tapers out).
        var NN = isMobile ? 46 : 78;
        var nodes = [];
        for (var n = 0; n < NN; n++) {
            var rr = Math.pow(rnd(), 1.18) * S * 1.08;   // exponent 1.18 → centre densest, rim still covered
            var aa = rnd() * TAU;
            nodes.push([rr * Math.cos(aa), rr * Math.sin(aa) * 0.85, gauss(S * 0.28)]);
        }
        var edges = [];
        for (var a = 0; a < NN; a++) {
            var best = [[1e9, -1], [1e9, -1], [1e9, -1]];
            for (var b = 0; b < NN; b++) {
                if (b === a) continue;
                var ex = nodes[a][0] - nodes[b][0], ey = nodes[a][1] - nodes[b][1], ez = nodes[a][2] - nodes[b][2];
                var dd = ex * ex + ey * ey + ez * ez;
                if (dd < best[0][0]) { best[2] = best[1]; best[1] = best[0]; best[0] = [dd, b]; }
                else if (dd < best[1][0]) { best[2] = best[1]; best[1] = [dd, b]; }
                else if (dd < best[2][0]) { best[2] = [dd, b]; }
            }
            for (var e2 = 0; e2 < 3; e2++) if (best[e2][1] >= 0) edges.push([a, best[e2][1]]);
        }
        var deg = new Array(NN).fill(0);
        edges.forEach(function (e) { deg[e[0]]++; deg[e[1]]++; });
        var maxDeg = Math.max.apply(null, deg) || 1;
        for (var ndi = 0; ndi < NN; ndi++) nodes[ndi][3] = deg[ndi] / maxDeg;

        // INFRASTRUCTURE lattice
        var GX = 5, GY = 4, GZ = 3, gnodes = [], gedges = [];
        var lidx = function (i, j, k) { return (i * GY + j) * GZ + k; };
        for (var gi = 0; gi < GX; gi++) for (var gj = 0; gj < GY; gj++) for (var gk = 0; gk < GZ; gk++)
            gnodes.push([(gi / (GX - 1) - 0.5) * 2 * S, (gj / (GY - 1) - 0.5) * 2 * S * 0.8, (gk / (GZ - 1) - 0.5) * 2 * S * 0.6]);
        for (var gi2 = 0; gi2 < GX; gi2++) for (var gj2 = 0; gj2 < GY; gj2++) for (var gk2 = 0; gk2 < GZ; gk2++) {
            if (gi2 < GX - 1) gedges.push([lidx(gi2, gj2, gk2), lidx(gi2 + 1, gj2, gk2)]);
            if (gj2 < GY - 1) gedges.push([lidx(gi2, gj2, gk2), lidx(gi2, gj2 + 1, gk2)]);
            if (gk2 < GZ - 1) gedges.push([lidx(gi2, gj2, gk2), lidx(gi2, gj2, gk2 + 1)]);
        }
        // ORBITS: each ring in its OWN plane so they visibly cross in 3D; ellipses (eccentric)
        // with the star at the common FOCUS. Plane orientation is a tilt `phi` from face-on
        // (0 = facing camera, 90 = edge-on) plus an azimuth `psi`. phi is CLAMPED to 24–72° so
        // no ring is within ~18° of edge-on (an edge-on ring reads as a bar through the frame).
        var NORB = 6, orbEls = [];
        for (var ob = 0; ob < NORB; ob++) orbEls.push({
            a: S * (0.5 + ob * 0.26), e: 0.12 + rnd() * 0.3,
            phi: (24 + rnd() * 48) * Math.PI / 180, psi: rnd() * TAU, arg: rnd() * TAU
        });

        // STAGE 5 (Blog, 最新ブログ) — rhombicuboctahedron wireframe (Round-33). 24 vertices / 48 edges, a
        // volumetric polyhedron seen in perspective (replaces the coplanar radial emitter, kept inert as
        // 'radialemitter' below). Circumradius LARGER on mobile so the 48 edges separate rather than merging
        // into a fuzzy ball at 70k (§33 legibility). Verts = permutations of (±1,±1,±(1+√2)); edges = the min-
        // distance vertex pairs; a fixed tilt is baked so the rest pose already reads 3-D (not axis-aligned).
        var RCO_R = (isMobile ? 0.72 : 0.62) * S;
        var rcoV0 = [], rcoSg = [1, -1], rcoG = 1 + Math.SQRT2;
        for (var rax = 0; rax < 3; rax++) for (var rp = 0; rp < 2; rp++) for (var rq = 0; rq < 2; rq++) for (var rr = 0; rr < 2; rr++) {
            var rvv = [0, 0, 0]; rvv[rax] = rcoSg[rp] * rcoG; rvv[(rax + 1) % 3] = rcoSg[rq]; rvv[(rax + 2) % 3] = rcoSg[rr]; rcoV0.push(rvv);
        }
        var rcoMx = 0; for (var rmi = 0; rmi < rcoV0.length; rmi++) { var rmd = Math.hypot(rcoV0[rmi][0], rcoV0[rmi][1], rcoV0[rmi][2]); if (rmd > rcoMx) rcoMx = rmd; }
        var rcoCX = Math.cos(0.5), rcoSX = Math.sin(0.5), rcoCZ = Math.cos(0.32), rcoSZ = Math.sin(0.32);
        var rcoV = rcoV0.map(function (v) { var s = RCO_R / rcoMx, x = v[0] * s, y = v[1] * s, z = v[2] * s; var y2 = y * rcoCX - z * rcoSX, z2 = y * rcoSX + z * rcoCX; return [x * rcoCZ - y2 * rcoSZ, x * rcoSZ + y2 * rcoCZ, z2]; });
        var rcoE = [], rcoDmin = 1e9, rea, reb, red;
        for (rea = 0; rea < rcoV.length; rea++) for (reb = rea + 1; reb < rcoV.length; reb++) { red = Math.hypot(rcoV[rea][0] - rcoV[reb][0], rcoV[rea][1] - rcoV[reb][1], rcoV[rea][2] - rcoV[reb][2]); if (red < rcoDmin) rcoDmin = red; }
        for (rea = 0; rea < rcoV.length; rea++) for (reb = rea + 1; reb < rcoV.length; reb++) { red = Math.hypot(rcoV[rea][0] - rcoV[reb][0], rcoV[rea][1] - rcoV[reb][1], rcoV[rea][2] - rcoV[reb][2]); if (red < rcoDmin * 1.02) rcoE.push([rea, reb]); }

        // DRIFT (流, stage 7): an asymmetric VORTICAL CURRENT. Streamlines walk v = ∇⊥ψ of a curl-noise
        // streamfunction ψ = fbm(value-noise) — eddies of varied size at irregular positions, NO left/right
        // mirror (Round-28 field bake-off "C2"; the old ψ=sin(0.8x)cos(1.1y) read as a symmetric eddy PAIR — see
        // §29/§30). The lines are baked into a data texture; the vertex shader ADVECTS each particle ALONG its own
        // line (s = s0 + uTime·speed_line, speeds incommensurate per line → no global beat), so the current
        // genuinely FLOWS rather than shimmering in place. Deterministic: a LOCAL prng (mulberry32) seeds the line
        // starts AND the noise permutation, so the field is stable across reloads and independent of particle rnd().
        var DRIFT_NLINES = 48, DRIFT_DPTS = 26, DRIFT_SX = 1.05, DRIFT_PARK = 0.5, DRIFT_BR = 0.5;
        var DRIFT_SYCAP = 1.3, DRIFT_SY0 = 0.80, DRIFT_CY0 = 1.0;   // SYCAP: max vertical stretch (near isotropic 1.05·SX); SY0/CY0: make()'s static-base defaults, the live shader uniforms (§30.5 band-fit) take over
        var DRIFT_SY_REF = 1.05, DRIFT_GAIN_CAP = 2.0;   // §30.10 tall gain: ramp gain 1.0→CAP as the fitted uDriftSY goes SY_REF→SYCAP. SY_REF above the wide fitted scale's settle range (~0.94–0.98) so wide is EXACTLY 1.0; tall's sy always = SYCAP so tall = CAP = 2.0 (measured, sweep §30.10: presence with no clip/hue cost). The plain SY-RATIO gave only 1.37 (too faint) — see §30.10.
        // STAGE 7 GAS (Round-34, §34): the drift current → a DIFFUSE everywhere-field, "like the gas stars are born
        // from." World half-extents cover the wide viewport (x≈±6.2) and tall (y≈±3.88) with margin so it fills edge-
        // to-edge at BOTH aspects; brightness dim (message/footer contrast); GAS_VAR = gentle large-scale density
        // variation (0 = flat/static, higher = more nebula-like), GAS_VF its (low) spatial frequency.
        var GAS_EX = 6.8, GAS_EY = 4.3, GAS_EZ = 0.6, GAS_BR = 0.11, GAS_VAR = 0.5;   // §34 Step-3: thin z (flat depth), density-variation (below), brightness into the contrast budget with ≥5.5 margin, + aspect uGasGain lifts tall
        // Density variation (Round-34 Step-3): a coarse low-frequency weight grid modulates HOW MANY particles land in
        // each region (not per-particle brightness), so denser regions glow more and thinner regions stay present but
        // dimmer — a gas, never an empty patch. Weight floor (1-GAS_VAR > 0) guarantees no cell is ever empty. Particles
        // are allocated across cells by the CDF (make() below), then placed uniformly WITHIN their cell → within-cell is
        // pure Poisson (cellCV(64) ≈ baseline, no clumping), variation is large-scale only (cellCV(8) lifts). Attribute-free.
        var GAS_NGX = 16, GAS_NGY = 10, gasCDF = [], gasTot = 0;
        for (var gcy = 0; gcy < GAS_NGY; gcy++) for (var gcx = 0; gcx < GAS_NGX; gcx++) {
            var gwx = (gcx + 0.5) / GAS_NGX * 2 - 1, gwy = (gcy + 0.5) / GAS_NGY * 2 - 1;
            var gnz = 0.5 + 0.1667 * (Math.sin(gwx * 3.1 + 1.3) + Math.sin(gwy * 2.7 - 0.7) + Math.sin((gwx + gwy) * 2.0 + 2.1));
            gasTot += 1 - GAS_VAR + GAS_VAR * Math.max(0, Math.min(1, gnz)); gasCDF.push(gasTot);
        }
        // STAGE 7 = ACCRETION DISC (Round-34 Step-6, §34): particles on near-circular orbits around an INVISIBLE mass.
        // Thin disc tilted DISC_INC from face-on; radius r∈[RIN,ROUT], density falling outward (r = RIN+(ROUT-RIN)·h^PWR,
        // PWR>1 → inner-dense), central VOID inside RIN. Keplerian ω(r)=W0·(RIN/r)^1.5 (inner laps the rim). r/θ0/thickness
        // per-particle from aSeed hashes; the ANGLE is advanced shader-side (target override, §30.7 → uDiscOn gate + mobile
        // brightness 0). Centred at (CX,CY,CZ) — a FIXED world point (NOT the message rect), so no page-bottom sliver.
        // Reuses the Step-4 large-soft-sprite path (uGasSize/uGasSoft, vGas=stage-7 weight) so the band reads continuous.
        var DISC_RIN = 0.9, DISC_ROUT = 2.7, DISC_INC = 0.75, DISC_W0 = 0.20, DISC_PWR = 1.7, DISC_THICK = 0.18;   // §34 Step-11: INC frozen at 43° (chosen by sweep) — more granular interior + clearer void than the old 58°, still reads as an inclined disc; the orientation no longer swings over time (freeze at line ~779)
        var DISC_CX = 0.0, DISC_CY = 1.5, DISC_CZ = 0.0, DISC_BR = 0.42;   // lifted into the upper band (§27 motif-top / message-below); void sits above the closing message
        // §34 Step-7 Defect-2: a fraction (DISC_CLUMPFRAC) of particles cluster into DISC_NCLUMP over-dense CLUMPS at
        // narrow radii. Each clump orbits rigidly at its own ω(r) (no self-shear), so inner clumps visibly LAP outer
        // ones → Keplerian differential rotation READS (brightness arcs by θ0 wound into uniformity — see §34). The
        // clump centres are baked into the shader (clumpAt) so make() and the shader agree.
        // Step-8: clumps are DIFFUSE, GRANULAR denser regions (centre-weighted spread, varied size) — not solid beads.
        // Each holds a spread of grains (r/θ jitter × its size), so it reads as more particles packed together; the
        // r-extent lets the differential rotation SHEAR it into an arc. Varied sizes + random θ = irregular, not decorative.
        var DISC_NCLUMP = 8, DISC_CLUMPFRAC = 0.42, DISC_CLUMPR = 0.55, DISC_CLUMPT = 0.30, DISC_CLUMPSZK = 0.50, discClumps = [];
        // §34 Step-8: clump grains use a SMALLER sprite (×DISC_CLUMPSZK) than the disc body. A clump is denser, so at the body's
        // sprite footprint its grains would overlap into a smooth solid bead; the smaller footprint keeps black between grains →
        // the clump reads granular (a denser knot of the SAME particles), not a saturated blob. Box (uniform) r/θ jitter — not
        // centre-weighted — so grains don't pile at one point, and the r-spread lets differential rotation shear it into an arc.
        (function () { var a = 9271; function pr() { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; } for (var i = 0; i < DISC_NCLUMP; i++) discClumps.push([DISC_RIN + (DISC_ROUT - DISC_RIN) * Math.pow(pr(), 0.6), pr() * TAU, 0.55 + pr() * 1.2]); })();
        var dF = function (n) { return (+n).toFixed(4); };   // shader float literal helper
        var discClumpGLSL = 'vec3 clumpAt(float i){' + discClumps.map(function (c, k) { return (k < DISC_NCLUMP - 1 ? 'if(i<' + (k + 0.5) + ') return vec3(' + dF(c[0]) + ',' + dF(c[1]) + ',' + dF(c[2]) + ');' : 'return vec3(' + dF(c[0]) + ',' + dF(c[1]) + ',' + dF(c[2]) + ');'); }).join('') + '}';
        var driftLines = (function () {
            function mb(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
            var pr = mb(1337), perm = new Uint8Array(512), ord = [];
            for (var pi = 0; pi < 256; pi++) ord[pi] = pi;
            for (var pj = 255; pj > 0; pj--) { var pk = (pr() * (pj + 1)) | 0, tmp = ord[pj]; ord[pj] = ord[pk]; ord[pk] = tmp; }
            for (var pl = 0; pl < 512; pl++) perm[pl] = ord[pl & 255];
            function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
            function grad(h, x, y) { var u = (h & 1) ? x : -x, v = (h & 2) ? y : -y; return u + v; }
            function vnoise(x, y) { var X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); var u = fade(x), v = fade(y), A = perm[X] + Y, B = perm[X + 1] + Y;
                function lp(a, b, t) { return a + t * (b - a); }
                return lp(lp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u), lp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u), v); }
            function fbm(x, y) { var s = 0, a = 0.5, f = 1; for (var o = 0; o < 4; o++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
            function psi(x, y) { return fbm(x * 0.9 + 3.1, y * 1.4 - 2.2); }        // the streamfunction; v = ∇⊥ψ (finite diff)
            var e = 0.06, sp = mb(42), lines = [], LYC = 1.5;   // LYC: reflect the flow at ±LYC so no streamline wanders
            for (var dl = 0; dl < DRIFT_NLINES; dl++) {          // out of the band (else the band-fit §30.5 can't contain the tails)
                var lx = (sp() * 2 - 1) * 2.4, ly = (sp() * 2 - 1) * 0.85, line = [];
                for (var dpi = 0; dpi < DRIFT_DPTS; dpi++) {
                    line.push([lx, ly]);
                    var vx = (psi(lx, ly + e) - psi(lx, ly - e)) / (2 * e) * 1.8, vy = -(psi(lx + e, ly) - psi(lx - e, ly)) / (2 * e) * 1.8;
                    if ((ly > LYC && vy > 0) || (ly < -LYC && vy < 0)) vy = -vy;   // reflect at the band edges
                    var vln = Math.hypot(vx, vy) || 1; lx += (vx / vln) * 0.16; ly += (vy / vln) * 0.16;
                    if (ly > LYC) ly = LYC; else if (ly < -LYC) ly = -LYC;
                }
                lines.push(line);
            }
            return lines;
        })();
        // Round-34 (§34): the drift's line DataTexture, its band-fit core-extent precompute, and the shader
        // advection are DROPPED (stage 7 is now the diffuse gas). `driftLines` above is kept only for the inert
        // 'driftcurrent' dead-code make() case below (the static C2 weave base), matching orbits/convergence/sea.
        // deterministic small-arg hash (mirrors the shader's dhash) for the drift static base + parking
        function dfrac(x) { return x - Math.floor(x); }
        function dhashJS(a, b) { return dfrac(Math.sin(a * b) * 43758.5453); }

        /* ---- Per-motif attractor target: [x,y,z, energy, bright, aux] ---
           aux: 1 = infra stream · 2 = stream(x-drift) · 0.x = wave layer phase (nature/waveforms). */
        function make(stage, i, sd) {
            var u, th, s, x, y, z, t, rc, rn, sy, la, wl;
            switch (stage) {
                case 'cosmos': { // VOLUMETRIC sphere with INTERNAL STRUCTURE (reads as a ball + shows rotation)
                    if (rnd() < 0.022) {                          // tight warm core — glows through the cool volume in front
                        rc = 0.16 * S * Math.cbrt(rnd()); u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u);
                        return [rc * s * Math.cos(th), rc * u, rc * s * Math.sin(th), 0.88, 0.4, 0]; // dim per-particle → glows, not blows
                    }
                    // UNIFORM VOLUME (r = R·cbrt) → the line-of-sight chord makes the centre projected-densest
                    // (the volume cue). Clip is held by LOWERING per-particle brightness toward the centre — the
                    // dense centre × dim particles ≈ a soft gradient, no white-out; the density gradient survives.
                    var vr = Math.cbrt(rnd());
                    rn = vr > 0.9 ? 0.9 + (vr - 0.9) * 0.5 : vr;  // soften the limb
                    u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u); rc = rn * S;
                    var dx = s * Math.cos(th), dy = u, dz = s * Math.sin(th);
                    // angular CLUMPS (bright patches, fixed to the sphere → visibly rotate) + radial shells
                    var clump = 0.5 + 0.5 * Math.sin(dx * 5.0 + dz * 3.0) * Math.cos(dy * 6.0 + dx * 4.0);
                    var shell = 0.72 + 0.28 * Math.sin(rn * 17.0);
                    var brCtl = 0.13 + 0.72 * rn * rn;            // strong centre dimming (rn^2) holds the chord under clip
                    return [dx * rc, dy * rc, dz * rc,
                        0.2 + 0.26 * (1 - rn) + 0.16 * clump,     // cyan in clumps, cooler outward
                        brCtl * shell * (0.7 + 0.55 * clump), 0];
                }
                case 'nature': { // undulating WAVE slabs (shader travels the surface + brightens crests)
                    wl = Math.floor(rnd() * 2);
                    x = (rnd() * 2 - 1) * S * 1.05;                         // concentrated → higher overlap on the crest bands
                    z = (rnd() * 2 - 1) * S * 0.45 + (wl - 0.5) * S * 0.6;
                    y = (wl - 0.5) * S * 0.7 + 0.24 * S * Math.sin(x * 1.1 + wl * 1.3) + gauss(0.12 * S);
                    return [x, y, z, 0.44 + 0.26 * rnd(), 0.85, (wl + 0.5) / 2]; // brighter cyan energy → higher luminance
                }
                case 'network': {
                    if (rnd() < 0.44) {
                        var nn = nodes[i % NN]; var hub = nn[3] > 0.55; var sp = hub ? 0.07 : 0.04;
                        return [nn[0] + gauss(sp), nn[1] + gauss(sp), nn[2] + gauss(sp), hub ? 0.58 : 0.3, hub ? 0.95 : 0.5, 0];
                    }
                    var ed = edges[i % edges.length], A = nodes[ed[0]], B = nodes[ed[1]]; t = rnd();
                    return [A[0] + (B[0] - A[0]) * t + gauss(0.015), A[1] + (B[1] - A[1]) * t + gauss(0.015), A[2] + (B[2] - A[2]) * t + gauss(0.015), 0.24, 0.48, 0];
                }
                case 'infra': {
                    if (rnd() < 0.3) { var gn = gnodes[i % gnodes.length]; return [gn[0] + gauss(0.025), gn[1] + gauss(0.025), gn[2] + gauss(0.025), 0.48, 0.9, 0]; }
                    var ge = gedges[i % gedges.length], Ga = gnodes[ge[0]], Gb = gnodes[ge[1]]; t = rnd();
                    return [Ga[0] + (Gb[0] - Ga[0]) * t + gauss(0.01), Ga[1] + (Gb[1] - Ga[1]) * t + gauss(0.01), Ga[2] + (Gb[2] - Ga[2]) * t + gauss(0.01), 0.34, 0.75, 1];
                }
                case 'dispersal': { // RETIRED Round-20 (stage 3 is now 'foundation'); kept as dead code per §17.2.
                    u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u); rc = S * 1.15 * Math.cbrt(rnd());
                    return [rc * s * Math.cos(th) * 1.35, rc * u, rc * s * Math.sin(th), 0.2 + 0.22 * rnd(), 0.55, 0];
                }
                case 'foundation': { // 基礎領域 (Round-20): stacked cool discs tapering upward, a small HOT CORE at the BASE.
                    // Warm membership is by particle INDEX (i%72 ≈ 1.39%) so the SAME particles form the hot core at
                    // the base here and at the apex in 'specialty' — that shared identity is what lets the warm
                    // migrate across 3→4 (the coherence attribute carries it; see DESIGN.md §23). Core sized to
                    // ≈ cosmos's warm share: rCore = 0.174·S (= 0.29·base radius) → measured ~1.0% warm pixels.
                    if (i % 72 === 0) {
                        var fwr = 0.174 * S * Math.sqrt(rnd()), fwa = rnd() * TAU;
                        var fwpx = fwr * Math.cos(fwa) + 0.45 * S, fwpy = (0 - 0.5) * 1.35 * S + gauss(0.03 * S) - 0.05 * S, fwpz = fwr * Math.sin(fwa);
                        var fwld = 0.30 + 0.70 * Math.min(1, Math.max(0, (fwpx / S + 0.10) / 0.5));
                        return [fwpx, fwpy, fwpz, 0.88, 0.60 * fwld, 0];       // warm magenta (0.88 = cosmos's core energy)
                    }
                    var fL = Math.floor(rnd() * 6), ff = fL / 5;               // 6 layers, base(0) → top(1)
                    var fR = 0.60 * S * (1.0 - ff);                            // linear taper, widest at the base
                    var fa = rnd() * TAU, frad = fR * Math.sqrt(rnd());        // solid disc (uniform area density)
                    var fpx = frad * Math.cos(fa) + 0.45 * S, fpy = (ff - 0.5) * 1.35 * S + gauss(0.02 * S) - 0.05 * S, fpz = frad * Math.sin(fa);
                    var fld = 0.30 + 0.70 * Math.min(1, Math.max(0, (fpx / S + 0.10) / 0.5)); // left-dim keeps the 基礎 text legible
                    return [fpx, fpy, fpz, 0.24 + 0.20 * ff, 0.64 * fld, 0];   // cool teal→cyan up the stack
                }
                case 'specialty': { // 専門領域 (Round-20): the SAME disc stack, hot core at the APEX (the warm migrates here).
                    if (i % 72 === 0) {
                        var pwr = 0.174 * S * Math.sqrt(rnd()), pwa = rnd() * TAU;
                        var pwpx = pwr * Math.cos(pwa) + 0.45 * S, pwpy = (1 - 0.5) * 1.35 * S + gauss(0.03 * S) - 0.05 * S, pwpz = pwr * Math.sin(pwa);
                        var pwld = 0.30 + 0.70 * Math.min(1, Math.max(0, (pwpx / S + 0.10) / 0.5));
                        return [pwpx, pwpy, pwpz, 0.88, 0.60 * pwld, 0];
                    }
                    var pL = Math.floor(rnd() * 6), pf = pL / 5;
                    var pR = 0.60 * S * (1.0 - pf);
                    var pa = rnd() * TAU, prad = pR * Math.sqrt(rnd());
                    var ppx = prad * Math.cos(pa) + 0.45 * S, ppy = (pf - 0.5) * 1.35 * S + gauss(0.02 * S) - 0.05 * S, ppz = prad * Math.sin(pa);
                    var pld = 0.30 + 0.70 * Math.min(1, Math.max(0, (ppx / S + 0.10) / 0.5));
                    return [ppx, ppy, ppz, 0.24 + 0.20 * pf, 0.64 * pld, 0];
                }
                case 'orbits': { // INERT dead code as of Round-26 (drift 流 took stage 7). Kept callable for
                    // reversibility, like convergence/sea. Never reached — 'orbits' is not in the stages array.
                    // ellipses in distinct planes about a shared star at the focus
                    // Round-18: orbits took the stage-6 (final-message) slot. That slot's viewport
                    // is crowded (final-message text above, full-width footer below), so the whole
                    // system is SCALED DOWN and LIFTED so its lit region clears the footer text
                    // union. oScale/oOy are tuned by measurement (see DESIGN.md §19), per viewport.
                    // Round-18 (PROVISIONAL, option 2): full orbits on desktop; SUPPRESSED on mobile.
                    // Mobile's stage-6 viewport has only ~65px clear between the closing line and the
                    // full-height footer — too little for a visible orbit system without landing on
                    // text. So on mobile the motif is pushed off-screen at zero brightness (renders
                    // nothing over the footer/closing line). See DESIGN.md §19; revisit when the
                    // heading/section restructure gives stage 6 a real slot.
                    if (isMobile) return [gauss(0.05), 12.0 + gauss(0.05), gauss(0.05), 0.3, 0.0, 0];
                    // Desktop placement, tuned by measurement to clear the footer union (top y519) AND
                    // the closing-line glyphs (y327–376), sitting in the band below the nav pill (y87).
                    var oScale = 0.116;                                   // compact, fits the ~240px clear band
                    var oOy = 1.88;                                       // lift into the clear band
                    var oOx = S * 0.15;
                    if (rnd() < 0.028) {                                  // the STAR — small, tight, warm, at the common focus
                        rc = 0.08 * S * oScale * Math.cbrt(rnd()); u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u);
                        return [rc * s * Math.cos(th) + oOx, rc * u + oOy, rc * s * Math.sin(th), 0.93, 0.85, 0];
                    }
                    var el = orbEls[i % NORB];
                    var ta = rnd() * TAU;                                 // true anomaly
                    var rr2 = el.a * (1 - el.e * el.e) / (1 + el.e * Math.cos(ta)); // r from FOCUS (star)
                    var ang = ta + el.arg;
                    // plane basis from the normal n(phi,psi); build the ellipse in that plane
                    var nx = Math.sin(el.phi) * Math.cos(el.psi), ny = Math.sin(el.phi) * Math.sin(el.psi), nz = Math.cos(el.phi);
                    var ux = -nz, uy = 0, uz = nx, ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uz /= ul; // u = n × up
                    var vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux;            // v = n × u
                    var cc = Math.cos(ang), ss = Math.sin(ang), tb = 0.013; // thin tube → particle texture, not a filled stroke
                    return [rr2 * (cc * ux + ss * vx) * oScale + oOx + gauss(tb), rr2 * (cc * uy + ss * vy) * oScale + oOy + gauss(tb), rr2 * (cc * uz + ss * vz) * oScale + gauss(tb),
                        Math.max(0.22, 0.48 - (i % NORB) * 0.035), 0.6, 0];
                }
                case 'strata': { // accumulated horizontal layers
                    la = Math.floor(rnd() * 7); sy = (la / 6 - 0.5) * S * 1.75;
                    return [(rnd() * 2 - 1) * S * 1.6, sy + gauss(0.04), (rnd() * 2 - 1) * S * 0.65, 0.24 + 0.3 * (la / 6), 0.55, 0];
                }
                case 'stream': { // 最新ブログ (Blog) — Round-33: RHOMBICUBOCTAHEDRON wireframe. A volumetric polyhedron
                    // in perspective (near edges larger/brighter via the shader's size attenuation), replacing the
                    // Round-21→22 coplanar radial emitter (which read as a flat 2-D asterisk collapsing to a line at
                    // edge-on; kept inert as 'radialemitter' below). Edges-as-particles, attribute-free from aSeed.
                    // CENTRED at origin → the 0.55·S emitter's 20.8% tall right-spill (§25.2 projected metric) → ~0.
                    // Warm CORE at the centroid, absolute radius, full coherence (§23 full-or-nothing). Legibility at
                    // 70k mobile (§33): even allocation i%nE (no lucky-thin edges) + a TIGHT jitter (crisp lines, not
                    // fuzzy tubes) + a larger mobile circumradius (RCO_R above) so the 48 edges separate.
                    if (rnd() < 0.009) {                                  // warm CORE at centroid — ABSOLUTE radius, full, ~cosmos share
                        var koph = Math.acos(2 * rnd() - 1), koth = rnd() * TAU, kor = 0.05 * S * Math.cbrt(rnd());
                        return [kor * Math.sin(koph) * Math.cos(koth), kor * Math.cos(koph), kor * Math.sin(koph) * Math.sin(koth), 0.88, 0.5, 0];
                    }
                    var re5 = rcoE[i % rcoE.length];                      // even allocation across the 48 edges
                    var rv5a = rcoV[re5[0]], rv5b = rcoV[re5[1]], rt5 = rnd();
                    var rj5 = (isMobile ? 0.006 : 0.008) * S;             // tight tube → crisp line (proto 0.012 read fuzzy at 70k)
                    return [rv5a[0] + (rv5b[0] - rv5a[0]) * rt5 + gauss(rj5), rv5a[1] + (rv5b[1] - rv5a[1]) * rt5 + gauss(rj5), rv5a[2] + (rv5b[2] - rv5a[2]) * rt5 + gauss(rj5), 0.30, 0.6, 0];
                }
                case 'radialemitter': { // RETIRED Round-33 (stage 5 is now the rhombicuboctahedron above). Kept as INERT
                    // dead code per the project pattern (cf. orbits/convergence/sea, and §32's amp-0 flat sheet) —
                    // 'radialemitter' is not in the stages[] array, so this never runs; reachable via make('radialemitter').
                    // Round-21→22 (Blog): a SOURCE broadcasting — a warm hot core emitting 16 cool filaments that RADIATE
                    // outward in a plane, tapering thick-core→thin-rim, centred at 0.55·S. See DESIGN.md §24/§25.
                    if (rnd() < 0.009) {                                  // the hot CORE — ABSOLUTE radius, warm ~cosmos share
                        var srca = rnd() * TAU, srcr = 0.05 * S * Math.cbrt(rnd());
                        var srcx = srcr * Math.cos(srca) + 0.55 * S;
                        var srcld = 0.25 + 0.75 * Math.min(1, Math.max(0, (srcx / S - 0.05) / 0.5));
                        return [srcx, srcr * Math.sin(srca) - 0.05 * S, gauss(0.03 * S), 0.88, 0.5 * srcld, 0];
                    }
                    var fil = Math.floor(rnd() * 16);                     // 16 filaments radiating from the core
                    var frr = 0.05 * S + 0.7076 * S * Math.pow(rnd(), 0.95); // Scale A reach; density falls outward
                    var frf = Math.min(1, frr / (0.7076 * S));
                    var frang = fil * TAU / 16 + gauss(0.055 * (1.0 - 0.6 * frf)); // filament TAPERS: thick core → thin rim
                    var frx = frr * Math.cos(frang) + 0.55 * S, fry = frr * Math.sin(frang) - 0.05 * S, frz = gauss(0.03 * S);
                    var frld = 0.25 + 0.75 * Math.min(1, Math.max(0, (frx / S - 0.05) / 0.5)); // left-dim protects the blog text
                    return [frx, fry, frz, 0.30 + gauss(0.012), (0.72 - 0.45 * frf) * frld, 0]; // flat teal-cyan, brighter+thicker near core
                }
                case 'waveforms': { // SIGNAL traces: thin, regular, periodic (distinct from nature's organic slabs)
                    var wtr = Math.floor(rnd() * 5);                      // 5 thin signal lines
                    var wxx = -S * 1.7 + rnd() * S * 3.4;
                    var wty = (wtr / 4 - 0.5) * S * 1.55 + 0.22 * S * Math.sin(wxx * 2.7 + wtr * 1.7);
                    var wzz = (wtr - 2) * S * 0.11 + WAVE_CORR_AMP * S * Math.sin(wxx * WAVE_CORR_FREQ);   // ARM-2: z corrugation (0 amp = flat)
                    return [wxx, wty + gauss(0.03 * S), wzz, 0.36 + 0.22 * rnd(), 0.72, (wtr + 0.5) / 5];
                }
                case 'drift': { // ACCRETION DISC (Round-34 Step-6, §34): orbits around an INVISIBLE mass. make() places the
                    // STATIC base at θ0 (t=0); the shader advances θ = θ0 + uTime·ω(r) (Keplerian) — a target override,
                    // so mobile is suppressed by BOTH brightness 0 AND uDiscOn=0 (§30.7 belt-and-suspenders). r/θ0/thickness
                    // from aSeed hashes (attribute-free); density falls outward via r=RIN+(ROUT-RIN)·h^PWR; void inside RIN.
                    if (isMobile) return [gauss(0.05), 12.0 + gauss(0.05), gauss(0.05), 0.3, 0.0, 0];
                    var dsd = (sd == null ? rnd() : sd);
                    var dh3 = dhashJS(dsd, 37.7), dr, dth;
                    if (dhashJS(dsd, 91.7) < DISC_CLUMPFRAC) {                        // clump particle: narrow radius → rigid orbit
                        var cc = discClumps[Math.floor(dhashJS(dsd, 5.3) * DISC_NCLUMP) % DISC_NCLUMP];   // cc = [r,θ,size]
                        dr = cc[0] + (dhashJS(dsd, 7.1) * 2 - 1) * DISC_CLUMPR * cc[2];   // box (uniform) jitter, size-scaled r-extent → shears into an arc
                        dth = cc[1] + (dhashJS(dsd, 8.3) * 2 - 1) * DISC_CLUMPT * cc[2];
                    } else {                                                          // smooth disc background
                        dr = DISC_RIN + (DISC_ROUT - DISC_RIN) * Math.pow(dhashJS(dsd, 12.9), DISC_PWR); dth = dhashJS(dsd, 78.2) * TAU;
                    }
                    var dtz = (dh3 - 0.5) * DISC_THICK, dpx = dr * Math.cos(dth), dpy = dr * Math.sin(dth);
                    var dci = Math.cos(DISC_INC), dsi = Math.sin(DISC_INC);          // tilt about x by DISC_INC
                    return [dpx + DISC_CX, dpy * dci - dtz * dsi + DISC_CY, dpy * dsi + dtz * dci + DISC_CZ, 0.30, DISC_BR, 0];
                }
                case 'gascloud': { // RETIRED Round-34 Step-6 (stage 7 is now the accretion disc). INERT dead code, matching
                    // orbits/convergence/sea/radialemitter/driftcurrent. The Step-1→4 diffuse GAS: uniform-random density-
                    // varied field filling the viewport, with the Step-4 large-soft-sprite finding (reusable — see §34).
                    // Reachable via make('gascloud'); not in stages[]. Cool teal, dim.
                    if (isMobile) return [gauss(0.05), 12.0 + gauss(0.05), gauss(0.05), 0.3, 0.0, 0];
                    var gh = rnd() * gasTot, glo = 0, ghi = gasCDF.length - 1;
                    while (glo < ghi) { var gm = (glo + ghi) >> 1; if (gasCDF[gm] < gh) glo = gm + 1; else ghi = gm; }
                    var ggx = ((glo % GAS_NGX + rnd()) / GAS_NGX * 2 - 1) * GAS_EX;
                    var ggy = (((glo / GAS_NGX | 0) + rnd()) / GAS_NGY * 2 - 1) * GAS_EY;
                    var ggz = (rnd() * 2 - 1) * GAS_EZ;
                    return [ggx, ggy, ggz, 0.30, GAS_BR, 0];
                }
                case 'driftcurrent': { // RETIRED Round-34 (stage 7 is now the gas above). INERT dead code, matching
                    // orbits/convergence/sea: 'driftcurrent' is not in stages[], so it never runs; reachable via
                    // make('driftcurrent'). The Round-28→30 drift (流) STATIC C2-weave base — the shader advection +
                    // band-fit that made it FLOW and fit the nav→message band were removed this round (§34); to revive,
                    // re-add the uLineTex/sampleLine advection block + updateDriftBand per §30.
                    if (isMobile) return [gauss(0.05), 12.0 + gauss(0.05), gauss(0.05), 0.3, 0.0, 0];
                    var dsd = (sd == null ? rnd() : sd);
                    var dLi = Math.floor(dhashJS(dsd, 127.1) * DRIFT_NLINES) % DRIFT_NLINES;
                    var dS0 = dhashJS(dsd, 311.7);
                    var dcol = dS0 * (DRIFT_DPTS - 1), dc0 = Math.floor(dcol), dfr = dcol - dc0, dc1 = Math.min(dc0 + 1, DRIFT_DPTS - 1);
                    var dln = driftLines[dLi];
                    var dbx = dln[dc0][0] + (dln[dc1][0] - dln[dc0][0]) * dfr;
                    var dby = dln[dc0][1] + (dln[dc1][1] - dln[dc0][1]) * dfr;
                    var dpark = dhashJS(dsd, 53.3) < DRIFT_PARK ? 0.0 : DRIFT_BR;
                    return [dbx * DRIFT_SX + gauss(0.02), dby * DRIFT_SY0 + DRIFT_CY0 + gauss(0.02), gauss(0.30), 0.30, dpark, 0];
                }
                case 'convergence': { // INERT dead code as of Round-18 (orbits took stage 6). Kept
                    // for cheap reversibility, mirroring how orbits was kept when convergence
                    // replaced it. Never reached — 'convergence' is no longer in the stages array.
                    // (What it did: gather inward to a COMPACT wide+short bright form. NOTE its
                    // oy=-S*0.9 offset was tuned to sit below the old Projects card grid, which no
                    // longer exists; the offset is stale and must be re-derived if ever re-enabled.)
                    var ox = 0, oy = -S * 0.9;
                    if (rnd() < 0.6) {                                    // tight bright core (wide-short)
                        return [gauss(S * 0.2) + ox, gauss(S * 0.08) + oy, gauss(S * 0.14), 0.5 + 0.3 * rnd(), 0.85, 0];
                    }
                    var ca = rnd() * TAU, cr = S * (0.28 + 0.42 * rnd());
                    return [cr * Math.cos(ca) + ox, cr * Math.sin(ca) * 0.34 + oy, gauss(S * 0.14), 0.32 + 0.2 * rnd(), 0.5, 0]; // y compressed → clears the card band
                }
                case 'sea': { // 学問の海 — INERT dead code (Round-25: built, measured, NOT adopted). Kept callable for
                    // cheap reversibility, like 'convergence'/'orbits' above. Never reached — 'sea' is not in the
                    // stages array; stage 7 is 'drift' (Round-26→30, §30). This case is only the resting SURFACE sheet; the full
                    // motif also needed a shader block + a uSeaY uniform, which are NOT in the live shader. To revive,
                    // re-add per DESIGN.md §28 (the record of the mechanics, all attribute-free):
                    //   • uSeaY uniform, set live from the .final-message rect (updateSeaY: worldYAtScreen(<p> top)+0.75
                    //     world) so the surface sits just above the closing message in BOTH compositions.
                    //   • a fixed WORLD splash amplitude (auto-scales screen-px by aspect), lateral burst.
                    //   • ripples + a POPULATION of splashes: the surface split into cells along x, each an independent
                    //     oscillator with per-cell phase + incommensurate per-cell period (no global beat); per-(cell,cycle)
                    //     hashes pick fire/x-jitter/size/start — scattered, staggered, non-repeating. No attribute.
                    // Verified (§28.4): message 16.6 wide / 15.06 tall (0 below AA), offscreen T0 B0 L16.7 R15.9,
                    //   lumCV 1.78/1.64, GPU 5.10 ms vs orbits 5.40 ms @200k (passed the frame-time gate). Rejected on the
                    //   READ: a thick teal band + splashes, not a sea — the message sits under the waterline, no room for a body.
                    if (isMobile) return [gauss(0.05), 12.0 + gauss(0.05), gauss(0.05), 0.3, 0.0, 0];
                    var seax = (rnd() * 2 - 1) * 4.1;              // surface spread across the width
                    var seay = Math.abs(gauss(0.05)) * 0.9;       // thin surface, nominal y≈0 (shader would add uSeaY)
                    var seaz = (rnd() * 2 - 1) * 0.55;
                    return [seax, seay, seaz, 0.30, 0.42, 0];     // flat cool teal
                }
                default: return [0, 0, 0, 0.3, 1, 0];
            }
        }

        /* ---- Fill attribute buffers ------------------------------------
           16-attribute GPU limit. Pack each stage's (energy, bright) into ONE float — packed =
           floor(bright*100) + energy — and hold all K in ceil(K/4) vec4 attributes. Aux
           (wave/stream) is derived procedurally in the shader from position + seed, not stored.
           Round-20 at K=8: 8 pos + ceil(8/4)=2 eb + seed + aCoh (migration coherence) = 12 attribute
           slots (was 10 at K=7, 14 at K=10). Desktop +aCoh = +0.8 MB; mobile +0.28 MB. */
        var EBV = Math.ceil(K / 4);                       // vec4 attributes to hold K packed floats
        var pos = [], eb = [];
        for (var k = 0; k < K; k++) pos.push(new Float32Array(COUNT * 3));
        for (var q = 0; q < EBV; q++) eb.push(new Float32Array(COUNT * 4));
        var seed = new Float32Array(COUNT);
        for (var i = 0; i < COUNT; i++) {
            seed[i] = rnd();
            for (var kk = 0; kk < K; kk++) {
                var v = make(stages[kk], i, seed[i]);
                pos[kk][i * 3] = v[0]; pos[kk][i * 3 + 1] = v[1]; pos[kk][i * 3 + 2] = v[2];
                eb[Math.floor(kk / 4)][i * 4 + (kk % 4)] = Math.floor(Math.min(1, Math.max(0, v[4])) * 100) + Math.min(0.999, Math.max(0, v[3]));
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos[0], 3));
        for (var kA = 1; kA < K; kA++) geo.setAttribute('aP' + kA, new THREE.BufferAttribute(pos[kA], 3));
        for (var kq = 0; kq < EBV; kq++) geo.setAttribute('aEB' + kq, new THREE.BufferAttribute(eb[kq], 4));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
        // Round-20 migration coherence: 1 for the warm-core particles (i%72, the SAME set the
        // foundation/specialty make() cases place at the base/apex), 0 otherwise. In the vertex
        // shader this suppresses the mid-transition dispersal for those particles ONLY across the
        // 3→4 (基礎→専門) traverse, so the hot core stays legible and rises instead of dissolving.
        // Full coherence (1.0) is required — measurement showed partial (0.70) does not hold the
        // core (the |curl| estimate underpredicted the scatter). See DESIGN.md §23.
        var aCohArr = new Float32Array(COUNT);
        for (var _c = 0; _c < COUNT; _c++) aCohArr[_c] = (_c % 72 === 0) ? 1.0 : 0.0;
        geo.setAttribute('aCoh', new THREE.BufferAttribute(aCohArr, 1));

        var attributeBytes = (K * 3 + EBV * 4 + 1 + 1) * 4 * COUNT;   // pos + packed eb + seed + aCoh (migration coherence)

        /* ---- Shader: curl flow + attractor blend, 8-way target select --- */
        var attrDecl = '';
        for (var d1 = 1; d1 < K; d1++) attrDecl += 'attribute vec3 aP' + d1 + ';\n';
        for (var d3 = 0; d3 < EBV; d3++) attrDecl += 'attribute vec4 aEB' + d3 + ';\n';
        var posName = function (idx2) { return idx2 === 0 ? 'position' : 'aP' + idx2; };
        var pickPos = '  if(idx<=0) return position;\n';
        for (var pk = 1; pk < K; pk++) pickPos += '  ' + (pk === K - 1 ? 'return ' + posName(pk) + ';' : 'if(idx<=' + pk + ') return ' + posName(pk) + ';') + '\n';
        // ebOf(idx): the packed energy/bright float for stage idx (component of an aEB vec4)
        var pickEB = '';
        for (var pe = 0; pe < K; pe++) {
            var comp = ['x', 'y', 'z', 'w'][pe % 4];
            pickEB += '  ' + (pe === K - 1 ? 'return aEB' + Math.floor(pe / 4) + '.' + comp + ';' : 'if(idx<=' + pe + ') return aEB' + Math.floor(pe / 4) + '.' + comp + ';') + '\n';
        }

        var vertexShader = [
            'precision highp float;',
            'uniform float uSceneF, uCalm, uTime, uSize, uPixelRatio, uDisperse, uResidual, uNoiseFreq, uWaveAmp;',
            'uniform float uDriftAmp, uGasGain, uGasSize, uDiscOn;',   // Round-34 (§34): curl shimmer; aspect brightness lift; stage-7 sprite size (Step-4 large soft sprites, reused for the disc band); uDiscOn = accretion-disc gate (0 on mobile → suppressed, §30.7)
            attrDecl, 'attribute float aSeed;', 'attribute float aCoh;',
            'varying float vE; varying float vB; varying float vNear; varying float vInfra; varying float vGas;',
            'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
            'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
            'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
            'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
            'float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
            '  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);',
            '  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);',
            '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
            '  float ns_=0.142857142857;vec3 ns=ns_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
            '  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
            '  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
            '  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
            '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
            '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}',
            'vec3 snoiseVec3(vec3 p){return vec3(snoise(p),snoise(p+17.1),snoise(p-43.7));}',
            'vec3 curl(vec3 p){const float e=0.6;vec3 p0=snoiseVec3(p);vec3 px=snoiseVec3(p+vec3(e,0.,0.));vec3 py=snoiseVec3(p+vec3(0.,e,0.));vec3 pz=snoiseVec3(p+vec3(0.,0.,e));',
            '  return vec3((py.z-p0.z)-(pz.y-p0.y),(pz.x-p0.x)-(px.z-p0.z),(px.y-p0.y)-(py.x-p0.x))/e;}',
            // Round-34 Step-6 (§34): small hash for the accretion disc (r/θ0/thickness from aSeed, mirrors dhashJS).
            'float dhash(float a, float b){return fract(sin(a*b)*43758.5453);}',
            discClumpGLSL,   // §34 Step-7: baked clump centres for the accretion disc (mirrors discClumps)
            'vec3 targetPos(int idx){\n' + pickPos + '}',
            'float ebOf(int idx){\n' + pickEB + '}',
            'void main(){',
            '  int iA=int(floor(uSceneF)); int iB=iA+1; if(iB>' + (K - 1) + ') iB=' + (K - 1) + ';',
            '  float f=uSceneF-floor(uSceneF);',
            '  vec3 target=mix(targetPos(iA),targetPos(iB),f);',
            // unpack energy/bright per stage THEN mix (packed floats are not linearly mixable)
            '  float ebA=ebOf(iA), ebB=ebOf(iB);',
            '  float en=mix(fract(ebA),fract(ebB),f);',
            '  float br=mix(floor(ebA)/100.0,floor(ebB)/100.0,f);',
            '  vInfra=(1.0-clamp(abs(uSceneF-2.0),0.0,1.0));',   // infra: stage 3 -> 2 (network removed)
            // attraction: 1 at a scene centre, dips between. NATURE (index 1) stays looser.
            // Round 14 dwell plateau: w holds at 1.0 across fc in [0,0.20] (a scroll band
            // ~±24vh around each snap point) so a snapped form stays fully resolved while
            // the viewer rests, then dissolves to w=0 at the midpoint (fc=0.5) between stages.
            '  float fc=min(f,1.0-f); float w=1.0-smoothstep(0.20,0.5,fc);',
            '  float natureW=1.0-clamp(abs(uSceneF-1.0),0.0,1.0);',
            '  float wfW=1.0-clamp(abs(uSceneF-6.0),0.0,1.0);',              // waveforms: stage 8 -> 6 (videos block; Round-20 +1 for the 専門 split)
            // travelling WAVE surface for nature + waveforms — the SURFACE moves (per-particle
            // phase from aSeed), not per-particle smear, so lit-body holds.
            '  float waveW=max(natureW,wfW); float waveFq=mix(1.1,2.4,wfW);',
            '  float ph = target.x*waveFq - uTime*0.9 + aSeed*6.2831;',
            '  target.y += uWaveAmp*waveW*sin(ph);',
            '  br *= mix(1.0, 0.6+1.05*sin(ph), waveW);',                   // crests bright (up to 1.65x), troughs dark
            // Round-34 (§34): the drift advection block (streamline sampling + §30.5 band-fit target override) is
            // REMOVED. Stage 7 is now the diffuse gas placed entirely in the attribute (make 'drift'); the shader
            // leaves target untouched here and only adds the gentle stage-7 curl shimmer below (driftW·uDriftAmp).
            '  float vDrift=1.0;',
            // Round-34 Step-6 (§34): ACCRETION DISC — advance each particle's orbit angle θ = θ0 + uTime·ω(r), ω Keplerian
            // (∝ r^-1.5, inner laps the rim). Gated to stage 7 (driftW7) AND uDiscOn (mobile off → make()'s parked base shows,
            // §30.7). target is REPLACED with the tilted-disc position around the invisible centre.
            '  float driftW7=1.0-clamp(abs(uSceneF-7.0),0.0,1.0);',
            '  if(driftW7>0.001 && uDiscOn>0.5){',
            '    float h3=dhash(aSeed,37.7); float r, th0;',
            '    if(dhash(aSeed,91.7) < ' + dF(DISC_CLUMPFRAC) + '){ vec3 cc=clumpAt(floor(dhash(aSeed,5.3)*' + dF(DISC_NCLUMP) + ')); r=cc.x+(dhash(aSeed,7.1)*2.0-1.0)*' + dF(DISC_CLUMPR) + '*cc.z; th0=cc.y+(dhash(aSeed,8.3)*2.0-1.0)*' + dF(DISC_CLUMPT) + '*cc.z; }',   // clump: box-jitter granular denser knot, size-scaled, shears into an arc (grains use a smaller sprite, see ps line)
            '    else { r=' + dF(DISC_RIN) + '+' + dF(DISC_ROUT - DISC_RIN) + '*pow(dhash(aSeed,12.9),' + dF(DISC_PWR) + '); th0=dhash(aSeed,78.2)*6.2831; }',
            '    float w2=' + dF(DISC_W0) + '*pow(' + dF(DISC_RIN) + '/r,1.5);',
            '    float th=th0 + uTime*w2;',
            '    float tz=(h3-0.5)*' + dF(DISC_THICK) + ';',
            '    vec3 dp=vec3(r*cos(th), r*sin(th), tz);',
            '    float ci=' + dF(Math.cos(DISC_INC)) + ', si=' + dF(Math.sin(DISC_INC)) + ';',
            '    vec3 wp=vec3(dp.x+' + dF(DISC_CX) + ', dp.y*ci-dp.z*si+' + dF(DISC_CY) + ', dp.y*si+dp.z*ci+' + dF(DISC_CZ) + ');',
            '    target=mix(target, wp, driftW7);',
            '  }',
            '  float streamW=1.0-clamp(abs(uSceneF-5.0),0.0,1.0);',        // Blog (stage 5): the radiating source
            // Round-21: the Blog motif is now a RADIAL burst, not a directed flow, so the old horizontal
            // sweep (sin(target.x…)) was a mismatch. Replaced with a uniform TIME breathe — the whole source
            // gently pulses as it emits. Peak is 1.0× (was 1.2×), so it can only improve the blog-title AA.
            '  br *= mix(1.0, 0.82+0.18*sin(uTime*1.4), streamW);',
            // curl drift; residual kept tiny at peak so forms are crisp — except nature (揺らぎ).
            '  float resid = mix(uResidual, uResidual+0.03, natureW);',   // waves: undulation from the surface, not per-particle smear (keeps lit-body up)
            '  float spd=0.9+aSeed*0.6;',
            '  float tRate = mix(1.0, 0.5, uCalm);',                        // below-hero: slower ambient motion
            '  vec3 cn=curl(target*uNoiseFreq + vec3(0.0,0.0,uTime*0.15*spd*tRate) + aSeed*7.0);',
            // Round-20 migration: warm-core particles (aCoh=1) resist the mid-transition dispersal,
            // but ONLY across the 3→4 (基礎→専門) traverse — cohA is 0 at every other sceneF, so all
            // other stages and all cool particles are unchanged. Keeps the hot core coherent so it
            // rises base→apex instead of dissolving at the midpoint. See DESIGN.md §23.
            '  float cohA=aCoh*(1.0-clamp(abs(uSceneF-3.5)*2.0,0.0,1.0));',
            '  float amp=mix(resid,uDisperse,(1.0-w)*(1.0-cohA));',
            // Round-26 drift (流, stage 7): raise the curl amplitude so the cloud FLOWS and folds continuously.
            // cn is a bounded curl offset (not integrated), so this wanders each particle ~±0.3 world coherently
            // around its target and never drifts away. Gated to stage 7 (driftW); 0 elsewhere = no-op.
            '  float driftW=1.0-clamp(abs(uSceneF-7.0),0.0,1.0);',
            '  amp += driftW*uDriftAmp;',   // Round-28 (§30): now a SMALL RESIDUAL curl on top of the along-streamline advection — life, not locomotion. driftW·0.28 (Round-26) smeared the weave (isotropic offset ±0.29 ≈ streamline spacing 0.30 → filled the eddy voids); advection carries the flow instead, so this drops to a small uDriftAmp (measured 0 vs small — see §30).
            '  vec3 p=target + cn*amp;',
            '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
            '  gl_Position=projectionMatrix*mv;',
            // depth cue: near brighter+bigger, far dimmer+smaller (drives the SPHERE 3D read)
            '  float depth=-mv.z; vNear=clamp((13.0-depth)/7.0,0.0,1.0);',
            '  float orbW=1.0-clamp(abs(uSceneF-7.0),0.0,1.0);',           // orbits: stage 6 -> 7 (final-message slot; Round-20 +1 for the 専門 split)
            '  float boost=0.5+en*0.8+vNear*0.6;',                        // §34: stage-7 gas wants flat depth → drop the orbW near/far size boost (orbits inert)
            '  float ps=clamp(uSize*boost/max(depth,0.1),0.0,8.0);',
            '  float isC=step(dhash(aSeed,91.7), ' + dF(DISC_CLUMPFRAC) + ')*(1.0-clamp(abs(uSceneF-7.0),0.0,1.0));',   // §34 Step-8: clump-grain flag (stage-7 only)
            '  float dsz=mix(uGasSize, uGasSize*' + dF(DISC_CLUMPSZK) + ', isC);',   // clump grains get a smaller footprint → stay granular despite higher density
            '  ps=mix(ps, dsz, driftW); vGas=driftW;',   // §34 Step-4: stage-7 disc → soft sprites (uGasSize) so the body reads as a medium; driftW=0 elsewhere → other stages unchanged
            '  gl_PointSize=ps*uPixelRatio;',
            // orbits carry their 3D read ENTIRELY through the near/far gradient — push it hard
            // (near much brighter, far much dimmer) while overall staying in the calm register.
            '  float nearRamp=mix(0.55+0.45*vNear, 0.9+0.15*vNear, orbW);',   // §34: stage-7 gas → nearly-flat depth brightness (was the orbits near/far ramp 0.1+1.65)
            // INFRA only: dim the left screen third (clip-space x) so the bright lattice band never
            // crosses the left text column — the heading 学びを、社会へ。 rests there and a bright
            // additive band under it dropped its contrast to ~2:1. Form still fills centre+right
            // (matches the "formation sits on the right" composition). vInfra→0 elsewhere = no-op.
            '  float ndcx=gl_Position.x/gl_Position.w;',
            '  float leftDim=mix(1.0, 0.15+0.85*smoothstep(-0.55,-0.15,ndcx), vInfra);',
            '  br *= mix(1.0, uGasGain, driftW);',   // §34: aspect brightness lift, stage-7 gas only (driftW=0 elsewhere) — tall wastes x off-screen, so lift it
            '  vE=en; vB=br*mix(1.0,0.62,uCalm)*nearRamp*leftDim*vDrift;',        // calm below hero; far dimmer; infra left column protected; vDrift fades drift line-ends
            '}'
        ].join('\n');

        var fragmentShader = [
            'precision highp float;',
            'uniform vec3 uBlueDeep,uTeal,uCyan,uBlue,uViolet,uMagenta,uEmber;',
            'uniform float uAlpha,uExposure,uTime,uGasSoft;',
            'varying float vE; varying float vB; varying float vNear; varying float vInfra; varying float vGas;',
            'vec3 spectrum(float x){x=clamp(x,0.0,1.0);',
            '  if(x<0.22)return mix(uBlueDeep,uTeal,x/0.22);else if(x<0.40)return mix(uTeal,uCyan,(x-0.22)/0.18);',
            '  else if(x<0.62)return mix(uCyan,uBlue,(x-0.40)/0.22);else if(x<0.80)return mix(uBlue,uViolet,(x-0.62)/0.18);',
            '  else if(x<0.90)return mix(uViolet,uMagenta,(x-0.80)/0.10);return mix(uMagenta,uEmber,(x-0.90)/0.10);}',
            'vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}',
            'void main(){',
            '  vec2 uv=gl_PointCoord-0.5; float d=length(uv); if(d>0.5) discard;',
            '  float inner=mix(0.35,0.05,vNear); float core=smoothstep(0.5,inner,d);',
            '  float hot=smoothstep(0.7,1.0,vE); float halo=smoothstep(0.5,0.0,d)*hot; float aa=max(core,halo*0.5);',
            '  aa=mix(aa, pow(smoothstep(0.5,0.0,d), uGasSoft), vGas);',   // §34 Step-4: stage-7 gas → soft radial falloff (uGasSoft; lower = broader/softer) so large sprites blend continuously',
            '  float stream=1.0 + vInfra*0.7*sin(gl_FragCoord.x*0.012 - uTime*2.2 + vE*28.0);',
            '  vec3 col=aces(spectrum(vE)*uExposure);',
            '  gl_FragColor=vec4(col, aa*vB*uAlpha*stream);',
            '}'
        ].join('\n');

        var uniforms = {
            uSceneF: { value: 0 }, uCalm: { value: 0 }, uTime: { value: 0 }, uSize: { value: isMobile ? 18 : 17 },
            uAlpha: { value: 0.5 }, uExposure: { value: 1.08 }, uPixelRatio: { value: DPR },
            uDisperse: { value: isMobile ? 0.9 : 1.15 }, uResidual: { value: 0.022 }, uNoiseFreq: { value: 0.22 }, uWaveAmp: { value: 0.7 },
            uDriftAmp: { value: 0.06 }, uGasGain: { value: 1.0 }, uGasSize: { value: 6.0 }, uGasSoft: { value: 2.0 }, uDiscOn: { value: isMobile ? 0 : 1 },   // Round-34 (§34): curl shimmer + aspect lift + large soft sprites (11px for the disc band) + accretion-disc gate (mobile off, §30.7).
            uBlueDeep: { value: new THREE.Color(0x0b3be0) }, uTeal: { value: new THREE.Color(0x2bd9c4) }, uCyan: { value: new THREE.Color(0x00c2cb) },
            uBlue: { value: new THREE.Color(0x3d8bff) }, uViolet: { value: new THREE.Color(0x7b4dff) }, uMagenta: { value: new THREE.Color(0xff3d8b) }, uEmber: { value: new THREE.Color(0xff5a3c) }
        };
        var material = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });

        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setClearColor(0x000000, 0);
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, isMobile ? 8.5 : 7.0);
        var points = new THREE.Points(geo, material); points.frustumCulled = false; scene.add(points);

        /* ---- Telemetry -------------------------------------------------- */
        var gl = renderer.getContext();
        var timerExt = (function () { try { return gl.getExtension('EXT_disjoint_timer_query_webgl2'); } catch (e) { return null; } })();
        var telEl = document.createElement('div'); telEl.id = 'telemetry'; telEl.setAttribute('aria-hidden', 'true');
        telEl.innerHTML = '<span><b>' + Math.round(COUNT / 1000) + 'k</b>particles</span><span><b class="t-ms">–</b> frame ms</span><span><b class="t-fps">–</b>fps</span>';
        document.body.appendChild(telEl);
        var tMs = telEl.querySelector('.t-ms'), tFps = telEl.querySelector('.t-fps');
        var gpuQuery = null, gpuMs = 0, fpsAcc = 0, fpsN = 0, telClock = 0;
        function telBegin() { if (!timerExt || gpuQuery) return; try { gpuQuery = gl.createQuery(); gl.beginQuery(timerExt.TIME_ELAPSED_EXT, gpuQuery); } catch (e) { gpuQuery = null; } }
        function telEnd(dt) {
            if (timerExt && gpuQuery) { try { gl.endQuery(timerExt.TIME_ELAPSED_EXT); } catch (e) { } }
            if (timerExt && gpuQuery) { try { if (gl.getQueryParameter(gpuQuery, gl.QUERY_RESULT_AVAILABLE)) { if (!gl.getParameter(timerExt.GPU_DISJOINT_EXT)) gpuMs = gpuMs ? gpuMs * 0.85 + (gl.getQueryParameter(gpuQuery, gl.QUERY_RESULT) / 1e6) * 0.15 : gl.getQueryParameter(gpuQuery, gl.QUERY_RESULT) / 1e6; gl.deleteQuery(gpuQuery); gpuQuery = null; } } catch (e) { gpuQuery = null; } }
            fpsAcc += dt; fpsN++; telClock += dt;
            if (telClock > 0.5 && fpsAcc > 0) { tFps.textContent = Math.round(fpsN / fpsAcc); tMs.textContent = (timerExt && gpuMs ? gpuMs : 1000 * fpsAcc / fpsN).toFixed(1); fpsAcc = 0; fpsN = 0; telClock = 0; }
        }

        /* ---- Whole-page stage centres → sceneF (0..K-1) ----------------- */
        var centers = [];   // doc-space centre of each stage
        function computeCenters() {
            centers = stageEls.map(function (el) { var r = el.getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; });
        }
        computeCenters();
        function sceneFor(scrollMid) {   // scrollMid = viewport centre in doc coords
            if (!centers.length) return 0;
            if (scrollMid <= centers[0]) return 0;
            for (var i2 = 0; i2 < centers.length - 1; i2++) {
                if (scrollMid < centers[i2 + 1]) { var d = centers[i2 + 1] - centers[i2]; return d > 0 ? i2 + (scrollMid - centers[i2]) / d : i2; }
            }
            return centers.length - 1;
        }
        function lerp(a, b, t) { return a + (b - a) * t; }
        function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

        // Round-17: remapped from 10 to 7 entries, each surviving stage keeping its old rotation.
        // new<-old index: 0<-0 cosmos, 1<-1 nature, 2<-3 infra, 3<-4 dispersal(merged),
        // 4<-7 stream(blog), 5<-8 waveforms(videos), 6 orbits(final-message, Round-18; was convergence).
        // Round-20 (K 7->8): 0 cosmos,1 nature,2 infra,3 foundation(基礎 stack),4 specialty(専門 stack),
        // 5 stream(Blog),6 waveforms(Videos),7 orbits. foundation keeps the old dispersal-slot rotation
        // [0,0.05] and specialty takes [0,0.08] — the values the stack rest states were prototyped under;
        // stream/waveforms/orbits keep their own rotations, shifted one slot right.
        var ROT = [[0, 0], [0.05, 0.04], [0.12, -0.16], [0.0, 0.05], [0.0, 0.08], [0.0, 0.08], [0.0, 0.03], [-0.1, 0.12]];
        function rotationFor(sf) { var seg = Math.min(K - 2, Math.floor(sf)); var t = sf - seg; return [lerp(ROT[seg][0], ROT[seg + 1][0], t), lerp(ROT[seg][1], ROT[seg + 1][1], t)]; }

        /* ---- Hero text opacity (whole block, one at a time) ------------- */
        function updateText(sf) {
            var vc = window.innerHeight / 2;
            for (var i3 = 0; i3 < visibleScenes.length; i3++) {
                var content = visibleScenes[i3].querySelector('.scene__content'); if (!content) continue;
                var op;
                if (isMobile) { op = 1 - smooth(0.42, 0.58, Math.abs(i3 - sf)); }
                else { var r3 = content.getBoundingClientRect(); var c = r3.top + r3.height / 2; op = 1 - smooth(0.5, 0.95, Math.abs(c - vc) / (window.innerHeight * 0.5)); }
                content.style.opacity = op.toFixed(3);
            }
        }

        /* ---- Render loop ------------------------------------------------ */
        var sfEased = 0, clock = 0, lastT = null, running = false, rafId = null, heroPassed = false;
        var gateScene = visibleScenes[0];
        function frame(now) {
            rafId = null; if (!running) return;
            if (lastT == null) lastT = now; var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;
            var mid = midOf();
            var sfT = sceneFor(mid);
            sfEased += (sfT - sfEased) * 0.09;
            // Round-34 (§34): band-fit removed — the gas fills the whole viewport independent of the message position.
            // calm register once past the hero (stage index >= HERO_K-1 → ramp)
            var calm = smooth(HERO_K - 1.5, HERO_K - 0.5, sfEased);
            uniforms.uSceneF.value = sfEased; uniforms.uCalm.value = calm; uniforms.uTime.value = clock;
            var rot = rotationFor(Math.min(K - 1, sfEased));
            // faster spin AT the cosmos sphere so near/far parallax is visible (reads as 3D volume)
            var cosW = 1 - Math.min(1, Math.abs(sfEased));
            // §34 Step-11: FREEZE the accretion-disc orientation at stage 7. The shared world-Y spin (clock term) was
            // rotating the tilted disc, so its apparent inclination swung face-on↔edge-on over the 314s period; the
            // edge-on phases compressed the grains into a dense slab (the same mechanism §32 fixed for stage 6). w7 gates
            // ONLY stage 7 (0 for sfEased<=6.3 → stages 0-6 identical): as the disc lands, rotation.x/y ease to a fixed
            // deterministic 0/0, so the disc sits at a constant tilt = DISC_INC. Particles still ORBIT (shader θ advance,
            // uTime) — only the disc's own orientation is frozen, not the motion within it.
            var discFreeze = smooth(6.3, 6.8, sfEased);
            points.rotation.x = rot[0] * (1 - discFreeze);
            points.rotation.y = (rot[1] + clock * (0.02 + 0.055 * cosW)) * (1 - discFreeze);
            updateText(Math.min(HERO_K - 1, sfEased));
            var hp = smooth(centers[0] - window.innerHeight * 0.5, centers[0], mid);
            if (gateScene) gateScene.style.setProperty('--scroll-hint', (1 - hp).toFixed(3));
            var passed = calm > 0.02; if (passed !== heroPassed) { heroPassed = passed; document.body.classList.toggle('hero-passed', passed); }
            telBegin(); renderer.render(scene, camera); telEnd(dt);
            rafId = requestAnimationFrame(frame);
        }
        function start() { if (running) return; running = true; lastT = null; rafId = requestAnimationFrame(frame); }
        function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
        function renderOnce() {
            computeCenters(); var mid = midOf(); sfEased = sceneFor(mid);
            uniforms.uSceneF.value = sfEased; uniforms.uCalm.value = smooth(HERO_K - 1.5, HERO_K - 0.5, sfEased);
            var rot = rotationFor(Math.min(K - 1, sfEased)); var dF7 = smooth(6.3, 6.8, sfEased);   // §34 Step-11: match the frame-loop disc freeze
            points.rotation.x = rot[0] * (1 - dF7); points.rotation.y = rot[1] * (1 - dF7);
            updateText(Math.min(HERO_K - 1, sfEased)); renderer.render(scene, camera);
        }

        // Round-34 (§34): updateDriftBand (§30.5 band-fit) + worldYAtScreen REMOVED — the gas fills the whole viewport
        // at every scroll position and does not depend on the nav/message rects, so no per-frame layout read is needed.
        // Aspect gas lift: tall wastes ~half the x-extent off-screen, so the same 200k particles are sparser on tall →
        // ramp brightness up as aspect narrows (position-INDEPENDENT, so no sliver defect like the old band-fit). Wide ≈ 1.
        function setGasGain() { var a = window.innerWidth / window.innerHeight; uniforms.uGasGain.value = 1.0 + 0.25 * Math.max(0, Math.min(1, (0.85 - a) / (0.85 - 0.62))); }   // tall lift capped so tall message stays ≥5.5 (§34 Step-3)
        setGasGain();

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                DPR = Math.min(window.devicePixelRatio || 1, 1.5); renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight);
                camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); uniforms.uPixelRatio.value = DPR; computeCenters();
                setGasGain(); if (!running) renderOnce();
            }, 200);
        });

        renderOnce(); canvas.classList.add('is-ready');
        start();
        document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

        // expose a tiny hook for measurement + capture (freeze a frame so a heavy always-on
        // field doesn't starve the screenshot compositor)
        window.__field = {
            count: COUNT, stages: K, attributeBytes: attributeBytes,
            pause: function () { renderOnce(); stop(); }, resume: start,
            sceneF: function () { return uniforms.uSceneF.value; },
            // Round 14: the shader's attractor weight w for a viewport-centre scroll position
            // (defaults to current). Mirrors the vertex shader exactly, dwell plateau included.
            wAt: function (scrollY) {
                var sf = sceneFor((scrollY == null ? window.scrollY : scrollY) + (window.innerHeight + SNAP_INSET) / 2);
                var f = sf - Math.floor(sf), fc = Math.min(f, 1 - f);
                var t = Math.min(1, Math.max(0, (fc - 0.20) / 0.30));
                return 1 - t * t * (3 - 2 * t);
            },
            // doc-space scrollY where CSS snap rests hero stage i: scene centre aligned to the
            // snapport centre (viewport inset at top by --nav-clearance). midOf() then returns the
            // scene centre exactly, so sceneF is an integer there → pure motif at rest.
            snapRest: function (i) { computeCenters(); return centers[i] - (window.innerHeight + SNAP_INSET) / 2; },
            // rotate WITHOUT advancing the curl (frozen uTime) → isolates pure rotation parallax
            spin: function (dy) { points.rotation.y += dy; renderer.render(scene, camera); }
        };
    }
})();

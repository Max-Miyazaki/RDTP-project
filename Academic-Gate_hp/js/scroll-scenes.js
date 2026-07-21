/* ============================================================================
   scroll-scenes.js — index.html full-page flow field (Round 13).

   ONE THREE.WebGLRenderer + ONE THREE.Points that runs the WHOLE PAGE. A curl-
   noise flow field drifts every particle continuously; each stage is an ATTRACTOR
   the flow concentrates into and releases. TEN stages, hero → footer:

     01 宇宙 cosmos      volumetric sphere (warm core through cool volume)
     02 自然 nature      undulating waves (travelling surface, 揺らぎ)
     03 社会 network     centre-dense nodes + edges, hub hierarchy
     04 情報基盤 infra   ordered lattice with streaming
     05 基礎領域        DISPERSAL — the lattice releases into dense unstructured drift
     06 専門領域        orbits (concentric ellipses)
     07 Notes           strata (accumulated horizontal layers)
     08 Blog            stream (a directed current)
     09 Videos          waveforms (oscillating signal bands)
     10 Projects        convergence (gather inward to one bright form — arrival)

   Below the hero the field drops to a CALM register (dimmer, slower) but stays
   DENSE. Past stage 10 the convergence holds behind the footer.

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
        // Ten stage centre elements: 4 hero scenes + 6 index-region blocks.
        var indexBlocks = Array.prototype.slice.call(document.querySelectorAll('.index-region .index-block'));
        var stageEls = visibleScenes.concat(indexBlocks);
        var stages = ['cosmos', 'nature', 'network', 'infra', 'dispersal', 'orbits', 'strata', 'stream', 'waveforms', 'convergence'].slice(0, stageEls.length);
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
        // ORBITS: each ring in its OWN plane (distinct inclination 15–55° + longitude of node)
        // so rings visibly cross in 3D; ellipses (eccentric) with the star at the common FOCUS.
        var NORB = 6, orbEls = [];
        for (var ob = 0; ob < NORB; ob++) orbEls.push({
            a: S * (0.5 + ob * 0.26), e: 0.12 + rnd() * 0.3,
            inc: (15 + rnd() * 40) * Math.PI / 180, node: rnd() * TAU, arg: rnd() * TAU
        });

        /* ---- Per-motif attractor target: [x,y,z, energy, bright, aux] ---
           aux: 1 = infra stream · 2 = stream(x-drift) · 0.x = wave layer phase (nature/waveforms). */
        function make(stage, i) {
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
                case 'dispersal': { // DENSE unstructured drift (released lattice; the flow made visible)
                    u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u); rc = S * 1.15 * Math.cbrt(rnd());
                    return [rc * s * Math.cos(th) * 1.35, rc * u, rc * s * Math.sin(th), 0.2 + 0.22 * rnd(), 0.55, 0];
                }
                case 'orbits': { // ellipses in distinct planes about a shared star at the focus
                    var oOx = S * 0.55;                                   // shift right so the dense rings clear the left text column
                    if (rnd() < 0.028) {                                  // the STAR — small, tight, warm, at the common focus
                        rc = 0.08 * S * Math.cbrt(rnd()); u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u);
                        return [rc * s * Math.cos(th) + oOx, rc * u, rc * s * Math.sin(th), 0.93, 0.85, 0];
                    }
                    var el = orbEls[i % NORB];
                    var ta = rnd() * TAU;                                 // true anomaly
                    var rr2 = el.a * (1 - el.e * el.e) / (1 + el.e * Math.cos(ta)); // r from FOCUS (star)
                    var ang = ta + el.arg;
                    var pfx = rr2 * Math.cos(ang), pfy = rr2 * Math.sin(ang);
                    var ci = Math.cos(el.inc), si = Math.sin(el.inc);     // tilt the plane (about x)
                    var ty = pfy * ci, tz = pfy * si;
                    var cn = Math.cos(el.node), sn = Math.sin(el.node);   // rotate the tilt (about vertical y)
                    return [pfx * cn + tz * sn + oOx + gauss(0.02), ty + gauss(0.02), -pfx * sn + tz * cn + gauss(0.02),
                        Math.max(0.22, 0.48 - (i % NORB) * 0.035), 0.6, 0];
                }
                case 'strata': { // accumulated horizontal layers
                    la = Math.floor(rnd() * 7); sy = (la / 6 - 0.5) * S * 1.75;
                    return [(rnd() * 2 - 1) * S * 1.6, sy + gauss(0.04), (rnd() * 2 - 1) * S * 0.65, 0.24 + 0.3 * (la / 6), 0.55, 0];
                }
                case 'stream': { // DIRECTED current: horizontal flow-lines, brighter leading edge (+x)
                    var sline = Math.floor(rnd() * 9);                    // 9 distinct streamlines
                    var sxr = rnd();                                      // 0 trailing (left) → 1 leading (right)
                    var sx = -S * 1.7 + sxr * S * 3.1;
                    var sly = (sline / 8 - 0.5) * S * 1.45;
                    return [sx, sly + 0.1 * S * Math.sin(sx * 0.5 + sline) + gauss(0.05 * S), (sline - 4) * S * 0.09 + gauss(0.04 * S),
                        0.26 + 0.2 * rnd(), (0.35 + 0.6 * sxr) * 0.85, 0]; // brightness ramps toward the leading edge
                }
                case 'waveforms': { // SIGNAL traces: thin, regular, periodic (distinct from nature's organic slabs)
                    var wtr = Math.floor(rnd() * 5);                      // 5 thin signal lines
                    var wxx = -S * 1.7 + rnd() * S * 3.4;
                    var wty = (wtr / 4 - 0.5) * S * 1.55 + 0.22 * S * Math.sin(wxx * 2.7 + wtr * 1.7);
                    return [wxx, wty + gauss(0.03 * S), (wtr - 2) * S * 0.11, 0.36 + 0.22 * rnd(), 0.72, (wtr + 0.5) / 5];
                }
                case 'convergence': { // gather inward to a bright form — COMPACT, wide+short, placed
                    // BELOW the Projects card grid (verified: its lit bbox clears every card rect).
                    var ox = 0, oy = -S * 0.9;
                    if (rnd() < 0.6) {                                    // tight bright core (wide-short)
                        return [gauss(S * 0.2) + ox, gauss(S * 0.08) + oy, gauss(S * 0.14), 0.5 + 0.3 * rnd(), 0.85, 0];
                    }
                    var ca = rnd() * TAU, cr = S * (0.28 + 0.42 * rnd());
                    return [cr * Math.cos(ca) + ox, cr * Math.sin(ca) * 0.34 + oy, gauss(S * 0.14), 0.32 + 0.2 * rnd(), 0.5, 0]; // y compressed → clears the card band
                }
                default: return [0, 0, 0, 0.3, 1, 0];
            }
        }

        /* ---- Fill attribute buffers ------------------------------------
           16-attribute GPU limit: 10 pos vec3s would need 10 mrg vec3s too (21 slots).
           Pack each stage's (energy, bright) into ONE float — packed = floor(bright*100) +
           energy — and hold all K in ceil(K/4) vec4 attributes. Aux (wave/stream) is derived
           procedurally in the shader from position + seed, not stored. → 10 pos + 3 eb + seed
           = 14 slots. */
        var EBV = Math.ceil(K / 4);                       // vec4 attributes to hold K packed floats
        var pos = [], eb = [];
        for (var k = 0; k < K; k++) pos.push(new Float32Array(COUNT * 3));
        for (var q = 0; q < EBV; q++) eb.push(new Float32Array(COUNT * 4));
        var seed = new Float32Array(COUNT);
        for (var i = 0; i < COUNT; i++) {
            seed[i] = rnd();
            for (var kk = 0; kk < K; kk++) {
                var v = make(stages[kk], i);
                pos[kk][i * 3] = v[0]; pos[kk][i * 3 + 1] = v[1]; pos[kk][i * 3 + 2] = v[2];
                eb[Math.floor(kk / 4)][i * 4 + (kk % 4)] = Math.floor(Math.min(1, Math.max(0, v[4])) * 100) + Math.min(0.999, Math.max(0, v[3]));
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos[0], 3));
        for (var kA = 1; kA < K; kA++) geo.setAttribute('aP' + kA, new THREE.BufferAttribute(pos[kA], 3));
        for (var kq = 0; kq < EBV; kq++) geo.setAttribute('aEB' + kq, new THREE.BufferAttribute(eb[kq], 4));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

        var attributeBytes = (K * 3 + EBV * 4 + 1) * 4 * COUNT;   // pos + packed eb + seed

        /* ---- Shader: curl flow + attractor blend, 10-way target select -- */
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
            attrDecl, 'attribute float aSeed;',
            'varying float vE; varying float vB; varying float vNear; varying float vInfra;',
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
            '  vInfra=(1.0-clamp(abs(uSceneF-3.0),0.0,1.0));',
            // attraction: 1 at a scene centre, dips between. NATURE (index 1) stays looser.
            '  float fc=min(f,1.0-f); float w=1.0-smoothstep(0.10,0.5,fc);',
            '  float natureW=1.0-clamp(abs(uSceneF-1.0),0.0,1.0);',
            '  float wfW=1.0-clamp(abs(uSceneF-8.0),0.0,1.0);',              // waveforms (stage 09, index 8)
            // travelling WAVE surface for nature + waveforms — the SURFACE moves (per-particle
            // phase from aSeed), not per-particle smear, so lit-body holds.
            '  float waveW=max(natureW,wfW); float waveFq=mix(1.1,2.4,wfW);',
            '  float ph = target.x*waveFq - uTime*0.9 + aSeed*6.2831;',
            '  target.y += uWaveAmp*waveW*sin(ph);',
            '  br *= mix(1.0, 0.6+1.05*sin(ph), waveW);',                   // crests bright (up to 1.65x), troughs dark
            '  float streamW=1.0-clamp(abs(uSceneF-7.0),0.0,1.0);',        // stage 08 stream: directed +x flow pulse
            '  br *= mix(1.0, 0.65+0.55*sin(target.x*1.5 - uTime*1.8), streamW);',
            // curl drift; residual kept tiny at peak so forms are crisp — except nature (揺らぎ).
            '  float resid = mix(uResidual, uResidual+0.03, natureW);',   // waves: undulation from the surface, not per-particle smear (keeps lit-body up)
            '  float spd=0.9+aSeed*0.6;',
            '  float tRate = mix(1.0, 0.5, uCalm);',                        // below-hero: slower ambient motion
            '  vec3 cn=curl(target*uNoiseFreq + vec3(0.0,0.0,uTime*0.15*spd*tRate) + aSeed*7.0);',
            '  float amp=mix(resid,uDisperse,1.0-w);',
            '  vec3 p=target + cn*amp;',
            '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
            '  gl_Position=projectionMatrix*mv;',
            // depth cue: near brighter+bigger, far dimmer+smaller (drives the SPHERE 3D read)
            '  float depth=-mv.z; vNear=clamp((13.0-depth)/7.0,0.0,1.0);',
            '  float orbW=1.0-clamp(abs(uSceneF-5.0),0.0,1.0);',           // orbits (stage 06)
            '  float boost=0.5+en*0.8+vNear*(0.6+orbW*1.35);',            // orbits: near ring points much larger
            '  gl_PointSize=clamp(uSize*boost/max(depth,0.1),0.0,8.0)*uPixelRatio;',
            // orbits carry their 3D read ENTIRELY through the near/far gradient — push it hard
            // (near much brighter, far much dimmer) while overall staying in the calm register.
            '  float nearRamp=mix(0.55+0.45*vNear, 0.1+1.65*vNear, orbW);',
            '  vE=en; vB=br*mix(1.0,0.62,uCalm)*nearRamp;',                // calm below hero; far dimmer
            '}'
        ].join('\n');

        var fragmentShader = [
            'precision highp float;',
            'uniform vec3 uBlueDeep,uTeal,uCyan,uBlue,uViolet,uMagenta,uEmber;',
            'uniform float uAlpha,uExposure,uTime;',
            'varying float vE; varying float vB; varying float vNear; varying float vInfra;',
            'vec3 spectrum(float x){x=clamp(x,0.0,1.0);',
            '  if(x<0.22)return mix(uBlueDeep,uTeal,x/0.22);else if(x<0.40)return mix(uTeal,uCyan,(x-0.22)/0.18);',
            '  else if(x<0.62)return mix(uCyan,uBlue,(x-0.40)/0.22);else if(x<0.80)return mix(uBlue,uViolet,(x-0.62)/0.18);',
            '  else if(x<0.90)return mix(uViolet,uMagenta,(x-0.80)/0.10);return mix(uMagenta,uEmber,(x-0.90)/0.10);}',
            'vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}',
            'void main(){',
            '  vec2 uv=gl_PointCoord-0.5; float d=length(uv); if(d>0.5) discard;',
            '  float inner=mix(0.35,0.05,vNear); float core=smoothstep(0.5,inner,d);',
            '  float hot=smoothstep(0.7,1.0,vE); float halo=smoothstep(0.5,0.0,d)*hot; float aa=max(core,halo*0.5);',
            '  float stream=1.0 + vInfra*0.7*sin(gl_FragCoord.x*0.012 - uTime*2.2 + vE*28.0);',
            '  vec3 col=aces(spectrum(vE)*uExposure);',
            '  gl_FragColor=vec4(col, aa*vB*uAlpha*stream);',
            '}'
        ].join('\n');

        var uniforms = {
            uSceneF: { value: 0 }, uCalm: { value: 0 }, uTime: { value: 0 }, uSize: { value: isMobile ? 18 : 17 },
            uAlpha: { value: 0.5 }, uExposure: { value: 1.08 }, uPixelRatio: { value: DPR },
            uDisperse: { value: isMobile ? 0.9 : 1.15 }, uResidual: { value: 0.022 }, uNoiseFreq: { value: 0.22 }, uWaveAmp: { value: 0.7 },
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

        var ROT = [[0, 0], [0.05, 0.04], [-0.18, 0.1], [0.12, -0.16], [0.0, 0.05], [-0.1, 0.12], [0.06, -0.04], [0.0, 0.08], [0.0, 0.03], [0.0, 0.0]];
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
            var mid = window.scrollY + window.innerHeight / 2;
            var sfT = sceneFor(mid);
            sfEased += (sfT - sfEased) * 0.09;
            // calm register once past the hero (stage index >= HERO_K-1 → ramp)
            var calm = smooth(HERO_K - 1.5, HERO_K - 0.5, sfEased);
            uniforms.uSceneF.value = sfEased; uniforms.uCalm.value = calm; uniforms.uTime.value = clock;
            var rot = rotationFor(Math.min(K - 1, sfEased));
            // faster spin AT the cosmos sphere so near/far parallax is visible (reads as 3D volume)
            var cosW = 1 - Math.min(1, Math.abs(sfEased));
            points.rotation.x = rot[0]; points.rotation.y = rot[1] + clock * (0.02 + 0.055 * cosW);
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
            computeCenters(); var mid = window.scrollY + window.innerHeight / 2; sfEased = sceneFor(mid);
            uniforms.uSceneF.value = sfEased; uniforms.uCalm.value = smooth(HERO_K - 1.5, HERO_K - 0.5, sfEased);
            var rot = rotationFor(Math.min(K - 1, sfEased)); points.rotation.x = rot[0]; points.rotation.y = rot[1];
            updateText(Math.min(HERO_K - 1, sfEased)); renderer.render(scene, camera);
        }

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                DPR = Math.min(window.devicePixelRatio || 1, 1.5); renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight);
                camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); uniforms.uPixelRatio.value = DPR; computeCenters();
                if (!running) renderOnce();
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
            // rotate WITHOUT advancing the curl (frozen uTime) → isolates pure rotation parallax
            spin: function (dy) { points.rotation.y += dy; renderer.render(scene, camera); }
        };
    }
})();

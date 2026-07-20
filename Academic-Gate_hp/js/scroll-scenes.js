/* ============================================================================
   scroll-scenes.js — index.html cosmic-origin → society choreography.

   One THREE.WebGLRenderer + one THREE.Points, built ONCE. The particle set
   morphs through up to six precomputed formations (BEGINNING → MATTER →
   GALAXIES → SOLAR → EARTH → SOCIETY) driven by a single `uProgress` uniform.
   Which formations exist is read from the visible `.scene[data-stage]` elements
   (6 on desktop, 4 on mobile where MATTER/SOLAR are display:none), so text and
   particles always agree. Each formation PEAKS at the `uProgress` where its own
   scene text is centered; scrolling back reverses the morph cleanly.

   Crisp, not mushy: particles ride curves/surfaces (arms, orbit ellipses, a
   lat/long globe, network edges) or sit in tight clusters — never a low-alpha
   volume fill. Sharp sprite, small size, high brightness, depth size-attenuation.
   Bloom is core-only (hot particles), no global glow pass.

   Progressive: Three.js is injected non-blocking and is NOT downloaded at all
   under prefers-reduced-motion. No THREE / no WebGL → canvas dropped, CSS
   ambient glow + star field stand in. Content is never gated behind JS.
   ============================================================================ */
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- IntersectionObserver reveals for the card region (not the hero) --- */
    (function initReveals() {
        var els = document.querySelectorAll('.reveal');
        if (!els.length) return;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        els.forEach(function (el) { io.observe(el); });
    })();

    var canvas = document.getElementById('scene-canvas');
    if (!canvas) return;

    var hero = document.querySelector('.hero');
    var visibleScenes = [];

    /* Reduced motion: skip the Three.js download entirely, drop the canvas, let
       the CSS ambient glow + star field render the static page. */
    if (reduceMotion) {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        return;
    }

    /* ---- Non-blocking Three.js loader (jsdelivr → unpkg fallback) ---------- */
    function loadThree() {
        return new Promise(function (resolve, reject) {
            if (window.THREE) return resolve();
            function attempt(url, next) {
                var s = document.createElement('script');
                s.src = url;
                s.async = true;
                s.onload = function () { window.THREE ? resolve() : (next ? attempt(next, null) : reject()); };
                s.onerror = function () { next ? attempt(next, null) : reject(); };
                document.head.appendChild(s);
            }
            attempt('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
                'https://unpkg.com/three@0.160.0/build/three.min.js');
        });
    }

    function hasWebGL() {
        try {
            var c = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
        } catch (e) { return false; }
    }

    loadThree().then(function () {
        if (!hasWebGL()) { dropCanvas(); return; }
        try { init(); } catch (e) { dropCanvas(); }
    }).catch(dropCanvas);

    function dropCanvas() { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }

    /* ======================================================================
       Scene init
       ====================================================================== */
    function init() {
        var isMobile = window.innerWidth <= 768;
        // Density picked ONCE by device tier ("step down by device, never by frame rate").
        // ?n=NNNN overrides for the count-vs-frame-time sweep.
        var lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
        var urlN = parseInt((location.search.match(/[?&]n=(\d+)/) || [])[1], 10);
        var COUNT = urlN || (isMobile ? 35000 : lowPower ? 45000 : 90000);
        var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

        // Text-bearing scenes (4): BEGINNING, GALAXIES, EARTH, SOCIETY.
        visibleScenes = Array.prototype.filter.call(
            hero.querySelectorAll('.scene[data-stage]'),
            function (s) { return s.offsetParent !== null; });
        var textNames = visibleScenes.map(function (s) { return s.getAttribute('data-stage'); });
        if (visibleScenes.length < 2) { dropCanvas(); return; }

        // Formations: on desktop, MATTER + SOLAR are inserted as text-less
        // transitional forms between the text stages (they still render as the
        // morph passes through them). On mobile they are skipped entirely.
        var stages = [];
        if (isMobile) {
            stages = textNames.slice();
        } else {
            textNames.forEach(function (n) {
                stages.push(n);
                if (n === 'beginning') stages.push('matter');
                if (n === 'galaxies') stages.push('solar');
            });
        }
        var K = stages.length;

        /* ---- Shared precomputed structure ------------------------------- */
        // Seeded PRNG (mulberry32): deterministic layout every load AND well
        // distributed. A plain LCG (a*b+c) overflows JS's 2^53 integer limit and
        // clusters particles — using Math.imul keeps the 32-bit math exact.
        var seedState = 0x51ed270b;
        function rnd() {
            seedState = seedState + 0x6d2b79f5 | 0;
            var t = Math.imul(seedState ^ seedState >>> 15, 1 | seedState);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
        function gauss(s) { return (rnd() + rnd() + rnd() - 1.5) * s; }

        // MATTER: a regular lattice with some sites left EMPTY (structure emerging),
        // each surviving cluster a distinct spectrum colour (never grey).
        var gridPts = [];
        [-2.4, -1.44, -0.48, 0.48, 1.44, 2.4].forEach(function (x) {   // 6 columns
            [-1.35, -0.45, 0.45, 1.35].forEach(function (y) { gridPts.push([x, y, 0]); }); // 4 rows, single plane
        });
        var lattice = gridPts.filter(function (_, i) { return (i * 7 + 3) % 10 < 7; }); // ~17 of 24 sites filled
        var vivid = [0.2, 0.42, 0.3, 0.55, 0.48, 0.25, 0.5, 0.35];  // cool: teal → cyan → blue
        var latticeEnergy = lattice.map(function (_, i) { return vivid[i % vivid.length]; });

        // SOLAR: concentric orbit radii
        var solarR = [0.9, 1.35, 1.85, 2.4, 3.0, 3.6];
        var solarPhase = solarR.map(function () { return rnd() * Math.PI; });

        // EARTH: light direction (terminator). Smaller radius → the 90k points pack
        // denser over the sphere → brighter mid-tone body.
        var earthR = 1.75;
        var lats = []; for (var la = -75; la <= 75; la += 15) lats.push(la * Math.PI / 180);
        var lons = []; for (var lo = 0; lo < 360; lo += 20) lons.push(lo * Math.PI / 180);
        var Lx = 0.78, Ly = 0.33, Lz = 0.53; var Ln = Math.hypot(Lx, Ly, Lz); Lx /= Ln; Ly /= Ln; Lz /= Ln;

        // SOCIETY: node graph in a flattened disc + nearest-neighbour edges
        var NN = isMobile ? 46 : 74;
        var nodes = [];
        for (var n = 0; n < NN; n++) {
            var rr = Math.sqrt(rnd()) * 3.5, aa = rnd() * Math.PI * 2;
            nodes.push([rr * Math.cos(aa), rr * Math.sin(aa) * 0.82, (rnd() - 0.5) * 0.5]);
        }
        var edges = [];
        for (var a = 0; a < NN; a++) {
            var d1 = [1e9, -1], d2 = [1e9, -1], d3 = [1e9, -1];
            for (var b = 0; b < NN; b++) {
                if (b === a) continue;
                var dx = nodes[a][0] - nodes[b][0], dy = nodes[a][1] - nodes[b][1], dz = nodes[a][2] - nodes[b][2];
                var dd = dx * dx + dy * dy + dz * dz;
                if (dd < d1[0]) { d3 = d2; d2 = d1; d1 = [dd, b]; }
                else if (dd < d2[0]) { d3 = d2; d2 = [dd, b]; }
                else if (dd < d3[0]) { d3 = [dd, b]; }
            }
            if (d1[1] >= 0) edges.push([a, d1[1]]);   // 3 nearest neighbours -> denser mesh
            if (d2[1] >= 0) edges.push([a, d2[1]]);
            if (d3[1] >= 0) edges.push([a, d3[1]]);
        }
        // node degree → centrality (nodes[n][3]); high-degree nodes are the bright hubs
        var deg = new Array(NN).fill(0);
        edges.forEach(function (e) { deg[e[0]]++; deg[e[1]]++; });
        var maxDeg = Math.max.apply(null, deg) || 1;
        for (var nd = 0; nd < NN; nd++) nodes[nd][3] = deg[nd] / maxDeg;

        var TAU = Math.PI * 2;
        /* ---- Per-stage generator: DENSE SAMPLED SURFACES. returns [x,y,z,energy,bright]
           Energy is cool-dominant (teal→cyan→blue, 0.15–0.62); only nuclei/star/ring-top
           push to warm (0.9–1.0). See §2.3. --- */
        function make(stage, i) {
            var t, r, ang, x, y, z, u, s, th, ph;
            switch (stage) {
                case 'beginning': // thick torus SHELL (dense tube), one hot point at the top
                    th = rnd() * TAU; ph = rnd() * TAU;
                    var tubeR = 0.28 * Math.sqrt(rnd());               // fill the tube volume
                    var Rr = 2.4 + tubeR * Math.cos(ph);               // smaller — clears the right margin
                    var syb = Math.sin(th);
                    x = Rr * Math.cos(th); y = Rr * syb; z = tubeR * Math.sin(ph);
                    // continuous heat toward the top: teal → cyan → blue → violet → magenta → ember
                    return [x, y, z, 0.15 + Math.pow((syb + 1) * 0.5, 3.0) * 0.85, 1];

                case 'matter': // dense cluster shells on the lattice (cool)
                    var c = lattice[i % lattice.length];
                    u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u);
                    r = 0.2 + gauss(0.02);
                    return [c[0] + r * s * Math.cos(th), c[1] + r * u, c[2] + r * s * Math.sin(th),
                        latticeEnergy[i % lattice.length], 0.8];

                case 'galaxies': // dense arm bands winding CONTINUOUSLY into a hot nucleus
                    if (rnd() < 0.06) {                              // dense, bright, SYMMETRIC nucleus at the centre
                        u = rnd() * 2 - 1; th = rnd() * TAU; var rn = 0.2 * Math.cbrt(rnd()); s = Math.sqrt(1 - u * u);
                        return [rn * s * Math.cos(th), rn * u, rn * s * Math.sin(th), 0.9 + 0.08 * rnd(), 0.85];
                    }
                    t = Math.pow(rnd(), 0.8);                          // inner concentration (gentler → core doesn't over-clip)
                    r = 0.1 + t * 2.8;                                // arms reach the centre (wind into the nucleus)
                    ang = (i % 2) * Math.PI + r * 1.3;               // two arms, PI apart
                    var band = gauss(0.06 + r * 0.085);             // tight near core, wider outer
                    var caA = Math.cos(ang), saA = Math.sin(ang);
                    x = r * caA - band * saA; y = r * saA + band * caA;
                    z = gauss(0.1 * (1 - r / 3.2));
                    // continuous heat with proximity to centre:
                    // teal → cyan → blue → violet → magenta → ember (all seven stops appear along the arm)
                    return [x, y, z, Math.min(0.96, 0.15 + Math.pow(1.0 - r / 3.0, 3.4) * 0.85), 0.72];

                case 'solar': // central star + orbit BANDS (rings with thickness), cool
                    if (rnd() < 0.06) {
                        u = rnd() * 2 - 1; th = rnd() * TAU; r = 0.16 * Math.cbrt(rnd()); s = Math.sqrt(1 - u * u);
                        return [r * s * Math.cos(th), r * u, r * s * Math.sin(th), 0.92, 1];  // warm star
                    }
                    var ri = i % solarR.length; r = solarR[ri] + gauss(0.05); th = rnd() * TAU;
                    return [r * Math.cos(th + solarPhase[ri]), gauss(0.02), r * 0.62 * Math.sin(th + solarPhase[ri]),
                        Math.max(0.25, 0.52 - ri * 0.05), 1];          // cyan inner → blue outer

                case 'earth': // DENSE uniformly sampled sphere SURFACE + terminator
                    // Density is UNIFORM over the whole sphere; the terminator is a
                    // BRIGHTNESS gradient (not missing particles), so the night side reads
                    // as a smooth dim hemisphere, not speckle.
                    u = rnd() * 2 - 1; th = rnd() * TAU; s = Math.sqrt(1 - u * u);
                    var nx = s * Math.cos(th), nyE = u, nz = s * Math.sin(th);   // unit normal
                    var nl = Math.max(0, nx * Lx + nyE * Ly + nz * Lz);         // day/night
                    return [nx * earthR, nyE * earthR, nz * earthR,
                        0.24 + 0.32 * nl,                              // cool: teal dark → cyan lit
                        0.55 + 0.45 * Math.pow(nl, 0.6)];              // brighter body; dark side lifted (no speckle)

                case 'society': // HIERARCHY: bright hub nodes, dim small nodes, dimmer thin edges
                    if (rnd() < 0.34) {                                // node
                        var nn = nodes[i % NN];
                        var hub = nn[3] > 0.6;                          // precomputed centrality
                        var sp = hub ? 0.08 : 0.045;
                        return [nn[0] + gauss(sp), nn[1] + gauss(sp), nn[2] + gauss(sp),
                            hub ? 0.5 : 0.32,                          // hub → bigger point (via energy)
                            hub ? 0.75 : 0.55];                        // brighter than the dim round, but no clip
                    }
                    var ed = edges[i % edges.length], A = nodes[ed[0]], B = nodes[ed[1]]; t = rnd();
                    return [A[0] + (B[0] - A[0]) * t + gauss(0.018),   // thin edge band
                        A[1] + (B[1] - A[1]) * t + gauss(0.018),
                        A[2] + (B[2] - A[2]) * t + gauss(0.018), 0.24, 0.58];  // brighter, still less weight than nodes

                default:
                    return [0, 0, 0, 0.3, 1];
            }
        }

        /* ---- Fill attribute buffers (one position/energy/bright set per stage) */
        // energy+brightness packed into a vec2 per stage (aM) to stay within the
        // 16-attribute GPU limit: position + (K-1) aP + K aM + aSeed.
        var pos = [], mrg = [];
        for (var k = 0; k < K; k++) { pos.push(new Float32Array(COUNT * 3)); mrg.push(new Float32Array(COUNT * 2)); }
        var seed = new Float32Array(COUNT);
        for (var i = 0; i < COUNT; i++) {
            seed[i] = rnd();
            for (var kk = 0; kk < K; kk++) {
                var v = make(stages[kk], i);
                pos[kk][i * 3] = v[0]; pos[kk][i * 3 + 1] = v[1]; pos[kk][i * 3 + 2] = v[2];
                mrg[kk][i * 2] = v[3]; mrg[kk][i * 2 + 1] = v[4];
            }
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos[0], 3)); // stage 0 = position
        for (var kA = 1; kA < K; kA++) geo.setAttribute('aP' + kA, new THREE.BufferAttribute(pos[kA], 3));
        for (var kE = 0; kE < K; kE++) geo.setAttribute('aM' + kE, new THREE.BufferAttribute(mrg[kE], 2));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

        /* ---- Shaders (unrolled morph across K stages) -------------------- */
        var nameOf = function (idx) { return idx === 0 ? 'position' : 'aP' + idx; };
        var morph = '  vec3 pos; float en; float br; float t;\n';
        for (var m = 0; m < K - 1; m++) {
            var head = m === 0 ? '  if' : '  else if';
            var last = m === K - 2;
            morph += (last ? '  else {\n' : head + '(p < uPeaks[' + (m + 1) + ']) {\n');
            morph += '    t = smoothstep(uPeaks[' + m + '], uPeaks[' + (m + 1) + '], p);\n';
            morph += '    pos = mix(' + nameOf(m) + ', ' + nameOf(m + 1) + ', t);\n';
            morph += '    en = mix(aM' + m + '.x, aM' + (m + 1) + '.x, t); br = mix(aM' + m + '.y, aM' + (m + 1) + '.y, t);\n';
            morph += '  }\n';
        }

        var attrDecl = '';
        for (var d1 = 1; d1 < K; d1++) attrDecl += 'attribute vec3 aP' + d1 + ';\n';
        for (var d2 = 0; d2 < K; d2++) attrDecl += 'attribute vec2 aM' + d2 + ';\n';

        var vertexShader =
            'uniform float uProgress, uTime, uSize, uPixelRatio;\n' +
            'uniform float uPeaks[' + K + '];\n' + attrDecl + 'attribute float aSeed;\n' +
            'varying float vE; varying float vB; varying float vNear;\n' +
            'void main(){\n  float p = uProgress;\n' + morph +
            '  pos += 0.013 * vec3(sin(uTime*0.5 + aSeed*6.2831), cos(uTime*0.42 + aSeed*6.2831), sin(uTime*0.33 + aSeed*6.2831));\n' +
            '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);\n' +
            '  gl_Position = projectionMatrix * mv;\n' +
            // Depth of field: 0 = far, 1 = near. Near particles a touch larger + softer.
            '  float depth = -mv.z;\n' +
            '  vNear = clamp((11.0 - depth) / 6.0, 0.0, 1.0);\n' +
            '  float boost = 0.5 + en * 0.8 + vNear * 0.5;\n' +
            // small points so individual dots + dark gaps stay visible (moiré, not a fill)
            '  gl_PointSize = clamp(uSize * boost / max(depth, 0.1), 0.0, 8.0) * uPixelRatio;\n' +
            '  vE = en; vB = br;\n}';

        var fragmentShader = [
            'uniform vec3 uBlueDeep, uTeal, uCyan, uBlue, uViolet, uMagenta, uEmber;',
            'uniform float uAlpha, uExposure;',
            'varying float vE; varying float vB; varying float vNear;',
            // Teal-dominant ramp: cool (teal→cyan→blue) fills 0.0–0.62; warm only above 0.8.
            'vec3 spectrum(float x){ x = clamp(x,0.0,1.0);',
            '  if(x<0.22) return mix(uBlueDeep,uTeal,x/0.22);',
            '  else if(x<0.40) return mix(uTeal,uCyan,(x-0.22)/0.18);',
            '  else if(x<0.62) return mix(uCyan,uBlue,(x-0.40)/0.22);',
            '  else if(x<0.80) return mix(uBlue,uViolet,(x-0.62)/0.18);',
            '  else if(x<0.90) return mix(uViolet,uMagenta,(x-0.80)/0.10);',
            '  return mix(uMagenta,uEmber,(x-0.90)/0.10); }',
            // ACES filmic rolloff — hot cores read hot, not clipped white.
            'vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }',
            'void main(){',
            '  vec2 uv = gl_PointCoord - 0.5;',
            '  float d = length(uv);',
            '  if(d > 0.5) discard;',
            // DoF: far particles crisp (tight inner edge), near particles softer (wide falloff)
            '  float inner = mix(0.35, 0.05, vNear);',
            '  float core = smoothstep(0.5, inner, d);',
            '  float hot = smoothstep(0.7, 1.0, vE);',             // only hot (core) particles bloom
            '  float halo = smoothstep(0.5, 0.0, d) * hot;',
            '  float a = max(core, halo * 0.5);',
            '  vec3 col = aces(spectrum(vE) * uExposure);',
            // LOW per-particle contribution: at 90k, brightness accumulates from many faint
            // points, giving tonal range (dark gaps → bright dense) instead of a clipped fill.
            '  gl_FragColor = vec4(col, a * vB * uAlpha);',
            '}'
        ].join('\n');

        var uniforms = {
            uProgress: { value: 0 }, uTime: { value: 0 }, uSize: { value: isMobile ? 17 : 16 },
            uAlpha: { value: 0.16 }, uExposure: { value: 0.95 },
            uPixelRatio: { value: DPR }, uPeaks: { value: new Array(K).fill(0).map(function (_, ix) { return ix / (K - 1); }) },
            uBlueDeep: { value: new THREE.Color(0x0b3be0) }, uTeal: { value: new THREE.Color(0x2bd9c4) },
            uCyan: { value: new THREE.Color(0x00c2cb) }, uBlue: { value: new THREE.Color(0x3d8bff) },
            uViolet: { value: new THREE.Color(0x7b4dff) }, uMagenta: { value: new THREE.Color(0xff3d8b) },
            uEmber: { value: new THREE.Color(0xff5a3c) }
        };

        var material = new THREE.ShaderMaterial({
            uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader,
            transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
        });

        /* ---- Renderer / scene / camera ---------------------------------- */
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(DPR);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 9);

        var points = new THREE.Points(geo, material);
        points.frustumCulled = false;   // positions expand well beyond stage-0 bounds
        scene.add(points);

        /* ---- Live telemetry (particles · GPU frame budget ms · fps) -------- */
        var gl = renderer.getContext();
        var timerExt = (function () { try { return gl.getExtension('EXT_disjoint_timer_query_webgl2'); } catch (e) { return null; } })();
        var telEl = document.createElement('div');
        telEl.id = 'telemetry';
        telEl.setAttribute('aria-hidden', 'true');
        telEl.innerHTML = '<span><b>' + Math.round(COUNT / 1000) + 'k</b>particles</span>' +
            '<span><b class="t-ms">–</b> frame ms</span><span><b class="t-fps">–</b>fps</span>';
        document.body.appendChild(telEl);
        var tMs = telEl.querySelector('.t-ms'), tFps = telEl.querySelector('.t-fps');
        var gpuQuery = null, gpuMs = 0, fpsAcc = 0, fpsN = 0, telClock = 0;

        function telemetryBeginFrame() {
            if (!timerExt || gpuQuery) return;
            try { gpuQuery = gl.createQuery(); gl.beginQuery(timerExt.TIME_ELAPSED_EXT, gpuQuery); } catch (e) { gpuQuery = null; }
        }
        function telemetryEndFrame(dt) {
            if (timerExt && gpuQuery) { try { gl.endQuery(timerExt.TIME_ELAPSED_EXT); } catch (e) { } }
            if (timerExt && gpuQuery) {
                try {
                    if (gl.getQueryParameter(gpuQuery, gl.QUERY_RESULT_AVAILABLE)) {
                        if (!gl.getParameter(timerExt.GPU_DISJOINT_EXT))
                            gpuMs = gpuMs ? gpuMs * 0.85 + (gl.getQueryParameter(gpuQuery, gl.QUERY_RESULT) / 1e6) * 0.15 : gl.getQueryParameter(gpuQuery, gl.QUERY_RESULT) / 1e6;
                        gl.deleteQuery(gpuQuery); gpuQuery = null;
                    }
                } catch (e) { gpuQuery = null; }
            }
            fpsAcc += dt; fpsN++; telClock += dt;
            if (telClock > 0.5 && fpsAcc > 0) {
                tFps.textContent = Math.round(fpsN / fpsAcc);
                tMs.textContent = (timerExt && gpuMs ? gpuMs : 1000 * fpsAcc / fpsN).toFixed(1);
                fpsAcc = 0; fpsN = 0; telClock = 0;
            }
        }

        /* ---- Rotation keyframes per stage ------------------------------- */
        var ROT = {
            beginning: [0.0, 0.0], matter: [0.1, 0.08], galaxies: [-0.28, 0.12],
            solar: [-0.62, 0.10], earth: [0.16, 0.0], society: [-0.30, 0.0]
        };
        var rotKeys = stages.map(function (s) { return ROT[s] || [0, 0]; });
        var earthIndex = stages.indexOf('earth');
        // Composition.
        //   Desktop: formation offset RIGHT of centre, headings left on the dark left.
        //   Mobile:  single column — text pins in the UPPER portion, and the formation
        //            drops into the LOWER portion, centred and scaled down so the whole
        //            form stays inside the narrow viewport (half-width is only ~2.16
        //            world units at fov 55°/z9, less than a ring's 2.4 radius → it would
        //            otherwise clip at the sides). Scale is applied once below.
        var FORM_OFFSET_X = isMobile ? 0.0 : 2.2;
        var FORM_OFFSET_Y = isMobile ? -2.05 : 0.0;   // dropped a touch further so the form
                                                       // clears the CTA pill in the text column
        var FORM_SCALE = isMobile ? 0.58 : 1.0;
        points.scale.setScalar(FORM_SCALE);

        /* ---- Peaks from visible scene centers --------------------------- */
        var peaks = uniforms.uPeaks.value;
        var textPeaks = [];   // progress at which each TEXT scene is centred (hoisted:
                              // the text opacity keys off the SAME values as the formation
                              // morph, so text and its formation peak together — no desync)
        function computePeaks() {
            var span = hero.offsetHeight - window.innerHeight;
            if (span <= 0) return;
            var heroTopDoc = hero.getBoundingClientRect().top + window.scrollY;
            // progress at which each TEXT scene is centered. The mobile hero adds head/tail
            // spacers (§CSS) so these land near-evenly instead of clamping to 0/1 — that is
            // what lets evenly-spaced scroll offsets each land on a single stage.
            textPeaks = visibleScenes.map(function (s) {
                var r = s.getBoundingClientRect();
                var c = r.top + window.scrollY + r.height / 2;
                return Math.min(1, Math.max(0, (c - heroTopDoc - window.innerHeight / 2) / span));
            });
            var tp = textPeaks;
            // map every formation to a peak: text forms → their scene; MATTER/SOLAR
            // → the midpoint between the text stages they bridge.
            for (var i2 = 0; i2 < K; i2++) {
                var name = stages[i2];
                var ti = textNames.indexOf(name);
                if (ti >= 0) peaks[i2] = tp[ti];
                else if (name === 'matter') peaks[i2] = (tp[0] + tp[1]) / 2;
                else if (name === 'solar') peaks[i2] = (tp[1] + tp[2]) / 2;
                else peaks[i2] = 0.5;
            }
            for (var j = 1; j < K; j++) if (peaks[j] <= peaks[j - 1]) peaks[j] = peaks[j - 1] + 0.001;
        }
        computePeaks();

        // Fractional TEXT-stage index for a scroll progress, interpolated through the true
        // scene centres (textPeaks). At progress = textPeaks[i] this returns exactly i, so
        // stage i is fully lit precisely when formation i peaks.
        function stageIndex(pr) {
            var t = textPeaks;
            if (!t.length) return 0;
            if (pr <= t[0]) return 0;
            for (var k = 0; k < t.length - 1; k++) {
                if (pr < t[k + 1]) {
                    var d = t[k + 1] - t[k];
                    return d > 0 ? k + (pr - t[k]) / d : k;
                }
            }
            return t.length - 1;
        }

        function progress() {
            var rect = hero.getBoundingClientRect();
            var span = rect.height - window.innerHeight;
            if (span <= 0) return 0;
            return Math.min(1, Math.max(0, -rect.top / span));
        }

        function lerp(a, b, t) { return a + (b - a) * t; }
        function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

        function rotationFor(p) {
            var seg = 0;
            while (seg < K - 2 && p >= peaks[seg + 1]) seg++;
            var t = smooth(peaks[seg], peaks[seg + 1], p);
            return [lerp(rotKeys[seg][0], rotKeys[seg + 1][0], t), lerp(rotKeys[seg][1], rotKeys[seg + 1][1], t)];
        }

        /* ---- One-at-a-time text opacity --------------------------------- */
        function updateText() {
            var n = visibleScenes.length;
            var vc = window.innerHeight / 2;
            // The WHOLE block fades as a unit: opacity is set on `.scene__content`, so its
            // eyebrow + heading + body + CTA all composite at one value (no child overrides).
            // Mobile keys that value to a tp-synced fractional stage index so text and its
            // formation peak together; the sharp plateau keeps at most one block readable.
            var span = hero.offsetHeight - window.innerHeight;
            var aF = span > 0 ? stageIndex(Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / span))) : 0;
            for (var i3 = 0; i3 < n; i3++) {
                var content = visibleScenes[i3].querySelector('.scene__content');
                if (!content) continue;
                var op;
                if (isMobile) {
                    // Plateau at 1 for |i-aF| < 0.42 (full stage read), cross-fade in a thin
                    // band to the midpoint (both = 0.5 at |i-aF| = 0.5 → no blank flash); a
                    // block ≥0.58 stages away is exactly 0 — the leaving block vanishes.
                    op = 1 - smooth(0.42, 0.58, Math.abs(i3 - aF));
                } else {
                    // Desktop has horizontal separation (text left, form right); the
                    // block's own centre vs viewport centre gives a long, steady read.
                    var r3 = content.getBoundingClientRect();
                    var c = r3.top + r3.height / 2;
                    op = 1 - smooth(0.5, 0.95, Math.abs(c - vc) / (window.innerHeight * 0.5));
                }
                content.style.opacity = op.toFixed(3);
            }
        }

        /* ---- Render loop ------------------------------------------------ */
        var current = 0, clock = 0, lastT = null, running = false, rafId = null;
        var gateScene = visibleScenes[0];

        function frame(now) {
            rafId = null;
            if (!running) return;
            if (lastT == null) lastT = now;
            var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;

            current += (progress() - current) * 0.09;
            uniforms.uProgress.value = current;
            uniforms.uTime.value = clock;

            var rot = rotationFor(current);
            var earthW = earthIndex >= 0 ? Math.max(0, 1 - Math.abs(current - peaks[earthIndex]) / 0.16) : 0;
            points.rotation.x = rot[0];
            points.rotation.y = rot[1] + clock * (0.03 + 0.14 * earthW); // slow globe spin near EARTH
            // Composition: desktop → formation RIGHT of the left-aligned type; mobile →
            // formation dropped into the lower portion under the upper-column text.
            points.position.x = FORM_OFFSET_X;
            points.position.y = FORM_OFFSET_Y;

            updateText();
            if (gateScene) gateScene.style.setProperty('--scroll-hint', (1 - smooth(0.0, 0.12, current)).toFixed(3));

            telemetryBeginFrame();
            renderer.render(scene, camera);
            telemetryEndFrame(dt);
            rafId = requestAnimationFrame(frame);
        }
        function start() { if (running) return; running = true; lastT = null; rafId = requestAnimationFrame(frame); }
        function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

        function renderOnce() {
            current = progress(); uniforms.uProgress.value = current;
            var rot = rotationFor(current); points.rotation.x = rot[0]; points.rotation.y = rot[1];
            points.position.x = FORM_OFFSET_X; points.position.y = FORM_OFFSET_Y;
            updateText(); renderer.render(scene, camera);
        }

        /* ---- Resize ----------------------------------------------------- */
        var resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                DPR = Math.min(window.devicePixelRatio || 1, 1.5);
                renderer.setPixelRatio(DPR);
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
                uniforms.uPixelRatio.value = DPR;
                computePeaks();
                if (!running) renderOnce();
            }, 200);
        });

        /* ---- First paint + fade-in (§G) --------------------------------- */
        renderOnce();
        canvas.classList.add('is-ready');

        /* ---- Pause + go dormant when the hero leaves the viewport -------- */
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) { canvas.classList.remove('is-dormant'); start(); }
                else { canvas.classList.add('is-dormant'); stop(); }
            }, { threshold: 0 }).observe(hero);
        } else { start(); }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else { var r = hero.getBoundingClientRect(); if (r.bottom > 0 && r.top < window.innerHeight) start(); }
        });
    }
})();

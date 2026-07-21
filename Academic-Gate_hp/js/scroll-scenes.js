/* ============================================================================
   scroll-scenes.js — index.html full-page flow field (Round 12).

   ONE THREE.WebGLRenderer + ONE THREE.Points, built once, that RUNS THE WHOLE
   PAGE (hero → footer). The field is always flowing: a curl-noise velocity field
   in the vertex shader drifts every particle continuously, at every scroll
   position, including at rest. Each scene form is an ATTRACTOR in that flow —
   particles are pulled toward the form, hold it, then are released back into the
   flow as the next attractor takes over. No morph-between-static-shapes.

   Four motifs, physical → human-made, reading as one continuous world:
     1 宇宙 cosmos        — the ring/torus, viewer inside it
     2 自然 nature        — branching, flowing filaments (root / current / nerve)
     3 社会 network       — nodes + edges emerging out of the flow
     4 情報基盤 infra     — a regular lattice with data streaming along its lines
   Below the hero the field settles into a slow, dim drift of the infrastructure
   motif behind the cards and footer.

   Progressive: Three.js is injected non-blocking and NOT downloaded under
   prefers-reduced-motion. No THREE / no WebGL → canvas dropped, CSS ambient glow
   stands in for the whole page. Content is never gated behind JS.
   ============================================================================ */
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- IntersectionObserver reveals for the card region ----------------- */
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

    if (reduceMotion) { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }

    function loadThree() {
        return new Promise(function (resolve, reject) {
            if (window.THREE) return resolve();
            function attempt(url, next) {
                var s = document.createElement('script');
                s.src = url; s.async = true;
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

    /* ====================================================================== */
    function init() {
        var isMobile = window.innerWidth <= 768;
        var lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
        var urlN = parseInt((location.search.match(/[?&]n=(\d+)/) || [])[1], 10);
        // Full-BLEED forms spread over ~2.5× the old area, so the count is raised to keep
        // per-area density near the r22 baseline (200k over full-bleed ≈ 90k over the old
        // ~40% formation). Frame-time curve on M5: 84k→2.5ms · 120k→3.5 · 160k→4.5 · 200k→5.5,
        // all locked 60fps / 0 dropped — huge headroom. Below-hero density trims via draw
        // range. ?n= overrides for the sweep. (Mobile/low-power counts untested on real
        // low-end GPUs — scaled proportionally, tune if a device struggles.)
        var COUNT = urlN || (isMobile ? 70000 : lowPower ? 110000 : 200000);
        var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

        // Four text-bearing scenes = four motifs (cosmos, nature, network, infra).
        visibleScenes = Array.prototype.filter.call(
            hero.querySelectorAll('.scene[data-stage]'),
            function (s) { return s.offsetParent !== null; });
        var stages = visibleScenes.map(function (s) { return s.getAttribute('data-stage'); });
        if (visibleScenes.length < 2) { dropCanvas(); return; }
        var K = stages.length;                 // 4

        /* ---- Seeded PRNG (mulberry32) ---------------------------------- */
        var seedState = 0x51ed270b;
        function rnd() {
            seedState = seedState + 0x6d2b79f5 | 0;
            var t = Math.imul(seedState ^ seedState >>> 15, 1 | seedState);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
        function gauss(s) { return (rnd() + rnd() + rnd() - 1.5) * s; }
        var TAU = Math.PI * 2;

        // Full-bleed scale: forms are large enough that the viewer is INSIDE them.
        var S = isMobile ? 2.05 : 3.5;         // base form radius

        /* ---- NATURE: branching filaments (precomputed segments) --------- */
        var branch = [];   // [x0,y0,z0, x1,y1,z1, depth]
        function grow(x, y, z, dx, dy, dz, len, depth) {
            if (depth > 4 || len < 0.18) return;
            var steps = 6;
            for (var s2 = 0; s2 < steps; s2++) {
                var nx = x + dx * len / steps + gauss(0.04);
                var ny = y + dy * len / steps + gauss(0.04);
                var nz = z + dz * len / steps + gauss(0.04);
                branch.push([x, y, z, nx, ny, nz, depth]);
                x = nx; y = ny; z = nz;
                dx += gauss(0.18); dy += gauss(0.12) + 0.05; dz += gauss(0.18);
                var dn = Math.hypot(dx, dy, dz) || 1; dx /= dn; dy /= dn; dz /= dn;
                if (rnd() < 0.20) grow(x, y, z, dx + gauss(0.6), dy + gauss(0.3), dz + gauss(0.6), len * 0.62, depth + 1);
            }
        }
        for (var bi = 0; bi < 9; bi++) {
            grow((rnd() * 2 - 1) * S * 0.7, -S * 0.85, gauss(S * 0.4),
                gauss(0.35), 1.0, gauss(0.35), S * 0.95, 0);
        }
        var natYmin = -S * 0.9, natYspan = S * 1.9;

        /* ---- NETWORK: nodes + nearest-neighbour edges ------------------- */
        var NN = isMobile ? 46 : 74;
        var nodes = [];
        for (var n = 0; n < NN; n++) {
            var rr = Math.sqrt(rnd()) * S * 1.05, aa = rnd() * TAU;
            nodes.push([rr * Math.cos(aa), rr * Math.sin(aa) * 0.82, (rnd() - 0.5) * S * 0.5]);
        }
        var edges = [];
        for (var a = 0; a < NN; a++) {
            var d1 = [1e9, -1], d2 = [1e9, -1], d3 = [1e9, -1];
            for (var b = 0; b < NN; b++) {
                if (b === a) continue;
                var ex = nodes[a][0] - nodes[b][0], ey = nodes[a][1] - nodes[b][1], ez = nodes[a][2] - nodes[b][2];
                var dd = ex * ex + ey * ey + ez * ez;
                if (dd < d1[0]) { d3 = d2; d2 = d1; d1 = [dd, b]; }
                else if (dd < d2[0]) { d3 = d2; d2 = [dd, b]; }
                else if (dd < d3[0]) { d3 = [dd, b]; }
            }
            if (d1[1] >= 0) edges.push([a, d1[1]]);
            if (d2[1] >= 0) edges.push([a, d2[1]]);
            if (d3[1] >= 0) edges.push([a, d3[1]]);
        }
        var deg = new Array(NN).fill(0);
        edges.forEach(function (e) { deg[e[0]]++; deg[e[1]]++; });
        var maxDeg = Math.max.apply(null, deg) || 1;
        for (var nd = 0; nd < NN; nd++) nodes[nd][3] = deg[nd] / maxDeg;

        /* ---- INFRASTRUCTURE: regular 3D lattice + axis edges ------------ */
        var GX = 5, GY = 4, GZ = 3;
        var gnodes = [], gedges = [];
        var idx = function (i, j, k) { return (i * GY + j) * GZ + k; };
        for (var gi = 0; gi < GX; gi++) for (var gj = 0; gj < GY; gj++) for (var gk = 0; gk < GZ; gk++) {
            gnodes.push([(gi / (GX - 1) - 0.5) * 2 * S, (gj / (GY - 1) - 0.5) * 2 * S * 0.8, (gk / (GZ - 1) - 0.5) * 2 * S * 0.6]);
        }
        for (var i2 = 0; i2 < GX; i2++) for (var j2 = 0; j2 < GY; j2++) for (var k2 = 0; k2 < GZ; k2++) {
            if (i2 < GX - 1) gedges.push([idx(i2, j2, k2), idx(i2 + 1, j2, k2)]);
            if (j2 < GY - 1) gedges.push([idx(i2, j2, k2), idx(i2, j2 + 1, k2)]);
            if (k2 < GZ - 1) gedges.push([idx(i2, j2, k2), idx(i2, j2, k2 + 1)]);
        }

        /* ---- Per-motif attractor target. returns [x,y,z, energy, bright, stream]
           energy: teal-dominant ramp (0.15–0.62 cool; >0.8 warm cores only).
           stream: 1 for infrastructure edge particles (traveling brightness). --- */
        function make(stage, i) {
            var u, th, s, x, y, z, t, ph;
            switch (stage) {
                case 'cosmos': { // large torus ring — viewer inside it
                    th = rnd() * TAU; ph = rnd() * TAU;
                    var tube = 0.54 * Math.sqrt(rnd());   // thicker tube → denser body, brighter ring
                    var Rr = S * 0.98 + tube * Math.cos(ph);
                    var syb = Math.sin(th);
                    return [Rr * Math.cos(th), Rr * syb, tube * Math.sin(ph),
                        0.15 + Math.pow((syb + 1) * 0.5, 3.0) * 0.85, 1, 0];
                }
                case 'nature': { // branching filaments, warm at growth tips (high y)
                    var seg = branch[i % branch.length];
                    t = rnd();
                    x = seg[0] + (seg[3] - seg[0]) * t + gauss(0.03);
                    y = seg[1] + (seg[4] - seg[1]) * t + gauss(0.03);
                    z = seg[2] + (seg[5] - seg[2]) * t + gauss(0.03);
                    var hnorm = Math.min(1, Math.max(0, (y - natYmin) / natYspan)); // 0 root → 1 tip
                    return [x, y, z, 0.2 + hnorm * 0.5, 0.55 + 0.35 * hnorm, 0]; // teal→cyan up the growth
                }
                case 'network': { // nodes (bright hubs) + thin edges
                    if (rnd() < 0.42) {                          // more particles on nodes → nodes read
                        var nn = nodes[i % NN]; var hub = nn[3] > 0.55; var sp = hub ? 0.07 : 0.04;
                        return [nn[0] + gauss(sp), nn[1] + gauss(sp), nn[2] + gauss(sp),
                            hub ? 0.58 : 0.3,                       // clear hierarchy: bright hubs, dim small nodes
                            hub ? 0.95 : 0.5, 0];
                    }
                    var ed = edges[i % edges.length], A = nodes[ed[0]], B = nodes[ed[1]]; t = rnd();
                    return [A[0] + (B[0] - A[0]) * t + gauss(0.015),  // tighter edge → reads as a line, not a cloud
                        A[1] + (B[1] - A[1]) * t + gauss(0.015),
                        A[2] + (B[2] - A[2]) * t + gauss(0.015), 0.24, 0.48, 0];
                }
                case 'infra': { // ordered lattice: nodes + edge points that stream
                    if (rnd() < 0.3) {
                        var gn = gnodes[i % gnodes.length];
                        return [gn[0] + gauss(0.025), gn[1] + gauss(0.025), gn[2] + gauss(0.025), 0.48, 0.9, 0];
                    }
                    var ge = gedges[i % gedges.length], Ga = gnodes[ge[0]], Gb = gnodes[ge[1]]; t = rnd();
                    return [Ga[0] + (Gb[0] - Ga[0]) * t + gauss(0.01),   // tighter edge → denser line, brighter
                        Ga[1] + (Gb[1] - Ga[1]) * t + gauss(0.01),
                        Ga[2] + (Gb[2] - Ga[2]) * t + gauss(0.01), 0.34, 0.75, 1]; // stream flag = 1
                }
                default: return [0, 0, 0, 0.3, 1, 0];
            }
        }

        /* ---- Fill attribute buffers (one target set per motif) ---------- */
        var pos = [], mrg = [];   // mrg = vec3 (energy, bright, stream)
        for (var k = 0; k < K; k++) { pos.push(new Float32Array(COUNT * 3)); mrg.push(new Float32Array(COUNT * 3)); }
        var seed = new Float32Array(COUNT);
        for (var i = 0; i < COUNT; i++) {
            seed[i] = rnd();
            for (var kk = 0; kk < K; kk++) {
                var v = make(stages[kk], i);
                pos[kk][i * 3] = v[0]; pos[kk][i * 3 + 1] = v[1]; pos[kk][i * 3 + 2] = v[2];
                mrg[kk][i * 3] = v[3]; mrg[kk][i * 3 + 1] = v[4]; mrg[kk][i * 3 + 2] = v[5];
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos[0], 3));
        for (var kA = 1; kA < K; kA++) geo.setAttribute('aP' + kA, new THREE.BufferAttribute(pos[kA], 3));
        for (var kE = 0; kE < K; kE++) geo.setAttribute('aM' + kE, new THREE.BufferAttribute(mrg[kE], 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

        /* ---- Shaders: curl-noise flow + attractor blend ----------------- */
        // motif selection by index (K=4, unrolled) + energy/bright/stream.
        var attrDecl = '';
        for (var d1 = 1; d1 < K; d1++) attrDecl += 'attribute vec3 aP' + d1 + ';\n';
        for (var d2 = 0; d2 < K; d2++) attrDecl += 'attribute vec3 aM' + d2 + ';\n';
        var posName = function (idx2) { return idx2 === 0 ? 'position' : 'aP' + idx2; };
        // targetFor(int i) → pos; mrgFor(int i) → vec3
        var pickPos = '  if(idx<=0) return position;\n';
        var pickMrg = '  if(idx<=0) return aM0;\n';
        for (var pk = 1; pk < K; pk++) {
            pickPos += '  ' + (pk === K - 1 ? 'return ' + posName(pk) + ';' : 'if(idx<=' + pk + ') return ' + posName(pk) + ';') + '\n';
            pickMrg += '  ' + (pk === K - 1 ? 'return aM' + pk + ';' : 'if(idx<=' + pk + ') return aM' + pk + ';') + '\n';
        }

        var vertexShader = [
            'precision highp float;',
            'uniform float uSceneF, uCalm, uTime, uSize, uPixelRatio;',
            'uniform float uDisperse, uResidual, uNoiseFreq, uInfra;',
            attrDecl, 'attribute float aSeed;',
            'varying float vE; varying float vB; varying float vNear; varying float vStream;',
            // ---- simplex noise (Ashima / McEwan, 3D) ----
            'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
            'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
            'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
            'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
            'float snoise(vec3 v){',
            '  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);',
            '  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);',
            '  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);',
            '  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;',
            '  i=mod289(i);',
            '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
            '  float ns_=0.142857142857; vec3 ns=ns_*D.wyz-D.xzx;',
            '  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);',
            '  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);',
            '  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);',
            '  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));',
            '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
            '  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);',
            '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
            '  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;',
            '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;',
            '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
            '}',
            'vec3 snoiseVec3(vec3 p){return vec3(snoise(p), snoise(p+17.1), snoise(p-43.7));}',
            // forward-difference curl of a 3-component potential (4 snoiseVec3)
            'vec3 curl(vec3 p){',
            '  const float e=0.6;',
            '  vec3 p0=snoiseVec3(p);',
            '  vec3 px=snoiseVec3(p+vec3(e,0.0,0.0));',
            '  vec3 py=snoiseVec3(p+vec3(0.0,e,0.0));',
            '  vec3 pz=snoiseVec3(p+vec3(0.0,0.0,e));',
            '  float cx=(py.z-p0.z)-(pz.y-p0.y);',
            '  float cy=(pz.x-p0.x)-(px.z-p0.z);',
            '  float cz=(px.y-p0.y)-(py.x-p0.x);',
            '  return vec3(cx,cy,cz)/e;',
            '}',
            'vec3 targetPos(int idx){\n' + pickPos + '}',
            'vec3 targetMrg(int idx){\n' + pickMrg + '}',
            'void main(){',
            '  int iA=int(floor(uSceneF)); int iB=iA+1; if(iB>' + (K - 1) + ') iB=' + (K - 1) + ';',
            '  float f=uSceneF-floor(uSceneF);',
            '  vec3 tA=targetPos(iA), tB=targetPos(iB); vec3 target=mix(tA,tB,f);',
            '  vec3 mA=targetMrg(iA), mB=targetMrg(iB); vec3 mm=mix(mA,mB,f);',
            '  float en=mm.x; float br=mm.y; vStream=mm.z;',
            // attraction: 1 at a scene centre, dips to 0 at the mid-point between scenes
            '  float fc=min(f,1.0-f);',
            '  float w=1.0-smoothstep(0.10,0.5,fc);',
            // curl drift; amplitude large when released (w low), small residual when held.
            // depth/position vary the rate → internal current, not uniform motion.
            '  float spd=0.9+aSeed*0.6;',
            '  vec3 cn=curl(target*uNoiseFreq + vec3(0.0,0.0,uTime*0.15*spd) + aSeed*7.0);',
            '  float amp=mix(uResidual,uDisperse,1.0-w);',
            '  amp=mix(amp, uResidual*0.85, uCalm);',        // below hero: settle (small drift)
            '  vec3 p=target + cn*amp;',
            '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
            '  gl_Position=projectionMatrix*mv;',
            '  float depth=-mv.z; vNear=clamp((13.0-depth)/7.0,0.0,1.0);',
            '  float boost=0.5+en*0.8+vNear*0.5;',
            '  gl_PointSize=clamp(uSize*boost/max(depth,0.1),0.0,8.0)*uPixelRatio;',
            '  vE=en; vB=br*mix(1.0,0.72,uCalm);',           // calmer below hero, but still clearly present
            '}'
        ].join('\n');

        var fragmentShader = [
            'precision highp float;',
            'uniform vec3 uBlueDeep, uTeal, uCyan, uBlue, uViolet, uMagenta, uEmber;',
            'uniform float uAlpha, uExposure, uTime, uInfra;',
            'varying float vE; varying float vB; varying float vNear; varying float vStream;',
            'vec3 spectrum(float x){ x=clamp(x,0.0,1.0);',
            '  if(x<0.22) return mix(uBlueDeep,uTeal,x/0.22);',
            '  else if(x<0.40) return mix(uTeal,uCyan,(x-0.22)/0.18);',
            '  else if(x<0.62) return mix(uCyan,uBlue,(x-0.40)/0.22);',
            '  else if(x<0.80) return mix(uBlue,uViolet,(x-0.62)/0.18);',
            '  else if(x<0.90) return mix(uViolet,uMagenta,(x-0.80)/0.10);',
            '  return mix(uMagenta,uEmber,(x-0.90)/0.10); }',
            'vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }',
            'void main(){',
            '  vec2 uv=gl_PointCoord-0.5; float d=length(uv); if(d>0.5) discard;',
            '  float inner=mix(0.35,0.05,vNear); float core=smoothstep(0.5,inner,d);',
            '  float hot=smoothstep(0.7,1.0,vE); float halo=smoothstep(0.5,0.0,d)*hot;',
            '  float a=max(core,halo*0.5);',
            // infrastructure edge particles: a brightness pulse travels along the flow
            '  float stream=1.0 + vStream*uInfra*0.9*sin(gl_FragCoord.x*0.01 - uTime*2.2 + vE*30.0);',
            '  vec3 col=aces(spectrum(vE)*uExposure);',
            '  gl_FragColor=vec4(col, a*vB*uAlpha*stream);',
            '}'
        ].join('\n');

        var uniforms = {
            uSceneF: { value: 0 }, uCalm: { value: 0 }, uTime: { value: 0 },
            uSize: { value: isMobile ? 18 : 17 }, uAlpha: { value: 0.5 }, uExposure: { value: 1.08 },
            uPixelRatio: { value: DPR },
            uDisperse: { value: isMobile ? 0.9 : 1.15 },   // flow amplitude when released
            uResidual: { value: 0.022 },                    // tiny breathing when a form is HELD:
                                                            // w→1 at peak drives amp→residual so the
                                                            // form is crisp when it is being looked at
            uNoiseFreq: { value: 0.22 }, uInfra: { value: 0 },
            uBlueDeep: { value: new THREE.Color(0x0b3be0) }, uTeal: { value: new THREE.Color(0x2bd9c4) },
            uCyan: { value: new THREE.Color(0x00c2cb) }, uBlue: { value: new THREE.Color(0x3d8bff) },
            uViolet: { value: new THREE.Color(0x7b4dff) }, uMagenta: { value: new THREE.Color(0xff3d8b) },
            uEmber: { value: new THREE.Color(0xff5a3c) }
        };

        var material = new THREE.ShaderMaterial({
            uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader,
            transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
        });

        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(DPR);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
        // Pulled in so the large forms fill the frame (viewer inside), full-bleed.
        camera.position.set(0, 0, isMobile ? 8.5 : 7.0);

        var points = new THREE.Points(geo, material);
        points.frustumCulled = false;
        scene.add(points);

        /* ---- Telemetry -------------------------------------------------- */
        var gl = renderer.getContext();
        var timerExt = (function () { try { return gl.getExtension('EXT_disjoint_timer_query_webgl2'); } catch (e) { return null; } })();
        var telEl = document.createElement('div');
        telEl.id = 'telemetry'; telEl.setAttribute('aria-hidden', 'true');
        telEl.innerHTML = '<span><b>' + Math.round(COUNT / 1000) + 'k</b>particles</span>' +
            '<span><b class="t-ms">–</b> frame ms</span><span><b class="t-fps">–</b>fps</span>';
        document.body.appendChild(telEl);
        var tMs = telEl.querySelector('.t-ms'), tFps = telEl.querySelector('.t-fps');
        var gpuQuery = null, gpuMs = 0, fpsAcc = 0, fpsN = 0, telClock = 0;
        function telBegin() {
            if (!timerExt || gpuQuery) return;
            try { gpuQuery = gl.createQuery(); gl.beginQuery(timerExt.TIME_ELAPSED_EXT, gpuQuery); } catch (e) { gpuQuery = null; }
        }
        function telEnd(dt) {
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

        /* ---- Slow global tumble per motif ------------------------------- */
        var ROT = { cosmos: [0.0, 0.0], nature: [0.06, 0.05], network: [-0.2, 0.1], infra: [0.12, -0.18] };
        var rotKeys = stages.map(function (s) { return ROT[s] || [0, 0]; });

        /* ---- Scene centres (progress) ----------------------------------- */
        var textPeaks = [];
        function computePeaks() {
            var span = hero.offsetHeight - window.innerHeight;
            if (span <= 0) return;
            var heroTopDoc = hero.getBoundingClientRect().top + window.scrollY;
            textPeaks = visibleScenes.map(function (s) {
                var r = s.getBoundingClientRect();
                var c = r.top + window.scrollY + r.height / 2;
                return Math.min(1, Math.max(0, (c - heroTopDoc - window.innerHeight / 2) / span));
            });
        }
        computePeaks();
        function stageIndex(pr) {
            var t = textPeaks; if (!t.length) return 0;
            if (pr <= t[0]) return 0;
            for (var kx = 0; kx < t.length - 1; kx++) {
                if (pr < t[kx + 1]) { var d = t[kx + 1] - t[kx]; return d > 0 ? kx + (pr - t[kx]) / d : kx; }
            }
            return t.length - 1;
        }
        function heroProgress() {
            var rect = hero.getBoundingClientRect();
            var span = rect.height - window.innerHeight;
            if (span <= 0) return 0;
            return Math.min(1, Math.max(0, -rect.top / span));
        }
        function lerp(a, b, t) { return a + (b - a) * t; }
        function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

        function rotationFor(sf) {
            var seg = Math.min(K - 2, Math.floor(sf)); var t = sf - seg;
            return [lerp(rotKeys[seg][0], rotKeys[seg + 1][0], t), lerp(rotKeys[seg][1], rotKeys[seg + 1][1], t)];
        }

        /* ---- Text opacity (whole block; one at a time) ------------------ */
        function updateText(sf) {
            var vc = window.innerHeight / 2;
            for (var i3 = 0; i3 < visibleScenes.length; i3++) {
                var content = visibleScenes[i3].querySelector('.scene__content');
                if (!content) continue;
                var op;
                if (isMobile) {
                    op = 1 - smooth(0.42, 0.58, Math.abs(i3 - sf));
                } else {
                    var r3 = content.getBoundingClientRect();
                    var c = r3.top + r3.height / 2;
                    op = 1 - smooth(0.5, 0.95, Math.abs(c - vc) / (window.innerHeight * 0.5));
                }
                content.style.opacity = op.toFixed(3);
            }
        }

        /* ---- Below-hero calm state -------------------------------------- */
        // 0 in the hero → 1 once the hero has fully scrolled past. Drives density
        // (draw range), brightness, and settles the field to the infrastructure motif.
        function calmFactor() {
            var r = hero.getBoundingClientRect();
            if (r.bottom >= window.innerHeight) return 0;              // still in hero
            var past = (window.innerHeight - r.bottom);
            return Math.min(1, past / (window.innerHeight * 0.9));
        }

        /* ---- Render loop ------------------------------------------------ */
        var sfEased = 0, calmEased = 0, clock = 0, lastT = null, running = false, rafId = null, heroPassed = false;
        var gateScene = visibleScenes[0];

        function frame(now) {
            rafId = null; if (!running) return;
            if (lastT == null) lastT = now;
            var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;

            var hp = heroProgress();
            var sfTarget = stageIndex(hp);
            var calm = calmFactor();
            // below the hero, settle the field toward the infrastructure motif (index K-1)
            var sfWithCalm = lerp(sfTarget, K - 1, calm);
            sfEased += (sfWithCalm - sfEased) * 0.09;
            calmEased += (calm - calmEased) * 0.08;

            uniforms.uSceneF.value = sfEased;
            uniforms.uCalm.value = calmEased;
            uniforms.uTime.value = clock;
            uniforms.uInfra.value = smooth(K - 1.6, K - 1.0, sfEased); // stream only near infra

            // Density: full in hero, modestly reduced below (keeps the field clearly present
            // behind the cards — Part 2 — while trimming a little cost; there is ample headroom).
            var frac = 1 - 0.2 * calmEased;
            geo.setDrawRange(0, Math.floor(COUNT * frac));

            var rot = rotationFor(Math.min(K - 1, sfEased));
            points.rotation.x = rot[0];
            points.rotation.y = rot[1] + clock * 0.02;

            updateText(sfEased);
            if (gateScene) gateScene.style.setProperty('--scroll-hint', (1 - smooth(0.0, 0.12, hp)).toFixed(3));

            // hero-only readouts fade once the hero is gone (bug 3)
            var passed = calm > 0.02;
            if (passed !== heroPassed) { heroPassed = passed; document.body.classList.toggle('hero-passed', passed); }

            telBegin();
            renderer.render(scene, camera);
            telEnd(dt);
            rafId = requestAnimationFrame(frame);
        }
        function start() { if (running) return; running = true; lastT = null; rafId = requestAnimationFrame(frame); }
        function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

        function renderOnce() {
            var hp = heroProgress(); sfEased = stageIndex(hp); calmEased = calmFactor();
            uniforms.uSceneF.value = sfEased; uniforms.uCalm.value = calmEased;
            var rot = rotationFor(Math.min(K - 1, sfEased)); points.rotation.x = rot[0]; points.rotation.y = rot[1];
            updateText(sfEased); renderer.render(scene, camera);
        }

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                DPR = Math.min(window.devicePixelRatio || 1, 1.5);
                renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight);
                camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
                uniforms.uPixelRatio.value = DPR; computePeaks();
                if (!running) renderOnce();
            }, 200);
        });

        renderOnce();
        canvas.classList.add('is-ready');

        // Full-page: the field runs the whole document. Pause ONLY when the tab is
        // hidden (perf), never below the hero — the calm drift continues behind cards.
        start();
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop(); else start();
        });
    }
})();

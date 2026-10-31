/* ============================================================================
   tree-scenes.js — ホームの粒子（DESIGN.md §135 フェーズ2）

   01 種 → 02 根 → 03 学問の樹。粒子は場面ごとに目標の位置を持ち、スクロールに
   合わせて次の目標へ移る。途中は少し渦を巻いてから収束する。

   ★ 形は自分では決めない。js/academic-tree.js が描いた SVG の線（根・幹・枝・小枝）と
   名前の位置（window.__tree）から粒子を撒くので、粒子の枝先と HTML の名前は同じ
   座標から出ている。描き直し（'treelayout'）のたびに撒き直す。
   ★ 座標はページ（文書）の px。各場面の目標は、その場面の箱の左上からの位置で持ち、
   箱の位置（uOff）とスクロール量（uScroll）は毎フレーム uniform で渡す。
   だから名前と一緒にスクロールし、カメラの投影でずれることがない（正投影）。

   動かない環境（動きを減らす設定・WebGL 無し・読み込み失敗）では何もしない。
   そのときは academic-tree.js の静的な SVG がそのまま木になる。
   ============================================================================ */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var seedEl = document.querySelector('.home-seed__glyph');
    var rootsBox = document.querySelector('[data-roots]');
    var treeBox = document.querySelector('[data-tree]');
    if (!seedEl || !rootsBox || !treeBox) return;
    if (!hasWebGL()) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'scene-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var star = document.getElementById('starfield');
    (star ? star.parentNode.insertBefore(canvas, star.nextSibling) : document.body.insertBefore(canvas, document.body.firstChild));

    loadThree().then(init).catch(function () { canvas.remove(); });

    function hasWebGL() {
        try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
        catch (e) { return false; }
    }
    /* Three.js は 0.160.0 に固定（DESIGN.md §11b）。jsdelivr が落ちていれば unpkg。 */
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

    function init() {
        var isMobile = window.innerWidth <= 768;
        var lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
        var urlN = parseInt((location.search.match(/[?&]n=(\d+)/) || [])[1], 10);
        var N = urlN || (isMobile ? 36000 : lowPower ? 50000 : 80000);
        var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

        /* ---- 色。番号は粒子の属性に入れる（0 種の白 / 1 光の青 / 2 幹の青 / 3〜 分類） */
        var CATS = ['formal', 'natural', 'life', 'engineering', 'humanities', 'social', 'arts'];
        var PAL = ['#e8f6ff', '#5fd0ff', '#3d8bff', '#8fb3ff', '#5fd9e6', '#63e0bd', '#a9c6ea', '#b8a4ff', '#d7a8ff', '#ff9ec4'];
        function catIndex(cat) { var i = CATS.indexOf(cat); return i < 0 ? 2 : 3 + i; }

        /* ---- 乱数（毎回同じ撒き方） */
        var st = 0x2f6b1a37;
        function rnd() { st |= 0; st = st + 0x6D2B79F5 | 0; var t = Math.imul(st ^ st >>> 15, 1 | st); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
        function gauss(s) { return (rnd() + rnd() + rnd() - 1.5) * 1.15 * s; }

        /* ---- SVG の線を折れ線にして、長さで重み付けして撒く ---------------- */
        function poly(path, step) {
            var len = path.getTotalLength(), n = Math.max(2, Math.ceil(len / step)), pts = [];
            for (var i = 0; i <= n; i++) { var p = path.getPointAtLength(len * i / n); pts.push(p.x, p.y); }
            return { pts: pts, n: n, len: len };
        }
        function onPoly(pl, t) {
            var f = t * pl.n, i = Math.min(pl.n - 1, Math.floor(f)), u = f - i, k = i * 2;
            var x0 = pl.pts[k], y0 = pl.pts[k + 1], x1 = pl.pts[k + 2], y1 = pl.pts[k + 3];
            var dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1;
            return { x: x0 + dx * u, y: y0 + dy * u, nx: -dy / dl, ny: dx / dl };
        }
        function picker(items, weight) {
            var cdf = [], tot = 0;
            items.forEach(function (it) { tot += weight(it); cdf.push(tot); });
            return function () { var r = rnd() * tot, lo = 0, hi = cdf.length - 1; while (lo < hi) { var m = (lo + hi) >> 1; if (cdf[m] < r) lo = m + 1; else hi = m; } return items[lo]; };
        }

        /* 場面ごとの目標：[x, y, 明るさ, 色番号]（箱の左上からの px） */
        var S0 = new Float32Array(N * 4), S1 = new Float32Array(N * 4), S2 = new Float32Array(N * 4);
        var seedA = new Float32Array(N);
        for (var i = 0; i < N; i++) seedA[i] = rnd();
        function put(A, i, x, y, b, c) { A[i * 4] = x; A[i * 4 + 1] = y; A[i * 4 + 2] = b; A[i * 4 + 3] = c; }
        var pivots = [[0, 0], [0, 0], [0, 0]];
        var dens = {};   // 線 1px あたりの粒子の数（明るさの調整用）

        // 01 種：芯（白）・にじみ（光の青）・周りの淡い塵
        function buildSeed() {
            st = 0x11;
            for (var i = 0; i < N; i++) {
                var r = rnd();
                if (r < 0.07) put(S0, i, gauss(4), gauss(4), 1.0, 0);
                else if (r < 0.30) { var a = rnd() * 6.2832, d = Math.abs(gauss(22)); put(S0, i, Math.cos(a) * d, Math.sin(a) * d, 0.32, 1); }
                else {
                    var a2 = rnd() * 6.2832, rad = 460 * Math.pow(rnd(), 1.9);
                    put(S0, i, Math.cos(a2) * rad * 1.9, Math.sin(a2) * rad * 0.55, 0.03 + 0.09 * (1 - rad / 460), rnd() < 0.5 ? 1 : 2);
                }
            }
            pivots[0] = [0, 0];
        }

        // 02 根：根の線（「学び方」へ伸びる点線は SVG のまま）・種・土の中の塵
        function buildRoots() {
            st = 0x22;
            var W = rootsBox.clientWidth, H = rootsBox.clientHeight;
            var lines = [].map.call(rootsBox.querySelectorAll('.root:not(.root--path)'), function (p) {
                var pl = poly(p, 4); pl.w = parseFloat(p.getAttribute('stroke-width')) || 1; return pl;
            });
            if (!lines.length) return false;
            var pick = picker(lines, function (l) { return l.len * (0.4 + l.w); });
            var seed = { x: W / 2, y: 16 };
            dens.roots = N * 0.50 / lines.reduce(function (s, l) { return s + l.len; }, 0);
            for (var i = 0; i < N; i++) {
                var r = rnd();
                if (r < 0.50) { var l = pick(), q = onPoly(l, rnd()), j = gauss(l.w * 0.9); put(S1, i, q.x + q.nx * j, q.y + q.ny * j, 0.04 + 0.03 * l.w, 1); }
                else if (r < 0.56) put(S1, i, seed.x + gauss(4), seed.y + gauss(4), 1.0, 0);
                else put(S1, i, seed.x + gauss(W * 0.22), seed.y + Math.abs(gauss(H * 0.45)), 0.04, 2);
            }
            pivots[1] = [W / 2, H * 0.4];
            return true;
        }

        // 03 学問の樹：幹・枝・小枝（分類の色）・種・枝先の葉
        var LEVEL_W = [4, 2.4, 1.5, 1, 0.8], LEVEL_B = [0.5, 0.42, 0.34, 0.3, 0.28];
        function buildTree() {
            st = 0x33;
            var L = window.__tree;
            var paths = treeBox.querySelectorAll('.tree__branches .tree-branch');
            if (!L || !paths.length) return false;
            var lines = [].map.call(paths, function (p) {
                var pl = poly(p, 4), m = /tree-branch--(\d)/.exec(p.getAttribute('class')), lv = m ? +m[1] : 3;
                var cm = /--tint-([a-z]+)/.exec(p.getAttribute('style') || '');
                pl.lv = lv; pl.w = LEVEL_W[lv]; pl.b = LEVEL_B[lv]; pl.c = cm ? catIndex(cm[1]) : 2;
                return pl;
            });
            var pick = picker(lines, function (l) { return l.len * (0.5 + l.w * 0.6); });
            dens.tree = N * 0.70 / lines.reduce(function (s, l) { return s + l.len; }, 0);
            var tips = L.nodes.filter(function (n) { return n.kind !== 'cat'; });
            var tip = picker(tips, function () { return 1; });
            for (var i = 0; i < N; i++) {
                var r = rnd();
                if (r < 0.70) { var l = pick(), q = onPoly(l, rnd()), j = gauss(l.w * 0.8); put(S2, i, q.x + q.nx * j, q.y + q.ny * j, l.b, l.c); }
                else if (r < 0.74) put(S2, i, L.seed.x + gauss(4), L.seed.y + gauss(4), 1.0, 0);
                else {
                    // 葉：名前の茎側の端（小枝の先）に寄せる。名前の文字の下には入れない
                    var t = tip(), dir = t.align === 'left' ? 1 : -1;
                    put(S2, i, t.x - dir * (6 + Math.abs(gauss(8))), t.y + gauss(7), 0.16, catIndex(t.cat));
                }
            }
            pivots[2] = [L.fork.x, L.fork.y];
            return true;
        }

        /* ---- Three.js ------------------------------------------------------ */
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        var a0 = new THREE.BufferAttribute(S0, 4), a1 = new THREE.BufferAttribute(S1, 4), a2 = new THREE.BufferAttribute(S2, 4);
        geo.setAttribute('aS0', a0); geo.setAttribute('aS1', a1); geo.setAttribute('aS2', a2);
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seedA, 1));

        var vertexShader = [
            'precision highp float;',
            'attribute vec4 aS0, aS1, aS2; attribute float aSeed;',
            'uniform float uF, uTime, uScroll, uW, uH, uSize, uDPR;',
            'uniform vec2 uOff0, uOff1, uOff2, uPiv0, uPiv1, uPiv2;',
            'uniform vec3 uPointer;',
            'uniform vec3 uPal[10];',
            'varying vec3 vCol; varying float vB;',
            'vec4 stageOf(int k){ if(k==0) return vec4(aS0.xy+uOff0, aS0.zw); if(k==1) return vec4(aS1.xy+uOff1, aS1.zw); return vec4(aS2.xy+uOff2, aS2.zw); }',
            'vec2 pivOf(int k){ if(k==0) return uPiv0+uOff0; if(k==1) return uPiv1+uOff1; return uPiv2+uOff2; }',
            'vec3 palOf(float i){ int k=int(i+0.5); vec3 c=uPal[0];',
            '  for(int j=1;j<10;j++){ if(j==k) c=uPal[j]; } return c; }',
            'void main(){',
            '  float F=clamp(uF,0.0,2.0); int iA=int(floor(F)); if(iA>1) iA=1;',
            '  float f=F-float(iA);',
            '  vec4 A=stageOf(iA), B=stageOf(iA+1);',
            // 種の塵は、種のまわりをゆっくり回る
            '  if(iA==0 && aS0.z<0.2){ vec2 c=uOff0; vec2 d=A.xy-c; float a=uTime*0.025*(0.6+aSeed); A.xy=c+mat2(cos(a),-sin(a),sin(a),cos(a))*d; }',
            // 場面の近くでは形を保ち（0〜0.22 と 0.78〜1）、そのあいだで移る
            '  float te=smoothstep(0.22,0.78,f);',
            '  vec2 p=mix(A.xy,B.xy,te);',
            // 渦：移っている途中だけ、二つの場面の中心のまわりに回し、少しふくらませてから戻す
            '  float sw=sin(3.14159*te);',
            '  vec2 pv=mix(pivOf(iA),pivOf(iA+1),te);',
            '  vec2 d=p-pv; float r=length(d);',
            '  float ang=sw*(1.6+1.4*aSeed)/(1.0+r/420.0);',
            '  d=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*d*(1.0+0.22*sw*(aSeed-0.3));',
            '  p=pv+d;',
            '  p+=sw*26.0*vec2(sin(aSeed*91.0+uTime*0.7),cos(aSeed*53.0+uTime*0.6));',
            // 止まっているときのかすかな揺らぎ
            '  p+=0.7*vec2(sin(uTime*0.9+aSeed*40.0),cos(uTime*0.8+aSeed*70.0));',
            // ポインタ：近くの粒子をゆるく押しのける
            '  vec2 dp=p-uPointer.xy; float g=exp(-dot(dp,dp)/(2.0*85.0*85.0))*uPointer.z;',
            '  p+=normalize(dp+vec2(0.0001))*g*34.0;',
            '  float b=mix(A.z,B.z,te)*(1.0-0.55*sw);',   // 渦の途中は暗く（広がった雲が文字の下に来るため）
            '  vCol=mix(palOf(A.w),palOf(B.w),te); vB=b;',
            '  gl_Position=vec4(p.x/uW*2.0-1.0, 1.0-(p.y-uScroll)/uH*2.0, 0.0, 1.0);',
            '  gl_PointSize=uSize*uDPR*(0.75+0.5*aSeed)*(1.0+0.6*step(0.9,b));',
            '}'
        ].join('\n');
        var fragmentShader = [
            'precision highp float;',
            'varying vec3 vCol; varying float vB;',
            'void main(){ vec2 uv=gl_PointCoord-0.5; float d=length(uv); if(d>0.5) discard;',
            '  float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vCol, min(1.0, vB*a)); }'   // 加算合成（色 × α を足す）
        ].join('\n');

        var pal = PAL.map(function (h) { return new THREE.Color(h); });
        var uniforms = {
            uF: { value: 0 }, uTime: { value: 0 }, uScroll: { value: 0 },
            uW: { value: window.innerWidth }, uH: { value: window.innerHeight },
            uSize: { value: isMobile ? 2.6 : 2.4 }, uDPR: { value: DPR },
            uOff0: { value: new THREE.Vector2() }, uOff1: { value: new THREE.Vector2() }, uOff2: { value: new THREE.Vector2() },
            uPiv0: { value: new THREE.Vector2() }, uPiv1: { value: new THREE.Vector2() }, uPiv2: { value: new THREE.Vector2() },
            uPointer: { value: new THREE.Vector3(-9999, -9999, 0) },
            uPal: { value: pal }
        };
        var material = new THREE.ShaderMaterial({
            uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader,
            transparent: true, depthWrite: false, depthTest: false,
            // 色だけを足し、キャンバスのα は 0 のままにする。α まで足すと、暗い粒子が
            // 重なった所でページの背景（星・青い光）を隠し、周りより暗く見える（§135.4）
            blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
            blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
            blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor
        });
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setClearColor(0x000000, 0);
        var scene = new THREE.Scene(), camera = new THREE.Camera();
        var points = new THREE.Points(geo, material); points.frustumCulled = false; scene.add(points);

        /* ---- 撒き直し（形が描き直されたとき） -------------------------------- */
        var builds = 0, builtW = 0;
        function rebuild() {
            builds++; builtW = treeBox.clientWidth;
            buildSeed();
            var ok = buildRoots() && buildTree();
            a0.needsUpdate = a1.needsUpdate = a2.needsUpdate = true;
            uniforms.uPiv0.value.set(pivots[0][0], pivots[0][1]);
            uniforms.uPiv1.value.set(pivots[1][0], pivots[1][1]);
            uniforms.uPiv2.value.set(pivots[2][0], pivots[2][1]);
            return ok;
        }
        var rebuildTimer = null;
        document.addEventListener('treelayout', function () {
            clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 60);
        });

        /* ---- 箱の位置とスクロール → 場面の番号 ---------------------------------- */
        var centers = [0, 0, 0];
        function readBoxes() {
            var sy = window.scrollY, sx = window.scrollX;
            var g = seedEl.getBoundingClientRect(), r = rootsBox.getBoundingClientRect(), t = treeBox.getBoundingClientRect();
            uniforms.uOff0.value.set(g.left + g.width / 2 + sx, g.top + g.height / 2 + sy);
            uniforms.uOff1.value.set(r.left + sx, r.top + sy);
            uniforms.uOff2.value.set(t.left + sx, t.top + sy);
            centers[0] = g.top + sy;
            centers[1] = r.top + sy + r.height / 2;
            // 縦長の木は中心で揃えると、上の方を読んでいるあいだ形が崩れたままになる。
            // 木の上端が画面の中ほどに来たところを、この場面の中心にする
            centers[2] = t.top + sy + Math.min(t.height, window.innerHeight) * 0.35;
        }
        function sceneFor(mid) {
            if (mid <= centers[0]) return 0;
            for (var k = 0; k < 2; k++) if (mid < centers[k + 1]) return k + (mid - centers[k]) / Math.max(1, centers[k + 1] - centers[k]);
            return 2;
        }

        /* ---- ポインタ（マウスは乗っているあいだ、タッチは触れているあいだ） ---- */
        var ptr = { x: -9999, y: -9999, on: 0, s: 0 };
        window.addEventListener('pointermove', function (e) {
            if (e.pointerType === 'touch' && !e.isPrimary) return;
            ptr.x = e.clientX; ptr.y = e.clientY + window.scrollY;
            if (e.pointerType === 'mouse') ptr.on = 1;
        }, { passive: true });
        window.addEventListener('pointerdown', function (e) { ptr.x = e.clientX; ptr.y = e.clientY + window.scrollY; ptr.on = 1; }, { passive: true });
        ['pointerup', 'pointercancel'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (e.pointerType !== 'mouse') ptr.on = 0; }, { passive: true }); });
        document.documentElement.addEventListener('pointerleave', function () { ptr.on = 0; });

        /* ---- 描く ------------------------------------------------------------ */
        var fEased = 0, clock = 0, lastT = null, running = false, raf = null, fpsN = 0, fpsT = 0, fps = 0;
        function frame(now) {
            raf = null; if (!running) return;
            if (lastT == null) lastT = now;
            var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;
            fpsN++; fpsT += dt; if (fpsT > 1) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
            readBoxes();
            var target = sceneFor(window.scrollY + window.innerHeight / 2);
            fEased += (target - fEased) * Math.min(1, dt * 4.5);
            ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * Math.min(1, dt * 4);
            uniforms.uF.value = fEased; uniforms.uTime.value = clock; uniforms.uScroll.value = window.scrollY;
            uniforms.uPointer.value.set(ptr.x, ptr.y, ptr.s);
            renderer.render(scene, camera);
            raf = requestAnimationFrame(frame);
        }
        function start() { if (running) return; running = true; lastT = null; raf = requestAnimationFrame(frame); }
        function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                DPR = Math.min(window.devicePixelRatio || 1, 1.5);
                renderer.setPixelRatio(DPR); renderer.setSize(window.innerWidth, window.innerHeight);
                uniforms.uW.value = window.innerWidth; uniforms.uH.value = window.innerHeight; uniforms.uDPR.value = DPR;
            }, 120);
        });
        document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

        if (!rebuild()) { canvas.remove(); return; }
        readBoxes(); fEased = sceneFor(window.scrollY + window.innerHeight / 2);
        start();
        // 最初の1枚が描けてから、静的な SVG の線を粒子に譲る（白い間をつくらない）
        requestAnimationFrame(function () {
            canvas.classList.add('is-ready');
            document.documentElement.classList.add('has-particles');
        });

        // 計測・撮影用
        window.__field = {
            count: N, dens: dens,
            builds: function () { return builds; }, builtW: function () { return builtW; },
            // 木の葉（小枝の先）の目標を、ページの座標で返す（名前との位置合わせの確認用）
            tips: function () {
                readBoxes(); var o = uniforms.uOff2.value, L = window.__tree;
                return L.nodes.map(function (n) { return { e: n.e, x: n.x + o.x, y: n.y + o.y, align: n.align }; });
            },
            fps: function () { return fps; },
            sceneF: function () { return fEased; },
            scrollFor: function (f) { readBoxes(); var k = Math.min(1, Math.floor(f)), u = f - k; return centers[k] + (centers[k + 1] - centers[k]) * u - window.innerHeight / 2; },
            pause: stop, resume: start
        };
    }
})();

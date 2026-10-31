/* ============================================================================
   tree-scenes.js — ホームの粒子（DESIGN.md §135 フェーズ2）

   01 種 → 02 根 → 03 学問の樹 → 04 私の枝 → 05 実り → 06 一歩。粒子は場面ごとに
   目標の位置を持ち、スクロールに合わせて次の目標へ移る。途中は少し渦を巻いてから収束する。

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
    var branchBox = document.querySelector('[data-branch]');
    var fruitsBox = document.querySelector('[data-fruits]');
    var stepBox = document.getElementById('step');
    var stepInner = stepBox && stepBox.querySelector('.home-step__inner');
    if (!seedEl || !rootsBox || !treeBox || !branchBox || !fruitsBox || !stepBox || !stepInner) return;
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

        /* ---- 色。番号は粒子の属性に入れる（0 種の白 / 1 光の青 / 2 幹の青 / 3〜9 分類 / 10〜13 実） */
        var CATS = ['formal', 'natural', 'life', 'engineering', 'humanities', 'social', 'arts'];
        var PAL = ['#e8f6ff', '#5fd0ff', '#3d8bff', '#8fb3ff', '#5fd9e6', '#63e0bd', '#a9c6ea', '#b8a4ff', '#d7a8ff', '#ff9ec4',
            '#5fd0ff', '#8fb3ff', '#ff9ec4', '#63e0bd'];   // 実の色は CSS の --fruit-0〜3 と同じ
        var NP = PAL.length;
        var kN = 80000 / N;   // 粒子数が少ない画面では、1粒を明るくして見た目の濃さを揃える
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
        var S3 = new Float32Array(N * 4), S4 = new Float32Array(N * 4), S5 = new Float32Array(N * 4);
        var seedA = new Float32Array(N);
        for (var i = 0; i < N; i++) seedA[i] = rnd();
        function put(A, i, x, y, b, c) { A[i * 4] = x; A[i * 4 + 1] = y; A[i * 4 + 2] = b; A[i * 4 + 3] = c; }
        var pivots = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
        function total(a) { return a.reduce(function (s, l) { return s + l.len; }, 0); }
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

        // 04 私の枝：小さな木（academic-tree.js が縮めて描いたもの）。物理学の枝は明るく、
        // ほかは淡く。物理学から「初期宇宙理論」へ伸びる線と、その先の空へ散る光
        function buildBranch() {
            st = 0x44;
            var B = branchBox.__branch;
            if (!B) return false;
            function lines(sel, scaled) {
                return [].map.call(branchBox.querySelectorAll(sel), function (p) {
                    var pl = poly(p, scaled ? 4 / B.s : 4);
                    if (scaled) { for (var k = 0; k < pl.pts.length; k += 2) { pl.pts[k] = B.tx + pl.pts[k] * B.s; pl.pts[k + 1] = B.ty + pl.pts[k + 1] * B.s; } pl.len *= B.s; }
                    var cm = /--tint-([a-z]+)/.exec(p.getAttribute('style') || '');
                    pl.c = cm ? catIndex(cm[1]) : 2;
                    return pl;
                });
            }
            var mine = lines('.mini-branch.is-mine', true), rest = lines('.mini-branch:not(.is-mine)', true), ext = lines('.branch-ext', false)[0];
            if (!mine.length || !ext) return false;
            // 明るさは「線 1px あたりの光の量」で揃える（粒子の数と線の長さから逆算）
            var bM = Math.min(0.9, 3.6 * total(mine) / (N * 0.34)), bE = Math.min(0.9, 4.2 * ext.len / (N * 0.14)), bR = Math.min(0.5, 0.45 * total(rest) / (N * 0.30));
            var pm = picker(mine, function (l) { return l.len; }), pr = picker(rest, function (l) { return l.len; });
            for (var i = 0; i < N; i++) {
                var r = rnd(), l, q, j;
                if (r < 0.34) { l = pm(); q = onPoly(l, rnd()); j = gauss(1.2); put(S3, i, q.x + q.nx * j, q.y + q.ny * j, bM, l.c === 2 ? 2 : catIndex('natural')); }
                else if (r < 0.48) { q = onPoly(ext, rnd()); j = gauss(1.4); put(S3, i, q.x + q.nx * j, q.y + q.ny * j, bE, 1); }
                else if (r < 0.56) put(S3, i, B.T.x + gauss(26), B.T.y - Math.abs(gauss(220)), 0.04 + 0.12 * rnd() * Math.sqrt(kN), rnd() < 0.5 ? 0 : 1);
                else if (r < 0.86) { l = pr(); q = onPoly(l, rnd()); j = gauss(1); put(S3, i, q.x + q.nx * j, q.y + q.ny * j, bR, l.c); }
                else put(S3, i, B.P.x, B.P.y, 0, 0);
            }
            pivots[3] = [B.P.x, B.P.y];
            return true;
        }

        // 05 実り：カードの上の枝（淡い青）と、4つの実（カードの点と同じ色）
        function buildFruits() {
            st = 0x55;
            var fs = [].map.call(fruitsBox.querySelectorAll('.fruit'), function (c) { return { x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), i: +c.getAttribute('data-i') }; });
            var bough = [].map.call(fruitsBox.querySelectorAll('.fruit-bough, .fruit-stem'), function (p) { return poly(p, 4); });
            if (!fs.length || !bough.length) return false;
            var bB = Math.min(0.6, 0.55 * total(bough) / (N * 0.22)), pb = picker(bough, function (l) { return l.len; });
            var top = Math.min.apply(null, fs.map(function (f) { return f.y; }));
            for (var i = 0; i < N; i++) {
                var r = rnd(), f = fs[Math.floor(rnd() * fs.length)];
                if (r < 0.22) { var l = pb(), q = onPoly(l, rnd()), j = gauss(0.9); put(S4, i, q.x + q.nx * j, q.y + q.ny * j, bB, 2); }
                else if (r < 0.60) put(S4, i, f.x + gauss(5.5), f.y + gauss(5.5), 0.03 * kN, 10 + f.i);
                else if (r < 0.84) put(S4, i, f.x + gauss(20), f.y + gauss(20), 0.016 * kN, 10 + f.i);
                else put(S4, i, f.x, f.y, 0, 10 + f.i);
            }
            pivots[4] = [fruitsBox.clientWidth / 2, top];
            return true;
        }

        // 06 一歩：葉。場面の下の方から舞い上がり、明るさを落として星空へ溶ける（動きはシェーダ）
        function buildStep() {
            st = 0x66;
            var W = stepBox.clientWidth, H = stepBox.clientHeight;
            for (var i = 0; i < N; i++) {
                if (rnd() < 0.3) put(S5, i, W * (0.04 + 0.92 * rnd()), H * (0.35 + 0.65 * rnd()), 0.5 * Math.sqrt(kN), 3 + Math.floor(rnd() * 7));
                else put(S5, i, W / 2, H, 0, 1);
            }
            pivots[5] = [W / 2, H * 0.55];
            return true;
        }

        /* ---- Three.js ------------------------------------------------------ */
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        var attrs = [S0, S1, S2, S3, S4, S5].map(function (A, k) { var a = new THREE.BufferAttribute(A, 4); geo.setAttribute('aS' + k, a); return a; });
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seedA, 1));

        var vertexShader = [
            'precision highp float;',
            'attribute vec4 aS0, aS1, aS2, aS3, aS4, aS5; attribute float aSeed;',
            'uniform float uF, uTime, uScroll, uW, uH, uSize, uDPR, uHot, uRise;',
            'uniform vec2 uOff[6]; uniform vec2 uPiv[6];',
            'uniform vec3 uPointer;',
            'uniform vec4 uQuiet;',   // 06 の文字の箱（ページの座標 x0,y0,x1,y1）
            'uniform vec3 uPal[' + NP + '];',
            'varying vec3 vCol; varying float vB;',
            // 06 の葉：下から舞い上がって消える（0→1 を繰り返す）
            'float riseP(){ return fract(uTime*0.03*(0.5+aSeed)+aSeed*13.7); }',
            'vec4 stageOf(int k){',
            '  if(k==0) return vec4(aS0.xy+uOff[0], aS0.zw); if(k==1) return vec4(aS1.xy+uOff[1], aS1.zw);',
            '  if(k==2) return vec4(aS2.xy+uOff[2], aS2.zw); if(k==3) return vec4(aS3.xy+uOff[3], aS3.zw);',
            '  if(k==4) return vec4(aS4.xy+uOff[4], aS4.zw);',
            '  float pr=riseP(); vec2 q=aS5.xy+uOff[5]; q.y-=pr*uRise; q.x+=sin(uTime*0.5+aSeed*31.0)*22.0*pr;',
            '  return vec4(q, aS5.z*smoothstep(0.0,0.08,pr)*pow(1.0-pr,1.3), aS5.w); }',
            'vec2 pivOf(int k){ return uPiv[k]+uOff[k]; }',
            'vec3 palOf(float i){ int k=int(i+0.5); vec3 c=uPal[0];',
            '  for(int j=1;j<' + NP + ';j++){ if(j==k) c=uPal[j]; } return c; }',
            'void main(){',
            '  float F=clamp(uF,0.0,5.0); int iA=int(floor(F)); if(iA>4) iA=4;',
            '  float f=F-float(iA);',
            '  vec4 A=stageOf(iA), B=stageOf(iA+1);',
            // 種の塵は、種のまわりをゆっくり回る
            '  if(iA==0 && aS0.z<0.2){ vec2 c=uOff[0]; vec2 d=A.xy-c; float a=uTime*0.025*(0.6+aSeed); A.xy=c+mat2(cos(a),-sin(a),sin(a),cos(a))*d; }',
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
            // 05：カードに触れているあいだ、その実を明るく
            '  float hot=max(step(abs(A.w-uHot),0.1)*(1.0-te), step(abs(B.w-uHot),0.1)*te); b*=1.0+1.8*hot;',
            '  vCol=mix(palOf(A.w),palOf(B.w),te);',
            // 06：舞い上がるほど白く（星の色に近づける）
            '  if(iA==4) vCol=mix(vCol, vec3(0.92,0.96,1.0), te*riseP());',
            // 06：葉が文字の箱の後ろを通るあいだは暗く（ふちは 48px かけてなだらかに）
            '  if(iA==4){ vec2 lo=uQuiet.xy-p, hi=p-uQuiet.zw; float out_=max(max(lo.x,hi.x),max(lo.y,hi.y));',
            '    b*=mix(1.0, 0.12, te*(1.0-smoothstep(0.0,48.0,out_))); }',
            '  vB=b;',
            '  gl_Position=vec4(p.x/uW*2.0-1.0, 1.0-(p.y-uScroll)/uH*2.0, 0.0, 1.0);',
            '  gl_PointSize=uSize*uDPR*(0.75+0.5*aSeed)*(1.0+0.6*step(0.9,b));',
            '}'
        ].join('\n');
        var fragmentShader = [
            'precision highp float;',
            'varying vec3 vCol; varying float vB;',
            'void main(){ vec2 uv=gl_PointCoord-0.5; float d=length(uv); if(d>0.5) discard;',
            '  float k=min(1.0, vB*smoothstep(0.5,0.0,d)); vec3 c=vCol*k;',
            // 乗算済みの色（c）と、α＝いちばん明るい色の成分。色が α を超えない正しい乗算済みの画素にする
            '  gl_FragColor=vec4(c, max(c.r,max(c.g,c.b))); }'
        ].join('\n');

        var pal = PAL.map(function (h) { return new THREE.Color(h); });
        var uniforms = {
            uF: { value: 0 }, uTime: { value: 0 }, uScroll: { value: 0 },
            uW: { value: window.innerWidth }, uH: { value: window.innerHeight },
            uSize: { value: isMobile ? 2.6 : 2.4 }, uDPR: { value: DPR },
            uOff: { value: [0, 1, 2, 3, 4, 5].map(function () { return new THREE.Vector2(); }) },
            uPiv: { value: [0, 1, 2, 3, 4, 5].map(function () { return new THREE.Vector2(); }) },
            uHot: { value: -1 }, uRise: { value: window.innerHeight * 1.1 },
            uQuiet: { value: new THREE.Vector4(0, 0, 0, 0) },
            uPointer: { value: new THREE.Vector3(-9999, -9999, 0) },
            uPal: { value: pal }
        };
        var material = new THREE.ShaderMaterial({
            uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader,
            transparent: true, depthWrite: false, depthTest: false,
            // 乗算済みの色をそのまま足す（色も α も One×One）。α は足した光のいちばん明るい成分なので、
            // ページの背景は「足した光の分だけ」しか隠れず、粒子の下が周りより暗くなることはない。
            // ★ α を 0 のままにして色だけ足すと（§135.4 の最初の直し方）、headless の撮影では見えるが、
            // 実際の画面（macOS の合成）では α 0 の画素が透明として捨てられ、粒子がまったく出なかった（§135.6）
            blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
            blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor
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
            var ok = buildRoots() && buildTree() && buildBranch() && buildFruits() && buildStep();
            attrs.forEach(function (a) { a.needsUpdate = true; });
            pivots.forEach(function (p, k) { uniforms.uPiv.value[k].set(p[0], p[1]); });
            return ok;
        }
        var rebuildTimer = null;
        document.addEventListener('treelayout', function () {
            clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 60);
        });

        /* ---- 箱の位置とスクロール → 場面の番号 ---------------------------------- */
        var centers = [0, 0, 0, 0, 0, 0], K = 6;
        function readBoxes() {
            var sy = window.scrollY, sx = window.scrollX, o = uniforms.uOff.value, H = window.innerHeight;
            var g = seedEl.getBoundingClientRect();
            o[0].set(g.left + g.width / 2 + sx, g.top + g.height / 2 + sy);
            centers[0] = g.top + sy;
            [rootsBox, treeBox, branchBox, fruitsBox, stepBox].forEach(function (b, k) {
                var r = b.getBoundingClientRect();
                o[k + 1].set(r.left + sx, r.top + sy);
                centers[k + 1] = r.top + sy + r.height / 2;
            });
            // 縦長の木は中心で揃えると、上の方を読んでいるあいだ形が崩れたままになる。
            // 木の上端が画面の中ほどに来たところを、この場面の中心にする
            var qi = stepInner.getBoundingClientRect();
            uniforms.uQuiet.value.set(qi.left + sx, qi.top + sy, qi.right + sx, qi.bottom + sy);
            var t = treeBox.getBoundingClientRect();
            centers[2] = t.top + sy + Math.min(t.height, H) * 0.35;
            // 06 はページの最後。いちばん下まで送っても中心に届かないときは、届く所まで上げる
            var maxMid = document.documentElement.scrollHeight - H + H / 2;
            centers[5] = Math.min(centers[5], maxMid - 1);
            for (var k = 1; k < K; k++) centers[k] = Math.max(centers[k], centers[k - 1] + 1);
        }
        function sceneFor(mid) {
            if (mid <= centers[0]) return 0;
            for (var k = 0; k < K - 1; k++) if (mid < centers[k + 1]) return k + (mid - centers[k]) / Math.max(1, centers[k + 1] - centers[k]);
            return K - 1;
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
            uniforms.uHot.value = fruitsBox.dataset.hot ? 10 + (+fruitsBox.dataset.hot) : -1;
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
                uniforms.uRise.value = window.innerHeight * 1.1;
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
                readBoxes(); var o = uniforms.uOff.value[2], L = window.__tree;
                return L.nodes.map(function (n) { return { e: n.e, x: n.x + o.x, y: n.y + o.y, align: n.align }; });
            },
            fps: function () { return fps; },
            sceneF: function () { return fEased; },
            scrollFor: function (f) { readBoxes(); var k = Math.min(K - 2, Math.floor(f)), u = f - k; return centers[k] + (centers[k + 1] - centers[k]) * u - window.innerHeight / 2; },
            pause: stop, resume: start
        };
    }
})();

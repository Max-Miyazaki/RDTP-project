// ページの通し確認：コンソールのエラー・404・横スクロール（DESIGN.md §116）
//   使い方（リポジトリ直下で python3 -m http.server 8795 を立ててから）：
//     NODE_PATH=<puppeteer-core のある node_modules> node Academic-Gate_hp/tools/check-pages.js [base]
//   base の既定は http://localhost:8795/Academic-Gate_hp/html/（公開側を見るときは https://max-phy.jp/Academic-Gate_hp/html/）
//   3つ目の引数に正規表現を渡すと、そのページだけを見る（例：'^memoryverse_3-'）。省略すると全ページ
//   結果：幅 1440・390 × ページで、エラー・404（400以上）・「実際に横へ送れる」ページを1行ずつ。最後に件数
//
// ★ 横スクロールは「実際に横へ送れるか」で判定する。scrollWidth（はみ出しの数値）では判定しない。
//   index.html は 390px で scrollWidth が 412px（見出しの下地の疑似要素が右へ 22px はみ出す）が、body の
//   overflow-x:hidden が画面に効いていて、読者は横に送れない。scrollWidth で判定すると、読者に影響のない
//   はみ出しを「横スクロールあり」と誤報する。はみ出しの数値は参考として出すだけにする。
//
// ★ 3章の地域の記事（memoryverse_3-*.html）は、DESIGN.md §100.0 の一覧のうち機械で確かめられる3つも見る（読み落としても止まるように）：
//   ① 拡大図（層2）が地図より前にあるか（§106）　② 単位の名前のリンクが見出しの数と同じだけあり、国のページを指すか（§118）
//   ③ 横に送れる図の上に「横に送ると続きが見られます →」が出ているか（§115）
const p = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const B = process.argv[2] || 'http://localhost:8795/Academic-Gate_hp/html/';
const COUNTRIES = ['jpn', 'tcd', 'fra', 'bel', 'nld', 'lux', 'mco', 'che', 'lie', 'deu', 'aut',
  'and', 'ita', 'smr', 'vat', 'mlt', 'svn', 'hrv', 'bih', 'mne', 'alb', 'srb', 'kos', 'mkd', 'grc', 'prt', 'gib', 'esp',
  'dnk', 'nor', 'swe', 'ald', 'ltu', 'lva', 'est', 'fin', 'isl', 'irl', 'fro', 'imn', 'ggy', 'gbr', 'jey'];
const PAGES = ['index.html', 'study.html', 'memoryverse.html',
  'memoryverse_1-1.html', 'memoryverse_1-2.html', 'memoryverse_1-3.html', 'memoryverse_1-4.html', 'memoryverse_1-5.html',
  'memoryverse_2-1.html', 'memoryverse_2-2.html', 'memoryverse_2-3.html', 'memoryverse_3-1.html', 'memoryverse_3-2.html', 'memoryverse_3-3.html',
  ...COUNTRIES.map(c => 'country/' + c + '.html')];

// 実際に横へ送れるか：本物の操作（狭い画面はタッチ、広い画面はマウス）で右へ送り、ずれた量を見る。
// ★ scrollX だけを見てはいけない。スマホ（isMobile）では、はみ出しがあるとページの枠（layout viewport）が広がり、
//   scrollX は 0 のままでも、見えている範囲（visual viewport）が横にずれる（index.html で 23px。visualViewport.pageLeft）。
//   window.scrollTo や、押す・動かす・離すに分けた指の操作では、このずれは起きない（DESIGN.md §116）
// 3章の地域のカードの確かめ（DESIGN.md §100.0）。見つけた食い違いを文字列の配列で返す
async function regionChecks(pg) {
  return pg.evaluate(countries => {
    const out = [];
    document.querySelectorAll('.cc-card[data-cc^="r3-"]').forEach(card => {
      const cc = card.dataset.cc;
      // ① 拡大図（.cc-scroll.L2）は、地図（L2 でない .cc-scroll）より前（§106）
      const scs = [...card.querySelectorAll('.cc-maps > .cc-scroll')];
      const iL2 = scs.findIndex(x => x.classList.contains('L2')), iMap = scs.findIndex(x => !x.classList.contains('L2'));
      if (iL2 >= 0 && iMap >= 0 && iL2 > iMap) out.push(`${cc}：拡大図が地図の下にある（§106）`);
      // ② 地図の単位の名前のリンク（§118）：見出し「〇〇の N か国／単位」の N と、リンク先の数が同じ。リンク先は国のページ
      scs.filter(x => !x.classList.contains('L2')).forEach(sc => {
        const svg = sc.querySelector('svg');
        if (!svg) { out.push(`${cc}：地図が読み込まれていない`); return; }
        const m = (svg.getAttribute('aria-label') || '').match(/の(\d+)(か国|単位)/);
        const hrefs = [...new Set([...svg.querySelectorAll('a.cc-cty')].map(a => a.getAttribute('href')))];
        if (!m) out.push(`${cc}：見出しに数が無い`);
        else if (hrefs.length !== +m[1]) out.push(`${cc}：単位の名前のリンクが ${hrefs.length}（見出しは ${m[1]}）`);
        hrefs.filter(h => !countries.includes((h.match(/^country\/(\w+)\.html$/) || [])[1])).forEach(h => out.push(`${cc}：リンク先が国のページでない ${h}`));
      });
      // 拡大図の枠（黄色の点線）ごとに、名前のリンクが1つ（§118）
      scs.filter(x => x.classList.contains('L2')).forEach(sc => {
        const svg = sc.querySelector('svg'); if (!svg) { out.push(`${cc}：拡大図が読み込まれていない`); return; }
        const frames = svg.querySelectorAll('rect[stroke-dasharray]').length;
        const hrefs = new Set([...svg.querySelectorAll('a.cc-cty')].map(a => a.getAttribute('href'))).size;
        if (hrefs !== frames) out.push(`${cc}：拡大図の名前のリンクが ${hrefs}（枠は ${frames}）`);
      });
      // ③ 横に送れる図には、すぐ上に「横に送ると続きが見られます →」（§115）
      scs.forEach(sc => {
        if (sc.offsetParent === null || sc.scrollWidth - sc.clientWidth <= 1) return;
        const h = sc.previousElementSibling;
        if (!h || !h.classList.contains('cc-scroll-hint') || h.hidden) out.push(`${cc}：横に送れる図に「横に送ると続きが見られます」が無い`);
      });
    });
    return out;
  }, COUNTRIES);
}

async function horizontalScroll(pg, W) {
  const cdp = await pg.target().createCDPSession();
  const y0 = await pg.evaluate(() => window.scrollY);
  await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(W * 0.7), y: 400, xDistance: -300, yDistance: 0, speed: 1200,
    gestureSourceType: W < 500 ? 'touch' : 'mouse' });
  await sleep(300);
  const r = await pg.evaluate(() => ({ moved: Math.round(Math.max(window.scrollX, document.scrollingElement.scrollLeft, window.visualViewport ? window.visualViewport.pageLeft : 0)),
    overflowPx: document.scrollingElement.scrollWidth - document.documentElement.clientWidth }));
  await pg.evaluate(y => window.scrollTo(0, y), y0);
  await cdp.detach();
  return r;
}

(async () => {
  const br = await p.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const bad = [], note = [];
  let n = 0;
  for (const W of [1440, 390]) {
    for (const f of PAGES.filter(x => !process.argv[3] || new RegExp(process.argv[3]).test(x))) {
      n++;
      const pg = await br.newPage();
      await pg.setViewport({ width: W, height: 900, isMobile: W < 500, hasTouch: W < 500 });
      pg.on('pageerror', e => bad.push(`${W} ${f} ${e.message}`));
      pg.on('console', m => { if (m.type() === 'error') bad.push(`${W} ${f} ${m.text()}`); });
      pg.on('response', r => { if (r.status() >= 400) bad.push(`${W} ${f} ${r.status()} ${r.url()}`); });
      await pg.goto(B + f, { waitUntil: 'networkidle0' });
      for (let y = 0; y < 60000; y += 900) { await pg.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await sleep(10); }
      await sleep(600);
      if (/^memoryverse_3-/.test(f)) (await regionChecks(pg)).forEach(x => bad.push(`${W} ${f} ${x}`));
      const h = await horizontalScroll(pg, W);
      if (h.moved > 0) bad.push(`${W} ${f} 横に送れる ${h.moved}px`);
      else if (h.overflowPx > 0) note.push(`${W} ${f} はみ出しの数値 ${h.overflowPx}px（横には送れない）`);
      await pg.close();
    }
  }
  console.log(`pages ${n}  エラー・404・横に送れる・3章の確かめ：${bad.length}件`);
  bad.forEach(b => console.log('  ✗ ' + b));
  if (note.length) { console.log(`参考（送れないはみ出し）：${note.length}件`); note.forEach(x => console.log('  ・' + x)); }
  await br.close();
  process.exit(bad.length ? 1 : 0);
})();

// ページの通し確認：コンソールのエラー・404・横スクロール（DESIGN.md §116）
//   使い方（リポジトリ直下で python3 -m http.server 8795 を立ててから）：
//     NODE_PATH=<puppeteer-core のある node_modules> node Academic-Gate_hp/tools/check-pages.js [base]
//   base の既定は http://localhost:8795/Academic-Gate_hp/html/（公開側を見るときは https://max-phy.jp/Academic-Gate_hp/html/）
//   結果：幅 1440・390 × ページで、エラー・404（400以上）・「実際に横へ送れる」ページを1行ずつ。最後に件数
//
// ★ 横スクロールは「実際に横へ送れるか」で判定する。scrollWidth（はみ出しの数値）では判定しない。
//   index.html は 390px で scrollWidth が 412px（見出しの下地の疑似要素が右へ 22px はみ出す）が、body の
//   overflow-x:hidden が画面に効いていて、読者は横に送れない。scrollWidth で判定すると、読者に影響のない
//   はみ出しを「横スクロールあり」と誤報する。はみ出しの数値は参考として出すだけにする。
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
    for (const f of PAGES) {
      n++;
      const pg = await br.newPage();
      await pg.setViewport({ width: W, height: 900, isMobile: W < 500, hasTouch: W < 500 });
      pg.on('pageerror', e => bad.push(`${W} ${f} ${e.message}`));
      pg.on('console', m => { if (m.type() === 'error') bad.push(`${W} ${f} ${m.text()}`); });
      pg.on('response', r => { if (r.status() >= 400) bad.push(`${W} ${f} ${r.status()} ${r.url()}`); });
      await pg.goto(B + f, { waitUntil: 'networkidle0' });
      for (let y = 0; y < 60000; y += 900) { await pg.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await sleep(10); }
      await sleep(600);
      const h = await horizontalScroll(pg, W);
      if (h.moved > 0) bad.push(`${W} ${f} 横に送れる ${h.moved}px`);
      else if (h.overflowPx > 0) note.push(`${W} ${f} はみ出しの数値 ${h.overflowPx}px（横には送れない）`);
      await pg.close();
    }
  }
  console.log(`pages ${n}  エラー・404・横に送れる：${bad.length}件`);
  bad.forEach(b => console.log('  ✗ ' + b));
  if (note.length) { console.log(`参考（送れないはみ出し）：${note.length}件`); note.forEach(x => console.log('  ・' + x)); }
  await br.close();
  process.exit(bad.length ? 1 : 0);
})();

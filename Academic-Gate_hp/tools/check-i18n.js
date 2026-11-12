// 日英の対応表と実際のファイルが合っているかの検査（DESIGN.md §139）。ブラウザは使わない
//   使い方（リポジトリ直下で）：node Academic-Gate_hp/tools/check-i18n.js
//   結果：食い違いを1行ずつ。最後に件数。1件でもあれば終了コード 1
//
// 見ること
//   ① 対応表（js/i18n.js の AG_PAGE_LANG）とファイル
//      - html/en/ のページは、英語限定か、en に書いた共通ページだけ
//      - en に書いたページは、html/ と html/en/ の両方にある。英語限定のページは html/ に無い
//      - 日本語限定のページに英語版が無い
//   ② 全ページが i18n.js を disciplines.js・layout.js より先に読む。<html lang> が置き場所と合う（html/en/ は en、ほかは ja）
//   ③ 英語のページの相対リンク（href・src）の行き先が実在する
//   ④ hreflang：両方の版があるページだけ、両方の head に ja・en・x-default（日本語版）の3行がある。片方だけのページには無い
//   ⑤ 英語の文言がそろっている：UI 文言表（ja と en のキーが同じ）、CRUMBS（英語の一覧に出る行の en・titleEn・unitEn）、
//      disciplines.js（en・leadEn・introEn・start.labelEn）、research.js（チップの英語名・labelEn・compactEn）
const fs = require('fs'), path = require('path'), vm = require('vm');
const SITE = path.join(__dirname, '..');
const HTML = path.join(SITE, 'html');
const BASE_URL = 'https://max-phy.jp/Academic-Gate_hp/html/';
const bad = [];
const read = f => fs.readFileSync(f, 'utf8');

// ---- js を読み込む（document は最小限の偽物。書き出しは何もしない） ----
function load(files, lang) {
  const ctx = { document: { documentElement: { getAttribute: () => lang }, querySelectorAll: () => [], readyState: 'loading', addEventListener() {} }, window: {} };
  vm.createContext(ctx);
  files.forEach(f => vm.runInContext(read(path.join(SITE, 'js', f)), ctx, { filename: f }));
  return ctx;
}
const ja = load(['i18n.js', 'disciplines.js', 'research.js'], 'ja');
const I = vm.runInContext('AG_I18N', ja), T = vm.runInContext('AG_PAGE_LANG', ja), UI = vm.runInContext('AG_UI', ja);

// ---- ページの一覧 ----
const list = (dir, pre) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => pre + f) : [];
const jaPages = [...list(HTML, ''), ...list(path.join(HTML, 'country'), 'country/')];
const enPages = [...list(path.join(HTML, 'en'), ''), ...list(path.join(HTML, 'en', 'country'), 'country/')];
const enFile = f => path.join(HTML, 'en', f), jaFile = f => path.join(HTML, f);

// ① 対応表とファイル
jaPages.forEach(f => { if (I.kind(f) === 'en') bad.push(`① ${f}：英語限定なのに html/ にある`); });
enPages.forEach(f => {
  const k = I.kind(f);
  if (k === 'ja') bad.push(`① en/${f}：日本語限定なのに英語版がある`);
  else if (k === 'both' && T.en.indexOf(f) < 0) bad.push(`① en/${f}：対応表の en に書いていない`);
});
T.en.forEach(f => {
  if (I.kind(f) !== 'both') bad.push(`① 対応表の en の ${f}：共通ページではない（${I.kind(f) === 'ja' ? '日本語限定' : '英語限定'}）`);
  if (!fs.existsSync(enFile(f))) bad.push(`① 対応表の en の ${f}：html/en/${f} が無い`);
  if (!fs.existsSync(jaFile(f))) bad.push(`① 対応表の en の ${f}：html/${f} が無い`);
});
T.enOnly.filter(p => !p.includes('*')).forEach(f => { if (!fs.existsSync(enFile(f))) bad.push(`① 対応表の enOnly の ${f}：html/en/${f} が無い`); });

// ② 読み込みの順と lang
function checkPage(file, rel, lang) {
  const s = read(file);
  const at = n => s.search(new RegExp('<script src="[^"]*js/' + n + '\\.js'));
  const i = at('i18n'), d = at('disciplines'), l = at('layout');
  if (i < 0) bad.push(`② ${rel}：i18n.js を読んでいない`);
  else if ((d >= 0 && d < i) || (l >= 0 && l < i)) bad.push(`② ${rel}：i18n.js が disciplines.js・layout.js より後`);
  const m = s.match(/<html[^>]*\slang="([^"]*)"/);
  if (!m || m[1] !== lang) bad.push(`② ${rel}：<html lang="${m ? m[1] : ''}">（${lang} のはず）`);
  return s;
}
jaPages.forEach(f => checkPage(jaFile(f), f, 'ja'));

// ③ 英語のページの相対リンク
enPages.forEach(f => {
  const s = checkPage(enFile(f), 'en/' + f, 'en');
  const base = (s.match(/<base href="([^"]*)"/) || [])[1] || '';
  const dir = path.join(path.dirname(enFile(f)), base);
  const seen = new Set();
  for (const m of s.replace(/<!--[\s\S]*?-->/g, '').matchAll(/\s(?:href|src)="([^"]+)"/g)) {   // 注釈の中の例は見ない
    const u = m[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u) || seen.has(u)) continue;
    seen.add(u);
    const p = path.join(dir, decodeURI(u.split('#')[0].split('?')[0]));
    if (!fs.existsSync(p)) bad.push(`③ en/${f}：行き先が無い ${u}`);
  }
});

// ④ hreflang
function alternates(s) {
  const out = {};
  for (const m of s.matchAll(/<link\s[^>]*rel="alternate"[^>]*>/g)) {
    const hl = (m[0].match(/hreflang="([^"]*)"/) || [])[1], href = (m[0].match(/href="([^"]*)"/) || [])[1];
    if (hl) out[hl] = href;
  }
  return out;
}
[...new Set([...jaPages, ...enPages])].forEach(f => {
  const pair = fs.existsSync(jaFile(f)) && fs.existsSync(enFile(f));
  const want = { ja: BASE_URL + f, en: BASE_URL + 'en/' + f, 'x-default': BASE_URL + f };
  [[jaFile(f), f], [enFile(f), 'en/' + f]].forEach(([file, rel]) => {
    if (!fs.existsSync(file)) return;
    const got = alternates(read(file));
    if (!pair) { if (Object.keys(got).length) bad.push(`④ ${rel}：片方の版しか無いのに hreflang がある`); return; }
    Object.keys(want).forEach(k => { if (got[k] !== want[k]) bad.push(`④ ${rel}：hreflang="${k}" が ${got[k] || '無い'}（${want[k]} のはず）`); });
  });
});

// ⑤ 英語の文言
const jk = Object.keys(UI.ja), ek = Object.keys(UI.en);
jk.filter(k => !UI.en[k]).forEach(k => bad.push(`⑤ i18n.js：UI 文言 ${k} の英語が無い`));
ek.filter(k => !(k in UI.ja)).forEach(k => bad.push(`⑤ i18n.js：UI 文言 ${k} が日本語に無い`));

const D = vm.runInContext('DISCIPLINES', ja), TH = vm.runInContext('DISCIPLINE_THEMES', ja);
D.forEach(c => {
  if (!c.en) bad.push(`⑤ disciplines.js：大分類 ${c.ja} の en が無い`);
  if (c.lead && !c.leadEn) bad.push(`⑤ disciplines.js：大分類 ${c.ja} の leadEn が無い`);
  c.subjects.forEach(s => {
    if (!s.en) bad.push(`⑤ disciplines.js：学問 ${s.ja} の en が無い`);
    if (s.intro && !s.introEn) bad.push(`⑤ disciplines.js：学問 ${s.ja} の introEn が無い`);
    if (s.start && !s.start.labelEn) bad.push(`⑤ disciplines.js：学問 ${s.ja} の start.labelEn が無い`);
  });
});
TH.forEach(t => {
  if (!t.en) bad.push(`⑤ disciplines.js：複合分野 ${t.ja} の en が無い`);
  if (t.intro && !t.introEn) bad.push(`⑤ disciplines.js：複合分野 ${t.ja} の introEn が無い`);
});
vm.runInContext('RESEARCH_TIERS', ja).forEach(t => {
  if (!t.en) bad.push(`⑤ research.js：層 ${t.ja} の en が無い`);
  t.cards.forEach(c => {
    if (!c.en) bad.push(`⑤ research.js：${c.ja || c.topic} の en が無い`);
    if (c.label && !c.labelEn) bad.push(`⑤ research.js：${c.topic} の labelEn が無い`);
    if (c.compact && !c.compactEn) bad.push(`⑤ research.js：${c.topic} の compactEn が無い`);
    (c.chips || []).forEach(k => { if (!k[2]) bad.push(`⑤ research.js：チップ ${k[1]} の英語名が無い`); });
  });
});

// CRUMBS は layout.js の中の変数なので、表の部分だけを取り出して読む
const L = read(path.join(SITE, 'js', 'layout.js'));
const m = L.match(/var CRUMBS = (\{[\s\S]*?\n    \});/);
if (!m) bad.push('⑤ layout.js：CRUMBS が見つからない');
else {
  const C = vm.runInNewContext('(' + m[1] + ')');
  const hidden = k => { for (let p = k; p && C[p]; p = C[p].parent) { const f = C[p].href || C[p].file; if (f && !(I.kind(f) === 'both' || I.kind(f) === 'en')) return true; } return false; };
  Object.keys(C).forEach(k => {
    const c = C[k], f = c.href || c.file;
    if (f && !fs.existsSync(jaFile(f.split('#')[0])) && I.kind(f) !== 'en' && !c.file) bad.push(`⑤ layout.js：CRUMBS ${k} の行き先 ${f} が無い`);
    if (hidden(k)) return;                      // 英語の一覧に出ない行（日本語限定とその下）
    if (!c.en && /[^\x00-\x7f]/.test(c.label)) bad.push(`⑤ layout.js：CRUMBS ${k} の en が無い`);
    if (c.title && !c.titleEn) bad.push(`⑤ layout.js：CRUMBS ${k} の titleEn が無い`);
    if (c.unit && !c.unitEn) bad.push(`⑤ layout.js：CRUMBS ${k} の unitEn が無い`);
  });
}

console.log(`check-i18n  ja ${jaPages.length}・en ${enPages.length} ページ（対応表の en ${T.en.length}・enOnly ${T.enOnly.length}）  食い違い：${bad.length}件`);
bad.forEach(b => console.log('  ✗ ' + b));
process.exit(bad.length ? 1 : 0);

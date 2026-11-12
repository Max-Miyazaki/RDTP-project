/* ============================================================================
   research.js — 研究の階層（DESIGN.md §130・§135.8）

   ★ 自己紹介の 02 — RESEARCH と、ホームの 04 私の枝が、同じ階層を表示する。
   データ・HTML・リンクはこのファイルだけに書く（CSS は style.css の .rs-*）。
   置き場所：<div class="rs-stack" data-research></div>
             data-research="compact" ならホーム用の小さい版（基礎分野の科目チップを省く）

   上ほど専門的、下ほど基礎的な4層。色は可視光のエネルギー順（CSS の --nm-450〜650）。リンク先は RESEARCH_LINKS に、data-topic を
   キーにして書き足すと有効になる（カードは全面の覆いの <a> と右上の →、
   チップは <span> が <a> に置き換わる）。空のものはリンクなし（押せない・光らない）。
   ============================================================================ */
var RESEARCH_TIERS = [
    { mod: 'theme', en: 'Theme', ja: '研究テーマ', cards: [
        { topic: 'early-universe', en: 'Early Universe Cosmology', ja: '初期宇宙理論' }] },
    { mod: 'topics', en: 'Topics', ja: '研究トピック', cards: [
        { topic: 'inflation', en: 'Inflation', ja: 'インフレーション' },
        { topic: 'axion-dark-matter', en: 'Axion Dark Matter', ja: 'アクシオンダークマター' },
        { topic: 'primordial-black-holes', en: 'Primordial Black Holes', ja: '原始ブラックホール' }] },
    { mod: 'fields', en: 'Fields', ja: '専門分野', cards: [
        { topic: 'particle-physics', en: 'Particle Physics', ja: '素粒子物理学' },
        { topic: 'quantum-field-theory', en: 'Quantum Field Theory', ja: '場の量子論' },
        { topic: 'general-relativity', en: 'General Relativity', ja: '一般相対性理論' },
        { topic: 'cosmology', en: 'Cosmology', ja: '宇宙論' }] },
    { mod: 'foundations', en: 'Foundations', ja: '基礎分野', cards: [
        { topic: 'core-physics', en: 'Core Physics', label: '基礎領域（学部レベル）の科目一覧',
          // 科目と順番は study_physics.html の「基礎領域（学部レベル）」と同じ
          labelEn: 'Core subjects (undergraduate level)',
          // [キー, 日本語, 英語]
          chips: [['phys-math', '物理数学', 'Mathematics for Physics'], ['classical-mechanics', '古典力学', 'Classical Mechanics'],
                  ['analytical-mechanics', '解析力学', 'Analytical Mechanics'], ['electromagnetism', '電磁気学', 'Electromagnetism'],
                  ['thermodynamics', '熱力学', 'Thermodynamics'], ['statistical-mechanics', '統計力学', 'Statistical Mechanics'],
                  ['quantum-mechanics', '量子力学', 'Quantum Mechanics'], ['special-relativity', '特殊相対性理論', 'Special Relativity']],
          // ホーム（compact）では科目のチップの代わりに、この1行
          compact: '物理数学・古典力学・電磁気学ほか8科目',
          compactEn: '8 subjects, including mathematics for physics, classical mechanics and electromagnetism' }] }
];

var RESEARCH_LINKS = {
    // 研究テーマ・研究トピック
    'early-universe':         '',
    'inflation':              '',
    'axion-dark-matter':      '',
    'primordial-black-holes': '',
    // 専門分野
    'particle-physics':       '',
    'quantum-field-theory':   '',
    'general-relativity':     '',
    'cosmology':              '',
    // 基礎分野（カード全体）
    'core-physics':           'study_physics.html#foundations',
    // 基礎分野の科目チップ（ページのある科目だけ。いまは物理数学だけ）
    'phys-math':              'phys-math.html',
    'classical-mechanics':    '',
    'analytical-mechanics':   '',
    'electromagnetism':       '',
    'thermodynamics':         '',
    'statistical-mechanics':  '',
    'quantum-mechanics':      '',
    'special-relativity':     ''
};

(function () {
    'use strict';

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

    // ページの言語（i18n.js）。日本語のページは、英語の小見出し＋日本語の名前（いままでどおり）。
    // 英語のページは、英語の名前だけを出す（同じ英語を2回並べない。DESIGN.md §139）
    var I18N = AG_I18N, EN = I18N.lang === 'en';

    function card(c, compact) {
        var label = I18N.pick(c.label, c.labelEn), LJ = EN ? '' : ' lang="ja"';
        var attrs = ' data-topic="' + c.topic + '"' + (label ? ' data-label="' + esc(label) + '"' : '');
        var body = EN && !c.chips ? '' : '<span class="meta">' + esc(c.en) + '</span>';
        if (c.chips && !compact) {
            body += '<ul class="rs-chips"' + LJ + '>' + c.chips.map(function (k) {
                return '<li><span data-topic="' + k[0] + '">' + esc(I18N.pick(k[1], k[2])) + '</span></li>';
            }).join('') + '</ul>';
        } else if (c.chips) {
            body += '<p class="rs-card__sub"' + LJ + '>' + esc(I18N.pick(c.compact, c.compactEn)) + '</p>';
        } else {
            body += '<h3' + LJ + '>' + esc(I18N.pick(c.ja, c.en)) + '</h3>';
        }
        return '<li><div class="profile-card rs-card"' + attrs + '>' + body + '</div></li>';
    }

    function render(stack) {
        var compact = stack.getAttribute('data-research') === 'compact';
        if (compact) stack.classList.add('rs-stack--compact');
        // 色は可視光のエネルギー順（上ほど高エネルギー＝青、下ほど低エネルギー＝赤。§135.9）。凡例は左の細いスペクトルの帯だけ（§135.10）
        stack.innerHTML = RESEARCH_TIERS.map(function (t) {
            return '<div class="rs-tier rs-tier--' + t.mod + ' reveal">' +
                '<p class="rs-tier__label"><span>' + t.en + '</span>' + (EN ? '' : '<span lang="ja">' + t.ja + '</span>') + '</p>' +
                '<ul class="rs-cards">' + t.cards.map(function (c) { return card(c, compact); }).join('') + '</ul></div>';
        }).join('<div class="rs-link" aria-hidden="true"></div>');
        link(stack);
    }

    // リンクのあるカード：<div> のまま、全面を覆う <a class="rs-card__link"> を重ね、右上に →
    // （基礎分野のカードは中にチップのリンクを持つので、<a> の入れ子を避ける。§132）
    function link(stack) {
        [].forEach.call(stack.querySelectorAll('.rs-card[data-topic]'), function (c) {
            var href = RESEARCH_LINKS[c.dataset.topic];
            if (!href || !I18N.href(href)) return;
            var a = document.createElement('a');
            a.className = 'rs-card__link';
            a.href = href;
            var name = c.querySelector('h3') || c.querySelector('.meta');
            a.setAttribute('aria-label', c.dataset.label || name.textContent);
            var arrow = document.createElement('span');
            arrow.className = 'rs-card__arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '→';
            c.classList.add('is-linked');
            c.appendChild(a);
            c.appendChild(arrow);
        });
        [].forEach.call(stack.querySelectorAll('.rs-chips [data-topic]'), function (chip) {
            var href = RESEARCH_LINKS[chip.dataset.topic];
            if (!href || !I18N.href(href)) return;
            var a = document.createElement('a');
            a.href = href;
            a.dataset.topic = chip.dataset.topic;
            a.textContent = chip.textContent;
            chip.replaceWith(a);
        });
    }

    [].forEach.call(document.querySelectorAll('[data-research]'), render);
})();

// 研究分野のカードと科目チップのリンク先。キーは HTML の data-topic。
// URL を書き足すと有効になる。空のものはリンクなし（押せない・光らない）。
//   カード：<div> のまま全面を覆う <a class="rs-card__link"> を重ね、右上に → を足す
//           （基礎分野のカードは中にチップのリンクを持つので、<a> の入れ子を避ける）
//   チップ：<span> を <a> に置き換える
// 基礎分野の科目は study_physics.html の「基礎領域（学部レベル）」と同じ。
// ページのある科目だけ URL を入れる（いまは物理数学だけ）。
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
    // 基礎分野の科目チップ
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

    document.querySelectorAll('.rs-card[data-topic]').forEach(function (card) {
        var href = RESEARCH_LINKS[card.dataset.topic];
        if (!href) return;
        var a = document.createElement('a');
        a.className = 'rs-card__link';
        a.href = href;
        var name = card.querySelector('h3') || card.querySelector('.meta');
        a.setAttribute('aria-label', card.dataset.label || name.textContent);
        var arrow = document.createElement('span');
        arrow.className = 'rs-card__arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        card.classList.add('is-linked');
        card.appendChild(a);
        card.appendChild(arrow);
    });

    document.querySelectorAll('.rs-chips [data-topic]').forEach(function (chip) {
        var href = RESEARCH_LINKS[chip.dataset.topic];
        if (!href) return;
        var a = document.createElement('a');
        a.href = href;
        a.dataset.topic = chip.dataset.topic;
        a.textContent = chip.textContent;
        chip.replaceWith(a);
    });
})();

(function () {
    'use strict';

    document.documentElement.classList.add('js');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// スクロール時のヘッダー効果
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    } else {
        header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }
})

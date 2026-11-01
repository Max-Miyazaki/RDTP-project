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

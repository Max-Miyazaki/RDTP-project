// ハンバーガーメニューの開閉
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });

        // メニュー項目をクリックしたらメニューを閉じる
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            });
        });

        // メニュー外をクリックしたらメニューを閉じる
        document.addEventListener('click', function(event) {
            if (!menuToggle.contains(event.target) && !navMenu.contains(event.target)) {
                menuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        });
    }
});

// スムーズスクロール（アンカーリンク用） — stage-jump links are handled separately below.
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not(.stage-jump)');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // 空のアンカー（#のみ）は無視
            if (href === '#' || href === '') {
                return;
            }

            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();

                // 浮遊するナビピルの高さ + 上部の余白を考慮したオフセット
                const nav = document.querySelector('header');
                const navHeight = nav ? nav.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 40;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Round-17: stage-title jump links. A bare hash jump lands the heading at the top
// of the viewport, which leaves short index blocks outside the dwell plateau and
// settles the motif weight w at 0.02–0.83 (measured). scrollIntoView() on the whole
// <section> resolves w = 1.0 at every stage. With JS active we preventDefault and
// scrollIntoView the section; the href="#id" stays as the no-JS fallback.
document.addEventListener('DOMContentLoaded', function () {
    var jumpLinks = document.querySelectorAll('a.stage-jump');
    jumpLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            var section = this.closest('section');
            if (!section) return;
            e.preventDefault();
            section.scrollIntoView();
        });
    });
});

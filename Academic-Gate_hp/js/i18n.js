/* ============================================================================
   i18n.js — 日本語・英語の対応表と、共通部品の文言（DESIGN.md §139）

   ★ 全ページで、ほかの JS より先に読む（disciplines.js は読み込んだ時点で木を書き出すため）。
   ページの言語は <html lang> で決まる（"en" なら英語、それ以外は日本語）。
   英語のページは html/en/ に、日本語のページと同じファイル名で置く。

   ページの3つの種類（ファイル名は html/ からの相対。* は / を含まない任意の文字列）
     共通（ja + en）：下の jaOnly・enOnly のどれにも当たらないページ。英語版があるものだけ en に書く
     日本語限定      ：jaOnly。英語版は作らない。英語の一覧・パネルには出さない
     英語限定        ：enOnly。html/en/ にだけ置く。日本語の一覧・パネルには出さない
   英語版を公開したら en に1行足す（§138 の⑤）。表と実際のファイルが合っているかは tools/check-i18n.js が見る。
   ============================================================================ */
var AG_PAGE_LANG = {
    jaOnly: ['memoryverse.html', 'memoryverse_*.html', 'country/*.html', 'skills_mnemonics.html', 'earthhuman.html'],
    enOnly: [],
    en: []
};

/* 共通部品の文言。キーは ja・en で同じものを持つ（足りないと check-i18n が落とす）。
   英語は用語集（DESIGN.md §139.3）の下書き。確定は用語集の確認のあと */
var AG_UI = {
    ja: {
        'nav.index': 'ホーム', 'nav.self-intro': '自己紹介', 'nav.study': '勉強の軌跡',
        'nav.videos': '動画', 'nav.blog': 'ブログ', 'nav.sns': '各種SNS',
        'nav.menu': 'メニューを開く',
        'footer.label': 'フッターナビゲーション',
        'footer.tagline': '学術領域の世界への入口を開くプラットフォーム。',
        'sitenav.tab': 'サイト構成', 'sitenav.title': 'サイトの階層', 'sitenav.close': '閉じる',
        'sitenav.expand': '{name}の下を開く',
        'soon': '準備中', 'soon.paren': '（準備中）',
        'lesson.prev': '前の{unit}', 'lesson.next': '次の{unit}', 'lesson.series': 'シリーズ',
        'lesson.toc': '{name}の目次へ', 'lesson.label': '前後の{unit}',
        'theme.toDark': 'ダークモードに切り替え', 'theme.toLight': 'ライトモードに切り替え',
        'study.start': 'ここから読む', 'study.toPage': '{name}のページへ',
        'study.themes': '複合分野', 'study.themesLead': 'ひとつの学問に収まらない問いを、いくつもの分野を重ねて読む。',
        'study.roots': '精神の圏域'
    },
    en: {
        'nav.index': 'Home', 'nav.self-intro': 'About', 'nav.study': 'Study Journey',
        'nav.videos': 'Videos', 'nav.blog': 'Blog', 'nav.sns': 'Social',
        'nav.menu': 'Open menu',
        'footer.label': 'Footer navigation',
        'footer.tagline': 'A platform that opens the gates to the world of academic disciplines.',
        'sitenav.tab': 'Site Map', 'sitenav.title': 'Site structure', 'sitenav.close': 'Close',
        'sitenav.expand': 'Expand {name}',
        'soon': 'Coming soon', 'soon.paren': ' (coming soon)',
        'lesson.prev': 'Previous {unit}', 'lesson.next': 'Next {unit}', 'lesson.series': 'Series',
        'lesson.toc': 'Contents of {name}', 'lesson.label': 'Previous and next {unit}',
        'theme.toDark': 'Switch to dark mode', 'theme.toLight': 'Switch to light mode',
        'study.start': 'Start here', 'study.toPage': 'Go to {name}',
        'study.themes': 'Themes', 'study.themesLead': 'Questions that do not fit in a single discipline, read by layering several fields.',
        'study.roots': 'Orbis Mentis'
    }
};

var AG_I18N = (function () {
    'use strict';
    var lang = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ja';

    function toRe(p) { return new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$'); }
    function hit(list, f) { return list.some(function (p) { return toRe(p).test(f); }); }
    function file(href) { return String(href).split('#')[0].split('?')[0]; }

    // 'both' | 'ja' | 'en'
    function kind(f) {
        f = file(f);
        if (hit(AG_PAGE_LANG.jaOnly, f)) return 'ja';
        if (hit(AG_PAGE_LANG.enOnly, f)) return 'en';
        return 'both';
    }
    // その言語の版があるか
    function has(f, l) {
        var k = kind(f);
        if (l === 'ja') return k !== 'en';
        return k === 'en' || (k === 'both' && AG_PAGE_LANG.en.indexOf(file(f)) >= 0);
    }
    // いまの言語の一覧に並べるか（反対の言語の限定ページは出さない。版がまだ無い共通ページは並べて「準備中」）
    function listed(f) { var k = kind(f); return k === 'both' || k === lang; }
    // いまの言語のページから、そのページへのリンク。版が無ければ null。
    // 日本語のページでは、日本語版のあるページの href をそのまま返す（いまの出力を変えない）
    function href(h) { return has(h, lang) ? h : null; }
    // 文言。{name} などを vars で埋める
    function t(key, vars) {
        var s = AG_UI[lang][key];
        if (s == null) s = AG_UI.ja[key];
        if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
        return s;
    }
    // データの項目の名前：英語のページでは en（無ければ日本語のまま。check-i18n が落とす）
    function pick(ja, en) { return lang === 'en' && en ? en : ja; }

    return { lang: lang, kind: kind, has: has, listed: listed, href: href, t: t, pick: pick };
})();

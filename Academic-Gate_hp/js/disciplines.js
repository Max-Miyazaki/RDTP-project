/* ============================================================================
   disciplines.js — 学問のデータ（DESIGN.md §136）

   ★ 大分類と学問のリストはこのファイルだけに書く。ホームの学問の樹（index.html の
   03）と、勉強の軌跡（study.html）が同じデータを使う。学問を足すと両方に出る。
   ホーム用の置き場所：<ol class="tree__data" data-disciplines="tree"></ol>
     → 前の形と同じ入れ子のリスト（li.tree-cat > h3 + ul > li[data-key] > .tree-node）を
       書き出す。js/academic-tree.js はそれを読む（このファイルを先に読み込むこと）。

   学問の状態は2つ（§136.7）
     - 独自のページがある  ：page に行き先。start に「ここから読む」の最初の記事
     - 準備中              ：page が無い（破線）
   ホームの木では、page があれば実線のリンク、無ければ破線になる。
   ★ 学問を複合分野（テーマ）に結び付けない。テーマはタイトルそのものがテーマを表し、
     学問からテーマの中の章立てへ飛ぶのは階層が違うため（§136.7。以前の「テーマの中で扱う」はやめた）
   ============================================================================ */
var DISCIPLINES = [
    { cat: 'formal', ja: '形式科学', en: 'Formal Sciences',
      lead: '記号と論理だけで組み立てる、ほかの学問の言葉になる学問。',
      leadEn: 'Disciplines built from symbols and logic alone, which become the language of the other disciplines.',
      subjects: [
        { key: 'math', ja: '数学', en: 'Mathematics' },
        { key: 'statistics', ja: '統計学', en: 'Statistics' },
        { key: 'logic', ja: '論理学', en: 'Logic' },
        { key: 'cs', ja: '情報科学', en: 'Informatics', page: 'study_informatics.html',
          intro: '情報をどう表し、どう計算し、どう運び、どう守るか。手を動かしながら、仕組みから理解する。',
          introEn: 'How information is represented, computed, carried and protected. Understanding the mechanisms by working with your own hands.',
          // 「ここから読む」はシリーズ最初の節へ（物理学の phys-math_1-1 と同じ扱い）
          start: { href: 'cyber_1-1.html', label: '1-1 パケットとIP', labelEn: '1-1 Packets and IP' } }] },
    { cat: 'natural', ja: '自然科学', en: 'Natural Sciences',
      lead: '物質、生命、地球、宇宙。自然の仕組みを、観測と理論で確かめる。',
      leadEn: 'Matter, life, the Earth and the universe. Testing how nature works through observation and theory.',
      subjects: [
        { key: 'physics', ja: '物理学', en: 'Physics', page: 'study_physics.html',
          intro: '素粒子から宇宙まで、自然の仕組みを数式で読み解く。公式を覚えるのではなく、原理から積み上げる。',
          introEn: 'From elementary particles to the universe, reading how nature works through equations. Not memorizing formulas, but building up from first principles.',
          start: { href: 'phys-math_1-1.html', label: '1-1 微分の基礎', labelEn: '1-1 Basics of Differentiation' } },
        { key: 'chemistry', ja: '化学', en: 'Chemistry' },
        { key: 'biology', ja: '生物学', en: 'Biology' },
        { key: 'earth-science', ja: '地球科学', en: 'Earth Science' },
        { key: 'astronomy', ja: '天文学', en: 'Astronomy' }] },
    { cat: 'life', ja: '生命・医療', en: 'Life & Medicine',
      lead: '生きものの体と暮らしを、守り、治し、育てるための学問。',
      leadEn: 'Disciplines for protecting, healing and nurturing the bodies and lives of living things.',
      subjects: [
        { key: 'medicine', ja: '医学', en: 'Medicine' },
        { key: 'pharmacy', ja: '薬学', en: 'Pharmacy' },
        { key: 'agriculture', ja: '農学', en: 'Agriculture' }] },
    { cat: 'engineering', ja: '工学', en: 'Engineering',
      lead: 'わかったことを、形のあるものに変える学問。',
      leadEn: 'Disciplines that turn what we understand into things with form.',
      subjects: [
        { key: 'mechanical', ja: '機械工学', en: 'Mechanical Engineering', treeEn: 'Mechanical Eng.' },
        { key: 'electrical', ja: '電気電子工学', en: 'Electrical and Electronic Engineering', treeEn: 'Electrical Eng.' },
        { key: 'civil', ja: '土木工学', en: 'Civil Engineering', treeEn: 'Civil Eng.' },
        { key: 'aerospace', ja: '航空宇宙工学', en: 'Aerospace Engineering', treeEn: 'Aerospace Eng.' },
        { key: 'architecture', ja: '建築学', en: 'Architecture' }] },
    { cat: 'humanities', ja: '人文学', en: 'Humanities',
      lead: '人が考え、語り、残してきたものから、人間を知る。',
      leadEn: 'Knowing humanity through what people have thought, said and left behind.',
      subjects: [
        { key: 'philosophy', ja: '哲学', en: 'Philosophy' },
        { key: 'history', ja: '歴史学', en: 'History' },
        { key: 'geography', ja: '地理学', en: 'Geography' },
        { key: 'religious-studies', ja: '宗教学', en: 'Religious Studies' },
        { key: 'literature', ja: '文学', en: 'Literature' },
        { key: 'linguistics', ja: '言語学', en: 'Linguistics' },
        { key: 'languages', ja: '外国語', en: 'Foreign Languages', treeEn: 'Languages' }] },
    { cat: 'social', ja: '社会科学', en: 'Social Sciences',
      lead: '人の心と、人が集まって生まれるしくみ（市場・法・国家）を調べる。',
      leadEn: 'Studying the human mind and the systems that arise when people gather: markets, law and the state.',
      subjects: [
        { key: 'economics', ja: '経済学', en: 'Economics' },
        { key: 'law', ja: '法学', en: 'Law' },
        { key: 'politics', ja: '政治学', en: 'Political Science' },
        { key: 'sociology', ja: '社会学', en: 'Sociology' },
        { key: 'psychology', ja: '心理学', en: 'Psychology' },
        { key: 'education', ja: '教育学', en: 'Education' }] },
    { cat: 'arts', ja: '芸術・創作', en: 'Arts & Creation', treeEn: 'Arts',
      lead: '見る・聴く・作ることで、世界を表し直す。',
      leadEn: 'Representing the world anew by seeing, listening and making.',
      subjects: [
        { key: 'fine-art', ja: '美術', en: 'Fine Arts' },
        { key: 'music', ja: '音楽', en: 'Music' },
        { key: 'design', ja: 'デザイン', en: 'Design' },
        { key: 'film', ja: '映像', en: 'Film' }] }
];

// 複合分野（THEMES）。タイトルと一言だけ（§136.7）。edge は縁のグラデーションに使う大分類の色の並び
// （テーマであることを示す見た目。学問へのリンクではない）。page が無いあいだは準備中
var DISCIPLINE_THEMES = [
    { key: 'earthhuman', ja: '地球と人類', en: 'Earth & Humankind',
      intro: '地球の構造から人類を読み解く。',
      introEn: 'Reading humankind through the structure of the Earth.',
      edge: ['humanities', 'social', 'arts'] }
];
(function () {
    'use strict';

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

    // ページの言語（i18n.js）。英語のページでは英語名。木のラベルだけは、長い名前に短い名前（treeEn）を使い、
    // 正式名を title と aria-label に持たせる（DESIGN.md §139。長い英語名は広い画面の列で隣と重なるため）
    var I18N = AG_I18N, EN = I18N.lang === 'en';
    function name(x) {
        if (!EN) return esc(x.ja);
        return esc(x.treeEn || x.en || x.ja);
    }
    function full(x) { return EN && x.treeEn ? ' title="' + esc(x.en) + '" aria-label="' + esc(x.en) + '"' : ''; }

    // ホームの木の名前のチップ：ページがあれば実線の <a>、無ければ破線の <span>
    // （英語のページでは、英語版がまだ無い学問のページも破線）
    function treeNode(s) {
        var href = s.page && I18N.href(s.page);
        return href
            ? '<a class="tree-node" href="' + href + '"' + full(s) + '>' + name(s) + '</a>'
            : '<span class="tree-node"' + full(s) + '>' + name(s) + '</span>';
    }

    function renderTree(ol) {
        ol.innerHTML = DISCIPLINES.map(function (c) {
            return '<li class="tree-cat" data-cat="' + c.cat + '">' +
                '<h3 class="tree-cat__name"' + full(c) + '>' + name(c) + '</h3>' +
                '<ul>' + c.subjects.map(function (s) {
                    return '<li data-key="' + s.key + '">' + treeNode(s) + '</li>';
                }).join('') + '</ul></li>';
        }).join('');
    }

    [].forEach.call(document.querySelectorAll('[data-disciplines="tree"]'), renderTree);
})();

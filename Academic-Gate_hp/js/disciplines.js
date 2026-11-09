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
      subjects: [
        { key: 'math', ja: '数学' },
        { key: 'statistics', ja: '統計学' },
        { key: 'logic', ja: '論理学' },
        { key: 'cs', ja: '情報科学', en: 'Informatics', page: 'study_informatics.html',
          intro: '情報をどう表し、どう運び、どう守るかを学ぶ。攻撃と防御を自分の手で確かめながら、仕組みから理解する。',
          // 最初の節を書き上げたら、ここをその節（例：cyber_1-1.html）に変える。いまは目次へ
          start: { href: 'cyber.html', label: 'サイバーセキュリティ基礎' } }] },
    { cat: 'natural', ja: '自然科学', en: 'Natural Sciences',
      lead: '物質、生命、地球、宇宙。自然の仕組みを、観測と理論で確かめる。',
      subjects: [
        { key: 'physics', ja: '物理学', en: 'Physics', page: 'study_physics.html',
          intro: '素粒子から宇宙まで、自然の仕組みを数式で読み解く。公式を覚えるのではなく、原理から積み上げる。',
          start: { href: 'phys-math_1-1.html', label: '1-1 微分の基礎' } },
        { key: 'chemistry', ja: '化学' },
        { key: 'biology', ja: '生物学' },
        { key: 'earth-science', ja: '地球科学' },
        { key: 'astronomy', ja: '天文学' }] },
    { cat: 'life', ja: '生命・医療', en: 'Life & Medicine',
      lead: '生きものの体と暮らしを、守り、治し、育てるための学問。',
      subjects: [
        { key: 'medicine', ja: '医学' },
        { key: 'pharmacy', ja: '薬学' },
        { key: 'agriculture', ja: '農学' }] },
    { cat: 'engineering', ja: '工学', en: 'Engineering',
      lead: 'わかったことを、形のあるものに変える学問。',
      subjects: [
        { key: 'mechanical', ja: '機械工学' },
        { key: 'electrical', ja: '電気電子工学' },
        { key: 'civil', ja: '土木工学' },
        { key: 'aerospace', ja: '航空宇宙工学' },
        { key: 'architecture', ja: '建築学' }] },
    { cat: 'humanities', ja: '人文学', en: 'Humanities',
      lead: '人が考え、語り、残してきたものから、人間を知る。',
      subjects: [
        { key: 'philosophy', ja: '哲学' },
        { key: 'history', ja: '歴史学' },
        { key: 'geography', ja: '地理学' },
        { key: 'religious-studies', ja: '宗教学' },
        { key: 'literature', ja: '文学' },
        { key: 'linguistics', ja: '言語学' },
        { key: 'languages', ja: '外国語' }] },
    { cat: 'social', ja: '社会科学', en: 'Social Sciences',
      lead: '人の心と、人が集まって生まれるしくみ（市場・法・国家）を調べる。',
      subjects: [
        { key: 'economics', ja: '経済学' },
        { key: 'law', ja: '法学' },
        { key: 'politics', ja: '政治学' },
        { key: 'sociology', ja: '社会学' },
        { key: 'psychology', ja: '心理学' },
        { key: 'education', ja: '教育学' }] },
    { cat: 'arts', ja: '芸術・創作', en: 'Arts & Creation',
      lead: '見る・聴く・作ることで、世界を表し直す。',
      subjects: [
        { key: 'fine-art', ja: '美術' },
        { key: 'music', ja: '音楽' },
        { key: 'design', ja: 'デザイン' },
        { key: 'film', ja: '映像' }] }
];

// 複合分野（THEMES）。タイトルと一言だけ（§136.7）。edge は縁のグラデーションに使う大分類の色の並び
// （テーマであることを示す見た目。学問へのリンクではない）。page が無いあいだは準備中
var DISCIPLINE_THEMES = [
    { key: 'earthhuman', ja: '地球と人類', en: 'Earth & Humankind',
      intro: '地球の構造から人類を読み解く。',
      edge: ['humanities', 'social', 'arts'] }
];
(function () {
    'use strict';

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

    // ホームの木の名前のチップ：ページがあれば実線の <a>、無ければ破線の <span>
    function treeNode(s) {
        return s.page
            ? '<a class="tree-node" href="' + s.page + '">' + esc(s.ja) + '</a>'
            : '<span class="tree-node">' + esc(s.ja) + '</span>';
    }

    function renderTree(ol) {
        ol.innerHTML = DISCIPLINES.map(function (c) {
            return '<li class="tree-cat" data-cat="' + c.cat + '">' +
                '<h3 class="tree-cat__name">' + esc(c.ja) + '</h3>' +
                '<ul>' + c.subjects.map(function (s) {
                    return '<li data-key="' + s.key + '">' + treeNode(s) + '</li>';
                }).join('') + '</ul></li>';
        }).join('');
    }

    [].forEach.call(document.querySelectorAll('[data-disciplines="tree"]'), renderTree);
})();

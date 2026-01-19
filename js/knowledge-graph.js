// グラフの初期化と描画を行う関数
function initializeGraph() {
    // タグの色を定義
    const tagColors = {
        '#physics': '#87CEEB',  // 物理学関連: スカイブルー
        '#quantum': '#FF69B4',  // 量子力学関連: ホットピンク
        '#relativity': '#4B0082', // 相対性理論関連: インディゴ
        '#cosmology': '#32CD32', // 宇宙論関連: ライムグリーン
        '#mathematics': '#FFD700', // 数学関連: ゴールド
        '#quantum-field-theory': '#FF00FF' // PeskinQFT関連: ピンク
    };

    // 勉強の軌跡のデータ
    const graphData = {
        nodes: [
            // PDF資料
            { id: "PeskinQFT Sec2-1.pdf", group: 1, tags: ["#physics", "#quantum-field-theory"], type: "pdf", url: "../pdf/PeskinQFT_Sec2-1.pdf" },
            { id: "PeskinQFT Sec2-2.pdf", group: 1, tags: ["#physics", "#quantum-field-theory"], type: "pdf", url: "../pdf/PeskinQFT_Sec2-2.pdf" },
            { id: "PeskinQFT Sec2-3.pdf", group: 1, tags: ["#physics", "#quantum-field-theory"], type: "pdf", url: "../pdf/PeskinQFT_Sec2-3.pdf" },
            { id: "PeskinQFT Sec2-4.pdf", group: 1, tags: ["#physics", "#quantum-field-theory"], type: "pdf", url: "../pdf/PeskinQFT_Sec2-4.pdf" },
            // 関連ページ
            { id: "2.1 The Necessity of the Field Viewpoint", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-1.html" },
            { id: "2.2 Elements of Classical Field Theory", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-2.html" },
            { id: "2.3 The Klein-Gordon Field as Harmonic Oscillators", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-3.html" },
            { id: "2.4 The Klein-Gordon Field as Harmonic Oscillators", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-4.html" },
            { id: "PeskinQFTまとめ", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft.html" },
            { id: "勉強の軌跡", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "study.html" },

            // タグ
            { id: "#physics", group: 2 },
            { id: "#quantum", group: 2 },
            { id: "#quantum-field-theory", group: 2 }
        ]
    };

    // タグに基づいてリンクを生成する関数
    function generateLinks(nodes) {
        const links = [];
        const articles = nodes.filter(node => node.tags);
        const tags = nodes.filter(node => node.id.startsWith('#'));

        // タグとのリンクを生成 (記事 -> タグ)
        articles.forEach(article => {
            article.tags.forEach(tag => {
                links.push({
                    source: article.id,
                    target: tag,
                    value: 1,
                    type: 'tag'
                });
            });
        });

        // 階層構造のリンクを生成
        const studyNode = articles.find(node => node.id === "勉強の軌跡");
        const peskinSummaryNode = articles.find(node => node.id === "PeskinQFTまとめ");
        const sectionNodes = articles.filter(node =>
            node.type === "page" &&
            node.id.startsWith("2.") &&
            !node.id.includes("まとめ")
        );
        const pdfNodes = articles.filter(node => node.type === "pdf");

        // 勉強の軌跡 → PeskinQFTまとめ
        if (studyNode && peskinSummaryNode) {
            links.push({
                source: studyNode.id,
                target: peskinSummaryNode.id,
                value: 2,
                type: 'hierarchy'
            });
        }

        // PeskinQFTまとめ → 各セクション
        if (peskinSummaryNode) {
            sectionNodes.forEach(sectionNode => {
                links.push({
                    source: peskinSummaryNode.id,
                    target: sectionNode.id,
                    value: 2,
                    type: 'hierarchy'
                });
            });
        }

        // 各セクション → 対応するPDF資料
        sectionNodes.forEach(sectionNode => {
            const sectionNumber = sectionNode.id.match(/2\.(\d+)/)?.[1];
            if (sectionNumber) {
                const matchingPdfNode = pdfNodes.find(pdfNode =>
                    pdfNode.id.includes(`Sec2-${sectionNumber}`)
                );
                if (matchingPdfNode) {
                    links.push({
                        source: sectionNode.id,
                        target: matchingPdfNode.id,
                        value: 2,
                        type: 'hierarchy'
                    });
                }
            }
        });

        return links;
    }

    // リンクを生成
    graphData.links = generateLinks(graphData.nodes);

    const container = document.getElementById('graph-container');
    if (!container) {
        console.error('Graph container not found');
        return;
    }

    // SVGの設定
    defs.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20) // ノードの半径に合わせて調整
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#555');

    // Outgoing用矢印 (緑/青系)
    defs.append('marker')
        .attr('id', 'arrow-outgoing')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#00ff00');

    // Incoming用矢印 (赤/オレンジ系)
    defs.append('marker')
        .attr('id', 'arrow-incoming')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#ff4500');

    // ズーム用のコンテナを追加
    const g = svg.append('g');

    // シミュレーションの設定
    const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links)
            .id(d => d.id)
            .distance(100)
            .strength(0.5))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius(20));

    // リンクの描画
    const link = g.append('g')
        .selectAll('path')
        .data(graphData.links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#555')
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrow)');

    // ノードの描画
    const node = g.append('g')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // ノードの円を追加
    node.append('circle')
        .attr('r', d => d.id.startsWith('#') ? 6 : 8)
        .attr('fill', d => {
            if (d.id.startsWith('#')) {
                return tagColors[d.id] || '#ffffff';
            }
            switch (d.type) {
                case 'pdf': return '#00ffff';
                case 'page': return '#ff00ff';
                default: return '#ffffff';
            }
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);

    // ノードのラベルを追加
    const text = node.append('text')
        .attr('dx', 12)
        .attr('dy', '.35em')
        .text(d => d.id)
        .style('font-size', '10px')
        .style('fill', '#ccc')
        .style('pointer-events', 'none')
        .style('opacity', 0.8);

    // ホバー時のインタラクション
    node.on('mouseover', function (event, d) {
        // 全体を薄くする
        node.style('opacity', 0.1);
        link.style('opacity', 0.1);
        text.style('opacity', 0.1);

        // 選択されたノードを強調
        d3.select(this).style('opacity', 1);
        d3.select(this).select('text').style('opacity', 1).style('font-size', '14px').style('font-weight', 'bold').style('fill', '#fff');

        // 関連するリンクとノードを探す
        const connectedLinks = graphData.links.filter(l => l.source.id === d.id || l.target.id === d.id);

        // Outgoing (自分から出ている)
        const outgoingLinks = connectedLinks.filter(l => l.source.id === d.id);
        const outgoingNodes = outgoingLinks.map(l => l.target.id);

        // Incoming (自分に入ってくる)
        const incomingLinks = connectedLinks.filter(l => l.target.id === d.id);
        const incomingNodes = incomingLinks.map(l => l.source.id);

        // リンクの強調
        link.filter(l => l.source.id === d.id)
            .style('opacity', 1)
            .attr('stroke', '#00ff00') // 緑
            .attr('marker-end', 'url(#arrow-outgoing)');

        link.filter(l => l.target.id === d.id)
            .style('opacity', 1)
            .attr('stroke', '#ff4500') // 赤
            .attr('marker-end', 'url(#arrow-incoming)');

        // 関連ノードの強調
        node.filter(n => outgoingNodes.includes(n.id))
            .style('opacity', 1)
            .select('circle')
            .attr('stroke', '#00ff00'); // 緑の枠線

        node.filter(n => incomingNodes.includes(n.id))
            .style('opacity', 1)
            .select('circle')
            .attr('stroke', '#ff4500'); // 赤の枠線

        // 関連ノードのテキストも表示
        node.filter(n => outgoingNodes.includes(n.id) || incomingNodes.includes(n.id))
            .select('text')
            .style('opacity', 1);

    }).on('mouseout', function (event, d) {
        // 元に戻す
        node.style('opacity', 1);
        link.style('opacity', 1)
            .attr('stroke', '#555')
            .attr('marker-end', 'url(#arrow)');
        text.style('opacity', 0.8)
            .style('font-size', '10px')
            .style('font-weight', 'normal')
            .style('fill', '#ccc');

        node.select('circle').attr('stroke', '#fff');
    });

    // クリックイベント
    node.on('click', (event, d) => {
        if (d.url) {
            window.open(d.url, '_blank');
        }
    });

    // シミュレーションの更新
    simulation.on('tick', () => {
        // リンクの座標更新 (直線ではなく曲線にする場合はここで調整)
        link.attr('d', d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            // 単純な直線
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        });

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // ズーム機能
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // ドラッグ関数
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
        const newWidth = container.offsetWidth;
        const newHeight = container.offsetHeight;
        svg.attr('width', newWidth).attr('height', newHeight);
        simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
        simulation.alpha(0.3).restart();
    });
}

// DOMの読み込み完了後にグラフを初期化
document.addEventListener('DOMContentLoaded', initializeGraph);
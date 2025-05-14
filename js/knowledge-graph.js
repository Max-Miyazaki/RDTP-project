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
            // 関連ページ
            { id: "2.1 The Necessity of the Field Viewpoint", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-1.html" },
            { id: "2.2 Elements of Classical Field Theory", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-2.html" },
            { id: "2.3 The Klein-Gordon Field as Harmonic Oscillators", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-3.html" },
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

        articles.forEach(article => {
            article.tags.forEach(tag => {
                links.push({
                    source: article.id,
                    target: tag,
                    value: 1
                });
            });
        });

        for (let i = 0; i < articles.length; i++) {
            for (let j = i + 1; j < articles.length; j++) {
                const commonTags = articles[i].tags.filter(tag => 
                    articles[j].tags.includes(tag)
                );
                if (commonTags.length > 0) {
                    links.push({
                        source: articles[i].id,
                        target: articles[j].id,
                        value: commonTags.length,
                        commonTags: commonTags
                    });
                }
            }
        }

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
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // ズーム用のコンテナを追加
    const g = svg.append('g');

    // インタラクション状態の管理
    let lastInteractionTime = Date.now();
    let isAnimating = false;
    let animationTimer = null;

    // シミュレーションの設定
    const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links)
            .id(d => d.id)
            .distance(d => d.commonTags ? 180 - d.commonTags.length * 20 : 180)
            .strength(0.7))
        .force('charge', d3.forceManyBody()
            .strength(d => d.id.startsWith('#') ? -100 : -200))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.3))
        .force('collision', d3.forceCollide().radius(30))
        .force('x', d3.forceX(width / 2).strength(0.06))
        .force('y', d3.forceY(height / 2).strength(0.06))
        .alpha(1)
        .alphaDecay(0.005);

    // リンクの描画
    const link = g.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .style('stroke', 'rgba(0, 255, 255, 0.6)')
        .style('stroke-width', d => d.commonTags ? d.commonTags.length * 1.5 : 1);

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
            switch(d.type) {
                case 'pdf': return '#00ffff'; // PDF資料
                case 'page': return '#ff00ff'; // 関連ページ
                default: return '#ffffff';
            }
        })
        .attr('stroke', d => d.id.startsWith('#') ? '#ffffff' : 'none')
        .attr('stroke-width', d => d.id.startsWith('#') ? 2 : 0)
        .on('click', (event, d) => {
            if (d.url) {
                window.open(d.url, '_blank');
            }
        });

    // ノードのラベルを追加
    node.append('text')
        .attr('dx', 12)
        .attr('dy', '.35em')
        .text(d => d.id)
        .style('font-size', d => d.id.startsWith('#') ? '10px' : '12px')
        .style('fill', d => d.id.startsWith('#') ? '#ffffff' : '#ffffff');

    // シミュレーションの更新
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // ズーム機能の設定
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            handleInteraction();
        });

    // SVGにズーム機能を適用
    svg.call(zoom);

    // 初期位置を中央に設定
    const initialScale = 0.8;
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initialScale)
        .translate(-width / 2, -height / 2));

    // アニメーション関連の関数
    function startAnimation() {
        if (isAnimating) return;
        isAnimating = true;

        // すべてのノードとリンクを一旦非表示にする
        node.style('opacity', 0);
        link.style('opacity', 0);

        // ノードを段階的に表示する
        let visibleNodes = new Set();
        let nodeIndex = 0;
        let centerNode = graphData.nodes[0];

        function showNextNode() {
            if (nodeIndex >= graphData.nodes.length || !isAnimating) {
                isAnimating = false;
                document.getElementById('startAnimation').textContent = 'アニメーション開始';
                return;
            }

            const currentNode = graphData.nodes[nodeIndex];
            visibleNodes.add(currentNode.id);

            // 現在のノードを表示
            node.filter(d => d.id === currentNode.id)
                .transition()
                .duration(500)
                .style('opacity', 1);

            // 関連するリンクを表示
            link.filter(d => 
                visibleNodes.has(d.source.id) && visibleNodes.has(d.target.id)
            )
            .transition()
            .duration(500)
            .style('opacity', 0.6); // リンクの不透明度を0.6に設定

            // ノードの位置を調整
            simulation.force('charge')
                .strength(d => visibleNodes.has(d.id) ? 
                    (d.id.startsWith('#') ? -100 : -200) : 0);

            simulation
                .alpha(0.3)
                .restart();

            nodeIndex++;
            setTimeout(showNextNode, 800);
        }

        showNextNode();
    }

    function stopAnimation() {
        isAnimating = false;
        // すべてのノードとリンクを表示
        node.transition().duration(500).style('opacity', 1);
        link.transition().duration(500).style('opacity', 0.6); // リンクの不透明度を0.6に設定
        
        simulation.force('charge')
            .strength(d => d.id.startsWith('#') ? -100 : -200);
        
        simulation
            .alpha(0.3)
            .restart();
    }

    // インタラクション検出とアニメーション制御
    function handleInteraction() {
        lastInteractionTime = Date.now();
        stopAnimation();
        
        if (animationTimer) {
            clearTimeout(animationTimer);
        }
        
        simulation
            .alpha(0.3)
            .restart();
        
        animationTimer = setTimeout(() => {
            startAnimation();
        }, 10000);
    }

    // ドラッグ関連の関数
    function dragstarted(event) {
        handleInteraction();
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        handleInteraction();
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        handleInteraction();
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // 各種イベントにインタラクション検出を追加
    svg.on('mousemove', handleInteraction)
       .on('touchmove', handleInteraction)
       .on('click', handleInteraction)
       .on('wheel', handleInteraction);

    // 初期アニメーションの開始
    handleInteraction();

    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', () => {
        const newWidth = container.offsetWidth;
        const newHeight = container.offsetHeight;
        
        svg.attr('width', newWidth)
           .attr('height', newHeight);
        
        simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
        handleInteraction();
    });

    // コントロールの初期化
    function initializeControls() {
        // トグルボタンの機能
        const toggleButton = document.getElementById('toggleControls');
        const controls = document.querySelector('.graph-controls');
        
        if (toggleButton && controls) {
            toggleButton.addEventListener('click', () => {
                const isVisible = controls.style.transform === 'translateY(0px)';
                controls.style.transform = isVisible ? 'translateY(calc(100% - 40px))' : 'translateY(0)';
            });
        }

        // 表示コントロール
        document.getElementById('showTags').addEventListener('change', e => {
            const tagNodes = node.filter(d => d.id.startsWith('#'));
            tagNodes.style('display', e.target.checked ? 'block' : 'none');
            // タグノードが非表示の場合、関連するリンクも非表示にする
            if (!e.target.checked) {
                const tagNodeIds = new Set(tagNodes.data().map(d => d.id));
                link.style('display', d => {
                    return (tagNodeIds.has(d.source.id) || tagNodeIds.has(d.target.id)) ? 'none' : 'block';
                });
                simulation.nodes(graphData.nodes.filter(n => !n.id.startsWith('#')));
                simulation.force('link').links(graphData.links.filter(l => 
                    !tagNodeIds.has(l.source.id) && !tagNodeIds.has(l.target.id)
                ));
            } else {
                link.style('display', 'block');
                simulation.nodes(graphData.nodes);
                simulation.force('link').links(graphData.links);
            }
            simulation.alpha(0.3).restart();
        });

        document.getElementById('showOrphans').addEventListener('change', e => {
            const orphanNodes = node.filter(d => !graphData.links.some(
                l => l.source.id === d.id || l.target.id === d.id
            ));
            orphanNodes.style('display', e.target.checked ? 'block' : 'none');
        });

        // 力の強さコントロール
        document.getElementById('centerForce').addEventListener('input', e => {
            const strength = parseFloat(e.target.value);
            simulation.force('center').strength(strength);
            simulation.force('x').strength(strength * 0.2);
            simulation.force('y').strength(strength * 0.2);
            simulation.alpha(0.3).restart();
        });

        document.getElementById('linkForce').addEventListener('input', e => {
            const strength = parseFloat(e.target.value);
            simulation.force('link').strength(strength);
            simulation.alpha(0.3).restart();
        });

        document.getElementById('linkDistance').addEventListener('input', e => {
            const distance = parseFloat(e.target.value);
            simulation.force('link').distance(d => {
                return d.commonTags ? distance - d.commonTags.length * 10 : distance;
            });
            simulation.alpha(0.3).restart();
        });

        // 表示設定コントロール
        document.getElementById('showArrows').addEventListener('change', e => {
            link.attr('marker-end', e.target.checked ? 'url(#arrow)' : null);
        });

        document.getElementById('nodeSize').addEventListener('input', e => {
            const size = parseFloat(e.target.value);
            node.selectAll('circle')
                .attr('r', d => d.id.startsWith('#') ? size * 0.75 : size);
        });

        document.getElementById('linkWidth').addEventListener('input', e => {
            const width = parseFloat(e.target.value);
            link.style('stroke-width', d => 
                d.commonTags ? width * d.commonTags.length : width
            );
        });

        // アニメーションボタン
        document.getElementById('startAnimation').addEventListener('click', () => {
            if (isAnimating) {
                stopAnimation();
                document.getElementById('startAnimation').textContent = 'アニメーション開始';
            } else {
                startAnimation();
                document.getElementById('startAnimation').textContent = 'アニメーション停止';
            }
        });
    }

    // 矢印マーカーの定義
    const defs = svg.append('defs');
    defs.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', 'rgba(0, 255, 255, 0.3)');

    // コントロールの初期化を呼び出し
    initializeControls();
}

// DOMの読み込み完了後にグラフを初期化
document.addEventListener('DOMContentLoaded', initializeGraph); 
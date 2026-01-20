// Three.jsを使用した3D知識グラフ
let scene, camera, renderer, controls;
let nodes = [];
let links = [];
let selectedNode = null;
let raycaster, mouse;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// タグの色を定義
const tagColors = {
    '#physics': 0x87CEEB,      // 物理学関連: スカイブルー
    '#quantum': 0xFF69B4,      // 量子力学関連: ホットピンク
    '#relativity': 0x4B0082,    // 相対性理論関連: インディゴ
    '#cosmology': 0x32CD32,     // 宇宙論関連: ライムグリーン
    '#mathematics': 0xFFD700,   // 数学関連: ゴールド
    '#quantum-field-theory': 0xFF00FF  // PeskinQFT関連: ピンク
};

// ノードのタイプ別の色
const nodeTypeColors = {
    'pdf': 0x00ffff,    // シアン
    'page': 0xff00ff,   // マゼンタ
    'tag': 0xffffff     // 白（タグの色はtagColorsから取得）
};

// グラフの初期化と描画を行う関数
function initializeGraph() {
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
            { id: "2.4 The Klein-Gordon Field in Space-Time", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft_sec2-4.html" },
            { id: "PeskinQFTまとめ", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "peskin-qft.html" },
            { id: "勉強の軌跡", group: 3, tags: ["#physics", "#quantum-field-theory"], type: "page", url: "study.html" },

            // タグ
            { id: "#physics", group: 2, type: "tag" },
            { id: "#quantum", group: 2, type: "tag" },
            { id: "#quantum-field-theory", group: 2, type: "tag" }
        ]
    };

    // タグに基づいてリンクを生成する関数
    function generateLinks(nodes) {
        const links = [];
        const articles = nodes.filter(node => node.tags);
        const tagNodes = nodes.filter(node => node.id.startsWith('#'));

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

    // Three.jsシーンの初期化
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // カメラの設定
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 0, 50);

    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // レイキャスターとマウスの設定
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // ノードの3Dオブジェクトを作成
    const nodeMap = new Map();
    graphData.nodes.forEach((nodeData, index) => {
        // ノードの位置を球面上に配置
        const radius = 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        nodeData.x = x;
        nodeData.y = y;
        nodeData.z = z;

        // ノードのサイズを決定
        let nodeSize = 1;
        if (nodeData.type === 'tag') {
            nodeSize = 0.8;
        } else if (nodeData.type === 'pdf') {
            nodeSize = 1.2;
        } else {
            nodeSize = 1.0;
        }

        // ノードの色を決定
        let nodeColor;
        if (nodeData.type === 'tag') {
            nodeColor = tagColors[nodeData.id] || 0xffffff;
        } else {
            nodeColor = nodeTypeColors[nodeData.type] || 0xffffff;
        }

        // 球体ジオメトリとマテリアル
        const geometry = new THREE.SphereGeometry(nodeSize, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: nodeColor,
            emissive: nodeColor,
            emissiveIntensity: 0.2,
            shininess: 100
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.userData = { nodeData: nodeData, originalColor: nodeColor };
        scene.add(sphere);

        // テキストラベル（スプライト）
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 64;
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#00ffff';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(nodeData.id, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, y + nodeSize + 1, z);
        sprite.scale.set(5, 0.625, 1);
        sprite.userData = { nodeData: nodeData };
        scene.add(sprite);

        nodeMap.set(nodeData.id, { sphere: sphere, sprite: sprite, nodeData: nodeData });
        nodes.push({ sphere: sphere, sprite: sprite, nodeData: nodeData });
    });

    // リンクの3D線を作成
    graphData.links.forEach(linkData => {
        const sourceNode = nodeMap.get(linkData.source);
        const targetNode = nodeMap.get(linkData.target);

        if (!sourceNode || !targetNode) return;

        const sourcePos = sourceNode.sphere.position;
        const targetPos = targetNode.sphere.position;

        // 線の色を決定
        let lineColor = 0x555555;
        if (linkData.type === 'tag') {
            lineColor = 0x00ffff;
        } else if (linkData.type === 'hierarchy') {
            lineColor = 0x00ff00;
        }

        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
            new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
        ]);

        const material = new THREE.LineBasicMaterial({
            color: lineColor,
            opacity: 0.5,
            transparent: true
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { linkData: linkData, sourceNode: sourceNode, targetNode: targetNode };
        scene.add(line);
        links.push(line);
    });

    // マウスイベント
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    let dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let dragOffset = new THREE.Vector3();
    let clickStartTime = 0;
    let clickStartPos = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (event) => {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        clickStartTime = Date.now();
        clickStartPos.x = event.clientX;
        clickStartPos.y = event.clientY;

        // レイキャスターでノードを選択
        mouse.x = (event.clientX / width) * 2 - 1;
        mouse.y = -(event.clientY / height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodes.map(n => n.sphere));

        if (intersects.length > 0) {
            selectedNode = intersects[0].object;
            isDragging = true;
            
            // ドラッグ平面を設定（カメラの向きに垂直な平面）
            const nodeObj = nodes.find(n => n.sphere === selectedNode);
            if (nodeObj) {
                const worldPosition = new THREE.Vector3();
                selectedNode.getWorldPosition(worldPosition);
                dragPlane.setFromNormalAndCoplanarPoint(
                    camera.getWorldDirection(new THREE.Vector3()),
                    worldPosition
                );
                
                // ドラッグオフセットを計算
                const intersectPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(dragPlane, intersectPoint);
                dragOffset.copy(worldPosition).sub(intersectPoint);
            }
        } else {
            isDragging = false;
        }
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (isDragging && selectedNode) {
            // ノードを移動
            mouse.x = (event.clientX / width) * 2 - 1;
            mouse.y = -(event.clientY / height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersectPoint = new THREE.Vector3();
            
            // ドラッグ平面との交点を計算
            if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
                // オフセットを適用
                intersectPoint.add(dragOffset);
                selectedNode.position.copy(intersectPoint);
                
                // スプライトも移動
                const nodeObj = nodes.find(n => n.sphere === selectedNode);
                if (nodeObj) {
                    const offset = selectedNode.geometry.parameters.radius + 1;
                    nodeObj.sprite.position.set(
                        intersectPoint.x,
                        intersectPoint.y + offset,
                        intersectPoint.z
                    );
                }

                // リンクを更新
                updateLinks();
            }
        } else if (isMouseDown && !isDragging) {
            // カメラを回転
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;

            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    });

    renderer.domElement.addEventListener('mouseup', (event) => {
        // ドラッグが終了したことを記録
        const wasDragging = isDragging;
        isMouseDown = false;
        isDragging = false;
        selectedNode = null;
        
        // ドラッグしていた場合は、クリックイベントを無効化するためのフラグを設定
        if (wasDragging) {
            clickStartTime = 0; // クリックイベントを無効化
        }
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isMouseDown = false;
        isDragging = false;
        selectedNode = null;
    });

    // スクロールでズーム
    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomSpeed = 0.1;
        const zoom = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
        camera.position.multiplyScalar(zoom);
        
        // 最小・最大距離の制限
        const distance = camera.position.length();
        if (distance < 10) camera.position.normalize().multiplyScalar(10);
        if (distance > 200) camera.position.normalize().multiplyScalar(200);
    });

    // クリックでノードを開く（ドラッグしていない場合のみ）
    renderer.domElement.addEventListener('click', (event) => {
        // ドラッグしていた場合はクリックイベントを無視
        const clickDuration = Date.now() - clickStartTime;
        const clickDistance = Math.sqrt(
            Math.pow(event.clientX - clickStartPos.x, 2) +
            Math.pow(event.clientY - clickStartPos.y, 2)
        );

        if (clickDuration > 200 || clickDistance > 5) {
            return;
        }

        mouse.x = (event.clientX / width) * 2 - 1;
        mouse.y = -(event.clientY / height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodes.map(n => n.sphere));

        if (intersects.length > 0) {
            const nodeData = intersects[0].object.userData.nodeData;
            if (nodeData.url) {
                window.open(nodeData.url, '_blank');
            }
        }
    });

    // リンクを更新する関数
    function updateLinks() {
        links.forEach(line => {
            const sourcePos = line.userData.sourceNode.sphere.position;
            const targetPos = line.userData.targetNode.sphere.position;

            line.geometry.setFromPoints([
                new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
                new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
            ]);
            line.geometry.attributes.position.needsUpdate = true;
        });
    }

    // アニメーションループ
    function animate() {
        requestAnimationFrame(animate);

        // カメラの回転をスムーズに
        currentRotationX += (targetRotationX - currentRotationX) * 0.05;
        currentRotationY += (targetRotationY - currentRotationY) * 0.05;

        if (!isDragging) {
            const radius = camera.position.length();
            camera.position.x = Math.sin(currentRotationY) * Math.cos(currentRotationX) * radius;
            camera.position.y = Math.sin(currentRotationX) * radius;
            camera.position.z = Math.cos(currentRotationY) * Math.cos(currentRotationX) * radius;
            camera.lookAt(0, 0, 0);
        }

        // ノードのアニメーション（ホバー効果など）
        nodes.forEach(node => {
            const time = Date.now() * 0.001;
            if (node.sphere !== selectedNode) {
                node.sphere.rotation.y += 0.01;
            }
        });

        renderer.render(scene, camera);
    }

    animate();

    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
        const newWidth = container.offsetWidth;
        const newHeight = container.offsetHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth, newHeight);
    });
}

// DOMの読み込み完了後にグラフを初期化
document.addEventListener('DOMContentLoaded', initializeGraph);

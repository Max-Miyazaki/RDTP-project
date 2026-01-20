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

    // コントロールパネルの要素を取得
    const showTagsCheckbox = document.getElementById('showTags');
    const showPDFsCheckbox = document.getElementById('showPDFs');
    const showOrphansCheckbox = document.getElementById('showOrphans');
    const showArrowsCheckbox = document.getElementById('showArrows');
    const nodeSizeSlider = document.getElementById('nodeSize');
    const linkWidthSlider = document.getElementById('linkWidth');
    const linkDistanceSlider = document.getElementById('linkDistance');
    const startAnimationButton = document.getElementById('startAnimation');
    const resetCameraButton = document.getElementById('resetCamera');
    const toggleControlsButton = document.getElementById('toggleControls');

    // コントロールパネルのトグル機能
    if (toggleControlsButton) {
        toggleControlsButton.addEventListener('click', () => {
            const controlPanel = document.querySelector('.graph-controls');
            if (controlPanel) {
                controlPanel.classList.toggle('expanded');
            }
        });
    }

    // ノードとリンクの参照を保持
    const nodeObjects = [];
    const linkObjects = [];
    let animationRunning = false;

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
        sphere.userData = { 
            nodeData: nodeData, 
            originalColor: nodeColor,
            originalSize: nodeSize,
            originalPosition: new THREE.Vector3(x, y, z)
        };
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

        const nodeObj = { sphere: sphere, sprite: sprite, nodeData: nodeData };
        nodeMap.set(nodeData.id, nodeObj);
        nodes.push(nodeObj);
        nodeObjects.push(nodeObj);
    });

    // リンクの3D曲線を作成
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

        // 曲線の制御点を計算（中間点を追加して緩やかな曲線を作成）
        const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(targetPos, sourcePos).normalize();
        const perpendicular = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0));
        if (perpendicular.length() < 0.1) {
            perpendicular = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(1, 0, 0));
        }
        perpendicular.normalize();
        
        // 曲線の高さを決定（距離に応じて調整）
        const distance = sourcePos.distanceTo(targetPos);
        const curveHeight = distance * 0.3; // 距離の30%を曲線の高さとする
        
        // 中間制御点を曲線の高さ分だけ上に移動
        const controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(curveHeight));

        // CatmullRom曲線を作成（3点で緩やかな曲線）
        const curve = new THREE.CatmullRomCurve3([
            sourcePos,
            controlPoint,
            targetPos
        ], false); // false = 開いた曲線

        // 曲線に沿って点を生成
        const points = curve.getPoints(50); // 50個の点で滑らかな曲線を作成

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: lineColor,
            opacity: 0.5,
            transparent: true
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { 
            linkData: linkData, 
            sourceNode: sourceNode, 
            targetNode: targetNode,
            originalColor: lineColor,
            originalWidth: 1.5,
            curve: curve // 曲線オブジェクトを保存（更新時に使用）
        };
        scene.add(line);
        links.push(line);
        linkObjects.push(line);
    });

    // ノードの表示/非表示を更新する関数
    function updateNodeVisibility() {
        const showTags = showTagsCheckbox ? showTagsCheckbox.checked : true;
        const showPDFs = showPDFsCheckbox ? showPDFsCheckbox.checked : true;
        const showOrphans = showOrphansCheckbox ? showOrphansCheckbox.checked : true;

        nodeObjects.forEach(nodeObj => {
            const nodeData = nodeObj.nodeData;
            let visible = true;

            // タイプ別の表示/非表示
            if (nodeData.type === 'tag' && !showTags) {
                visible = false;
            } else if (nodeData.type === 'pdf' && !showPDFs) {
                visible = false;
            } else {
                // オーファンチェック（接続されていないノード）
                const hasConnections = graphData.links.some(link => 
                    (typeof link.source === 'string' ? link.source : link.source.id) === nodeData.id ||
                    (typeof link.target === 'string' ? link.target : link.target.id) === nodeData.id
                );
                if (!hasConnections && !showOrphans && nodeData.type !== 'tag') {
                    visible = false;
                }
            }

            nodeObj.sphere.visible = visible;
            nodeObj.sprite.visible = visible;
        });

        // リンクの表示も更新
        updateLinkVisibility();
    }

    // リンクの表示/非表示を更新する関数
    function updateLinkVisibility() {
        linkObjects.forEach(line => {
            const sourceNode = line.userData.sourceNode;
            const targetNode = line.userData.targetNode;
            
            line.visible = sourceNode.sphere.visible && targetNode.sphere.visible;
        });
    }

    // ノードサイズを更新する関数
    function updateNodeSizes() {
        const sizeMultiplier = nodeSizeSlider ? parseFloat(nodeSizeSlider.value) / 8 : 1;

        nodeObjects.forEach(nodeObj => {
            const originalSize = nodeObj.sphere.userData.originalSize;
            const newSize = originalSize * sizeMultiplier;
            
            // 新しいジオメトリを作成
            const newGeometry = new THREE.SphereGeometry(newSize, 16, 16);
            nodeObj.sphere.geometry.dispose();
            nodeObj.sphere.geometry = newGeometry;

            // スプライトの位置も調整
            const offset = newSize + 1;
            nodeObj.sprite.position.y = nodeObj.sphere.position.y + offset;
        });
    }

    // リンクの太さを更新する関数
    function updateLinkWidths() {
        const widthValue = linkWidthSlider ? parseFloat(linkWidthSlider.value) : 1.5;
        const widthMultiplier = widthValue / 1.5;

        linkObjects.forEach(line => {
            // Three.jsではlinewidthはWebGLの制限があるため、代わりにマテリアルの不透明度と色の強度で表現
            const originalOpacity = 0.5;
            line.material.opacity = Math.min(originalOpacity * widthMultiplier, 1.0);
            
            // 色の強度も調整
            const color = line.material.color.clone();
            color.multiplyScalar(Math.min(widthMultiplier, 1.5));
            line.material.color = color;
            line.material.needsUpdate = true;
        });
    }

    // 矢印の表示/非表示を更新する関数
    function updateArrows() {
        const showArrows = showArrowsCheckbox ? showArrowsCheckbox.checked : false;
        
        // Three.jsで矢印を実装する場合は、ここで矢印オブジェクトを追加/削除
        // 現在は実装していないので、将来の拡張用にプレースホルダー
    }

    // コントロールパネルのイベントリスナーを設定
    if (showTagsCheckbox) {
        showTagsCheckbox.addEventListener('change', updateNodeVisibility);
    }
    if (showPDFsCheckbox) {
        showPDFsCheckbox.addEventListener('change', updateNodeVisibility);
    }
    if (showOrphansCheckbox) {
        showOrphansCheckbox.addEventListener('change', updateNodeVisibility);
    }
    if (showArrowsCheckbox) {
        showArrowsCheckbox.addEventListener('change', updateArrows);
    }
    if (nodeSizeSlider) {
        nodeSizeSlider.addEventListener('input', updateNodeSizes);
    }
    if (linkWidthSlider) {
        linkWidthSlider.addEventListener('input', updateLinkWidths);
    }
    if (linkDistanceSlider) {
        // リンクの距離変更時にアニメーション中のノード位置を更新
        linkDistanceSlider.addEventListener('input', () => {
            // アニメーション中の場合、即座に反映される
        });
    }

    // アニメーション機能
    if (startAnimationButton) {
        startAnimationButton.addEventListener('click', () => {
            animationRunning = !animationRunning;
            startAnimationButton.textContent = animationRunning ? 'アニメーション停止' : 'アニメーション開始';
        });
    }

    // カメラリセット機能
    if (resetCameraButton) {
        resetCameraButton.addEventListener('click', () => {
            // 回転角度をリセット
            targetRotationX = 0;
            targetRotationY = 0;
            currentRotationX = 0;
            currentRotationY = 0;
            
            // パンオフセットをリセット
            panOffset.set(0, 0, 0);
            
            // カメラの距離をリセット
            cameraRadius = 50;
        });
    }

    // 初期状態でノードの表示を更新
    updateNodeVisibility();
    updateNodeSizes();
    updateLinkWidths();

    // マウスイベント
    let isMouseDown = false;
    let isPanning = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    let cameraRadius = 50; // カメラの基準距離を保持
    let panStart = new THREE.Vector2();
    let panOffset = new THREE.Vector3();
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

        // 右クリックまたは中ボタン、またはShiftキーを押しながらの場合はパン操作
        if (event.button === 2 || event.button === 1 || event.shiftKey) {
            isPanning = true;
            panStart.set(event.clientX, event.clientY);
            // パンオフセットは累積するため、リセットしない
            return;
        }

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
        if (isPanning) {
            // パン操作：カメラを並行移動
            const deltaX = event.clientX - panStart.x;
            const deltaY = event.clientY - panStart.y;
            
            // カメラの向きに基づいて移動方向を計算
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            
            // カメラの右方向と上方向を取得
            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(cameraDirection, camera.up).normalize();
            const cameraUp = camera.up.clone();

            // 移動量を計算（距離に応じてスケール調整）
            const panSpeed = cameraRadius * 0.001;
            
            // パンオフセットを更新
            panOffset.add(cameraRight.multiplyScalar(-deltaX * panSpeed));
            panOffset.add(cameraUp.multiplyScalar(deltaY * panSpeed));
            
            panStart.set(event.clientX, event.clientY);
        } else if (isDragging && selectedNode) {
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
            // Shiftキーを押しながらの場合はパン操作
            if (event.shiftKey) {
                if (!isPanning) {
                    isPanning = true;
                    panStart.set(event.clientX, event.clientY);
                }
                
                const deltaX = event.clientX - panStart.x;
                const deltaY = event.clientY - panStart.y;
                
                const cameraDirection = new THREE.Vector3();
                camera.getWorldDirection(cameraDirection);
                
                const cameraRight = new THREE.Vector3();
                cameraRight.crossVectors(cameraDirection, camera.up).normalize();
                const cameraUp = camera.up.clone();
                
                const panSpeed = cameraRadius * 0.001;
                
                // パンオフセットを累積的に更新
                panOffset.add(cameraRight.multiplyScalar(-deltaX * panSpeed));
                panOffset.add(cameraUp.multiplyScalar(deltaY * panSpeed));
                
                // パン開始位置を更新（連続的な操作のため）
                panStart.set(event.clientX, event.clientY);
            } else {
                // カメラを回転
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;

                targetRotationY += deltaX * 0.01;
                // 下にドラッグしたら下回転、上にドラッグしたら上回転（符号を反転）
                targetRotationX -= deltaY * 0.01;
                
                // 上下の回転を0からπの範囲に制限
                const maxRotationX = Math.PI - 0.01;
                const minRotationX = 0.01;
                if (targetRotationX > maxRotationX) targetRotationX = maxRotationX;
                if (targetRotationX < minRotationX) targetRotationX = minRotationX;
                
                mouseX = event.clientX;
                mouseY = event.clientY;
            }
        }
    });

    renderer.domElement.addEventListener('mouseup', (event) => {
        // ドラッグが終了したことを記録
        const wasDragging = isDragging;
        const wasPanning = isPanning;
        isMouseDown = false;
        isDragging = false;
        isPanning = false;
        selectedNode = null;
        
        // ドラッグしていた場合は、クリックイベントを無効化するためのフラグを設定
        if (wasDragging || wasPanning) {
            clickStartTime = 0; // クリックイベントを無効化
        }
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isMouseDown = false;
        isDragging = false;
        isPanning = false;
        selectedNode = null;
    });

    // 右クリックメニューを無効化
    renderer.domElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // スクロールでズーム
    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomSpeed = 0.1;
        const zoom = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
        
        // 基準距離を更新
        cameraRadius *= zoom;
        
        // 最小・最大距離の制限
        if (cameraRadius < 10) cameraRadius = 10;
        if (cameraRadius > 200) cameraRadius = 200;
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

    // リンクを更新する関数（曲線を再計算）
    function updateLinks() {
        links.forEach(line => {
            const sourcePos = line.userData.sourceNode.sphere.position;
            const targetPos = line.userData.targetNode.sphere.position;

            // 曲線の制御点を再計算
            const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
            const direction = new THREE.Vector3().subVectors(targetPos, sourcePos).normalize();
            const perpendicular = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0));
            if (perpendicular.length() < 0.1) {
                perpendicular = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(1, 0, 0));
            }
            perpendicular.normalize();
            
            // 曲線の高さを決定（距離に応じて調整）
            const distance = sourcePos.distanceTo(targetPos);
            const curveHeight = distance * 0.3; // 距離の30%を曲線の高さとする
            
            // 中間制御点を曲線の高さ分だけ上に移動
            const controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(curveHeight));

            // CatmullRom曲線を作成
            const curve = new THREE.CatmullRomCurve3([
                sourcePos,
                controlPoint,
                targetPos
            ], false);

            // 曲線に沿って点を生成
            const points = curve.getPoints(50);

            // ジオメトリを更新
            line.geometry.dispose();
            line.geometry = new THREE.BufferGeometry().setFromPoints(points);
            line.userData.curve = curve; // 曲線オブジェクトを更新
        });
    }

    // アニメーションループ
    function animate() {
        requestAnimationFrame(animate);

        // カメラの回転をスムーズに（上下の回転をより滑らかに）
        const rotationSmoothingX = 0.08; // 上下の回転をより滑らかに
        const rotationSmoothingY = 0.05; // 横の回転
        currentRotationX += (targetRotationX - currentRotationX) * rotationSmoothingX;
        currentRotationY += (targetRotationY - currentRotationY) * rotationSmoothingY;

        // カメラの位置を更新（基準距離を使用して半径を維持）
        // 3次元球座標系でカメラの位置を計算
        // 極角（polar angle）φ: 0からπまで（上下の回転）
        // 方位角（azimuth）θ: 0から2πまで（横の回転）
        // 球座標から直交座標への変換:
        // x = r * sin(φ) * cos(θ)
        // y = r * cos(φ)
        // z = r * sin(φ) * sin(θ)
        
        // 上下の回転を0からπの範囲に制限
        const maxRotationX = Math.PI - 0.01;
        const minRotationX = 0.01;
        if (currentRotationX > maxRotationX) currentRotationX = maxRotationX;
        if (currentRotationX < minRotationX) currentRotationX = minRotationX;
        
        // 3次元球座標系でカメラの位置を計算
        // 極角（polar angle）φ: 0からπまで（上下の回転）
        // 方位角（azimuth）θ: 0から2πまで（横の回転）
        const phi = currentRotationX; // 極角（上下の回転、0からπの範囲）
        let theta = currentRotationY % (2 * Math.PI); // 方位角（横の回転）
        if (theta < 0) theta += 2 * Math.PI;
        
        // 球座標から直交座標への変換
        const basePosition = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * cameraRadius,
            Math.cos(phi) * cameraRadius,
            Math.sin(phi) * Math.sin(theta) * cameraRadius
        );
        
        // パンオフセットを適用
        camera.position.copy(basePosition).add(panOffset);
        // カメラはパンオフセット後の中心点（シーンの中心）を見る
        camera.lookAt(panOffset);

        // ノードのアニメーション
        if (animationRunning) {
            const centerForce = 0.5; // 固定値
            const linkForce = 1; // 固定値
            const linkDistance = linkDistanceSlider ? parseFloat(linkDistanceSlider.value) : 100;

            // 中心への引力を適用
            nodeObjects.forEach(nodeObj => {
                if (nodeObj.sphere === selectedNode || !nodeObj.sphere.visible) return;

                const position = nodeObj.sphere.position;
                const distanceFromCenter = position.length();
                
                if (distanceFromCenter > 0) {
                    const centerDirection = position.clone().normalize().multiplyScalar(-1);
                    
                    // 中心力による移動
                    const centerPull = centerDirection.multiplyScalar(centerForce * 0.01);
                    position.add(centerPull);
                }

                // リンクによる力
                linkObjects.forEach(line => {
                    if (!line.visible) return;
                    
                    const sourceNode = line.userData.sourceNode;
                    const targetNode = line.userData.targetNode;
                    
                    if (sourceNode === nodeObj || targetNode === nodeObj) {
                        const otherNode = sourceNode === nodeObj ? targetNode : sourceNode;
                        if (otherNode.sphere === selectedNode || !otherNode.sphere.visible) return;
                        
                        const otherPos = otherNode.sphere.position;
                        const direction = position.clone().sub(otherPos);
                        const currentDistance = direction.length();
                        
                        if (currentDistance > 0) {
                            const targetDistance = linkDistance / 10; // スケール調整
                            const force = (currentDistance - targetDistance) * linkForce * 0.001;
                            direction.normalize().multiplyScalar(force);
                            
                            if (sourceNode === nodeObj) {
                                position.sub(direction);
                            } else {
                                position.add(direction);
                            }
                        }
                    }
                });

                // スプライトの位置も更新
                const offset = nodeObj.sphere.geometry.parameters.radius + 1;
                nodeObj.sprite.position.set(
                    position.x,
                    position.y + offset,
                    position.z
                );
            });

            // リンクを更新
            updateLinks();
        } else {
            // 通常の回転アニメーション
            nodeObjects.forEach(nodeObj => {
                if (nodeObj.sphere !== selectedNode && nodeObj.sphere.visible) {
                    nodeObj.sphere.rotation.y += 0.01;
                }
            });
        }

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

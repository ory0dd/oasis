import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Play, Pause, Compass, Eye, Sparkles, Layers, Maximize2 } from 'lucide-react';

// Clinical 6-Pillar Canonical Color Palette
const ROLE_COLORS = {
    context: 0xffffff,       // White glowing hub
    historical: 0xe2e8f0,    // Muted ice
    social: 0x94a3b8,        // Cool slate
    antecedent: 0x10b981,    // Emerald
    cognitive: 0x38bdf8,     // Sky cyan
    physiological: 0xa855f7, // Amethyst violet
    biological: 0xc084fc,    // Soft purple
    motor: 0xf59e0b,         // Amber
    consequence: 0xf43f5e,   // Rose red
    function: 0xa855f7       // Royal purple
};

const STAGE_X_CENTERS = [-460, -280, -90, 100, 290, 470];

export default function AfcNetwork3D({
    nodes = [],
    edges = [],
    selectedNode = null,
    onSelectNode = () => {},
    focusedStageIndex = null,
    onStageSelect = () => {},
    onClose3D = () => {}
}) {
    const mountRef = useRef(null);
    const [autoRotate, setAutoRotate] = useState(true);
    const [viewPreset, setViewPreset] = useState('perspective'); // 'perspective', 'front', 'top'
    const [hoveredNode, setHoveredNode] = useState(null);

    // Refs for Three.js internals
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameRef = useRef(null);
    const nodeMeshesRef = useRef(new Map());
    const nodeDataRef = useRef(new Map());
    const edgeLinesRef = useRef([]);
    const particlesRef = useRef([]);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2(-999, -999));

    // Convert 2D nodes into balanced 3D coordinate space with real depth & vanishing points
    const nodes3D = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        return nodes.map((node, idx) => {
            let role = (node.clinical_role || node.type || 'cognitive').toLowerCase();
            if (role === 'historical' || role === 'social') role = 'context';
            if (role === 'biological') role = 'physiological';

            // Determine X stage placement (-500 to +500)
            let stageIdx = 2;
            if (role === 'context') stageIdx = 0;
            else if (role === 'antecedent') stageIdx = 1;
            else if (role === 'cognitive' || role === 'physiological') stageIdx = 2;
            else if (role === 'motor') stageIdx = 3;
            else if (role === 'consequence') stageIdx = 4;
            else if (role === 'function') stageIdx = 5;

            const baseX = STAGE_X_CENTERS[stageIdx] || 0;
            // Spread nodes around the stage center using node's 2D position or index
            const offsetX = ((node.x != null ? (node.x % 15) - 7.5 : ((idx % 7) - 3.5)) * 14);
            const x = baseX + offsetX;

            // Y elevation: cognitive higher, somatic lower, consequences fanning
            let baseY = 0;
            if (role === 'cognitive') baseY = 70 + (idx % 4) * 25;
            else if (role === 'physiological') baseY = -80 - (idx % 4) * 25;
            else if (role === 'motor') baseY = -20 + ((idx % 5) - 2) * 35;
            else if (role === 'antecedent') baseY = 20 + ((idx % 6) - 3) * 30;
            else if (role === 'context') baseY = ((idx % 7) - 3) * 38;
            else baseY = ((idx % 5) - 2) * 30;

            const normY = node.y != null ? ((50 - node.y) * 4) : 0;
            const y = (baseY * 0.5) + (normY * 0.7);

            // Z depth (True 3D layer): context deep in background, acute triggers forward
            let z = 0;
            if (role === 'context') {
                z = -120 - ((idx % 5) * 20); // deep past memories in background
            } else if (role === 'antecedent') {
                z = 60 + ((idx % 4) * 25);   // immediate triggers float forward
            } else if (role === 'physiological') {
                z = 40 + ((idx % 3) * 30);   // somatic sensations close to viewer
            } else if (role === 'cognitive') {
                z = -30 + ((idx % 5) * 22);  // thoughts layered in intermediate space
            } else if (role === 'motor') {
                z = 20 + ((idx % 4) * 20);
            } else if (role === 'consequence') {
                z = -40 + ((idx % 4) * 25);
            } else {
                z = -10 + ((idx % 3) * 15);
            }

            // Central Island Hubs form focal gravitational centers
            const isHub = Boolean(node.is_island_hub);
            if (isHub) {
                z = role === 'context' ? -60 : 20;
            }

            const colorHex = ROLE_COLORS[role] || 0x38bdf8;

            return {
                ...node,
                pos3D: new THREE.Vector3(x, y, z),
                colorHex,
                role,
                isHub
            };
        });
    }, [nodes]);

    // Canvas Texture generator for sharp high-contrast text billboards
    const createTextSprite = (text, colorHex, isHub) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background pill
        ctx.fillStyle = 'rgba(6, 8, 14, 0.75)';
        ctx.beginPath();
        ctx.roundRect(16, 24, 480, 80, 24);
        ctx.fill();

        ctx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}55`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = isHub ? 'bold 34px monospace' : 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let label = text || '';
        if (label.length > 24) label = label.substring(0, 22) + '...';
        ctx.fillText(label, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.92,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(65, 16.25, 1);
        return sprite;
    };

    // Initialize Three.js WebGL Scene
    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // 1. Scene & Cosmic Atmospheric Fog
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x030408);
        scene.fog = new THREE.FogExp2(0x030408, 0.00065);
        sceneRef.current = scene;

        // 2. Camera
        const camera = new THREE.PerspectiveCamera(52, width / height, 1, 4000);
        camera.position.set(0, 120, 680);
        cameraRef.current = camera;

        // 3. Renderer with antialiasing
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.rotateSpeed = 0.75;
        controls.zoomSpeed = 0.95;
        controls.minDistance = 90;
        controls.maxDistance = 1600;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.35;
        controls.target.set(0, 0, 0);
        controlsRef.current = controls;

        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0x27273a, 1.8);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(200, 400, 300);
        scene.add(dirLight);

        const pointLight1 = new THREE.PointLight(0x10b981, 2.5, 600);
        pointLight1.position.set(-280, 40, 80);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xa855f7, 2.5, 600);
        pointLight2.position.set(280, -20, 60);
        scene.add(pointLight2);

        // 6. Deep Cosmic Background Starfield (1,200 twinkling stars)
        const starsGeo = new THREE.BufferGeometry();
        const starCount = 1200;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 2400;
            starPos[i + 1] = (Math.random() - 0.5) * 1600;
            starPos[i + 2] = (Math.random() - 0.5) * 2200 - 200;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starsMat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 2.2,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending
        });
        const starField = new THREE.Points(starsGeo, starsMat);
        scene.add(starField);

        // Resize Listener
        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // Animation Loop
        let clock = new THREE.Clock();
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            if (controlsRef.current) {
                controlsRef.current.update();
            }

            // Pulse glowing materials
            nodeMeshesRef.current.forEach((mesh, id) => {
                const data = nodeDataRef.current.get(id);
                if (data && data.isHub && mesh.material) {
                    const pulse = 1 + Math.sin(time * 2.5 + (data.pos3D.x * 0.01)) * 0.12;
                    mesh.scale.set(pulse, pulse, pulse);
                }
            });

            // Animate travelling energy pulses along edges
            particlesRef.current.forEach(p => {
                p.progress = (p.progress + p.speed * delta) % 1;
                const currentPos = new THREE.Vector3().lerpVectors(p.start, p.end, p.progress);
                p.mesh.position.copy(currentPos);
            });

            // Raycasting for interactive hover
            if (cameraRef.current && sceneRef.current) {
                raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
                const interactables = Array.from(nodeMeshesRef.current.values());
                const intersects = raycasterRef.current.intersectObjects(interactables, false);

                if (intersects.length > 0) {
                    const hit = intersects[0].object;
                    const hitId = hit.userData?.id;
                    const hitData = nodeDataRef.current.get(hitId);
                    if (hitData && (!hoveredNode || hoveredNode.id !== hitId)) {
                        setHoveredNode(hitData);
                        container.style.cursor = 'pointer';
                    }
                } else if (hoveredNode) {
                    setHoveredNode(null);
                    container.style.cursor = 'default';
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        // Mouse move listener for raycaster
        const onMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };

        // Click listener for node selection
        const onClick = (e) => {
            if (e.target !== renderer.domElement) return;
            const rect = container.getBoundingClientRect();
            const clickMouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            raycasterRef.current.setFromCamera(clickMouse, camera);
            const interactables = Array.from(nodeMeshesRef.current.values());
            const intersects = raycasterRef.current.intersectObjects(interactables, false);

            if (intersects.length > 0) {
                const hit = intersects[0].object;
                const hitId = hit.userData?.id;
                const hitData = nodeDataRef.current.get(hitId);
                if (hitData) {
                    onSelectNode(hitData);
                    // Smoothly focus camera target on clicked node
                    controls.target.copy(hitData.pos3D);
                }
            }
        };

        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('click', onClick);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('mousemove', onMouseMove);
            container.removeEventListener('click', onClick);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (controls) controls.dispose();
            if (renderer) {
                renderer.dispose();
                if (container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement);
                }
            }
        };
    }, []);

    // Update Auto-Rotate setting in OrbitControls
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = autoRotate;
        }
    }, [autoRotate]);

    // Build & Sync 3D Nodes and Edges whenever nodes3D or edges change
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || nodes3D.length === 0) return;

        // Clean previous node meshes & edges
        nodeMeshesRef.current.forEach(mesh => scene.remove(mesh));
        nodeMeshesRef.current.clear();
        nodeDataRef.current.clear();

        edgeLinesRef.current.forEach(line => scene.remove(line));
        edgeLinesRef.current = [];

        particlesRef.current.forEach(p => scene.remove(p.mesh));
        particlesRef.current = [];

        // Geometries
        const hubGeo = new THREE.SphereGeometry(14, 32, 32);
        const normalGeo = new THREE.SphereGeometry(8.5, 24, 24);
        const particleGeo = new THREE.SphereGeometry(2, 12, 12);

        // 1. Create Node Meshes & Billboard Labels
        nodes3D.forEach(node => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const isFocusedStage = focusedStageIndex !== null && (() => {
                const role = node.role;
                if (focusedStageIndex === 0 && role === 'context') return true;
                if (focusedStageIndex === 1 && role === 'antecedent') return true;
                if (focusedStageIndex === 2 && (role === 'cognitive' || role === 'physiological')) return true;
                if (focusedStageIndex === 3 && role === 'motor') return true;
                if (focusedStageIndex === 4 && role === 'consequence') return true;
                if (focusedStageIndex === 5 && role === 'function') return true;
                return false;
            })();

            const geo = node.isHub ? hubGeo : normalGeo;
            const mat = new THREE.MeshStandardMaterial({
                color: node.colorHex,
                emissive: node.colorHex,
                emissiveIntensity: isSelected ? 1.8 : (node.isHub ? 1.1 : 0.65),
                roughness: 0.25,
                metalness: 0.6
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(node.pos3D);
            mesh.userData = { id: node.id };

            // Outer Halo Ring for Hubs
            if (node.isHub || isSelected) {
                const ringGeo = new THREE.RingGeometry(16, 18.5, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: node.colorHex,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: isSelected ? 0.9 : 0.5,
                    blending: THREE.AdditiveBlending
                });
                const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                mesh.add(ringMesh);
            }

            // High-contrast floating billboard label
            const labelSprite = createTextSprite(node.label, node.colorHex, node.isHub);
            labelSprite.position.set(0, node.isHub ? 24 : 16, 0);
            mesh.add(labelSprite);

            scene.add(mesh);
            nodeMeshesRef.current.set(node.id, mesh);
            nodeDataRef.current.set(node.id, node);
        });

        // 2. Create 3D Glowing Curves / Lines & Energy Particles
        const nodeMap = new Map(nodes3D.map(n => [n.id, n]));
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            blending: THREE.AdditiveBlending
        });

        edges.forEach((edge, i) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return;

            const isEdgeConnectedToSelected = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);

            // Subtle curved line in 3D
            const mid = new THREE.Vector3().addVectors(src.pos3D, tgt.pos3D).multiplyScalar(0.5);
            // Arch the curve slightly along depth or elevation
            mid.y += (i % 3 === 0 ? 12 : -8);
            mid.z += (i % 2 === 0 ? 15 : -15);

            const curve = new THREE.QuadraticBezierCurve3(src.pos3D, mid, tgt.pos3D);
            const points = curve.getPoints(24);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

            const lineColor = isEdgeConnectedToSelected
                ? (selectedNode.id === src.id ? 0xf43f5e : 0x38bdf8)
                : 0x475569;

            const lineMat = new THREE.LineBasicMaterial({
                color: lineColor,
                transparent: true,
                opacity: selectedNode ? (isEdgeConnectedToSelected ? 0.95 : 0.12) : 0.42,
                blending: THREE.AdditiveBlending
            });

            const line = new THREE.Line(lineGeo, lineMat);
            scene.add(line);
            edgeLinesRef.current.push(line);

            // Add animated particle for functional loops
            if (i % 2 === 0 || isEdgeConnectedToSelected) {
                const pMesh = new THREE.Mesh(particleGeo, particleMat);
                scene.add(pMesh);
                particlesRef.current.push({
                    mesh: pMesh,
                    start: src.pos3D,
                    end: tgt.pos3D,
                    progress: (i * 0.15) % 1,
                    speed: 0.18 + Math.random() * 0.1
                });
            }
        });

    }, [nodes3D, edges, selectedNode, focusedStageIndex]);

    // Camera Presets Smooth Fly
    const setPreset = (type) => {
        setViewPreset(type);
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        controls.target.set(0, 0, 0);
        if (type === 'front') {
            camera.position.set(0, 0, 750);
        } else if (type === 'top') {
            camera.position.set(0, 850, 10);
        } else {
            // perspective
            camera.position.set(160, 180, 640);
        }
        controls.update();
    };

    return (
        <div className="absolute inset-0 z-10 w-full h-full overflow-hidden bg-[#030408]">
            {/* 3D WebGL Canvas Mount Container */}
            <div ref={mountRef} className="w-full h-full" />

            {/* Top Left Title & Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 pointer-events-auto">
                <div className="px-3.5 py-1.5 rounded-full bg-zinc-950/80 border border-emerald-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wider uppercase text-white font-mono">
                        Red Conductual 3D Cosmos
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">
                        WebGL
                    </span>
                </div>
            </div>

            {/* Top Right 3D Orbit Camera Controls HUD */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
                {/* Auto Rotate Toggle */}
                <button
                    onClick={() => setAutoRotate(prev => !prev)}
                    className={`px-3 py-1.5 rounded-xl border backdrop-blur-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 shadow-lg ${autoRotate ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'}`}
                    title={autoRotate ? "Pausar órbita automática" : "Activar órbita cinemática"}
                >
                    {autoRotate ? <Pause size={12} /> : <Play size={12} />}
                    <span className="hidden sm:inline">{autoRotate ? 'Órbita Activa' : 'Pausada'}</span>
                </button>

                {/* Perspective Preset Buttons */}
                <div className="flex items-center p-1 rounded-xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl shadow-lg">
                    <button
                        onClick={() => setPreset('perspective')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${viewPreset === 'perspective' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                        title="Perspectiva Libre 3D"
                    >
                        3D
                    </button>
                    <button
                        onClick={() => setPreset('front')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${viewPreset === 'front' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                        title="Vista Frontal (E-O-R-C)"
                    >
                        Frontal
                    </button>
                    <button
                        onClick={() => setPreset('top')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${viewPreset === 'top' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                        title="Vista Superior"
                    >
                        Superior
                    </button>
                </div>

                {/* Reset Camera Center */}
                <button
                    onClick={() => setPreset('perspective')}
                    className="p-2 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur-xl transition-all shadow-lg"
                    title="Centrar Cámara"
                >
                    <RotateCcw size={14} />
                </button>

                {/* Close / Return to 2D */}
                <button
                    onClick={onClose3D}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/15 text-white hover:bg-white/15 backdrop-blur-xl text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-1.5"
                    title="Regresar a Vista 2D"
                >
                    <Eye size={13} />
                    <span>Volver a 2D</span>
                </button>
            </div>

            {/* Hover Tooltip HUD */}
            {hoveredNode && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2 rounded-2xl bg-zinc-950/90 border border-emerald-500/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in-95 duration-200 max-w-sm text-center">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                        {hoveredNode.role || 'Nodo Clínico'} {hoveredNode.isHub ? '• Núcleo Central' : ''}
                    </div>
                    <div className="text-sm font-bold text-white tracking-wide mt-0.5">
                        {hoveredNode.label}
                    </div>
                    {hoveredNode.description && (
                        <div className="text-[11px] text-zinc-400 font-sans line-clamp-2 mt-1">
                            {hoveredNode.description}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom 3D Guide instructions */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
                <span className="text-[10.5px] font-mono text-zinc-500 bg-zinc-950/70 border border-white/5 px-3 py-1 rounded-full backdrop-blur-md">
                    Arrastra para orbitar en 3D • Rueda para zoom • Clic en nodo para inspeccionar
                </span>
            </div>
        </div>
    );
}

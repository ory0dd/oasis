import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
    RotateCcw, Play, Pause, Eye, Sparkles, Layers, 
    Maximize2, Move, ArrowUpDown, ChevronUp, ChevronDown, 
    Compass, X, Box, Info, HelpCircle
} from 'lucide-react';

// World Coordinate Scaling: maps 2D percentage coordinates [0, 100] to 3D Three.js units
const WORLD_SCALE_X = 14.5; // (x - 50) * 14.5 => [-725, +725]
const WORLD_SCALE_Y = 10.5; // (50 - y) * 10.5 => [-525, +525]
const WORLD_SCALE_Z = 1.0;

// Obsidian Graph Canonical 3-Pillar Palette
const COLOR_HUB = 0xffffff;        // Radiant White (Central Island Hub)
const COLOR_CONDITION = 0x10b981;  // Emerald Green (Antecedent / Trigger)
const COLOR_SATELLITE = 0x94a3b8;  // Cool Slate (Standard Node)
const COLOR_FEEDBACK = 0xc084fc;   // Electric Amethyst (Feedback Loop)
const COLOR_SELECTED = 0x38bdf8;   // Sky Cyan (Selected Highlight)

export default function AfcNetwork3D({
    nodes = [],
    edges = [],
    selectedNode = null,
    onSelectNode = () => {},
    onUpdateNodePosition = () => {},
    onUpdateNodeZ = () => {},
    focusedStageIndex = null,
    onStageSelect = () => {},
    onClose3D = () => {},
    getNodeElevation = null
}) {
    const mountRef = useRef(null);
    const [autoRotate, setAutoRotate] = useState(false);
    const [viewPreset, setViewPreset] = useState('perspective'); // 'perspective', 'front', 'top', 'side'
    const [dragMode, setDragMode] = useState('plane'); // 'plane' (XY) or 'depth' (Z)
    const [hoveredNode, setHoveredNode] = useState(null);
    const [activeZDragNode, setActiveZDragNode] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    // Refs for Three.js engine
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Dynamic objects storage
    const nodeMeshesRef = useRef(new Map());      // id -> THREE.Group
    const nodeSpheresRef = useRef(new Map());     // id -> THREE.Mesh
    const nodeHalosRef = useRef(new Map());       // id -> THREE.Mesh (halo ring facing camera)
    const nodePillarsRef = useRef(new Map());     // id -> THREE.Line
    const nodeDataRef = useRef(new Map());        // id -> transformed node data
    const edgeObjectsRef = useRef([]);            // array of { beamMesh, cone, particle, srcId, tgtId, isFeedback }
    const particlesRef = useRef([]);              // traveling energy pulses

    // Shared Geometries to optimize memory and performance
    const sharedGeosRef = useRef({
        hub: new THREE.SphereGeometry(12, 32, 32),
        cond: new THREE.SphereGeometry(8, 24, 24),
        norm: new THREE.SphereGeometry(6.2, 24, 24),
        beam: new THREE.CylinderGeometry(1.2, 1.2, 1, 8),
        cone: new THREE.ConeGeometry(3.5, 9, 12),
        particle: new THREE.SphereGeometry(2.2, 12, 12)
    });

    // Raycasting & Interaction Refs
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2(-999, -999));
    const isDraggingNodeRef = useRef(false);
    const draggedNodeIdRef = useRef(null);
    const isShiftKeyRef = useRef(false);
    const dragPlaneRef = useRef(new THREE.Plane());
    const dragIntersectionRef = useRef(new THREE.Vector3());
    const dragStartMousePosRef = useRef({ x: 0, y: 0 });
    const dragStartNodePosRef = useRef(new THREE.Vector3());

    // Default depth elevation based on clinical role
    const getDefaultElevation = useCallback((node) => {
        if (node.z !== undefined && node.z !== null) return Number(node.z);
        if (getNodeElevation) {
            const calculated = getNodeElevation(node, edges);
            if (calculated !== undefined && calculated !== null) return calculated;
        }
        const role = (node.clinical_role || node.type || '').toLowerCase();
        if (node.is_island_hub) return 55;
        if (role === 'antecedent' || (node.id && node.id.includes('cond'))) return 45;
        if (role === 'cognitive') return 35;
        if (role === 'physiological') return 25;
        if (role === 'motor') return -15;
        if (role === 'consequence') return -30;
        if (role === 'context' || role === 'historical') return -45;
        return 10;
    }, [edges, getNodeElevation]);

    // Convert 2D nodes into precise 3D space maintaining 100% 2D Obsidian graph topology
    const nodes3D = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        const degreeMap = new Map();
        edges.forEach(e => {
            degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
            degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
        });

        return nodes.map(node => {
            const deg = degreeMap.get(node.id) || 0;
            const isHub = Boolean(node.is_island_hub || deg >= 4);
            const isCondition = Boolean(!isHub && (
                node.type === 'antecedent' || 
                node.clinical_role === 'antecedent' || 
                (node.id && node.id.includes('cond'))
            ));

            const rawX = node.x != null ? Number(node.x) : 50;
            const rawY = node.y != null ? Number(node.y) : 50;
            const rawZ = getDefaultElevation(node);

            // Exact 2D obsidian plane projection
            const posX = (rawX - 50) * WORLD_SCALE_X;
            const posY = (50 - rawY) * WORLD_SCALE_Y;
            const posZ = rawZ * WORLD_SCALE_Z;

            const colorHex = isHub ? COLOR_HUB : (isCondition ? COLOR_CONDITION : COLOR_SATELLITE);
            const radius = isHub ? 12 : (isCondition ? 7.5 : 6);

            return {
                ...node,
                isHub,
                isCondition,
                rawX,
                rawY,
                rawZ,
                pos3D: new THREE.Vector3(posX, posY, posZ),
                colorHex,
                radius
            };
        });
    }, [nodes, edges, getDefaultElevation]);

    // Create high-resolution billboard text sprite
    const createTextSprite = useCallback((text, colorHex, isHub) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Dark translucent rounded pill container
        ctx.fillStyle = 'rgba(7, 10, 18, 0.85)';
        ctx.beginPath();
        ctx.roundRect(16, 24, 480, 80, 22);
        ctx.fill();

        // Subtle accent border
        ctx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}66`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Label Text
        ctx.fillStyle = '#ffffff';
        ctx.font = isHub ? 'bold 32px sans-serif' : 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let label = text || '';
        if (label.length > 26) label = label.substring(0, 24) + '...';
        ctx.fillText(label, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(46, 11.5, 1);
        return sprite;
    }, []);

    // Helper: update beam cylinder geometry between start and end vectors
    const updateBeamMesh = useCallback((beamMesh, start, end) => {
        const dir = new THREE.Vector3().subVectors(end, start);
        const len = dir.length();
        if (len < 0.001) return;

        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        beamMesh.position.copy(mid);
        beamMesh.scale.set(1, len, 1);
        beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }, []);

    // Helper: update edge lines & beams connected to a moved node in real-time
    const updateConnectedEdgeMeshes = useCallback((nodeId, newPos) => {
        const nodeMap = nodeDataRef.current;
        const targetNode = nodeMap.get(nodeId);
        if (!targetNode) return;
        targetNode.pos3D.copy(newPos);

        edgeObjectsRef.current.forEach(edgeObj => {
            if (edgeObj.srcId === nodeId || edgeObj.tgtId === nodeId) {
                const src = nodeMap.get(edgeObj.srcId);
                const tgt = nodeMap.get(edgeObj.tgtId);
                if (!src || !tgt) return;

                // Update volumetric cylinder beam
                if (edgeObj.beamMesh) {
                    updateBeamMesh(edgeObj.beamMesh, src.pos3D, tgt.pos3D);
                }

                // Update directional cone position and orientation
                if (edgeObj.cone) {
                    const dir = new THREE.Vector3().subVectors(tgt.pos3D, src.pos3D);
                    const len = dir.length();
                    const arrowPos = new THREE.Vector3().addVectors(
                        src.pos3D,
                        dir.clone().normalize().multiplyScalar(Math.max(0, len - (tgt.radius + 12)))
                    );
                    edgeObj.cone.position.copy(arrowPos);
                    edgeObj.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
                }

                // Update particle endpoints
                if (edgeObj.particle) {
                    edgeObj.particle.start = src.pos3D;
                    edgeObj.particle.end = tgt.pos3D;
                }
            }
        });

        // Update altitude pillar
        const pillar = nodePillarsRef.current.get(nodeId);
        if (pillar) {
            const pillarPoints = [
                new THREE.Vector3(newPos.x, newPos.y, 0),
                newPos.clone()
            ];
            pillar.geometry.setFromPoints(pillarPoints);
            pillar.computeLineDistances();
            pillar.visible = Math.abs(newPos.z) > 4;
        }
    }, [updateBeamMesh]);

    // Initialize Three.js Scene, Camera, Controls & Renderer
    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // 1. Scene & Deep Atmospheric Cosmic Fog
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x030408);
        scene.fog = new THREE.FogExp2(0x030408, 0.0004);
        sceneRef.current = scene;

        // 2. Camera: starts centered directly facing the 2D plane
        const camera = new THREE.PerspectiveCamera(50, width / height, 1, 5000);
        camera.position.set(0, 0, 780);
        cameraRef.current = camera;

        // 3. WebGL Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. OrbitControls: UNCONSTRAINED 360° Horizontal & Vertical Freedom
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 1.0;
        controls.panSpeed = 0.8;
        controls.minDistance = 60;
        controls.maxDistance = 2200;
        // Unconstrained angles: full 360-degree rotation without clamps
        controls.minPolarAngle = 0.001;
        controls.maxPolarAngle = Math.PI - 0.001;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.target.set(0, 0, 0);
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.4;
        controlsRef.current = controls;

        // 5. Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
        dirLight.position.set(250, 450, 350);
        scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
        backLight.position.set(-250, -350, -250);
        scene.add(backLight);

        // 6. Subtle Ground Depth Reference Grid (Baseline Plane at Z = 0)
        const grid = new THREE.GridHelper(1400, 28, 0x1e293b, 0x0f172a);
        grid.rotation.x = Math.PI / 2; // Lie on XY plane at Z = -75
        grid.position.z = -75;
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        scene.add(grid);

        // 7. Subtle Starfield Dust (1,000 tiny stars)
        const starsGeo = new THREE.BufferGeometry();
        const starCount = 1000;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 2600;
            starPos[i + 1] = (Math.random() - 0.5) * 1800;
            starPos[i + 2] = (Math.random() - 0.5) * 2200;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starsMat = new THREE.PointsMaterial({
            color: 0x94a3b8,
            size: 2.0,
            transparent: true,
            opacity: 0.45,
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

        // Keydown / Keyup listener for Shift key (Depth Stretch shortcut)
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') isShiftKeyRef.current = true;
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Shift') isShiftKeyRef.current = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Animation Loop
        let clock = new THREE.Clock();
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            if (controlsRef.current) {
                controlsRef.current.update();
            }

            // Always orient halo rings towards camera so they remain perfect circles from any angle
            if (cameraRef.current) {
                const camQuat = cameraRef.current.quaternion;
                nodeHalosRef.current.forEach(haloMesh => {
                    haloMesh.quaternion.copy(camQuat);
                });
            }

            // Pulse Hub Nodes subtly
            nodeSpheresRef.current.forEach((mesh, id) => {
                const data = nodeDataRef.current.get(id);
                if (data && data.isHub) {
                    const pulse = 1 + Math.sin(time * 2.2 + data.pos3D.x * 0.01) * 0.08;
                    mesh.scale.set(pulse, pulse, pulse);
                }
            });

            // Animate travelling energy pulses along lines
            particlesRef.current.forEach(p => {
                if (!p.mesh || !p.start || !p.end) return;
                p.progress = (p.progress + p.speed * delta) % 1;
                p.mesh.position.lerpVectors(p.start, p.end, p.progress);
            });

            // Raycasting for interactive hover (only when not dragging)
            if (cameraRef.current && sceneRef.current && !isDraggingNodeRef.current) {
                raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
                const interactables = Array.from(nodeSpheresRef.current.values());
                const intersects = raycasterRef.current.intersectObjects(interactables, false);

                if (intersects.length > 0) {
                    const hit = intersects[0].object;
                    const hitId = hit.userData?.id;
                    const hitData = nodeDataRef.current.get(hitId);
                    if (hitData && (!hoveredNode || hoveredNode.id !== hitId)) {
                        setHoveredNode(hitData);
                        container.style.cursor = 'grab';
                    }
                } else if (hoveredNode) {
                    setHoveredNode(null);
                    container.style.cursor = 'default';
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
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

    // Build 3D Nodes & 3D Connection Lines whenever nodes3D or edges change
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || nodes3D.length === 0) return;

        // Clean previous meshes
        nodeMeshesRef.current.forEach(group => scene.remove(group));
        nodeMeshesRef.current.clear();
        nodeSpheresRef.current.clear();
        nodeHalosRef.current.clear();
        nodePillarsRef.current.clear();
        nodeDataRef.current.clear();

        edgeObjectsRef.current.forEach(obj => {
            if (obj.beamMesh) scene.remove(obj.beamMesh);
            if (obj.cone) scene.remove(obj.cone);
            if (obj.particle?.mesh) scene.remove(obj.particle.mesh);
        });
        edgeObjectsRef.current = [];
        particlesRef.current = [];

        const geos = sharedGeosRef.current;

        // 1. Create Node Meshes with Specular Spheres & Billboards
        nodes3D.forEach(node => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const group = new THREE.Group();
            group.position.copy(node.pos3D);

            const geo = node.isHub ? geos.hub : (node.isCondition ? geos.cond : geos.norm);
            const mat = new THREE.MeshStandardMaterial({
                color: node.colorHex,
                emissive: node.colorHex,
                emissiveIntensity: isSelected ? 1.5 : (node.isHub ? 1.0 : 0.4),
                roughness: 0.25,
                metalness: 0.45
            });

            const sphere = new THREE.Mesh(geo, mat);
            sphere.userData = { id: node.id };
            group.add(sphere);
            nodeSpheresRef.current.set(node.id, sphere);

            // Radiant Halo Ring for Hubs and Selected Nodes (Dynamic Camera Facing)
            if (node.isHub || isSelected) {
                const ringGeo = new THREE.RingGeometry(node.radius * 1.3, node.radius * 1.55, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: isSelected ? COLOR_SELECTED : node.colorHex,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: isSelected ? 0.9 : 0.45,
                    blending: THREE.AdditiveBlending
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                group.add(ring);
                nodeHalosRef.current.set(node.id, ring);
            }

            // High-Contrast Billboard Text Label (always faces camera)
            const labelSprite = createTextSprite(node.label, node.colorHex, node.isHub);
            labelSprite.position.set(0, -(node.radius + 15), 0);
            group.add(labelSprite);

            scene.add(group);
            nodeMeshesRef.current.set(node.id, group);
            nodeDataRef.current.set(node.id, node);

            // Altitude Drop-Line (Vertical Pillar from Z=0 baseline plane)
            const pillarGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(node.pos3D.x, node.pos3D.y, 0),
                node.pos3D.clone()
            ]);
            const pillarMat = new THREE.LineDashedMaterial({
                color: node.colorHex,
                dashSize: 5,
                gapSize: 4,
                transparent: true,
                opacity: 0.4
            });
            const pillar = new THREE.Line(pillarGeo, pillarMat);
            pillar.computeLineDistances();
            pillar.visible = Math.abs(node.pos3D.z) > 4;
            scene.add(pillar);
            nodePillarsRef.current.set(node.id, pillar);
        });

        // 2. Create Real 3D Connection Beams & Directional Arrows
        const nodeMap = new Map(nodes3D.map(n => [n.id, n]));
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            blending: THREE.AdditiveBlending
        });

        edges.forEach((edge, i) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return;

            const isFeedback = edge.type === 'feedback' || tgt.rawX < src.rawX;
            const isEdgeConnectedToSelected = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);

            const beamColor = isEdgeConnectedToSelected
                ? (selectedNode.id === src.id ? 0xf43f5e : 0x38bdf8)
                : (isFeedback ? COLOR_FEEDBACK : 0xffffff);

            const beamRadius = isFeedback ? 1.5 : (isEdgeConnectedToSelected ? 1.6 : 1.1);
            const beamGeo = new THREE.CylinderGeometry(beamRadius, beamRadius, 1, 8);

            const beamMat = new THREE.MeshBasicMaterial({
                color: beamColor,
                transparent: true,
                opacity: isEdgeConnectedToSelected ? 0.95 : (isFeedback ? 0.75 : 0.35),
                blending: THREE.AdditiveBlending
            });

            const beamMesh = new THREE.Mesh(beamGeo, beamMat);
            updateBeamMesh(beamMesh, src.pos3D, tgt.pos3D);
            scene.add(beamMesh);

            // 3D Directional Cone Arrowhead near target node
            let cone = null;
            if (isFeedback || edge.type === 'unidirectional') {
                const coneMat = new THREE.MeshBasicMaterial({
                    color: beamColor,
                    transparent: true,
                    opacity: 0.85
                });
                cone = new THREE.Mesh(geos.cone, coneMat);

                const dir = new THREE.Vector3().subVectors(tgt.pos3D, src.pos3D);
                const len = dir.length();
                const arrowPos = new THREE.Vector3().addVectors(
                    src.pos3D,
                    dir.clone().normalize().multiplyScalar(Math.max(0, len - (tgt.radius + 12)))
                );
                cone.position.copy(arrowPos);
                cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
                scene.add(cone);
            }

            // Energy Particle traveling along edge
            let particle = null;
            if (i % 2 === 0 || isFeedback || isEdgeConnectedToSelected) {
                const pMesh = new THREE.Mesh(geos.particle, particleMat);
                scene.add(pMesh);
                particle = {
                    mesh: pMesh,
                    start: src.pos3D,
                    end: tgt.pos3D,
                    progress: (i * 0.17) % 1,
                    speed: 0.22 + (i % 3) * 0.08
                };
                particlesRef.current.push(particle);
            }

            edgeObjectsRef.current.push({
                beamMesh,
                cone,
                particle,
                srcId: src.id,
                tgtId: tgt.id,
                isFeedback
            });
        });

    }, [nodes3D, edges, selectedNode, createTextSprite, updateBeamMesh]);

    // Handle Mouse Events on Canvas for Dragging & Depth Stretching
    const handlePointerDown = useCallback((e) => {
        const container = mountRef.current;
        const camera = cameraRef.current;
        if (!container || !camera) return;

        const rect = container.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const interactables = Array.from(nodeSpheresRef.current.values());
        const intersects = raycasterRef.current.intersectObjects(interactables, false);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const hitId = hit.userData?.id;
            const hitData = nodeDataRef.current.get(hitId);
            if (!hitData) return;

            // Select node
            onSelectNode(hitData);

            // Start drag
            isDraggingNodeRef.current = true;
            draggedNodeIdRef.current = hitId;
            dragStartMousePosRef.current = { x: e.clientX, y: e.clientY };
            dragStartNodePosRef.current.copy(hitData.pos3D);

            // Determine drag plane: plane facing camera through the node's position
            const normal = new THREE.Vector3();
            camera.getWorldDirection(normal);
            normal.negate();
            dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, hitData.pos3D);

            // Disable OrbitControls while dragging a node
            if (controlsRef.current) {
                controlsRef.current.enabled = false;
            }

            const isZMode = isShiftKeyRef.current || dragMode === 'depth';
            if (isZMode) {
                setActiveZDragNode(hitData);
                container.style.cursor = 'ns-resize';
            } else {
                container.style.cursor = 'grabbing';
            }
        }
    }, [dragMode, onSelectNode]);

    const handlePointerMove = useCallback((e) => {
        const container = mountRef.current;
        const camera = cameraRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (isDraggingNodeRef.current && draggedNodeIdRef.current && camera) {
            const nodeId = draggedNodeIdRef.current;
            const node = nodeDataRef.current.get(nodeId);
            const group = nodeMeshesRef.current.get(nodeId);
            if (!node || !group) return;

            const isZMode = isShiftKeyRef.current || dragMode === 'depth';

            if (isZMode) {
                // Depth (Z-axis) stretching: mouse delta Y drives Z forward/backward
                const deltaY = dragStartMousePosRef.current.y - e.clientY;
                const newZ = Math.max(-80, Math.min(220, dragStartNodePosRef.current.z + deltaY * 1.2));
                const newPos = new THREE.Vector3(node.pos3D.x, node.pos3D.y, newZ);
                
                group.position.copy(newPos);
                updateConnectedEdgeMeshes(nodeId, newPos);
                setActiveZDragNode(prev => prev ? { ...prev, curZ: Math.round(newZ) } : null);
            } else {
                // XY Plane dragging via raycasting on camera-facing plane
                raycasterRef.current.setFromCamera(mouseRef.current, camera);
                if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, dragIntersectionRef.current)) {
                    const newPos = dragIntersectionRef.current.clone();
                    // Maintain current Z
                    newPos.z = dragStartNodePosRef.current.z;

                    group.position.copy(newPos);
                    updateConnectedEdgeMeshes(nodeId, newPos);
                }
            }
        }
    }, [dragMode, updateConnectedEdgeMeshes]);

    const handlePointerUp = useCallback(() => {
        const container = mountRef.current;
        if (container) container.style.cursor = 'default';

        if (isDraggingNodeRef.current && draggedNodeIdRef.current) {
            const nodeId = draggedNodeIdRef.current;
            const node = nodeDataRef.current.get(nodeId);
            const group = nodeMeshesRef.current.get(nodeId);

            if (node && group) {
                // Convert 3D world coordinates back to 2D percentages and Z elevation
                const posX = group.position.x;
                const posY = group.position.y;
                const posZ = group.position.z;

                const newPercentX = (posX / WORLD_SCALE_X) + 50;
                const newPercentY = 50 - (posY / WORLD_SCALE_Y);
                const newZ = posZ / WORLD_SCALE_Z;

                node.rawX = newPercentX;
                node.rawY = newPercentY;
                node.rawZ = newZ;
                node.pos3D.copy(group.position);

                // Notify parent state & persist
                onUpdateNodePosition(nodeId, {
                    x: Math.max(4, Math.min(96, Math.round(newPercentX * 10) / 10)),
                    y: Math.max(4, Math.min(96, Math.round(newPercentY * 10) / 10)),
                    z: Math.round(newZ)
                });
            }
        }

        isDraggingNodeRef.current = false;
        draggedNodeIdRef.current = null;
        setActiveZDragNode(null);

        // Re-enable OrbitControls
        if (controlsRef.current) {
            controlsRef.current.enabled = true;
        }
    }, [onUpdateNodePosition]);

    // Mouse wheel depth adjustment over hovered/selected node
    const handleWheel = useCallback((e) => {
        if (isShiftKeyRef.current && hoveredNode) {
            e.preventDefault();
            const nodeId = hoveredNode.id;
            const group = nodeMeshesRef.current.get(nodeId);
            if (!group) return;

            const delta = e.deltaY < 0 ? 12 : -12;
            const newZ = Math.max(-80, Math.min(220, group.position.z + delta));
            const newPos = new THREE.Vector3(group.position.x, group.position.y, newZ);

            group.position.copy(newPos);
            updateConnectedEdgeMeshes(nodeId, newPos);
            onUpdateNodeZ(nodeId, Math.round(newZ));
        }
    }, [hoveredNode, updateConnectedEdgeMeshes, onUpdateNodeZ]);

    // Attach pointer listeners to container
    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        container.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            container.removeEventListener('wheel', handleWheel);
        };
    }, [handlePointerDown, handlePointerMove, handlePointerUp, handleWheel]);

    // Camera Presets Smooth Transition
    const setPreset = useCallback((type) => {
        setViewPreset(type);
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        controls.target.set(0, 0, 0);

        if (type === 'front') {
            // Exact 2D View Angle looking straight at the Obsidian graph
            camera.position.set(0, 0, 780);
        } else if (type === 'top') {
            // Bird's-eye top view
            camera.position.set(0, 840, 20);
        } else if (type === 'side') {
            // Profile side view showcasing full depth layer distribution
            camera.position.set(840, 30, 20);
        } else {
            // Perspective 3D
            camera.position.set(160, 180, 680);
        }
        controls.update();
    }, []);

    // Quick Node Z Depth Adjustment Handler
    const adjustSelectedNodeZ = useCallback((delta) => {
        if (!selectedNode) return;
        const group = nodeMeshesRef.current.get(selectedNode.id);
        if (!group) return;

        const currentZ = group.position.z;
        const newZ = Math.max(-80, Math.min(220, currentZ + delta));
        const newPos = new THREE.Vector3(group.position.x, group.position.y, newZ);

        group.position.copy(newPos);
        updateConnectedEdgeMeshes(selectedNode.id, newPos);
        onUpdateNodeZ(selectedNode.id, Math.round(newZ));
    }, [selectedNode, updateConnectedEdgeMeshes, onUpdateNodeZ]);

    const setPresetNodeZ = useCallback((targetZ) => {
        if (!selectedNode) return;
        const group = nodeMeshesRef.current.get(selectedNode.id);
        if (!group) return;

        const newPos = new THREE.Vector3(group.position.x, group.position.y, targetZ);
        group.position.copy(newPos);
        updateConnectedEdgeMeshes(selectedNode.id, newPos);
        onUpdateNodeZ(selectedNode.id, Math.round(targetZ));
    }, [selectedNode, updateConnectedEdgeMeshes, onUpdateNodeZ]);

    return (
        <div className="absolute inset-0 z-10 w-full h-full overflow-hidden bg-[#030408] select-none">
            {/* 3D WebGL Canvas Mount */}
            <div ref={mountRef} className="w-full h-full" />

            {/* Top Left Title & Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 pointer-events-auto">
                <div className="px-3.5 py-1.5 rounded-2xl bg-zinc-950/85 border border-emerald-500/40 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.8)] flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wider uppercase text-white font-mono">
                        Red 3D Cosmos
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        WebGL 360°
                    </span>
                </div>

                {/* Instructions helper button */}
                <button
                    onClick={() => setShowHelp(prev => !prev)}
                    className="p-1.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-400 hover:text-white backdrop-blur-xl transition-all shadow-lg"
                    title="Ver atajos y controles 3D"
                >
                    <HelpCircle size={14} />
                </button>
            </div>

            {/* Top Right Camera & Orbit HUD */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
                {/* Drag Mode Toggle (Mover en Plano vs Estirar Profundidad Z) */}
                <div className="flex items-center p-1 rounded-2xl bg-zinc-950/85 border border-white/10 backdrop-blur-xl shadow-lg">
                    <button
                        onClick={() => setDragMode('plane')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1 ${
                            dragMode === 'plane' 
                                ? 'bg-white/20 text-white font-bold shadow-sm' 
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Modo Plano: Arrastrar nodos en (X, Y)"
                    >
                        <Move size={12} />
                        <span className="hidden md:inline">Plano</span>
                    </button>
                    <button
                        onClick={() => setDragMode('depth')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1 ${
                            dragMode === 'depth' 
                                ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm' 
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Modo Profundidad: Arrastrar nodos hacia adelante/atrás en (Z) estirando líneas"
                    >
                        <ArrowUpDown size={12} />
                        <span className="hidden md:inline">Profundidad Z</span>
                    </button>
                </div>

                {/* Perspective Preset Buttons */}
                <div className="flex items-center p-1 rounded-2xl bg-zinc-950/85 border border-white/10 backdrop-blur-xl shadow-lg">
                    <button
                        onClick={() => setPreset('front')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
                            viewPreset === 'front' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Vista Frontal (Alineación exacta con Mapa 2D)"
                    >
                        Frontal
                    </button>
                    <button
                        onClick={() => setPreset('perspective')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
                            viewPreset === 'perspective' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Perspectiva 3D Libre"
                    >
                        3D
                    </button>
                    <button
                        onClick={() => setPreset('top')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
                            viewPreset === 'top' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Vista Superior Cénit"
                    >
                        Superior
                    </button>
                    <button
                        onClick={() => setPreset('side')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
                            viewPreset === 'side' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Vista Lateral Perfil"
                    >
                        Lateral
                    </button>
                </div>

                {/* Auto Rotate Toggle */}
                <button
                    onClick={() => setAutoRotate(prev => !prev)}
                    className={`p-2 rounded-2xl border backdrop-blur-xl transition-all shadow-lg ${
                        autoRotate 
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300' 
                            : 'bg-zinc-950/85 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                    title={autoRotate ? "Pausar giro automático" : "Activar giro 360° automático"}
                >
                    {autoRotate ? <Pause size={14} /> : <Play size={14} />}
                </button>

                {/* Reset Camera View */}
                <button
                    onClick={() => setPreset('perspective')}
                    className="p-2 rounded-2xl bg-zinc-950/85 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur-xl transition-all shadow-lg"
                    title="Centrar Cámara"
                >
                    <RotateCcw size={14} />
                </button>

                {/* Return to 2D Mode */}
                <button
                    onClick={onClose3D}
                    className="p-2 rounded-2xl bg-zinc-950/85 border border-white/10 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 backdrop-blur-xl transition-all shadow-lg"
                    title="Volver a Mapa 2D"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Active Z-Stretching Floating Badge */}
            {activeZDragNode && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in duration-150">
                    <div className="px-4 py-2 rounded-2xl bg-zinc-950/90 border border-emerald-400/60 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-2.5 text-xs font-mono">
                        <ArrowUpDown size={14} className="text-emerald-400 animate-bounce" />
                        <span className="text-white font-bold">{activeZDragNode.label}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Z: {activeZDragNode.curZ || Math.round(activeZDragNode.pos3D.z)}px
                        </span>
                        <span className="text-[10px] text-zinc-400">Estirando conexiones 3D</span>
                    </div>
                </div>
            )}

            {/* Help / Shortcuts Panel Overlay */}
            {showHelp && (
                <div className="absolute top-16 left-4 z-30 p-4 rounded-2xl bg-zinc-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl max-w-xs text-xs font-mono space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="text-white font-bold flex items-center gap-1.5">
                            <Info size={13} className="text-emerald-400" />
                            Guía Interactiva 3D
                        </span>
                        <button onClick={() => setShowHelp(false)} className="text-zinc-400 hover:text-white">
                            <X size={13} />
                        </button>
                    </div>
                    <div className="space-y-1.5 text-zinc-300 text-[11px]">
                        <p><span className="text-emerald-400 font-bold">Giro 360°:</span> Clic y arrastre con botón izquierdo o táctil para rotar en cualquier dirección.</p>
                        <p><span className="text-emerald-400 font-bold">Panorámica:</span> Clic derecho o dos dedos para desplazar la cámara.</p>
                        <p><span className="text-emerald-400 font-bold">Zoom:</span> Rueda del ratón o pellizco.</p>
                        <p><span className="text-emerald-400 font-bold">Mover Nodo:</span> Clic y arrastre sobre cualquier esfera.</p>
                        <p><span className="text-emerald-400 font-bold">Estirar en Z:</span> Mantén <kbd className="px-1 rounded bg-zinc-800 text-white">Shift</kbd> al arrastrar un nodo, o activa el modo "Profundidad Z".</p>
                    </div>
                </div>
            )}

            {/* Bottom HUD: Selected Node Depth Controls */}
            {selectedNode && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="px-4 py-2.5 rounded-2xl bg-zinc-950/90 border border-emerald-500/40 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.85)] flex items-center gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2 border-r border-white/15 pr-3">
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: selectedNode.is_island_hub ? '#ffffff' : (selectedNode.isCondition ? '#10b981' : '#94a3b8'),
                                    boxShadow: '0 0 10px currentColor'
                                }}
                            />
                            <span className="font-bold text-white max-w-[140px] truncate">{selectedNode.label}</span>
                        </div>

                        {/* Depth Adjustment Controls */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mr-1">
                                Profundidad Z:
                            </span>
                            <button
                                onClick={() => adjustSelectedNodeZ(-20)}
                                className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 active:scale-95 text-[10px] font-bold"
                                title="Empujar hacia el fondo (-20px)"
                            >
                                -20
                            </button>
                            <button
                                onClick={() => adjustSelectedNodeZ(-10)}
                                className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 active:scale-95 text-[10px] font-bold"
                                title="Empujar hacia el fondo (-10px)"
                            >
                                -10
                            </button>
                            <button
                                onClick={() => adjustSelectedNodeZ(10)}
                                className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 active:scale-95 text-[10px] font-bold"
                                title="Traer al frente (+10px)"
                            >
                                +10
                            </button>
                            <button
                                onClick={() => adjustSelectedNodeZ(20)}
                                className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 active:scale-95 text-[10px] font-bold"
                                title="Traer al frente (+20px)"
                            >
                                +20
                            </button>
                        </div>

                        {/* Presets */}
                        <div className="hidden sm:flex items-center gap-1 border-l border-white/15 pl-3">
                            <button
                                onClick={() => setPresetNodeZ(-50)}
                                className="px-2 py-1 rounded-lg bg-black/50 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 text-[9px]"
                            >
                                Fondo
                            </button>
                            <button
                                onClick={() => setPresetNodeZ(0)}
                                className="px-2 py-1 rounded-lg bg-black/50 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 text-[9px]"
                            >
                                Plano
                            </button>
                            <button
                                onClick={() => setPresetNodeZ(50)}
                                className="px-2 py-1 rounded-lg bg-black/50 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 text-[9px]"
                            >
                                Cénit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

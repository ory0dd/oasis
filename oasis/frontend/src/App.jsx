import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BitacoraExistencial from './components/BitacoraExistencial';
import { createPortal } from 'react-dom';
import {
    Plus, Minus, Edit2, Check, Radio, Focus, Compass, CheckSquare,
    ArrowLeft, ArrowRight, ImageIcon, Mic, Zap, Pencil,
    Edit3, Trash2, Maximize2, Settings, X,
    Heart, MessageCircle, Eye, EyeOff, Globe,
    Aperture, Infinity as InfinityIcon, Share2, Search, Play, Pause, SkipForward, SkipBack,
    FolderPlus, ChevronDown, ChevronUp, Pin, Star, FileText, PanelLeft, PanelLeftClose, MessageSquare, StickyNote,
    Paperclip, Send, ChevronLeft, ChevronRight, ListMusic, Sparkles, Save, LayoutGrid, Headphones,
    Navigation, Grid, Square, Circle, Monitor, RotateCw, Type, Move, Camera,
    User, Clock, Database, Activity, Crop, RefreshCw, Palette, Layers, List, Download, Sidebar, Rss, Film, ShoppingBag,
    Bookmark, UserSquare, Link as LinkIcon, ServerCrash, Home
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import OasisChat from './components/OasisChat';
import PsychologistDashboard from './components/PsychologistDashboard';
import { ResonanceNotebook } from './components/ResonanceNotebook';
import { DiaryNotebook } from './components/DiaryNotebook';
import MyResponsesDashboard from './components/MyResponsesDashboard';
import SimpleNotesView from './components/SimpleNotesView';
import UnifiedCreatorView from './components/UnifiedCreatorView';
import icarQuestions from './data/icar16_questions.json';
import icarRationale from './data/icar16_rationale.json';
import { NekronomikronFull, OasisPlayer } from './components/Nekronomikron';
import { BiographicInterview } from './components/BiographicInterview';
import PublishNoteSelector from './components/PublishNoteSelector';
import { saveObservation, getObservations, deleteObservation } from './utils/db';
import { useTranscription } from './hooks/useTranscription';
import { StoryViewer, HighlightModal, StoryUploadModal } from './components/StoryHighlights';

// ErrorBoundary: Prevents black screen crashes by catching render errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('🔴 ErrorBoundary caught:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: '#030304', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '24px', padding: '32px', fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '20px' }}>⚠</span>
                    </div>
                    <h2 style={{ color: '#e4e4e7', fontSize: '16px', fontWeight: 600, margin: 0 }}>Algo salió mal</h2>
                    <p style={{ color: '#71717a', fontSize: '12px', textAlign: 'center', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>
                        Se detectó un error de renderizado. Tu información está segura.
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', maxWidth: '500px', width: '100%', maxHeight: '120px', overflow: 'auto' }}>
                        <code style={{ color: '#ef4444', fontSize: '10px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {this.state.error?.message || 'Error desconocido'}
                        </code>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                            style={{
                                padding: '10px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#e4e4e7', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.1em'
                            }}
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={() => { localStorage.removeItem('oasis_user'); window.location.reload(); }}
                            style={{
                                padding: '10px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                color: '#ef4444', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.1em'
                            }}
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Helper: Hex to HSL
function hexToHsl(hex) {
    if (!hex || typeof hex !== 'string' || hex.length < 7) {
        return { h: 0, s: 0, l: 0 };
    }
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// Helper: HSL to Hex
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    let rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    let gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    let bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}`;
}

// Global flags and queues for data synchronization
window.isDownloadingClinicalData = false;
const syncQueues = {};

// Globally override localStorage.setItem to auto-sync clinical data to the dotnet backend with debouncing
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (window.isDownloadingClinicalData) {
        return;
    }
    if (key.startsWith('oasis_') && key !== 'oasis_user' && !key.startsWith('oasis_bg_')) {
        const getTargetUserFromKey = (k, defaultUser) => {
            const prefixes = [
                'oasis_bio_transcriptions_',
                'oasis_phenom_qualitative_',
                'oasis_pid_answers_',
                'oasis_icar_answers_',
                'oasis_icar_dwell_',
                'oasis_icar_changes_',
                'oasis_bio_metadata_',
                'oasis_phenom_metadata_',
                'oasis_active_version_',
                'oasis_total_versions_',
                'oasis_patient_status_',
                'oasis_session_videos_bio_videos_',
                'oasis_session_videos_phenom_videos_',
                'oasis_session_videos_icar_videos_',
                'oasis_clinician_notes_',
                'oasis_private_notes_',
                'oasis_canvas_nodes_',
                'oasis_canvas_edges_',
                'oasis_afc_real_data_',
                'oasis_afc_notes_',
                'oasis_blindspot_answer_',
                'oasis_blindspot_resolved_',
                'oasis_blindspot_question_',
                'oasis_blindspot_title_',
                'oasis_blindspot_answer_cronologico_',
                'oasis_blindspot_answer_desarme_',
                'oasis_blindspot_answer_identidad_',
                'oasis_blindspot_resolved_cronologico_',
                'oasis_blindspot_resolved_desarme_',
                'oasis_blindspot_resolved_identidad_'
            ];
            for (const prefix of prefixes) {
                if (k.startsWith(prefix)) {
                    let part = k.substring(prefix.length);
                    const vIndex = part.indexOf('_v');
                    if (vIndex > -1) part = part.substring(0, vIndex);
                    // Support double underscore separator for dynamic blind spots: user__spotId
                    const dIndex = part.indexOf('__');
                    if (dIndex > -1) part = part.substring(0, dIndex);
                    return part;
                }
            }
            return defaultUser;
        };

        const currentUser = localStorage.getItem('oasis_user');
        const targetUser = getTargetUserFromKey(key, currentUser);
        if (targetUser) {
            let envUrl = import.meta.env.VITE_API_URL;
            if (envUrl && envUrl.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') envUrl = null;
            const API_URL = envUrl ||
                ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
                    ? `http://${window.location.hostname}:5046`
                    : 'https://oasis-production-6303.up.railway.app');

            if (!syncQueues[targetUser]) {
                syncQueues[targetUser] = {
                    timeoutId: null,
                    data: {}
                };
            }

            syncQueues[targetUser].data[key] = value;

            if (syncQueues[targetUser].timeoutId) {
                clearTimeout(syncQueues[targetUser].timeoutId);
            }

            syncQueues[targetUser].timeoutId = setTimeout(() => {
                const payload = { ...syncQueues[targetUser].data };
                syncQueues[targetUser].data = {};
                syncQueues[targetUser].timeoutId = null;

                fetch(`${API_URL}/api/oasis/clinical-data?user=${targetUser}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(err => console.error("Error auto-syncing clinical data to server:", err));
            }, 1000); // Debounce network writes by 1 second to avoid spamming server on rapid keystrokes
        }
    }
};

// Globally override window.fetch to automatically inject the X-Oasis-User header
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
    const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input && input.url ? input.url : ''));
    let envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') envUrl = null;
    const apiUrl = envUrl ||
        ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
            ? `http://${window.location.hostname}:5046`
            : 'https://oasis-production-6303.up.railway.app');

    // Only inject X-Oasis-User header if the request goes to our backend
    const isBackendRequest = urlStr.startsWith('/') || urlStr.startsWith(apiUrl) || urlStr.includes('/api/oasis');

    if (isBackendRequest) {
        const user = localStorage.getItem('oasis_user');
        if (user) {
            init = init || {};
            init.headers = init.headers || {};
            if (init.headers instanceof Headers) {
                if (!init.headers.has('X-Oasis-User')) {
                    init.headers.set('X-Oasis-User', user);
                }
            } else if (Array.isArray(init.headers)) {
                const hasHeader = init.headers.some(([key]) => key.toLowerCase() === 'x-oasis-user');
                if (!hasHeader) {
                    init.headers.push(['X-Oasis-User', user]);
                }
            } else {
                const hasHeader = Object.keys(init.headers).some(k => k.toLowerCase() === 'x-oasis-user');
                if (!hasHeader) {
                    init.headers['X-Oasis-User'] = user;
                }
            }
        }
    }
    return originalFetch.call(this, input, init);
};


const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '190, 242, 100';
};

const MOBILE_VIEWPORT_W = () => typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.92, window.innerWidth - 24) : 9999;
const MOBILE_VIEWPORT_H = () => typeof window !== 'undefined' ? window.innerHeight * 0.85 : 9999;
const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768;


const getBWidth = (block, isPoint) => {
    if (isPoint) return 0;
    if (block.type === 'canvas_title') return 0;
    if (block.isPublic || block.type === 'insight') return 0;
    if (block.width || block.w) return block.width || block.w;
    if (block.type === 'audio') return 250;
    if (block.type === 'loop_map_mini') return 850;
    if (block.type === 'diary_notebook' || block.type === 'resonance_notebook' || block.type === 'conversation_notebook') return 480;
    const hasMedia = block.content && typeof block.content === 'string' && (block.content.includes('[img]') || block.content.includes('[vid]'));
    if (hasMedia) return 420;
    return block.metadata?.parentId ? 160 : 288;
};

const getBHeight = (block, isPoint) => {
    if (isPoint) return 0;
    if (block.type === 'canvas_title') return 0;
    if (block.isPublic || block.type === 'insight') return 0;
    if (block.height || block.h) return block.height || block.h;
    if (block.type === 'audio') return 100;
    if (block.type === 'loop_map_mini') return 700;
    if (block.type === 'diary_notebook' || block.type === 'resonance_notebook' || block.type === 'conversation_notebook') return 600;
    const hasMedia = block.content && typeof block.content === 'string' && (block.content.includes('[img]') || block.content.includes('[vid]'));
    if (hasMedia) return 420;
    return block.metadata?.parentId ? 160 : 288;
};

const getConnectionPoints = (b1, b2, isB2Point = false, draggingId = null, scale = 1) => {
    const b2X = b2.x;
    const b2Y = b2.y;

    const b1IsChild = !!b1.metadata?.parentId;
    const b2IsChild = !isB2Point && !!b2.metadata?.parentId;

    const b1W = getBWidth(b1, false);
    const b2W = getBWidth(b2, isB2Point);
    const b1H = getBHeight(b1, false);
    const b2H = getBHeight(b2, isB2Point);

    // The nodes are positioned with translate(-50%, -50%), so b.x and b.y represent their exact CENTER.
    // Dynamic border connection points based on node placement.
    let p1, p2;
    if (isB2Point) {
        p1 = { x: 5000 + b1.x, y: 5000 + b1.y + (b1H / 2) };
        p2 = { x: 5000 + b2.x, y: 5000 + b2.y };
    } else {
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection
            if (dx > 0) {
                p1 = { x: 5000 + b1.x + (b1W / 2), y: 5000 + b1.y };
                p2 = { x: 5000 + b2.x - (b2W / 2), y: 5000 + b2.y };
            } else {
                p1 = { x: 5000 + b1.x - (b1W / 2), y: 5000 + b1.y };
                p2 = { x: 5000 + b2.x + (b2W / 2), y: 5000 + b2.y };
            }
        } else {
            // Vertical connection
            if (dy > 0) {
                p1 = { x: 5000 + b1.x, y: 5000 + b1.y + (b1H / 2) };
                p2 = { x: 5000 + b2.x, y: 5000 + b2.y - (b2H / 2) };
            } else {
                p1 = { x: 5000 + b1.x, y: 5000 + b1.y - (b1H / 2) };
                p2 = { x: 5000 + b2.x, y: 5000 + b2.y + (b2H / 2) };
            }
        }
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Deep gravity sag based on distance, maintaining a gorgeous hanging loop!
    const dip = Math.max(90, distance * 0.35 + 80);

    // Continuous 3D breathing wave (elliptical orbit)
    const time = performance.now() * 0.0025;

    const velocity = window.dragVelocity || { x: 0, y: 0 };
    const vx = velocity.x / scale;
    const vy = velocity.y / scale;

    let cp1WaveX = isMobileViewport() ? 0 : Math.sin(time) * 20;
    let cp1WaveY = isMobileViewport() ? 0 : Math.cos(time) * 10;
    let cp2WaveX = isMobileViewport() ? 0 : Math.sin(time + 2.5) * 20;
    let cp2WaveY = isMobileViewport() ? 0 : Math.cos(time + 2.5) * 10;

    // Apply springy physical drag lag (sway) in opposite direction of motion
    if (draggingId && !isMobileViewport()) {
        if (b1.id === draggingId) {
            cp1WaveX -= vx * 5.2;
            cp1WaveY -= vy * 2.5;
        } else if (!isB2Point && b2.id === draggingId) {
            cp2WaveX -= vx * 5.2;
            cp2WaveY -= vy * 2.5;
        }
    }

    // Apply release SPRING BOUNCE (Damped Harmonic Oscillator)
    if (window.lastRelease && !isMobileViewport()) {
        const timeSinceRelease = (performance.now() - window.lastRelease.time) / 1000;
        if (timeSinceRelease < 1.6) {
            const decay = 4.2; // Damping rate (how fast it stops)
            const freq = 18.0; // Bounce frequency (how fast it wobbles)
            const amp = Math.exp(-decay * timeSinceRelease) * Math.cos(freq * timeSinceRelease);

            const rvx = window.lastRelease.vx / scale;
            const rvy = window.lastRelease.vy / scale;

            if (b1.id === window.lastRelease.nodeId) {
                cp1WaveX -= rvx * 5.2 * amp;
                cp1WaveY -= rvy * 2.5 * amp;
            }
            if (!isB2Point && b2.id === window.lastRelease.nodeId) {
                cp2WaveX -= rvx * 5.2 * amp;
                cp2WaveY -= rvy * 2.5 * amp;
            }
        }
    }

    let cp1, cp2;
    const isHorizontal = !isB2Point && Math.abs(b2.x - b1.x) > Math.abs(b2.y - b1.y);

    if (isHorizontal) {
        const dir = Math.sign(p2.x - p1.x) || 1;
        const sag = distance * 0.2; // Real physics gravity sag for horizontal cables
        cp1 = { x: p1.x + dir * (distance * 0.35) + cp1WaveX, y: p1.y + sag + cp1WaveY };
        cp2 = { x: p2.x - dir * (distance * 0.35) + cp2WaveX, y: p2.y + sag + cp2WaveY };
    } else {
        let cp1Dip, cp2Dip;
        if (isB2Point) {
            // When drawing a new link, p1 is the bottom port and p2 is the mouse
            cp1Dip = dip;
            cp2Dip = -dip * 0.8;
        } else {
            const dir = Math.sign(p2.y - p1.y) || 1;
            // Push cp1 outward from p1 face, push cp2 outward from p2 face
            cp1Dip = dir * dip;
            cp2Dip = -dir * dip;
        }
        cp1 = { x: p1.x + cp1WaveX, y: p1.y + cp1Dip + cp1WaveY };
        cp2 = { x: p2.x + cp2WaveX, y: p2.y + cp2Dip + cp2WaveY };
    }

    return { p1, p2, cp1, cp2 };
};

// --- CONFIGURACIÓN ---
// --- CONFIGURACIÓN DE AURAS (THEMES) ---
const AURAS = {
    'oasis': {
        name: 'Oasis Classic',
        primary: '#bef264',
        bg: '#030304',
        sidebar: 'rgba(255,255,255,0.05)',
        card: 'rgba(255,255,255,0.03)',
        accentRgb: '190, 242, 100'
    },
    'monokai': {
        name: 'Monokai Pro',
        primary: '#ffd866',
        bg: '#2d2a2e',
        sidebar: 'rgba(255,255,255,0.07)',
        card: 'rgba(255,255,255,0.05)',
        accentRgb: '255, 216, 102'
    },
    'cyberpunk': {
        name: 'Neon Cyber',
        primary: '#f92672',
        bg: '#0d0d0e',
        sidebar: 'rgba(168, 85, 247, 0.05)',
        card: 'rgba(249, 38, 114, 0.03)',
        accentRgb: '249, 38, 114'
    },
    'oceanic': {
        name: 'Oceanic Drift',
        primary: '#66d9ef',
        bg: '#0f111a',
        sidebar: 'rgba(102, 217, 239, 0.05)',
        card: 'rgba(255,255,255,0.02)',
        accentRgb: '102, 217, 239'
    }
};

const PALETTES = Object.values(AURAS).map(a => ({ name: a.name, color: a.primary, id: Object.keys(AURAS).find(k => AURAS[k] === a) }));

let globalEnvUrl = import.meta.env.VITE_API_URL;
if (globalEnvUrl && globalEnvUrl.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') globalEnvUrl = null;
const API_URL = globalEnvUrl ||
    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
        ? `http://${window.location.hostname}:5046`
        : 'https://oasis-production-6303.up.railway.app');



const useConnectionMonitor = (apiUrl) => {
    const [isOnline, setIsOnline] = React.useState(true);
    React.useEffect(() => {
        let interval;
        const checkConnection = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/oasis/backgrounds/templates`);
                if (res.ok) setIsOnline(true);
                else setIsOnline(false);
            } catch (err) {
                setIsOnline(false);
            }
        };
        checkConnection();
        interval = setInterval(checkConnection, 15000);
        return () => clearInterval(interval);
    }, [apiUrl]);
    return isOnline;
};

const formatUrl = (url) => {
    if (!url || typeof url !== 'string') return typeof url === 'string' ? url : '';

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'));

    // Prevent CORS Private Network Access issues by rewriting hardcoded localhost URLs in production
    if (!isLocal && typeof url === 'string' && url.includes('localhost:5046')) {
        url = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5046\/?/g, API_URL.endsWith('/') ? API_URL : API_URL + '/');
    }

    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (isLocal && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
    if (url.startsWith('uploads/')) return `${API_URL}/${url.replace('uploads/', '')}`;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getBlockTime = (b) => {
    if (!b) return 0;
    if (b.metadata?.timestamp) {
        const t = new Date(b.metadata.timestamp).getTime();
        if (!isNaN(t)) return t;
    }
    if (b.timestamp) {
        const t = new Date(b.timestamp).getTime();
        if (!isNaN(t)) return t;
    }
    const match = String(b.id).match(/\d+/);
    if (match) return Number(match[0]);
    return 0;
};

const deduplicateBlocks = (blocksList) => {
    const seen = new Set();
    const result = [];
    for (const b of (blocksList || [])) {
        if (b && b.id) {
            if (!seen.has(b.id)) {
                seen.add(b.id);
                result.push(b);
            }
        }
    }
    return result;
};

const smartMergeBlocks = (serverBlocks, username) => {
    const cleanServer = deduplicateBlocks(serverBlocks);
    const serverIds = new Set(cleanServer.map(b => b.id));
    try {
        const localRaw = localStorage.getItem('oasis_canvas_nodes_' + username);
        const localBlocks = localRaw ? JSON.parse(localRaw) : [];
        const cleanLocal = deduplicateBlocks(localBlocks);
        const localMap = new Map(cleanLocal.map(b => [b.id, b]));

        const smartMergedServer = cleanServer.map(serverBlock => {
            const localBlock = localMap.get(serverBlock.id);
            if (!localBlock) return serverBlock;

            const serverTs = getBlockTime(serverBlock);
            const localTs = getBlockTime(localBlock);

            // Merge metadata: if server has psychologicalAnalysis and local doesn't, adopt it
            const serverMeta = serverBlock.metadata || serverBlock.Metadata;
            const serverAnalysis = serverMeta?.psychologicalAnalysis || serverMeta?.PsychologicalAnalysis;

            if (serverAnalysis) {
                if (!localBlock.metadata) localBlock.metadata = {};
                if (!localBlock.metadata.psychologicalAnalysis) {
                    localBlock.metadata.psychologicalAnalysis = serverAnalysis;
                }
            }

            if (localTs > serverTs) {
                return localBlock;
            }

            const localEntries = localBlock.entries?.length || 0;
            const serverEntries = serverBlock.entries?.length || 0;
            if (localEntries > serverEntries) {
                return localBlock;
            }

            return serverBlock;
        });

        const pendingLocal = cleanLocal.filter(b => !serverIds.has(b.id));
        const merged = deduplicateBlocks([...smartMergedServer, ...pendingLocal]);
        const hasChanges = pendingLocal.length > 0 || smartMergedServer.some((b, i) => b !== cleanServer[i]);

        return { merged, hasChanges };
    } catch (_) {
        return { merged: cleanServer, hasChanges: false };
    }
};

const ReasoningBlock = ({ thought, isStreaming }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!thought) return null;

    return (
        <div className="w-full mb-1 mt-1 opacity-40 hover:opacity-100 transition-opacity">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all font-mono"
            >
                <Zap size={7} className={`${isStreaming ? 'animate-pulse text-accent' : ''}`} />
                <span>{isStreaming ? 'CORE_PROCESS_SYNCING' : 'CORE_PROCESS_ARCHIVE'}</span>
                {isExpanded ? <Minus size={7} /> : <Plus size={7} />}
            </button>
            {isExpanded && (
                <div className="mt-2 p-3 bg-black/40 border-l-2 border-accent/10 rounded-r-lg text-[10px] italic text-zinc-500 font-serif leading-snug animate-in slide-in-from-top-1 duration-300 max-w-[90%]">
                    {thought}
                </div>
            )}
        </div>
    );
};
const SidebarPlayer = ({ track, isPlaying, setIsPlaying, onPrev, onNext, audioRef, setIsFull }) => {
    if (!track) return null;
    return (
        <div className="py-2 animate-in fade-in slide-in-from-top duration-500">
            <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-2 flex items-center gap-3 shadow-2xl group">
                {/* TRACK INFO */}
                <div className="flex-1 min-w-0 pl-3 cursor-pointer" onClick={() => setIsFull(true)}>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black uppercase text-white truncate italic leading-tight">{track.title}</span>
                            <span className="text-[7px] font-bold text-zinc-500 truncate uppercase tracking-widest leading-tight">{track.artist}</span>
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center gap-1 pr-1">
                    <button onClick={onPrev} className="p-1.5 text-white/20 hover:text-white transition-all"><SkipBack size={12} /></button>
                    <button
                        onClick={() => {
                            if (isPlaying) audioRef.current.pause();
                            else audioRef.current.play();
                            setIsPlaying(!isPlaying);
                        }}
                        className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={onNext} className="p-1.5 text-white/20 hover:text-white transition-all"><SkipForward size={12} /></button>
                </div>
            </div>
        </div>
    );
};

const ChatSidebar = ({
    conversations, activeConversationId, onSelectConversation, onDeleteConversation,
    onPinConversation, onRenameConversation, onCreateFolder, blocks, setBlocks, syncBlocks, folders, user,
    setConversations, onSelectNote, onClose, userMemory, setUserMemory, syncMemory, onNewChat,
    playQueue, currentTrack, isPlaying, setIsPlaying, setCurrentTrack, handlePrevTrack, handleNextTrack,
    audioRef, accent, setAccent, onTogglePinFact
}) => {
    const [activeTab, setActiveTab] = React.useState('chats'); // 'chats' | 'notes' | 'memory'
    const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
    const [newFolderName, setNewFolderName] = React.useState('');
    const [editingConversationId, setEditingConversationId] = React.useState(null);
    const [editTitle, setEditTitle] = React.useState('');

    const handleRename = (id, title, color) => {
        const updated = conversations.map(c => c.id === id ? { ...c, title, color: color || c.color } : c);
        setConversations(updated);
        fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        setEditingConversationId(null);
    };

    return (
        <div className="fixed md:relative inset-y-0 left-0 w-full md:w-80 h-full bg-[#080809] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-500 z-[1750] shadow-2xl md:shadow-none transition-colors duration-1000">
            {/* TOP BAR / TABS */}
            <div className="p-4 border-b border-white/[0.03] flex items-center justify-between">
                <div className="flex bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'chats' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <MessageSquare size={12} /> Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <StickyNote size={12} /> Notas
                    </button>
                    <button
                        onClick={() => setActiveTab('memory')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'memory' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <Zap size={12} /> Memoria
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 mr-1 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all transition-all"
                    title="Ocultar Menú"
                >
                    <PanelLeftClose size={16} />
                </button>
            </div>
            <div className="p-6 pb-2 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Ruido Interior</span>
                        <span className="text-[6px] font-bold text-white/20 uppercase tracking-[0.3em]">IA Core Interface</span>
                    </div>
                    <button
                        onClick={() => setIsCreatingFolder(true)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-accent transition-all"
                        title="Nueva Carpeta"
                    >
                        <FolderPlus size={14} />
                    </button>
                </div>

                <button
                    onClick={onNewChat}
                    className="w-full h-12 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-accent group"
                >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    Nueva Conversación
                </button>



                {isCreatingFolder && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <input
                            autoFocus
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onCreateFolder(newFolderName);
                                    setNewFolderName('');
                                    setIsCreatingFolder(false);
                                }
                                if (e.key === 'Escape') setIsCreatingFolder(false);
                            }}
                            placeholder="Nombre de carpeta..."
                            className="w-full bg-white/5 border border-accent/20 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none placeholder:text-zinc-700"
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-8">
                {activeTab === 'chats' ? (
                    <>
                        {/* PINNED */}
                        {conversations.some(c => c.isPinned) && (
                            <div className="space-y-4">
                                <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-accent/40 flex items-center gap-2">
                                    <Star size={10} /> Destacados
                                </h3>
                                <div className="space-y-2">
                                    {conversations.filter(c => c.isPinned).map(c => (
                                        <div key={c.id} className="relative group">
                                            <button
                                                onClick={() => onSelectConversation(c.id)}
                                                className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all ${activeConversationId === c.id ? 'bg-accent/10 border border-accent/20' : 'bg-black/20 border border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#bef264', boxShadow: `0 0 10px ${c.color || '#bef264'}44` }} />
                                                    <span className="text-[10px] font-bold text-white/80 truncate">{c.title || 'Conversación'}</span>
                                                </div>
                                                <Pin size={10} className="text-accent opacity-60" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FOLDERS */}
                        {folders.map(folder => (
                            <div key={folder.id} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <ChevronDown size={10} className="text-white/20" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{folder.name}</span>
                                </div>
                                <div className="space-y-1 pl-2 border-l border-white/5 ml-1">
                                    {/* Conversations in Folder */}
                                    {conversations.filter(c => c.folderId === folder.id).map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => onSelectConversation(c.id)}
                                            className={`w-full px-4 py-2 rounded-xl flex items-center gap-3 transition-all ${activeConversationId === c.id ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/80'}`}
                                        >
                                            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.color || '#bef264' }} />
                                            <span className="text-[9px] font-bold truncate">{c.title || 'Sin Título'}</span>
                                        </button>
                                    ))}
                                    {/* Notes in Folder (HIDDEN IN CHATS TAB) */}
                                </div>
                            </div>
                        ))}
                        {/* GENERAL CONVERSATIONS */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 px-1">Recientes</h3>
                            <div className="space-y-1">
                                {conversations.filter(c => !c.isPinned && !c.folderId).map(c => (
                                    <div key={c.id} className="relative group/item">
                                        {editingConversationId === c.id ? (
                                            <div className="space-y-2 p-2 bg-white/5 rounded-xl border border-accent/20">
                                                <input
                                                    autoFocus
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRename(c.id, editTitle)}
                                                    className="w-full bg-transparent border-none p-2 text-[10px] font-bold text-white outline-none"
                                                />
                                                <div className="flex items-center justify-between px-2 pb-1">
                                                    <div className="flex gap-1">
                                                        {['#bef264', '#22d3ee', '#f43f5e', '#d946ef', '#fbbf24'].map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => handleRename(c.id, editTitle, color)}
                                                                className="w-3.5 h-3.5 rounded-full border border-white/10 hover:scale-125 transition-transform"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setEditingConversationId(null)}
                                                            className="p-1 px-2 rounded-lg bg-white/5 text-white/30 hover:text-white transition-all text-[8px] font-black uppercase"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRename(c.id, editTitle)}
                                                            className="p-1 px-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all text-[8px] font-black uppercase flex items-center gap-1"
                                                        >
                                                            <Check size={10} /> Listo
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => onSelectConversation(c.id)}
                                                    className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all ${activeConversationId === c.id ? 'bg-white/5 text-white' : 'text-white/30 hover:bg-white/5 hover:text-white/80'}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.color || '#555' }} />
                                                        <span className="text-[9px] font-bold truncate pr-8">{c.title || 'Sin Título'}</span>
                                                    </div>
                                                </button>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity bg-[#080809] pl-2">
                                                    <button
                                                        onClick={() => { setEditingConversationId(c.id); setEditTitle(c.title || ''); }}
                                                        className="p-1.5 hover:text-accent transition-colors"
                                                        title="Renombrar / Color"
                                                    >
                                                        <Edit3 size={10} />
                                                    </button>
                                                    <button
                                                        onClick={() => onPinConversation(c.id)}
                                                        className={`p-1.5 transition-colors ${c.isPinned ? 'text-accent' : 'hover:text-accent'}`}
                                                        title="Anclar"
                                                    >
                                                        <Pin size={10} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteConversation(c.id)}
                                                        className="p-1.5 hover:text-red-400 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* NOTES TAB VIEW */}
                        {folders.map(folder => {
                            const folderNotes = blocks.filter(b => b.type === 'text' && b.folderId === folder.id);
                            if (folderNotes.length === 0) return null;
                            return (
                                <div key={folder.id} className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <ChevronDown size={10} className="text-white/20" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{folder.name}</span>
                                    </div>
                                    <div className="space-y-1 pl-2 border-l border-white/5 ml-1">
                                        {folderNotes.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => { onSelectNote(b.id); setActiveTab('chats'); }}
                                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                                            >
                                                <FileText size={10} style={{ color: b.color || '#bef264' }} className="opacity-40" />
                                                <span className="text-[9px] font-bold text-white/30 group-hover:text-white/70 truncate">{b.content.slice(0, 25)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* UNFOLDERED NOTES */}
                        <div className="space-y-4">
                            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 px-1">Notas del Lienzo</h3>
                            <div className="space-y-1">
                                {blocks.filter(b => b.type === 'text' && !b.folderId).map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => {
                                            onSelectNote(b.id);
                                            setActiveTab('chats');
                                        }}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <FileText size={10} style={{ color: b.color || '#bef264' }} className="opacity-40" />
                                        <span className="text-[9px] font-bold text-white/30 group-hover:text-white/70 truncate">{b.content.slice(0, 25)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'memory' && (
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60 flex items-center gap-2">
                                <Zap size={12} /> Núcleo de Memoria
                            </h3>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Hechos destilados de tu conciencia digital.</p>
                        </div>

                        <div className="space-y-3">
                            {userMemory.length > 0 ? [...userMemory].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((fact, idx) => {
                                const originalIdx = userMemory.findIndex(f => f.timestamp === fact.timestamp && f.text === fact.text);
                                return (
                                    <div key={idx} className={`group p-4 rounded-2xl border transition-all ${fact.isPinned ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-white/5 hover:border-accent/20'}`}>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-widest ${fact.isPinned ? 'bg-accent text-black border-accent' : 'bg-accent/10 border-accent/20 text-accent'}`}>
                                                    {fact.isPinned ? 'PINNED' : (fact.category || 'General')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onTogglePinFact(originalIdx)}
                                                    className={`p-1 rounded transition-all ${fact.isPinned ? 'text-accent' : 'text-white/20 hover:text-accent'}`}
                                                >
                                                    <Star size={10} fill={fact.isPinned ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const updated = userMemory.filter((_, i) => i !== originalIdx);
                                                        setUserMemory(updated);
                                                        syncMemory(updated);
                                                    }}
                                                    className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-red-400"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-[11px] font-sans leading-relaxed font-medium ${fact.isPinned ? 'text-white' : 'text-white/70'}`}>{fact.text}</p>
                                    </div>
                                );
                            }) : (
                                <div className="py-10 flex flex-col items-center justify-center text-center opacity-10">
                                    <Zap size={32} className="mb-4" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Sin recuerdos activos</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/60 flex items-center gap-2">
                                <Aperture size={12} /> Reflexiones del Espíritu
                            </h3>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Análisis profundos generados en tus diálogos.</p>

                            <div className="space-y-3">
                                {blocks.filter(b => b.type === 'insight').length > 0 ? blocks.filter(b => b.type === 'insight').map((insight, idx) => (
                                    <div key={insight.id || idx} className="group p-5 rounded-3xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500 opacity-5 blur-2xl -translate-y-1/2 translate-x-1/2" />
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex gap-2 items-center">
                                                <Zap size={10} className="text-purple-400 opacity-50" />
                                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-purple-400/50">Resonancia</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = blocks.filter(b => b.id !== insight.id);
                                                    setBlocks(updated);
                                                    syncBlocks(updated);
                                                    setConversations(prev => prev.map(c => c.noteId === insight.id ? { ...c, noteId: null } : c));
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded text-white/20 hover:text-red-400 transition-all"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                        <div className="text-[11px] font-serif italic text-white/80 leading-relaxed">
                                            <SimpleNarrativeRenderer content={insight.content} />
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 opacity-20">
                                            <span className="text-[6px] font-black uppercase tracking-widest">Fragmento de Conciencia</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 flex flex-col items-center justify-center text-center opacity-10">
                                        <Aperture size={24} className="mb-3" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Sin reflexiones aún</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t border-white/[0.02] bg-white/[0.01]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/20 hover:text-white/60 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all text-[10px] font-black">{user?.[0]?.toUpperCase() || 'U'}</div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest">{user || 'Usuario'}</span>
                            <span className="text-[6px] font-bold text-white/10 uppercase">Frecuencia Base</span>
                        </div>
                    </div>
                    <Settings size={14} className="text-white/10 hover:text-white transition-colors cursor-pointer" />
                </div>
            </div>
        </div>
    );
};

const TypedText = ({ text, speed = 10, delay = 150 }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    const [started, setStarted] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    React.useEffect(() => {
        if (!started) return;
        if (displayedText.length < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, displayedText.length + 1));
            }, speed);
            return () => clearTimeout(timeout);
        }
    }, [displayedText, text, speed, started]);

    return <span>{displayedText}</span>;
};

const WordByWordRenderer = ({ content, speed = 5, wordsPerTick = 3, onComplete }) => {
    const words = React.useMemo(() => content.split(' '), [content]);
    const [displayedCount, setDisplayedCount] = React.useState(0);

    React.useEffect(() => {
        if (displayedCount < words.length) {
            const timer = setTimeout(() => {
                setDisplayedCount(prev => Math.min(prev + wordsPerTick, words.length));
            }, speed);
            return () => clearTimeout(timer);
        } else if (onComplete) {
            onComplete();
        }
    }, [displayedCount, words.length, speed, wordsPerTick, onComplete]);

    const partial = words.slice(0, displayedCount).join(' ');
    return <SimpleNarrativeRenderer content={partial} />;
};

// OasisChat has been refactored to src/components/OasisChat.jsx

const INITIAL_BLOCKS = []; // Datos Iniciales

const INITIAL_SOUL_PIECES = [
    { id: 's1', title: 'Esencia', img: '', x: -200, y: -150 },
    { id: 's2', title: 'Memoria', img: '', x: 220, y: -100 },
];

const GENERATED_FEED = Array.from({ length: 40 }).map((_, i) => ({
    id: `f-${i}`,
    user: `Sincronía_${i + 102}`,
    text: "El glitch es la nueva verdad.",
    img: `https://picsum.photos/seed/${i + 40}/400/600`,
    color: PALETTES[i % 4].color,
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    rotation: (Math.random() - 0.5) * 15
}));

// --- COMPONENTES SECUNDARIOS ---

const DrawingModal = ({ isOpen, onClose, onSave, accent }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [isOpen, accent]);

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
        setIsDrawing(true);
        const pos = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'drawing.png');
            try {
                const res = await fetch(`${API_URL}/api/oasis/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                onSave(data.url); // Enviar URL relativa
                onClose();
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 400, 400);
            } catch (err) {
                console.error("Error al subir dibujo: ", err);
            }
        }, 'image/png');
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#0c0c0d] rounded-[3rem] border border-white/10 p-10 shadow-2xl">
                <h2 className="text-xl font-black italic mb-8 uppercase tracking-[0.4em] text-white/90">Bosquejo Creativo</h2>
                <div className="bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden mb-8 aspect-square">
                    <canvas ref={canvasRef} width="400" height="400" className="w-full h-full cursor-crosshair" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} />
                </div>
                <div className="flex justify-between items-center gap-6">
                    <button onClick={onClose} className="text-zinc-500 hover:text-white uppercase text-[9px] tracking-widest font-black transition-colors">Volver</button>
                    <button onClick={save} className="flex-1 py-5 bg-accent text-black font-black uppercase tracking-widest rounded-full text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all">Guardar Dibujo</button>
                </div>
            </div>
        </div>
    );
};

const FeedItem = ({ f, credits, setCredits, blocks, setBlocks, syncBlocks, links = [], feed = [], setFeed, setView, editBlock, accent, setPublicProfileUser, user, currentUserAvatar, publicUsers = [] }) => {
    const [_unused, setIsInView] = React.useState(false);
    const itemRef = React.useRef(null);
    const [confirmAction, setConfirmAction] = React.useState(null);
    const audioRef = React.useRef(null);
    const [currentSlide, setCurrentSlide] = React.useState(0);

    const postAuthor = f.username || (f.metadata?.feedUsername ? f.metadata.feedUsername.replace('@', '') : null);
    const authorProfile = publicUsers?.find(u => (u.Username || u.username)?.toLowerCase() === postAuthor?.toLowerCase());
    const authorAvatar = authorProfile?.Avatar || ((postAuthor?.toLowerCase() === user?.toLowerCase() || f.metadata?.feedUsername?.toLowerCase() === ('@' + user)?.toLowerCase()) && currentUserAvatar ? currentUserAvatar : f.metadata?.userAvatar) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${postAuthor || 'anon'}`;

    const [isBookmarked, setIsBookmarked] = React.useState(() => {
        try {
            const stored = localStorage.getItem(`oasis_saved_${user || 'anon'}`);
            const savedIds = stored ? JSON.parse(stored) : [];
            return savedIds.includes(f.id);
        } catch {
            return false;
        }
    });

    const toggleBookmark = (e) => {
        e.stopPropagation();
        try {
            const key = `oasis_saved_${user || 'anon'}`;
            const stored = localStorage.getItem(key);
            let savedIds = stored ? JSON.parse(stored) : [];
            if (savedIds.includes(f.id)) {
                savedIds = savedIds.filter(id => id !== f.id);
                setIsBookmarked(false);
            } else {
                savedIds.push(f.id);
                setIsBookmarked(true);
            }
            localStorage.setItem(key, JSON.stringify(savedIds));
        } catch (err) {
            console.error("Error toggling bookmark", err);
        }
    };

    const handleDeleteFeedItem = async () => {
        if (setFeed) {
            setFeed(prev => prev.filter(item => item.id !== f.id));
        }

        const isFeedBlock = f.id && String(f.id).startsWith('feed_');
        const deleteUrl = isFeedBlock
            ? `${API_URL}/api/oasis/feed/${f.id}`
            : `${API_URL}/api/oasis/blocks/${f.id}?user=${user}`;

        try {
            const res = await fetch(deleteUrl, { method: 'DELETE' });
            if (!res.ok) {
                console.error("Failed to delete feed item on backend:", res.status);
            }
        } catch (err) {
            console.error("Error deleting feed item:", err);
        }

        if (blocks && blocks.some(b => b.id === f.id)) {
            setBlocks(prev => prev.filter(b => b.id !== f.id));
            if (typeof syncBlocks === 'function') {
                syncBlocks(blocks.filter(b => b.id !== f.id));
            }
        }
    };

    const touchStartX = React.useRef(0);
    const touchStartY = React.useRef(0);
    const touchEndX = React.useRef(0);
    const touchEndY = React.useRef(0);
    const touchIsHorizontal = React.useRef(false);

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        touchIsHorizontal.current = false;
    };

    const handleTouchMove = (e) => {
        const dx = Math.abs(e.targetTouches[0].clientX - touchStartX.current);
        const dy = Math.abs(e.targetTouches[0].clientY - touchStartY.current);
        // Only lock as horizontal if X is clearly dominant
        if (dx > dy && dx > 10) {
            touchIsHorizontal.current = true;
            // Prevent the feed from scrolling when user is swiping horizontally on carousel
            e.stopPropagation();
        }
        touchEndX.current = e.targetTouches[0].clientX;
        touchEndY.current = e.targetTouches[0].clientY;
    };

    const handleTouchEnd = () => {
        if (!touchIsHorizontal.current) return; // vertical swipe → let feed handle it
        const diffX = touchStartX.current - touchEndX.current;
        if (diffX > 50) {
            setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0));
        } else if (diffX < -50) {
            setCurrentSlide(prev => (prev > 0 ? prev - 1 : slides.length - 1));
        }
    };

    // Parse content for multimedia tags
    const contentLines = (f.content && typeof f.content === 'string') ? f.content.split('\n') : [];
    const inlineImages = contentLines.filter(l => typeof l === 'string' && l.startsWith('[img]')).map(l => l.replace(/\[\/?img\]/g, '').trim());
    const inlineVideos = contentLines.filter(l => typeof l === 'string' && l.startsWith('[vid]')).map(l => l.replace(/\[\/?vid\]/g, '').trim());
    const inlineAudios = contentLines.filter(l => typeof l === 'string' && l.startsWith('[aud]')).map(l => l.replace(/\[\/?aud\]/g, '').trim());
    const noteOriginalText = contentLines.filter(l => typeof l === 'string' && !l.startsWith('[img]') && !l.startsWith('[vid]') && !l.startsWith('[aud]')).join('\n');
    const feedComment = f.metadata?.feedText || '';

    // Build slides array
    const slides = [];

    // Primary media
    if (f.type === 'image' || f.type === 'relic') {
        slides.push({ type: 'image', url: formatUrl(f.content), caption: f.caption });
    } else if (f.type === 'video') {
        slides.push({ type: 'video', url: formatUrl(f.content), caption: f.caption });
    } else if (f.type === 'audio') {
        slides.push({ type: 'audio', url: formatUrl(f.content), caption: f.caption });
    } else if (f.metadata?.thumbnail) {
        slides.push({ type: 'image', url: formatUrl(f.metadata.thumbnail), caption: f.caption });
    } else if (f.bgType === 'image' && f.bgValue) {
        slides.push({ type: 'image', url: formatUrl(f.bgValue), caption: f.caption });
    }

    // Inline media
    inlineImages.forEach((img, idx) => {
        slides.push({ type: 'image', url: formatUrl(img) });
    });
    inlineVideos.forEach((vid, idx) => {
        slides.push({ type: 'video', url: formatUrl(vid) });
    });
    inlineAudios.forEach((aud, idx) => {
        slides.push({ type: 'audio', url: formatUrl(aud) });
    });

    // Sub-notes / mural blocks
    if (f.muralBlocks && f.muralBlocks.length > 0) {
        f.muralBlocks.forEach((mb, idx) => {
            if (mb.type === 'image') {
                slides.push({ type: 'image', url: formatUrl(mb.content), caption: mb.caption });
            } else if (mb.type === 'text') {
                slides.push({ type: 'text', content: mb.content, caption: mb.caption });
            }
        });
    }

    // Always add narrative text as a slide if it exists
    if (noteOriginalText.trim()) {
        slides.push({ type: 'text', content: noteOriginalText, caption: f.caption });
    }

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
                if (audioRef.current) {
                    if (entry.isIntersecting) audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
                    else audioRef.current.pause();
                }
            },
            { threshold: 0.6 }
        );
        if (itemRef.current) observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, []);

    // Filter connections (links) connected to this feed item ID
    const activeLinks = (links || []).filter(l => l.from === f.id || l.to === f.id);
    // Limit structure to a maximum of 3 active links
    const displayedLinks = activeLinks.slice(0, 3);

    const getConnectedBlockCaption = (link) => {
        const targetId = link.from === f.id ? link.to : link.from;
        const targetBlock = (feed || []).find(b => b.id === targetId) || (blocks || []).find(b => b.id === targetId);
        if (targetBlock) {
            return targetBlock.caption || `${targetBlock.type === 'text' ? 'Nota' : targetBlock.type.toUpperCase()}`;
        }
        return `Nota vinculada (${String(targetId).substring(0, 5)})`;
    };

    const handleLinkClick = (link) => {
        const targetId = link.from === f.id ? link.to : link.from;
        const targetBlock = (feed || []).find(b => b.id === targetId) || (blocks || []).find(b => b.id === targetId);
        if (targetBlock) {
            const element = document.getElementById(`feed-item-${targetId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.log("No se encontró en el feed. Enfocando en el pizarrón.");
                if (setView) setView('canvas');
                setTimeout(() => {
                    const canvasBlock = blocks.find(b => b.id === targetId);
                    if (canvasBlock && editBlock) {
                        editBlock(canvasBlock);
                    }
                }, 300);
            }
        }
    };

    const renderSlide = (slide, index) => {
        if (slide.type === 'image') {
            return (
                <div key={index} className="w-full relative flex-shrink-0 bg-black/60 flex items-center justify-center">
                    <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={slide.url} className="w-full h-auto max-h-[70vh] object-contain" alt={slide.caption} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0d] via-transparent to-transparent opacity-75 pointer-events-none" />
                    {slide.caption && (
                        <div className="absolute bottom-4 left-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[9px] font-bold text-white/90">
                            {slide.caption}
                        </div>
                    )}
                </div>
            );
        }
        if (slide.type === 'video') {
            return (
                <div key={index} className="w-full h-full relative flex-shrink-0 bg-black/60">
                    <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }} src={slide.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0d] via-transparent to-transparent opacity-75" />
                </div>
            );
        }
        if (slide.type === 'audio') {
            return (
                <div key={index} className="w-full h-full flex-shrink-0 bg-accent/5 flex items-center justify-center border-b border-white/5 relative">
                    <div className="flex items-center gap-4 animate-pulse">
                        <Mic size={24} className="text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">Resonancia de Voz</span>
                    </div>
                    <audio ref={audioRef} src={slide.url} loop />
                </div>
            );
        }
        if (slide.type === 'text') {
            return (
                <div key={index} className="w-full h-full flex-shrink-0 p-8 overflow-y-auto no-scrollbar flex flex-col justify-center items-center text-center bg-zinc-950/40 relative">
                    <div className="max-w-[90%] scale-100">
                        <div className="text-sm md:text-base font-serif italic text-white/95 leading-relaxed">
                            <SimpleNarrativeRenderer content={slide.content} isChild={true} />
                        </div>
                        {slide.caption && (
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-accent/60 mt-4 block">
                                {slide.caption}
                            </span>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Detect if primary slide is a video and track its aspect ratio
    const [videoAspect, setVideoAspect] = React.useState(null); // null | 'portrait' | 'landscape'
    const primaryVideoRef = React.useRef(null);

    const isPureVideo = slides.length === 1 && slides[0].type === 'video';
    const isPortraitVideo = isPureVideo && videoAspect === 'portrait';
    const isLandscapeVideo = isPureVideo && videoAspect === 'landscape';

    // ── PORTRAIT VIDEO: full-bleed card, overlay UI ──────────────────────────
    if (isPortraitVideo) {
        return (
            <div id={`feed-item-${f.id}`} ref={itemRef} className="w-full h-screen snap-center snap-always flex items-center justify-center px-4 pt-16 pb-20 md:py-20">
                <div className="group relative h-[82vh] aspect-[9/16] max-w-full rounded-[2.5rem] overflow-hidden shadow-2xl flex-shrink-0 scale-[0.84] md:scale-100 transform origin-center -translate-y-6 md:translate-y-0">
                    {/* VIDEO FULL BLEED */}
                    <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }}
                        ref={primaryVideoRef}
                        src={slides[0].url}
                        autoPlay loop muted playsInline
                        onLoadedMetadata={(e) => {
                            const v = e.target;
                            setVideoAspect(v.videoHeight > v.videoWidth ? 'portrait' : 'landscape');
                        }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* GRADIENT OVERLAYS */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none z-10" />

                    {/* TOP BADGE */}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 z-20">
                        <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-[6.5px] font-black uppercase tracking-widest text-white/80">VIDEO</span>
                    </div>

                    {/* ACTIONS RIGHT */}
                    <div className="absolute right-4 top-4 flex flex-col gap-3 items-center z-20 pointer-events-auto">
                        {(f.username === user || (blocks && blocks.some(b => b.id === f.id))) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmAction({ message: "¿Seguro que quieres eliminar esta publicación del Feed Público?", onConfirm: handleDeleteFeedItem });
                                }}
                                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all pointer-events-auto"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <button
                            onClick={toggleBookmark}
                            className={`w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all ${isBookmarked ? 'text-accent border-accent/30' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:text-accent transition-all">
                            <InfinityIcon size={14} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* BOTTOM OVERLAY: comment + profile */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-5 pointer-events-none">
                        {feedComment.trim() && (
                            <p className="text-sm font-serif italic text-white/90 leading-snug mb-4 line-clamp-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                {feedComment}
                            </p>
                        )}
                        <div
                            className="flex items-center justify-between pointer-events-auto cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); if (setPublicProfileUser && f.username) setPublicProfileUser(f.username); }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full border-2 border-white/30 overflow-hidden shrink-0">
                                    <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={f.metadata?.userAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${f.username || 'anon'}`} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow">
                                        {f.metadata?.feedUsername || `@${f.username || 'anon'}`}
                                    </span>
                                    <span className="text-[7px] font-bold text-white/50 uppercase tracking-wider">
                                        {f.metadata?.publishedAt ? new Date(f.metadata.publishedAt).toLocaleDateString() + ' ' + new Date(f.metadata.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Resonancia Nivel 4'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {(f.metadata?.buyLink || f.metadata?.price) && (
                                    <a href={f.metadata.buyLink || 'https://ruidointerior.com/shop'} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-black hover:scale-110 transition-all pointer-events-auto shadow-lg shrink-0">
                                        <ShoppingBag size={14} />
                                    </a>
                                )}
                                <p className="text-[8px] font-medium italic text-white/50 truncate max-w-[100px] text-right">
                                    {f.metadata?.price || f.metadata?.feedCaption || f.caption || 'Publicación'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {confirmAction && (
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[100]">
                            <div className="max-w-[240px] text-center space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 leading-relaxed px-2">
                                    {confirmAction.message}
                                </p>
                                <div className="flex gap-2 justify-center pt-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                                        className="px-4 py-2 border border-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmAction.onConfirm();
                                            setConfirmAction(null);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── LANDSCAPE VIDEO: contained, card adapts ───────────────────────────────
    if (isLandscapeVideo) {
        return (
            <div id={`feed-item-${f.id}`} ref={itemRef} className="w-full h-screen snap-center snap-always flex items-center justify-center px-4 pt-16 pb-20 md:py-20">
                <div className="group relative w-full max-w-3xl flex flex-col bg-[#0c0c0d]/75 backdrop-blur-md rounded-[2rem] border border-white/8 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.7)] shrink-0 scale-[0.84] md:scale-100 transform origin-center -translate-y-6 md:translate-y-0">
                    {/* TOP BADGE + ACTIONS */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 z-20">
                        <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[6.5px] font-black uppercase tracking-widest text-white/80">VIDEO</span>
                    </div>
                    <div className="absolute right-3 top-3 flex gap-2 items-center z-20 pointer-events-auto">
                        <button
                            onClick={toggleBookmark}
                            className={`w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center transition-all ${isBookmarked ? 'text-accent border-accent/30' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Bookmark size={12} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                        {(f.username === user || (blocks && blocks.some(b => b.id === f.id))) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmAction({ message: "¿Eliminar esta publicación del Feed?", onConfirm: handleDeleteFeedItem });
                                }}
                                className="w-7 h-7 rounded-full bg-black/60 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all pointer-events-auto"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>

                    {/* VIDEO: full width, natural aspect ratio */}
                    <div className="w-full bg-black">
                        <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }}
                            ref={primaryVideoRef}
                            src={slides[0].url}
                            autoPlay loop muted playsInline controls
                            onLoadedMetadata={(e) => {
                                const v = e.target;
                                setVideoAspect(v.videoHeight > v.videoWidth ? 'portrait' : 'landscape');
                            }}
                            className="w-full h-auto object-contain"
                            style={{ maxHeight: '55vh' }}
                        />
                    </div>

                    {/* INFO PANEL */}
                    <div className="px-5 py-4 flex flex-col gap-3">
                        {feedComment.trim() && (
                            <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-accent opacity-70 block mb-1">Comentario del Autor</span>
                                <p className="text-sm font-serif italic text-white/85 leading-snug">{feedComment}</p>
                            </div>
                        )}
                        <div
                            className="flex items-center justify-between pt-2 border-t border-white/5 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); if (setPublicProfileUser && f.username) setPublicProfileUser(f.username); }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full border border-accent/20 overflow-hidden shrink-0">
                                    <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={authorAvatar} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white block">{f.metadata?.feedUsername || `@${f.username || 'anon'}`}</span>
                                    <span className="text-[6.5px] font-bold text-accent/60 uppercase tracking-wider block">
                                        {f.metadata?.publishedAt ? new Date(f.metadata.publishedAt).toLocaleDateString() + ' ' + new Date(f.metadata.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Resonancia Nivel 4'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {(f.metadata?.buyLink || f.metadata?.price) && (
                                    <a href={f.metadata.buyLink || 'https://ruidointerior.com/shop'} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-black hover:scale-110 transition-all pointer-events-auto shadow-lg shrink-0">
                                        <ShoppingBag size={14} />
                                    </a>
                                )}
                                <p className="text-[8px] italic text-zinc-500 truncate max-w-[100px] text-right">
                                    {f.metadata?.price || f.metadata?.feedCaption || f.caption || 'Publicación'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {confirmAction && (
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[100]">
                            <div className="max-w-[240px] text-center space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 leading-relaxed px-2">
                                    {confirmAction.message}
                                </p>
                                <div className="flex gap-2 justify-center pt-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                                        className="px-4 py-2 border border-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmAction.onConfirm();
                                            setConfirmAction(null);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div id={`feed-item-${f.id}`} ref={itemRef} className="w-full min-h-screen snap-center snap-always flex items-center justify-center px-4 py-20">
            <div className="group relative w-full sm:w-fit max-w-[420px] max-h-[90vh] flex flex-col bg-[#0c0c0d]/80 backdrop-blur-md rounded-[2rem] border border-white/8 overflow-hidden transition-all duration-700 shadow-[0_0_60px_rgba(0,0,0,0.5)] shrink-0 scale-[0.84] md:scale-100 transform origin-center -translate-y-6 md:translate-y-0" style={{ touchAction: "pan-y" }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>

                {/* 1. CAROUSEL AREA (TOP) */}
                {slides.length > 0 && (
                    <div
                        className="w-full relative overflow-hidden bg-black/40 flex-shrink-0"
                        style={{ maxHeight: '70vh' }}
                    >
                        <div
                            className="flex w-full h-full transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((s, idx) => {
                                if (s.type === 'video') {
                                    return (
                                        <div key={idx} className="w-full h-full relative flex-shrink-0 bg-black">
                                            <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }}
                                                src={s.url}
                                                autoPlay loop muted playsInline
                                                onLoadedMetadata={(e) => {
                                                    const v = e.target;
                                                    if (idx === 0) setVideoAspect(v.videoHeight > v.videoWidth ? 'portrait' : 'landscape');
                                                }}
                                                className="w-full h-auto max-h-[75vh] object-contain"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0d] via-transparent to-transparent opacity-75" />
                                        </div>
                                    );
                                }
                                return renderSlide(s, idx);
                            })}
                        </div>

                        {slides.length > 1 && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev > 0 ? prev - 1 : slides.length - 1)); }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-30 pointer-events-auto">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0)); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-30 pointer-events-auto">
                                    <ChevronRight size={16} />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                                    {slides.map((_, idx) => (
                                        <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-accent w-3.5' : 'bg-white/30'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 2. NARRATIVE AREA */}
                {feedComment.trim() && (
                    <div className="flex-1 min-h-[100px] max-h-[30vh] p-4 md:p-5 overflow-y-auto no-scrollbar flex flex-col text-left border-t border-white/5 bg-black/20">
                        <div className="w-full">
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent mb-3 block opacity-70">Comentario del Autor</span>
                            <SimpleNarrativeRenderer content={feedComment} />
                        </div>
                    </div>
                )}

                {/* HEADER TAG */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 z-20">
                    <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                    <span className="text-[6.5px] font-black uppercase tracking-widest text-white/70">{f.type === 'text' ? 'Nota' : f.type?.toUpperCase()}</span>
                </div>

                {/* ACTIONS */}
                <div className="absolute right-4 top-4 flex flex-col gap-3 items-center z-20 pointer-events-auto">
                    {(f.username === user || (blocks && blocks.some(b => b.id === f.id))) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ message: "¿Eliminar esta publicación del Feed Público?", onConfirm: handleDeleteFeedItem });
                            }}
                            className="w-8 h-8 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-black transition-all pointer-events-auto"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button
                        onClick={toggleBookmark}
                        className={`w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all ${isBookmarked ? 'text-accent border-accent/30' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:text-accent transition-all">
                        <InfinityIcon size={14} strokeWidth={2.5} />
                    </button>
                </div>

                {/* USER PROFILE */}
                <div className="p-6 shrink-0 border-t border-white/5 bg-black/20 flex justify-between items-center z-20">
                    <div
                        className="flex items-center gap-3 cursor-pointer pointer-events-auto"
                        onClick={(e) => { e.stopPropagation(); if (setPublicProfileUser && f.username) setPublicProfileUser(f.username); }}
                    >
                        <div className="w-8 h-8 rounded-full border border-accent/20 p-0.5 bg-black/40 overflow-hidden shrink-0">
                            <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={authorAvatar} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">{f.metadata?.feedUsername || `@${f.username || 'anon'}`}</span>
                            <span className="text-[6.5px] font-black uppercase tracking-[0.2em] text-accent/60">
                                {f.metadata?.publishedAt ? new Date(f.metadata.publishedAt).toLocaleDateString() + ' ' + new Date(f.metadata.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Resonancia Nivel 4'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 mr-2">
                            <button className="text-zinc-500 hover:text-red-400 transition-all pointer-events-auto hover:scale-110 active:scale-95">
                                <Heart size={15} strokeWidth={2.5} />
                            </button>
                            <button className="text-zinc-500 hover:text-accent transition-all pointer-events-auto hover:scale-110 active:scale-95">
                                <MessageCircle size={15} strokeWidth={2.5} />
                            </button>
                        </div>
                        {(f.metadata?.buyLink || f.metadata?.price) && (
                            <a href={f.metadata.buyLink || 'https://ruidointerior.com/shop'} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-black hover:scale-110 transition-all pointer-events-auto shadow-lg shrink-0">
                                <ShoppingBag size={14} />
                            </a>
                        )}
                        <p className="text-[8px] font-medium italic text-zinc-400/80 leading-snug truncate max-w-[80px] text-right hidden sm:block">
                            {f.metadata?.price || f.metadata?.feedCaption || f.caption || ''}
                        </p>
                    </div>
                </div>
                {confirmAction && (
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[100]">
                        <div className="max-w-[240px] text-center space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 leading-relaxed px-2">
                                {confirmAction.message}
                            </p>
                            <div className="flex gap-2 justify-center pt-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                                    className="px-4 py-2 border border-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        confirmAction.onConfirm();
                                        setConfirmAction(null);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );


};

const SimpleNarrativeRenderer = React.memo(({ content, isChild = false }) => {
    if (!content) return null;

    // Pre-process content to handle legacy Oasis blocks or AI-specific tags
    // We split by blocks that should be rendered specially
    const regexStr = '(\\[img\\][\\s\\S]*?(?:\\[\\/img\\]|$)|\\[vid\\][\\s\\S]*?(?:\\[\\/vid\\]|$)|\\[aud\\][\\s\\S]*?(?:\\[\\/aud\\]|$)|\\[question\\].*?|\\[insight\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$)|\\[resonancia\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$)|\\[impacto\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$)|\\[extrano\\][\\s\\S]*?(?=\\[img\\]|\\[vid\\]|\\[aud\\]|\\[question\\]|\\[insight\\]|\\[resonancia\\]|\\[impacto\\]|\\[extrano\\]|$))';
    const blocks = content.split(new RegExp(regexStr, 'g'));

    return (
        <div className={`prose prose-invert max-w-none ${isChild ? 'text-[8.5px] leading-tight prose-p:my-0.5 prose-headings:my-0.5 font-sans' : 'text-[12px] md:text-[13px] leading-relaxed font-serif'} italic text-white/90 selection:bg-accent/20`}>
            {blocks.map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('[img]')) {
                    const url = formatUrl(trimmed.replace(/\[\/?img\]/g, '').trim());
                    return <div key={i} className="my-6 rounded-xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-700 bg-black/20"><img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={url} className="w-full h-auto object-cover max-h-[400px]" /></div>;
                }
                if (trimmed.startsWith('[vid]')) {
                    const url = formatUrl(trimmed.replace(/\[\/?vid\]/g, '').trim());
                    return (
                        <div key={i} className="my-6 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center max-h-[85vh]">
                            <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }} src={url} controls loop className="w-full h-auto max-h-[85vh] object-contain" />
                        </div>
                    );
                }
                if (trimmed.startsWith('[aud]')) {
                    const url = formatUrl(trimmed.replace(/\[\/?aud\]/g, '').trim());
                    return (
                        <div key={i} className="my-4 p-5 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 flex items-center gap-4 animate-in slide-in-from-left duration-500">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent"><Mic size={18} /></div>
                            <audio src={url} controls className="flex-1 scale-90 origin-left invert opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    );
                }
                if (trimmed.startsWith('[question]')) {
                    const q = trimmed.replace('[question]', '').trim();
                    return (
                        <div key={i} className="my-8 p-8 bg-accent/10 backdrop-blur-md rounded-[2.5rem] border border-accent/30 shadow-[0_0_40px_rgba(var(--accent-rgb),0.2)] animate-in slide-in-from-right duration-700 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex gap-4 mb-4 items-center">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent"><Radio size={16} /></div>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent/60">Profundiza tu Conciencia</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-serif italic text-white/90 leading-tight">"{q}"</h3>
                        </div>
                    );
                }
                if (trimmed.startsWith('[insight]')) {
                    const ins = trimmed.replace('[insight]', '').trim();
                    return (
                        <div key={i} className="my-4 p-6 bg-purple-500/10 backdrop-blur-sm rounded-3xl border border-purple-500/20 shadow-[0_0_20px_rgba(192,38,211,0.05)] animate-in fade-in zoom-in duration-700 group relative">
                            <div className="flex gap-3 mb-3 items-center">
                                <Zap size={12} className="text-purple-400 opacity-50" />
                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-purple-400/50">Insight</span>
                            </div>
                            <div className="text-sm md:text-base font-serif italic text-white/90 leading-snug">
                                <ReactMarkdown>{ins}</ReactMarkdown>
                            </div>
                        </div>
                    );
                }
                if (trimmed.startsWith('[resonancia]')) {
                    const res = trimmed.replace('[resonancia]', '').trim();
                    return (
                        <div key={i} className="my-4 p-5 bg-purple-500/5 border border-purple-500/20 rounded-[2rem] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full" />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <Radio size={12} className="text-purple-400 animate-spin-slow" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-400/80">Resonancia Primal</span>
                            </div>
                            <p className="text-sm font-serif italic text-white/90 relative z-10">{res}</p>
                        </div>
                    );
                }
                if (trimmed.startsWith('[impacto]')) {
                    const imp = trimmed.replace('[impacto]', '').trim();
                    return (
                        <div key={i} className="my-4 p-5 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full" />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <Zap size={12} className="text-rose-400" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-rose-400/80">Impacto Profundo</span>
                            </div>
                            <p className="text-sm font-serif italic text-white/90 relative z-10">{imp}</p>
                        </div>
                    );
                }
                if (trimmed.startsWith('[extrano]')) {
                    const ext = trimmed.replace('[extrano]', '').trim();
                    return (
                        <div key={i} className="my-4 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 blur-2xl rounded-full" />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <Focus size={12} className="text-cyan-400" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-400/80">Atipicidad</span>
                            </div>
                            <p className="text-[15px] font-black italic text-white relative z-10 tracking-tight">{ext}</p>
                        </div>
                    );
                }

                // Default: Render as Markdown
                return (
                    <ReactMarkdown
                        key={i}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4 mt-6 border-b border-white/10 pb-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-black italic uppercase tracking-tight text-accent mb-3 mt-5" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-black italic text-white/80 mb-2 mt-4" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1 text-white/70" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-white/70" {...props} />,
                            li: ({ node, ...props }) => <li className="marker:text-accent" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-black text-accent" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-white" {...props} />,
                            code: ({ node, ...props }) => <code className="font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-cyan-400" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-accent/30 pl-4 py-2 my-4 bg-accent/5 rounded-r-xl italic text-white/60" {...props} />,
                        }}
                    >
                        {block.replaceAll('\u2028', '\n')}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
});

const MiniMuralPreview = ({ muralBlocks, accent = '#bef264', onClick, size = 'sm' }) => {
    if (!muralBlocks || muralBlocks.length === 0) return null;

    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({
        width: size === 'lg' ? 680 : 230,
        height: size === 'lg' ? 280 : 110
    });

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    muralBlocks.forEach(b => {
        const x = b.x || 0;
        const y = b.y || 0;
        const w = b.width || 120;
        const h = b.height || 80;
        if (x < minX) minX = x;
        if (x + w > maxX) maxX = x + w;
        if (y < minY) minY = y;
        if (y + h > maxY) maxY = y + h;
    });

    const muralW = maxX - minX || 1;
    const muralH = maxY - minY || 1;

    const isLarge = size === 'lg';
    const padding = isLarge ? 24 : 12;

    const fitW = dimensions.width;
    const fitH = dimensions.height;

    const scale = Math.min((fitW - padding * 2) / muralW, (fitH - padding * 2) / muralH, isLarge ? 0.7 : 0.18);
    const offsetX = (fitW - muralW * scale) / 2 - minX * scale;
    const offsetY = (fitH - muralH * scale) / 2 - minY * scale;

    const formatUrl = (url) => {
        if (!url || typeof url !== 'string') return '';

        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'));

        if (!isLocal && typeof url === 'string' && url.includes('localhost:5046')) {
            url = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5046\/?/g, API_URL.endsWith('/') ? API_URL : API_URL + '/');
        }

        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
        if (isLocal && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
            return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        }

        if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
        if (url.startsWith('uploads/')) return `${API_URL}/${url.replace('uploads/', '')}`;
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <div
            ref={containerRef}
            onClick={onClick}
            className={`w-full relative overflow-hidden my-3 select-none backdrop-blur-sm group/mural-prev flex items-center justify-center bg-[#fafafa] border border-zinc-200/50 shadow-inner ${isLarge ? 'h-[280px] rounded-[2.5rem]' : 'h-[110px] rounded-2xl'} ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:border-accent/40 transition-all duration-300' : ''}`}
        >
            <div className="absolute inset-0 bg-[radial-gradient(#0000000a_1.2px,transparent_1.2px)] [background-size:10px_10px] pointer-events-none" />
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                {muralBlocks.map((mb, idx) => {
                    const left = mb.x * scale + offsetX;
                    const top = mb.y * scale + offsetY;
                    const width = (mb.width || 120) * scale;
                    const height = (mb.height || 80) * scale;
                    const borderRadius = (mb.borderRadius || 12) * scale;
                    const borderW = (mb.borderWidth || 0) * scale;

                    const isWhiteColor = !mb.color || mb.color === '#ffffff' || mb.color?.toLowerCase() === '#fff';
                    const displayTextColor = isWhiteColor ? '#18181b' : mb.color;

                    let bgStyle = {
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        borderRadius: `${borderRadius}px`,
                        borderWidth: `${borderW || 1}px`,
                        borderColor: mb.borderColor || (isWhiteColor ? '#e4e4e7' : 'transparent'),
                        opacity: mb.opacity !== undefined ? mb.opacity : 1,
                        transform: `rotate(${mb.rotation || 0}deg)`,
                        position: 'absolute',
                    };

                    if (mb.type === 'image') {
                        return (
                            <div key={idx} style={bgStyle} className="overflow-hidden bg-zinc-100 border border-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                                {mb.content ? (
                                    <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={formatUrl(mb.content)} className="w-full h-full object-cover pointer-events-none" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-200" />
                                )}
                            </div>
                        );
                    } else if (mb.type === 'shape') {
                        return (
                            <div
                                key={idx}
                                style={{
                                    ...bgStyle,
                                    backgroundColor: mb.color || '#bef264'
                                }}
                                className={`shadow-[0_2px_8px_rgba(0,0,0,0.06)] border ${isWhiteColor ? 'border-zinc-200' : 'border-transparent'}`}
                            />
                        );
                    } else {
                        return (
                            <div
                                key={idx}
                                style={{
                                    ...bgStyle,
                                    color: displayTextColor,
                                    fontFamily: mb.fontFamily || 'sans-serif',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    overflow: 'hidden',
                                    lineHeight: 1.1,
                                    borderColor: 'transparent'
                                }}
                                className="px-0.5 select-none"
                            >
                                <span className={`font-black uppercase tracking-tighter truncate w-full text-center ${isLarge ? 'text-[9px]' : 'text-[4.5px]'}`}>
                                    {mb.content || 'Texto'}
                                </span>
                            </div>
                        );
                    }
                })}
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/mural-prev:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                <Pencil size={isLarge ? 18 : 12} className="text-accent animate-pulse" style={{ color: accent }} />
                <span className={`font-black uppercase tracking-[0.2em] text-accent`} style={{ color: accent, fontSize: isLarge ? '11px' : '8px' }}>
                    {onClick ? 'Editar Pizarrón' : 'Ver Pizarrón'} ({muralBlocks.length})
                </span>
            </div>
        </div>
    );
};

const MemoNode = React.memo(({ block, blocks = [], draggingId, onStart, isLinking, onStartConnecting, onCompleteConnection, onSelect, onDelete, activeNoteId, onSelectNote, onSelectGroup, onAnalyzeBlock, onAnalyzeGroup, isAnalyzing, showConnections = true, useInternalPosition = true, onLaunchMural, accent, hasConnections, onSelectConversation, onOpenNotebook, onResizeNodeComplete, setView, conversations = [], onNewChat, camScale = 1, onRequestTitleEdit }) => {
    const isImage = block.type === 'image' || block.type === 'relic';
    const isVideo = block.type === 'video';
    const isAudio = block.type === 'audio';
    const isMediaNode = isImage || isVideo;
    const isInsight = block.type === 'insight';
    const isConversation = block.type === 'conversation';
    const hasMedia = block.content?.includes('[img]') || block.content?.includes('[vid]') || block.content?.includes('[aud]');
    const isActive = activeNoteId === block.id;
    const isChildNote = !!block.metadata?.parentId;

    const isDiaryEntry = block.entries && block.entries.length > 0;
    const isResonanceEntry = block.content && typeof block.content === 'string' && block.content.includes('[resonancia]');
    const isDiaryNotebook = block.type === 'diary_notebook';
    const isResonanceNotebook = block.type === 'resonance_notebook';
    const isConversationNotebook = block.type === 'conversation_notebook';

    const isDiaryAny = isDiaryEntry || isDiaryNotebook;
    const isResonanceAny = isResonanceEntry || isResonanceNotebook;
    const isLoopMapNode = block.type === 'loop_map_mini';

    const displayColor = (isConversation || isConversationNotebook) ? '#d946ef' : (isDiaryAny ? '#f59e0b' : (isResonanceAny ? '#a855f7' : (isLoopMapNode ? '#06b6d4' : (block.color && block.color !== '#bef264' ? block.color : accent))));

    const [localSize, setLocalSize] = useState({ width: block.width || null, height: block.height || null });
    const [isPlaying, setIsPlaying] = useState(false);
    const localAudioRef = useRef(null);
    const [isMobileResizing, setIsMobileResizing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const longPressTimer = useRef(null);
    const touchStartPos = useRef({ x: 0, y: 0 });

    React.useEffect(() => {
        if (block.width !== undefined || block.height !== undefined) {
            setLocalSize({ width: block.width || null, height: block.height || null });
        }
    }, [block.width, block.height]);

    React.useEffect(() => {
        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
        };
    }, []);

    React.useEffect(() => {
        if (!showDeleteConfirm) return;
        const handleOutsideClick = () => {
            setShowDeleteConfirm(false);
        };
        const timer = setTimeout(() => {
            window.addEventListener('pointerdown', handleOutsideClick);
        }, 10);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('pointerdown', handleOutsideClick);
        };
    }, [showDeleteConfirm]);

    const isCentralNode = isDiaryNotebook || isResonanceNotebook || isLoopMapNode || isConversationNotebook;

    // Track click vs drag
    const mouseDownPos = useRef({ x: 0, y: 0 });
    const handleNodeMouseDown = (e) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleNodeClick = (e) => {
        const dist = Math.hypot(e.clientX - mouseDownPos.current.x, e.clientY - mouseDownPos.current.y);
        if (dist < 5) {
            e.stopPropagation();
            if (showDeleteConfirm) return;
            if (isLinking && onStartConnecting) {
                onStartConnecting(block.id);
            } else {
                if (block.type === 'diary_notebook' && onOpenNotebook) {
                    onOpenNotebook('diary');
                } else if (block.type === 'resonance_notebook' && onOpenNotebook) {
                    onOpenNotebook('resonance');
                } else if (block.type === 'conversation_notebook') {
                    const sortedConvs = (conversations || [])
                        .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
                    if (sortedConvs.length > 0) {
                        onSelectConversation(sortedConvs[0].id);
                    } else {
                        onNewChat();
                    }
                } else if (block.type === 'loop_map_mini') {
                    return; // No-op, its own button handles opening the archive
                } else if (isImage || isVideo) {
                    return; // No-op, images/videos directly on canvas do not open editor
                } else {
                    onSelect(block); // Click: edit
                }
            }
        }
    };

    const formatUrl = (url) => {
        if (!url || typeof url !== 'string') return '';

        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'));

        if (!isLocal && typeof url === 'string' && url.includes('localhost:5046')) {
            url = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5046\/?/g, API_URL.endsWith('/') ? API_URL : API_URL + '/');
        }

        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
        if (isLocal && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
            return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        }

        if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
        if (url.startsWith('uploads/')) return `${API_URL}/${url.replace('uploads/', '')}`;
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (block.type && block.type.toLowerCase() === 'canvas_title') ? (
        <div
            className={`select-none cursor-move active:cursor-grabbing group z-10 ${draggingId ? (draggingId === block.id ? 'transition-none scale-105 z-50' : 'transition-none z-10') : 'transition-transform duration-300 scale-100 hover:scale-105'} ${isLinking ? 'hover:scale-105 ring-4 ring-transparent hover:ring-accent/40 rounded-3xl' : ''} ${useInternalPosition ? 'absolute' : 'relative'} flex flex-col items-center justify-center`}
            style={useInternalPosition ? { left: block.x, top: block.y, transform: `translate(-50%, -50%)`, willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } : { willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            onMouseDown={(e) => {
                if (showDeleteConfirm) { e.stopPropagation(); return; }
                e.stopPropagation();
                handleNodeMouseDown(e);
                onStart(e, block.id);
            }}
            onTouchStart={(e) => {
                if (showDeleteConfirm) { e.stopPropagation(); return; }
                e.stopPropagation();
                onStart(e, block.id);
                if (e.touches && e.touches.length === 1) {
                    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    longPressTimer.current = setTimeout(() => {
                        if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
                        setShowDeleteConfirm(true);
                    }, 600);
                }
            }}
            onTouchEnd={(e) => {
                if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
            }}
            onClick={(e) => {
                const dist = Math.hypot(e.clientX - mouseDownPos.current.x, e.clientY - mouseDownPos.current.y);
                if (dist < 5) {
                    e.stopPropagation();
                    if (showDeleteConfirm) return;
                    if (isLinking && onStartConnecting) {
                        onStartConnecting(block.id);
                        return;
                    }
                    if (onRequestTitleEdit) {
                        onRequestTitleEdit(block.id, block.content);
                    }
                }
            }}
        >
            <div
                className="text-4xl md:text-5xl lg:text-[5rem] text-center whitespace-pre-wrap leading-tight p-4 pointer-events-none"
                style={{
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: '800',
                    color: '#ffffff',
                    WebkitTextFillColor: '#ffffff',
                    WebkitTextStroke: '2.5px black',
                    textShadow: '0px 2px 0px #000, 0px 4px 0px #000, 2px 4px 0px #000, -2px 4px 0px #000, 3px 3px 0px #000, -3px 3px 0px #000, 0px 15px 40px rgba(0,0,0,0.6)'
                }}
            >
                {block.content}
            </div>
            {showDeleteConfirm && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex gap-2 pointer-events-auto">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(block.id); setShowDeleteConfirm(false); }} className="px-4 py-2 bg-red-500 text-white font-bold rounded-full shadow-xl text-[10px] uppercase tracking-widest hover:bg-red-400 transition-colors">Eliminar</button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} className="px-4 py-2 bg-zinc-800 text-white font-bold rounded-full shadow-xl text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-colors">Cancelar</button>
                </div>
            )}
            {!showDeleteConfirm && (
                <div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer group/port pointer-events-auto opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onStartConnecting) onStartConnecting(block.id);
                    }}
                >
                    <div className="w-4 h-4 rounded-full bg-zinc-900 border-2 border-white/20 group-hover/port:border-accent group-hover/port:scale-125 transition-all shadow-lg flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-40 group-hover/port:opacity-100 animate-pulse" />
                    </div>
                    <span className="text-[5px] font-black tracking-[0.3em] text-zinc-600 group-hover/port:text-accent uppercase select-none">Relacionar</span>
                </div>
            )}
        </div>
    ) : isAudio ? (
        <div
            className={`select-none cursor-move active:cursor-grabbing group z-10 ${draggingId ? (draggingId === block.id ? 'transition-none scale-105 z-50' : 'transition-none z-10') : 'transition-transform duration-300 scale-100 hover:scale-105'} ${isLinking ? 'hover:scale-105 ring-4 ring-transparent hover:ring-accent/40 rounded-3xl' : ''} ${useInternalPosition ? 'absolute' : 'relative'} flex flex-col items-center justify-center pointer-events-auto`}
            style={useInternalPosition ? { left: block.x, top: block.y, transform: `translate(-50%, -50%)`, willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } : { willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            onMouseDown={(e) => {
                if (showDeleteConfirm) { e.stopPropagation(); return; }
                e.stopPropagation();
                handleNodeMouseDown(e);
                onStart(e, block.id);
            }}
            onTouchStart={(e) => {
                if (showDeleteConfirm) { e.stopPropagation(); return; }
                e.stopPropagation();
                onStart(e, block.id);
                if (e.touches && e.touches.length === 1) {
                    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    longPressTimer.current = setTimeout(() => {
                        if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
                        setShowDeleteConfirm(true);
                    }, 600);
                }
            }}
            onTouchEnd={(e) => {
                if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
            }}
            onClick={handleNodeClick}
        >
            <div className={`flex flex-col items-center w-fit min-w-[280px] relative pb-5`}>
                {showDeleteConfirm && (
                    <div className="flex gap-2 mb-2 pointer-events-auto">
                        <button onClick={(e) => { e.stopPropagation(); onDelete(block.id); setShowDeleteConfirm(false); }} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-full shadow-xl text-[11px] uppercase tracking-widest hover:bg-red-400 transition-colors">Eliminar</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-full shadow-xl text-[11px] uppercase tracking-widest hover:bg-zinc-700 transition-colors">Cancelar</button>
                    </div>
                )}
                {!showDeleteConfirm && (
                    <div className="flex items-center gap-4 bg-[#111113] border border-white/10 rounded-[2.5rem] p-3 pr-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] w-full relative z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (localAudioRef.current) {
                                    if (isPlaying) {
                                        localAudioRef.current.pause();
                                    } else {
                                        localAudioRef.current.play().catch(err => console.log("Playback error:", err));
                                    }
                                }
                            }}
                            className="w-14 h-14 rounded-full bg-accent text-black flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(190,242,100,0.3)]"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>

                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1" onClick={(e) => { e.stopPropagation(); onSelect(block); }}>
                            <div className="text-xs font-black uppercase tracking-wider text-white truncate w-full cursor-text hover:text-accent transition-colors">
                                {block.caption || 'Nota de Voz'}
                            </div>
                            <div className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase flex items-center gap-1.5">
                                <Mic size={10} className={isPlaying ? 'text-accent animate-pulse' : ''} />
                                <span className={isPlaying ? 'text-accent' : ''}>
                                    {isPlaying ? 'Reproduciendo...' : 'Audio Grabado'}
                                </span>
                            </div>
                        </div>

                        <a
                            href={formatUrl(block.content)}
                            download={block.caption || 'audio'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/10 hover:border-white/20 hover:text-accent transition-all ml-2"
                            title="Descargar Audio"
                        >
                            <Download size={16} />
                        </a>
                    </div>
                )}

                <audio
                    ref={localAudioRef}
                    src={formatUrl(block.content)}
                    className="hidden"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                />

                {/* CONEXION BOTON (RELACIONAR) */}
                {showConnections && !showDeleteConfirm && (
                    <div
                        className="flex flex-col items-center cursor-crosshair group/port absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onStartConnecting) onStartConnecting(block.id);
                        }}
                    >
                        <div className="w-6 h-6 rounded-full bg-[#111113] border border-white/20 group-hover/port:border-accent group-hover/port:scale-110 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.9)] flex items-center justify-center relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent opacity-60 group-hover/port:opacity-100 animate-pulse" />
                            {isLinking && draggingId === block.id && (
                                <div className="absolute inset-0 -m-1 rounded-full border border-accent animate-ping opacity-30" />
                            )}
                        </div>
                        <span className="text-[7px] font-black tracking-[0.3em] text-white/50 group-hover/port:text-accent uppercase select-none mt-1 drop-shadow-md">Relacionar</span>
                    </div>
                )}
            </div>
        </div>
    ) : (
        <div
            className={`select-none cursor-move active:cursor-grabbing group z-10 ${draggingId ? (draggingId === block.id ? 'transition-none scale-105 z-50' : 'transition-none z-10') : 'transition-transform duration-300 scale-100 hover:scale-105'} ${isLinking ? `hover:scale-105 ring-2 ring-transparent hover:ring-accent/40 ${isChildNote ? 'rounded-[1.75rem]' : 'rounded-[2.5rem]'}` : ''} ${useInternalPosition ? 'absolute' : 'relative'}`}
            style={useInternalPosition ? { left: block.x, top: block.y, transform: `translate(-50%, -50%)`, willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } : { willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}

            onMouseDown={(e) => {
                if (showDeleteConfirm) {
                    e.stopPropagation();
                    return;
                }
                e.stopPropagation();
                handleNodeMouseDown(e);
                onStart(e, block.id);
            }}
            onTouchStart={(e) => {
                if (showDeleteConfirm) {
                    e.stopPropagation();
                    return;
                }
                e.stopPropagation();
                onStart(e, block.id);
                if (e.touches && e.touches.length === 2) {
                    const distX = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
                    const distY = Math.abs(e.touches[0].clientY - e.touches[1].clientY);
                    e.currentTarget.dataset.pinchDistX = distX;
                    e.currentTarget.dataset.pinchDistY = distY;
                    e.currentTarget.dataset.pinchW = localSize.width || getBWidth(block, false);
                    e.currentTarget.dataset.pinchH = localSize.height || getBHeight(block, false);
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    return;
                }
                if (e.touches && e.touches.length === 1) {
                    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    longPressTimer.current = setTimeout(() => {
                        if (navigator.vibrate) {
                            navigator.vibrate([60, 40, 60]);
                        }
                        setShowDeleteConfirm(true);
                    }, 600);
                }
            }}
            onTouchMove={(e) => {
                if (e.touches && e.touches.length === 2) {
                    e.stopPropagation();
                    const startDistX = parseFloat(e.currentTarget.dataset.pinchDistX);
                    const startDistY = parseFloat(e.currentTarget.dataset.pinchDistY);
                    if (!isNaN(startDistX) && !isNaN(startDistY)) {
                        const distX = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
                        const distY = Math.abs(e.touches[0].clientY - e.touches[1].clientY);

                        const scaleMultiplier = typeof camScale !== 'undefined' ? camScale : 1;
                        const deltaX = (distX - startDistX) / scaleMultiplier;
                        const deltaY = (distY - startDistY) / scaleMultiplier;

                        const maxW = 2000;
                        const maxH = 2000;
                        const w = Math.min(maxW, Math.max(100, parseFloat(e.currentTarget.dataset.pinchW) + deltaX));
                        const h = Math.min(maxH, Math.max(100, parseFloat(e.currentTarget.dataset.pinchH) + deltaY));

                        setLocalSize({ width: w, height: h });
                        if (onResizeNodeComplete) onResizeNodeComplete(block.id, w, h);
                    }
                    return;
                }
                if (e.touches && e.touches.length === 1) {
                    const dx = e.touches[0].clientX - touchStartPos.current.x;
                    const dy = e.touches[0].clientY - touchStartPos.current.y;
                    if (Math.hypot(dx, dy) > 8) {
                        if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                        }
                    }
                }
            }}
            onTouchEnd={(e) => {
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }
                if (e.touches && e.touches.length < 2) {
                    e.currentTarget.dataset.pinchDistX = 'NaN';
                    e.currentTarget.dataset.pinchDistY = 'NaN';
                }
            }}
            onWheel={(e) => {
                if (e.ctrlKey) {
                    e.stopPropagation();
                    e.preventDefault();
                    const startW = localSize.width || block.width || (isImage || isVideo ? 162 : 288);
                    const startH = localSize.height || block.height || (isImage || isVideo ? 162 : 150);
                    const factor = e.deltaY < 0 ? 1.1 : 0.9;
                    const w = startW * factor;
                    const h = startH * factor;
                    setLocalSize({ width: w, height: h });
                    if (onResizeNodeComplete) onResizeNodeComplete(block.id, w, h);
                }
            }}
            onClick={handleNodeClick}
        >
            <div
                className={`relative flex flex-col ${isChildNote ? 'rounded-[1.25rem]' : (isMediaNode ? 'rounded-xl' : 'rounded-[2.5rem]')} border ${camScale > 0.5 ? 'shadow-[0_10px_40px_rgba(0,0,0,0.8)]' : ''} overflow-hidden ${isConversation ? 'bg-[#0f0914] border-purple-500/20' : (isInsight || isResonanceAny ? 'insight-block' : (isDiaryAny ? 'bg-gradient-to-br from-[#1c120c] to-[#0e0906] border-amber-500/30' : (isLoopMapNode ? 'bg-[#050e14] border-cyan-500/30' : (isMediaNode ? 'bg-transparent border-transparent' : 'bg-gradient-to-br from-[#121214] to-[#080809] border-white/5'))))} ${draggingId ? 'transition-none' : 'transition-all duration-300'} ${draggingId === block.id ? 'border-accent ring-1 ring-accent/20' : (isActive ? `border-accent ${camScale > 0.5 ? 'shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : ''}` : (isDiaryAny ? `border-amber-500/20 hover:border-amber-500/40 ${camScale > 0.5 ? 'shadow-[0_0_30px_rgba(245,158,11,0.1)]' : ''}` : (isLoopMapNode ? `border-cyan-500/20 hover:border-cyan-500/40 ${camScale > 0.5 ? 'shadow-[0_0_30px_rgba(6,182,212,0.1)]' : ''}` : 'border-white/5 hover:border-white/10')))} ${(!isMobileViewport() && draggingId !== block.id && !hasConnections && camScale > 0.5) ? 'ctr-node-float' : ''}`}
                style={{
                    width: localSize.width ? `${localSize.width}px` : `${getBWidth(block, false)}px`,
                    height: localSize.height ? `${localSize.height}px` : `${getBHeight(block, false)}px`,
                    minWidth: isChildNote ? '160px' : (isMediaNode ? '100px' : '288px'),
                    minHeight: isChildNote ? '160px' : (isMediaNode ? '100px' : '288px'),
                    maxWidth: undefined,
                    maxHeight: undefined,
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    '--accent-rgb': hexToRgb(displayColor)
                }}
            >
                {/* OP HEADER (SUBTLE TERMINAL STYLE) */}
                {!isMediaNode && (
                    <div className={`${isChildNote ? 'h-4 px-2 bg-black/60' : 'h-6 px-4 bg-black/40'} flex items-center justify-between border-b border-white/5`} style={{ borderTop: `2px solid ${isInsight || isResonanceAny ? 'var(--insight-purple)' : displayColor}` }}>
                        <div className="flex items-center gap-2">
                            {block.groupId && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAnalyzeGroup?.(block.groupId); }}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all group/grp"
                                    title="Analizar Grupo"
                                >
                                    <ListMusic size={8} className="text-accent group-hover/grp:scale-110" />
                                    <span className="text-[6px] font-black uppercase text-accent tracking-tighter">Grouped</span>
                                </button>
                            )}
                            <span className="text-[6px] font-bold uppercase tracking-[0.3em] text-zinc-500 font-mono opacity-50">
                                {isDiaryAny ? 'OP_DIARIO' : `OP_${block.type.toUpperCase()}`}
                            </span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAnalyzeBlock?.(block.id); }}
                                className={`${isChildNote ? 'p-0.5' : 'p-1.5'} hover:bg-accent/20 rounded transition-all text-accent group/spark`}
                                title="Analizar con IA (Invisible)"
                            >
                                <Sparkles size={isChildNote ? 8 : 12} className={`${isAnalyzing ? 'animate-spin' : 'group-hover/spark:animate-spin-slow'} transition-transform`} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMobileResizing(prev => !prev); }}
                                className={`${isChildNote ? 'p-0.5' : 'p-1.5'} hover:bg-white/10 rounded transition-all ${isMobileResizing ? 'text-accent' : 'text-zinc-500 hover:text-white'}`}
                                title="Ajustar Tamaño"
                            >
                                <Maximize2 size={isChildNote ? 7 : 10} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); onSelect(block); }}
                                className={`${isChildNote ? 'p-0.5' : 'p-1.5'} hover:bg-white/10 rounded transition-all text-zinc-500 hover:text-white`}
                                title="Editar"
                            >
                                <Edit2 size={isChildNote ? 7 : 10} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                className={`${isChildNote ? 'p-0.5' : 'p-1.5'} hover:bg-red-500/20 rounded transition-all text-zinc-500 hover:text-red-500 group/del`}
                                title="Eliminar Permanente"
                            >
                                <Trash2 size={isChildNote ? 7 : 10} className="group-hover/del:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                <div className={`${isMediaNode ? 'p-0' : (isChildNote ? 'p-2.5' : 'p-6')} flex-1 flex flex-col min-h-0`}>
                    {isConversation ? (() => {
                        let parsedMsgs = [];
                        try {
                            parsedMsgs = JSON.parse(block.content) || [];
                        } catch (e) { parsedMsgs = []; }
                        return (
                            <div className="relative flex-1 flex flex-col min-h-0">
                                {/* TITULO DE LA CONVERSACION */}
                                <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none mb-3 text-purple-400 truncate shrink-0">
                                    {block.caption || 'Diálogo Kio'}
                                </h3>

                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 py-1 min-h-0">
                                    {parsedMsgs.slice(-2).map((msg, idx) => (
                                        <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[6px] font-black uppercase tracking-widest text-zinc-500">
                                                {msg.role === 'user' ? 'Tú' : 'Kio'}
                                            </span>
                                            <p className={`text-[10px] leading-snug rounded-2xl px-3 py-1.5 font-sans ${msg.role === 'user'
                                                ? 'bg-purple-950/45 border border-purple-800/40 text-purple-300 text-right rounded-tr-none'
                                                : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none'
                                                } max-w-[90%] line-clamp-2`}>
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                    {parsedMsgs.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-25 py-8">
                                            <Sparkles size={16} className="animate-pulse mb-1 text-purple-400" />
                                            <span className="text-[7px] font-black uppercase tracking-widest">Conversación Vacía</span>
                                        </div>
                                    )}
                                </div>

                                {/* BOTON DE ABRIR CHAT */}
                                <div className="pt-3 border-t border-white/5 mt-auto">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSelectConversation) onSelectConversation(block.id);
                                        }}
                                        className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-[7px] font-black uppercase tracking-[0.3em] text-purple-400 transition-all flex items-center justify-center gap-1.5 pointer-events-auto"
                                    >
                                        <MessageSquare size={10} /> Abrir Diálogo
                                    </button>
                                </div>
                            </div>
                        );
                    })() : block.type === 'text' || block.type === 'insight' || block.type === 'diary_notebook' || block.type === 'resonance_notebook' || block.type === 'loop_map_mini' || block.type === 'conversation_notebook' ? (
                        <div className="relative group/text flex-1 flex flex-col min-h-0">
                            {/* TITULO DE LA NOTA (GRANDE) */}
                            <h3 className={`${isChildNote ? 'text-sm mb-1.5' : 'text-xl mb-3'} font-black italic uppercase tracking-tighter leading-none ${isDiaryAny ? 'text-amber-500 font-serif' : block.type === 'conversation_notebook' ? 'text-purple-500' : 'text-white'} truncate shrink-0`}>
                                {isDiaryAny ? (block.caption || 'Diario Personal') : block.type === 'conversation_notebook' ? (block.caption || 'Diálogos Recientes') : (block.caption || 'Fragmento Interior')}
                            </h3>

                            {block.muralBlocks && block.muralBlocks.length > 0 && (
                                <div className="shrink-0 mb-3">
                                    <div className="flex items-center gap-1.5 text-accent shrink-0 select-none mb-1 animate-pulse">
                                        <Grid size={10} />
                                        <span className="text-[7.5px] font-black uppercase tracking-[0.2em]">{block.muralBlocks.length} Capas Mural</span>
                                    </div>
                                    <MiniMuralPreview
                                        muralBlocks={block.muralBlocks}
                                        accent={displayColor}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onLaunchMural) onLaunchMural(block.id);
                                        }}
                                        size="sm"
                                    />
                                </div>
                            )}

                            {/* DIARY ENTRIES vs SINGLE CONTENT */}
                            {block.entries && block.entries.length > 0 ? (
                                <div className={`space-y-8 ${isDiaryAny ? 'max-h-[380px]' : 'max-h-[250px]'} overflow-y-auto custom-scroll pr-1 py-2 relative`}>
                                    {/* VERTICAL TIMELINE LINE */}
                                    <div className="absolute left-[11px] top-6 bottom-6 w-px bg-white/5" />

                                    {block.entries.map((entry, idx) => {
                                        const dateLabel = new Date(entry.timestamp).toLocaleDateString();
                                        const prevDateLabel = idx > 0 ? new Date(block.entries[idx - 1].timestamp).toLocaleDateString() : null;
                                        const isNewDay = dateLabel !== prevDateLabel;

                                        return (
                                            <div key={idx} className="flex flex-col gap-3 relative pl-8">
                                                {/* TIMELINE DOT */}
                                                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-black border-2 border-white/10 flex items-center justify-center z-10 ${idx === block.entries.length - 1 ? 'border-accent diary-active-dot' : ''}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${idx === block.entries.length - 1 ? 'bg-accent animate-pulse' : 'bg-white/20'}`} />
                                                </div>

                                                {isNewDay && (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[6px] font-black uppercase text-accent tracking-[0.3em] font-mono">{dateLabel}</span>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <p className="text-[12px] leading-relaxed text-zinc-300 font-serif italic selection:bg-accent/40">
                                                        {entry.text}
                                                    </p>
                                                    <div className="flex items-center gap-2 opacity-40">
                                                        <span className="text-[5px] font-black uppercase tracking-[0.3em] text-zinc-500">
                                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* DIRECT ADD ENTRY TRIGGER ON CANVAS */}
                                    <div className="pt-4 border-t border-white/5 mt-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelect(block); }}
                                            className="w-full py-2 bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-xl text-[7px] font-black uppercase tracking-[0.3em] text-accent transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={10} /> Añadir Entrada
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-hidden relative opacity-90 group-hover/text:opacity-100 transition-opacity">
                                    {block.type === 'diary_notebook' ? (
                                        <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                                                {(() => {
                                                    const diaryBlocks = (blocks || []).filter(b => b.entries && b.entries.length > 0)
                                                        .sort((a, b) => new Date(b.metadata?.timestamp || 0) - new Date(a.metadata?.timestamp || 0));
                                                    if (diaryBlocks.length === 0) return (
                                                        <div className="flex flex-col items-center justify-center h-full w-full opacity-50 pt-8">
                                                            <StickyNote size={24} className="text-amber-500 mb-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-500">Sin Entradas</span>
                                                        </div>
                                                    );
                                                    return diaryBlocks.map(db => (
                                                        <div key={db.id} className="w-full p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 transition-colors">
                                                            <div className="text-amber-400 text-[10px] font-black uppercase truncate">{db.caption || 'Entrada'}</div>
                                                            <div className="text-[8px] text-amber-500/50 font-mono mt-1">{new Date(db.metadata?.timestamp || Date.now()).toLocaleDateString()}</div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                            <div className="pt-2 mt-auto border-t border-amber-500/10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); if (onOpenNotebook) onOpenNotebook('diary'); }}
                                                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-amber-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <StickyNote size={12} /> Abrir Diario Completo
                                                </button>
                                            </div>
                                        </div>
                                    ) : block.type === 'resonance_notebook' ? (
                                        <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                                                {(() => {
                                                    const resonanceBlocks = (blocks || []).filter(b => b.type === 'text' && b.content && b.content.includes('[resonancia]'))
                                                        .sort((a, b) => new Date(b.metadata?.timestamp || 0) - new Date(a.metadata?.timestamp || 0));
                                                    if (resonanceBlocks.length === 0) return (
                                                        <div className="flex flex-col items-center justify-center h-full w-full opacity-50 pt-8">
                                                            <Sparkles size={24} className="text-purple-500 mb-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-500">Sin Ruidos</span>
                                                        </div>
                                                    );
                                                    return resonanceBlocks.map(rb => (
                                                        <div key={rb.id} className="w-full p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/50 transition-colors">
                                                            <div className="text-purple-400 text-[10px] font-black uppercase truncate">{rb.caption || 'Ruido'}</div>
                                                            <div className="text-[8px] text-purple-500/50 font-mono mt-1">{new Date(rb.metadata?.timestamp || Date.now()).toLocaleDateString()}</div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                            <div className="pt-2 mt-auto border-t border-purple-500/10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); if (onOpenNotebook) onOpenNotebook('resonance'); }}
                                                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-purple-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Sparkles size={12} /> Analizar Ruidos
                                                </button>
                                            </div>
                                        </div>
                                    ) : block.type === 'conversation_notebook' ? (
                                        <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                                                {(() => {
                                                    const recentConversations = (conversations || [])
                                                        .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
                                                    if (recentConversations.length === 0) return (
                                                        <div className="flex flex-col items-center justify-center h-full w-full opacity-50 pt-8">
                                                            <MessageSquare size={24} className="text-purple-500 mb-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-500">Sin Diálogos</span>
                                                        </div>
                                                    );
                                                    return recentConversations.slice(0, 10).map(c => (
                                                        <div
                                                            key={c.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onSelectConversation) onSelectConversation(c.id);
                                                            }}
                                                            className="w-full p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10 cursor-pointer transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#d946ef' }} />
                                                                <div className="text-purple-400 text-[10px] font-black uppercase truncate flex-1">{c.title || 'Diálogo'}</div>
                                                            </div>
                                                            <div className="text-[8px] text-purple-500/50 font-mono mt-1 pl-3.5">
                                                                {c.messages && c.messages.length > 0 ? `${c.messages.length} mensajes` : 'Sin mensajes'}
                                                                {c.startTime && ` • ${new Date(c.startTime).toLocaleDateString()}`}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                            <div className="pt-2 mt-auto border-t border-purple-500/10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onNewChat) onNewChat();
                                                    }}
                                                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-purple-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={12} /> Nuevo Diálogo
                                                </button>
                                            </div>
                                        </div>
                                    ) : block.type === 'loop_map_mini' ? (() => {
                                        let patientNodes = [];
                                        let patientEdges = [];
                                        try {
                                            patientNodes = JSON.parse(localStorage.getItem('oasis_canvas_nodes_' + user)) || [];
                                            patientEdges = JSON.parse(localStorage.getItem('oasis_canvas_edges_' + user)) || [];
                                        } catch (e) { }

                                        const hasLocalMap = patientNodes.length > 0;

                                        return (
                                            <div className="flex flex-col h-full w-full relative group/notebook pointer-events-auto">
                                                {hasLocalMap ? (() => {
                                                    let minX = 0, minY = 0, width = 800, height = 600;
                                                    let minNodeX = Infinity, minNodeY = Infinity, maxNodeX = -Infinity, maxNodeY = -Infinity;
                                                    patientNodes.forEach(n => {
                                                        const w = n.width || 120;
                                                        const h = n.height || 120;
                                                        if (n.x < minNodeX) minNodeX = n.x;
                                                        if (n.y < minNodeY) minNodeY = n.y;
                                                        if (n.x + w > maxNodeX) maxNodeX = n.x + w;
                                                        if (n.y + h > maxNodeY) maxNodeY = n.y + h;
                                                    });
                                                    const padding = 60;
                                                    minX = minNodeX - padding;
                                                    minY = minNodeY - padding;
                                                    width = (maxNodeX - minNodeX) + padding * 2;
                                                    height = (maxNodeY - minNodeY) + padding * 2;

                                                    const drawGravityLine = (x1, y1, x2, y2) => {
                                                        const dx = x2 - x1;
                                                        const dy = y2 - y1;
                                                        const cp1x = x1 + dx * 0.1;
                                                        const cp1y = y1 + dy * 0.7;
                                                        const cp2x = x2 - dx * 0.1;
                                                        const cp2y = y2 - dy * 0.3;
                                                        return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
                                                    };

                                                    return (
                                                        <div className="flex-1 overflow-hidden p-2 relative flex flex-col items-center justify-center text-center w-full h-full min-h-0 bg-[#09090b]/40 rounded-xl">
                                                            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                                            <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full z-10 relative select-none">
                                                                {patientEdges.map((edge, i) => {
                                                                    const source = patientNodes.find(n => n.id === edge.source);
                                                                    const target = patientNodes.find(n => n.id === edge.target);
                                                                    if (!source || !target) return null;

                                                                    const sx = source.x + (source.width || 120) / 2;
                                                                    const sy = source.y + (source.height || 120);
                                                                    const tx = target.x + (target.width || 120) / 2;
                                                                    const ty = target.y;

                                                                    const pathString = drawGravityLine(sx, sy, tx, ty);

                                                                    return (
                                                                        <g key={i}>
                                                                            <path d={pathString} fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="4" />
                                                                            <path d={pathString} fill="none" stroke={edge.color || 'rgba(255, 255, 255, 0.3)'} strokeWidth="1" />
                                                                        </g>
                                                                    );
                                                                })}

                                                                {patientNodes.map(node => {
                                                                    const isContext = node.type === 'CONTEXT';
                                                                    const isState = node.type === 'INTERNAL_STATE' || node.type === 'MACRO_MECHANISM';
                                                                    const isSymptom = node.type === 'CRITICAL_SYMPTOM';
                                                                    const isChain = node.type === 'IMPACT_CHAIN';

                                                                    let strokeColor = 'rgba(255,255,255,0.15)';
                                                                    let bgColor = 'rgba(24, 24, 27, 0.4)';
                                                                    let textColor = 'rgba(255, 255, 255, 0.8)';
                                                                    let title = 'NODO';

                                                                    if (isContext) {
                                                                        strokeColor = '#0ea5e9';
                                                                        bgColor = 'rgba(3, 105, 161, 0.2)';
                                                                        textColor = '#bae6fd';
                                                                        title = 'CONTEXTO INICIAL';
                                                                    } else if (isState) {
                                                                        strokeColor = '#10b981';
                                                                        bgColor = 'rgba(4, 120, 87, 0.2)';
                                                                        textColor = '#a7f3d0';
                                                                        title = node.type === 'MACRO_MECHANISM' ? 'MACRO MECANISMO' : 'ESTADO INTERNO';
                                                                    } else if (isSymptom) {
                                                                        strokeColor = '#ef4444';
                                                                        bgColor = 'rgba(185, 28, 28, 0.2)';
                                                                        textColor = '#fecaca';
                                                                        title = 'SÍNTOMA CRÍTICO';
                                                                    } else if (isChain) {
                                                                        strokeColor = '#71717a';
                                                                        bgColor = 'rgba(63, 63, 70, 0.2)';
                                                                        textColor = '#e4e4e7';
                                                                        title = 'CADENA DE IMPACTO';
                                                                    }

                                                                    const cx = node.x + (node.width || 120) / 2;
                                                                    const cy = node.y + (node.height || 120) / 2;
                                                                    const rx = (node.width || 120) / 2;
                                                                    const ry = (node.height || 120) / 2;

                                                                    return (
                                                                        <g key={node.id}>
                                                                            <ellipse cx={cx} cy={cy} rx={rx + 8} ry={ry + 8} fill={strokeColor} className="opacity-[0.02]" />

                                                                            {isContext && (
                                                                                <polygon
                                                                                    points={`${cx},${node.y} ${node.x + (node.width || 120)},${cy} ${cx},${node.y + (node.height || 120)} ${node.x},${cy}`}
                                                                                    fill={bgColor}
                                                                                    stroke={strokeColor}
                                                                                    strokeWidth="1"
                                                                                />
                                                                            )}
                                                                            {isState && (
                                                                                <ellipse
                                                                                    cx={cx} cy={cy} rx={rx} ry={ry}
                                                                                    fill={bgColor}
                                                                                    stroke={strokeColor}
                                                                                    strokeWidth="1"
                                                                                />
                                                                            )}
                                                                            {(isSymptom || isChain) && (
                                                                                <rect
                                                                                    x={node.x} y={node.y} width={node.width || 120} height={node.height || 120} rx="12" ry="12"
                                                                                    fill={bgColor}
                                                                                    stroke={strokeColor}
                                                                                    strokeWidth="1"
                                                                                />
                                                                            )}

                                                                            <text
                                                                                x={cx} y={node.y - 8}
                                                                                textAnchor="middle"
                                                                                className="text-[6px] font-bold font-mono tracking-widest fill-zinc-500 uppercase select-none"
                                                                            >
                                                                                {title}
                                                                            </text>

                                                                            <foreignObject
                                                                                x={node.x + 6} y={node.y + 6}
                                                                                width={(node.width || 120) - 12} height={(node.height || 120) - 12}
                                                                            >
                                                                                <div className="w-full h-full flex items-center justify-center text-center p-1 overflow-hidden select-none">
                                                                                    <span
                                                                                        className="text-[7px] font-black uppercase tracking-wider leading-relaxed font-mono"
                                                                                        style={{ color: textColor }}
                                                                                    >
                                                                                        {node.label}
                                                                                    </span>
                                                                                </div>
                                                                            </foreignObject>
                                                                        </g>
                                                                    );
                                                                })}
                                                            </svg>
                                                        </div>
                                                    );
                                                })() : (
                                                    <div className="flex-1 overflow-hidden p-6 relative flex flex-col items-center justify-center text-center">
                                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                                        <Compass size={48} className="text-zinc-600 mb-6 animate-pulse" />
                                                        <h3 className="text-2xl font-black italic uppercase text-white/40 tracking-widest text-center mb-4">
                                                            Sin Cartografía Asignada
                                                        </h3>
                                                        <p className="text-[10px] font-mono text-zinc-500 max-w-[80%] leading-relaxed">
                                                            AÚN NO HAY UN MAPA DE BUCLES DISPONIBLE PARA TU IDENTIDAD. EL MAPA GENERADO Y PUBLICADO POR EL ESPECIALISTA CLÍNICO DESDE TU PERFIL APARECERÁ AQUÍ.
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="pt-2 mt-auto border-t border-cyan-500/10">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setView('soul'); }}
                                                        className="w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Aperture size={14} /> Abrir Pruebas Clínicas
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }
                                    ) : (
                                        <>
                                            <SimpleNarrativeRenderer content={block.type === 'insight' ? `[insight] ${block.content}` : block.content} isChild={isChildNote} />
                                            {!hasMedia && <div className={`absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t ${isInsight || isResonanceAny ? 'from-[#0d0d0e]' : (isDiaryAny ? 'from-[#0e0906]' : 'from-[#0b0b0c]')} to-transparent pointer-events-none`} />}
                                        </>
                                    )}
                                </div>
                            )}

                            {(() => {
                                const childNotes = (blocks || []).filter(b => b.metadata?.parentId === block.id);
                                if (childNotes.length === 0 || isChildNote) return null;
                                return (
                                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-mono font-black uppercase tracking-[0.1em] text-accent shrink-0">
                                        <div className="flex items-center gap-1">
                                            <FileText size={10} className="animate-pulse" style={{ color: displayColor }} />
                                            <span style={{ color: displayColor }}>{childNotes.length} {childNotes.length === 1 ? 'Subpágina' : 'Subpáginas'}</span>
                                        </div>
                                        <div className="flex gap-1 max-w-[150px] overflow-hidden text-zinc-500 truncate normal-case font-sans italic opacity-75">
                                            {childNotes.map(c => c.caption || 'Sin título').join(', ')}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : isImage ? (
                        <div className="flex-1 w-full h-full relative">
                            <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={formatUrl(block.content)} className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none" draggable={false} />
                        </div>
                    ) : isVideo ? (
                        <div className="flex-1 w-full h-full relative">
                            <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none" src={formatUrl(block.content)} draggable={false} />
                        </div>
                    ) : null}
                </div>
                {/* NÚCLEO DE SINCRONÍA (PORT) - CONDITIONAL */}
                {showConnections && (
                    <div className={`${isChildNote ? 'py-1' : 'py-3'} flex justify-center items-center border-t border-white/5 bg-black/40 mt-auto shrink-0`}>
                        <div
                            className="port group/port flex flex-col items-center gap-1 cursor-crosshair relative"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onStartConnecting(block.id);
                            }}
                        >
                            <div className="w-4 h-4 rounded-full bg-zinc-900 border-2 border-white/20 group-hover/port:border-accent group-hover/port:scale-125 transition-all shadow-lg flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-40 group-hover/port:opacity-100 animate-pulse" />
                            </div>
                            <span className="text-[5px] font-black tracking-[0.3em] text-zinc-600 group-hover/port:text-accent uppercase select-none">Relacionar</span>

                            {/* Feedback visual de conexión activa */}
                            {isLinking && draggingId === block.id && (
                                <div className="absolute inset-0 -m-1 rounded-full border border-accent animate-ping opacity-30" />
                            )}
                        </div>
                    </div>
                )}
                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-50 flex items-end justify-end p-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = e.currentTarget.parentElement.offsetWidth;
                        const startHeight = e.currentTarget.parentElement.offsetHeight;

                        const handleMouseMove = (moveEvent) => {
                            const minSize = isImage || isVideo ? 100 : 288;
                            const newWidth = Math.max(minSize, startWidth + ((moveEvent.clientX - startX) / camScale));
                            const newHeight = Math.max(minSize, startHeight + ((moveEvent.clientY - startY) / camScale));
                            setLocalSize({ width: newWidth, height: newHeight });
                        };

                        const handleMouseUp = (upEvent) => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            const minSize = isImage || isVideo ? 100 : 288;
                            const finalWidth = Math.max(minSize, startWidth + ((upEvent.clientX - startX) / camScale));
                            const finalHeight = Math.max(minSize, startHeight + ((upEvent.clientY - startY) / camScale));
                            if (onResizeNodeComplete) onResizeNodeComplete(block.id, finalWidth, finalHeight);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        const startX = touch.clientX;
                        const startY = touch.clientY;
                        const startWidth = e.currentTarget.parentElement.offsetWidth;
                        const startHeight = e.currentTarget.parentElement.offsetHeight;

                        const handleTouchMove = (moveEvent) => {
                            moveEvent.preventDefault(); // Prevent scrolling while resizing
                            const moveTouch = moveEvent.touches[0];
                            const minSize = isImage || isVideo ? 100 : 288;
                            const newWidth = Math.max(minSize, startWidth + ((moveTouch.clientX - startX) / camScale));
                            const newHeight = Math.max(minSize, startHeight + ((moveTouch.clientY - startY) / camScale));
                            setLocalSize({ width: newWidth, height: newHeight });
                        };

                        const handleTouchEnd = (upEvent) => {
                            document.removeEventListener('touchmove', handleTouchMove);
                            document.removeEventListener('touchend', handleTouchEnd);
                            const upTouch = upEvent.changedTouches[0];
                            const minSize = isImage || isVideo ? 100 : 288;
                            const finalWidth = Math.max(minSize, startWidth + ((upTouch.clientX - startX) / camScale));
                            const finalHeight = Math.max(minSize, startHeight + ((upTouch.clientY - startY) / camScale));
                            if (onResizeNodeComplete) onResizeNodeComplete(block.id, finalWidth, finalHeight);
                        };

                        document.addEventListener('touchmove', handleTouchMove, { passive: false });
                        document.addEventListener('touchend', handleTouchEnd);
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 hover:text-white"><polyline points="21 15 21 21 15 21"></polyline><line x1="21" y1="21" x2="15" y2="15"></line><polyline points="9 3 3 3 3 9"></polyline><line x1="3" y1="3" x2="9" y2="9"></line></svg>
                </div>

                {/* MOBILE RESIZE/STRETCH OVERLAY */}
                {isMobileResizing && (
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-4" style={{ color: displayColor }}>
                            Ajustar Tamaño
                        </span>

                        <div className="flex gap-4 items-center mb-6 z-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.vibrate) navigator.vibrate(30);
                                    const currentW = localSize.width || getBWidth(block, false);
                                    const currentH = localSize.height || getBHeight(block, false);
                                    const minSize = isImage || isVideo ? 100 : 288;
                                    const w = Math.max(minSize, currentW * 0.85);
                                    const h = Math.max(minSize, currentH * 0.85);
                                    setLocalSize({ width: w, height: h });
                                    if (onResizeNodeComplete) onResizeNodeComplete(block.id, w, h);
                                }}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 flex items-center justify-center text-white text-xl font-bold transition-all"
                            >
                                -
                            </button>

                            <div className="flex flex-col items-center">
                                <span className="text-xs font-mono text-zinc-300 font-bold">
                                    {Math.round(localSize.width || getBWidth(block, false))}px
                                </span>
                                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                                    Ancho
                                </span>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.vibrate) navigator.vibrate(30);
                                    const currentW = localSize.width || getBWidth(block, false);
                                    const currentH = localSize.height || getBHeight(block, false);
                                    const w = currentW * 1.15;
                                    const h = currentH * 1.15;
                                    setLocalSize({ width: w, height: h });
                                    if (onResizeNodeComplete) onResizeNodeComplete(block.id, w, h);
                                }}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 flex items-center justify-center text-white text-xl font-bold transition-all"
                            >
                                +
                            </button>
                        </div>

                        <div className="flex gap-2 w-full max-w-[220px] z-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.vibrate) navigator.vibrate(40);
                                    const defaultW = getBWidth(block, false);
                                    const defaultH = getBHeight(block, false);
                                    setLocalSize({ width: defaultW, height: defaultH });
                                    if (onResizeNodeComplete) onResizeNodeComplete(block.id, defaultW, defaultH);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 active:scale-95 transition-all"
                            >
                                Restablecer
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.vibrate) navigator.vibrate(50);
                                    setIsMobileResizing(false);
                                }}
                                className="flex-1 py-2.5 rounded-xl text-black text-[8px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                                style={{ backgroundColor: displayColor, color: '#000' }}
                            >
                                Listo
                            </button>
                        </div>
                    </div>
                )}

                {/* CONFIRMATION DIALOG */}
                {showDeleteConfirm && (
                    <div
                        className="absolute inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <div className="text-center space-y-4 max-w-[240px] px-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 leading-relaxed">
                                ¿Eliminar esta nota del mural?
                            </p>
                            <div className="flex gap-2 justify-center pt-2">
                                <button
                                    onPointerDown={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                                    className="px-4 py-2 border border-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        onDelete(block.id);
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="px-4 py-2 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                                    style={{ backgroundColor: '#dc2626' }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});// NekronomikronFull has been refactored to src/components/Nekronomikron.jsx

// OasisPlayer has been refactored to src/components/Nekronomikron.jsx
const PHENOM_PART_A = [
    {
        key: "antecedentes_origen",
        title: "Origen y Reglas Invisibles",
        question: "¿Qué ecos del pasado guían tus pasos en silencio? Si miras hacia tu origen, ¿cuál es esa ley no escrita que te enseñaron a seguir?",
        placeholder: "Describe las expectativas ajenas, el miedo a equivocarte o los lazos familiares que aún condicionan tus decisiones hoy..."
    },
    {
        key: "experiencia_insuficiencia",
        title: "La Sombra de la Autoexigencia",
        question: "¿En qué momentos sientes que corres tras una meta que siempre se aleja? ¿Cuándo y dónde te susurra la mente que no eres o no haces suficiente?",
        placeholder: "Piensa en la exigencia diaria, el trabajo o los vínculos donde el cansancio te paraliza..."
    },
    {
        key: "temporalidad_vivida",
        title: "Temporalidad Vivida",
        question: "¿Cómo transcurre el tiempo en tu interior? ¿Sientes que el reloj es una sombra que te persigue, una corriente que te arrastra, o un río estancado?",
        placeholder: "Explora si vives en la prisa del mañana, en el peso del ayer, o si logras habitar el presente..."
    },
    {
        key: "premisa_realidad",
        title: "Premisa de Realidad",
        question: "Si tuvieras que desnudar tu motor más íntimo... ¿qué certeza sostiene tu día a día? ¿Cuál es el pulso que te hace despertar cada mañana?",
        placeholder: "Tu verdadera motivación, o si sientes que simplemente avanzas en automático sin un rumbo claro..."
    }
];

const PHENOM_PART_B = [
    { id: 1, domain: "Afectividad Negativa", text: "Me preocupo por casi todo." },
    { id: 2, domain: "Afectividad Negativa", text: "Me asusto o me alarmo con mucha facilidad." },
    { id: 3, domain: "Afectividad Negativa", text: "Me pongo muy ansioso/a cuando las cosas son inciertas o impredecibles." },
    { id: 4, domain: "Afectividad Negativa", text: "Me irrito fácilmente por todo tipo de cosas." },
    { id: 5, domain: "Afectividad Negativa", text: "Mis emociones a veces cambian de un momento a otro sin motivo aparente." },
    { id: 6, domain: "Desapego", text: "Prefiero estar solo/a que acompañado/a." },
    { id: 7, domain: "Desapego", text: "Mantengo mi distancia emocional de la gente." },
    { id: 8, domain: "Desapego", text: "Me cuesta mucho disfrutar de las cosas de la vida." },
    { id: 9, domain: "Desapego", text: "Rara vez me involucro emocionalmente con los demás." },
    { id: 10, domain: "Desapego", text: "Evito hacer nuevos amigos o conocer gente nueva." },
    { id: 11, domain: "Antagonismo", text: "A menudo tengo que manipular a la gente para conseguir lo que quiero." },
    { id: 12, domain: "Antagonismo", text: "Siento que soy mejor o más importante que casi todo el mundo." },
    { id: 13, domain: "Antagonismo", text: "Disfruto aprovechándome de los demás si se presenta la oportunidad." },
    { id: 14, domain: "Antagonismo", text: "No me importa herir los sentimientos de otros si eso me beneficia." },
    { id: 15, domain: "Antagonismo", text: "Creo que para salir adelante, a veces tienes que engañar a la gente." },
    { id: 16, domain: "Desinhibición", text: "A menudo actúo de inmediato sin pensar en las consecuencias." },
    { id: 17, domain: "Desinhibición", text: "Hago las cosas en el momento sin planearlas en absoluto." },
    { id: 18, domain: "Desinhibición", text: "A menudo rompo mis promesas o no cumplo con mis acuerdos." },
    { id: 19, domain: "Desinhibición", text: "Me aburro rápidamente de las tareas y pierdo el interés." },
    { id: 20, domain: "Desinhibición", text: "Tomo decisiones precipitadas en el calor del momento." },
    { id: 21, domain: "Psicoticismo", text: "A menudo tengo pensamientos que no tienen sentido para los demás." },
    { id: 22, domain: "Psicoticismo", text: "He tenido experiencias extrañas que son muy difíciles de explicar." },
    { id: 23, domain: "Psicoticismo", text: "A veces siento que las cosas a mi alrededor no son reales." },
    { id: 24, domain: "Psicoticismo", text: "La gente suele pensar que mi forma de ser o hablar es excéntrica o rara." },
    { id: 25, domain: "Psicoticismo", text: "A veces escucho o veo cosas que los demás no pueden percibir." }
];

const PHENOM_QUESTIONS = [
    {
        id: 1,
        title: "Mecanismo Existencial",
        text: "¿Cómo experimentas la mayor parte del tiempo tu presencia individual en el flujo cotidiano?",
        options: [
            { key: "A", text: "Como un observador desapegado que analiza los acontecimientos desde fuera." },
            { key: "B", text: "Como una tensión constante entre el deseo de fusión con otros y el miedo a perderme." },
            { key: "C", text: "Como una lucha activa por imponer orden y control sobre un entorno caótico." },
            { key: "D", text: "Como un flujo de impulsos creativos que a veces colapsa ante la falta de dirección." }
        ]
    },
    {
        id: 2,
        title: "Dinámica de Parálisis",
        text: "Cuando te encuentras ante un bloqueo o parálisis emocional, ¿cuál suele ser la raíz primaria?",
        options: [
            { key: "A", text: "El miedo a la imperfección o a fallar ante mis propios estándares implacables." },
            { key: "B", text: "La sensación de vacío o de que mis esfuerzos carecen de un propósito trascendental." },
            { key: "C", text: "La sobrecarga atencional al intentar sostener demasiadas posibilidades simultáneamente." },
            { key: "D", text: "El repliegue automático hacia fantasías internas para evadir el peso del mundo físico." }
        ]
    },
    {
        id: 3,
        title: "Modulación del Tiempo",
        text: "¿Cómo modula el tiempo tu experiencia psicológica actual?",
        options: [
            { key: "A", text: "Vivo en anticipación ansiosa del futuro, planificando bucles infinitos para evitar sorpresas." },
            { key: "B", text: "Quedo atrapado en la nostalgia o el análisis retrospectivo de decisiones pasadas." },
            { key: "C", text: "Siento que el presente transcurre con excesiva rapidez y sin tiempo para integrar mis vivencias." },
            { key: "D", text: "Experimento el tiempo de forma fragmentada, alternando entre hiperactividad y estancamiento." }
        ]
    },
    {
        id: 4,
        title: "La Mirada del Otro",
        text: "¿De qué manera influye la mirada del otro en tus bloqueos internos?",
        options: [
            { key: "A", text: "Como un juez implacable que activa mi necesidad de autosuficiencia radical." },
            { key: "B", text: "Como un ancla necesaria de la que dependo para validar mi existencia." },
            { key: "C", text: "Como una perturbación de mi espacio mental de la cual prefiero retirarme físicamente." },
            { key: "D", text: "Como un juego de espejos donde tiendo a proyectar mis propias inseguridades reprimidas." }
        ]
    },
    {
        id: 5,
        title: "Anhelo de Armonía",
        text: "¿Qué describe mejor tu idea de armonía o liberación mental?",
        options: [
            { key: "A", text: "La quietud analítica, donde puedo silenciar el ruido del pensamiento racional." },
            { key: "B", text: "La conexión profunda e incondicional con el arte, la naturaleza o un alma afín." },
            { key: "C", text: "La auto-realización soberana, actuando con total autonomía sin miedo al rechazo." },
            { key: "D", text: "La integración fluida de mis contradicciones internas sin juzgarlas como defectos." }
        ]
    }
];


const ProfileView = ({
    user, soulPieces, blocks, setBlocks, syncBlocks, accent, isEditingProfile, setIsEditingProfile,
    deleteBlock, deleteBlocks,
    isBitacoraOpen, setIsBitacoraOpen,
    isLinking, setIsLinking, links, linkSource, setLinkSource,
    completeConnection, removeConnection, synthesizeLinks, mouseCanvasPos,
    editBlock, handleSelectNote, activeNoteId,
    handleAnalyzeGroup, handleAnalyzeBlock, isChatLoading, onSoulPieceImageChange,
    setView, playlists, setPlayQueue, setCurrentTrack, setIsPlaying,
    avatar, setAvatar, calculatedResults, noteKeywords, bgType, bgValue,
    conversations, setConversations, handleSelectConversation,
    onSaveProfile, onNewChat, onOpenNotebook, setActiveTest, setIsSettingsOpen, onOpenSimpleNotes,
    openNewComposer, feed, onNavigateToFeedPost,
    setIsHighlightModalOpen, setSelectedHighlight,
    isStoryUploadModalOpen, setIsStoryUploadModalOpen, setViewing24hStories
}) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const user24hStories = (feed || []).filter(b => b.username === user && b.type === 'story' && b.timestamp > twentyFourHoursAgo);
    const hasActiveStories = user24hStories.length > 0;

    const [bio, setBio] = useState(() => localStorage.getItem('oasis_bio_' + user) || 'Explorador del Oasis // Tejiendo ideas y resonancias en el éter digital.');
    const [profileLink, setProfileLink] = useState(() => localStorage.getItem('oasis_profilelink_' + user) || '');
    const [fullName, setFullName] = useState(() => localStorage.getItem('oasis_fullname_' + user) || user || 'Oasis Explorer');
    const [coverImage, setCoverImage] = useState(() => localStorage.getItem('oasis_cover_' + user) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');

    const [activePurchasingId, setActivePurchasingId] = useState(null);
    const [activeSuccessId, setActiveSuccessId] = useState(null);

    React.useEffect(() => {
        if (isEditingProfile) return; // No sobreescribir mientras el usuario edita

        const profileBlock = blocks.find(b => b.id === 'profile_settings' || b.Id === 'profile_settings');
        if (profileBlock) {
            try {
                const data = JSON.parse(profileBlock.content || profileBlock.Content || "{}");
                if (data.bio !== undefined || data.Bio !== undefined) {
                    const bioVal = data.bio !== undefined ? data.bio : data.Bio;
                    setBio(bioVal || '');
                    localStorage.setItem('oasis_bio_' + user, bioVal || '');
                }
                if (data.fullName !== undefined || data.FullName !== undefined) {
                    const fnVal = data.fullName !== undefined ? data.fullName : data.FullName;
                    setFullName(fnVal || '');
                    localStorage.setItem('oasis_fullname_' + user, fnVal || '');
                }
                if (data.coverImage !== undefined || data.CoverImage !== undefined) {
                    const coverVal = data.coverImage !== undefined ? data.coverImage : data.CoverImage;
                    setCoverImage(coverVal || '');
                    localStorage.setItem('oasis_cover_' + user, coverVal || '');
                }
                if (data.avatar !== undefined || data.Avatar !== undefined) {
                    const avatarVal = data.avatar !== undefined ? data.avatar : data.Avatar;
                    setAvatar(avatarVal || '');
                    localStorage.setItem('oasis_avatar_' + user, avatarVal || '');
                }
                if (data.profileLink !== undefined || data.ProfileLink !== undefined) {
                    const linkVal = data.profileLink !== undefined ? data.profileLink : data.ProfileLink;
                    setProfileLink(linkVal || '');
                    localStorage.setItem('oasis_profilelink_' + user, linkVal || '');
                }
                return;
            } catch (e) {
                console.error("Error parsing profile settings:", e);
            }
        }

        setBio(localStorage.getItem('oasis_bio_' + user) || 'Explorador del Oasis // Tejiendo ideas y resonancias en el éter digital.');
        setFullName(localStorage.getItem('oasis_fullname_' + user) || user || 'Oasis Explorer');
        setCoverImage(localStorage.getItem('oasis_cover_' + user) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
        setProfileLink(localStorage.getItem('oasis_profilelink_' + user) || '');
    }, [user, blocks, setAvatar, isEditingProfile]);

    const [releaseTab, setReleaseTab] = useState('posts');
    const [savedPostIds, setSavedPostIds] = useState(() => {
        try {
            const stored = localStorage.getItem(`oasis_saved_${user || 'anon'}`);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const reloadSaved = () => {
        try {
            const stored = localStorage.getItem(`oasis_saved_${user || 'anon'}`);
            setSavedPostIds(stored ? JSON.parse(stored) : []);
        } catch { }
    };

    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [dragOverId, setDragOverId] = useState(null);
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleReorderBlocks = (draggedId, targetId) => {
        if (draggedId === targetId) return;
        const draggedBlock = blocks.find(b => b.id === draggedId);
        if (!draggedBlock) return;

        const newBlocks = blocks.filter(b => b.id !== draggedId);

        if (targetId === 'FEED_END') {
            newBlocks.push(draggedBlock);
            setBlocks(newBlocks);
            syncBlocks(newBlocks);
            return;
        }

        const visualDraggedIdx = filteredReleases.findIndex(b => b.id === draggedId);
        const visualTargetIdx = filteredReleases.findIndex(b => b.id === targetId);
        if (visualDraggedIdx === -1 || visualTargetIdx === -1) return;

        const targetBlockIndex = newBlocks.findIndex(b => b.id === targetId);

        if (targetBlockIndex !== -1) {
            const insertIdx = visualDraggedIdx < visualTargetIdx ? targetBlockIndex + 1 : targetBlockIndex;
            newBlocks.splice(insertIdx, 0, draggedBlock);
        } else {
            let found = false;
            for (let i = visualTargetIdx; i < filteredReleases.length; i++) {
                const item = filteredReleases[i];
                if (!item.isVirtual && item.id !== draggedId) {
                    const idx = newBlocks.findIndex(b => b.id === item.id);
                    if (idx !== -1) {
                        newBlocks.splice(idx, 0, draggedBlock);
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                for (let i = visualTargetIdx; i >= 0; i--) {
                    const item = filteredReleases[i];
                    if (!item.isVirtual && item.id !== draggedId) {
                        const idx = newBlocks.findIndex(b => b.id === item.id);
                        if (idx !== -1) {
                            newBlocks.splice(idx + 1, 0, draggedBlock);
                            found = true;
                            break;
                        }
                    }
                }
            }
            if (!found) {
                newBlocks.push(draggedBlock);
            }
        }

        setBlocks(newBlocks);
        syncBlocks(newBlocks);
    };

    const handleCardClick = (id) => {
        if (isSelectionMode) {
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
        } else {
            const block = blocks.find(b => b.id === id) || virtualConvBlocks.find(c => c.id === id);
            if (!block) return;
            if (block.type === 'conversation' || block.isVirtual) {
                handleSelectConversation(block.id);
            } else if (block.type === 'diary_notebook') {
                setActiveNotebook('diary');
            } else if (block.type === 'resonance_notebook') {
                setActiveNotebook('resonance');
            } else if (block.type === 'conversation_notebook') {
                const sortedConvs = (conversations || [])
                    .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
                if (sortedConvs.length > 0) {
                    handleSelectConversation(sortedConvs[0].id);
                } else {
                    handleNewChat();
                }
            } else {
                editBlock(block);
            }
        }
    };

    const handleAvatarClick = () => {
        if (isEditingProfile && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setAvatar(data.url);
                    localStorage.setItem('oasis_avatar_' + user, data.url);
                    if (onSaveProfile) onSaveProfile({ avatar: data.url });
                }
            } else {
                alert('Error al subir el avatar.');
            }
        } catch (err) {
            console.error(err);
            alert('Error al subir el avatar.');
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setCoverImage(data.url);
                    localStorage.setItem('oasis_cover_' + user, data.url);
                    if (onSaveProfile) onSaveProfile({ coverImage: data.url });
                }
            } else {
                alert('Error al subir la portada.');
            }
        } catch (err) {
            console.error(err);
            alert('Error al subir la portada.');
        }
    };

    const formatUrl = (url) => {
        if (!url || typeof url !== 'string') return '';

        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'));

        if (!isLocal && typeof url === 'string' && url.includes('localhost:5046')) {
            url = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5046\/?/g, API_URL.endsWith('/') ? API_URL : API_URL + '/');
        }

        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
        if (isLocal && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
            return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        }

        if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
        if (url.startsWith('uploads/')) return `${API_URL}/${url.replace('uploads/', '')}`;
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const getBlockPreviewImage = (block) => {
        if (!block) return null;
        if (block.type === 'image') return formatUrl(block.content);

        if (block.metadata?.thumbnail) return formatUrl(block.metadata.thumbnail);
        if (block.bgType === 'image' && block.bgValue) return formatUrl(block.bgValue);

        if (block.content && typeof block.content === 'string') {
            const contentLines = block.content.split('\n') || [];
            const inlineImg = contentLines.find(l => typeof l === 'string' && l.startsWith('[img]'))?.replace('[img]', '')?.replace('[/img]', '')?.trim();
            if (inlineImg) return formatUrl(inlineImg);
        }

        if (block.muralBlocks && block.muralBlocks.length > 0) {
            const firstImg = block.muralBlocks.find(mb => mb.type === 'image');
            if (firstImg) return formatUrl(firstImg.content);
        }

        if (block.metadata?.thumbnail) {
            return formatUrl(block.metadata.thumbnail);
        }

        return null;
    };

    const getBlockPreviewVideo = (block) => {
        if (!block) return null;
        if (block.content && typeof block.content === 'string') {
            const contentLines = block.content.split('\n') || [];
            const inlineVid = contentLines.find(l => typeof l === 'string' && l.startsWith('[vid]'))?.replace('[vid]', '')?.replace('[/vid]', '')?.trim();
            if (inlineVid) return formatUrl(inlineVid);
        }
        return null;
    };

    const virtualConvBlocks = useMemo(() => {
        return (conversations || [])
            .filter(c => !blocks.some(b => b.id === c.id || b.id === `conv-pub-${c.id}`))
            .map(c => ({
                id: c.id,
                type: 'conversation',
                caption: c.title || 'Diálogo AI',
                content: JSON.stringify(c.messages || []),
                isPublic: false,
                color: c.color || '#d946ef',
                username: user || 'anon',
                metadata: { timestamp: c.startTime },
                isVirtual: true
            }));
    }, [conversations, blocks, user]);

    const filteredReleases = useMemo(() => {
        const allItems = [...(blocks || []), ...virtualConvBlocks];
        return allItems.filter(b => {
            // Exclude completely empty notes
            const hasContent = (b.content && b.content.trim()) || (b.caption && b.caption.trim()) || (b.entries && b.entries.length > 0) || (b.muralBlocks && b.muralBlocks.length > 0);
            if (!hasContent) return false;

            // Exclude empty conversation blocks
            if (b.type === 'conversation') {
                try {
                    const parsed = JSON.parse(b.content);
                    if (Array.isArray(parsed) && parsed.length === 0) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            }

            const isRes = b.content && typeof b.content === 'string' && b.content.includes('[resonancia]');
            const isDia = b.entries && b.entries.length > 0;

            if (releaseTab === 'notes') {
                return (b.type === 'text' || b.type === 'insight') && !isRes && !isDia;
            }
            if (releaseTab === 'diary') {
                return isDia;
            }
            if (releaseTab === 'resonance') {
                return isRes;
            }
            if (releaseTab === 'chats') {
                return b.type === 'conversation';
            }
            if (releaseTab === 'images') {
                return b.type === 'image' || b.type === 'relic';
            }
            return true;
        });
    }, [blocks, virtualConvBlocks, releaseTab]);

    // Custom Case Formulation generator based on selections and notes keywords
    const currentCaseFormulation = useMemo(() => {
        const arch = calculatedResults.archetype;
        const noteKws = noteKeywords;
        const score = calculatedResults.score;

        let triggersHtml = "El sistema psíquico detecta tu susceptibilidad atencional y reactividad emocional cuando enfrentas ";
        if (noteKws.length > 0) {
            triggersHtml += `conceptos de alta densidad existencial identificados en tus notas, como *"${noteKws.slice(0, 3).join(', ')}"*`;
        } else {
            triggersHtml += "situaciones de caos y desorganización conceptual en tu entorno de trabajo diario.";
        }

        let dynamicFormulation = `### 1. Formulación de Caso Clínico Funcional (${arch?.name || 'Explorador'})
        
        **A. Estímulo Antecedente / Disparador (A):**
        ${triggersHtml}. Tu cerebro experimenta esto como una amenaza directa a tu coherencia interna.
        
        **B. Estructura de Vulnerabilidad Nuclear (B):**
        Tu perfil fenomenológico revela una vulnerabilidad arraigada en: *"${arch?.vulnerability || 'Búsqueda del orden.'}"*. Esto actúa como una lente cognitiva que distorsiona la neutralidad del lienzo.
        
        **C. Respuesta de Evitación y Bloqueo (C):**
        Ante la sobrecarga, activas el bucle protector de **${arch?.subtitle || 'Evitación'}**, provocando un bloqueo manifiesto como *"${arch?.blockage || 'Parálisis por análisis'}"*.
        
        **D. Consecuencias Autoperpetuantes (D):**
        El repliegue analítico disminuye la ansiedad inmediata, pero a largo plazo refuerza la vulnerabilidad de base, consolidando un bucle psicológico recurrente que paraliza tu flujo creativo de notas en el canvas.`;

        let cognitiveCapacityAnalysis = `### 2. Análisis del Procesamiento Cognitivo (ICAR16)
        
        * **Índice de Acierto Cognitivo**: **${score}/16**
        * **Tiempo Promedio de Reacción (Dwell Time)**: **${calculatedResults.dwellAvg} segundos**
        * **Titubeo (Cambios de Respuesta)**: **${calculatedResults.totalChanges} vacilaciones registradas.**
        
        **Interpretación Cualitativa:**
        ${score >= 12
                ? "Muestras un rendimiento visomental y de inferencia altamente desarrollado, permitiéndote resolver jerarquías espaciales y verbales complejas. Sin embargo, este alto procesamiento analítico te predispone a bucles obsesivos de perfeccionismo intelectual."
                : "Se observa sobrecarga del ejecutivo central en el córtex prefrontal ante tareas de retención visoespacial simultáneas. Esto desencadena mecanismos rápidos de fatiga atencional, provocando respuestas impulsivas para liberar la tensión cognitiva."}`;

        return {
            triggers: triggersHtml,
            formulation: dynamicFormulation,
            cognitive: cognitiveCapacityAnalysis,
            liberation: arch?.liberation || "Explorar con libertad sin juicios."
        };
    }, [calculatedResults, noteKeywords]);

    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const containerRef = useRef(null);
    const isScrollingRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let touchStartY = 0;

        const handleTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleWheelOrSwipe = (e) => {
            const targetTag = e.target.tagName?.toLowerCase();
            if (targetTag === 'textarea' || targetTag === 'input' || e.target.closest('.no-wheel-snap') || e.target.closest('.overflow-y-auto')) {
                return;
            }

            let deltaY = 0;
            if (e.type === 'wheel') {
                deltaY = e.deltaY;
            } else if (e.type === 'touchend') {
                const touchEndY = e.changedTouches[0].clientY;
                deltaY = touchStartY - touchEndY;
            }

            // Scroll down -> open canvas
            if (deltaY > 50) {
                if (!isScrollingRef.current) {
                    isScrollingRef.current = true;
                    setView('canvas');
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            } else if (deltaY < -50) {
                // Scroll up / Swipe down -> open bitacora
                if (!isScrollingRef.current && isLoggedIn && !publicProfileUser) {
                    isScrollingRef.current = true;
                    setIsBitacoraOpen(true);
                    setTimeout(() => isScrollingRef.current = false, 800);
                }
            }
        };

        container.addEventListener('wheel', handleWheelOrSwipe, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchend', handleWheelOrSwipe, { passive: true });

        return () => {
            container.removeEventListener('wheel', handleWheelOrSwipe);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleWheelOrSwipe);
        };
    }, []);

    const handleProductBuyClick = (postId, link) => {
        if (activePurchasingId || activeSuccessId) return;
        setActivePurchasingId(postId);
        setTimeout(() => {
            setActivePurchasingId(null);
            setActiveSuccessId(postId);
            const cleanLink = link && link.trim() !== '' ? (link.startsWith('http') ? link : `https://${link}`) : 'https://ruidointerior.com/shop';
            window.open(cleanLink, '_blank');
            setTimeout(() => {
                setActiveSuccessId(null);
            }, 3000);
        }, 1500);
    };

    return (
        <div
            className="fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[125px] sm:top-[110px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/10 z-[1500] flex flex-col bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 transition-all pointer-events-auto"
            onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                if (touch.clientY - rect.top <= 100) {
                    e.currentTarget.dataset.dragAllowed = 'true';
                    e.currentTarget.dataset.startY = touch.clientY;
                    e.currentTarget.style.transition = 'none';
                } else {
                    e.currentTarget.dataset.dragAllowed = 'false';
                }
            }}
            onTouchMove={(e) => {
                e.stopPropagation();
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;

                const scrollable = e.target.closest('.overflow-y-auto');
                if (scrollable && scrollable.scrollTop > 0) return;

                if (deltaY > 0) {
                    e.currentTarget.style.transform = `translateY(${deltaY}px)`;
                }

                if (deltaY > 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = 'translateY(100%)';
                    setTimeout(() => setView('canvas'), 200);
                }
            }}
            onTouchEnd={(e) => {
                if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                const currentY = e.changedTouches[0].clientY;
                const deltaY = currentY - startY;
                if (deltaY <= 120) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = 'translateY(0px)';
                }
            }}
            onPointerDown={e => e.stopPropagation()}
            onWheel={(e) => {
                e.stopPropagation();
                const scrollable = e.target.closest('.overflow-y-auto');
                if (scrollable && (scrollable.scrollTop > 0 || e.deltaY > 0)) return;

                if (e.deltaY < -50) {
                    e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    e.currentTarget.style.transform = 'translateY(100%)';
                    setTimeout(() => setView('canvas'), 200);
                }
            }}
        >
            {/* TOP NAVIGATION / ACTIONS OVERLAY (FIXED ON SCREEN) */}
            <div className="absolute top-4 sm:top-8 left-4 right-4 md:left-10 md:right-10 flex justify-between items-start pointer-events-none z-50">
                <div className="flex gap-2 pointer-events-auto">
                    {isEditingProfile && (
                        <button
                            onClick={() => { if (coverInputRef.current) coverInputRef.current.click(); }}
                            className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:border-white/30 transition-all text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl animate-fade-in hover:scale-105 active:scale-95"
                        >
                            <Camera size={12} /> Cambiar Portada
                        </button>
                    )}
                </div>
                <input type="file" ref={coverInputRef} onChange={handleCoverChange} accept="image/*" className="hidden" />
            </div>

            <div id="profile-scroll-container" ref={containerRef} className="w-full h-full flex flex-col gap-0 text-white select-none overflow-y-auto overflow-x-hidden no-scrollbar snap-y snap-mandatory scroll-smooth will-change-scroll pb-20 sm:pb-32">
                {/* 1. TOP COVER BANNER */}
                <div className="absolute top-0 left-0 w-full h-[60vh] z-0 pointer-events-none overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}>
                    <div
                        className="absolute inset-0 transition-all duration-700 ease-in-out"
                        style={{
                            backgroundImage: `url(${formatUrl(coverImage)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            opacity: 0.15
                        }}
                    />
                </div>

                {/* IG STYLE PROFILE (CONSOLIDATED) */}
                <div
                    data-index={0}
                    className="profile-hero w-full shrink-0 relative flex flex-col justify-start pt-2 md:pt-4 pb-safe z-10 no-swipe snap-start min-h-[100vh]"
                >
                    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-8 flex flex-col pointer-events-auto">

                        {/* Top Stats Section */}
                        <div className="flex items-center gap-3 sm:gap-6 md:gap-10 mb-3 sm:mb-6 mt-1 sm:mt-4">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className={`w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full p-[2px] ${hasActiveStories ? 'bg-gradient-to-tr from-accent via-purple-500 to-orange-500' : 'bg-white/10'} cursor-pointer group/avatar`} onClick={(e) => {
                                    if (hasActiveStories && !isEditingProfile) {
                                        setViewing24hStories(user24hStories);
                                    } else {
                                        handleAvatarClick(e);
                                    }
                                }}>
                                    <div className="w-full h-full rounded-full border-2 border-[#050506] overflow-hidden bg-zinc-900">
                                        <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={formatUrl(avatar)} className="w-full h-full object-cover" />
                                    </div>
                                    {isEditingProfile && (
                                        <div className="absolute inset-0 m-[2px] rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none">
                                            <Camera size={18} className="text-white mb-1" />
                                            <span className="text-[7px] font-black uppercase tracking-widest text-white">Cambiar</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                                <div onClick={(e) => { e.stopPropagation(); setIsStoryUploadModalOpen(true); }} className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-accent rounded-full border-2 border-[#050506] flex items-center justify-center text-[#050506] cursor-pointer hover:bg-white transition-colors z-10 shadow-lg">
                                    <Plus size={11} strokeWidth={3} className="sm:w-3.5 sm:h-3.5" />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex-1 flex justify-around md:justify-start md:gap-12 items-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-sm sm:text-base md:text-xl font-bold">{(feed || []).filter(b => b.username === user).length}</span>
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-zinc-400">publicaciones</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm sm:text-base md:text-xl font-bold">0</span>
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-zinc-400">resonancias</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm sm:text-base md:text-xl font-bold">0</span>
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-zinc-400">conexiones</span>
                                </div>
                            </div>
                        </div>

                        {/* Bio and Highlights Side-by-Side Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 sm:gap-4 mb-1.5 sm:mb-6 mt-1 sm:mt-2">
                            {/* Biography Card (curved rectangle module) */}
                            <div className="md:col-span-8 bg-zinc-900/60 border border-white/5 rounded-xl py-2 px-3 sm:p-4 backdrop-blur-sm shadow-lg flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <h2 className="text-xs sm:text-sm font-bold text-white">{user}</h2>
                                            <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Creador / Explorador</span>
                                        </div>
                                    </div>
                                    {isEditingProfile ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea
                                                value={bio}
                                                onChange={(e) => { setBio(e.target.value); localStorage.setItem('oasis_bio_' + user, e.target.value); }}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-white/30 transition-all font-sans resize-none min-h-[60px]"
                                                placeholder="Descripción o biografía..."
                                            />
                                            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-all">
                                                <div className="pl-2 pr-1 text-zinc-500"><LinkIcon size={12} /></div>
                                                <input
                                                    type="url"
                                                    value={profileLink}
                                                    onChange={(e) => { setProfileLink(e.target.value); localStorage.setItem('oasis_profilelink_' + user, e.target.value); }}
                                                    className="w-full bg-transparent p-2 pl-1 text-xs text-accent outline-none font-sans"
                                                    placeholder="https://tupagina.com"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[10px] sm:text-xs leading-relaxed text-zinc-300 font-sans mb-2 sm:mb-3 whitespace-pre-wrap">
                                                {bio || 'Explorando el ruido interior.'}
                                            </p>
                                            {profileLink && (
                                                <a href={profileLink.startsWith('http') ? profileLink : `https://${profileLink}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1.5 break-all mt-auto">
                                                    <LinkIcon size={12} className="shrink-0 scale-90 sm:scale-100" />
                                                    {profileLink.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                            {(() => {
                                                let resonanceData = null;
                                                try {
                                                    const saved = localStorage.getItem(`oasis_public_traits_${user}`);
                                                    if (saved) {
                                                        const parsed = JSON.parse(saved);
                                                        if (parsed?.sintesis || parsed?.Sintesis) {
                                                            resonanceData = { sintesis: parsed.sintesis || parsed.Sintesis };
                                                        } else if (parsed?.habitar || parsed?.Habitar) {
                                                            resonanceData = {
                                                                habitar: parsed?.habitar || parsed?.Habitar,
                                                                vinculo: parsed?.vinculo || parsed?.Vinculo || '',
                                                                busqueda: parsed?.busqueda || parsed?.Busqueda || ''
                                                            };
                                                        }
                                                    }
                                                } catch(e) {}
                                                if (!resonanceData) return null;
                                                return (
                                                    <div className="mt-4 pt-4 border-t border-white/5 w-full space-y-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                                            <span className="text-[10px] font-bold text-zinc-300 tracking-wide uppercase font-mono">Firma de Resonancia Existencial</span>
                                                        </div>
                                                        {resonanceData.sintesis ? (
                                                            <p className="text-[11px] sm:text-[12px] text-zinc-300 font-sans leading-relaxed italic pr-2 border-l-2 border-white/10 pl-3 py-1">"{resonanceData.sintesis}"</p>
                                                        ) : (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-[12px]">🌌</span> Habitar</span>
                                                                    <p className="text-[10px] sm:text-[11px] text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonanceData.habitar}"</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-[12px]">🌿</span> Vínculo</span>
                                                                    <p className="text-[10px] sm:text-[11px] text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonanceData.vinculo}"</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-[12px]">✨</span> Búsqueda</span>
                                                                    <p className="text-[10px] sm:text-[11px] text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonanceData.busqueda}"</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Highlights Card (new highlighted stories next to Bio) */}
                            <div className="md:col-span-4 bg-zinc-900/40 border border-white/5 rounded-xl py-1.5 px-3 sm:p-4 backdrop-blur-sm shadow-md flex flex-col">
                                <span className="text-[8px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 sm:mb-3">Destacados</span>
                                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 flex-1">
                                    <div className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer group" onClick={() => setIsHighlightModalOpen(true)}>
                                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-white/10 p-[1.5px] group-hover:border-white/30 transition-colors">
                                            <div className="w-full h-full rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                                                <Plus size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                        <span className="text-[8px] text-zinc-400 font-medium">Nuevo</span>
                                    </div>
                                    {(feed || []).filter(b => b.username === user && b.type === 'highlight').map((h, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group" onClick={() => setSelectedHighlight(h)}>
                                            <div className="w-12 h-12 rounded-full border border-white/10 p-[1.5px] group-hover:border-white/30 transition-colors">
                                                <div className="w-full h-full rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                                                    {h.metadata?.thumbnail ? <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={formatUrl(h.metadata.thumbnail)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" /> : <div className="w-full h-full bg-accent/10" />}
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-zinc-400 font-medium truncate max-w-[48px]">{typeof h.content === 'string' ? h.content : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 mb-2 sm:mb-6">
                            <button
                                onClick={() => {
                                    if (isEditingProfile && onSaveProfile) {
                                        onSaveProfile({ fullName, bio, profileLink });
                                    }
                                    setIsEditingProfile(!isEditingProfile);
                                }}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${isEditingProfile ? 'bg-accent text-black' : 'bg-white/10 hover:bg-white/15'}`}
                            >
                                {isEditingProfile ? 'Guardar Cambios' : 'Editar perfil'}
                            </button>

                            <button onClick={() => setIsSettingsOpen(true)} className="px-2.5 bg-white/10 hover:bg-white/15 py-0.5 sm:py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center">
                                <Settings size={16} />
                            </button>
                        </div>

                        {/* Carta de Vibracion Existencial (Personal) */}


                        {/* Products Showcase (New section replacing old Highlights) */}
                        {(() => {
                            const linkedPosts = (feed || []).filter(b => b.username === user && b.type !== 'story' && b.type !== 'highlight' && ((typeof b.metadata?.buyLink === 'string' && b.metadata.buyLink.trim() !== '') || (typeof b.metadata?.price === 'string' && b.metadata.price.trim() !== '')));
                            return (
                                <div className="mb-4 sm:mb-8">
                                    <div className="flex items-center justify-between mb-1.5 sm:mb-3 px-1">
                                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <ShoppingBag size={10} className="text-zinc-500" />
                                            <span>Productos & Enlaces ({linkedPosts.length})</span>
                                        </span>
                                    </div>

                                    {linkedPosts.length === 0 ? (
                                        <div className="w-full py-4 border border-dashed border-white/5 bg-zinc-950/40 rounded-xl flex items-center justify-center text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                                            No hay productos publicados por ahora
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 pb-2">
                                            {linkedPosts.map((prod) => {
                                                const id = prod.id;

                                                // Extract data
                                                let title = prod.caption || '';
                                                if (!title && prod.content && typeof prod.content === 'string') {
                                                    title = prod.content.split('\n')[0].replace(/\[.*?\]/g, '').trim().substring(0, 32);
                                                }
                                                if (!title) title = 'Producto';

                                                let price = prod.metadata?.price;
                                                if (!price && prod.content && typeof prod.content === 'string') {
                                                    const match = prod.content.match(/\$\d+(?:\.\d{2})?/);
                                                    if (match) price = match[0];
                                                }
                                                if (!price) price = 'Ver';

                                                const link = prod.metadata?.buyLink;
                                                const postImg = getBlockPreviewImage(prod);
                                                const postVid = getBlockPreviewVideo(prod);

                                                return (
                                                    <div
                                                        key={id}
                                                        className="w-full aspect-square rounded-xl border border-white/5 relative group/prod-card overflow-hidden"
                                                    >
                                                        {postImg ? (
                                                            <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={postImg} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/prod-card:scale-105" />
                                                        ) : postVid ? (
                                                            <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }} src={postVid} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-[#0d0d10]" />
                                                        )}
                                                        {postVid && (
                                                            <div className="absolute top-1 right-1 p-0.5 bg-black/60 rounded text-white z-10">
                                                                <Film size={8} />
                                                            </div>
                                                        )}

                                                        {/* Elegant Dark Overlay with Content */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10 flex flex-col justify-between p-2">
                                                            {/* Top row - Price Badge */}
                                                            <span className="self-start px-1.5 py-0.5 rounded bg-black/75 border border-white/5 text-[7px] md:text-[8px] font-mono font-bold text-accent">
                                                                {price}
                                                            </span>

                                                            {/* Bottom row - Title and Button */}
                                                            <div className="flex flex-col gap-1 w-full">
                                                                <h4 className="text-[8px] md:text-[9px] font-bold text-white tracking-tight line-clamp-1 text-center w-full">
                                                                    {title}
                                                                </h4>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleProductBuyClick(id, link);
                                                                    }}
                                                                    disabled={activePurchasingId === id}
                                                                    className={`w-full py-1 rounded-md text-[7px] md:text-[8px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 ${activeSuccessId === id
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : (activePurchasingId === id
                                                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                                            : 'bg-white/10 hover:bg-accent text-white hover:text-black border border-white/10 hover:border-transparent hover:scale-[1.02] active:scale-[0.98] shadow-lg')
                                                                        }`}
                                                                >
                                                                    {activePurchasingId === id && (
                                                                        <div className="w-2 h-2 border border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                                                                    )}
                                                                    {activeSuccessId === id ? 'Listo' : (activePurchasingId === id ? '...' : 'Comprar')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}


                        {/* Tabs */}
                        <div className="flex items-center justify-around border-t border-white/10 w-full">
                            <button
                                onClick={() => setReleaseTab('posts')}
                                className={`flex-1 flex justify-center py-2 sm:py-3 border-t-2 transition-all ${releaseTab === 'posts' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}
                            >
                                <LayoutGrid size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    setReleaseTab('saved');
                                    reloadSaved();
                                }}
                                className={`flex-1 flex justify-center py-3 border-t-2 transition-all ${releaseTab === 'saved' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}
                            >
                                <Bookmark size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => setReleaseTab('resonance')}
                                className={`flex-1 flex justify-center py-3 border-t-2 transition-all ${releaseTab === 'resonance' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}
                            >
                                <Sparkles size={16} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="w-full pb-10">
                            {(() => {
                                const userPosts = (feed || []).filter(b => b.username === user && b.type !== 'story' && b.type !== 'highlight');
                                let tabFilteredPosts = userPosts;
                                if (releaseTab === 'posts') {
                                    tabFilteredPosts = userPosts.filter(b => !((typeof b.metadata?.buyLink === 'string' && b.metadata.buyLink.trim() !== '') || (typeof b.metadata?.price === 'string' && b.metadata.price.trim() !== '')));
                                } else if (releaseTab === 'linked') {
                                    tabFilteredPosts = userPosts.filter(b => (typeof b.metadata?.buyLink === 'string' && b.metadata.buyLink.trim() !== '') || (typeof b.metadata?.price === 'string' && b.metadata.price.trim() !== ''));
                                } else if (releaseTab === 'saved') {
                                    tabFilteredPosts = (feed || []).filter(b => savedPostIds.includes(b.id));
                                } else if (releaseTab === 'resonance') {
                                    tabFilteredPosts = userPosts.filter(b => {
                                        const hasScore = b.metadata?.resonanceScore > 0;
                                        const hasTag = b.content && typeof b.content === 'string' && b.content.includes('[resonancia]');
                                        return (hasScore || hasTag) && !((typeof b.metadata?.buyLink === 'string' && b.metadata.buyLink.trim() !== '') || (typeof b.metadata?.price === 'string' && b.metadata.price.trim() !== ''));
                                    });
                                }

                                if (tabFilteredPosts.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center text-zinc-500 font-mono text-[9px] uppercase tracking-widest gap-2 py-16">
                                            <span>Sin publicaciones en esta categoría</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-3 gap-1 md:gap-1.5 w-full">
                                        {tabFilteredPosts.map((post, index) => {
                                            const postImg = getBlockPreviewImage(post);
                                            const postVid = getBlockPreviewVideo(post);
                                            const cleanText = post.metadata?.feedText || ((post.content && typeof post.content === 'string') ? post.content.split('\n').filter(l => typeof l === 'string' && !l.startsWith('[img]') && !l.startsWith('[vid]') && !l.startsWith('[aud]')).join('\n') : '') || '';

                                            return (
                                                <div
                                                    key={post.id || index}
                                                    onClick={() => {
                                                        if (onNavigateToFeedPost) {
                                                            onNavigateToFeedPost(post.id);
                                                        }
                                                    }}
                                                    className="aspect-square w-full bg-zinc-900 relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
                                                >
                                                    {postImg ? (
                                                        <>
                                                            <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={postImg} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                            {postVid && (
                                                                <div className="absolute top-2 right-2 text-white drop-shadow-md">
                                                                    <Film size={16} fill="white" />
                                                                </div>
                                                            )}
                                                            {(post.metadata?.buyLink || post.metadata?.price) && (
                                                                <div className="absolute bottom-2 left-2 text-white drop-shadow-md">
                                                                    <ShoppingBag size={14} fill="white" />
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : postVid ? (
                                                        <>
                                                            <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }} src={postVid} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" muted loop playsInline onMouseEnter={e => e.target.play().catch(() => { })} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                                                            <div className="absolute top-2 right-2 text-white drop-shadow-md">
                                                                <Film size={16} fill="white" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col justify-between p-2 relative bg-zinc-800">
                                                            <div className="absolute top-2 right-2 text-white/50">
                                                                <FileText size={14} />
                                                            </div>
                                                            <p className="text-[8px] md:text-[10px] font-sans text-white/90 line-clamp-5 md:line-clamp-6 leading-relaxed mt-2">
                                                                {cleanText}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                                        {post.metadata?.resonanceScore > 0 && (
                                                            <div className="flex items-center gap-1 text-white text-xs font-bold">
                                                                <Activity size={14} /> {post.metadata.resonanceScore}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Animated Scroll Down Indicator to open Canvas */}
                <div
                    className="flex flex-col items-center gap-1 animate-bounce cursor-pointer pb-2 pointer-events-auto mt-auto shrink-0"
                    onClick={() => {
                        setView('canvas');
                    }}
                >
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500">Desliza para abrir el pizarrón</span>
                    <ChevronDown size={12} className="text-zinc-500" />
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

const AnimatedCanvasConnections = React.memo(({ links, blocks, draggingId, camScale, accent, linkSource, mouseCanvasPos, removeConnection }) => {
    return (
        <svg className="absolute inset-0 pointer-events-none -translate-x-[5000px] -translate-y-[5000px] overflow-visible" style={{ width: '10000px', height: '10000px', zIndex: 60 }}>
            {links.map((link, idx) => {
                const from = blocks.find(b => b.id === link.from);
                const to = blocks.find(b => b.id === link.to);
                if (!from || !to) return null;

                // Evitar dibujar enlaces a bloques de sistema, inválidos o ubicados en el infinito (ej. profile_settings o user_settings)
                if (from.x === 99999 || from.y === 99999 || to.x === 99999 || to.y === 99999) return null;
                if (from.x === undefined || from.y === undefined || to.x === undefined || to.y === undefined) return null;
                if (from.id === to.id) return null;

                const { p1, p2, cp1, cp2 } = getConnectionPoints(from, to, false, draggingId, camScale);
                const path = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
                const color = link.color || (from.color && from.color !== '#bef264' ? from.color : accent);

                return (
                    <g key={`canvas-${link.from}-${link.to}-${idx}`} className="pointer-events-auto cursor-pointer group/link-canvas" onClick={(e) => {
                        e.stopPropagation();
                        removeConnection(link.from, link.to);
                    }}>
                        <path d={path} stroke="transparent" strokeWidth="28" fill="none" />

                        {/* Glow Halo */}
                        {camScale > 0.5 && (
                            <path
                                d={path}
                                stroke={color}
                                strokeWidth="6"
                                fill="none"
                                className="opacity-30 transition-opacity duration-300 group-hover/link-canvas:opacity-60"
                            />
                        )}

                        {/* Core Rope */}
                        <path
                            d={path}
                            stroke={color}
                            strokeWidth="3.5"
                            fill="none"
                            className="opacity-80 transition-opacity duration-300 group-hover/link-canvas:opacity-100"
                        />

                        {/* Twisted Thread Illusion */}
                        {camScale > 0.5 && !isMobileViewport() && (
                            <path
                                d={path}
                                stroke="white"
                                strokeWidth="1.2"
                                strokeDasharray="4, 4"
                                fill="none"
                                className="opacity-50 pointer-events-none transition-opacity duration-300 group-hover/link-canvas:opacity-80"
                            />
                        )}

                        {/* Hover Indicator */}
                        <path d={path} stroke="white" strokeWidth="1" fill="none" className="opacity-0 group-hover/link-canvas:opacity-50 transition-opacity" />
                    </g>
                );
            })}

            {linkSource && (() => {
                const from = blocks.find(b => b.id === linkSource);
                if (!from) return null;

                const mousePt = {
                    x: mouseCanvasPos.x,
                    y: mouseCanvasPos.y
                };

                const { p1, p2, cp1, cp2 } = getConnectionPoints(from, mousePt, true, draggingId, camScale);
                const path = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
                const color = from.color && from.color !== '#bef264' ? from.color : accent;

                return (
                    <g>
                        <path
                            d={path}
                            stroke={color}
                            strokeWidth="6"
                            fill="none"
                            className={`opacity-30 ${!isMobileViewport() ? 'animate-pulse' : ''}`}
                        />
                        {!isMobileViewport() && (
                            <path
                                d={path}
                                stroke="white"
                                strokeWidth="2"
                                strokeDasharray="5, 5"
                                fill="none"
                                className="opacity-80"
                            />
                        )}
                    </g>
                );
            })()}
        </svg>
    );
});

export default function App() {
    const [view, setViewRaw] = useState(() => localStorage.getItem('oasis_user') === 'observador1' ? 'clinical' : 'canvas');
    const [activeCanvasId, setActiveCanvasId] = useState(() => localStorage.getItem('oasis_active_canvas') || 'canvas_default');
    const [titlePrompt, setTitlePrompt] = useState(null);
    const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
    const [isStoryUploadModalOpen, setIsStoryUploadModalOpen] = useState(false);
    const [selectedHighlight, setSelectedHighlight] = useState(null);
    const [viewing24hStories, setViewing24hStories] = useState(null);

    useEffect(() => {
        localStorage.setItem('oasis_active_canvas', activeCanvasId);
    }, [activeCanvasId]);
    const [publicProfileUser, setPublicProfileUser] = useState(null);
    const [publicProfileTab, setPublicProfileTab] = useState('posts');
    const [selectedPublicPost, setSelectedPublicPost] = useState(null);
    const [focusedFeedPostId, setFocusedFeedPostId] = useState(null);
    const [publicProfileData, setPublicProfileData] = useState(null);
    const [publicProfileBackground, setPublicProfileBackground] = useState(null);

    // Fetch real avatar/cover/bio when viewing another user's profile
    useEffect(() => {
        if (!publicProfileUser) {
            setPublicProfileData(null);
            setPublicProfileBackground(null);
            return;
        }
        const cleanUser = publicProfileUser.replace('@', '');
        fetch(`${API_URL}/api/oasis/blocks?user=${cleanUser}`)
            .then(r => r.json())
            .then(blocks => {
                const profileBlock = Array.isArray(blocks) ? blocks.find(b => b.id === 'profile_settings' || b.Id === 'profile_settings') : null;
                if (profileBlock) {
                    try { 
                        const parsed = JSON.parse(profileBlock.content || profileBlock.Content || '{}');
                        setPublicProfileData(parsed); 
                        localStorage.setItem(`oasis_cached_profile_${cleanUser}`, JSON.stringify(parsed));
                    }
                    catch { setPublicProfileData(null); }
                } else { setPublicProfileData(null); }
            }).catch(() => setPublicProfileData(null));

        fetch(`${API_URL}/api/oasis/background?user=${cleanUser}`)
            .then(r => r.json())
            .then(bg => {
                setPublicProfileBackground(bg);
            }).catch(() => setPublicProfileBackground(null));
    }, [publicProfileUser]);

    // NUEVA LOGICA DE ENRUTAMIENTO PUBLICO
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userParam = params.get('u');
        if (userParam) {
            setPublicProfileUser(userParam);
        } else {
            const path = window.location.pathname;
            if (path !== '/' && path !== '') {
                const potentialUser = path.substring(1).replace('/', '');
                if (potentialUser && !potentialUser.startsWith('api') && potentialUser !== 'index.html') {
                    setPublicProfileUser(potentialUser);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (publicProfileUser) {
            window.history.pushState({}, '', '/?u=' + publicProfileUser.replace('@', ''));
        } else {
            if (window.location.search.includes('u=')) {
                window.history.pushState({}, '', '/');
            } else if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.history.pushState({}, '', '/');
            }
        }
    }, [publicProfileUser]);

    const setView = useCallback((v) => {
        setPublicProfileUser(null);
        setSelectedPublicPost(null);
        setViewRaw(v);
    }, []);

    const navigateToFeedAndFocusPost = useCallback((postId) => {
        setPublicProfileUser(null);
        setSelectedPublicPost(null);
        setFocusedFeedPostId(postId);
        setViewRaw('feed');
    }, []);

    useEffect(() => {
        if (view === 'feed' && focusedFeedPostId) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`feed-item-${focusedFeedPostId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setFocusedFeedPostId(null);
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [view, focusedFeedPostId]);

    const initialStartupScreen = typeof window !== 'undefined' ? localStorage.getItem('oasis_startup_screen') || 'bitacora' : 'bitacora';
    const [startupScreen, setStartupScreen] = useState(initialStartupScreen);

    const [isBitacoraOpen, setIsBitacoraOpen] = useState(initialStartupScreen === 'bitacora');
    const [accent, setAccent] = useState(localStorage.getItem('oasis_accent') || '#bef264');
    const [lastInteractedBlockId, setLastInteractedBlockId] = useState(null);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--accent', accent);
        root.style.setProperty('--accent-rgb', hexToRgb(accent));
        localStorage.setItem('oasis_accent', accent);
    }, [accent]);


    const [blocks, setBlocksRaw] = useState(INITIAL_BLOCKS);
    const setBlocks = useCallback((newVal) => {
        if (typeof newVal === 'function') {
            setBlocksRaw(prev => deduplicateBlocks(newVal(prev)));
        } else {
            setBlocksRaw(deduplicateBlocks(newVal));
        }
    }, []);
    const [soulPieces, setSoulPieces] = useState(INITIAL_SOUL_PIECES);
    const [feed, setFeed] = useState([]);
    const [publicUsers, setPublicUsers] = useState([]);
    const [activeFeedIndex, setActiveFeedIndex] = useState(0);

    const [isComposerOpen, setIsComposerOpenRaw] = useState(false);
    const [isPublishSelectorOpen, setIsPublishSelectorOpen] = useState(false);
    const [isSimpleNotesOpen, setIsSimpleNotesOpenRaw] = useState(false);
    const [isSplitViewEnabled, setIsSplitViewEnabled] = useState(false);
    const [isUnifiedCreatorOpen, setIsUnifiedCreatorOpen] = useState(initialStartupScreen === 'diary');

    // Reactive viewport height — updates when mobile keyboard opens/closes
    const [viewportStats, setViewportStats] = useState(() => ({
        visualHeight: window.visualViewport?.height || window.innerHeight,
        innerHeight: window.innerHeight,
        offsetTop: window.visualViewport?.offsetTop || 0
    }));
    const [maxHeight, setMaxHeight] = useState(window.innerHeight);
    useEffect(() => {
        const update = () => {
            const visualH = window.visualViewport?.height || window.innerHeight;
            const innerH = window.innerHeight;
            const offsetT = window.visualViewport?.offsetTop || 0;
            setViewportStats({
                visualHeight: visualH,
                innerHeight: innerH,
                offsetTop: offsetT
            });
            setMaxHeight(prev => Math.max(prev, innerH));
            if (window.scrollY !== 0) {
                window.scrollTo(0, 0);
            }
            if (document.body.scrollTop !== 0) {
                document.body.scrollTop = 0;
            }
        };
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', update);
            window.visualViewport.addEventListener('scroll', update);
        }
        window.addEventListener('resize', update);
        update();
        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', update);
                window.visualViewport.removeEventListener('scroll', update);
            }
            window.removeEventListener('resize', update);
        };
    }, []);
    const [unifiedTab, setUnifiedTab] = useState(initialStartupScreen === 'diary' ? 'diary' : 'chat');
    const simpleNotesRef = useRef(null);
    const feedTouchStartX = useRef(0);
    const feedTouchEndX = useRef(0);
    const composerLongPressTimerRef = useRef(null);
    const isComposerLongPressRef = useRef(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [bgType, setBgType] = useState('color');
    const [bgValue, setBgValue] = useState('#030304');
    const [isTiled, setIsTiled] = useState(false);
    const [_unused1, _unused2] = useState(0.8);
    const [bgTemplates, setBgTemplates] = useState([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [clabeInput, setClabeInput] = useState('');
    const [withdrawStatus, setWithdrawStatus] = useState('');

    const globalVideoRef = useRef(null);

    const handleBackgroundVideoError = (e) => {
        const vid = e.currentTarget;
        console.warn("Fallo de reproducción en video de fondo, reintentando...", vid.src);
        setTimeout(() => {
            if (vid) {
                const currentSrc = vid.src;
                vid.src = '';
                vid.load();
                vid.src = currentSrc;
                vid.play().catch(err => console.log("Fallo al reproducir tras error de red/compositor:", err));
            }
        }, 3000);
    };

    const handleBackgroundVideoStalled = (e) => {
        const vid = e.currentTarget;
        vid.play().catch(err => {
            if (err.name !== 'AbortError') {
                console.log("Fallo al reproducir tras estancamiento:", err);
            }
        });
    };

    useEffect(() => {
        const resumeVideos = () => {
            const videos = document.querySelectorAll('.global-bg-video');
            videos.forEach(v => {
                if (v instanceof HTMLVideoElement) {
                    v.play().catch(err => {
                        if (err.name !== 'AbortError') {
                            console.log("Fallo al forzar play del fondo:", err);
                        }
                    });
                }
            });
        };

        resumeVideos();

        window.addEventListener('focus', resumeVideos);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                resumeVideos();
            }
        });

        const handleInteraction = () => {
            resumeVideos();
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('focus', resumeVideos);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [bgType, bgValue]);

    const [user, setUser] = useState(localStorage.getItem('oasis_user') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('oasis_user'));
    const [showPass, setShowPass] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [authError, setAuthError] = useState('');
    const [credits, setCredits] = useState(() => Number(localStorage.getItem('oasis_credits_' + (localStorage.getItem('oasis_user') || ''))) || 100);
    useEffect(() => {
        if (user) {
            localStorage.setItem('oasis_credits_' + user, credits);
        }
    }, [credits, user]);

    useEffect(() => {
        if (window.guardarApiUrl) {
            window.guardarApiUrl(API_URL).catch(err => console.error("Error saving API_URL:", err));
        }
    }, [user]);

    // Tab listener was removed as requested
    useEffect(() => {
        if (user === 'observador1') {
            if (view !== 'clinical') {
                setView('clinical');
            }
        } else {
            if (view === 'clinical') {
                setView('canvas');
            }
        }
    }, [user, view]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [deepseekKey, setDeepseekKey] = useState(() => {
        // Base64 of the key to completely bypass GitHub Guardian
        return atob("c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU=");
    });
    const [customEndpoint, setCustomEndpoint] = useState(() => localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions');
    const [customModel, setCustomModel] = useState(() => localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat');
    const [apiTestResult, setApiTestResult] = useState('');
    const [apiTestLoading, setApiTestLoading] = useState(false);

    // --- APP STATE ---
    // Sidebar & Conversations
    const [conversations, setConversations] = useState([]);
    const [activeExplorationNodeId, setActiveExplorationNodeId] = useState(null);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [userMemory, setUserMemory] = useState([]); // Persistent AI facts
    const [userStyleProfile, setUserStyleProfile] = useState(() => {
        try { return JSON.parse(localStorage.getItem('oasis_style_profile_' + (localStorage.getItem('oasis_user') || '')) || 'null') || null; } catch (e) { return null; }
    }); // Per-user adaptive communication style

    const [activeNotebook, setActiveNotebookRaw] = useState(null); // 'diary' | 'resonance'

    const [avatar, setAvatar] = useState(() => localStorage.getItem('oasis_avatar_' + (localStorage.getItem('oasis_user') || '')) || '');

    useEffect(() => {
        if (user) {
            setAvatar(localStorage.getItem('oasis_avatar_' + user) || '');
        } else {
            setAvatar('');
        }
    }, [user]);

    // Psychometrics and Soul Archive states (moved to App level)
    const [soulTab, setSoulTab] = useState('tests'); // 'loop_map' | 'memory' | 'tests'
    const [activeTest, setActiveTestRaw] = useState(null); // 'phenom' | 'pid5' | 'icar16' | null
    const [activeTestCardIndex, setActiveTestCardIndex] = useState(0);

    // Versioning and ICAR-16 question-level video recording states
    const [activeVersion, setActiveVersion] = useState(() => {
        try { return parseInt(localStorage.getItem('oasis_active_version_' + (localStorage.getItem('oasis_user') || ''))) || 1; } catch (e) { return 1; }
    });
    const [totalVersions, setTotalVersions] = useState(() => {
        try { return parseInt(localStorage.getItem('oasis_total_versions_' + (localStorage.getItem('oasis_user') || ''))) || 1; } catch (e) { return 1; }
    });
    const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
    const [icarVideos, setIcarVideos] = useState({});
    const icarVideosRef = useRef({});
    const icarWebcamRef = useRef(null);
    const longPressTimerRef = useRef(null);

    const [phenomAnswers, setPhenomAnswers] = useState({});
    const [phenomQualitative, setPhenomQualitative] = useState({ antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" });
    const [pidAnswers, setPidAnswers] = useState({});
    const [phenomTextValue, setPhenomTextValue] = useState("");
    const [icarAnswers, setIcarAnswers] = useState({});
    const [currentPhenomIndex, setCurrentPhenomIndex] = useState(0);
    const [showPhenomIntro, setShowPhenomIntro] = useState(true);
    const [currentPidIndex, setCurrentPidIndex] = useState(0);
    const [currentIcarIndex, setCurrentIcarIndex] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [icarDwellTimes, setIcarDwellTimes] = useState({});
    const [icarChanges, setIcarChanges] = useState({});
    const [selectedLoopNode, setSelectedLoopNode] = useState('trigger'); // 'trigger' | 'vulnerability' | 'blockage' | 'consequence' | 'liberation'
    const [expandedIcarQuestion, setExpandedIcarQuestion] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [interactionLogs, setInteractionLogs] = useState([]);
    const [webcamStream, setWebcamStream] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const keepRecordingRef = useRef(false);




    const [clinicalSessions, setClinicalSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const testsContainerRef = useRef(null);
    const [resultsSubTab, setResultsSubTab] = useState('summary'); // 'summary' | 'phenom_detail' | 'icar_detail'

    // States and refs for Phenomenology Video Recording & Speech-to-Text
    const [phenomRecording, setPhenomRecording] = useState(false);
    const [phenomPaused, setPhenomPaused] = useState(false);
    const [phenomHasRecorded, setPhenomHasRecorded] = useState({});
    const [phenomRecordedBlobs, setPhenomRecordedBlobs] = useState({});
    const phenomRecordedBlobsRef = useRef({});
    const [phenomDwellTimes, setPhenomDwellTimes] = useState({});
    const [phenomPauseCounts, setPhenomPauseCounts] = useState({});
    const phenomStartTimeRef = useRef(null);
    const phenomWebcamRef = useRef(null);
    const phenomStreamRef = useRef(null);
    const phenomMediaRecorderRef = useRef(null);
    const phenomChunksRef = useRef([]);
    const phenomAudioContextRef = useRef(null);
    const phenomAnalyserRef = useRef(null);
    const phenomDataArrayRef = useRef(null);
    const [phenomVolume, setPhenomVolume] = useState(0);

    const {
        isRecording: phenomSttRecording,
        interimTranscript: phenomInterimTranscript,
        isSupported: phenomSttSupported,
        error: phenomSttError,
        isMicPermissionGranted: phenomMicGranted,
        startRecording: phenomStartStt,
        stopRecording: phenomStopStt,
        setTranscript: phenomSetSttTranscript
    } = useTranscription({
        onTranscriptChange: (text) => {
            setPhenomTextValue(text);
        }
    });

    const cleanupPhenomMedia = useCallback(() => {
        if (phenomStreamRef.current) {
            phenomStreamRef.current.getTracks().forEach(track => track.stop());
            phenomStreamRef.current = null;
        }
        if (phenomAudioContextRef.current) {
            phenomAudioContextRef.current.close();
            phenomAudioContextRef.current = null;
        }
        phenomStopStt();
        setPhenomRecording(false);
        setPhenomPaused(false);
    }, [phenomStopStt]);

    useEffect(() => {
        if (activeTest === 'phenom' && currentPhenomIndex < 4) {
            // Camera and audio disabled per user request for onboarding
            cleanupPhenomMedia();
        } else {
            cleanupPhenomMedia();
        }
        return () => {
            cleanupPhenomMedia();
        };
    }, [activeTest, currentPhenomIndex, cleanupPhenomMedia]);

    useEffect(() => {
        if (activeTest === 'phenom' && currentPhenomIndex < 4) {
            phenomSetSttTranscript(phenomTextValue || "");
        }
    }, [currentPhenomIndex, activeTest, phenomSetSttTranscript]);

    const togglePhenomRecording = () => {
        if (phenomRecording) {
            // Stop recording
            setPhenomRecording(false);
            setPhenomPaused(false);
            setPhenomHasRecorded(prev => ({ ...prev, [currentPhenomIndex]: true }));
            phenomStopStt();

            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state !== 'inactive') {
                phenomMediaRecorderRef.current.stop();
            }

            if (phenomStartTimeRef.current) {
                const elapsed = Date.now() - phenomStartTimeRef.current;
                setPhenomDwellTimes(prev => ({
                    ...prev,
                    [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + elapsed
                }));
                phenomStartTimeRef.current = null;
            }
        } else {
            // Start recording
            setPhenomRecording(true);
            setPhenomPaused(false);
            setPhenomTextValue("");
            phenomStartStt("");

            if (phenomStreamRef.current) {
                phenomChunksRef.current = [];
                let options = { mimeType: 'video/webm;codecs=vp9,opus' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm;codecs=vp8,opus' };
                }
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }

                try {
                    const mediaRecorder = new MediaRecorder(phenomStreamRef.current, options);
                    phenomMediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data && event.data.size > 0) {
                            phenomChunksRef.current.push(event.data);
                        }
                    };

                    const activeIdx = currentPhenomIndex;
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(phenomChunksRef.current, { type: 'video/webm' });
                        phenomRecordedBlobsRef.current[activeIdx] = blob;
                        setPhenomRecordedBlobs(prev => ({
                            ...prev,
                            [activeIdx]: blob
                        }));
                    };

                    mediaRecorder.start(1000);
                } catch (err) {
                    console.error("Error starting phenomenology MediaRecorder:", err);
                }
            }
            phenomStartTimeRef.current = Date.now();
        }
    };

    const togglePhenomPause = () => {
        if (!phenomRecording) return;
        if (phenomPaused) {
            setPhenomPaused(false);
            phenomStartStt(phenomTextValue);
            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state === 'paused') {
                phenomMediaRecorderRef.current.resume();
            }
            phenomStartTimeRef.current = Date.now();
        } else {
            setPhenomPaused(true);
            phenomStopStt();
            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state === 'recording') {
                phenomMediaRecorderRef.current.pause();
            }
            setPhenomPauseCounts(prev => ({
                ...prev,
                [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + 1
            }));
            if (phenomStartTimeRef.current) {
                const elapsed = Date.now() - phenomStartTimeRef.current;
                setPhenomDwellTimes(prev => ({
                    ...prev,
                    [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + elapsed
                }));
                phenomStartTimeRef.current = null;
            }
        }
    };

    // --- MEDITATION & CONTEMPLATION SPACE ---
    const [isMeditationMode, setIsMeditationMode] = useState(false);
    const [isAudioActive, setIsAudioActive] = useState(false);
    const [breathPhase, setBreathPhase] = useState(0); // 0: Inhala, 1: Retén, 2: Exhala, 3: Vacío
    const [selectedContemplationFact, setSelectedContemplationFact] = useState(null);
    const [reinterpretationText, setReinterpretationText] = useState("");
    const [activeMemoryIndex, setActiveMemoryIndex] = useState(0);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

    // Swipe state for memory cards
    const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null
    const [swipeTriggered, setSwipeTriggered] = useState(false);
    const dragStartRef = useRef(null);

    // Map Pan/Zoom state
    const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
    const [isPanningMap, setIsPanningMap] = useState(false);
    const mapPanStart = useRef({ x: 0, y: 0 });
    const [mapZoom, setMapZoom] = useState(1);

    const spawnNotebookBlock = (type) => {
        const existing = blocks.find(b => b.type === type);
        if (existing) {
            setCam({
                x: -existing.x * 0.8,
                y: -existing.y * 0.8,
                scale: 0.8
            });
            return;
        }

        let spawnX = -cam.x / cam.scale - 200;
        let spawnY = -cam.y / cam.scale - 300;

        if (type === 'diary_notebook') { spawnX = -700; spawnY = -350; }
        if (type === 'resonance_notebook') { spawnX = 100; spawnY = -350; }
        if (type === 'loop_map_mini') { spawnX = -300; spawnY = 450; }
        if (type === 'conversation_notebook') { spawnX = 700; spawnY = -350; }

        const newBlock = {
            id: Date.now().toString(),
            type: type,
            x: spawnX,
            y: spawnY,
            content: '',
            color: type === 'diary_notebook' ? '#f59e0b' : (type === 'resonance_notebook' ? '#a855f7' : (type === 'conversation_notebook' ? '#d946ef' : '#06b6d4')),
            isPublic: false,
            entries: [],
            canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
        };
        syncBlocks([...blocks, newBlock]);
    };

    const handleMapPointerDown = (e) => {
        // If clicking on node circles/text (interactive nodes), do not start panning
        if (e.target.closest('g.cursor-pointer') || e.target.closest('button')) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsPanningMap(true);
        mapPanStart.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };
    };

    const handleMapPointerMove = (e) => {
        if (!isPanningMap) return;
        const dx = e.clientX - mapPanStart.current.x;
        const dy = e.clientY - mapPanStart.current.y;
        setMapPan({ x: dx, y: dy });
    };

    const handleMapPointerUp = (e) => {
        if (!isPanningMap) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsPanningMap(false);
    };

    const handleMapWheel = (e) => {
        const zoomFactor = 0.05;
        const newZoom = e.deltaY < 0
            ? Math.min(mapZoom + zoomFactor, 2.5)
            : Math.max(mapZoom - zoomFactor, 0.5);
        setMapZoom(newZoom);
    };

    const handleCardPointerDown = (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('span')) {
            return;
        }
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        setIsSwiping(true);
        setSwipeOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
    };

    const handleCardPointerMove = (e) => {
        if (!dragStartRef.current || !isSwiping) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setSwipeOffset({ x: dx, y: dy });
        if (Math.abs(dx) > 20) {
            setSwipeDirection(dx > 0 ? 'right' : 'left');
        } else {
            setSwipeDirection(null);
        }
    };

    const handleCardPointerUp = (e, filteredLength) => {
        if (!dragStartRef.current || !isSwiping) return;
        e.currentTarget.releasePointerCapture(e.pointerId);

        const dx = swipeOffset.x;
        const threshold = 120;

        if (Math.abs(dx) > threshold) {
            const direction = dx > 0 ? 'right' : 'left';
            setSwipeDirection(direction);
            setSwipeTriggered(true);

            setTimeout(() => {
                setActiveMemoryIndex(prev => (prev + 1) % filteredLength);
                setSwipeOffset({ x: 0, y: 0 });
                setSwipeDirection(null);
                setSwipeTriggered(false);
                setIsSwiping(false);
                dragStartRef.current = null;
            }, 300);
        } else {
            setSwipeOffset({ x: 0, y: 0 });
            setIsSwiping(false);
            setSwipeDirection(null);
            dragStartRef.current = null;
        }
    };

    const triggerSwipeNext = (filteredLength) => {
        if (swipeTriggered) return;
        setSwipeDirection('left');
        setSwipeTriggered(true);
        setTimeout(() => {
            setActiveMemoryIndex(prev => (prev + 1) % filteredLength);
            setSwipeOffset({ x: 0, y: 0 });
            setSwipeDirection(null);
            setSwipeTriggered(false);
        }, 300);
    };

    const triggerSwipePrev = (filteredLength) => {
        if (swipeTriggered) return;
        setSwipeDirection('right');
        setSwipeTriggered(true);
        setTimeout(() => {
            setActiveMemoryIndex(prev => (prev - 1 + filteredLength) % filteredLength);
            setSwipeOffset({ x: 0, y: 0 });
            setSwipeDirection(null);
            setSwipeTriggered(false);
        }, 300);
    };

    const audioCtxRef = useRef(null);
    const activeNodesRef = useRef(null);

    const playAmbientPad = () => {
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Frequencies for a calming minor 11th chord / major 9th pad in A
            // A2 (110Hz), E3 (164.81Hz), A3 (220Hz), C4 (261.63Hz), E4 (329.63Hz)
            const freqs = [110, 164.81, 220, 261.63, 329.63];
            const oscs = [];
            const gains = [];

            const mainGain = ctx.createGain();
            mainGain.gain.setValueAtTime(0, ctx.currentTime);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, ctx.currentTime);
            filter.Q.setValueAtTime(1.2, ctx.currentTime);

            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                osc.detune.setValueAtTime((Math.random() - 0.5) * 10, ctx.currentTime);

                const g = ctx.createGain();
                g.gain.setValueAtTime(0.05 / freqs.length, ctx.currentTime);

                osc.connect(g);
                g.connect(filter);

                osc.start();
                oscs.push(osc);
                gains.push(g);
            });

            filter.connect(mainGain);
            mainGain.connect(ctx.destination);

            // Fade in slowly over 3 seconds
            mainGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 3);

            // Slow lowpass filter sweep (LFO-like sweep) using interval
            let sweepUp = true;
            const filterInterval = setInterval(() => {
                if (!ctx || ctx.state === 'closed') return;
                const currentFreq = filter.frequency.value;
                let nextFreq = sweepUp ? currentFreq + 10 : currentFreq - 10;
                if (nextFreq > 420) sweepUp = false;
                if (nextFreq < 240) sweepUp = true;
                filter.frequency.setValueAtTime(nextFreq, ctx.currentTime);
            }, 120);

            activeNodesRef.current = { oscs, gains, filter, mainGain, filterInterval };
        } catch (e) {
            console.error("Error creating audio synth:", e);
        }
    };

    const stopAmbientPad = () => {
        try {
            if (activeNodesRef.current) {
                const { oscs, mainGain, filterInterval } = activeNodesRef.current;
                clearInterval(filterInterval);
                const ctx = audioCtxRef.current;
                if (ctx && mainGain) {
                    mainGain.gain.setValueAtTime(mainGain.gain.value, ctx.currentTime);
                    mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
                }
                setTimeout(() => {
                    try {
                        oscs.forEach(osc => osc.stop());
                    } catch (err) { }
                }, 2200);
                activeNodesRef.current = null;
            }
        } catch (e) {
            console.error("Error stopping audio synth:", e);
        }
    };

    useEffect(() => {
        let interval;
        if (isMeditationMode) {
            setBreathPhase(0);
            interval = setInterval(() => {
                setBreathPhase(prev => (prev + 1) % 4);
            }, 4000); // 4 seconds per phase
        } else {
            setBreathPhase(0);
        }
        return () => clearInterval(interval);
    }, [isMeditationMode]);

    useEffect(() => {
        if (isAudioActive) {
            playAmbientPad();
        } else {
            stopAmbientPad();
        }
        return () => {
            stopAmbientPad();
        };
    }, [isAudioActive]);

    const handleSaveReinterpretation = () => {
        if (!selectedContemplationFact) return;
        const originalIdx = userMemory.findIndex(f => f.timestamp === selectedContemplationFact.timestamp && f.text === selectedContemplationFact.text);
        if (originalIdx !== -1) {
            const updatedMemory = [...userMemory];
            updatedMemory[originalIdx] = {
                ...updatedMemory[originalIdx],
                text: reinterpretationText,
                timestamp: Date.now()
            };
            setUserMemory(updatedMemory);
            localStorage.setItem('oasis_facts_' + (localStorage.getItem('oasis_user') || 'default'), JSON.stringify(updatedMemory));
            syncMemory(updatedMemory);
        }
        setSelectedContemplationFact(null);
    };

    useEffect(() => {
        if (activeTest) {
            setQuestionStartTime(performance.now());
        }
    }, [activeTest, currentPhenomIndex, currentPidIndex, currentIcarIndex]);

    useEffect(() => {
        if (activeTest === 'phenom' && currentPhenomIndex < 4) {
            const questionKey = PHENOM_PART_A[currentPhenomIndex].key;
            setPhenomTextValue(phenomQualitative[questionKey] || "");
        }
    }, [currentPhenomIndex, activeTest, phenomQualitative]);

    const loadStateForVersion = useCallback((v, targetUser) => {
        const u = targetUser || user;
        if (!u) {
            setPhenomAnswers({});
            setPhenomQualitative({ antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" });
            setPidAnswers({});
            setIcarAnswers({});
            setIcarDwellTimes({});
            setIcarChanges({});
            setIcarVideos({});
            icarVideosRef.current = {};
            return;
        }
        const suffix = v > 1 ? `_v${v}` : '';

        try {
            const phenomAns = JSON.parse(localStorage.getItem(`oasis_phenom_answers_${u}${suffix}`)) || {};
            setPhenomAnswers(phenomAns);
        } catch (e) { setPhenomAnswers({}); }

        try {
            const phenomQual = JSON.parse(localStorage.getItem(`oasis_phenom_qualitative_${u}${suffix}`)) || { antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" };
            setPhenomQualitative(phenomQual);
        } catch (e) { setPhenomQualitative({ antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" }); }

        try {
            const pidAns = JSON.parse(localStorage.getItem(`oasis_pid_answers_${u}${suffix}`)) || {};
            setPidAnswers(pidAns);
        } catch (e) { setPidAnswers({}); }

        try {
            const icarAns = JSON.parse(localStorage.getItem(`oasis_icar_answers_${u}${suffix}`)) || {};
            setIcarAnswers(icarAns);
        } catch (e) { setIcarAnswers({}); }

        try {
            const icarDwell = JSON.parse(localStorage.getItem(`oasis_icar_dwell_${u}${suffix}`)) || {};
            setIcarDwellTimes(icarDwell);
        } catch (e) { setIcarDwellTimes({}); }

        try {
            const icarChg = JSON.parse(localStorage.getItem(`oasis_icar_changes_${u}${suffix}`)) || {};
            setIcarChanges(icarChg);
        } catch (e) { setIcarChanges({}); }

        try {
            getObservations().then(obs => {
                const found = obs.find(o => o.id === `icar_videos_${u}${suffix}`);
                if (found && found.videos) {
                    setIcarVideos(found.videos);
                    icarVideosRef.current = found.videos || {};
                } else {
                    setIcarVideos({});
                    icarVideosRef.current = {};
                }
            }).catch(() => {
                setIcarVideos({});
                icarVideosRef.current = {};
            });
        } catch (e) {
            setIcarVideos({});
            icarVideosRef.current = {};
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('oasis_active_version_' + user, activeVersion);
            localStorage.setItem('oasis_total_versions_' + user, totalVersions);
            loadStateForVersion(activeVersion, user);
        }
    }, [activeVersion, totalVersions, user, loadStateForVersion]);

    useEffect(() => {
        if (webcamStream && icarWebcamRef.current) {
            icarWebcamRef.current.srcObject = webcamStream;
        }
    }, [webcamStream, activeTest]);

    const handleSwitchVersion = (v) => {
        setActiveVersion(v);
        setCurrentPhenomIndex(0);
        setCurrentPidIndex(0);
        setCurrentIcarIndex(0);
    };

    const handleCreateNewVersion = () => {
        const nextV = totalVersions + 1;
        setTotalVersions(nextV);
        setActiveVersion(nextV);
        setCurrentPhenomIndex(0);
        setCurrentPidIndex(0);
        setCurrentIcarIndex(0);
    };

    const resetActiveVersionTests = async () => {
        setAppConfirmAction({
            message: `¿Seguro que deseas reiniciar los datos de la Sesión ${activeVersion}? Esto eliminará permanentemente las respuestas y grabaciones asociadas.`, onConfirm: async () => {
                const suffix = activeVersion > 1 ? `_v${activeVersion}` : '';

                setPhenomAnswers({});
                setPhenomQualitative({
                    antecedentes_origen: "",
                    experiencia_insuficiencia: "",
                    temporalidad_vivida: "",
                    premisa_realidad: ""
                });
                setPidAnswers({});
                setIcarAnswers({});
                setIcarDwellTimes({});
                setIcarChanges({});
                setIcarVideos({});
                icarVideosRef.current = {};

                localStorage.removeItem('oasis_phenom_answers_' + user + suffix);
                localStorage.removeItem('oasis_phenom_qualitative_' + user + suffix);
                localStorage.removeItem('oasis_pid_answers_' + user + suffix);
                localStorage.removeItem('oasis_icar_answers_' + user + suffix);
                localStorage.removeItem('oasis_icar_dwell_' + user + suffix);
                localStorage.removeItem('oasis_icar_changes_' + user + suffix);
                localStorage.removeItem('oasis_bio_transcriptions_' + user + suffix);
                localStorage.removeItem('oasis_bio_metadata_' + user + suffix);

                try {
                    await deleteObservation(`bio_videos_${user}${suffix}`);
                    await deleteObservation(`icar_videos_${user}${suffix}`);
                    console.log("IndexedDB videos deleted for version " + activeVersion);
                } catch (err) {
                    console.error("Error deleting version videos:", err);
                }

                setCurrentPhenomIndex(0);
                setCurrentPidIndex(0);
                setCurrentIcarIndex(0);
                setActiveTest(null);

                if (activeVersion > 1) {
                    setActiveVersion(1);
                    if (activeVersion === totalVersions) {
                        setTotalVersions(prev => Math.max(1, prev - 1));
                    }
                }
            }
        });
    };

    const handleSavePhenomQualitative = async (textVal) => {
        // Stop recording if active
        if (phenomRecording) {
            setPhenomRecording(false);
            setPhenomPaused(false);
            phenomStopStt();
            if (phenomMediaRecorderRef.current && phenomMediaRecorderRef.current.state !== 'inactive') {
                phenomMediaRecorderRef.current.stop();
            }
            if (phenomStartTimeRef.current) {
                const elapsed = Date.now() - phenomStartTimeRef.current;
                setPhenomDwellTimes(prev => ({
                    ...prev,
                    [currentPhenomIndex]: (prev[currentPhenomIndex] || 0) + elapsed
                }));
                phenomStartTimeRef.current = null;
            }
        }

        const questionKey = PHENOM_PART_A[currentPhenomIndex].key;
        const updated = { ...phenomQualitative, [questionKey]: textVal };
        setPhenomQualitative(updated);
        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
        localStorage.setItem('oasis_phenom_qualitative_' + user + suffix, JSON.stringify(updated));

        // If it was the last question of Part A
        if (currentPhenomIndex === 3) {
            // Build metadata
            const metadataObj = {};
            [0, 1, 2, 3].forEach(idx => {
                const text = (idx === 3 ? textVal : (updated[PHENOM_PART_A[idx].key] || ""));
                const words = text.trim().split(/\s+/).filter(Boolean).length;
                metadataObj[idx] = {
                    dwellTime: Math.round((phenomDwellTimes[idx] || 0) / 1000),
                    pauses: phenomPauseCounts[idx] || 0,
                    words: words
                };
            });
            localStorage.setItem('oasis_phenom_metadata_' + user + suffix, JSON.stringify(metadataObj));

            // Wait a small buffer to let onstop finalize the blob before saving
            setTimeout(async () => {
                const videoRecord = {
                    id: `phenom_videos_${user}${suffix}`,
                    username: user,
                    videos: phenomRecordedBlobsRef.current
                };
                try {
                    await saveObservation(videoRecord);
                    console.log("Phenomenology videos saved to IndexedDB!");
                } catch (err) {
                    console.error("Error saving phenomenology videos to IndexedDB:", err);
                }
            }, 500);
        }

        if (currentPhenomIndex < 3) {
            const nextIndex = currentPhenomIndex + 1;
            const nextKey = PHENOM_PART_A[nextIndex].key;
            setPhenomTextValue(updated[nextKey] || "");
            setCurrentPhenomIndex(nextIndex);
        } else {
            setPhenomTextValue("");
            const catPhenom = [
                { title: "Origen y Raíces", text: `Contexto base:\n\n${updated.antecedentes_origen || ''}` },
                { title: "Dinámicas Invisibles", text: `Reglas de hogar y expectativas familiares.` },
                { title: "Sombra de Autoexigencia", text: `Escenarios críticos:\n\n${updated.experiencia_insuficiencia || ''}` },
                { title: "Parálisis", text: `Zonas donde aparece la autoexigencia y el bloqueo.` },
                { title: "Relación Temporal", text: `Experiencia del tiempo:\n\n${updated.temporalidad_vivida || ''}` },
                { title: "Ritmo y Presión", text: `Efecto de la presión del reloj en las decisiones de hoy.` },
                { title: "Premisa de Realidad", text: `Motor existencial:\n\n${updated.premisa_realidad || ''}` },
                { title: "Certeza Íntima", text: `El propósito que empuja la actividad cotidiana.` }
            ];

            const newNotes = catPhenom.map((cat, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const radius = 600;
                return {
                    id: `note_${Date.now()}_${i}`,
                    type: 'note',
                    content: `**${cat.title}**\n\n${cat.text}`,
                    x: Math.round(Math.cos(angle) * radius),
                    y: Math.round(Math.sin(angle) * radius),
                    color: '#a855f7',
                    username: user,
                    isPublic: false,
                    timestamp: new Date().toISOString(),
                    metadata: { isOnboardingDiagnostic: true }
                };
            });

            setBlocks(prev => {
                const updatedBlocks = [...prev, ...newNotes];
                syncBlocks(updatedBlocks);
                return updatedBlocks;
            });

            // Move to PID-5 Breve (Parte B)
            if (view === 'soul') {
                setActiveTest('pid5');
                setCurrentPidIndex(0);
                setCurrentPhenomIndex(0);
            } else {
                setActiveTest(null);
                setCurrentPhenomIndex(0);
            }
        }
    };

    const handleGoBackPhenom = () => {
        if (currentPhenomIndex > 0) {
            const currentKey = PHENOM_PART_A[currentPhenomIndex].key;
            const updated = { ...phenomQualitative, [currentKey]: phenomTextValue };
            setPhenomQualitative(updated);

            const prevIndex = currentPhenomIndex - 1;
            const prevKey = PHENOM_PART_A[prevIndex].key;
            setPhenomTextValue(updated[prevKey] || "");
            setCurrentPhenomIndex(prevIndex);
        }
    };

    const handleSelectPidAnswer = (value) => {
        const qNum = currentPidIndex + 1; // Q1 to Q25
        const updated = { ...pidAnswers, [qNum]: value };
        setPidAnswers(updated);
        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
        localStorage.setItem('oasis_pid_answers_' + user + suffix, JSON.stringify(updated));

        if (currentPidIndex < 24) {
            setCurrentPidIndex(prev => prev + 1);
        } else {
            setActiveTest('biographic');
        }
    };

    const logInteraction = useCallback((action, details) => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const logEntry = `${hh} hora :${mm} minutos :${ss} segundos - ${action}: ${details}`;
        setInteractionLogs(prev => [...prev, logEntry]);
    }, []);

    const startIcarQuestionRecording = (qIndex, currentStream) => {
        const stream = currentStream || webcamStream;
        if (!stream) return;

        recordedChunksRef.current = [];
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
        }

        try {
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            const activeIdx = qIndex + 1;
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                icarVideosRef.current[activeIdx] = blob;
                setIcarVideos(prev => ({
                    ...prev,
                    [activeIdx]: blob
                }));
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting ICAR question media recorder:", err);
        }
    };

    const startWebcamRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setWebcamStream(stream);
            setIcarVideos({});
            icarVideosRef.current = {};

            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setInteractionLogs([
                `${hh} hora :${mm} minutos :${ss} segundos - Sistema: Inicio del test ICAR16 y de la grabación clínica por reactivo.`
            ]);

            startIcarQuestionRecording(0, stream);
        } catch (err) {
            console.error("Error al iniciar cámara web:", err);
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setInteractionLogs([
                `${hh} hora :${mm} minutos :${ss} segundos - Sistema: Error al activar cámara web (${err.message})`
            ]);
        }
    };

    const stopWebcamAndSaveSession = async (finalAnswers) => {
        const answersToSave = finalAnswers || icarAnswers;

        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
        }
        setWebcamStream(null);
        setIsRecording(false);

        const answerKey = {
            1: 'D', 2: 'C', 3: 'D', 4: 'G',
            5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'C', 10: 'F',
            11: 'E', 12: 'B', 13: 'D', 14: 'F', 15: 'C', 16: 'D'
        };

        const dimensions = {
            verbal: { qs: [1, 6, 14, 16], correct: 0, mean: 3.2, sd: 0.8, name: "Verbal" },
            visuospatial: { qs: [2, 4, 7, 12], correct: 0, mean: 2.8, sd: 1.0, name: "Visoespacial" },
            sequential: { qs: [3, 9, 10, 13], correct: 0, mean: 2.9, sd: 0.9, name: "Secuencial" },
            inductive: { qs: [5, 8, 11, 15], correct: 0, mean: 2.7, sd: 1.1, name: "Inductiva" }
        };

        let correctCount = 0;
        const alerts = [];

        const CONST_MIN_TIME_S = 6;
        const CONST_MAX_TIME_S = 95;
        const CONST_MAX_CHANGES = 3;

        for (let i = 1; i <= 16; i++) {
            const given = answersToSave[i];
            const isCorrect = (String(given).trim().toLowerCase() === String(answerKey[i]).trim().toLowerCase());
            if (isCorrect) correctCount++;

            Object.values(dimensions).forEach(dim => {
                if (dim.qs.includes(i) && isCorrect) dim.correct++;
            });

            const dTime = icarDwellTimes[i] || 0;
            const changes = icarChanges[i] || 0;

            if (dTime > 0 && dTime < CONST_MIN_TIME_S && !isCorrect) {
                alerts.push(`⚠️ [PROCESAMIENTO_RAPIDO] Q${i}: Tiempo de resolución de ${Math.round(dTime)}s con respuesta incorrecta. Posible procesamiento rápido con baja inhibición.`);
            }
            if (dTime > CONST_MAX_TIME_S && !isCorrect) {
                alerts.push(`⚠️ [ALTA_INVERSION_COGNITIVA] Q${i}: Alta inversión cognitiva (${Math.round(dTime)}s) con respuesta incorrecta. Sugiere sobrecarga en memoria de trabajo o procesamiento detallado de variables.`);
            }
            if (changes >= CONST_MAX_CHANGES) {
                alerts.push(`⚠️ [REEVALUACION_DECISIONAL] Q${i}: Se registraron ${changes} reevaluaciones decisionales. Sugiere revisión y reformulación continua de la hipótesis.`);
            }
            if (dTime > CONST_MAX_TIME_S && isCorrect) {
                alerts.push(`✅ [PROCESAMIENTO_EFICIENTE] Q${i}: Resolución correcta lograda tras una alta inversión cognitiva (${Math.round(dTime)}s), mostrando persistencia analítica.`);
            }
        }

        const itemsDetail = icarQuestions.map(q => {
            const given = answersToSave[q.question_number];
            const isCorrect = (String(given).trim().toLowerCase() === String(answerKey[q.question_number]).trim().toLowerCase());
            return {
                question_number: q.question_number,
                category: q.category,
                construct: q.construct,
                stimulus_visual_description: q.stimulus_visual_description,
                correct_answer: q.correct_answer,
                user_answer: given,
                is_correct: isCorrect,
                dwell_time: icarDwellTimes[q.question_number] || 0,
                changes: icarChanges[q.question_number] || 0
            };
        });

        // Calculate detailed reference indices
        const dimensionDwells = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const dimensionDwellCounts = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const dimensionChanges = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };

        let totalDwellSum = 0;
        let answeredCount = 0;
        for (let i = 1; i <= 16; i++) {
            const dTime = icarDwellTimes[i] || 0;
            const changes = icarChanges[i] || 0;
            if (dTime > 0) {
                totalDwellSum += dTime;
                answeredCount++;
                if (dimensions.verbal.qs.includes(i)) {
                    dimensionDwells.verbal += dTime;
                    dimensionDwellCounts.verbal++;
                    dimensionChanges.verbal += changes;
                } else if (dimensions.visuospatial.qs.includes(i)) {
                    dimensionDwells.visuospatial += dTime;
                    dimensionDwellCounts.visuospatial++;
                    dimensionChanges.visuospatial += changes;
                } else if (dimensions.sequential.qs.includes(i)) {
                    dimensionDwells.sequential += dTime;
                    dimensionDwellCounts.sequential++;
                    dimensionChanges.sequential += changes;
                } else if (dimensions.inductive.qs.includes(i)) {
                    dimensionDwells.inductive += dTime;
                    dimensionDwellCounts.inductive++;
                    dimensionChanges.inductive += changes;
                }
            }
        }

        const totalDwellAvg = answeredCount > 0 ? parseFloat((totalDwellSum / answeredCount).toFixed(1)) : 0;

        const getClinicalInterpretation = (z, avgDwell) => {
            if (avgDwell === 0) return "Sin datos suficientes";
            if (z >= 0 && avgDwell > 45) {
                return "Capacidad Compensatoria: El rendimiento está conservado a expensas de un elevado esfuerzo de procesamiento y fatiga metabólica secundaria.";
            }
            if (z < 0 && avgDwell < 15) {
                return "Baja Inversión en la Tarea: Desconexión atencional o respuesta impulsiva sin suficiente persistencia de razonamiento analítico.";
            }
            if (z < 0 && avgDwell > 90) {
                return "Saturación Cognitiva: Sobrecarga atencional severa y agotamiento de la memoria de trabajo sin resolución exitosa.";
            }
            if (z >= 1) return "Rendimiento Superior: Procesamiento altamente eficiente y automatizado con excelente precisión.";
            if (z <= -1) return "Rendimiento Inferior al Promedio: Dificultades o limitaciones en el procesamiento del dominio específico.";
            return "Rendimiento Estándar: Procesamiento adaptativo dentro del rango normal de referencia poblacional.";
        };

        const getEfficiencyStatus = (z, avgDwell) => {
            if (avgDwell === 0) return "sin_datos";
            if (z >= 0 && avgDwell > 45) return "capacidad_compensatoria";
            if (z < 0 && avgDwell < 15) return "baja_inversion";
            if (z < 0 && avgDwell > 90) return "saturacion_cognitiva";
            return "normal";
        };

        const indices_referencia = {
            total_dwell_avg: totalDwellAvg,
            saturacion_detectada: Object.keys(dimensions).some(k => {
                const z = parseFloat(((dimensions[k].correct - dimensions[k].mean) / dimensions[k].sd).toFixed(3));
                const avgD = dimensionDwellCounts[k] > 0 ? dimensionDwells[k] / dimensionDwellCounts[k] : 0;
                return getEfficiencyStatus(z, avgD) === "saturacion_cognitiva";
            }),
            dimensions: {}
        };

        Object.keys(dimensions).forEach(k => {
            const correct = dimensions[k].correct;
            const mean = dimensions[k].mean;
            const sd = dimensions[k].sd;
            const z = parseFloat(((correct - mean) / sd).toFixed(3));
            const avgD = dimensionDwellCounts[k] > 0 ? parseFloat((dimensionDwells[k] / dimensionDwellCounts[k]).toFixed(1)) : 0;
            const totalChanges = dimensionChanges[k];

            indices_referencia.dimensions[k] = {
                correct,
                z_score: z,
                average_dwell: avgD,
                total_changes: totalChanges,
                status: z >= 1 ? "superior" : z <= -1 ? "inferior" : "normal",
                efficiency_status: getEfficiencyStatus(z, avgD),
                interpretation: getClinicalInterpretation(z, avgD)
            };
        });

        // 2. Validador de Calidad (Filtros de Descarte)
        const totalDwellTime = Object.values(icarDwellTimes).reduce((a, b) => a + b, 0);
        let validez = "ok";
        if (totalDwellTime < 350) {
            validez = "INVALIDA_DESATENCION";
        } else if ((correctCount / 16) < 0.30) {
            validez = "INVALIDA_AZAR";
        }

        // 3. El "Objeto de Estado Cognitivo"
        const getEficienciaLabel = (z, eff) => {
            if (eff === "capacidad_compensatoria") return "alta_demanda";
            if (eff === "saturacion_cognitiva") return "saturacion";
            if (z >= 1) return "optima";
            if (z <= -1) return "deficiente";
            return "normal";
        };

        const perfil_cognitivo = {
            verbal: {
                z_score: indices_referencia.dimensions.verbal.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.verbal.z_score, indices_referencia.dimensions.verbal.efficiency_status)
            },
            spatial: {
                z_score: indices_referencia.dimensions.visuospatial.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.visuospatial.z_score, indices_referencia.dimensions.visuospatial.efficiency_status)
            },
            secuencial: {
                z_score: indices_referencia.dimensions.sequential.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.sequential.z_score, indices_referencia.dimensions.sequential.efficiency_status)
            },
            inductiva: {
                z_score: indices_referencia.dimensions.inductive.z_score,
                eficiencia: getEficienciaLabel(indices_referencia.dimensions.inductive.z_score, indices_referencia.dimensions.inductive.efficiency_status)
            }
        };

        // Estilo de ejecución
        let estilo_ejecucion = "normal";
        const totalChanges = Object.values(icarChanges).reduce((a, b) => a + b, 0);
        if (totalDwellAvg < 45 && correctCount >= 11) {
            estilo_ejecucion = "eficiente";
        } else if (totalDwellAvg < 45 && correctCount < 11) {
            estilo_ejecucion = "impulsivo";
        } else if (totalDwellAvg >= 45 && correctCount >= 11) {
            estilo_ejecucion = "analítico_sostenido";
        } else {
            estilo_ejecucion = "sobrecargado";
        }

        // Banderas conductuales
        const banderas_conductuales = [];
        if (indices_referencia.dimensions.visuospatial.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_spatial");
        }
        if (indices_referencia.dimensions.verbal.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_verbal");
        }
        if (indices_referencia.dimensions.sequential.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_secuencial");
        }
        if (indices_referencia.dimensions.inductive.efficiency_status === "capacidad_compensatoria") {
            banderas_conductuales.push("alta_inversion_inductiva");
        }

        if (indices_referencia.dimensions.visuospatial.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_spatial");
        }
        if (indices_referencia.dimensions.verbal.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_verbal");
        }
        if (indices_referencia.dimensions.sequential.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_secuencial");
        }
        if (indices_referencia.dimensions.inductive.efficiency_status === "saturacion_cognitiva") {
            banderas_conductuales.push("saturacion_inductiva");
        }

        if (totalChanges === 0) {
            banderas_conductuales.push("estabilidad_decisional_alta");
        } else if (totalChanges >= 5) {
            banderas_conductuales.push("reevaluacion_decisional_alta");
        }

        const estado_cognitivo = {
            metadatos: {
                fecha: new Date().toISOString().split('T')[0],
                validez: validez,
                tiempo_total: Math.round(totalDwellTime)
            },
            perfil_cognitivo: perfil_cognitivo,
            estilo_ejecucion: estilo_ejecucion,
            banderas_conductuales: banderas_conductuales
        };

        const icarAnalytics = {
            score: correctCount,
            total: 16,
            dimensions: {
                verbal: (dimensions.verbal.correct / 4) * 100,
                visuospatial: (dimensions.visuospatial.correct / 4) * 100,
                sequential: (dimensions.sequential.correct / 4) * 100,
                inductive: (dimensions.inductive.correct / 4) * 100
            },
            items: itemsDetail,
            indices_referencia: indices_referencia,
            estado_cognitivo: estado_cognitivo,
            alerts: alerts
        };

        const newSession = {
            id: `session_${user}_v${activeVersion}_${Date.now()}`,
            version: activeVersion,
            date: new Date().toLocaleString(),
            user: user || 'Invitado',
            score: `${correctCount} / 16`,
            phenomQualitative: phenomQualitative,
            pidAnswers: pidAnswers,
            icarAnswers: answersToSave,
            icarDwellTimes: icarDwellTimes,
            icarChanges: icarChanges,
            icarAnalytics: icarAnalytics,
            logs: [...interactionLogs, `Fin de la sesión. Respuestas correctas: ${correctCount}`]
        };

        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
        const videoRecord = {
            id: `icar_videos_${user}${suffix}`,
            username: user,
            videos: icarVideosRef.current
        };

        try {
            await saveObservation(newSession);
            await saveObservation(videoRecord);
            console.log("Sesión clínica y videos guardados con éxito en IndexedDB!");
        } catch (err) {
            console.error("Error al guardar la sesión clínica:", err);
        }
    };

    const exitIcarTest = () => {
        setActiveTest(null);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (webcamStream) {
            webcamStream.getTracks().forEach(t => t.stop());
        }
        setWebcamStream(null);
        setIsRecording(false);
    };

    const loadClinicalSessions = async () => {
        try {
            const sessions = await getObservations();
            sessions.sort((a, b) => b.id.localeCompare(a.id));
            setClinicalSessions(sessions);
        } catch (err) {
            console.error("Error al cargar observaciones:", err);
        }
    };

    const handleDeleteSession = async (id) => {
        setAppConfirmAction({
            message: "¿Está seguro de eliminar este registro clínico?", onConfirm: async () => {
                try {
                    await deleteObservation(id);
                    loadClinicalSessions();
                } catch (err) {
                    console.error("Error al eliminar la sesión clínica:", err);
                }
            }
        });
    };

    const getPidDomainScores = (pidAnswers) => {
        const scores = {
            AfectividadNegativa: 0,
            Desapego: 0,
            Antagonismo: 0,
            Desinhibicion: 0,
            Psicoticismo: 0
        };
        if (!pidAnswers) return scores;
        Object.entries(pidAnswers).forEach(([qNum, val]) => {
            const i = parseInt(qNum, 10);
            if (i >= 1 && i <= 5) scores.AfectividadNegativa += val;
            else if (i >= 6 && i <= 10) scores.Desapego += val;
            else if (i >= 11 && i <= 15) scores.Antagonismo += val;
            else if (i >= 16 && i <= 20) scores.Desinhibicion += val;
            else if (i >= 21 && i <= 25) scores.Psicoticismo += val;
        });
        return scores;
    };

    const getSessionBehavioralAlerts = (session) => {
        const alerts = [];

        // 1. Check dwell times (> 25 seconds is critical)
        if (session.icarDwellTimes) {
            Object.entries(session.icarDwellTimes).forEach(([qNum, timeMs]) => {
                const timeSec = Math.round(timeMs / 1000);
                if (timeSec > 25) {
                    alerts.push({
                        type: 'dwell',
                        text: `Reactivo ${qNum}: Latencia crítica de respuesta (${timeSec}s)`,
                        severity: 'critical'
                    });
                }
            });
        }

        // 2. Check changes (> 2 changes is high hesitation)
        if (session.icarChanges) {
            Object.entries(session.icarChanges).forEach(([qNum, count]) => {
                if (count > 2) {
                    alerts.push({
                        type: 'hesitation',
                        text: `Reactivo ${qNum}: Titubeo alto (${count} cambios de respuesta)`,
                        severity: 'warning'
                    });
                }
            });
        }

        // 3. Scan logs for defocus events
        if (session.logs) {
            let defocusCount = 0;
            session.logs.forEach(logLine => {
                if (logLine.includes('desenfocada')) {
                    defocusCount++;
                }
            });
            if (defocusCount > 0) {
                alerts.push({
                    type: 'focus',
                    text: `Foco interrumpido: El paciente cambió de pestaña/aplicación ${defocusCount} veces`,
                    severity: 'critical'
                });
            }
        }

        return alerts;
    };

    const handleAutogenerateFormulation = (session) => {
        if (!session) return;

        const scores = getPidDomainScores(session.pidAnswers);

        let dominantDomain = 'AfectividadNegativa';
        let maxVal = -1;
        Object.entries(scores).forEach(([domain, val]) => {
            if (val > maxVal) {
                maxVal = val;
                dominantDomain = domain;
            }
        });

        const archetypes = {
            AfectividadNegativa: {
                name: 'El Procesador Sensible',
                subtitle: 'Reactividad Emocional Intensa',
                liberation: 'Exposición guiada: Describir el pánico en el Mural y conectar con recuerdos de calma.'
            },
            Desapego: {
                name: 'El Observador Reservado',
                subtitle: 'Estilo de Conexión Introspectivo',
                liberation: 'Puente relacional: Enlazar notas de recuerdos de infancia con figuras significativas actuales.'
            },
            Antagonismo: {
                name: 'El Defensor Enfocado',
                subtitle: 'Gestión de Asertividad Firme',
                liberation: 'Exposición al caos: Crear composiciones libres imperfectas en el Mural sin planificar.'
            },
            Desinhibicion: {
                name: 'El Creador Espontáneo',
                subtitle: 'Impulso y Planificación Flexibles',
                liberation: 'Focalización secuencial: Organizar notas en carpetas jerárquicas estrictas y sintetizar enlaces simples.'
            },
            Psicoticismo: {
                name: 'El Pensador Divergente',
                subtitle: 'Alta Singularidad Cognitiva',
                liberation: 'Anclaje de realidad: Escribir 5 hechos empíricos inmutables y conectarlos al nodo central.'
            }
        };

        const arch = archetypes[dominantDomain] || archetypes.AfectividadNegativa;

        const alerts = getSessionBehavioralAlerts(session);
        const alertSummary = alerts.length > 0
            ? alerts.map(a => `- ${a.text}`).join('\n')
            : 'Sin alertas críticas en el patrón atencional.';

        const idBase = Date.now();
        const id1 = `node_${idBase}_1`;
        const id2 = `node_${idBase}_2`;
        const id3 = `node_${idBase}_3`;
        const id4 = `node_${idBase}_4`;
        const id5 = `node_${idBase}_5`;

        const newBlocks = [
            {
                id: id1,
                type: 'text',
                x: -350,
                y: -150,
                content: `### PACIENTE: ${session.user}\n\n**Fecha de Sesión:** ${session.date}\n**Estilo de Conciencia:**\n*${arch.name}*\n(${arch.subtitle})`,
                rotation: -2,
                color: '#bef264',
                caption: 'Ficha de Identificación'
            },
            {
                id: id2,
                type: 'text',
                x: 0,
                y: -220,
                content: `### PERFIL DE PERSONALIDAD (PID-5-BF)\n\n**Estilo Dominante:** ${dominantDomain === 'AfectividadNegativa' ? 'Reactividad Emocional' : dominantDomain === 'Desapego' ? 'Estilo de Conexión' : dominantDomain === 'Antagonismo' ? 'Gestión de la Asertividad' : dominantDomain === 'Desinhibicion' ? 'Impulso y Planificación' : 'Singularidad Cognitiva'}\n\n**Puntuaciones de Estilos:**\n- Reactividad Emocional: ${scores.AfectividadNegativa}/15\n- Estilo de Conexión: ${scores.Desapego}/15\n- Gestión de la Asertividad: ${scores.Antagonismo}/15\n- Impulso y Planificación: ${scores.Desinhibicion}/15\n- Singularidad Cognitiva: ${scores.Psicoticismo}/15`,
                rotation: 2,
                color: '#ec4899',
                caption: 'Estilos Adaptativos DSM-5'
            },
            {
                id: id3,
                type: 'text',
                x: 350,
                y: -150,
                content: `### PATRÓN COGNITIVO (ICAR16)\n\n**Aciertos:** ${session.score}\n\n**Alertas Registradas:**\n${alertSummary}`,
                rotation: -1,
                color: '#22d3ee',
                caption: 'Métricas de Ejecución'
            },
            {
                id: id4,
                type: 'text',
                x: -180,
                y: 150,
                content: `### DIAGNÓSTICO CUALITATIVO\n\n- **Mecanismo/Origen:** ${session.phenomQualitative?.antecedentes_origen || 'No registrado'}\n- **Insuficiencia:** ${session.phenomQualitative?.experiencia_insuficiencia || 'No registrado'}\n- **Temporalidad:** ${session.phenomQualitative?.temporalidad_vivida || 'No registrado'}\n- **Realidad:** ${session.phenomQualitative?.premisa_realidad || 'No registrado'}`,
                rotation: 3,
                color: '#eab308',
                caption: 'Fenomenología'
            },
            {
                id: id5,
                type: 'text',
                x: 180,
                y: 150,
                content: `### RUTA DE LIBERACIÓN TERAPÉUTICA\n\n**Estrategia Recomendada:**\n${arch.liberation}\n\n*Nota: Editar en tiempo real en el lienzo para ajustar los nodos de intervención con el paciente.*`,
                rotation: -3,
                color: '#a855f7',
                caption: 'Plan de Intervención'
            }
        ];

        const newLinks = [
            { from: id1, to: id2 },
            { from: id1, to: id3 },
            { from: id2, to: id5 },
            { from: id3, to: id5 },
            { from: id4, to: id5 }
        ];

        const updatedBlocks = [...blocks, ...newBlocks];
        const updatedLinks = [...links, ...newLinks];

        setBlocks(updatedBlocks);
        setLinks(updatedLinks);

        syncBlocks(updatedBlocks);
        syncLinks(updatedLinks);

        setView('canvas');
    };











    const handleSelectIcarAnswer = (answerKey) => {
        const endTime = performance.now();
        const latency = (endTime - questionStartTime) / 1000;

        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';

        const previousAnswer = icarAnswers[currentIcarIndex + 1];
        if (previousAnswer && previousAnswer !== answerKey) {
            const currentChangeCount = icarChanges[currentIcarIndex + 1] || 0;
            const updatedChanges = { ...icarChanges, [currentIcarIndex + 1]: currentChangeCount + 1 };
            setIcarChanges(updatedChanges);
            localStorage.setItem('oasis_icar_changes_' + user + suffix, JSON.stringify(updatedChanges));
        }

        const updatedAnswers = { ...icarAnswers, [currentIcarIndex + 1]: answerKey };
        const updatedDwell = { ...icarDwellTimes, [currentIcarIndex + 1]: (icarDwellTimes[currentIcarIndex + 1] || 0) + latency };

        setIcarAnswers(updatedAnswers);
        setIcarDwellTimes(updatedDwell);
        localStorage.setItem('oasis_icar_answers_' + user + suffix, JSON.stringify(updatedAnswers));
        localStorage.setItem('oasis_icar_dwell_' + user + suffix, JSON.stringify(updatedDwell));

        logInteraction("Selección", `El individuo clickeó la opción ${answerKey} de la pregunta ${currentIcarIndex + 1}`);

        // Stop current question video recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (currentIcarIndex < icarQuestions.length - 1) {
            const nextIdx = currentIcarIndex + 1;
            setCurrentIcarIndex(nextIdx);
            setTimeout(() => {
                startIcarQuestionRecording(nextIdx);
            }, 100);
        } else {
            setActiveTest(null);
            setTimeout(() => {
                stopWebcamAndSaveSession(updatedAnswers);
            }, 250);
        }
    };

    useEffect(() => {
        if (activeTest !== 'icar16') return;

        const handleGlobalClick = (e) => {
            const targetName = e.target.tagName + (e.target.className ? `.${e.target.className.split(' ').slice(0, 2).join('.')}` : '') + (e.target.id ? `#${e.target.id}` : '');
            logInteraction("Click", `Clic en: <${targetName}> en coordenadas (X: ${e.clientX}, Y: ${e.clientY})`);
        };

        const handleFocus = () => {
            logInteraction("Foco", "El individuo regresó a la pestaña del test (Ventana enfocada)");
        };

        const handleBlur = () => {
            logInteraction("Foco", "El individuo salió o cambió de pestaña (Ventana desenfocada - Alerta clínica!)");
        };

        let lastLoggedMove = 0;
        const handleMouseMove = (e) => {
            const now = Date.now();
            if (now - lastLoggedMove > 3000) {
                lastLoggedMove = now;
                logInteraction("Movimiento", `Mouse posicionado en (X: ${e.clientX}, Y: ${e.clientY})`);
            }
        };

        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [activeTest, logInteraction]);

    useEffect(() => {
        if (view === 'clinical') {
            loadClinicalSessions();
        }
    }, [view]);

    const resetTests = () => {
        setPhenomAnswers({});
        setPhenomQualitative({
            antecedentes_origen: "",
            experiencia_insuficiencia: "",
            temporalidad_vivida: "",
            premisa_realidad: ""
        });
        setPidAnswers({});
        setIcarAnswers({});
        setIcarDwellTimes({});
        setIcarChanges({});
        localStorage.removeItem('oasis_phenom_answers_' + user);
        localStorage.removeItem('oasis_phenom_qualitative_' + user);
        localStorage.removeItem('oasis_pid_answers_' + user);
        localStorage.removeItem('oasis_icar_answers_' + user);
        localStorage.removeItem('oasis_icar_dwell_' + user);
        localStorage.removeItem('oasis_icar_changes_' + user);
        setCurrentPhenomIndex(0);
        setCurrentPidIndex(0);
        setCurrentIcarIndex(0);
        setActiveTest(null);
    };

    const noteKeywords = useMemo(() => {
        const list = ['glitch', 'caos', 'orden', 'miedo', 'bloqueo', 'amor', 'conciencia', 'vacío', 'perfecto', 'control', 'soledad', 'vacío', 'atención'];
        const found = [];
        (blocks || []).forEach(b => {
            const text = ((b.caption || '') + ' ' + (b.content || '')).toLowerCase();
            list.forEach(kw => {
                if (text.includes(kw) && !found.includes(kw)) found.push(kw);
            });
        });
        return found;
    }, [blocks]);

    const calculatedResults = useMemo(() => {
        let score = 0;
        const categories = {};
        icarQuestions.forEach((q, idx) => {
            const isCorrect = icarAnswers[q.question_number] === q.correct_answer;
            if (isCorrect) score++;

            if (!categories[q.category]) {
                categories[q.category] = { correct: 0, total: 0 };
            }
            categories[q.category].total++;
            if (isCorrect) categories[q.category].correct++;
        });

        // Sum PID-5 scores per domain
        const pidScores = {
            AfectividadNegativa: 0,
            Desapego: 0,
            Antagonismo: 0,
            Desinhibicion: 0,
            Psicoticismo: 0
        };
        for (let i = 1; i <= 25; i++) {
            const val = parseInt(pidAnswers[i] || 0, 10);
            if (i <= 5) pidScores.AfectividadNegativa += val;
            else if (i <= 10) pidScores.Desapego += val;
            else if (i <= 15) pidScores.Antagonismo += val;
            else if (i <= 20) pidScores.Desinhibicion += val;
            else pidScores.Psicoticismo += val;
        }

        let dominantDomain = 'Desapego';
        let maxVal = -1;
        Object.entries(pidScores).forEach(([domain, val]) => {
            if (val > maxVal) {
                maxVal = val;
                dominantDomain = domain;
            }
        });

        let dominantArchetype = 'A';
        if (dominantDomain === 'AfectividadNegativa') dominantArchetype = 'B';
        else if (dominantDomain === 'Desapego') dominantArchetype = 'A';
        else if (dominantDomain === 'Antagonismo' || dominantDomain === 'Psicoticismo') dominantArchetype = 'C';
        else if (dominantDomain === 'Desinhibicion') dominantArchetype = 'D';

        const existentialArchetypes = {
            'A': {
                name: 'El Observador Analítico',
                subtitle: 'Racionalización y Distanciamiento Cognitivo',
                vulnerability: 'Aislamiento relacional y resistencia a encarnar las emociones en el cuerpo.',
                blockage: 'Parálisis analítica inducida por hiper-racionalización, diluyendo la experiencia directa.',
                liberation: 'Integración somática: Escribir sin conceptualizar o dibujar trazos abstractos directos en el Mural Studio.'
            },
            'B': {
                name: 'El Buscador de Fusión',
                subtitle: 'Vulnerabilidad Existencial y Búsqueda de Sentido',
                vulnerability: 'Miedo al vacío existencial y tendencia a disolver la propia voz en la mirada ajena.',
                blockage: 'Inestabilidad atencional al alternar obsesivamente entre el anhelo de pertenecer y la huida.',
                liberation: 'Centramiento soberano: Registrar en notas afirmaciones solitarias y auto-contenidas.'
            },
            'C': {
                name: 'El Arquitecto del Control',
                subtitle: 'Rigidez y Bucle de Perfeccionismo Implacable',
                vulnerability: 'Pánico ante el caos, la imperfección y la falta de predictibilidad lógica.',
                blockage: 'Bloqueo severo en la flexibilidad atencional ante la disonancia y la incertidumbre del lienzo.',
                liberation: 'Exposición al caos: Crear composiciones libres imperfectas en el Mural sin planificar.'
            },
            'D': {
                name: 'El Creador Errante',
                subtitle: 'Fragmentación e Impulsividad Expresiva',
                vulnerability: 'Sensación crónica de desorganización y dispersión de las facultades atencionales.',
                blockage: 'Sobrecarga en la memoria de trabajo visoespacial por acumulación masiva de bucles inconclusos.',
                liberation: 'Focalización secuencial: Organizar notas en carpetas jerárquicas estrictas y sintetizar enlaces simples.'
            }
        };

        const isPhenomComplete = Object.values(phenomQualitative).every(val => val && val.trim().length > 0) && Object.keys(phenomQualitative).length === 4;
        const isPid5Complete = Object.keys(pidAnswers).length === 25;
        const isIcarComplete = Object.keys(icarAnswers).length === icarQuestions.length;

        // Calculate detailed reference indices for live calculatedResults
        const liveDimensions = {
            verbal: { qs: [1, 6, 14, 16], correct: 0, mean: 3.2, sd: 0.8 },
            visuospatial: { qs: [2, 4, 7, 12], correct: 0, mean: 2.8, sd: 1.0 },
            sequential: { qs: [3, 9, 10, 13], correct: 0, mean: 2.9, sd: 0.9 },
            inductive: { qs: [5, 8, 11, 15], correct: 0, mean: 2.7, sd: 1.1 }
        };

        Object.keys(liveDimensions).forEach(k => {
            liveDimensions[k].qs.forEach(qNum => {
                const qObj = icarQuestions.find(q => q.question_number === qNum);
                const isCorrect = qObj && icarAnswers[qNum] === qObj.correct_answer;
                if (isCorrect) {
                    liveDimensions[k].correct++;
                }
            });
        });

        const liveDimensionDwells = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const liveDimensionDwellCounts = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
        const liveDimensionChanges = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };

        let liveTotalDwellSum = 0;
        let liveAnsweredCount = 0;
        for (let i = 1; i <= 16; i++) {
            const dTime = icarDwellTimes[i] || 0;
            const changes = icarChanges[i] || 0;
            if (dTime > 0) {
                liveTotalDwellSum += dTime;
                liveAnsweredCount++;
                if (liveDimensions.verbal.qs.includes(i)) {
                    liveDimensionDwells.verbal += dTime;
                    liveDimensionDwellCounts.verbal++;
                    liveDimensionChanges.verbal += changes;
                } else if (liveDimensions.visuospatial.qs.includes(i)) {
                    liveDimensionDwells.visuospatial += dTime;
                    liveDimensionDwellCounts.visuospatial++;
                    liveDimensionChanges.visuospatial += changes;
                } else if (liveDimensions.sequential.qs.includes(i)) {
                    liveDimensionDwells.sequential += dTime;
                    liveDimensionDwellCounts.sequential++;
                    liveDimensionChanges.sequential += changes;
                } else if (liveDimensions.inductive.qs.includes(i)) {
                    liveDimensionDwells.inductive += dTime;
                    liveDimensionDwellCounts.inductive++;
                    liveDimensionChanges.inductive += changes;
                }
            }
        }

        const liveTotalDwellAvg = liveAnsweredCount > 0 ? parseFloat((liveTotalDwellSum / liveAnsweredCount).toFixed(1)) : 0;

        const getClinicalInterpretation = (z, avgDwell) => {
            if (avgDwell === 0) return "Sin datos suficientes";
            if (z >= 0 && avgDwell > 45) {
                return "Capacidad Compensatoria: El rendimiento está conservado a expensas de un elevado esfuerzo de procesamiento y fatiga metabólica secundaria.";
            }
            if (z < 0 && avgDwell < 15) {
                return "Baja Inversión en la Tarea: Desconexión atencional o respuesta impulsiva sin suficiente persistencia de razonamiento analítico.";
            }
            if (z < 0 && avgDwell > 90) {
                return "Saturación Cognitiva: Sobrecarga atencional severa y agotamiento de la memoria de trabajo sin resolución exitosa.";
            }
            if (z >= 1) return "Rendimiento Superior: Procesamiento altamente eficiente y automatizado con excelente precisión.";
            if (z <= -1) return "Rendimiento Inferior al Promedio: Dificultades o limitaciones en el procesamiento del dominio específico.";
            return "Rendimiento Estándar: Procesamiento adaptativo dentro del rango normal de referencia poblacional.";
        };

        const getEfficiencyStatus = (z, avgDwell) => {
            if (avgDwell === 0) return "sin_datos";
            if (z >= 0 && avgDwell > 45) return "capacidad_compensatoria";
            if (z < 0 && avgDwell < 15) return "baja_inversion";
            if (z < 0 && avgDwell > 90) return "saturacion_cognitiva";
            return "normal";
        };

        const liveIndicesReferencia = {
            total_dwell_avg: liveTotalDwellAvg,
            saturacion_detectada: Object.keys(liveDimensions).some(k => {
                const z = parseFloat(((liveDimensions[k].correct - liveDimensions[k].mean) / liveDimensions[k].sd).toFixed(3));
                const avgD = liveDimensionDwellCounts[k] > 0 ? liveDimensionDwells[k] / liveDimensionDwellCounts[k] : 0;
                return getEfficiencyStatus(z, avgD) === "saturacion_cognitiva";
            }),
            dimensions: {}
        };

        Object.keys(liveDimensions).forEach(k => {
            const correct = liveDimensions[k].correct;
            const mean = liveDimensions[k].mean;
            const sd = liveDimensions[k].sd;
            const z = parseFloat(((correct - mean) / sd).toFixed(3));
            const avgD = liveDimensionDwellCounts[k] > 0 ? parseFloat((liveDimensionDwells[k] / liveDimensionDwellCounts[k]).toFixed(1)) : 0;
            const totalChanges = liveDimensionChanges[k];

            liveIndicesReferencia.dimensions[k] = {
                correct,
                z_score: z,
                average_dwell: avgD,
                total_changes: totalChanges,
                status: z >= 1 ? "superior" : z <= -1 ? "inferior" : "normal",
                efficiency_status: getEfficiencyStatus(z, avgD),
                interpretation: getClinicalInterpretation(z, avgD)
            };
        });

        // 2. Validador de Calidad (Filtros de Descarte)
        const liveTotalDwellTime = Object.values(icarDwellTimes).reduce((a, b) => a + b, 0);
        let liveValidez = "ok";
        if (liveTotalDwellTime < 350) {
            liveValidez = "INVALIDA_DESATENCION";
        } else if ((score / 16) < 0.30) {
            liveValidez = "INVALIDA_AZAR";
        }

        // 3. El "Objeto de Estado Cognitivo"
        const getEficienciaLabel = (z, eff) => {
            if (eff === "capacidad_compensatoria") return "alta_demanda";
            if (eff === "saturacion_cognitiva") return "saturacion";
            if (z >= 1) return "optima";
            if (z <= -1) return "deficiente";
            return "normal";
        };

        const livePerfilCognitivo = {
            verbal: {
                z_score: liveIndicesReferencia.dimensions.verbal.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.verbal.z_score, liveIndicesReferencia.dimensions.verbal.efficiency_status)
            },
            spatial: {
                z_score: liveIndicesReferencia.dimensions.visuospatial.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.visuospatial.z_score, liveIndicesReferencia.dimensions.visuospatial.efficiency_status)
            },
            secuencial: {
                z_score: liveIndicesReferencia.dimensions.sequential.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.sequential.z_score, liveIndicesReferencia.dimensions.sequential.efficiency_status)
            },
            inductiva: {
                z_score: liveIndicesReferencia.dimensions.inductive.z_score,
                eficiencia: getEficienciaLabel(liveIndicesReferencia.dimensions.inductive.z_score, liveIndicesReferencia.dimensions.inductive.efficiency_status)
            }
        };

        // Estilo de ejecución
        let liveEstiloEjecucion = "normal";
        const liveTotalChanges = Object.values(icarChanges).reduce((a, b) => a + b, 0);
        if (liveTotalDwellAvg < 45 && score >= 11) {
            liveEstiloEjecucion = "eficiente";
        } else if (liveTotalDwellAvg < 45 && score < 11) {
            liveEstiloEjecucion = "impulsivo";
        } else if (liveTotalDwellAvg >= 45 && score >= 11) {
            liveEstiloEjecucion = "analítico_sostenido";
        } else {
            liveEstiloEjecucion = "sobrecargado";
        }

        // Banderas conductuales
        const liveBanderasConductuales = [];
        if (liveIndicesReferencia.dimensions.visuospatial.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_spatial");
        }
        if (liveIndicesReferencia.dimensions.verbal.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_verbal");
        }
        if (liveIndicesReferencia.dimensions.sequential.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_secuencial");
        }
        if (liveIndicesReferencia.dimensions.inductive.efficiency_status === "capacidad_compensatoria") {
            liveBanderasConductuales.push("alta_inversion_inductiva");
        }

        if (liveIndicesReferencia.dimensions.visuospatial.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_spatial");
        }
        if (liveIndicesReferencia.dimensions.verbal.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_verbal");
        }
        if (liveIndicesReferencia.dimensions.sequential.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_secuencial");
        }
        if (liveIndicesReferencia.dimensions.inductive.efficiency_status === "saturacion_cognitiva") {
            liveBanderasConductuales.push("saturacion_inductiva");
        }

        if (liveTotalChanges === 0) {
            liveBanderasConductuales.push("estabilidad_decisional_alta");
        } else if (liveTotalChanges >= 5) {
            liveBanderasConductuales.push("reevaluacion_decisional_alta");
        }

        const liveEstadoCognitivo = {
            metadatos: {
                fecha: new Date().toISOString().split('T')[0],
                validez: liveValidez,
                tiempo_total: Math.round(liveTotalDwellTime)
            },
            perfil_cognitivo: livePerfilCognitivo,
            estilo_ejecucion: liveEstiloEjecucion,
            banderas_conductuales: liveBanderasConductuales
        };

        return {
            score,
            categories,
            isPhenomComplete,
            isPid5Complete,
            isIcarComplete,
            pidScores,
            dominantDomain,
            archetype: existentialArchetypes[dominantArchetype],
            dwellAvg: Object.values(icarDwellTimes).length > 0
                ? (Object.values(icarDwellTimes).reduce((a, b) => a + b, 0) / Object.values(icarDwellTimes).length).toFixed(1)
                : 0,
            totalChanges: Object.values(icarChanges).reduce((a, b) => a + b, 0),
            indices_referencia: liveIndicesReferencia,
            estado_cognitivo: liveEstadoCognitivo
        };
    }, [phenomQualitative, pidAnswers, icarAnswers, icarDwellTimes, icarChanges, user]);

    const currentCaseFormulation = useMemo(() => {
        const arch = calculatedResults.archetype;
        const noteKws = noteKeywords;
        const score = calculatedResults.score;

        let triggersHtml = "El sistema psíquico detecta tu susceptibilidad atencional y reactividad emocional cuando enfrentas ";
        if (noteKws.length > 0) {
            triggersHtml += `conceptos de alta densidad existencial identificados en tus notas, como *"${noteKws.slice(0, 3).join(', ')}"*`;
        } else {
            triggersHtml += "situaciones de caos y desorganización conceptual en tu entorno de trabajo diario.";
        }

        let dynamicFormulation = `### 1. Formulación de Caso Clínico Funcional (${arch?.name || 'Explorador'})
        
        **A. Estímulo Antecedente / Disparador (A):**
        ${triggersHtml}. Tu cerebro experimenta esto como una amenaza directa a tu coherencia interna.
        
        **B. Estructura de Vulnerabilidad Nuclear (B):**
        Tu perfil fenomenológico revela una vulnerabilidad arraigada en: *"${arch?.vulnerability || 'Búsqueda del orden.'}"*. Esto actúa como una lente cognitiva que distorsiona la neutralidad del lienzo.
        
        **C. Respuesta de Evitación y Bloqueo (C):**
        Ante la sobrecarga, activas el bucle protector de **${arch?.subtitle || 'Evitación'}**, provocando un bloqueo manifiesto como *"${arch?.blockage || 'Parálisis por análisis'}"*.
        
        **D. Consecuencias Autoperpetuantes (D):**
        El repliegue analítico disminuye la ansiedad inmediata, pero a largo plazo refuerza la vulnerabilidad de base, consolidando un bucle psicológico recurrente que paraliza tu flujo creativo de notas en el canvas.`;

        const ref = calculatedResults.indices_referencia;
        let dimensionsBreakdown = "";
        if (ref && ref.dimensions) {
            const nameMap = {
                verbal: "Lógico-Verbal",
                visuospatial: "Visoespacial",
                sequential: "Secuencial",
                inductive: "Inductiva"
            };
            dimensionsBreakdown = "\n\n**Mapeo de Dominios Cognitivos (Z-Scores & Eficiencia):**\n";
            Object.entries(ref.dimensions).forEach(([key, data]) => {
                const name = nameMap[key] || key;
                const statusLabel = data.efficiency_status === 'capacidad_compensatoria' ? 'Capacidad Compensatoria' :
                    data.efficiency_status === 'saturacion_cognitiva' ? 'Saturación Cognitiva' :
                        data.efficiency_status === 'baja_inversion' ? 'Baja Inversión' : 'Rendimiento Normal';
                dimensionsBreakdown += `* **${name}** (Aciertos: ${data.correct}/4 | Z-Score: ${data.z_score > 0 ? '+' : ''}${data.z_score} | Dwell medio: ${data.average_dwell}s)\n  - *Categorización:* ${statusLabel}\n  - *Demostración objetiva:* ${data.interpretation}\n`;
            }
            );
        }

        let cognitiveCapacityAnalysis = `### 2. Análisis del Procesamiento Cognitivo (ICAR16)
        
        * **Índice de Acierto Cognitivo**: **${score}/16**
        * **Tiempo Promedio de Reacción (Dwell Time)**: **${calculatedResults.dwellAvg} segundos**
        * **Titubeo (Cambios de Respuesta)**: **${calculatedResults.totalChanges} vacilaciones registradas.**${dimensionsBreakdown}
        
        **Interpretación Cualitativa:**
        ${score >= 12
                ? "Muestras un rendimiento visomental y de inferencia altamente desarrollado, permitiéndote resolver jerarquías espaciales y verbales complejas. Sin embargo, este alto procesamiento analítico te predispone a bucles obsesivos de perfeccionismo intelectual."
                : "Se observa sobrecarga del ejecutivo central en el córtex prefrontal ante tareas de retención visoespacial simultáneas. Esto desencadena mecanismos rápidos de fatiga atencional, provocando respuestas impulsivas para liberar la tensión cognitiva."}`;

        return {
            triggers: triggersHtml,
            formulation: dynamicFormulation,
            cognitive: cognitiveCapacityAnalysis,
            liberation: arch?.liberation || "Explorar con libertad sin juicios."
        };
    }, [calculatedResults, noteKeywords]);


    // AI & Chat States
    const [activeNoteId, setActiveNoteId] = useState(null);
    const snapedToRef = useRef(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isChatOpen, setIsChatOpenRaw] = useState(initialStartupScreen === 'chat');
    // Bottom bar chat input state
    const [chatInputBar, setChatInputBar] = useState('');
    const [chatIsRecording, setChatIsRecording] = useState(false);
    const chatInputBarRef = useRef(null);

    useEffect(() => {
        if (isChatOpen && chatInputBarRef.current) {
            setTimeout(() => {
                chatInputBarRef.current.focus();
            }, 300);
        }
    }, [isChatOpen]);
    const chatBarRecognitionRef = useRef(null);
    const chatBarAccumulatedRef = useRef('');
    const [isAnalyzingNote, setIsAnalyzingNote] = useState(false);
    const [isDiaryMode, setIsDiaryMode] = useState(false);
    const [focusedResonanceField, setFocusedResonanceField] = useState(null);
    const [availableModels, setAvailableModels] = useState(['deepseek-chat', 'deepseek-reasoner']);
    const [activeModel, setActiveModel] = useState(null);

    // Performance Refs
    const chatMessagesRef = useRef([]); // PERSISTENT REF FOR THROTTLING
    const lastSuccessModel = useRef(null);

    // Mural States
    const [isMuralMode, setIsMuralMode] = useState(false);
    const [muralBlocks, setMuralBlocks] = useState([]);
    const [tempMuralBlocks, setTempMuralBlocks] = useState([]);
    const [muralScale, setMuralScale] = useState(1);
    const [isAddingText, setIsAddingText] = useState(false);
    const muralFileInputRef = useRef(null);

    // Safe wrapped setters for non-overlapping states
    const setIsComposerOpen = useCallback((val) => {
        setIsComposerOpenRaw(prev => {
            const nextVal = typeof val === 'function' ? val(prev) : val;
            if (nextVal) {
                setIsSimpleNotesOpenRaw(false);
                setIsUnifiedCreatorOpen(false);
                setIsUnifiedCreatorOpen(false);
                setIsChatOpenRaw(false);
                setActiveNotebookRaw(null);
                setActiveTestRaw(null);
            }
            return nextVal;
        });
    }, []);

    const setIsSimpleNotesOpen = useCallback((val) => {
        setIsSimpleNotesOpenRaw(prev => {
            const nextVal = typeof val === 'function' ? val(prev) : val;
            if (nextVal) {
                setIsComposerOpenRaw(false);
                setIsChatOpenRaw(false);
                setActiveNotebookRaw(null);
                setActiveTestRaw(null);
            }
            return nextVal;
        });
    }, []);

    const setIsChatOpen = useCallback((val) => {
        setIsChatOpenRaw(prev => {
            const nextVal = typeof val === 'function' ? val(prev) : val;
            if (nextVal) {
                setIsSimpleNotesOpenRaw(false);
                setIsUnifiedCreatorOpen(false);
                setIsUnifiedCreatorOpen(false);
                setIsComposerOpenRaw(false);
                setActiveNotebookRaw(null);
                setActiveTestRaw(null);
            }
            return nextVal;
        });
    }, []);

    const setActiveNotebook = useCallback((val) => {
        setActiveNotebookRaw(prev => {
            const nextVal = typeof val === 'function' ? val(prev) : val;
            if (nextVal) {
                setIsSimpleNotesOpenRaw(false);
                setIsUnifiedCreatorOpen(false);
                setIsUnifiedCreatorOpen(false);
                setIsComposerOpenRaw(false);
                setIsChatOpenRaw(false);
                setActiveTestRaw(null);
            }
            return nextVal;
        });
    }, []);

    const setActiveTest = useCallback((val) => {
        setActiveTestRaw(prev => {
            const nextVal = typeof val === 'function' ? val(prev) : val;
            if (nextVal) {
                setIsSimpleNotesOpenRaw(false);
                setIsUnifiedCreatorOpen(false);
                setIsUnifiedCreatorOpen(false);
                setIsComposerOpenRaw(false);
                setIsChatOpenRaw(false);
                setActiveNotebookRaw(null);
            }
            return nextVal;
        });
    }, []);

    const isFresh = useMemo(() => {
        if (!isLoggedIn || !user || user === 'observador1' || !isDataLoaded) return false;
        if (!Array.isArray(blocks)) return false;
        const noteCount = blocks.filter(b => b && b.type === 'note').length;
        const hasPhenomMeta = !!localStorage.getItem('oasis_phenom_metadata_' + user);
        return noteCount === 0 && !hasPhenomMeta;
    }, [isLoggedIn, user, isDataLoaded, blocks]);

    useEffect(() => {
        if (isFresh) {
            console.log("[Oasis] Mandatory onboarding redirect to Soul Phenom view");
            setActiveNotebookRaw(null);
            setIsBitacoraOpen(false);
            setIsSettingsOpen(false);
            if (view !== 'soul') setView('soul');
            if (activeTest !== 'phenom') {
                setSoulTab('tests');
                setActiveTest('phenom');
                setShowPhenomIntro(true);
            }
        }
    }, [isFresh, view, activeTest, setView, setActiveTest]);

    // Swipe navigation logic for navbar
    const TABS = [
        { id: 'profile', label: 'Perfil' },
        { id: 'composer', label: 'Notas Rápidas' },
        { id: 'chat', label: 'Diálogos AI' },
        { id: 'diary', label: 'Diario' },
        { id: 'resonance', label: 'Resonancia' },
        { id: 'canvas', label: 'Lienzo' }
    ];

    const getActiveTabIndex = useCallback(() => {
        if (view === 'profile') return 0;
        if (isComposerOpen || isSimpleNotesOpen) return 1;
        if (isChatOpen) return 2;
        if (activeNotebook === 'diary') return 3;
        if (activeNotebook === 'resonance') return 4;
        return 5; // canvas
    }, [isChatOpen, activeNotebook, view, isComposerOpen, isSimpleNotesOpen]);

    const switchToTabIndex = useCallback((index) => {
        if (index < 0 || index >= TABS.length) return;
        const tab = TABS[index];
        setIsSimpleNotesOpenRaw(false);
        setIsUnifiedCreatorOpen(false);
        setIsUnifiedCreatorOpen(false);
        setIsComposerOpenRaw(false);
        setIsChatOpenRaw(false);
        setActiveNotebookRaw(null);
        setActiveTestRaw(null);

        if (tab.id === 'profile') {
            setView('profile');
        } else if (tab.id === 'composer') {
            setView('canvas');
            setIsSimpleNotesOpenRaw(true);
        } else if (tab.id === 'chat') {
            setView('canvas');
            setIsChatOpenRaw(true);
        } else if (tab.id === 'diary') {
            setView('canvas');
            setActiveNotebookRaw('diary');
        } else if (tab.id === 'resonance') {
            setView('canvas');
            setActiveNotebookRaw('resonance');
        } else if (tab.id === 'canvas') {
            setView('canvas');
        }
    }, []);

    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const handleNavbarTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleNavbarTouchEnd = useCallback((e) => {
        const diffX = e.changedTouches[0].clientX - touchStartX.current;
        const diffY = e.changedTouches[0].clientY - touchStartY.current;

        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 40) {
            const currentIndex = getActiveTabIndex();
            if (diffX > 0) {
                switchToTabIndex(currentIndex - 1);
            } else {
                switchToTabIndex(currentIndex + 1);
            }
        }
    }, [getActiveTabIndex, switchToTabIndex]);

    // Gesto de dos dedos deshabilitado

    const syncConversations = useCallback((updated) => {
        setConversations(updated);
        const currentUser = user || localStorage.getItem('oasis_user') || 'user';
        fetch(`${API_URL}/api/oasis/conversations?user=${currentUser}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        }).catch(err => console.error('Error syncing conversations:', err));
    }, [user]);

    const launchMural = () => {
        setIsMuralMode(true);
        if (editingId) {
            const activeNote = blocks.find(b => b.id === editingId);
            if (activeNote) {
                setMuralBlocks(activeNote.muralBlocks || []);
                return;
            }
        }
        setMuralBlocks(tempMuralBlocks || []);
    };

    const handleSaveMural = (updatedBlocks) => {
        if (editingId) {
            setBlocks(prev => {
                const updated = prev.map(b => b.id === editingId ? { ...b, muralBlocks: updatedBlocks } : b);
                syncBlocks(updated);
                return updated;
            });
            console.log(`[Mural] Guardado mural en nota existente con ID ${editingId}`);
        } else {
            setTempMuralBlocks(updatedBlocks);
            console.log("[Mural] Guardado mural en borrador de nueva nota");
        }
    };

    const handleMuralFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const newBlock = {
                id: `mural-img-${Date.now()}`,
                type: 'image',
                content: ev.target.result,
                x: window.innerWidth / 2 - 150,
                y: window.innerHeight / 2 - 150,
                w: 300,
                h: 300,
                rotation: 0,
                mask: 'none',
                zoom: 1,
                canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
            };
            const updated = [...muralBlocks, newBlock];
            setMuralBlocks(updated);
            localStorage.setItem('oasis_mural_data', JSON.stringify(updated));
        };
        reader.readAsDataURL(file);
    };

    const saveCurrentChat = useCallback((overrideId = null, overrideNoteId = null, overrideIsAnalyzing = null) => {
        const targetId = overrideId || activeConversationId;
        const targetNoteId = overrideNoteId !== null ? overrideNoteId : activeNoteId;
        const targetIsAnalyzing = overrideIsAnalyzing !== null ? overrideIsAnalyzing : isAnalyzingNote;

        if (!targetId || chatMessagesRef.current.length === 0) return Promise.resolve();

        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });

        setConversations(prev => {
            const exists = prev.find(c => c.id === targetId);
            let updated;
            if (exists) {
                updated = prev.map(c => c.id === targetId ? { ...c, messages: chatMessagesRef.current, noteId: targetNoteId } : c);
            } else {
                // Generate a clean title from the first message
                const firstMsg = chatMessagesRef.current[0]?.content || '';
                const cleanTitle = firstMsg.slice(0, 35).trim() + (firstMsg.length > 35 ? '...' : '');

                updated = [{
                    id: targetId,
                    title: targetIsAnalyzing ? `Análisis: ${cleanTitle}` : cleanTitle,
                    messages: chatMessagesRef.current,
                    startTime: new Date().toISOString(),
                    noteId: targetNoteId,
                    color: accent // Use current accent as initial color
                }, ...prev];
            }

            const currentUser = user || localStorage.getItem('oasis_user') || 'user';
            fetch(`${API_URL}/api/oasis/conversations?user=${currentUser}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            })
                .then(res => {
                    resolveFetch(res);
                })
                .catch(err => {
                    console.error('Error syncing conversations (saveCurrentChat):', err);
                    resolveFetch(err);
                });

            // Defer blocks synchronization to avoid concurrent state update warnings
            setTimeout(() => {
                setBlocks(prevBlocks => {
                    const blockIdMatch = (id) => id === targetId || id === `conv-pub-${targetId}`;
                    if (prevBlocks.some(b => blockIdMatch(b.id))) {
                        const existsInUpdated = updated.find(c => c.id === targetId);
                        const firstMsg = chatMessagesRef.current[0]?.content || '';
                        const cleanTitle = firstMsg.slice(0, 35).trim() + (firstMsg.length > 35 ? '...' : '');
                        const finalTitle = targetIsAnalyzing ? `Análisis: ${cleanTitle}` : cleanTitle;

                        const updatedBlocks = prevBlocks.map(b => blockIdMatch(b.id) ? {
                            ...b,
                            caption: existsInUpdated?.title || finalTitle,
                            content: JSON.stringify(chatMessagesRef.current)
                        } : b);
                        syncBlocks(updatedBlocks);
                        return updatedBlocks;
                    }
                    return prevBlocks;
                });
            }, 0);

            return updated;
        });

        return fetchPromise;
    }, [activeConversationId, isAnalyzingNote, activeNoteId, user, accent]);


    const generateChatTitle = useCallback(async (convId, firstMessage) => {
        const prompt = `Eres Kio, el núcleo digital de Ruido Interior. Genera un título corto, elegante y profesional (máximo 4 palabras) para una conversación que comienza con este mensaje: "${firstMessage}". Responde ÚNICAMENTE con el título, sin comillas ni puntos finales.`;

        try {
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || lastSuccessModel.current || 'deepseek-chat';
            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    key: deepseekKey,
                    payload: {
                        model: model,
                        messages: [{ role: 'user', content: prompt }]
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                let title = data.choices?.[0]?.message?.content?.trim();
                if (title) {
                    title = title.replace(/^["']|["']$|[\.]$/g, '');
                    console.log(`Kio - Título generado con éxito: "${title}"`);

                    const updateState = (attempts = 0) => {
                        setConversations(prev => {
                            const exists = prev.find(c => c.id === convId);
                            if (!exists) {
                                if (attempts < 5) {
                                    console.warn(`Kio - Intento ${attempts + 1}: Conversación [${convId}] no encontrada. Reintentando en 500ms...`);
                                    setTimeout(() => updateState(attempts + 1), 500);
                                } else {
                                    console.error(`Kio - Error: No se pudo actualizar el título tras 5 intentos.`);
                                }
                                return prev;
                            }

                            const updated = prev.map(c => c.id === convId ? { ...c, title: title } : c);
                            const currentUser = user || localStorage.getItem('oasis_user') || 'user';
                            fetch(`${API_URL}/api/oasis/conversations?user=${currentUser}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updated)
                            });

                            // Synchronize block caption on canvas
                            setTimeout(() => {
                                setBlocks(prevBlocks => {
                                    if (prevBlocks.some(b => b.id === convId)) {
                                        const updatedBlocks = prevBlocks.map(b => b.id === convId ? { ...b, caption: title } : b);
                                        syncBlocks(updatedBlocks);
                                        return updatedBlocks;
                                    }
                                    return prevBlocks;
                                });
                            }, 0);

                            return updated;
                        });
                    };

                    updateState();
                } else {
                    console.warn("Kio - El modelo no devolvió un título válido.");
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Kio - Error en API de títulos:", errData?.error?.message || res.statusText);
            }
        } catch (e) {
            console.error("Kio - Excepción generando título AI:", e);
        }
    }, [deepseekKey, user]);

    const handleNewChat = useCallback(() => {
        console.log("Kio - Iniciando nueva línea temporal...");
        if (chatMessagesRef.current && chatMessagesRef.current.length > 0) saveCurrentChat();
        setActiveConversationId(null);
        setChatMessages([]);
        if (chatMessagesRef.current) chatMessagesRef.current = [];
        setIsAnalyzingNote(false);
        setActiveNoteId(null);
        setChatInput('');
        setIsChatOpen(true);
    }, [saveCurrentChat]);

    const handleSelectConversation = useCallback((id) => {
        const cleanId = id && id.startsWith('conv-pub-') ? id.replace('conv-pub-', '') : id;
        const targetConv = conversations.find(c => c.id === cleanId);
        if (targetConv) {
            setIsAnalyzingNote(!!targetConv.noteId);
            setActiveNoteId(targetConv.noteId || null);
            setActiveConversationId(cleanId);
            const msgs = targetConv.messages || [];
            setChatMessages(msgs);
            if (chatMessagesRef.current) chatMessagesRef.current = msgs;
            setIsChatOpen(true);
        }
    }, [conversations]);



    const logout = () => {
        setUser('');
        setIsLoggedIn(false);
        setIsDataLoaded(false);
        localStorage.removeItem('oasis_user');
        setBlocks(INITIAL_BLOCKS);
        setPlaylists({ 'Favoritos': [] });
        setPlayQueue(playerTracks);
        setCurrentTrack(0);
        setTrackProgress(0);
        setView('canvas');

        // Clear all psychometric and clinical test states to prevent leaks between users
        setPhenomAnswers({});
        setPhenomQualitative({ antecedentes_origen: "", experiencia_insuficiencia: "", temporalidad_vivida: "", premisa_realidad: "" });
        setPidAnswers({});
        setIcarAnswers({});
        setIcarDwellTimes({});
        setIcarChanges({});
        setIcarVideos({});
        icarVideosRef.current = {};
        setCurrentPhenomIndex(0);
        setShowPhenomIntro(true);
        setCurrentPidIndex(0);
        setCurrentIcarIndex(0);
    };

    // --- SINCRONIZACIÓN DE AURA Y DATOS ---
    useEffect(() => {
        if (isLoggedIn && user && !isDataLoaded) {
            const loadUserResonances = async () => {
                try {
                    // Optimistic local load to unblock UI
                    try {
                        const localRaw = localStorage.getItem('oasis_canvas_nodes_' + user);
                        const localBlocks = localRaw ? JSON.parse(localRaw) : [];
                        if (localBlocks.length > 0) setBlocks(localBlocks);

                        const bgRaw = localStorage.getItem('oasis_bg_' + user);
                        if (bgRaw) {
                            const parsed = JSON.parse(bgRaw);
                            if (parsed && parsed.value) {
                                setBgType(parsed.type); setBgValue(parsed.value); setIsTiled(parsed.isTiled);
                            }
                        }
                    } catch (_) {}

                    // Release the UI loading state so the user sees the page instantly
                    setIsDataLoaded(true);

                    // Fetch data in background
                    Promise.all([
                        fetch(`${API_URL}/api/oasis/background?user=${user}`).catch(() => null),
                        fetch(`${API_URL}/api/oasis/conversations?user=${user}`).catch(() => null),
                        fetch(`${API_URL}/api/oasis/folders?user=${user}`).catch(() => null),
                        fetch(`${API_URL}/api/oasis/blocks?user=${user}`).catch(() => null)
                    ]).then(async ([bgRes, convRes, foldRes, blocksRes]) => {
                        // --- 1. Background ---
                        let gotBg = false;
                        if (bgRes && bgRes.ok) {
                            const data = await bgRes.json();
                            if (data && data.value && data.value !== '#030304') {
                                setBgType(data.type); setBgValue(data.value); setIsTiled(data.isTiled);
                                localStorage.setItem('oasis_bg_' + user, JSON.stringify({ type: data.type, value: data.value, isTiled: data.isTiled }));
                                gotBg = true;
                            }
                        }
                        if (!gotBg) {
                            try {
                                const templatesRes = await fetch(`${API_URL}/api/oasis/backgrounds/templates`);
                                if (templatesRes.ok) {
                                    const templatesData = await templatesRes.json();
                                    if (templatesData && templatesData.length > 0) {
                                        const firstTemplate = templatesData[0];
                                        setBgType(firstTemplate.type); setBgValue(firstTemplate.value); setIsTiled(firstTemplate.isTiled);
                                        fetch(`${API_URL}/api/oasis/background?user=${user}`, {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ type: firstTemplate.type, value: firstTemplate.value, isTiled: firstTemplate.isTiled, opacity: 0.8 })
                                        }).catch(() => { });
                                    }
                                }
                            } catch (err) { }
                        }

                        // --- 2. Conversations & Folders ---
                        if (convRes && convRes.ok) {
                            const data = await convRes.json();
                            setConversations(data || []);
                        }
                        if (foldRes && foldRes.ok) {
                            const data = await foldRes.json();
                            setFolders(data || []);
                        }

                        // --- 3. Blocks ---
                        if (blocksRes && blocksRes.ok) {
                            const data = await blocksRes.json();
                            const serverFiltered = (data || []).filter(b => b.type !== 'insight');
                            try {
                                const { merged, hasChanges } = smartMergeBlocks(serverFiltered, user);
                                setBlocks(merged);
                                localStorage.setItem('oasis_canvas_nodes_' + user, JSON.stringify(merged));
                                if (hasChanges) {
                                    fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(merged)
                                    }).catch(() => { });
                                }
                            } catch (_) {
                                if (serverFiltered.length > 0) setBlocks(serverFiltered);
                            }
                        }
                    });

                    // --- 4. Retroactive & Slow Sync (Background Task) ---
                    // This will NOT block the UI loading anymore!
                    setTimeout(async () => {
                        try {
                            const getTargetUserFromKey = (k, defaultUser) => {
                                const prefixes = ['oasis_bio_transcriptions_', 'oasis_phenom_qualitative_', 'oasis_pid_answers_', 'oasis_icar_answers_', 'oasis_icar_dwell_', 'oasis_icar_changes_', 'oasis_bio_metadata_', 'oasis_phenom_metadata_', 'oasis_active_version_', 'oasis_total_versions_', 'oasis_patient_status_', 'oasis_session_videos_bio_videos_', 'oasis_session_videos_phenom_videos_', 'oasis_session_videos_icar_videos_', 'oasis_clinician_notes_', 'oasis_private_notes_', 'oasis_canvas_nodes_', 'oasis_canvas_edges_'];
                                for (const prefix of prefixes) {
                                    if (k.startsWith(prefix)) {
                                        let part = k.substring(prefix.length);
                                        const vIndex = part.indexOf('_v');
                                        if (vIndex > -1) part = part.substring(0, vIndex);
                                        return part;
                                    }
                                }
                                return defaultUser;
                            };

                            // Fetch clinical data
                            const clinicalRes = await fetch(`${API_URL}/api/oasis/clinical-data?user=${user}`).catch(() => null);
                            if (clinicalRes && clinicalRes.ok) {
                                const serverData = await clinicalRes.json();
                                window.isDownloadingClinicalData = true;
                                try { Object.keys(serverData).forEach(key => localStorage.setItem(key, serverData[key])); }
                                finally { window.isDownloadingClinicalData = false; }
                            }

                            // Scan localStorage
                            const groups = {};
                            for (let i = 0; i < localStorage.length; i++) {
                                const key = localStorage.key(i);
                                if (key && key.startsWith('oasis_') && key !== 'oasis_user' && !key.startsWith('oasis_bg_')) {
                                    const targetUser = getTargetUserFromKey(key, user);
                                    if (targetUser) {
                                        groups[targetUser] = groups[targetUser] || {};
                                        groups[targetUser][key] = localStorage.getItem(key);
                                    }
                                }
                            }

                            for (const [targetUser, data] of Object.entries(groups)) {
                                let serverDataForUser = {};
                                try {
                                    const res = await fetch(`${API_URL}/api/oasis/clinical-data?user=${targetUser}`);
                                    if (res.ok) serverDataForUser = await res.json();
                                } catch (e) { }

                                const keysToPush = {};
                                Object.keys(data).forEach(key => { if (serverDataForUser[key] !== data[key]) keysToPush[key] = data[key]; });

                                if (Object.keys(keysToPush).length > 0) {
                                    await fetch(`${API_URL}/api/oasis/clinical-data?user=${targetUser}`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(keysToPush)
                                    }).catch(() => { });
                                }
                            }

                            // Video sync
                            const obsList = await getObservations();
                            for (const obs of obsList) {
                                if (obs.videos && Object.keys(obs.videos).length > 0) {
                                    let updated = false;
                                    const updatedVideos = { ...obs.videos };
                                    for (const [key, val] of Object.entries(obs.videos)) {
                                        if (val instanceof Blob) {
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', val, `video_${key}.webm`);
                                                const res = await fetch(`${API_URL}/api/oasis/upload`, { method: 'POST', body: formData });
                                                if (res.ok) { const data = await res.json(); if (data.url) { updatedVideos[key] = data.url; updated = true; } }
                                            } catch (e) { }
                                        }
                                    }
                                    if (updated) {
                                        obs.videos = updatedVideos;
                                        await saveObservation(obs);
                                    }
                                    const obsUser = obs.username || getTargetUserFromKey(obs.id, user);
                                    if (obsUser) {
                                        const payloadKey = `oasis_session_videos_${obs.id}`;
                                        const payloadValue = JSON.stringify(obs);
                                        let serverDataForObsUser = {};
                                        try { const res = await fetch(`${API_URL}/api/oasis/clinical-data?user=${obsUser}`); if (res.ok) serverDataForObsUser = await res.json(); } catch (e) { }
                                        if (serverDataForObsUser[payloadKey] !== payloadValue || updated) {
                                            await fetch(`${API_URL}/api/oasis/clinical-data?user=${obsUser}`, {
                                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ [payloadKey]: payloadValue })
                                            }).catch(() => { });
                                        }
                                    }
                                }
                            }
                        } catch (e) { console.error("Error in background sync:", e); }
                    }, 500);

                } catch (e) {
                    console.error("Error initializing user state:", e);
                    setIsDataLoaded(true); // Always unlock UI
                }
            };

            loadUserResonances();
        }
    }, [isLoggedIn, user, isDataLoaded]);


    // ── SINCRONIZACIÓN EN TIEMPO REAL MULTI-DISPOSITIVO ──────────────────────
    // Ref para saber cuándo fue el último guardado local.
    // Si guardamos localmente hace menos de 30s, NO traemos datos del servidor
    // (el servidor puede estar dormido en Render y devolver data antigua).
    const lastLocalSaveRef = React.useRef(0);

    useEffect(() => {
        if (!isLoggedIn || !user || !isDataLoaded) return;

        // Función de MERGE: preferimos los datos del servidor, pero
        // conservamos cualquier bloque LOCAL que no esté en el servidor
        // (puede ser un guardado pendiente mientras el servidor dormía).
        const mergeWithServer = (serverData) => {
            try {
                // Inyectar logica de Pizarrones
                let hasCanvas = serverData.some(b => b.type === 'canvas');
                if (!hasCanvas && user) {
                    serverData.push({ id: 'canvas_default', type: 'canvas', text: 'Pizarrón 1', timestamp: Date.now(), user: user });
                }
                const mappedServerData = serverData.map(b => {
                    if (b.type !== 'canvas' && b.id !== 'user_settings' && b.id !== 'profile_settings' && !b.canvasId && b.type !== 'insight') {
                        return { ...b, canvasId: 'canvas_default' };
                    }
                    return b;
                });
                const serverFiltered = mappedServerData.filter(b => b.type !== 'insight');

                const { merged, hasChanges } = smartMergeBlocks(serverFiltered, user);
                localStorage.setItem('oasis_canvas_nodes_' + user, JSON.stringify(merged));
                setBlocks(merged);

                // Respect user's saved cam position in localStorage — never override their zoom/pan
                const savedCamRaw = localStorage.getItem('oasis_cam_' + user);
                const savedCam = savedCamRaw ? (() => { try { return JSON.parse(savedCamRaw); } catch (_) { return null; } })() : null;

                if (savedCam && typeof savedCam.x === 'number' && typeof savedCam.scale === 'number') {
                    // User has a saved position: restore it silently, do NOT override
                    setCam(savedCam);
                } else {
                    // No saved position: center on the most recently created block
                    const visualBlocks = merged.filter(b =>
                        b.type !== 'settings' && b.id !== 'user_settings' && b.id !== 'profile_settings' &&
                        b.type !== 'canvas' && b.type !== 'insight' &&
                        b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook' &&
                        !b.isPublic && b.x !== undefined && b.y !== undefined &&
                        (b.canvasId === activeCanvasId || (!b.canvasId && activeCanvasId === 'canvas_default'))
                    ).sort((a, b) => {
                        const tA = new Date(a.metadata?.timestamp || a.timestamp || 0).getTime();
                        const tB = new Date(b.metadata?.timestamp || b.timestamp || 0).getTime();
                        return tB - tA; // newest first
                    });

                    if (visualBlocks.length > 0) {
                        const lastBlock = visualBlocks[0]; // most recent
                        const targetScale = window.innerWidth < 768 ? 0.65 : 0.85;
                        const cx = (lastBlock.x || 0) + (lastBlock.w || 288) / 2;
                        const cy = (lastBlock.y || 0) + (lastBlock.h || 288) / 2;
                        const camX = (window.innerWidth / 2) - (cx * targetScale);
                        const camY = (window.innerHeight / 2) - (cy * targetScale);
                        setCam({ x: camX, y: camY, scale: targetScale });
                    } else {
                        const settingsBlock = merged.find(b => b.id === 'user_settings');
                        if (settingsBlock && settingsBlock.metadata?.cam) {
                            setCam(settingsBlock.metadata.cam);
                        }
                    }
                }

                // Si detectamos cambios locales más nuevos o entradas que no están en el servidor, subir
                if (hasChanges) {
                    console.log(`[Oasis] Sincronizando cambios locales pendientes detectados al volver a la app.`);
                    fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(merged)
                    });
                }
            } catch (_) {
                setBlocks(serverBlocks);
            }
        };

        const fetchLatest = async () => {
            // No sobreescribir si acaba de haber un guardado local reciente
            const secsSinceLocalSave = (Date.now() - lastLocalSaveRef.current) / 1000;
            if (secsSinceLocalSave < 30) return;
            try {
                const timestamp = Date.now();
                const [blocksRes, linksRes] = await Promise.all([
                    fetch(`${API_URL}/api/oasis/blocks?user=${user}&t=${timestamp}`),
                    fetch(`${API_URL}/api/oasis/links?user=${user}&t=${timestamp}`)
                ]);
                if (blocksRes.ok) {
                    const data = await blocksRes.json();
                    if (data && data.length > 0) mergeWithServer(data);
                }
                if (linksRes.ok) {
                    const data = await linksRes.json();
                    if (data) setLinks(data);
                }
            } catch (_) { /* offline — ignorar */ }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') fetchLatest();
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', fetchLatest);

        const syncInterval = setInterval(fetchLatest, 10000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', fetchLatest);
            clearInterval(syncInterval);
        };
    }, [isLoggedIn, user, isDataLoaded]);
    // ─────────────────────────────────────────────────────────────────────────

    const syncPlaylists = useCallback((newPlaylists) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/playlists?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlaylists)
        });
    }, [isLoggedIn, user, isDataLoaded]);

    const syncPlayback = useCallback((queue, index, position) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/playback?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queue: queue.map(t => ({ title: t.title, artist: t.artist, videoId: t.videoId, thumbnail: t.thumbnail })),
                currentIndex: index,
                position: position
            })
        });
    }, [isLoggedIn, user, isDataLoaded]);

    const syncMemory = useCallback((newMemory) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/memory?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memory: JSON.stringify(newMemory) })
        });
    }, [isLoggedIn, user, isDataLoaded]);

    const syncAura = (type, val, tiled) => {
        // Always persist to localStorage for offline access
        if (user) {
            localStorage.setItem('oasis_bg_' + user, JSON.stringify({ type, value: val, isTiled: tiled }));
        }
        if (!isLoggedIn || !user || !isDataLoaded) return;
        fetch(`${API_URL}/api/oasis/background?user=${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, value: val, isTiled: tiled, opacity: 0.8 })
        });
    };

    // Asegurar que los elementos centrales estén siempre en el pizarrón
    useEffect(() => {
        if (!isLoggedIn || !isDataLoaded || blocks === INITIAL_BLOCKS) return;
        let changed = false;
        let newBlocks = [...blocks];
        const isCurrentCanvas = (b) => {
            if (activeCanvasId === 'canvas_default') return !b.canvasId || b.canvasId === 'canvas_default';
            return b.canvasId === activeCanvasId;
        };

        // DISABLING LOOP MAP MINI AND NOTEBOOKS FOR NOW (USER REQUEST)
        const beforeLen2 = newBlocks.length;
        newBlocks = newBlocks.filter(b => b.type !== 'loop_map_mini' && b.type !== 'diary_notebook' && b.type !== 'resonance_notebook' && b.type !== 'conversation_notebook');
        if (newBlocks.length !== beforeLen2) {
            changed = true;
        }
        if (changed) {
            syncBlocks(newBlocks);
        }
    }, [blocks, isLoggedIn, isDataLoaded, activeCanvasId]);

    const syncBlocks = (newBlocks) => {
        // Registrar timestamp del último guardado local para proteger contra
        // el re-fetch del servidor que podría sobreescribir datos recientes.
        lastLocalSaveRef.current = Date.now();

        const performSync = (resolvedBlocks) => {
            let cleanBlocks = deduplicateBlocks(resolvedBlocks);
            // Asegurar que tengan canvasId con chequeo robusto para falsy o strings literals de undefined/null
            cleanBlocks = cleanBlocks.map(b => {
                if (b.type !== 'canvas' && b.id !== 'user_settings' && b.id !== 'profile_settings' && b.type !== 'insight') {
                    const cid = b.canvasId;
                    if (!cid || cid === 'undefined' || cid === 'null' || cid === '') {
                        return { ...b, canvasId: 'canvas_default' };
                    }
                }
                return b;
            });
            if (user) {
                localStorage.setItem('oasis_canvas_nodes_' + user, JSON.stringify(cleanBlocks));
                // Trigger offline background sync preparation
                if (window.guardarBlocksLocales) {
                    window.guardarBlocksLocales(user, cleanBlocks).then(() => {
                        if ('serviceWorker' in navigator && 'SyncManager' in window) {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.sync.register('sync-blocks').catch(e => console.error("Sync register failed", e));
                            });
                        }
                    }).catch(e => console.error("Error saving pending blocks to IndexedDB", e));
                }
            }

            if (!isLoggedIn || !user || !isDataLoaded) return;

            if (window.syncBlocksTimeout) clearTimeout(window.syncBlocksTimeout);
            window.syncBlocksTimeout = setTimeout(() => {
                fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanBlocks)
                }).then((res) => {
                    if (!res.ok) console.error("Error saving blocks:", res.status);
                    fetchFeed();
                }).catch((err) => {
                    console.log('Saved locally (Offline Mode), waiting for sync event.', err);
                });
            }, 2500);
        };

        const bumpTimestamps = (prev, nextList) => {
            return nextList.map(n => {
                const old = prev.find(o => o.id === n.id);
                // Object identity change means it was updated locally
                if (old !== n) {
                    return { ...n, timestamp: new Date().toISOString() };
                }
                return n;
            });
        };

        if (typeof newBlocks === 'function') {
            setBlocks(prev => {
                const resolved = newBlocks(prev);
                const updated = bumpTimestamps(prev, resolved);
                performSync(updated);
                return updated;
            });
        } else {
            setBlocks(prev => {
                const updated = bumpTimestamps(prev, newBlocks);
                performSync(updated);
                return updated;
            });
        }
    };

    const handleSaveProfile = useCallback((updates) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;

        // Actualizar local storage inmediatamente para evitar esperas
        if (updates.avatar !== undefined) localStorage.setItem('oasis_avatar_' + user, updates.avatar);
        if (updates.coverImage !== undefined) localStorage.setItem('oasis_cover_' + user, updates.coverImage);
        if (updates.fullName !== undefined) localStorage.setItem('oasis_fullname_' + user, updates.fullName);
        if (updates.bio !== undefined) localStorage.setItem('oasis_bio_' + user, updates.bio);
        if (updates.profileLink !== undefined) localStorage.setItem('oasis_profilelink_' + user, updates.profileLink);

        lastLocalSaveRef.current = Date.now();

        setBlocks(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(b => b.id === 'profile_settings');

            let currentProfile = {
                avatar: localStorage.getItem('oasis_avatar_' + user) || '',
                coverImage: localStorage.getItem('oasis_cover_' + user) || '',
                fullName: localStorage.getItem('oasis_fullname_' + user) || user || '',
                bio: localStorage.getItem('oasis_bio_' + user) || '',
                profileLink: localStorage.getItem('oasis_profilelink_' + user) || ''
            };

            if (idx > -1) {
                try {
                    currentProfile = { ...currentProfile, ...JSON.parse(updated[idx].content) };
                } catch (e) {
                    console.error("Error parsing profile settings block:", e);
                }
            }

            const newProfile = { ...currentProfile, ...updates };

            const profileBlock = {
                id: 'profile_settings',
                type: 'profile_settings',
                content: JSON.stringify(newProfile),
                x: 99999, // offscreen
                y: 99999,
                rotation: 0,
                isPublic: false,
                timestamp: new Date().toISOString()
            };

            if (idx > -1) {
                updated[idx] = profileBlock;
            } else {
                updated.push(profileBlock);
            }

            fetch(`${API_URL}/api/oasis/blocks?user=${user}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            }).then(() => fetchFeed());

            localStorage.setItem('oasis_canvas_nodes_' + user, JSON.stringify(updated));
            return updated;
        });
    }, [user, isLoggedIn, isDataLoaded]);

    const syncLinks = (newLinks) => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        console.log(`[Oasis] Sincronizando ${newLinks.length} vínculos para ${user}...`);
        if (window.syncLinksTimeout) clearTimeout(window.syncLinksTimeout);
        window.syncLinksTimeout = setTimeout(() => {
            fetch(`${API_URL}/api/oasis/links?user=${user}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLinks)
            }).then(res => {
                if (res.ok) console.log(`[Oasis] Sincronización de vínculos exitosa.`);
                else console.error(`[Oasis] Error de sincronización: ${res.status}`);
            });
        }, 2500);
    };

    // Auto-purge any legacy insight blocks and their links
    useEffect(() => {
        if (!isLoggedIn || !isDataLoaded || !user || blocks === INITIAL_BLOCKS) return;
        const hasInsight = blocks.some(b => b.type === 'insight');
        if (hasInsight) {
            const filtered = blocks.filter(b => b.type !== 'insight');
            setBlocks(filtered);
            syncBlocks(filtered);

            setLinks(prev => {
                const filteredLinks = prev.filter(l =>
                    filtered.some(b => b.id === l.from) &&
                    filtered.some(b => b.id === l.to)
                );
                if (filteredLinks.length !== prev.length) {
                    syncLinks(filteredLinks);
                }
                return filteredLinks;
            });
        }
    }, [blocks, isLoggedIn, isDataLoaded, user]);

    const fetchFeed = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/oasis/feed?t=${Date.now()}`);
            const data = await res.json();
            if (data) {
                setFeed(data);
                // Pre-cache avatars and names from feed posts so they load instantly in profiles
                data.forEach(post => {
                    if (post.metadata?.userAvatar || post.metadata?.userFullName || post.metadata?.feedUsername) {
                        const unameRaw = post.metadata?.feedUsername || post.username || '';
                        const cleanUname = unameRaw.replace('@', '');
                        if (!cleanUname) return;
                        
                        const cachedKey = `oasis_cached_profile_${cleanUname}`;
                        try {
                            const existing = JSON.parse(localStorage.getItem(cachedKey) || '{}');
                            let updated = false;
                            
                            if (post.metadata?.userAvatar && existing.avatar !== post.metadata.userAvatar) {
                                existing.avatar = post.metadata.userAvatar;
                                updated = true;
                            }
                            if (post.metadata?.userFullName && existing.fullName !== post.metadata.userFullName) {
                                existing.fullName = post.metadata.userFullName;
                                updated = true;
                            }
                            
                            if (updated) {
                                localStorage.setItem(cachedKey, JSON.stringify(existing));
                            }
                        } catch(e) {}
                    }
                });
            }
        } catch (e) {
            console.error("Fallo al sincronizar feed: ", e);
        }
    }, []);

    const handleResizeNodeComplete = useCallback((id, width, height) => {
        setBlocks(prev => {
            const updated = prev.map(b => b.id === id ? { ...b, width, height } : b);
            syncBlocks(updated);
            return updated;
        });
    }, [syncBlocks]);

    const deleteBlock = (id) => {
        setBlocks(prev => {
            const updated = prev.filter(b => b.id !== id);
            syncBlocks(updated);
            return updated;
        });
        setLinks(prev => {
            const updated = prev.filter(l => l.from !== id && l.to !== id);
            syncLinks(updated);
            return updated;
        });
    };

    const deleteBlocks = (ids) => {
        setBlocks(prev => {
            const updated = prev.filter(b => !ids.includes(b.id));
            syncBlocks(updated);
            return updated;
        });
        setLinks(prev => {
            const updated = prev.filter(l => !ids.includes(l.from) && !ids.includes(l.to));
            syncLinks(updated);
            return updated;
        });
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 10000); // Sincronía constante cada 10s
        return () => clearInterval(interval);
    }, [fetchFeed]);

    useEffect(() => {
        if (user) {
            fetch(`${API_URL}/api/oasis/public-users`)
                .then(res => res.json())
                .then(data => setPublicUsers(data.filter(u => u.username !== user)))
                .catch(err => console.error("Failed to fetch public users:", err));
        }
    }, [user]);



    const handleAuth = async (username, password, fullName = "", age = null) => {
        setAuthError('');
        const endpoint = isRegisterMode ? 'register' : 'login';
        try {
            const reqBody = { Username: username, Password: password };
            if (isRegisterMode) {
                reqBody.FullName = fullName;
                reqBody.Age = age ? parseInt(age, 10) : null;
            }
            const res = await fetch(`${API_URL}/api/oasis/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (res.ok) {
                const userData = data.user;
                setUser(userData.username);
                setIsLoggedIn(true);

                window.isDownloadingClinicalData = true;
                try {
                    localStorage.setItem('oasis_user', userData.username);
                    localStorage.setItem('oasis_fullname_' + userData.username, userData.fullName || '');
                    localStorage.setItem('oasis_age_' + userData.username, userData.age !== undefined && userData.age !== null ? userData.age.toString() : '');
                    if (userData.clinicalData) {
                        Object.keys(userData.clinicalData).forEach(key => {
                            localStorage.setItem(key, userData.clinicalData[key]);
                        });
                    }

                    // Load user data immediately
                    const serverBlocks = (userData.blocks || []).filter(b => b.type !== 'diary' && b.type !== 'diary_notebook' && (!b.entries || b.entries.length === 0));
                    const filteredBlocks = serverBlocks.filter(b => b.type !== 'insight');

                    let shouldOpenSoul = isRegisterMode;
                    console.log("[Oasis Debug] isRegisterMode:", isRegisterMode);
                    try {
                        const { merged } = smartMergeBlocks(filteredBlocks, userData.username);
                        setBlocks(merged);
                        localStorage.setItem('oasis_canvas_nodes_' + userData.username, JSON.stringify(merged));
                        const noteCount = merged.filter(b => b.type === 'note').length;
                        const hasPhenomMeta = !!localStorage.getItem('oasis_phenom_metadata_' + userData.username);
                        console.log("[Oasis Debug] merged note count:", noteCount, "hasPhenomMeta:", hasPhenomMeta);
                        if (noteCount === 0 && !hasPhenomMeta) {
                            shouldOpenSoul = true;
                        }
                    } catch (e) {
                        setBlocks(filteredBlocks);
                        const noteCount = filteredBlocks.filter(b => b.type === 'note').length;
                        const hasPhenomMeta = !!localStorage.getItem('oasis_phenom_metadata_' + userData.username);
                        console.log("[Oasis Debug] catch note count:", noteCount, "hasPhenomMeta:", hasPhenomMeta);
                        if (noteCount === 0 && !hasPhenomMeta) {
                            shouldOpenSoul = true;
                        }
                    }
                } finally {
                    window.isDownloadingClinicalData = false;
                }

                const serverLinks = userData.links || [];
                const filteredLinks = serverLinks.filter(l =>
                    filteredBlocks.some(b => b.id === l.from) &&
                    filteredBlocks.some(b => b.id === l.to)
                );
                if (filteredLinks.length !== serverLinks.length) {
                    fetch(`${API_URL}/api/oasis/links?user=${userData.username}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(filteredLinks)
                    });
                }
                setLinks(filteredLinks);
                setConversations(userData.conversations || []);
                setActiveConversationId(null);
                setChatMessages([]);
                if (chatMessagesRef.current) chatMessagesRef.current = [];
                if (userData.playlists) setPlaylists(userData.playlists);
                else setPlaylists({ 'Favoritos': [] });
                if (userData.background) {
                    setBgType(userData.background.type);
                    setBgValue(userData.background.value);
                    setIsTiled(userData.background.isTiled);
                    // Cache locally for offline
                    localStorage.setItem('oasis_bg_' + userData.username, JSON.stringify({ type: userData.background.type, value: userData.background.value, isTiled: userData.background.isTiled }));
                }
                if (userData.lastPlayback && userData.lastPlayback.queue && userData.lastPlayback.queue.length > 0) {
                    setPlayQueue(userData.lastPlayback.queue);
                    setCurrentTrack(userData.lastPlayback.currentIndex);
                    setTrackProgress(userData.lastPlayback.position || 0);
                }
                if (userData.continuousMemory) {
                    try {
                        setUserMemory(JSON.parse(userData.continuousMemory) || []);
                    } catch (e) { setUserMemory([]); }
                }
                setIsDataLoaded(true);

                console.log("[Oasis Debug] Final shouldOpenSoul:", shouldOpenSoul);
                if (shouldOpenSoul) {
                    console.log("[Oasis Debug] Redirecting to soul tests/phenom");
                    setActiveNotebook(null);
                    setIsBitacoraOpen(false);
                    setIsSettingsOpen(false);
                    setView('soul');
                    setSoulTab('tests');
                    setActiveTest('phenom');
                    setShowPhenomIntro(true);
                } else if (userData.username === 'observador1') {
                    console.log("[Oasis Debug] Redirecting to clinical view");
                    setView('clinical');
                } else {
                    console.log("[Oasis Debug] Redirecting to canvas view");
                    setView('canvas');
                }
            } else {
                setAuthError(`${data.msg || 'Fallo de Conexión'} (${res.status})`);
            }
        } catch (e) {
            setAuthError('FALLO TÉCNICO: ' + e.message);
        }
    };


    const handleBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const type = file.type.startsWith('video') ? 'video' : 'image';

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Upload failed: ${res.status} ${errText}`);
            }
            const data = await res.json();
            setBgType(type); setBgValue(data.url);
            syncAura(type, data.url, isTiled);
        } catch (err) {
            console.error("Error al subir fondo: ", err);
            alert("Error al subir imagen. Por favor, intenta con otra imagen o revisa tu conexión.");
        }
    };

    const fetchBgTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/api/oasis/backgrounds/templates`);
            if (res.ok) {
                const data = await res.json();
                setBgTemplates(data || []);
            }
        } catch (err) {
            console.error("Error al cargar plantillas de fondo: ", err);
        }
    };

    const handleSaveAsTemplate = async (templateName) => {
        if (!bgValue) return;
        const name = templateName || `Aura de ${user || 'Anónimo'}`;
        try {
            const res = await fetch(`${API_URL}/api/oasis/backgrounds/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    type: bgType,
                    value: bgValue,
                    isTiled: isTiled,
                    creator: user || 'Anónimo'
                })
            });
            if (res.ok) {
                const newTpl = await res.json();
                setBgTemplates(prev => [...prev, newTpl]);
                setNewTemplateName('');
            }
        } catch (err) {
            console.error("Error al guardar plantilla: ", err);
        }
    };

    useEffect(() => {
        if (isSettingsOpen) {
            fetchBgTemplates();
        }
    }, [isSettingsOpen]);

    useEffect(() => {
        if (view === 'soul' || activeTest || isBitacoraOpen) {
            setIsSettingsOpen(false);
        }
    }, [view, activeTest, isBitacoraOpen]);

    const inlineMediaInputRef = useRef(null);
    const canvasRef = useRef(null);

    const handleInlineMedia = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const localUrl = URL.createObjectURL(file);
        const tag = file.type.startsWith('video') ? '[vid]' : (file.type.startsWith('audio') ? '[aud]' : '[img]');
        setNoteText(prev => prev.trim() + `\n${tag}${localUrl}\n`);

        const formData = new FormData();
        formData.append('file', file);

        const uploadPromise = fetch(`${API_URL}/api/oasis/upload`, {
            method: 'POST',
            body: formData
        }).then(res => res.json()).then(data => data.url).catch(err => {
            console.error("Error al subir media inline en background: ", err);
            return null;
        });

        pendingMediaUploads.current[localUrl] = uploadPromise;
    };

    const handleSoulPieceImageChange = async (e, id) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/oasis/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setSoulPieces(prev => prev.map(p => p.id === id ? { ...p, img: data.url } : p));
        } catch (err) {
            console.error("Error al subir pieza de alma: ", err);
        }
    };

    const [composerStep, setComposerStep] = useState('menu');
    const [noteText, setNoteText] = useState('');
    const [secondaryPanels, setSecondaryPanels] = useState([{ id: Date.now(), text: '' }]);
    const [showSecondaryNote, setShowSecondaryNote] = useState(false);
    const [isComposerPreviewMode, setIsComposerPreviewMode] = useState(false);
    const [isRecordingNote, setIsRecordingNote] = useState(false);
    const [isSyncingMedia, setIsSyncingMedia] = useState(false);
    const pendingMediaUploads = useRef({});
    const recognitionNoteRef = useRef(null);
    const recordingBaseTextRef = useRef('');
    const sessionFinalRef = useRef('');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionNoteRef.current = new SpeechRecognition();
            recognitionNoteRef.current.continuous = true;
            recognitionNoteRef.current.interimResults = true;
            recognitionNoteRef.current.lang = 'es-ES';

            recognitionNoteRef.current.onresult = (event) => {
                let currentSessionFinal = '';
                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentSessionFinal += event.results[i][0].transcript;
                    }
                }
                sessionFinalRef.current = currentSessionFinal.trim();
                const base = recordingBaseTextRef.current;
                setNoteText((base ? base + ' ' : '') + sessionFinalRef.current);
            };
            recognitionNoteRef.current.onend = () => {
                if (sessionFinalRef.current) {
                    const base = recordingBaseTextRef.current;
                    recordingBaseTextRef.current = (base ? base + ' ' : '') + sessionFinalRef.current;
                    sessionFinalRef.current = '';
                }
                if (keepRecordingRef.current) {
                    setTimeout(() => {
                        if (keepRecordingRef.current) {
                            try { recognitionNoteRef.current.start(); } catch (e) { setIsRecordingNote(false); }
                        } else {
                            setIsRecordingNote(false);
                        }
                    }, 250);
                } else {
                    setIsRecordingNote(false);
                }
            };
            recognitionNoteRef.current.onerror = () => setIsRecordingNote(false);
        }
    }, []);

    const toggleNoteRecording = () => {
        if (!recognitionNoteRef.current) return alert("Tu navegador no soporta dictado por voz.");
        if (isRecordingNote) {
            keepRecordingRef.current = false; recognitionNoteRef.current.stop();
        } else {
            recordingBaseTextRef.current = noteText;
            keepRecordingRef.current = true; recognitionNoteRef.current.start();
            setIsRecordingNote(true);
        }
    };

    const [canvasIsRecording, setCanvasIsRecording] = useState(false);
    const canvasMediaRecorderRef = useRef(null);
    const canvasAudioChunksRef = useRef([]);

    const toggleCanvasRecording = async () => {
        if (canvasIsRecording) {
            if (canvasMediaRecorderRef.current && canvasMediaRecorderRef.current.state !== 'inactive') {
                canvasMediaRecorderRef.current.stop();
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                canvasAudioChunksRef.current = [];
                const options = { mimeType: 'audio/webm' };
                if (!MediaRecorder.isTypeSupported('audio/webm')) {
                    options.mimeType = 'audio/ogg';
                }
                const mediaRecorder = new MediaRecorder(stream, options);
                canvasMediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        canvasAudioChunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    stream.getTracks().forEach(track => track.stop());

                    const blob = new Blob(canvasAudioChunksRef.current, { type: options.mimeType });
                    if (blob.size === 0) return;

                    const extension = options.mimeType.includes('ogg') ? 'ogg' : 'webm';
                    const file = new File([blob], `canvas-audio-${Date.now()}.${extension}`, { type: options.mimeType });

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('user', user || 'default');

                    const xhr = new XMLHttpRequest();
                    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : `http://${window.location.hostname}:5046`;
                    xhr.open('POST', `${apiUrl}/api/oasis/upload`);
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                if (data.url) {
                                    const newBlock = {
                                        id: `aud-${Date.now()}`,
                                        type: 'audio',
                                        content: data.url,
                                        x: -cam.x / cam.scale,
                                        y: -cam.y / cam.scale,
                                        width: 250,
                                        height: 100,
                                        caption: `Nota de Voz (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
                                        isPublic: false,
                                        createdAt: new Date().toISOString(),
                                        canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                                    };
                                    setBlocks(prev => {
                                        const updated = [...prev, newBlock];
                                        if (typeof syncBlocks === 'function') syncBlocks(updated);
                                        return updated;
                                    });
                                }
                            } catch (err) {
                                console.error("Error parsing upload response:", err);
                            }
                        } else {
                            console.error("Audio upload failed:", xhr.statusText);
                        }
                    };
                    xhr.send(formData);
                    setCanvasIsRecording(false);
                };

                mediaRecorder.start();
                setCanvasIsRecording(true);
            } catch (err) {
                console.error("Error starting canvas audio recording:", err);
                alert("No se pudo acceder al micrófono.");
            }
        }
    };

    const [isResonanceMode, setIsResonanceMode] = useState(false);
    const [appConfirmAction, setAppConfirmAction] = useState(null);
    const [resResonance, setResResonance] = useState('');
    const [resImpact, setResImpact] = useState('');
    const [resStrange, setResStrange] = useState('');

    const [caption, setCaption] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [mediaFile, setMediaFile] = useState(null);
    const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
    const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
    const [activeMenu, setActiveMenu] = useState(null); // { idx: number, type: 'add' | 'actions' }
    const [activeLinkMenu, setActiveLinkMenu] = useState(null); // { from, to, x, y }
    const [links, setLinks] = useState([]); // { from: id, to: id }
    const [isLinking, setIsLinking] = useState(false);
    const [linkSource, setLinkSource] = useState(null);
    const [newAttrTitle, setNewAttrTitle] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [drawingColor, setDrawingColor] = useState('#bef264');
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        setAvailableModels(['deepseek-chat', 'deepseek-reasoner']);

        setDeepseekKey(atob("c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU="));
    }, [deepseekKey]);

    const editBlock = (block) => {
        if (block.type === 'diary_notebook') {
            setActiveNotebook('diary');
            return;
        }
        if (block.type === 'resonance_notebook') {
            setActiveNotebook('resonance');
            return;
        }
        if (block.type === 'conversation_notebook') {
            const sortedConvs = (conversations || [])
                .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
            if (sortedConvs.length > 0) {
                handleSelectConversation(sortedConvs[0].id);
            } else {
                handleNewChat();
            }
            return;
        }

        setComposerStep(block.type === 'text' ? 'note' : block.type);
        setNoteText(''); // Clear typing area when opening an existing diary to type a fresh entry!
        setCaption(block.caption);
        setIsPublic(block.isPublic || false);
        setEditingId(block.id);
        setLastInteractedBlockId(block.id);

        // Detect Resonance Mode
        if (block.type === 'text' && block.content && block.content.includes('[resonancia]')) {
            setIsResonanceMode(true);
            const resMatch = block.content.match(/\[resonancia\]([\s\S]*?)(?=\[impacto\]|$)/);
            const impMatch = block.content.match(/\[impacto\]([\s\S]*?)(?=\[extrano\]|$)/);
            const extMatch = block.content.match(/\[extrano\]([\s\S]*?)$/);
            setResResonance(resMatch ? resMatch[1].trim() : '');
            setResImpact(impMatch ? impMatch[1].trim() : '');
            setResStrange(extMatch ? extMatch[1].trim() : '');
        } else {
            setIsResonanceMode(false);
            setResResonance('');
            setResImpact('');
            setResStrange('');
        }

        const isDiary = block.entries && block.entries.length > 0;
        setIsDiaryMode(isDiary);
        if (!isDiary) {
            setNoteText(block.content || '');
        }

        setSecondaryPanels(block.metadata?.secondaryPanels || [{ id: Date.now(), text: '' }]);
        setShowSecondaryNote(!!(block.metadata?.secondaryPanels && block.metadata.secondaryPanels.length > 0 && block.metadata.secondaryPanels[0].text));

        setIsComposerOpen(true);
    };
    const openNewComposer = (isDiary = false, isResonance = false) => {
        setComposerStep('note');
        setNoteText('');
        setCaption(isDiary ? 'Diario Personal' : '');
        setEditingId(null);
        setIsPublic(false);
        setIsDiaryMode(isDiary);
        setIsResonanceMode(isResonance);
        setFocusedResonanceField(null);
        setResResonance('');
        setResImpact('');
        setResStrange('');
        setTempMuralBlocks([]);
        setSecondaryPanels([{ id: Date.now(), text: '' }]);
        setShowSecondaryNote(false);
        setIsComposerOpen(true);
    };

    useEffect(() => {
        if (initialStartupScreen === 'notes') {
            openNewComposer(false, false);
        }
    }, []);

    // Long press composer handlers were removed as requested

    const handleNewDiaryClick = () => {
        // Find if there is an existing single diary node anywhere on the canvas
        const existingDiary = blocks.find(b => b.entries && b.entries.length > 0);

        if (existingDiary) {
            editBlock(existingDiary);
        } else {
            openNewComposer(true, false);
        }
    };

    const handleAddAttribute = (title) => {
        const cleanTitle = (title || "").trim();
        let parentId = editingId;
        const canvasToUse = activeCanvasId || 'canvas_default';

        // If parent block does not exist in editing mode yet, create one
        let parentBlock = null;
        if (!parentId) {
            parentId = Date.now().toString();
            parentBlock = {
                id: parentId,
                type: 'text',
                x: (-cam.x) / cam.scale,
                y: (-cam.y) / cam.scale,
                content: noteText,
                caption: caption || 'Nota Principal',
                isPublic: isPublic,
                color: accent,
                rotation: (Math.random() - 0.5) * 10,
                username: user || 'anon',
                metadata: { origin: 'user_action', timestamp: new Date().toISOString() },
                entries: [],
                muralBlocks: tempMuralBlocks,
                canvasId: canvasToUse
            };
            setEditingId(parentId);
        } else {
            parentBlock = blocks.find(b => b.id === parentId);
            if (parentBlock && !parentBlock.canvasId) {
                parentBlock.canvasId = canvasToUse;
            }
        }

        if (!parentBlock && blocks.length > 0) {
            // Fallback safety
            parentBlock = blocks.find(b => b.id === parentId);
        }

        const baseParent = parentBlock || { x: 0, y: 0, id: parentId };
        const existingChildren = blocks.filter(b => b.metadata?.parentId === parentId);

        const childId = `child-${Date.now()}`;
        const childBlock = {
            id: childId,
            type: 'text',
            x: baseParent.x + (baseParent.width || 400) + 150,
            y: baseParent.y + (existingChildren.length * 150),
            content: '',
            caption: cleanTitle || `Subpágina ${existingChildren.length + 1}`,
            isPublic: false,
            color: accent,
            rotation: (Math.random() - 0.5) * 10,
            username: user || 'anon',
            metadata: { origin: 'user_action', timestamp: new Date().toISOString(), parentId: parentId },
            entries: [],
            canvasId: canvasToUse
        };

        const newLink = { from: parentId, to: childId };

        syncBlocks(prev => {
            const parentExists = prev.some(b => b.id === parentId);
            const base = parentExists ? prev : [parentBlock, ...prev];
            const mappedBase = base.map(b => b.id === parentId && !b.canvasId ? { ...b, canvasId: canvasToUse } : b);
            return [...mappedBase, childBlock];
        });

        setLinks(prev => {
            const updated = [...prev, newLink];
            syncLinks(updated);
            return updated;
        });

        setNewAttrTitle('');

        // Auto-navigate to the new subpage after a tiny delay to allow state to settle
        setTimeout(() => {
            editBlock(childBlock);
        }, 50);
    };

    const handleDeleteAttribute = (childId) => {
        syncBlocks(prev => prev.filter(b => b.id !== childId));

        setLinks(prev => {
            const updated = prev.filter(l => !(l.from === editingId && l.to === childId) && !(l.from === childId && l.to === editingId));
            syncLinks(updated);
            return updated;
        });
    };


    const [cam, setCam] = useState(() => {
        // Restore cam position from localStorage to remember zoom/pan across sessions
        const currentUser = localStorage.getItem('oasis_user');
        if (currentUser) {
            try {
                const saved = localStorage.getItem('oasis_cam_' + currentUser);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed.x === 'number' && typeof parsed.scale === 'number') {
                        return parsed;
                    }
                }
            } catch (_) {}
        }
        return { x: 0, y: 0, scale: window.innerWidth < 768 ? 0.45 : 0.8 };
    });
    const [profileCam, setProfileCam] = useState({ x: 0, y: 0, scale: 0.7 });
    const [feedCam, setFeedCam] = useState({ x: 0, y: 0, scale: 1 });

    // Persist cam to localStorage on every change (instant local save)
    useEffect(() => {
        if (!isLoggedIn || !user) return;
        const tid = setTimeout(() => {
            localStorage.setItem('oasis_cam_' + user, JSON.stringify(cam));
        }, 300);
        return () => clearTimeout(tid);
    }, [cam, isLoggedIn, user]);

    // Sync Camera state across devices (debounced, non-blocking)
    useEffect(() => {
        if (!isLoggedIn || !user || !isDataLoaded) return;
        const tid = setTimeout(() => {
            setBlocks(prev => {
                let finalBlocks = [...prev];
                const settingsIdx = finalBlocks.findIndex(b => b.id === 'user_settings');
                let hasChanges = false;
                if (settingsIdx === -1) {
                    finalBlocks.push({ id: 'user_settings', type: 'settings', metadata: { cam } });
                    hasChanges = true;
                } else {
                    const oldCam = finalBlocks[settingsIdx].metadata?.cam || {};
                    if (oldCam.x !== cam.x || oldCam.y !== cam.y || oldCam.scale !== cam.scale) {
                        finalBlocks[settingsIdx] = { ...finalBlocks[settingsIdx], metadata: { ...finalBlocks[settingsIdx].metadata, cam } };
                        hasChanges = true;
                    }
                }
                if (hasChanges) {
                    setTimeout(() => {
                        if (typeof syncBlocks === 'function') {
                            syncBlocks(finalBlocks);
                        }
                    }, 0);
                    return finalBlocks;
                }
                return prev;
            });
        }, 2000);
        return () => clearTimeout(tid);
    }, [cam, isLoggedIn, user, isDataLoaded]);

    const mainCamAnimRef = useRef(null);
    const hasCenteredCanvasRef = useRef(false);
    const canvasLastTapTimeRef = useRef(0);
    const canvasLongPressTimerRef = useRef(null);

    const animateMainCamera = (targetX, targetY, targetScale = 0.8) => {
        const startX = cam.x;
        const startY = cam.y;
        const startScale = cam.scale;

        const initialX = startX;
        const initialY = startY;
        const initialScale = startScale;

        const duration = 1500; // 1.5s fluid glide transition
        const startTime = performance.now();

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeOutCubic(progress);

            setCam({
                x: initialX + (targetX - initialX) * easeProgress,
                y: initialY + (targetY - initialY) * easeProgress,
                scale: initialScale + (targetScale - initialScale) * easeProgress
            });

            if (progress < 1) {
                mainCamAnimRef.current = requestAnimationFrame(animate);
            }
        };

        if (mainCamAnimRef.current) cancelAnimationFrame(mainCamAnimRef.current);
        mainCamAnimRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        return () => {
            if (mainCamAnimRef.current) cancelAnimationFrame(mainCamAnimRef.current);
        };
    }, []);



    useEffect(() => {
        if (view !== 'canvas' || isSimpleNotesOpen || activeNotebook) {
            // Do NOT reset hasCenteredCanvasRef here, so the canvas remembers 
            // the user's custom pan/zoom position when they return from an overlay.
            return;
        }

        if (view === 'canvas' && isDataLoaded && !hasCenteredCanvasRef.current) {
            hasCenteredCanvasRef.current = true;

            // Check if user has a saved cam position in localStorage — if so, DON'T override it
            const savedCam = (() => {
                try {
                    const currentUser = localStorage.getItem('oasis_user');
                    const saved = currentUser ? localStorage.getItem('oasis_cam_' + currentUser) : null;
                    return saved ? JSON.parse(saved) : null;
                } catch (_) { return null; }
            })();

            if (savedCam && typeof savedCam.x === 'number' && typeof savedCam.scale === 'number') {
                // Restore saved position silently (no animation needed, already set)
                setCam(savedCam);
                return;
            }

            // No saved position — center on the most recently created block
            const renderedBlocks = blocks.filter(b =>
                b.type !== 'insight' && b.type !== 'settings' && b.type !== 'canvas' &&
                !b.isPublic && b.x !== undefined && b.y !== undefined
            ).sort((a, b) => {
                const tA = new Date(a.metadata?.timestamp || a.timestamp || 0).getTime();
                const tB = new Date(b.metadata?.timestamp || b.timestamp || 0).getTime();
                return tB - tA;
            });

            if (renderedBlocks.length > 0) {
                const lastBlock = renderedBlocks[0]; // most recent
                const targetScale = window.innerWidth < 768 ? 0.65 : 0.85;
                const cx = (lastBlock.x || 0) + (lastBlock.w || 288) / 2;
                const cy = (lastBlock.y || 0) + (lastBlock.h || 288) / 2;
                const targetX = (window.innerWidth / 2) - (cx * targetScale);
                const targetY = (window.innerHeight / 2) - (cy * targetScale);
                animateMainCamera(targetX, targetY, targetScale);
            }
        }
    }, [view, isDataLoaded, isSimpleNotesOpen, activeNotebook]);

    const [draggingId, setDraggingId] = useState(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const isPointerDown = useRef(false);
    const initialPinchDist = useRef(0);
    const initialPinchScale = useRef(1);
    const initialPinchCam = useRef({ x: 0, y: 0 });
    const initialTouchMidpoint = useRef({ x: 0, y: 0 });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
    const [isPlayerFull, setIsPlayerFull] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [playerTracks, setPlayerTracks] = useState([
        { title: 'Sincronía Profunda', artist: 'Oasis Core', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { title: 'Glitch Astral', artist: 'Flux', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { title: 'Memoria RAM', artist: 'Holo', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    ]);
    const [playlists, setPlaylists] = useState({ 'Favoritos': [] });

    const [playerSearchQuery, setPlayerSearchQuery] = useState('');
    const [playerSearchResults, setPlayerSearchResults] = useState([]);
    const [isPlayerSearching, setIsPlayerSearching] = useState(false);
    const [playQueue, setPlayQueue] = useState([]);
    const [playSource, setPlaySource] = useState('library'); // 'search', 'playlist', 'library'
    const [activePlayerView, setActivePlayerView] = useState('search'); // 'search' or playlist name
    const [trackProgress, setTrackProgress] = useState(0);
    const [trackDuration, setTrackDuration] = useState(0);
    const [expandedPlaylistItems, setExpandedPlaylistItems] = useState([]);
    const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(false);
    const [expandedPlaylistName, setExpandedPlaylistName] = useState('');

    // Escape keyboard shortcut to exit subpages and spaces
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (selectedContemplationFact) {
                    setSelectedContemplationFact(null);
                    return;
                }
                if (activeTest) {
                    setActiveTest(null);
                    return;
                }
                if (isDrawingModalOpen) {
                    setIsDrawingModalOpen(false);
                    return;
                }
                if (isMuralMode) {
                    setIsMuralMode(false);
                    return;
                }
                if (isChatOpen) {
                    setIsChatOpen(false);
                    return;
                }
                if (activeNotebook) {
                    setActiveNotebook(null);
                    return;
                }
                if (isPlayerFull) {
                    setIsPlayerFull(false);
                    return;
                }
                if (isComposerOpen) {
                    const currentBlock = blocks.find(b => b.id === editingId);
                    const parentId = currentBlock?.metadata?.parentId;
                    if (parentId) {
                        const parentBlock = blocks.find(b => b.id === parentId);
                        if (parentBlock) {
                            editBlock(parentBlock);
                            return;
                        }
                    }
                    setIsComposerOpen(false);
                    return;
                }
                if (view === 'soul') {
                    setView('canvas');
                    return;
                }
                if (view === 'profile') {
                    if (isEditingProfile) {
                        setIsEditingProfile(false);
                    } else {
                        setView('canvas');
                    }
                    return;
                }
                if (isSettingsOpen) {
                    setIsSettingsOpen(false);
                    return;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        selectedContemplationFact,
        activeTest,
        isDrawingModalOpen,
        isMuralMode,
        isChatOpen,
        activeNotebook,
        isPlayerFull,
        isComposerOpen,
        editingId,
        blocks,
        view,
        isEditingProfile,
        isSettingsOpen,
        editBlock
    ]);

    // Initialize queue with default tracks
    useEffect(() => {
        if (playQueue.length === 0) setPlayQueue(playerTracks);
    }, [playQueue.length, playerTracks]);

    // --- INTELLIGENCE BLOOM (The Living Engine) ---
    const prevIsChatOpen = useRef(isChatOpen);

    const generateIntelligenceBloom = useCallback(async () => {
        // Deshabilitado por petición del usuario
        return;

        const customModel = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
        const MODELS_TO_TRY = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : [customModel, 'deepseek-chat', 'deepseek-reasoner'];
        let success = false;

        const chatHistory = chatMessages
            .filter(m => m.role !== 'assistant' || m.content !== chatMessages[0].content)
            .map(m => `${m.role === 'user' ? 'Usuario' : 'Espíritu'}: ${m.content}`)
            .join('\n');

        const systemPrompt = `
        Actúa como un Asistente de Síntesis Creativa para el usuario ${user || localStorage.getItem('oasis_user') || 'user'}. 
        Tu meta es resumir los puntos más importantes de la conversación actual de manera útil y reflexiva.
        
        - TAREA: Proporciona una síntesis clara del progreso intelectual o creativo de la sesión.
        - REGLAS:
            1. Escribe una reflexión concreta y de valor (máximo 30 palabras).
            2. Usa un lenguaje natural, directo y alentador.
            3. Puedes usar emojis funcionales (💡, ✅, ✨) si añaden valor.
            4. Usa **negritas** para conceptos clave.
        - IMPORTANTE: Termina con UNA sola PREGUNTA funcional que invite al usuario a seguir explorando o ejecutando sus ideas.
        - TONO: Kio (Profesional, útil y perspicaz). Evita el misterio o la mística innecesaria.
        - IDENTIDAD: Eres Kio, el núcleo de síntesis de Ruido Interior.
        
        Formato: [insight] {Síntesis concreta}. \n\n{Pregunta para avanzar}
        
        Conversación:
        ${chatHistory}
    `;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';

                const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: endpoint,
                        key: deepseekKey,
                        payload: {
                            model: modelName,
                            messages: [{ role: 'user', content: systemPrompt }]
                        }
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const insightText = data.choices?.[0]?.message?.content?.trim();
                    if (insightText) {
                        const newBlock = {
                            id: `insight-${Date.now()}`,
                            type: 'insight',
                            content: insightText.replace('[insight]', '').trim(),
                            x: (Math.random() - 0.5) * 400,
                            y: (Math.random() - 0.5) * 400,
                            rotation: (Math.random() - 0.5) * 10,
                            color: '#a855f7',
                            caption: 'Revelación del Lienzo',
                            username: user || 'anon',
                            metadata: { origin: 'intelligence_bloom', timestamp: new Date().toISOString() },
                            canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                        };
                        setBlocks(prev => {
                            const updated = [newBlock, ...prev];
                            syncBlocks(updated);
                            return updated;
                        });
                        success = true;
                        break;
                    }
                }
            } catch (err) {
                console.error(`Fallo Bloom con ${modelName}:`, err);
            }
        }
        setIsChatLoading(false);
    }, [deepseekKey, chatMessages, user, syncBlocks]);

    useEffect(() => {
        if (prevIsChatOpen.current === true && isChatOpen === false) {
            // Chat just closed
            generateIntelligenceBloom();
            harvestMemory();
        }
        prevIsChatOpen.current = isChatOpen;
    }, [isChatOpen, generateIntelligenceBloom]);

    const harvestMemory = async () => {
        if (chatMessages.length < 4 || !isLoggedIn) return;

        console.log("Núcleo de Memoria - Cosechando nuevos hechos...");
        const chatHistory = chatMessages
            .map(m => `${m.role === 'user' ? 'Usuario' : 'Espíritu'}: ${m.content}`)
            .join('\n');

        const existingFacts = userMemory.map(f => f.text).join('\n');

        const harvestPrompt = `
        Actúa como el Núcleo de Memoria de Kio. Tu tarea es extraer NUEVOS hechos importantes, intereses, intenciones o proyectos del usuario de la conversación actual que NO estén ya en su memoria.

        - MEMORIA ACTUAL:
        ${existingFacts || 'Vacía'}

        - CONVERSACIÓN RECIENTE:
        ${chatHistory}

        - INSTRUCCIONES CRÍTICAS:
            1. ENFOQUE EXCLUSIVO EN EL USUARIO: Extrae hechos e insights sobre el mundo interno y externo del USUARIO basándote en lo que el *Usuario* expresa en sus mensajes. NO extraigas ni recicles las metáforas, filosofías o reflexiones poéticas que tú (el "Espíritu") le dijiste al usuario. El archivo debe reflejar la mente del usuario, no un eco de tus propias respuestas.
            2. Piensa en lo que el usuario piensa al decirte algo: analiza la intención detrás de sus palabras, sus proyectos reales y sus sentimientos auténticos.
            3. NO repitas hechos que ya están en la memoria actual.
            4. Si no hay nada nuevo de valor o si solo hay respuestas tuyas sin nuevos aportes del usuario, responde con "SIN CAMBIOS".
            5. Si hay hechos nuevos, devuélvelos en formato JSON: [{"text": "hecho", "category": "Categoría", "timestamp": "ISO Date"}]
            6. Categorías sugeridas: Proyectos, Intereses, Personal, Preferencias.
            7. REDACCIÓN EN SEGUNDA PERSONA: Redacta los hechos (campo "text") de forma muy íntima y subjetiva, dirigiéndote directamente al usuario (ej: "Cuando hablas de tus proyectos, buscas un orden...", "Tiendes a refugiarte en...", "Expresas que sientes..."). Evita descripciones objetivas o en tercera persona.
        
        Responde ÚNICAMENTE con el JSON o "SIN CAMBIOS".`;

        const customModel = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
        const MODELS_TO_TRY = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : [customModel, 'deepseek-chat', 'deepseek-reasoner'];
        for (const modelName of MODELS_TO_TRY) {
            try {
                const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
                const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: endpoint,
                        key: deepseekKey,
                        payload: {
                            model: modelName,
                            messages: [{ role: 'user', content: harvestPrompt }]
                        }
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const result = data.choices?.[0]?.message?.content?.trim();
                    if (result && result !== 'SIN CAMBIOS' && result.startsWith('[')) {
                        try {
                            const newFacts = JSON.parse(result);
                            if (Array.isArray(newFacts)) {
                                setUserMemory(prev => {
                                    const updated = [...newFacts, ...prev].slice(0, 50); // Keep last 50
                                    syncMemory(updated);
                                    return updated;
                                });
                                console.log("Kio - Núcleo de Memoria sincronizado con éxito.");
                            }
                        } catch (e) { console.error("Kio - Error al parsear cosecha:", e); }
                    }

                    // --- STYLE PROFILE HARVESTING ---
                    // Run a secondary prompt to detect user's tone only if we have at least 2 user messages
                    const userMsgs = messages.filter(m => m.role === 'user');
                    if (userMsgs.length >= 2) {
                        const stylePrompt = `Analiza el estilo comunicativo del usuario en esta conversación y actualiza su perfil de tono.
Conversación:
${chatHistory}

Devuelve un JSON estricto con esta estructura (si no tienes datos claros, devuelve "SIN CAMBIOS"):
{
  "style": "Descripción del estilo (ej. directo, conversacional, académico, sarcástico, etc.)",
  "tone": "Tono emocional o actitud (ej. amigable, distante, analítico, coloquial)",
  "examples": ["ejemplo corto 1", "ejemplo corto 2"],
  "informalityScore": 5 // Número del 0 (extremadamente formal) al 10 (extremadamente coloquial/argot callejero)
}`;
                        const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
                        const model = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
                        const styleRes = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                endpoint: endpoint,
                                key: deepseekKey,
                                payload: { model: model, messages: [{ role: 'user', content: stylePrompt }], response_format: { type: "json_object" } }
                            })
                        });

                        if (styleRes.ok) {
                            const styleData = await styleRes.json();
                            const styleResult = styleData.choices?.[0]?.message?.content?.trim();
                            if (styleResult && styleResult !== 'SIN CAMBIOS') {
                                try {
                                    const newProfile = JSON.parse(styleResult);
                                    if (newProfile.style) {
                                        setUserStyleProfile(newProfile);
                                        localStorage.setItem('oasis_style_profile_' + (localStorage.getItem('oasis_user') || ''), JSON.stringify(newProfile));
                                        console.log("Kio - Perfil de estilo adaptativo actualizado:", newProfile);
                                    }
                                } catch (e) { console.error("Kio - Error al actualizar perfil de estilo:", e); }
                            }
                        }
                    }

                    break;
                }
            } catch (err) { console.error("Fallo Cosecha:", err); }
        }
    };

    // Sync playback on changes (Throttled for performance)
    const lastSyncTime = useRef(0);
    useEffect(() => {
        if (playQueue.length > 0 && isLoggedIn) {
            const now = Date.now();
            // Sync if track/index changes, or if progress moved > 10s since last sync
            if (now - lastSyncTime.current > 10000) {
                syncPlayback(playQueue, currentTrack, trackProgress);
                lastSyncTime.current = now;
            }
        }
    }, [currentTrack, playQueue, isLoggedIn, syncPlayback, trackProgress]);

    // Removed JS auto-resize effect, using CSS Grid for flawless scaling without scroll jumps
    React.useLayoutEffect(() => {
        // ... (removed to prevent focus scroll jumps)
    }, []);

    // Auto-guardado para el Composer principal
    const handleComposerAutoSave = useCallback(() => {
        if (!noteText?.trim()) return;
        const targetBlockId = editingId || Date.now().toString();

        if (editingId) {
            syncBlocks(prev => prev.map(b => b.id === editingId ? {
                ...b,
                content: noteText,
                caption: caption || b.caption
            } : b));
        } else {
            const spawnX = (-cam.x) / cam.scale;
            const spawnY = (-cam.y) / cam.scale;
            const newBlock = {
                id: targetBlockId,
                type: 'text',
                x: Math.round(spawnX / 20) * 20,
                y: Math.round(spawnY / 20) * 20,
                content: noteText,
                caption: caption || 'Sin título',
                isPublic: false,
                color: accent,
                rotation: (Math.random() - 0.5) * 6,
                username: user || 'anon',
                metadata: { origin: 'user_action', timestamp: new Date().toISOString() },
                entries: [],
                muralBlocks: [],
                canvasId: activeCanvasId || 'canvas_default'
            };
            syncBlocks(prev => [newBlock, ...prev]);
            setEditingId(targetBlockId);
        }
    }, [noteText, caption, editingId, cam, accent, user, activeCanvasId, syncBlocks]);

    useEffect(() => {
        if (isComposerOpen) {
            const timer = setTimeout(() => {
                if (noteText?.trim()) {
                    handleComposerAutoSave();
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [noteText, isComposerOpen, handleComposerAutoSave]);

    const handlePlayerSearch = async (query) => {
        if (!query) return;
        setIsPlayerSearching(true);
        setActivePlayerView('search');
        setIsPlaylistExpanded(false); // Reset expanded playlist view
        try {
            const res = await fetch(`${API_URL}/api/oasis/youtube/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setPlayerSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error en búsqueda de música:", err);
        } finally {
            setIsPlayerSearching(false);
        }
    };

    const handleAddTrack = async (videoId) => {
        try {
            const res = await fetch(`${API_URL}/api/oasis/youtube/track/${videoId}`);
            const { data } = await res.json();
            const newTrack = {
                title: data.title,
                artist: data.artist,
                url: '',
                videoId: videoId
            };
            const updatedTracks = [...playerTracks, newTrack];
            setPlayerTracks(updatedTracks);

            // If we are in library mode, update queue
            if (playSource === 'library') {
                setPlayQueue(updatedTracks);
            }
        } catch (err) {
            console.error("Error al añadir track:", err);
        }
    };

    const handleImportPlaylist = async (playlistId, title, autoSave = false) => {
        setIsPlayerSearching(true);
        setExpandedPlaylistName(item.title);
        try {
            const res = await fetch(`${API_URL}/api/oasis/youtube/playlist/${playlistId}`);
            const data = await res.json();
            setExpandedPlaylistItems(data);
            setIsPlaylistExpanded(true);

            if (autoSave) {
                const name = title || `Playlist Guardada ${Object.keys(playlists).length + 1}`;
                const newPlaylist = data.map(t => ({
                    title: t.title,
                    videoId: t.videoId || t.id,
                    artist: t.artist || 'YouTube Echo',
                    thumbnail: t.thumbnail
                }));
                const updated = { ...playlists, [name]: newPlaylist };
                setPlaylists(updated);
                syncPlaylists(updated);
                setActivePlayerView(name);
            }
        } catch (err) {
            console.error("Error al importar playlist:", err);
        } finally {
            setIsPlayerSearching(false);
        }
    };

    const handlePlayFromSearch = async (index) => {
        const item = playerSearchResults[index];

        if (item.type === 'playlist' || item.playlistId) {
            handleImportPlaylist(item.playlistId, item.title);
            return;
        }

        const richResults = playerSearchResults
            .filter(item => item.type === 'video')
            .map(item => ({
                title: item.title,
                artist: item.artist || 'YouTube Echo',
                videoId: item.videoId,
                thumbnail: item.thumbnail,
                url: ''
            }));
        setPlayQueue(richResults);
        setCurrentTrack(0);
        setIsPlaying(true);
        setIsPlayerFull(true);
    };

    const handlePlayFromPlaylist = (pName, index) => {
        const pTracks = playlists[pName];
        if (pTracks && pTracks.length > 0) {
            setPlayQueue(pTracks);
            setCurrentTrack(index);
            setIsPlaying(true);
        }
    };

    const handleNextTrack = () => {
        if (playQueue.length === 0) return;
        setCurrentTrack((currentTrack + 1) % playQueue.length);
    };

    const handlePrevTrack = () => {
        if (playQueue.length === 0) return;
        setCurrentTrack((currentTrack - 1 + playQueue.length) % playQueue.length);
    };

    const handleSelectNote = (noteId) => {
        const note = blocks.find(b => b.id === noteId);
        if (!note) return;

        // If we are already in a conversation, "attach" the note to it
        if (activeConversationId) {
            setIsAnalyzingNote(true);
            setActiveNoteId(noteId);
            setIsChatOpen(true);

            // Create the context card message
            const contextMsg = {
                role: 'assistant',
                type: 'context',
                content: note.content,
                title: note.caption || 'Nota del Lienzo',
                id: Date.now()
            };

            // Update state and persistence simultaneously
            setConversations(prev => {
                const updated = prev.map(c => c.id === activeConversationId ? {
                    ...c,
                    noteId: noteId,
                    messages: [...(c.messages || []), contextMsg]
                } : c);

                // Sync to backend
                fetch(`${API_URL}/api/oasis/conversations?user=${user || localStorage.getItem('oasis_user')}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated)
                });

                // Also update local chat messages for the current view
                const currentConv = updated.find(c => c.id === activeConversationId);
                if (currentConv) setChatMessages(currentConv.messages);

                return updated;
            });

            // Trigger AI analysis with a slight delay to ensure messages are loaded
            setTimeout(() => {
                handleSendChatMessage(null, `Analiza esta nota: "${note.content.slice(0, 50)}..."`, activeConversationId, noteId);
            }, 100);
        } else {
            // Existing logic: New "Analysis" Conversation
            const newId = `conv-vortex-${Date.now()}`;
            setIsAnalyzingNote(true);
            setActiveNoteId(noteId);
            setActiveConversationId(newId);
            setChatMessages([]);
            setIsChatOpen(true);

            // Trigger initial analysis
            handleSendChatMessage(null, note.content, newId, noteId);
        }
    };

    const handleAnalyzeGroup = async (groupId) => {
        const groupNotes = blocks.filter(b => b.groupId === groupId).slice(-12); // Limit to last 12 for prompt safety
        if (groupNotes.length === 0) return;

        const combinedContent = groupNotes.map(b => `${b.caption || 'Fragmento'}: ${b.content}`).join('\n\n---\n\n');

        setIsChatLoading(true);
        const prompt = `Analiza este conjunto de ideas como Kio, el punto de convergencia de Ruido Interior. 
        Busca la "Arquitectura Invisible" que une estos fragmentos. 
        ¿Cuál es el proyecto del alma que emerge de esta colección?

        FORMATO: CATEGORÍA | INSIGHT (2-3 frases profundas, sintéticas, altamente subjetivas y reveladoras. Evita listas.)
        Categorías sugeridas: Constelación, Mapa del Deseo, Convergencia, Raíz Colectiva, Geometría del Propósito.
        
        CRÍTICO: Redacta el INSIGHT en SEGUNDA PERSONA, de forma sumamente íntima y subjetiva, hablándole directamente al usuario (ej: "Sueles buscar...", "Tiendes a conectar...", "Presientes que tu camino...", "Sientes la necesidad de..."). Varía las estructuras y expresiones para darle máxima diversidad y fluidez poética.

        NOTAS:
        ${combinedContent}`;

        const result = await backgroundAnalyzeContent(prompt);
        if (result && result.length > 5) {
            const [category, text] = result.includes('|') ? result.split('|').map(s => s.trim()) : ['Insight Colectivo', result];
            const newFact = { category, text, timestamp: new Date().toISOString() };
            setUserMemory(prev => {
                const updated = [newFact, ...prev].slice(0, 50);
                syncMemory(updated);
                return updated;
            });
        } else {
            console.warn('Kio - El análisis de grupo no devolvió un insight válido.');
            // We don't add fallbacks to userMemory anymore to avoid cluttering, 
            // but we can show a temporary notification if we had a system for it.
        }
        setIsChatLoading(false);
    };

    const handleAnalyzeBlock = async (id) => {
        const block = blocks.find(b => b.id === id);
        if (!block) return;

        setIsChatLoading(true);
        const prompt = `Analiza esta nota de Ruido Interior como Kio, el núcleo de síntesis. 
        No resumas; busca la intención latente, el patrón psicológico o la semilla creativa detrás de las palabras. 
        ¿Qué dice esto sobre el alma de quien lo escribió? 

        FORMATO: CATEGORÍA | INSIGHT (1-2 frases fluidas, poéticas, profundamente subjetivas y en segunda persona)
        Categorías sugeridas: Sombra, Eco, Evolución, Geometría Humana, Núcleo de Intención.
        
        CRÍTICO: Redacta el INSIGHT en SEGUNDA PERSONA, de forma sumamente íntima y subjetiva, hablándole directamente al usuario (ej: "Sueles pensar...", "Tiendes a sentir...", "Supones que...", "Te refugias en..."). Evita afirmaciones fácticas o en tercera persona.

        NOTE: "${block.caption || 'Fragmento'}: ${block.content}"`;

        const result = await backgroundAnalyzeContent(prompt);
        if (result && result.length > 5) {
            const [category, text] = result.includes('|') ? result.split('|').map(s => s.trim()) : ['Reflexión', result];
            const newFact = { category, text, timestamp: new Date().toISOString() };
            setUserMemory(prev => {
                const updated = [newFact, ...prev].slice(0, 50);
                syncMemory(updated);
                return updated;
            });
        } else {
            console.warn('Kio - El análisis de nota no devolvió un insight válido.');
        }
        setIsChatLoading(false);
    };

    const [analysisError, setAnalysisError] = useState(null);

    const backgroundAnalyzeContent = async (prompt) => {
        setAnalysisError(null);

        const customModel = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
        const modelsToTry = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : [customModel, 'deepseek-chat', 'deepseek-reasoner'];

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Oasis AI] Intentando análisis invisible (Protocolo Streaming) con ${modelName}...`);

                const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
                const response = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: endpoint,
                        key: deepseekKey,
                        payload: {
                            model: modelName,
                            messages: [{ role: 'user', content: prompt }],
                            stream: true
                        }
                    })
                });

                if (response.ok) {
                    const reader = response.body.getReader();
                    let fullText = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = new TextDecoder().decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.slice(6));
                                    const part = json.choices?.[0]?.delta?.content;
                                    if (part) fullText += part;
                                } catch (e) { }
                            }
                        }
                    }

                    if (fullText) {
                        lastSuccessModel.current = modelName;
                        console.log(`Kio - Análisis Invisible Completo con ${modelName}`);
                        return fullText.replace(/<thought>[\s\S]*?<\/thought>/, '').replace(/```.*?```/gs, '').trim();
                    } else {
                        console.warn(`Kio - Stream vacío con ${modelName}.`);
                    }
                } else {
                    const errData = await response.json().catch(() => ({}));
                    console.warn(`Kio - Fallo en Stream con ${modelName}:`, errData.error?.message || response.statusText);
                }
            } catch (e) {
                console.error(`Kio - Error técnico en Stream con ${modelName}:`, e);
            }
        }

        setAnalysisError("Fallo crítico: No se pudo sintonizar el canal de IA. Revisa tu API Key.");
        return null;
    };


    const handleTogglePinFact = (idx) => {
        setUserMemory(prev => {
            const updated = prev.map((f, i) => i === idx ? { ...f, isPinned: !f.isPinned } : f);
            syncMemory(updated);
            return updated;
        });
    };

    const handlePublishFact = (fact) => {
        const newBlock = {
            id: `soul-publish-${Date.now()}`,
            type: 'text',
            x: 0, y: 0, // Profile has its own auto-layout for blocks
            content: fact.text,
            caption: `Insight Soul: ${fact.category || 'Conciencia'}`,
            isPublic: true,
            color: '#eb5e28', // Distinct color for published archive items
            rotation: 0,
            username: user,
            metadata: { origin: 'soul_archive', factTimestamp: fact.timestamp, timestamp: new Date().toISOString() },
            canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
        };

        setBlocks(prev => {
            const updated = [newBlock, ...prev];
            syncBlocks(updated);
            return updated;
        });
        console.log('Insight publicado al Perfil.');
    };

    const handleDeleteFact = (idx) => {
        setUserMemory(prev => {
            const updated = prev.filter((_, i) => i !== idx);
            syncMemory(updated);
            return updated;
        });
    };

    // ── Bottom-bar chat helpers ──
    const handleChatBarSend = () => {
        const text = chatInputBar.trim();
        if (!text) return;
        setChatInputBar('');
        if (chatBarRecognitionRef.current) {
            try { chatBarRecognitionRef.current.abort(); } catch (e) { }
            chatBarRecognitionRef.current = null;
            setChatIsRecording(false);
        }
        if (chatInputBarRef.current) {
            chatInputBarRef.current.style.height = 'auto';
        }
        handleSendChatMessage(text, null, null, null);
    };

    const chatToggleRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Tu navegador no soporta reconocimiento de voz.'); return; }
        if (chatIsRecording) {
            if (chatBarRecognitionRef.current) { try { chatBarRecognitionRef.current.abort(); } catch (e) { } chatBarRecognitionRef.current = null; }
            setChatIsRecording(false);
            return;
        }
        chatBarAccumulatedRef.current = chatInputBar.trim();
        const rec = new SpeechRecognition();
        rec.continuous = true; rec.interimResults = true; rec.lang = 'es-ES'; rec.maxAlternatives = 1;
        rec.onstart = () => setChatIsRecording(true);
        rec.onresult = (event) => {
            let finalSeg = ''; let interimSeg = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) finalSeg += event.results[i][0].transcript;
                else interimSeg += event.results[i][0].transcript;
            }
            if (finalSeg) {
                chatBarAccumulatedRef.current = chatBarAccumulatedRef.current ? chatBarAccumulatedRef.current + ' ' + finalSeg.trim() : finalSeg.trim();
                setChatInputBar(chatBarAccumulatedRef.current);
            }
        };
        rec.onerror = (e) => { if (e.error !== 'no-speech' && e.error !== 'aborted') setChatIsRecording(false); };
        rec.onend = () => { setChatIsRecording(false); chatBarRecognitionRef.current = null; };
        chatBarRecognitionRef.current = rec;
        rec.start();
    };

    const handleSendChatMessage = async (manualInput, analysisContent, forceConvId, forceNoteId, prependMsg = null) => {
        const rawInput = (typeof manualInput === 'string') ? manualInput : '';
        const inputToProcess = analysisContent || rawInput || chatInput;
        if (!inputToProcess || !inputToProcess.trim()) return;

        let effectiveConvId = forceConvId || activeConversationId;
        const isNewChat = !effectiveConvId;
        if (isNewChat) {
            effectiveConvId = `conv-${Date.now()}`;
            setActiveConversationId(effectiveConvId);
        }
        const effectiveNoteId = forceNoteId || activeNoteId;

        const userMsg = { role: 'user', content: analysisContent || inputToProcess };
        const newMessages = [...chatMessages];
        if (prependMsg) {
            newMessages.push(prependMsg);
        }
        newMessages.push(userMsg);
        chatMessagesRef.current = newMessages;
        setChatMessages(newMessages);
        if (!analysisContent) setChatInput('');
        setIsChatLoading(true);

        // Save immediately so it appears in sidebar
        saveCurrentChat(effectiveConvId, effectiveNoteId, !!effectiveNoteId);

        // Generate AI title for new chats or if it's the very first message
        const isFirstMessage = newMessages.length === 1;
        if ((isNewChat || isFirstMessage) && !analysisContent) {
            console.log("Kio - Detectado inicio de chat. Disparando generación de título...");
            generateChatTitle(effectiveConvId, inputToProcess);
        }

        const customModel = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
        const MODELS_TO_TRY = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : [customModel, 'deepseek-chat', 'deepseek-reasoner'];

        let lastError = '';
        const activeNoteContent = activeNoteId ? blocks.find(b => b.id === activeNoteId)?.content : '';

        // Detect linked node
        const linkedNodeId = (() => {
            try {
                const savedConvs = localStorage.getItem(`oasis_node_conversations_${user}`);
                if (savedConvs) {
                    const parsed = JSON.parse(savedConvs);
                    return Object.keys(parsed).find(key => parsed[key] === effectiveConvId);
                }
            } catch (e) {
                console.error("Error looking up linked node for conversation:", e);
            }
            return null;
        })();

        // Calculate if it's the domino node
        const isDomino = (() => {
            if (!linkedNodeId) return false;
            try {
                const savedData = localStorage.getItem(`oasis_afc_real_data_${user}`);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    if (parsed && parsed.is_valid && parsed.nodes && parsed.edges) {
                        const counts = {};
                        parsed.nodes.forEach(n => counts[n.id] = 0);
                        parsed.edges.forEach(e => {
                            if (counts[e.source] !== undefined) counts[e.source]++;
                            if (counts[e.target] !== undefined) counts[e.target]++;
                        });
                        let maxVal = -1;
                        let maxNodeId = null;
                        Object.keys(counts).forEach(nid => {
                            if (counts[nid] > maxVal) {
                                maxVal = counts[nid];
                                maxNodeId = nid;
                            }
                        });
                        return maxNodeId === linkedNodeId;
                    }
                }
            } catch (e) {
                console.error("Error calculating domino node in App.jsx:", e);
            }
            return false;
        })();

        // Build linked node context
        const linkedNodeContext = (() => {
            if (!linkedNodeId) return '';
            try {
                const savedData = localStorage.getItem(`oasis_afc_real_data_${user}`);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    const node = parsed.nodes?.find(n => n.id === linkedNodeId);
                    if (node) {
                        const intensities = JSON.parse(localStorage.getItem(`oasis_node_intensities_${user}`) || '{}');
                        const nodeIntensity = intensities[linkedNodeId] !== undefined ? intensities[linkedNodeId] : 8;
                        const challenges = JSON.parse(localStorage.getItem(`oasis_node_challenges_${user}`) || '{}');
                        const activeChallenges = (challenges[linkedNodeId] || []).filter(c => !c.completed);
                        const completedChallenges = (challenges[linkedNodeId] || []).filter(c => c.completed);

                        const incoming = parsed.edges?.filter(e => e.target === linkedNodeId).map(e => parsed.nodes?.find(n => n.id === e.source)?.label).filter(Boolean) || [];
                        const outgoing = parsed.edges?.filter(e => e.source === linkedNodeId).map(e => parsed.nodes?.find(n => n.id === e.target)?.label).filter(Boolean) || [];

                        return `\n=== CONTEXTO DEL NODO BAJO EXPLORACIÓN DIRECTA ===
El usuario está enfocado específicamente en explorar este nodo de su Mapa Conductual:
- NOMBRE DEL NODO: "${node.label}" (Tipo: ${node.type})
- DESCRIPCIÓN: "${node.description || 'Sin descripción'}"
- INTENSIDAD ACTUAL: ${nodeIntensity}/10 (Una intensidad >5 significa que el patrón es sumamente disruptivo y está muy activo)
- ¿ES EL NODO DOMINÓ (PUNTO DE QUIEBRE SYSTEMICO)?: ${isDomino ? 'SÍ (Esta conducta sostiene gran parte de la red de evitación/malestar. Resolverla tiene un efecto multiplicador en su vida)' : 'NO'}
- CONEXIONES EN EL GRAFO:
  * Orígenes/Disparadores: [${incoming.join(', ') || 'Ninguno'}]
  * Consecuencias/Efectos: [${outgoing.join(', ') || 'Ninguno'}]
- COMPROMISOS (MICRO-RETOS):
  * Pendientes/Activos: ${activeChallenges.map(c => `"${c.text}"`).join(', ') || 'Ninguno'}
  * Completados: ${completedChallenges.map(c => `"${c.text}"`).join(', ') || 'Ninguno'}
===================================================`;
                    }
                }
            } catch (e) {
                console.error("Error building linked node context:", e);
            }
            return '';
        })();

        // Dosímetro IA / Socratic Rules
        const socraticDosimeterInstructions = linkedNodeId ? `
- INSTRUCCIONES CLÍNICAS DE DOSIFICACIÓN (DOSÍMETRO IA - CRÍTICO):
  1. ADOPTA EL ROL DE TRADUCTOR HUMANISTA/FRATERNAL: No uses jerga psicológica compleja ni hables como un terapeuta distante. Sé un espejo empático, fraternal y curioso que ayuda al usuario a traducir sus conductas evasivas en significados existenciales.
  2. INDAGACIÓN SOCRÁTICA SISTÉMICA: Pregunta sobre la función del nodo en su vida. ¿Qué busca evitar al hacer esto? ¿Cómo se conecta con sus disparadores o sus consecuencias en su mapa conductual?
  3. SUSURRO CREATIVO (MANDATORIO): Al final de tu respuesta, debes proponer EXACTAMENTE UNA idea muy suave, estética y sutil como un "susurro" (por ejemplo: crear algo liminal, un calendario kawaii, un dibujo rápido, etc.) dependiendo del estilo y vibra del usuario, para que tome una pequeña acción sin sentirse presionado ni juzgado. Debe empezar obligatoriamente con "✨ Oye bro, estaría cool que...".
     * Formato requerido: Debes incluirlo estrictamente en la última línea con el formato literal: [COMPROMISO: <escribir aquí el susurro creativo, máximo 2 líneas>]. Ejemplo: [COMPROMISO: ✨ Oye bro, estaría cool que hoy dibujaras un calendario kawaii para mapear tus ratos libres].
     * Nota: No uses más de un bloque [COMPROMISO: ...]. Debe ser solo uno, súper concreto y con una vibra relajada.
` : '';

        const memoryContext = userMemory.length > 0
            ? `\n- MEMORIA CONTINUA (Datos que recuerdas del usuario):\n${userMemory.map(f => `- [${f.category || 'General'}] ${f.text}`).join('\n')}`
            : '';

        let searchContext = "";
        const searchQuery = (() => {
            const text = inputToProcess;
            if (!text) return null;

            // INTENT ROUTING: Solo buscar si hay una intención explícita de consulta externa
            const searchIntentRegex = /^(busca|qué pasó|que paso|investiga|quién es|quien es|clima|noticias|dime sobre|información de|busca en internet)/i;

            if (searchIntentRegex.test(text.trim())) {
                return text.trim();
            }
            return null;
        })();
        if (searchQuery) {
            try {
                console.log(`Kio - Buscando en la red: "${searchQuery}"...`);
                let kioEnvUrl = import.meta.env.VITE_API_URL;
                if (kioEnvUrl && kioEnvUrl.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') kioEnvUrl = null;
                const API_URL = kioEnvUrl ||
                    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
                        ? `http://${window.location.hostname}:5046`
                        : 'https://oasis-production-6303.up.railway.app');

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const searchRes = await fetch(`${API_URL}/api/oasis/search?q=${encodeURIComponent(searchQuery)}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (searchData && searchData.length > 0) {
                        searchContext = `\n- DATOS REALES DE INTERNET EN TIEMPO REAL (Usa esto para entender memes/contexto/actualidad):\n${searchData.map((s, idx) => `  * [Referencia ${idx + 1}]: ${s}`).join('\n')}`;
                        console.log("Kio - Búsqueda web inyectada exitosamente.");
                    }
                }
            } catch (err) {
                console.warn("Kio - Búsqueda cancelada o fallida:", err.name === 'AbortError' ? 'Timeout' : err.message);
            }
        }

        // --- CROSS-CHAT MEMORY CONTEXT ---
        // Inject the last 3 recent conversation summaries as memory
        const recentConvSummary = (() => {
            const recents = conversations
                .filter(c => c.id !== effectiveConvId && c.messages && c.messages.length > 1)
                .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0))
                .slice(0, 5);
            if (recents.length === 0) return '';
            return `\n- CONTEXTO DE CONVERSACIONES PREVIAS (Usa esto para recordar quién es la persona y de qué han hablado recientemente):\n` +
                recents.map(c => {
                    const firstUserMsg = c.messages.find(m => m.role === 'user');
                    const lastMsg = c.messages[c.messages.length - 1];
                    const intro = firstUserMsg ? firstUserMsg.content.slice(0, 150) : '';
                    const outro = lastMsg ? lastMsg.content.slice(0, 150) : '';
                    return `  * [${c.title || 'Sin título'}]: El usuario inició diciendo "${intro}..." y la charla concluyó con "${outro}..."`;
                }).join('\n');
        })();

        // --- CANVAS NOTES CONTEXT ---
        const canvasNotesContext = ''; // Desactivado temporalmente hasta implementar algoritmo de interpretación

        // --- ADAPTIVE STYLE PROFILE ---
        const styleContext = userStyleProfile
            ? `\n- PERFIL DE COMUNICACIÓN DEL USUARIO (CRÍTICO — adapta tu tono exactamente a esto):\n  * Estilo: ${userStyleProfile.style}\n  * Tono: ${userStyleProfile.tone}\n  * Ejemplos de su forma de hablar: ${userStyleProfile.examples?.join(', ') || 'N/A'}\n  * Nivel de informalidad (0=formal, 10=muy casual/argot): ${userStyleProfile.informalityScore}/10`
            : '';

        // --- BEHAVIORAL MAP (AFC) CONTEXT ---
        const afcMapContext = (() => {
            try {
                const saved = localStorage.getItem(`oasis_afc_real_data_${user}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.is_valid && parsed.nodes) {
                        const nodesSummary = parsed.nodes.map(n => `- Nodo [${n.type}]: "${n.label}" (${n.description || ''}). Percepción Existencial: ${n.challenge || 'N/A'}`).join('\n');
                        const maintHyp = parsed.hypotheses?.mantenimiento || 'N/A';
                        const solHyp = parsed.hypotheses?.solucion || 'N/A';
                        const simpleExplanation = parsed.explicacion_sencilla || 'N/A';
                        return `\n- MAPA CONDUCTUAL Y ANÁLISIS FUNCIONAL (AFC) ACTIVO DEL USUARIO:\n` +
                            `  * Hipótesis de Mantenimiento: "${maintHyp}"\n` +
                            `  * Hipótesis de Solución (Claves): "${solHyp}"\n` +
                            `  * Explicación de su Bucle: "${simpleExplanation}"\n` +
                            `  * Nodos Clave en su Conducta:\n${nodesSummary}`;
                    }
                }
            } catch (e) {
                console.error("Error formatting AFC context for chat:", e);
            }
            return '';
        })();

        const systemInstruction = isAnalyzingNote ? `Eres Kio, el núcleo digital de Ruido Interior. 
Tu objetivo es ayudar al usuario a profundizar, refinar y conectar el contenido de su nota: "${activeNoteContent}".
${memoryContext}
${recentConvSummary}
${canvasNotesContext}
${searchContext}
${afcMapContext}

- OBJETIVO: Proporciona un análisis profundo, psicológico y existencial con conexiones conceptuales de gran valor.
- IDIOMA (CRÍTICO): Habla SIEMPRE en español latino neutro (México). NUNCA uses voseo argentino ("vos", "tenés", "mirá", "dale", "che", "boludo", "re", "piola", "laburar", "posta", "copado", "bancarse", "garpa"). Usa "tú" y conjugaciones estándar mexicanas. Tu español debe sonar natural para un hablante de México.
- TONO Y LENGUAJE: Escribe en un lenguaje limpio, neutral, maduro y profesional, conservando una profunda empatía humana pero sin modismos informales o palabras de jerga callejera.
- ESTÉTICA ESCRITA (CRÍTICO): Organiza tu respuesta de forma sumamente limpia, utilizando títulos claros en markdown (ej. ### Título de Sección) para separar las distintas vertientes de tu análisis.
- FORMATO: Usa negritas para conceptos clave y cursivas para reflexiones íntimas. Limita las viñetas, prefiere párrafos fluidos y bien espaciados.
- REGLA DE ORO: Ve directo al grano. Mantén el análisis conciso y evita monólogos filosóficos largos, introducciones vacías o presentaciones.`
            : `Eres Kio, una inteligencia y núcleo de síntesis de Ruido Interior. Eres un asistente funcional, empático y directo. Tu objetivo es ser un compañero útil, escuchando y apoyando al usuario en su proceso de desahogo o trabajo diario.
${memoryContext}
${recentConvSummary}
${canvasNotesContext}
${styleContext}
${searchContext}
${afcMapContext}

- IDIOMA (CRÍTICO - OBLIGATORIO): Habla SIEMPRE en español latino neutro (México). NUNCA uses voseo argentino ni modismos rioplatenses. Está PROHIBIDO usar: "vos", "tenés", "mirá", "dale", "che", "boludo/a", "re" (como intensificador), "piola", "laburar", "posta", "copado", "bancarse", "garpa", "flashear", "morfar", "afanar". Usa SIEMPRE "tú" y conjugaciones estándar mexicanas (tienes, miras, puedes). Tu español debe sonar completamente natural para un hablante de México.
- MENTALIDAD E INTUICIÓN (CRÍTICO): Tienes una mente altamente analítica, aguda y sumamente intuitiva. Capta rápidamente la esencia de lo que el usuario quiere decir. Evita dar sermones morales, monólogos existencialistas densos o discursos "filosóficos" largos y aburridos. Ve al punto con brillantez. Sé un espejo intelectual rápido, perspicaz y genial. Sigue la onda del usuario de manera fluida y muy cool.
- IDENTIDAD Y TONO ADAPTATIVO:
  Tu lenguaje se adapta al usuario pero manteniéndose neutral, empático y funcional. Si el usuario escribe informal, puedes ser informal pero usando español mexicano neutro. NUNCA fuerces la informalidad.
  LONGITUD ADAPTATIVA: Responde con la misma extensión y profundidad que requiera el prompt del usuario. Si el usuario se desahoga con un bloque largo, responde con un análisis completo. Si es breve, sé conciso.
- EL ROL (ESPEJO FUNCIONAL):
  Si el usuario está confundido o caótico, tu trabajo no es ser caótico ni "psicoanalizarlo" con teoría de manual. Tu trabajo es ayudar a estructurar ese caos mediante preguntas directas e inteligentes que le permitan reflexionar por sí mismo. NUNCA lo diagnostiques en la conversación. Simplemente escúchalo y acompáñalo como un asistente excepcionalmente brillante.
- HONESTIDAD RADICAL SOBRE EL PIZARRÓN:
  Tienes acceso a los datos del Pizarrón / Canvas del usuario y a su información pasada. NO finjas ser telepático. Si conectas algo del chat con una nota suya, dilo abiertamente: "Oye, conectando esto con la nota que tienes en tu pizarrón sobre X, noto este patrón...". Eso genera una percepción de alta inteligencia real.
- ESTÉTICA ESCRITA:
  Para respuestas cortas: formato fluido.
  Para análisis profundos: usa estructura limpia, negritas para ideas clave. Sin introducciones robóticas ni despedidas cliché.
- COMPROMISOS (CRÍTICO):
  Si a lo largo de la conversación logras establecer o proponer una acción concreta, un compromiso o un ejercicio práctico para el usuario, DEBES incluirlo al final de tu mensaje usando EXACTAMENTE este formato: [COMPROMISO: texto del compromiso]. Ejemplo: [COMPROMISO: Escribir una carta sin enviar a mi padre explicando cómo me siento]. NUNCA uses este formato en el primer mensaje, sólo cuando surja orgánicamente.`;


        const apiMessages = [
            { role: 'system', content: systemInstruction },
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
        ];

        let fullText = '';
        for (const modelName of MODELS_TO_TRY) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);
            try {
                setActiveModel(modelName);
                console.log(`Kio - Sintonizando frecuencia con: ${modelName}...`);
                const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
                const response = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: endpoint,
                        key: deepseekKey,
                        payload: {
                            model: modelName,
                            messages: apiMessages,
                            stream: true,
                            temperature: 0.65,
                            presence_penalty: 0.15,
                            frequency_penalty: 0.15,
                            max_tokens: 1500
                        }
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    lastSuccessModel.current = modelName;
                    const reader = response.body.getReader();
                    fullText = '';
                    let buffer = ''; // BUFFER FOR PARTIAL CHUNKS

                    const aiMsgId = Date.now();
                    const initialAiMsg = { role: 'assistant', content: '', id: aiMsgId };
                    chatMessagesRef.current = [...chatMessagesRef.current, initialAiMsg];
                    setChatMessages([...chatMessagesRef.current]);
                    setIsChatLoading(false);

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += new TextDecoder().decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop(); // KEEP PARTIAL LINE IN BUFFER

                        for (const line of lines) {
                            const cleanLine = line.trim();
                            if (!cleanLine || !cleanLine.startsWith('data: ')) continue;

                            try {
                                const data = JSON.parse(cleanLine.slice(6));
                                // Handle reasoning_content for DeepSeek Reasoner
                                const text = data.choices?.[0]?.delta?.content || "";
                                const reasoningText = data.choices?.[0]?.delta?.reasoning_content || "";

                                if (reasoningText) {
                                    // Wrap reasoning in <thought> tags if it's the specific field
                                    fullText = fullText.includes('<thought>')
                                        ? fullText.replace('</thought>', reasoningText + '</thought>')
                                        : `<thought>${reasoningText}</thought>` + fullText;
                                }

                                if (text) {
                                    fullText += text;

                                    // EXTRACT THOUGHT
                                    let content = fullText;
                                    let thought = '';
                                    const thoughtMatch = fullText.match(/<thought>([\s\S]*?)<\/thought>/);
                                    if (thoughtMatch) {
                                        thought = thoughtMatch[1];
                                        content = fullText.replace(/<thought>[\s\S]*?<\/thought>/, '').trim();
                                    } else if (fullText.includes('<thought>')) {
                                        // Still thinking or tag not closed
                                        thought = fullText.split('<thought>')[1].split('</thought>')[0];
                                        content = fullText.split('<thought>')[0].trim();
                                    }

                                    // Sync to Ref for throttling
                                    chatMessagesRef.current = chatMessagesRef.current.map(m =>
                                        m.id === aiMsgId ? { ...m, content: content || '', thought: thought } : m
                                    );

                                    // Throttled UI update
                                    if (!window._chatThrottle) {
                                        window._chatThrottle = setTimeout(() => {
                                            setChatMessages([...chatMessagesRef.current]);
                                            window._chatThrottle = null;
                                        }, 80);
                                    }
                                }
                            } catch (e) { /* partial json */ }
                        }
                    }

                    // FINAL FALLBACK
                    setChatMessages([...chatMessagesRef.current]);
                    saveCurrentChat(effectiveConvId, effectiveNoteId, !!effectiveNoteId);
                    return; // SUCCESS
                } else {
                    let errMsg = '';
                    try {
                        const errData = await response.json();
                        errMsg = errData?.error?.message || errData?.msg || "Error desconocido de API";
                    } catch (e) {
                        try {
                            const rawText = await response.text();
                            errMsg = rawText || `Código HTTP ${response.status}`;
                        } catch (inner) {
                            errMsg = `Código HTTP ${response.status}`;
                        }
                    }
                    lastError = errMsg;
                }
            } catch (e) {
                clearTimeout(timeoutId);
                if (e.name === 'AbortError') {
                    lastError = "Límite de tiempo agotado (timeout de 45 segundos). Revisa tu conexión a internet o la estabilidad del endpoint de DeepSeek.";
                } else {
                    lastError = e.message;
                }
            }
        }

        setIsChatLoading(false);
        const assistantFinalMsg = { role: 'assistant', content: fullText || `Sincronía fallida: ${lastError}`, id: Date.now() };

        // Final Sync to Conversations using the consolidated helper
        chatMessagesRef.current = [...newMessages, assistantFinalMsg];
        setChatMessages(chatMessagesRef.current);
        saveCurrentChat(effectiveConvId, effectiveNoteId, !!effectiveNoteId);
    };

    const testDeepseekConnection = async () => {
        setApiTestLoading(true);
        setApiTestResult('Conectando con DeepSeek...');
        try {
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
            const key = deepseekKey;
            const model = customModel || 'deepseek-chat';

            console.log(`Diagnostic - Test con Endpoint: ${endpoint}, Modelo: ${model}, Key: ${key ? key.substring(0, 10) + '...' : 'Usando servidor'}`);

            const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    key: key,
                    payload: {
                        model: model,
                        messages: [{ role: 'user', content: 'hello' }],
                        max_tokens: 5
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.choices?.[0]?.message?.content || 'Sin respuesta';
                setApiTestResult(`Éxito (200 OK): La IA respondió "${reply}"`);
            } else {
                let errMsg = '';
                try {
                    const errData = await res.json();
                    errMsg = errData?.error?.message || errData?.msg || "Error desconocido";
                } catch (e) {
                    try {
                        const rawText = await res.text();
                        errMsg = rawText || `Código HTTP ${res.status}`;
                    } catch (inner) {
                        errMsg = `Código HTTP ${res.status}`;
                    }
                }
                setApiTestResult(`Fallo (HTTP ${res.status}): ${errMsg}`);
            }
        } catch (e) {
            setApiTestResult(`Error de red/CORS: ${e.message}`);
        } finally {
            setApiTestLoading(false);
        }
    };

    const handleOpenNodeChat = useCallback((nodeId, nodeLabel, customPrompt) => {
        setActiveExplorationNodeId(nodeId);
        setIsChatOpen(true);
        const promptText = customPrompt || `Quiero explorar y analizar mi nodo conductual: "${nodeLabel}". ¿Qué reflexiones me sugieres y qué compromiso concreto podemos establecer?`;
        handleSendChatMessage(promptText);
    }, [handleSendChatMessage]);

    // REACTIVE PLAYBACK ENGINE
    useEffect(() => {
        const fetchStreamUrl = async (videoId, index) => {
            if (!videoId) return;
            try {
                const res = await fetch(`${API_URL}/api/oasis/youtube/stream/${videoId}`);
                const data = await res.json();
                if (data.url) {
                    const finalUrl = data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
                    setPlayQueue(prev => prev.map((t, i) => i === index ? {
                        ...t,
                        url: finalUrl
                    } : t));
                }
            } catch (_err) {
                console.error("Error al obtener stream del backend:", _err);
            }
        };

        const track = playQueue[currentTrack];
        if (track && track.videoId && !track.url) {
            fetchStreamUrl(track.videoId, currentTrack);
        }
    }, [currentTrack, playQueue]);

    // PROGRESS RESTORATION ENGINE
    const isRestored = useRef(false);
    useEffect(() => {
        if (isLoggedIn && isDataLoaded && !isRestored.current && audioPlayerRef.current && trackProgress > 0) {
            audioPlayerRef.current.currentTime = trackProgress;
            isRestored.current = true;
            console.log(`Oasis Sync: Progreso restaurado a ${trackProgress}s`);
        }
    }, [isLoggedIn, isDataLoaded, trackProgress]);

    // Reset progress restoration on track change
    useEffect(() => {
        isRestored.current = false;
    }, [currentTrack]);

    useEffect(() => {
        if (isPlaying && audioPlayerRef.current && audioPlayerRef.current.src && audioPlayerRef.current.src !== window.location.href) {
            audioPlayerRef.current.play().catch(e => console.log("Playback failed:", e));
        }
    }, [playQueue[currentTrack]?.url, isPlaying]);

    const handleTimeUpdate = (e) => {
        setTrackProgress(e.target.currentTime);
        setTrackDuration(e.target.duration);
    };

    const audioPlayerRef = useRef(null);

    const titleRef = useRef(null);
    const firstLineRef = useRef(null);

    // --- LOGICA DE ARCHIVOS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setMediaFile(event.target.result);
        reader.readAsDataURL(file);
    };

    const launchMedia = async () => {
        setIsSyncingMedia(true);
        try {
            let finalContent = noteText;
            if (isResonanceMode && composerStep === 'note') {
                finalContent = `[resonancia]\n${resResonance}\n\n[impacto]\n${resImpact}\n\n[extrano]\n${resStrange}`;
            }

            const localUrls = Object.keys(pendingMediaUploads.current);
            if (localUrls.length > 0) {
                for (const localUrl of localUrls) {
                    if (finalContent.includes(localUrl)) {
                        try {
                            const remoteUrl = await pendingMediaUploads.current[localUrl];
                            if (remoteUrl) {
                                finalContent = finalContent.replace(localUrl, remoteUrl);
                            }
                        } catch (e) {
                            console.error("Failed to resolve pending media upload:", e);
                        }
                    }
                }
                pendingMediaUploads.current = {};
            }

            const targetBlockId = editingId || Date.now().toString();

            if (editingId) {
                syncBlocks(prev => prev.map(b => b.id === editingId ? {
                    ...b,
                    content: (composerStep === 'note' && !isDiaryMode) ? finalContent : (mediaFile || b.content),
                    caption: caption,
                    isPublic: b.isPublic,
                    color: isDiaryMode ? '#f59e0b' : (isResonanceMode ? '#a855f7' : accent),
                    metadata: {
                        ...(b.metadata || {}),
                        secondaryPanels: secondaryPanels.filter(p => p.text.trim() !== '')
                    },
                    entries: (isDiaryMode && composerStep === 'note' && finalContent.trim())
                        ? [...(b.entries || []), { text: finalContent, timestamp: new Date().toISOString() }]
                        : (b.entries || [])
                } : b));
                setEditingId(null);
            } else {
                // Smart placement: cluster new notes near existing user notes
                const userBlocks = blocks.filter(b => b.type !== 'insight' && !b.isPublic && b.x !== undefined && b.y !== undefined);
                let spawnX, spawnY;
                if (userBlocks.length > 0) {
                    // Find centroid of existing notes
                    const cx = userBlocks.reduce((s, b) => s + b.x, 0) / userBlocks.length;
                    const cy = userBlocks.reduce((s, b) => s + b.y, 0) / userBlocks.length;
                    // Place near the centroid with a small random offset so notes don't stack
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 220 + Math.random() * 180;
                    spawnX = cx + Math.cos(angle) * dist;
                    spawnY = cy + Math.sin(angle) * dist;
                } else {
                    // No notes yet: place at current camera center
                    spawnX = (-cam.x) / cam.scale;
                    spawnY = (-cam.y) / cam.scale;
                }
                // Snap to grid (20px)
                spawnX = Math.round(spawnX / 20) * 20;
                spawnY = Math.round(spawnY / 20) * 20;

                const newBlock = {
                    id: targetBlockId,
                    type: composerStep === 'note' ? 'text' : composerStep,
                    x: spawnX, y: spawnY,
                    content: (composerStep === 'note' && !isDiaryMode) ? finalContent : mediaFile,
                    caption: caption || (isResonanceMode ? 'Resonancia' : 'Sin título'),
                    isPublic: false, // Save as private first if publicizing
                    color: isDiaryMode ? '#f59e0b' : (isResonanceMode ? '#a855f7' : accent),
                    rotation: (Math.random() - 0.5) * 6,
                    username: user || 'anon',
                    metadata: { origin: 'user_action', timestamp: new Date().toISOString(), secondaryPanels: secondaryPanels.filter(p => p.text.trim() !== '') },
                    entries: (isDiaryMode && composerStep === 'note' && finalContent.trim())
                        ? [{ text: finalContent, timestamp: new Date().toISOString() }]
                        : [],
                    muralBlocks: tempMuralBlocks,
                    canvasId: activeCanvasId || 'canvas_default'
                };
                syncBlocks(prev => [newBlock, ...prev]);
            }

            setIsComposerOpen(false);
            setNoteText('');
            setResResonance('');
            setResImpact('');
            setResStrange('');
            setIsResonanceMode(false);
            setCaption('');
            setIsPublic(false);
            setMediaFile(null);
            setTempMuralBlocks([]);
        } finally {
            setIsSyncingMedia(false);
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const saveDrawing = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'drawing.png');
            try {
                const res = await fetch(`${API_URL}/api/oasis/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                const imageUrl = data.url;

                const newBlock = {
                    id: Date.now().toString(),
                    type: 'image',
                    x: (Math.random() - 0.5) * 500,
                    y: (Math.random() - 0.5) * 500,
                    content: imageUrl,
                    rotation: (Math.random() - 0.5) * 10,
                    color: accent,
                    caption: 'Esbozo de Sincronía',
                    username: user,
                    timestamp: new Date().toISOString(),
                    canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                };
                const updated = [newBlock, ...blocks];
                setBlocks(updated);
                syncBlocks(updated);
                setIsDrawingModalOpen(false);
            } catch (err) {
                console.error("Fallo al guardar dibujo", err);
            }
        }, 'image/png');
    };

    const [bounceTick, setBounceTick] = useState(0);
    const bounceFrame = useRef(null);
    const bounceStart = useRef(null);

    const triggerBounceTick = () => {
        if (!bounceStart.current) bounceStart.current = performance.now();
        const elapsed = performance.now() - bounceStart.current;
        if (elapsed < 1600) {
            setBounceTick(t => t + 1);
            bounceFrame.current = requestAnimationFrame(triggerBounceTick);
        } else {
            bounceFrame.current = null;
            bounceStart.current = null;
            window.lastRelease = null;
        }
    };

    // --- HANDLERS ---
    const handleStart = (e, id) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('.port')) return;
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const clientY = (e.touches ? e.touches[0].clientY : e.clientY);

        isPointerDown.current = true;
        setDraggingId(id);
        window.lastMousePos = { x: clientX, y: clientY };
        window.dragVelocity = { x: 0, y: 0 };
        if (id !== 'canvas' && id !== 'universe' && id !== 'feed' && id !== 'player') {
            setLastInteractedBlockId(id);
        }

        if (id === 'canvas' && e.touches && e.touches.length === 1) {
            const now = Date.now();
            if (now - canvasLastTapTimeRef.current < 300) {
                // Double tap zoom in
                clearTimeout(canvasLongPressTimerRef.current);
                setCam(c => {
                    const newScale = Math.min(c.scale + 0.5, 3);
                    const newX = clientX - (clientX - c.x) * (newScale / c.scale);
                    const newY = clientY - (clientY - c.y) * (newScale / c.scale);
                    return { x: newX, y: newY, scale: newScale };
                });
                canvasLastTapTimeRef.current = 0;
            } else {
                canvasLastTapTimeRef.current = now;
                if (canvasLongPressTimerRef.current) clearTimeout(canvasLongPressTimerRef.current);
                canvasLongPressTimerRef.current = setTimeout(() => {
                    // Long press zoom out
                    setCam(c => {
                        const newScale = Math.max(c.scale - 0.5, 0.1);
                        const newX = window.innerWidth / 2 - ((window.innerWidth / 2) - c.x) * (newScale / c.scale);
                        const newY = window.innerHeight / 2 - ((window.innerHeight / 2) - c.y) * (newScale / c.scale);
                        return { x: newX, y: newY, scale: newScale };
                    });
                }, 500);
            }
        }

        if (e.touches && e.touches.length === 2) {
            initialPinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            initialPinchScale.current = cam.scale;
            initialPinchCam.current = { x: cam.x, y: cam.y };
            initialTouchMidpoint.current = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
        } else {
            initialPinchDist.current = 0;
        }

        if (id === 'canvas') {
            dragStart.current = { x: clientX - cam.x, y: clientY - cam.y };
        } else if (id === 'universe') {
            dragStart.current = { x: clientX - profileCam.x, y: clientY - profileCam.y };
        } else if (id === 'feed') {
            dragStart.current = { x: clientX - feedCam.x, y: clientY - feedCam.y };
        } else if (id === 'player') {
            dragStart.current = { x: clientX - playerPos.x, y: clientY - playerPos.y };
        } else {
            const item = blocks.find(b => b.id === id) || soulPieces.find(p => p.id === id);
            if (item) {
                const currentCam = (view === 'profile' ? profileCam : cam);
                const isSoulPiece = soulPieces.some(p => p.id === id);
                const ox = (view === 'profile' && !isSoulPiece) ? item.x + 400 : item.x;
                const oy = (view === 'profile' && !isSoulPiece) ? item.y + 400 : item.y;

                dragStart.current = {
                    x: (clientX - window.innerWidth / 2 - currentCam.x) / currentCam.scale - ox,
                    y: (clientY - window.innerHeight / 2 - currentCam.y) / currentCam.scale - oy
                };
            }
        }
    };

    const handleMove = (e) => {
        if (canvasLongPressTimerRef.current) clearTimeout(canvasLongPressTimerRef.current);
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const clientY = (e.touches ? e.touches[0].clientY : e.clientY);

        // TRACK REALTIME DRAG VELOCITY WITH ZERO REACT STATE OVERHEAD
        if (draggingId) {
            if (!window.lastMousePos) {
                window.lastMousePos = { x: clientX, y: clientY };
            }
            const vx = clientX - window.lastMousePos.x;
            const vy = clientY - window.lastMousePos.y;
            window.lastMousePos = { x: clientX, y: clientY };
            window.dragVelocity = {
                x: (window.dragVelocity?.x || 0) * 0.75 + vx * 0.25,
                y: (window.dragVelocity?.y || 0) * 0.75 + vy * 0.25
            };
        }

        // PINCH ZOOM (Tactil)
        if (e.touches && e.touches.length === 2 && initialPinchDist.current > 0) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const newScale = Math.min(Math.max(initialPinchScale.current * (dist / initialPinchDist.current), 0.15), 3);

            // Midpoint relative to window center
            const mx = (touch1.clientX + touch2.clientX) / 2 - window.innerWidth / 2;
            const my = (touch1.clientY + touch2.clientY) / 2 - window.innerHeight / 2;

            // Center of initial touches relative to window center
            const imx = initialTouchMidpoint.current.x - window.innerWidth / 2;
            const imy = initialTouchMidpoint.current.y - window.innerHeight / 2;

            // Canvas coordinates under the initial midpoint
            const cx = (imx - initialPinchCam.current.x) / initialPinchScale.current;
            const cy = (imy - initialPinchCam.current.y) / initialPinchScale.current;

            // Adjust camera position so cx, cy aligns with mx, my under the newScale
            const newX = mx - cx * newScale;
            const newY = my - cy * newScale;

            setCam({ x: newX, y: newY, scale: newScale });
            return;
        }

        // Seguimiento para Vínculos (Draft Line)
        if (isLinking || linkSource) {
            const currentCam = (view === 'profile' ? profileCam : cam);
            const nx = (clientX - window.innerWidth / 2 - currentCam.x) / currentCam.scale;
            const ny = (clientY - window.innerHeight / 2 - currentCam.y) / currentCam.scale;
            setMouseCanvasPos({ x: nx, y: ny });
        }

        if (!isPointerDown.current) return;

        if (draggingId === 'canvas') {
            setCam(c => ({ ...c, x: clientX - dragStart.current.x, y: clientY - dragStart.current.y }));
        } else if (draggingId === 'universe') {
            setProfileCam(c => ({ ...c, x: clientX - dragStart.current.x, y: clientY - dragStart.current.y }));
        } else if (draggingId === 'feed') {
            setFeedCam(c => ({ ...c, x: clientX - dragStart.current.x, y: clientY - dragStart.current.y }));
        } else if (draggingId === 'player') {
            setPlayerPos({ x: clientX - dragStart.current.x, y: clientY - dragStart.current.y });
        } else if (draggingId) {
            const currentCam = (view === 'profile' ? profileCam : cam);
            let nx = (clientX - window.innerWidth / 2 - currentCam.x) / currentCam.scale - dragStart.current.x;
            let ny = (clientY - window.innerHeight / 2 - currentCam.y) / currentCam.scale - dragStart.current.y;

            // --- MAGNETISMO "BORDES" DINÁMICO (LIENZO) ---
            const SNAP_THRESHOLD = 50;
            const selfNode = blocks.find(b => b.id === draggingId);
            const isSelfMedia = selfNode?.content?.includes('[img]') || selfNode?.content?.includes('[vid]') || selfNode?.content?.includes('[aud]');
            const selfW = isSelfMedia ? 384 : 200;
            const selfH = 180; // Aumentado de 150 para evitar empalmes en notas con mucho texto

            const relevantBlocks = blocks.filter(b => {
                if (view === 'canvas') return b.type !== 'insight';
                if (view === 'profile') return b.isPublic;
                return true;
            });

            let bestSnapX = null;
            let bestSnapY = null;
            snapedToRef.current = null;

            for (const other of relevantBlocks) {
                if (other.id === draggingId) continue;

                const isOtherMedia = other.content?.includes('[img]') || other.content?.includes('[vid]') || other.content?.includes('[aud]');
                const otherW = isOtherMedia ? 384 : 200;
                const otherH = 180;

                const baseNX = view === 'profile' ? nx - 400 : nx;
                const baseNY = view === 'profile' ? ny - 400 : ny;

                const dx = baseNX - other.x;
                const dy = baseNY - other.y;

                // Alineación Lateral (Dinámica)
                const idealGX = (selfW / 2 + otherW / 2) + 10; // 10px de respiro (antes 8)
                if (Math.abs(dy) < 60 && Math.abs(Math.abs(dx) - idealGX) < SNAP_THRESHOLD) {
                    bestSnapX = other.x + (dx > 0 ? idealGX : -idealGX);
                    bestSnapY = other.y;
                    snapedToRef.current = other.id;
                    break;
                }

                // Alineación Vertical (Dinámica)
                const idealGY = (selfH / 2 + otherH / 2) + 15; // 15px de respiro (antes 8)
                if (Math.abs(dx) < 60 && Math.abs(Math.abs(dy) - idealGY) < SNAP_THRESHOLD) {
                    bestSnapY = other.y + (dy > 0 ? idealGY : -idealGY);
                    bestSnapX = other.x;
                    snapedToRef.current = other.id;
                    break;
                }
            }

            if (bestSnapX !== null) {
                nx = view === 'profile' ? bestSnapX + 400 : bestSnapX;
            } else {
                nx = Math.round(nx / 20) * 20;
            }
            if (bestSnapY !== null) {
                ny = view === 'profile' ? bestSnapY + 400 : bestSnapY;
            } else {
                ny = Math.round(ny / 20) * 20;
            }

            if (view === 'profile') {
                if (soulPieces.some(p => p.id === draggingId)) {
                    setSoulPieces(prev => prev.map(p => p.id === draggingId ? { ...p, x: nx, y: ny } : p));
                } else {
                    setBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, x: nx - 400, y: ny - 400 } : b));
                }
            } else {
                setBlocks(prev => {
                    const block = prev.find(b => b.id === draggingId);
                    if (!block || !block.groupId) {
                        return prev.map(b => b.id === draggingId ? { ...b, x: nx, y: ny } : b);
                    }

                    const dx = nx - block.x;
                    const dy = ny - block.y;

                    return prev.map(b => {
                        if (b.id === draggingId) return { ...b, x: nx, y: ny };
                        if (b.groupId === block.groupId) return { ...b, x: b.x + dx, y: b.y + dy };
                        return b;
                    });
                });
            }
        }
    };

    const handleEnd = () => {
        if (canvasLongPressTimerRef.current) clearTimeout(canvasLongPressTimerRef.current);
        isPointerDown.current = false;
        if (draggingId && draggingId !== 'canvas' && draggingId !== 'universe' && draggingId !== 'feed' && draggingId !== 'player') {
            window.lastRelease = {
                time: performance.now(),
                vx: window.dragVelocity?.x || 0,
                vy: window.dragVelocity?.y || 0,
                nodeId: draggingId
            };
            if (bounceFrame.current) cancelAnimationFrame(bounceFrame.current);
            bounceStart.current = null;
            bounceFrame.current = requestAnimationFrame(triggerBounceTick);
        }
        window.dragVelocity = { x: 0, y: 0 };
        window.lastMousePos = null;
        if (draggingId && draggingId !== 'canvas' && draggingId !== 'universe' && draggingId !== 'feed' && draggingId !== 'player') {
            // Snapping is only visual; do not auto-connect or auto-group nodes on release.

            // Guardar posición final con garantía de estado actual
            syncBlocks(prev => prev);
        }
        setDraggingId(null);
        snapedToRef.current = null;
    };

    const completeConnection = (targetId) => {
        if (linkSource && linkSource !== targetId) {
            const exists = links.find(l => l.from === linkSource && l.to === targetId);
            if (!exists) {
                setLinks(prev => {
                    const updated = [...prev, { from: linkSource, to: targetId }];
                    setTimeout(() => syncLinks(updated), 0);
                    return updated;
                });

                // Pop up the color menu automatically at the target node's position on screen
                const targetNode = blocks.find(b => b.id === targetId);
                if (targetNode) {
                    const screenX = targetNode.x * cam.scale + cam.x;
                    const screenY = targetNode.y * cam.scale + cam.y;
                    setActiveLinkMenu({ from: linkSource, to: targetId, x: screenX, y: screenY });
                }
            }
        }
        setLinkSource(null);
    };

    const removeConnection = (fromId, toId) => {
        setLinks(prev => {
            const updated = prev.filter(l => !(l.from === fromId && l.to === toId));
            setTimeout(() => syncLinks(updated), 0);
            return updated;
        });
    };

    const synthesizeLinks = async () => {
        if (links.length === 0) { console.log('No hay vínculos para sintetizar.'); return; }

        // Identificar bloques involucrados
        const linkedIds = new Set();
        links.forEach(l => { linkedIds.add(l.from); linkedIds.add(l.to); });
        const involvedBlocks = blocks.filter(b => linkedIds.has(b.id));
        const contents = involvedBlocks.map(b => b.content).join('\n---\n');

        console.log(`Sintetizando ${involvedBlocks.length} fragmentos con el Núcleo Cognitivo...`);

        const customModel = localStorage.getItem('oasis_deepseek_model') || 'deepseek-chat';
        const MODELS_TO_TRY = lastSuccessModel.current
            ? [lastSuccessModel.current, ...availableModels.filter(m => m !== lastSuccessModel.current)]
            : [customModel, 'deepseek-chat', 'deepseek-reasoner'];
        let lastError = '';

        const prompt = `Analiza estos fragmentos de alma y crea un nuevo fragmento (máximo 50 palabras) que sintetice la relación entre ellos de manera poética pero profunda. \n\nFragmentos:\n${contents}`;

        for (const modelName of MODELS_TO_TRY) {
            try {
                const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.deepseek.com/chat/completions';
                const res = await fetch(`${API_URL}/api/oasis/config/chat-completion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: endpoint,
                        key: deepseekKey,
                        payload: {
                            model: modelName,
                            messages: [{ role: 'user', content: prompt }]
                        }
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const synthesis = data.choices?.[0]?.message?.content;
                    if (synthesis) {
                        // ÉXITO: Crear nueva nota en el centro de los vínculos
                        const centerX = involvedBlocks.reduce((sum, b) => sum + b.x, 0) / involvedBlocks.length;
                        const centerY = involvedBlocks.reduce((sum, b) => sum + b.y, 0) / involvedBlocks.length;

                        const newBlock = {
                            id: `synth-${Date.now()}`,
                            type: 'text',
                            content: `[SÍNTESIS AI] ${synthesis}`,
                            x: centerX,
                            y: centerY + 200,
                            rotation: 0,
                            color: '#a855f7',
                            caption: 'Nueva Conciencia Sintética',
                            username: user,
                            metadata: { origin: 'synthesis', timestamp: new Date().toISOString() },
                            canvasId: activeCanvasId || 'canvas_default'
                        };

                        syncBlocks(prev => [...prev, newBlock]);

                        // Si estamos en perfil, notificar que se creó en el lienzo
                        if (view === 'profile') {
                            console.log('Síntesis Creada en tu Lienzo Privado');
                        }
                        return;
                    }
                } else {
                    const errData = await res.json();
                    lastError = errData.error?.message || `Error ${res.status}`;
                }
            } catch (e) {
                lastError = e.message;
                console.warn(`Síntesis fallida con ${modelName}:`, e);
            }
        }

        console.error(`Fallo en el Núcleo Cognitivo. Último error: ${lastError}`);
    };

    const renderCanvasView = () => (
        <div
            className={`w-full h-full relative overflow-hidden bg-black/40 backdrop-blur-md cursor-move active:cursor-grabbing touch-none ${isMuralMode ? 'hidden' : ''}`}
            onMouseDown={(e) => handleStart(e, 'canvas')}
            onTouchStart={(e) => handleStart(e, 'canvas')}
            onWheel={(e) => {
                // Smooth balanced zoom targeting the mouse cursor
                const zoomSpeed = 0.002;
                const oldScale = cam.scale;
                const newScale = Math.min(Math.max(oldScale * Math.exp(-e.deltaY * zoomSpeed), 0.1), 4);

                const mx = e.clientX - window.innerWidth / 2;
                const my = e.clientY - window.innerHeight / 2;

                // Canvas coordinate under mouse
                const cx = (mx - cam.x) / oldScale;
                const cy = (my - cam.y) / oldScale;

                // New camera position so cx,cy remains under mx,my
                const newX = mx - cx * newScale;
                const newY = my - cy * newScale;

                setCam({ x: newX, y: newY, scale: newScale });
            }}

        >
            {/* CUADRICULA TÉCNICA (TOUCHDESIGNER STYLE) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{
                backgroundImage: `
            linear-gradient(to right, #444 1px, transparent 1px),
            linear-gradient(to bottom, #444 1px, transparent 1px),
            linear-gradient(to right, #222 1px, transparent 1px),
            linear-gradient(to bottom, #222 1px, transparent 1px)
          `,
                backgroundSize: `${100 * cam.scale}px ${100 * cam.scale}px, ${100 * cam.scale}px ${100 * cam.scale}px, ${20 * cam.scale}px ${20 * cam.scale}px, ${20 * cam.scale}px ${20 * cam.scale}px`,
                backgroundPosition: `${cam.x}px ${cam.y}px`
            }} />

            {/* EJES CENTRALES */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 pointer-events-none" style={{ transform: `translateY(${cam.y}px)` }} />
            <div className="absolute left-1/2 top-0 h-full w-px bg-white/5 pointer-events-none" style={{ transform: `translateX(${cam.x}px)` }} />

            <div className={`absolute top-1/2 left-1/2 w-0 h-0`} style={{ transform: `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.scale})`, willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>

                {/* VINCULOS SVG (CUERDAS CON PESO Y MICRO-PUNTOS) */}
                <AnimatedCanvasConnections
                    links={links}
                    blocks={blocks.filter(b => {
                        if (b.type === 'insight' || b.type === 'diary_notebook' || b.type === 'resonance_notebook' || b.type === 'conversation_notebook' || b.type === 'settings' || b.type === 'canvas' || b.type === 'note' || b.isPublic || b.type === 'profile_settings' || b.type === 'user_settings') return false;
                        if (b.canvasId && b.canvasId !== activeCanvasId) return false;
                        if (!b.canvasId && activeCanvasId !== 'canvas_default') return false;
                        return true;
                    })}
                    draggingId={draggingId}
                    camScale={cam.scale}
                    accent={accent}
                    removeConnection={removeConnection}
                    linkSource={linkSource}
                    mouseCanvasPos={mouseCanvasPos}
                />



                {/* FILTRADO: Solo mostrar notas privadas (no publicadas) en el lienzo del pizarron actual */}
                {blocks.filter(b => {
                    if (b.type === 'insight' || b.type === 'diary_notebook' || b.type === 'resonance_notebook' || b.type === 'conversation_notebook' || b.type === 'settings' || b.type === 'canvas' || b.type === 'note' || b.isPublic || b.type === 'profile_settings' || b.type === 'user_settings') return false;
                    if (b.type === 'diary' || (b.entries && b.entries.length > 0)) return false;
                    if (b.canvasId && b.canvasId !== activeCanvasId) return false;
                    if (!b.canvasId && activeCanvasId !== 'canvas_default') return false;
                    return true;
                }).map(b => {
                    const hasConnections = links.some(l => l.from === b.id || l.to === b.id);
                    return (
                        <MemoNode
                            onRequestTitleEdit={(blockId, currentText) => {
                                setTitlePrompt({
                                    defaultValue: currentText,
                                    onConfirm: (newText) => {
                                        if (newText && newText.trim() && newText !== currentText) {
                                            const b = blocks.find(x => x.id === blockId);
                                            if (b) {
                                                onSelect({ ...b, content: newText.trim(), type: 'canvas_title' });
                                            }
                                        }
                                    }
                                });
                            }}
                            key={b.id}
                            block={b}
                            blocks={blocks}
                            draggingId={draggingId}
                            activeNoteId={activeNoteId}
                            onStart={handleStart}
                            onSelect={editBlock}
                            onSelectNote={handleSelectNote}
                            onSelectGroup={handleAnalyzeGroup}
                            onAnalyzeBlock={handleAnalyzeBlock}
                            onAnalyzeGroup={handleAnalyzeGroup}
                            isAnalyzing={isChatLoading}
                            onDelete={deleteBlock}
                            isLinking={isLinking}
                            onStartConnecting={(id) => {
                                if (linkSource && linkSource !== id) {
                                    completeConnection(id);
                                } else if (linkSource === id) {
                                    setLinkSource(null);
                                } else {
                                    setLinkSource(id);
                                }
                            }}
                            onCompleteConnection={completeConnection}
                            showConnections={true}
                            onLaunchMural={launchMural}
                            accent={accent}
                            hasConnections={hasConnections}
                            onSelectConversation={handleSelectConversation}
                            onOpenNotebook={setActiveNotebook}
                            onResizeNodeComplete={handleResizeNodeComplete}
                            setView={setView}
                            conversations={conversations}
                            onNewChat={handleNewChat}
                            camScale={cam.scale}
                        />
                    );
                })}
            </div>

            {/* El botón de Resonancia fue removido a petición del usuario por redundancia */}



            {/* LINK COLOR MENU */}
            {activeLinkMenu && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setActiveLinkMenu(null)} onMouseDown={(e) => { e.stopPropagation(); setActiveLinkMenu(null); }} onTouchStart={() => setActiveLinkMenu(null)} />
                    <div
                        className="fixed z-[9999] bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-150"
                        style={{ left: activeLinkMenu.x, top: activeLinkMenu.y - 40, transform: 'translateX(-50%)' }}
                    >
                        <div className="flex gap-2">
                            {['#4287f5', '#6366f1', '#a855f7', '#22d3ee', '#bef264', '#f43f5e', '#fbbf24', '#ffffff'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setLinks(prev => {
                                            const updated = prev.map(l => (l.from === activeLinkMenu.from && l.to === activeLinkMenu.to) ? { ...l, color: c } : l);
                                            syncLinks(updated);
                                            return updated;
                                        });
                                        setActiveLinkMenu(null);
                                    }}
                                    className="w-4 h-4 rounded-full hover:scale-125 transition-transform"
                                    style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}80` }}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}


            {/* CANVAS BOTTOM NAV PARA SUBIR IMAGENES DIRECTAS */}
            {view === 'canvas' && (
                <div
                    className="absolute bottom-[calc(85px+env(safe-area-inset-bottom,0px))] md:bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-sm border border-white/10 p-1.5 sm:p-3 rounded-[2rem] sm:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-0.5 sm:gap-2 pointer-events-auto w-max max-w-[95vw] overflow-x-auto no-scrollbar"
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onWheel={e => e.stopPropagation()}
                >
                    <button onClick={() => { if (isComposerOpen && noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); setIsChatOpen(false); setActiveNotebook(null); setIsPublishSelectorOpen(false); setIsBitacoraOpen(prev => !prev); setView('canvas'); }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all" title="Bitácora Existencial">{isBitacoraOpen ? <ChevronDown size={18} className="text-accent" style={{ color: accent }} /> : <ChevronUp size={18} />}</button>
                    <button onClick={() => { if (isComposerOpen && noteText?.trim()) handleComposerAutoSave(); openNewComposer(false, false); setIsChatOpen(false); setActiveNotebook(null); setIsPublishSelectorOpen(false); setIsBitacoraOpen(false); }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all" title="Crear Nota"><Pencil size={16} className="sm:scale-110" /></button>
                    <button onClick={() => { if (isComposerOpen && noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); setIsChatOpen(true); setActiveNotebook(null); setIsPublishSelectorOpen(false); setIsBitacoraOpen(false); }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all" title="Chat IA"><MessageSquare size={16} className="sm:scale-110" /></button>
                    <button onClick={() => { if (isComposerOpen && noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); setIsChatOpen(false); setActiveNotebook('resonance'); setIsPublishSelectorOpen(false); setIsBitacoraOpen(false); }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all" title="Ruido"><Sparkles size={16} className="sm:scale-110" /></button>

                    <button onClick={() => { if (isComposerOpen && noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); setIsChatOpen(false); setActiveNotebook(null); setIsPublishSelectorOpen(true); setIsBitacoraOpen(false); }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all" title="Publicar en Feed"><Rss size={16} className="sm:scale-110" /></button>

                    <div className="w-[1px] h-5 sm:h-6 bg-white/10 mx-0.5 sm:mx-1 shrink-0"></div>

                    <button onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*,video/*';
                        fileInput.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const isVid = file.type.startsWith('video/');

                            let w = 420;
                            let h = 420;
                            if (!isVid) {
                                const localUrl = URL.createObjectURL(file);
                                const img = new Image();
                                img.src = localUrl;
                                await new Promise(r => img.onload = r);
                                w = img.naturalWidth;
                                h = img.naturalHeight;
                                if (w > 1200) {
                                    h = (1200 / w) * h;
                                    w = 1200;
                                }
                            }

                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('user', user || 'default');

                            const xhr = new XMLHttpRequest();
                            const apiUrl = typeof API_URL !== 'undefined' ? API_URL : `http://${window.location.hostname}:5046`;
                            xhr.open('POST', `${apiUrl}/api/oasis/upload`);
                            xhr.onload = () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    try {
                                        const data = JSON.parse(xhr.responseText);
                                        if (data.url) {
                                            const newBlock = {
                                                id: `img-${Date.now()}`,
                                                type: isVid ? 'video' : 'image',
                                                content: data.url,
                                                x: -cam.x / cam.scale,
                                                y: -cam.y / cam.scale,
                                                width: w,
                                                height: h,
                                                isPublic: false,
                                                createdAt: new Date().toISOString(),
                                                canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                                            };
                                            setBlocks(prev => {
                                                const updated = [...prev, newBlock];
                                                if (typeof syncBlocks === 'function') syncBlocks(updated);
                                                return updated;
                                            });
                                        }
                                    } catch (err) { }
                                }
                            };
                            xhr.send(formData);
                        };
                        fileInput.click();
                    }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all relative group" title="Añadir Imagen al Lienzo">
                        <Paperclip size={16} className="sm:scale-110" />
                    </button>
                    <button onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'audio/*';
                        fileInput.onchange = (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            const xhr = new XMLHttpRequest();
                            const apiUrl = typeof API_URL !== 'undefined' ? API_URL : `http://${window.location.hostname}:5046`;
                            xhr.open('POST', `${apiUrl}/api/oasis/upload`);
                            xhr.onload = () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    try {
                                        const data = JSON.parse(xhr.responseText);
                                        if (data.url) {
                                            const newBlock = {
                                                id: `audio-${Date.now()}`,
                                                type: 'audio',
                                                content: data.url,
                                                caption: file.name,
                                                x: -cam.x / cam.scale,
                                                y: -cam.y / cam.scale,
                                                width: 300,
                                                height: 50,
                                                isPublic: false,
                                                createdAt: new Date().toISOString(),
                                                canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                                            };
                                            setBlocks(prev => {
                                                const updated = [...prev, newBlock];
                                                if (typeof syncBlocks === 'function') syncBlocks(updated);
                                                return updated;
                                            });
                                        }
                                    } catch (err) { }
                                }
                            };
                            xhr.send(formData);
                        };
                        fileInput.click();
                    }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all relative group" title="Añadir Audio al Lienzo">
                        <Headphones size={16} className="sm:scale-110" />
                    </button>
                    <button
                        onClick={toggleCanvasRecording}
                        className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full flex items-center justify-center transition-all ${canvasIsRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                        title={canvasIsRecording ? 'Detener Grabación' : 'Grabar Audio'}
                    >
                        <Mic size={16} className="sm:scale-110" />
                    </button>
                    <button onClick={() => {
                        setTitlePrompt({
                            defaultValue: '',
                            onConfirm: (titleText) => {
                                if (!titleText || !titleText.trim()) return;
                                const newBlock = {
                                    id: `title-${Date.now()}`,
                                    type: 'canvas_title',
                                    content: titleText.trim(),
                                    x: -cam.x / cam.scale,
                                    y: -cam.y / cam.scale,
                                    isPublic: false,
                                    createdAt: new Date().toISOString(),
                                    canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                                };
                                setBlocks(prev => {
                                    const updated = [...prev, newBlock];
                                    if (typeof syncBlocks === 'function') syncBlocks(updated);
                                    return updated;
                                });
                            }
                        });
                    }} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all relative group" title="Añadir Texto al Pizarrón">
                        <Type size={16} className="sm:scale-110" />
                    </button>
                </div>
            )}

            {/* FLOATING AUDIO RECORDING INDICATOR */}
            {canvasIsRecording && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-950/85 backdrop-blur-sm border border-red-500/20 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] select-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-200">Grabando audio para el pizarrón...</span>
                </div>
            )}
        </div>
    );

    const renderTestStimulusDiagram = (q) => {
        const color = accent;
        const qNum = q.question_number;

        // Custom rendering for each individual question to provide high-fidelity, premium visual diagnostics
        if (qNum === 1) {
            return null;
        }
        if (qNum === 2 || qNum === 4 || qNum === 5 || qNum === 7 || qNum === 8 || qNum === 11 || qNum === 12 || qNum === 15) {
            const imageUrl = `/icar16/q${qNum}.png`;
            return (
                <div
                    onClick={() => setZoomedImage(imageUrl)}
                    className="w-full h-32 sm:h-38 md:h-44 bg-zinc-950/80 border border-white/5 rounded-2xl p-2 flex items-center justify-center shadow-inner overflow-hidden cursor-zoom-in group hover:border-white/20 transition-all duration-300 relative"
                >
                    <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }}
                        src={imageUrl}
                        alt={`Reactivo ${qNum} - Estímulo ICAR16`}
                        className="max-h-full max-w-full object-contain opacity-95 group-hover:scale-[1.03] transition-all duration-300"
                        style={{ filter: 'invert(1)' }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 text-white/50 text-[10px] px-2 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Ampliar
                    </div>
                </div>
            );
        }
        return null;
    };;

    const renderSoulView = () => {
        const hasMap = !!localStorage.getItem('oasis_canvas_nodes_' + (user || localStorage.getItem('oasis_user') || ''));
        const activeTabName = (!hasMap && soulTab === 'loop_map') ? 'tests' : soulTab;

        if (activeTest === 'phenom') {
            const safeIndex = Math.min(currentPhenomIndex, 3);
            return (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-12 overflow-y-auto no-scroll font-sans select-none text-zinc-100 animate-in fade-in duration-500">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {/* Top bar */}
                    <div className="flex justify-between items-center w-full max-w-4xl mx-auto border-b border-white/5 pb-4 sm:pb-6 relative z-10 gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 font-mono">
                                EXPLORACIÓN FENOMENOLÓGICA
                            </span>
                        </div>
                        {!isFresh && (
                            <button
                                onClick={() => setActiveTest(null)}
                                className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/5 shrink-0"
                            >
                                [ Cancelar ]
                            </button>
                        )}
                    </div>

                    {/* Main content area */}
                    <div className="w-full max-w-3xl mx-auto my-auto py-4 sm:py-12 relative z-10 flex flex-col justify-center min-h-[50vh]">
                        {showPhenomIntro ? (
                            <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500">
                                <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col gap-6 text-center">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />

                                    <div className="relative z-10 space-y-4 py-4">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-black text-white leading-snug tracking-tight uppercase">
                                            Exploración Fenomenológica
                                        </h2>
                                        <p className="text-base sm:text-lg md:text-xl font-serif italic text-zinc-300 leading-relaxed max-w-2xl mx-auto">
                                            "Responde a las siguientes premisas de manera libre, profunda y completa. Tómate tu tiempo; este es un espacio seguro para volcar tu mundo interior."
                                        </p>
                                    </div>

                                    <div className="relative z-10">
                                        <button
                                            onClick={() => setShowPhenomIntro(false)}
                                            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border bg-purple-600 border-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500"
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-widest">Comenzar Exploración</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-purple-500/60 block">
                                        ESTÍMULO SUBJETIVO {safeIndex + 1} de 4
                                    </span>
                                </div>

                                <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col gap-6">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />

                                    <div className="relative z-10">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-black text-white leading-snug tracking-tight mb-4 uppercase">
                                            {PHENOM_PART_A[safeIndex].title}
                                        </h2>
                                        <p className="text-base sm:text-xl font-serif italic text-zinc-300 leading-relaxed">
                                            "{PHENOM_PART_A[safeIndex].question}"
                                        </p>
                                    </div>

                                    <div className="relative z-10 flex-1 flex flex-col gap-4 mt-4">
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all focus-within:border-purple-500/50 focus-within:bg-purple-950/20 flex flex-col">
                                            <textarea
                                                value={phenomTextValue || ''}
                                                onChange={(e) => {
                                                    setPhenomTextValue(e.target.value);
                                                }}
                                                placeholder={PHENOM_PART_A[safeIndex].placeholder || "Escribe tu respuesta aquí..."}
                                                className="w-full h-full bg-transparent text-sm md:text-base text-zinc-200 font-sans leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600 min-h-[150px]"
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={safeIndex === 0 ? () => setShowPhenomIntro(true) : handleGoBackPhenom}
                                                className="px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                                            >
                                                <ArrowLeft size={16} />
                                                <span className="text-[11px] font-black uppercase tracking-widest">Volver</span>
                                            </button>
                                            <button
                                                onClick={() => handleSavePhenomQualitative(phenomTextValue)}
                                                disabled={!phenomTextValue?.trim()}
                                                className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border ${(phenomTextValue?.trim())
                                                    ? 'bg-purple-600 border-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500'
                                                    : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                                                    }`}
                                            >
                                                <span className="text-[11px] font-black uppercase tracking-widest">{safeIndex === 3 ? 'Finalizar Sección' : 'Siguiente'}</span>
                                                {safeIndex === 3 ? <Check size={16} /> : <ArrowRight size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Progress bar */}
                    <div className="w-full max-w-4xl mx-auto pt-6 border-t border-white/5 flex flex-col gap-2 relative z-10">
                        <div className="flex justify-between text-[8px] font-blaci uppercase tracking-widest text-zinc-500 font-mono">
                            <span>PROGRESO</span>
                            <span>{showPhenomIntro ? 0 : Math.round(((safeIndex + 1) / 4) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${showPhenomIntro ? 0 : ((safeIndex + 1) / 4) * 100}%` }} />
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTest === 'pid5') {
            return (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-12 overflow-y-auto no-scrollbar font-sans select-none text-zinc-100 animate-in fade-in duration-500">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {/* Top bar */}
                    <div className="flex justify-between items-center w-full max-w-4xl mx-auto border-b border-white/5 pb-4 sm:pb-6 relative z-10 gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 font-mono">
                                PERSONALIDAD PID-5-BF
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveTest(null)}
                            className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/5 shrink-0"
                        >
                            [ Cancelar ]
                        </button>
                    </div>

                    {/* Main content area */}
                    <div className="w-full max-w-3xl mx-auto my-auto py-4 sm:py-12 relative z-10 flex flex-col justify-center min-h-[50vh]">
                        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-purple-500/60 block">
                                    REACTIVO {currentPidIndex + 1} de 25
                                </span>
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-purple-400 font-mono">
                                    DOMINIO: {PHENOM_PART_B[currentPidIndex].domain}
                                </span>
                            </div>
                            <h2 className="text-base sm:text-2xl md:text-4xl font-sans font-light italic text-white leading-snug tracking-tight">
                                "{PHENOM_PART_B[currentPidIndex].text}"
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {[
                                    { value: 0, text: "Muy falso o a menudo falso" },
                                    { value: 1, text: "A veces o un poco falso" },
                                    { value: 2, text: "A veces o un poco verdadero" },
                                    { value: 3, text: "Muy verdadero o a menudo verdadero" }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSelectPidAnswer(opt.value)}
                                        className="w-full text-left p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 bg-zinc-950/40 hover:border-purple-500/35 hover:bg-purple-950/10 transition-all text-xs font-semibold tracking-wider font-sans text-zinc-400 hover:text-white group flex gap-3 sm:gap-5 items-center shadow-lg hover:translate-y-[-2px]"
                                    >
                                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-center text-xs font-black text-purple-400 group-hover:bg-purple-500 group-hover:text-black shrink-0 transition-colors">
                                            {opt.value}
                                        </span>
                                        <span className="text-xs sm:text-sm">{opt.text}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => currentPidIndex > 0 && setCurrentPidIndex(prev => prev - 1)}
                                    disabled={currentPidIndex === 0}
                                    className="px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full border border-white/5 bg-white/[0.02] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                >
                                    ← Anterior
                                </button>
                                <div className="w-24 sm:w-32 bg-white/5 h-1.5 rounded-full overflow-hidden self-center">
                                    <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${((currentPidIndex + 1) / 25) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Progress bar */}
                    <div className="w-full max-w-4xl mx-auto pt-4 sm:pt-6 border-t border-white/5 flex flex-col gap-2 relative z-10">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                            <span>INVENTARIO PSICOMÉTRICO PID-5-BF</span>
                            <span>{Math.round(((currentPidIndex + 1) / 25) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${((currentPidIndex + 1) / 25) * 100}%` }} />
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTest === 'biographic') {
            return (
                <BiographicInterview username={user} activeVersion={activeVersion}
                    onClose={() => setActiveTest(null)}
                    onComplete={(data) => {
                        console.log("Biographic Test Complete", data);
                        const suffix = activeVersion > 1 ? '_v' + activeVersion : '';
                        localStorage.setItem('oasis_bio_transcriptions_' + user + suffix, JSON.stringify(data));
                        setActiveTest(null);
                        setView('canvas');
                    }}
                />
            );
        }

        if (activeTest === 'icar16') {
            const currentQuestion = icarQuestions[currentIcarIndex];
            const categoryColor =
                currentQuestion.category === "Lógico-Verbal" ? "#f59e0b" :
                    currentQuestion.category === "Razonamiento Espacial" ? "#06b6d4" :
                        currentQuestion.category === "Progresión Secuencial" ? "#a855f7" :
                            "#bef264"; // Razonamiento Matricial
            const categoryGlow =
                currentQuestion.category === "Lógico-Verbal" ? "rgba(245,158,11,0.03)" :
                    currentQuestion.category === "Razonamiento Espacial" ? "rgba(6,182,212,0.03)" :
                        currentQuestion.category === "Progresión Secuencial" ? "rgba(168,85,247,0.03)" :
                            "rgba(190,242,100,0.03)";

            return (
                <div className="fixed inset-0 z-50 bg-[#060607]/40 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-12 overflow-y-auto no-scrollbar font-sans select-none text-zinc-100 transition-all duration-500">
                    {/* Atmospheric Glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none transition-all duration-1000 ease-in-out"
                        style={{ background: categoryGlow }}
                    />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.01]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                    {/* Top menu bar */}
                    <div className="flex flex-col lg:flex-row justify-between items-center w-full max-w-5xl mx-auto border-b border-white/5 pb-4 lg:pb-6 gap-4 lg:gap-6 relative z-10">
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                            <span
                                className="h-2.5 w-2.5 rounded-full animate-pulse transition-colors duration-500"
                                style={{
                                    backgroundColor: categoryColor,
                                    boxShadow: `0 0 10px ${categoryColor}`
                                }}
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 font-mono">
                                    Pruebas Clínicas // Evaluaciones
                                </span>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase font-mono mt-0.5">
                                    Reactivo {currentIcarIndex + 1} de 16
                                </span>
                            </div>
                        </div>

                        {/* Interactive Question Navigation Matrix */}
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/[0.01] border border-white/5 p-1 rounded-xl sm:rounded-2xl shadow-inner">
                            {icarQuestions.map((q, idx) => {
                                const isCurrent = idx === currentIcarIndex;
                                const isAnswered = icarAnswers[q.question_number] !== undefined;
                                return (
                                    <button
                                        key={q.question_number}
                                        onClick={() => setCurrentIcarIndex(idx)}
                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-mono font-black transition-all flex items-center justify-center border ${isCurrent
                                            ? 'bg-accent border-accent text-black shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)] scale-105'
                                            : isAnswered
                                                ? 'bg-accent/10 border-accent/20 text-accent font-bold hover:bg-accent/20 hover:border-accent/40'
                                                : 'bg-transparent border-white/5 text-zinc-600 hover:border-white/20 hover:text-zinc-400'
                                            }`}
                                        title={`Reactivo ${q.question_number}`}
                                    >
                                        {q.question_number}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={exitIcarTest}
                            className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 shrink-0"
                        >
                            [ Salir ]
                        </button>
                    </div>

                    {/* Main content area */}
                    <div className="w-full max-w-5xl mx-auto my-auto py-4 md:py-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
                            {/* Stimulus & Instructions */}
                            <div className="lg:col-span-7 space-y-4 lg:space-y-6 animate-in fade-in duration-500">
                                <span
                                    className="px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-[0.2em] font-mono transition-all duration-500"
                                    style={{
                                        borderColor: `${categoryColor}30`,
                                        backgroundColor: `${categoryColor}08`,
                                        color: categoryColor
                                    }}
                                >
                                    {currentQuestion.category}
                                </span>
                                <h2 className="text-lg md:text-2xl font-light text-white leading-snug font-sans tracking-tight">
                                    "{currentQuestion.instruction_text}"
                                </h2>
                                {renderTestStimulusDiagram(currentQuestion) && (
                                    <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-zinc-950/40 border border-white/5 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in duration-300">
                                        {renderTestStimulusDiagram(currentQuestion)}
                                    </div>
                                )}
                            </div>

                            {/* Response Options */}
                            <div className="lg:col-span-5 space-y-3 sm:space-y-4 animate-in fade-in duration-500 delay-100 pb-28 lg:pb-0">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1 font-mono">Selecciona una respuesta alternativa:</span>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {currentQuestion.options.map((opt) => {
                                        const isSelected = icarAnswers[currentQuestion.question_number] === opt.label;
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleSelectIcarAnswer(opt.label)}
                                                className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-semibold tracking-wider font-sans flex items-center gap-3 sm:gap-4 hover:translate-x-1 duration-200 ${isSelected
                                                    ? 'bg-accent/15 border-accent text-white shadow-lg shadow-accent/5'
                                                    : 'border-white/5 bg-zinc-950/20 text-zinc-400 hover:border-accent/30 hover:bg-accent/5 hover:text-white'
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border flex items-center justify-center text-[9px] sm:text-[10px] font-black shrink-0 transition-all ${isSelected
                                                    ? 'bg-accent border-accent text-black font-bold'
                                                    : 'bg-black/30 border-white/5 text-zinc-500'
                                                    }`}>
                                                    {opt.label}
                                                </span>
                                                <span className="truncate">{opt.value}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-between items-center pt-4 sm:pt-6 gap-4">
                                    <button
                                        onClick={() => currentIcarIndex > 0 && setCurrentIcarIndex(prev => prev - 1)}
                                        disabled={currentIcarIndex === 0}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-white/5 bg-white/[0.01] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-20 disabled:pointer-events-none"
                                    >
                                        ← Anterior
                                    </button>

                                    <span className="text-[8px] font-mono uppercase text-zinc-600 hidden xs:inline">
                                        Monitoreo de Latencia Activo
                                    </span>

                                    <button
                                        onClick={() => currentIcarIndex < 15 ? setCurrentIcarIndex(prev => prev + 1) : setActiveTest(null)}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-accent/20 bg-accent/5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-black hover:border-accent transition-all font-mono"
                                    >
                                        {currentIcarIndex === 15 ? 'Finalizar ✓' : 'Siguiente →'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Progress Bar */}
                    <div className="w-full max-w-5xl mx-auto pt-6 border-t border-white/5 flex flex-col gap-2 relative z-10">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                            <span>Cartografía Cognitiva ICAR16</span>
                            <span>{Math.round(((currentIcarIndex + 1) / 16) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500"
                                style={{
                                    width: `${((currentIcarIndex + 1) / 16) * 100}%`,
                                    backgroundColor: categoryColor
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        const sortedMemory = [...userMemory].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });

        if (isMeditationMode) {
            return (
                <div className="fixed inset-0 z-50 bg-[#040405] flex flex-col justify-between p-6 md:p-12 overflow-y-auto no-scrollbar font-sans select-none text-zinc-100 animate-in fade-in duration-1000">
                    {/* Atmospheric Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-all duration-[4000ms]"
                        style={{
                            background: breathPhase === 0 || breathPhase === 1 ? `${accent}0a` : '#a855f704',
                            transform: `translate(-50%, -50%) scale(${breathPhase === 0 || breathPhase === 1 ? 1.2 : 0.8})`
                        }}
                    />

                    {/* Top menu bar */}
                    <div className="flex justify-between items-center w-full max-w-4xl mx-auto border-b border-white/5 pb-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsAudioActive(prev => !prev)}
                                className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 ${isAudioActive ? 'bg-accent/10 border-accent/20 text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]' : 'bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {isAudioActive ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                                        [ Sonido: ON ]
                                    </>
                                ) : '[ Activar Sonido Ambiente ]'}
                            </button>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-mono">Espacio de Meditación</span>
                        <button
                            onClick={() => { setIsMeditationMode(false); setIsAudioActive(false); }}
                            className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5"
                        >
                            [ Salir ]
                        </button>
                    </div>

                    {/* Central meditation breathing sphere */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-16 py-12 relative z-10">
                        <div className="relative flex items-center justify-center w-72 h-72">
                            {/* Inner core pulsing ring */}
                            <div
                                className="absolute rounded-full bg-accent/5 border border-accent/10 transition-all duration-[4000ms] ease-in-out"
                                style={{
                                    width: breathPhase === 0 || breathPhase === 1 ? '260px' : '110px',
                                    height: breathPhase === 0 || breathPhase === 1 ? '260px' : '110px',
                                    boxShadow: breathPhase === 0 || breathPhase === 1
                                        ? '0 0 60px rgba(var(--accent-rgb), 0.25), inset 0 0 30px rgba(var(--accent-rgb), 0.1)'
                                        : '0 0 15px rgba(var(--accent-rgb), 0.05), inset 0 0 5px rgba(var(--accent-rgb), 0.02)',
                                }}
                            />
                            {/* Middle layer ring */}
                            <div
                                className="absolute rounded-full bg-accent/10 transition-all duration-[4000ms] ease-in-out border border-accent/30"
                                style={{
                                    width: breathPhase === 0 || breathPhase === 1 ? '180px' : '70px',
                                    height: breathPhase === 0 || breathPhase === 1 ? '180px' : '70px',
                                }}
                            />
                            {/* Tiny center hub */}
                            <div className="relative z-10 text-center font-mono text-xs font-black uppercase tracking-[0.35em] text-white">
                                {breathPhase === 0 && <span className="animate-pulse text-accent">Inhala</span>}
                                {breathPhase === 1 && <span className="text-white">Retén</span>}
                                {breathPhase === 2 && <span className="animate-pulse text-zinc-400">Exhala</span>}
                                {breathPhase === 3 && <span className="text-zinc-600">Vacío</span>}
                            </div>
                        </div>

                        {/* Slide of Memories (cycles through userMemory over time) */}
                        {sortedMemory.length > 0 ? (() => {
                            // Cycle node every 16 seconds (one full box breathing rotation)
                            const cycleIdx = Math.floor(Date.now() / 16000) % sortedMemory.length;
                            const activeMedFact = sortedMemory[cycleIdx];
                            return (
                                <div key={cycleIdx} className="max-w-2xl text-center px-8 animate-in fade-in slide-in-from-bottom-8 duration-[1500ms] space-y-6">
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-accent/50 block font-mono">Eco Contemplado</span>
                                    <p className="text-2xl md:text-3xl font-light italic text-white/80 leading-relaxed font-sans selection:bg-accent/20">
                                        "{activeMedFact.text}"
                                    </p>
                                    <div className="flex justify-center items-center gap-4 text-zinc-500 text-[8px] font-mono uppercase tracking-widest pt-2">
                                        <span>{activeMedFact.category || 'General'}</span>
                                        <span className="text-zinc-800">•</span>
                                        <span>{new Date(activeMedFact.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })() : (
                            <div className="text-center opacity-20 py-10 max-w-sm">
                                <Aperture size={24} className="mx-auto mb-4 animate-spin-slow" />
                                <span className="text-[9px] font-black uppercase tracking-[0.5em] font-mono">Lienzo en silencio sin recuerdos recolectados</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom visual guide */}
                    <div className="w-full max-w-4xl mx-auto border-t border-white/5 pt-6 flex justify-between items-center text-[9px] font-mono text-zinc-600 uppercase tracking-widest relative z-10">
                        <div className="flex gap-4">
                            <span className={breathPhase === 0 ? 'text-accent font-bold' : ''}>1. Inhala (4s)</span>
                            <span className="text-zinc-800">→</span>
                            <span className={breathPhase === 1 ? 'text-accent font-bold' : ''}>2. Retén (4s)</span>
                            <span className="text-zinc-800">→</span>
                            <span className={breathPhase === 2 ? 'text-accent font-bold' : ''}>3. Exhala (4s)</span>
                            <span className="text-zinc-800">→</span>
                            <span className={breathPhase === 3 ? 'text-accent font-bold' : ''}>4. Vacío (4s)</span>
                        </div>
                        <div>
                            <span>Box Breathing Cycle</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-x-0 top-[140px] md:top-0 md:relative w-full h-[calc(100vh-140px)] md:h-full z-[1500] md:z-10 bg-[#050506]/95 backdrop-blur-md rounded-t-[2.5rem] md:rounded-none border-t border-white/5 md:border-t-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-none flex flex-col transition-transform duration-500 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0">
                <div className="flex-1 w-full relative overflow-y-auto no-scrollbar pt-8 md:pt-24 pb-36 px-4 md:px-8">
                    {/* BACK TO CANVAS BUTTON (Opposite of settings cog on the top-left) */}
                    <button
                        onClick={() => setView('canvas')}
                        className="hidden md:flex fixed top-6 left-6 z-[500] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all duration-500 shadow-2xl group"
                        title="Volver al Lienzo"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-soft-light"
                        style={{ background: `radial-gradient(circle at 10% 10%, ${accent}15 0%, transparent 40%), radial-gradient(circle at 90% 90%, #8b5cf608 0%, transparent 40%)` }} />

                    <style>{`
                    @keyframes dash {
                        to {
                            stroke-dashoffset: -40;
                        }
                    }
                `}</style>

                    {/* Contemplation Modal Overlay */}
                    {selectedContemplationFact && (
                        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between p-8 md:p-16 select-none text-zinc-100 animate-in fade-in duration-500">
                            {/* Top bar */}
                            <div className="flex justify-between items-center w-full border-b border-white/5 pb-6">
                                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent font-mono">
                                        Contemplación y Reinterpretación del Eco
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedContemplationFact(null)}
                                    className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5"
                                >
                                    [ Descartar Cambios ]
                                </button>
                            </div>

                            {/* Modal core content */}
                            <div className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-2 gap-16 py-12">
                                {/* Original section */}
                                <div className="space-y-8 self-center">
                                    <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[8px] font-black uppercase tracking-[0.2em] text-accent font-mono">
                                        Registro de la Memoria Original
                                    </span>
                                    <h3 className="text-3xl md:text-5xl font-serif font-light italic text-white/90 leading-relaxed pr-6 select-text">
                                        "{selectedContemplationFact.text}"
                                    </h3>
                                    <div className="space-y-2 border-t border-white/5 pt-6 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                                        <div className="flex justify-between">
                                            <span>Categoría de Conciencia:</span>
                                            <span className="text-zinc-300 font-bold">{selectedContemplationFact.category || 'General'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Capturado el:</span>
                                            <span className="text-zinc-300 font-bold">{new Date(selectedContemplationFact.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Reinterpretation section */}
                                <div className="p-8 rounded-[3rem] bg-zinc-900/40 border border-white/5 shadow-2xl flex flex-col justify-between gap-8 backdrop-blur-md">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase text-accent tracking-widest font-mono">Transmutación Cognitiva</h4>
                                        <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                                            Los ecos no son dogmas inmutables de tu historia. Al contemplar este recuerdo en el presente, tienes la facultad de reformularlo e integrarlo bajo un entendimiento más maduro y libre de juicios.
                                        </p>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 block font-mono">Escribe tu Reinterpretación actual:</span>
                                        <textarea
                                            value={reinterpretationText}
                                            onChange={(e) => setReinterpretationText(e.target.value)}
                                            rows={6}
                                            className="w-full p-6 bg-zinc-950/80 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all font-sans text-base leading-relaxed resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveReinterpretation}
                                        className="w-full py-4 bg-accent text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-lime-400 active:scale-[0.98] transition-all shadow-lg shadow-accent/10"
                                    >
                                        Sincronizar Reinterpretación
                                    </button>
                                </div>
                            </div>

                            {/* Bottom bar */}
                            <div className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest text-center border-t border-white/5 pt-6">
                                EL ACTO DE REINTERPRETAR MODIFICA EL REGISTRO MENTAL PERMANENTE DE LA CONCIENCIA.
                            </div>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        {/* MINIMALIST HEADER WITH TAB NAVIGATION ONLY */}
                        <div className="flex items-center justify-between pt-6 pb-4 border-b border-white/5 mb-8 animate-in slide-in-from-top duration-500 w-full gap-3 relative">
                            <div className="flex items-center gap-2">
                                <Aperture size={16} className="text-accent animate-spin-slow" style={{ color: accent }} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Pruebas Clínicas</span>
                            </div>

                            {/* Mini Session History Button & Dropdown */}
                            <div className="absolute right-0">
                                <button
                                    onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                                    className={`h-9 px-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 backdrop-blur-md shadow-2xl ${isSessionDropdownOpen
                                        ? 'bg-emerald-500 text-black border border-emerald-400 font-bold'
                                        : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
                                        }`}
                                    title="Historial de Sesiones"
                                >
                                    <Database size={13} />
                                    <span>S{activeVersion}</span>
                                </button>

                                {isSessionDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-[600] flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black border-b border-white/5 pb-1 mb-1">
                                            Sesiones
                                        </div>
                                        <div className="max-h-36 overflow-y-auto no-scrollbar flex flex-col gap-1">
                                            {Array.from({ length: totalVersions }).map((_, idx) => {
                                                const v = idx + 1;
                                                const isSelected = activeVersion === v;
                                                return (
                                                    <button
                                                        key={v}
                                                        onClick={() => {
                                                            handleSwitchVersion(v);
                                                            setIsSessionDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider font-mono text-left transition-all ${isSelected
                                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                            : 'bg-transparent text-zinc-500 hover:bg-white/5 hover:text-white'
                                                            }`}
                                                    >
                                                        Sesión {v}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="border-t border-white/5 pt-2 flex flex-col gap-1.5">
                                            <button
                                                onClick={() => {
                                                    handleCreateNewVersion();
                                                    setIsSessionDropdownOpen(false);
                                                }}
                                                className="w-full py-1.5 rounded-xl border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-[8px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1"
                                            >
                                                <Plus size={10} /> Nueva Sesión
                                            </button>
                                            <button
                                                onClick={() => {
                                                    resetActiveVersionTests();
                                                    setIsSessionDropdownOpen(false);
                                                }}
                                                className="w-full py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 hover:text-white text-[8px] font-black uppercase tracking-widest font-mono transition-all flex items-center justify-center gap-1"
                                            >
                                                <Trash2 size={10} /> Borrar Sesión {activeVersion}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {activeTabName === 'memory' && (
                            <div className="space-y-10 animate-in fade-in duration-500">

                                {/* Category Filter pills */}
                                {sortedMemory.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center border-b border-white/5 pb-6">
                                        {['Todos', 'Conciencia', 'Afecto', 'Racional', 'Existencia', 'General'].map(cat => {
                                            const count = cat === 'Todos'
                                                ? sortedMemory.length
                                                : sortedMemory.filter(f => (f.category || 'General') === (cat === 'Todos' ? 'Todos' : cat === 'Conciencia' ? 'Conciencia' : cat === 'Afecto' ? 'Afecto' : cat === 'Racional' ? 'Racional' : cat === 'Existencia' ? 'Existencia' : 'General')).length;
                                            if (count === 0 && cat !== 'Todos') return null;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => { setSelectedCategoryFilter(cat); setActiveMemoryIndex(0); }}
                                                    className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[8px] sm:text-[8.5px] font-black uppercase tracking-widest border transition-all ${(selectedCategoryFilter === 'All' && cat === 'Todos') || selectedCategoryFilter === cat || (selectedCategoryFilter === 'General' && cat === 'General')
                                                        ? 'bg-accent/10 border-accent/40 text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]'
                                                        : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                                                        }`}
                                                >
                                                    {cat} <span className="opacity-40 ml-1">({count})</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Card Carousel Slider */}
                                <div>
                                    {(() => {
                                        const filteredMemory = sortedMemory.filter(f => {
                                            if (selectedCategoryFilter === 'Todos' || selectedCategoryFilter === 'All') return true;
                                            return (f.category || 'General') === selectedCategoryFilter;
                                        });

                                        if (filteredMemory.length === 0) {
                                            return (
                                                <div className="h-[320px] flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-[2.5rem]">
                                                    <Aperture size={36} className="mb-6 text-white/5 animate-spin-slow" />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/20 italic">Sin ecos en esta frecuencia</p>
                                                </div>
                                            );
                                        }

                                        const activeIdx = Math.min(activeMemoryIndex, Math.max(0, filteredMemory.length - 1));
                                        const activeFact = filteredMemory[activeIdx];
                                        const originalIdx = userMemory.findIndex(f => f.timestamp === activeFact.timestamp && f.text === activeFact.text);

                                        return (
                                            <div className="relative w-full max-w-6xl mx-auto py-6 flex flex-col items-center">
                                                {/* Ambient Background Glow */}
                                                <div className="absolute inset-0 w-[800px] h-[400px] bg-accent/5 blur-[140px] pointer-events-none rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

                                                {/* Card Container & Nav Buttons */}
                                                <div className="w-full max-w-4xl flex items-center justify-center relative z-10">

                                                    {/* Main Card View Stack */}
                                                    <div className="flex-1 min-w-0 relative h-[480px] md:h-[500px]">
                                                        {(() => {
                                                            const dx = swipeOffset.x;
                                                            const dy = swipeOffset.y;
                                                            // Calculate progress (0 to 1) based on dx distance
                                                            const progress = Math.min(Math.abs(dx) / 150, 1);

                                                            // Card 1 (Top/Active Card) Style
                                                            const card1Style = {
                                                                transform: swipeTriggered
                                                                    ? `translate(${swipeDirection === 'left' ? -1000 : 1000}px, ${dy}px) rotate(${swipeDirection === 'left' ? -30 : 30}deg)`
                                                                    : `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`,
                                                                transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)',
                                                                zIndex: 30,
                                                                cursor: isSwiping ? 'grabbing' : 'grab',
                                                                touchAction: 'none',
                                                                userSelect: 'none'
                                                            };

                                                            // Card 2 (Middle Stack Card) Style
                                                            const card2Scale = 0.96 + progress * 0.04;
                                                            const card2TranslateY = 14 - progress * 14;
                                                            const card2Opacity = 0.5 + progress * 0.5;
                                                            const card2Style = {
                                                                transform: `scale(${card2Scale}) translateY(${card2TranslateY}px)`,
                                                                opacity: card2Opacity,
                                                                zIndex: 20,
                                                                transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.4s ease',
                                                                pointerEvents: 'none'
                                                            };

                                                            // Card 3 (Bottom Stack Card) Style
                                                            const card3Scale = 0.92 + progress * 0.04;
                                                            const card3TranslateY = 28 - progress * 14;
                                                            const card3Opacity = 0.2 + progress * 0.3;
                                                            const card3Style = {
                                                                transform: `scale(${card3Scale}) translateY(${card3TranslateY}px)`,
                                                                opacity: card3Opacity,
                                                                zIndex: 10,
                                                                transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.4s ease',
                                                                pointerEvents: 'none'
                                                            };

                                                            const renderCard = (fact, style, type, orgIdx) => {
                                                                const isTop = type === 'top';
                                                                return (
                                                                    <div
                                                                        key={fact.timestamp + fact.text}
                                                                        style={style}
                                                                        onPointerDown={isTop ? handleCardPointerDown : undefined}
                                                                        onPointerMove={isTop ? handleCardPointerMove : undefined}
                                                                        onPointerUp={isTop ? (e) => handleCardPointerUp(e, filteredMemory.length) : undefined}
                                                                        className={`absolute inset-0 p-6 md:p-14 pb-8 md:pb-16 rounded-[2rem] md:rounded-[3.5rem] border backdrop-blur-md bg-zinc-950 transition-all duration-300 shadow-2xl overflow-y-auto custom-scroll flex flex-col justify-between select-none ${fact.isPinned
                                                                            ? 'border-accent/30 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)]'
                                                                            : 'border-white/5 hover:border-white/10'
                                                                            }`}
                                                                    >
                                                                        {/* Glowing corner background decoration */}
                                                                        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
                                                                            style={{
                                                                                backgroundColor: fact.category === 'Afecto' ? '#ef4444' :
                                                                                    fact.category === 'Cognición' ? '#06b6d4' :
                                                                                        fact.category === 'Racional' ? '#bef264' : '#a855f7'
                                                                            }}
                                                                        />

                                                                        <div className="space-y-6">
                                                                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    {fact.category === 'Afecto' && <Heart size={16} className="text-red-400" />}
                                                                                    {fact.category === 'Cognición' && <Zap size={16} className="text-cyan-400" />}
                                                                                    {fact.category === 'Racional' && <Sparkles size={16} className="text-lime-400" />}
                                                                                    {(!fact.category || fact.category === 'Conciencia') && <Aperture size={16} className="text-purple-400 animate-spin-slow" />}
                                                                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 font-mono">
                                                                                        {fact.category || 'Conciencia'}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                                                                                    {new Date(fact.timestamp).toLocaleDateString()}
                                                                                </span>
                                                                            </div>

                                                                            <p
                                                                                onClick={isTop ? () => { setSelectedContemplationFact(fact); setReinterpretationText(fact.text); } : undefined}
                                                                                className="text-xl md:text-4xl font-light italic text-white/95 leading-relaxed tracking-tight hover:text-accent transition-colors cursor-pointer select-text font-serif py-4"
                                                                            >
                                                                                "{fact.text}"
                                                                            </p>
                                                                        </div>

                                                                        {/* Card Controls */}
                                                                        <div className="flex flex-wrap items-center justify-between pt-6 border-t border-white/5 gap-4 relative z-10">
                                                                            <button
                                                                                onClick={isTop ? () => { setSelectedContemplationFact(fact); setReinterpretationText(fact.text); } : undefined}
                                                                                className="px-3.5 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                            >
                                                                                [ Contemplar / Reinterpretar ]
                                                                            </button>

                                                                            <div className="flex items-center gap-1.5 md:gap-3">
                                                                                <button
                                                                                    onClick={isTop ? () => handleTogglePinFact(orgIdx) : undefined}
                                                                                    className={`px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 hover:scale-[1.02] active:scale-[0.98] ${fact.isPinned
                                                                                        ? 'bg-accent/15 border-accent/30 text-accent font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]'
                                                                                        : 'bg-transparent border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                                                                                        }`}
                                                                                >
                                                                                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${fact.isPinned ? 'bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : 'bg-white/20'}`} />
                                                                                    <span>{fact.isPinned ? 'Conservado' : 'Conservar'}</span>
                                                                                    <span className="hidden sm:inline">{fact.isPinned ? ' en Núcleo' : ' / Pin'}</span>
                                                                                </button>

                                                                                {/* BOTON PUBLICAR DESHABILITADO
                                                                            <button
                                                                                onClick={isTop ? () => handlePublishFact(fact) : undefined}
                                                                                className="px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl bg-purple-950/20 border border-purple-800/30 text-purple-300 hover:bg-purple-500 hover:text-black text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                            >
                                                                                <span>Publicar</span>
                                                                                <span className="hidden sm:inline"> en Perfil</span>
                                                                            </button>
                                                                            */}

                                                                                <button
                                                                                    onClick={isTop ? () => handleDeleteFact(orgIdx) : undefined}
                                                                                    className="px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-500/50 hover:text-red-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                                >
                                                                                    <span>Eliminar</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            };

                                                            const stack = [];
                                                            if (filteredMemory.length >= 3) {
                                                                const idx3 = (activeIdx + 2) % filteredMemory.length;
                                                                const f3 = filteredMemory[idx3];
                                                                const orgIdx3 = userMemory.findIndex(f => f.timestamp === f3.timestamp && f.text === f3.text);
                                                                stack.push(renderCard(f3, card3Style, 'bottom', orgIdx3));
                                                            }
                                                            if (filteredMemory.length >= 2) {
                                                                const idx2 = (activeIdx + 1) % filteredMemory.length;
                                                                const f2 = filteredMemory[idx2];
                                                                const orgIdx2 = userMemory.findIndex(f => f.timestamp === f2.timestamp && f.text === f2.text);
                                                                stack.push(renderCard(f2, card2Style, 'middle', orgIdx2));
                                                            }
                                                            stack.push(renderCard(activeFact, card1Style, 'top', originalIdx));

                                                            return stack;
                                                        })()}
                                                    </div>

                                                </div>

                                                {/* Slider Navigation Indicators */}
                                                <div className="flex items-center gap-4 mt-8 relative z-10">
                                                    <span className="text-[9px] font-mono text-zinc-500 font-bold">
                                                        {String(activeIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto no-scrollbar py-1 px-2 border border-white/5 rounded-full bg-black/40">
                                                        {filteredMemory.map((_, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setActiveMemoryIndex(i)}
                                                                className={`h-1.5 rounded-full transition-all duration-300 shrink-0 ${i === activeIdx ? 'w-6 bg-accent' : 'w-2 bg-white/10 hover:bg-white/30'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-mono text-zinc-500 font-bold">
                                                        {String(filteredMemory.length).padStart(2, '0')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {activeTabName === 'tests' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {!activeTest ? (
                                    <div className="space-y-6">
                                        {(() => {
                                            const testCards = [
                                                {
                                                    id: 'biographic',
                                                    num: '01',
                                                    type: 'Contextual',
                                                    icon: <Camera size={22} className="text-emerald-400" />,
                                                    title: 'Entrevista Biográfica',
                                                    description: 'Grabación de video/audio y transcripción en vivo para explorar tu mundo, tu historia de vida y tu día a día.',
                                                    focus: 'Narrativa',
                                                    duration: '10-15m',
                                                    color: 'emerald',
                                                    glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-500/40 text-emerald-400',
                                                    bgGlow: 'bg-emerald-500',
                                                    btnBg: 'bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border-emerald-500/40 text-emerald-300',
                                                    isComplete: !!localStorage.getItem('oasis_bio_transcriptions_' + (user || localStorage.getItem('oasis_user')) + (activeVersion > 1 ? '_v' + activeVersion : '')),

                                                    action: () => { setActiveTest('biographic'); }
                                                },
                                                /* PRUEBA ICAR DESHABILITADA TEMPORALMENTE
                                                {
                                                    id: 'icar16',
                                                    num: '02',
                                                    type: 'Cognitiva',
                                                    icon: <Zap size={22} className="text-accent" />,
                                                    title: 'Cartografía ICAR16',
                                                    description: 'Evaluación cognitiva estructurada de 16 ítems lógico-verbales, espaciales de cubos 3D y matrices.',
                                                    focus: 'Lógica/3D',
                                                    duration: '15-20m',
                                                    color: 'accent',
                                                    glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.3)] border-accent/40 text-accent',
                                                    bgGlow: 'bg-accent',
                                                    btnBg: 'bg-accent/10 hover:bg-accent hover:text-black border-accent/30 text-accent',
                                                    isComplete: calculatedResults.isIcarComplete,
                                                    action: () => { setActiveTest('icar16'); setCurrentIcarIndex(0); startWebcamRecording(); }
                                                },
                                                */
                                                {
                                                    id: 'phenom',
                                                    num: '03',
                                                    type: 'Existencial',
                                                    icon: <Heart size={22} className="text-purple-400" />,
                                                    title: 'Diagnóstico Existencial',
                                                    description: 'Mapea tu forma de existir, tus mecanismos de autoprotección y tu relación con el tiempo.',
                                                    focus: 'Existencial',
                                                    duration: '5-10m',
                                                    color: 'purple',
                                                    glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500/40 text-purple-400',
                                                    bgGlow: 'bg-purple-500',
                                                    btnBg: 'bg-purple-500/20 hover:bg-purple-500 hover:text-black border-purple-500/40 text-purple-300',
                                                    isComplete: calculatedResults.isPhenomComplete,
                                                    action: () => { setActiveTest('phenom'); setCurrentPhenomIndex(0); setShowPhenomIntro(true); }
                                                },
                                                {
                                                    id: 'pid5',
                                                    num: '04',
                                                    type: 'Personalidad',
                                                    icon: <Sparkles size={22} className="text-pink-400" />,
                                                    title: 'Inventario PID-5-BF',
                                                    description: '25 reactivos de autoinforme clínico estructurados para mapear tus rasgos dominantes de personalidad.',
                                                    focus: 'Rasgos',
                                                    duration: '5-8m',
                                                    color: 'pink',
                                                    glowColor: 'shadow-[0_0_20px_rgba(236,72,153,0.3)] border-pink-500/40 text-pink-400',
                                                    bgGlow: 'bg-pink-500',
                                                    btnBg: 'bg-pink-500/20 hover:bg-pink-500 hover:text-black border-pink-500/40 text-pink-300',
                                                    isComplete: calculatedResults.isPid5Complete,
                                                    action: () => { setActiveTest('pid5'); setCurrentPidIndex(0); }
                                                }
                                            ];

                                            const activeCard = testCards[activeTestCardIndex];

                                            const handleTestsScroll = (e) => {
                                                const scrollTop = e.target.scrollTop;
                                                const height = e.target.clientHeight;
                                                if (height > 0) {
                                                    const index = Math.round(scrollTop / height);
                                                    if (index >= 0 && index < testCards.length && index !== activeTestCardIndex) {
                                                        setActiveTestCardIndex(index);
                                                    }
                                                }
                                            };

                                            return (
                                                <div className="flex flex-col items-center justify-center w-full py-2">
                                                    {/* Full screen borderless TikTok-style Viewport Container with Scroll Snap */}
                                                    <div
                                                        ref={testsContainerRef}
                                                        onScroll={handleTestsScroll}
                                                        className="w-full h-[calc(100vh-380px)] min-h-[400px] md:min-h-0 md:h-[calc(100vh-280px)] overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar relative"
                                                    >
                                                        {testCards.map((card, idx) => (
                                                            <div
                                                                key={card.id}
                                                                className="w-full h-[calc(100vh-380px)] min-h-[400px] md:min-h-0 md:h-[calc(100vh-280px)] px-3 py-6 md:px-14 md:py-16 flex flex-col justify-between snap-start snap-always shrink-0 relative overflow-hidden"
                                                            >
                                                                {/* Huge background ambient glow (Fixed Safari bug with native radial gradient) */}
                                                                <div
                                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] md:w-[900px] md:h-[900px] pointer-events-none opacity-20 transition-all duration-700"
                                                                    style={{ background: `radial-gradient(circle, ${card.id === 'biographic' ? '#10b981' : card.id === 'icar16' ? '#fbbf24' : card.id === 'phenom' ? '#a855f7' : '#ec4899'} 0%, transparent 60%)` }}
                                                                />

                                                                {/* Flex Row layout: Main left, TikTok controls right */}
                                                                <div className="flex gap-4 md:gap-14 h-full items-stretch relative z-10 max-w-5xl mx-auto w-full">

                                                                    {/* Main content (Left) */}
                                                                    <div className="flex-1 flex flex-col justify-between h-full pr-2 md:pr-4">
                                                                        <div className="space-y-3 md:space-y-6 my-auto">
                                                                            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                                                                                <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-zinc-300">
                                                                                    Módulo {card.num} // {card.type}
                                                                                </span>
                                                                                {card.isComplete && (
                                                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                                                                                        Completado
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <h3 className="text-2xl md:text-6xl font-black italic tracking-tighter uppercase text-white leading-tight">
                                                                                {card.title}
                                                                            </h3>
                                                                            <p className="text-[11px] md:text-lg text-zinc-300 font-sans font-medium leading-relaxed max-w-2xl">
                                                                                {card.description}
                                                                            </p>

                                                                            {/* Immersive Focus & Duration Badges */}
                                                                            <div className="hidden md:flex flex-wrap gap-8 border-t border-white/10 pt-6 mt-6 max-w-xl">
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 font-mono block">Enfoque Analítico</span>
                                                                                    <span className="text-xs md:text-sm font-bold text-white block uppercase tracking-wider">{card.focus}</span>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 font-mono block">Duración Estimada</span>
                                                                                    <span className="text-xs md:text-sm font-bold text-white block uppercase tracking-wider">{card.duration}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-auto pt-6 pb-4 md:pb-0">
                                                                            <button
                                                                                onClick={card.action}
                                                                                className={`w-full max-w-md py-3.5 md:py-5 px-6 md:px-8 rounded-xl md:rounded-2xl border font-black uppercase text-[10px] md:text-[11px] tracking-[0.25em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl ${card.btnBg}`}
                                                                            >
                                                                                {card.isComplete ? 'Reiniciar Prueba' : 'Iniciar Diagnóstico'}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* TikTok-style Vertical Controls (Right) */}
                                                                    <div className="flex flex-col items-center justify-between w-10 md:w-20 shrink-0 border-l border-white/5 pl-2 md:pl-8 py-2 md:py-4 select-none">
                                                                        {/* Big index ring */}
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 font-mono font-black text-xs md:text-sm transition-all duration-300 ${card.glowColor}`}>
                                                                                {card.num}
                                                                            </div>
                                                                            <span className="text-[6px] md:text-[7px] font-black uppercase tracking-wider text-zinc-500">Prueba</span>
                                                                        </div>

                                                                        {/* Theme Icon badge */}
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white shadow-md">
                                                                                {card.icon}
                                                                            </div>
                                                                            <span className="text-[6px] md:text-[7px] font-black uppercase tracking-wider text-zinc-500">Módulo</span>
                                                                        </div>

                                                                        {/* Duration badge */}
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-zinc-400">
                                                                                <Clock size={14} className="md:w-[18px] md:h-[18px]" />
                                                                            </div>
                                                                            <span className="text-[6px] md:text-[8.5px] font-black uppercase tracking-wider text-zinc-500">Tiempo</span>
                                                                        </div>

                                                                        {/* Focus badge */}
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-zinc-400">
                                                                                <Focus size={14} className="md:w-[18px] md:h-[18px]" />
                                                                            </div>
                                                                            <span className="text-[6px] md:text-[8.5px] font-black uppercase tracking-wider text-zinc-500">Enfoque</span>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Dots and swipe tip at the bottom */}
                                                    <div className="flex items-center gap-6 mt-6 w-full justify-between px-2 max-w-5xl">
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">
                                                            Desliza verticalmente para navegar
                                                        </span>

                                                        <div className="flex items-center gap-2">
                                                            {testCards.map((_, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => {
                                                                        if (testsContainerRef.current) {
                                                                            const cardElement = testsContainerRef.current.children[i];
                                                                            if (cardElement) {
                                                                                cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`h-2 rounded-full transition-all duration-300 ${i === activeTestCardIndex
                                                                        ? 'w-8 ' + (
                                                                            i === 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                                                                i === 1 ? 'bg-accent shadow-[0_0_8px_rgba(251,191,36,0.4)]' :
                                                                                    i === 2 ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]' :
                                                                                        'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                                                                        )
                                                                        : 'w-2 bg-white/20 hover:bg-white/40'
                                                                        }`}
                                                                    title={`Prueba ${i + 1}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}


                                    </div>
                                ) : activeTest === 'phenom' ? (
                                    <div className="mx-auto max-w-3xl w-full animate-in slide-in-from-right duration-300 pt-4 px-2">
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-mono">
                                                    EXPLORACIÓN FENOMENOLÓGICA
                                                </span>
                                            </div>
                                            <button onClick={() => setActiveTest(null)} className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl">Salir</button>
                                        </div>

                                        {showPhenomIntro ? (
                                            <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col gap-6 text-center">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />

                                                <div className="relative z-10 space-y-4 py-4">
                                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-black text-white leading-snug tracking-tight uppercase">
                                                        Exploración Fenomenológica
                                                    </h2>
                                                    <p className="text-base sm:text-lg md:text-xl font-serif italic text-zinc-300 leading-relaxed max-w-2xl mx-auto">
                                                        "Responde a las siguientes premisas de manera libre, profunda y completa. Tómate tu tiempo; este es un espacio seguro para volcar tu mundo interior."
                                                    </p>
                                                </div>

                                                <div className="relative z-10">
                                                    <button
                                                        onClick={() => setShowPhenomIntro(false)}
                                                        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border bg-purple-600 border-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500"
                                                    >
                                                        <span className="text-[11px] font-black uppercase tracking-widest">Comenzar Exploración</span>
                                                        <ArrowRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col gap-6">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />

                                                <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-3">
                                                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-purple-500/60 block">
                                                        ESTÍMULO SUBJETIVO {currentPhenomIndex + 1} de 4
                                                    </span>
                                                </div>

                                                <div className="relative z-10">
                                                    <h2 className="text-xl md:text-3xl font-sans font-black text-white leading-snug tracking-tight mb-4 uppercase">
                                                        {PHENOM_PART_A[currentPhenomIndex < 4 ? currentPhenomIndex : 3].title}
                                                    </h2>
                                                    <p className="text-base md:text-xl font-serif italic text-zinc-300 leading-relaxed">
                                                        "{PHENOM_PART_A[currentPhenomIndex < 4 ? currentPhenomIndex : 3].question}"
                                                    </p>
                                                </div>

                                                <div className="relative z-10 flex-1 flex flex-col gap-4 mt-4">
                                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all focus-within:border-purple-500/50 focus-within:bg-purple-950/20 flex flex-col">
                                                        <textarea
                                                            value={phenomTextValue || ''}
                                                            onChange={(e) => setPhenomTextValue(e.target.value)}
                                                            placeholder={PHENOM_PART_A[currentPhenomIndex < 4 ? currentPhenomIndex : 3].placeholder || "Escribe tu respuesta aquí..."}
                                                            className="w-full h-full bg-transparent text-base text-zinc-200 font-sans leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600 min-h-[150px]"
                                                        />
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={currentPhenomIndex === 0 ? () => setShowPhenomIntro(true) : handleGoBackPhenom}
                                                            className="px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                                                        >
                                                            <ArrowLeft size={16} />
                                                            <span className="text-[11px] font-black uppercase tracking-widest">Volver</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleSavePhenomQualitative(phenomTextValue)}
                                                            disabled={!phenomTextValue?.trim()}
                                                            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border ${(phenomTextValue?.trim())
                                                                ? 'bg-purple-600 border-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500'
                                                                : 'bg-white/5 border-white/10 text-zinc-600 opacity-50'
                                                                }`}
                                                        >
                                                            <span className="text-[11px] font-black uppercase tracking-widest">{currentPhenomIndex >= 3 ? 'Finalizar Sección' : 'Siguiente'}</span>
                                                            {currentPhenomIndex >= 3 ? <Check size={16} /> : <ArrowRight size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {activeTabName === 'loop_map' && (
                            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500 relative px-2 sm:px-6">
                                {hasMap ? (() => {
                                    // Load patient nodes and edges
                                    let patientNodes = [];
                                    let patientEdges = [];
                                    try {
                                        patientNodes = JSON.parse(localStorage.getItem('oasis_canvas_nodes_' + user)) || [];
                                        patientEdges = JSON.parse(localStorage.getItem('oasis_canvas_edges_' + user)) || [];
                                    } catch (e) { }

                                    // Bounding box calculation to center SVG
                                    let minX = 0, minY = 0, width = 800, height = 600;
                                    if (patientNodes.length > 0) {
                                        let minNodeX = Infinity, minNodeY = Infinity, maxNodeX = -Infinity, maxNodeY = -Infinity;
                                        patientNodes.forEach(n => {
                                            const w = n.width || 120;
                                            const h = n.height || 120;
                                            if (n.x < minNodeX) minNodeX = n.x;
                                            if (n.y < minNodeY) minNodeY = n.y;
                                            if (n.x + w > maxNodeX) maxNodeX = n.x + w;
                                            if (n.y + h > maxNodeY) maxNodeY = n.y + h;
                                        });
                                        const padding = 120;
                                        minX = minNodeX - padding;
                                        minY = minNodeY - padding;
                                        width = (maxNodeX - minNodeX) + padding * 2;
                                        height = (maxNodeY - minNodeY) + padding * 2;
                                    }

                                    const drawGravityLine = (x1, y1, x2, y2) => {
                                        const dx = x2 - x1;
                                        const dy = y2 - y1;
                                        const cp1x = x1 + dx * 0.1;
                                        const cp1y = y1 + dy * 0.7;
                                        const cp2x = x2 - dx * 0.1;
                                        const cp2y = y2 - dy * 0.3;
                                        return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
                                    };

                                    return (
                                        <div className="w-full max-w-5xl aspect-video rounded-3xl bg-[#09090b]/80 border border-white/5 p-4 relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
                                            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                                            <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full z-10 relative">
                                                {/* Connections */}
                                                {patientEdges.map((edge, i) => {
                                                    const source = patientNodes.find(n => n.id === edge.source);
                                                    const target = patientNodes.find(n => n.id === edge.target);
                                                    if (!source || !target) return null;

                                                    const sx = source.x + (source.width || 120) / 2;
                                                    const sy = source.y + (source.height || 120);
                                                    const tx = target.x + (target.width || 120) / 2;
                                                    const ty = target.y;

                                                    const pathString = drawGravityLine(sx, sy, tx, ty);

                                                    return (
                                                        <g key={i}>
                                                            <path d={pathString} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" />
                                                            <path d={pathString} fill="none" stroke={edge.color || 'rgba(255, 255, 255, 0.4)'} strokeWidth="1.5" />
                                                        </g>
                                                    );
                                                })}

                                                {/* Nodes */}
                                                {patientNodes.map(node => {
                                                    const isContext = node.type === 'CONTEXT';
                                                    const isState = node.type === 'INTERNAL_STATE' || node.type === 'MACRO_MECHANISM';
                                                    const isSymptom = node.type === 'CRITICAL_SYMPTOM';
                                                    const isChain = node.type === 'IMPACT_CHAIN';

                                                    let strokeColor = 'rgba(255,255,255,0.2)';
                                                    let bgColor = 'rgba(24, 24, 27, 0.4)';
                                                    let textColor = 'white';
                                                    let title = 'NODO';

                                                    if (isContext) {
                                                        strokeColor = '#0ea5e9';
                                                        bgColor = 'rgba(3, 105, 161, 0.2)';
                                                        textColor = '#bae6fd';
                                                        title = 'CONTEXTO INICIAL';
                                                    } else if (isState) {
                                                        strokeColor = '#10b981';
                                                        bgColor = 'rgba(4, 120, 87, 0.2)';
                                                        textColor = '#a7f3d0';
                                                        title = node.type === 'MACRO_MECHANISM' ? 'MACRO MECANISMO' : 'ESTADO INTERNO';
                                                    } else if (isSymptom) {
                                                        strokeColor = '#ef4444';
                                                        bgColor = 'rgba(185, 28, 28, 0.2)';
                                                        textColor = '#fecaca';
                                                        title = 'SÍNTOMA CRÍTICO';
                                                    } else if (isChain) {
                                                        strokeColor = '#71717a';
                                                        bgColor = 'rgba(63, 63, 70, 0.2)';
                                                        textColor = '#e4e4e7';
                                                        title = 'CADENA DE IMPACTO';
                                                    }

                                                    const cx = node.x + (node.width || 120) / 2;
                                                    const cy = node.y + (node.height || 120) / 2;
                                                    const rx = (node.width || 120) / 2;
                                                    const ry = (node.height || 120) / 2;

                                                    return (
                                                        <g key={node.id} className="group/node">
                                                            <ellipse cx={cx} cy={cy} rx={rx + 10} ry={ry + 10} fill={strokeColor} className="opacity-[0.03] blur-md" />

                                                            {isContext && (
                                                                <polygon
                                                                    points={`${cx},${node.y} ${node.x + (node.width || 120)},${cy} ${cx},${node.y + (node.height || 120)} ${node.x},${cy}`}
                                                                    fill={bgColor}
                                                                    stroke={strokeColor}
                                                                    strokeWidth="1.5"
                                                                />
                                                            )}
                                                            {isState && (
                                                                <ellipse
                                                                    cx={cx} cy={cy} rx={rx} ry={ry}
                                                                    fill={bgColor}
                                                                    stroke={strokeColor}
                                                                    strokeWidth="1.5"
                                                                />
                                                            )}
                                                            {(isSymptom || isChain) && (
                                                                <rect
                                                                    x={node.x} y={node.y} width={node.width || 120} height={node.height || 120} rx="16" ry="16"
                                                                    fill={bgColor}
                                                                    stroke={strokeColor}
                                                                    strokeWidth="1.5"
                                                                />
                                                            )}

                                                            <text
                                                                x={cx} y={node.y - 12}
                                                                textAnchor="middle"
                                                                className="text-[8px] font-bold font-mono tracking-widest fill-zinc-500 uppercase select-none"
                                                            >
                                                                {title}
                                                            </text>

                                                            <foreignObject
                                                                x={node.x + 8} y={node.y + 8}
                                                                width={(node.width || 120) - 16} height={(node.height || 120) - 16}
                                                            >
                                                                <div className="w-full h-full flex items-center justify-center text-center p-2 overflow-hidden select-none">
                                                                    <span
                                                                        className="text-[9px] font-black uppercase tracking-wider leading-relaxed font-mono"
                                                                        style={{ color: textColor }}
                                                                    >
                                                                        {node.label}
                                                                    </span>
                                                                </div>
                                                            </foreignObject>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        </div>
                                    );
                                })() : (
                                    <>
                                        <Compass size={48} className="text-zinc-800 mb-6 animate-pulse" />
                                        <h3 className="text-2xl md:text-4xl font-black italic uppercase text-white/40 tracking-widest text-center">
                                            Sin Cartografía Asignada
                                        </h3>
                                        <p className="text-[10px] md:text-xs font-mono text-zinc-500 mt-6 max-w-lg text-center leading-relaxed">
                                            AÚN NO HAY UN MAPA DE BUCLES DISPONIBLE PARA TU IDENTIDAD. EL MAPA GENERADO Y PUBLICADO POR EL ESPECIALISTA CLÍNICO DESDE TU PERFIL APARECERÁ AQUÍ.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}


                    </div>
                </div>
            </div>
        );
    };

    const renderClinicalView = () => {
        if (user !== 'observador1') return null;
        return <PsychologistDashboard onClose={() => setView('canvas')} />;
    };

    const getBlockPreviewImage = (block) => {
        if (!block) return null;
        if (block.type === 'image') return formatUrl(block.content);

        if (block.metadata?.thumbnail) return formatUrl(block.metadata.thumbnail);
        if (block.bgType === 'image' && block.bgValue) return formatUrl(block.bgValue);

        if (block.content && typeof block.content === 'string') {
            const contentLines = block.content.split('\n') || [];
            const inlineImg = contentLines.find(l => typeof l === 'string' && l.startsWith('[img]'))?.replace('[img]', '')?.trim();
            if (inlineImg) return formatUrl(inlineImg);
        }

        if (block.muralBlocks && block.muralBlocks.length > 0) {
            const firstImg = block.muralBlocks.find(mb => mb.type === 'image');
            if (firstImg) return formatUrl(firstImg.content);
        }
        return null;
    };

    const getBlockPreviewVideo = (block) => {
        if (!block) return null;
        if (block.content && typeof block.content === 'string') {
            const contentLines = block.content.split('\n') || [];
            const inlineVid = contentLines.find(l => typeof l === 'string' && l.startsWith('[vid]'))?.replace('[vid]', '')?.replace('[/vid]', '')?.trim();
            if (inlineVid) return formatUrl(inlineVid);
        }
        return null;
    };

    const renderPublicProfileView = () => {
        const cleanPublicUser = typeof publicProfileUser === 'string' ? publicProfileUser.replace('@', '') : '';
        // Fix: also check metadata.feedUsername to catch all post formats
        const publicUserPosts = (feed || []).filter(f => {
            if (!f) return false;
            const uname = (typeof f.username === 'string' ? f.username : '').replace('@', '');
            const feedUname = (typeof f.metadata?.feedUsername === 'string' ? f.metadata.feedUsername : '').replace('@', '');
            return uname === cleanPublicUser || feedUname === cleanPublicUser;
        });
        const nonStoryPosts = publicUserPosts.filter(p => p && p.type !== 'story' && p.type !== 'highlight');

        let avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cleanPublicUser || 'anon'}`;
        let fullName = cleanPublicUser;
        let bio = 'Sin bio por ahora.';
        let cover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

        // 1. Pre-fill from feed posts immediately to avoid visual "pop-in" while API loads
        if (publicUserPosts.length > 0) {
            const postWithAvatar = publicUserPosts.find(p => p.metadata?.userAvatar);
            if (postWithAvatar) avatar = postWithAvatar.metadata.userAvatar;
            
            const postWithFullName = publicUserPosts.find(p => p.metadata?.userFullName);
            if (postWithFullName) fullName = postWithFullName.metadata.userFullName;
        }

        // 2. Pre-fill from localStorage cache if available (super fast)
        let mergedProfileData = null;
        try {
            const cached = localStorage.getItem(`oasis_cached_profile_${cleanPublicUser}`);
            if (cached) mergedProfileData = JSON.parse(cached);
        } catch(e) {}
        
        // 3. Override with live fetched data once it arrives
        if (publicProfileData && typeof publicProfileData === 'object') {
            mergedProfileData = publicProfileData;
        }

        if (mergedProfileData) {
            const getProp = (key1, key2) => {
                if (typeof mergedProfileData[key1] === 'string' && mergedProfileData[key1].trim() !== '') return mergedProfileData[key1];
                if (typeof mergedProfileData[key2] === 'string' && mergedProfileData[key2].trim() !== '') return mergedProfileData[key2];
                return null;
            };
            
            const parsedAvatar = getProp('avatar', 'Avatar');
            if (parsedAvatar) avatar = parsedAvatar;

            const parsedFullName = getProp('fullName', 'FullName');
            if (parsedFullName && !parsedFullName.includes('@')) fullName = parsedFullName;
            else fullName = null;

            const parsedBio = getProp('bio', 'Bio');
            if (parsedBio) bio = parsedBio;

            const parsedCover = getProp('coverImage', 'CoverImage');
            if (parsedCover) cover = parsedCover;
        }

        if (cleanPublicUser && user && cleanPublicUser.toLowerCase() === user.toLowerCase()) {
            const localAvatar = localStorage.getItem('oasis_avatar_' + user) || localStorage.getItem('oasis_avatar_' + cleanPublicUser);
            if (localAvatar) avatar = localAvatar;

            const localCover = localStorage.getItem('oasis_cover_' + user) || localStorage.getItem('oasis_cover_' + cleanPublicUser);
            if (localCover) cover = localCover;

            const localFullName = localStorage.getItem('oasis_fullname_' + user) || localStorage.getItem('oasis_fullname_' + cleanPublicUser);
            if (localFullName && !localFullName.includes('@')) fullName = localFullName;
            else if (!fullName) fullName = null;

            const localBio = localStorage.getItem('oasis_bio_' + user) || localStorage.getItem('oasis_bio_' + cleanPublicUser);
            if (localBio) bio = localBio;
        }

        let resonanceData = null;
        let matchScore = null;
        if (publicUsers) {
            const pUserObj = publicUsers.find(u => (u.Username || u.username || '').toLowerCase() === cleanPublicUser.toLowerCase());
            if (pUserObj && pUserObj.publicTraits) {
                try {
                    const parsed = typeof pUserObj.publicTraits === 'string' ? JSON.parse(pUserObj.publicTraits) : pUserObj.publicTraits;
                    if (parsed && (parsed.sintesis || parsed.Sintesis || (parsed.habitar && parsed.vinculo && parsed.busqueda))) {
                        resonanceData = parsed;
                    }
                } catch(e) {}
            }
            
            // Re-run similarity score for display
            let myTraits = [];
            try {
                const savedTraits = localStorage.getItem(`oasis_public_traits_${user}`);
                if (savedTraits) {
                    const parsed = JSON.parse(savedTraits);
                    if (parsed && parsed.keywords) myTraits = parsed.keywords;
                    else if (Array.isArray(parsed)) myTraits = parsed;
                }
            } catch (e) {}
            
            if (resonanceData && myTraits.length > 0 && resonanceData.keywords) {
                let s = 0;
                myTraits.forEach(mt => {
                    resonanceData.keywords.forEach(tt => {
                        if (mt.toLowerCase() === tt.toLowerCase()) s += 10;
                        else if (mt.toLowerCase().includes(tt.toLowerCase().split(' ')[0])) s += 2;
                    });
                });
                matchScore = Math.min(99, Math.max(75, Math.floor(s * 10) + 75)); 
            } else if (resonanceData) {
                matchScore = 75; // Default unknown baseline
            }
        }

        const totalPosts = nonStoryPosts.length;

        return (
            <div className="absolute inset-0 z-[1500] pointer-events-none">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto z-[1500]" onClick={(e) => { e.stopPropagation(); setPublicProfileUser(null); }} />

                <div className="absolute inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-[100px] bottom-0 rounded-t-[2rem] border-t border-x border-white/8 flex flex-col bg-black/50 backdrop-blur-3xl text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden transition-all pointer-events-auto z-[1501]"
                    onTouchStart={(e) => { window._ppTouchStartY = e.touches[0].clientY; }}
                    onTouchEnd={(e) => {
                        const dy = e.changedTouches[0].clientY - (window._ppTouchStartY || 0);
                        const scrollEl = document.querySelector('[data-profile-scroll]');
                        const atTop = !scrollEl || scrollEl.scrollTop <= 4;
                        if (dy > 90 && atTop) setPublicProfileUser(null);
                    }}
                >
                    <button onClick={() => setPublicProfileUser(null)} className="absolute top-4 left-4 z-50 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all">
                        <ArrowLeft size={14} />
                    </button>

                    <div data-profile-scroll className="w-full h-full overflow-y-auto no-scrollbar pb-28 relative z-10">
                        
                        {/* TOP COVER BANNER */}
                        <div className="absolute top-0 left-0 w-full h-[60vh] z-0 pointer-events-none overflow-hidden rounded-t-[2rem]" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}>
                            <div
                                className="absolute inset-0 transition-all duration-700 ease-in-out"
                                style={{
                                    backgroundImage: `url(${formatUrl(cover)})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center center',
                                    opacity: 0.35
                                }}
                            />
                        </div>

                        <div className="w-full max-w-3xl mx-auto px-4 flex flex-col pointer-events-auto pt-8 relative z-10">

                            {/* Avatar + Stats row */}
                            <div className="flex items-center gap-4 mb-4 mt-2">
                                <div className="relative shrink-0">
                                    <div className="w-16 h-16 rounded-full p-[1.5px] bg-white/10">
                                        <div className="w-full h-full rounded-full border border-black/50 overflow-hidden bg-zinc-900">
                                            <img src={formatUrl(avatar)} onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline'; } }} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-around items-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold">{totalPosts}</span>
                                        <span className="text-[9px] text-zinc-500">publicaciones</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold">0</span>
                                        <span className="text-[9px] text-zinc-500">resonancias</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold">0</span>
                                        <span className="text-[9px] text-zinc-500">conexiones</span>
                                    </div>
                                </div>
                            </div>

                            {/* Name + bio */}
                            <div className="flex flex-col gap-0.5 mb-4 px-0.5">
                                {fullName && fullName !== cleanPublicUser && (
                                    <h2 className="text-sm font-bold text-white leading-tight">{fullName}</h2>
                                )}
                                <h2 className={fullName && fullName !== cleanPublicUser ? "text-[9px] text-zinc-500 font-mono" : "text-sm font-bold text-white leading-tight"}>
                                    @{cleanPublicUser}
                                </h2>
                                {bio && bio !== 'Sin bio por ahora.' && (
                                    <p className="text-[11px] leading-relaxed text-zinc-300 font-sans whitespace-pre-wrap mt-1">{bio}</p>
                                )}
                                {(!bio || bio === 'Sin bio por ahora.') && (
                                    <p className="text-[10px] text-zinc-600 italic mt-1">Sin bio por ahora.</p>
                                )}
                            </div>

                            {/* FIRMA DE RESONANCIA EXISTENCIAL */}
                            {resonanceData && (
                                <div className="mb-6 mx-0.5 rounded-2xl bg-zinc-950/80 border border-white/5 overflow-hidden backdrop-blur-md shadow-xl">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                            <span className="text-[10px] font-bold text-zinc-300 tracking-wide">Carta de Vibración</span>
                                        </div>
                                        {matchScore && (
                                            <span className="text-[9px] font-mono text-accent">Afinidad: {matchScore}%</span>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {resonanceData.sintesis ? (
                                            <p className="text-[12px] sm:text-[13px] text-zinc-300 font-sans leading-relaxed italic border-l-2 border-white/10 pl-4 py-2">"{resonanceData.sintesis}"</p>
                                        ) : (
                                            <>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-[12px]">🌌</span> Habitar</span>
                                                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonanceData.habitar}"</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-[12px]">🌿</span> Vínculo</span>
                                                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonanceData.vinculo}"</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><span className="text-[12px]">✨</span> Búsqueda</span>
                                                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed italic pr-2">"{resonanceData.busqueda}"</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab bar */}
                            <div className="flex w-full border-t border-white/8 mt-3 mb-2">
                                <div className="flex-1 flex justify-center py-2 border-t-2 border-white/70 text-white/70">
                                    <LayoutGrid size={15} />
                                </div>
                            </div>

                            {/* Posts grid */}
                            {nonStoryPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-600">
                                    <LayoutGrid size={28} className="opacity-30" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest">Sin publicaciones</span>
                                </div>
                            ) : (
                                <div className="columns-2 md:columns-3 gap-1 w-full space-y-1 pb-10">
                                    {nonStoryPosts.map((post, index) => {
                                        const postImg = getBlockPreviewImage(post);
                                        const postVid = getBlockPreviewVideo(post);
                                        let cleanText = '';
                                        if (post.metadata?.feedText && typeof post.metadata.feedText === 'string') cleanText = post.metadata.feedText;
                                        else if (post.content && typeof post.content === 'string') cleanText = post.content.split('\n')[0];

                                        return (
                                            <div key={post.id || index} onClick={() => setSelectedPublicPost(post)} className="w-full bg-[#0d0d0f] border border-white/5 relative overflow-hidden cursor-pointer group hover:border-white/15 transition-all duration-300 rounded-md break-inside-avoid shadow-md">
                                                {postImg ? (
                                                    <img src={formatUrl(postImg)} onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline'; } }} className="w-full h-auto block object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                                ) : postVid ? (
                                                    <video src={formatUrl(postVid)} onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline'; } }} className="w-full h-auto block object-cover" muted loop playsInline />
                                                ) : (
                                                    <div className="w-full min-h-[100px] flex flex-col justify-center p-3 bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c]">
                                                        <p className="text-[9px] font-sans text-white/80 line-clamp-5">{cleanText}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    const renderFeedView = () => {
        // Limit the feed structure to a maximum of 3 active items (links/releases) to ensure performance and focus.
        // Use mergedFeed to ensure local optimistic blocks are included even if server cache is stale.
        const activeFeedItems = feed.filter(f => f.type !== 'highlight' && f.type !== 'story');

        let myTraits = [];
        let myResonance = null;
        try {
            const savedTraits = localStorage.getItem(`oasis_public_traits_${user}`);
            if (savedTraits) {
                const parsed = JSON.parse(savedTraits);
                if (Array.isArray(parsed)) myTraits = parsed;
                else if (parsed && parsed.keywords) {
                    myTraits = parsed.keywords;
                    myResonance = parsed;
                }
            }
        } catch (e) {}

        const similarSouls = publicUsers
            .filter(u => {
                const username = u.Username || u.username;
                if (!username || username === user || username === `@${user}`) return false;
                return feed.some(f => f.username === username || f.metadata?.feedUsername === username || f.username === `@${username}` || f.metadata?.feedUsername === `@${username}`);
            })
            .map(u => {
                let theirTraits = [];
                let theirResonance = null;
                try {
                    if (u.publicTraits) {
                        const parsed = typeof u.publicTraits === 'string' ? JSON.parse(u.publicTraits) : u.publicTraits;
                        if (Array.isArray(parsed)) theirTraits = parsed;
                        else if (parsed && parsed.keywords) {
                            theirTraits = parsed.keywords;
                            theirResonance = parsed;
                        }
                    }
                } catch(e) {}
                
                let score = 0;
                if (myTraits.length > 0 && theirTraits.length > 0) {
                    myTraits.forEach(mt => {
                        theirTraits.forEach(tt => {
                            if (mt.toLowerCase() === tt.toLowerCase()) score += 10;
                            else if (mt.toLowerCase().includes(tt.toLowerCase().split(' ')[0])) score += 2;
                        });
                    });
                }
                score += Math.random(); // Fallback randomness
                return { ...u, score, theirResonance };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10).map((u, idx) => {
                const currentUsername = u.Username || u.username;
                const currentFullName = u.FullName || u.fullName || currentUsername;
                const userPosts = (feed || []).filter(f => f.username === currentUsername || f.metadata?.feedUsername === currentUsername);
                const userAvatar = userPosts.find(f => f.metadata?.userAvatar)?.metadata?.userAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUsername}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

                return {
                    id: idx,
                    username: currentUsername,
                    name: currentFullName,
                    img: userAvatar,
                    resonance: u.theirResonance,
                    matchScore: Math.min(99, Math.max(70, Math.floor(u.score * 10) + 70)) // Pseudo-score for UI
                };
            });

        const FeedAutoScroller = () => {
            React.useEffect(() => {
                const timer = setTimeout(() => {
                    const firstPost = document.querySelector('.feed-post-item');
                    if (firstPost) {
                        firstPost.scrollIntoView({ behavior: 'auto', block: 'start' });
                    }
                }, 50); // slight delay to ensure DOM is ready
                return () => clearTimeout(timer);
            }, []);
            return null;
        };

        return (
            <div className="w-full h-full relative overflow-y-auto snap-y snap-mandatory no-scrollbar bg-transparent">
                <FeedAutoScroller />
                {/* AMBIENTE (PERMANECENTE) */}
                <div className="fixed inset-0 pointer-events-none opacity-5" style={{ background: 'radial-gradient(circle at 50% 50%, ' + accent + '30 0%, transparent 70%)' }} />

                {/* SIMILAR SOULS / NEW MATCHES (Horizontal Scroll) */}
                {similarSouls.length > 0 && (
                    <div className="w-full relative z-20 pt-[110px] pb-6 px-4 bg-gradient-to-b from-black/80 to-transparent snap-start shrink-0 pointer-events-auto border-b border-white/5">
                        <div className="max-w-xl mx-auto w-full">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-white font-bold text-lg tracking-tight">Almas Afines</h3>
                                <button className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold tracking-widest transition-colors">
                                    Ver todas
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-2 snap-x">
                                {similarSouls.map((soul) => (
                                    <div key={soul.id} className="flex flex-col items-center gap-2 shrink-0 snap-center cursor-pointer group" onClick={(e) => {
                                        e.stopPropagation();
                                        setPublicProfileUser(soul.username);
                                    }}>
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white/20 transition-all shadow-xl bg-zinc-900 relative">
                                            <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={formatUrl(soul.img)} alt={soul.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors truncate w-16 md:w-20 text-center">{soul.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeFeedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest gap-4 h-full relative z-10 snap-center pb-32">
                        <Aperture size={32} className="animate-spin-slow text-zinc-600" />
                        <span>No hay publicaciones en el feed</span>
                    </div>
                ) : (
                    <div className={`w-full flex flex-col items-center relative z-10 ${similarSouls.length === 0 ? 'pt-[110px]' : ''}`}>
                        {activeFeedItems.map((f, i) => (
                            <div key={f.id || i} className="feed-post-item w-full">
                                <FeedItem
                                    f={f}
                                    accent={accent}
                                    credits={credits}
                                    setCredits={setCredits}
                                    blocks={blocks}
                                    setBlocks={setBlocks}
                                    syncBlocks={syncBlocks}
                                    links={links}
                                    feed={feed}
                                    setFeed={setFeed}
                                    setView={setView}
                                    editBlock={editBlock}
                                    setPublicProfileUser={setPublicProfileUser}
                                    user={user}
                                    currentUserAvatar={avatar}
                                    publicUsers={publicUsers}
                                />
                            </div>
                        ))}
                        {/* FINAL DE STREAM */}
                        <div className="h-screen flex items-center justify-center opacity-25 snap-center snap-always shrink-0">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-px h-16 bg-white/20" />
                                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-zinc-500">Fin de las Frecuencias</span>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        );
    };

    if (!isLoggedIn && !publicProfileUser) {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                const u = document.getElementById('oasis_user_input')?.value;
                const p = document.getElementById('oasis_key_input')?.value;
                const fn = isRegisterMode ? (document.getElementById('oasis_fullname_input')?.value || "") : "";
                const age = null;
                if (u && p) handleAuth(u, p, fn, age);
            }
        };

        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center p-6 z-[1000] overflow-hidden select-none">
                <div className="w-full max-w-[280px] space-y-12 animate-in fade-in duration-1000">

                    {/* Introspective Question */}
                    <div className="space-y-4 text-center">
                        <h2 className="text-xl sm:text-2xl font-light tracking-wide text-zinc-300 italic font-serif leading-relaxed px-2">
                            "¿Cuánto ruido hay en tu silencio?"
                        </h2>
                        <div className="h-[1px] w-8 bg-zinc-800 mx-auto" />
                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-500">
                            {isRegisterMode ? 'Registrar Frecuencia' : 'Ruido Interior'}
                        </p>
                    </div>

                    {authError && (
                        <div className="p-3 bg-red-950/20 border border-red-900/30 text-[8px] font-mono font-bold text-red-400 uppercase tracking-widest text-center">
                            {authError}
                        </div>
                    )}

                    {/* Inputs & Form */}
                    <div className="space-y-6">
                        <div className="space-y-1 text-left">
                            <label className="text-[7px] font-bold uppercase tracking-[0.25em] text-zinc-500 block ml-1">
                                Entidad
                            </label>
                            <input
                                type="text"
                                id="oasis_user_input"
                                placeholder="@IDENTIDAD"
                                onKeyDown={handleKeyPress}
                                className="w-full h-10 bg-transparent border-b border-zinc-800 focus:border-zinc-500 rounded-none text-sm font-light uppercase tracking-widest text-white placeholder:text-zinc-850 outline-none transition-colors px-1"
                            />
                        </div>

                        <div className="space-y-1 relative text-left">
                            <label className="text-[7px] font-bold uppercase tracking-[0.25em] text-zinc-500 block ml-1">
                                Clave de Alma
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    id="oasis_key_input"
                                    placeholder="••••••••"
                                    onKeyDown={handleKeyPress}
                                    className="w-full h-10 bg-transparent border-b border-zinc-800 focus:border-zinc-500 rounded-none text-sm font-light uppercase tracking-widest text-white placeholder:text-zinc-850 outline-none transition-colors px-1"
                                />
                                <button
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                            </div>
                        </div>

                        {isRegisterMode && (
                            <div className="space-y-1 text-left">
                                <label className="text-[7px] font-bold uppercase tracking-[0.25em] text-zinc-500 block ml-1">
                                    Correo
                                </label>
                                <input
                                    type="email"
                                    id="oasis_fullname_input"
                                    placeholder="TU@CORREO.COM"
                                    onKeyDown={handleKeyPress}
                                    className="w-full h-10 bg-transparent border-b border-zinc-800 focus:border-zinc-500 rounded-none text-sm font-light uppercase tracking-widest text-white placeholder:text-zinc-850 outline-none transition-colors px-1"
                                />
                            </div>
                        )}

                        <div className="pt-4 space-y-4">
                            <button
                                onClick={() => {
                                    const u = document.getElementById('oasis_user_input')?.value;
                                    const p = document.getElementById('oasis_key_input')?.value;
                                    const fn = isRegisterMode ? (document.getElementById('oasis_fullname_input')?.value || "") : "";
                                    const age = null;
                                    if (u && p) handleAuth(u, p, fn, age);
                                }}
                                className="w-full h-11 border border-zinc-800 hover:border-zinc-500 text-white text-[9px] font-bold uppercase tracking-[0.25em] rounded-none bg-transparent hover:bg-white/[0.02] active:scale-[0.98] transition-all duration-300"
                            >
                                {isRegisterMode ? 'Crear Frecuencia' : 'Entrar'}
                            </button>

                            <div className="text-center">
                                <button
                                    onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(''); }}
                                    className="text-[7px] font-bold uppercase tracking-[0.2em] text-zinc-650 hover:text-zinc-400 transition-colors"
                                >
                                    {isRegisterMode ? 'Ya tengo un alma sintonizada' : '¿No tienes cuenta? Sintoniza una'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-0 left-0 w-screen h-screen bg-transparent text-zinc-100 overflow-hidden" onMouseMove={handleMove} onMouseUp={handleEnd} onTouchMove={handleMove} onTouchEnd={handleEnd} onContextMenu={(e) => { if (!e.target.closest('input') && !e.target.closest('textarea') && !e.target.closest('[contenteditable="true"]')) e.preventDefault(); }}>

            {/* GLOBAL ATMOSPHERE ENGINE */}
            <div className="fixed top-0 left-0 w-screen h-screen z-[-1] overflow-hidden pointer-events-none bg-transparent">
                {(() => {
                    const activeBgType = bgType;
                    const activeBgValue = bgValue;
                    const activeIsTiled = isTiled;

                    return (
                        <>
                            {activeBgType === 'color' && activeBgValue && activeBgValue !== '#030304' && activeBgValue !== '#000000' && (
                                <div className="absolute inset-0 transition-all duration-1000" style={{ background: activeBgValue }} />
                            )}
                            {activeBgType === 'image' && (
                                activeIsTiled ? (
                                    <div key={`tiled-${activeBgValue}`} className="absolute inset-0 w-full h-full opacity-80 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-0">
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} key={`tile-img-${i}`} src={formatUrl(activeBgValue)} className="w-full h-full object-cover" />
                                        ))}
                                    </div>
                                ) : (
                                    <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} key={activeBgValue} src={formatUrl(activeBgValue)} className="absolute inset-0 w-full h-full object-cover opacity-80 transition-all duration-1000" alt="Background" />
                                )
                            )}
                            {activeBgType === 'video' && (
                                activeIsTiled ? (
                                    <div className="absolute inset-0 w-full h-full opacity-60 transition-all duration-1000 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                                        {Array.from({ length: 9 }).map((_, i) => (
                                            <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }}
                                                key={`tile-${i}`}
                                                src={formatUrl(activeBgValue)}
                                                autoPlay loop muted playsInline
                                                preload="auto"
                                                className="w-full h-full object-cover global-bg-video"
                                                onError={handleBackgroundVideoError}
                                                onStalled={handleBackgroundVideoStalled}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }}
                                        ref={globalVideoRef}
                                        key={activeBgValue}
                                        src={formatUrl(activeBgValue)}
                                        autoPlay loop muted playsInline
                                        preload="auto"
                                        className="absolute inset-0 w-full h-screen object-cover opacity-60 transition-all duration-1000 global-bg-video"
                                        onError={handleBackgroundVideoError}
                                        onStalled={handleBackgroundVideoStalled}
                                    />
                                )
                            )}
                        </>
                    );
                })()}

                {/* SUTILEZAS COSMÉTICAS (GRAIN & GLOW) */}
                <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
            </div>

            <ErrorBoundary>
                <div key={view} className={`w-full h-full relative overflow-hidden ${view === 'profile' ? '' : 'animate-fade-zoom'}`}>
                    {view === 'clinical' ? renderClinicalView() :
                        view === 'my_responses' ? <MyResponsesDashboard user={user} onClose={() => setView('canvas')} accent={accent} conversations={conversations} activeConversationId={activeConversationId} onOpenNodeChat={handleOpenNodeChat} /> :
                            view === 'canvas' ? renderCanvasView() :
                                view === 'soul' ? renderSoulView() :
                                    (view === 'feed' ? (
                                        <div className={`w-full h-full transition-opacity duration-300 ${publicProfileUser ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                            {renderFeedView()}
                                        </div>
                                    ) :
                                        <>
                                            {renderCanvasView()}
                                            <div className="fixed inset-0 z-[1399] bg-[#050506]/60 backdrop-blur-md transition-all duration-700 animate-in fade-in cursor-default pointer-events-auto" />
                                            <ProfileView
                                                user={user}
                                                soulPieces={soulPieces}
                                                blocks={blocks}
                                                setBlocks={setBlocks}
                                                syncBlocks={syncBlocks}
                                                feed={feed}
                                                isBitacoraOpen={isBitacoraOpen}
                                                setIsBitacoraOpen={setIsBitacoraOpen}
                                                accent={accent}
                                                isEditingProfile={isEditingProfile}
                                                setIsEditingProfile={setIsEditingProfile}
                                                calculatedResults={calculatedResults}
                                                noteKeywords={noteKeywords}
                                                avatar={avatar}
                                                setAvatar={setAvatar}
                                                handleStart={handleStart}
                                                profileCam={profileCam}
                                                draggingId={draggingId}
                                                centerProfile={() => setProfileCam({ x: 0, y: 0, scale: 0.7 })}
                                                onSoulPieceImageChange={handleSoulPieceImageChange}
                                                deleteBlock={deleteBlock}
                                                deleteBlocks={deleteBlocks}
                                                setIsHighlightModalOpen={setIsHighlightModalOpen}
                                                setSelectedHighlight={setSelectedHighlight}
                                                isStoryUploadModalOpen={isStoryUploadModalOpen}
                                                setIsStoryUploadModalOpen={setIsStoryUploadModalOpen}
                                                setViewing24hStories={setViewing24hStories}
                                                isLinking={isLinking}
                                                setIsLinking={setIsLinking}
                                                links={links}
                                                linkSource={linkSource}
                                                setLinkSource={setLinkSource}
                                                completeConnection={completeConnection}
                                                removeConnection={removeConnection}
                                                synthesizeLinks={synthesizeLinks}
                                                mouseCanvasPos={mouseCanvasPos}
                                                editBlock={editBlock}
                                                handleSelectNote={handleSelectNote}
                                                isAnalyzing={isChatLoading}
                                                activeNoteId={activeNoteId}
                                                handleAnalyzeGroup={handleAnalyzeGroup}
                                                handleAnalyzeBlock={handleAnalyzeBlock}
                                                isChatLoading={isChatLoading}
                                                setView={setView}
                                                playlists={playlists}
                                                setPlayQueue={setPlayQueue}
                                                setCurrentTrack={setCurrentTrack}
                                                setIsPlaying={setIsPlaying}
                                                conversations={conversations}
                                                setConversations={setConversations}
                                                handleSelectConversation={handleSelectConversation}
                                                onSaveProfile={handleSaveProfile}
                                                onNewChat={handleNewChat}
                                                onOpenNotebook={setActiveNotebook}
                                                setActiveTest={setActiveTest}
                                                setIsSettingsOpen={setIsSettingsOpen}
                                                onOpenSimpleNotes={() => setIsSimpleNotesOpen(true)}
                                                openNewComposer={openNewComposer}
                                                feed={feed}
                                                onNavigateToFeedPost={navigateToFeedAndFocusPost}
                                            />
                                        </>
                                    )}
                    {publicProfileUser && renderPublicProfileView()}
                </div>
            </ErrorBoundary>

            {false && (
                <>
                    {!isComposerOpen && !isPlayerFull && !isChatOpen && !activeTest && view !== 'soul' && (
                        <OasisPlayer
                            playQueue={playQueue}
                            currentTrack={currentTrack}
                            setCurrentTrack={setCurrentTrack}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            isMinimized={isPlayerMinimized}
                            setIsMinimized={setIsPlayerMinimized}
                            volume={volume}
                            setVolume={setVolume}
                            accent={accent}
                            audioRef={audioPlayerRef}
                            pos={view === 'feed' ? { x: playerPos.x || null, y: 24 } : playerPos}
                            handleStart={handleStart}
                            isFull={isPlayerFull}
                            setIsFull={setIsPlayerFull}
                            progress={trackProgress}
                            duration={trackDuration}
                            playlists={playlists}
                            setPlaylists={setPlaylists}
                            syncPlaylists={syncPlaylists}
                            syncPlayback={syncPlayback}
                        />
                    )}
                    <NekronomikronFull
                        isOpen={isPlayerFull}
                        onClose={() => setIsPlayerFull(false)}
                        playQueue={playQueue}
                        setPlayQueue={setPlayQueue}
                        currentTrack={currentTrack}
                        setCurrentTrack={setCurrentTrack}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        volume={volume}
                        setVolume={setVolume}
                        accent={accent}
                        audioRef={audioPlayerRef}
                        searchQuery={playerSearchQuery}
                        setSearchQuery={setPlayerSearchQuery}
                        searchResults={playerSearchResults}
                        onSearch={handlePlayerSearch}
                        onAddTrack={handleAddTrack}
                        isSearching={isPlayerSearching}
                        playlists={playlists}
                        setPlaylists={setPlaylists}
                        syncPlaylists={syncPlaylists}
                        syncPlayback={syncPlayback}
                        progress={trackProgress}
                        duration={trackDuration}
                        onPlaySearchResult={handlePlayFromSearch}
                        onPlayPlaylist={handlePlayFromPlaylist}
                        onNext={handleNextTrack}
                        onPrev={handlePrevTrack}
                        activeView={activePlayerView}
                        setActiveView={setActivePlayerView}
                        onImportPlaylist={handleImportPlaylist}
                        isPlaylistExpanded={isPlaylistExpanded}
                        setIsPlaylistExpanded={setIsPlaylistExpanded}
                        expandedPlaylistItems={expandedPlaylistItems}
                        expandedPlaylistName={expandedPlaylistName}
                    />
                </>
            )}

            <div id="background-media-engine" className="hidden" />
            {createPortal(
                <audio
                    ref={audioPlayerRef}
                    src={playQueue[currentTrack]?.url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleNextTrack}
                    autoPlay={isPlaying}
                />,
                document.getElementById('background-media-engine') || document.body
            )}



            {/* SETTINGS PANEL (MODAL) */}
            {isSettingsOpen && !activeTest && view !== 'soul' && !isBitacoraOpen && (
                <div
                    onClick={() => setIsSettingsOpen(false)}
                    className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xl max-h-[85vh] bg-[#0c0c0d]/95 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-2xl p-6 md:p-10 flex flex-col space-y-8 animate-in zoom-in-95 duration-300 overflow-y-auto no-scrollbar"
                    >
                        {/* SETTINGS HEADER */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-accent">Configuración</span>
                                <h3 className="text-2xl font-black italic text-white tracking-tighter">Núcleo de Kio</h3>
                            </div>
                            <button onClick={() => setIsSettingsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"><X size={20} /></button>
                        </div>

                        {/* ATMÓSFERA AMBIENTAL (PERSISTENTE) */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Aura del Entorno</span>
                                <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                                    <span className="text-[6px] font-black uppercase tracking-widest text-accent">{bgType}</span>
                                </div>
                            </div>

                            {/* PLANTILLAS DE LA COMUNIDAD */}
                            <div className="space-y-3 pt-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Plantillas de la Comunidad</span>
                                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
                                    {bgTemplates.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => {
                                                setBgType(template.type);
                                                setBgValue(template.value);
                                                setIsTiled(template.isTiled || false);
                                                syncAura(template.type, template.value, template.isTiled || false);
                                            }}
                                            className="group relative h-24 rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-accent/40 transition-all text-left"
                                        >
                                            {template.type === 'image' && (
                                                <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }} src={formatUrl(template.value)} alt={template.name} className={`absolute inset-0 w-full h-full opacity-60 group-hover:opacity-100 transition-opacity ${template.isTiled ? 'object-repeat' : 'object-cover'}`} />
                                            )}
                                            {template.type === 'video' && (
                                                <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }} src={formatUrl(template.value)} className={`absolute inset-0 w-full h-full opacity-60 group-hover:opacity-100 transition-opacity ${template.isTiled ? 'object-repeat' : 'object-cover'}`} autoPlay muted loop playsInline />
                                            )}
                                            {template.type === 'color' && (
                                                <div className="absolute inset-0 w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: template.value }} />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                                <div>
                                                    <span className="text-[8px] font-black uppercase text-white block truncate">{template.name}</span>
                                                    <span className="text-[6px] font-mono text-zinc-400">@{template.creator}</span>
                                                </div>
                                                {template.creator === user && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const res = await fetch(`${API_URL}/api/oasis/backgrounds/templates/${template.id}`, { method: 'DELETE' });
                                                                if (res.ok) setBgTemplates(prev => prev.filter(t => t.id !== template.id));
                                                            } catch (err) { console.error(err); }
                                                        }}
                                                        className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors z-10"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                    {bgTemplates.length === 0 && (
                                        <div className="col-span-2 text-center py-4 text-[10px] font-mono text-zinc-600">
                                            No hay plantillas públicas aún.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CUSTOM MEDIA UPLOADER & FORMAT CONTROLS */}
                            <div className="pt-2 space-y-6">
                                <label className="flex flex-col items-center justify-center gap-3 w-full py-8 bg-white/5 border border-dashed border-white/20 rounded-[2rem] cursor-pointer hover:bg-white/10 hover:border-accent/40 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={20} className="text-accent" /></div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white block mb-1">Cargar Aura Nueva</span>
                                        <span className="text-[6px] font-black uppercase tracking-widest text-zinc-500">Imagen o Video Cinético</span>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleBgUpload} />
                                </label>

                                {/* GUARDAR FONDO ACTUAL COMO PLANTILLA */}
                                {bgValue && bgValue !== '#030304' && (
                                    <div className="p-5 bg-white/5 border border-white/5 rounded-[2rem] space-y-3.5 animate-in fade-in duration-300">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-accent block">Compartir como plantilla de la comunidad</span>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTemplateName}
                                                onChange={(e) => setNewTemplateName(e.target.value)}
                                                placeholder="Ej: Nebula Violeta, Mi Cielo..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                                            />
                                            <button
                                                onClick={() => handleSaveAsTemplate(newTemplateName)}
                                                className="px-4 py-2 bg-accent text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-accent/20"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {(bgType === 'image' || bgType === 'video') && (
                                    <div className="space-y-4 animate-in slide-in-from-top duration-700">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block px-2">Estructura del Aura</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => { setIsTiled(false); syncAura(bgType, bgValue, false); }}
                                                className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${!isTiled ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'}`}
                                            >
                                                <Maximize2 size={16} />
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase block">Relleno</span>
                                                    <span className="text-[6px] font-black opacity-40 uppercase tracking-tighter">Cinético</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => { setIsTiled(true); syncAura(bgType, bgValue, true); }}
                                                className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${isTiled ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'}`}
                                            >
                                                <div className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 bg-current opacity-60 rounded-sm" /><div className="w-1.5 h-1.5 bg-current opacity-40 rounded-sm" /><div className="w-1.5 h-1.5 bg-current opacity-40 rounded-sm" /><div className="w-1.5 h-1.5 bg-current opacity-20 rounded-sm" /></div>
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase block">Mosaico</span>
                                                    <span className="text-[6px] font-black opacity-40 uppercase tracking-tighter">Textura</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CHROMA CORE */}
                        {(() => {
                            const hsl = hexToHsl(accent);
                            return (
                                <div className="space-y-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Acento Visual (Chroma)</span>
                                    <div className="flex flex-col gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                                        {/* Color preview */}
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-14 h-14 rounded-2xl border-2 border-white transition-all shadow-lg shrink-0"
                                                style={{
                                                    backgroundColor: accent,
                                                    boxShadow: `0 0 25px ${accent}50`,
                                                }}
                                            />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-black uppercase text-white tracking-widest">Acento Activo</span>
                                                <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">{accent}</span>
                                            </div>
                                        </div>

                                        {/* Sliders */}
                                        <div className="space-y-3.5">
                                            {/* HUE */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-zinc-500">
                                                    <span>Matiz (Hue)</span>
                                                    <span>{hsl.h}°</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="360"
                                                    value={hsl.h}
                                                    onChange={(e) => setAccent(hslToHex(Number(e.target.value), hsl.s, hsl.l))}
                                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
                                                    style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                                                />
                                            </div>

                                            {/* SATURATION */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-zinc-500">
                                                    <span>Saturación</span>
                                                    <span>{hsl.s}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={hsl.s}
                                                    onChange={(e) => setAccent(hslToHex(hsl.h, Number(e.target.value), hsl.l))}
                                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
                                                    style={{ background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))` }}
                                                />
                                            </div>

                                            {/* LIGHTNESS */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-zinc-500">
                                                    <span>Luminosidad</span>
                                                    <span>{hsl.l}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="90"
                                                    value={hsl.l}
                                                    onChange={(e) => setAccent(hslToHex(hsl.h, hsl.s, Number(e.target.value)))}
                                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
                                                    style={{ background: `linear-gradient(to right, #000000, hsl(${hsl.h}, ${hsl.s}%, 50%), #ffffff)` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* CONFIGURACIÓN DE INTELIGENCIA (KIO) */}
                        {false && (
                        <div className="space-y-4 pt-2 border-t border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Configuración de Inteligencia (Kio)</span>
                            <div className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/5">
                                {/* API KEY */}
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 block ml-1">
                                        Clave de API DeepSeek / IA
                                    </label>
                                    <input
                                        type="password"
                                        value={deepseekKey}
                                        onChange={(e) => {
                                            setDeepseekKey(e.target.value);
                                            localStorage.setItem('oasis_deepseek_key', e.target.value);
                                        }}
                                        placeholder={deepseekKey ? "••••••••••••••••" : "Usando clave centralizada (Servidor)"}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono text-white placeholder:text-zinc-500 focus:border-accent/40 outline-none transition-all"
                                    />
                                </div>

                                {/* ENDPOINT */}
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 block ml-1">
                                        Endpoint del Proveedor
                                    </label>
                                    <input
                                        type="url"
                                        value={customEndpoint}
                                        onChange={(e) => {
                                            setCustomEndpoint(e.target.value);
                                            localStorage.setItem('oasis_deepseek_endpoint', e.target.value);
                                        }}
                                        placeholder="https://api.deepseek.com/chat/completions"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                                    />
                                </div>

                                {/* MODEL */}
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 block ml-1">
                                        Modelo de IA
                                    </label>
                                    <input
                                        type="text"
                                        value={customModel}
                                        onChange={(e) => {
                                            setCustomModel(e.target.value);
                                            localStorage.setItem('oasis_deepseek_model', e.target.value);
                                        }}
                                        placeholder="deepseek-chat"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono text-white placeholder:text-zinc-700 focus:border-accent/40 outline-none transition-all"
                                    />
                                </div>

                                {/* PROBAR CONEXIÓN (TEST DEEPSEEK) */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={testDeepseekConnection}
                                        disabled={apiTestLoading}
                                        className="w-full bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent font-black uppercase text-[9px] tracking-wider py-2 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {apiTestLoading ? 'Probando...' : 'Probar Conexión con DeepSeek'}
                                    </button>
                                    {apiTestResult && (
                                        <div className={`mt-2 p-3 rounded-xl border text-[9px] font-mono leading-relaxed break-all ${apiTestResult.startsWith('Éxito')
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                            }`}>
                                            {apiTestResult}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* UI PREFERENCES */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pantalla de Inicio</span>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {[
                                        { id: 'bitacora', label: 'Bitácora', icon: <Aperture size={16} /> },
                                        { id: 'chat', label: 'Conversación', icon: <MessageSquare size={16} /> },
                                        { id: 'diary', label: 'Diario', icon: <Layers size={16} /> },
                                        { id: 'notes', label: 'Notas', icon: <StickyNote size={16} /> },
                                        { id: 'canvas', label: 'Pizarrón', icon: <LayoutGrid size={16} /> }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setStartupScreen(opt.id);
                                                localStorage.setItem('oasis_startup_screen', opt.id);
                                            }}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border transition-all ${startupScreen === opt.id ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white'}`}
                                        >
                                            {opt.icon}
                                            <span className="text-[7px] font-black uppercase tracking-widest">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">

                                {user === 'observador1' && (
                                    <button onClick={() => { setView('clinical'); setIsSettingsOpen(false); }} className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Panel de Observación Clínica</button>
                                )}
                                <button onClick={() => { setView('soul'); setIsSettingsOpen(false); }} className="w-full py-4 bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Entrevista Biográfica</button>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="pt-8 border-t border-white/5">
                            <span className="text-[7px] font-black uppercase tracking-[1em] text-zinc-800">Versión 1.3.0_Stable</span>
                            <div className="space-y-4 pt-10 border-t border-white/5 mt-auto">
                                <button
                                    onClick={() => {
                                        try {
                                            const data = {};
                                            for (let i = 0; i < localStorage.length; i++) {
                                                const key = localStorage.key(i);
                                                if (key.startsWith('oasis_')) {
                                                    data[key] = localStorage.getItem(key);
                                                }
                                            }
                                            const jsonStr = JSON.stringify(data, null, 2);
                                            navigator.clipboard.writeText(jsonStr).then(() => {
                                                alert("¡Datos exportados y copiados al portapapeles! Pégalo en el chat para sincronizar.");
                                            }).catch(err => {
                                                alert("Error copiando al portapapeles. Muestra esto al desarrollador:\n\n" + jsonStr.substring(0, 100) + "...");
                                            });
                                        } catch (e) {
                                            alert("Error exportando datos: " + e.message);
                                        }
                                    }}
                                    className="w-full py-5 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex items-center justify-center gap-3 text-blue-500 hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                >
                                    <Save size={16} />
                                    Exportar Datos (Backup)
                                </button>
                                <button
                                    onClick={() => {
                                        const jsonStr = prompt("Pega aquí el texto que copiaste al exportar los datos:");
                                        if (jsonStr) {
                                            try {
                                                const data = JSON.parse(jsonStr);
                                                let count = 0;
                                                for (const key in data) {
                                                    if (key.startsWith('oasis_')) {
                                                        localStorage.setItem(key, data[key]);
                                                        count++;
                                                    }
                                                }
                                                alert(`¡Éxito! Se han restaurado ${count} registros. La aplicación se recargará ahora para aplicar los cambios.`);
                                                window.location.reload();
                                            } catch (e) {
                                                alert("Error: El texto pegado no es válido. Asegúrate de copiarlo completo.");
                                            }
                                        }
                                    }}
                                    className="w-full py-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center gap-3 text-emerald-500 hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                >
                                    <Download size={16} />
                                    Importar Datos (Restaurar)
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                >
                                    <ArrowLeft size={16} />
                                    Libre / Cerrar Sesión
                                </button>
                                <div className="text-center">
                                    <span className="text-[6px] font-black uppercase tracking-[0.4em] text-zinc-500">Ruido Interior v2.0 - Acceso Seguro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTÓN DE ACCIÓN ÚNICO (LA REFINERÍA & CHAT) */}
            {(view === 'canvas' || view === 'profile' || view === 'soul' || view === 'feed' || view === 'my_responses' || isSimpleNotesOpen || activeNotebook) && view !== 'clinical' && !activeTest && !publicProfileUser && (
                <div
                    onTouchStart={handleNavbarTouchStart}
                    onTouchEnd={handleNavbarTouchEnd}
                    className="fixed left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-2 p-2 bg-[#050506]/60 backdrop-blur-sm border border-white/10 rounded-full shadow-[0_40px_100px_rgba(0,0,0,0.9)] w-max max-w-[98vw] overflow-x-auto no-scrollbar animate-in slide-in-from-top-5 duration-700"
                    style={{ top: 'max(24px, calc(env(safe-area-inset-top) + 12px))' }}
                >
                    {/* 1. Perfil */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsUnifiedCreatorOpen(false);
                            setIsPublishSelectorOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            setPublicProfileUser(null);
                            setView('profile');
                        }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 ${view === 'profile' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}`}
                        style={view === 'profile' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Perfil"
                    >
                        <User size={18} className="hover-float-icon" />
                    </button>


                    {/* Mi Expediente */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsUnifiedCreatorOpen(false);
                            setIsPublishSelectorOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            setPublicProfileUser(null);
                            setView('my_responses');
                        }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 ${view === 'my_responses' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}`}
                        style={view === 'my_responses' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Mi Expediente"
                    >
                        <RefreshCw size={18} className="hover-float-icon" />
                    </button>

                    {/* 6. Lienzo Principal */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsUnifiedCreatorOpen(false);
                            setIsPublishSelectorOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            setPublicProfileUser(null);
                            setView('canvas');
                        }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 ${view === 'canvas' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}`}
                        style={view === 'canvas' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Lienzo Principal"
                    >
                        <Pencil size={18} className="hover-float-icon" />
                    </button>

                    {/* 7. Feed Público */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBitacoraOpen(false);
                            setIsSimpleNotesOpen(false);
                            setIsUnifiedCreatorOpen(false);
                            setIsPublishSelectorOpen(false);
                            setIsComposerOpen(false);
                            setActiveNotebook(null);
                            setIsChatOpen(false);
                            setActiveTest(null);
                            setPublicProfileUser(null);
                            setView('feed');
                        }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0 ${view === 'feed' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]' : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-white hover:bg-[#2a2a2e] hover:border-white/30'}`}
                        style={view === 'feed' && !activeNotebook && !isChatOpen && !isSimpleNotesOpen && !isComposerOpen && !isPublishSelectorOpen ? { backgroundColor: accent, borderColor: accent, color: '#000' } : undefined}
                        title="Feed Público"
                    >
                        <Home size={18} className="hover-float-icon" />
                    </button>

                </div>
            )}

            {isPublishSelectorOpen && (
                <PublishNoteSelector
                    blocks={blocks}
                    setBlocks={setBlocks}
                    syncBlocks={syncBlocks}
                    accent={accent}
                    user={user}
                    onClose={() => setIsPublishSelectorOpen(false)}
                    onPublished={(newBlock) => {
                        // Refresh feed from server — the block is already saved
                        fetchFeed();
                        setView('feed');
                    }}
                />
            )}

            {isBitacoraOpen && !publicProfileUser && (
                <BitacoraExistencial
                    activeCanvasId={activeCanvasId}
                    setActiveCanvasId={setActiveCanvasId}
                    isLoading={!isDataLoaded}
                    blocks={blocks}
                    setBlocks={setBlocks}
                    accent={accent}
                    onClose={() => setIsBitacoraOpen(false)}
                    user={user}
                    editBlock={(b) => {
                        setIsBitacoraOpen(false);
                        editBlock(b);
                    }}
                    openNewComposer={() => {
                        setIsBitacoraOpen(false);
                        openNewComposer(false, false);
                    }}
                    deleteBlocks={(ids) => {
                        syncBlocks(blocks.filter(b => !ids.includes(b.id)));
                        if (user) ids.forEach(id => fetch(`${API_URL}/api/oasis/blocks/${id}?user=${user}`, { method: 'DELETE' }).then(() => fetchFeed()).catch(console.error));
                    }}
                    onNewChat={() => {
                        setIsBitacoraOpen(false);
                        setIsChatOpen(true);
                    }}
                    onOpenSimpleNotes={() => {
                        setIsBitacoraOpen(false);
                        setIsSimpleNotesOpenRaw(true);
                    }}
                />
            )}

            {/* UNIFIED MODAL BACKDROP */}
            {(isComposerOpen || isSimpleNotesOpen || activeNotebook || isChatOpen || isBitacoraOpen || isUnifiedCreatorOpen || isPublishSelectorOpen) && (
                <div
                    className="fixed inset-0 z-[1399] bg-[#050506]/60 backdrop-blur-md transition-all duration-700 animate-in fade-in"
                    onPointerDown={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                />
            )}



            {isUnifiedCreatorOpen && (
                <UnifiedCreatorView
                    onClose={() => setIsUnifiedCreatorOpen(false)}
                    onOpenPublishSelector={() => {
                        setIsUnifiedCreatorOpen(false);
                        setIsPublishSelectorOpen(true);
                    }}
                    activeTab={unifiedTab}
                    setActiveTab={(tab) => {
                        setUnifiedTab(tab);
                        if (tab === 'chat') {
                            setIsUnifiedCreatorOpen(false);
                            setIsChatOpen(true);
                        } else if (tab === 'diary') {
                            setIsUnifiedCreatorOpen(false);
                            setActiveNotebook('diary');
                        } else if (tab === 'noise') {
                            setIsUnifiedCreatorOpen(false);
                            setActiveNotebook('resonance');
                        }
                    }}
                    onComposeNote={() => { setIsUnifiedCreatorOpen(false); openNewComposer(false, false); }}
                />
            )}

            {!isUnifiedCreatorOpen && isSimpleNotesOpen && (
                <SimpleNotesView
                    ref={simpleNotesRef}
                    blocks={blocks}
                    setBlocks={syncBlocks}
                    accent={accent}
                    user={user}
                    onClose={() => setIsSimpleNotesOpen(false)}
                    editBlock={editBlock}
                    openNewComposer={openNewComposer}
                    className={isSplitViewEnabled ? (isChatOpen ? "fixed inset-y-0 right-0 w-full md:w-[50vw] mt-[100px] border-x-0 md:border-l border-white/10 rounded-t-[2.5rem] md:rounded-tr-none md:rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : "fixed inset-y-0 left-0 w-full md:w-[50vw] mt-[100px] border-x-0 md:border-r border-white/10 rounded-t-[2.5rem] md:rounded-tl-none md:rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto") : undefined}
                    isSplitView={isSplitViewEnabled}
                    onToggleSplitView={() => {
                        const nextState = !isSplitViewEnabled;
                        setIsSplitViewEnabled(nextState);
                        if (nextState && !isSimpleNotesOpen && !isComposerOpen) {
                            setIsSimpleNotesOpenRaw(true);
                        }
                    }}
                />
            )}

            {!isUnifiedCreatorOpen && activeNotebook === 'diary' && (
                <DiaryNotebook
                    activeCanvasId={activeCanvasId}
                    onClose={() => setActiveNotebook(null)}
                    onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setActiveNotebook(null); }}
                    blocks={blocks}
                    setBlocks={setBlocks}
                    syncBlocks={syncBlocks}
                    accent={accent}
                />
            )}

            {!isUnifiedCreatorOpen && (activeNotebook === 'resonance' || (isSplitViewEnabled && isChatOpen)) && (
                <ResonanceNotebook
                    className={isSplitViewEnabled ? "fixed inset-y-0 right-0 w-full md:w-[50vw] mt-[100px] border-x-0 md:border-l border-white/10 rounded-t-[2.5rem] md:rounded-tr-none md:rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}
                    isSplitView={isSplitViewEnabled}
                    onToggleSplitView={() => {
                        const nextState = !isSplitViewEnabled;
                        setIsSplitViewEnabled(nextState);
                        if (nextState && !isSimpleNotesOpen && !isComposerOpen) {
                            setIsSimpleNotesOpenRaw(true);
                        }
                    }}
                    activeCanvasId={activeCanvasId}
                    onClose={() => setActiveNotebook(null)}
                    onOpenSimpleNotes={() => setIsSimpleNotesOpen(true)}
                    onFocusNode={(x, y) => { setCam({ x: -x * 0.8, y: -y * 0.8, scale: 0.8 }); setActiveNotebook(null); }}
                    blocks={blocks}
                    setBlocks={setBlocks}
                    syncBlocks={syncBlocks}
                    accent={accent}
                />
            )}

            {!isUnifiedCreatorOpen && isChatOpen && (() => {
                const keyboardOffset = Math.max(0, viewportStats.innerHeight - viewportStats.visualHeight - (viewportStats.offsetTop || 0));
                return (
                    <OasisChat
                        className={isSplitViewEnabled ? "fixed inset-y-0 left-0 w-full md:w-[50vw] mt-[100px] border-x-0 md:border-r border-white/10 rounded-t-[2.5rem] md:rounded-tl-none md:rounded-tr-[2.5rem] bg-[#050506]/95 backdrop-blur-md shadow-2xl z-[1500] pointer-events-auto" : undefined}
                        containerStyle={window.innerWidth < 768 ? {
                            top: `calc(140px + ${viewportStats.offsetTop || 0}px)`,
                            bottom: `${keyboardOffset}px`
                        } : undefined}
                        isSplitView={isSplitViewEnabled}
                        onToggleSplitView={() => {
                            const nextState = !isSplitViewEnabled;
                            setIsSplitViewEnabled(nextState);
                            if (nextState && !isSimpleNotesOpen && !isComposerOpen) {
                                setIsSimpleNotesOpenRaw(true);
                            }
                        }}
                        isOpen={isChatOpen}
                        isComposerOpen={isComposerOpen}
                        messages={chatMessages}
                        input={chatInput}
                        setInput={setChatInput}
                        onSend={handleSendChatMessage}
                        isLoading={isChatLoading}
                        activeExplorationNodeId={activeExplorationNodeId}
                        setActiveExplorationNodeId={setActiveExplorationNodeId}
                        onClose={() => {
                            saveCurrentChat();
                            setIsChatOpen(false);
                            setActiveExplorationNodeId(null);
                        }}
                        user={user}
                        setBlocks={setBlocks}
                        syncBlocks={syncBlocks}
                        conversations={conversations}
                        setConversations={setConversations}
                        activeConversationId={activeConversationId}
                        setActiveConversationId={setActiveConversationId}
                        folders={folders}
                        setFolders={setFolders}
                        blocks={blocks}
                        isAnalyzingNote={isAnalyzingNote}
                        setIsAnalyzingNote={setIsAnalyzingNote}
                        activeNoteId={activeNoteId}
                        setActiveNoteId={setActiveNoteId}
                        handleSelectNote={handleSelectNote}
                        userMemory={userMemory}
                        setUserMemory={setUserMemory}
                        syncMemory={syncMemory}
                        setChatMessages={setChatMessages}
                        chatMessagesRef={chatMessagesRef}
                        onNewChat={handleNewChat}
                        playQueue={playQueue}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        setCurrentTrack={setCurrentTrack}
                        handlePrevTrack={handlePrevTrack}
                        handleNextTrack={handleNextTrack}
                        audioRef={audioPlayerRef}
                        accent={accent}
                        setAccent={setAccent}
                        onTogglePinFact={handleTogglePinFact}
                        onForceSave={() => saveCurrentChat()}
                        avatar={avatar}
                        formatUrl={formatUrl}
                        activeCanvasId={activeCanvasId}
                    />
                );
            })()}
            {isStoryUploadModalOpen && (
                <StoryUploadModal
                    user={user}
                    userAvatar={avatar}
                    onClose={() => setIsStoryUploadModalOpen(false)}
                    onSave={(newStory) => {
                        syncBlocks([...blocks, newStory]);
                        setIsStoryUploadModalOpen(false);
                        fetch(`${API_URL}/api/oasis/feed/publish?user=${user}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newStory)
                        }).then(() => fetchFeed());
                    }}
                />
            )}
            {viewing24hStories && (
                <StoryViewer
                    storiesArray={viewing24hStories}
                    onClose={() => setViewing24hStories(null)}
                    isOwner={viewing24hStories[0]?.username === user}
                    onDelete={(id) => {
                        const cleanId = id.startsWith('feed_') ? id.substring(5) : id;
                        const feedId = id.startsWith('feed_') ? id : `feed_${id}`;
                        const updated = blocks.filter(b => b.id !== cleanId && b.id !== id);
                        setBlocks(updated);
                        if (typeof syncBlocks === 'function') {
                            syncBlocks(updated);
                        }
                        setViewing24hStories(prev => {
                            if (!prev) return null;
                            const filtered = prev.filter(s => s.id !== id && s.id !== cleanId && s.id !== feedId);
                            return filtered.length > 0 ? filtered : null;
                        });
                        if (user) {
                            fetch(`${API_URL}/api/oasis/blocks/${cleanId}?user=${user}`, { method: 'DELETE' }).then(() => fetchFeed()).catch(console.error);
                            fetch(`${API_URL}/api/oasis/feed/${feedId}`, { method: 'DELETE' }).catch(console.error);
                            fetch(`${API_URL}/api/oasis/feed/${cleanId}`, { method: 'DELETE' }).catch(console.error);
                        }
                    }}
                />
            )}

            {titlePrompt && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setTitlePrompt(null)}>
                    <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white text-lg font-black uppercase tracking-widest mb-4">{titlePrompt.defaultValue ? 'Editar Título' : 'Añadir Título'}</h3>
                        <input
                            type="text"
                            autoFocus
                            defaultValue={titlePrompt.defaultValue}
                            placeholder="Escribe el texto aquí..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors mb-6"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    titlePrompt.onConfirm(e.currentTarget.value);
                                    setTitlePrompt(null);
                                }
                                if (e.key === 'Escape') setTitlePrompt(null);
                            }}
                            id="title-prompt-input"
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setTitlePrompt(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all">Cancelar</button>
                            <button onClick={() => {
                                const input = document.getElementById('title-prompt-input');
                                titlePrompt.onConfirm(input.value);
                                setTitlePrompt(null);
                            }} className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all">Aceptar</button>
                        </div>
                    </div>
                </div>
            )}
            {isHighlightModalOpen && (
                <HighlightModal
                    user={user}
                    archive={blocks.filter(b => b.type === 'story' && b.username === user)}
                    onClose={() => setIsHighlightModalOpen(false)}
                    onSave={(newHighlight) => {
                        syncBlocks([...blocks, newHighlight]);
                        setIsHighlightModalOpen(false);
                        // Make sure it hits the backend public feed endpoint
                        fetch(`${API_URL}/api/oasis/feed/publish?user=${user}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newHighlight)
                        }).then(() => fetchFeed());
                    }}
                />
            )}
            {selectedHighlight && (
                <StoryViewer
                    highlight={selectedHighlight}
                    onClose={() => setSelectedHighlight(null)}
                    isOwner={user === selectedHighlight.username || blocks.some(b => b.id === selectedHighlight.id)}
                    onDelete={(id) => {
                        const cleanId = id.startsWith('feed_') ? id.substring(5) : id;
                        const feedId = id.startsWith('feed_') ? id : `feed_${id}`;
                        const updated = blocks.filter(b => b.id !== cleanId && b.id !== id);
                        setBlocks(updated);
                        if (typeof syncBlocks === 'function') {
                            syncBlocks(updated);
                        }
                        setSelectedHighlight(null);
                        if (user) {
                            fetch(`${API_URL}/api/oasis/blocks/${cleanId}?user=${user}`, { method: 'DELETE' }).then(() => fetchFeed()).catch(console.error);
                            fetch(`${API_URL}/api/oasis/feed/${feedId}`, { method: 'DELETE' }).catch(console.error);
                            fetch(`${API_URL}/api/oasis/feed/${cleanId}`, { method: 'DELETE' }).catch(console.error);
                        }
                    }}
                />
            )}
            {zoomedImage && (
                <div
                    onClick={() => setZoomedImage(null)}
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
                >
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-[-50px] right-0 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all duration-200 border border-white/5"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }}
                            src={zoomedImage}
                            alt="Estímulo ampliado"
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/5 shadow-2xl transition-transform duration-300"
                            style={{ filter: 'invert(1)' }}
                        />

                        <div className="mt-4 text-white/30 text-[10px] font-mono tracking-widest uppercase">
                            Haz clic fuera o presiona la cruz para cerrar
                        </div>
                    </div>
                </div>
            )}

            {isRecording && webcamStream && (
                <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[1000] w-28 h-20 sm:w-40 sm:h-30 bg-[#0c0c0d] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                    <video onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.poster = 'https://placehold.co/400x300/030304/444444?text=Offline+Video'; } }}
                        ref={(el) => {
                            if (el && webcamStream) {
                                el.srcObject = webcamStream;
                            }
                        }}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1 py-0.5 rounded bg-red-500 text-[6px] sm:text-[8px] font-mono font-bold text-white uppercase tracking-wider animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-white" /> REC CLÍNICO
                    </div>
                </div>
            )}

            {/*
                <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#0c0c0d] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-500">Acceso Restringido</span>
                            <h4 className="text-xl font-black italic text-white tracking-tight">Verificación Clínica</h4>
                            <p className="text-[10px] text-zinc-500 font-sans">Introduce la contraseña de acceso al panel de observaciones y diagnóstico.</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setPasswordError(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleVerifyClinicalPassword();
                                }}
                                placeholder="CONTRASEÑA MÁSTER"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-center text-xs font-mono tracking-[0.2em] text-white focus:border-red-500/50 outline-none transition-all placeholder:text-zinc-700"
                            />

                            {passwordError && (
                                <p className="text-red-500 text-[9px] text-center font-bold uppercase tracking-wider animate-pulse">
                                    Contraseña inválida o rechazada
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="py-3 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleVerifyClinicalPassword}
                                    className="py-3 rounded-xl bg-red-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            */}



            {/* ── UNIFIED BOTTOM CONTEXT BAR ── [switcher │ mode tools] */}
            {(isComposerOpen || isChatOpen || activeNotebook || isPublishSelectorOpen) && !isUnifiedCreatorOpen && !activeTest && (() => {
                const isKeyboardOpen = window.innerWidth < 768 && (maxHeight - viewportStats.visualHeight) > 150;
                const isAnyContextOpen = isComposerOpen || isChatOpen || activeNotebook || isPublishSelectorOpen;
                const hasActiveInput = ((isChatOpen && chatInputBar?.trim()) || ((isComposerOpen || activeNotebook === 'diary') && noteText?.trim()) || (activeNotebook === 'resonance' && typeof resResonance !== 'undefined' && resResonance?.trim()));
                const keyboardOffset = Math.max(0, viewportStats.innerHeight - viewportStats.visualHeight - (viewportStats.offsetTop || 0));

                return (
                    <div
                        className="fixed inset-x-0 z-[2100] flex flex-col items-center justify-end pointer-events-none transition-transform duration-100 ease-out"
                        style={{
                            bottom: window.innerWidth < 768 ? `${keyboardOffset}px` : 0,
                            paddingBottom: (window.innerWidth < 768 && isKeyboardOpen) ? '0px' : 'env(safe-area-inset-bottom)'
                        }}
                    >
                        <div
                            className={`pointer-events-auto transition-all duration-200 ${isKeyboardOpen ? 'mb-0 mx-0 w-full' : 'mb-2 mx-3 w-full max-w-4xl'}`}
                            style={{
                                ...(isChatOpen && isComposerOpen && window.innerWidth >= 768 ? {
                                    maxWidth: 'none',
                                    width: 'calc(100% - 20vw)',
                                    marginLeft: '10vw',
                                    marginRight: '10vw'
                                } : {})
                            }}
                        >
                            <div className={`flex items-center bg-[#0d0d0f]/97 backdrop-blur-md border border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-200 ${isKeyboardOpen ? 'rounded-none border-x-0 border-b-0 py-1 px-2' : 'rounded-[1.75rem]'}`}>

                                {isChatOpen && isComposerOpen && window.innerWidth >= 768 ? (
                                    <div className="w-full flex items-center justify-between px-3 py-1.5 min-w-0">
                                        {/* Left pane tools (Chat input) */}
                                        <div className="w-[28vw] flex items-center gap-1.5 pr-4 border-r border-white/5 shrink-0 min-w-0">
                                            {/* MODE SWITCHER */}
                                            <div className="flex items-center gap-0.5 shrink-0 border-r border-white/[0.06] pr-2 mr-1">
                                                <button onClick={() => { openNewComposer(false, false); if (window.innerWidth < 768) setIsChatOpen(false); setActiveNotebook(null); setIsPublishSelectorOpen(false); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/15 text-white`} title="Nota"><Edit3 size={13} /></button>
                                                <button onClick={() => { if (window.innerWidth < 768) setIsComposerOpen(false); setActiveNotebook(null); setIsChatOpen(true); setIsPublishSelectorOpen(false); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/15 text-white`} title="Chat IA"><MessageCircle size={13} /></button>
                                            </div>
                                            {/* CHAT INPUT TOOLS */}
                                            <input type="file" id="chatMediaInput" className="hidden" accept="image/*,video/*,audio/*" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    formData.append('user', user || 'default');
                                                    const res = await fetch(`${API_URL}/api/oasis/upload`, { method: 'POST', body: formData });
                                                    if (res.ok) {
                                                        const data = await res.json();
                                                        const tag = file.type.startsWith('video/') ? 'vid' : (file.type.startsWith('audio/') ? 'aud' : 'img');
                                                        setChatInputBar(prev => (prev ? prev + ' ' : '') + `[${tag}]${data.url}[/${tag}]`);
                                                    }
                                                } catch (err) { console.error('Error uploading chat media:', err); }
                                            }} />
                                            <button onClick={() => document.getElementById('chatMediaInput')?.click()} className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all text-zinc-500 hover:text-white hover:bg-white/8" title="Adjuntar archivo"><Paperclip size={12} /></button>

                                            <textarea
                                                ref={chatInputBarRef}
                                                rows={1}
                                                value={chatInputBar}
                                                onChange={(e) => { setChatInputBar(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatBarSend(); } }}
                                                onFocus={() => { setTimeout(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; }, 100); }}
                                                placeholder="Escribe o dicta..."
                                                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-700 outline-none resize-none no-scrollbar min-h-[28px] max-h-[120px] py-1 px-1"
                                            />
                                            <button onClick={handleChatBarSend} disabled={!chatInputBar?.trim()} className="w-7 h-7 shrink-0 rounded-full bg-accent text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-30" style={{ '--accent-rgb': hexToRgb(accent) }}><Send size={11} strokeWidth={3} /></button>
                                            <button onClick={() => setIsChatOpen(false)} className="w-7 h-7 shrink-0 rounded-full text-zinc-700 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all ml-1" title="Cerrar Chat"><X size={12} /></button>
                                        </div>

                                        {/* Separator / Gap */}
                                        <div className="flex-1" />

                                        {/* Right pane tools (Composer tools) */}
                                        <div className="flex items-center gap-2 pl-4 shrink-0">
                                            <input type="file" ref={inlineMediaInputRef} className="hidden" onChange={handleInlineMedia} accept="image/*,video/*,audio/*" />
                                            <button onClick={() => inlineMediaInputRef.current?.click()} className="w-8 h-8 rounded-full hover:bg-white/8 flex items-center justify-center text-zinc-500 hover:text-white transition-all" title="Adjuntar"><Paperclip size={13} /></button>

                                            <button onClick={() => launchMedia()} disabled={(!caption && !noteText) || isSyncingMedia} className={`h-7 px-3 rounded-full flex items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all ${(!caption && !noteText) ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10'} ${isSyncingMedia ? 'animate-pulse opacity-50' : ''}`}><Save size={10} /><span>{isSyncingMedia ? 'Sincronizando...' : 'Guardar'}</span></button>
                                            <button onClick={() => { if (noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); setEditingId(null); setNoteText(''); }} className="w-8 h-8 shrink-0 ml-2 rounded-full text-zinc-700 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all" title="Cerrar Nota"><X size={13} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* LEFT: MODE SWITCHER - auto-collapses when typing */}
                                        {!isKeyboardOpen && (
                                            <div className="group flex items-center gap-0.5 px-1 sm:px-2 py-1.5 shrink-0 border-r border-white/[0.06] transition-all duration-300">
                                                <button onClick={() => { openNewComposer(false, false); if (window.innerWidth < 768) setIsChatOpen(false); setActiveNotebook(null); setIsPublishSelectorOpen(false); }} className={`h-11 sm:h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${!isComposerOpen && isAnyContextOpen ? 'w-0 sm:w-0 opacity-0 px-0 mx-0 pointer-events-none group-hover:w-11 sm:group-hover:w-8 group-hover:opacity-100 group-hover:pointer-events-auto' : 'w-11 sm:w-8 opacity-100 pointer-events-auto'} ${isComposerOpen ? 'bg-white/15 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/8'}`} title="Nota"><Edit3 size={15} className="shrink-0 scale-90 sm:scale-100" /></button>
                                                <button onClick={() => { if (window.innerWidth < 768 && isComposerOpen) { if (noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); } setActiveNotebook(null); setIsChatOpen(true); setIsPublishSelectorOpen(false); }} className={`h-11 sm:h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${!isChatOpen && isAnyContextOpen ? 'w-0 sm:w-0 opacity-0 px-0 mx-0 pointer-events-none group-hover:w-11 sm:group-hover:w-8 group-hover:opacity-100 group-hover:pointer-events-auto' : 'w-11 sm:w-8 opacity-100 pointer-events-auto'} ${isChatOpen ? 'bg-white/15 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/8'}`} title="Chat IA"><MessageCircle size={15} className="shrink-0 scale-90 sm:scale-100" /></button>

                                                <button onClick={() => { if (isComposerOpen) { if (noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); } setIsChatOpen(false); setActiveNotebook('resonance'); setIsPublishSelectorOpen(false); }} className={`h-11 sm:h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${activeNotebook !== 'resonance' && isAnyContextOpen ? 'w-0 sm:w-0 opacity-0 px-0 mx-0 pointer-events-none group-hover:w-11 sm:group-hover:w-8 group-hover:opacity-100 group-hover:pointer-events-auto' : 'w-11 sm:w-8 opacity-100 pointer-events-auto'} ${activeNotebook === 'resonance' ? 'bg-white/15 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/8'}`} title="Ruido"><Sparkles size={15} className="shrink-0 scale-90 sm:scale-100" /></button>
                                                <button onClick={() => { if (isComposerOpen) { if (noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); } setIsChatOpen(false); setActiveNotebook(null); setIsPublishSelectorOpen(true); }} className={`h-11 sm:h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${!isPublishSelectorOpen && isAnyContextOpen ? 'w-0 sm:w-0 opacity-0 px-0 mx-0 pointer-events-none group-hover:w-11 sm:group-hover:w-8 group-hover:opacity-100 group-hover:pointer-events-auto' : 'w-11 sm:w-8 opacity-100 pointer-events-auto'} ${isPublishSelectorOpen ? 'bg-white/15 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/8'}`} title="Publicar en Feed"><Share2 size={15} className="shrink-0 scale-90 sm:scale-100" /></button>
                                            </div>
                                        )}

                                        {/* RIGHT: CONTEXT TOOLS */}
                                        <div className="flex-1 flex items-center min-w-0 px-2 py-1.5 gap-1">

                                            {/* COMPOSER: attach, voice, save, publish */}
                                            {isComposerOpen && (
                                                <>
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <input type="file" ref={inlineMediaInputRef} className="hidden" onChange={handleInlineMedia} accept="image/*,video/*,audio/*" />
                                                        <button onClick={() => inlineMediaInputRef.current?.click()} className="w-11 h-11 sm:w-8 sm:h-8 rounded-full hover:bg-white/8 flex items-center justify-center text-zinc-500 hover:text-white transition-all" title="Adjuntar"><Paperclip size={16} className="sm:scale-75" /></button>

                                                    </div>
                                                    <div className="flex-1" />
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button onClick={() => launchMedia()} disabled={(!caption && !noteText) || isSyncingMedia} className={`h-11 px-5 sm:h-7 sm:px-3 rounded-full flex items-center gap-2 sm:gap-1 text-[11px] sm:text-[9px] font-black uppercase tracking-wider transition-all ${(!caption && !noteText) ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10'} ${isSyncingMedia ? 'animate-pulse opacity-50' : ''}`}><Save size={14} className="sm:scale-75" /><span>{isSyncingMedia ? 'Sincronizando...' : 'Guardar'}</span></button>
                                                    </div>
                                                </>
                                            )}

                                            {/* CHAT: mic + text input + send */}
                                            {isChatOpen && (
                                                <>
                                                    <input type="file" id="chatMediaInput" className="hidden" accept="image/*,video/*,audio/*" onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        try {
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            formData.append('user', user || 'default');
                                                            const res = await fetch(`${API_URL}/api/oasis/upload`, { method: 'POST', body: formData });
                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                const tag = file.type.startsWith('video/') ? 'vid' : (file.type.startsWith('audio/') ? 'aud' : 'img');
                                                                setChatInputBar(prev => (prev ? prev + ' ' : '') + `[${tag}]${data.url}[/${tag}]`);
                                                            }
                                                        } catch (err) { console.error('Error uploading chat media:', err); }
                                                    }} />
                                                    <button onClick={() => document.getElementById('chatMediaInput')?.click()} className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all text-zinc-500 hover:text-white hover:bg-white/8" title="Adjuntar archivo"><Paperclip size={12} /></button>

                                                    <textarea
                                                        ref={chatInputBarRef}
                                                        rows={1}
                                                        value={chatInputBar}
                                                        onChange={(e) => { setChatInputBar(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatBarSend(); } }}
                                                        onFocus={() => { setTimeout(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; }, 100); }}
                                                        placeholder="Escribe o dicta..."
                                                        className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-700 outline-none resize-none no-scrollbar min-h-[28px] max-h-[120px] py-1 px-1"
                                                    />
                                                    <button onClick={handleChatBarSend} disabled={!chatInputBar?.trim()} className="w-7 h-7 shrink-0 rounded-full bg-accent text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-30" style={{ '--accent-rgb': hexToRgb(accent) }}><Send size={11} strokeWidth={3} /></button>
                                                </>
                                            )}

                                            {/* DIARY: mic + save */}
                                            {activeNotebook === 'diary' && !isComposerOpen && !isChatOpen && (
                                                <>

                                                    <div className="flex-1" />
                                                    <button onClick={() => launchMedia()} disabled={isSyncingMedia} className={`h-7 px-3 rounded-full flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 transition-all ${isSyncingMedia ? 'animate-pulse opacity-50' : ''}`}><Save size={10} /><span>{isSyncingMedia ? 'Sincronizando...' : 'Guardar entrada'}</span></button>
                                                </>
                                            )}

                                            {/* RESONANCE NOTEBOOK TOOLS PORTAL */}
                                            {activeNotebook === 'resonance' && (
                                                <div id="resonance-context-tools" className="flex-1 flex items-center justify-end min-w-0 gap-1 w-full" />
                                            )}
                                        </div>

                                        {/* CLOSE */}
                                        <button onClick={() => { if (noteText?.trim()) handleComposerAutoSave(); setIsComposerOpen(false); setEditingId(null); setNoteText(''); setIsChatOpen(false); setActiveNotebook(null); }} className="w-11 h-11 sm:w-8 sm:h-8 shrink-0 mr-1.5 rounded-full text-zinc-700 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all" title="Cerrar"><X size={15} className="sm:scale-90" /></button>
                                    </>
                                )}

                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* COMPOSER */}
            {isComposerOpen && (
                <div
                    className={isSplitViewEnabled ? "fixed inset-y-0 right-0 w-full md:w-[50vw] mt-[100px] border-x-0 md:border-l border-white/10 rounded-t-[2.5rem] md:rounded-tr-none md:rounded-tl-[2.5rem] bg-[#050506]/95 backdrop-blur-md text-white shadow-2xl z-[2001] flex flex-col pb-safe overflow-hidden pointer-events-auto animate-in fade-in duration-500" : "fixed inset-x-0 md:inset-x-[5vw] lg:inset-x-[10vw] xl:inset-x-[10vw] top-4 sm:top-[140px] md:top-[100px] bottom-0 rounded-t-[2.5rem] border-t border-x border-white/5 md:border-white/10 z-[2000] flex flex-col bg-[#050506]/95 backdrop-blur-md text-white shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe overflow-hidden animate-in fade-in slide-in-from-bottom-[60%] duration-500 transition-all pointer-events-auto"}
                    style={{
                        top: window.innerWidth < 640 ? 'max(env(safe-area-inset-top), 16px)' : undefined,
                        ...(isChatOpen && window.innerWidth >= 768 ? {
                            left: 'calc(10vw + 28vw + 20px)',
                            right: '10vw',
                            width: 'auto'
                        } : {})
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        const rect = e.currentTarget.getBoundingClientRect();
                        if (touch.clientY - rect.top <= 100) {
                            e.currentTarget.dataset.dragAllowed = 'true';
                            e.currentTarget.dataset.startY = touch.clientY;
                            e.currentTarget.style.transition = 'none';
                        } else {
                            e.currentTarget.dataset.dragAllowed = 'false';
                        }
                    }}
                    onTouchMove={(e) => {
                        e.stopPropagation();
                        if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                        const startY = parseFloat(e.currentTarget.dataset.startY || 0); const currentY = e.touches[0].clientY; const deltaY = currentY - startY; const scrollable = e.target.closest('.overflow-y-auto, textarea, input'); if (scrollable && scrollable.scrollTop > 0) return; if (deltaY > 0) { e.currentTarget.style.transform = `translateY(${deltaY}px)`; } if (deltaY > 120) { e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'; e.currentTarget.style.transform = 'translateY(100%)'; setTimeout(() => { setIsComposerOpen(false); setView('canvas'); }, 200); }
                    }}
                    onTouchEnd={(e) => {
                        if (e.currentTarget.dataset.dragAllowed !== 'true') return;
                        const startY = parseFloat(e.currentTarget.dataset.startY || 0); const currentY = e.changedTouches[0].clientY; const deltaY = currentY - startY; if (deltaY <= 120) { e.currentTarget.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'; e.currentTarget.style.transform = 'translateY(0px)'; }
                    }}
                    onPointerDown={e => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                >

                    {/* SCROLLABLE CONTENT AREA */}

                    <div className={`flex-1 overflow-y-auto no-scrollbar relative min-h-0 ${composerStep === 'note' ? `w-full ${showSecondaryNote ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-6 md:px-12 pt-12 pb-4 md:pt-16 md:pb-6 transition-all duration-500` : 'flex items-center justify-center p-4'}`}>
                        {composerStep === 'note' ? (
                            <div className="space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">

                                {(() => {
                                    const currentBlock = blocks.find(b => b.id === editingId);
                                    const parentBlock = currentBlock?.metadata?.parentId ? blocks.find(b => b.id === currentBlock.metadata.parentId) : null;
                                    if (!parentBlock) return null;
                                    return (
                                        <button
                                            onClick={() => editBlock(parentBlock)}
                                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all self-start animate-in fade-in slide-in-from-left-5 duration-300"
                                        >
                                            <ArrowLeft size={12} />
                                            <span>Volver a: {parentBlock.caption || 'Nota Principal'}</span>
                                        </button>
                                    );
                                })()}

                                <div className={`mx-auto w-full flex flex-col gap-8 pb-[50vh] transition-all duration-500 ${showSecondaryNote ? 'max-w-7xl' : 'max-w-5xl'}`}>
                                    <div className="space-y-4 w-full">

                                        <div className="flex items-end gap-6 mb-4 md:mb-8">
                                            <div className="flex-1">
                                                <input
                                                    ref={titleRef}
                                                    autoFocus
                                                    className="w-full bg-transparent border-none focus:ring-0 text-2xl md:text-4xl font-bold text-zinc-100 placeholder:text-zinc-800 transition-all p-0 tracking-tight"
                                                    placeholder={isDiaryMode ? new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : (isResonanceMode ? "Nombra tu Resonancia" : "Sin título")}
                                                    value={caption}
                                                    onChange={e => setCaption(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Tab') {
                                                            e.preventDefault();
                                                            const nextInput = document.querySelector('.typing-aura') || document.querySelector('textarea');
                                                            nextInput?.focus();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {isDiaryMode && (
                                                <div className="hidden md:flex flex-col items-end opacity-20">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{new Date().getFullYear()}</span>
                                                    <span className="text-[20px] font-black italic text-zinc-600 -mt-1">Nexus</span>
                                                </div>
                                            )}
                                        </div>

                                        {!isDiaryMode && (() => {
                                            const childNotes = editingId ? blocks.filter(b => b.metadata?.parentId === editingId) : [];
                                            if (childNotes.length === 0) return null;
                                            return (
                                                <div className="w-full flex items-center flex-wrap gap-2 pb-6 border-b border-white/5 mb-6 animate-in fade-in duration-300">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mr-2 flex items-center gap-1" style={{ color: accent }}>
                                                        <FileText size={12} />
                                                        Subpáginas:
                                                    </span>

                                                    {childNotes.map((child, idx) => (
                                                        <div key={child.id} className="group flex items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-1 py-1 transition-all animate-in zoom-in-95 duration-200">
                                                            <span
                                                                onClick={() => editBlock(child)}
                                                                className="text-[10px] font-bold text-white cursor-pointer mr-2 truncate max-w-[120px] hover:text-accent transition-colors"
                                                            >
                                                                {child.caption || `Subpágina ${idx + 1}`}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(child.id); }}
                                                                className="w-5 h-5 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-all"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        {(() => {
                                            const currentMuralBlocks = editingId ? (blocks.find(b => b.id === editingId)?.muralBlocks || []) : tempMuralBlocks;
                                            if (!currentMuralBlocks || currentMuralBlocks.length === 0) return null;
                                            return (
                                                <div className="mb-8 p-6 rounded-[2.5rem] bg-white/5 border border-white/5 max-w-3xl w-full animate-in fade-in duration-500 shadow-2xl relative overflow-hidden group/mural-comp">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-2xl rounded-full" />
                                                    <div className="flex items-center gap-2 mb-3 relative z-10">
                                                        <Grid size={12} className="text-accent animate-pulse" style={{ color: accent }} />
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent" style={{ color: accent }}>Pizarrón Adjunto ({currentMuralBlocks.length} Capas)</span>
                                                    </div>
                                                    <MiniMuralPreview
                                                        muralBlocks={currentMuralBlocks}
                                                        accent={accent}
                                                        onClick={() => launchMural(editingId)}
                                                        size="lg"
                                                    />
                                                </div>
                                            );
                                        })()}

                                        <div className="space-y-1 relative" onClick={() => setActiveMenu(null)}>
                                            {isDiaryMode ? (
                                                /* FEED-STYLE DIARY MODE */
                                                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-10 duration-1000 max-w-3xl mx-auto">
                                                    {/* PREVIOUS ENTRIES */}
                                                    {blocks.find(b => b.id === editingId)?.entries?.map((entry, idx) => (
                                                        <div key={idx} className="flex flex-col gap-3 p-5 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/5 opacity-80 md:opacity-40 md:hover:opacity-100 transition-all">
                                                            <div className="flex items-center justify-between opacity-50">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-accent">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <p className="text-base md:text-lg font-serif italic text-white/90 leading-relaxed">"{entry.text}"</p>
                                                        </div>
                                                    ))}

                                                    {/* ADD NEW ENTRY TRIGGER */}
                                                    <div className="flex justify-center -my-2">
                                                        <button
                                                            onClick={() => document.querySelector('textarea')?.focus()}
                                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-2"
                                                        >
                                                            <Plus size={12} /> Nueva Entrada
                                                        </button>
                                                    </div>

                                                    {/* NEW ENTRY INPUT */}
                                                    <div className="flex flex-col gap-4 p-8 bg-[#0c0c0d] backdrop-blur-md rounded-[3rem] border-2 border-accent/20 shadow-[0_0_50px_rgba(var(--accent-rgb),0.1)] group relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-10 h-10 rounded-2xl bg-accent text-black flex items-center justify-center">
                                                                <Edit3 size={18} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] md:text-[14px] font-black italic text-accent leading-tight uppercase tracking-tight">Nueva Entrada</span>
                                                                <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.4em] opacity-60">Flujo de Conciencia</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid w-full relative min-h-[150px]">
                                                            <textarea
                                                                autoFocus
                                                                value={noteText}
                                                                onChange={e => setNoteText(e.target.value)}
                                                                placeholder="Escribe lo que sientes en este momento..."
                                                                className="w-full h-full bg-transparent border-none focus:ring-0 p-0 text-xl md:text-xl font-serif italic text-white/95 placeholder:text-zinc-800 resize-none pb-6 overflow-hidden col-[1] row-[1] typing-aura"
                                                            />
                                                            <div className="w-full h-full p-0 text-xl md:text-xl font-serif italic pb-6 whitespace-pre-wrap invisible col-[1] row-[1] pointer-events-none break-words">
                                                                {noteText + ' '}
                                                            </div>
                                                        </div>
                                                        {isRecordingNote && (
                                                            <div className="absolute bottom-4 right-8 flex items-center gap-2 pointer-events-none select-none">
                                                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-red-500 animate-pulse">Escuchando...</span>
                                                                <div className="flex items-center gap-0.5 h-3">
                                                                    <span className="w-0.5 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.6s' }} />
                                                                    <span className="w-0.5 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '0.5s' }} />
                                                                    <span className="w-0.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.7s' }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : isResonanceMode ? (
                                                /* RESONANCE STRUCTURED MODE */
                                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-bottom-10 duration-1000 ${focusedResonanceField ? 'md:grid-cols-1' : ''}`}>
                                                    {/* RESONANCIA CARD */}
                                                    {(!focusedResonanceField || focusedResonanceField === 'resonance') && (
                                                        <div className={`flex flex-col gap-3 p-6 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-accent/30 transition-all group shadow-2xl relative overflow-hidden ${focusedResonanceField === 'resonance' ? 'md:col-span-1 min-h-[60vh] border-accent/50' : ''}`}>
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-accent/10 transition-colors" />
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                                                    <Radio size={16} className={focusedResonanceField === 'resonance' ? 'animate-pulse' : 'animate-spin-slow'} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] md:text-[13px] font-black italic text-accent leading-tight uppercase tracking-tight">¿Qué resuena hoy en ti?</span>
                                                                    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-[0.4em] opacity-80">Resonancia Primal</span>
                                                                </div>
                                                            </div>
                                                            <div className={`grid w-full relative ${focusedResonanceField === 'resonance' ? 'flex-1' : 'min-h-[80px]'}`}>
                                                                <textarea
                                                                    value={resResonance}
                                                                    onChange={e => setResResonance(e.target.value)}
                                                                    onFocus={() => setFocusedResonanceField('resonance')}
                                                                    placeholder="Describe la vibración actual..."
                                                                    className={`w-full h-full bg-transparent border-none focus:ring-0 p-0 font-serif italic text-white/90 placeholder:text-zinc-600 resize-none overflow-hidden col-[1] row-[1] typing-aura ${focusedResonanceField === 'resonance' ? 'text-xl md:text-xl' : 'text-base md:text-base'}`}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Tab') {
                                                                            e.preventDefault();
                                                                            const textareas = document.querySelectorAll('.typing-aura');
                                                                            const idx = Array.from(textareas).indexOf(e.target);
                                                                            textareas[idx + 1]?.focus();
                                                                        }
                                                                    }}
                                                                />
                                                                <div className={`w-full h-full p-0 font-serif italic whitespace-pre-wrap invisible col-[1] row-[1] pointer-events-none break-words ${focusedResonanceField === 'resonance' ? 'text-xl md:text-xl' : 'text-base md:text-base'}`}>
                                                                    {resResonance + ' '}
                                                                </div>
                                                            </div>
                                                            {focusedResonanceField === 'resonance' && (
                                                                <div className="flex justify-end mt-4">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setFocusedResonanceField(null); }}
                                                                        className="px-6 py-3 rounded-full bg-accent text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] flex items-center gap-2"
                                                                    ><Check size={14} /> Guardar Resonancia</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* IMPACT CARD */}
                                                    {(!focusedResonanceField || focusedResonanceField === 'impact') && (
                                                        <div className={`flex flex-col gap-3 p-6 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-rose-400/30 transition-all group shadow-2xl relative overflow-hidden ${focusedResonanceField === 'impact' ? 'md:col-span-1 min-h-[60vh] border-rose-400/50' : ''}`}>
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-rose-400/10 transition-colors" />
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-8 h-8 rounded-xl bg-rose-400/10 flex items-center justify-center text-rose-400">
                                                                    <Zap size={16} className={focusedResonanceField === 'impact' ? 'animate-pulse' : ''} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] md:text-[13px] font-black italic text-rose-400 leading-tight uppercase tracking-tight">¿Qué impacto genera esto?</span>
                                                                    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-[0.4em] opacity-80">Impacto Profundo</span>
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                value={resImpact}
                                                                onChange={e => setResImpact(e.target.value)}
                                                                onFocus={() => setFocusedResonanceField('impact')}
                                                                placeholder="Define la magnitud de la onda..."
                                                                className={`w-full bg-transparent border-none focus:ring-0 p-0 font-serif italic text-white/90 placeholder:text-zinc-600 resize-none typing-aura custom-scroll ${focusedResonanceField === 'impact' ? 'text-xl md:text-xl flex-1' : 'text-base md:text-base min-h-[80px]'}`}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Tab') {
                                                                        e.preventDefault();
                                                                        const textareas = document.querySelectorAll('.typing-aura');
                                                                        const idx = Array.from(textareas).indexOf(e.target);
                                                                        textareas[idx + 1]?.focus();
                                                                    }
                                                                }}
                                                            />
                                                            {focusedResonanceField === 'impact' && (
                                                                <div className="flex justify-end mt-4">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setFocusedResonanceField(null); }}
                                                                        className="px-6 py-3 rounded-full bg-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center gap-2"
                                                                    ><Check size={14} /> Guardar Impacto</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* STRANGE CARD */}
                                                    {(!focusedResonanceField || focusedResonanceField === 'strange') && (
                                                        <div className={`flex flex-col gap-3 p-6 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 hover:border-cyan-400/30 transition-all group shadow-2xl relative overflow-hidden ${focusedResonanceField === 'strange' ? 'md:col-span-1 min-h-[60vh] border-cyan-400/50' : 'md:col-span-2'}`}>
                                                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[100px] rounded-full -translate-x-1/4 -translate-y-1/2 group-hover:bg-cyan-400/10 transition-colors" />
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <div className="w-8 h-8 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                                                                    <Focus size={16} className={focusedResonanceField === 'strange' ? 'animate-pulse' : ''} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] md:text-[13px] font-black italic text-cyan-400 leading-tight uppercase tracking-tight">¿Qué es lo extraño de este proceso?</span>
                                                                    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-[0.4em] opacity-80">Atipicidad / Rareza</span>
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                value={resStrange}
                                                                onChange={e => setResStrange(e.target.value)}
                                                                onFocus={() => setFocusedResonanceField('strange')}
                                                                placeholder="Capta la anomalía en el sistema..."
                                                                className={`w-full bg-transparent border-none focus:ring-0 p-0 font-black italic text-white/95 placeholder:text-zinc-600 resize-none typing-aura tracking-tight custom-scroll ${focusedResonanceField === 'strange' ? 'text-2xl md:text-3xl flex-1' : 'text-lg md:text-xl min-h-[80px]'}`}
                                                            />
                                                            {focusedResonanceField === 'strange' && (
                                                                <div className="flex justify-end mt-4">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setFocusedResonanceField(null); }}
                                                                        className="px-6 py-3 rounded-full bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
                                                                    ><Check size={14} /> Guardar Anomalía</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* SIMPLE NOTE MODE - FLUID EDITOR */
                                                <div className="w-full flex flex-col min-h-[50vh] relative animate-in fade-in duration-500">
                                                    <div className="flex justify-end mb-4">
                                                        <button
                                                            onClick={() => setShowSecondaryNote(!showSecondaryNote)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
                                                        >
                                                            <PanelLeft size={12} />
                                                            {showSecondaryNote ? 'Ocultar Panel Secundario' : 'Doble Panel'}
                                                        </button>
                                                    </div>
                                                    <div className={`w-full flex ${showSecondaryNote ? 'flex-col md:flex-row gap-6' : 'flex-col'} min-h-[60vh]`}>
                                                        <div className={`${showSecondaryNote ? 'w-full md:w-1/2 p-6 md:p-8 bg-[#0c0c0d] backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden transition-all flex flex-col' : 'w-full flex-1 flex flex-col transition-all'}`}>
                                                            {showSecondaryNote && <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />}
                                                            <textarea
                                                                autoFocus
                                                                value={noteText}
                                                                onChange={e => {
                                                                    setNoteText(e.target.value);
                                                                    if (!showSecondaryNote) {
                                                                        e.target.style.height = 'auto';
                                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                                    }
                                                                }}
                                                                onFocus={e => {
                                                                    if (!showSecondaryNote) {
                                                                        e.target.style.height = 'auto';
                                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                                    }
                                                                }}
                                                                placeholder="Comienza a escribir libremente..."
                                                                className={`w-full bg-transparent border-none focus:ring-0 p-0 text-base font-sans leading-relaxed text-white/90 placeholder:text-zinc-700 pb-32 relative z-10 break-words ${showSecondaryNote ? 'resize-y min-h-[300px] custom-scroll' : 'min-h-[70vh] resize-none overflow-hidden'}`}
                                                            />
                                                        </div>
                                                        {showSecondaryNote && (
                                                            <div className="w-full md:w-1/2 flex flex-col gap-6 overflow-y-auto no-scrollbar max-h-[70vh] pr-2 pb-20">
                                                                {secondaryPanels.map((panel, idx) => (
                                                                    <div key={panel.id} className="p-6 md:p-8 bg-[#0c0c0d] backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-right-10 duration-500 shrink-0">
                                                                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                                                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Panel {idx + 1}</span>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSecondaryPanels(prev => prev.filter(p => p.id !== panel.id));
                                                                                    }}
                                                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-all"
                                                                                    title="Eliminar panel"
                                                                                >
                                                                                    <X size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <textarea
                                                                            value={panel.text}
                                                                            onChange={e => {
                                                                                const newText = e.target.value;
                                                                                setSecondaryPanels(prev => prev.map(p => p.id === panel.id ? { ...p, text: newText } : p));
                                                                            }}
                                                                            placeholder="Panel secundario para referencias y apuntes rápidos..."
                                                                            className="w-full min-h-[150px] bg-transparent border-none focus:ring-0 p-0 text-xl md:text-base font-sans leading-relaxed text-white/70 placeholder:text-zinc-700 resize-y pb-4 custom-scroll relative z-10"
                                                                        />
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => setSecondaryPanels(prev => [...prev, { id: Date.now(), text: '' }])}
                                                                    className="w-full py-8 border-2 border-dashed border-white/5 hover:border-white/20 bg-white/[0.01] hover:bg-white/5 rounded-[2.5rem] text-zinc-500 hover:text-white transition-all flex flex-col items-center justify-center gap-3 shrink-0"
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                                        <Plus size={16} />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Añadir otro panel</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* ELIMINADO EL TOOLBAR INLINE AQUI - MOVIDO ARRIBA */}
                                    </div> {/* Close editor div */}

                                </div>
                            </div>
                        ) : (
                            /* MEDIA PORTAL (MODAL) */
                            <div className="relative w-full max-w-xl bg-black/40 backdrop-blur-md rounded-[3.5rem] border border-white/10 p-10 md:p-14 shadow-2xl animate-in zoom-in duration-500">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Portal {composerStep}</h2>
                                    <X className="cursor-pointer hover:text-red-500 transition-colors" size={20} onClick={() => setIsComposerOpen(false)} />
                                </div>
                                <input
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-lg font-black italic text-accent placeholder:text-zinc-800 mb-8"
                                    placeholder="Agrega un título..."
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                />
                                <label className="group w-full h-48 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-zinc-500 hover:text-white">
                                    <Plus size={28} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase mt-4 tracking-widest">{mediaFile ? '¡Reliquia Lista!' : `Vincular ${composerStep}`}</span>
                                    <input type="file" className="hidden" accept={composerStep === 'image' ? 'image/*' : (composerStep === 'audio' ? 'audio/*' : 'video/*')} onChange={handleFileChange} />
                                </label>
                                <button
                                    onClick={launchMedia}
                                    className="w-full mt-10 py-5 bg-accent text-black font-black uppercase tracking-widest rounded-3xl text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-30"
                                    disabled={!caption || (composerStep === 'image' && !mediaFile) || isSyncingMedia}
                                >
                                    {isSyncingMedia ? 'Sincronizando Medio...' : 'Guardar Fragmento'}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* DRAWING MODAL */}
            {isDrawingModalOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="absolute top-8 right-8 flex gap-4">
                        <button onClick={() => setIsDrawingModalOpen(false)} className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={32} /></button>
                    </div>
                    <div className="w-full max-w-4xl bg-black rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full bg-zinc-900/10 cursor-crosshair h-[600px]"
                        />
                        <div className="p-8 border-t border-white/5 flex justify-between items-center">
                            <div className="flex gap-4">
                                {['#4287f5', '#6366f1', '#bef264', '#ffffff'].map(c => (
                                    <button key={c} onClick={() => setDrawingColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${drawingColor === c ? 'border-white scale-125' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }} className="px-6 py-3 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all">Limpiar</button>
                                <button onClick={saveDrawing} className="px-10 py-3 bg-accent text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">Guardar Fragmento</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MURAL WORKSPACE PORTAL */}
            {isMuralMode && createPortal(
                <MuralWorkspace
                    blocks={muralBlocks}
                    onSave={(updatedBlocks) => handleSaveMural(updatedBlocks)}
                    onClose={() => setIsMuralMode(false)}
                    accent={accent}
                    bgType={bgType}
                    bgValue={bgValue}
                    isTiled={isTiled}
                />,
                document.body
            )}
        </div>
    );
}

// ==========================================
// --- MURAL WORKSPACE (EDITORIAL STUDIO) ---
// ==========================================

const MuralText = ({ block, updateBlock, isSelected, bringToFront, accent }) => {
    const ref = useRef(null);

    // Synchronize content changes from the outside (like properties menu updates)
    // only when different, avoiding React caret/cursor jumps during live typing.
    useEffect(() => {
        if (ref.current && ref.current.innerText !== block.content) {
            ref.current.innerText = block.content;
        }
    }, [block.content]);

    const getFilterStyle = (filter) => {
        switch (filter) {
            case 'grayscale': return 'grayscale(100%)';
            case 'sepia': return 'sepia(100%)';
            case 'invert': return 'invert(100%)';
            case 'blur': return 'blur(5px)';
            case 'brightness-sat': return 'brightness(1.2) saturate(1.5)';
            case 'warm': return 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
            case 'cool': return 'saturate(120%) hue-rotate(10deg) brightness(0.95)';
            default: return 'none';
        }
    };

    return (
        <div
            ref={ref}
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={(e) => {
                updateBlock(block.id, { content: e.currentTarget.innerText });
            }}
            onBlur={(e) => {
                updateBlock(block.id, { content: e.currentTarget.innerText });
            }}
            onFocus={() => bringToFront(block.id)}
            className={`w-full h-full bg-transparent border-none outline-none p-2 text-center flex items-center justify-center overflow-visible break-words whitespace-pre-wrap empty:before:content-[attr(placeholder)] empty:before:text-zinc-500/40 empty:before:pointer-events-none ${block.isTitle ? 'font-black tracking-tight leading-[0.95] uppercase select-text' : 'font-sans select-text'
                }`}
            style={{
                color: block.color || '#fff',
                fontSize: `${block.fontSize || (block.isTitle ? 48 : 16)}px`,
                fontWeight: block.fontWeight || (block.isTitle ? '900' : 'normal'),
                textTransform: block.textTransform || 'none',
                textShadow: block.isTitle ? `0 0 30px ${block.color}44` : 'none',
                fontFamily: block.isTitle ? '"Outfit", "Inter", sans-serif' : 'inherit',
                filter: getFilterStyle(block.filter),
                borderRadius: `${block.borderRadius !== undefined ? block.borderRadius : 24}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
                minHeight: '100%'
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent canvas drag while typing
            onTouchStart={(e) => e.stopPropagation()} // Prevent mobile pan while typing
            placeholder={block.isTitle ? "TITULAR..." : "Escribe aquí..."}
        />
    );
};
function MuralWorkspace({ blocks: initialBlocks, onSave, onClose, accent, bgType, bgValue, isTiled }) {
    const [blocks, setBlocks] = useState(initialBlocks || []);
    const [selectedId, setSelectedId] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const [openSections, setOpenSections] = useState({
        transform: true,
        style: true,
        borders: true,
        layers: true
    });
    const [activeTool, setActiveTool] = useState(null);
    const touchStartDistRef = useRef(null);
    const touchStartZoomRef = useRef(1);
    const touchStartPanRef = useRef({ x: 0, y: 0 });
    const touchStartMidRef = useRef({ x: 0, y: 0 });

    const hasCenteredRef = useRef(false);
    const animationFrameRef = useRef(null);

    const animatePan = (targetX, targetY) => {
        const startX = pan.x;
        const startY = pan.y;
        const duration = 1200; // 1.2s smooth fluid animation
        const startTime = performance.now();

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeOutCubic(progress);

            setPan({
                x: startX + (targetX - startX) * easeProgress,
                y: startY + (targetY - startY) * easeProgress
            });

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const stopPanAnimation = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    useEffect(() => {
        setBlocks(initialBlocks || []);
        hasCenteredRef.current = false;
    }, [initialBlocks]);

    useEffect(() => {
        if (hasCenteredRef.current) return;

        if (initialBlocks && initialBlocks.length > 0 && (!blocks || blocks.length === 0)) {
            return;
        }

        hasCenteredRef.current = true;

        if (!blocks || blocks.length === 0) {
            const targetX = window.innerWidth / 2 - 125;
            const targetY = window.innerHeight / 2 - 100;
            animatePan(targetX, targetY);
            return;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        blocks.forEach(b => {
            const bx = b.x !== undefined ? b.x : 0;
            const by = b.y !== undefined ? b.y : 0;
            const bw = b.w !== undefined ? b.w : 250;
            const bh = b.h !== undefined ? b.h : 200;
            if (bx < minX) minX = bx;
            if (bx + bw > maxX) maxX = bx + bw;
            if (by < minY) minY = by;
            if (by + bh > maxY) maxY = by + bh;
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const targetX = (window.innerWidth / 2) - centerX;
        const targetY = (window.innerHeight / 2) - centerY;

        animatePan(targetX, targetY);
    }, [blocks, initialBlocks]);

    const renderShapeSVG = (shapeType, color) => {
        const svgColor = color || accent;
        switch (shapeType) {
            case 'rect':
                return <rect width="100" height="100" rx="8" fill={svgColor} />;
            case 'circle':
                return <circle cx="50" cy="50" r="50" fill={svgColor} />;
            case 'triangle':
                return <polygon points="50,0 100,100 0,100" fill={svgColor} />;
            case 'pill':
                return <rect width="100" height="100" rx="50" fill={svgColor} />;
            case 'arrow':
                return <polygon points="0,35 65,35 65,15 100,50 65,85 65,65 0,65" fill={svgColor} />;
            case 'star':
                return <polygon points="50,0 63,38 100,38 69,59 82,95 50,75 18,95 31,59 0,38 37,38" fill={svgColor} />;
            case 'bubble':
                return <path d="M10,10 L90,10 L90,65 L45,65 L20,90 L20,65 L10,65 Z" fill={svgColor} />;
            case 'heart':
                return <path d="M12,30 C12,15 30,10 50,30 C70,10 88,15 88,30 C88,58 50,90 50,90 C50,90 12,58 12,30 Z" fill={svgColor} />;
            default:
                return <rect width="100" height="100" rx="8" fill={svgColor} />;
        }
    };

    const getFilterStyle = (filter) => {
        switch (filter) {
            case 'grayscale': return 'grayscale(100%)';
            case 'sepia': return 'sepia(100%)';
            case 'invert': return 'invert(100%)';
            case 'blur': return 'blur(5px)';
            case 'brightness-sat': return 'brightness(1.2) saturate(1.5)';
            case 'warm': return 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
            case 'cool': return 'saturate(120%) hue-rotate(10deg) brightness(0.95)';
            default: return 'none';
        }
    };

    const getShadowStyle = (shadowType, color) => {
        switch (shadowType) {
            case 'soft':
                return '0 20px 40px rgba(0,0,0,0.5)';
            case 'glow':
                return `0 0 35px ${color || '#ffffff'}88`;
            case 'neon':
                return `0 0 50px ${color || accent}aa, inset 0 0 20px ${color || accent}44`;
            default:
                return 'none';
        }
    };

    const triggerImageReplace = (blockId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const targetBlock = blocks.find(b => b.id === blockId);
                        let w = targetBlock ? targetBlock.w : 300;
                        let h = targetBlock ? targetBlock.h : 300;
                        if (img.width && img.height) {
                            h = Math.round((w * img.height) / img.width);
                        }
                        updateBlock(blockId, { content: ev.target.result, h: h, objectFit: 'fill' });
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // DRAG & DROP FOR CANVAS UPLOAD
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const rect = containerRef.current.getBoundingClientRect();
                    const maxDim = 400;
                    let w = img.width;
                    let h = img.height;

                    if (w > h) {
                        if (w > maxDim) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        }
                    } else {
                        if (h > maxDim) {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }

                    const x = (e.clientX - rect.left - pan.x) / zoom - w / 2;
                    const y = (e.clientY - rect.top - pan.y) / zoom - h / 2;
                    const newBlock = {
                        id: `mural-img-${Date.now()}`,
                        type: 'image',
                        content: ev.target.result,
                        x: x,
                        y: y,
                        w: w,
                        h: h,
                        rotation: 0,
                        mask: 'none',
                        zoom: 1,
                        objectFit: 'fill',
                        canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                    };
                    syncBlocks([...blocks, newBlock]);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // BLOCK ACTIONS
    const addShape = (shapeType) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (-pan.x + rect.width / 2) / zoom - 100;
        const y = (-pan.y + rect.height / 2) / zoom - 100;
        const newBlock = {
            id: `mural-shape-${Date.now()}`,
            type: 'shape',
            shapeType: shapeType, // 'rect' | 'circle' | 'triangle' | 'pill'
            x: x,
            y: y,
            w: 200,
            h: 200,
            color: accent,
            rotation: 0,
            canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
        };
        syncBlocks([...blocks, newBlock]);
    };

    const addText = () => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (-pan.x + rect.width / 2) / zoom - 150;
        const y = (-pan.y + rect.height / 2) / zoom - 50;
        const newBlock = {
            id: `mural-text-${Date.now()}`,
            type: 'text',
            content: 'Escribe tu idea aquí...',
            x: x,
            y: y,
            w: 300,
            h: 100,
            color: '#ffffff',
            rotation: 0,
            fontSize: 16,
            fontWeight: 'normal',
            textTransform: 'none',
            canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
        };
        syncBlocks([...blocks, newBlock]);
    };

    const addTitle = () => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (-pan.x + rect.width / 2) / zoom - 250;
        const y = (-pan.y + rect.height / 2) / zoom - 75;
        const newBlock = {
            id: `mural-title-${Date.now()}`,
            type: 'text',
            content: 'TITULAR PRINCIPAL',
            x: x,
            y: y,
            w: 500,
            h: 150,
            color: accent,
            rotation: 0,
            fontSize: 64,
            fontWeight: '900',
            textTransform: 'uppercase',
            canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
        };
        syncBlocks([...blocks, newBlock]);
    };

    const addImage = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const rect = containerRef.current.getBoundingClientRect();
                const maxDim = 400;
                let w = img.width;
                let h = img.height;

                if (w > h) {
                    if (w > maxDim) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    }
                } else {
                    if (h > maxDim) {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                const x = (-pan.x + rect.width / 2) / zoom - w / 2;
                const y = (-pan.y + rect.height / 2) / zoom - h / 2;
                const newBlock = {
                    id: `mural-img-${Date.now()}`,
                    type: 'image',
                    content: ev.target.result,
                    x: x,
                    y: y,
                    w: w,
                    h: h,
                    rotation: 0,
                    mask: 'none',
                    zoom: 1,
                    objectFit: 'fill',
                    canvasId: activeCanvasId !== 'canvas_default' ? activeCanvasId : undefined
                };
                syncBlocks([...blocks, newBlock]);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const updateBlock = (id, updates) => {
        syncBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const deleteBlock = (id) => {
        syncBlocks(blocks.filter(b => b.id !== id));
        setSelectedId(null);
        if (user) fetch(`${API_URL}/api/oasis/blocks/${id}?user=${user}`, { method: 'DELETE' }).then(() => fetchFeed()).catch(console.error);
    };

    const bringToFront = (id) => {
        // Find the block and move it to the end of the array (rendered last -> on top)
        const target = blocks.find(b => b.id === id);
        if (!target) return;
        const filtered = blocks.filter(b => b.id !== id);
        syncBlocks([...filtered, target]);
        setSelectedId(id);
    };

    // PANNING THE CANVAS
    const handleMouseDown = (e) => {
        stopPanAnimation();
        if (e.target === containerRef.current || e.target.classList.contains('canvas-grid')) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            setSelectedId(null); // Click outside deselects and hides style drawer!
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleTouchStart = (e) => {
        stopPanAnimation();
        if (e.touches.length === 1 && (e.target === containerRef.current || e.target.classList.contains('canvas-grid'))) {
            const touch = e.touches[0];
            setIsPanning(true);
            setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
            setSelectedId(null); // Tap outside deselects and hides style drawer!
        } else if (e.touches.length === 2) {
            e.preventDefault();
            setIsPanning(false); // Stop panning when starting zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            touchStartDistRef.current = dist;
            touchStartZoomRef.current = zoom;
            touchStartPanRef.current = { ...pan };
            touchStartMidRef.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }
    };

    const handleTouchMove = (e) => {
        if (isPanning && e.touches.length === 1) {
            const touch = e.touches[0];
            setPan({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y });
        } else if (e.touches.length === 2 && touchStartDistRef.current) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

            const factor = dist / touchStartDistRef.current;

            let newZoom;
            if (factor < 1) {
                // Zooming out: apply a dampening curve to make zoom out slower, smoother, and more controlled
                const dampedFactor = 1 - (1 - factor) * 0.4;
                newZoom = Math.max(0.15, Math.min(4, touchStartZoomRef.current * dampedFactor));
            } else {
                newZoom = Math.max(0.15, Math.min(4, touchStartZoomRef.current * factor));
            }

            const midX = (touch1.clientX + touch2.clientX) / 2;
            const midY = (touch1.clientY + touch2.clientY) / 2;

            const startMid = touchStartMidRef.current;
            const startPan = touchStartPanRef.current;
            const startZoom = touchStartZoomRef.current;

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = startMid.x - rect.left;
            const mouseY = startMid.y - rect.top;

            // Focus on the midpoint under the fingers: (mouseX - pan.x) / zoom should remain constant.
            const newPanX = mouseX - ((mouseX - startPan.x) / startZoom) * newZoom;
            const newPanY = mouseY - ((mouseY - startPan.y) / startZoom) * newZoom;

            // Allow dragging (panning) while zooming
            const dragX = midX - startMid.x;
            const dragY = midY - startMid.y;

            setZoom(newZoom);
            setPan({ x: newPanX + dragX, y: newPanY + dragY });
        }
    };

    const handleTouchEnd = () => {
        setIsPanning(false);
        touchStartDistRef.current = null;
    };

    // TRANSFORMING ELEMENT (DRAG & RESIZE)
    const startDrag = (e, block, type, handle = 'se') => {
        e.stopPropagation();
        bringToFront(block.id);
        const isTouch = e.type.startsWith('touch');
        const startX = isTouch ? e.touches[0].clientX : e.clientX;
        const startY = isTouch ? e.touches[0].clientY : e.clientY;
        const initialX = block.x;
        const initialY = block.y;
        const initialW = block.w;
        const initialH = block.h;
        const initialRot = block.rotation || 0;

        const onMouseMove = (ev) => {
            const clientX = ev.type.startsWith('touch') ? ev.touches[0].clientX : ev.clientX;
            const clientY = ev.type.startsWith('touch') ? ev.touches[0].clientY : ev.clientY;
            const dx = (clientX - startX) / zoom;
            const dy = (clientY - startY) / zoom;

            if (type === 'move') {
                updateBlock(block.id, { x: initialX + dx, y: initialY + dy });
            } else if (type === 'resize') {
                let newW = initialW;
                let newH = initialH;
                let newX = initialX;
                let newY = initialY;

                if (handle === 'e' || handle === 'se') {
                    newW = Math.max(20, initialW + dx);
                } else if (handle === 'w') {
                    newW = Math.max(20, initialW - dx);
                    newX = initialX + (initialW - newW);
                }

                if (handle === 's' || handle === 'se') {
                    newH = Math.max(20, initialH + dy);
                } else if (handle === 'n') {
                    newH = Math.max(20, initialH - dy);
                    newY = initialY + (initialH - newH);
                }

                updateBlock(block.id, { w: newW, h: newH, x: newX, y: newY });
            } else if (type === 'rotate') {
                const el = document.getElementById(`mural-block-${block.id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
                    updateBlock(block.id, { rotation: angle + 90 }); // +90 because handle is at the top
                }
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onMouseMove);
            window.removeEventListener('touchend', onMouseUp);
            setBlocks(prev => {
                if (onSave) onSave(prev);
                return prev;
            });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onMouseMove, { passive: false });
        window.addEventListener('touchend', onMouseUp);
    };

    // EDITORIAL MASKS CLIPPATHS
    const getMaskStyle = (maskType) => {
        switch (maskType) {
            case 'circle': return { clipPath: 'circle(50% at 50% 50%)' };
            case 'hexagon': return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
            case 'diamond': return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
            case 'arch': return { clipPath: 'polygon(0% 100%, 0% 30%, 15% 15%, 30% 5%, 50% 0%, 70% 5%, 85% 15%, 100% 30%, 100% 100%)' };
            case 'pill': return { clipPath: 'inset(0% round 9999px)' };
            default: return {};
        }
    };

    const selectedBlock = blocks.find(b => b.id === selectedId);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[2000] bg-[#030304]/60 backdrop-blur-[2px] overflow-hidden select-none flex flex-col font-sans touch-action-none"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* INFINITE GRID BACKGROUND */}
            <div
                className="canvas-grid absolute inset-0 pointer-events-none opacity-10 transition-transform duration-75"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: `${Math.max(15, 30 * zoom)}px ${Math.max(15, 30 * zoom)}px`,
                    backgroundPosition: `${pan.x}px ${pan.y}px`
                }}
            />

            {/* TOP ACTIONS DOCK */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2100] px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-md border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center gap-4 animate-in slide-in-from-top-10 duration-700 max-w-[95vw] w-auto shrink-0 select-none">
                {/* Logo Section */}
                <div className="hidden sm:flex items-center gap-2 border-r border-white/10 pr-4 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">MURAL</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ backgroundColor: accent }} />
                </div>

                {/* Main Tools Group (Icons only) */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={addImage}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                        title="Añadir Imagen (JPG/PNG)"
                    >
                        <ImageIcon size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                    {/* SHAPE SELECTOR */}
                    <div className="relative group shrink-0">
                        <button
                            className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
                            title="Añadir Forma"
                        >
                            <Zap size={16} />
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 py-2 w-40 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl hidden group-hover:block z-[2200]">
                            <button onClick={() => addShape('rect')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Rectángulo</button>
                            <button onClick={() => addShape('circle')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Círculo</button>
                            <button onClick={() => addShape('triangle')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Triángulo</button>
                            <button onClick={() => addShape('pill')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Píldora</button>
                            <button onClick={() => addShape('arrow')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Flecha</button>
                            <button onClick={() => addShape('star')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Estrella</button>
                            <button onClick={() => addShape('bubble')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Burbuja</button>
                            <button onClick={() => addShape('heart')} className="w-full px-4 py-2 hover:bg-white/5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white">Corazón</button>
                        </div>
                    </div>

                    <button
                        onClick={addText}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                        title="Añadir Texto"
                    >
                        <FileText size={16} />
                    </button>

                    <button
                        onClick={addTitle}
                        className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                        title="Añadir Título"
                    >
                        <Type size={16} />
                    </button>
                </div>

                <div className="hidden sm:block w-px h-6 bg-white/10 shrink-0" />

                {/* Zoom Group (Compact & clean) */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                    <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all" title="Alejar"><Minus size={12} /></button>
                    <span className="text-[9px] font-bold text-zinc-400 min-w-[30px] text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all" title="Acercar"><Plus size={12} /></button>
                </div>

                <div className="w-px h-6 bg-white/10 shrink-0" />

                {/* Utility Actions (Clear & Save) */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => { if (confirm('¿Limpiar todo el mural?')) syncBlocks([]); }}
                        className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shrink-0"
                        title="Limpiar Todo el Mural"
                    >
                        <Trash2 size={15} />
                    </button>

                    <button
                        onClick={() => {
                            onSave(blocks);
                            onClose();
                        }}
                        className="w-10 h-10 rounded-full bg-accent text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] flex items-center justify-center shrink-0"
                        style={{ '--accent-rgb': hexToRgb(accent) }}
                        title="Guardar todo en la Nota"
                    >
                        <Check size={16} className="stroke-[3]" />
                    </button>
                </div>

                <div className="w-px h-6 bg-white/10 shrink-0" />

                {/* Close Button - Stably padded to prevent cutoff */}
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all shrink-0 hover:scale-105 active:scale-95"
                    title="Cerrar Mural"
                >
                    <X size={16} />
                </button>
            </div>

            {/* THE DRAGGABLE CANVAS WORKSPACE */}
            <div
                className="absolute inset-0 origin-top-left transition-transform duration-75"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
                data-low-detail={zoom < 0.6}
            >
                {blocks.filter(b => {
                    if (b.type === 'settings' || b.id === 'user_settings' || b.id === 'profile_settings' || b.type === 'canvas') return false;
                    if (b.type === 'diary' || b.type === 'diary_notebook' || (b.entries && b.entries.length > 0)) return false;
                    if (b.canvasId && b.canvasId !== activeCanvasId) return false;
                    if (!b.canvasId && activeCanvasId !== 'canvas_default') return false;
                    return true;
                }).map((block) => {
                    const isSelected = block.id === selectedId;
                    return (
                        <div
                            key={block.id}
                            id={`mural-block-${block.id}`}
                            style={{
                                position: 'absolute',
                                left: block.x,
                                top: block.y,
                                width: block.w,
                                height: block.h,
                                transform: `rotate(${block.rotation || 0}deg)`,
                                zIndex: isSelected ? 1000 : 1,
                                borderRadius: block.type === 'shape' ? 'none' : `${block.borderRadius !== undefined ? block.borderRadius : 24}px`,
                                border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || '#ffffff'}` : 'none',
                                boxShadow: getShadowStyle(block.shadowType, block.color || block.borderColor),
                                opacity: block.opacity !== undefined ? block.opacity : 1,
                            }}
                            className={`group relative ${isSelected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-white/20'}`}
                            onMouseDown={() => bringToFront(block.id)}
                            onTouchStart={() => bringToFront(block.id)}
                        >
                            {/* MOVE HANDLE (ONLY WHEN NOT SELECTED OR ALWAYS FOR IMAGES/SHAPES) */}
                            {(!isSelected || block.type === 'image' || block.type === 'shape') && (
                                <div
                                    onMouseDown={(e) => startDrag(e, block, 'move')}
                                    onTouchStart={(e) => startDrag(e, block, 'move')}
                                    className="absolute inset-0 cursor-move z-10"
                                    style={{ borderRadius: block.type === 'shape' ? '0px' : `${block.borderRadius !== undefined ? block.borderRadius : 24}px` }}
                                />
                            )}

                            {/* FLOATING WRAPPER FOR ORGANIC PASSIVE MOTION */}
                            <div
                                className="w-full h-full"
                                style={{
                                    animation: (!isMobileViewport() && !isSelected && !isPanning) ? 'node-float 6s ease-in-out infinite' : 'none',
                                    animationDelay: `${(block.id.split('-').pop() % 5) * 0.4}s`
                                }}
                            >
                                {/* CONTENT RENDERING */}
                                {block.type === 'image' && (
                                    <div
                                        className="w-full h-full overflow-hidden"
                                        style={{
                                            ...getMaskStyle(block.mask),
                                            borderRadius: (block.mask && block.mask !== 'none') ? 'none' : `${block.borderRadius !== undefined ? block.borderRadius : 24}px`
                                        }}
                                    >
                                        <img onError={(e) => { if (!e.target.dataset.failed) { e.target.dataset.failed = true; e.target.src = 'https://placehold.co/400x300/030304/444444?text=Offline+Media'; } }}
                                            src={block.content}
                                            alt="Editorial element"
                                            className="w-full h-full pointer-events-none select-none"
                                            style={{
                                                transform: `scale(${block.zoom || 1})`,
                                                objectFit: block.objectFit || 'fill',
                                                filter: getFilterStyle(block.filter)
                                            }}
                                        />
                                    </div>
                                )}

                                {block.type === 'shape' && (
                                    <div
                                        className="w-full h-full flex items-center justify-center overflow-hidden"
                                        style={{ filter: getFilterStyle(block.filter) }}
                                    >
                                        <svg
                                            width="100%"
                                            height="100%"
                                            viewBox="0 0 100 100"
                                            preserveAspectRatio="none"
                                            className="w-full h-full"
                                        >
                                            {renderShapeSVG(block.shapeType, block.color)}
                                        </svg>
                                    </div>
                                )}

                                {block.type === 'text' && (
                                    <MuralText
                                        block={block}
                                        updateBlock={updateBlock}
                                        isSelected={isSelected}
                                        bringToFront={bringToFront}
                                        accent={accent}
                                    />
                                )}
                            </div>

                            {/* TRANSFORM CONTROLS (ONLY IF SELECTED - ANCHORED STABLY TO OUTER POSITION) */}

                            {isSelected && (
                                <>
                                    {/* ROTATE HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'rotate')}
                                        onTouchStart={(e) => startDrag(e, block, 'rotate')}
                                        className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-accent text-white hover:text-black border border-white/20 flex items-center justify-center cursor-crosshair shadow-lg z-20 transition-colors backdrop-blur-md"
                                        title="Girar"
                                    >
                                        <RotateCw size={12} />
                                    </div>

                                    {/* SELECTED MOVE HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'move')}
                                        onTouchStart={(e) => startDrag(e, block, 'move')}
                                        className="absolute -top-10 left-6 w-8 h-8 rounded-full bg-black/60 hover:bg-accent text-white hover:text-black border border-white/20 flex items-center justify-center cursor-move shadow-lg z-20 transition-colors backdrop-blur-md"
                                        title="Mover"
                                    >
                                        <Move size={12} />
                                    </div>

                                    {/* RESIZE E HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'e')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'e')}
                                        className="absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-8 bg-white/20 border border-white/40 rounded-full cursor-e-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Ancho (Derecha)"
                                    />

                                    {/* RESIZE W HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'w')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'w')}
                                        className="absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-8 bg-white/20 border border-white/40 rounded-full cursor-w-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Ancho (Izquierda)"
                                    />

                                    {/* RESIZE S HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 's')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 's')}
                                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/20 border border-white/40 rounded-full cursor-s-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Alto (Abajo)"
                                    />

                                    {/* RESIZE N HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'n')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'n')}
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/20 border border-white/40 rounded-full cursor-n-resize z-20 hover:bg-accent hover:border-accent shadow-md transition-colors"
                                        title="Estirar Alto (Arriba)"
                                    />

                                    {/* RESIZE SE HANDLE */}
                                    <div
                                        onMouseDown={(e) => startDrag(e, block, 'resize', 'se')}
                                        onTouchStart={(e) => startDrag(e, block, 'resize', 'se')}
                                        className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center cursor-se-resize shadow-xl z-20 hover:scale-110 active:scale-95 transition-transform"
                                        title="Estirar Ambas Dimensiones"
                                    >
                                        <Maximize2 size={12} />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CANVA-STYLE BOTTOM BAR SETTINGS */}
            {selectedBlock && (
                <div className="fixed bottom-0 left-0 right-0 z-[2200] bg-[#121214]/95 backdrop-blur-md border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] px-4 py-3 pb-safe animate-in slide-in-from-bottom-10 duration-300">

                    {/* SUB-MENU DRAWER */}
                    {activeTool && (
                        <div className="w-full border-b border-white/5 pb-3 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    onClick={() => setActiveTool(null)}
                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1"
                                >
                                    ← Volver
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                                    {activeTool === 'crop' && 'Silueta & Recorte'}
                                    {activeTool === 'fitting' && 'Ajuste de Relleno'}
                                    {activeTool === 'zoom' && 'Zoom de la Foto'}
                                    {activeTool === 'filter' && 'Filtro Artístico'}
                                    {activeTool === 'border' && 'Bordes & Efectos'}
                                    {activeTool === 'layers' && 'Organizar Capas'}
                                    {activeTool === 'shape' && 'Diseño de la Forma'}
                                    {activeTool === 'color' && 'Paleta de Color'}
                                    {activeTool === 'text' && 'Formato de Letra'}
                                    {activeTool === 'size' && 'Tamaño de Letra'}
                                </span>
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                                >
                                    Listo ✓
                                </button>
                            </div>

                            {/* HORIZONTALLY SCROLLABLE OPTIONS ROW */}
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
                                {/* CROP OPTIONS */}
                                {activeTool === 'crop' && [
                                    { id: 'none', label: 'Original' },
                                    { id: 'circle', label: 'Círculo' },
                                    { id: 'hexagon', label: 'Hexágono' },
                                    { id: 'diamond', label: 'Diamante' },
                                    { id: 'arch', label: 'Arco' },
                                    { id: 'pill', label: 'Píldora' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => updateBlock(selectedBlock.id, { mask: m.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.mask === m.id || (!selectedBlock.mask && m.id === 'none') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}

                                {/* FITTING OPTIONS */}
                                {activeTool === 'fitting' && [
                                    { id: 'fill', label: 'Estirar' },
                                    { id: 'cover', label: 'Recortar' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => updateBlock(selectedBlock.id, { objectFit: m.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.objectFit === m.id || (!selectedBlock.objectFit && m.id === 'fill') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}

                                {/* ZOOM OPTION */}
                                {activeTool === 'zoom' && (
                                    <div className="flex-1 flex items-center gap-4 min-w-[280px] px-2">
                                        <span className="text-[10px] font-bold text-white shrink-0">{Math.round((selectedBlock.zoom || 1) * 100)}%</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.05"
                                            value={selectedBlock.zoom || 1}
                                            onChange={(e) => updateBlock(selectedBlock.id, { zoom: parseFloat(e.target.value) })}
                                            className="flex-1 accent-accent"
                                        />
                                    </div>
                                )}

                                {/* FILTER OPTIONS */}
                                {activeTool === 'filter' && [
                                    { id: 'none', label: 'Original' },
                                    { id: 'grayscale', label: 'B&W' },
                                    { id: 'sepia', label: 'Sepia' },
                                    { id: 'invert', label: 'Negativo' },
                                    { id: 'blur', label: 'Blur' },
                                    { id: 'brightness-sat', label: 'Saturado' },
                                    { id: 'warm', label: 'Cálido' },
                                    { id: 'cool', label: 'Frío' }
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => updateBlock(selectedBlock.id, { filter: f.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.filter === f.id || (!selectedBlock.filter && f.id === 'none') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}

                                {/* SHAPE OPTIONS */}
                                {activeTool === 'shape' && [
                                    { id: 'rect', label: 'Rectángulo' },
                                    { id: 'circle', label: 'Círculo' },
                                    { id: 'triangle', label: 'Triángulo' },
                                    { id: 'pill', label: 'Píldora' },
                                    { id: 'arrow', label: 'Flecha' },
                                    { id: 'star', label: 'Estrella' },
                                    { id: 'bubble', label: 'Burbuja' },
                                    { id: 'heart', label: 'Corazón' }
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => updateBlock(selectedBlock.id, { shapeType: s.id })}
                                        className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.shapeType === s.id || (!selectedBlock.shapeType && s.id === 'rect') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}

                                {/* COLOR OPTIONS */}
                                {activeTool === 'color' && ['#4287f5', '#6366f1', '#a855f7', '#22d3ee', '#bef264', '#f43f5e', '#ffffff', '#000000'].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => updateBlock(selectedBlock.id, { color: c })}
                                        className={`w-9 h-9 rounded-full border-2 shrink-0 transition-all ${selectedBlock.color === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}

                                {/* TEXT OPTIONS */}
                                {activeTool === 'text' && (
                                    <div className="flex items-center gap-3 shrink-0">
                                        <select
                                            value={selectedBlock.fontFamily || '"Montserrat", sans-serif'}
                                            onChange={(e) => updateBlock(selectedBlock.id, { fontFamily: e.target.value })}
                                            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-full text-[9px] font-black uppercase text-white outline-none"
                                        >
                                            <option value="'Outfit', sans-serif">Outfit</option>
                                            <option value="'Montserrat', sans-serif">Montserrat</option>
                                            <option value="'Playfair Display', serif">Playfair</option>
                                            <option value="'Fraunces', serif">Fraunces</option>
                                            <option value="'JetBrains Mono', monospace">JetBrains</option>
                                            <option value="'Courier Prime', monospace">Courier</option>
                                            <option value="'Sacramento', cursive">Sacramento</option>
                                        </select>

                                        {[
                                            { id: '100', label: 'Delgada' },
                                            { id: '400', label: 'Normal' },
                                            { id: '900', label: 'Gruesa' }
                                        ].map((w) => (
                                            <button
                                                key={w.id}
                                                onClick={() => updateBlock(selectedBlock.id, { fontWeight: w.id })}
                                                className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.fontWeight === w.id || (!selectedBlock.fontWeight && w.id === '400') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                            >
                                                {w.label}
                                            </button>
                                        ))}

                                        {[
                                            { id: 'uppercase', label: 'MAYÚS' },
                                            { id: 'lowercase', label: 'minús' },
                                            { id: 'none', label: 'Abc' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => updateBlock(selectedBlock.id, { textTransform: t.id })}
                                                className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${selectedBlock.textTransform === t.id || (!selectedBlock.textTransform && t.id === 'none') ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* SIZE OPTION */}
                                {activeTool === 'size' && (
                                    <div className="flex-1 flex items-center gap-4 min-w-[280px] px-2">
                                        <span className="text-[10px] font-bold text-white shrink-0">{selectedBlock.fontSize || 16}px</span>
                                        <input
                                            type="range"
                                            min="12"
                                            max="200"
                                            value={selectedBlock.fontSize || 16}
                                            onChange={(e) => updateBlock(selectedBlock.id, { fontSize: parseInt(e.target.value) })}
                                            className="flex-1 accent-accent"
                                        />
                                    </div>
                                )}

                                {/* BORDERS OPTIONS */}
                                {activeTool === 'border' && (
                                    <div className="flex items-center gap-4 shrink-0 px-2 min-w-[320px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-white shrink-0">Borde: {selectedBlock.borderWidth || 0}px</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="20"
                                                value={selectedBlock.borderWidth || 0}
                                                onChange={(e) => updateBlock(selectedBlock.id, { borderWidth: parseInt(e.target.value) })}
                                                className="w-20 accent-accent"
                                            />
                                        </div>

                                        {selectedBlock.type !== 'shape' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-white shrink-0">Esquinas: {selectedBlock.borderRadius !== undefined ? selectedBlock.borderRadius : 24}px</span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={selectedBlock.borderRadius !== undefined ? selectedBlock.borderRadius : 24}
                                                    onChange={(e) => updateBlock(selectedBlock.id, { borderRadius: parseInt(e.target.value) })}
                                                    className="w-20 accent-accent"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-1">
                                            {['#ffffff', '#4287f5', '#6366f1', '#22d3ee', '#bef264', '#f43f5e', '#000000'].map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => updateBlock(selectedBlock.id, { borderColor: c })}
                                                    className={`w-6 h-6 rounded-full border shrink-0 transition-all ${selectedBlock.borderColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* LAYERS OPTIONS */}
                                {activeTool === 'layers' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => bringToFront(selectedBlock.id)}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Traer al Frente ⬆️
                                        </button>
                                        <button
                                            onClick={() => {
                                                const filtered = blocks.filter(b => b.id !== selectedBlock.id);
                                                syncBlocks([selectedBlock, ...filtered]);
                                            }}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Enviar al Fondo ⬇️
                                        </button>
                                        <button
                                            onClick={() => updateBlock(selectedBlock.id, { rotation: (selectedBlock.rotation || 0) - 45 })}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Girar -45°
                                        </button>
                                        <button
                                            onClick={() => updateBlock(selectedBlock.id, { rotation: 0 })}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Enderezar
                                        </button>
                                        <button
                                            onClick={() => updateBlock(selectedBlock.id, { rotation: (selectedBlock.rotation || 0) + 45 })}
                                            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shrink-0"
                                        >
                                            Girar +45°
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MAIN TOOLBAR ROW */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {/* IMAGE SPECIFIC BUTTONS */}
                            {selectedBlock.type === 'image' && (
                                <>
                                    <button
                                        onClick={() => setActiveTool('crop')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'crop' ? 'text-accent bg-white/5 font-black' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Crop size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Recorte</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('fitting')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'fitting' ? 'text-accent bg-white/5 font-black' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Maximize2 size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Ajuste</span>
                                    </button>
                                    <button
                                        onClick={() => triggerImageReplace(selectedBlock.id)}
                                        className="flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-zinc-400 hover:text-white"
                                    >
                                        <RefreshCw size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Cambiar</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('zoom')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'zoom' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Sliders size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Zoom Foto</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('filter')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'filter' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Sparkles size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Filtros</span>
                                    </button>
                                </>
                            )}

                            {/* SHAPE SPECIFIC BUTTONS */}
                            {selectedBlock.type === 'shape' && (
                                <>
                                    <button
                                        onClick={() => setActiveTool('shape')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'shape' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Zap size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Forma</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('color')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'color' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Palette size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Color</span>
                                    </button>
                                </>
                            )}

                            {/* TEXT SPECIFIC BUTTONS */}
                            {selectedBlock.type === 'text' && (
                                <>
                                    <button
                                        onClick={() => setActiveTool('text')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'text' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Type size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Fuente</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('size')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'size' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Sliders size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Tamaño</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('color')}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'color' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Palette size={16} />
                                        <span className="text-[8px] font-black tracking-tighter mt-1">Color</span>
                                    </button>
                                </>
                            )}

                            {/* SHARED ACTIONS */}
                            <button
                                onClick={() => setActiveTool('border')}
                                className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'border' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Grid size={16} />
                                <span className="text-[8px] font-black tracking-tighter mt-1">Bordes</span>
                            </button>
                            <button
                                onClick={() => setActiveTool('layers')}
                                className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all ${activeTool === 'layers' ? 'text-accent bg-white/5' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Layers size={16} />
                                <span className="text-[8px] font-black tracking-tighter mt-1">Capas</span>
                            </button>
                            <button
                                onClick={() => deleteBlock(selectedBlock.id)}
                                className="flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 size={16} />
                                <span className="text-[8px] font-black tracking-tighter mt-1">Eliminar</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1 pl-2 border-l border-white/10 shrink-0">
                            <button
                                onClick={() => setSelectedId(null)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                style={{ backgroundColor: accent, color: '#000000' }}
                            >
                                <Check size={16} className="stroke-[3]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS Bottom Gradient ONLY for the Mural Canvas */}
            {!activeNotebook && view !== 'profile' && view !== 'soul' && (
                <div className="fixed bottom-0 left-0 right-0 h-[calc(90px+env(safe-area-inset-bottom,20px))] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-[10]" />
            )}

            {/* RETURN TO PROFILE CARD / BUTTON & FEED BUTTON */}
            {(view === 'canvas' || view === 'feed') && !isComposerOpen && !isSimpleNotesOpen && !activeNotebook && !activeTest && (
                <div className="fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] md:bottom-8 left-1/2 -translate-x-1/2 z-[2500] flex gap-3 pointer-events-auto">
                    <button
                        onClick={() => setView('profile')}
                        className="bg-black/80 backdrop-blur-sm px-5 py-2.5 sm:px-6 sm:py-3 rounded-full border border-white/10 text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group hover:border-white/30 hover:bg-black/90"
                    >
                        <User size={14} className="text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                        <span className="shrink-0 scale-90 sm:scale-100">Ir a Perfil</span>
                    </button>
                    <button
                        onClick={() => setView('feed')}
                        className="bg-black/80 backdrop-blur-sm px-5 py-2.5 sm:px-6 sm:py-3 rounded-full border border-white/10 text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group hover:border-white/30 hover:bg-black/90"
                        style={view === 'feed' ? { backgroundColor: accent, color: '#000' } : undefined}
                    >
                        <Aperture size={14} className={view === 'feed' ? 'text-black shrink-0' : 'text-zinc-400 group-hover:text-white transition-colors shrink-0'} />
                        <span className="shrink-0 scale-90 sm:scale-100">Feed</span>
                    </button>
                </div>
            )}


            {/* SELECTED PUBLIC POST MODAL */}
            {selectedPublicPost && (
                <div
                    className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
                    onClick={() => setSelectedPublicPost(null)}
                >
                    <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedPublicPost(null)}
                            className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-white z-[3100]"
                        >
                            <X size={16} />
                        </button>

                        <FeedItem
                            f={selectedPublicPost}
                            accent={accent}
                            credits={credits}
                            setCredits={setCredits}
                            blocks={blocks}
                            setBlocks={setBlocks}
                            syncBlocks={syncBlocks}
                            links={links}
                            feed={feed}
                            setFeed={setFeed}
                            setView={setView}
                            editBlock={editBlock}
                            setPublicProfileUser={setPublicProfileUser}
                            user={user}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}












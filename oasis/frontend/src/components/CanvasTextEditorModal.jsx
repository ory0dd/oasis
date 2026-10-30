import React, { useState } from 'react';
import { 
    X, Check, Type, AlignLeft, AlignCenter, AlignRight, 
    Maximize2, Sliders, Palette, Sparkles, MoveHorizontal
} from 'lucide-react';

export const FONT_PRESETS = [
    { id: 'outfit', label: 'Outfit', category: 'Sans Moderna', css: '"Outfit", system-ui, -apple-system, sans-serif' },
    { id: 'inter', label: 'Inter', category: 'Limpia / Minimal', css: '"Inter", -apple-system, sans-serif' },
    { id: 'serif', label: 'Playfair', category: 'Editorial / Serif', css: '"Playfair Display", Georgia, serif' },
    { id: 'impact', label: 'Bebas', category: 'Cartel / Impact', css: '"Bebas Neue", Impact, "Arial Black", sans-serif' },
    { id: 'cursive', label: 'Caveat', category: 'Cursiva / Libre', css: '"Caveat", "Brush Script MT", cursive' },
    { id: 'mono', label: 'Space Mono', category: 'Código / Máquina', css: '"Space Mono", "Courier New", monospace' }
];

export const COLOR_PALETTE = [
    { label: 'Blanco', value: '#ffffff' },
    { label: 'Acento', value: '#bef264' },
    { label: 'Esmeralda', value: '#10b981' },
    { label: 'Amarillo', value: '#fbbf24' },
    { label: 'Cyan', value: '#22d3ee' },
    { label: 'Rosa Coral', value: '#f43f5e' },
    { label: 'Púrpura', value: '#c084fc' },
    { label: 'Grafito', value: '#27272a' }
];

export const getFontFamilyCSS = (fontId) => {
    const found = FONT_PRESETS.find(f => f.id === fontId);
    return found ? found.css : '"Outfit", system-ui, -apple-system, sans-serif';
};

export default function CanvasTextEditorModal({ titlePrompt, onClose, accent = '#bef264' }) {
    if (!titlePrompt) return null;

    const initialBlock = titlePrompt.block || {};
    const [content, setContent] = useState(titlePrompt.defaultValue || initialBlock.content || '');
    const [fontFamily, setFontFamily] = useState(titlePrompt.fontFamily || initialBlock.fontFamily || 'outfit');
    const [fontSize, setFontSize] = useState(titlePrompt.fontSize || initialBlock.fontSize || 64);
    const [fontWeight, setFontWeight] = useState(titlePrompt.fontWeight || initialBlock.fontWeight || '800');
    const [color, setColor] = useState(titlePrompt.color || initialBlock.color || '#ffffff');
    const [hasStroke, setHasStroke] = useState(
        titlePrompt.hasStroke !== undefined ? titlePrompt.hasStroke : (initialBlock.hasStroke !== undefined ? initialBlock.hasStroke : true)
    );
    const [strokeWidth, setStrokeWidth] = useState(
        titlePrompt.strokeWidth !== undefined ? titlePrompt.strokeWidth : (initialBlock.strokeWidth !== undefined ? initialBlock.strokeWidth : 1.8)
    );
    const [strokeColor, setStrokeColor] = useState(titlePrompt.strokeColor || initialBlock.strokeColor || '#000000');
    const [hasShadow, setHasShadow] = useState(
        titlePrompt.hasShadow !== undefined ? titlePrompt.hasShadow : (initialBlock.hasShadow !== undefined ? initialBlock.hasShadow : true)
    );
    const [lineHeight, setLineHeight] = useState(
        titlePrompt.lineHeight !== undefined ? titlePrompt.lineHeight : (initialBlock.lineHeight !== undefined ? initialBlock.lineHeight : 1.1)
    );
    const [textAlign, setTextAlign] = useState(titlePrompt.textAlign || initialBlock.textAlign || 'center');
    const [width, setWidth] = useState(titlePrompt.width !== undefined ? titlePrompt.width : (initialBlock.width || 550));
    const [isSingleLine, setIsSingleLine] = useState(
        titlePrompt.isSingleLine !== undefined ? titlePrompt.isSingleLine : (initialBlock.isSingleLine || false)
    );

    const handleConfirm = () => {
        if (!content || !content.trim()) return;
        const result = {
            content: content.trim(),
            fontFamily,
            fontSize: Number(fontSize),
            fontWeight,
            color,
            hasStroke,
            strokeWidth: Number(strokeWidth),
            strokeColor,
            hasShadow,
            lineHeight: Number(lineHeight),
            textAlign,
            width: isSingleLine ? 'auto' : Number(width),
            isSingleLine
        };
        titlePrompt.onConfirm(result);
        onClose();
    };

    const currentFontCSS = getFontFamilyCSS(fontFamily);

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md px-3 sm:px-4 py-4 overflow-y-auto"
            onClick={onClose}
        >
            <div 
                className="bg-[#121215] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-900/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                            <Type size={16} />
                        </div>
                        <div>
                            <h3 className="text-white text-base font-black uppercase tracking-wider">
                                {titlePrompt.defaultValue ? 'Editar Estilo y Texto' : 'Añadir Nuevo Texto'}
                            </h3>
                            <p className="text-[11px] text-zinc-400">Personaliza tipografía, trazo, interlineado y estirado</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* MODAL BODY (SCROLLABLE) */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    
                    {/* TEXTAREA INPUT */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Texto del Bloque</label>
                            <span className="text-[10px] text-zinc-500 font-mono">Ctrl + Enter para guardar</span>
                        </div>
                        <textarea
                            autoFocus
                            rows={3}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Escribe el texto aquí... Puedes usar saltos de línea"
                            className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white text-base placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors resize-none leading-relaxed"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleConfirm();
                                }
                                if (e.key === 'Escape') onClose();
                            }}
                        />
                    </div>

                    {/* LIVE PREVIEW CONTAINER */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
                            Vista Previa en Vivo
                        </label>
                        <div className="w-full min-h-[140px] max-h-[220px] bg-[#09090b] border border-white/10 rounded-2xl p-6 flex items-center justify-center overflow-auto relative shadow-inner bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
                            <div
                                style={{
                                    fontFamily: currentFontCSS,
                                    fontSize: `${Math.min(fontSize, 56)}px`,
                                    fontWeight: fontWeight || '800',
                                    color: color,
                                    WebkitTextFillColor: color,
                                    paintOrder: 'stroke fill',
                                    WebkitTextStroke: hasStroke && strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : '0px transparent',
                                    textShadow: hasStroke && hasShadow && strokeWidth > 0
                                        ? `0px 2px 0px ${strokeColor}, 0px 4px 0px ${strokeColor}, 2px 4px 0px ${strokeColor}, -2px 4px 0px ${strokeColor}, 3px 3px 0px ${strokeColor}, -3px 3px 0px ${strokeColor}, 0px 10px 25px rgba(0,0,0,0.6)`
                                        : (hasShadow ? '0px 8px 20px rgba(0,0,0,0.6)' : 'none'),
                                    lineHeight: lineHeight,
                                    textAlign: textAlign,
                                    width: isSingleLine ? 'max-content' : (width ? `${Math.min(width, 520)}px` : 'auto'),
                                    maxWidth: isSingleLine ? 'none' : '100%',
                                    whiteSpace: isSingleLine ? 'nowrap' : 'pre-wrap',
                                    wordBreak: 'break-word',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {content || 'Texto de ejemplo'}
                            </div>
                        </div>
                    </div>

                    {/* TIPOGRAFIA (FONT FAMILY) */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tipo de Texto (Fuente)</label>
                            <span className="text-xs text-accent font-medium">
                                {FONT_PRESETS.find(f => f.id === fontFamily)?.category || 'Personalizada'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {FONT_PRESETS.map((font) => (
                                <button
                                    key={font.id}
                                    type="button"
                                    onClick={() => setFontFamily(font.id)}
                                    className={`px-3 py-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                        fontFamily === font.id
                                            ? 'bg-accent/15 border-accent text-white shadow-[0_0_15px_rgba(190,242,100,0.15)]'
                                            : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <span className="text-sm font-bold truncate" style={{ fontFamily: font.css }}>
                                        {font.label}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">{font.category}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* GROSOR DE TEXTO (FONT WEIGHT - NORMAL / NEGRITA) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Grosor del Texto</label>
                            <span className="text-xs text-accent font-medium">
                                {fontWeight === '400' ? 'Sin Negrita (Normal)' : (fontWeight === '600' ? 'Seminegrita' : 'Negrita (Bold)')}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Sin Negrita (Normal)', val: '400' },
                                { label: 'Seminegrita', val: '600' },
                                { label: 'Negrita (Bold)', val: '800' }
                            ].map((wPreset) => (
                                <button
                                    key={wPreset.val}
                                    type="button"
                                    onClick={() => {
                                        setFontWeight(wPreset.val);
                                        if (wPreset.val === '400') {
                                            setHasStroke(false);
                                        } else if (wPreset.val === '800') {
                                            setHasStroke(true);
                                        }
                                    }}
                                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                        fontWeight === wPreset.val
                                            ? 'bg-accent/20 border-accent text-white shadow-sm'
                                            : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className={`text-xs block ${wPreset.val === '400' ? 'font-normal' : (wPreset.val === '600' ? 'font-semibold' : 'font-black')}`}>
                                        {wPreset.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TRAZO Y SOMBRA (STROKE & SHADOW) */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Trazo (Borde de Letras)</span>
                            <button
                                type="button"
                                onClick={() => setHasStroke(!hasStroke)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                    hasStroke 
                                        ? 'bg-accent text-black font-black' 
                                        : 'bg-white/10 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {hasStroke ? 'ACTIVADO' : 'DESACTIVADO'}
                            </button>
                        </div>

                        {hasStroke && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                {/* GROSOR DE TRAZO */}
                                <div>
                                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
                                        <span>Grosor del Trazo</span>
                                        <span className="font-mono text-white">{strokeWidth}px</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'Fino', val: 1.2 }, { label: 'Medio', val: 1.8 }, { label: 'Grueso', val: 2.8 }
                                        ].map(preset => (
                                            <button
                                                key={preset.val}
                                                type="button"
                                                onClick={() => setStrokeWidth(preset.val)}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                    strokeWidth === preset.val 
                                                        ? 'bg-white/20 border-accent text-white' 
                                                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* COLOR DE TRAZO */}
                                <div>
                                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
                                        <span>Color del Trazo</span>
                                        <span className="font-mono text-white">{strokeColor}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {[
                                            { label: 'Negro', val: '#000000' },
                                            { label: 'Oscuro', val: '#18181b' },
                                            { label: 'Blanco', val: '#ffffff' },
                                            { label: 'Acento', val: accent }
                                        ].map(c => (
                                            <button
                                                key={c.val}
                                                type="button"
                                                onClick={() => setStrokeColor(c.val)}
                                                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                                                    strokeColor === c.val ? 'scale-110 border-accent ring-2 ring-accent/30' : 'border-white/20 hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: c.val }}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs text-zinc-400">Sombra de realce sobre fondo</span>
                            <button
                                type="button"
                                onClick={() => setHasShadow(!hasShadow)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                    hasShadow 
                                        ? 'bg-white/15 border-white/20 text-white' 
                                        : 'bg-black/40 border-white/5 text-zinc-500'
                                }`}
                            >
                                {hasShadow ? 'Con Sombra' : 'Sin Sombra'}
                            </button>
                        </div>
                    </div>

                    {/* INTERLINEADO Y TAMAÑO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* INTERLINEADO */}
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">Interlineado</label>
                                <span className="text-xs font-mono text-accent">{lineHeight}</span>
                            </div>
                            <input
                                type="range"
                                min="0.8"
                                max="1.8"
                                step="0.05"
                                value={lineHeight}
                                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                                className="w-full accent-accent cursor-pointer mb-2"
                            />
                            <div className="flex gap-1.5">
                                {[
                                    { label: 'Apretado', val: 0.9 },
                                    { label: 'Normal', val: 1.1 },
                                    { label: 'Amplio', val: 1.4 }
                                ].map(preset => (
                                    <button
                                        key={preset.val}
                                        type="button"
                                        onClick={() => setLineHeight(preset.val)}
                                        className={`flex-1 py-1 rounded text-[11px] font-medium border transition-colors ${
                                            Math.abs(lineHeight - preset.val) < 0.04 
                                                ? 'bg-white/20 border-accent text-white' 
                                                : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TAMAÑO DE TEXTO */}
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">Tamaño Fuente</label>
                                <span className="text-xs font-mono text-accent">{fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="28"
                                max="110"
                                step="2"
                                value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                className="w-full accent-accent cursor-pointer mb-2"
                            />
                            <div className="flex gap-1.5">
                                {[
                                    { label: 'M (48px)', val: 48 },
                                    { label: 'L (64px)', val: 64 },
                                    { label: 'XL (84px)', val: 84 }
                                ].map(preset => (
                                    <button
                                        key={preset.val}
                                        type="button"
                                        onClick={() => setFontSize(preset.val)}
                                        className={`flex-1 py-1 rounded text-[11px] font-medium border transition-colors ${
                                            fontSize === preset.val 
                                                ? 'bg-white/20 border-accent text-white' 
                                                : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ESTIRAR / ANCHO DE LA CAJA (WIDTH) */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MoveHorizontal size={14} className="text-accent" />
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                                    Estirar Ancho (Para más palabras por renglón)
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSingleLine(!isSingleLine)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                    isSingleLine 
                                        ? 'bg-accent text-black font-black' 
                                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {isSingleLine ? 'Una sola línea (Sin Salto)' : 'Ajuste con Salto'}
                            </button>
                        </div>

                        {!isSingleLine && (
                            <>
                                <div className="flex justify-between items-center text-[11px] text-zinc-400">
                                    <span>Ancho de la caja:</span>
                                    <span className="font-mono text-accent">{width}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="250"
                                    max="1300"
                                    step="25"
                                    value={width}
                                    onChange={(e) => setWidth(parseInt(e.target.value))}
                                    className="w-full accent-accent cursor-pointer"
                                />
                                <div className="flex gap-1.5">
                                    {[
                                        { label: 'Estrecho (350px)', val: 350 },
                                        { label: 'Medio (550px)', val: 550 },
                                        { label: 'Amplio (850px)', val: 850 },
                                        { label: 'Panorámico (1150px)', val: 1150 }
                                    ].map(preset => (
                                        <button
                                            key={preset.val}
                                            type="button"
                                            onClick={() => setWidth(preset.val)}
                                            className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${
                                                Math.abs(width - preset.val) < 25 
                                                    ? 'bg-white/20 border-accent text-white font-bold' 
                                                    : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* COLOR Y ALINEACION */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* COLOR */}
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 block">
                                Color del Texto
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                {COLOR_PALETTE.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                                            color.toLowerCase() === c.value.toLowerCase() 
                                                ? 'scale-125 border-accent ring-2 ring-accent/40 shadow-lg' 
                                                : 'border-white/20 hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.label}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={color.startsWith('#') && color.length === 7 ? color : '#ffffff'}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0 p-0"
                                    title="Elegir color personalizado"
                                />
                            </div>
                        </div>

                        {/* ALINEACION */}
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 block">
                                Alineación
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'left', icon: AlignLeft, label: 'Izquierda' },
                                    { id: 'center', icon: AlignCenter, label: 'Centro' },
                                    { id: 'right', icon: AlignRight, label: 'Derecha' }
                                ].map(align => {
                                    const IconComponent = align.icon;
                                    return (
                                        <button
                                            key={align.id}
                                            type="button"
                                            onClick={() => setTextAlign(align.id)}
                                            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border transition-colors ${
                                                textAlign === align.id 
                                                    ? 'bg-accent/20 border-accent text-accent' 
                                                    : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                                            }`}
                                        >
                                            <IconComponent size={14} />
                                            <span>{align.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>

                {/* MODAL FOOTER */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-zinc-900/40">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleConfirm} 
                        className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-accent/20 transition-all flex items-center gap-2"
                    >
                        <Check size={14} strokeWidth={3} />
                        <span>{titlePrompt.defaultValue ? 'Guardar Cambios' : 'Añadir al Lienzo'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

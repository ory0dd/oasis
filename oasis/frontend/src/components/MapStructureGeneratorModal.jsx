import React, { useState } from 'react';
import { X, Sparkles, Workflow, Layers, Check, Copy, ArrowRight, BookOpen, Wand2 } from 'lucide-react';

export default function MapStructureGeneratorModal({
    isOpen,
    onClose,
    onGenerateMap,
    cam = { x: 0, y: 0, scale: 1 },
    accent = '#bef264',
    apiUrl = '',
    deepseekKey = ''
}) {
    if (!isOpen) return null;

    const [mainTitle, setMainTitle] = useState('EXPLORAR SIN TENER QUE RESOLVERLO TODO');
    const [rawText, setRawText] = useState(`01. ¿Qué está pasando conmigo?
¿Qué pensamientos han ocupado más espacio en mi mente?
¿En qué momentos he sentido mayor incertidumbre?
¿Qué situaciones me han generado frustración?
¿Cuándo he sentido tranquilidad, entusiasmo o curiosidad?
¿Hay algo que estoy evitando pensar o hacer?
Reflexión: Antes de intentar cambiar algo, observa cómo estás viviendo tu semana.

02. Identificar mis bucles
¿Qué respuestas automáticas repito ante la incomodidad?
¿De qué intento protegerme cuando me cierro o me aíslo?
¿Qué precio estoy pagando por sostener este patrón?
Reflexión: Nombrar el patrón reduce su poder sobre ti.`);

    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiTopic, setAiTopic] = useState('');

    // Analizador de texto estructurado en secciones y reflexiones
    const parseSections = () => {
        const lines = rawText.split('\n');
        const sections = [];
        let currentSection = null;

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Detectar título de sección (ej. "01. ...", "1. ...", "SECCIÓN: ...")
            const isSectionHeader = /^(\d{1,2}\.?\s*|SECCIÓN\s*\d*:?\s*|PASO\s*\d*:?\s*)/i.test(trimmed);

            if (isSectionHeader) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    title: trimmed,
                    questions: [],
                    reflection: ''
                };
            } else if (trimmed.toLowerCase().startsWith('reflexión:') || trimmed.toLowerCase().startsWith('reflexion:') || trimmed.toLowerCase().startsWith('nota:') || trimmed.toLowerCase().startsWith('insight:')) {
                const reflText = trimmed.replace(/^(reflexi[oó]n:|nota:|insight:)\s*/i, '').trim();
                if (currentSection) {
                    currentSection.reflection = reflText;
                }
            } else {
                if (!currentSection) {
                    currentSection = {
                        title: '01. Concepto Inicial',
                        questions: [],
                        reflection: ''
                    };
                }
                currentSection.questions.push(trimmed);
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    };

    const handleCreateOnCanvas = () => {
        const sections = parseSections();
        if (sections.length === 0 && !mainTitle.trim()) return;

        onGenerateMap({
            mainTitle: mainTitle.trim(),
            sections
        });

        onClose();
    };

    const handleGenerateWithAi = async () => {
        if (!aiTopic.trim()) return;
        setIsAiLoading(true);

        const prompt = `Crea una cartografía existencial y cognitiva sobre el tema: "${aiTopic.trim()}".
Debe tener exactamente este formato:
TÍTULO: [Un título potente en mayúsculas, ej: EXPLORAR SIN TENER QUE RESOLVERLO TODO]

01. [Nombre del primer punto, ej: 01. ¿Qué está pasando conmigo?]
[Pregunta 1]
[Pregunta 2]
[Pregunta 3]
[Pregunta 4]
Reflexión: [Una frase reflexiva, poética o insight profundo]

02. [Nombre del segundo punto, ej: 02. Identificar mis bucles]
[Pregunta 1]
[Pregunta 2]
[Pregunta 3]
Reflexión: [Una frase reflexiva o insight]

(Entre 2 y 3 puntos en total. Sé directo, sin rodeos, tono introspectivo y humano).`;

        try {
            const endpoint = localStorage.getItem('oasis_deepseek_endpoint') || 'https://api.openai.com/v1/chat/completions';
            const model = localStorage.getItem('oasis_deepseek_model') || 'gpt-4o';
            const key = deepseekKey || localStorage.getItem('oasis_deepseek_key') || '';

            const res = await fetch(`${apiUrl}/api/oasis/config/chat-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint,
                    key,
                    payload: {
                        model,
                        messages: [{ role: 'user', content: prompt }]
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const aiResult = data?.choices?.[0]?.message?.content || '';
                if (aiResult) {
                    const titleMatch = aiResult.match(/^TÍTULO:\s*(.+)$/im);
                    if (titleMatch) {
                        setMainTitle(titleMatch[1].trim());
                        setRawText(aiResult.replace(/^TÍTULO:\s*.+\n*/im, '').trim());
                    } else {
                        setRawText(aiResult.trim());
                    }
                }
            }
        } catch (e) {
            console.error("Error generando mapa con IA:", e);
        } finally {
            setIsAiLoading(false);
        }
    };

    const previewSections = parseSections();

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md px-3 sm:px-4 py-4 overflow-y-auto"
            onClick={onClose}
        >
            <div 
                className="bg-[#101114] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                            <Workflow size={16} />
                        </div>
                        <div>
                            <h3 className="text-white text-base font-black tracking-wide">Estructurador de Mapa por Puntos</h3>
                            <p className="text-[11px] text-zinc-400">Genera títulos, tarjetas de preguntas y reflexiones conectadas automáticamente</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                    
                    {/* IA GENERATOR OPTIONAL ROW */}
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl">
                            <Wand2 size={14} className="text-accent shrink-0" />
                            <input
                                type="text"
                                value={aiTopic}
                                onChange={e => setAiTopic(e.target.value)}
                                placeholder="Tema o intención (ej: Claridad mental, Dirección de arte, Soltar control...)"
                                className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-zinc-500 font-sans"
                                onKeyDown={e => { if (e.key === 'Enter') handleGenerateWithAi(); }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleGenerateWithAi}
                            disabled={isAiLoading || !aiTopic.trim()}
                            className="px-4 py-2 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            <Sparkles size={13} className={isAiLoading ? 'animate-spin' : ''} />
                            <span>{isAiLoading ? 'Estructurando...' : 'Crear con IA'}</span>
                        </button>
                    </div>

                    {/* MAIN TITLE */}
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                            Título Principal del Mapa
                        </label>
                        <input
                            type="text"
                            value={mainTitle}
                            onChange={e => setMainTitle(e.target.value)}
                            placeholder="Ej: EXPLORAR SIN TENER QUE RESOLVERLO TODO"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>

                    {/* SECTIONS TEXTAREA */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                Puntos, Preguntas y Reflexiones
                            </label>
                            <span className="text-[10px] text-zinc-500 font-mono">Usa 01., 02. y 'Reflexión:'</span>
                        </div>
                        <textarea
                            rows={8}
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder="01. Título del punto&#10;Pregunta o texto 1&#10;Pregunta 2&#10;Reflexión: Frase o insight"
                            className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors resize-y leading-relaxed font-mono"
                        />
                    </div>

                    {/* PREVIEW DETECTED NODES */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                            <Layers size={12} className="text-accent" />
                            <span>Estructura Detectada ({previewSections.length} puntos):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                            {previewSections.map((sec, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                    <div className="text-xs font-bold text-white truncate">{sec.title}</div>
                                    <div className="text-[10px] text-zinc-400 truncate font-mono">
                                        {sec.questions.length} preguntas / líneas
                                    </div>
                                    {sec.reflection && (
                                        <div className="text-[10px] text-accent/80 italic font-serif truncate">
                                            "{sec.reflection}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/30 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleCreateOnCanvas}
                        className="px-6 py-2.5 rounded-xl bg-accent text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                        <Check size={14} />
                        <span>Generar Mapa en el Lienzo</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

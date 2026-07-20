import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Sparkles, Activity, Save } from 'lucide-react';

const ClinicalTracker = ({ user, treatmentPlan }) => {
    const [notes, setNotes] = useState(() => {
        try { return localStorage.getItem(`oasis_clinical_report_notes_${user}`) || ''; } catch { return ''; }
    });
    
    const [isGenerated, setIsGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Mock data for heatmap (12 weeks * 7 days)
    const weeks = 12;
    const daysPerWeek = 7;
    const [heatmapData, setHeatmapData] = useState([]);
    
    const [activities, setActivities] = useState(() => {
        try {
            const saved = localStorage.getItem(`oasis_tracker_activities_${user}`);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        if (activities.length > 0) {
            setIsGenerated(true);
        }
        
        const completedCount = activities.filter(a => a.done).length;
        
        // Generate empty heatmap data
        const data = new Array(weeks * daysPerWeek).fill(0);
        
        // Calculate today's index in the grid (Week 11, Day of week 0-6 where 0=Monday)
        const currentDayOfWeek = (new Date().getDay() + 6) % 7; 
        const todayIndex = (11 * 7) + currentDayOfWeek;
        
        if (completedCount > 0) {
            // Cap intensity at 4
            data[todayIndex] = Math.min(completedCount, 4);
        }
        
        setHeatmapData(data);
    }, [activities]);

    const getFormattedDate = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('es-ES', options);
    };

    const saveActivities = (newActivities) => {
        setActivities(newActivities);
        localStorage.setItem(`oasis_tracker_activities_${user}`, JSON.stringify(newActivities));
    };

    const handleNotesChange = (e) => {
        const val = e.target.value;
        setNotes(val);
        localStorage.setItem(`oasis_clinical_report_notes_${user}`, val);
    };

    const handleGenerate = () => {
        if (!notes.trim() && !treatmentPlan?.objetivos_especificos) return;
        setIsGenerating(true);
        
        setTimeout(() => {
            // Extract from treatment plan or use mock
            let extractedTasks = [];
            
            if (treatmentPlan && treatmentPlan.specificObjectives) {
                let objectivesArray = [];
                if (Array.isArray(treatmentPlan.specificObjectives)) {
                    objectivesArray = treatmentPlan.specificObjectives;
                } else if (typeof treatmentPlan.specificObjectives === 'string') {
                    try {
                        let parsed = JSON.parse(treatmentPlan.specificObjectives);
                        if (Array.isArray(parsed)) objectivesArray = parsed;
                        else objectivesArray = treatmentPlan.specificObjectives.split('\n').filter(s => s.trim().length > 0);
                    } catch (e) {
                        objectivesArray = treatmentPlan.specificObjectives.split('\n').filter(s => s.trim().length > 0);
                    }
                }
                
                extractedTasks = objectivesArray
                    .map((obj, i) => ({
                        id: Date.now() + i,
                        text: obj.replace(/^[-*•]\s*/, '').trim(),
                        done: false,
                        category: 'Meta Clínica'
                    }))
                    .filter(t => t.text.length > 5 && !t.text.toUpperCase().includes('OBJETIVOS ESPECÍFICOS'));
            } else {
                extractedTasks = [
                    { id: 1, text: 'Realizar ejercicio de respiración 4-7-8', done: false, category: 'Regulación' },
                    { id: 2, text: 'Registrar pensamientos automáticos del día', done: false, category: 'Cognitivo' },
                    { id: 3, text: 'Exposición social gradual (15 mins)', done: false, category: 'Conductual' }
                ];
            }
            
            saveActivities(extractedTasks);
            setIsGenerating(false);
            setIsGenerated(true);
        }, 1500);
    };

    const toggleActivity = (id) => {
        const updated = activities.map(a => a.id === id ? { ...a, done: !a.done } : a);
        saveActivities(updated);
    };

    const getIntensityColor = (level) => {
        switch(level) {
            case 0: return 'bg-zinc-900 border border-white/5';
            case 1: return 'bg-emerald-950 border border-emerald-900/50';
            case 2: return 'bg-emerald-800 border border-emerald-700/50';
            case 3: return 'bg-emerald-600 border border-emerald-500/50';
            case 4: return 'bg-emerald-400 border border-emerald-300/50 shadow-[0_0_10px_rgba(52,211,153,0.5)]';
            default: return 'bg-zinc-900 border border-white/5';
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Input Section */}
            <div className="space-y-3">
                <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Escribe tus observaciones clínicas aquí. (Ej. 'El paciente necesita reducir su aislamiento social gradualmente...')"
                    className="w-full h-28 bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-y font-sans leading-relaxed custom-sidebar-scroll"
                />
                
                <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 flex items-center gap-2">
                        <Save className="w-3.5 h-3.5 opacity-50" /> Autoguardado
                    </span>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || (!notes.trim() && !treatmentPlan?.specificObjectives)}
                        className={`px-4 py-2 bg-emerald-600/20 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isGenerating ? (
                            <><div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> Procesando IA...</>
                        ) : (
                            <><Sparkles size={12} /> {isGenerated ? 'Actualizar Tracker de Actividades' : 'Generar Tracker de Actividades'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* Tracker Section (Shows after generation) */}
            {isGenerated && (
                <div className="border border-emerald-500/20 bg-emerald-950/10 rounded-2xl p-5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="text-emerald-400 w-4 h-4" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Progreso del Tratamiento</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-zinc-400 font-mono block">Últimos 3 meses</span>
                            <span className="text-[9px] text-emerald-500/80 font-mono uppercase tracking-widest mt-0.5 block">{getFormattedDate()}</span>
                        </div>
                    </div>

                    {/* GitHub Style Heatmap */}
                    <div className="flex justify-center overflow-x-auto custom-sidebar-scroll pb-2">
                        <div className="flex gap-1.5">
                            {/* Days Labels */}
                            <div className="flex flex-col justify-between text-[8px] font-mono text-zinc-500 mr-2 py-1">
                                <span>Lun</span>
                                <span>Mie</span>
                                <span>Vie</span>
                                <span>Dom</span>
                            </div>
                            
                            {/* Grid */}
                            <div className="flex gap-1.5">
                                {Array.from({ length: weeks }).map((_, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-1.5">
                                        {Array.from({ length: daysPerWeek }).map((_, dayIndex) => {
                                            const dayDataIndex = (weekIndex * daysPerWeek) + dayIndex;
                                            const intensity = heatmapData[dayDataIndex] || 0;
                                            return (
                                                <div 
                                                    key={dayIndex}
                                                    title={`Nivel de actividad: ${intensity}`}
                                                    className={`w-3.5 h-3.5 rounded-sm transition-colors duration-300 hover:ring-1 hover:ring-white/50 cursor-crosshair ${getIntensityColor(intensity)}`}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Checklists for today */}
                    <div className="pt-4 border-t border-emerald-500/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-4 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Tareas Clínicas Pendientes
                        </h4>
                        
                        <div className="space-y-2">
                            {activities.length === 0 ? (
                                <p className="text-[10px] font-mono text-zinc-500">No hay actividades generadas.</p>
                            ) : (
                                activities.map(activity => (
                                    <button
                                        key={activity.id}
                                        onClick={() => toggleActivity(activity.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                                            activity.done 
                                                ? 'bg-emerald-900/20 border-emerald-500/20' 
                                                : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 pr-4">
                                            {activity.done ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                                            )}
                                            <span className={`text-xs font-sans leading-relaxed ${activity.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                                                {activity.text}
                                            </span>
                                        </div>
                                        <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0 ${
                                            activity.done ? 'bg-emerald-500/10 text-emerald-600' : 'bg-white/5 text-zinc-500'
                                        }`}>
                                            {activity.category}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicalTracker;

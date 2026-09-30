import React, { useState, useEffect, useMemo } from 'react';
import { 
    Phone, MessageSquare, Plus, Search, X, Check, Edit2, Trash2, 
    Calendar, Clock, DollarSign, UserCheck, AlertCircle, Copy, 
    ExternalLink, Sparkles, Send, RefreshCw, ChevronDown, UserPlus,
    MessageCircle, HeartHandshake, Shield, Link as LinkIcon
} from 'lucide-react';
import { API_URL } from '../utils/api';

// Limpiador y formateador de números para WhatsApp
export const cleanPhoneForWhatsApp = (rawPhone, defaultCountryCode = '52') => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    
    // Si tiene 10 dígitos (número estándar México u otros), anteponer lada
    if (digits.length === 10) {
        digits = `${defaultCountryCode}${digits}`;
    }
    return digits;
};

export const formatDisplayPhone = (rawPhone) => {
    if (!rawPhone) return '';
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) {
        return `+52 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    if (digits.length === 10) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return rawPhone;
};

// Generador de URL de WhatsApp
export const generateWhatsAppUrl = (phone, text = '') => {
    const cleanNum = cleanPhoneForWhatsApp(phone);
    if (!cleanNum) return '';
    if (!text || !text.trim()) {
        return `https://wa.me/${cleanNum}`;
    }
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text.trim())}`;
};

const DEFAULT_TEMPLATES = [
    {
        id: 'confirm',
        title: 'Confirmar sesión',
        icon: '💬',
        desc: 'Para confirmar fecha y hora antes de la consulta',
        generate: (name, session) => 
            `Hola, ${name || 'paciente'}. Te escribo para confirmar nuestra sesión ${session ? `programada para ${session}` : 'de mañana'}. ¿Seguimos con ese horario?`
    },
    {
        id: 'reminder',
        title: 'Recordatorio amable',
        icon: '⏰',
        desc: 'Recordatorio el mismo día o 2 horas antes',
        generate: (name, session) => 
            `Hola, ${name || 'paciente'}. Recordatorio amable de nuestra sesión ${session ? `de ${session}` : 'de hoy'}. ¡Nos vemos pronto!`
    },
    {
        id: 'reschedule',
        title: 'Reagendar sesión',
        icon: '🔄',
        desc: 'Solicitud para mover horario con opciones',
        generate: (name, session) => 
            `Hola, ${name || 'paciente'}. Espero que estés muy bien. Quería consultarte si sería posible ajustar o reagendar nuestra sesión ${session ? `de ${session}` : 'programada'}. Avísame qué horarios te vendrían mejor.`
    },
    {
        id: 'followup',
        title: 'Seguimiento post-sesión',
        icon: '🌱',
        desc: 'Chequeo compasivo entre sesiones',
        generate: (name) => 
            `Hola, ${name || 'paciente'}. Paso a saludarte y saber cómo te has sentido estos días después de nuestra última sesión. Quedo atento a cómo vas.`
    },
    {
        id: 'advance_policy',
        title: 'Anticipo y Política 48h / 6h',
        icon: '💳',
        desc: 'Anticipo (48h antes) y regla: con menos de 6h no se reagenda y se cobra',
        generate: (name, session) => 
            `Hola, ${name || 'paciente'}. Te recordamos que para asegurar tu sesión ${session ? `programada para ${session}` : ''} solicitamos el anticipo con al menos 48 horas de anticipación para comenzar el diseño y preparación personalizada de tu intervención. Ten en cuenta que si requieres reagendar debes avisar con anticipación; con menos de 6 horas de antelación la sesión no puede reagendarse y se cobrará en su totalidad, ya que esa hora queda apartada. ¡Quedo atento!`
    }
];

export default function WhatsAppCRM({ 
    clinicPatients = [], 
    currentUser = 'observador1', 
    onBackToClinical = null 
}) {
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [templateModalPatient, setTemplateModalPatient] = useState(null);
    const [customMessage, setCustomMessage] = useState('');
    const [activeTemplateId, setActiveTemplateId] = useState('confirm');
    const [copiedPhoneId, setCopiedPhoneId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Edición inline de notas al dar doble clic
    const [editingNotePatientId, setEditingNotePatientId] = useState(null);
    const [inlineNoteValue, setInlineNoteValue] = useState('');

    // Form state para crear/editar
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        status: 'Constante',
        nextSession: '',
        sessionPrice: '350',
        frequency: 'Semanal',
        privateNotes: '',
        linkedIdentityId: ''
    });

    // Cargar pacientes desde localStorage y sincronizar con backend
    const loadWhatsAppPatients = async () => {
        setIsLoading(true);
        let localList = [];
        try {
            const saved = localStorage.getItem('oasis_whatsapp_patients');
            if (saved) localList = JSON.parse(saved);
        } catch (e) {
            console.error("Error reading local whatsapp patients:", e);
        }

        if (localList.length > 0) {
            setPatients(localList);
        }

        try {
            const res = await fetch(`${API_URL}/api/oasis/whatsapp-patients`, {
                headers: { 'X-Oasis-User': currentUser || 'observador1' }
            });
            if (res.ok) {
                const cloudList = await res.json();
                if (Array.isArray(cloudList) && cloudList.length > 0) {
                    setPatients(cloudList);
                    localStorage.setItem('oasis_whatsapp_patients', JSON.stringify(cloudList));
                } else if (localList.length > 0) {
                    for (const p of localList) {
                        fetch(`${API_URL}/api/oasis/whatsapp-patients`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Oasis-User': currentUser || 'observador1'
                            },
                            body: JSON.stringify(p)
                        }).catch(() => null);
                    }
                }
            }
        } catch (e) {
            console.warn("Backend whatsapp-patients unreachable, using local storage cache:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadWhatsAppPatients();
    }, [currentUser]);

    const savePatientRecord = async (record) => {
        const updatedList = [...patients];
        const existingIdx = updatedList.findIndex(p => p.id === record.id);
        
        if (existingIdx >= 0) {
            updatedList[existingIdx] = record;
        } else {
            updatedList.unshift(record);
        }

        setPatients(updatedList);
        localStorage.setItem('oasis_whatsapp_patients', JSON.stringify(updatedList));

        try {
            await fetch(`${API_URL}/api/oasis/whatsapp-patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Oasis-User': currentUser || 'observador1'
                },
                body: JSON.stringify(record)
            });
        } catch (e) {
            console.error("Could not sync patient record to backend:", e);
        }
    };

    const deletePatientRecord = async (id, name) => {
        if (!window.confirm(`¿Estás seguro de eliminar a ${name} de tu lista de WhatsApp?`)) return;
        
        const updatedList = patients.filter(p => p.id !== id);
        setPatients(updatedList);
        localStorage.setItem('oasis_whatsapp_patients', JSON.stringify(updatedList));

        try {
            await fetch(`${API_URL}/api/oasis/whatsapp-patients/${id}`, {
                method: 'DELETE',
                headers: { 'X-Oasis-User': currentUser || 'observador1' }
            });
        } catch (e) {
            console.error("Could not delete patient record from backend:", e);
        }
    };

    // Funciones para editar nota directamente con doble clic
    const handleStartEditNote = (patient) => {
        setEditingNotePatientId(patient.id);
        setInlineNoteValue(patient.privateNotes || '');
    };

    const handleSaveInlineNote = (patient) => {
        if (editingNotePatientId !== patient.id) return;
        const trimmed = inlineNoteValue.trim();
        if (trimmed !== (patient.privateNotes || '')) {
            const updated = {
                ...patient,
                privateNotes: trimmed,
                updatedAt: new Date().toISOString()
            };
            savePatientRecord(updated);
        }
        setEditingNotePatientId(null);
    };

    const handleCancelInlineNote = () => {
        setEditingNotePatientId(null);
    };

    const handleOpenModal = (patient = null) => {
        if (patient) {
            setEditingPatient(patient);
            setFormData({
                name: patient.name || '',
                phone: patient.phone || '',
                status: patient.status || 'Constante',
                nextSession: patient.nextSession || '',
                sessionPrice: patient.sessionPrice || '350',
                frequency: patient.frequency || 'Semanal',
                privateNotes: patient.privateNotes || '',
                linkedIdentityId: patient.linkedIdentityId || ''
            });
        } else {
            setEditingPatient(null);
            setFormData({
                name: '',
                phone: '',
                status: 'Constante',
                nextSession: '',
                sessionPrice: '350',
                frequency: 'Semanal',
                privateNotes: '',
                linkedIdentityId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.phone.trim()) {
            alert("Por favor ingresa al menos el Nombre y el Número de WhatsApp.");
            return;
        }

        const record = {
            id: editingPatient ? editingPatient.id : `WAP-${Date.now()}`,
            clinicianId: currentUser || 'observador1',
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            status: formData.status,
            nextSession: formData.nextSession.trim(),
            sessionPrice: formData.sessionPrice.trim(),
            frequency: formData.frequency,
            privateNotes: formData.privateNotes.trim(),
            linkedIdentityId: formData.linkedIdentityId,
            createdAt: editingPatient ? editingPatient.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        savePatientRecord(record);
        setIsModalOpen(false);
    };

    const handleOpenTemplates = (patient) => {
        setTemplateModalPatient(patient);
        setActiveTemplateId('confirm');
        const defaultTpl = DEFAULT_TEMPLATES.find(t => t.id === 'confirm');
        setCustomMessage(defaultTpl ? defaultTpl.generate(patient.name, patient.nextSession) : '');
    };

    const handleSelectTemplate = (tpl) => {
        setActiveTemplateId(tpl.id);
        if (templateModalPatient) {
            setCustomMessage(tpl.generate(templateModalPatient.name, templateModalPatient.nextSession));
        }
    };

    const handleSendWhatsApp = (phone, message) => {
        const url = generateWhatsAppUrl(phone, message);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleCopyPhone = (id, phone) => {
        navigator.clipboard.writeText(phone);
        setCopiedPhoneId(id);
        setTimeout(() => setCopiedPhoneId(null), 2000);
    };

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            const matchesQuery = 
                (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.phone && p.phone.includes(searchQuery)) ||
                (p.privateNotes && p.privateNotes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.nextSession && p.nextSession.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [patients, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        const total = patients.length;
        const constantes = patients.filter(p => p.status === 'Constante').length;
        const nuevas = patients.filter(p => p.status === 'Nueva').length;
        const porConfirmar = patients.filter(p => p.status === 'Por confirmar').length;
        const programadas = patients.filter(p => p.nextSession && p.nextSession.trim() !== '' && p.nextSession !== '—').length;
        return { total, constantes, nuevas, porConfirmar, programadas };
    }, [patients]);

    return (
        <div className={`w-full h-full flex-1 min-h-0 overflow-y-auto custom-sidebar-scroll relative text-white selection:bg-emerald-500/30 ${isEmbedded ? 'p-1 sm:p-4 bg-transparent' : 'p-3 sm:p-6 md:p-8 pb-48 sm:pb-40 bg-[#050505]'}`}>
            {/* AMBIENT GLOWS - 2026 APPLE VISION STYLE */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/[0.035] rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/[0.025] rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* HEADER DE SUB-PÁGINA */}
            {!isEmbedded && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)] shrink-0 transition-transform hover:scale-105">
                            <MessageCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 flex items-center gap-2">
                                    Pacientes & WhatsApp CRM
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    Directo
                                </span>
                            </div>
                            <p className="text-zinc-500 text-[10px] sm:text-xs font-mono uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span>Conexión Inmediata</span> <span className="w-1 h-1 rounded-full bg-zinc-700" /> <span>Agenda</span> <span className="w-1 h-1 rounded-full bg-zinc-700" /> <span>Mensajería 1-clic</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {onBackToClinical && (
                            <button
                                onClick={onBackToClinical}
                                className="px-4 py-2 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-zinc-300 text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                            >
                                ← Volver a Identidades
                            </button>
                        )}
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} className="stroke-[3]" />
                            <span>Añadir Paciente</span>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Si está embeddido, solo mostramos el botón de añadir paciente alineado a la derecha */}
            {isEmbedded && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <Plus size={14} className="stroke-[3]" />
                        <span>Añadir Paciente</span>
                    </button>
                </div>
            )}

            {/* KPI METRICS CHIPS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6">
                {[
                    { label: 'Total Pacientes', val: stats.total, sub: 'contactos', color: 'text-white', dot: 'bg-white/40', icon: null },
                    { label: 'Constantes', val: stats.constantes, sub: 'en proceso', color: 'text-emerald-400', dot: 'bg-emerald-400', icon: null },
                    { label: 'Por Confirmar', val: stats.porConfirmar, sub: 'pendientes', color: 'text-amber-400', dot: 'bg-amber-400', icon: null },
                    { label: 'Con Próxima Sesión', val: stats.programadas, sub: 'agendadas', color: 'text-blue-400', dot: null, icon: <Calendar size={12} className="text-blue-400" /> }
                ].map((kpi, i) => (
                    <div key={i} className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl hover:bg-white/[0.04] transition-colors flex flex-col justify-between group">
                        <span className={`${kpi.color} opacity-80 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5`}>
                            {kpi.dot && <span className={`w-1.5 h-1.5 rounded-full ${kpi.dot} shadow-[0_0_8px_currentColor]`} />}
                            {kpi.icon && kpi.icon}
                            {kpi.label}
                        </span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className={`text-2xl sm:text-3xl font-black ${kpi.color} group-hover:scale-105 transition-transform origin-left`}>{kpi.val}</span>
                            <span className="text-[10px] text-zinc-500 font-mono tracking-wide">{kpi.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* CONTROLES: BÚSQUEDA Y FILTROS */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-xl bg-white/[0.02] hover:bg-white/[0.04] focus-within:bg-white/[0.06] border border-white/[0.05] focus-within:border-emerald-500/50 rounded-2xl px-4 py-3 transition-all backdrop-blur-md shadow-lg">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Buscar por paciente, teléfono, notas o fecha..."
                        className="w-full bg-transparent pl-8 pr-4 text-white placeholder-zinc-500 focus:outline-none font-mono text-xs sm:text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none custom-scroll">
                    {[
                        { id: 'ALL', label: 'Todos' },
                        { id: 'Constante', label: '🟢 Constante' },
                        { id: 'Nueva', label: '🟡 Nueva' },
                        { id: 'Por confirmar', label: '🟠 Por confirmar' },
                        { id: 'Inactivo', label: '⚪ Inactivo' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-4 py-2 rounded-2xl text-[10px] sm:text-xs font-mono uppercase tracking-wider font-bold whitespace-nowrap transition-all shadow-lg ${
                                statusFilter === tab.id 
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5 hover:bg-white/[0.05]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLA / LISTA DE PACIENTES */}
            {filteredPatients.length === 0 ? (
                <div className="bg-white/[0.02] border border-dashed border-white/[0.08] backdrop-blur-xl p-10 sm:p-16 rounded-[2rem] text-center flex flex-col items-center justify-center gap-4 my-4 animate-in fade-in duration-700">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                        <MessageSquare className="w-8 h-8 opacity-90" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white tracking-wide">
                            {searchQuery || statusFilter !== 'ALL' ? 'Sin coincidencias' : 'CRM Vacío'}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
                            {searchQuery || statusFilter !== 'ALL'
                                ? 'Prueba ajustando los términos de búsqueda o los filtros.'
                                : 'Comienza a organizar tu práctica clínica agregando a tu primer paciente al CRM.'}
                        </p>
                    </div>
                    {(!searchQuery && statusFilter === 'ALL') && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                        >
                            + Añadir Primer Paciente
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* VISTA MÓVIL: TARJETAS COMPACTAS */}
                    <div className="block md:hidden space-y-3 w-full pb-16">
                        {filteredPatients.map(patient => (
                            <div 
                                key={patient.id} 
                                className="bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-xl shadow-xl animate-in slide-in-from-bottom-4 duration-500"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-black text-sm text-white shadow-inner">
                                            {patient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{patient.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(patient.status)}`}>
                                                    {patient.status || 'Inactivo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenModal(patient)}
                                        className="p-1.5 text-zinc-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-black/40 rounded-xl p-2.5 border border-white/[0.02]">
                                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Teléfono</span>
                                        <span className="text-zinc-300 font-mono" onClick={() => handleCopyPhone(patient.id, patient.phone)}>
                                            {formatDisplayPhone(patient.phone) || '—'}
                                        </span>
                                    </div>
                                    <div className="bg-black/40 rounded-xl p-2.5 border border-white/[0.02]">
                                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Próxima Sesión</span>
                                        <span className="text-blue-400 font-medium flex items-center gap-1">
                                            {patient.nextSession && patient.nextSession !== '—' && <Calendar size={10} />}
                                            <span className="truncate">{patient.nextSession || '—'}</span>
                                        </span>
                                    </div>
                                </div>
                                {patient.privateNotes && (
                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5">
                                        <span className="text-[9px] text-amber-500/70 font-mono uppercase tracking-wider block mb-1">Nota Privada</span>
                                        <span className="text-zinc-300 text-xs italic">{patient.privateNotes}</span>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => handleOpenTemplates(patient)}
                                        className="flex-1 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl text-[10px] font-mono text-zinc-300 flex items-center justify-center gap-1.5 transition-all"
                                    >
                                        <Sparkles size={12} className="text-amber-400" />
                                        Plantillas
                                    </button>
                                    <button
                                        onClick={() => handleSendWhatsApp(patient.phone)}
                                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
                                    >
                                        <MessageCircle size={12} className="fill-black" />
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* VISTA ESCRITORIO: TABLA GLASSMORPHISM */}
                    <div className="hidden md:block w-full overflow-hidden rounded-[2rem] bg-white/[0.015] border border-white/[0.05] backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
                        <div className="overflow-x-auto custom-scroll">
                            <table className="w-full text-left text-sm text-zinc-300 border-collapse">
                                <thead className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest bg-black/40 border-b border-white/[0.06]">
                                    <tr>
                                        <th className="px-6 py-5 font-bold">Paciente</th>
                                        <th className="px-6 py-5 font-bold">Teléfono</th>
                                        <th className="px-6 py-5 font-bold">Estado</th>
                                        <th className="px-6 py-5 font-bold">Próxima Sesión</th>
                                        <th className="px-6 py-5 font-bold">Notas (Doble clic)</th>
                                        <th className="px-6 py-5 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {filteredPatients.map((patient, index) => (
                                        <tr 
                                            key={patient.id} 
                                            className="hover:bg-white/[0.02] transition-colors group/row"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center font-black text-xs text-white shadow-inner group-hover/row:border-emerald-500/30 group-hover/row:text-emerald-400 transition-colors">
                                                        {patient.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-sm">{patient.name}</span>
                                                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                                            {patient.sessionPrice ? `${patient.sessionPrice}` : '-'}
                                                            <span className="text-zinc-700">•</span>
                                                            {patient.frequency || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                                                <div 
                                                    className="flex items-center gap-2 cursor-pointer group/phone hover:text-white transition-colors"
                                                    onClick={() => handleCopyPhone(patient.id, patient.phone)}
                                                >
                                                    <span>{formatDisplayPhone(patient.phone) || '—'}</span>
                                                    {copiedPhoneId === patient.id ? (
                                                        <Check size={12} className="text-emerald-400" />
                                                    ) : (
                                                        <Copy size={12} className="text-zinc-600 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${getStatusBadge(patient.status)}`}>
                                                    {patient.status || 'Inactivo'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    {patient.nextSession && patient.nextSession !== '—' && (
                                                        <Calendar size={12} className="text-blue-400 opacity-70" />
                                                    )}
                                                    <span className={patient.nextSession && patient.nextSession !== '—' ? 'text-blue-300' : 'text-zinc-600'}>
                                                        {patient.nextSession || '—'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td 
                                                className="px-6 py-4 min-w-[200px] max-w-[300px]"
                                                onDoubleClick={() => handleStartEditNote(patient)}
                                            >
                                                {editingNotePatientId === patient.id ? (
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            value={inlineNoteValue}
                                                            onChange={(e) => setInlineNoteValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleSaveInlineNote(patient);
                                                                } else if (e.key === 'Escape') {
                                                                    handleCancelInlineNote();
                                                                }
                                                            }}
                                                            onBlur={() => handleSaveInlineNote(patient)}
                                                            placeholder="Escribe nota y presiona Enter..."
                                                            className="w-full bg-black border border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className="cursor-pointer group/note flex items-center justify-between gap-2 py-1.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                                                        title="Doble clic para editar"
                                                    >
                                                        {patient.privateNotes ? (
                                                            <p className="text-zinc-400 text-xs italic truncate group-hover/note:text-zinc-200 transition-colors">
                                                                {patient.privateNotes}
                                                            </p>
                                                        ) : (
                                                            <span className="text-zinc-600 group-hover/note:text-zinc-400 text-xs italic flex items-center gap-2">
                                                                <span>—</span>
                                                                <span className="opacity-0 group-hover/note:opacity-100 text-[10px] text-emerald-400/60 font-mono transition-opacity">
                                                                    (doble clic)
                                                                </span>
                                                            </span>
                                                        )}
                                                        <Edit2 size={12} className="text-zinc-600 opacity-0 group-hover/note:opacity-100 group-hover/note:text-emerald-400 transition-all shrink-0 ml-2" />
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenTemplates(patient)}
                                                        className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-full text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 transition-all hover:border-amber-500/30"
                                                        title="Plantillas de mensaje"
                                                    >
                                                        <Sparkles size={12} className="text-amber-400" />
                                                        <span>Plantillas</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleSendWhatsApp(patient.phone)}
                                                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95 transition-all"
                                                        title="Chat de WhatsApp"
                                                    >
                                                        <MessageCircle size={14} className="fill-black" />
                                                        <span>Chat</span>
                                                    </button>

                                                    <div className="h-4 w-px bg-white/10 mx-1"></div>

                                                    <button
                                                        onClick={() => handleOpenModal(patient)}
                                                        className="p-1.5 text-zinc-500 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => deletePatientRecord(patient.id, patient.name)}
                                                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

{/* MODAL PARA CREAR / EDITAR PACIENTE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0c0c0e] border border-emerald-500/30 rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-sidebar-scroll flex flex-col gap-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                                <UserPlus size={16} className="text-emerald-400" />
                                <span>{editingPatient ? 'Editar Paciente' : 'Añadir Nuevo Paciente'}</span>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {!editingPatient && clinicPatients && clinicPatients.length > 0 && (
                            <div className="bg-white/[0.02] border border-white/[0.06] p-3 rounded-2xl flex flex-col gap-1.5">
                                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                    <LinkIcon size={10} className="text-emerald-400" />
                                    <span>Vincular con Identidad Clínica Existente (Opcional):</span>
                                </label>
                                <select
                                    className="bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500/40"
                                    value={formData.linkedIdentityId}
                                    onChange={(e) => {
                                        const selectedUser = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            linkedIdentityId: selectedUser,
                                            name: prev.name || selectedUser
                                        }));
                                    }}
                                >
                                    <option value="">-- Selecciona una identidad si deseas vincular --</option>
                                    {clinicPatients.map(cp => (
                                        <option key={cp.id} value={cp.name}>
                                            @{cp.name} ({cp.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                                        Nombre / Pseudónimo *
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Ej. Alan, Axel, Yazmin..."
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                                        WhatsApp (10 dígitos o con +52) *
                                    </label>
                                    <input 
                                        type="tel"
                                        required
                                        placeholder="Ej. 5512345678"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                                        Estado
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/40"
                                    >
                                        <option value="Constante">🟢 Constante</option>
                                        <option value="Nueva">🟡 Nueva</option>
                                        <option value="Por confirmar">🟠 Por confirmar</option>
                                        <option value="Inactivo">⚪ Inactivo</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                                        Precio por sesión
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder="Ej. 350, 500"
                                        value={formData.sessionPrice}
                                        onChange={(e) => setFormData({ ...formData, sessionPrice: e.target.value })}
                                        className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                                        Frecuencia
                                    </label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/40"
                                    >
                                        <option value="Semanal">Semanal</option>
                                        <option value="Quincenal">Quincenal</option>
                                        <option value="Mensual">Mensual</option>
                                        <option value="Por demanda">Por demanda</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono uppercase text-zinc-400 flex items-center justify-between">
                                    <span>Próxima Sesión (Día y hora o texto)</span>
                                    <span className="text-zinc-600 text-[9px]">Ej: Jueves 6:00 PM o Viernes 5:00</span>
                                </label>
                                <input 
                                    type="text"
                                    placeholder="Ej. Jueves 6:00 PM o Viernes 5:00"
                                    value={formData.nextSession}
                                    onChange={(e) => setFormData({ ...formData, nextSession: e.target.value })}
                                    className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500/40"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono uppercase text-zinc-400">
                                    Notas Privadas / Clínicas (Protegidas)
                                </label>
                                <textarea 
                                    rows={3}
                                    placeholder="Detalles sobre motivos de consulta, acuerdos de pago o preferencias de horario..."
                                    value={formData.privateNotes}
                                    onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })}
                                    className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 custom-scroll resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-mono transition-colors"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                                >
                                    {editingPatient ? 'Guardar Cambios' : 'Añadir Paciente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE MENSAJES RÁPIDOS (1-CLICK TEMPLATES) */}
            {templateModalPatient && (
                <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0c0c0e] border border-emerald-500/30 rounded-3xl p-5 sm:p-7 max-w-xl w-full flex flex-col gap-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                                <Sparkles size={16} className="text-emerald-400" />
                                <span>Mensaje Rápido para {templateModalPatient.name}</span>
                            </div>
                            <button 
                                onClick={() => setTemplateModalPatient(null)}
                                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {DEFAULT_TEMPLATES.map(tpl => (
                                <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => handleSelectTemplate(tpl)}
                                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col gap-1 ${
                                        activeTemplateId === tpl.id
                                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-zinc-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                                        <span>{tpl.icon}</span>
                                        <span>{tpl.title}</span>
                                    </div>
                                    <span className="text-[9px] text-zinc-500 line-clamp-1">{tpl.desc}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-zinc-400 flex items-center justify-between">
                                <span>Vista previa del mensaje (editable):</span>
                                <span className="text-emerald-400 font-mono text-[9px]">{formatDisplayPhone(templateModalPatient.phone)}</span>
                            </label>
                            <textarea 
                                rows={4}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                className="bg-black/60 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500/40 leading-relaxed custom-scroll resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(customMessage);
                                    alert("Mensaje copiado al portapapeles");
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono flex items-center gap-1 transition-colors"
                            >
                                <Copy size={12} />
                                <span>Copiar Texto</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTemplateModalPatient(null)}
                                    className="px-3 py-1.5 rounded-xl bg-transparent text-zinc-400 hover:text-white text-xs font-mono transition-colors"
                                >
                                    Cerrar
                                </button>

                                <button
                                    onClick={() => {
                                        handleSendWhatsApp(templateModalPatient.phone, customMessage);
                                        setTemplateModalPatient(null);
                                    }}
                                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={12} className="fill-black" />
                                    <span>Enviar a WhatsApp</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
;
}

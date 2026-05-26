import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Filter, Activity, Brain, Clock, AlertTriangle, 
    ChevronRight, CheckCircle2, User, FileText, Zap, Hexagon,
    Plus, Trash2, Save, X, Edit3, MessageSquare, GripHorizontal, ArrowLeft,
    Settings, Archive, ChevronDown, Check, LogOut, CheckCircle
} from 'lucide-react';
import icarQuestions from '../data/icar16_questions.json';
import icarRationale from '../data/icar16_rationale.json';
import { saveObservation, getObservations } from '../utils/db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5046';

const PHENOM_PART_B = [
    { id: 1, domain: "Reactividad Emocional", text: "Me preocupo por casi todo." },
    { id: 2, domain: "Reactividad Emocional", text: "Me asusto o me alarmo con mucha facilidad." },
    { id: 3, domain: "Reactividad Emocional", text: "Me pongo muy ansioso/a cuando las cosas son inciertas o impredecibles." },
    { id: 4, domain: "Reactividad Emocional", text: "Me irrito fácilmente por todo tipo de cosas." },
    { id: 5, domain: "Reactividad Emocional", text: "Mis emociones a veces cambian de un momento a otro sin motivo aparente." },
    { id: 6, domain: "Estilo de Conexión", text: "Prefiero estar solo/a que acompañado/a." },
    { id: 7, domain: "Estilo de Conexión", text: "Mantengo mi distancia emocional de la gente." },
    { id: 8, domain: "Estilo de Conexión", text: "Me cuesta mucho disfrutar de las cosas de la vida." },
    { id: 9, domain: "Estilo de Conexión", text: "Rara vez me involucro emocionalmente con los demás." },
    { id: 10, domain: "Estilo de Conexión", text: "Evito hacer nuevos amigos o conocer gente nueva." },
    { id: 11, domain: "Gestión de la Asertividad", text: "A menudo tengo que manipular a la gente para conseguir lo que quiero." },
    { id: 12, domain: "Gestión de la Asertividad", text: "Siento que soy mejor o más importante que casi todo el mundo." },
    { id: 13, domain: "Gestión de la Asertividad", text: "Disfruto aprovechándome de los demás si se presenta la oportunidad." },
    { id: 14, domain: "Gestión de la Asertividad", text: "No me importa herir los sentimientos de otros si eso me beneficia." },
    { id: 15, domain: "Gestión de la Asertividad", text: "Creo que para salir adelante, a veces tienes que engañar a la gente." },
    { id: 16, domain: "Impulso y Planificación", text: "A menudo actúo de inmediato sin pensar en las consecuencias." },
    { id: 17, domain: "Impulso y Planificación", text: "Hago las cosas en el momento sin planearlas en absoluto." },
    { id: 18, domain: "Impulso y Planificación", text: "A menudo rompo mis promesas o no cumplo con mis acuerdos." },
    { id: 19, domain: "Impulso y Planificación", text: "Me aburro rápidamente de las tareas y pierdo el interés." },
    { id: 20, domain: "Impulso y Planificación", text: "Tomo decisiones precipitadas en el calor del momento." },
    { id: 21, domain: "Singularidad Cognitiva", text: "A menudo tengo pensamientos que no tienen sentido para los demás." },
    { id: 22, domain: "Singularidad Cognitiva", text: "He tenido experiencias extrañas que son muy difíciles de explicar." },
    { id: 23, domain: "Singularidad Cognitiva", text: "A veces siento que las cosas a mi alrededor no son reales." },
    { id: 24, domain: "Singularidad Cognitiva", text: "La gente suele pensar que mi forma de ser o hablar es excéntrica o rara." },
    { id: 25, domain: "Singularidad Cognitiva", text: "A veces escuchar o ver cosas que los demás no pueden percibir." }
];

// Helper to calculate PID-5 Domain scores
const getPid5Domains = (pidAnswers) => {
    if (!pidAnswers || Object.keys(pidAnswers).length === 0) return null;
    const pidScores = {
        afectividadNegativa: 0,
        desapego: 0,
        antagonismo: 0,
        desinhibicion: 0,
        psicoticismo: 0
    };
    
    for (let i = 1; i <= 25; i++) {
        const val = parseInt(pidAnswers[i] || 0, 10);
        if (i <= 5) pidScores.afectividadNegativa += val;
        else if (i <= 10) pidScores.desapego += val;
        else if (i <= 15) pidScores.antagonismo += val;
        else if (i <= 20) pidScores.desinhibicion += val;
        else pidScores.psicoticismo += val;
    }

    const getLevel = (score) => {
        if (score <= 5) return 'Baja';
        if (score <= 10) return 'Moderada';
        return 'Alta';
    };

    return {
        afectividadNegativa: { level: getLevel(pidScores.afectividadNegativa), score: pidScores.afectividadNegativa, max: 15 },
        desapego: { level: getLevel(pidScores.desapego), score: pidScores.desapego, max: 15 },
        antagonismo: { level: getLevel(pidScores.antagonismo), score: pidScores.antagonismo, max: 15 },
        desinhibicion: { level: getLevel(pidScores.desinhibicion), score: pidScores.desinhibicion, max: 15 },
        psicoticismo: { level: getLevel(pidScores.psicoticismo), score: pidScores.psicoticismo, max: 15 }
    };
};

// Helper to calculate ICAR Dimensions
const getIcarDimensions = (icarAnswers) => {
    if (!icarAnswers || Object.keys(icarAnswers).length === 0) {
        return { visuospatial: 0, inductive: 0, sequential: 0, verbal: 0 };
    }
    
    const dimensions = {
        verbal: { qs: [1, 6, 14, 16], correct: 0 },
        visuospatial: { qs: [2, 4, 7, 12], correct: 0 },
        sequential: { qs: [3, 9, 10, 13], correct: 0 },
        inductive: { qs: [5, 8, 11, 15], correct: 0 }
    };

    Object.keys(dimensions).forEach(k => {
        dimensions[k].qs.forEach(qNum => {
            const qObj = icarQuestions.find(q => q.question_number === qNum);
            if (qObj && icarAnswers[qNum] === qObj.correct_answer) {
                dimensions[k].correct++;
            }
        });
    });

    return {
        visuospatial: Math.round((dimensions.visuospatial.correct / 4) * 100),
        inductive: Math.round((dimensions.inductive.correct / 4) * 100),
        sequential: Math.round((dimensions.sequential.correct / 4) * 100),
        verbal: Math.round((dimensions.verbal.correct / 4) * 100)
    };
};

// Helper to calculate ICAR Proctoring/Behavioral Alerts
const getIcarAlerts = (icarDwellTimes, icarChanges) => {
    const alerts = [];
    if (!icarDwellTimes) return alerts;
    
    Object.entries(icarDwellTimes).forEach(([qNum, time]) => {
        if (time > 95) {
            alerts.push({
                name: `Alta Inversión Cognitiva (Q${qNum})`,
                tooltip: `El paciente dedicó ${Math.round(time)}s a la resolución del reactivo, sugiriendo procesamiento detallado de variables.`
            });
        }
    });
    
    if (icarChanges) {
        Object.entries(icarChanges).forEach(([qNum, count]) => {
            if (count >= 3) {
                alerts.push({
                    name: `Reevaluación Decisional (Q${qNum})`,
                    tooltip: `Se registraron ${count} cambios de opción, sugiriendo revisión y reformulación de la hipótesis.`
                });
            }
        });
    }
    
    return alerts;
};

// Helper to compute ICAR Z-Scores and clinical interpretations on the fly
const computeIcarReferenceIndices = (icarAnswers, icarDwellTimes, icarChanges) => {
    const dimensions = {
        verbal: { qs: [1, 6, 14, 16], correct: 0, mean: 3.2, sd: 0.8, name: "Verbal" },
        visuospatial: { qs: [2, 4, 7, 12], correct: 0, mean: 2.8, sd: 1.0, name: "Visoespacial" },
        sequential: { qs: [3, 9, 10, 13], correct: 0, mean: 2.9, sd: 0.9, name: "Secuencial" },
        inductive: { qs: [5, 8, 11, 15], correct: 0, mean: 2.7, sd: 1.1, name: "Inductiva" }
    };

    Object.keys(dimensions).forEach(k => {
        dimensions[k].qs.forEach(qNum => {
            const qObj = icarQuestions.find(q => q.question_number === qNum);
            if (qObj && icarAnswers && icarAnswers[qNum] === qObj.correct_answer) {
                dimensions[k].correct++;
            }
        });
    });

    const dimensionDwells = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
    const dimensionDwellCounts = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };
    const dimensionChanges = { verbal: 0, visuospatial: 0, sequential: 0, inductive: 0 };

    let totalDwellSum = 0;
    let answeredCount = 0;
    
    for (let i = 1; i <= 16; i++) {
        const dTime = (icarDwellTimes && icarDwellTimes[i]) || 0;
        const changes = (icarChanges && icarChanges[i]) || 0;
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

    return indices_referencia;
};

// Helper to compute ICAR Estado Cognitivo JSON on the fly
const computeIcarEstadoCognitivo = (icarAnswers, icarDwellTimes, icarChanges, score, username) => {
    const refIndices = computeIcarReferenceIndices(icarAnswers, icarDwellTimes, icarChanges);
    if (!refIndices || !refIndices.dimensions) return null;

    const totalDwellTime = Object.values(icarDwellTimes || {}).reduce((a, b) => a + b, 0);
    let validez = "ok";
    if (totalDwellTime < 350) {
        validez = "INVALIDA_DESATENCION";
    } else if ((score / 16) < 0.30) {
        validez = "INVALIDA_AZAR";
    }

    const getEficienciaLabel = (z, eff) => {
        if (eff === "capacidad_compensatoria") return "alta_demanda";
        if (eff === "saturacion_cognitiva") return "saturacion";
        if (z >= 1) return "optima";
        if (z <= -1) return "deficiente";
        return "normal";
    };

    const perfil_cognitivo = {
        verbal: {
            z_score: refIndices.dimensions.verbal.z_score,
            eficiencia: getEficienciaLabel(refIndices.dimensions.verbal.z_score, refIndices.dimensions.verbal.efficiency_status)
        },
        spatial: {
            z_score: refIndices.dimensions.visuospatial.z_score,
            eficiencia: getEficienciaLabel(refIndices.dimensions.visuospatial.z_score, refIndices.dimensions.visuospatial.efficiency_status)
        },
        secuencial: {
            z_score: refIndices.dimensions.sequential.z_score,
            eficiencia: getEficienciaLabel(refIndices.dimensions.sequential.z_score, refIndices.dimensions.sequential.efficiency_status)
        },
        inductiva: {
            z_score: refIndices.dimensions.inductive.z_score,
            eficiencia: getEficienciaLabel(refIndices.dimensions.inductive.z_score, refIndices.dimensions.inductive.efficiency_status)
        }
    };

    let estilo_ejecucion = "normal";
    const totalDwellAvg = refIndices.total_dwell_avg;
    if (totalDwellAvg < 45 && score >= 11) {
        estilo_ejecucion = "eficiente";
    } else if (totalDwellAvg < 45 && score < 11) {
        estilo_ejecucion = "impulsivo";
    } else if (totalDwellAvg >= 45 && score >= 11) {
        estilo_ejecucion = "analítico_sostenido";
    } else {
        estilo_ejecucion = "sobrecargado";
    }

    const banderas_conductuales = [];
    if (refIndices.dimensions.visuospatial.efficiency_status === "capacidad_compensatoria") {
        banderas_conductuales.push("alta_inversion_spatial");
    }
    if (refIndices.dimensions.verbal.efficiency_status === "capacidad_compensatoria") {
        banderas_conductuales.push("alta_inversion_verbal");
    }
    if (refIndices.dimensions.sequential.efficiency_status === "capacidad_compensatoria") {
        banderas_conductuales.push("alta_inversion_secuencial");
    }
    if (refIndices.dimensions.inductive.efficiency_status === "capacidad_compensatoria") {
        banderas_conductuales.push("alta_inversion_inductiva");
    }

    if (refIndices.dimensions.visuospatial.efficiency_status === "saturacion_cognitiva") {
        banderas_conductuales.push("saturacion_spatial");
    }
    if (refIndices.dimensions.verbal.efficiency_status === "saturacion_cognitiva") {
        banderas_conductuales.push("saturacion_verbal");
    }
    if (refIndices.dimensions.sequential.efficiency_status === "saturacion_cognitiva") {
        banderas_conductuales.push("saturacion_secuencial");
    }
    if (refIndices.dimensions.inductive.efficiency_status === "saturacion_cognitiva") {
        banderas_conductuales.push("saturacion_inductiva");
    }

    const totalChanges = Object.values(icarChanges || {}).reduce((a, b) => a + b, 0);
    if (totalChanges === 0) {
        banderas_conductuales.push("estabilidad_decisional_alta");
    } else if (totalChanges >= 5) {
        banderas_conductuales.push("reevaluacion_decisional_alta");
    }

    return {
        metadatos: {
            fecha: new Date().toISOString().split('T')[0],
            validez: validez,
            tiempo_total: Math.round(totalDwellTime)
        },
        perfil_cognitivo: perfil_cognitivo,
        estilo_ejecucion: estilo_ejecucion,
        banderas_conductuales: banderas_conductuales
    };
};

// Helper to compute PID-5 Clinical State on the fly
const computePid5ClinicalState = (pidAnswers) => {
    if (!pidAnswers || Object.keys(pidAnswers).length === 0) return null;
    
    // Group answers
    const answersGroup = {
        reactividadEmocional: [],
        estiloConexion: [],
        gestionAsertividad: [],
        ritmoEjecucion: [],
        singularidadCognitiva: []
    };
    
    for (let i = 1; i <= 25; i++) {
        const val = parseInt(pidAnswers[i] || 0, 10);
        if (i <= 5) answersGroup.reactividadEmocional.push(val);
        else if (i <= 10) answersGroup.estiloConexion.push(val);
        else if (i <= 15) answersGroup.gestionAsertividad.push(val);
        else if (i <= 20) answersGroup.ritmoEjecucion.push(val);
        else answersGroup.singularidadCognitiva.push(val);
    }
    
    const sums = {
        reactividadEmocional: answersGroup.reactividadEmocional.reduce((a, b) => a + b, 0),
        estiloConexion: answersGroup.estiloConexion.reduce((a, b) => a + b, 0),
        gestionAsertividad: answersGroup.gestionAsertividad.reduce((a, b) => a + b, 0),
        ritmoEjecucion: answersGroup.ritmoEjecucion.reduce((a, b) => a + b, 0),
        singularidadCognitiva: answersGroup.singularidadCognitiva.reduce((a, b) => a + b, 0)
    };
    
    const indices = {
        reactividadEmocional: parseFloat((sums.reactividadEmocional / 15).toFixed(3)),
        estiloConexion: parseFloat((sums.estiloConexion / 15).toFixed(3)),
        gestionAsertividad: parseFloat((sums.gestionAsertividad / 15).toFixed(3)),
        ritmoEjecucion: parseFloat((sums.ritmoEjecucion / 15).toFixed(3)),
        singularidadCognitiva: parseFloat((sums.singularidadCognitiva / 15).toFixed(3))
    };
    
    // Calculate internal variance for each block
    const variances = {};
    Object.keys(answersGroup).forEach(key => {
        const list = answersGroup[key];
        const mean = list.reduce((a, b) => a + b, 0) / list.length;
        const squareDiffs = list.map(val => Math.pow(val - mean, 2));
        const variance = squareDiffs.reduce((a, b) => a + b, 0) / list.length;
        variances[key] = parseFloat(variance.toFixed(3));
    });
    
    const globalVariance = parseFloat((Object.values(variances).reduce((a, b) => a + b, 0) / 5).toFixed(3));
    
    const getClasificacion = (idx) => {
        if (idx < 0.35) return { label: "Enfoque Atenuado", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
        if (idx < 0.65) return { label: "Enfoque Moderado", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
        return { label: "Enfoque Destacado", color: "text-violet-400 bg-violet-500/10 border-violet-500/20 font-bold" };
    };

    // Calculate system dynamics and discrepancies (Dinámicas de Afrontamiento)
    const dynamicInsights = [];
    
    // Dynamic 1: Reactividad vs Conexión
    const dist1 = parseFloat(Math.abs(indices.reactividadEmocional - indices.estiloConexion).toFixed(3));
    if (dist1 >= 0.5) {
        if (indices.reactividadEmocional >= indices.estiloConexion) {
            dynamicInsights.push({
                type: "Reactividad vs Conexión",
                discrepancy: dist1,
                title: "Búsqueda de Regulación Externa",
                consequence: "Cuando las emociones se intensifican, buscas activamente el apoyo de otros para encontrar equilibrio. Es tu forma de no cargar todo solo.",
                reflection: "¿Qué personas o entornos de confianza son los que mejor te ayudan a recuperar la calma en esos momentos?"
            });
        } else {
            dynamicInsights.push({
                type: "Reactividad vs Conexión",
                discrepancy: dist1,
                title: "Aislamiento Defensivo",
                consequence: "Ante la sobrecarga del entorno, prefieres retirarte a tu propio espacio. Es tu método para recuperar energía y procesar tus ideas sin ruido externo.",
                reflection: "¿Cómo logras que tus seres queridos entiendan que tu retiro temporal es solo tu manera de restaurar tu equilibrio?"
            });
        }
    }
    
    // Dynamic 2: Singularidad vs Ritmo
    const dist2 = parseFloat(Math.abs(indices.singularidadCognitiva - indices.ritmoEjecucion).toFixed(3));
    if (dist2 >= 0.5) {
        if (indices.singularidadCognitiva >= indices.ritmoEjecucion) {
            dynamicInsights.push({
                type: "Singularidad vs Ritmo",
                discrepancy: dist2,
                title: "Elaboración Compleja sobre Acción",
                consequence: "Tienes una forma muy particular de ver el mundo, lo cual normalmente tomaría mucho tiempo procesar. Sin embargo, logras tomar decisiones con mucha agilidad. Esto sugiere que no necesitas detenerte para ser creativo; tu mente ha aprendido a integrar tus ideas abstractas directamente en la acción.",
                reflection: "¿Cómo logras que esa fluidez pase del pensamiento a la acción sin sentir que pierdes la profundidad de tus ideas originales?"
            });
        } else {
            dynamicInsights.push({
                type: "Singularidad vs Ritmo",
                discrepancy: dist2,
                title: "Acción Ejecutiva sobre Abstracción",
                consequence: "Prefieres resolver y actuar de manera rápida y directa. Valoras la aplicación práctica y la toma de decisiones inmediata sobre las teorizaciones.",
                reflection: "¿Cómo logras equilibrar tu agilidad para tomar decisiones con la necesidad de detenerte a reflexionar sobre alternativas menos convencionales cuando el reto lo exige?"
            });
        }
    }
    
    // Dynamic 3: Asertividad vs Conexión
    const dist3 = parseFloat(Math.abs(indices.gestionAsertividad - indices.estiloConexion).toFixed(3));
    if (dist3 >= 0.5) {
        if (indices.gestionAsertividad >= indices.estiloConexion) {
            dynamicInsights.push({
                type: "Asertividad vs Conexión",
                discrepancy: dist3,
                title: "Asertividad Relacional Activa",
                consequence: "Defiendes con firmeza tus límites y decisiones personales, pero buscando mantener un diálogo y conexión fluida con tu entorno.",
                reflection: "¿Cómo logras equilibrar tu asertividad firme con la empatía hacia las necesidades de los demás en una conversación?"
            });
        } else {
            dynamicInsights.push({
                type: "Asertividad vs Conexión",
                discrepancy: dist3,
                title: "Distanciamiento Independiente",
                consequence: "Mantienes tu independencia y control personal marcando una distancia clara en tus relaciones. Es tu manera de proteger tu libertad.",
                reflection: "¿De qué manera te aseguras de que esa distancia protectora no se convierta en una barrera que dificulte una cercanía más profunda cuando la deseas?"
            });
        }
    }

    // Dynamic 4: Reactividad vs Ritmo de Ejecución
    const dist4 = parseFloat(Math.abs(indices.reactividadEmocional - indices.ritmoEjecucion).toFixed(3));
    if (dist4 >= 0.5) {
        if (indices.reactividadEmocional >= indices.ritmoEjecucion) {
            dynamicInsights.push({
                type: "Reactividad vs Ritmo",
                discrepancy: dist4,
                title: "Búsqueda de Gratificación Impulsiva",
                consequence: "Cuando necesitas aliviar tensiones, tiendes a actuar de forma espontánea, priorizando la acción rápida sobre la estrategia a largo plazo.",
                reflection: "¿De qué manera te ha ayudado esta espontaneidad a aliviar tensiones de forma inmediata, y cómo podrías equilibrarla con una perspectiva a largo plazo?"
            });
        } else {
            dynamicInsights.push({
                type: "Reactividad vs Ritmo",
                discrepancy: dist4,
                title: "Estructura y Autorregulación Deliberada",
                consequence: "Ante la tensión o los retos, mantienes la disciplina y el enfoque metódico por encima de cualquier reacción impulsiva inmediata.",
                reflection: "¿Cómo manejas tus emociones internas cuando la necesidad de estructura choca con situaciones que requieren improvisación absoluta?"
            });
        }
    }

    // Dynamic Reframing Notes for ALL 5 dimensions simultaneously (no thresholds)
    const analysisNotes = [];

    // 1. Reactividad Emocional
    if (indices.reactividadEmocional >= 0.65) {
        analysisNotes.push({
            label: "Reactividad Emocional",
            styleType: "Estilo de gestión personal - Enfoque Destacado",
            consequence: "Vives y sientes los cambios a tu alrededor con gran empatía y sensibilidad. Esto te permite conectar profundamente con las emociones de los demás y responder de forma auténtica.",
            reflection: "¿De qué manera canalizas esta intensidad para que sea tu guía al relacionarte con otros, protegiendo al mismo tiempo tu paz mental?"
        });
    } else if (indices.reactividadEmocional >= 0.35) {
        analysisNotes.push({
            label: "Reactividad Emocional",
            styleType: "Estilo de gestión personal - Enfoque Moderado",
            consequence: "Mantienes una relación armoniosa con tu mundo emocional, respondiendo con empatía cuando la situación lo amerita sin abrumarte fácilmente.",
            reflection: "¿Sientes que este equilibrio te ayuda a conservar la claridad mental ante los retos cotidianos?"
        });
    } else {
        analysisNotes.push({
            label: "Reactividad Emocional",
            styleType: "Estilo de gestión personal - Enfoque Atenuado",
            consequence: "Frente a las presiones del entorno, prefieres actuar con serenidad y cabeza fría. Esto te ayuda a tomar decisiones objetivas sin el ruido de reacciones apresuradas.",
            reflection: "¿En qué momentos sientes que esta calma te permite ser el cable a tierra de las personas que te rodean?"
        });
    }

    // 2. Estilo de Conexión
    if (indices.estiloConexion >= 0.65) {
        analysisNotes.push({
            label: "Estilo de Conexión",
            styleType: "Estilo de gestión personal - Enfoque Destacado",
            consequence: "Valoras profundamente tu espacio y tiempo personal para recargar tus energías. Disfrutas de momentos a solas para reflexionar sin la sobrecarga del entorno social.",
            reflection: "¿Cómo logras mantener el equilibrio entre tus momentos de retiro voluntario y las relaciones que te importan?"
        });
    } else if (indices.estiloConexion >= 0.35) {
        analysisNotes.push({
            label: "Estilo de Conexión",
            styleType: "Estilo de gestión personal - Enfoque Moderado",
            consequence: "Alternas de forma natural entre la interacción social y tus periodos de introspección, sintiéndote cómodo en ambos mundos.",
            reflection: "¿Sientes que logras nutrir tus relaciones sin perder tu propio espacio de reflexión?"
        });
    } else {
        analysisNotes.push({
            label: "Estilo de Conexión",
            styleType: "Estilo de gestión personal - Enfoque Atenuado",
            consequence: "Te resulta muy natural y de fácil disposición interactuar continuamente con otras personas. Sientes disponibilidad interpersonal sin requerir periodos de aislamiento voluntario.",
            reflection: "¿Sientes que participar de forma continua en interacciones sociales te resulta natural y no te drena la energía?"
        });
    }

    // 3. Gestión de la Asertividad
    if (indices.gestionAsertividad >= 0.65) {
        analysisNotes.push({
            label: "Gestión de la Asertividad",
            styleType: "Estilo de gestión personal - Enfoque Destacado",
            consequence: "Estableces límites sumamente claros y defiendes tus convicciones con firmeza, priorizando tu soberanía e independencia frente a la opinión del grupo.",
            reflection: "¿Cómo decides cuándo ser firme para resguardar tus metas y cuándo ser flexible para colaborar con otros?"
        });
    } else if (indices.gestionAsertividad >= 0.35) {
        analysisNotes.push({
            label: "Gestión de la Asertividad",
            styleType: "Estilo de gestión personal - Enfoque Moderado",
            consequence: "Defiendes tus posturas con naturalidad pero con tacto, buscando acuerdos y prefiriendo la colaboración sin ceder en tus valores fundamentales.",
            reflection: "¿Te resulta fácil encontrar un punto medio donde tus necesidades y las de los demás se respeten?"
        });
    } else {
        analysisNotes.push({
            label: "Gestión de la Asertividad",
            styleType: "Estilo de gestión personal - Enfoque Atenuado",
            consequence: "Prefieres el consenso y la armonía sobre el conflicto. Buscas que todos se sientan cómodos y evitas generar tensiones innecesarias con los demás.",
            reflection: "¿Cómo logras equilibrar tu deseo de mantener la paz con la expresión honesta de tus propias necesidades?"
        });
    }

    // 4. Ritmo de Ejecución
    if (indices.ritmoEjecucion >= 0.65) {
        analysisNotes.push({
            label: "Ritmo de Ejecución",
            styleType: "Estilo de gestión personal - Enfoque Destacado",
            consequence: "Te adaptas muy bien a los imprevistos y prefieres actuar de manera flexible sobre la marcha, encontrando soluciones rápidas e intuitivas.",
            reflection: "¿Qué rutinas sencillas te ayudan a mantener el rumbo en tus metas largas cuando la novedad te invita a cambiar?"
        });
    } else if (indices.ritmoEjecucion >= 0.35) {
        analysisNotes.push({
            label: "Ritmo de Ejecución",
            styleType: "Estilo de gestión personal - Enfoque Moderado",
            consequence: "Planificas tus pasos principales pero mantienes la flexibilidad suficiente para improvisar o cambiar el rumbo cuando es necesario.",
            reflection: "¿Cómo decides cuándo seguir el plan original y cuándo es mejor dejarte llevar por las circunstancias?"
        });
    } else {
        analysisNotes.push({
            label: "Ritmo de Ejecución",
            styleType: "Estilo de gestión personal - Enfoque Atenuado",
            consequence: "Prefieres la organización, el análisis minucioso y dar pasos seguros. Esto te ayuda a evitar decisiones impulsivas y a garantizar resultados ordenados.",
            reflection: "¿Cómo manejas la frustración cuando situaciones externas o personas imprevistas cambian tu planificación?"
        });
    }

    // 5. Singularidad Cognitiva
    if (indices.singularidadCognitiva >= 0.65) {
        analysisNotes.push({
            label: "Singularidad Cognitiva",
            styleType: "Estilo de gestión personal - Enfoque Destacado",
            consequence: "Tu mente conecta ideas de formas inusuales, originales y abstractas. Tienes una forma muy particular de ver el mundo, priorizando la imaginación y la creatividad.",
            reflection: "¿Cómo logras que esta forma tan rica de ver el mundo te ayude a resolver problemas prácticos del día a día?"
        });
    } else if (indices.singularidadCognitiva >= 0.35) {
        analysisNotes.push({
            label: "Singularidad Cognitiva",
            styleType: "Estilo de gestión personal - Enfoque Moderado",
            consequence: "Logras combinar un sentido práctico y convencional con visiones creativas y originales ante los desafíos.",
            reflection: "¿Cómo equilibras tu lado realista con tus destellos de originalidad para resolver problemas?"
        });
    } else {
        analysisNotes.push({
            label: "Singularidad Cognitiva",
            styleType: "Estilo de gestión personal - Enfoque Atenuado",
            consequence: "Prefieres centrarte en hechos reales, datos tangibles y soluciones directas. Tu comunicación y decisiones se caracterizan por ser claras y funcionales.",
            reflection: "¿Cómo te ayuda este enfoque práctico a resolver situaciones complejas con rapidez y sencillez?"
        });
    }

    return {
        sums,
        indices,
        variances,
        globalVariance,
        clasificaciones: {
            reactividadEmocional: getClasificacion(indices.reactividadEmocional),
            estiloConexion: getClasificacion(indices.estiloConexion),
            gestionAsertividad: getClasificacion(indices.gestionAsertividad),
            ritmoEjecucion: getClasificacion(indices.ritmoEjecucion),
            singularidadCognitiva: getClasificacion(indices.singularidadCognitiva)
        },
        dynamicInsights,
        analysisNotes
    };
};


// SVG Cognitive Radar Chart Component
const CognitiveRadar = ({ dimensions }) => {
    const cx = 150;
    const cy = 150;
    const r = 85;
    
    const axes = [
        { name: 'Visuoespacial', key: 'visuospatial', angle: -Math.PI / 2, align: 'middle', dy: -12, dx: 0 },
        { name: 'Inductiva', key: 'inductive', angle: 0, align: 'start', dy: 4, dx: 12 },
        { name: 'Secuencial', key: 'sequential', angle: Math.PI / 2, align: 'middle', dy: 18, dx: 0 },
        { name: 'Verbal', key: 'verbal', angle: Math.PI, align: 'end', dy: 4, dx: -12 }
    ];
    
    const levels = [0.25, 0.5, 0.75, 1.0];
    
    const pointsStr = axes.map(axis => {
        const value = (dimensions[axis.key] || 0) / 100;
        const x = cx + r * value * Math.cos(axis.angle);
        const y = cy + r * value * Math.sin(axis.angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <svg width="340" height="320" className="overflow-visible">
                <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
                        <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                    </radialGradient>
                </defs>
                
                <circle cx={cx} cy={cy} r={r} fill="url(#radarGlow)" />
                
                {levels.map((level, idx) => {
                    const polyPoints = axes.map(axis => {
                        const x = cx + r * level * Math.cos(axis.angle);
                        const y = cy + r * level * Math.sin(axis.angle);
                        return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                        <polygon 
                            key={idx} 
                            points={polyPoints} 
                            fill="none" 
                            stroke="rgba(255,255,255,0.06)" 
                            strokeWidth="1" 
                            strokeDasharray={idx === 3 ? "none" : "3,3"}
                        />
                    );
                })}
                
                {levels.map((level, idx) => {
                    const x = cx;
                    const y = cy - r * level;
                    return (
                        <text 
                            key={idx} 
                            x={x + 6} 
                            y={y + 3} 
                            fill="rgba(255,255,255,0.2)" 
                            className="text-[8px] font-mono font-bold"
                        >
                            {level * 100}%
                        </text>
                    );
                })}
                
                {axes.map((axis, idx) => {
                    const x2 = cx + r * Math.cos(axis.angle);
                    const y2 = cy + r * Math.sin(axis.angle);
                    return (
                        <line 
                            key={idx} 
                            x1={cx} 
                            y1={cy} 
                            x2={x2} 
                            y2={y2} 
                            stroke="rgba(255,255,255,0.12)" 
                            strokeWidth="1.5"
                        />
                    );
                })}
                
                <polygon 
                    points={pointsStr} 
                    fill="rgba(16, 185, 129, 0.22)" 
                    stroke="rgba(16, 185, 129, 0.85)" 
                    strokeWidth="2.5" 
                    className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />
                
                {axes.map((axis, idx) => {
                    const value = (dimensions[axis.key] || 0) / 100;
                    const x = cx + r * value * Math.cos(axis.angle);
                    const y = cy + r * value * Math.sin(axis.angle);
                    return (
                        <circle 
                            key={idx} 
                            cx={x} 
                            cy={y} 
                            r="4.5" 
                            fill="#10b981" 
                            stroke="#ffffff" 
                            strokeWidth="1.5"
                        />
                    );
                })}
                
                {axes.map((axis, idx) => {
                    const x = cx + (r + 14) * Math.cos(axis.angle);
                    const y = cy + (r + 14) * Math.sin(axis.angle);
                    return (
                        <text 
                            key={idx} 
                            x={x + axis.dx} 
                            y={y + axis.dy} 
                            textAnchor={axis.align}
                            fill="#94a3b8" 
                            className="text-[10px] font-bold uppercase tracking-wider font-sans"
                        >
                            {axis.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

const PsychologistDashboard = ({ onClose }) => {
    const [patients, setPatients] = useState([]);
    const [currentModule, setCurrentModule] = useState('DASHBOARD'); // DASHBOARD, PROFILE
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('BIOGRAPHIC'); // BIOGRAPHIC, PHENOMENOLOGICAL, PID5, ICAR16, CANVAS, SUMMARY
    const [privateNotes, setPrivateNotes] = useState('');

    // === CANVAS ENGINE STATE ===
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [draggingNode, setDraggingNode] = useState(null);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [time, setTime] = useState(0);

    // === CLINICAL TRACKING STATE ===
    const [clinicianNotes, setClinicianNotes] = useState({});
    const [patientVideos, setPatientVideos] = useState({});
    const [bioMetadata, setBioMetadata] = useState({});
    const [phenomVideos, setPhenomVideos] = useState({});
    const [phenomMetadata, setPhenomMetadata] = useState({});

    // === ICAR TRACKING STATE ===
    const [expandedIcarQuestion, setExpandedIcarQuestion] = useState(null);
    const [zoomImage, setZoomedImage] = useState(null);
    const [icarAnswers, setIcarAnswers] = useState({});
    const [icarDwellTimes, setIcarDwellTimes] = useState({});
    const [icarChanges, setIcarChanges] = useState({});
    const [icarVideos, setIcarVideos] = useState({});
    const [selectedVersion, setSelectedVersion] = useState(1);
    const [totalVersions, setTotalVersions] = useState(1);

    // Pre-populate mock PID-5 answers if a patient exists but doesn't have PID-5 answers
    useEffect(() => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('oasis_icar_answers_')) {
                const username = key.replace('oasis_icar_answers_', '');
                const pidKey = `oasis_pid_answers_${username}`;
                if (!localStorage.getItem(pidKey)) {
                    const mockPidAnswers = {
                        1: 3, 2: 3, 3: 2, 4: 2, 5: 3,
                        6: 2, 7: 3, 8: 2, 9: 2, 10: 2,
                        11: 0, 12: 1, 13: 0, 14: 1, 15: 0,
                        16: 0, 17: 0, 18: 1, 19: 1, 20: 0,
                        21: 0, 22: 0, 23: 1, 24: 0, 25: 0
                    };
                    localStorage.setItem(pidKey, JSON.stringify(mockPidAnswers));
                }
            }
        }
    }, []);

    // Load Patient Profiles dynamically based on real localStorage data and backend users
    const loadPatients = async () => {
        const patientsMap = {};
        const cleanUsername = (keyName, prefix) => {
            let name = keyName.replace(prefix, '');
            name = name.replace(/_v\d+$/, '');
            return name;
        };
        
        // 1. Initial list from local storage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('oasis_bio_transcriptions_')) {
                const username = cleanUsername(key, 'oasis_bio_transcriptions_');
                patientsMap[username] = { name: username };
            } else if (key.startsWith('oasis_phenom_qualitative_')) {
                const username = cleanUsername(key, 'oasis_phenom_qualitative_');
                patientsMap[username] = { name: username };
            } else if (key.startsWith('oasis_pid_answers_')) {
                const username = cleanUsername(key, 'oasis_pid_answers_');
                patientsMap[username] = { name: username };
            } else if (key.startsWith('oasis_icar_answers_')) {
                const username = cleanUsername(key, 'oasis_icar_answers_');
                patientsMap[username] = { name: username };
            }
        }
        
        const currentUser = localStorage.getItem('oasis_user');
        if (currentUser) {
            patientsMap[currentUser] = patientsMap[currentUser] || { name: currentUser };
        }

        // 2. Load all registered users from the backend
        try {
            const res = await fetch(`${API_URL}/api/oasis/users`);
            if (res.ok) {
                const backendUsers = await res.json();
                backendUsers.forEach(u => {
                    if (u.username) {
                        patientsMap[u.username] = {
                            name: u.username,
                            fullName: u.fullName || '',
                            age: u.age || null
                        };
                        
                        // Dynamically sync backend clinical data into local storage so it is available locally!
                        if (u.clinicalData) {
                            Object.keys(u.clinicalData).forEach(key => {
                                localStorage.setItem(key, u.clinicalData[key]);
                            });
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Error loading users from backend database:", err);
        }
        
        const list = Object.keys(patientsMap).map(username => {
            let bioTranscripts = null;
            try {
                bioTranscripts = JSON.parse(localStorage.getItem('oasis_bio_transcriptions_' + username));
            } catch(e) {}
            
            let phenomQual = null;
            try {
                phenomQual = JSON.parse(localStorage.getItem('oasis_phenom_qualitative_' + username));
            } catch(e) {}
            
            let pidAnswers = null;
            try {
                pidAnswers = JSON.parse(localStorage.getItem('oasis_pid_answers_' + username));
            } catch(e) {}
            
            let icarAnswers = null;
            try {
                icarAnswers = JSON.parse(localStorage.getItem('oasis_icar_answers_' + username));
            } catch(e) {}
            
            let icarDwell = null;
            try {
                icarDwell = JSON.parse(localStorage.getItem('oasis_icar_dwell_' + username));
            } catch(e) {}
            
            let icarChanges = null;
            try {
                icarChanges = JSON.parse(localStorage.getItem('oasis_icar_changes_' + username));
            } catch(e) {}
            
            let icarScore = 0;
            let icarTotal = 0;
            if (icarAnswers && Object.keys(icarAnswers).length > 0) {
                icarTotal = icarQuestions.length;
                icarQuestions.forEach(q => {
                    if (icarAnswers[q.question_number] === q.correct_answer) {
                        icarScore++;
                    }
                });
            }
            
            const pid5Data = getPid5Domains(pidAnswers);
            const savedStatus = localStorage.getItem(`oasis_patient_status_${username}`) || 'Pendiente de revisión';
            
            return {
                id: 'PT-' + username.toUpperCase(),
                name: username,
                date: new Date().toISOString().split('T')[0],
                status: savedStatus,
                phenomenology: phenomQual ? {
                    transcripts: {
                        "Antecedentes de Origen": phenomQual.antecedentes_origen || "",
                        "Experiencia de Insuficiencia": phenomQual.experiencia_insuficiencia || "",
                        "Temporalidad Vivida": phenomQual.temporalidad_vivida || "",
                        "Premisa de Realidad": phenomQual.premisa_realidad || ""
                    }
                } : null,
                clinicalInterview: bioTranscripts ? {
                    transcripts: bioTranscripts
                } : null,
                pid5: pid5Data,
                icar16: icarAnswers && Object.keys(icarAnswers).length > 0 ? {
                    score: icarScore,
                    total: icarTotal,
                    dimensions: getIcarDimensions(icarAnswers),
                    alerts: getIcarAlerts(icarDwell, icarChanges),
                    duration: 'Completo',
                    details: icarAnswers
                } : null
            };
        });
        
        setPatients(list);
    };

    useEffect(() => {
        loadPatients();
    }, [currentModule]);

    // Compute activePatientData dynamically based on selectedPatient and selectedVersion
    const activePatientData = useMemo(() => {
        if (!selectedPatient) return null;
        
        const username = selectedPatient.name;
        const suffix = selectedVersion > 1 ? `_v${selectedVersion}` : '';
        
        let bioTranscripts = null;
        try {
            bioTranscripts = JSON.parse(localStorage.getItem('oasis_bio_transcriptions_' + username + suffix));
        } catch(e) {}
        
        let phenomQual = null;
        try {
            phenomQual = JSON.parse(localStorage.getItem('oasis_phenom_qualitative_' + username + suffix));
        } catch(e) {}
        
        let pidAnswers = null;
        try {
            pidAnswers = JSON.parse(localStorage.getItem('oasis_pid_answers_' + username + suffix));
        } catch(e) {}
        
        let icarAnswersLocal = null;
        try {
            icarAnswersLocal = JSON.parse(localStorage.getItem('oasis_icar_answers_' + username + suffix));
        } catch(e) {}
        
        let icarDwell = null;
        try {
            icarDwell = JSON.parse(localStorage.getItem('oasis_icar_dwell_' + username + suffix));
        } catch(e) {}
        
        let icarChangesLocal = null;
        try {
            icarChangesLocal = JSON.parse(localStorage.getItem('oasis_icar_changes_' + username + suffix));
        } catch(e) {}

        let icarScore = 0;
        let icarTotal = 16;
        if (icarAnswersLocal) {
            icarQuestions.forEach(q => {
                if (icarAnswersLocal[q.question_number] === q.correct_answer) {
                    icarScore++;
                }
            });
        }
        
        const pid5Data = getPid5Domains(pidAnswers);
        const savedStatus = localStorage.getItem(`oasis_patient_status_${username}`) || 'Pendiente de revisión';
        
        return {
            id: 'PT-' + username.toUpperCase(),
            name: username,
            date: new Date().toISOString().split('T')[0],
            status: savedStatus,
            phenomenology: phenomQual ? {
                transcripts: {
                    "Antecedentes de Origen": phenomQual.antecedentes_origen || "",
                    "Experiencia de Insuficiencia": phenomQual.experiencia_insuficiencia || "",
                    "Temporalidad Vivida": phenomQual.temporalidad_vivida || "",
                    "Premisa de Realidad": phenomQual.premisa_realidad || ""
                }
            } : null,
            clinicalInterview: bioTranscripts ? {
                transcripts: bioTranscripts
            } : null,
            pid5: pid5Data,
            icar16: icarAnswersLocal && Object.keys(icarAnswersLocal).length > 0 ? {
                score: icarScore,
                total: icarTotal,
                dimensions: getIcarDimensions(icarAnswersLocal),
                alerts: getIcarAlerts(icarDwell, icarChangesLocal),
                duration: 'Completo',
                details: icarAnswersLocal
            } : null
        };
    }, [selectedPatient, selectedVersion]);

    useEffect(() => {
        if (selectedPatient) {
            const tot = parseInt(localStorage.getItem('oasis_total_versions_' + selectedPatient.name)) || 1;
            setTotalVersions(tot);
            setSelectedVersion(tot);
        }
    }, [selectedPatient]);

    useEffect(() => {
        let active = true;
        let activeUrls = [];
        if (selectedPatient) {
            const suffix = selectedVersion > 1 ? `_v${selectedVersion}` : '';
            
            const loadPatientDetails = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/oasis/clinical-data?user=${selectedPatient.name}`);
                    if (res.ok && active) {
                        const clinicalData = await res.json();
                        Object.keys(clinicalData).forEach(key => {
                            localStorage.setItem(key, clinicalData[key]);
                        });
                    }
                } catch (e) {
                    console.error("Error fetching latest patient clinical data from backend:", e);
                }

                if (!active) return;

                try {
                    setIcarAnswers(JSON.parse(localStorage.getItem('oasis_icar_answers_' + selectedPatient.name + suffix)) || {});
                    setIcarDwellTimes(JSON.parse(localStorage.getItem('oasis_icar_dwell_' + selectedPatient.name + suffix)) || {});
                    setIcarChanges(JSON.parse(localStorage.getItem('oasis_icar_changes_' + selectedPatient.name + suffix)) || {});
                    setClinicianNotes(JSON.parse(localStorage.getItem(`oasis_clinician_notes_${selectedPatient.name}`)) || {});
                    setPrivateNotes(localStorage.getItem(`oasis_private_notes_${selectedPatient.name}`) || '');
                    setBioMetadata(JSON.parse(localStorage.getItem('oasis_bio_metadata_' + selectedPatient.name + suffix)) || {});
                    setPhenomMetadata(JSON.parse(localStorage.getItem('oasis_phenom_metadata_' + selectedPatient.name + suffix)) || {});

                    // Load all observation videos in a single IndexedDB transaction to prevent collision/stale race conditions
                getObservations().then(obs => {
                    if (!active) return;

                    // Helper to safely convert and create Object URL for a blob/file
                    const mapVideos = (videosObj) => {
                        const urls = {};
                        if (!videosObj) return urls;
                        
                        Object.entries(videosObj).forEach(([key, blob]) => {
                            if (blob) {
                                try {
                                    if (typeof blob === 'string') {
                                        let finalUrl = blob;
                                        if (blob.startsWith('/uploads/')) {
                                            finalUrl = `${API_URL}${blob}`;
                                        } else if (blob.startsWith('/')) {
                                            finalUrl = `${API_URL}${blob}`;
                                        }
                                        urls[key] = finalUrl; // Use server URL string directly
                                        return;
                                    }
                                    let finalBlob = blob;
                                    // Handle serialized representation if it got stored as standard object or buffer
                                    if (!(blob instanceof Blob) && typeof blob === 'object') {
                                        if (blob.buffer) {
                                            finalBlob = new Blob([blob.buffer], { type: blob.type || 'video/webm' });
                                        } else if (blob.data) {
                                            finalBlob = new Blob([blob.data], { type: blob.type || 'video/webm' });
                                        }
                                    }
                                    
                                    const url = URL.createObjectURL(finalBlob);
                                    urls[key] = url;
                                    activeUrls.push(url);
                                } catch (e) {
                                    console.error(`Error generating video Object URL for key ${key}:`, e);
                                }
                            }
                        });
                        return urls;
                    };

                    // 1. Biographic Interview
                    let foundBio = obs.find(o => o.id === `bio_videos_${selectedPatient.name}${suffix}`);
                    if (!foundBio) {
                        try {
                            const cached = localStorage.getItem(`oasis_session_videos_bio_videos_${selectedPatient.name}${suffix}`);
                            if (cached) foundBio = JSON.parse(cached);
                        } catch (e) {}
                    }
                    setPatientVideos(mapVideos(foundBio?.videos));

                    // 2. Phenomenology
                    let foundPhenom = obs.find(o => o.id === `phenom_videos_${selectedPatient.name}${suffix}`);
                    if (!foundPhenom) {
                        try {
                            const cached = localStorage.getItem(`oasis_session_videos_phenom_videos_${selectedPatient.name}${suffix}`);
                            if (cached) foundPhenom = JSON.parse(cached);
                        } catch (e) {}
                    }
                    setPhenomVideos(mapVideos(foundPhenom?.videos));

                    // 3. ICAR-16
                    let foundIcar = obs.find(o => o.id === `icar_videos_${selectedPatient.name}${suffix}`);
                    if (!foundIcar) {
                        try {
                            const cached = localStorage.getItem(`oasis_session_videos_icar_videos_${selectedPatient.name}${suffix}`);
                            if (cached) foundIcar = JSON.parse(cached);
                        } catch (e) {}
                    }
                    setIcarVideos(mapVideos(foundIcar?.videos));

                }).catch(err => {
                    console.error("Error loading patient observation videos:", err);
                    if (active) {
                        setPatientVideos({});
                        setPhenomVideos({});
                        setIcarVideos({});
                    }
                });
                
                const savedNodes = localStorage.getItem(`oasis_canvas_nodes_${selectedPatient.name}`);
                const savedEdges = localStorage.getItem(`oasis_canvas_edges_${selectedPatient.name}`);
                
                if (savedNodes) {
                    setNodes(JSON.parse(savedNodes));
                } else {
                    setNodes([{
                        id: 'root-1',
                        type: 'CONTEXT',
                        x: 150,
                        y: 150,
                        label: 'Contexto del Paciente',
                        observations: '',
                        width: 128, height: 128
                    }]);
                }
                if (savedEdges) {
                    setEdges(JSON.parse(savedEdges));
                } else {
                    setEdges([]);
                }
            } catch(e) {
                console.error("Error loading patient configuration: ", e);
            }
            };
            loadPatientDetails();
        } else {
            setPatientVideos({});
            setPhenomVideos({});
            setIcarVideos({});
            setBioMetadata({});
            setPhenomMetadata({});
        }

        return () => {
            active = false;
            activeUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [selectedPatient, selectedVersion]);

    const handleSaveClinicianNote = (clipId, value) => {
        const updated = { ...clinicianNotes, [clipId]: value };
        setClinicianNotes(updated);
        if (selectedPatient) {
            localStorage.setItem(`oasis_clinician_notes_${selectedPatient.name}`, JSON.stringify(updated));
        }
    };

    // Save canvas nodes and edges to localStorage in real-time
    useEffect(() => {
        if (selectedPatient && nodes.length > 0) {
            localStorage.setItem(`oasis_canvas_nodes_${selectedPatient.name}`, JSON.stringify(nodes));
            localStorage.setItem(`oasis_canvas_edges_${selectedPatient.name}`, JSON.stringify(edges));
        }
    }, [nodes, edges, selectedPatient]);

    // Canvas animation loop
    useEffect(() => {
        let frame;
        if (activeTab === 'CANVAS') {
            const loop = () => {
                setTime(Date.now() * 0.0025);
                frame = requestAnimationFrame(loop);
            };
            frame = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(frame);
    }, [activeTab]);

    const handleCanvasMouseMove = (e) => {
        if (isPanning) {
            setPan({ x: pan.x + e.movementX, y: pan.y + e.movementY });
        } else if (draggingNode) {
            setNodes(nodes.map(n => 
                n.id === draggingNode ? { ...n, x: n.x + e.movementX, y: n.y + e.movementY } : n
            ));
        }
        if (connectingFrom) {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    const handleCanvasMouseUp = () => {
        setDraggingNode(null);
        setIsPanning(false);
        setConnectingFrom(null);
    };

    const handleNodeMouseDown = (e, id) => {
        e.stopPropagation();
        setDraggingNode(id);
        setSelectedNode(id);
    };

    const handleConnectorMouseDown = (e, id) => {
        e.stopPropagation();
        setConnectingFrom(id);
        const node = nodes.find(n => n.id === id);
        setMousePos({ x: node.x + pan.x + node.width / 2, y: node.y + pan.y + node.height / 2 });
    };

    const handleNodeMouseUp = (e, id) => {
        e.stopPropagation();
        if (connectingFrom && connectingFrom !== id) {
            if (!edges.some(edge => edge.source === connectingFrom && edge.target === id)) {
                setEdges([...edges, { source: connectingFrom, target: id }]);
            }
        }
        setConnectingFrom(null);
        setDraggingNode(null);
        setSelectedNode(id);
    };

    const spawnNode = (parentId, type) => {
        const parent = nodes.find(n => n.id === parentId);
        const newId = `node-${Date.now()}`;
        let width = 128, height = 128;
        if (type === 'CRITICAL_SYMPTOM') { width = 192; height = 96; }
        else if (type === 'IMPACT_CHAIN') { width = 192; height = 80; }
        else if (type === 'MACRO_MECHANISM') { width = 160; height = 160; }
        else if (type === 'INTERNAL_STATE') { width = 112; height = 112; }
        
        setNodes([...nodes, {
            id: newId,
            type,
            x: parent.x + parent.width + 80,
            y: parent.y + (Math.random() - 0.5) * 80,
            label: 'NUEVO NODO',
            observations: '',
            width, height
        }]);
        setEdges([...edges, { source: parentId, target: newId }]);
        setSelectedNode(newId);
    };

    const deleteNode = (id) => {
        setNodes(nodes.filter(n => n.id !== id));
        setEdges(edges.filter(e => e.source !== id && e.target !== id));
        if (selectedNode === id) setSelectedNode(null);
    };

    const renderNodeShape = (node) => {
        const isSelected = selectedNode === node.id;
        const ringClass = isSelected ? 'ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-[#09090b]' : '';
        
        const typeLabels = {
            'CONTEXT': 'CONTEXTO INICIAL',
            'INTERNAL_STATE': 'ESTADO INTERNO',
            'MACRO_MECHANISM': 'MACRO MECANISMO',
            'CRITICAL_SYMPTOM': 'SÍNTOMA CRÍTICO',
            'IMPACT_CHAIN': 'CADENA DE IMPACTO'
        };

        const labelBadge = <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">{typeLabels[node.type]}</span>;

        if (node.type === 'CONTEXT') {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    {labelBadge}
                    <div className={`w-32 h-32 flex items-center justify-center rotate-45 bg-sky-950/30 border border-sky-500/40 hover:bg-sky-900/40 shadow-lg ${ringClass} transition-colors rounded-[1rem]`}>
                        <div className="-rotate-45 text-center p-2 flex items-center justify-center w-full h-full">
                            <textarea 
                                value={node.label} 
                                onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n))}
                                className="bg-transparent border-none text-sky-200 text-[10px] font-bold uppercase tracking-wider text-center w-24 h-24 resize-none outline-none overflow-hidden pt-6 font-mono" 
                            />
                        </div>
                    </div>
                </div>
            );
        }
        if (node.type === 'INTERNAL_STATE' || node.type === 'MACRO_MECHANISM') {
            const size = node.type === 'MACRO_MECHANISM' ? 'w-36 h-36' : 'w-28 h-28';
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    {labelBadge}
                    <div className={`${size} flex items-center justify-center rounded-full bg-emerald-950/30 border border-emerald-500/40 hover:bg-emerald-900/40 shadow-lg ${ringClass} transition-colors`}>
                        <textarea 
                            value={node.label} 
                            onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n))}
                            className="bg-transparent border-none text-emerald-200 text-[10px] font-bold uppercase tracking-wider text-center w-3/4 h-3/4 resize-none outline-none overflow-hidden pt-8 font-mono" 
                        />
                    </div>
                </div>
            );
        }
        if (node.type === 'CRITICAL_SYMPTOM') {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    {labelBadge}
                    <div className={`w-44 h-20 flex items-center justify-center rounded-2xl bg-red-950/30 border border-red-500/40 hover:bg-red-900/40 shadow-lg ${ringClass} transition-colors`}>
                        <textarea 
                            value={node.label} 
                            onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n))}
                            className="bg-transparent border-none text-red-200 text-[10px] font-bold uppercase tracking-wider text-center w-[90%] h-3/4 resize-none outline-none overflow-hidden pt-4 font-mono" 
                        />
                    </div>
                </div>
            );
        }
        if (node.type === 'IMPACT_CHAIN') {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    {labelBadge}
                    <div className={`w-44 h-16 flex items-center justify-center rounded-full bg-zinc-900/80 border border-zinc-500 hover:bg-zinc-800 shadow-lg ${ringClass} transition-colors`}>
                        <textarea 
                            value={node.label} 
                            onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n))}
                            className="bg-transparent border-none text-zinc-300 text-[10px] font-bold uppercase tracking-wider text-center w-3/4 h-full resize-none outline-none overflow-hidden pt-4 font-mono" 
                        />
                    </div>
                </div>
            );
        }
    };

    const renderTestStimulusDiagram = (q) => {
        const qNum = q.question_number;
        if (qNum === 1) return null;
        
        if (qNum === 2 || qNum === 4 || qNum === 5 || qNum === 7 || qNum === 8 || qNum === 11 || qNum === 12 || qNum === 15) {
            const imageUrl = `/icar16/q${qNum}.png`;
            return (
                <div 
                    onClick={() => setZoomedImage(imageUrl)}
                    className="w-full h-36 bg-zinc-950/80 border border-white/5 rounded-2xl p-2 flex items-center justify-center shadow-inner overflow-hidden cursor-zoom-in group hover:border-white/20 transition-all duration-300 relative"
                >
                    <img
                        src={imageUrl}
                        alt={`Reactivo ${qNum}`}
                        className="max-h-full max-w-full object-contain opacity-90 group-hover:scale-[1.03] transition-all duration-300"
                        style={{ filter: 'invert(1)' }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 text-white/50 text-[9px] px-2 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none uppercase">
                        Ampliar
                    </div>
                </div>
            );
        }
        return null;
    };

    // Save observation to IndexedDB and update patient status
    const handlePublishFormulation = async () => {
        if (!selectedPatient) return;
        
        const formulationSession = {
            id: `formulation_${selectedPatient.name}_${Date.now()}`,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            date: new Date().toLocaleString(),
            nodes: nodes,
            edges: edges,
            clinicianNotes: clinicianNotes,
            privateNotes: privateNotes,
            status: 'Publicado'
        };
        
        try {
            await saveObservation(formulationSession);
            localStorage.setItem(`oasis_patient_status_${selectedPatient.name}`, 'Publicado');
            alert("Formulación clínica guardada y firmada en el registro del paciente.");
            setCurrentModule('DASHBOARD');
            setSelectedPatient(null);
        } catch(err) {
            console.error("Error saving clinical formulation:", err);
            alert("Fallo al guardar formulación: " + err.message);
        }
    };

    // --- Módulo 1: Centro de Mando ---
    const renderDashboard = () => {
        const filtered = patients.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="w-full h-full p-8 overflow-y-auto animate-in fade-in zoom-in-95 duration-500 relative bg-[#060607]">
                <button onClick={onClose} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2.5 rounded-full border border-white/5">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-10">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Hexagon className="text-emerald-500 w-8 h-8" />
                        Centro de Mando Clínico
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-xs uppercase tracking-widest">Observación Científica de la Consciencia</p>
                </div>

                <div className="flex items-center justify-between mb-6 gap-4">
                    <div className="relative w-1/3 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar identidad evaluada..."
                            className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-dashed border-white/10 p-16 rounded-[2.5rem] text-center flex flex-col items-center justify-center gap-4 min-h-[300px] backdrop-blur-sm">
                        <Activity className="w-12 h-12 text-zinc-600 animate-pulse" />
                        <div>
                            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Sin Evaluaciones</h4>
                            <p className="text-xs text-zinc-600 mt-1 max-w-sm">No se encontraron identidades con datos psicométricos registrados en este sistema.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900/10 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-zinc-950/40">
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">Identidad / Aura</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">Fecha Registro</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">Estado Clínico</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(patient => (
                                    <tr 
                                        key={patient.id} 
                                        onClick={() => { setSelectedPatient(patient); setCurrentModule('PROFILE'); setActiveTab('BIOGRAPHIC'); }}
                                        className="border-b border-white/5 hover:bg-white/[0.01] cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white italic">@{patient.name}</div>
                                                    <div className="text-zinc-600 text-[10px] font-mono">{patient.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-zinc-400 font-mono">{patient.date}</td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                                ${patient.status === 'Pendiente de revisión' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}
                                                ${patient.status === 'Publicado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
                                                ${patient.status === 'Editando' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : ''}
                                            `}>
                                                {patient.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <ChevronRight className="inline-block w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    // --- Tab Renderers ---
    const renderBiographicTab = () => {
        const transcripts = activePatientData?.clinicalInterview?.transcripts || {};
        const qKeys = Object.keys(transcripts);
        
        const bioQuestionsList = [
            { id: "0", title: "Motivo de Consulta (El Presente)", question: "Para empezar, vamos a situarnos: ¿Qué es eso que hoy sientes que merece ser observado? Cuéntame sobre esa situación o estado que, al pensar en él, sientes que es el eje central de tu consulta en este momento." },
            { id: "1", title: "Impacto Fenomenológico (El Cuerpo)", question: "Cuando este problema aparece, ¿cómo se siente en tu cuerpo? ¿Qué pensamientos suelen acompañarlo?" },
            { id: "2", title: "Evitación Experiencial (El Costo)", question: "¿Qué has intentado hacer hasta ahora para evitar o dejar de sentir esto? ¿Sientes que esta lucha te está quitando tiempo o energía?" },
            { id: "3", title: "Contexto Vital (Relaciones)", question: "¿Con quién vives? ¿Cómo describirías la relación con las personas más significativas en tu vida actualmente?" },
            { id: "4", title: "Contexto Vital (Esfera Productiva)", question: "¿A qué te dedicas y cómo te sientes en tu entorno académico o laboral?" },
            { id: "5", title: "Direcciones Vitales (El Futuro)", question: "Si este problema desapareciera mañana por arte de magia... ¿qué harías diferente? ¿Qué áreas de tu vida has dejado en pausa?" },
            { id: "6", title: "Identidad de Afrontamiento (El Ser)", question: "¿Qué tipo de persona te gustaría ser frente a las dificultades que estás atravesando?" }
        ];

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-black text-white italic">Narrativa Biográfica (Parte I)</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">Historial discursivo estructurado extraído de la entrevista verbal</p>
                </div>
                
                {qKeys.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-2xl text-center text-zinc-500 text-xs italic font-mono uppercase tracking-widest">
                        Sin transcripción disponible. El usuario no ha completado la entrevista.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {bioQuestionsList.map((q) => {
                            const answer = transcripts[q.id] || transcripts[q.title];
                            if (!answer) return null;
                            const videoUrl = patientVideos[q.id];
                            const meta = bioMetadata[q.id];
                            
                            return (
                                <div key={q.id} className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
                                    <div className="flex flex-col border-b border-white/5 pb-3">
                                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider font-mono mb-1">{q.title}</span>
                                        <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                                            <strong className="text-zinc-500 font-bold uppercase text-[9px] font-mono block">Pregunta:</strong>
                                            "{q.question}"
                                        </p>
                                    </div>
                                    <div className="p-4 bg-zinc-950/45 border border-white/5 rounded-2xl text-xs text-zinc-300 italic leading-relaxed font-sans">
                                        <strong className="text-zinc-500 font-bold uppercase text-[9px] font-mono block not-italic mb-1">Respuesta del Paciente:</strong>
                                        "{answer}"
                                    </div>

                                    {/* Video & Telemetry Grid */}
                                    {videoUrl ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <video src={videoUrl} controls className="w-full rounded-2xl border border-white/5 bg-zinc-950 aspect-video shadow-lg" />
                                            </div>
                                            <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-center space-y-2">
                                                <h4 className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono">Parámetros de Captura</h4>
                                                {meta ? (
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-zinc-500 block text-[9px] uppercase font-mono">Tiempo Dwell:</span>
                                                            <span className="text-white font-mono font-black">{meta.dwellTime}s</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-zinc-500 block text-[9px] uppercase font-mono">Pausas:</span>
                                                            <span className="text-white font-mono font-black">{meta.pauses}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-zinc-500 block text-[9px] uppercase font-mono">Palabras:</span>
                                                            <span className="text-white font-mono font-black">{meta.words}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-zinc-500 block text-[9px] uppercase font-mono">Velocidad:</span>
                                                            <span className="text-white font-mono font-black">
                                                                {meta.dwellTime > 0 
                                                                    ? `${Math.round((meta.words / meta.dwellTime) * 60)} ppm` 
                                                                    : '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-zinc-600 font-mono uppercase">Sin datos de telemetría disponibles.</div>
                                                )}
                                            </div>
                                        </div>
                                    ) : meta ? (
                                        <div className="flex gap-6 bg-zinc-950/20 border border-white/5 rounded-2xl p-4 text-xs font-mono mt-4">
                                            <div>
                                                <span className="text-zinc-500 uppercase text-[9px]">Tiempo Dwell: </span>
                                                <strong className="text-white font-bold">{meta.dwellTime}s</strong>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500 uppercase text-[9px]">Pausas: </span>
                                                <strong className="text-white font-bold">{meta.pauses}</strong>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500 uppercase text-[9px]">Palabras: </span>
                                                <strong className="text-white font-bold">{meta.words}</strong>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="space-y-2 pt-2">
                                        <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono">Perspectiva Clínica / Observación</label>
                                        <textarea
                                            value={clinicianNotes[`bio_${q.id}`] || ''}
                                            onChange={(e) => handleSaveClinicianNote(`bio_${q.id}`, e.target.value)}
                                            placeholder="Escribe el análisis clínico sobre marcadores de lenguaje, pausas u otros síntomas vitales..."
                                            className="w-full h-20 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-950"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderPhenomenologicalTab = () => {
        const transcripts = activePatientData?.phenomenology?.transcripts || {};
        const hasData = Object.values(transcripts).some(x => x && x.trim().length > 0);

        const phenomQuestions = [
            { key: "Antecedentes de Origen", title: "Antecedentes de Origen", desc: "¿Qué estaba pasando en tu vida cuando apareció este problema por primera vez?", id: "0" },
            { key: "Experiencia de Insuficiencia", title: "Experiencia de Insuficiencia", desc: "¿Cómo se manifiesta la sensación de no ser suficiente en tu día a día?", id: "1" },
            { key: "Temporalidad Vivida", title: "Temporalidad Vivida", desc: "¿Cómo se siente el paso del tiempo cuando te encuentras abrumado?", id: "2" },
            { key: "Premisa de Realidad", title: "Premisa de Realidad", desc: "¿Qué ideas o certezas cambian en ti cuando estás en crisis?", id: "3" }
        ];

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-black text-white italic">Diagnóstico Fenomenológico (Parte II)</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">Estructuración existencial cualitativa del self</p>
                </div>
                
                {!hasData ? (
                    <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-2xl text-center text-zinc-500 text-xs italic font-mono uppercase tracking-widest">
                        Sin diagnóstico fenomenológico disponible.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {phenomQuestions.map((q) => {
                            const answer = transcripts[q.key];
                            if (!answer) return null;
                            const videoUrl = phenomVideos[q.id];
                            const meta = phenomMetadata[q.id];

                            return (
                                <div key={q.key} className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-black uppercase text-purple-400 tracking-wider font-mono">{q.title}</div>
                                        <div className="text-[10px] text-zinc-500 italic">"{q.desc}"</div>
                                    </div>
                                    <div className="p-4 bg-zinc-950/45 border border-white/5 rounded-2xl text-xs text-zinc-300 italic leading-relaxed font-sans">
                                        "{answer}"
                                    </div>

                                    {/* Video & Telemetry Grid */}
                                    {videoUrl ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <video src={videoUrl} controls className="w-full rounded-2xl border border-white/5 bg-zinc-950 aspect-video shadow-lg" />
                                            </div>
                                            <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-center space-y-2">
                                                <h4 className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono">Parámetros de Captura</h4>
                                                {meta ? (
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-zinc-500 block text-[9px] uppercase font-mono">Tiempo Dwell:</span>
                                                            <span className="text-white font-mono font-black">{meta.dwellTime}s</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-zinc-500 block text-[9px] uppercase font-mono">Pausas:</span>
                                                            <span className="text-white font-mono font-black">{meta.pauses}</span>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <span className="text-zinc-500 block text-[9px] uppercase font-mono">Total Palabras:</span>
                                                            <span className="text-white font-mono font-black">{meta.words} palabras</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-zinc-600">Cargando telemetría...</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="space-y-2 pt-2">
                                        <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono">Notas Ontológico-Subjetivas</label>
                                        <textarea
                                            value={clinicianNotes[`phenom_${q.key}`] || ''}
                                            onChange={(e) => handleSaveClinicianNote(`phenom_${q.key}`, e.target.value)}
                                            placeholder="Observaciones sobre la construcción del tiempo, espacio existencial y realidad del paciente..."
                                            className="w-full h-20 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-950"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderPid5Tab = () => {
        const hasPid5 = !!activePatientData?.pid5;
        const suffix = selectedVersion > 1 ? `_v${selectedVersion}` : '';
        const rawAnswers = JSON.parse(localStorage.getItem('oasis_pid_answers_' + selectedPatient.name + suffix)) || {};

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-black text-white italic">Inventario PID-5 Breve (Parte III)</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">Cribado de dominios y rasgos patológicos de personalidad (DSM-5)</p>
                </div>
                
                {!hasPid5 ? (
                    <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-2xl text-center text-zinc-500 text-xs italic font-mono uppercase tracking-widest">
                        Inventario PID-5 pendiente de responder.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Mapeo de Dominios y Tensiones del PID-5 */}
                        {(() => {
                            const pidState = computePid5ClinicalState(rawAnswers);
                            if (!pidState) return null;

                            const nameMap = {
                                reactividadEmocional: "Reactividad Emocional",
                                estiloConexion: "Estilo de Conexión",
                                gestionAsertividad: "Gestión de la Asertividad",
                                ritmoEjecucion: "Ritmo de Ejecución",
                                singularidadCognitiva: "Singularidad Cognitiva"
                            };

                            // Generate the clinical JSON object structure requested
                            const clinJson = {
                                metadatos: {
                                    fecha: new Date().toISOString().split('T')[0],
                                    estabilidad_flujo: pidState.globalVariance > 0.85 ? "alta_variabilidad" : "ok",
                                    variabilidad_interna: pidState.globalVariance
                                },
                                vectores_de_estado: {
                                    V1_reactividad_emocional: pidState.indices.reactividadEmocional,
                                    V2_estilo_conexion: pidState.indices.estiloConexion,
                                    V3_gestion_asertividad: pidState.indices.gestionAsertividad,
                                    V4_ritmo_ejecucion: pidState.indices.ritmoEjecucion,
                                    V5_singularidad_cognitiva: pidState.indices.singularidadCognitiva
                                },
                                varianzas_locales: pidState.variances,
                                clasificaciones: {
                                    reactividad_emocional: pidState.clasificaciones.reactividadEmocional.label,
                                    estilo_conexion: pidState.clasificaciones.estiloConexion.label,
                                    gestion_asertividad: pidState.clasificaciones.gestionAsertividad.label,
                                    ritmo_ejecucion: pidState.clasificaciones.ritmoEjecucion.label,
                                    singularidad_cognitiva: pidState.clasificaciones.singularidadCognitiva.label
                                },
                                dinamicas_activas: pidState.dynamicInsights.map(d => ({
                                    nombre: d.title,
                                    discrepancia: d.discrepancy,
                                    consecuencia: d.consequence
                                }))
                            };

                            const promptMaestroText = `Actúa como un psicólogo clínico observador. Tu tarea es describir el estilo de vida y de toma de decisiones del individuo basándote en estos 5 vectores.

Valores de los vectores:
V1 (Reactividad Emocional): ${pidState.indices.reactividadEmocional}
V2 (Estilo de Conexión): ${pidState.indices.estiloConexion}
V3 (Gestión de la Asertividad): ${pidState.indices.gestionAsertividad}
V4 (Ritmo de Ejecución): ${pidState.indices.ritmoEjecucion}
V5 (Singularidad Cognitiva): ${pidState.indices.singularidadCognitiva}

Varianza Interna Global: ${pidState.globalVariance}

**Reglas para el análisis:**
1. **Lenguaje Humano:** Prohibido usar palabras como 'sistema', 'procesamiento', 'consumo', 'vector' o 'errático'. Usa palabras como 'persona', 'decisiones', 'estilo', 'forma de ser'.
2. **Análisis de mezcla:** No analices los elementos por separado. Describe cómo la mezcla de los 5 elementos crea una persona única.
3. **Humildad técnica:** Si detectas discrepancias en las respuestas, no las llames 'errores' o 'baja fiabilidad'. Llámalo 'complejidad' o 'flexibilidad'.
4. **Preguntas reales:** Las preguntas de reflexión deben ser preguntas que le harías a un amigo en una conversación profunda, no preguntas de test psicométrico. Ej: '¿Cómo manejas X situación?' en lugar de '¿Tu sistema prioriza X?'.
5. **Sin juicios:** No clasifiques; describe cómo la persona navega su mundo.

**Reglas para la sección de Dinámicas de Afrontamiento:**
- Identifica las 4 dinámicas: Evalúa qué tanto se inclina la persona hacia cada una.
- Tono clínico-humano: Explica la dinámica como una elección de vida, no como un fallo.
- Conexión profunda: No solo digas 'es así'. Explica el porqué basado en la mezcla de todos sus vectores (ej: 'Como tienes una alta Singularidad y una baja Reactividad, tu aislamiento no es por miedo, sino por el deseo de no interrumpir tu propio proceso mental').
- Pregunta de reflexión: Termina con una pregunta que invite a pensar profundamente, no a responder un formulario.`;

                            return (
                                <div className="space-y-6">
                                    {/* Capa 1 y Capa 2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* Capa 1: Estado de las Variables (Nivel Base) */}
                                        <div className="md:col-span-6 bg-zinc-900/20 border border-white/5 p-6 rounded-3xl space-y-4">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Capa 1: Estado de las Variables (Vectores)</h4>
                                                <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Intensidad de vectores normalizados (0.0 - 1.0) y variabilidad local</p>
                                            </div>

                                            <div className="space-y-4">
                                                {Object.entries(pidState.indices).map(([key, value]) => {
                                                    const label = nameMap[key] || key;
                                                    const clas = pidState.clasificaciones[key];
                                                    const localVariance = pidState.variances[key];
                                                    
                                                    let barColor = "bg-emerald-500";
                                                    if (value >= 0.65) barColor = "bg-violet-500";
                                                    else if (value >= 0.35) barColor = "bg-amber-500";

                                                    return (
                                                        <div key={key} className="space-y-1.5 bg-zinc-950/35 p-3 rounded-2xl border border-white/[0.02]">
                                                            <div className="flex justify-between items-center text-[10px] font-mono">
                                                                <span className="text-zinc-300 font-bold">{label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[7px] uppercase border ${clas.color}`}>
                                                                        {clas.label}
                                                                    </span>
                                                                    <span className="text-white font-black">{value.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                                                <div 
                                                                    className={`h-full ${barColor} transition-all duration-500`}
                                                                    style={{ width: `${value * 100}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex justify-between items-center text-[8px] text-zinc-600 font-mono">
                                                                <span>VARIANZA DE BLOQUE: {localVariance.toFixed(3)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Capa 2: Dinámicas de Afrontamiento */}
                                        <div className="md:col-span-6 bg-zinc-900/20 border border-white/5 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Capa 2: Dinámicas de Afrontamiento</h4>
                                                    <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Estrategias y recursos relacionales basados en la mezcla de perfiles (Δ ≥ 0.5)</p>
                                                </div>

                                                {/* Tensiones Estructurales del Sistema */}
                                                <div className="space-y-3 pb-4 border-b border-white/5">
                                                    <span className="text-[8px] font-mono font-black uppercase text-purple-400 tracking-[0.25em] block mb-2">Tensiones Estructurales (Fuerzas del Sistema)</span>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { name: "Tensión de Regulación (Reactividad vs Conexión)", val: parseFloat(Math.abs(pidState.indices.reactividadEmocional - pidState.indices.estiloConexion).toFixed(3)), label: "Regulación vs Conexión" },
                                                            { name: "Tensión de Procesamiento (Singularidad vs Ritmo)", val: parseFloat(Math.abs(pidState.indices.singularidadCognitiva - pidState.indices.ritmoEjecucion).toFixed(3)), label: "Singularidad vs Ritmo" },
                                                            { name: "Tensión de Límites (Asertividad vs Conexión)", val: parseFloat(Math.abs(pidState.indices.gestionAsertividad - pidState.indices.estiloConexion).toFixed(3)), label: "Asertividad vs Conexión" },
                                                            { name: "Tensión de Estructuración (Reactividad vs Ritmo)", val: parseFloat(Math.abs(pidState.indices.reactividadEmocional - pidState.indices.ritmoEjecucion).toFixed(3)), label: "Reactividad vs Ritmo" }
                                                        ].map((t, idx) => {
                                                            let status = "Leve";
                                                            let color = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                                                            let barColor = "bg-emerald-500";
                                                            if (t.val >= 0.5) {
                                                                status = "Alta";
                                                                color = "text-violet-400 border-violet-500/20 bg-violet-500/5";
                                                                barColor = "bg-violet-500";
                                                            } else if (t.val >= 0.2) {
                                                                status = "Moderada";
                                                                color = "text-amber-400 border-amber-500/20 bg-amber-500/5";
                                                                barColor = "bg-amber-500";
                                                            }
                                                            return (
                                                                <div key={idx} className="bg-zinc-950/45 p-3 rounded-2xl border border-white/[0.02] flex flex-col justify-between space-y-1">
                                                                    <div className="flex justify-between items-start gap-1">
                                                                        <span className="text-[8px] font-mono text-zinc-400 font-bold leading-tight truncate block max-w-[120px]" title={t.name}>{t.label}</span>
                                                                        <span className={`px-1.5 py-0.5 rounded-[0.25rem] text-[6px] font-black uppercase border shrink-0 ${color}`}>
                                                                            {status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                                                            <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${t.val * 100}%` }} />
                                                                        </div>
                                                                        <span className="text-[8px] font-mono font-black text-white shrink-0">Δ {t.val.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1 no-scrollbar">
                                                    {pidState.dynamicInsights.length === 0 ? (
                                                        <div className="p-8 text-center border border-white/5 rounded-2xl bg-zinc-950/20 text-zinc-500 text-[9px] font-mono uppercase">
                                                            No se registran dinámicas divergentes significativas en este perfil.
                                                        </div>
                                                    ) : (
                                                        pidState.dynamicInsights.map((insight, idx) => (
                                                            <div key={idx} className="p-4 rounded-2xl border border-purple-500/25 bg-purple-500/5 text-purple-200 space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] font-black uppercase text-purple-400 font-mono">{insight.title}</span>
                                                                    <span className="text-[8px] font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-black">DISCREPANCIA Δ {insight.discrepancy.toFixed(2)}</span>
                                                                </div>
                                                                <p className="text-[9px] text-zinc-300 leading-relaxed font-sans">{insight.consequence}</p>
                                                                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 text-[9px] text-purple-300 font-mono italic">
                                                                    <span className="text-[7px] text-zinc-600 block uppercase font-black not-italic mb-1">Reflexión sugerida:</span>
                                                                    "{insight.reflection}"
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* JSON Output */}
                                            <div className="space-y-2 pt-4 border-t border-white/5 flex flex-col">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-[0.2em] block">JSON del Estado Multidimensional (PID-5)</span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(JSON.stringify(clinJson, null, 2));
                                                            alert("¡JSON multidimensional copiado!");
                                                        }}
                                                        className="text-[8px] font-mono font-black uppercase bg-purple-500/15 border border-purple-500/25 text-purple-400 px-2 py-0.5 rounded hover:bg-purple-500 hover:text-black transition-all font-bold"
                                                    >
                                                        Copiar JSON
                                                    </button>
                                                </div>
                                                <pre className="bg-zinc-950/90 border border-white/5 p-3 rounded-2xl text-[9px] font-mono text-purple-400/90 max-h-[90px] overflow-y-auto no-scrollbar shadow-inner leading-relaxed">
                                                    {JSON.stringify(clinJson, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Capa 3: Fluidez Adaptativa (Variabilidad del Perfil) */}
                                    <div className="bg-zinc-900/20 border border-white/5 p-6 rounded-3xl space-y-3">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Capa 3: Fluidez Adaptativa (Variabilidad del Perfil)</h4>
                                            <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Comprensión de la flexibilidad y matices en las respuestas del perfil</p>
                                        </div>

                                        <div className={`p-4 rounded-2xl border transition-all ${
                                            pidState.globalVariance > 0.85
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                                : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
                                        }`}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${pidState.globalVariance > 0.85 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                    <span className="text-[10px] font-mono font-bold uppercase">
                                                        {pidState.globalVariance > 0.85 ? 'Perfil con Alta Flexibilidad' : 'Consistencia Armónica'}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-mono">VARIANZA GLOBAL DE SISTEMA: {pidState.globalVariance.toFixed(3)}</span>
                                            </div>
                                            <p className="text-[9px] mt-1.5 leading-relaxed text-zinc-400 font-sans">
                                                {pidState.globalVariance > 0.85
                                                    ? 'Tus respuestas reflejan una gran flexibilidad, lo que hace que tu perfil sea dinámico y difícil de encasillar en una sola categoría rígida.'
                                                    : 'Tus respuestas siguen una línea constante y homogénea en cada uno de tus estilos de gestión personal.'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Capa 4: Tu Enfoque de Gestión Personal */}
                                    {pidState.analysisNotes.length > 0 && (
                                        <div className="bg-violet-950/10 border border-violet-500/15 p-6 rounded-3xl space-y-4">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-violet-400 tracking-widest font-mono">Capa 4: Tu Enfoque de Gestión Personal</h4>
                                                <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Análisis integrado de tus 5 estilos (sin umbrales de exclusión)</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {pidState.analysisNotes.map((note, idx) => (
                                                    <div key={idx} className="bg-zinc-950/40 border border-white/[0.02] p-4 rounded-2xl space-y-2">
                                                        <div className="flex flex-col gap-0.5 border-b border-white/5 pb-2">
                                                            <span className="text-[10px] font-bold text-violet-300 font-mono uppercase">{note.label}</span>
                                                            <span className="text-[8px] text-zinc-500 font-mono uppercase">{note.styleType}</span>
                                                        </div>
                                                        <p className="text-[9px] text-zinc-300 leading-relaxed font-sans">{note.consequence}</p>
                                                        <div className="bg-violet-500/[0.02] p-3 rounded-xl border border-violet-500/10 text-[9px] text-violet-300 font-mono italic">
                                                            <span className="text-[7px] text-zinc-600 block uppercase font-black not-italic mb-1">Reflexión sugerida:</span>
                                                            "{note.reflection}"
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Capa 5: Prompt Maestro Copiable */}
                                    <div className="bg-zinc-900/20 border border-white/5 p-6 rounded-3xl space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Prompt Maestro para Análisis de Procesos (IA)</h4>
                                                <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Copia esta configuración matemática directa para alimentar y guiar la interpretación de la IA</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(promptMaestroText);
                                                    alert("¡Prompt Maestro copiado al portapapeles!");
                                                }}
                                                className="text-[8px] font-mono font-black uppercase bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-500 hover:text-black transition-all"
                                            >
                                                Copiar Prompt
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <pre className="bg-zinc-950 border border-white/5 p-4 rounded-2xl text-[9px] font-mono text-zinc-400 overflow-x-auto leading-relaxed max-h-[160px] overflow-y-auto no-scrollbar">
                                                {promptMaestroText}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest font-mono">Reactivos Detallados</h4>
                            <div className="bg-zinc-900/10 border border-white/5 rounded-3xl p-6 max-h-[600px] overflow-y-auto space-y-3 no-scrollbar">
                                {PHENOM_PART_B.map((q) => {
                                    const rating = rawAnswers[q.id];
                                    const ratingLabels = ["Muy en desacuerdo", "A veces en desacuerdo", "A veces de acuerdo", "Muy de acuerdo"];
                                    return (
                                        <div key={q.id} className="bg-zinc-950/20 border border-white/5 rounded-2xl p-4 flex justify-between items-center gap-4 hover:border-white/10 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-mono text-zinc-500 font-black uppercase">Reactivo {q.id}</span>
                                                    <span className="text-[7px] font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-1 rounded">{q.domain}</span>
                                                </div>
                                                <p className="text-xs text-zinc-300 font-sans">"{q.text}"</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="text-xs font-mono font-black text-emerald-400">{rating !== undefined ? rating : '—'}</div>
                                                <div className="text-[8px] text-zinc-500 font-semibold uppercase">{rating !== undefined ? ratingLabels[rating] : 'Sin Respuesta'}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono">Implicaciones Clínicas Generales</label>
                            <textarea
                                value={clinicianNotes['pid5_general'] || ''}
                                onChange={(e) => handleSaveClinicianNote('pid5_general', e.target.value)}
                                placeholder="Añade tus conclusiones sobre la estructura de personalidad, defensas y rasgos desadaptativos..."
                                className="w-full h-28 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-950"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderIcarTab = () => {
        const hasIcar = !!activePatientData?.icar16;

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-black text-white italic">Motor Cognitivo ICAR-16 (Parte IV)</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">Mapeo del rendimiento prefrontal e inferencial viso-espacial</p>
                </div>
                
                {!hasIcar ? (
                    <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-2xl text-center text-zinc-500 text-xs italic font-mono uppercase tracking-widest">
                        Prueba ICAR-16 pendiente de responder.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Metrics & Proctoring Header */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                                <div>
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono">Aciertos Totales</div>
                                    <div className="text-4xl font-black text-white italic mt-1">{activePatientData.icar16.score}<span className="text-xl text-zinc-500">/16</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono">Proctoring</div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase mt-1 font-mono ${
                                        activePatientData.icar16.alerts && activePatientData.icar16.alerts.length > 0
                                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    }`}>
                                        {activePatientData.icar16.alerts && activePatientData.icar16.alerts.length > 0 ? 'Vigilado' : 'Aprobado'}
                                    </span>
                                </div>
                            </div>

                            {/* Proctoring Alerts list */}
                            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex flex-col justify-center space-y-2">
                                <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest font-mono">Alertas Conductuales</h4>
                                {activePatientData.icar16.alerts && activePatientData.icar16.alerts.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {activePatientData.icar16.alerts.map((alert, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded bg-amber-500/5 border border-amber-500/10 text-[9px] font-mono text-amber-400/90" title={alert.tooltip}>
                                                ⚠️ {alert.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-zinc-600 font-mono uppercase">Sin anomalías ni alertas de proctoring detectadas.</div>
                                )}
                            </div>
                        </div>

                        {/* Reporte de Estado Cognitivo (Norma Poblacional) */}
                        {(() => {
                            const refIndices = activePatientData.icar16.indices_referencia || computeIcarReferenceIndices(icarAnswers, icarDwellTimes, icarChanges);
                            if (!refIndices || !refIndices.dimensions) return null;
                            return (
                                <div className="bg-zinc-900/20 border border-white/5 p-6 rounded-3xl space-y-4">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Reporte de Ejecución Cognitiva (ICAR-16)</h4>
                                        <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Comparativa estandarizada contra norma poblacional de referencia (18-30 años, nivel universitario)</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {Object.entries(refIndices.dimensions).map(([key, data]) => {
                                            const nameMap = {
                                                verbal: "Lógico-Verbal",
                                                visuospatial: "Visoespacial",
                                                sequential: "Secuencial",
                                                inductive: "Inductiva"
                                            };
                                            
                                            // Colors based on z_score / status
                                            let zColor = "text-zinc-400";
                                            if (data.z_score > 0.5) zColor = "text-emerald-400";
                                            else if (data.z_score < -0.5) zColor = "text-rose-400 font-bold";
                                            
                                            let statusBg = "bg-white/5 border-white/5 text-zinc-400";
                                            if (data.efficiency_status === "capacidad_compensatoria") {
                                                statusBg = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                                            } else if (data.efficiency_status === "saturacion_cognitiva") {
                                                statusBg = "bg-red-500/10 border-red-500/20 text-red-400 font-black animate-pulse";
                                            } else if (data.efficiency_status === "baja_inversion") {
                                                statusBg = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                                            } else if (data.z_score >= 1) {
                                                statusBg = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                                            }

                                            const statusLabelMap = {
                                                capacidad_compensatoria: "Capacidad Compensatoria",
                                                saturacion_cognitiva: "Saturación Cognitiva",
                                                baja_inversion: "Baja Inversión",
                                                normal: "Rendimiento Normal",
                                                sin_datos: "Sin Datos"
                                            };

                                            return (
                                                <div key={key} className="bg-zinc-950/40 p-4 border border-white/5 rounded-2xl flex flex-col justify-between space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-start gap-1">
                                                            <span className="text-[10px] font-bold text-white uppercase truncate">{nameMap[key] || key}</span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase border shrink-0 ${statusBg}`}>
                                                                {statusLabelMap[data.efficiency_status] || data.efficiency_status}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 flex items-baseline gap-2">
                                                            <span className="text-[9px] text-zinc-500 font-mono">Z-Score:</span>
                                                            <span className={`text-xl font-mono font-bold ${zColor}`}>
                                                                {data.z_score > 0 ? `+${data.z_score}` : data.z_score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1 text-[8px] font-mono text-zinc-500 border-t border-white/5 pt-2">
                                                        <div className="flex justify-between"><span>Aciertos:</span> <span className="text-zinc-300 font-bold">{data.correct}/4</span></div>
                                                        <div className="flex justify-between"><span>Latencia Promedio:</span> <span className="text-zinc-300 font-bold">{data.average_dwell}s</span></div>
                                                        <div className="flex justify-between"><span>Cambios de Opción:</span> <span className="text-zinc-300 font-bold">{data.total_changes}</span></div>
                                                    </div>
                                                    
                                                    <div className="text-[9px] text-zinc-400 bg-white/[0.01] border border-white/5 rounded-lg p-2 font-sans leading-relaxed">
                                                        {data.interpretation}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Validador de Calidad & JSON Output */}
                                    {(() => {
                                        const estadoCognitivo = activePatientData.icar16.estado_cognitivo || computeIcarEstadoCognitivo(icarAnswers, icarDwellTimes, icarChanges, activePatientData.icar16.score, selectedPatient.name);
                                        if (!estadoCognitivo) return null;
                                        
                                        const isOk = estadoCognitivo.metadatos.validez === "ok";
                                        const validezText = estadoCognitivo.metadatos.validez === "INVALIDA_DESATENCION"
                                            ? "INVALIDA (Tiempo total menor a 350 segundos - Sesgo de desatención)"
                                            : estadoCognitivo.metadatos.validez === "INVALIDA_AZAR"
                                            ? "INVALIDA (Tasa de aciertos menor al 30% - Respuestas al azar / impulsivas)"
                                            : "Aprobada (Óptima persistencia y consistencia lógica)";

                                        const validezBg = isOk
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            : "bg-red-500/10 border-red-500/20 text-red-400";

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-white/5">
                                                <div className="md:col-span-6 space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-[0.2em] block">Control de Calidad del Test</span>
                                                        <div className={`mt-2 p-3 rounded-xl border text-[10px] font-mono leading-relaxed ${validezBg}`}>
                                                            <strong>Validez de la Muestra:</strong> {validezText}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                                        <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-2xl">
                                                            <span className="text-zinc-500 block text-[8px] uppercase tracking-wider">Estilo de Ejecución</span>
                                                            <span className="text-white font-black text-xs mt-1 block uppercase tracking-widest">{estadoCognitivo.estilo_ejecucion.replace('_', ' ')}</span>
                                                        </div>
                                                        <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-2xl">
                                                            <span className="text-zinc-500 block text-[8px] uppercase tracking-wider">Banderas Conductuales</span>
                                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                                {estadoCognitivo.banderas_conductuales && estadoCognitivo.banderas_conductuales.length > 0 ? (
                                                                    estadoCognitivo.banderas_conductuales.map((flag, idx) => (
                                                                        <span key={idx} className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[7px] font-mono text-amber-400 uppercase">
                                                                            {flag.replace(/_/g, ' ')}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-zinc-600 text-[8px] italic">Ninguna</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-6 space-y-2 flex flex-col">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-[0.2em] block">Objeto de Estado Cognitivo (JSON de Nivel Clínico)</span>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(JSON.stringify(estadoCognitivo, null, 2));
                                                                alert("¡JSON copiado al portapapeles!");
                                                            }}
                                                            className="text-[8px] font-mono font-black uppercase bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-500 hover:text-black transition-all font-bold"
                                                        >
                                                            Copiar JSON
                                                        </button>
                                                    </div>
                                                    <pre className="bg-zinc-950/90 border border-white/5 p-4 rounded-2xl text-[9px] font-mono text-emerald-400/90 max-h-[160px] overflow-y-auto no-scrollbar shadow-inner leading-relaxed select-all">
                                                        {JSON.stringify(estadoCognitivo, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })()}

                        {/* Question Breakdown */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest font-mono">Detalle de Reactivos</h4>
                            <div className="space-y-3 pr-2">
                                {icarQuestions.map((q) => {
                                    const userAns = icarAnswers[q.question_number];
                                    const isCorrect = userAns === q.correct_answer;
                                    const isExpanded = expandedIcarQuestion === q.question_number;
                                    const latency = icarDwellTimes[q.question_number] || 0;
                                    const changes = icarChanges[q.question_number] || 0;

                                    return (
                                        <div key={q.question_number} className={`rounded-3xl border transition-all duration-300 ${isExpanded ? 'border-emerald-500/20 bg-emerald-500/[0.01]' : 'border-white/5 bg-zinc-950/20 hover:border-white/10'}`}>
                                            <div
                                                onClick={() => setExpandedIcarQuestion(isExpanded ? null : q.question_number)}
                                                className="p-5 flex justify-between items-center gap-4 cursor-pointer select-none"
                                            >
                                                <div className="flex gap-3 items-center">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-xs ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {isCorrect ? <Check size={14} /> : <X size={14} />}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-white uppercase font-sans">Reactivo {q.question_number}</span>
                                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[7px] font-mono text-zinc-500 uppercase tracking-wider">{q.category}</span>
                                                        </div>
                                                        <span className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5 block">{q.construct}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex gap-3">
                                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">T: <strong className="text-zinc-400 font-bold">{latency.toFixed(1)}s</strong></span>
                                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">CAMBIOS: <strong className="text-zinc-400 font-bold">{changes}</strong></span>
                                                    </div>
                                                    <ChevronDown size={14} className={`text-zinc-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-white/5 p-6 space-y-6 animate-in slide-in-from-top duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                                        <div className="lg:col-span-7 space-y-4">
                                                            <p className="text-xs font-bold text-white leading-relaxed italic">"{q.instruction_text}"</p>
                                                            {renderTestStimulusDiagram(q)}
                                                        </div>

                                                        <div className="lg:col-span-5 space-y-3">
                                                            <span className="text-[8px] font-mono font-black uppercase text-zinc-600 tracking-widest block mb-1">Alternativas</span>
                                                            {q.options.map(opt => {
                                                                const isUserChoice = userAns === opt.label;
                                                                const isCorrectAnswer = q.correct_answer === opt.label;
                                                                return (
                                                                    <div
                                                                        key={opt.label}
                                                                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${isCorrectAnswer ? 'bg-emerald-500/10 border-emerald-500/20 text-white' :
                                                                            isUserChoice ? 'bg-red-500/10 border-red-500/20 text-white' :
                                                                            'bg-zinc-950/20 border-white/5 text-zinc-400'
                                                                        }`}
                                                                    >
                                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-black border shrink-0 ${isCorrectAnswer ? 'bg-emerald-500 text-black border-emerald-500' :
                                                                            isUserChoice ? 'bg-red-500 text-white border-red-500' :
                                                                            'bg-zinc-900 border-white/10 text-zinc-500'
                                                                        }`}>{opt.label}</span>
                                                                        <span className="text-xs truncate font-medium">{opt.value}</span>
                                                                        {isCorrectAnswer && <span className="ml-auto text-[7px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">Correcto</span>}
                                                                        {!isCorrectAnswer && isUserChoice && <span className="ml-auto text-[7px] font-mono font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10">Tu Selección</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Telemetry & Video Proctoring Section for this specific question */}
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-white/5">
                                                        <div className="md:col-span-6 space-y-4">
                                                            <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-[0.2em] block">Telemetría de la Respuesta</span>
                                                            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                                                <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-2xl">
                                                                    <span className="text-zinc-500 block text-[8px] uppercase tracking-wider">Duración de Atención (Dwell)</span>
                                                                    <span className="text-white font-black text-sm mt-1 block">{latency.toFixed(1)}s</span>
                                                                </div>
                                                                <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-2xl">
                                                                    <span className="text-zinc-500 block text-[8px] uppercase tracking-wider">Cambios de Opción</span>
                                                                    <span className="text-white font-black text-sm mt-1 block">{changes} veces</span>
                                                                </div>
                                                            </div>

                                                            {/* Behavioral Alerts */}
                                                            <div className="space-y-2">
                                                                <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-[0.2em] block">Análisis de Alertas Conductuales</span>
                                                                {latency > 95 ? (
                                                                     <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] font-mono leading-relaxed">
                                                                         ⚠️ <strong>Alta Inversión Cognitiva:</strong> El paciente dedicó {latency.toFixed(1)}s (mayor a la media). Sugiere un procesamiento detallado de variables complejas.
                                                                     </div>
                                                                 ) : latency > 45 ? (
                                                                     <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-mono leading-relaxed">
                                                                         ✓ <strong>Procesamiento Analítico:</strong> El usuario dedicó {latency.toFixed(1)}s a analizar profundamente el reactivo. Tiempo normal para tareas de alta demanda.
                                                                     </div>
                                                                 ) : (
                                                                     <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 text-emerald-400/90 rounded-xl text-[10px] font-mono leading-relaxed">
                                                                         ✓ <strong>Procesamiento Eficiente:</strong> Tiempo de dwell dentro del rango esperado para este nivel de complejidad.
                                                                     </div>
                                                                 )}

                                                                 {changes >= 3 ? (
                                                                     <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-mono leading-relaxed">
                                                                         ⚠️ <strong>Reevaluación Decisional:</strong> Se registraron {changes} cambios de opción. Sugiere que el hilo lógico requirió revisión continua.
                                                                     </div>
                                                                 ) : changes > 0 ? (
                                                                     <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-mono leading-relaxed">
                                                                         ✓ <strong>Reevaluación Cauta:</strong> El paciente revisó su hipótesis inicial ({changes} cambio(s)), mostrando una decisión deliberada.
                                                                     </div>
                                                                 ) : (
                                                                     <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 text-emerald-400/90 rounded-xl text-[10px] font-mono leading-relaxed">
                                                                         ✓ <strong>Firmeza Decisional:</strong> Selección directa de la respuesta sin alternar opciones.
                                                                     </div>
                                                                 )}
                                                            </div>
                                                        </div>

                                                        <div className="md:col-span-6 space-y-2">
                                                            <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-[0.2em] block">Micro-grabación de Comportamiento</span>
                                                            {icarVideos[q.question_number] ? (
                                                                <video src={icarVideos[q.question_number]} controls className="w-full rounded-2xl border border-white/5 bg-zinc-950 aspect-video shadow-lg" />
                                                            ) : (
                                                                <div className="h-44 rounded-2xl border border-dashed border-white/5 flex items-center justify-center text-zinc-600 text-xs font-mono uppercase bg-zinc-950/20">
                                                                    Sin grabación de video en esta versión
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {(() => {
                                                        const rationaleData = icarRationale.find(r => r.question_number === q.question_number);
                                                        if (!rationaleData) return null;
                                                        return (
                                                            <div className="lg:col-span-12 mt-6 pt-6 border-t border-white/5 space-y-4">
                                                                <div className="space-y-1">
                                                                    <span className="text-[8px] font-mono font-black uppercase text-emerald-400 tracking-[0.2em] block">Base Lógica de Resolución</span>
                                                                    <p className="text-[11px] text-zinc-300 font-sans italic leading-relaxed">{rationaleData.rationale}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono font-black">Observación del Rendimiento Ejecutivo</label>
                            <textarea
                                value={clinicianNotes['icar_general'] || ''}
                                onChange={(e) => handleSaveClinicianNote('icar_general', e.target.value)}
                                placeholder="Registra anomalías en tiempos de respuesta, titubeo lógico o patrones específicos de error visoespacial..."
                                className="w-full h-28 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-950"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCanvasTab = () => {
        const drawGravityLine = (sx, sy, tx, ty) => {
            const dy = Math.abs(ty - sy);
            const tension = Math.max(dy * 0.4, 40); 
            const breath = Math.sin(time) * 1.5;
            const cpx1 = sx;
            const cpy1 = sy + tension;
            const cpx2 = tx;
            const cpy2 = ty - tension;
            return `M ${sx} ${sy} C ${cpx1 + breath} ${cpy1}, ${cpx2 - breath} ${cpy2}, ${tx} ${ty}`;
        };

        const activeNode = selectedNode ? nodes.find(n => n.id === selectedNode) : null;
        const typeLabels = {
            'CONTEXT': 'CONTEXTO INICIAL',
            'INTERNAL_STATE': 'ESTADO INTERNO',
            'MACRO_MECHANISM': 'MACRO MECANISMO',
            'CRITICAL_SYMPTOM': 'SÍNTOMA CRÍTICO',
            'IMPACT_CHAIN': 'CADENA DE IMPACTO'
        };

        return (
            <div className="w-full h-[650px] bg-[#09090b] rounded-[2rem] border border-white/5 relative overflow-hidden flex">
                <div 
                    className="flex-1 h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={() => { setIsPanning(true); setSelectedNode(null); }}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                >
                    <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundPosition: `${pan.x}px ${pan.y}px` }}></div>

                    {/* SVG Layer for Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.4)" />
                            </marker>
                            
                            <radialGradient id="glowLine" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </radialGradient>
                        </defs>
                        
                        {edges.map((edge, i) => {
                            const source = nodes.find(n => n.id === edge.source);
                            const target = nodes.find(n => n.id === edge.target);
                            if (!source || !target) return null;
                            
                            const sx = source.x + pan.x + source.width / 2;
                            const sy = source.y + pan.y + source.height;
                            const tx = target.x + pan.x + target.width / 2;
                            const ty = target.y + pan.y;
                            
                            const pathString = drawGravityLine(sx, sy, tx, ty);
                            
                            return (
                                <g key={i}>
                                    <path d={pathString} fill="none" stroke="url(#glowLine)" strokeWidth="8" className="opacity-20" />
                                    <path d={pathString} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" markerEnd="url(#arrow)" />
                                </g>
                            );
                        })}
                        {connectingFrom && (
                            <path 
                                d={drawGravityLine(nodes.find(n => n.id === connectingFrom).x + pan.x + nodes.find(n => n.id === connectingFrom).width / 2, nodes.find(n => n.id === connectingFrom).y + pan.y + nodes.find(n => n.id === connectingFrom).height, mousePos.x, mousePos.y)}
                                fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeDasharray="6,6" className="animate-pulse"
                            />
                        )}
                    </svg>

                    {/* Nodes Layer */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                        {nodes.map(node => (
                            <div 
                                key={node.id}
                                className="absolute pointer-events-auto"
                                style={{ 
                                    left: node.x + pan.x, 
                                    top: node.y + pan.y,
                                    width: node.width,
                                    height: node.height
                                }}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                            >
                                {renderNodeShape(node)}
                                
                                {selectedNode === node.id && (
                                    <div className="absolute -top-16 -right-16 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex flex-col gap-2 shadow-2xl animate-in zoom-in-50 duration-200">
                                        <div className="flex gap-2">
                                            <button onClick={() => spawnNode(node.id, 'CONTEXT')} className="w-6 h-6 rotate-45 bg-sky-500/20 border border-sky-400 hover:bg-sky-500/40 m-1" title="Contexto" />
                                            <button onClick={() => spawnNode(node.id, 'INTERNAL_STATE')} className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 hover:bg-emerald-500/40" title="Estado" />
                                            <button onClick={() => spawnNode(node.id, 'MACRO_MECHANISM')} className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500 hover:bg-emerald-600/40 -mt-1" title="Mecanismo" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => spawnNode(node.id, 'CRITICAL_SYMPTOM')} className="w-10 h-6 rounded bg-red-500/20 border border-red-500 hover:bg-red-500/40" title="Síntoma" />
                                            <button onClick={() => spawnNode(node.id, 'IMPACT_CHAIN')} className="w-10 h-6 rounded-[100%] bg-zinc-800 border border-zinc-500 hover:bg-zinc-700" title="Impacto" />
                                        </div>
                                        <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10">
                                            <button onMouseDown={(e) => handleConnectorMouseDown(e, node.id)} className="text-[9px] font-bold uppercase text-white/50 hover:text-white flex items-center gap-1 cursor-crosshair"><Activity size={10} /> Enlazar</button>
                                            <button onClick={() => deleteNode(node.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Node Inspector */}
                <div className="w-80 bg-zinc-950/80 border-l border-white/5 p-6 flex flex-col justify-between shrink-0">
                    {activeNode ? (
                        <div className="space-y-4">
                            <div>
                                <span className="text-[8px] font-mono font-black text-zinc-500 tracking-widest block">{typeLabels[activeNode.type]}</span>
                                <input 
                                    value={activeNode.label}
                                    onChange={e => setNodes(nodes.map(n => n.id === selectedNode ? {...n, label: e.target.value} : n))}
                                    className="w-full bg-transparent border-b border-white/10 text-white font-bold py-1 focus:outline-none focus:border-emerald-500 text-xs mt-1"
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[8px] font-mono font-black text-zinc-400 tracking-widest block uppercase">Observaciones del Nodo</span>
                                <textarea
                                    value={activeNode.observations || ''}
                                    onChange={e => setNodes(nodes.map(n => n.id === selectedNode ? {...n, observations: e.target.value} : n))}
                                    placeholder="Escribe la justificación clínica para este elemento..."
                                    className="w-full h-80 bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-zinc-300 resize-none focus:outline-none focus:border-emerald-500/40 transition-colors leading-relaxed font-sans"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center text-zinc-500 space-y-3">
                            <Hexagon className="w-8 h-8 text-zinc-700 animate-pulse" />
                            <div className="text-[9px] font-mono uppercase tracking-wider">Selecciona un nodo para editar observaciones detalladas</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFunctionalAnalysisTab = () => {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-black text-white italic">Análisis Funcional del Caso (Parte VI)</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">Identificación y delimitación de contextos, detonantes, respuestas y consecuencias para explicar los bucles de mantenimiento</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sección 1: Estímulos Antecedentes */}
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">1. Estímulos Antecedentes (Contextos / Detonantes)</h4>
                            <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Qué ocurre inmediatamente antes de la conducta problema</p>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Estímulos Externos (Situaciones / Ambientes)</label>
                                <textarea
                                    value={clinicianNotes['func_antecedents_external'] || ''}
                                    onChange={(e) => handleSaveClinicianNote('func_antecedents_external', e.target.value)}
                                    placeholder="¿En qué situaciones, lugares, momentos del día o frente a qué personas o eventos se inicia el bucle?..."
                                    className="w-full h-24 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Estímulos Internos (Sensaciones / Cognición)</label>
                                <textarea
                                    value={clinicianNotes['func_antecedents_internal'] || ''}
                                    onChange={(e) => handleSaveClinicianNote('func_antecedents_internal', e.target.value)}
                                    placeholder="¿Qué pensamientos automáticos, emociones previas, recuerdos o sensaciones corporales actúan como detonante interno?..."
                                    className="w-full h-24 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Variables del Organismo */}
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">2. Variables del Organismo (El Individuo)</h4>
                            <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Factores biológicos y cognitivos previos del paciente</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Esquemas Nucleares e Historia de Aprendizaje</label>
                                <textarea
                                    value={clinicianNotes['func_organism_history'] || ''}
                                    onChange={(e) => handleSaveClinicianNote('func_organism_history', e.target.value)}
                                    placeholder="Esquemas de pensamiento arraigados, rasgos de personalidad (como se evidencian en el PID-5) o condiciones biológicas y fisiológicas que modulan la respuesta..."
                                    className="w-full h-56 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección 3: Respuesta Triple */}
                <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4">
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">3. Sistema de Respuesta Triple (El Bucle de Reacción)</h4>
                        <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Cómo procesa y reacciona el individuo ante el detonante</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Respuesta Cognitiva</label>
                            <textarea
                                value={clinicianNotes['func_response_cognitive'] || ''}
                                onChange={(e) => handleSaveClinicianNote('func_response_cognitive', e.target.value)}
                                placeholder="Ideas recurrentes, rumiaciones, auto-verbalizaciones negativas, sobre-análisis del caso o interpretaciones sesgadas..."
                                className="w-full h-32 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Respuesta Fisiológica</label>
                            <textarea
                                value={clinicianNotes['func_response_physiological'] || ''}
                                onChange={(e) => handleSaveClinicianNote('func_response_physiological', e.target.value)}
                                placeholder="Respuestas somáticas, taquicardia, tensión muscular, cambios en la velocidad del habla (visto en ICAR/biográfica), hiperventilación..."
                                className="w-full h-32 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Respuesta Motora / Conductual</label>
                            <textarea
                                value={clinicianNotes['func_response_motor'] || ''}
                                onChange={(e) => handleSaveClinicianNote('func_response_motor', e.target.value)}
                                placeholder="Acciones realizadas por el paciente, conductas de evitación, escape, ritos obsesivos, silencios prolongados o confrontación..."
                                className="w-full h-32 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sección 4: Consecuencias */}
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">4. Consecuencias del Comportamiento</h4>
                            <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Efectos inmediatos y a largo plazo de la conducta</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">A Corto Plazo (Refuerzo / Alivio)</label>
                                <textarea
                                    value={clinicianNotes['func_consequences_short'] || ''}
                                    onChange={(e) => handleSaveClinicianNote('func_consequences_short', e.target.value)}
                                    placeholder="¿Qué alivio momentáneo u obtención de control inmediato percibe el paciente tras la conducta? (Refuerzo negativo o positivo inmediato)..."
                                    className="w-full h-24 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">A Largo Plazo (Pérdidas / Perpetuación)</label>
                                <textarea
                                    value={clinicianNotes['func_consequences_long'] || ''}
                                    onChange={(e) => handleSaveClinicianNote('func_consequences_long', e.target.value)}
                                    placeholder="¿Qué consecuencias negativas persistentes produce a la larga esta respuesta? ¿Cómo perpetúa el malestar original del paciente?..."
                                    className="w-full h-24 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 5: Hipótesis de Mantenimiento */}
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">5. Hipótesis Integradora y Ciclo de Mantenimiento</h4>
                            <p className="text-zinc-500 text-[8px] font-mono uppercase mt-0.5">Integración clínica final del bucle recurrente</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono mb-1.5">Descripción del Bucle del Caso</label>
                                <textarea
                                    value={clinicianNotes['func_maintenance_hypothesis'] || ''}
                                    onChange={(e) => handleSaveClinicianNote('func_maintenance_hypothesis', e.target.value)}
                                    placeholder="Redacta cómo interactúan los detonantes, esquemas organísmicos y respuestas en un bucle cerrado. Explica el mecanismo de retroalimentación por el cual el síntoma no se resuelve..."
                                    className="w-full h-56 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-900/40"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSummaryTab = () => {
        return (
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-black text-white italic">Formulación y Firma de Caso (Parte VII)</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">Cierre y publicación oficial del registro clínico</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Resumen de Evidencia Enlazada</h4>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-zinc-500">Nodos de Formulación (Canvas):</span>
                                <span className="text-white font-mono font-black">{nodes.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-zinc-500">Enlaces Clínicos (Bucle):</span>
                                <span className="text-white font-mono font-black">{edges.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-zinc-500">Aciertos ICAR-16:</span>
                                <span className="text-emerald-400 font-mono font-black">{activePatientData?.icar16 ? `${activePatientData.icar16.score}/${activePatientData.icar16.total}` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block font-mono font-black">Conclusiones del Diagnóstico General</label>
                        <textarea
                            value={privateNotes}
                            onChange={(e) => {
                                setPrivateNotes(e.target.value);
                                if (selectedPatient) {
                                    localStorage.setItem(`oasis_private_notes_${selectedPatient.name}`, e.target.value);
                                }
                            }}
                            placeholder="Redacta la formulación existencial definitiva y notas generales..."
                            className="w-full h-40 bg-zinc-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100/90 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans outline-none placeholder:text-emerald-950"
                        />
                    </div>
                </div>

                <div className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Publicación Oficial e Integridad de Registro</h4>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">Esta firma bloqueará la edición y actualizará el estado de la formulación.</p>
                    </div>
                    <button 
                        onClick={handlePublishFormulation}
                        className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg hover:scale-105 shadow-emerald-950"
                    >
                        <Save className="w-4 h-4" /> Firmar y Publicar
                    </button>
                </div>
            </div>
        );
    };

    // --- Profile Workspace (Split layout with Sidebar navigation) ---
    const renderProfileWorkspace = () => {
        if (!selectedPatient) return null;

        const tabsConfig = [
            { id: 'BIOGRAPHIC', label: 'I. Entrevista Biográfica', desc: 'Narrativa del Paciente', icon: User },
            { id: 'PHENOMENOLOGICAL', label: 'II. Dimensión Ontológica', desc: 'Diagnóstico Existencial', icon: Activity },
            { id: 'PID5', label: 'III. Inventario PID-5', desc: 'Rasgos de Personalidad', icon: AlertTriangle },
            { id: 'ICAR16', label: 'IV. Desempeño ICAR-16', desc: 'Eficiencia Cognitiva', icon: Brain },
            { id: 'CANVAS', label: 'V. Pizarrón de Formulación', desc: 'Modelado Relacional', icon: Hexagon },
            { id: 'FUNCTIONAL_ANALYSIS', label: 'VI. Análisis Funcional', desc: 'Análisis de Procesos y Contextos', icon: FileText },
            { id: 'SUMMARY', label: 'VII. Resumen y Publicación', desc: 'Firma y Cierre', icon: Save }
        ];

        return (
            <div className="w-full h-full flex animate-in fade-in duration-300 bg-[#030304]">
                {/* Left Clinical Sidebar */}
                <div className="w-76 bg-zinc-950/60 border-r border-white/5 flex flex-col justify-between shrink-0">
                    <div className="p-6 space-y-6">
                        {/* Patient Badge */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-black text-white italic truncate">@{selectedPatient.name}</div>
                                    <div className="text-[9px] font-mono text-zinc-500 mt-0.5">{selectedPatient.id}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="text-[8px] font-mono text-zinc-500 uppercase font-black">Estado:</span>
                                <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                                    selectedPatient.status === 'Publicado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                }`}>{selectedPatient.status}</span>
                            </div>
                        </div>

                        {/* Session Switcher HUD */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 space-y-3">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase font-black block">Historial de Sesiones:</span>
                            <div className="flex flex-wrap gap-1 bg-black/40 border border-white/5 p-1 rounded-xl">
                                {Array.from({ length: totalVersions }).map((_, idx) => {
                                    const v = idx + 1;
                                    const isSelected = selectedVersion === v;
                                    return (
                                        <button
                                            key={v}
                                            onClick={() => setSelectedVersion(v)}
                                            className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider font-mono transition-all ${
                                                isSelected
                                                    ? 'bg-emerald-500 text-black shadow-md'
                                                    : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                                            }`}
                                        >
                                            S{v}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <nav className="space-y-1">
                            {tabsConfig.map((tab) => {
                                const IconComponent = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setSelectedNode(null);
                                        }}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl border flex gap-3 items-center transition-all ${
                                            isActive 
                                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold' 
                                            : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01]'
                                        }`}
                                    >
                                        <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-black uppercase tracking-wider">{tab.label}</div>
                                            <div className="text-[9px] text-zinc-600 font-medium truncate mt-0.5">{tab.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-6 border-t border-white/5">
                        <button
                            onClick={() => {
                                setSelectedPatient(null);
                                setCurrentModule('DASHBOARD');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-white/5 bg-zinc-900/10 text-zinc-500 hover:text-white hover:border-white/10 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest font-mono"
                        >
                            <LogOut className="w-4 h-4" />
                            Salir del Caso
                        </button>
                    </div>
                </div>

                {/* Right Clinical Area */}
                <main className="flex-1 overflow-y-auto p-10 bg-[#060607]">
                    <div className="max-w-5xl mx-auto h-full">
                        {activeTab === 'BIOGRAPHIC' && renderBiographicTab()}
                        {activeTab === 'PHENOMENOLOGICAL' && renderPhenomenologicalTab()}
                        {activeTab === 'PID5' && renderPid5Tab()}
                        {activeTab === 'ICAR16' && renderIcarTab()}
                        {activeTab === 'CANVAS' && renderCanvasTab()}
                        {activeTab === 'FUNCTIONAL_ANALYSIS' && renderFunctionalAnalysisTab()}
                        {activeTab === 'SUMMARY' && renderSummaryTab()}
                    </div>
                </main>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#030304] text-white overflow-hidden font-sans flex">
            {currentModule === 'DASHBOARD' && renderDashboard()}
            {currentModule === 'PROFILE' && renderProfileWorkspace()}

            {/* Image Zoom Modal */}
            {zoomImage && (
                <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setZoomedImage(null)}>
                    <img src={zoomImage} className="max-w-full max-h-full object-contain filter invert opacity-95 shadow-2xl" />
                    <button className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-3 transition-all border border-white/5">
                        <X size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default PsychologistDashboard;

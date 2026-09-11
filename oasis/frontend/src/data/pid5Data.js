// Inventario de Personalidad para el DSM-5 - Forma Breve (PID-5-BF)
// Modelo Alternativo de Trastornos de la Personalidad (AMPD) - Criterio B (DSM-5 Sección III)
// Autores: Krueger, Derringer, Markon, Watson & Skodol (APA, 2012)

export const PID5_METADATA = {
    id: 'pid5',
    siglas: 'PID-5-BF',
    nombre: 'Inventario de Personalidad para el DSM-5 (Forma Breve)',
    nombreOficial: 'The Personality Inventory for DSM-5 Brief Form (PID-5-BF)',
    autores: 'Robert F. Krueger, Jaime Derringer, Kristian E. Markon, David Watson & Andrew E. Skodol (APA, 2012)',
    marcoTeorico: 'Modelo Alternativo para los Trastornos de la Personalidad (AMPD) - Criterio B (Sección III del DSM-5)',
    poblacion: 'Adolescentes mayores y adultos (a partir de los 12-14 años con acompañamiento clínico)',
    tiempoAproximado: '5 a 8 minutos',
    totalItems: 25,
    rangoPuntajeGlobal: '0 a 75 puntos (5 dominios de 0 a 15 puntos cada uno)',
    descripcionClinica: 'Instrumento dimensional estandarizado para evaluar 5 grandes dominios desadaptativos de la personalidad según el Criterio B del DSM-5. Permite mapear estilos de funcionamiento psicológico, vulnerabilidades afectivas, relacionales, ejecutivas y cognitivas.',
    utilidadClinica: 'Esencial para complementar la entrevista biográfica y phenomenológica, ya que no clasifica con etiquetas estigmatizantes, sino que perfila intensidades dimensionales para orientar la conceptualización de caso y la alianza terapéutica.'
};

export const PID5_OPTIONS = [
    { 
        value: 0, 
        label: 'Muy falso o a menudo falso', 
        shortLabel: 'Muy falso (0)', 
        desc: 'No describe mi forma de ser o casi nunca me ocurre.',
        badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700'
    },
    { 
        value: 1, 
        label: 'A veces o un poco falso', 
        shortLabel: 'Un poco falso (1)', 
        desc: 'La mayoría de las veces no coincide conmigo, aunque puede haber raras excepciones.',
        badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    },
    { 
        value: 2, 
        label: 'A veces o un poco verdadero', 
        shortLabel: 'Un poco verdadero (2)', 
        desc: 'Ocurre ocasionalmente o describe parcialmente mi vivencia y comportamiento.',
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    },
    { 
        value: 3, 
        label: 'Muy verdadero o a menudo verdadero', 
        shortLabel: 'Muy verdadero (3)', 
        desc: 'Describe con gran exactitud mi forma habitual de sentir, pensar o actuar.',
        badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-500/40'
    }
];

export const PID5_DOMAINS = {
    afectividadNegativa: {
        key: 'afectividadNegativa',
        id: 1,
        nombre: 'Afectividad Negativa',
        aliasClinico: 'Reactividad Emocional',
        color: 'rose',
        borderClass: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        barColor: 'bg-rose-500',
        itemIds: [1, 2, 3, 4, 5],
        descripcionDSM5: 'Experiencias frecuentes e intensas de niveles elevados de emociones displacenteras (ansiedad, miedo, labilidad afectiva, irritabilidad, vulnerabilidad ante la incertidumbre).',
        facetasDSM5: ['Labilidad emocional', 'Ansiedad', 'Inseguridad por separación', 'Sumisión', 'Hostilidad', 'Perseveración'],
        interpretacionPorNivel: {
            baja: {
                nivel: 'Baja',
                rango: '0 - 5 pts',
                color: 'emerald',
                resumen: 'Estabilidad emocional preservada; tolera la incertidumbre y las frustraciones sin crisis ansiosas significativas.'
            },
            moderada: {
                nivel: 'Moderada',
                rango: '6 - 10 pts',
                color: 'amber',
                resumen: 'Sensibilidad y reactividad ansiosa o irritable notable ante estresores o cambios imprevistos; tendencia a la rumiación.'
            },
            alta: {
                nivel: 'Elevada',
                rango: '11 - 15 pts',
                color: 'rose',
                resumen: 'Hiperreactividad afectiva marcada; frecuentes desbordes ansiosos, irritabilidad intensa y dificultad para regular el malestar.'
            }
        }
    },
    desapego: {
        key: 'desapego',
        id: 2,
        nombre: 'Desapego',
        aliasClinico: 'Estilo de Conexión',
        color: 'cyan',
        borderClass: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
        barColor: 'bg-cyan-500',
        itemIds: [6, 7, 8, 9, 10],
        descripcionDSM5: 'Distanciamiento socioemocional, evitación del contacto cercano, retraimiento afectivo y capacidad reducida para experimentar placer o interés interpersonal.',
        facetasDSM5: ['Retraimiento social', 'Evitación de la intimidad', 'Anhedonia', 'Afectividad restringida', 'Suspicacia'],
        interpretacionPorNivel: {
            baja: {
                nivel: 'Baja',
                rango: '0 - 5 pts',
                color: 'emerald',
                resumen: 'Apertura social y afectiva conservada; busca y tolera la cercanía con otros y disfruta de sus vínculos significativos.'
            },
            moderada: {
                nivel: 'Moderada',
                rango: '6 - 10 pts',
                color: 'amber',
                resumen: 'Preferencia defensiva por la soledad o cautela ante nuevos vínculos; puede restringir la expresión emocional.'
            },
            alta: {
                nivel: 'Elevada',
                rango: '11 - 15 pts',
                color: 'rose',
                resumen: 'Aislamiento interpersonal severo, marcada anhedonia social y desvinculación emocional profunda de su entorno.'
            }
        }
    },
    antagonismo: {
        key: 'antagonismo',
        id: 3,
        nombre: 'Antagonismo',
        aliasClinico: 'Gestión de la Asertividad',
        color: 'amber',
        borderClass: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        barColor: 'bg-amber-500',
        itemIds: [11, 12, 13, 14, 15],
        descripcionDSM5: 'Comportamientos que ponen al individuo en oposición con los demás, incluyendo actitudes de grandiosidad, manipulación, egocentrismo o baja empatía.',
        facetasDSM5: ['Manipulación', 'Engaño', 'Grandiosidad', 'Búsqueda de atención', 'Insensibilidad'],
        interpretacionPorNivel: {
            baja: {
                nivel: 'Baja',
                rango: '0 - 5 pts',
                color: 'emerald',
                resumen: 'Empatía y respeto relacional intactos; consideración por los derechos y sentimientos de las demás personas.'
            },
            moderada: {
                nivel: 'Moderada',
                rango: '6 - 10 pts',
                color: 'amber',
                resumen: 'Tendencia a la competitividad excesiva, posturas defensivas de superioridad o manipulación ocasional para protegerse.'
            },
            alta: {
                nivel: 'Elevada',
                rango: '11 - 15 pts',
                color: 'rose',
                resumen: 'Insensibilidad relacional acusada, instrumentalización deliberada de vínculos o actitudes de desdén hacia normas de convivencia.'
            }
        }
    },
    desinhibicion: {
        key: 'desinhibicion',
        id: 4,
        nombre: 'Desinhibición',
        aliasClinico: 'Impulso y Planificación',
        color: 'purple',
        borderClass: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
        barColor: 'bg-purple-500',
        itemIds: [16, 17, 18, 19, 20],
        descripcionDSM5: 'Orientación hacia la satisfacción inmediata, impulsividad motora o verbal, baja perseverancia en tareas que requieren esfuerzo y falta de planificación.',
        facetasDSM5: ['Irresponsabilidad', 'Impulsividad', 'Distracción', 'Temeridad', 'Baja perseverancia'],
        interpretacionPorNivel: {
            baja: {
                nivel: 'Baja',
                rango: '0 - 5 pts',
                color: 'emerald',
                resumen: 'Adecuada capacidad de autorregulación ejecutiva, planificación de metas y control reflexivo antes de actuar.'
            },
            moderada: {
                nivel: 'Moderada',
                rango: '6 - 10 pts',
                color: 'amber',
                resumen: 'Dificultades para sostener el esfuerzo en tareas rutinarias, aburrimiento rápido y decisiones tomadas en el calor del momento.'
            },
            alta: {
                nivel: 'Elevada',
                rango: '11 - 15 pts',
                color: 'rose',
                resumen: 'Impulsividad marcada, problemas crónicos para prever riesgos o consecuencias y desorganización en compromisos.'
            }
        }
    },
    psicoticismo: {
        key: 'psicoticismo',
        id: 5,
        nombre: 'Psicoticismo',
        aliasClinico: 'Singularidad Cognitiva',
        color: 'emerald',
        borderClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        barColor: 'bg-emerald-500',
        itemIds: [21, 22, 23, 24, 25],
        descripcionDSM5: 'Manifestación de vivencias perceptivas inusuales, creencias singulares, desrealización o extrañeza subjetiva que suelen ser percibidas como atípicas.',
        facetasDSM5: ['Creencias y experiencias inusuales', 'Excentricidad', 'Desregulación cognitiva y perceptiva'],
        interpretacionPorNivel: {
            baja: {
                nivel: 'Baja',
                rango: '0 - 5 pts',
                color: 'emerald',
                resumen: 'Procesamiento perceptivo y cognitivo convencional; claro sentido de realidad compartida y ausencia de distorsiones.'
            },
            moderada: {
                nivel: 'Moderada',
                rango: '6 - 10 pts',
                color: 'amber',
                resumen: 'Vivencias esporádicas de extrañeza subjetiva, desrealización bajo estrés intenso o pensamiento altamente divergente/metafórico.'
            },
            alta: {
                nivel: 'Elevada',
                rango: '11 - 15 pts',
                color: 'rose',
                resumen: 'Frecuencia de experiencias perceptivas o cognitivas atípicas, despersonalización recurrente o convicciones sentidas como excéntricas.'
            }
        }
    }
};

export const PID5_ITEMS = [
    // Dominio 1: Reactividad Emocional / Afectividad Negativa (Ítems 1 - 5)
    { id: 1, domainKey: 'afectividadNegativa', domainName: 'Reactividad Emocional', text: 'Me preocupo por casi todo.', faceta: 'Ansiedad' },
    { id: 2, domainKey: 'afectividadNegativa', domainName: 'Reactividad Emocional', text: 'Me asusto o me alarmo con mucha facilidad.', faceta: 'Labilidad emocional' },
    { id: 3, domainKey: 'afectividadNegativa', domainName: 'Reactividad Emocional', text: 'Me pongo muy ansioso/a cuando las cosas son inciertas o impredecibles.', faceta: 'Ansiedad' },
    { id: 4, domainKey: 'afectividadNegativa', domainName: 'Reactividad Emocional', text: 'Me irrito fácilmente por todo tipo de cosas.', faceta: 'Hostilidad / Irritabilidad' },
    { id: 5, domainKey: 'afectividadNegativa', domainName: 'Reactividad Emocional', text: 'Mis emociones a veces cambian de un momento a otro sin motivo aparente.', faceta: 'Labilidad emocional' },

    // Dominio 2: Estilo de Conexión / Desapego (Ítems 6 - 10)
    { id: 6, domainKey: 'desapego', domainName: 'Estilo de Conexión', text: 'Prefiero estar solo/a que acompañado/a.', faceta: 'Retraimiento social' },
    { id: 7, domainKey: 'desapego', domainName: 'Estilo de Conexión', text: 'Mantengo mi distancia emocional de la gente.', faceta: 'Evitación de la intimidad' },
    { id: 8, domainKey: 'desapego', domainName: 'Estilo de Conexión', text: 'Me cuesta mucho disfrutar de las cosas de la vida.', faceta: 'Anhedonia' },
    { id: 9, domainKey: 'desapego', domainName: 'Estilo de Conexión', text: 'Rara vez me involucro emocionalmente con los demás.', faceta: 'Afectividad restringida' },
    { id: 10, domainKey: 'desapego', domainName: 'Estilo de Conexión', text: 'Evito hacer nuevos amigos o conocer gente nueva.', faceta: 'Retraimiento social' },

    // Dominio 3: Gestión de la Asertividad / Antagonismo (Ítems 11 - 15)
    { id: 11, domainKey: 'antagonismo', domainName: 'Gestión de la Asertividad', text: 'A menudo tengo que manipular a la gente para conseguir lo que quiero.', faceta: 'Manipulación' },
    { id: 12, domainKey: 'antagonismo', domainName: 'Gestión de la Asertividad', text: 'Siento que soy mejor o más importante que casi todo el mundo.', faceta: 'Grandiosidad' },
    { id: 13, domainKey: 'antagonismo', domainName: 'Gestión de la Asertividad', text: 'Disfruto aprovechándome de los demás si se presenta la oportunidad.', faceta: 'Insensibilidad' },
    { id: 14, domainKey: 'antagonismo', domainName: 'Gestión de la Asertividad', text: 'No me importa herir los sentimientos de otros si eso me beneficia.', faceta: 'Insensibilidad' },
    { id: 15, domainKey: 'antagonismo', domainName: 'Gestión de la Asertividad', text: 'Creo que para salir adelante, a veces tienes que engañar a la gente.', faceta: 'Engaño' },

    // Dominio 4: Impulso y Planificación / Desinhibición (Ítems 16 - 20)
    { id: 16, domainKey: 'desinhibicion', domainName: 'Impulso y Planificación', text: 'A menudo actúo de inmediato sin pensar en las consecuencias.', faceta: 'Impulsividad' },
    { id: 17, domainKey: 'desinhibicion', domainName: 'Impulso y Planificación', text: 'Hago las cosas en el momento sin planearlas en absoluto.', faceta: 'Temeridad / No planificación' },
    { id: 18, domainKey: 'desinhibicion', domainName: 'Impulso y Planificación', text: 'A menudo rompo mis promesas o no cumplo con mis acuerdos.', faceta: 'Irresponsabilidad' },
    { id: 19, domainKey: 'desinhibicion', domainName: 'Impulso y Planificación', text: 'Me aburro rápidamente de las tareas y pierdo el interés.', faceta: 'Distracción / Baja perseverancia' },
    { id: 20, domainKey: 'desinhibicion', domainName: 'Impulso y Planificación', text: 'Tomo decisiones precipitadas en el calor del momento.', faceta: 'Impulsividad' },

    // Dominio 5: Singularidad Cognitiva / Psicoticismo (Ítems 21 - 25)
    { id: 21, domainKey: 'psicoticismo', domainName: 'Singularidad Cognitiva', text: 'A menudo tengo pensamientos que no tienen sentido para los demás.', faceta: 'Creencias inusuales' },
    { id: 22, domainKey: 'psicoticismo', domainName: 'Singularidad Cognitiva', text: 'He tenido experiencias extrañas que son muy difíciles de explicar.', faceta: 'Experiencias inusuales' },
    { id: 23, domainKey: 'psicoticismo', domainName: 'Singularidad Cognitiva', text: 'A veces siento que las cosas a mi alrededor no son reales.', faceta: 'Desregulación perceptiva / Desrealización' },
    { id: 24, domainKey: 'psicoticismo', domainName: 'Singularidad Cognitiva', text: 'La gente suele pensar que mi forma de ser o hablar es excéntrica o rara.', faceta: 'Excentricidad' },
    { id: 25, domainKey: 'psicoticismo', domainName: 'Singularidad Cognitiva', text: 'A veces escucho o veo cosas que los demás no pueden percibir.', faceta: 'Percepción atípica' }
];

// Función para calcular los puntajes de los 5 dominios y generar la síntesis clínica resuelta
export const calcularResultadoPID5 = (rawAnswers = {}) => {
    // Normalizar llaves numéricas o con prefijo "item_"
    const answersMap = {};
    Object.entries(rawAnswers).forEach(([k, v]) => {
        const numId = parseInt(k.replace('item_', ''), 10);
        if (!isNaN(numId) && numId >= 1 && numId <= 25) {
            answersMap[numId] = parseInt(v, 10) || 0;
        }
    });

    let totalGlobal = 0;
    const dominiosResult = {};

    Object.values(PID5_DOMAINS).forEach(dom => {
        let domainScore = 0;
        dom.itemIds.forEach(itemId => {
            domainScore += (answersMap[itemId] !== undefined ? answersMap[itemId] : 0);
        });

        totalGlobal += domainScore;

        let nivelKey = 'baja';
        if (domainScore >= 11) nivelKey = 'alta';
        else if (domainScore >= 6) nivelKey = 'moderada';

        const nivelObj = dom.interpretacionPorNivel[nivelKey];

        dominiosResult[dom.key] = {
            key: dom.key,
            nombre: dom.nombre,
            aliasClinico: dom.aliasClinico,
            score: domainScore,
            max: 15,
            promedio: parseFloat((domainScore / 5).toFixed(2)),
            nivel: nivelObj.nivel,
            nivelKey,
            color: nivelObj.color,
            interpretacion: nivelObj.resumen,
            facetas: dom.facetasDSM5,
            descripcionDSM5: dom.descripcionDSM5
        };
    });

    const totalAnswered = Object.keys(answersMap).length;
    const promedioGlobal = parseFloat((totalGlobal / 25).toFixed(2));

    // Determinar dominios dominantes o destacados (puntuación >= 6)
    const dominiosDestacados = Object.values(dominiosResult)
        .filter(d => d.score >= 6)
        .sort((a, b) => b.score - a.score);

    return {
        totalGlobal,
        maxGlobal: 75,
        promedioGlobal,
        totalAnswered,
        dominios: dominiosResult,
        dominiosDestacados,
        rawAnswers: answersMap
    };
};

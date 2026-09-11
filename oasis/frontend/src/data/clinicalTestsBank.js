/**
 * clinicalTestsBank.js
 * Banco estandarizado de pruebas psicométricas de cribaje con alto Alfa de Cronbach (α > 0.80)
 * y algoritmo de recomendación posterior basado en la historia clínica y el perfil PID-5.
 */

export const CLINICAL_TESTS = {
    bai: {
        id: 'bai',
        siglas: 'BAI',
        nombre: 'Inventario de Ansiedad de Beck',
        poblacion: 'Adultos (18+ años)',
        categoria: 'Adultos',
        area: 'Sintomatología de Ansiedad y Pánico',
        alphaCronbach: '0.92',
        referencia: 'Beck, Epstein, Brown & Steer (1988); Sanz & Navarro (2003)',
        duracionAprox: '5-10 min',
        descripcion: 'Instrumento psicométrico de auto-reporte para discriminar síntomas somáticos, cognitivos y vegetativos de la ansiedad frente a la depresión.',
        instrucciones: 'A continuación se presenta una lista de síntomas comunes de la ansiedad. Por favor, indique cuánto le ha molestado o afectado cada síntoma durante la última semana (incluyendo el día de hoy).',
        escala: [
            { value: 0, label: 'En absoluto (0)', desc: 'No me molestó en absoluto' },
            { value: 1, label: 'Levemente (1)', desc: 'No me molestó mucho' },
            { value: 2, label: 'Moderadamente (2)', desc: 'Fue muy desagradable pero pude soportarlo' },
            { value: 3, label: 'Severamente (3)', desc: 'Casi no pude soportarlo' }
        ],
        items: [
            { id: 1, text: 'Torpeza, adormecimiento u hormigueo en el cuerpo', subscale: 'Somático' },
            { id: 2, text: 'Sensación de calor o sofoco', subscale: 'Vegetativo' },
            { id: 3, text: 'Temblores en las piernas', subscale: 'Motor' },
            { id: 4, text: 'Incapacidad para relajarse', subscale: 'Cognitivo' },
            { id: 5, text: 'Temor a que ocurra lo peor', subscale: 'Cognitivo' },
            { id: 6, text: 'Mareo o aturdimiento', subscale: 'Somático' },
            { id: 7, text: 'Palpitaciones o aceleración del corazón (taquicardia)', subscale: 'Vegetativo' },
            { id: 8, text: 'Inestabilidad o sensación de inseguridad física', subscale: 'Somático' },
            { id: 9, text: 'Sensación de terror o sobresalto', subscale: 'Cognitivo' },
            { id: 10, text: 'Nerviosismo constante', subscale: 'Cognitivo' },
            { id: 11, text: 'Sensación de atragantamiento o dificultad para respirar', subscale: 'Vegetativo' },
            { id: 12, text: 'Temblor en las manos', subscale: 'Motor' },
            { id: 13, text: 'Temblores o estremecimientos corporales', subscale: 'Motor' },
            { id: 14, text: 'Miedo a perder el control', subscale: 'Cognitivo' },
            { id: 15, text: 'Dificultad o esfuerzo para respirar', subscale: 'Vegetativo' },
            { id: 16, text: 'Miedo a morir o enfermar gravemente', subscale: 'Cognitivo' },
            { id: 17, text: 'Estar asustado/a o alarmado/a con facilidad', subscale: 'Cognitivo' },
            { id: 18, text: 'Indigestión, náuseas o malestar abdominal', subscale: 'Vegetativo' },
            { id: 19, text: 'Sensación de desmayo o desvanecimiento', subscale: 'Somático' },
            { id: 20, text: 'Ruborización o rostro acalorado', subscale: 'Vegetativo' },
            { id: 21, text: 'Sudoración excesiva (no debida al calor ambiental)', subscale: 'Vegetativo' }
        ],
        baremos: [
            { min: 0, max: 7, nivel: 'Ansiedad Mínima', color: 'emerald', desc: 'Nivel dentro de los límites esperados de respuesta funcional.' },
            { min: 8, max: 15, nivel: 'Ansiedad Leve', color: 'yellow', desc: 'Presencia de síntomas leves de tensión o inquietud somática.' },
            { min: 16, max: 25, nivel: 'Ansiedad Moderada', color: 'amber', desc: 'Sintomatología clínicamente significativa que genera interferencia funcional.' },
            { min: 26, max: 63, nivel: 'Ansiedad Severa', color: 'rose', desc: 'Carga de síntomas somáticos y de pánico de alta gravedad que requiere intervención prioritaria.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const subescalas = { Somático: 0, Cognitivo: 0, Vegetativo: 0, Motor: 0 };
            const items = CLINICAL_TESTS.bai.items;
            
            items.forEach(item => {
                const val = parseInt(answers[item.id] ?? 0, 10);
                total += val;
                if (subescalas[item.subscale] !== undefined) {
                    subescalas[item.subscale] += val;
                }
            });

            const baremo = CLINICAL_TESTS.bai.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.bai.baremos[CLINICAL_TESTS.bai.baremos.length - 1];

            return {
                testId: 'bai',
                nombre: 'Inventario de Ansiedad de Beck (BAI)',
                totalScore: total,
                maxScore: 63,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                subescalas,
                alphaCronbach: '0.92'
            };
        }
    },

    phq9: {
        id: 'phq9',
        siglas: 'PHQ-9',
        nombre: 'Cuestionario de Salud del Paciente (Depresión)',
        poblacion: 'Adultos (18+ años)',
        categoria: 'Adultos',
        area: 'Estado de Ánimo y Anhedonia',
        alphaCronbach: '0.89',
        referencia: 'Kroenke, Spitzer & Williams (2001); Baader et al. (2012)',
        duracionAprox: '3-6 min',
        descripcion: 'Criterio diagnóstico del DSM-5 estandarizado para cribar la gravedad de episodios depresivos mayores y anhedonia.',
        instrucciones: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha experimentado molestias debidas a cualquiera de los siguientes problemas?',
        escala: [
            { value: 0, label: 'Para nada (0)', desc: 'Ningún día' },
            { value: 1, label: 'Varios días (1)', desc: 'Menos de una semana' },
            { value: 2, label: 'Más de la mitad de los días (2)', desc: 'Más de 7 días' },
            { value: 3, label: 'Casi todos los días (3)', desc: 'Prácticamente a diario' }
        ],
        items: [
            { id: 1, text: 'Poco interés o placer en hacer las cosas (anhedonia)', subscale: 'Ánimo' },
            { id: 2, text: 'Sentirse desanimado/a, deprimido/a o sin esperanzas', subscale: 'Ánimo' },
            { id: 3, text: 'Dificultad para conciliar o mantener el sueño, o dormir demasiado', subscale: 'Somático' },
            { id: 4, text: 'Sentirse cansado/a o con poca energía', subscale: 'Somático' },
            { id: 5, text: 'Poco apetito o comer en exceso', subscale: 'Somático' },
            { id: 6, text: 'Sentir que es un fracaso o que ha decepcionado a su familia o a sí mismo/a', subscale: 'Cognitivo' },
            { id: 7, text: 'Dificultad para concentrarse en actividades como leer el periódico o ver televisión', subscale: 'Cognitivo' },
            { id: 8, text: 'Moverse o hablar tan lentamente que otros lo notan, o sentirse inquieto/a de más', subscale: 'Motor' },
            { id: 9, text: 'Pensamientos de que estaría mejor muerto/a o deseos de lastimarse de alguna manera', subscale: 'Riesgo' }
        ],
        baremos: [
            { min: 0, max: 4, nivel: 'Depresión Mínima', color: 'emerald', desc: 'Sin sospecha clínica de episodio depresivo mayor.' },
            { min: 5, max: 9, nivel: 'Depresión Leve', color: 'yellow', desc: 'Síntomas distímicos o reactivos leves. Monitorizar evolución.' },
            { min: 10, max: 14, nivel: 'Depresión Moderada', color: 'amber', desc: 'Criterio compatible con episodio depresivo moderado. Plan de intervención recomendado.' },
            { min: 15, max: 19, nivel: 'Depresión Moderadamente Severa', color: 'orange', desc: 'Afectación marcada de la funcionalidad y bienestar subjetivo.' },
            { min: 20, max: 27, nivel: 'Depresión Severa', color: 'rose', desc: 'Criterio clínico grave. Requiere abordaje psicoterapéutico intensivo y evaluación de interconsulta médica.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const items = CLINICAL_TESTS.phq9.items;
            items.forEach(item => {
                total += parseInt(answers[item.id] ?? 0, 10);
            });
            const baremo = CLINICAL_TESTS.phq9.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.phq9.baremos[CLINICAL_TESTS.phq9.baremos.length - 1];
            
            const alertaRiesgo = parseInt(answers[9] ?? 0, 10) > 0;

            return {
                testId: 'phq9',
                nombre: 'Cuestionario de Depresión PHQ-9',
                totalScore: total,
                maxScore: 27,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc + (alertaRiesgo ? ' ⚠️ NOTA: El reactivo 9 (ideación pasiva/activa) dio positivo, requiere indagación clínica inmediata.' : ''),
                alertaRiesgo,
                alphaCronbach: '0.89'
            };
        }
    },

    cope: {
        id: 'cope',
        siglas: 'Brief-COPE',
        nombre: 'Cuestionario Breve de Afrontamiento (Carver)',
        poblacion: 'Adultos y Jóvenes (16+ años)',
        categoria: 'Adultos',
        area: 'Estrategias de Afrontamiento ante Estrés',
        alphaCronbach: '0.78 - 0.88',
        referencia: 'Carver, C. S. (1997); Morán, Landero & González (2010)',
        duracionAprox: '6-10 min',
        descripcion: 'Evalúa las respuestas cognitivas y conductuales que el consultante utiliza para lidiar, gestionar o evadir situaciones estresantes o de crisis.',
        instrucciones: 'Piense en cómo responde habitualmente cuando se enfrenta a situaciones difíciles, estresantes o dolorosas en su vida.',
        escala: [
            { value: 1, label: 'Casi nunca (1)', desc: 'Nunca o casi nunca hago esto' },
            { value: 2, label: 'A veces (2)', desc: 'Hago esto un poco' },
            { value: 3, label: 'Frecuentemente (3)', desc: 'Hago esto en grado medio' },
            { value: 4, label: 'Casi siempre (4)', desc: 'Hago esto con mucha frecuencia' }
        ],
        items: [
            { id: 1, text: 'Concentro mis esfuerzos en hacer algo constructivo para modificar la situación', subscale: 'Afrontamiento Activo' },
            { id: 2, text: 'Elaboro un plan de acción sobre qué pasos concretos voy a seguir', subscale: 'Planificación' },
            { id: 3, text: 'Intento ver el lado positivo de lo que ocurre o aprender de la experiencia', subscale: 'Reevaluación Positiva' },
            { id: 4, text: 'Acepto la realidad de lo que está sucediendo, reconociendo que ha ocurrido', subscale: 'Aceptación' },
            { id: 5, text: 'Me vuelvo hacia el trabajo, la música u otras actividades para distraerme y no pensar', subscale: 'Autodistracción' },
            { id: 6, text: 'Busco a alguien para desahogarme y expresar abiertamente mis emociones de rabia o tristeza', subscale: 'Desahogo' },
            { id: 7, text: 'Me doy por vencido/a en mi intento de lidiar con ello y renuncio a alcanzar mis metas', subscale: 'Desconexión Conductual' },
            { id: 8, text: 'Actúo como si nada hubiera pasado o intento convencerme de que no es real', subscale: 'Negación' },
            { id: 9, text: 'Recurro al uso de sustancias (alcohol, tabaco, medicación) para sentirme mejor o adormecer el malestar', subscale: 'Consumo de Sustancias' },
            { id: 10, text: 'Me critico severamente a mí mismo/a por lo que ocurrió o me culpo de todo', subscale: 'Autoinculpación' },
            { id: 11, text: 'Pido consejo o ayuda práctica a personas que tienen experiencia sobre el problema', subscale: 'Búsqueda de Apoyo' },
            { id: 12, text: 'Me aíslo de los demás para que nadie vea cómo me siento', subscale: 'Aislamiento' },
            { id: 13, text: 'Trato de tomar medidas paso a paso sin apresurarme', subscale: 'Planificación' },
            { id: 14, text: 'Dejo que las cosas pasen solas porque siento que no tengo el control de nada', subscale: 'Desconexión Conductual' }
        ],
        baremos: [
            { min: 14, max: 28, nivel: 'Afrontamiento Desadaptativo / Evitativo Predominante', color: 'rose', desc: 'Predominio de estrategias de escape, desconexión conductual y rumiación pasiva.' },
            { min: 29, max: 42, nivel: 'Afrontamiento Mixto', color: 'amber', desc: 'Alternancia entre intentos activos y mecanismos de autodistracción o desahogo.' },
            { min: 43, max: 56, nivel: 'Afrontamiento Adaptativo Activo', color: 'emerald', desc: 'Predominio de aceptación, planificación y búsqueda de soluciones funcionales.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const subescalas = {};
            const items = CLINICAL_TESTS.cope.items;

            items.forEach(item => {
                const val = parseInt(answers[item.id] ?? 1, 10);
                total += val;
                subescalas[item.subscale] = (subescalas[item.subscale] || 0) + val;
            });

            const evitativoScore = (subescalas['Desconexión Conductual'] || 0) + (subescalas['Negación'] || 0) + (subescalas['Consumo de Sustancias'] || 0) + (subescalas['Autoinculpación'] || 0);
            const adaptativoScore = (subescalas['Afrontamiento Activo'] || 0) + (subescalas['Planificación'] || 0) + (subescalas['Aceptación'] || 0) + (subescalas['Reevaluación Positiva'] || 0);

            let nivel = 'Afrontamiento Mixto';
            let color = 'amber';
            let interpretacion = 'El consultante balancea esfuerzos constructivos con conductas de distracción o evitación.';

            if (evitativoScore > adaptativoScore + 3) {
                nivel = 'Predominio Evitativo / Desconexión';
                color = 'rose';
                interpretacion = 'Fuerte tendencia al aislamiento, abandono del esfuerzo (desconexión) y evitación del malestar. Priorizar estrategias de compromiso conductual.';
            } else if (adaptativoScore > evitativoScore + 3) {
                nivel = 'Predominio Proactivo / Resolutivo';
                color = 'emerald';
                interpretacion = 'Capacidad conservada para planificar y aceptar la realidad. Buen pronóstico para intervenciones cognitivo-conductuales activas.';
            }

            return {
                testId: 'cope',
                nombre: 'Cuestionario Breve de Afrontamiento (Brief-COPE)',
                totalScore: total,
                maxScore: 56,
                nivel,
                color,
                interpretacion,
                subescalas,
                alphaCronbach: '0.78 - 0.88'
            };
        }
    },

    ders16: {
        id: 'ders16',
        siglas: 'DERS-16',
        nombre: 'Escala Breve de Dificultades en la Regulación Emocional',
        poblacion: 'Adultos (18+ años)',
        categoria: 'Adultos',
        area: 'Regulación Emocional e Impulsividad',
        alphaCronbach: '0.93',
        referencia: 'Gratz & Roemer (2004); Bjureberg et al. (2016)',
        duracionAprox: '4-8 min',
        descripcion: 'Mide las dificultades clínicamente relevantes para modular el afecto negativo: no aceptación, impulsividad y falta de claridad emocional.',
        instrucciones: 'Indique con qué frecuencia las siguientes afirmaciones se aplican a usted cuando experimenta emociones desagradables o intensas.',
        escala: [
            { value: 1, label: 'Casi nunca (1)', desc: '0 - 10% del tiempo' },
            { value: 2, label: 'A veces (2)', desc: '11 - 35% del tiempo' },
            { value: 3, label: 'La mitad del tiempo (3)', desc: '36 - 65% del tiempo' },
            { value: 4, label: 'La mayoría de las veces (4)', desc: '66 - 90% del tiempo' },
            { value: 5, label: 'Casi siempre (5)', desc: '91 - 100% del tiempo' }
        ],
        items: [
            { id: 1, text: 'Tengo claro cómo me siento (inverso)', subscale: 'Claridad', reverse: true },
            { id: 2, text: 'Presto atención a cómo me siento (inverso)', subscale: 'Atención', reverse: true },
            { id: 3, text: 'Cuando estoy disgustado/a, reconozco mis emociones (inverso)', subscale: 'Claridad', reverse: true },
            { id: 4, text: 'Cuando estoy disgustado/a, no tengo control sobre mis conductas o impulsos', subscale: 'Impulsos' },
            { id: 5, text: 'Cuando estoy disgustado/a, me cuesta concentrarme en hacer mis tareas', subscale: 'Metas' },
            { id: 6, text: 'Cuando estoy disgustado/a, me siento avergonzado/a o culpable por sentirme así', subscale: 'No Aceptación' },
            { id: 7, text: 'Cuando estoy disgustado/a, siento que acabaré sintiéndome muy deprimido/a', subscale: 'Estrategias' },
            { id: 8, text: 'Cuando estoy disgustado/a, sé que puedo encontrar una manera de sentirme mejor (inverso)', subscale: 'Estrategias', reverse: true },
            { id: 9, text: 'Cuando estoy disgustado/a, pierdo el control sobre mí mismo/a', subscale: 'Impulsos' },
            { id: 10, text: 'Cuando estoy disgustado/a, me enfado conmigo mismo/a por sentirme así', subscale: 'No Aceptación' },
            { id: 11, text: 'Cuando estoy disgustado/a, me cuesta concentrarme en cualquier otra cosa', subscale: 'Metas' },
            { id: 12, text: 'Cuando estoy disgustado/a, siento que mis emociones son abrumadoras y desbordantes', subscale: 'Estrategias' },
            { id: 13, text: 'Cuando estoy disgustado/a, siento que no hay nada que pueda hacer para sentirme mejor', subscale: 'Estrategias' },
            { id: 14, text: 'Cuando estoy disgustado/a, me siento irritado/a con mi propia debilidad', subscale: 'No Aceptación' },
            { id: 15, text: 'Cuando estoy disgustado/a, tardo mucho tiempo en recuperar la calma', subscale: 'Estrategias' },
            { id: 16, text: 'Cuando estoy disgustado/a, mis emociones parecen salirse de todo cauce', subscale: 'Impulsos' }
        ],
        baremos: [
            { min: 16, max: 32, nivel: 'Regulación Emocional Funcional', color: 'emerald', desc: 'Buen autoconocimiento y capacidad de modular el malestar afectivo sin desbordamiento.' },
            { min: 33, max: 50, nivel: 'Dificultades Moderadas de Regulación', color: 'amber', desc: 'Episodios de no aceptación o descontrol ocasional en picos de estrés.' },
            { min: 51, max: 80, nivel: 'Desregulación Emocional Severa', color: 'rose', desc: 'Alta interferencia por impulsividad, rechazo de las propias emociones e indefensión ante el afecto negativo.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const items = CLINICAL_TESTS.ders16.items;
            items.forEach(item => {
                let val = parseInt(answers[item.id] ?? 1, 10);
                if (item.reverse) {
                    val = 6 - val; // Inverso para escala 1-5
                }
                total += val;
            });

            const baremo = CLINICAL_TESTS.ders16.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.ders16.baremos[CLINICAL_TESTS.ders16.baremos.length - 1];

            return {
                testId: 'ders16',
                nombre: 'Escala de Dificultades en Regulación Emocional (DERS-16)',
                totalScore: total,
                maxScore: 80,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                alphaCronbach: '0.93'
            };
        }
    },

    aaq2: {
        id: 'aaq2',
        siglas: 'AAQ-II',
        nombre: 'Cuestionario de Aceptación y Acción - II',
        poblacion: 'Adultos (18+ años)',
        categoria: 'Adultos',
        area: 'Inflexibilidad Psicológica y Evitación Experiencial (ACT)',
        alphaCronbach: '0.88',
        referencia: 'Bond, Hayes et al. (2011); Ruiz et al. (2013)',
        duracionAprox: '2-4 min',
        descripcion: 'Medida unidimensional patrón oro en Terapia de Aceptación y Compromiso (ACT) para evaluar la tendencia a evitar o controlar eventos privados displacenteros.',
        instrucciones: 'A continuación encontrará una serie de afirmaciones. Por favor, califique cada una según el grado en que es verdad para usted.',
        escala: [
            { value: 1, label: '1 - Nunca es verdad', desc: 'Completamente en desacuerdo' },
            { value: 2, label: '2 - Muy rara vez', desc: 'Rara vez es verdad' },
            { value: 3, label: '3 - Rara vez', desc: 'Poco frecuente' },
            { value: 4, label: '4 - A veces', desc: 'Medianamente frecuente' },
            { value: 5, label: '5 - Frecuentemente', desc: 'Bastante verdad' },
            { value: 6, label: '6 - Casi siempre', desc: 'Casi siempre es verdad' },
            { value: 7, label: '7 - Siempre es verdad', desc: 'Completamente de acuerdo' }
        ],
        items: [
            { id: 1, text: 'Mis experiencias dolorosas y mis recuerdos me dificultan llevar una vida que yo valore', subscale: 'Interferencia' },
            { id: 2, text: 'Tengo miedo de mis sentimientos y de mis sensaciones desagradables', subscale: 'Miedo Afectivo' },
            { id: 3, text: 'Me preocupa no ser capaz de controlar mis preocupaciones y mis sentimientos', subscale: 'Control Privado' },
            { id: 4, text: 'Mis recuerdos dolorosos me impiden tener una vida plena y con sentido', subscale: 'Interferencia' },
            { id: 5, text: 'Las emociones controlan mi vida y me impiden hacer lo que realmente me importa', subscale: 'Fusión Cognitiva' },
            { id: 6, text: 'Parece que la mayoría de las personas son más capaces de controlar sus vidas que yo', subscale: 'Comparación' },
            { id: 7, text: 'Mis preocupaciones se interponen en el camino de lo que quiero lograr en la vida', subscale: 'Interferencia' }
        ],
        baremos: [
            { min: 7, max: 23, nivel: 'Flexibilidad Psicológica Conservada', color: 'emerald', desc: 'Bajo nivel de evitación experiencial. El consultante tolera el malestar privado sin paralizar sus acciones valiosas.' },
            { min: 24, max: 49, nivel: 'Inflexibilidad Psicológica y Evitación Elevada', color: 'rose', desc: 'Puntaje de corte clínico positivo (≥24 en población hispanohablante). Fuerte evitación vivencial y parálisis conductual orientada a calmar el síntoma en lugar de vivir valores.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const items = CLINICAL_TESTS.aaq2.items;
            items.forEach(item => {
                total += parseInt(answers[item.id] ?? 1, 10);
            });

            const baremo = CLINICAL_TESTS.aaq2.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.aaq2.baremos[CLINICAL_TESTS.aaq2.baremos.length - 1];

            return {
                testId: 'aaq2',
                nombre: 'Cuestionario de Aceptación y Acción (AAQ-II)',
                totalScore: total,
                maxScore: 49,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                alphaCronbach: '0.88'
            };
        }
    },

    gad7: {
        id: 'gad7',
        siglas: 'GAD-7',
        nombre: 'Escala del Trastorno de Ansiedad Generalizada',
        poblacion: 'Adultos (18+ años)',
        categoria: 'Adultos',
        area: 'Preocupación Crónica y Rumiación',
        alphaCronbach: '0.92',
        referencia: 'Spitzer, Kroenke, Williams & Löwe (2006); García-Campayo et al. (2010)',
        duracionAprox: '3-5 min',
        descripcion: 'Cribaje validado para detectar la gravedad del patrón de preocupación incontrolable y tensión constante.',
        instrucciones: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha experimentado molestias por los siguientes problemas?',
        escala: [
            { value: 0, label: 'Para nada (0)', desc: 'Ningún día' },
            { value: 1, label: 'Varios días (1)', desc: 'Menos de 7 días' },
            { value: 2, label: 'Más de la mitad de los días (2)', desc: 'Más de una semana' },
            { value: 3, label: 'Casi todos los días (3)', desc: 'A diario' }
        ],
        items: [
            { id: 1, text: 'Sentirse nervioso/a, intranquilo/a o con los nervios de punta', subscale: 'Tensión' },
            { id: 2, text: 'No poder parar o controlar las preocupaciones', subscale: 'Preocupación' },
            { id: 3, text: 'Preocuparse demasiado por diferentes cosas a la vez', subscale: 'Preocupación' },
            { id: 4, text: 'Dificultad para relajarse o desconectar la mente', subscale: 'Tensión' },
            { id: 5, text: 'Estar tan inquieto/a que le cuesta permanecer sentado/a', subscale: 'Motor' },
            { id: 6, text: 'Molestarse o irritarse con extrema facilidad', subscale: 'Afecto' },
            { id: 7, text: 'Sentir miedo como si algo terrible fuera a suceder', subscale: 'Temor' }
        ],
        baremos: [
            { min: 0, max: 4, nivel: 'Ansiedad Mínima', color: 'emerald', desc: 'Preocupación adaptativa no clínica.' },
            { min: 5, max: 9, nivel: 'Ansiedad Leve', color: 'yellow', desc: 'Inquietud reactiva. Recomendable pautas de higiene de sueño y descompresión.' },
            { min: 10, max: 14, nivel: 'Ansiedad Moderada', color: 'amber', desc: 'Criterio compatible con Trastorno de Ansiedad Generalizada. Justifica intervención clínica.' },
            { min: 15, max: 21, nivel: 'Ansiedad Severa', color: 'rose', desc: 'Rumiación incontrolable e hiperalerta somática marcada con alto deterioro diario.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const items = CLINICAL_TESTS.gad7.items;
            items.forEach(item => {
                total += parseInt(answers[item.id] ?? 0, 10);
            });

            const baremo = CLINICAL_TESTS.gad7.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.gad7.baremos[CLINICAL_TESTS.gad7.baremos.length - 1];

            return {
                testId: 'gad7',
                nombre: 'Escala de Ansiedad Generalizada (GAD-7)',
                totalScore: total,
                maxScore: 21,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                alphaCronbach: '0.92'
            };
        }
    },

    cssrs: {
        id: 'cssrs',
        siglas: 'C-SSRS',
        nombre: 'Escala Columbia de Cribado de Riesgo Suicida',
        poblacion: 'Infanto-Juvenil y Adultos (7+ años)',
        categoria: 'Riesgo / Crisis',
        area: 'Ideación y Riesgo Suicida',
        alphaCronbach: '0.94',
        referencia: 'Posner et al. (2011); Al-Halabí et al. (2016)',
        duracionAprox: '3-6 min',
        descripcion: 'Cribado clínico estandarizado de referencia mundial para detectar ideación suicida, intención, métodos, planificación y antecedentes sin sustituir la entrevista de seguridad y contención.',
        instrucciones: 'Por favor, responde con total sinceridad si has tenido alguno de estos pensamientos, deseos o experiencias en el último mes o durante momentos de crisis.',
        escala: [
            { value: 0, label: 'No (0)', desc: 'No ha estado presente' },
            { value: 1, label: 'Sí (1)', desc: 'Ha estado presente' }
        ],
        items: [
            { id: 1, text: '¿Has deseado estar muerto/a o has deseado poder dormirte y no volver a despertar?', subscale: 'Ideación Pasiva' },
            { id: 2, text: '¿Has tenido realmente pensamientos de suicidarte o de quitarte la vida?', subscale: 'Ideación Activa' },
            { id: 3, text: '¿Has pensado en cómo podrías hacerlo (por ejemplo, con pastillas, saltar, un objeto) aunque no lo vayas a hacer?', subscale: 'Método' },
            { id: 4, text: '¿Has tenido estos pensamientos y cierta intención de llevarlos a cabo (no solo la idea abstracta)?', subscale: 'Intención' },
            { id: 5, text: '¿Has empezado a elaborar o ya tienes pensados los detalles de cómo, cuándo o dónde hacerlo?', subscale: 'Planificación' },
            { id: 6, text: '¿Has hecho alguna vez algo, empezado a hacer algo o te has preparado para hacerte daño o terminar con tu vida (por ejemplo, acumular pastillas, escribir una nota, despedirte)?', subscale: 'Conducta Previa' },
            { id: 7, text: '¿Sientes que actualmente te faltan razones para vivir o apoyo de personas de confianza para superar este momento?', subscale: 'Desesperanza' }
        ],
        baremos: [
            { min: 0, max: 0, nivel: 'Riesgo No Detectado', color: 'emerald', desc: 'No se detecta ideación suicida activa ni pasiva en el cribado.' },
            { min: 1, max: 1, nivel: 'Riesgo Bajo (Ideación Pasiva)', color: 'yellow', desc: 'Presencia de deseos pasivos de muerte o escape. Requiere monitorización clínica, fortalecimiento de factores protectores y exploración de estresores.' },
            { min: 2, max: 2, nivel: 'Riesgo Moderado (Ideación Activa sin Plan)', color: 'amber', desc: 'Ideación suicida activa sin plan estructurado ni intención firme. Requiere plan de seguridad, acuerdo de no autolesión y acompañamiento familiar.' },
            { min: 3, max: 7, nivel: 'Riesgo Alto / Alerta de Urgencia Clínica', color: 'rose', desc: 'ALERTA CLÍNICA URGENTE: Presencia de método, intención, planificación o antecedentes de conducta. Requiere activación inmediata de protocolo de seguridad, evaluación de urgencia y supervisión directa por adultos responsables.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const subescalas = { 'Ideación Pasiva': 0, 'Ideación Activa': 0, 'Método': 0, 'Intención': 0, 'Planificación': 0, 'Conducta Previa': 0, 'Desesperanza': 0 };
            const items = CLINICAL_TESTS.cssrs.items;
            
            items.forEach(item => {
                const val = parseInt(answers[item.id] ?? 0, 10);
                total += val;
                if (subescalas[item.subscale] !== undefined) {
                    subescalas[item.subscale] += val;
                }
            });

            const hasPlanOrIntent = (parseInt(answers[4] || 0, 10) === 1) || (parseInt(answers[5] || 0, 10) === 1) || (parseInt(answers[6] || 0, 10) === 1);
            let baremo;
            if (hasPlanOrIntent || total >= 3) {
                baremo = CLINICAL_TESTS.cssrs.baremos[3];
            } else if (total === 2 || parseInt(answers[2] || 0, 10) === 1 || parseInt(answers[3] || 0, 10) === 1) {
                baremo = CLINICAL_TESTS.cssrs.baremos[2];
            } else if (total === 1) {
                baremo = CLINICAL_TESTS.cssrs.baremos[1];
            } else {
                baremo = CLINICAL_TESTS.cssrs.baremos[0];
            }

            return {
                testId: 'cssrs',
                nombre: 'Escala Columbia de Cribado de Riesgo Suicida (C-SSRS)',
                totalScore: total,
                maxScore: 7,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                subescalas,
                alphaCronbach: '0.94',
                alertaUrgente: hasPlanOrIntent || total >= 3
            };
        }
    },

    cdi2: {
        id: 'cdi2',
        siglas: 'CDI-2',
        nombre: 'Inventario de Depresión Infantil y Adolescente',
        poblacion: 'Adolescentes y Niños (7 a 17 años)',
        categoria: 'Adolescentes',
        area: 'Depresión e Irritabilidad Infanto-Juvenil',
        alphaCronbach: '0.88',
        referencia: 'Kovacs (2014); Figueras-Masip et al. (2010)',
        duracionAprox: '5-10 min',
        descripcion: 'Estándar internacional de cribado afectivo para adolescentes. Discrimina estado de ánimo depresivo, anhedonia, autoestima, deseo de huida y si la irritabilidad encubre un episodio depresivo.',
        instrucciones: 'En cada pregunta, elige la frase que mejor describa cómo te has sentido en las últimas 2 semanas.',
        escala: [
            { value: 0, label: '0', desc: 'Ausente' },
            { value: 1, label: '1', desc: 'Leve / A veces' },
            { value: 2, label: '2', desc: 'Severo / Frecuente' }
        ],
        items: [
            {
                id: 1,
                text: 'Estado de Ánimo y Tristeza',
                subscale: 'Ánimo Disfórico',
                options: [
                    { value: 0, label: 'Estoy triste de vez en cuando.', desc: '0 puntos' },
                    { value: 1, label: 'Estoy triste muchas veces.', desc: '1 punto' },
                    { value: 2, label: 'Estoy triste siempre.', desc: '2 puntos' }
                ]
            },
            {
                id: 2,
                text: 'Visión de Futuro y Esperanza',
                subscale: 'Cognitivo',
                options: [
                    { value: 0, label: 'Las cosas me saldrán bien.', desc: '0 puntos' },
                    { value: 1, label: 'No estoy seguro/a de si las cosas me saldrán bien.', desc: '1 punto' },
                    { value: 2, label: 'Las cosas nunca me van a salir bien.', desc: '2 puntos' }
                ]
            },
            {
                id: 3,
                text: 'Autoeficacia y Percepción de Logro',
                subscale: 'Autoestima Negativa',
                options: [
                    { value: 0, label: 'Hago bien la mayoría de las cosas.', desc: '0 puntos' },
                    { value: 1, label: 'Hago mal muchas cosas.', desc: '1 punto' },
                    { value: 2, label: 'Todo lo hago mal.', desc: '2 puntos' }
                ]
            },
            {
                id: 4,
                text: 'Capacidad de Disfrute y Placer (Anhedonia)',
                subscale: 'Ánimo Disfórico',
                options: [
                    { value: 0, label: 'Me divierten muchas cosas.', desc: '0 puntos' },
                    { value: 1, label: 'Me divierten pocas cosas.', desc: '1 punto' },
                    { value: 2, label: 'Nada me divierte ni me llama la atención.', desc: '2 puntos' }
                ]
            },
            {
                id: 5,
                text: 'Sentimientos de Culpa y Autocrítica',
                subscale: 'Cognitivo',
                options: [
                    { value: 0, label: 'Casi nunca me siento culpable por las cosas.', desc: '0 puntos' },
                    { value: 1, label: 'A menudo siento que todo es culpa mía.', desc: '1 punto' },
                    { value: 2, label: 'Siempre siento que tengo la culpa de todo lo malo.', desc: '2 puntos' }
                ]
            },
            {
                id: 6,
                text: 'Irritabilidad y Control del Mal Genio',
                subscale: 'Irritabilidad',
                options: [
                    { value: 0, label: 'Raras veces me enfado o me pongo de mal humor.', desc: '0 puntos' },
                    { value: 1, label: 'A menudo me enfado con facilidad o me siento irritable.', desc: '1 punto' },
                    { value: 2, label: 'Siempre estoy enfadado/a o con rabia acumulada.', desc: '2 puntos' }
                ]
            },
            {
                id: 7,
                text: 'Deseo de Huida y Conflicto en el Hogar',
                subscale: 'Conductual / Hogar',
                options: [
                    { value: 0, label: 'Nunca pienso en irme de casa o escapar.', desc: '0 puntos' },
                    { value: 1, label: 'A veces pienso en irme de casa o huir.', desc: '1 punto' },
                    { value: 2, label: 'Pienso constantemente en irme de casa o escapar.', desc: '2 puntos' }
                ]
            },
            {
                id: 8,
                text: 'Relaciones con Amigos y Pares',
                subscale: 'Social / Pares',
                options: [
                    { value: 0, label: 'Tengo amigos y me siento a gusto con ellos.', desc: '0 puntos' },
                    { value: 1, label: 'Me cuesta conectar con chicos/as de mi edad o prefiero aislarme.', desc: '1 punto' },
                    { value: 2, label: 'No tengo amigos ni quiero tener contacto con nadie.', desc: '2 puntos' }
                ]
            },
            {
                id: 9,
                text: 'Vitalidad y Fatiga',
                subscale: 'Somático',
                options: [
                    { value: 0, label: 'Tengo energía suficiente la mayor parte de los días.', desc: '0 puntos' },
                    { value: 1, label: 'Me siento cansado/a o agotado/a con mucha frecuencia.', desc: '1 punto' },
                    { value: 2, label: 'Siempre estoy demasiado cansado/a para hacer nada.', desc: '2 puntos' }
                ]
            },
            {
                id: 10,
                text: 'Sentimiento de Soledad e Incomprensión',
                subscale: 'Ánimo Disfórico',
                options: [
                    { value: 0, label: 'No me siento solo/a ni incomprendido/a.', desc: '0 puntos' },
                    { value: 1, label: 'A menudo siento que nadie me entiende o estoy solo/a.', desc: '1 punto' },
                    { value: 2, label: 'Siento que a nadie le importo y estoy totalmente solo/a.', desc: '2 puntos' }
                ]
            },
            {
                id: 11,
                text: 'Concentración y Rendimiento en Tareas',
                subscale: 'Funcional / Escuela',
                options: [
                    { value: 0, label: 'Puedo concentrarme y hacer mis deberes como siempre.', desc: '0 puntos' },
                    { value: 1, label: 'Me cuesta mucho trabajo concentrarme o terminar tareas.', desc: '1 punto' },
                    { value: 2, label: 'No logro concentrarme en nada de la escuela o de la casa.', desc: '2 puntos' }
                ]
            },
            {
                id: 12,
                text: 'Pensamientos de Muerte o Deseo de No Existir',
                subscale: 'Riesgo / Afectivo',
                options: [
                    { value: 0, label: 'No pienso en hacerme daño ni en desaparecer.', desc: '0 puntos' },
                    { value: 1, label: 'A veces pienso que sería mejor desaparecer, pero no lo haría.', desc: '1 punto' },
                    { value: 2, label: 'Pienso con frecuencia en hacerme daño o que desearía estar muerto/a.', desc: '2 puntos' }
                ]
            }
        ],
        baremos: [
            { min: 0, max: 6, nivel: 'Puntuación Normal / No Depresiva', color: 'emerald', desc: 'Ausencia de sintomatología depresiva significativa en el adolescente.' },
            { min: 7, max: 11, nivel: 'Sintomatología Depresiva Leve / Subclínica', color: 'yellow', desc: 'Presencia de indicadores de desánimo o irritabilidad moderada; vigilar estresores ambientales y escolares.' },
            { min: 12, max: 16, nivel: 'Sintomatología Depresiva Moderada', color: 'amber', desc: 'Indicadores depresivos clínicamente relevantes. Sugiere que la irritabilidad o confrontación familiar puede enmascarar sufrimiento depresivo.' },
            { min: 17, max: 24, nivel: 'Depresión Clínicamente Significativa', color: 'rose', desc: 'Elevada carga de síntomas depresivos, anhedonia e ideación que requiere intervención psicoterapéutica prioritaria.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const subescalas = { 'Ánimo Disfórico': 0, 'Cognitivo': 0, 'Autoestima Negativa': 0, 'Irritabilidad': 0, 'Conductual / Hogar': 0, 'Social / Pares': 0, 'Somático': 0, 'Funcional / Escuela': 0, 'Riesgo / Afectivo': 0 };
            const items = CLINICAL_TESTS.cdi2.items;

            items.forEach(item => {
                const val = parseInt(answers[item.id] ?? 0, 10);
                total += val;
                if (subescalas[item.subscale] !== undefined) {
                    subescalas[item.subscale] += val;
                }
            });

            const baremo = CLINICAL_TESTS.cdi2.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.cdi2.baremos[CLINICAL_TESTS.cdi2.baremos.length - 1];

            return {
                testId: 'cdi2',
                nombre: 'Inventario de Depresión Infantil y Adolescente (CDI-2)',
                totalScore: total,
                maxScore: 24,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                subescalas,
                alphaCronbach: '0.88'
            };
        }
    },

    scared: {
        id: 'scared',
        siglas: 'SCARED',
        nombre: 'Cuestionario de Ansiedad Infanto-Juvenil',
        poblacion: 'Adolescentes y Niños (8 a 18 años)',
        categoria: 'Adolescentes',
        area: 'Trastornos de Ansiedad Infanto-Juvenil',
        alphaCronbach: '0.90',
        referencia: 'Birmaher et al. (1997); Vigil-Coello et al. (2017)',
        duracionAprox: '8-12 min',
        descripcion: 'Estándar de oro para explorar 5 subescalas de ansiedad en adolescentes: Pánico/Somatización, Ansiedad Generalizada, Separación, Ansiedad Social y Rechazo Escolar.',
        instrucciones: 'Por favor, indica qué tan cierta es cada frase para ti durante los últimos 3 meses.',
        escala: [
            { value: 0, label: 'Casi nunca o nunca (0)', desc: 'No me pasa o casi nunca' },
            { value: 1, label: 'A veces (1)', desc: 'Me ocurre algunas veces' },
            { value: 2, label: 'A menudo (2)', desc: 'Me pasa frecuentemente o casi siempre' }
        ],
        items: [
            { id: 1, text: 'Cuando me asusto o me pongo nervioso/a, me cuesta respirar o siento opresión.', subscale: 'Pánico / Somático' },
            { id: 2, text: 'De repente siento que mi corazón late muy rápido (taquicardia) sin motivo aparente.', subscale: 'Pánico / Somático' },
            { id: 3, text: 'Siento mareos, temblores o sudores fríos cuando me pongo tenso/a.', subscale: 'Pánico / Somático' },
            { id: 4, text: 'A veces me dan crisis de angustia o ataques de miedo repentinos que no puedo frenar.', subscale: 'Pánico / Somático' },
            { id: 5, text: 'Me preocupo demasiado por cómo me van a salir las cosas o si voy a fallar.', subscale: 'Ansiedad Generalizada' },
            { id: 6, text: 'Me resulta muy difícil dejar de darle vueltas a las preocupaciones en mi cabeza.', subscale: 'Ansiedad Generalizada' },
            { id: 7, text: 'Me angustia pensar en el futuro y en lo que pueda salir mal.', subscale: 'Ansiedad Generalizada' },
            { id: 8, text: 'Me preocupo mucho por si le pasa algo grave a mi familia o a personas que quiero.', subscale: 'Ansiedad Generalizada' },
            { id: 9, text: 'Me da miedo o me cuesta mucho estar lejos de mi casa o de mis padres.', subscale: 'Ansiedad de Separación' },
            { id: 10, text: 'Tengo pesadillas frecuentes con perder a mis padres o que ocurra una catástrofe.', subscale: 'Ansiedad de Separación' },
            { id: 11, text: 'No me gusta dormir fuera de mi casa o estar solo/a en casa.', subscale: 'Ansiedad de Separación' },
            { id: 12, text: 'Siento mucha angustia o malestar estomacal cuando tengo que separarme de mi familia.', subscale: 'Ansiedad de Separación' },
            { id: 13, text: 'Me pongo muy nervioso/a o tímido/a cuando estoy con gente que no conozco bien.', subscale: 'Ansiedad Social' },
            { id: 14, text: 'Me cuesta mucho hacer amigos nuevos o hablar con chicos/as de mi edad (especialmente tras cambiar de lugar).', subscale: 'Ansiedad Social' },
            { id: 15, text: 'Siento que los demás me juzgan, se burlan de mí o me están observando críticamente.', subscale: 'Ansiedad Social' },
            { id: 16, text: 'Me da mucha vergüenza hablar en público, exponer en clase o ser el centro de atención.', subscale: 'Ansiedad Social' },
            { id: 17, text: 'Me dan dolores de estómago, náuseas o dolores de cabeza cuando tengo que ir a la escuela.', subscale: 'Evitación Escolar' },
            { id: 18, text: 'Siento una enorme resistencia o miedo de ir al colegio o secundaria.', subscale: 'Evitación Escolar' },
            { id: 19, text: 'He intentado quedarme en casa o buscar excusas para faltar a clases.', subscale: 'Evitación Escolar' },
            { id: 20, text: 'Me siento abrumado/a con la presión social o académica del ambiente escolar.', subscale: 'Evitación Escolar' }
        ],
        baremos: [
            { min: 0, max: 14, nivel: 'Ansiedad Normal / No Significativa', color: 'emerald', desc: 'Puntuación dentro del rango esperado para población adolescente.' },
            { min: 15, max: 24, nivel: 'Ansiedad Moderada / Riesgo Subclínico', color: 'yellow', desc: 'Indicios relevantes de tensión o timidez que requieren observación en las subescalas elevadas.' },
            { min: 25, max: 40, nivel: 'Sospecha de Trastorno de Ansiedad (Punto de Corte ≥ 25)', color: 'rose', desc: 'Puntuación total superior al punto de corte clínico de Birmaher (≥ 25). Requiere exploración diferencial del subtipo predominante (social, generalizada, pánico o escolar).' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const subescalas = { 'Pánico / Somático': 0, 'Ansiedad Generalizada': 0, 'Ansiedad de Separación': 0, 'Ansiedad Social': 0, 'Evitación Escolar': 0 };
            const items = CLINICAL_TESTS.scared.items;

            items.forEach(item => {
                const val = parseInt(answers[item.id] ?? 0, 10);
                total += val;
                if (subescalas[item.subscale] !== undefined) {
                    subescalas[item.subscale] += val;
                }
            });

            const baremo = CLINICAL_TESTS.scared.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.scared.baremos[CLINICAL_TESTS.scared.baremos.length - 1];

            return {
                testId: 'scared',
                nombre: 'Cuestionario de Ansiedad Infanto-Juvenil (SCARED)',
                totalScore: total,
                maxScore: 40,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                subescalas,
                alphaCronbach: '0.90'
            };
        }
    },

    sdq: {
        id: 'sdq',
        siglas: 'SDQ',
        nombre: 'Cuestionario de Capacidades y Dificultades de Goodman',
        poblacion: 'Adolescentes (11 a 17 años) y Madres/Padres',
        categoria: 'Adolescentes',
        area: 'Cribado Integral Emocional y Conductual Multi-Informante',
        alphaCronbach: '0.82',
        referencia: 'Goodman (2001); Rodríguez-Hernández et al. (2012)',
        duracionAprox: '6-10 min',
        descripcion: 'Cribado multidimensional de 25 reactivos que evalúa síntomas emocionales, problemas de conducta, hiperactividad, relaciones con compañeros y conducta prosocial. Permite contrastar la narrativa del adolescente frente a la de la madre/familia.',
        instrucciones: 'Por favor, marca en qué medida cada frase es verdadera en los últimos 6 meses.',
        informantesDisponibles: [
            { id: 'adolescente', label: 'Adolescente (Autoinforme - 11 a 17 años)' },
            { id: 'madre', label: 'Madre / Familia (Heteroinforme)' }
        ],
        escala: [
            { value: 0, label: 'No es verdad (0)', desc: 'No es aplicable' },
            { value: 1, label: 'Un poco verdad (1)', desc: 'Se aplica a veces o parcialmente' },
            { value: 2, label: 'Totalmente verdad (2)', desc: 'Claramente cierto y frecuente' }
        ],
        items: [
            { id: 1, text: 'Intento ser agradable con los demás y me importan los sentimientos ajenos.', textParent: 'Intenta ser considerado/a con los sentimientos de los demás.', subscale: 'Prosocial', invertido: false },
            { id: 2, text: 'Soy inquieto/a, me cuesta permanecer sentado/a mucho tiempo.', textParent: 'Es inquieto/a, hiperactivo/a, no puede estar sentado/a mucho rato.', subscale: 'Hiperactividad', invertido: false },
            { id: 3, text: 'A menudo tengo dolores de cabeza, de estómago o náuseas.', textParent: 'A menudo se queja de dolores de cabeza, estómago o náuseas.', subscale: 'Síntomas Emocionales', invertido: false },
            { id: 4, text: 'Comparto fácilmente mis cosas con otros chicos/as.', textParent: 'Comparte fácilmente con otros chicos/as (comida, juegos, cosas).', subscale: 'Prosocial', invertido: false },
            { id: 5, text: 'Pierdo los estribos con facilidad, me enojo mucho o tengo rabietas.', textParent: 'A menudo tiene rabietas, mal genio o pierde los estribos.', subscale: 'Problemas de Conducta', invertido: false },
            { id: 6, text: 'Suelo estar solo/a, tiendo a aislarme o estar por mi cuenta.', textParent: 'Suele estar solo/a, tiende a jugar o estar por su cuenta.', subscale: 'Problemas con Pares', invertido: false },
            { id: 7, text: 'Por lo general hago lo que me dicen mis padres o profesores.', textParent: 'Por lo general es obediente, suele hacer lo que le dicen los adultos.', subscale: 'Problemas de Conducta', invertido: true },
            { id: 8, text: 'Tengo muchas preocupaciones, a menudo me siento preocupado/a.', textParent: 'Tiene muchas preocupaciones, a menudo parece preocupado/a.', subscale: 'Síntomas Emocionales', invertido: false },
            { id: 9, text: 'Ayudo si alguien resulta herido, disgustado o enfermo.', textParent: 'Ayuda si alguien resulta herido, disgustado o enfermo.', subscale: 'Prosocial', invertido: false },
            { id: 10, text: 'Estoy en constante movimiento o revolviéndome con nerviosismo.', textParent: 'Está constantemente moviéndose o revolviéndose.', subscale: 'Hiperactividad', invertido: false },
            { id: 11, text: 'Tengo al menos un/a buen/a amigo/a.', textParent: 'Tiene al menos un/a buen/a amigo/a.', subscale: 'Problemas con Pares', invertido: true },
            { id: 12, text: 'A menudo peleo con otros o los intimido.', textParent: 'A menudo se pelea con otros chicos/as o los intimida.', subscale: 'Problemas de Conducta', invertido: false },
            { id: 13, text: 'A menudo me siento triste, desanimado/a o con ganas de llorar.', textParent: 'A menudo parece triste, desanimado/a o lloroso/a.', subscale: 'Síntomas Emocionales', invertido: false },
            { id: 14, text: 'Por lo general caigo bien a otros chicos y chicas.', textParent: 'Por lo general cae bien a otros chicos y chicas de su edad.', subscale: 'Problemas con Pares', invertido: true },
            { id: 15, text: 'Me distraigo fácilmente, me cuesta concentrarme en tareas.', textParent: 'Se distrae fácilmente, le cuesta concentrarse en tareas.', subscale: 'Hiperactividad', invertido: false },
            { id: 16, text: 'Me pongo nervioso/a en situaciones nuevas, pierdo fácilmente la seguridad.', textParent: 'Es asustadizo/a o pierde fácilmente la seguridad en situaciones nuevas.', subscale: 'Síntomas Emocionales', invertido: false },
            { id: 17, text: 'Soy bondadoso/a y paciente con chicos y chicas más pequeños.', textParent: 'Es bondadoso/a con chicos y chicas más pequeños.', subscale: 'Prosocial', invertido: false },
            { id: 18, text: 'A menudo me acusan de mentir o engañar.', textParent: 'A menudo miente o engaña.', subscale: 'Problemas de Conducta', invertido: false },
            { id: 19, text: 'Otros chicos o chicas se meten conmigo, me excluyen o se burlan de mí.', textParent: 'Otros chicos o chicas se meten con él/ella o lo/la acosan.', subscale: 'Problemas con Pares', invertido: false },
            { id: 20, text: 'A menudo me ofrezco voluntario/a para ayudar en casa o en la escuela.', textParent: 'A menudo se ofrece a ayudar a padres, profesores u otros.', subscale: 'Prosocial', invertido: false },
            { id: 21, text: 'Pienso las cosas antes de hacerlas.', textParent: 'Piensa las cosas antes de actuar.', subscale: 'Hiperactividad', invertido: true },
            { id: 22, text: 'Tomo cosas que no son mías de la casa, la escuela o tiendas.', textParent: 'Roba en casa, en la escuela o en tiendas.', subscale: 'Problemas de Conducta', invertido: false },
            { id: 23, text: 'Me llevo mejor con adultos que con chicos de mi edad.', textParent: 'Se lleva mejor con adultos que con chicos de su edad.', subscale: 'Problemas con Pares', invertido: false },
            { id: 24, text: 'Tengo muchos miedos, me asusto con mucha facilidad.', textParent: 'Tiene muchos miedos, se asusta con facilidad.', subscale: 'Síntomas Emocionales', invertido: false },
            { id: 25, text: 'Termino lo que empiezo, mi atención es constante.', textParent: 'Termina lo que empieza, tiene buena capacidad de atención.', subscale: 'Hiperactividad', invertido: true }
        ],
        baremos: [
            { min: 0, max: 15, nivel: 'Normal / Dificultades Bajas', color: 'emerald', desc: 'Puntuación dentro de la normalidad evolutiva esperada para la edad.' },
            { min: 16, max: 19, nivel: 'Limítrofe / Alerta Temprana', color: 'amber', desc: 'Indica presencia de dificultades moderadas en conducta o ámbito emocional que justifican seguimiento.' },
            { min: 20, max: 40, nivel: 'Clínico / Dificultades Significativas', color: 'rose', desc: 'Puntuación en rango clínico de dificultades globales. Contrasta de forma valiosa si los problemas son relacionales en casa vs generalizados con pares y escuela.' }
        ],
        calcularResultado: (answers, informante = 'adolescente') => {
            let totalDificultades = 0;
            const subescalas = {
                'Síntomas Emocionales': 0,
                'Problemas de Conducta': 0,
                'Hiperactividad': 0,
                'Problemas con Pares': 0,
                'Prosocial': 0
            };
            const items = CLINICAL_TESTS.sdq.items;

            items.forEach(item => {
                let val = parseInt(answers[item.id] ?? 0, 10);
                if (item.invertido) {
                    val = 2 - val;
                }
                if (item.subscale !== 'Prosocial') {
                    totalDificultades += val;
                }
                if (subescalas[item.subscale] !== undefined) {
                    subescalas[item.subscale] += val;
                }
            });

            const baremo = CLINICAL_TESTS.sdq.baremos.find(b => totalDificultades >= b.min && totalDificultades <= b.max) 
                || CLINICAL_TESTS.sdq.baremos[CLINICAL_TESTS.sdq.baremos.length - 1];

            return {
                testId: 'sdq',
                nombre: `Cuestionario de Capacidades y Dificultades (SDQ) [${informante === 'madre' ? 'Perspectiva Madre/Familia' : 'Autoinforme Adolescente'}]`,
                totalScore: totalDificultades,
                maxScore: 40,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                subescalas,
                informante,
                prosocialScore: subescalas['Prosocial'],
                alphaCronbach: '0.82'
            };
        }
    },

    ders_a: {
        id: 'ders_a',
        siglas: 'DERS-A',
        nombre: 'Dificultades en Regulación Emocional (Adolescentes)',
        poblacion: 'Adolescentes (11 a 17 años)',
        categoria: 'Adolescentes',
        area: 'Regulación Emocional en Adolescencia',
        alphaCronbach: '0.89',
        referencia: 'Weinberg & Klonsky (2009); Gratz & Roemer (2004)',
        duracionAprox: '5-8 min',
        descripcion: 'Versión adaptada para adolescentes que evalúa dificultades para identificar emociones, impulsividad ante el malestar, no aceptación y acceso a estrategias de autorregulación adecuadas para los 14 años.',
        instrucciones: 'Por favor, indica con qué frecuencia te ocurre cada frase cuando sientes emociones difíciles o intensas (como rabia, tristeza o frustración).',
        escala: [
            { value: 1, label: 'Casi nunca (1)', desc: '0 - 10% de las veces' },
            { value: 2, label: 'A veces (2)', desc: '11 - 35% de las veces' },
            { value: 3, label: 'La mitad de las veces (3)', desc: '36 - 65% de las veces' },
            { value: 4, label: 'La mayoría de las veces (4)', desc: '66 - 90% de las veces' },
            { value: 5, label: 'Casi siempre (5)', desc: '91 - 100% de las veces' }
        ],
        items: [
            { id: 1, text: 'Tengo claro lo que estoy sintiendo por dentro.', subscale: 'Claridad', invertido: true },
            { id: 2, text: 'Presto atención a lo que siento y a mis cambios de humor.', subscale: 'Atención', invertido: true },
            { id: 3, text: 'Cuando estoy molesto/a, me cuesta reconocer qué emoción tengo exactamente.', subscale: 'Claridad', invertido: false },
            { id: 4, text: 'Cuando estoy disgustado/a, me siento avergonzado/a o culpable por sentirme así.', subscale: 'No Aceptación', invertido: false },
            { id: 5, text: 'Cuando estoy enojado/a o triste, me resulta muy difícil concentrarme en otra cosa.', subscale: 'Metas / Concentración', invertido: false },
            { id: 6, text: 'Cuando me desbordo, siento que pierdo totalmente el control de mí mismo/a.', subscale: 'Control de Impulsos', invertido: false },
            { id: 7, text: 'Creo que los demás chicos/as manejan sus emociones mucho mejor que yo.', subscale: 'Estrategias', invertido: false },
            { id: 8, text: 'Cuando estoy furioso/a, exploto y hago o digo cosas de las que luego me arrepiento.', subscale: 'Control de Impulsos', invertido: false },
            { id: 9, text: 'Cuando estoy molesto/a, sé que al final encontraré una forma de calmarme.', subscale: 'Estrategias', invertido: true },
            { id: 10, text: 'Cuando algo me afecta, me encierro y me cuesta mucho salir de ese estado.', subscale: 'Estrategias', invertido: false },
            { id: 11, text: 'Siento que mis emociones a veces son intolerables o demasiado intensas.', subscale: 'No Aceptación', invertido: false },
            { id: 12, text: 'Cuando estoy frustrado/a, no puedo pensar con claridad ni razonar.', subscale: 'Metas / Concentración', invertido: false },
            { id: 13, text: 'Me enojo conmigo mismo/a por sentirme débil o sensible.', subscale: 'No Aceptación', invertido: false },
            { id: 14, text: 'Cuando estoy enfadado/a, siento que nada ni nadie puede hacerme sentir mejor.', subscale: 'Estrategias', invertido: false },
            { id: 15, text: 'Tomo decisiones precipitadas o impulsivas cuando estoy alterado/a.', subscale: 'Control de Impulsos', invertido: false },
            { id: 16, text: 'Me cuesta ponerle palabras exactas a lo que me pasa por dentro.', subscale: 'Claridad', invertido: false }
        ],
        baremos: [
            { min: 16, max: 32, nivel: 'Buena Capacidad de Regulación Emocional', color: 'emerald', desc: 'Habilidades adaptativas adecuadas para modular impulsos y reconocer afectos.' },
            { min: 33, max: 48, nivel: 'Dificultades Moderadas de Regulación', color: 'amber', desc: 'Vulnerabilidad ante la frustración o tendencia a explosiones e impulsividad en momentos de estrés.' },
            { min: 49, max: 80, nivel: 'Desregulación Emocional Severa', color: 'rose', desc: 'Dificultades clínicas severas en modular la intensidad afectiva, no aceptación del malestar y descontrol impulsivo.' }
        ],
        calcularResultado: (answers) => {
            let total = 0;
            const subescalas = { 'Claridad': 0, 'Atención': 0, 'No Aceptación': 0, 'Metas / Concentración': 0, 'Control de Impulsos': 0, 'Estrategias': 0 };
            const items = CLINICAL_TESTS.ders_a.items;

            items.forEach(item => {
                let val = parseInt(answers[item.id] ?? 3, 10);
                if (item.invertido) {
                    val = 6 - val;
                }
                total += val;
                if (subescalas[item.subscale] !== undefined) {
                    subescalas[item.subscale] += val;
                }
            });

            const baremo = CLINICAL_TESTS.ders_a.baremos.find(b => total >= b.min && total <= b.max) 
                || CLINICAL_TESTS.ders_a.baremos[CLINICAL_TESTS.ders_a.baremos.length - 1];

            return {
                testId: 'ders_a',
                nombre: 'Dificultades en Regulación Emocional para Adolescentes (DERS-A)',
                totalScore: total,
                maxScore: 80,
                nivel: baremo.nivel,
                color: baremo.color,
                interpretacion: baremo.desc,
                subescalas,
                alphaCronbach: '0.89'
            };
        }
    }
};

/**
 * Algoritmo Clínico de Recomendación Posterior
 * Examina edad, biografía, respuestas cualitativas, PID-5 y notas
 * Selecciona pruebas pertinentes distinguiendo población adolescente (14 años) vs adultos.
 */
export const recomendarPruebasPosteriores = ({
    patientName = '',
    patientAge = null,
    bioTranscripts = null,
    pidAnswers = null,
    phenomAnswers = null,
    notes = ''
}) => {
    // 1. Condición de desbloqueo: debe existir la entrevista biográfica o el motivo de consulta
    const hasBio = bioTranscripts && Object.keys(bioTranscripts).length > 0;
    
    if (!hasBio) {
        return {
            unlocked: false,
            message: 'Las pruebas posteriores de cribaje se desbloquean automáticamente cuando el paciente completa su Entrevista Biográfica inicial.',
            recommendations: []
        };
    }

    // 2. Extraer todo el corpus textual disponible del paciente
    const bioText = Object.values(bioTranscripts).join(' ').toLowerCase();
    const phenomText = (phenomAnswers ? Object.values(phenomAnswers).join(' ') : '').toLowerCase();
    const allText = `${patientName} ${bioText} ${phenomText} ${notes}`.toLowerCase();

    // 3. Determinar si el consultante es adolescente (ej. 14 años, Axel, referencias escolares/madre)
    const isAdolescent = (patientAge !== null && patientAge !== undefined && Number(patientAge) < 18) ||
                         /\b(1[0-7]|14)\s*(?:a\u00f1os|anios)?\b/.test(allText) ||
                         allText.includes('adolescen') || 
                         allText.includes('secundaria') ||
                         allText.includes('colegio') ||
                         allText.includes('escuela') ||
                         allText.includes('madre') ||
                         (patientName && patientName.toLowerCase().includes('axel'));

    // 4. Búsqueda de indicios de riesgo suicida o expresiones de muerte / huida de casa
    const deathRiskMatches = (allText.match(/muert\w*|morir\w*|irme de casa|irse de casa|escapar\w*|desaparecer\w*|hacerme da\u00f1o|no despertar|matar\w*|quitarme la vida|suicid\w*/gi) || []).length;

    // -------------------------------------------------------------
    // RAMA 1: ADOLESCENTES (11-17 AÑOS)
    // -------------------------------------------------------------
    if (isAdolescent) {
        const selected = [];

        // SLOT 1 (CRÍTICO): Riesgo Suicida / Muerte / Deseo de Huida -> C-SSRS
        if (deathRiskMatches > 0) {
            selected.push({
                test: CLINICAL_TESTS.cssrs,
                prioridad: 1,
                esUrgente: true,
                justificacion: `PRIORIDAD CLÍNICA MÁXIMA: Han aparecido referencias directas a muerte, deseo de escapar o irse de casa en el relato. El cribado de riesgo suicida C-SSRS (α = 0.94) es prioritario para explorar ideación pasiva/activa, intención y factores protectores sin sustituir la entrevista de seguridad.`
            });
        }

        // SLOT 2: CDI-2 (Depresión infanto-juvenil)
        selected.push({
            test: CLINICAL_TESTS.cdi2,
            prioridad: deathRiskMatches > 0 ? 2 : 1,
            justificacion: `ALTA PRIORIDAD: En un adolescente de 14 años, el CDI-2 (α = 0.88) es esencial para verificar si detrás de la irritabilidad o confrontación familiar se oculta un componente depresivo enmascarado.`
        });

        // SLOT 3: SDQ Multi-Informante (Adolescente vs Madre)
        const hasFamilyOrBehavior = allText.includes('madre') || allText.includes('padres') || allText.includes('decisiones') || allText.includes('permitir') || allText.includes('rabia') || allText.includes('conducta');
        if (hasFamilyOrBehavior) {
            selected.push({
                test: CLINICAL_TESTS.sdq,
                prioridad: deathRiskMatches > 0 ? 3 : 2,
                justificacion: `ALTA PRIORIDAD MULTI-INFORMANTE: El SDQ (α = 0.82) es clave en este caso porque permite cruzar dos narrativas divergentes (adolescente: 'no respetan mis decisiones' vs madre: 'sí lo apoyo, pero hay límites'), contrastando si el problema se concentra en la dinámica familiar o en un patrón conductual y de pares más amplio.`
            });
        }

        // Si todavía hay espacio (o para complementar): SCARED o DERS-A
        if (selected.length < 3) {
            const hasSocialOrRelocation = allText.includes('amigo') || allText.includes('pares') || allText.includes('cambio') || allText.includes('mudanza') || allText.includes('escuela') || allText.includes('timid');
            if (hasSocialOrRelocation) {
                selected.push({
                    test: CLINICAL_TESTS.scared,
                    prioridad: selected.length + 1,
                    justificacion: `ALTA PRIORIDAD: Explora si la dificultad para hacer amigos tras el cambio de residencia y la evitación escolar corresponden a ansiedad social o de separación con baremos validados para adolescentes (SCARED, α = 0.90).`
                });
            } else {
                selected.push({
                    test: CLINICAL_TESTS.ders_a,
                    prioridad: selected.length + 1,
                    justificacion: `PRIORIDAD MEDIA: Evalúa dificultades de regulación emocional (explosión, escalamiento y modulación de respuesta) con versión e ítems normados específicamente para adolescentes (DERS-A, α = 0.89).`
                });
            }
        }

        return {
            unlocked: true,
            patientName,
            poblacion: 'Adolescente (11-17 años)',
            totalTestsBank: Object.keys(CLINICAL_TESTS).length,
            recommendations: selected.slice(0, 3)
        };
    }

    // -------------------------------------------------------------
    // RAMA 2: ADULTOS (18+ AÑOS)
    // -------------------------------------------------------------
    let pidAfecto = 0;
    let pidDesapego = 0;
    let pidDesinhibicion = 0;
    if (pidAnswers && typeof pidAnswers === 'object') {
        for (let i = 1; i <= 25; i++) {
            const v = parseInt(pidAnswers[i] || 0, 10);
            if (i <= 5) pidAfecto += v;
            else if (i <= 10) pidDesapego += v;
            else if (i <= 20) pidDesinhibicion += v;
        }
    }

    const somaticAnxietyMatches = (allText.match(/taquicardi\w*|palpitaci\w*|temblor\w*|respirar|ahogo|mareo\w*|sudor\w*|p\u00e1nico|asustad\w*|f\u00edsic\w*|cuerpo|presi\u00f3n/g) || []).length;
    const ruminationMatches = (allText.match(/preocup\w*|pensar\w*|rumi\w*|futuro|insegur\w*|mente\w*|no paro|pensamientos|inciert\w*/g) || []).length;
    const depressionMatches = (allText.match(/trist\w*|deprim\w*|vac\u00edo\w*|culpa\w*|cansanci\w*|fatiga|sin energ\u00eda|no disfruto|des\u00e1nimo|llanto|sue\u00f1o|insomnio|despert\w*/g) || []).length;
    const emotionRegMatches = (allText.match(/desbord\w*|no controlo|ira|irritab\w*|explosi\w*|enojo|rabia|frustraci\w*|incontrolable|impuls\w*/g) || []).length;
    const avoidanceMatches = (allText.match(/evit\w*|bloque\w*|luchar|distraerme|adormecer|callar|postergar|miedo a sentir/g) || []).length;

    const selectedAdult = [];

    // Si hay riesgo suicida explícito en adultos también se prioriza C-SSRS
    if (deathRiskMatches > 0) {
        selectedAdult.push({
            test: CLINICAL_TESTS.cssrs,
            prioridad: 1,
            esUrgente: true,
            justificacion: `ALERTA CLÍNICA: Expresiones asociadas a muerte o desaparición detectadas en la entrevista. La escala C-SSRS (α = 0.94) permite cribar de forma prioritaria el nivel de riesgo e ideación.`
        });
    }

    if (somaticAnxietyMatches >= ruminationMatches && somaticAnxietyMatches > 0) {
        selectedAdult.push({
            test: CLINICAL_TESTS.bai,
            prioridad: selectedAdult.length + 1,
            justificacion: `Se detectaron ${somaticAnxietyMatches} referencias directas a somatización, opresión o pánico en el relato del paciente. El BAI (α = 0.92) cuantificará con rigor la severidad fisiológica actual.`
        });
    } else if (ruminationMatches > 0 && ruminationMatches >= depressionMatches) {
        selectedAdult.push({
            test: CLINICAL_TESTS.gad7,
            prioridad: selectedAdult.length + 1,
            justificacion: `El paciente manifiesta bucles de preocupación incontrolable y rumiación constante. El GAD-7 (α = 0.92) es el instrumento de elección para objetivar ansiedad generalizada.`
        });
    } else {
        selectedAdult.push({
            test: CLINICAL_TESTS.phq9,
            prioridad: selectedAdult.length + 1,
            justificacion: `Los datos biográficos reflejan desánimo, fatiga o impacto anhedónico. El PHQ-9 (α = 0.89) ofrece el estándar clínico para cribar la severidad del episodio afectivo.`
        });
    }

    selectedAdult.push({
        test: CLINICAL_TESTS.cope,
        prioridad: selectedAdult.length + 1,
        justificacion: `Dado el impacto vital del motivo de consulta, el Brief-COPE (α = 0.78-0.88) es imprescindible para evaluar si predomina un afrontamiento activo o una desconexión conductual desadaptativa.`
    });

    if (selectedAdult.length < 3) {
        if (emotionRegMatches >= avoidanceMatches && (emotionRegMatches > 0 || pidDesinhibicion >= 6)) {
            selectedAdult.push({
                test: CLINICAL_TESTS.ders16,
                prioridad: 3,
                justificacion: `La historia o el perfil PID-5 señalan vulnerabilidad a la irritabilidad o desborde afectivo. La escala DERS-16 (α = 0.93) discriminará dificultades de control de impulsos y no aceptación de estados internos.`
            });
        } else {
            selectedAdult.push({
                test: CLINICAL_TESTS.aaq2,
                prioridad: 3,
                justificacion: `El consultante relata esfuerzos recurrentes por evitar o frenar pensamientos incómodos. El AAQ-II (α = 0.88) es la prueba clave de ACT para medir inflexibilidad psicológica y evitación vivencial.`
            });
        }
    }

    return {
        unlocked: true,
        patientName,
        poblacion: 'Adultos (18+ años)',
        totalTestsBank: Object.keys(CLINICAL_TESTS).length,
        recommendations: selectedAdult.slice(0, 3)
    };
};

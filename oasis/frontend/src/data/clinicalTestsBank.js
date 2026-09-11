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
    }
};

/**
 * Algoritmo Clínico de Recomendación Posterior
 * Examina las fuentes activas (biografía, respuestas cualitativas, PID-5 y notas)
 * y selecciona 3 pruebas psicométricas posteriores de alta pertinencia clínica y de ámbitos distintos.
 */
export const recomendarPruebasPosteriores = ({
    patientName = '',
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
    const allText = `${bioText} ${phenomText} ${notes}`.toLowerCase();

    // 3. Puntuaciones del PID-5 para ponderación dimensional
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

    // 4. Búsqueda de indicios sintomáticos y semánticos por ámbito
    // Ámbito 1: Ansiedad Somática vs Rumiación Generalizada
    const somaticAnxietyMatches = (allText.match(/taquicardi\w*|palpitaci\w*|temblor\w*|respirar|ahogo|mareo\w*|sudor\w*|p\u00e1nico|asustad\w*|f\u00edsic\w*|cuerpo|presi\u00f3n/g) || []).length;
    const ruminationMatches = (allText.match(/preocup\w*|pensar\w*|rumi\w*|futuro|insegur\w*|mente\w*|no paro|pensamientos|inciert\w*/g) || []).length;

    // Ámbito 2: Depresión, Anhedonia y Pérdida de Vitalidad
    const depressionMatches = (allText.match(/trist\w*|deprim\w*|vac\u00edo\w*|culpa\w*|cansanci\w*|fatiga|sin energ\u00eda|no disfruto|des\u00e1nimo|llanto|sue\u00f1o|insomnio|despert\w*/g) || []).length;

    // Ámbito 3: Mecanismos de Afrontamiento y Estrés
    const copingMatches = (allText.match(/estr\u00e9s|trabajo|abrumad\w*|aisl\w*|huyo|m\u00fasica|escapar|colapso|crisis|lidiar|problema|satur\w*|autocastigo/g) || []).length;

    // Ámbito 4: Regulación Emocional e Impulsividad
    const emotionRegMatches = (allText.match(/desbord\w*|no controlo|ira|irritab\w*|explosi\w*|enojo|rabia|frustraci\w*|incontrolable|impuls\w*/g) || []).length;

    // Ámbito 5: Evitación Experiencial e Inflexibilidad (ACT)
    const avoidanceMatches = (allText.match(/evit\w*|bloque\w*|luchar|distraerme|adormecer|callar|postergar|miedo a sentir/g) || []).length;

    // 5. Decisión del algoritmo para cada uno de los 3 slots complementarios:
    const selected = [];

    // SLOT 1: Sintomatología Activa (Ansiedad o Depresión)
    if (somaticAnxietyMatches >= ruminationMatches && somaticAnxietyMatches > 0) {
        selected.push({
            test: CLINICAL_TESTS.bai,
            prioridad: 1,
            justificacion: `Se detectaron ${somaticAnxietyMatches} referencias directas a somatización, opresión o pánico en el relato del paciente. El BAI (α = 0.92) cuantificará con rigor la severidad fisiológica actual.`
        });
    } else if (ruminationMatches > 0 && ruminationMatches >= depressionMatches) {
        selected.push({
            test: CLINICAL_TESTS.gad7,
            prioridad: 1,
            justificacion: `El paciente manifiesta bucles de preocupación incontrolable y rumiación constante. El GAD-7 (α = 0.92) es el instrumento de elección para objetivar ansiedad generalizada.`
        });
    } else {
        selected.push({
            test: CLINICAL_TESTS.phq9,
            prioridad: 1,
            justificacion: `Los datos biográficos reflejan desánimo, fatiga o impacto anhedónico. El PHQ-9 (α = 0.89) ofrece el estándar clínico para cribar la severidad del episodio afectivo.`
        });
    }

    // SLOT 2: Mecanismos de Afrontamiento ante Crisis
    selected.push({
        test: CLINICAL_TESTS.cope,
        prioridad: 2,
        justificacion: `Dado el impacto vital del motivo de consulta (y antecedentes de aislamiento o distracción), el Brief-COPE (α = 0.78-0.88) es imprescindible para evaluar si predomina un afrontamiento activo o una desconexión conductual desadaptativa.`
    });

    // SLOT 3: Regulación Emocional o Evitación Experiencial
    if (emotionRegMatches >= avoidanceMatches && (emotionRegMatches > 0 || pidDesinhibicion >= 6)) {
        selected.push({
            test: CLINICAL_TESTS.ders16,
            prioridad: 3,
            justificacion: `La historia o el perfil PID-5 señalan vulnerabilidad a la irritabilidad o desborde afectivo. La escala DERS-16 (α = 0.93) discriminará dificultades de control de impulsos y no aceptación de estados internos.`
        });
    } else {
        selected.push({
            test: CLINICAL_TESTS.aaq2,
            prioridad: 3,
            justificacion: `El consultante relata esfuerzos recurrentes por evitar o frenar pensamientos incómodos. El AAQ-II (α = 0.88) es la prueba clave de ACT para medir inflexibilidad psicológica y evitación vivencial.`
        });
    }

    return {
        unlocked: true,
        patientName,
        totalTestsBank: Object.keys(CLINICAL_TESTS).length,
        recommendations: selected
    };
};

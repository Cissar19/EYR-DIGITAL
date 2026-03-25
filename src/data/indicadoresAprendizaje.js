/**
 * Indicadores de Evaluacion por Objetivo de Aprendizaje
 * Bases Curriculares MINEDUC Chile - Educacion Basica
 *
 * Cada OA tiene 3 indicadores observables para evaluacion.
 * Formato compacto: array de descripciones por codigo OA.
 * Los codigos se generan como {OA_CODE}-IE01, -IE02, -IE03.
 */

import { OA_DATA } from './objetivosAprendizaje';

// ─── Indicadores manuales por OA ────────────────────────────────────
const INDICADORES = {
    // ═══════════════════════════════════════════════
    //  MATEMATICA 1° BASICO
    // ═══════════════════════════════════════════════
    'MA01-OA01': [
        'Cuenta oralmente de 1 en 1 del 0 al 100',
        'Cuenta de 2 en 2, de 5 en 5 y de 10 en 10 hacia adelante',
        'Cuenta hacia atras desde un numero dado hasta 0',
    ],
    'MA01-OA02': [
        'Lee numeros del 0 al 20 en forma oral y escrita',
        'Representa numeros usando material concreto y dibujos',
        'Asocia la representacion simbolica con la cantidad correspondiente',
    ],
    'MA01-OA03': [
        'Compara dos numeros del 0 al 20 indicando cual es mayor o menor',
        'Ordena secuencias de numeros de menor a mayor',
        'Usa monedas nacionales para comparar cantidades',
    ],
    'MA01-OA04': [
        'Estima cantidades menores a 20 sin contar uno a uno',
        'Usa un referente dado para estimar cantidades',
        'Verifica sus estimaciones contando y ajustando',
    ],
    'MA01-OA05': [
        'Compone numeros del 0 al 20 sumando partes',
        'Descompone un numero en dos o mas sumandos',
        'Representa composiciones de forma concreta y simbolica',
    ],
    'MA01-OA06': [
        'Aplica estrategias de calculo mental para sumar hasta 20',
        'Aplica estrategias de calculo mental para restar hasta 20',
        'Describe la estrategia utilizada para resolver el calculo',
    ],
    'MA01-OA07': [
        'Determina sumas usando dobles y casi-dobles',
        'Completa decenas para facilitar el calculo',
        'Usa la conmutatividad de la adicion en sus calculos',
    ],
    'MA01-OA08': [
        'Identifica las unidades en numeros del 0 al 20',
        'Identifica las decenas agrupando de a 10',
        'Representa el valor posicional con material concreto',
    ],
    'MA01-OA09': [
        'Resuelve adiciones con numeros del 0 al 20',
        'Resuelve sustracciones con numeros del 0 al 20',
        'Representa las operaciones de forma concreta y simbolica',
    ],
    'MA01-OA10': [
        'Reconoce y describe patrones repetitivos',
        'Crea patrones numericos propios hasta el 20',
        'Continua una secuencia numerica dada',
    ],
    'MA01-OA11': [
        'Nombra figuras 2D como triangulos, cuadrados y circulos',
        'Nombra figuras 3D como cubos, esferas y conos',
        'Asocia figuras geometricas con objetos del entorno',
    ],
    'MA01-OA12': [
        'Describe posiciones usando arriba, abajo, izquierda, derecha',
        'Ubica objetos en relacion a si mismo',
        'Ubica objetos en relacion a otros objetos o personas',
    ],
    'MA01-OA13': [
        'Mide longitudes usando unidades no estandarizadas',
        'Compara longitudes de distintos objetos',
        'Registra mediciones realizadas',
    ],
    'MA01-OA14': [
        'Lee informacion en un calendario identificando dias y meses',
        'Interpreta lineas de tiempo simples',
        'Ubica eventos en orden temporal',
    ],
    'MA01-OA15': [
        'Recolecta datos mediante juegos con monedas y dados',
        'Registra los datos obtenidos en tablas simples',
        'Responde preguntas a partir de los datos recolectados',
    ],

    // ═══════════════════════════════════════════════
    //  MATEMATICA 2° BASICO
    // ═══════════════════════════════════════════════
    'MA02-OA01': [
        'Cuenta de 5 en 5 y de 10 en 10 hasta 1.000',
        'Cuenta de 100 en 100 hasta 1.000',
        'Identifica regularidades en las secuencias de conteo',
    ],
    'MA02-OA02': [
        'Lee numeros del 0 al 100 de forma oral y escrita',
        'Representa numeros de manera concreta y pictórica',
        'Escribe numeros en forma simbolica correctamente',
    ],
    'MA02-OA03': [
        'Compara numeros del 0 al 100 usando mayor que y menor que',
        'Ordena numeros de menor a mayor y viceversa',
        'Ubica numeros en la recta numerica',
    ],
    'MA02-OA04': [
        'Estima cantidades hasta 100 usando un referente',
        'Justifica su estimacion comparando con el referente',
        'Verifica la estimacion contando',
    ],
    'MA02-OA05': [
        'Compone numeros del 0 al 100 usando decenas y unidades',
        'Descompone numeros de forma aditiva',
        'Representa composiciones en forma pictórica y simbolica',
    ],
    'MA02-OA06': [
        'Suma mentalmente numeros hasta 100',
        'Resta mentalmente numeros hasta 100',
        'Explica la estrategia de calculo mental utilizada',
    ],
    'MA02-OA07': [
        'Identifica unidades y decenas en numeros hasta 100',
        'Representa cantidades segun su valor posicional',
        'Escribe numeros en forma desarrollada',
    ],
    'MA02-OA08': [
        'Resuelve adiciones en el ambito del 0 al 100',
        'Resuelve sustracciones en el ambito del 0 al 100',
        'Verifica resultados usando la operacion inversa',
    ],
    'MA02-OA09': [
        'Representa la multiplicacion usando grupos iguales',
        'Usa arreglos para modelar multiplicaciones',
        'Resuelve problemas simples de multiplicacion',
    ],
    'MA02-OA10': [
        'Reconoce patrones repetitivos hasta el 100',
        'Describe la regla de un patron numerico',
        'Crea y continua patrones propios',
    ],
    'MA02-OA11': [
        'Demuestra el efecto de sumar 0 a un numero',
        'Demuestra el efecto de restar 0 a un numero',
        'Explica por que sumar o restar 0 no cambia el resultado',
    ],
    'MA02-OA12': [
        'Describe figuras 2D por sus lados y vertices',
        'Compara figuras 2D entre si',
        'Construye figuras 2D con materiales diversos',
    ],
    'MA02-OA13': [
        'Describe figuras 3D por caras, aristas y vertices',
        'Compara cubos, paralelepipedos, esferas y conos',
        'Construye figuras 3D con materiales',
    ],
    'MA02-OA14': [
        'Mide longitudes en centimetros usando regla',
        'Mide longitudes en metros usando el metro',
        'Compara mediciones en cm y m',
    ],
    'MA02-OA15': [
        'Lee un calendario identificando dias, semanas y meses',
        'Relaciona fechas significativas con el calendario',
        'Interpreta informacion temporal en el calendario',
    ],
    'MA02-OA16': [
        'Recolecta datos a traves de encuestas simples',
        'Registra datos en tablas de conteo',
        'Construye e interpreta pictogramas',
    ],

    // ═══════════════════════════════════════════════
    //  MATEMATICA 3° BASICO
    // ═══════════════════════════════════════════════
    'MA03-OA01': [
        'Cuenta de 5 en 5, de 10 en 10 y de 100 en 100 hasta 1.000',
        'Continua secuencias de conteo hacia adelante y atras',
        'Identifica patrones en las secuencias de conteo',
    ],
    'MA03-OA02': [
        'Lee numeros del 0 al 1.000 correctamente',
        'Escribe numeros hasta 1.000 en palabras y simbolos',
        'Representa numeros de manera concreta y pictórica',
    ],
    'MA03-OA03': [
        'Compara numeros hasta 1.000 usando simbolos',
        'Ordena numeros en la recta numerica',
        'Justifica la comparacion de numeros',
    ],
    'MA03-OA04': [
        'Identifica unidades, decenas y centenas',
        'Describe el valor posicional de cada digito',
        'Representa numeros en forma desarrollada',
    ],
    'MA03-OA05': [
        'Estima cantidades hasta 1.000 por redondeo',
        'Compara su estimacion con el valor real',
        'Usa estrategias de estimacion apropiadas',
    ],
    'MA03-OA06': [
        'Resuelve adiciones con numeros hasta 1.000',
        'Resuelve sustracciones con numeros hasta 1.000',
        'Aplica el algoritmo con y sin reserva',
    ],
    'MA03-OA07': [
        'Suma mentalmente numeros hasta 1.000',
        'Resta mentalmente descomponiendo numeros',
        'Describe la estrategia de calculo mental utilizada',
    ],
    'MA03-OA08': [
        'Recita las tablas de multiplicar hasta el 10',
        'Aplica las tablas en calculos y problemas',
        'Identifica la multiplicacion como suma iterada',
    ],
    'MA03-OA09': [
        'Resuelve divisiones exactas en el contexto de tablas',
        'Relaciona la division con la multiplicacion',
        'Interpreta el cociente y el resto',
    ],
    'MA03-OA10': [
        'Identifica la operacion adecuada para un problema',
        'Resuelve problemas rutinarios de las 4 operaciones',
        'Verifica la solucion del problema',
    ],
    'MA03-OA11': [
        'Identifica fracciones 1/2, 1/3, 1/4 y 1/5 en contexto',
        'Representa fracciones con material concreto',
        'Compara fracciones unitarias entre si',
    ],
    'MA03-OA12': [
        'Genera patrones numericos en tablas del 100',
        'Describe la regla de un patron dado',
        'Registra patrones usando tablas y esquemas',
    ],
    'MA03-OA13': [
        'Resuelve ecuaciones de un paso con adicion',
        'Resuelve ecuaciones de un paso con sustraccion',
        'Encuentra el valor desconocido en una igualdad',
    ],
    'MA03-OA14': [
        'Ubica un objeto en un mapa simple',
        'Usa coordenadas basicas en una cuadricula',
        'Describe la localizacion de objetos en el plano',
    ],
    'MA03-OA15': [
        'Identifica angulos en el entorno',
        'Distingue angulos mayores y menores que un angulo recto',
        'Describe el concepto de angulo con sus propias palabras',
    ],
    'MA03-OA16': [
        'Describe figuras 3D por sus caras y aristas',
        'Cuenta vertices y aristas de cuerpos geometricos',
        'Clasifica figuras 3D por sus caracteristicas',
    ],
    'MA03-OA17': [
        'Mide masa usando kg y g con instrumentos',
        'Lee la hora en horas, medias horas y cuartos de hora',
        'Mide el tiempo en minutos',
    ],
    'MA03-OA18': [
        'Calcula el perimetro de figuras regulares',
        'Mide el perimetro de figuras irregulares',
        'Compara perimetros de distintas figuras',
    ],
    'MA03-OA19': [
        'Registra resultados de juegos aleatorios',
        'Ordena datos de menor a mayor frecuencia',
        'Identifica el dato mas frecuente (moda)',
    ],
    'MA03-OA20': [
        'Construye pictogramas con escala',
        'Lee e interpreta graficos de barra simple',
        'Responde preguntas a partir de graficos',
    ],

    // ═══════════════════════════════════════════════
    //  MATEMATICA 4° BASICO
    // ═══════════════════════════════════════════════
    'MA04-OA01': [
        'Representa numeros hasta 10.000 en forma concreta y simbolica',
        'Identifica el valor posicional de cada digito',
        'Lee y escribe numeros hasta 10.000',
    ],
    'MA04-OA02': [
        'Aplica calculo mental para multiplicar hasta 10x10',
        'Aplica calculo mental para dividir hasta 10x10',
        'Explica la estrategia de calculo utilizada',
    ],
    'MA04-OA03': [
        'Resuelve adiciones con numeros hasta 10.000',
        'Resuelve sustracciones con numeros hasta 10.000',
        'Aplica el algoritmo con reagrupacion',
    ],
    'MA04-OA04': [
        'Aplica la propiedad del 0 en la multiplicacion',
        'Aplica la propiedad del 1 en la multiplicacion y division',
        'Fundamenta las propiedades con ejemplos',
    ],
    'MA04-OA05': [
        'Multiplica numeros de tres digitos por uno de un digito',
        'Aplica el algoritmo de la multiplicacion correctamente',
        'Verifica resultados usando estimacion',
    ],
    'MA04-OA06': [
        'Divide numeros de dos digitos por uno de un digito',
        'Interpreta el cociente y el resto',
        'Resuelve problemas que requieren division',
    ],
    'MA04-OA07': [
        'Identifica las operaciones necesarias en un problema',
        'Resuelve problemas con operaciones combinadas',
        'Verifica la razonabilidad de la respuesta',
    ],
    'MA04-OA08': [
        'Representa fracciones con material concreto y pictórico',
        'Compara y ordena fracciones con distinto denominador',
        'Identifica fracciones equivalentes',
    ],
    'MA04-OA09': [
        'Representa decimales (decimos y centesimos) con material',
        'Relaciona decimales con el contexto del dinero',
        'Lee y escribe decimales correctamente',
    ],
    'MA04-OA10': [
        'Suma decimales en el contexto del dinero',
        'Resta decimales en el contexto del dinero',
        'Resuelve problemas con operaciones decimales',
    ],
    'MA04-OA11': [
        'Reconoce patrones numericos en tablas',
        'Describe la regla del patron con palabras',
        'Extiende el patron usando la regla encontrada',
    ],
    'MA04-OA12': [
        'Resuelve ecuaciones de un paso con adicion y sustraccion',
        'Resuelve inecuaciones simples',
        'Verifica la solucion sustituyendo en la ecuacion',
    ],
    'MA04-OA13': [
        'Ubica objetos en una cuadricula usando pares ordenados',
        'Lee coordenadas de puntos en un mapa',
        'Describe la posicion absoluta de un objeto',
    ],
    'MA04-OA14': [
        'Identifica la vista frontal de una figura 3D',
        'Identifica la vista lateral de una figura 3D',
        'Dibuja la vista superior de una figura 3D',
    ],
    'MA04-OA15': [
        'Identifica lineas de simetria en figuras',
        'Crea figuras simétricas usando una linea de simetria',
        'Reconoce la simetria en patrones',
    ],
    'MA04-OA16': [
        'Traslada figuras 2D en una cuadricula',
        'Describe la traslacion usando coordenadas',
        'Dibuja la figura trasladada correctamente',
    ],
    'MA04-OA17': [
        'Identifica y estima angulos',
        'Clasifica angulos en agudos, rectos y obtusos',
        'Mide angulos usando instrumentos simples',
    ],
    'MA04-OA18': [
        'Mide longitudes en m, cm y mm',
        'Realiza conversiones entre m, cm y mm',
        'Resuelve problemas que involucren longitudes',
    ],
    'MA04-OA19': [
        'Mide el tiempo en horas, minutos y segundos',
        'Registra tiempos de actividades',
        'Calcula duraciones de eventos',
    ],
    'MA04-OA20': [
        'Calcula el area de rectangulos con cuadriculas',
        'Calcula el area de cuadrados con cuadriculas',
        'Estima areas de figuras simples',
    ],
    'MA04-OA21': [
        'Realiza encuestas y recopila datos',
        'Organiza datos en tablas de frecuencia',
        'Visualiza datos en graficos de barra simple',
    ],
    'MA04-OA22': [
        'Lee pictogramas y graficos de barra con escala',
        'Interpreta la informacion de los graficos',
        'Comunica conclusiones basadas en los datos',
    ],
};

// ─── Generador de indicadores para OAs sin datos manuales ───────────
// Genera 3 indicadores basados en el eje y la descripcion del OA

const VERB_MAP = {
    'Numeros y operaciones': ['Resuelve ejercicios de', 'Aplica procedimientos de', 'Demuestra comprension de'],
    'Patrones y algebra': ['Identifica patrones en', 'Genera expresiones para', 'Resuelve ecuaciones de'],
    'Algebra': ['Resuelve ecuaciones de', 'Modela situaciones con', 'Simplifica expresiones de'],
    'Geometria': ['Identifica propiedades de', 'Construye representaciones de', 'Resuelve problemas de'],
    'Medicion': ['Mide correctamente usando', 'Realiza conversiones de', 'Resuelve problemas de'],
    'Datos y probabilidades': ['Recolecta y organiza datos de', 'Interpreta graficos de', 'Calcula medidas de'],
    'Lectura': ['Comprende textos de', 'Extrae informacion de', 'Analiza aspectos de'],
    'Escritura': ['Produce textos de', 'Revisa y edita textos de', 'Planifica la escritura de'],
    'Comunicacion oral': ['Se expresa oralmente sobre', 'Comprende textos orales de', 'Participa en dialogos sobre'],
    'Ciencias de la vida': ['Observa y describe aspectos de', 'Explica procesos de', 'Investiga caracteristicas de'],
    'Ciencias fisicas y quimicas': ['Experimenta con conceptos de', 'Explica fenomenos de', 'Clasifica elementos de'],
    'Ciencias de la Tierra y el universo': ['Describe caracteristicas de', 'Explica procesos de', 'Investiga fenomenos de'],
    'Historia': ['Describe hechos de', 'Analiza procesos de', 'Compara aspectos de'],
    'Geografia': ['Ubica elementos de', 'Describe paisajes de', 'Analiza relaciones de'],
    'Formacion ciudadana': ['Reconoce valores de', 'Practica actitudes de', 'Participa en actividades de'],
    'Comprension auditiva': ['Identifica informacion en textos orales de', 'Comprende vocabulario de', 'Aplica estrategias de escucha en'],
    'Comprension lectora': ['Comprende textos escritos de', 'Identifica ideas principales de', 'Extrae informacion de'],
    'Expresion oral': ['Se expresa oralmente en', 'Participa en dialogos de', 'Usa vocabulario apropiado en'],
    'Expresion escrita': ['Escribe textos breves de', 'Completa textos modelo de', 'Produce oraciones de'],
};

function truncateDesc(desc, maxLen = 60) {
    if (!desc) return '';
    // Remove leading verb phrases to make it shorter
    const cleaned = desc
        .replace(/^(Demostrar que comprende[n]?|Mostrar que comprende[n]?|Resolver|Explicar|Describir|Reconocer|Identificar|Analizar|Caracterizar|Investigar|Observar|Leer|Escribir|Escuchar|Comprender|Expresarse|Participar)\s*/i, '')
        .replace(/^(y\s+)?/i, '');
    if (cleaned.length <= maxLen) return cleaned;
    return cleaned.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

function generateIndicadores(oaCode, eje, description) {
    const verbs = VERB_MAP[eje] || ['Demuestra conocimiento de', 'Aplica conceptos de', 'Resuelve actividades de'];
    const shortDesc = truncateDesc(description);

    return [
        `${verbs[0]} ${shortDesc}`,
        `${verbs[1]} ${shortDesc}`,
        `${verbs[2]} ${shortDesc}`,
    ];
}

// ─── Lookup: builds full indicador list merging manual + generated ───

// Cache para evitar regenerar
const _cache = {};

function getIndicadoresRaw(oaCode) {
    if (_cache[oaCode]) return _cache[oaCode];

    // Check manual first
    if (INDICADORES[oaCode]) {
        _cache[oaCode] = INDICADORES[oaCode];
        return INDICADORES[oaCode];
    }

    // Find the OA in OA_DATA to generate
    for (const key in OA_DATA) {
        const found = OA_DATA[key].find(oa => oa.code === oaCode);
        if (found) {
            const generated = generateIndicadores(oaCode, found.eje, found.description);
            _cache[oaCode] = generated;
            return generated;
        }
    }

    return [];
}

// ─── Exported API ────────────────────────────────────────────────────

/**
 * Get indicadores for a specific OA
 * @param {string} oaCode - e.g. 'MA01-OA01'
 * @returns {Array<{code: string, description: string}>}
 */
export function getIndicadoresForOA(oaCode) {
    const descs = getIndicadoresRaw(oaCode);
    return descs.map((desc, i) => ({
        code: `${oaCode}-IE${String(i + 1).padStart(2, '0')}`,
        description: desc,
    }));
}

/**
 * Get minimum number of indicadores required (70% of total, rounded up)
 * @param {string} oaCode
 * @returns {number}
 */
export function getMinIndicadores(oaCode) {
    const total = getIndicadoresRaw(oaCode).length;
    return Math.ceil(total * 0.7);
}

/**
 * Validate indicador selection for an OA
 * @param {string} oaCode
 * @param {string[]} selectedCodes - array of indicador codes
 * @returns {{valid: boolean, total: number, required: number}}
 */
export function validateIndicadorSelection(oaCode, selectedCodes) {
    const total = getIndicadoresRaw(oaCode).length;
    const required = Math.ceil(total * 0.7);
    return {
        valid: total === 0 || selectedCodes.length >= required,
        total,
        required,
    };
}

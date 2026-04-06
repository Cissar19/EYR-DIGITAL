/**
 * versionB.js
 * Genera una Versión B de una evaluación:
 * - Preguntas de selección múltiple en orden aleatorio
 * - Alternativas de cada SM revueltas (respuestaCorrecta se actualiza)
 * - Nombre con sufijo "- Versión B"
 * El objeto retornado es solo en memoria (id: null), no se guarda en Firestore.
 */

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Revuelve las alternativas (a/b/c/d) de una pregunta de selección múltiple
 * y actualiza el campo respuestaCorrecta al nuevo índice.
 */
function shuffleAlternativas(pregunta) {
    const letras = ['a', 'b', 'c', 'd'].filter(l => pregunta.alternativas?.[l]);
    if (letras.length <= 1) return pregunta;

    const shuffledLetras = shuffle(letras);
    const targetLetras   = ['a', 'b', 'c', 'd'].slice(0, shuffledLetras.length);

    const nuevasAlt = {};
    shuffledLetras.forEach((letraOriginal, idx) => {
        nuevasAlt[targetLetras[idx]] = pregunta.alternativas[letraOriginal];
    });

    // La alternativa correcta original ahora está en la posición donde quedó
    const idxCorrecta = shuffledLetras.indexOf(pregunta.respuestaCorrecta);
    const nuevaCorrecta = idxCorrecta >= 0 ? targetLetras[idxCorrecta] : pregunta.respuestaCorrecta;

    return { ...pregunta, alternativas: nuevasAlt, respuestaCorrecta: nuevaCorrecta };
}

/**
 * @param {object} evaluacion - El objeto evaluacion completo
 * @returns {object} Copia modificada con preguntas SM revueltas y nombre Versión B
 */
export function generarVersionB(evaluacion) {
    const preguntas = evaluacion.questions || [];

    const sm    = preguntas.filter(q => q.tipo === 'seleccion_multiple');
    const otros = preguntas.filter(q => q.tipo !== 'seleccion_multiple');

    // Mezclar SM y sus alternativas internas
    const smRevueltas = shuffle(sm).map((q, idx) => ({
        ...shuffleAlternativas(q),
        number: idx + 1,
    }));

    // Mantener el resto en su orden original, renumerados
    const otrosRenumerados = otros.map((q, idx) => ({
        ...q,
        number: smRevueltas.length + idx + 1,
    }));

    // Nombre: eliminar sufijo previo si existía, agregar Versión B
    const baseName = evaluacion.name.replace(/\s*[-–]\s*[Vv]ersi[oó]n\s+[AB]\s*$/, '').trim();

    return {
        ...evaluacion,
        id: null,           // señal: no persistido
        _isVersionB: true,
        name: `${baseName} - Versión B`,
        questions: [...smRevueltas, ...otrosRenumerados],
        results: {},
    };
}

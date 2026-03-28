/**
 * evaluacionParser.js
 *
 * Parsea preguntas desde texto extraído de PDFs de evaluaciones escolares.
 * Soporta selección múltiple (a/b/c/d) y preguntas de desarrollo.
 */

// Número de pregunta: "1." o "1)"
const RE_QUESTION = /^\s*(\d+)[.)]\s+(.*)/;
// Alternativa: "a)" — solo minúscula, solo paréntesis
const RE_ALTERNATIVE = /^\s*([a-d])\)\s+(.*)/;
// Título de sección romana: "I.", "II.", "III.", etc.
const RE_ROMAN_SECTION = /^\s*[IVX]+\.\s/;
// Línea de espacio para respuesta: "______"
const RE_ANSWER_BLANK = /^\s*_{3,}\s*$/;

/** Palabras clave que indican que el enunciado depende de una imagen */
const IMAGE_KEYWORDS = [
  'el siguiente diagrama',
  'la siguiente imagen',
  'la siguiente figura',
  'el siguiente gráfico',
  'el siguiente esquema',
  'observa el',
  'observa la',
  'une con una línea',
  'une con flechas',
  'según el diagrama',
  'según la imagen',
];

/**
 * Retorna true si el enunciado depende de una imagen o es demasiado corto
 * para tener sentido sin contexto visual.
 * @param {string} enunciado
 */
function isImageDependent(enunciado) {
  const lower = enunciado.trim().toLowerCase();
  if (lower.length < 15) return true;
  return IMAGE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Convierte el estado acumulado de una pregunta en el objeto final.
 * Retorna null si la pregunta debe ignorarse.
 * @param {{ numero: number, enunciado: string, alternativas: Record<string,string> } | null} current
 */
function finalizeQuestion(current) {
  if (!current) return null;

  const enunciado = current.enunciado.trim();
  if (!enunciado || isImageDependent(enunciado)) return null;

  const altCount = Object.keys(current.alternativas).length;
  const tipo = altCount >= 2 ? 'seleccion_multiple' : 'desarrollo';

  return {
    numero: current.numero,
    enunciado,
    alternativas: current.alternativas,
    tipo,
  };
}

/**
 * Parsea el texto extraído de un PDF de evaluación y retorna las preguntas.
 *
 * @param {string} text - Texto crudo extraído del PDF (ej. via pdf-parse)
 * @returns {Array<{
 *   numero: number,
 *   enunciado: string,
 *   alternativas: Record<string, string>,
 *   tipo: 'seleccion_multiple' | 'desarrollo'
 * }>}
 */
export function parseEvaluacion(text) {
  const lines = text.split('\n');
  const questions = [];
  let current = null;
  let currentAlt = null; // letra de la alternativa que se está acumulando

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Saltar líneas vacías y espacios de respuesta (_____)
    if (!line.trim() || RE_ANSWER_BLANK.test(line)) continue;

    // Saltar títulos de sección romana (I., II., III., ...)
    if (RE_ROMAN_SECTION.test(line)) continue;

    // Alternativa: a) b) c) d) — solo si hay pregunta activa
    const altMatch = line.match(RE_ALTERNATIVE);
    if (altMatch && current) {
      currentAlt = altMatch[1];
      current.alternativas[currentAlt] = altMatch[2].trim();
      continue;
    }

    // Número de pregunta: inicia una nueva pregunta
    const qMatch = line.match(RE_QUESTION);
    if (qMatch) {
      const finalized = finalizeQuestion(current);
      if (finalized) questions.push(finalized);

      current = {
        numero: parseInt(qMatch[1], 10),
        enunciado: qMatch[2].trim(),
        alternativas: {},
      };
      currentAlt = null;
      continue;
    }

    // Línea de continuación — se agrega a la alternativa actual o al enunciado
    if (current) {
      const chunk = line.trim();
      if (!chunk) continue;
      if (currentAlt !== null) {
        current.alternativas[currentAlt] += ' ' + chunk;
      } else {
        current.enunciado += (current.enunciado ? ' ' : '') + chunk;
      }
    }
  }

  // Finalizar la última pregunta
  const finalized = finalizeQuestion(current);
  if (finalized) questions.push(finalized);

  return questions;
}

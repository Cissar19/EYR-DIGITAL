/**
 * coverageMath.js
 * ───────────────
 * Helpers de cálculo para cobertura curricular.
 * Todas las funciones son puras — sin side effects, sin Firestore.
 *
 * Nota sobre totalBasales:
 *   - Versión autoritativa: array de códigos OA de curriculum/{year}/oas/
 *   - Versión fallback:     excelTotalBasales (número) del doc de cobertura
 */

/**
 * ¿Está el OA marcado como "pasado" en cualquier unidad?
 * @param {import('../types/coverage').UnitTracking} unitTracking
 * @param {string} oaCode
 * @returns {boolean}
 */
export function getOaPasado(unitTracking, oaCode) {
  return ['u1', 'u2', 'u3', 'u4'].some(u => unitTracking[u]?.[oaCode] === true);
}

/**
 * Cuántos OAs del currículum oficial están "pasados" (en cualquier unidad).
 * @param {import('../types/coverage').UnitTracking} unitTracking
 * @param {string[]} basalesOas - códigos OA del currículum oficial
 * @returns {number}
 */
export function getTotalPasados(unitTracking, basalesOas) {
  return basalesOas.filter(code => getOaPasado(unitTracking, code)).length;
}

/**
 * Porcentaje de cobertura (0-1) usando el currículum oficial.
 * @param {import('../types/coverage').UnitTracking} unitTracking
 * @param {string[]} basalesOas
 * @returns {number} 0-1
 */
export function getPorcentaje(unitTracking, basalesOas) {
  if (!basalesOas?.length) return 0;
  return getTotalPasados(unitTracking, basalesOas) / basalesOas.length;
}

/**
 * Porcentaje de cobertura por unidad (0-1 cada una).
 * porcentajeUnidad(u) = OAs marcados en u / totalBasales
 * @param {import('../types/coverage').UnitTracking} unitTracking
 * @param {string[]} basalesOas
 * @returns {Record<string, number>}
 */
export function getPorcentajePorUnidad(unitTracking, basalesOas) {
  if (!basalesOas?.length) return { u1: 0, u2: 0, u3: 0, u4: 0 };
  return Object.fromEntries(
    ['u1', 'u2', 'u3', 'u4'].map(u => [
      u,
      Object.values(unitTracking[u] || {}).filter(Boolean).length / basalesOas.length,
    ])
  );
}

/**
 * Versión rápida sin currículum oficial.
 * Usa el conteo del Excel (excelTotalBasales) como denominador.
 * Cuenta OAs únicos marcados true en cualquier unidad.
 * @param {import('../types/coverage').UnitTracking} unitTracking
 * @param {number} totalBasales
 * @returns {number} 0-1
 */
export function getPorcentajeFallback(unitTracking, totalBasales) {
  if (!totalBasales) return 0;
  const pasados = new Set(
    ['u1', 'u2', 'u3', 'u4'].flatMap(u =>
      Object.entries(unitTracking[u] || {})
        .filter(([, v]) => v === true)
        .map(([k]) => k)
    )
  ).size;
  return pasados / totalBasales;
}

/**
 * Versión rápida por unidad sin currículum oficial.
 * @param {import('../types/coverage').UnitTracking} unitTracking
 * @param {number} totalBasales
 * @returns {Record<string, number>}
 */
export function getPorcentajePorUnidadFallback(unitTracking, totalBasales) {
  if (!totalBasales) return { u1: 0, u2: 0, u3: 0, u4: 0 };
  return Object.fromEntries(
    ['u1', 'u2', 'u3', 'u4'].map(u => [
      u,
      Object.values(unitTracking[u] || {}).filter(Boolean).length / totalBasales,
    ])
  );
}

/**
 * Porcentaje de cobertura legacy (bloques pendientes de migración).
 * Usa legacyOaStatus: OAs marcados true / excelTotalBasales.
 * @param {Record<string, boolean>} legacyOaStatus
 * @param {number} totalBasales
 * @returns {number} 0-1
 */
export function getPorcentajeLegacy(legacyOaStatus, totalBasales) {
  if (!totalBasales) return 0;
  const pasados = Object.values(legacyOaStatus || {}).filter(Boolean).length;
  return pasados / totalBasales;
}

/**
 * Nivel de cobertura para colores del UI.
 * @param {number} pct 0-1
 * @returns {'green'|'yellow'|'red'}
 */
export function getCoverageLevel(pct) {
  if (pct >= 0.8) return 'green';
  if (pct >= 0.5) return 'yellow';
  return 'red';
}

/** Clases Tailwind por nivel */
export const LEVEL_CLASSES = {
  green:  { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  yellow: { bg: 'bg-amber-400',   text: 'text-amber-700',   light: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-800'   },
  red:    { bg: 'bg-rose-500',    text: 'text-rose-700',    light: 'bg-rose-50',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-800'     },
};

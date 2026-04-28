/**
 * useCurriculumOas.js
 * ───────────────────
 * Lee los OAs oficiales del MINEDUC para un año + curso + asignatura
 * desde la nueva ruta: curriculum/{year}/oas/{gradeSlug}_{subjectSlug}
 *
 * Fallback automático: si el año solicitado no tiene curriculum subido
 * (ej. 2026), usa year-1. Una vez detectado que el año no tiene datos,
 * las llamadas siguientes van directamente al año anterior (sin doble read).
 */

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GRADE_TO_SLUG, SUBJECT_TO_CURRICULUM_SLUG } from '../lib/coverageConstants';

/** Cache de OAs por "year/docId" */
const oaCache = new Map();

/**
 * Cache de disponibilidad por año.
 * true  = tiene curriculum en Firestore
 * false = no tiene (usar año anterior)
 * undefined = sin verificar aún
 */
const yearAvailability = new Map();

function parseSnap(snap) {
  const data = snap.data();
  return (data.ejes || []).flatMap(eje =>
    (eje.objetivos || []).map(oa => ({
      codigo:      oa.codigo      || '',
      descripcion: oa.descripcion || '',
      eje:         eje.nombre     || '',
    }))
  );
}

/**
 * Resuelve qué año de curriculum usar:
 * - Si yearAvailability[year] === false, retorna year-1 sin leer Firestore.
 * - Si es la primera vez, lee un doc de prueba para verificar y cachea el resultado.
 * Retorna el año efectivo a usar.
 */
async function resolveYear(year, docId) {
  if (yearAvailability.get(year) === false) {
    return year - 1;
  }
  if (yearAvailability.get(year) === true) {
    return year;
  }

  // Primera vez — verificar con el doc pedido
  const testSnap = await getDoc(doc(db, 'curriculum', String(year), 'oas', docId));
  if (testSnap.exists()) {
    yearAvailability.set(year, true);
    // Cachear el resultado ya que lo tenemos
    oaCache.set(`${year}/${docId}`, parseSnap(testSnap));
    return year;
  } else {
    yearAvailability.set(year, false);
    return year - 1;
  }
}

/**
 * @param {number} year
 * @param {string} grade   - ej. "3B"
 * @param {string} subject - ej. "lenguaje"
 * @returns {{ oas: {codigo:string, descripcion:string, eje:string}[], loading:boolean, error:string|null }}
 */
export function useCurriculumOas(year, grade, subject) {
  const [oas,     setOas]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!year || !grade || !subject) { setLoading(false); return; }

    const gradeSlug   = GRADE_TO_SLUG[grade];
    const subjectSlug = SUBJECT_TO_CURRICULUM_SLUG[subject] ?? subject;

    if (!gradeSlug) {
      setError(`Sin mapeo de curso para "${grade}"`);
      setLoading(false);
      return;
    }

    const docId    = `${gradeSlug}_${subjectSlug}`;
    const cacheKey = `${year}/${docId}`;

    // Hit en caché → respuesta inmediata
    if (oaCache.has(cacheKey)) {
      setOas(oaCache.get(cacheKey));
      setLoading(false);
      return;
    }

    let cancelled = false;

    resolveYear(year, docId)
      .then(async effectiveYear => {
        if (cancelled) return;

        const fallbackKey = `${effectiveYear}/${docId}`;

        // El doc del año efectivo puede estar ya en caché (si resolveYear lo precargó)
        if (oaCache.has(fallbackKey)) {
          const result = oaCache.get(fallbackKey);
          oaCache.set(cacheKey, result);
          if (!cancelled) setOas(result);
          return;
        }

        const snap = await getDoc(doc(db, 'curriculum', String(effectiveYear), 'oas', docId));
        if (cancelled) return;

        const result = snap.exists() ? parseSnap(snap) : [];
        oaCache.set(fallbackKey, result);
        oaCache.set(cacheKey, result);
        setOas(result);
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [year, grade, subject]);

  return { oas, loading, error };
}

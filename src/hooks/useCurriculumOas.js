/**
 * useCurriculumOas.js
 * ───────────────────
 * Lee los OAs oficiales del MINEDUC para un año + curso + asignatura
 * desde la nueva ruta: curriculum/{year}/oas/{gradeSlug}_{subjectSlug}
 *
 * Si el año solicitado no tiene datos (ej. 2026 aún no tiene curriculum
 * subido), hace fallback automático a year-1. El curriculum de MINEDUC
 * raramente cambia entre años consecutivos.
 */

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GRADE_TO_SLUG, SUBJECT_TO_CURRICULUM_SLUG } from '../lib/coverageConstants';

/** Cache en memoria por sesión (evita re-leer docs que no cambian) */
const cache = new Map();

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

    if (cache.has(cacheKey)) {
      setOas(cache.get(cacheKey));
      setLoading(false);
      return;
    }

    const ref     = doc(db, 'curriculum', String(year),      'oas', docId);
    const refPrev = doc(db, 'curriculum', String(year - 1),  'oas', docId);

    getDoc(ref)
      .then(snap => {
        if (snap.exists()) {
          const result = parseSnap(snap);
          cache.set(cacheKey, result);
          setOas(result);
          return;
        }
        // Fallback al año anterior
        return getDoc(refPrev).then(snapPrev => {
          const result = snapPrev.exists() ? parseSnap(snapPrev) : [];
          cache.set(cacheKey, result); // cachear con la clave del año pedido
          setOas(result);
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [year, grade, subject]);

  return { oas, loading, error };
}

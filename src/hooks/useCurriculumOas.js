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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

/**
 * Carga los OAs del currículum para todos los subjects de un grado en paralelo.
 * Reutiliza la caché de useCurriculumOas para evitar lecturas duplicadas.
 *
 * @param {number} year
 * @param {string} grade    - ej. "5A"
 * @param {string[]} subjects - slugs de asignatura presentes en el grado
 * @returns {{ oasBySubject: Record<string, {codigo,descripcion,eje}[]>, loading: boolean }}
 */
export function useCurriculumOasForGrade(year, grade, subjects) {
  const subjectsKey = subjects.slice().sort().join(',');
  const [oasBySubject, setOasBySubject] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year || !grade || !subjects.length) { setLoading(false); return; }
    const gradeSlug = GRADE_TO_SLUG[grade];
    if (!gradeSlug) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    Promise.all(subjects.map(async subject => {
      const subjectSlug = SUBJECT_TO_CURRICULUM_SLUG[subject] ?? subject;
      const docId       = `${gradeSlug}_${subjectSlug}`;
      const key         = `${year}/${docId}`;

      if (oaCache.has(key)) return [subject, oaCache.get(key)];

      const effectiveYear = await resolveYear(year, docId);
      const fallbackKey   = `${effectiveYear}/${docId}`;

      if (oaCache.has(fallbackKey)) {
        const r = oaCache.get(fallbackKey);
        oaCache.set(key, r);
        return [subject, r];
      }

      const snap   = await getDoc(doc(db, 'curriculum', String(effectiveYear), 'oas', docId));
      const parsed = snap.exists() ? parseSnap(snap) : [];
      oaCache.set(fallbackKey, parsed);
      oaCache.set(key, parsed);
      return [subject, parsed];
    }))
      .then(entries => {
        if (!cancelled) {
          setOasBySubject(Object.fromEntries(entries));
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, grade, subjectsKey]);

  return { oasBySubject, loading };
}

/**
 * useCoverage.js
 * ──────────────
 * Hooks realtime para leer datos de cobertura curricular desde Firestore.
 * Todos retornan { data, loading, error }.
 *
 * Ruta base: schools/eyr/academicYears/{year}/coverage/
 */

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SCHOOL_ID } from '../lib/coverageConstants';

function coverageCol(year) {
  return collection(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage');
}

function useSnapshotQuery(q, cacheKey) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!q) { setData([]); setLoading(false); return; }

    // Limpiar datos anteriores de inmediato para evitar mostrar data vieja
    setData([]);
    setLoading(true);
    setError(null);

    if (unsubRef.current) unsubRef.current();

    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('useCoverage snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => { if (unsubRef.current) unsubRef.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { data, loading, error };
}

/**
 * Todos los bloques de un curso en un año.
 * @param {number} year
 * @param {string} grade  - ej. "3B"
 */
export function useCoverageByGrade(year, grade) {
  const q = year && grade
    ? query(coverageCol(year), where('grade', '==', grade))
    : null;
  return useSnapshotQuery(q, `grade-${year}-${grade}`);
}

/**
 * Todos los bloques de una asignatura en un año (todos los cursos).
 * @param {number} year
 * @param {string} subject - ej. "matematica"
 */
export function useCoverageBySubject(year, subject) {
  const q = year && subject
    ? query(coverageCol(year), where('subject', '==', subject))
    : null;
  return useSnapshotQuery(q, `subject-${year}-${subject}`);
}

/**
 * Todos los bloques de un docente en un año.
 * @param {number} year
 * @param {string} teacherId - UID del docente
 */
export function useCoverageByTeacher(year, teacherId) {
  const q = year && teacherId
    ? query(coverageCol(year), where('teacherId', '==', teacherId))
    : null;
  return useSnapshotQuery(q, `teacher-${year}-${teacherId}`);
}

/**
 * TODOS los bloques del año — para el dashboard global.
 * @param {number} year
 */
export function useCoverageStats(year) {
  const q = year ? query(coverageCol(year)) : null;
  return useSnapshotQuery(q, `stats-${year}`);
}

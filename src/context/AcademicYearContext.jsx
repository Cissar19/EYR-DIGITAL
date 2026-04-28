/**
 * AcademicYearContext
 * ───────────────────
 * Estado global del año académico activo en el módulo de Cobertura Curricular.
 *
 * Provee: year, setYear, availableYears, loading
 * - year          : número (ej. 2025)
 * - setYear       : cambia el año y lo persiste en localStorage
 * - availableYears: lista de años existentes en Firestore, orden descendente
 * - loading       : true mientras carga la lista de años
 *
 * Persistencia: el año activo se guarda en localStorage bajo 'eyr_academic_year'.
 * Si el año guardado no existe en Firestore, se usa el año más reciente disponible.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SCHOOL_ID   = 'eyr';
const STORAGE_KEY = 'eyr_academic_year';
const DEFAULT_YEAR = 2025;

const AcademicYearContext = createContext({
  year:           DEFAULT_YEAR,
  setYear:        () => {},
  availableYears: [],
  closedYears:    [],
  loading:        true,
});

export const AcademicYearProvider = ({ children }) => {
  const getStoredYear = () => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      const n = v ? parseInt(v, 10) : null;
      return Number.isFinite(n) ? n : DEFAULT_YEAR;
    } catch {
      return DEFAULT_YEAR;
    }
  };

  const [year, setYearState] = useState(getStoredYear);
  const [availableYears, setAvailableYears] = useState([]);
  const [closedYears, setClosedYears]       = useState([]);
  const [loading, setLoading] = useState(true);
  // Evita correr el efecto dos veces en StrictMode
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    getDocs(collection(db, 'schools', SCHOOL_ID, 'academicYears'))
      .then((snap) => {
        const years = snap.docs
          .map(d => parseInt(d.id, 10))
          .filter(n => Number.isFinite(n))
          .sort((a, b) => b - a); // descendente: [2026, 2025, ...]

        const closed = snap.docs
          .filter(d => d.data()?.active === false)
          .map(d => parseInt(d.id, 10))
          .filter(n => Number.isFinite(n));

        setAvailableYears(years);
        setClosedYears(closed);

        // Si el año almacenado no está disponible, usar el más reciente
        if (years.length > 0) {
          const stored = getStoredYear();
          if (!years.includes(stored)) {
            setYearState(years[0]);
            try { localStorage.setItem(STORAGE_KEY, String(years[0])); } catch { /* ignore */ }
          }
        }
      })
      .catch((err) => {
        console.warn('AcademicYearContext: no se pudo cargar availableYears', err.message);
        // Fallback silencioso: usar el año del localStorage
      })
      .finally(() => setLoading(false));
  }, []);

  const setYear = (y) => {
    setYearState(y);
    try { localStorage.setItem(STORAGE_KEY, String(y)); } catch { /* ignore */ }
  };

  const addYear = async (newYear) => {
    // 1. Crear doc del año
    const yearRef = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(newYear));
    await setDoc(yearRef, { createdAt: new Date().toISOString() }, { merge: true });

    // 2. Copiar estructura desde el año activo (sin datos de avance)
    const sourceSnap = await getDocs(
      collection(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage')
    );

    if (!sourceSnap.empty) {
      const batch = writeBatch(db);
      const destBase = `schools/${SCHOOL_ID}/academicYears/${newYear}/coverage`;

      sourceSnap.docs.forEach(sourceDoc => {
        const d = sourceDoc.data();
        const destRef = doc(db, destBase, sourceDoc.id);

        // Mantener estructura de OAs pero resetear todos los valores a false
        let unitTracking = {};
        let legacyOaStatus = {};

        if (d.migrationStatus === 'complete' && d.unitTracking) {
          for (const unit of ['u1', 'u2', 'u3', 'u4']) {
            unitTracking[unit] = Object.fromEntries(
              Object.keys(d.unitTracking[unit] ?? {}).map(code => [code, false])
            );
          }
        } else if (d.legacyOaStatus) {
          legacyOaStatus = Object.fromEntries(
            Object.keys(d.legacyOaStatus).map(code => [code, false])
          );
        }

        batch.set(destRef, {
          subject:           d.subject           ?? null,
          subjectLabel:      d.subjectLabel      ?? null,
          grade:             d.grade             ?? null,
          teacherId:         d.teacherId         ?? null,
          teacherName:       d.teacherName       ?? null,
          excelTotalBasales: d.excelTotalBasales ?? 0,
          migrationStatus:   d.migrationStatus   ?? 'pending',
          unitTracking,
          legacyOaStatus,
          year:              newYear,
        });
      });

      await batch.commit();
    }

    setAvailableYears(prev =>
      [...new Set([...prev, newYear])].sort((a, b) => b - a)
    );
    setYear(newYear);
  };

  const closeYear = async (targetYear) => {
    const yearRef = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(targetYear));
    await updateDoc(yearRef, { active: false });
    setClosedYears(prev => [...new Set([...prev, targetYear])]);
  };

  const deleteYear = async (targetYear) => {
    // 1. Borrar todos los bloques de cobertura del año
    const coverageSnap = await getDocs(
      collection(db, 'schools', SCHOOL_ID, 'academicYears', String(targetYear), 'coverage')
    );

    if (!coverageSnap.empty) {
      const batch = writeBatch(db);
      coverageSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    // 2. Borrar el doc del año
    await deleteDoc(doc(db, 'schools', SCHOOL_ID, 'academicYears', String(targetYear)));

    // 3. Actualizar lista y cambiar de año si era el activo
    setAvailableYears(prev => {
      const updated = prev.filter(y => y !== targetYear);
      if (year === targetYear && updated.length > 0) {
        setYear(updated[0]);
      }
      return updated;
    });
  };

  return (
    <AcademicYearContext.Provider value={{ year, setYear, availableYears, closedYears, loading, addYear, deleteYear, closeYear }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAcademicYear = () => useContext(AcademicYearContext);

import React, { createContext, useContext, useState, useCallback } from 'react';

const SimceContext = createContext();

const LS_KEY = 'simce_results';

const SEED_DATA = [
  { id: '1', year: 2025, grade: '4° Básico', subject: 'Lenguaje', score: 265, nationalAvg: 260, createdAt: '2025-12-01' },
  { id: '2', year: 2025, grade: '4° Básico', subject: 'Matemáticas', score: 248, nationalAvg: 255, createdAt: '2025-12-01' },
  { id: '3', year: 2025, grade: '4° Básico', subject: 'Ciencias', score: 258, nationalAvg: 252, createdAt: '2025-12-01' },
  { id: '4', year: 2025, grade: '6° Básico', subject: 'Lenguaje', score: 270, nationalAvg: 262, createdAt: '2025-12-01' },
  { id: '5', year: 2025, grade: '6° Básico', subject: 'Matemáticas', score: 245, nationalAvg: 258, createdAt: '2025-12-01' },
  { id: '6', year: 2025, grade: '6° Básico', subject: 'Ciencias', score: 255, nationalAvg: 250, createdAt: '2025-12-01' },
  { id: '7', year: 2025, grade: '8° Básico', subject: 'Lenguaje', score: 252, nationalAvg: 256, createdAt: '2025-12-01' },
  { id: '8', year: 2025, grade: '8° Básico', subject: 'Matemáticas', score: 240, nationalAvg: 252, createdAt: '2025-12-01' },
  { id: '9', year: 2025, grade: '2° Medio', subject: 'Lenguaje', score: 268, nationalAvg: 264, createdAt: '2025-12-01' },
  { id: '10', year: 2025, grade: '2° Medio', subject: 'Matemáticas', score: 242, nationalAvg: 256, createdAt: '2025-12-01' },
  // Historical data for trend charts
  { id: '11', year: 2021, grade: 'Promedio', subject: 'Lenguaje', score: 245, nationalAvg: 242, createdAt: '2021-12-01' },
  { id: '12', year: 2021, grade: 'Promedio', subject: 'Matemáticas', score: 238, nationalAvg: 240, createdAt: '2021-12-01' },
  { id: '13', year: 2021, grade: 'Promedio', subject: 'Ciencias', score: 240, nationalAvg: 238, createdAt: '2021-12-01' },
  { id: '14', year: 2021, grade: 'Promedio', subject: 'Historia', score: 242, nationalAvg: 240, createdAt: '2021-12-01' },
  { id: '15', year: 2022, grade: 'Promedio', subject: 'Lenguaje', score: 252, nationalAvg: 248, createdAt: '2022-12-01' },
  { id: '16', year: 2022, grade: 'Promedio', subject: 'Matemáticas', score: 241, nationalAvg: 242, createdAt: '2022-12-01' },
  { id: '17', year: 2022, grade: 'Promedio', subject: 'Ciencias', score: 245, nationalAvg: 243, createdAt: '2022-12-01' },
  { id: '18', year: 2022, grade: 'Promedio', subject: 'Historia', score: 248, nationalAvg: 245, createdAt: '2022-12-01' },
  { id: '19', year: 2023, grade: 'Promedio', subject: 'Lenguaje', score: 258, nationalAvg: 254, createdAt: '2023-12-01' },
  { id: '20', year: 2023, grade: 'Promedio', subject: 'Matemáticas', score: 244, nationalAvg: 246, createdAt: '2023-12-01' },
  { id: '21', year: 2023, grade: 'Promedio', subject: 'Ciencias', score: 250, nationalAvg: 248, createdAt: '2023-12-01' },
  { id: '22', year: 2023, grade: 'Promedio', subject: 'Historia', score: 251, nationalAvg: 249, createdAt: '2023-12-01' },
  { id: '23', year: 2024, grade: 'Promedio', subject: 'Lenguaje', score: 263, nationalAvg: 258, createdAt: '2024-12-01' },
  { id: '24', year: 2024, grade: 'Promedio', subject: 'Matemáticas', score: 246, nationalAvg: 248, createdAt: '2024-12-01' },
  { id: '25', year: 2024, grade: 'Promedio', subject: 'Ciencias', score: 254, nationalAvg: 251, createdAt: '2024-12-01' },
  { id: '26', year: 2024, grade: 'Promedio', subject: 'Historia', score: 255, nationalAvg: 252, createdAt: '2024-12-01' },
];

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LS_KEY, JSON.stringify(SEED_DATA));
  return SEED_DATA;
}

let nextId = 100;

export function SimceProvider({ children }) {
  const [results, setResults] = useState(loadData);

  const persist = (data) => {
    setResults(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  };

  const addResult = useCallback((result) => {
    const newResult = { ...result, id: String(nextId++), createdAt: new Date().toISOString().slice(0, 10) };
    persist([...results, newResult]);
    return newResult;
  }, [results]);

  const updateResult = useCallback((id, fields) => {
    persist(results.map(r => r.id === id ? { ...r, ...fields } : r));
  }, [results]);

  const deleteResult = useCallback((id) => {
    persist(results.filter(r => r.id !== id));
  }, [results]);

  const getAllResults = useCallback(() => results, [results]);

  const getResultsByYear = useCallback((year) => results.filter(r => r.year === year), [results]);

  return (
    <SimceContext.Provider value={{ results, addResult, updateResult, deleteResult, getAllResults, getResultsByYear }}>
      {children}
    </SimceContext.Provider>
  );
}

export function useSimce() {
  const ctx = useContext(SimceContext);
  if (!ctx) throw new Error('useSimce must be used within SimceProvider');
  return ctx;
}

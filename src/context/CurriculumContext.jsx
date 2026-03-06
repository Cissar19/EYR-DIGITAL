import React, { createContext, useContext, useState, useCallback } from 'react';
import { SUBJECTS } from '../data/mockAnalyticsData';

const CurriculumContext = createContext();

const LS_KEY = 'curriculum_records';

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

let nextId = 100;

export function CurriculumProvider({ children }) {
  const [records, setRecords] = useState(loadData);
  const [initialized, setInitialized] = useState(records.length > 0);

  const persist = (data) => {
    setRecords(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  };

  const initWithUsers = useCallback((users) => {
    if (initialized) return;
    const teachers = users.filter(u => u.role === 'teacher');
    const seedRecords = [];
    let id = 1;

    teachers.forEach(u => {
      let hash = 0;
      for (let i = 0; i < u.id.length; i++) {
        hash = ((hash << 5) - hash + u.id.charCodeAt(i)) | 0;
      }
      hash = Math.abs(hash);

      const numSubjects = 2 + (hash % 2); // 2 or 3
      const startIdx = hash % SUBJECTS.length;

      for (let i = 0; i < numSubjects; i++) {
        const subj = SUBJECTS[(startIdx + i * 3) % SUBJECTS.length];
        const subHash = Math.abs(((hash << 3) + i * 7919) | 0);
        const coverage = Math.min(100, Math.round((60 + (subHash % 4100) / 100) * 10) / 10);

        seedRecords.push({
          id: String(id++),
          userId: u.id,
          userName: u.name,
          subjectId: subj.id,
          subjectName: subj.name,
          coverage,
          year: 2026,
          createdAt: new Date().toISOString().slice(0, 10),
        });
      }
    });

    persist(seedRecords);
    setInitialized(true);
  }, [initialized]);

  const addRecord = useCallback((record) => {
    const newRec = { ...record, id: String(nextId++), createdAt: new Date().toISOString().slice(0, 10) };
    persist([...records, newRec]);
    return newRec;
  }, [records]);

  const updateRecord = useCallback((id, fields) => {
    persist(records.map(r => r.id === id ? { ...r, ...fields } : r));
  }, [records]);

  const deleteRecord = useCallback((id) => {
    persist(records.filter(r => r.id !== id));
  }, [records]);

  const getByYear = useCallback((year) => records.filter(r => r.year === year), [records]);

  const getByUser = useCallback((userId) => records.filter(r => r.userId === userId), [records]);

  return (
    <CurriculumContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, getByYear, getByUser, initWithUsers }}>
      {children}
    </CurriculumContext.Provider>
  );
}

export function useCurriculum() {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error('useCurriculum must be used within CurriculumProvider');
  return ctx;
}

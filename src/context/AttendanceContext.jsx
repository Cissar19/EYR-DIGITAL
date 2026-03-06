import React, { createContext, useContext, useState, useCallback } from 'react';

const AttendanceContext = createContext();

const LS_KEY = 'attendance_records';

function generateSeed() {
  // We'll generate seed data when users are available via init
  return [];
}

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

export function AttendanceProvider({ children }) {
  const [records, setRecords] = useState(loadData);
  const [initialized, setInitialized] = useState(records.length > 0);

  const persist = (data) => {
    setRecords(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  };

  // Initialize with seed data from users (called once from a component that has access to users)
  const initWithUsers = useCallback((users) => {
    if (initialized) return;
    const teachers = users.filter(u => u.role === 'teacher' || u.role === 'admin' || u.role === 'staff' || u.role === 'director');
    const seedRecords = teachers.map((u, idx) => {
      // Deterministic attendance 80-98%
      let hash = 0;
      for (let i = 0; i < u.id.length; i++) {
        hash = ((hash << 5) - hash + u.id.charCodeAt(i)) | 0;
      }
      const pct = 80 + (Math.abs(hash) % 1900) / 100;
      return {
        id: String(idx + 1),
        userId: u.id,
        userName: u.name,
        year: 2026,
        attendance: Math.round(pct * 10) / 10,
        createdAt: new Date().toISOString().slice(0, 10),
      };
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
    <AttendanceContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, getByYear, getByUser, initWithUsers }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}

/**
 * useAutoSave.js
 * ──────────────
 * Hook de auto-guardado con debounce.
 *
 * Uso:
 *   const { status, schedule } = useAutoSave(async (data) => {
 *     await updateDoc(ref, data);
 *   }, 500);
 *
 *   // En el handler de cambio:
 *   schedule({ unitTracking: newTracking });
 *
 * status: 'idle' | 'saving' | 'saved' | 'error'
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAutoSave(saveFn, delay = 500) {
  const [status, setStatus]   = useState('idle');
  const timerRef  = useRef(null);
  const saveFnRef = useRef(saveFn);
  const resetRef  = useRef(null);

  // Mantener la referencia actualizada sin re-crear el callback
  saveFnRef.current = saveFn;

  const schedule = useCallback((data) => {
    // Cancelar timer anterior y reset de "saved"
    if (timerRef.current)  clearTimeout(timerRef.current);
    if (resetRef.current)  clearTimeout(resetRef.current);

    setStatus('saving');

    timerRef.current = setTimeout(async () => {
      try {
        await saveFnRef.current(data);
        setStatus('saved');
        resetRef.current = setTimeout(() => setStatus('idle'), 2500);
      } catch (err) {
        console.error('useAutoSave error:', err);
        setStatus('error');
      }
    }, delay);
  }, [delay]);

  // Limpieza al desmontar
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (resetRef.current) clearTimeout(resetRef.current);
  }, []);

  return { status, schedule };
}

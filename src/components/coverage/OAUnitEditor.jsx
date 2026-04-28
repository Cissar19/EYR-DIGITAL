import React, { useState, useMemo } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CheckSquare, Square, Loader2, Check, AlertCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useCurriculumOas } from '../../hooks/useCurriculumOas';
import { useAutoSave } from '../../hooks/useAutoSave';
import { SCHOOL_ID } from '../../lib/coverageConstants';
import { cn } from '../../lib/utils';

const UNITS  = ['u1', 'u2', 'u3', 'u4'];
const LABELS = { u1: 'Unidad 1', u2: 'Unidad 2', u3: 'Unidad 3', u4: 'Unidad 4' };
const UNIT_COLORS = {
  u1: 'text-violet-600 border-violet-300 bg-violet-50',
  u2: 'text-blue-600 border-blue-300 bg-blue-50',
  u3: 'text-emerald-600 border-emerald-300 bg-emerald-50',
  u4: 'text-amber-600 border-amber-300 bg-amber-50',
};
const BADGE_COLORS = {
  u1: 'bg-violet-100 text-violet-700',
  u2: 'bg-blue-100 text-blue-700',
  u3: 'bg-emerald-100 text-emerald-700',
  u4: 'bg-amber-100 text-amber-700',
};

function SaveIndicator({ status }) {
  if (status === 'idle')   return null;
  if (status === 'saving') return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <Loader2 size={12} className="animate-spin" /> Guardando…
    </span>
  );
  if (status === 'saved')  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600">
      <Check size={12} /> Guardado
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-rose-600">
      <AlertCircle size={12} /> Error al guardar
    </span>
  );
}

/**
 * Editor de OAs por unidad para un bloque de cobertura.
 *
 * @param {string} coverageId
 * @param {number} year
 * @param {string} grade
 * @param {string} subject
 * @param {import('../../types/coverage').UnitTracking} initialTracking
 */
export default function OAUnitEditor({ coverageId, year, grade, subject, initialTracking }) {
  const { user } = useAuth();
  const [activeUnit, setActiveUnit] = useState('u1');
  const [tracking, setTracking]     = useState(() => ({
    u1: { ...(initialTracking?.u1 ?? {}) },
    u2: { ...(initialTracking?.u2 ?? {}) },
    u3: { ...(initialTracking?.u3 ?? {}) },
    u4: { ...(initialTracking?.u4 ?? {}) },
  }));

  const { oas, loading: oasLoading, error: oasError } = useCurriculumOas(year, grade, subject);

  const docRef = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', coverageId);

  const { status, schedule } = useAutoSave(async (newTracking) => {
    await updateDoc(docRef, {
      unitTracking: newTracking,
      updatedAt:    serverTimestamp(),
      updatedBy:    user?.id ?? 'unknown',
    });
  }, 500);

  const toggle = (unit, oaCode) => {
    const newTracking = {
      ...tracking,
      [unit]: {
        ...tracking[unit],
        [oaCode]: !tracking[unit]?.[oaCode],
      },
    };
    setTracking(newTracking);
    schedule(newTracking);
  };

  /** Otras unidades donde está marcado este OA */
  const markedInOther = useMemo(() => {
    const result = {};
    for (const code of [...new Set([
      ...Object.keys(tracking.u1),
      ...Object.keys(tracking.u2),
      ...Object.keys(tracking.u3),
      ...Object.keys(tracking.u4),
    ])]) {
      result[code] = UNITS.filter(u => u !== activeUnit && tracking[u]?.[code] === true);
    }
    return result;
  }, [tracking, activeUnit]);

  // OAs a mostrar: los del currículum + cualquier código extra en tracking (OA no oficial)
  const displayOas = useMemo(() => {
    if (oas.length) return oas;
    // Fallback: mostrar códigos que ya están en el tracking (sin curriculum)
    const codes = new Set([
      ...Object.keys(tracking[activeUnit] || {}),
      ...UNITS.flatMap(u => Object.keys(tracking[u] || {})),
    ]);
    return [...codes].sort().map(c => ({ codigo: c, descripcion: '', eje: '' }));
  }, [oas, tracking, activeUnit]);

  // Estadística por unidad para badges del tab
  const unitStats = useMemo(() =>
    Object.fromEntries(
      UNITS.map(u => [u, Object.values(tracking[u] || {}).filter(Boolean).length])
    )
  , [tracking]);

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 px-1 mb-0">
        {UNITS.map(u => (
          <button
            key={u}
            onClick={() => setActiveUnit(u)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center gap-2',
              activeUnit === u
                ? `border-eyr-primary text-eyr-primary bg-white`
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {LABELS[u]}
            {unitStats[u] > 0 && (
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', BADGE_COLORS[u])}>
                {unitStats[u]}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto pr-2">
          <SaveIndicator status={status} />
        </div>
      </div>

      {/* OA List */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 overflow-hidden">
        {oasLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Cargando OAs del currículum…
          </div>
        ) : oasError ? (
          <NoCurriculumWarning grade={grade} subject={subject} />
        ) : displayOas.length === 0 ? (
          <NoCurriculumWarning grade={grade} subject={subject} />
        ) : (
          <OAList
            oas={displayOas}
            unit={activeUnit}
            tracking={tracking[activeUnit]}
            markedInOther={markedInOther}
            onToggle={(code) => toggle(activeUnit, code)}
          />
        )}
      </div>
    </div>
  );
}

function OAList({ oas, unit, tracking, markedInOther, onToggle }) {
  // Agrupar por eje
  const byEje = oas.reduce((acc, oa) => {
    const eje = oa.eje || 'Sin eje';
    if (!acc[eje]) acc[eje] = [];
    acc[eje].push(oa);
    return acc;
  }, {});

  const ejes = Object.keys(byEje);

  return (
    <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
      {ejes.map(eje => (
        <div key={eje}>
          {eje !== 'Sin eje' && (
            <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 sticky top-0">
              {eje}
            </div>
          )}
          {byEje[eje].map(oa => {
            const checked = tracking?.[oa.codigo] === true;
            const others  = markedInOther[oa.codigo] ?? [];
            return (
              <label
                key={oa.codigo}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                  checked ? 'bg-eyr-primary/5 hover:bg-eyr-primary/10' : 'hover:bg-slate-50'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {checked
                    ? <CheckSquare size={18} className="text-eyr-primary" />
                    : <Square size={18} className="text-slate-300" />
                  }
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => onToggle(oa.codigo)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-600">{oa.codigo}</span>
                    {others.map(u => (
                      <span key={u} className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', BADGE_COLORS[u])}>
                        también en {LABELS[u]}
                      </span>
                    ))}
                  </div>
                  {oa.descripcion && (
                    <p className="text-xs text-slate-500 leading-relaxed">{oa.descripcion}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function NoCurriculumWarning({ grade, subject }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6 gap-3">
      <BookOpen size={32} className="text-slate-300" />
      <p className="text-slate-500 text-sm">
        No se encontraron OAs del MINEDUC para <strong>{grade} / {subject}</strong>.
      </p>
      <p className="text-xs text-slate-400">
        Ejecuta <code className="bg-slate-100 px-1 rounded">python scripts/scrape_mineduc.py</code> y luego{' '}
        <code className="bg-slate-100 px-1 rounded">python scripts/upload_firestore.py</code> para cargar el currículum.
      </p>
    </div>
  );
}

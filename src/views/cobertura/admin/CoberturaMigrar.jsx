import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import { SCHOOL_ID, GRADE_LABELS, SUBJECT_LABELS } from '../../../lib/coverageConstants';
import { cn } from '../../../lib/utils';

const UNIT_OPTIONS = [
  { value: '',   label: 'Sin asignar' },
  { value: 'u1', label: 'Unidad 1' },
  { value: 'u2', label: 'Unidad 2' },
  { value: 'u3', label: 'Unidad 3' },
  { value: 'u4', label: 'Unidad 4' },
  { value: 'na', label: 'No aplica' },
];

export default function CoberturaMigrar() {
  const { coverageId } = useParams();
  const { year }       = useAcademicYear();
  const { user }       = useAuth();
  const navigate       = useNavigate();

  const [block,     setBlock]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  // map: oaCode → unit ('u1'|'u2'|'u3'|'u4'|'na'|'')
  const [assignments, setAssignments] = useState({});

  // Guardar asignaciones parciales al desmontar si quedan cambios sin confirmar
  const blockRef      = useRef(null);
  const assignmentsRef= useRef(assignments);
  assignmentsRef.current = assignments;
  const confirmedRef  = useRef(false);

  useEffect(() => {
    if (!coverageId || !year) return;
    const ref = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', coverageId);
    const unsub = onSnapshot(ref,
      snap => {
        if (!snap.exists()) { setError('Bloque no encontrado'); setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() };
        setBlock(data);
        blockRef.current = data;

        // Inicializar asignaciones: los OAs marcados true en legacyOaStatus
        if (data.legacyOaStatus && Object.keys(assignments).length === 0) {
          const init = {};
          for (const [code, val] of Object.entries(data.legacyOaStatus)) {
            if (val === true) init[code] = '';
          }
          setAssignments(init);
        }
        setLoading(false);
      },
      err => { setError(err.message); setLoading(false); }
    );

    return () => {
      unsub();
      // Guardar migración parcial si no se confirmó
      if (!confirmedRef.current && blockRef.current) {
        const hasAny = Object.values(assignmentsRef.current).some(v => v !== '');
        if (hasAny) {
          const docRef = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', coverageId);
          updateDoc(docRef, {
            migrationStatus: 'partial',
            updatedAt: serverTimestamp(),
            updatedBy: user?.id ?? 'unknown',
          }).catch(() => {});
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverageId, year]);

  const setAssignment = (code, unit) => {
    setAssignments(prev => ({ ...prev, [code]: unit }));
  };

  const assignAllToUnit = (unit) => {
    setAssignments(prev => {
      const next = { ...prev };
      for (const code of Object.keys(prev)) next[code] = unit;
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!block) return;
    setSaving(true);

    try {
      // Construir nuevo unitTracking a partir de las asignaciones
      const newTracking = {
        u1: { ...(block.unitTracking?.u1 ?? {}) },
        u2: { ...(block.unitTracking?.u2 ?? {}) },
        u3: { ...(block.unitTracking?.u3 ?? {}) },
        u4: { ...(block.unitTracking?.u4 ?? {}) },
      };

      for (const [code, unit] of Object.entries(assignments)) {
        if (unit && unit !== 'na') {
          newTracking[unit][code] = true;
        }
        // 'na' y '' no se agregan al tracking
      }

      const docRef = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', coverageId);
      await updateDoc(docRef, {
        unitTracking:    newTracking,
        legacyOaStatus:  {},          // limpiar legacy
        migrationStatus: 'complete',
        updatedAt:       serverTimestamp(),
        updatedBy:       user?.id ?? 'unknown',
      });

      confirmedRef.current = true;
      toast.success('Migración completada');
      navigate('/admin/cobertura');
    } catch (err) {
      toast.error(`Error al migrar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton />;
  if (error)   return <ErrorMsg msg={error} />;
  if (!block)  return null;

  const { grade, subject, subjectLabel, teacherName, legacyOaStatus = {} } = block;

  // OAs con valor true en legacyOaStatus
  const oasToMigrate = Object.entries(legacyOaStatus)
    .filter(([, v]) => v === true)
    .map(([code]) => code)
    .sort();

  const allAssigned  = oasToMigrate.every(c => assignments[c] !== '' && assignments[c] !== undefined);
  const assignedCount = oasToMigrate.filter(c => assignments[c] && assignments[c] !== '').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          to={`/admin/cobertura/${coverageId}/edit`}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0 mt-0.5"
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-eyr-on-surface">Migrar OAs del Excel</h1>
          <p className="text-sm text-slate-500">
            {subjectLabel ?? SUBJECT_LABELS[subject] ?? subject} · {GRADE_LABELS[grade] ?? grade} · {teacherName}
          </p>
        </div>
      </div>

      {/* Explicación */}
      <div className="bg-eyr-surface-low rounded-2xl border border-eyr-outline-variant p-4 text-sm text-slate-600">
        <p>
          Estos <strong>{oasToMigrate.length} OA</strong> estaban marcados en el Excel pero no tienen unidad asignada.
          Asigna cada uno a la unidad donde fue trabajado, o márcalo como "No aplica" si no corresponde al currículum oficial.
        </p>
      </div>

      {/* Lista de OAs */}
      {oasToMigrate.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No hay OAs pendientes de migración.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex-1">
              {assignedCount} de {oasToMigrate.length} asignados
            </span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-eyr-primary rounded-full transition-all"
                style={{ width: `${(assignedCount / oasToMigrate.length) * 100}%` }}
              />
            </div>
            <button
              onClick={() => assignAllToUnit('u1')}
              className="text-[11px] font-semibold text-slate-500 hover:text-eyr-primary px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              title="Asigna todos a Unidad 1 como punto de partida"
            >
              Todo a U1
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {oasToMigrate.map(code => (
              <div key={code} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-bold text-slate-600 w-12 shrink-0">{code}</span>
                <div className="flex-1" />
                <select
                  value={assignments[code] ?? ''}
                  onChange={e => setAssignment(code, e.target.value)}
                  className={cn(
                    'text-sm px-3 py-1.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-eyr-primary/30 bg-white',
                    assignments[code]
                      ? 'border-eyr-primary/40 text-eyr-primary font-medium'
                      : 'border-slate-200 text-slate-400'
                  )}
                >
                  {UNIT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón confirmar */}
      {oasToMigrate.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleConfirm}
            disabled={saving || !allAssigned}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-colors',
              allAssigned && !saving
                ? 'bg-eyr-primary text-white hover:bg-eyr-primary-dim shadow-glow'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
              : <><CheckCircle2 size={16} /> Confirmar migración</>
            }
          </button>
          {!allAssigned && (
            <p className="text-xs text-slate-400 text-center self-center">
              Asigna todos los OAs para confirmar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="h-10 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">{msg}</div>
    </div>
  );
}

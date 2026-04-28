import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, GitMerge } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import OAUnitEditor from '../../../components/coverage/OAUnitEditor';
import { SCHOOL_ID, GRADE_LABELS, SUBJECT_LABELS } from '../../../lib/coverageConstants';
import { getPorcentajeFallback, getPorcentajeLegacy, LEVEL_CLASSES, getCoverageLevel } from '../../../lib/coverageMath';

export default function CoberturaEditor() {
  const { coverageId } = useParams();
  const { year }       = useAcademicYear();
  const { user }       = useAuth();

  const [block,   setBlock]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!coverageId || !year) return;
    const ref = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', coverageId);
    const unsub = onSnapshot(ref,
      snap => {
        if (!snap.exists()) { setError('Bloque no encontrado'); setLoading(false); return; }
        setBlock({ id: snap.id, ...snap.data() });
        setLoading(false);
      },
      err => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [coverageId, year]);

  if (loading) return <EditorSkeleton />;
  if (error)   return <ErrorMsg msg={error} />;
  if (!block)  return null;

  const { grade, subject, subjectLabel, teacherName, migrationStatus, unitTracking, excelTotalBasales, legacyOaStatus } = block;

  const pct = migrationStatus === 'complete'
    ? getPorcentajeFallback(unitTracking, excelTotalBasales)
    : getPorcentajeLegacy(legacyOaStatus, excelTotalBasales);
  const level   = getCoverageLevel(pct);
  const colors  = LEVEL_CLASSES[level];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          to="/admin/cobertura"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0 mt-0.5"
        >
          <ChevronLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h1 className="text-lg font-bold text-eyr-on-surface">
              {subjectLabel ?? SUBJECT_LABELS[subject] ?? subject}
            </h1>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 text-sm">{GRADE_LABELS[grade] ?? grade}</span>
          </div>
          <p className="text-xs text-slate-500">{teacherName} · {year}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-bold ${colors.text}`}>
          {Math.round(pct * 100)}%
        </div>
      </div>

      {/* Banner migración pendiente */}
      {migrationStatus !== 'complete' && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <GitMerge size={15} />
            <span>
              {migrationStatus === 'partial'
                ? 'Migración parcial — algunos OAs sin asignar a unidad.'
                : 'OAs del Excel no migrados a unidades.'}
            </span>
          </div>
          <Link
            to={`/admin/cobertura/migrar/${coverageId}`}
            className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Migrar ahora
          </Link>
        </div>
      )}

      {/* Editor */}
      <OAUnitEditor
        coverageId={coverageId}
        year={year}
        grade={grade}
        subject={subject}
        initialTracking={unitTracking}
      />

      {/* Info evaluaciones */}
      {block.evaluaciones && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex gap-6 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Evaluaciones Sem 1</p>
            <p className="font-semibold text-slate-700">{block.evaluaciones.sem1 ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Evaluaciones Sem 2</p>
            <p className="font-semibold text-slate-700">{block.evaluaciones.sem2 ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Total basales (Excel)</p>
            <p className="font-semibold text-slate-700">{excelTotalBasales ?? '—'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
        {msg}
      </div>
    </div>
  );
}

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useCoverageByGrade } from '../../hooks/useCoverage';
import CoverageCard from '../../components/coverage/CoverageCard';
import YearSelector from '../../components/coverage/YearSelector';
import { GRADE_LABELS, SUBJECT_ORDER } from '../../lib/coverageConstants';
import { getPorcentajeFallback, getPorcentajeLegacy } from '../../lib/coverageMath';

export default function CoberturaGradeView() {
  const { grade } = useParams();
  const { year } = useAcademicYear();
  const { data, loading, error } = useCoverageByGrade(year, grade);

  // Ordenar por SUBJECT_ORDER
  const sorted = [...data].sort(
    (a, b) => SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject)
  );

  const gradeLabel = GRADE_LABELS[grade] ?? grade;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/cobertura/dashboard"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-eyr-on-surface">{gradeLabel}</h1>
            <p className="text-sm text-slate-500">Cobertura curricular {year}</p>
          </div>
        </div>
        <YearSelector />
      </div>

      {/* Resumen rápido */}
      {!loading && data.length > 0 && <GradeSummary blocks={data} />}

      {/* Grid de cards */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorMsg msg={error} />
      ) : sorted.length === 0 ? (
        <EmptyState grade={gradeLabel} year={year} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(block => (
            <CoverageCard key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

function GradeSummary({ blocks }) {
  const total = blocks.length;
  const complete = blocks.filter(b => b.migrationStatus === 'complete').length;
  const avgPct = blocks.reduce((sum, b) => {
    const pct = b.migrationStatus === 'complete'
      ? getPorcentajeFallback(b.unitTracking, b.excelTotalBasales)
      : getPorcentajeLegacy(b.legacyOaStatus, b.excelTotalBasales);
    return sum + pct;
  }, 0) / (total || 1);

  return (
    <div className="flex flex-wrap gap-4">
      {[
        { label: 'Promedio cobertura', value: `${Math.round(avgPct * 100)}%` },
        { label: 'Asignaturas', value: total },
        { label: 'Con datos por unidad', value: complete },
        { label: 'Pendientes migración', value: total - complete },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-card px-5 py-3">
          <p className="text-2xl font-bold text-eyr-primary">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ grade, year }) {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
      <p className="text-slate-500 text-sm">
        No hay datos de cobertura para <strong>{grade}</strong> en {year}.
      </p>
      <p className="text-slate-400 text-xs mt-1">Ejecuta el seed para importar los datos iniciales.</p>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
      Error al cargar datos: {msg}
    </div>
  );
}

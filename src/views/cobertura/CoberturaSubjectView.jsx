import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useCoverageBySubject } from '../../hooks/useCoverage';
import CoverageBarChart from '../../components/coverage/CoverageBarChart';
import CoverageCard from '../../components/coverage/CoverageCard';
import YearSelector from '../../components/coverage/YearSelector';
import { GRADE_ORDER, GRADE_LABELS, SUBJECT_LABELS } from '../../lib/coverageConstants';
import { getPorcentajeFallback, getPorcentajeLegacy } from '../../lib/coverageMath';

export default function CoberturaSubjectView() {
  const { subject } = useParams();
  const { year } = useAcademicYear();
  const { data, loading, error } = useCoverageBySubject(year, subject);

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

  // Ordenar por grado
  const sorted = [...data].sort(
    (a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
  );

  // Datos para gráfico
  const chartData = sorted.map(b => ({
    label: GRADE_LABELS[b.grade] ?? b.grade,
    pct: b.migrationStatus === 'complete'
      ? getPorcentajeFallback(b.unitTracking, b.excelTotalBasales)
      : getPorcentajeLegacy(b.legacyOaStatus, b.excelTotalBasales),
  }));

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
            <h1 className="text-xl font-bold text-eyr-on-surface">{subjectLabel}</h1>
            <p className="text-sm text-slate-500">Comparativa por curso — {year}</p>
          </div>
        </div>
        <YearSelector />
      </div>

      {/* Gráfico comparativo */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">% cobertura por curso</h2>
          <CoverageBarChart data={chartData} height={200} />
        </div>
      )}

      {/* Cards por curso */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorMsg msg={error} />
      ) : sorted.length === 0 ? (
        <EmptyState subject={subjectLabel} year={year} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorted.map(block => (
            <div key={block.id}>
              <p className="text-xs font-semibold text-slate-500 mb-1.5 px-1">
                {GRADE_LABELS[block.grade] ?? block.grade}
              </p>
              <CoverageCard block={block} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ subject, year }) {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
      <p className="text-slate-500 text-sm">
        No hay datos para <strong>{subject}</strong> en {year}.
      </p>
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

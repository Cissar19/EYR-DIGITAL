import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, LayoutGrid, BarChart2, ArrowRight, GitCompare } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useCoverageStats } from '../../hooks/useCoverage';
import { useAuth } from '../../context/AuthContext';
import CoverageGrid from '../../components/coverage/CoverageGrid';
import CoverageBarChart from '../../components/coverage/CoverageBarChart';
import YearSelector from '../../components/coverage/YearSelector';
import { SUBJECT_ORDER, SUBJECT_LABELS, GRADE_ORDER, GRADE_LABELS } from '../../lib/coverageConstants';
import { getPorcentajeFallback, getPorcentajeLegacy, getCoverageLevel } from '../../lib/coverageMath';
import { cn } from '../../lib/utils';

function blockPct(b) {
  return b.migrationStatus === 'complete'
    ? getPorcentajeFallback(b.unitTracking, b.excelTotalBasales)
    : getPorcentajeLegacy(b.legacyOaStatus, b.excelTotalBasales);
}

function buildSubjectChart(data) {
  return SUBJECT_ORDER
    .map(s => {
      const blocks = data.filter(b => b.subject === s);
      if (!blocks.length) return null;
      const avg = blocks.reduce((acc, b) => acc + blockPct(b), 0) / blocks.length;
      return { label: SUBJECT_LABELS[s] ?? s, pct: avg, subject: s };
    })
    .filter(Boolean);
}

function buildGradeChart(data) {
  return GRADE_ORDER
    .map(g => {
      const blocks = data.filter(b => b.grade === g);
      if (!blocks.length) return null;
      const avg = blocks.reduce((acc, b) => acc + blockPct(b), 0) / blocks.length;
      return { label: GRADE_LABELS[g] ?? g, pct: avg, grade: g };
    })
    .filter(Boolean);
}

export default function CoberturaDashboard() {
  const { year, availableYears } = useAcademicYear();
  const [compare, setCompare] = useState(false);

  const prevYear = availableYears.find(y => y < year) ?? null;
  const showCompare = compare && prevYear != null;

  const { data, loading, error }           = useCoverageStats(year);
  const { data: prevData, loading: prevLoading } = useCoverageStats(showCompare ? prevYear : null);
  const { user } = useAuth();
  const canManage = ['super_admin', 'admin', 'utp_head'].includes(user?.role);

  const pendingCount = data.filter(b => b.migrationStatus === 'pending').length;

  const globalAvg = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((acc, b) => acc + blockPct(b), 0) / data.length;
  }, [data]);

  const bySubjectChart = useMemo(() => buildSubjectChart(data), [data]);
  const byGradeChart   = useMemo(() => buildGradeChart(data),   [data]);

  const prevBySubjectChart = useMemo(
    () => showCompare && !prevLoading ? buildSubjectChart(prevData) : null,
    [showCompare, prevData, prevLoading]
  );
  const prevByGradeChart = useMemo(
    () => showCompare && !prevLoading ? buildGradeChart(prevData) : null,
    [showCompare, prevData, prevLoading]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-eyr-on-surface">Cobertura Curricular</h1>
          <p className="text-sm text-slate-500">Resumen global — {year}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {prevYear != null && !loading && data.length > 0 && (
            <button
              onClick={() => setCompare(v => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors',
                compare
                  ? 'bg-eyr-primary text-white border-eyr-primary'
                  : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <GitCompare size={13} />
              {compare ? `Comparando con ${prevYear}` : `Comparar con ${prevYear}`}
            </button>
          )}
          <YearSelector />
        </div>
      </div>

      {/* Banner pendientes de migración */}
      {!loading && pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong>{pendingCount} bloques</strong> pendientes de migración — los porcentajes usan datos del Excel.
            </span>
          </div>
          {canManage && (
            <Link
              to="/cobertura"
              className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            >
              Migrar ahora <ArrowRight size={12} />
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonDashboard />
      ) : error ? (
        <ErrorMsg msg={error} />
      ) : data.length === 0 ? (
        <EmptyState year={year} />
      ) : (
        <>
          {/* KPIs globales */}
          <KpiRow data={data} globalAvg={globalAvg} />

          {/* Grid principal */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid size={16} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Mapa de cobertura</h2>
            </div>
            <CoverageGrid blocks={data} />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">Promedio por asignatura</h2>
                {showCompare && (
                  <ComparisonLegend currentYear={year} prevYear={prevYear} />
                )}
              </div>
              <CoverageBarChart
                data={bySubjectChart}
                prevData={prevBySubjectChart}
                height={200}
                currentYear={year}
                prevYear={prevYear}
              />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">Promedio por curso</h2>
                {showCompare && (
                  <ComparisonLegend currentYear={year} prevYear={prevYear} />
                )}
              </div>
              <CoverageBarChart
                data={byGradeChart}
                prevData={prevByGradeChart}
                height={200}
                currentYear={year}
                prevYear={prevYear}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ComparisonLegend({ currentYear, prevYear }) {
  return (
    <div className="flex items-center gap-3 ml-auto">
      <span className="flex items-center gap-1 text-[10px] text-slate-400">
        <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" /> {prevYear}
      </span>
      <span className="flex items-center gap-1 text-[10px] text-slate-400">
        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> {currentYear}
      </span>
    </div>
  );
}

function KpiRow({ data, globalAvg }) {
  const complete  = data.filter(b => b.migrationStatus === 'complete').length;
  const pending   = data.length - complete;
  const level     = getCoverageLevel(globalAvg);
  const levelColor = { green: 'text-emerald-600', yellow: 'text-amber-600', red: 'text-rose-600' };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Promedio global', value: `${Math.round(globalAvg * 100)}%`, color: levelColor[level] },
        { label: 'Total bloques', value: data.length },
        { label: 'Con datos por unidad', value: complete, color: 'text-emerald-600' },
        { label: 'Pendientes migración', value: pending, color: pending > 0 ? 'text-amber-600' : 'text-slate-700' },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-card px-5 py-4">
          <p className={cn('text-2xl font-bold', color ?? 'text-eyr-primary')}>{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
    </div>
  );
}

function EmptyState({ year }) {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
      <p className="text-slate-500 text-sm">No hay datos de cobertura para {year}.</p>
      <p className="text-slate-400 text-xs mt-1">
        Ejecuta <code className="bg-slate-100 px-1 rounded">npm run seed:coverage</code> para importar los datos.
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

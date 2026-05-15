import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, LayoutGrid, BarChart2, ArrowRight, GitCompare } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useCoverageStats } from '../../hooks/useCoverage';
import { useAuth } from '../../context/AuthContext';
import CoverageGrid from '../../components/coverage/CoverageGrid';
import CoverageBarChart from '../../components/coverage/CoverageBarChart';
import YearSelector from '../../components/coverage/YearSelector';
import {
  SUBJECT_ORDER, SUBJECT_LABELS,
  GRADE_ORDER, GRADE_LABELS, GRADE_FULL_LABELS,
} from '../../lib/coverageConstants';
// ── helpers ───────────────────────────────────────────────────────────────────
// Combina legacyOaStatus (OADetailDrawer) y unitTracking (OAUnitEditor/addYear)
// para calcular el porcentaje de OAs pasados sobre el TOTAL de OAs conocidos.
function blockPct(b) {
  const legacy = b.legacyOaStatus ?? {};
  const ut = b.unitTracking;

  const allCodes = new Set();
  const passedCodes = new Set();

  for (const [code, val] of Object.entries(legacy)) {
    allCodes.add(code);
    if (val === true) passedCodes.add(code);
  }

  if (ut) {
    for (const u of ['u1','u2','u3','u4']) {
      for (const [code, val] of Object.entries(ut[u] ?? {})) {
        allCodes.add(code);
        if (val === true && !(code in legacy)) {
          passedCodes.add(code);
        }
      }
    }
  }

  if (allCodes.size === 0) return 0;
  return passedCodes.size / allCodes.size;
}

const TARGET = 0.65; // escala 0-1

const SUBJ_CONFIG = {
  lenguaje:            { c1: '#4f7dd8', c2: '#7aa3e8', glyph: 'Aa' },
  lengua_y_literatura: { c1: '#4f7dd8', c2: '#7aa3e8', glyph: 'Aa' },
  matematica:          { c1: '#7c5bd8', c2: '#a08be8', glyph: 'π'  },
  ciencias:            { c1: '#2bae7e', c2: '#52c49a', glyph: '✿'  },
  historia:            { c1: '#e8853c', c2: '#f0a468', glyph: 'H'  },
  educacion_fisica:    { c1: '#e44d5c', c2: '#f07a85', glyph: '✮'  },
  musica:              { c1: '#c95fb8', c2: '#dc8cd0', glyph: '♪'  },
  artes:               { c1: '#f0a742', c2: '#f8c468', glyph: '✦'  },
  tecnologia:          { c1: '#2bb0cb', c2: '#58c8df', glyph: '{}'  },
  ingles:              { c1: '#6b7585', c2: '#9aa0ac', glyph: 'En' },
  orientacion:         { c1: '#1f9d4f', c2: '#52b87a', glyph: 'Or' },
  religion_evangelica: { c1: '#d4a853', c2: '#e8c47a', glyph: '✝'  },
  religion_catolica:   { c1: '#c47a3d', c2: '#d9a068', glyph: '†'  },
};
const DEFAULT_CFG = { c1: '#64748b', c2: '#94a3b8', glyph: '?' };

const STATUS_CFG = {
  ontrack: { label: 'Al día',     bg: '#d6f1de', color: '#1f9d4f' },
  atrisk:  { label: 'En riesgo',  bg: '#fbe7b4', color: '#d68c0e' },
  behind:  { label: 'Atrasado',   bg: '#fbd5d0', color: '#d63c2e' },
  paused:  { label: 'Sin inicio', bg: '#ebeaf2', color: '#8b89a8' },
};

function getStatus(pct) {
  if (pct === 0)     return 'paused';
  if (pct >= TARGET) return 'ontrack';
  if (pct >= 0.50)   return 'atrisk';
  return 'behind';
}

function pctInt(p) { return Math.round(p * 100); }

function buildGradeAvgs(data) {
  return GRADE_ORDER.map(grade => {
    const blocks = data.filter(b => b.grade === grade);
    if (!blocks.length) return { grade, pct: 0, hasData: false };
    const avg = blocks.reduce((acc, b) => acc + blockPct(b), 0) / blocks.length;
    return { grade, pct: avg, hasData: true };
  });
}

function buildSubjectStats(data, grade) {
  const pool = grade ? data.filter(b => b.grade === grade) : data;
  return SUBJECT_ORDER.map(s => {
    const sb = pool.filter(b => b.subject === s);
    if (!sb.length) return null;
    const avg     = sb.reduce((acc, b) => acc + blockPct(b), 0) / sb.length;
    const teacher = sb.find(b => b.teacherName)?.teacherName ?? null;
    return {
      subject: s,
      label:   SUBJECT_LABELS[s] ?? s,
      cfg:     SUBJ_CONFIG[s] ?? DEFAULT_CFG,
      pct:     avg,
      status:  getStatus(avg),
      teacher,
      blockCount: sb.length,
    };
  }).filter(Boolean);
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

function buildGradeChartData(data) {
  return GRADE_ORDER
    .map(g => {
      const blocks = data.filter(b => b.grade === g);
      if (!blocks.length) return null;
      const avg = blocks.reduce((acc, b) => acc + blockPct(b), 0) / blocks.length;
      return { label: GRADE_LABELS[g] ?? g, pct: avg, grade: g };
    })
    .filter(Boolean);
}

function buildTeacherChart(data) {
  const map = {};
  data.forEach(b => {
    if (!b.teacherId) return;
    if (!map[b.teacherId]) map[b.teacherId] = { name: b.teacherName ?? b.teacherId, total: 0, count: 0 };
    map[b.teacherId].total += blockPct(b);
    map[b.teacherId].count++;
  });
  return Object.values(map)
    .map(t => {
      const parts = t.name.trim().split(/\s+/);
      const label = parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
      return { label, fullName: t.name, pct: t.total / t.count };
    })
    .sort((a, b) => b.pct - a.pct);
}

// ── Subject card ──────────────────────────────────────────────────────────────
function SubjectCard({ stat }) {
  const { cfg, pct, status } = stat;
  const sc  = STATUS_CFG[status];
  const pct100 = pctInt(pct);

  return (
    <Link
      to={`/cobertura/asignatura/${stat.subject}`}
      className="rounded-2xl overflow-hidden flex flex-col border border-[#f0e3c8] shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      style={{ textDecoration: 'none' }}
    >
      {/* Gradient top */}
      <div className="relative p-5 overflow-hidden" style={{ background: `linear-gradient(135deg, ${cfg.c1} 0%, ${cfg.c2} 100%)`, minHeight: 190 }}>
        <div style={{ position: 'absolute', right: -50, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.14)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: -30, top: -50, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.10)', pointerEvents: 'none' }} />

        {/* Icon + name + status */}
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0 text-white select-none"
            style={{ background: 'rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.35)', boxShadow: '0 6px 14px -6px rgba(0,0,0,.25)', transform: 'rotate(-4deg)' }}>
            {cfg.glyph}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold leading-tight text-white tracking-tight">{stat.label}</p>
            {stat.teacher && (
              <p className="text-[11.5px] mt-1 font-medium" style={{ color: 'rgba(255,255,255,.85)' }}>
                {stat.teacher.split(' ').slice(0, 2).join(' ')}
              </p>
            )}
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.30)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-white">{sc.label}</span>
            </div>
          </div>
        </div>

        {/* Big percent */}
        <div className="flex items-end justify-between mt-4 relative z-10">
          <span className="font-black tabular-nums text-white" style={{ fontSize: 52, letterSpacing: '-0.04em', textShadow: '0 2px 12px rgba(0,0,0,.12)', lineHeight: 0.9 }}>
            {pct100}<span style={{ fontSize: 24, fontWeight: 700, opacity: 0.85, marginLeft: 2 }}>%</span>
          </span>
          <div className="text-right text-[11.5px] leading-snug font-medium" style={{ color: 'rgba(255,255,255,.95)' }}>
            <strong className="block text-sm font-extrabold">{stat.blockCount} bloques</strong>
            en este nivel
          </div>
        </div>

        {/* Progress bar with target */}
        <div className="relative mt-3.5 h-1.5 rounded-full z-10 overflow-visible" style={{ background: 'rgba(255,255,255,.22)' }}>
          <div className="absolute left-0 top-0 bottom-0 rounded-full bg-white" style={{ width: `${pct100}%`, boxShadow: '0 0 0 2px rgba(255,255,255,.15)' }} />
          <div className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-white/80" style={{ left: `${pctInt(TARGET)}%` }}>
            <span className="absolute left-1.5 top-[-1px] text-[9px] text-white/80 font-semibold uppercase tracking-wide whitespace-nowrap">meta</span>
          </div>
        </div>
      </div>

      {/* White bottom */}
      <div className="p-4 bg-white flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-gray-400 font-medium">
            Meta: {pctInt(TARGET)}% cobertura
          </span>
          <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
            {sc.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CoberturaDashboard() {
  const { year, availableYears }               = useAcademicYear();
  const [compare, setCompare]                  = useState(false);
  const [selectedGrade, setSelectedGrade]      = useState(null);
  const [viewMode, setViewMode]                = useState('cards');

  const prevYear    = availableYears.find(y => y < year) ?? null;
  const showCompare = compare && prevYear != null;

  const { data, loading, error }                     = useCoverageStats(year);
  const { data: prevData, loading: prevLoading }     = useCoverageStats(showCompare ? prevYear : null);
  const { user }    = useAuth();
  const canManage   = ['super_admin', 'admin', 'utp_head'].includes(user?.role);
  const pendingCount = data.filter(b => b.migrationStatus === 'pending').length;

  const globalAvg = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((acc, b) => acc + blockPct(b), 0) / data.length;
  }, [data]);

  const gradeAvgs     = useMemo(() => buildGradeAvgs(data), [data]);
  const subjectStats  = useMemo(() => buildSubjectStats(data, selectedGrade), [data, selectedGrade]);

  const activeAvg    = selectedGrade
    ? (gradeAvgs.find(g => g.grade === selectedGrade)?.pct ?? 0)
    : globalAvg;
  const ontrackCount = subjectStats.filter(s => s.status === 'ontrack').length;
  const atriskCount  = subjectStats.filter(s => s.status === 'atrisk').length;
  const behindCount  = subjectStats.filter(s => ['behind', 'paused'].includes(s.status)).length;

  // Charts (solo vista global)
  const bySubjectChart  = useMemo(() => buildSubjectChart(data),     [data]);
  const byGradeChart    = useMemo(() => buildGradeChartData(data),   [data]);
  const byTeacherChart  = useMemo(() => buildTeacherChart(data),     [data]);
  const prevBySubjectChart = useMemo(
    () => showCompare && !prevLoading ? buildSubjectChart(prevData) : null,
    [showCompare, prevData, prevLoading],
  );
  const prevByGradeChart = useMemo(
    () => showCompare && !prevLoading ? buildGradeChartData(prevData) : null,
    [showCompare, prevData, prevLoading],
  );
  const prevByTeacherChart = useMemo(
    () => showCompare && !prevLoading ? buildTeacherChart(prevData) : null,
    [showCompare, prevData, prevLoading],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5 animate-fade-in-up">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight"
            style={{ background: 'linear-gradient(135deg, #1d5fb1 0%, #f25c54 60%, #f7a072 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Cobertura Curricular
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Resumen global — {year}{selectedGrade ? ` · ${GRADE_FULL_LABELS[selectedGrade] ?? selectedGrade}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {prevYear != null && !loading && data.length > 0 && (
            <button
              onClick={() => setCompare(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
              style={compare
                ? { background: '#1d5fb1', color: 'white', borderColor: '#1d5fb1' }
                : { color: '#6c6a8f', borderColor: '#e5d3a8', background: 'white' }}
            >
              <GitCompare size={13} />
              {compare ? `Comparando con ${prevYear}` : `Comparar con ${prevYear}`}
            </button>
          )}
          <YearSelector />
        </div>
      </div>

      {/* ── Pending migration banner ── */}
      {!loading && pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span><strong>{pendingCount} bloques</strong> pendientes de migración — los porcentajes usan datos del Excel.</span>
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
          {/* ── Grade strip ── */}
          <div className="bg-white border border-[#f0e3c8] rounded-2xl p-2 shadow-sm overflow-x-auto">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${GRADE_ORDER.length + 1}, minmax(72px, 1fr))` }}>
              {/* "Todos" tab */}
              {(() => {
                const isActive = selectedGrade === null;
                return (
                  <button
                    key="all"
                    onClick={() => setSelectedGrade(null)}
                    className="rounded-2xl px-3 py-3 text-left flex flex-col gap-2 transition-all duration-150"
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #1d5fb1 0%, #5b9be5 100%)',
                      boxShadow: '0 6px 18px -8px rgba(29,95,177,.55)',
                      transform: 'translateY(-2px)',
                    } : {}}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12px] font-bold" style={{ color: isActive ? 'white' : '#1d1b3d' }}>Todos</span>
                      <span className="text-[12px] font-extrabold tabular-nums" style={{ color: isActive ? 'white' : '#3d3a6b' }}>
                        {pctInt(globalAvg)}%
                      </span>
                    </div>
                    <div className="h-[5px] rounded-full overflow-hidden" style={{ background: isActive ? 'rgba(255,255,255,.25)' : '#f0e3c8' }}>
                      <div className="h-full rounded-full" style={{ width: `${pctInt(globalAvg)}%`, background: isActive ? 'white' : '#f25c54' }} />
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: isActive ? 'rgba(255,255,255,.8)' : '#9b99b8' }}>Global</span>
                  </button>
                );
              })()}

              {/* Grade tabs */}
              {GRADE_ORDER.map(grade => {
                const ga       = gradeAvgs.find(g => g.grade === grade);
                const tabPct   = ga?.hasData ? pctInt(ga.pct) : 0;
                const isActive = selectedGrade === grade;
                return (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className="rounded-2xl px-3 py-3 text-left flex flex-col gap-2 transition-all duration-150"
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #1d5fb1 0%, #5b9be5 100%)',
                      boxShadow: '0 6px 18px -8px rgba(29,95,177,.55)',
                      transform: 'translateY(-2px)',
                    } : {}}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[13px] font-bold" style={{ color: isActive ? 'white' : '#1d1b3d' }}>
                        {GRADE_LABELS[grade]}
                      </span>
                      <span className="text-[13px] font-extrabold tabular-nums" style={{ color: isActive ? 'white' : '#3d3a6b' }}>
                        {tabPct}%
                      </span>
                    </div>
                    <div className="h-[5px] rounded-full overflow-hidden" style={{ background: isActive ? 'rgba(255,255,255,.25)' : '#f0e3c8' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${tabPct}%`, background: isActive ? 'white' : '#f25c54' }} />
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: isActive ? 'rgba(255,255,255,.8)' : '#9b99b8' }}>
                      Básico
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-4 gap-3.5">
            {/* Hero */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1d5fb1 0%, #4b8de8 50%, #6fa9f0 100%)', boxShadow: '0 12px 28px -12px rgba(29,95,177,.55)' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
              <div style={{ position: 'absolute', right: 80, bottom: -60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2 relative z-10" style={{ color: 'rgba(255,255,255,.9)' }}>
                {selectedGrade ? `Promedio ${GRADE_FULL_LABELS[selectedGrade]}` : 'Promedio global'}
              </p>
              <p className="text-4xl font-extrabold tracking-tight tabular-nums relative z-10 text-white leading-none">
                {pctInt(activeAvg)}<span className="text-xl ml-1 font-bold opacity-80">%</span>
              </p>
              <p className="text-xs relative z-10 mt-2" style={{ color: 'rgba(255,255,255,.85)' }}>
                {ontrackCount} de {subjectStats.length} asignaturas al día · Meta {pctInt(TARGET)}%
              </p>
            </div>
            {/* Al día */}
            <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #d6f1de 0%, #c7eed8 100%)', borderColor: '#b3e3c5' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#1f7a4d' }}>Al día</p>
              <p className="text-4xl font-extrabold tracking-tight tabular-nums leading-none" style={{ color: '#1f7a4d' }}>{ontrackCount}</p>
              <p className="text-xs mt-2" style={{ color: '#1f7a4d', opacity: 0.8 }}>asignaturas ≥ {pctInt(TARGET)}% cobertura</p>
            </div>
            {/* En riesgo */}
            <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderColor: '#f4d97f' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b48b1a' }}>En riesgo</p>
              <p className="text-4xl font-extrabold tracking-tight tabular-nums leading-none" style={{ color: '#b48b1a' }}>{atriskCount}</p>
              <p className="text-xs mt-2" style={{ color: '#b48b1a', opacity: 0.8 }}>asignaturas entre 50% y {pctInt(TARGET)}%</p>
            </div>
            {/* Atrasadas */}
            <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #ffe4d2 0%, #ffd4b8 100%)', borderColor: '#ffc09e' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b14a14' }}>Atrasadas</p>
              <p className="text-4xl font-extrabold tracking-tight tabular-nums leading-none" style={{ color: '#b14a14' }}>{behindCount}</p>
              <p className="text-xs mt-2" style={{ color: '#b14a14', opacity: 0.8 }}>asignaturas bajo 50% cobertura</p>
            </div>
          </div>

          {/* ── Section header + toggle ── */}
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-extrabold tracking-tight text-gray-900">Asignaturas</h3>
            <span className="text-sm text-gray-400 font-medium">
              {selectedGrade ? GRADE_FULL_LABELS[selectedGrade] : 'Todos los cursos'}
            </span>
            <div className="ml-auto flex bg-white border border-[#f0e3c8] rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('cards')}
                className="h-7 px-3 rounded-lg text-[12.5px] font-semibold flex items-center gap-1.5 transition-all"
                style={viewMode === 'cards' ? { background: '#1d1b3d', color: 'white' } : { color: '#6c6a8f' }}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
              </button>
              <button
                onClick={() => setViewMode('bars')}
                className="h-7 px-3 rounded-lg text-[12.5px] font-semibold flex items-center gap-1.5 transition-all"
                style={viewMode === 'bars' ? { background: '#1d1b3d', color: 'white' } : { color: '#6c6a8f' }}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Barras
              </button>
            </div>
          </div>

          {/* ── Subject cards ── */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-3 gap-4">
              {subjectStats.map(s => (
                <SubjectCard key={s.subject} stat={s} />
              ))}
            </div>
          )}

          {/* ── Subject bars ── */}
          {viewMode === 'bars' && (
            <div className="bg-white rounded-2xl border border-[#f0e3c8] p-5 shadow-sm">
              {subjectStats.map((s, i) => (
                <Link
                  key={s.subject}
                  to={`/cobertura/asignatura/${s.subject}`}
                  className="grid items-center gap-3 py-2 group"
                  style={{
                    gridTemplateColumns: '160px 1fr 56px 96px',
                    borderBottom: i < subjectStats.length - 1 ? '1px dashed #f0e3c8' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-800">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.cfg.c1 }} />
                    {s.label}
                  </div>
                  <div className="relative h-[22px] rounded-md overflow-hidden" style={{ background: '#f5f4fb' }}>
                    <div className="absolute top-0 bottom-0 w-0.5 z-10" style={{ left: `${pctInt(TARGET)}%`, background: '#1d1b3d' }} />
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-md flex items-center pl-2 text-[11.5px] font-semibold text-white transition-all duration-700"
                      style={{ width: `${Math.max(pctInt(s.pct), 3)}%`, background: `linear-gradient(90deg, ${s.cfg.c1}, ${s.cfg.c2})` }}
                    >
                      {pctInt(s.pct) >= 12 && `${pctInt(s.pct)}%`}
                    </div>
                  </div>
                  <span className="text-[13.5px] font-bold text-right tabular-nums" style={{ color: s.cfg.c1 }}>
                    {pctInt(s.pct)}%
                  </span>
                  <div className="flex justify-end">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: STATUS_CFG[s.status].bg, color: STATUS_CFG[s.status].color }}>
                      {STATUS_CFG[s.status].label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── Global charts (solo cuando no hay curso seleccionado) ── */}
          {!selectedGrade && (
            <>
              <div className="bg-white rounded-2xl border border-[#f0e3c8] shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutGrid size={16} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-800">Mapa de cobertura</h2>
                </div>
                <CoverageGrid blocks={data} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[#f0e3c8] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={16} className="text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-800">Promedio por asignatura</h2>
                    {showCompare && <ComparisonLegend currentYear={year} prevYear={prevYear} />}
                  </div>
                  <CoverageBarChart data={bySubjectChart} prevData={prevBySubjectChart} height={200} currentYear={year} prevYear={prevYear} />
                </div>
                <div className="bg-white rounded-2xl border border-[#f0e3c8] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={16} className="text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-800">Promedio por curso</h2>
                    {showCompare && <ComparisonLegend currentYear={year} prevYear={prevYear} />}
                  </div>
                  <CoverageBarChart data={byGradeChart} prevData={prevByGradeChart} height={200} currentYear={year} prevYear={prevYear} />
                </div>
              </div>

              {byTeacherChart.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#f0e3c8] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={16} className="text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-800">Promedio por docente</h2>
                    {showCompare && <ComparisonLegend currentYear={year} prevYear={prevYear} />}
                  </div>
                  <CoverageBarChart data={byTeacherChart} prevData={prevByTeacherChart} height={220} currentYear={year} prevYear={prevYear} />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
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

function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="h-20 rounded-2xl bg-[#f5f0e8] animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#f5f0e8] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-[#f5f0e8] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ year }) {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#f0e3c8]">
      <p className="text-gray-400 text-sm">No hay datos de cobertura para {year}.</p>
      <p className="text-gray-300 text-xs mt-1">
        Ejecuta <code className="bg-gray-100 px-1 rounded">npm run seed:coverage</code> para importar los datos.
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

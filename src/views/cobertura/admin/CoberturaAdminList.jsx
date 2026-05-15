import React, { useState, useMemo, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Pencil, CheckCircle2,
  BookOpen, Hash, FlaskConical, Landmark,
  Dumbbell, Music, Palette, Cpu, X, Loader2,
  Lock, Plus, Users, GraduationCap, BarChart2
} from 'lucide-react';
import CoverageBarChart from '../../../components/coverage/CoverageBarChart';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';
import { useCoverageStats } from '../../../hooks/useCoverage';
import { useCurriculumOas, useCurriculumOasForGrade } from '../../../hooks/useCurriculumOas';
import { useAutoSave } from '../../../hooks/useAutoSave';
import YearSelector from '../../../components/coverage/YearSelector';
import {
  GRADE_ORDER, SUBJECT_ORDER, GRADE_LABELS, GRADE_FULL_LABELS, SUBJECT_LABELS, SCHOOL_ID, getBasalesMineduc
} from '../../../lib/coverageConstants';
import { getCoverageLevel } from '../../../lib/coverageMath';
import { cn } from '../../../lib/utils';

/* ─── Meta por asignatura ────────────────────────────────────────────────── */
const SUBJECT_META = {
  lenguaje:            { icon: BookOpen,     bg: 'bg-violet-100', text: 'text-violet-600', bar: 'bg-violet-500' },
  lengua_y_literatura: { icon: BookOpen,     bg: 'bg-violet-100', text: 'text-violet-600', bar: 'bg-violet-500' },
  matematica:          { icon: Hash,         bg: 'bg-blue-100',   text: 'text-blue-600',   bar: 'bg-blue-500'   },
  ciencias:            { icon: FlaskConical, bg: 'bg-emerald-100',text: 'text-emerald-600',bar: 'bg-emerald-500'},
  historia:            { icon: Landmark,     bg: 'bg-amber-100',  text: 'text-amber-600',  bar: 'bg-amber-500'  },
  educacion_fisica:    { icon: Dumbbell,     bg: 'bg-rose-100',   text: 'text-rose-600',   bar: 'bg-rose-500'   },
  musica:              { icon: Music,        bg: 'bg-pink-100',   text: 'text-pink-600',   bar: 'bg-pink-500'   },
  artes:               { icon: Palette,      bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' },
  tecnologia:          { icon: Cpu,          bg: 'bg-cyan-100',   text: 'text-cyan-600',   bar: 'bg-cyan-500'   },
};

/* ─── Colores por curso ──────────────────────────────────────────────────── */
const GRADE_COLORS = {
  '1B': { pill: 'bg-violet-500', light: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700',  active: 'bg-violet-500 text-white' },
  '2B': { pill: 'bg-blue-500',   light: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700',    active: 'bg-blue-500 text-white'   },
  '3B': { pill: 'bg-cyan-500',   light: 'bg-cyan-50',    border: 'border-cyan-200',   text: 'text-cyan-700',    active: 'bg-cyan-500 text-white'   },
  '4B': { pill: 'bg-teal-500',   light: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-700',    active: 'bg-teal-500 text-white'   },
  '5B': { pill: 'bg-emerald-500',light: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700', active: 'bg-emerald-500 text-white' },
  '6B': { pill: 'bg-amber-500',  light: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',   active: 'bg-amber-500 text-white'  },
  '7B': { pill: 'bg-orange-500', light: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700',  active: 'bg-orange-500 text-white' },
  '8B': { pill: 'bg-rose-500',   light: 'bg-rose-50',    border: 'border-rose-200',   text: 'text-rose-700',    active: 'bg-rose-500 text-white'   },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getPasadosSet(block) {
  const seen = new Set();
  for (const [code, val] of Object.entries(block.legacyOaStatus ?? {})) {
    if (val === true) seen.add(code);
  }
  return seen;
}

function getOaStats(block) {
  const status  = block.legacyOaStatus ?? {};
  const pasados = Object.values(status).filter(v => v === true).length;
  const total   = Object.keys(status).length;
  return {
    pasados,
    pendientes: Math.max(0, total - pasados),
    total,
    pct: total > 0 ? pasados / total : 0,
  };
}

function getCurriculumOaStats(block, curriculumOas) {
  if (!curriculumOas?.length) return getOaStats(block);
  const seen    = getPasadosSet(block);
  const total   = curriculumOas.length;
  const pasados = curriculumOas.filter(oa => seen.has(normOaCode(oa.codigo))).length;
  return {
    pasados,
    pendientes: Math.max(0, total - pasados),
    total,
    pct: total > 0 ? pasados / total : 0,
  };
}

function getBasalOaStats(block) {
  const basales = Object.entries(block.basalesOas ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  const total   = basales.length;
  if (total === 0) return { pasados: 0, pendientes: 0, total: 0, pct: 0 };
  const seen    = getPasadosSet(block);
  const pasados = basales.filter(c => seen.has(c)).length;
  return {
    pasados,
    pendientes: Math.max(0, total - pasados),
    total,
    pct: pasados / total,
  };
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function CoberturaAdminList() {
  const { year, closedYears, closeYear } = useAcademicYear();
  const { data, loading, error } = useCoverageStats(year);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isClosed = closedYears?.includes(year);

  const [activeGrade, setActiveGrade] = useState(GRADE_ORDER[0]);
  const [drawerBlock, setDrawerBlock] = useState(null);
  const [closingYear, setClosingYear] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [viewMode, setViewMode] = useState('general'); // 'general' | 'basal'
  const [sidebarMode, setSidebarMode] = useState('cursos'); // 'cursos' | 'docentes'
  const [activeTeacherId, setActiveTeacherId] = useState(null);

  // Agrupar por curso
  const grouped = useMemo(() => {
    const map = {};
    for (const g of GRADE_ORDER) map[g] = [];
    for (const block of data) {
      if (map[block.grade]) map[block.grade].push(block);
    }
    for (const g of GRADE_ORDER) {
      map[g].sort((a, b) => SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject));
    }
    return map;
  }, [data]);

  // KPIs del curso activo
  const activeBlocks = useMemo(() => grouped[activeGrade] ?? [], [grouped, activeGrade]);

  // Carga los OAs del currículum para todos los subjects del grado activo (con caché)
  const activeSubjects = useMemo(() => activeBlocks.map(b => b.subject), [activeBlocks]);
  const { oasBySubject } = useCurriculumOasForGrade(year, activeGrade, activeSubjects);

  const statsFn = useMemo(() => (block) => {
    if (viewMode === 'basal') return getBasalOaStats(block);
    return getCurriculumOaStats(block, oasBySubject[block.subject]);
  }, [viewMode, oasBySubject]);

  const gradeStats = useMemo(() => {
    if (!activeBlocks.length) return null;
    const totals = activeBlocks.reduce((acc, b) => {
      const s = statsFn(b);
      acc.pasados    += s.pasados;
      acc.pendientes += s.pendientes;
      acc.total      += s.total;
      return acc;
    }, { pasados: 0, pendientes: 0, total: 0 });
    return {
      ...totals,
      pct: totals.total > 0 ? totals.pasados / totals.total : 0,
    };
  }, [activeBlocks, statsFn]);

  // KPIs globales para el sidebar
  const gradeKpis = useMemo(() =>
    Object.fromEntries(GRADE_ORDER.map(g => {
      const blocks = grouped[g] ?? [];
      if (!blocks.length) return [g, null];
      const pct = blocks.reduce((s, b) => s + statsFn(b).pct, 0) / blocks.length;
      return [g, { pct }];
    }))
  , [grouped, statsFn]);

  const gc = GRADE_COLORS[activeGrade] ?? GRADE_COLORS['1B'];

  // ── Vista Docentes ──────────────────────────────────────────────────────
  const teacherList = useMemo(() => {
    const map = new Map();
    for (const block of data) {
      if (!block.teacherId || !GRADE_ORDER.includes(block.grade)) continue;
      if (!map.has(block.teacherId)) {
        map.set(block.teacherId, { id: block.teacherId, name: block.teacherName ?? '—', blocks: [] });
      }
      map.get(block.teacherId).blocks.push(block);
    }
    return [...map.values()].map(t => {
      const grades = new Set(t.blocks.map(b => b.grade));
      const pct    = t.blocks.reduce((s, b) => s + getOaStats(b).pct, 0) / t.blocks.length;
      return { ...t, gradeCount: grades.size, blockCount: t.blocks.length, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [data]);

  const activeTeacher = useMemo(
    () => teacherList.find(t => t.id === activeTeacherId) ?? null,
    [teacherList, activeTeacherId]
  );

  const activeTeacherBlocks = useMemo(() => {
    if (!activeTeacherId) return [];
    return data
      .filter(b => b.teacherId === activeTeacherId && GRADE_ORDER.includes(b.grade))
      .sort((a, b) => {
        const gi = GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade);
        if (gi !== 0) return gi;
        return SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject);
      });
  }, [data, activeTeacherId]);

  const activeTeacherStats = useMemo(() => {
    if (!activeTeacherBlocks.length) return null;
    const totals = activeTeacherBlocks.reduce((acc, b) => {
      const s = getOaStats(b);
      acc.pasados    += s.pasados;
      acc.pendientes += s.pendientes;
      acc.total      += s.total;
      return acc;
    }, { pasados: 0, pendientes: 0, total: 0 });
    return { ...totals, pct: totals.total > 0 ? totals.pasados / totals.total : 0 };
  }, [activeTeacherBlocks]);

  // Gráfico por asignatura del curso activo
  const activeGradeChartData = useMemo(() =>
    activeBlocks.map(b => ({
      label: SUBJECT_LABELS[b.subject] ?? b.subject,
      pct: statsFn(b).pct,
    })),
    [activeBlocks, statsFn]
  );

  // Gráficos del docente activo
  const teacherBySubjectChart = useMemo(() => {
    const map = {};
    for (const b of activeTeacherBlocks) {
      if (!map[b.subject]) map[b.subject] = { total: 0, count: 0 };
      const s = getOaStats(b);
      map[b.subject].total += s.pct;
      map[b.subject].count++;
    }
    return SUBJECT_ORDER
      .map(s => {
        if (!map[s]) return null;
        return { label: SUBJECT_LABELS[s] ?? s, pct: map[s].total / map[s].count };
      })
      .filter(Boolean);
  }, [activeTeacherBlocks]);

  const teacherByGradeChart = useMemo(() => {
    const map = {};
    for (const b of activeTeacherBlocks) {
      if (!map[b.grade]) map[b.grade] = { total: 0, count: 0 };
      const s = getOaStats(b);
      map[b.grade].total += s.pct;
      map[b.grade].count++;
    }
    return GRADE_ORDER
      .map(g => {
        if (!map[g]) return null;
        return { label: GRADE_LABELS[g] ?? g, pct: map[g].total / map[g].count };
      })
      .filter(Boolean);
  }, [activeTeacherBlocks]);

  // Asignaturas que faltan para el curso activo
  const presentSubjects = useMemo(
    () => new Set(activeBlocks.map(b => b.subject)),
    [activeBlocks]
  );
  const missingSubjects = useMemo(
    () => SUBJECT_ORDER.filter(s => !presentSubjects.has(s)),
    [presentSubjects]
  );

  const createBlock = async (grade, subject) => {
    const gradeNumber = GRADE_ORDER.indexOf(grade) + 1;
    const col = collection(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage');
    await addDoc(col, {
      grade,
      gradeNumber,
      subject,
      subjectLabel: SUBJECT_LABELS[subject] ?? subject,
      teacherId: null,
      teacherName: null,
      legacyOaStatus: {},
      evaluaciones: { sem1: null, sem2: null },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid ?? null,
    });
  };

  const handleCreateBlock = async (subject) => {
    setCreatingSubject(true);
    try {
      await createBlock(activeGrade, subject);
      toast.success(`Asignatura "${SUBJECT_LABELS[subject]}" creada para ${GRADE_LABELS[activeGrade]}`);
    } catch (err) {
      toast.error(`Error al crear: ${err.message}`);
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateAllGrades = async (subject) => {
    setCreatingSubject(true);
    try {
      // Solo crear en cursos donde aún no existe
      const existing = new Set(data.filter(b => b.subject === subject).map(b => b.grade));
      const missing = GRADE_ORDER.filter(g => !existing.has(g));
      await Promise.all(missing.map(g => createBlock(g, subject)));
      toast.success(`"${SUBJECT_LABELS[subject]}" creada en ${missing.length} curso${missing.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(`Error al crear: ${err.message}`);
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCloseYear = async () => {
    setClosingYear(true);
    try {
      await closeYear(year);
      toast.success(`Año ${year} cerrado`);
      setConfirmClose(false);
    } catch (err) {
      toast.error(`No se pudo cerrar el año: ${err.message}`);
    } finally {
      setClosingYear(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header de página ── */}
      <div className="shrink-0 px-8 py-4 border-b border-eyr-outline-variant/10 bg-white flex items-center gap-3">
        <div className="p-2.5 bg-inst-navy/20 rounded-xl shrink-0">
          <BookOpen className="w-6 h-6 text-inst-navy" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-headline font-extrabold tracking-tight text-eyr-on-surface">Cobertura Curricular</h1>
          <p className="text-sm text-eyr-on-variant">Avance de OAs por curso y asignatura — {year}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">

      {/* ── Sidebar de cursos/docentes ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
        {/* Header sidebar */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100 space-y-2">
          {/* Tabs Cursos / Docentes */}
          <div className="flex items-center gap-0.5 bg-eyr-surface-high rounded-xl p-0.5">
            <button
              onClick={() => setSidebarMode('cursos')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                sidebarMode === 'cursos'
                  ? 'bg-inst-navy text-white shadow-sm'
                  : 'text-eyr-on-variant hover:text-eyr-on-surface'
              )}
            >
              <GraduationCap size={12} /> Cursos
            </button>
            <button
              onClick={() => setSidebarMode('docentes')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                sidebarMode === 'docentes'
                  ? 'bg-inst-navy text-white shadow-sm'
                  : 'text-eyr-on-variant hover:text-eyr-on-surface'
              )}
            >
              <Users size={12} /> Docentes
            </button>
          </div>
          <YearSelector />
          {/* Indicador año cerrado */}
          {isClosed && (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-50 rounded-lg px-2 py-1">
              <Lock size={9} /> Año cerrado (solo lectura)
            </div>
          )}
          {/* Botón cerrar año (solo super_admin, año no cerrado) */}
          {isSuperAdmin && !isClosed && !loading && (
            confirmClose ? (
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-rose-600 font-medium flex-1">¿Cerrar {year}?</span>
                <button
                  onClick={handleCloseYear}
                  disabled={closingYear}
                  className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded-md font-semibold transition-colors disabled:opacity-50"
                >
                  {closingYear ? '…' : 'Sí'}
                </button>
                <button
                  onClick={() => setConfirmClose(false)}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md font-semibold transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClose(true)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Lock size={9} /> Cerrar año {year}
              </button>
            )
          )}
        </div>

        {/* Lista de cursos o docentes */}
        <nav className="flex-1 py-2">
          {sidebarMode === 'docentes' ? (
            teacherList.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Sin docentes asignados</p>
            ) : teacherList.map(t => {
              const isActive = t.id === activeTeacherId;
              const initials = t.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTeacherId(t.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-l-[3px]',
                    isActive
                      ? 'bg-inst-navy/10 border-inst-navy'
                      : 'border-transparent hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                    isActive ? 'bg-inst-navy text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold truncate', isActive ? 'text-inst-navy' : 'text-slate-600')}>
                      {t.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-slate-400">{t.blockCount} asig · {t.gradeCount} cursos</span>
                    </div>
                    <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', isActive ? 'bg-inst-navy' : 'bg-slate-300')}
                        style={{ width: `${t.pct * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            GRADE_ORDER.map(g => {
              const kpi = gradeKpis[g];
              const c   = GRADE_COLORS[g] ?? GRADE_COLORS['1B'];
              const isActive = g === activeGrade;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGrade(g)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    isActive
                      ? cn(c.light, c.border, 'border-l-[3px]')
                      : 'border-l-[3px] border-transparent hover:bg-slate-50'
                  )}
                >
                  <span className={cn(
                    'w-9 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    isActive ? cn(c.pill, 'text-white') : 'bg-slate-100 text-slate-500'
                  )}>
                    {GRADE_LABELS[g]}
                  </span>
                  <div className="flex-1 min-w-0">
                    {kpi ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className={cn('text-xs font-semibold', isActive ? c.text : 'text-slate-600')}>
                            {Math.round(kpi.pct * 100)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', isActive ? c.pill : 'bg-slate-300')}
                            style={{ width: `${kpi.pct * 100}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Sin datos</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </nav>
      </aside>

      {/* ── Panel principal ── */}
      <main className="flex-1 overflow-y-auto bg-eyr-surface-low/40">
        {loading ? (
          <SkeletonMain />
        ) : error ? (
          <ErrorMsg msg={error} />
        ) : sidebarMode === 'docentes' ? (
          /* ── Vista Docentes ── */
          !activeTeacher ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Users size={40} className="opacity-30" />
              <p className="text-sm">Selecciona un docente</p>
            </div>
          ) : (
            <>
              {/* Header docente */}
              <div className="px-8 py-6 border-b bg-inst-navy/5 border-inst-navy/10">
                <div className="flex flex-wrap items-center justify-between gap-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-inst-navy flex items-center justify-center text-white text-xl font-black shrink-0">
                      {activeTeacher.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-xl font-headline font-bold text-inst-navy">{activeTeacher.name}</h1>
                      <p className="text-sm text-eyr-on-variant">
                        {activeTeacher.blockCount} asignaturas · {activeTeacher.gradeCount} cursos · {year}
                      </p>
                    </div>
                  </div>
                  {activeTeacherStats && (
                    <div className="flex items-center gap-4">
                      <KpiMini label="OA pasados"    value={activeTeacherStats.pasados}    color="text-inst-navy" />
                      <KpiMini label="OA pendientes" value={activeTeacherStats.pendientes} color="text-amber-600" />
                      <KpiMini label="Logro" value={activeTeacherStats.pct * 100} suffix="%"
                        color={getCoverageLevel(activeTeacherStats.pct) === 'green' ? 'text-emerald-600' : getCoverageLevel(activeTeacherStats.pct) === 'yellow' ? 'text-amber-600' : 'text-rose-600'}
                        highlight
                      />
                    </div>
                  )}
                </div>
              </div>
              {/* Gráficos del docente */}
              {(teacherBySubjectChart.length > 0 || teacherByGradeChart.length > 0) && (
                <div className="px-8 pt-6 pb-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {teacherBySubjectChart.length > 0 && (
                      <div className="bg-white rounded-2xl border border-eyr-outline-variant/10 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <BarChart2 size={15} className="text-inst-navy/50" />
                          <h3 className="text-xs font-semibold text-eyr-on-variant">Por asignatura</h3>
                        </div>
                        <CoverageBarChart data={teacherBySubjectChart} height={150} />
                      </div>
                    )}
                    {teacherByGradeChart.length > 0 && (
                      <div className="bg-white rounded-2xl border border-eyr-outline-variant/10 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <BarChart2 size={15} className="text-inst-navy/50" />
                          <h3 className="text-xs font-semibold text-eyr-on-variant">Por curso</h3>
                        </div>
                        <CoverageBarChart data={teacherByGradeChart} height={150} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid de asignaturas del docente */}
              <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeTeacherBlocks.map(block => (
                    <TeacherBlockCard key={block.id} block={block} onDetail={() => setDrawerBlock(block)} />
                  ))}
                </div>
              </div>
            </>
          )
        ) : (
          <>
            {/* Header del curso */}
            <div className={cn('px-8 py-6 border-b', gc.light, gc.border)}>
              <div className="flex flex-wrap items-center justify-between gap-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn('text-2xl font-bold px-4 py-1.5 rounded-xl text-white shrink-0', gc.pill)}>
                    {GRADE_LABELS[activeGrade]}
                  </span>
                  <div>
                    <h1 className={cn('text-xl font-headline font-bold', gc.text)}>
                      {GRADE_FULL_LABELS[activeGrade]}
                    </h1>
                    <p className="text-sm text-eyr-on-variant">{activeBlocks.length} asignaturas · {year}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Toggle Vista */}
                  <div className="flex items-center bg-eyr-surface-high rounded-xl p-0.5">
                    <button
                      onClick={() => setViewMode('general')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        viewMode === 'general'
                          ? 'bg-inst-navy text-white shadow-sm'
                          : 'text-eyr-on-variant hover:text-eyr-on-surface'
                      )}
                    >
                      Vista General
                    </button>
                    <button
                      onClick={() => setViewMode('basal')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        viewMode === 'basal'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-eyr-on-variant hover:text-eyr-on-surface'
                      )}
                    >
                      Vista Basal
                    </button>
                  </div>

                  {/* KPIs del curso */}
                  {gradeStats && (
                    <div className="flex items-center gap-4">
                      <KpiMini label="OA pasados"    value={gradeStats.pasados}          color="text-inst-navy" />
                      <KpiMini label="OA pendientes" value={gradeStats.pendientes}        color="text-amber-600" />
                      <KpiMini label="Logro"         value={gradeStats.pct * 100} suffix="%"
                        color={getCoverageLevel(gradeStats.pct) === 'green' ? 'text-emerald-600' : getCoverageLevel(gradeStats.pct) === 'yellow' ? 'text-amber-600' : 'text-rose-600'}
                        highlight
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gráfico por asignatura */}
            {activeGradeChartData.length > 0 && (
              <div className="px-8 pt-6 pb-0">
                <div className="bg-white rounded-2xl border border-eyr-outline-variant/10 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 size={15} className="text-inst-navy/50" />
                    <h3 className="text-xs font-semibold text-eyr-on-variant">% logro por asignatura</h3>
                  </div>
                  <CoverageBarChart data={activeGradeChartData} height={160} />
                </div>
              </div>
            )}

            {/* Grid de asignaturas */}
            <div className="px-8 py-6">
              {activeBlocks.length === 0 && missingSubjects.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">
                  No hay datos de cobertura para este curso.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeBlocks.map(block => (
                    <SubjectCard key={block.subject} block={block} viewMode={viewMode} curriculumOas={oasBySubject[block.subject]} onDetail={() => setDrawerBlock(block)} />
                  ))}
                </div>
              )}

              {/* Asignaturas faltantes */}
              {!isClosed && ['super_admin', 'admin', 'utp_head'].includes(user?.role) && missingSubjects.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-eyr-on-variant uppercase tracking-widest mb-3">
                    Asignaturas sin datos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingSubjects.map(s => (
                      <div key={s} className="flex items-center gap-1">
                        <button
                          onClick={() => handleCreateBlock(s)}
                          disabled={creatingSubject}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl border border-dashed border-slate-300 text-slate-500 text-xs font-medium hover:border-inst-navy hover:text-inst-navy hover:bg-inst-navy/5 transition-all disabled:opacity-40"
                          title={`Crear solo para ${GRADE_LABELS[activeGrade]}`}
                        >
                          <Plus size={11} />
                          {SUBJECT_LABELS[s] ?? s}
                        </button>
                        <button
                          onClick={() => handleCreateAllGrades(s)}
                          disabled={creatingSubject}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-r-xl border border-l-0 border-dashed border-slate-300 text-slate-400 text-[10px] font-semibold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-40 whitespace-nowrap"
                          title="Crear en todos los cursos"
                        >
                          8 cursos
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Drawer de detalle OA ── */}
      {drawerBlock && (
        <OADetailDrawer
          key={drawerBlock.id}
          block={drawerBlock}
          year={year}
          onClose={() => setDrawerBlock(null)}
        />
      )}
      </div>
    </div>
  );
}

/* ─── Número animado ─────────────────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = '', className }) {
  const ref  = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const controls = animate(from, value, {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v) + suffix;
      },
    });
    return controls.stop;
  }, [value, suffix]);

  return <span ref={ref} className={className}>{Math.round(value)}{suffix}</span>;
}

/* ─── KPI mini (header) ──────────────────────────────────────────────────── */
function KpiMini({ label, value, suffix = '', color, highlight }) {
  return (
    <div className={cn('text-center', highlight && 'bg-white rounded-xl px-4 py-2 shadow-sm border border-eyr-outline-variant/10')}>
      <AnimatedNumber value={value} suffix={suffix} className={cn('text-2xl font-bold', color)} />
      <p className="text-xs text-eyr-on-variant mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Card de asignatura ─────────────────────────────────────────────────── */
const SUBJECT_GRADIENTS = {
  lenguaje:            'from-violet-500 to-purple-600',
  lengua_y_literatura: 'from-violet-500 to-purple-600',
  matematica:          'from-blue-500 to-indigo-600',
  ciencias:            'from-emerald-500 to-teal-600',
  historia:            'from-amber-500 to-orange-500',
  educacion_fisica:    'from-rose-500 to-red-600',
  musica:              'from-pink-500 to-fuchsia-600',
  artes:               'from-orange-400 to-amber-500',
  tecnologia:          'from-cyan-500 to-sky-600',
};

const GRADE_GRADIENTS = {
  '1B': 'from-violet-500 to-purple-600',
  '2B': 'from-blue-500 to-indigo-600',
  '3B': 'from-cyan-500 to-sky-600',
  '4B': 'from-teal-500 to-emerald-600',
  '5B': 'from-emerald-500 to-green-600',
  '6B': 'from-amber-500 to-orange-500',
  '7B': 'from-orange-500 to-red-500',
  '8B': 'from-rose-500 to-pink-600',
};

function SubjectCard({ block, onDetail, viewMode = 'general', curriculumOas }) {
  const { subject, subjectLabel, teacherName } = block;
  const stats = viewMode === 'basal'
    ? getBasalOaStats(block)
    : getCurriculumOaStats(block, curriculumOas);
  const meta     = SUBJECT_META[subject] ?? { icon: BookOpen, bg: 'bg-slate-100', text: 'text-slate-500', bar: 'bg-slate-400' };
  const gradient = SUBJECT_GRADIENTS[subject] ?? 'from-slate-500 to-slate-600';
  const Icon     = meta.icon;

  const initials = teacherName
    ? teacherName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-white/20 cursor-pointer"
      onClick={onDetail}
    >

      {/* ── Cabecera coloreada ── */}
      <div className={cn('bg-gradient-to-br px-5 pt-5 pb-4', gradient)}>
        <div className="flex items-start justify-between mb-3">
          {/* Ícono + asignatura */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Icon size={19} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight drop-shadow-sm">
                {subjectLabel ?? SUBJECT_LABELS[subject] ?? subject}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{initials}</span>
                </div>
                <span className="text-[11px] text-white/80 truncate max-w-[130px]">
                  {teacherName ?? '—'}
                </span>
              </div>
            </div>
          </div>

          {/* % grande */}
          <div className="text-right">
            <AnimatedNumber value={stats.pct * 100} className="text-3xl font-black text-white leading-none drop-shadow" />
            <p className="text-[11px] text-white/70 font-medium">% logro</p>
          </div>
        </div>

        {/* Barra de progreso blanca */}
        <div className="h-2 bg-white/25 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-700"
            style={{ width: `${stats.pct * 100}%` }}
          />
        </div>
      </div>

      {/* ── Cuerpo blanco ── */}
      <div className="bg-white px-5 py-4">
        {/* Stats OA */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center bg-emerald-50 rounded-xl py-2.5">
            <AnimatedNumber value={stats.pasados} className="text-lg font-black text-emerald-600 leading-none" />
            <p className="text-[10px] text-emerald-600/70 font-semibold mt-1">Pasados</p>
          </div>
          <div className={cn('text-center rounded-xl py-2.5', stats.pendientes > 0 ? 'bg-amber-50' : 'bg-slate-50')}>
            <AnimatedNumber value={stats.pendientes} className={cn('text-lg font-black leading-none', stats.pendientes > 0 ? 'text-amber-500' : 'text-slate-300')} />
            <p className={cn('text-[10px] font-semibold mt-1', stats.pendientes > 0 ? 'text-amber-500/70' : 'text-slate-400')}>
              Pendientes
            </p>
          </div>
          <div className="text-center bg-slate-50 rounded-xl py-2.5">
            <AnimatedNumber value={stats.total} className="text-lg font-black text-slate-500 leading-none" />
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Total OA</p>
          </div>
        </div>

        {/* Footer acciones */}
        <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
          <Link
            to={`/admin/cobertura/${block.id}/edit`}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            title="Editar"
          >
            <Pencil size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Card de bloque por docente ────────────────────────────────────────── */
function TeacherBlockCard({ block, onDetail }) {
  const { subject, subjectLabel, grade } = block;
  const stats    = getOaStats(block);
  const gradient = GRADE_GRADIENTS[grade] ?? 'from-slate-500 to-slate-600';
  const meta     = SUBJECT_META[subject] ?? { icon: BookOpen };
  const Icon     = meta.icon;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-white/20 cursor-pointer"
      onClick={onDetail}
    >
      {/* Cabecera coloreada */}
      <div className={cn('bg-gradient-to-br px-5 pt-4 pb-3', gradient)}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Icon size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white leading-tight drop-shadow-sm">
              {subjectLabel ?? SUBJECT_LABELS[subject] ?? subject}
            </span>
          </div>
          {/* Pill de curso */}
          <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/25 text-white shrink-0')}>
            {GRADE_LABELS[grade]}
          </span>
        </div>
        {/* Barra de progreso */}
        <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-700"
            style={{ width: `${stats.pct * 100}%` }}
          />
        </div>
      </div>
      {/* Cuerpo blanco */}
      <div className="bg-white px-5 py-3.5">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center bg-emerald-50 rounded-xl py-2.5">
            <p className="text-base font-black text-emerald-600 leading-none">{stats.pasados}</p>
            <p className="text-[10px] text-emerald-600/70 font-semibold mt-1">Pasados</p>
          </div>
          <div className={cn('text-center rounded-xl py-2.5', stats.pendientes > 0 ? 'bg-amber-50' : 'bg-slate-50')}>
            <p className={cn('text-base font-black leading-none', stats.pendientes > 0 ? 'text-amber-500' : 'text-slate-300')}>
              {stats.pendientes}
            </p>
            <p className={cn('text-[10px] font-semibold mt-1', stats.pendientes > 0 ? 'text-amber-500/70' : 'text-slate-400')}>
              Pendientes
            </p>
          </div>
          <div className="text-center bg-slate-50 rounded-xl py-2.5">
            <p className="text-base font-black text-slate-500 leading-none">{Math.round(stats.pct * 100)}%</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Logro</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Drawer de detalle OA ──────────────────────────────────────────────── */
/** "AR01 OA 01" → "OA01",  "MA01 OA 15" → "OA15" */
function normOaCode(raw) {
  const m = raw?.match(/OA\s*0*(\d+)/i);
  return m ? `OA${String(parseInt(m[1])).padStart(2, '0')}` : raw;
}

const TEACHER_ROLES = ['teacher', 'utp_head', 'director', 'admin', 'super_admin'];

function OADetailDrawer({ block, year, onClose }) {
  const { user, users } = useAuth();
  const canEdit = ['utp_head', 'admin', 'super_admin'].includes(user?.role);

  const { subject, subjectLabel, grade, legacyOaStatus, id: blockId } = block;
  const [localView, setLocalView] = useState('basal');
  const isBasal = localView === 'basal';

  // ── Docente asignado ───────────────────────────────────────────────────
  const [teacherId,   setTeacherId]   = useState(block.teacherId   ?? '');
  const [teacherName, setTeacherName] = useState(block.teacherName ?? '');
  const [savingTeacher, setSavingTeacher] = useState(false);

  const teachers = useMemo(
    () => (users ?? [])
      .filter(u => TEACHER_ROLES.includes(u.role))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [users]
  );

  const handleTeacherChange = async (e) => {
    const uid = e.target.value;
    const selected = teachers.find(t => t.id === uid);
    const newName = selected?.name ?? '';
    setTeacherId(uid);
    setTeacherName(newName);
    setSavingTeacher(true);
    try {
      await updateDoc(
        doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', blockId),
        { teacherId: uid || null, teacherName: newName || null, updatedAt: serverTimestamp(), updatedBy: user?.uid }
      );
    } catch (err) {
      toast.error(`Error al guardar docente: ${err.message}`);
    } finally {
      setSavingTeacher(false);
    }
  };

  // ── OA Basales ─────────────────────────────────────────────────────────
  const [basalesOas, setBasalesOas] = useState(() => block.basalesOas ?? {});
  const [applyingBasales, setApplyingBasales] = useState(false);

  const basalesMineduc = useMemo(() => getBasalesMineduc(subject, grade), [subject, grade]);

  const toggleBasal = async (normalizedCode) => {
    if (!canEdit) return;
    const next = { ...basalesOas, [normalizedCode]: !basalesOas[normalizedCode] };
    setBasalesOas(next);
    try {
      await updateDoc(
        doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', blockId),
        { basalesOas: next, updatedAt: serverTimestamp(), updatedBy: user?.uid }
      );
    } catch (err) {
      toast.error(`Error al guardar: ${err.message}`);
      setBasalesOas(basalesOas); // revert
    }
  };

  const applyBasalesMineduc = async () => {
    if (basalesMineduc.size === 0) {
      toast.info('Sin basales predefinidos para esta asignatura y curso');
      return;
    }
    const next = Object.fromEntries([...basalesMineduc].map(code => [code, true]));
    const prev = basalesOas;
    setBasalesOas(next);
    setApplyingBasales(true);
    try {
      await updateDoc(
        doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', blockId),
        { basalesOas: next, updatedAt: serverTimestamp(), updatedBy: user?.uid }
      );
      toast.success(`${basalesMineduc.size} OA basales MINEDUC aplicados`);
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      setBasalesOas(prev);
    } finally {
      setApplyingBasales(false);
    }
  };

  // Auto-aplicar basales MINEDUC al cambiar a Vista Basal si el bloque no tiene ninguno
  const autoAppliedRef = useRef(false);
  useEffect(() => {
    if (!isBasal || autoAppliedRef.current) return;
    const hasAnyBasal = Object.values(basalesOas).some(v => v === true);
    if (hasAnyBasal || basalesMineduc.size === 0) return;
    autoAppliedRef.current = true;
    const next = Object.fromEntries([...basalesMineduc].map(code => [code, true]));
    setBasalesOas(next);
    if (!canEdit) return;
    updateDoc(
      doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', blockId),
      { basalesOas: next, updatedAt: serverTimestamp(), updatedBy: user?.uid }
    ).catch(() => {});
  }, [isBasal]); // eslint-disable-line react-hooks/exhaustive-deps

  const { oas, loading } = useCurriculumOas(year, grade, subject);
  const meta = SUBJECT_META[subject] ?? { icon: BookOpen, bg: 'bg-slate-100', text: 'text-slate-500' };
  const Icon = meta.icon;

  // Cerrar con Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Set local editable de OA pasados (inicializado desde el bloque)
  const [pasadoSet, setPasadoSet] = useState(() => {
    const set = new Set();
    for (const [code, val] of Object.entries(legacyOaStatus ?? {})) {
      if (val === true) set.add(code);
    }
    return set;
  });

  // Auto-guardado con debounce
  const { status: saveStatus, schedule } = useAutoSave(async (data) => {
    const ref = doc(db, 'schools', SCHOOL_ID, 'academicYears', String(year), 'coverage', blockId);
    await updateDoc(ref, data);
  }, 600);

  // Construye el payload de Firestore a partir de un nuevo Set
  const buildPayload = (nextSet) => {
    const newStatus = { ...(legacyOaStatus ?? {}) };
    for (const code of Object.keys(newStatus)) newStatus[code] = nextSet.has(code);
    for (const code of nextSet) newStatus[code] = true;
    return { legacyOaStatus: newStatus };
  };

  // Toggle de un OA individual
  const toggleOa = (normalizedCode) => {
    if (!canEdit) return;
    const next = new Set(pasadoSet);
    if (next.has(normalizedCode)) next.delete(normalizedCode);
    else next.add(normalizedCode);
    setPasadoSet(next);
    schedule(buildPayload(next));
  };

  // Lista de OAs a mostrar
  const displayOas = useMemo(() => {
    if (oas.length) return oas;
    const codes = new Set(Object.keys(legacyOaStatus ?? {}));
    return [...codes].sort().map(c => ({ codigo: c, descripcion: '', eje: '' }));
  }, [oas, legacyOaStatus]);

  // Stats derivados del set editable (actualizan en tiempo real)
  const basalOaList  = isBasal
    ? displayOas.filter(o => basalesOas[normOaCode(o.codigo)])
    : displayOas;
  const pasadosN    = basalOaList.filter(o => pasadoSet.has(normOaCode(o.codigo))).length;
  const pendientesN = basalOaList.length - pasadosN;
  const pct         = basalOaList.length > 0 ? Math.round((pasadosN / basalOaList.length) * 100) : 0;
  const gradient    = SUBJECT_GRADIENTS[subject] ?? 'from-slate-500 to-slate-600';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal centrado */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">

          {/* ── Header ── */}
          <div className={cn('bg-gradient-to-br px-7 py-5 shrink-0', gradient)}>
            <div className="flex items-start gap-6">

              {/* Izquierda: icono + asignatura + grado + docente */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-xl leading-tight drop-shadow-sm truncate">
                    {subjectLabel ?? SUBJECT_LABELS[subject] ?? subject}
                  </p>
                  <p className="text-white/70 text-sm mt-0.5">{GRADE_FULL_LABELS[grade] ?? grade}</p>
                  {canEdit ? (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <select value={teacherId} onChange={handleTeacherChange} disabled={savingTeacher}
                        className="text-xs bg-white/20 text-white border border-white/30 rounded-lg px-2 py-1 outline-none focus:border-white/60 disabled:opacity-50 max-w-[220px]">
                        <option value="" className="text-slate-800 bg-white">— Sin docente —</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id} className="text-slate-800 bg-white">{t.name}</option>
                        ))}
                      </select>
                      {savingTeacher && <Loader2 size={12} className="text-white/70 animate-spin" />}
                    </div>
                  ) : (
                    teacherName && <p className="text-white/70 text-sm mt-1">{teacherName}</p>
                  )}
                </div>
              </div>

              {/* Derecha: stats + toggle + cerrar */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                {/* Controles superiores */}
                <div className="flex items-center gap-3">
                  {canEdit && saveStatus !== 'idle' && (
                    <span className={cn('text-xs font-medium flex items-center gap-1',
                      saveStatus === 'saving' ? 'text-white/60' :
                      saveStatus === 'saved'  ? 'text-white/80' : 'text-rose-200')}>
                      {saveStatus === 'saving' && <Loader2 size={10} className="animate-spin" />}
                      {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'saved' ? '✓ Guardado' : 'Error'}
                    </span>
                  )}
                  {/* Toggle Basales / General */}
                  <div className="flex items-center bg-white/20 rounded-xl p-0.5">
                    <button onClick={() => setLocalView('basal')}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        localView === 'basal' ? 'bg-white text-amber-600 shadow-sm' : 'text-white/80 hover:text-white')}>
                      Basales
                    </button>
                    <button onClick={() => setLocalView('general')}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        localView === 'general' ? 'bg-white text-slate-700 shadow-sm' : 'text-white/80 hover:text-white')}>
                      General
                    </button>
                  </div>
                  <button onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                    <X size={15} />
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-end gap-6">
                  <div className="text-right">
                    <p className="text-4xl font-black text-white leading-none drop-shadow">
                      {pct}<span className="text-xl font-bold text-white/70 ml-0.5">%</span>
                    </p>
                    <p className="text-white/60 text-xs mt-1">{isBasal ? 'logro OA basales' : 'logro curricular'}</p>
                  </div>
                  <div className="flex gap-5 pb-0.5">
                    <div className="text-right">
                      <p className="text-2xl font-black text-white leading-none">{pasadosN}</p>
                      <p className="text-white/60 text-[11px] mt-0.5">pasados</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-2xl font-black leading-none', pendientesN > 0 ? 'text-white' : 'text-white/30')}>
                        {pendientesN}
                      </p>
                      <p className="text-white/60 text-[11px] mt-0.5">pendientes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white/60 leading-none">{basalOaList.length}</p>
                      <p className="text-white/60 text-[11px] mt-0.5">total OA</p>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-72 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>

            </div>
          </div>

          {/* ── Lista de OAs (flat, 2 columnas) ── */}
          <div className="flex-1 overflow-y-auto bg-eyr-surface-low/40">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Cargando OAs…
              </div>
            ) : displayOas.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                No se encontraron OAs para esta asignatura.
              </div>
            ) : isBasal && basalOaList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-2">
                <p className="text-sm text-slate-500 font-semibold">Sin OA basales configurados</p>
                <p className="text-xs text-slate-400">
                  Cambia a <span className="font-semibold">General</span> para marcar OA como basales (★)
                </p>
              </div>
            ) : (
              <div className="p-6">
                {/* Botón aplicar MINEDUC (solo vista general) */}
                {canEdit && !isBasal && basalesMineduc.size > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-5">
                    <p className="text-xs text-amber-700 flex-1 mr-3">
                      Marcá OA como basales (★) o aplicá el criterio MINEDUC ({basalesMineduc.size} OA)
                    </p>
                    <button onClick={applyBasalesMineduc} disabled={applyingBasales}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50">
                      {applyingBasales ? '…' : 'Aplicar'}
                    </button>
                  </div>
                )}

                {/* Grid 2 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {basalOaList.map((oa) => {
                    const normalizedCode = normOaCode(oa.codigo);
                    const pasado  = pasadoSet.has(normalizedCode);
                    const esBasal = !!basalesOas[normalizedCode];
                    return (
                      <div
                        key={oa.codigo}
                        onClick={() => toggleOa(normalizedCode)}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all',
                          pasado ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100',
                          canEdit && 'cursor-pointer hover:border-slate-200 active:bg-slate-50'
                        )}
                      >
                        {/* Checkbox */}
                        {canEdit ? (
                          <div className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                            pasado ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'bg-white border-slate-300'
                          )}>
                            {pasado && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                        ) : (
                          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            pasado ? 'bg-emerald-100' : 'bg-slate-100')}>
                            {pasado
                              ? <CheckCircle2 size={11} className="text-emerald-600" />
                              : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                          </div>
                        )}

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className={cn('text-xs font-bold', pasado ? 'text-emerald-700' : 'text-slate-600')}>
                              {normalizedCode}
                            </span>
                            {oa.eje && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-eyr-surface-high text-eyr-on-variant font-medium">
                                {oa.eje}
                              </span>
                            )}
                            {esBasal && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                                BASAL
                              </span>
                            )}
                          </div>
                          {oa.descripcion && (
                            <p className={cn('text-[11px] leading-relaxed', pasado ? 'text-slate-600' : 'text-slate-400')}>
                              {oa.descripcion}
                            </p>
                          )}
                        </div>

                        {/* Star toggle basal (solo vista general) */}
                        {canEdit && !isBasal && (
                          <button
                            onClick={e => { e.stopPropagation(); toggleBasal(normalizedCode); }}
                            className={cn(
                              'shrink-0 text-sm px-2 py-1 rounded-lg border transition-all mt-0.5',
                              esBasal
                                ? 'bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200'
                                : 'bg-slate-50 border-slate-200 text-slate-300 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-500'
                            )}
                            title={esBasal ? 'Quitar de basales' : 'Marcar como basal'}
                          >
                            {esBasal ? '★' : '☆'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function SkeletonMain() {
  return (
    <div className="px-8 py-6 space-y-6">
      <div className="h-20 bg-white rounded-2xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ─── Error ──────────────────────────────────────────────────────────────── */
function ErrorMsg({ msg }) {
  return (
    <div className="m-8 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
      Error al cargar datos: {msg}
    </div>
  );
}

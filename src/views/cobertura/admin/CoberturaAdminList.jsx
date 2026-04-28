import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil, GitMerge, CheckCircle2, Clock, AlertTriangle,
  BookOpen, Hash, FlaskConical, Landmark,
  Dumbbell, Music, Palette, Cpu, X, ChevronRight, ChevronDown, Loader2,
  ArrowRight, Lock
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';
import { useCoverageStats } from '../../../hooks/useCoverage';
import { useCurriculumOas } from '../../../hooks/useCurriculumOas';
import { useAutoSave } from '../../../hooks/useAutoSave';
import YearSelector from '../../../components/coverage/YearSelector';
import {
  GRADE_ORDER, SUBJECT_ORDER, GRADE_LABELS, GRADE_FULL_LABELS, SUBJECT_LABELS, SCHOOL_ID
} from '../../../lib/coverageConstants';
import { getCoverageLevel, LEVEL_CLASSES } from '../../../lib/coverageMath';
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
function getOaStats(block) {
  const total = block.excelTotalBasales ?? 0;
  let pasados = 0;

  if (block.migrationStatus === 'complete') {
    const seen = new Set();
    for (const unit of ['u1', 'u2', 'u3', 'u4']) {
      for (const [code, val] of Object.entries(block.unitTracking?.[unit] ?? {})) {
        if (val === true) seen.add(code);
      }
    }
    pasados = seen.size;
  } else {
    pasados = Object.values(block.legacyOaStatus ?? {}).filter(v => v === true).length;
  }

  return {
    pasados,
    pendientes: Math.max(0, total - pasados),
    total,
    pct: total > 0 ? pasados / total : 0,
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
  const gradeStats = useMemo(() => {
    if (!activeBlocks.length) return null;
    const totals = activeBlocks.reduce((acc, b) => {
      const s = getOaStats(b);
      acc.pasados    += s.pasados;
      acc.pendientes += s.pendientes;
      acc.total      += s.total;
      return acc;
    }, { pasados: 0, pendientes: 0, total: 0 });
    return {
      ...totals,
      pct: totals.total > 0 ? totals.pasados / totals.total : 0,
      completeN: activeBlocks.filter(b => b.migrationStatus === 'complete').length,
    };
  }, [activeBlocks]);

  // KPIs globales para el sidebar
  const gradeKpis = useMemo(() =>
    Object.fromEntries(GRADE_ORDER.map(g => {
      const blocks = grouped[g] ?? [];
      if (!blocks.length) return [g, null];
      const pct = blocks.reduce((s, b) => s + getOaStats(b).pct, 0) / blocks.length;
      const pending = blocks.filter(b => b.migrationStatus !== 'complete').length;
      return [g, { pct, pending }];
    }))
  , [grouped]);

  const gc = GRADE_COLORS[activeGrade] ?? GRADE_COLORS['1B'];

  // Bloques pendientes en todo el año (global)
  const pendingMigration = useMemo(
    () => data.filter(b => b.migrationStatus !== 'complete'),
    [data]
  );

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
    <div className="flex flex-1 overflow-hidden relative">

      {/* ── Sidebar de cursos ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
        {/* Header sidebar */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cursos</p>
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

        {/* Lista de cursos */}
        <nav className="flex-1 py-2">
          {GRADE_ORDER.map(g => {
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
                        {kpi.pending > 0 && (
                          <span className="text-[10px] text-amber-600 font-medium">{kpi.pending} pend.</span>
                        )}
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
          })}
        </nav>
      </aside>

      {/* ── Panel principal ── */}
      <main className="flex-1 overflow-y-auto bg-slate-50/60">
        {loading ? (
          <SkeletonMain />
        ) : error ? (
          <ErrorMsg msg={error} />
        ) : (
          <>
            {/* Banner de migración pendiente */}
            {pendingMigration.length > 0 && (
              <div className="mx-8 mt-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                <p className="text-sm text-amber-800 flex-1">
                  <span className="font-semibold">{pendingMigration.length} bloque{pendingMigration.length > 1 ? 's' : ''}</span>{' '}
                  {pendingMigration.length > 1 ? 'pendientes' : 'pendiente'} de migración a unidades.
                </p>
                <Link
                  to={`/admin/cobertura/migrar/${pendingMigration[0].id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0 transition-colors"
                >
                  Migrar ahora <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {/* Header del curso */}
            <div className={cn('px-8 py-6 border-b', gc.light, gc.border)}>
              <div className="flex flex-wrap items-center justify-between gap-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn('text-2xl font-bold px-4 py-1.5 rounded-xl text-white shrink-0', gc.pill)}>
                    {GRADE_LABELS[activeGrade]}
                  </span>
                  <div>
                    <h1 className={cn('text-xl font-bold', gc.text)}>
                      {GRADE_FULL_LABELS[activeGrade]}
                    </h1>
                    <p className="text-sm text-slate-400">{activeBlocks.length} asignaturas · {year}</p>
                  </div>
                </div>

                {/* KPIs del curso */}
                {gradeStats && (
                  <div className="flex items-center gap-4 shrink-0">
                    <KpiMini label="OA pasados"   value={gradeStats.pasados}    color={gc.text} />
                    <KpiMini label="OA pendientes" value={gradeStats.pendientes} color="text-amber-600" />
                    <KpiMini label="Logro"
                      value={`${Math.round(gradeStats.pct * 100)}%`}
                      color={getCoverageLevel(gradeStats.pct) === 'green' ? 'text-emerald-600' : getCoverageLevel(gradeStats.pct) === 'yellow' ? 'text-amber-600' : 'text-rose-600'}
                      highlight
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Grid de asignaturas */}
            <div className="px-8 py-6">
              {activeBlocks.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">
                  No hay datos de cobertura para este curso.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeBlocks.map(block => (
                    <SubjectCard key={block.id} block={block} onDetail={() => setDrawerBlock(block)} />
                  ))}
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
  );
}

/* ─── KPI mini (header) ──────────────────────────────────────────────────── */
function KpiMini({ label, value, color, highlight }) {
  return (
    <div className={cn('text-center', highlight && 'bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-100')}>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
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

function SubjectCard({ block, onDetail }) {
  const { subject, subjectLabel, teacherName, migrationStatus } = block;
  const stats    = getOaStats(block);
  const meta     = SUBJECT_META[subject] ?? { icon: BookOpen, bg: 'bg-slate-100', text: 'text-slate-500', bar: 'bg-slate-400' };
  const gradient = SUBJECT_GRADIENTS[subject] ?? 'from-slate-500 to-slate-600';
  const Icon     = meta.icon;

  const isComplete = migrationStatus === 'complete';
  const isPartial  = migrationStatus === 'partial';

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
            <p className="text-3xl font-black text-white leading-none drop-shadow">
              {Math.round(stats.pct * 100)}
            </p>
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
            <p className="text-lg font-black text-emerald-600 leading-none">{stats.pasados}</p>
            <p className="text-[10px] text-emerald-600/70 font-semibold mt-1">Pasados</p>
          </div>
          <div className={cn('text-center rounded-xl py-2.5', stats.pendientes > 0 ? 'bg-amber-50' : 'bg-slate-50')}>
            <p className={cn('text-lg font-black leading-none', stats.pendientes > 0 ? 'text-amber-500' : 'text-slate-300')}>
              {stats.pendientes}
            </p>
            <p className={cn('text-[10px] font-semibold mt-1', stats.pendientes > 0 ? 'text-amber-500/70' : 'text-slate-400')}>
              Pendientes
            </p>
          </div>
          <div className="text-center bg-slate-50 rounded-xl py-2.5">
            <p className="text-lg font-black text-slate-500 leading-none">{stats.total}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Total OA</p>
          </div>
        </div>

        {/* Footer acciones */}
        <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {/* Badge estado */}
            {isComplete ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                <CheckCircle2 size={9} /> Listo
              </span>
            ) : isPartial ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                <Clock size={9} /> Parcial
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                <AlertTriangle size={9} /> Migrar
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link
              to={`/admin/cobertura/${block.id}/edit`}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              title="Editar unidades"
            >
              <Pencil size={13} />
            </Link>
            {!isComplete && (
              <Link
                to={`/admin/cobertura/migrar/${block.id}`}
                className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-600 transition-colors"
                title="Migrar OAs"
              >
                <GitMerge size={13} />
              </Link>
            )}
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

const UNIT_BADGE = {
  u1: 'bg-violet-100 text-violet-700',
  u2: 'bg-blue-100 text-blue-700',
  u3: 'bg-emerald-100 text-emerald-700',
  u4: 'bg-amber-100 text-amber-700',
};
const UNIT_LABEL = { u1: 'U1', u2: 'U2', u3: 'U3', u4: 'U4' };

function OADetailDrawer({ block, year, onClose }) {
  const { user } = useAuth();
  const canEdit = ['utp_head', 'admin', 'super_admin'].includes(user?.role);

  const { subject, subjectLabel, grade, migrationStatus, unitTracking, legacyOaStatus, id: blockId } = block;
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
    if (migrationStatus === 'complete') {
      for (const unit of ['u1', 'u2', 'u3', 'u4']) {
        for (const [code, val] of Object.entries(unitTracking?.[unit] ?? {})) {
          if (val === true) set.add(code);
        }
      }
    } else {
      for (const [code, val] of Object.entries(legacyOaStatus ?? {})) {
        if (val === true) set.add(code);
      }
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
    if (migrationStatus === 'complete') {
      const newTracking = {};
      for (const unit of ['u1', 'u2', 'u3', 'u4']) {
        newTracking[unit] = { ...(unitTracking?.[unit] ?? {}) };
      }
      // Aplicar diferencias
      for (const [unit, codes] of Object.entries(newTracking)) {
        for (const code of Object.keys(codes)) {
          if (!nextSet.has(code)) delete newTracking[unit][code];
        }
      }
      for (const code of nextSet) {
        const inUnit = ['u1', 'u2', 'u3', 'u4'].find(u => code in newTracking[u]);
        if (!inUnit) newTracking.u1[code] = true;
        else newTracking[inUnit][code] = true;
      }
      return { unitTracking: newTracking };
    } else {
      const newStatus = { ...(legacyOaStatus ?? {}) };
      for (const code of Object.keys(newStatus)) newStatus[code] = nextSet.has(code);
      for (const code of nextSet) newStatus[code] = true;
      return { legacyOaStatus: newStatus };
    }
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

  // Toggle de todos los OAs de un eje
  const toggleEje = (ejeOas) => {
    if (!canEdit) return;
    const codes = ejeOas.map(oa => normOaCode(oa.codigo));
    const allPasado = codes.every(c => pasadoSet.has(c));
    const next = new Set(pasadoSet);
    if (allPasado) codes.forEach(c => next.delete(c));
    else codes.forEach(c => next.add(c));
    setPasadoSet(next);
    schedule(buildPayload(next));
  };

  // Ejes colapsados (set de nombres de eje)
  const [collapsedEjes, setCollapsedEjes] = useState(new Set());
  const toggleCollapseEje = (eje) =>
    setCollapsedEjes(prev => {
      const next = new Set(prev);
      next.has(eje) ? next.delete(eje) : next.add(eje);
      return next;
    });

  // Mapa unidad por código (solo complete)
  const unitMap = useMemo(() => {
    const map = {};
    if (migrationStatus === 'complete') {
      for (const unit of ['u1', 'u2', 'u3', 'u4']) {
        for (const code of Object.keys(unitTracking?.[unit] ?? {})) {
          if (!(code in map)) map[code] = unit;
        }
      }
    }
    return map;
  }, [migrationStatus, unitTracking]);

  // Lista de OAs a mostrar
  const displayOas = useMemo(() => {
    if (oas.length) return oas;
    const codes = new Set([
      ...Object.keys(unitMap),
      ...Object.keys(legacyOaStatus ?? {}),
    ]);
    return [...codes].sort().map(c => ({ codigo: c, descripcion: '', eje: '' }));
  }, [oas, unitMap, legacyOaStatus]);

  // Agrupar por eje
  const byEje = useMemo(() => {
    const map = {};
    for (const oa of displayOas) {
      const eje = oa.eje || 'Sin eje';
      if (!map[eje]) map[eje] = [];
      map[eje].push(oa);
    }
    return map;
  }, [displayOas]);

  // Stats derivados del set editable (actualizan en tiempo real)
  const pasadosN   = displayOas.filter(o => pasadoSet.has(normOaCode(o.codigo))).length;
  const pendientesN = displayOas.length - pasadosN;
  const pct         = displayOas.length > 0 ? Math.round((pasadosN / displayOas.length) * 100) : 0;
  const gradient    = SUBJECT_GRADIENTS[subject] ?? 'from-slate-500 to-slate-600';

  return (
    <>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] z-20" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-[440px] bg-white shadow-2xl z-30 flex flex-col">

        {/* ── Header degradado ── */}
        <div className={cn('bg-gradient-to-br px-6 pt-5 pb-6 shrink-0', gradient)}>

          {/* Fila superior: icono + nombre + cerrar */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Icon size={19} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-[15px] leading-tight drop-shadow-sm">
                  {subjectLabel ?? SUBJECT_LABELS[subject] ?? subject}
                </p>
                <p className="text-white/70 text-xs mt-0.5">{GRADE_FULL_LABELS[grade] ?? grade}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && saveStatus !== 'idle' && (
                <span className={cn(
                  'text-[11px] font-medium flex items-center gap-1',
                  saveStatus === 'saving' ? 'text-white/60' :
                  saveStatus === 'saved'  ? 'text-white/80' : 'text-rose-200'
                )}>
                  {saveStatus === 'saving' && <Loader2 size={10} className="animate-spin" />}
                  {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'saved' ? '✓ Guardado' : 'Error'}
                </span>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* % grande + contadores */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-5xl font-black text-white leading-none drop-shadow">
                {pct}<span className="text-2xl font-bold text-white/70 ml-1">%</span>
              </p>
              <p className="text-white/60 text-xs font-medium mt-1.5 tracking-wide">logro curricular</p>
            </div>
            <div className="flex gap-5 pb-1">
              <div className="text-right">
                <p className="text-2xl font-black text-white leading-none">{pasadosN}</p>
                <p className="text-white/60 text-[11px] mt-0.5">pasados</p>
              </div>
              <div className="text-right">
                <p className={cn('text-2xl font-black leading-none', pendientesN > 0 ? 'text-white/80' : 'text-white/30')}>
                  {pendientesN}
                </p>
                <p className="text-white/60 text-[11px] mt-0.5">pendientes</p>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ── Lista de OAs ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50/60">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Cargando OAs…
            </div>
          ) : displayOas.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm px-6">
              No se encontraron OAs para esta asignatura.
            </div>
          ) : (
            <div className="px-4 pb-6 pt-3 space-y-3">
              {Object.entries(byEje).map(([eje, oaList]) => {
                const ejeCodes     = oaList.map(oa => normOaCode(oa.codigo));
                const checkedCount = ejeCodes.filter(c => pasadoSet.has(c)).length;
                const allChecked   = checkedCount === ejeCodes.length;
                const someChecked  = checkedCount > 0 && !allChecked;
                const isCollapsed  = collapsedEjes.has(eje);
                return (
                  <div key={eje}>
                    {/* Header de eje — clic colapsa/expande */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1.5 select-none bg-white border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
                      onClick={() => toggleCollapseEje(eje)}
                    >
                      {/* Chevron de colapso */}
                      <span className="text-slate-300 shrink-0 transition-transform duration-200"
                        style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={14} />
                      </span>

                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex-1 truncate">
                        {eje === 'Sin eje' ? 'Objetivos de Aprendizaje' : eje}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                        {checkedCount}/{ejeCodes.length}
                      </span>

                      {/* Checkbox toggle-all — clic independiente del colapso */}
                      {canEdit && (
                        <div
                          onClick={e => { e.stopPropagation(); toggleEje(oaList); }}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                            allChecked  ? 'bg-emerald-500 border-emerald-500 shadow-sm' :
                            someChecked ? 'border-emerald-400 bg-emerald-50' :
                                          'border-slate-200 bg-white hover:border-emerald-300'
                          )}
                        >
                          {allChecked  && <CheckCircle2 size={10} className="text-white" />}
                          {someChecked && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                        </div>
                      )}
                    </div>

                    {/* Tarjeta de OAs — oculta si colapsado */}
                    {!isCollapsed && (
                    <div className="rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm">
                      {oaList.map((oa, idx) => {
                        const normalizedCode = normOaCode(oa.codigo);
                        const pasado = pasadoSet.has(normalizedCode);
                        const unit   = unitMap[normalizedCode] ?? null;
                        return (
                          <div
                            key={oa.codigo}
                            onClick={() => toggleOa(normalizedCode)}
                            className={cn(
                              'flex items-start gap-3 px-4 py-3 transition-all',
                              idx > 0 && 'border-t border-slate-50',
                              pasado ? 'bg-emerald-50/50' : 'bg-white',
                              canEdit && 'cursor-pointer hover:bg-slate-50 active:bg-slate-100'
                            )}
                          >
                            {/* Indicador */}
                            {canEdit ? (
                              <div className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                                pasado ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'bg-white border-slate-200'
                              )}>
                                {pasado && <CheckCircle2 size={10} className="text-white" />}
                              </div>
                            ) : (
                              <div className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                pasado ? 'bg-emerald-100' : 'bg-slate-100'
                              )}>
                                {pasado
                                  ? <CheckCircle2 size={11} className="text-emerald-600" />
                                  : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                }
                              </div>
                            )}

                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  'text-xs font-bold',
                                  pasado ? 'text-emerald-700' : 'text-slate-500'
                                )}>
                                  {normalizedCode}
                                </span>
                                {unit && (
                                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', UNIT_BADGE[unit])}>
                                    {UNIT_LABEL[unit]}
                                  </span>
                                )}
                              </div>
                              {oa.descripcion && (
                                <p className={cn(
                                  'text-[11px] mt-0.5 leading-relaxed',
                                  pasado ? 'text-slate-600' : 'text-slate-400'
                                )}>
                                  {oa.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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

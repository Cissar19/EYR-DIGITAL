import React, { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, BarChart2, LayoutGrid, AlertTriangle } from 'lucide-react';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { getOAsForCursoAsignatura, ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';

const TARGET = 65; // Meta de cobertura %

function formatRelativeDate(iso) {
    if (!iso) return 'Sin actualizar';
    const days = Math.floor((Date.now() - new Date(iso)) / 86_400_000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `hace ${days} días`;
    if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
    return `hace ${Math.floor(days / 30)} meses`;
}

function RingProgress({ pct, size = 88 }) {
    const r = 30;
    const circ = 2 * Math.PI * r;
    const dash = Math.min(pct / 100, 1) * circ;
    return (
        <svg width={size} height={size} viewBox="0 0 80 80" className="absolute right-4 top-1/2 -translate-y-1/2 z-10" style={{ pointerEvents: 'none' }}>
            <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="7" />
            <circle cx="40" cy="40" r={r} fill="none" stroke="white" strokeWidth="7"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray .7s ease' }}
            />
            <text x="40" y="40" dominantBaseline="middle" textAnchor="middle"
                fill="white" fontSize="13" fontWeight="800" fontFamily="inherit">
                {pct}%
            </text>
        </svg>
    );
}

const SUBJ_CONFIG = {
    MA: { c1: '#7c5bd8', c2: '#a08be8', glyph: 'π',   short: 'Matemática'    },
    LE: { c1: '#4f7dd8', c2: '#7aa3e8', glyph: 'Aa',  short: 'Lenguaje'      },
    CN: { c1: '#2bae7e', c2: '#52c49a', glyph: '✿',   short: 'Cs. Naturales' },
    HI: { c1: '#e8853c', c2: '#f0a468', glyph: 'H',   short: 'Historia'      },
    IN: { c1: '#6b7585', c2: '#9aa0ac', glyph: 'En',  short: 'Inglés'        },
    EF: { c1: '#e44d5c', c2: '#f07a85', glyph: '✮',   short: 'Ed. Física'    },
    AV: { c1: '#f0a742', c2: '#f8c468', glyph: '✦',   short: 'Artes'         },
    MU: { c1: '#c95fb8', c2: '#dc8cd0', glyph: '♪',   short: 'Música'        },
    TE: { c1: '#2bb0cb', c2: '#58c8df', glyph: '{}',  short: 'Tecnología'    },
    OR: { c1: '#1f9d4f', c2: '#52b87a', glyph: 'Or',  short: 'Orientación'   },
    RE: { c1: '#d4a853', c2: '#e8c47a', glyph: '✝',   short: 'Relig. Ev.'    },
    RC: { c1: '#c47a3d', c2: '#d9a068', glyph: '†',   short: 'Relig. Cat.'   },
};
const DEFAULT_CFG = { c1: '#64748b', c2: '#94a3b8', glyph: '?', short: '—' };

const STATUS_CFG = {
    ontrack: { label: 'Al día',     bg: '#d6f1de', color: '#1f9d4f' },
    atrisk:  { label: 'En riesgo',  bg: '#fbe7b4', color: '#d68c0e' },
    behind:  { label: 'Atrasado',   bg: '#fbd5d0', color: '#d63c2e' },
    paused:  { label: 'Sin inicio', bg: '#ebeaf2', color: '#8b89a8' },
};

function getStatus(pct) {
    if (pct === 0)     return 'paused';
    if (pct >= TARGET) return 'ontrack';
    if (pct >= 50)     return 'atrisk';
    return 'behind';
}

function useSubjectStats(evaluaciones, curso) {
    return useMemo(() =>
        ASIGNATURAS.map(asig => {
            const cfg    = SUBJ_CONFIG[asig.code] ?? DEFAULT_CFG;
            const allOAs = getOAsForCursoAsignatura(asig.code, curso);
            const covered = new Set();
            const pending = new Set();
            const relevant = evaluaciones.filter(e => e.asignatura === asig.code && e.curso === curso);
            relevant.forEach(e => {
                    const approved = e.status === 'approved';
                    (e.questions || []).forEach(q => {
                        if (!q.oaCode) return;
                        if (approved) covered.add(q.oaCode);
                        else          pending.add(q.oaCode);
                    });
                });
            const onlyPend   = [...pending].filter(c => !covered.has(c)).length;
            const pct        = allOAs.length > 0 ? Math.round(covered.size / allOAs.length * 100) : 0;
            const lastEval   = relevant.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            const lastUpdated = lastEval?.createdAt ?? null;
            return {
                code: asig.code, name: asig.name, cfg,
                total: allOAs.length, covered: covered.size,
                onlyPend, noEval: allOAs.length - covered.size - onlyPend,
                pct, status: getStatus(pct), lastUpdated,
            };
        }),
    [evaluaciones, curso]);
}

// ─── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ stat, onClick }) {
    const { cfg, pct, status } = stat;
    const sc = STATUS_CFG[status];
    return (
        <div
            onClick={onClick}
            className="rounded-2xl overflow-hidden flex flex-col border border-[#f0e3c8] shadow-sm cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        >
            {/* Gradient top zone */}
            <div className="relative p-5 overflow-hidden" style={{ background: `linear-gradient(135deg, ${cfg.c1} 0%, ${cfg.c2} 100%)`, minHeight: 196 }}>
                <div style={{ position: 'absolute', right: -50, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.14)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: -30, top: -50, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.10)', pointerEvents: 'none' }} />

                {/* Icon + name + status */}
                <div className="flex items-start gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0 text-white select-none"
                        style={{ background: 'rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.35)', boxShadow: '0 6px 14px -6px rgba(0,0,0,.25)', transform: 'rotate(-4deg)' }}>
                        {cfg.glyph}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-extrabold leading-tight text-white tracking-tight">{cfg.short}</p>
                        <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.30)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-white">{sc.label}</span>
                        </div>
                    </div>
                </div>

                {/* Big percent + OA count */}
                <div className="flex items-end justify-between mt-4 relative z-10">
                    <span className="font-black tabular-nums text-white" style={{ fontSize: 52, letterSpacing: '-0.04em', textShadow: '0 2px 12px rgba(0,0,0,.12)', lineHeight: 0.9 }}>
                        {pct}<span style={{ fontSize: 24, fontWeight: 700, opacity: 0.85, marginLeft: 2 }}>%</span>
                    </span>
                    <div className="text-right text-[11.5px] leading-snug font-medium" style={{ color: 'rgba(255,255,255,.95)' }}>
                        <strong className="block text-base font-extrabold">{stat.covered}/{stat.total}</strong>
                        OAs cubiertos
                    </div>
                </div>

                {/* Progress bar with target */}
                <div className="relative mt-3.5 h-1.5 rounded-full z-10 overflow-visible" style={{ background: 'rgba(255,255,255,.22)' }}>
                    <div className="absolute left-0 top-0 bottom-0 rounded-full bg-white" style={{ width: `${pct}%`, boxShadow: '0 0 0 2px rgba(255,255,255,.15)' }} />
                    <div className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-white/80" style={{ left: `${TARGET}%` }}>
                        <span className="absolute left-1.5 top-[-1px] text-[9px] text-white/80 font-semibold uppercase tracking-wide whitespace-nowrap">meta</span>
                    </div>
                </div>
            </div>

            {/* White bottom zone */}
            <div className="p-4 flex flex-col gap-3 bg-white flex-1">
                <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl text-center" style={{ background: '#d6f1de' }}>
                        <span className="text-lg font-extrabold tabular-nums" style={{ color: '#1f9d4f' }}>{stat.covered}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Aprobados</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl text-center" style={{ background: '#fbe7b4' }}>
                        <span className="text-lg font-extrabold tabular-nums" style={{ color: '#d68c0e' }}>{stat.onlyPend}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Pendiente</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl text-center" style={{ background: '#f5f4fb' }}>
                        <span className="text-lg font-extrabold tabular-nums" style={{ color: '#6c6a8f' }}>{stat.noEval}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sin eval.</span>
                    </div>
                </div>
                <div className="flex items-center pt-2 border-t border-dashed border-[#f0e3c8]">
                    <span className="text-[11px] text-gray-400 font-medium">
                        {stat.lastUpdated
                            ? formatRelativeDate(stat.lastUpdated)
                            : stat.total > 0 ? `${stat.total} OAs` : 'Sin OAs'}
                    </span>
                    {stat.total > 0 && (
                        <span className="ml-auto text-[11.5px] font-semibold px-2.5 py-1 rounded-lg border border-[#f0e3c8] bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                            Ver OAs →
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Detail view (OA grid per asignatura + curso) ─────────────────────────────
function DetailView({ asigCode, curso, evaluaciones, onBack }) {
    const cfg      = SUBJ_CONFIG[asigCode] ?? DEFAULT_CFG;
    const asigName = ASIGNATURAS.find(a => a.code === asigCode)?.name ?? asigCode;

    const allOAs = useMemo(() =>
        getOAsForCursoAsignatura(asigCode, curso),
    [asigCode, curso]);

    const coveredOAs = useMemo(() => {
        const s = new Set();
        evaluaciones
            .filter(e => e.asignatura === asigCode && e.curso === curso && e.status === 'approved')
            .forEach(e => (e.questions || []).forEach(q => q.oaCode && s.add(q.oaCode)));
        return s;
    }, [evaluaciones, asigCode, curso]);

    const pendingOAs = useMemo(() => {
        const s = new Set();
        evaluaciones
            .filter(e => e.asignatura === asigCode && e.curso === curso && e.status !== 'approved')
            .forEach(e => (e.questions || []).forEach(q => q.oaCode && s.add(q.oaCode)));
        return s;
    }, [evaluaciones, asigCode, curso]);

    const pct      = allOAs.length > 0 ? Math.round(coveredOAs.size / allOAs.length * 100) : 0;
    const onlyPend = [...pendingOAs].filter(c => !coveredOAs.has(c)).length;
    const noEval   = allOAs.length - coveredOAs.size - onlyPend;
    const ejes     = useMemo(() => [...new Set(allOAs.map(oa => oa.eje))], [allOAs]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight"
                        style={{ background: `linear-gradient(135deg, ${cfg.c1}, ${cfg.c2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        {cfg.short}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">{curso} · OAs en evaluaciones aprobadas</p>
                </div>
            </div>

            {/* Progress card */}
            <div className="rounded-2xl overflow-hidden border border-[#f0e3c8] shadow-sm bg-white">
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${cfg.c1}, ${cfg.c2})` }} />
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white mb-3" style={{ background: cfg.c1 }}>
                                {asigName} · {curso}
                            </div>
                            <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                                {coveredOAs.size}
                                <span className="text-lg font-semibold text-gray-400 mx-1">de</span>
                                {allOAs.length}
                                <span className="text-lg font-semibold text-gray-400 ml-1">OAs cubiertos</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Solo evaluaciones aprobadas</p>
                        </div>
                        <span className="text-5xl font-extrabold tabular-nums shrink-0" style={{ color: cfg.c1 }}>
                            {pct}%
                        </span>
                    </div>
                    {/* Progress bar + target */}
                    <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-visible">
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.c1}, ${cfg.c2})` }} />
                        <div className="absolute top-[-5px] bottom-[-5px] w-0.5 bg-gray-900/30 rounded-full" style={{ left: `${TARGET}%` }}>
                            <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-semibold text-gray-400 whitespace-nowrap">meta {TARGET}%</span>
                        </div>
                    </div>
                    {/* Mini stats */}
                    <div className="flex flex-wrap gap-3 mt-4">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: '#d6f1de', color: '#1f9d4f' }}>
                            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                            <strong>{coveredOAs.size}</strong>&nbsp;aprobados
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: '#fbe7b4', color: '#d68c0e' }}>
                            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                            <strong>{onlyPend}</strong>&nbsp;solo pendiente
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: '#ebeaf2', color: '#8b89a8' }}>
                            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                            <strong>{noEval}</strong>&nbsp;sin evaluar
                        </div>
                    </div>
                </div>
            </div>

            {/* OA grid */}
            {allOAs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#f0e3c8] p-12 text-center shadow-sm">
                    <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#d0cce8' }} />
                    <p className="font-bold text-gray-400">No hay OAs registrados para esta combinación</p>
                </div>
            ) : (
                ejes.map(eje => {
                    const ejOAs = allOAs.filter(oa => oa.eje === eje);
                    return (
                        <div key={eje} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest whitespace-nowrap text-gray-400">{eje}</h3>
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
                                    {ejOAs.filter(oa => coveredOAs.has(oa.code)).length}/{ejOAs.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {ejOAs.map(oa => {
                                    const evaluated = coveredOAs.has(oa.code);
                                    const pending   = !evaluated && pendingOAs.has(oa.code);
                                    const short     = oa.code.includes('-')
                                        ? oa.code.split('-').slice(1).join('-')
                                        : oa.code;
                                    return (
                                        <div key={oa.code} className="rounded-xl p-3 border transition-all"
                                            style={evaluated
                                                ? { background: '#d6f1de', borderColor: '#b3e3c5' }
                                                : pending
                                                    ? { background: '#fbe7b4', borderColor: '#f4d97f' }
                                                    : { background: '#f5f4fb', borderColor: '#e4e2f0' }
                                            }>
                                            <div className="flex items-start gap-2.5">
                                                <span className="shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-extrabold mt-px text-white"
                                                    style={{ background: evaluated ? '#1f9d4f' : pending ? '#d68c0e' : '#9b99b8' }}>
                                                    {short}
                                                </span>
                                                <p className="text-[11px] leading-snug line-clamp-2"
                                                    style={{ color: evaluated ? '#1a6b3a' : pending ? '#7a4f00' : '#6c6a8f' }}>
                                                    {oa.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}

            {/* Legend */}
            {allOAs.length > 0 && (
                <div className="flex flex-wrap gap-3 pb-2">
                    {[
                        { bg: '#d6f1de', color: '#1f9d4f', label: 'Evaluado y aprobado' },
                        { bg: '#fbe7b4', color: '#d68c0e', label: 'Solo en evaluación pendiente' },
                        { bg: '#ebeaf2', color: '#8b89a8', label: 'No evaluado' },
                    ].map(({ bg, color, label }) => (
                        <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: bg, color }}>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-current" />
                            {label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CoberturaOA({ onBack }) {
    const { evaluaciones } = useEvaluaciones();
    const [filterCurso, setFilterCurso] = useState('1° Básico');
    const [filterAsig,  setFilterAsig]  = useState(null);
    const [viewMode,    setViewMode]    = useState('cards');

    const subjectStats = useSubjectStats(evaluaciones, filterCurso);

    // Per-course percentage for the tab strip
    const courseTabStats = useMemo(() =>
        CURSOS.map(curso => {
            let total = 0;
            const covSet = new Set();
            ASIGNATURAS.forEach(asig => {
                const oas = getOAsForCursoAsignatura(asig.code, curso);
                total += oas.length;
                evaluaciones
                    .filter(e => e.asignatura === asig.code && e.curso === curso && e.status === 'approved')
                    .forEach(e => (e.questions || []).forEach(q => q.oaCode && covSet.add(`${asig.code}:${q.oaCode}`)));
            });
            return { curso, pct: total > 0 ? Math.round(covSet.size / total * 100) : 0 };
        }),
    [evaluaciones]);

    // KPIs
    const totalOAs     = subjectStats.reduce((s, x) => s + x.total,    0);
    const totalCov     = subjectStats.reduce((s, x) => s + x.covered,  0);
    const totalPend    = subjectStats.reduce((s, x) => s + x.onlyPend, 0);
    const totalNoEval  = subjectStats.reduce((s, x) => s + x.noEval,   0);
    const overallPct   = totalOAs > 0 ? Math.round(totalCov / totalOAs * 100) : 0;
    const ontrackCount = subjectStats.filter(s => s.status === 'ontrack').length;

    if (filterAsig) {
        return (
            <DetailView
                asigCode={filterAsig}
                curso={filterCurso}
                evaluaciones={evaluaciones}
                onBack={() => setFilterAsig(null)}
            />
        );
    }

    return (
        <div>
            {/* ── Page header ── */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight"
                        style={{ background: 'linear-gradient(135deg, #1d5fb1 0%, #f25c54 60%, #f7a072 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Cobertura Curricular
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">OAs evaluados en evaluaciones aprobadas</p>
                </div>
            </div>

            {/* ── Course strip ── */}
            <div className="bg-white border border-[#f0e3c8] rounded-2xl p-2 mb-5 shadow-sm overflow-x-auto">
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${CURSOS.length}, minmax(90px, 1fr))` }}>
                    {CURSOS.map((curso, idx) => {
                        const tabPct  = courseTabStats[idx]?.pct ?? 0;
                        const isActive = curso === filterCurso;
                        return (
                            <button
                                key={curso}
                                onClick={() => setFilterCurso(curso)}
                                className="rounded-2xl px-3 py-3 text-left flex flex-col gap-2 transition-all duration-150"
                                style={isActive ? {
                                    background: 'linear-gradient(135deg, #1d5fb1 0%, #5b9be5 100%)',
                                    boxShadow:  '0 6px 18px -8px rgba(29,95,177,.55)',
                                    transform:  'translateY(-2px)',
                                } : {}}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[13px] font-bold leading-tight" style={{ color: isActive ? 'white' : '#1d1b3d' }}>
                                        {curso.split(' ')[0]}
                                    </span>
                                    <span className="text-[13px] font-extrabold tabular-nums" style={{ color: isActive ? 'white' : '#3d3a6b' }}>
                                        {tabPct}%
                                    </span>
                                </div>
                                {/* Mini bar */}
                                <div className="h-[5px] rounded-full overflow-hidden" style={{ background: isActive ? 'rgba(255,255,255,.25)' : '#f0e3c8' }}>
                                    <div className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${tabPct}%`, background: isActive ? 'white' : '#f25c54' }} />
                                </div>
                                <span className="text-[11px] font-medium" style={{ color: isActive ? 'rgba(255,255,255,.8)' : '#9b99b8' }}>
                                    {curso.split(' ').slice(1).join(' ')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-4 gap-3.5 mb-5">
                {/* Hero */}
                <div className="rounded-2xl p-5 relative overflow-hidden col-span-1"
                    style={{ background: 'linear-gradient(135deg, #1d5fb1 0%, #4b8de8 50%, #6fa9f0 100%)', boxShadow: '0 12px 28px -12px rgba(29,95,177,.55)' }}>
                    <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
                    <div style={{ position: 'absolute', right: 80, bottom: -60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
                    <RingProgress pct={overallPct} />
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2 relative z-10" style={{ color: 'rgba(255,255,255,.9)' }}>
                        Cobertura total
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight tabular-nums relative z-10 text-white leading-none">
                        {overallPct}<span className="text-xl ml-1 font-bold opacity-80">%</span>
                    </p>
                    <p className="text-xs relative z-10 mt-2" style={{ color: 'rgba(255,255,255,.85)' }}>
                        {ontrackCount} de {subjectStats.filter(s => s.total > 0).length} asignaturas al día · Meta {TARGET}%
                    </p>
                </div>
                {/* Cubiertos */}
                <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #d6f1de 0%, #c7eed8 100%)', borderColor: '#b3e3c5' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#1f7a4d' }}>OAs cubiertos</p>
                    <p className="text-4xl font-extrabold tracking-tight tabular-nums leading-none" style={{ color: '#1f7a4d' }}>{totalCov}</p>
                    <p className="text-xs mt-2" style={{ color: '#1f7a4d', opacity: 0.8 }}>de {totalOAs} OAs en el nivel</p>
                </div>
                {/* Pendientes */}
                <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderColor: '#f4d97f' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b48b1a' }}>Solo pendientes</p>
                    <p className="text-4xl font-extrabold tracking-tight tabular-nums leading-none" style={{ color: '#b48b1a' }}>{totalPend}</p>
                    <p className="text-xs mt-2" style={{ color: '#b48b1a', opacity: 0.8 }}>OAs en evaluaciones sin aprobar</p>
                </div>
                {/* Sin evaluar */}
                <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg, #ffe4d2 0%, #ffd4b8 100%)', borderColor: '#ffc09e' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b14a14' }}>Sin evaluar</p>
                    <p className="text-4xl font-extrabold tracking-tight tabular-nums leading-none" style={{ color: '#b14a14' }}>{totalNoEval}</p>
                    <p className="text-xs mt-2" style={{ color: '#b14a14', opacity: 0.8 }}>OAs sin ninguna evaluación</p>
                </div>
            </div>

            {/* ── Section header + view toggle ── */}
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-extrabold tracking-tight text-gray-900">Asignaturas</h3>
                <span className="text-sm text-gray-400 font-medium">{filterCurso}</span>
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
                        <SubjectCard
                            key={s.code}
                            stat={s}
                            onClick={() => s.total > 0 && setFilterAsig(s.code)}
                        />
                    ))}
                </div>
            )}

            {/* ── Horizontal bars ── */}
            {viewMode === 'bars' && (
                <div className="bg-white rounded-2xl border border-[#f0e3c8] p-5 shadow-sm">
                    {subjectStats.map((s, i) => (
                        <div
                            key={s.code}
                            className="grid items-center gap-3 py-2 cursor-pointer group"
                            style={{
                                gridTemplateColumns: '150px 1fr 56px 96px',
                                borderBottom: i < subjectStats.length - 1 ? '1px dashed #f0e3c8' : 'none',
                            }}
                            onClick={() => s.total > 0 && setFilterAsig(s.code)}
                        >
                            {/* Label */}
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-800">
                                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.cfg.c1 }} />
                                {s.cfg.short}
                            </div>
                            {/* Bar */}
                            <div className="relative h-[22px] rounded-md overflow-hidden" style={{ background: '#f5f4fb' }}>
                                {/* Target line */}
                                <div className="absolute top-0 bottom-0 w-0.5 z-10" style={{ left: `${TARGET}%`, background: '#1d1b3d' }} />
                                {/* Fill */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 rounded-md flex items-center pl-2 text-[11.5px] font-semibold text-white transition-all duration-700"
                                    style={{ width: `${Math.max(s.pct, 3)}%`, background: `linear-gradient(90deg, ${s.cfg.c1}, ${s.cfg.c2})` }}
                                >
                                    {s.pct >= 12 && `${s.pct}%`}
                                </div>
                            </div>
                            {/* Pct */}
                            <span className="text-[13.5px] font-bold text-right tabular-nums" style={{ color: s.cfg.c1 }}>
                                {s.pct}%
                            </span>
                            {/* Status badge */}
                            <div className="flex justify-end">
                                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: STATUS_CFG[s.status].bg, color: STATUS_CFG[s.status].color }}>
                                    {STATUS_CFG[s.status].label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Atención inmediata ── */}
            {(() => {
                const needsAttention = subjectStats.filter(s => s.total > 0 && s.status !== 'ontrack');
                if (!needsAttention.length) return null;
                return (
                    <div>
                        <div className="flex items-center gap-2 mb-3 mt-2">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#d68c0e' }} />
                            <h3 className="text-[13px] font-bold text-gray-700">Atención inmediata</h3>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fbe7b4', color: '#d68c0e' }}>
                                {needsAttention.length}
                            </span>
                        </div>
                        <div className="bg-white rounded-2xl border border-[#f0e3c8] shadow-sm divide-y divide-dashed divide-[#f0e3c8]">
                            {needsAttention.map(s => {
                                const sc = STATUS_CFG[s.status];
                                return (
                                    <button
                                        key={s.code}
                                        onClick={() => setFilterAsig(s.code)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#fef7eb] transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${s.cfg.c1}, ${s.cfg.c2})` }}>
                                            {s.cfg.glyph}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-gray-800">{s.cfg.short}</p>
                                            <p className="text-[11px] text-gray-400">
                                                {s.covered}/{s.total} OAs · {s.lastUpdated ? formatRelativeDate(s.lastUpdated) : 'sin actualizar'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[12px] font-extrabold tabular-nums" style={{ color: s.cfg.c1 }}>{s.pct}%</span>
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                                                {sc.label}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

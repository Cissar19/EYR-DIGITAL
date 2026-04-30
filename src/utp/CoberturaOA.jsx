import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { getOAsForCursoAsignatura, ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';

// ─── Colores por asignatura (mismo mapa que CalendarioEvaluaciones) ───────────
const ASIG_COLORS = {
    MA: { pill: 'bg-blue-600 text-white',    bar: 'bg-blue-600',    ring: 'ring-blue-600/30'    },
    LE: { pill: 'bg-violet-600 text-white',  bar: 'bg-violet-600',  ring: 'ring-violet-600/30'  },
    CN: { pill: 'bg-emerald-600 text-white', bar: 'bg-emerald-600', ring: 'ring-emerald-600/30' },
    HI: { pill: 'bg-amber-500 text-white',   bar: 'bg-amber-500',   ring: 'ring-amber-500/30'   },
    IN: { pill: 'bg-sky-500 text-white',     bar: 'bg-sky-500',     ring: 'ring-sky-500/30'     },
    EF: { pill: 'bg-orange-500 text-white',  bar: 'bg-orange-500',  ring: 'ring-orange-500/30'  },
    AV: { pill: 'bg-fuchsia-600 text-white', bar: 'bg-fuchsia-600', ring: 'ring-fuchsia-600/30' },
    MU: { pill: 'bg-rose-600 text-white',    bar: 'bg-rose-600',    ring: 'ring-rose-600/30'    },
    TE: { pill: 'bg-slate-600 text-white',   bar: 'bg-slate-600',   ring: 'ring-slate-600/30'   },
    OR: { pill: 'bg-teal-600 text-white',    bar: 'bg-teal-600',    ring: 'ring-teal-600/30'    },
};
const DEFAULT_ASIG = { pill: 'bg-slate-400 text-white', bar: 'bg-slate-400', ring: 'ring-slate-400/30' };

export default function CoberturaOA({ onBack }) {
    const { evaluaciones } = useEvaluaciones();

    const [filterAsig,  setFilterAsig]  = useState('MA');
    const [filterCurso, setFilterCurso] = useState('1° Básico');

    const [asigDropdown,  setAsigDropdown]  = useState(false);
    const [cursoDropdown, setCursoDropdown] = useState(false);
    const asigRef  = useRef(null);
    const cursoRef = useRef(null);

    useEffect(() => {
        const handler = e => {
            if (asigRef.current  && !asigRef.current.contains(e.target))  setAsigDropdown(false);
            if (cursoRef.current && !cursoRef.current.contains(e.target)) setCursoDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const asigIdx   = ASIGNATURAS.findIndex(a => a.code === filterAsig);
    const cursoIdx  = CURSOS.indexOf(filterCurso);
    const asigMeta  = ASIG_COLORS[filterAsig] ?? DEFAULT_ASIG;
    const asigName  = ASIGNATURAS[asigIdx]?.name ?? filterAsig;

    const availableOAs = useMemo(() =>
        getOAsForCursoAsignatura(filterAsig, filterCurso),
    [filterAsig, filterCurso]);

    const coveredOAs = useMemo(() => {
        const s = new Set();
        evaluaciones
            .filter(e => e.asignatura === filterAsig && e.curso === filterCurso && e.status === 'approved')
            .forEach(e => (e.questions || []).forEach(q => q.oaCode && s.add(q.oaCode)));
        return s;
    }, [evaluaciones, filterAsig, filterCurso]);

    const pendingOAs = useMemo(() => {
        const s = new Set();
        evaluaciones
            .filter(e => e.asignatura === filterAsig && e.curso === filterCurso && e.status !== 'approved')
            .forEach(e => (e.questions || []).forEach(q => q.oaCode && s.add(q.oaCode)));
        return s;
    }, [evaluaciones, filterAsig, filterCurso]);

    const pct       = availableOAs.length > 0 ? Math.round(coveredOAs.size / availableOAs.length * 100) : 0;
    const onlyPend  = [...pendingOAs].filter(c => !coveredOAs.has(c)).length;
    const noEval    = availableOAs.length - coveredOAs.size - onlyPend;
    const ejes      = useMemo(() => [...new Set(availableOAs.map(oa => oa.eje))], [availableOAs]);

    const pctColor  = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500';
    const barColor  = pct >= 80 ? 'bg-emerald-500'   : pct >= 50 ? 'bg-amber-500'   : 'bg-red-500';

    return (
        <div className="space-y-6">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl text-inst-navy hover:bg-inst-navy/10 transition-colors shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="p-2.5 bg-inst-navy/20 rounded-xl shrink-0">
                    <BookOpen className="w-6 h-6 text-inst-navy" />
                </div>
                <div>
                    <h2 className="text-2xl font-headline font-extrabold tracking-tight text-eyr-on-surface">
                        Cobertura Curricular
                    </h2>
                    <p className="text-sm text-eyr-on-variant">OAs evaluados en evaluaciones aprobadas</p>
                </div>
            </div>

            {/* ── Filtros (mismo estilo pill que CalendarioEvaluaciones) ─── */}
            <div className="flex flex-wrap items-center gap-3">

                {/* Selector de asignatura */}
                <div className="flex items-center gap-1 bg-inst-navy rounded-2xl p-1 shadow-md shadow-inst-navy/30">
                    <button
                        onClick={() => asigIdx > 0 && setFilterAsig(ASIGNATURAS[asigIdx - 1].code)}
                        disabled={asigIdx <= 0}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="relative" ref={asigRef}>
                        <button
                            onClick={() => setAsigDropdown(o => !o)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                            style={{ minWidth: 160 }}
                        >
                            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${asigMeta.pill}`}>
                                {filterAsig}
                            </span>
                            <span className="flex-1 text-center text-sm font-bold text-white truncate">{asigName}</span>
                            <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 shrink-0 ${asigDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {asigDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-eyr-outline-variant/10 overflow-hidden z-50 min-w-[180px]"
                                >
                                    {ASIGNATURAS.map(a => (
                                        <button
                                            key={a.code}
                                            onClick={() => { setFilterAsig(a.code); setAsigDropdown(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2
                                                ${a.code === filterAsig
                                                    ? 'bg-inst-navy text-white'
                                                    : 'text-eyr-on-surface hover:bg-eyr-surface-high'
                                                }`}
                                        >
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${(ASIG_COLORS[a.code] ?? DEFAULT_ASIG).pill}`}>
                                                {a.code}
                                            </span>
                                            {a.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => asigIdx < ASIGNATURAS.length - 1 && setFilterAsig(ASIGNATURAS[asigIdx + 1].code)}
                        disabled={asigIdx >= ASIGNATURAS.length - 1}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Selector de curso */}
                <div className="flex items-center gap-1 bg-inst-navy rounded-2xl p-1 shadow-md shadow-inst-navy/30">
                    <button
                        onClick={() => cursoIdx > 0 && setFilterCurso(CURSOS[cursoIdx - 1])}
                        disabled={cursoIdx <= 0}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="relative" ref={cursoRef}>
                        <button
                            onClick={() => setCursoDropdown(o => !o)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                            style={{ minWidth: 140 }}
                        >
                            <span className="flex-1 text-center text-sm font-bold text-white">{filterCurso}</span>
                            <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 shrink-0 ${cursoDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {cursoDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-eyr-outline-variant/10 overflow-hidden z-50 min-w-[160px]"
                                >
                                    {CURSOS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => { setFilterCurso(c); setCursoDropdown(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors
                                                ${c === filterCurso
                                                    ? 'bg-inst-navy text-white'
                                                    : 'text-eyr-on-surface hover:bg-eyr-surface-high'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => cursoIdx < CURSOS.length - 1 && setFilterCurso(CURSOS[cursoIdx + 1])}
                        disabled={cursoIdx >= CURSOS.length - 1}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ── Tarjeta de progreso ──────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-eyr-outline-variant/10 overflow-hidden shadow-sm">
                {/* Barra de color de asignatura */}
                <div className={`h-1.5 ${asigMeta.bar}`} />

                <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${asigMeta.pill}`}>
                                {asigName} · {filterCurso}
                            </div>
                            <p className="text-2xl font-headline font-extrabold tracking-tight text-eyr-on-surface">
                                {coveredOAs.size}
                                <span className="text-lg font-semibold text-eyr-on-variant mx-1">de</span>
                                {availableOAs.length}
                                <span className="text-lg font-semibold text-eyr-on-variant ml-1">OAs cubiertos</span>
                            </p>
                            <p className="text-xs text-eyr-on-variant mt-1">Solo evaluaciones aprobadas</p>
                        </div>
                        <span className={`text-5xl font-extrabold shrink-0 tabular-nums ${pctColor}`}>
                            {pct}%
                        </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-eyr-surface-high rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>

                    {/* Mini-stats */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs font-semibold text-emerald-700">
                                <strong>{coveredOAs.size}</strong> aprobados
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            <span className="text-xs font-semibold text-amber-700">
                                <strong>{onlyPend}</strong> solo pendiente
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-eyr-surface-low border border-eyr-outline-variant/10">
                            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-xs font-semibold text-eyr-on-variant">
                                <strong>{noEval}</strong> sin evaluar
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sin OAs ─────────────────────────────────────────────────── */}
            {availableOAs.length === 0 && (
                <div className="bg-white rounded-3xl border border-eyr-outline-variant/10 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-eyr-surface-high flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-eyr-on-variant/40" />
                    </div>
                    <p className="font-headline font-bold text-eyr-on-variant">
                        No hay OAs registrados para esta combinación
                    </p>
                </div>
            )}

            {/* ── Grid de OAs por eje ─────────────────────────────────────── */}
            {ejes.map(eje => {
                const ejOAs = availableOAs.filter(oa => oa.eje === eje);
                return (
                    <div key={eje} className="space-y-3">
                        {/* Eje header */}
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-bold text-eyr-on-variant uppercase tracking-widest">
                                {eje}
                            </h3>
                            <div className="flex-1 h-px bg-eyr-outline-variant/20" />
                            <span className="text-[11px] font-semibold text-eyr-on-variant/60 tabular-nums">
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
                                    <div
                                        key={oa.code}
                                        className={`rounded-2xl p-3.5 transition-all ${
                                            evaluated
                                                ? 'bg-emerald-50 border border-emerald-200'
                                                : pending
                                                    ? 'bg-amber-50 border border-amber-200'
                                                    : 'bg-eyr-surface-low border border-eyr-outline-variant/10'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            {/* Badge de código */}
                                            <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-extrabold mt-px ${
                                                evaluated
                                                    ? 'bg-emerald-500 text-white'
                                                    : pending
                                                        ? 'bg-amber-400 text-white'
                                                        : 'bg-eyr-surface-high text-eyr-on-variant'
                                            }`}>
                                                {short}
                                            </span>
                                            {/* Descripción */}
                                            <p className={`text-[11px] leading-snug line-clamp-2 ${
                                                evaluated
                                                    ? 'text-emerald-800'
                                                    : pending
                                                        ? 'text-amber-800'
                                                        : 'text-eyr-on-variant'
                                            }`}>
                                                {oa.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* ── Leyenda ─────────────────────────────────────────────────── */}
            {availableOAs.length > 0 && (
                <div className="flex flex-wrap gap-3 pb-2">
                    {[
                        { color: 'bg-emerald-500', label: 'Evaluado y aprobado' },
                        { color: 'bg-amber-400',   label: 'Solo en evaluación pendiente' },
                        { color: 'bg-slate-300',   label: 'No evaluado' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-eyr-surface-low text-xs font-semibold text-eyr-on-variant">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                            {label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

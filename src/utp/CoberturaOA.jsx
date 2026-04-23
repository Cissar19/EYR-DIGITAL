import React, { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { getOAsForCursoAsignatura, ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';

const SELECT_CLASS = [
    'py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-sm font-medium',
    'outline-none bg-white appearance-none cursor-pointer',
    'focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all',
].join(' ');

export default function CoberturaOA({ onBack }) {
    const { evaluaciones } = useEvaluaciones();

    const [filterAsig,  setFilterAsig]  = useState('MA');
    const [filterCurso, setFilterCurso] = useState('1° Básico');

    const availableOAs = useMemo(() =>
        getOAsForCursoAsignatura(filterAsig, filterCurso),
    [filterAsig, filterCurso]);

    // OAs que aparecen en evaluaciones aprobadas
    const coveredOAs = useMemo(() => {
        const s = new Set();
        evaluaciones
            .filter(e => e.asignatura === filterAsig && e.curso === filterCurso && e.status === 'approved')
            .forEach(e => (e.questions || []).forEach(q => q.oaCode && s.add(q.oaCode)));
        return s;
    }, [evaluaciones, filterAsig, filterCurso]);

    // OAs en evaluaciones aún pendientes (no aprobadas)
    const pendingOAs = useMemo(() => {
        const s = new Set();
        evaluaciones
            .filter(e => e.asignatura === filterAsig && e.curso === filterCurso && e.status !== 'approved')
            .forEach(e => (e.questions || []).forEach(q => q.oaCode && s.add(q.oaCode)));
        return s;
    }, [evaluaciones, filterAsig, filterCurso]);

    const pct = availableOAs.length > 0
        ? Math.round(coveredOAs.size / availableOAs.length * 100)
        : 0;

    const ejes = useMemo(() => [...new Set(availableOAs.map(oa => oa.eje))], [availableOAs]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Cobertura Curricular</h2>
                    <p className="text-xs text-slate-500">OAs evaluados en evaluaciones aprobadas</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-3 flex-wrap">
                <select value={filterAsig} onChange={e => setFilterAsig(e.target.value)} className={SELECT_CLASS}>
                    {ASIGNATURAS.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                </select>
                <select value={filterCurso} onChange={e => setFilterCurso(e.target.value)} className={SELECT_CLASS}>
                    {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Barra de progreso */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <p className="font-bold text-slate-800 text-lg">
                            {coveredOAs.size} <span className="font-normal text-slate-400">de</span> {availableOAs.length} OAs evaluados
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {ASIGNATURAS.find(a => a.code === filterAsig)?.name} — {filterCurso} · solo evaluaciones aprobadas
                        </p>
                    </div>
                    <span className={`text-4xl font-extrabold shrink-0 ${
                        pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'
                    }`}>{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                            pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                {/* Mini-stats */}
                <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span><strong className="text-emerald-700">{coveredOAs.size}</strong> aprobados</span>
                    <span><strong className="text-amber-600">{[...pendingOAs].filter(c => !coveredOAs.has(c)).length}</strong> solo pendiente</span>
                    <span><strong className="text-slate-600">{availableOAs.length - coveredOAs.size - [...pendingOAs].filter(c => !coveredOAs.has(c)).length}</strong> sin evaluar</span>
                </div>
            </div>

            {/* Sin OAs */}
            {availableOAs.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No hay OAs registrados para esta combinación</p>
                </div>
            )}

            {/* Grid de OAs por eje */}
            {ejes.map(eje => {
                const ejOAs = availableOAs.filter(oa => oa.eje === eje);
                return (
                    <div key={eje} className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">{eje}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {ejOAs.map(oa => {
                                const evaluated = coveredOAs.has(oa.code);
                                const pending   = !evaluated && pendingOAs.has(oa.code);
                                const short     = oa.code.includes('-')
                                    ? oa.code.split('-').slice(1).join('-')
                                    : oa.code;
                                return (
                                    <div key={oa.code} className={`rounded-xl border p-3 transition-all ${
                                        evaluated
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : pending
                                                ? 'bg-amber-50 border-amber-200'
                                                : 'bg-white border-slate-200'
                                    }`}>
                                        <div className="flex items-start gap-2">
                                            <span className={`shrink-0 w-2 h-2 rounded-full mt-[5px] ${
                                                evaluated ? 'bg-emerald-500' : pending ? 'bg-amber-400' : 'bg-slate-300'
                                            }`} />
                                            <div className="min-w-0">
                                                <p className={`text-xs font-bold ${
                                                    evaluated ? 'text-emerald-700' : pending ? 'text-amber-700' : 'text-slate-500'
                                                }`}>{short}</p>
                                                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                                                    {oa.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Leyenda */}
            {availableOAs.length > 0 && (
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 pb-2">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /> Evaluado (aprobado)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" /> Solo en evaluación pendiente
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" /> No evaluado
                    </span>
                </div>
            )}
        </div>
    );
}

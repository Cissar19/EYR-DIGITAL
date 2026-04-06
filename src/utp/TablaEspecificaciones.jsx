import React, { useMemo } from 'react';
import { getOAByCode } from '../data/objetivosAprendizaje';

const TIPO_LABELS = {
    seleccion_multiple: 'Sel. Múltiple',
    desarrollo:         'Desarrollo',
    verdadero_falso:    'V/F',
    unir:               'Unir',
    completar:          'Completar',
};

export default function TablaEspecificaciones({ evaluacion }) {
    const questions = useMemo(() => evaluacion.questions || [], [evaluacion.questions]);
    const totalPts  = useMemo(() => questions.reduce((s, q) => s + (q.puntaje ?? 1), 0), [questions]);

    // Tipos presentes en esta evaluación, en orden de aparición
    const tiposUsados = useMemo(() => {
        const seen = new Set();
        questions.forEach(q => seen.add(q.tipo));
        return [...seen];
    }, [questions]);

    // Agrupación por OA
    const byOA = useMemo(() => {
        const map = {};
        questions.forEach(q => {
            const key = q.oaCode || '__sin_oa__';
            if (!map[key]) {
                map[key] = { oaCode: q.oaCode || null, tipos: {}, pts: 0, count: 0 };
            }
            map[key].tipos[q.tipo] = (map[key].tipos[q.tipo] || 0) + 1;
            map[key].pts   += q.puntaje ?? 1;
            map[key].count += 1;
        });
        return Object.values(map).sort((a, b) => (b.pts - a.pts));
    }, [questions]);

    if (questions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No hay preguntas en esta evaluación</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Resumen por tipo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {tiposUsados.map(t => {
                    const qs  = questions.filter(q => q.tipo === t);
                    const pts = qs.reduce((s, q) => s + (q.puntaje ?? 1), 0);
                    return (
                        <div key={t} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                                {TIPO_LABELS[t] || t}
                            </p>
                            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{qs.length}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {pts} pts · {totalPts ? Math.round(pts / totalPts * 100) : 0}%
                            </p>
                        </div>
                    );
                })}
                <div className="bg-indigo-50 rounded-xl border border-indigo-100 px-4 py-3">
                    <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-extrabold text-indigo-800 mt-0.5">{questions.length}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">{totalPts} pts</p>
                </div>
            </div>

            {/* Tabla de especificaciones */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Tabla de Especificaciones</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Distribución por OA y tipo · exigencia {evaluacion.exigencia ?? 60}% · {totalPts} pts totales
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">OA</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 min-w-[220px]">Descripción</th>
                                {tiposUsados.map(t => (
                                    <th key={t} className="px-3 py-3 text-center text-xs font-semibold text-slate-600 min-w-[80px]">
                                        {TIPO_LABELS[t] || t}
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600">Pts</th>
                                <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600 min-w-[100px]">% del total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {byOA.map((row, i) => {
                                const oa    = row.oaCode ? getOAByCode(row.oaCode) : null;
                                const short = row.oaCode
                                    ? (row.oaCode.includes('-') ? row.oaCode.split('-').slice(1).join('-') : row.oaCode)
                                    : '—';
                                const pct = totalPts ? Math.round(row.pts / totalPts * 100) : 0;
                                return (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                        <td className="px-4 py-2.5 font-bold text-indigo-700 text-xs whitespace-nowrap">{short}</td>
                                        <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[240px]">
                                            <span className="line-clamp-2">{oa?.description || '(sin OA asignado)'}</span>
                                        </td>
                                        {tiposUsados.map(t => (
                                            <td key={t} className="px-3 py-2.5 text-center text-xs font-medium text-slate-700">
                                                {row.tipos[t] ?? '—'}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2.5 text-center font-bold text-slate-800 text-xs">{row.pts}</td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="w-16 bg-slate-200 rounded-full h-1.5 shrink-0">
                                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600 w-8 text-right">{pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 border-t-2 border-slate-300">
                                <td className="px-4 py-2.5 font-bold text-slate-800 text-xs" colSpan={2}>
                                    Total ({byOA.length} OA{byOA.length !== 1 ? 's' : ''})
                                </td>
                                {tiposUsados.map(t => (
                                    <td key={t} className="px-3 py-2.5 text-center font-bold text-slate-800 text-xs">
                                        {questions.filter(q => q.tipo === t).length}
                                    </td>
                                ))}
                                <td className="px-3 py-2.5 text-center font-bold text-indigo-700 text-xs">{totalPts}</td>
                                <td className="px-3 py-2.5 text-right font-bold text-slate-600 text-xs">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

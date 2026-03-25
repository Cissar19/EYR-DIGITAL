import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useStudents } from '../context/StudentsContext';
import { getOAByCode } from '../data/objetivosAprendizaje';

/**
 * ResumenOA: Achievement summary by OA
 * Groups questions by OA code, calculates % of students who "achieved" the OA
 * OA "achieved" for a student if they got >=60% of the questions mapped to that OA correct
 * Colors: green (>=70%), yellow (>=40%), red (<40%)
 */
export default function ResumenOA({ evaluacion }) {
    const { students } = useStudents();

    const normalizeCurso = (c) => c?.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
    const cursoStudents = useMemo(() => {
        const evalCurso = normalizeCurso(evaluacion.curso);
        return students.filter(s => normalizeCurso(s.curso) === evalCurso);
    }, [students, evaluacion.curso]);

    const oaSummary = useMemo(() => {
        // Group question indices by OA code (skip questions without OA)
        const oaQuestions = {};
        evaluacion.questions.forEach((q, idx) => {
            if (!q.oaCode) return;
            if (!oaQuestions[q.oaCode]) {
                oaQuestions[q.oaCode] = [];
            }
            oaQuestions[q.oaCode].push(idx);
        });

        // For each OA, calculate how many students "achieved" it
        const summaries = Object.entries(oaQuestions).map(([oaCode, questionIndices]) => {
            const oaInfo = getOAByCode(oaCode);
            let totalStudents = 0;
            let achievedStudents = 0;

            cursoStudents.forEach(student => {
                const answers = evaluacion.results?.[student.id];
                if (!answers) return;

                // Check if student has answered at least one question for this OA
                const relevantAnswers = questionIndices
                    .map(idx => answers[idx])
                    .filter(a => a !== null && a !== undefined);

                if (relevantAnswers.length === 0) return;

                totalStudents++;
                const correct = relevantAnswers.filter(a => a === true).length;
                const ratio = correct / relevantAnswers.length;

                if (ratio >= 0.6) {
                    achievedStudents++;
                }
            });

            const percentage = totalStudents > 0 ? Math.round((achievedStudents / totalStudents) * 100) : 0;

            return {
                oaCode,
                eje: oaInfo?.eje || 'Sin eje',
                description: oaInfo?.description || oaCode,
                questionCount: questionIndices.length,
                totalStudents,
                achievedStudents,
                percentage,
            };
        });

        // Sort by OA code
        return summaries.sort((a, b) => a.oaCode.localeCompare(b.oaCode));
    }, [evaluacion, cursoStudents]);

    if (oaSummary.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No hay datos de resultados aun</p>
            </div>
        );
    }

    // Group by eje
    const byEje = {};
    oaSummary.forEach(s => {
        if (!byEje[s.eje]) byEje[s.eje] = [];
        byEje[s.eje].push(s);
    });

    const getColor = (pct) => {
        if (pct >= 70) return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' };
        if (pct >= 40) return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' };
        return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' };
    };

    // Global stats
    const globalAvg = oaSummary.length > 0
        ? Math.round(oaSummary.reduce((sum, s) => sum + s.percentage, 0) / oaSummary.length)
        : 0;
    const globalColor = getColor(globalAvg);

    // Top/bottom OAs (only those with at least 1 student evaluated)
    const withData = oaSummary.filter(s => s.totalStudents > 0);
    const topOAs = [...withData].sort((a, b) => b.percentage - a.percentage).slice(0, 3);
    const bottomOAs = [...withData].sort((a, b) => a.percentage - b.percentage).slice(0, 3);

    return (
        <div className="space-y-4">
            {/* Global summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-700">Resumen General</h3>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${globalColor.bg} ${globalColor.text}`}>
                        {globalAvg}% logro promedio
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-700">
                            {oaSummary.filter(s => s.percentage >= 70).length}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-medium">OA Logrados (&ge;70%)</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-amber-700">
                            {oaSummary.filter(s => s.percentage >= 40 && s.percentage < 70).length}
                        </p>
                        <p className="text-[11px] text-amber-600 font-medium">En Desarrollo (40-69%)</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-red-700">
                            {oaSummary.filter(s => s.percentage < 40).length}
                        </p>
                        <p className="text-[11px] text-red-600 font-medium">No Logrados (&lt;40%)</p>
                    </div>
                </div>
            </div>

            {/* Top / Bottom OAs */}
            {withData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mas logrados */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <h4 className="font-semibold text-sm text-emerald-700">OAs Mas Logrados</h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {topOAs.map((item, i) => {
                                const color = getColor(item.percentage);
                                return (
                                    <div key={item.oaCode} className="px-5 py-3 flex items-center gap-3">
                                        <span className="text-lg font-bold text-emerald-300 w-6 text-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>{item.oaCode}</span>
                                                <span className={`text-xs font-bold ${color.text}`}>{item.percentage}%</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Menos logrados */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <h4 className="font-semibold text-sm text-red-700">OAs Menos Logrados</h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {bottomOAs.map((item, i) => {
                                const color = getColor(item.percentage);
                                return (
                                    <div key={item.oaCode} className="px-5 py-3 flex items-center gap-3">
                                        <span className="text-lg font-bold text-red-300 w-6 text-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>{item.oaCode}</span>
                                                <span className={`text-xs font-bold ${color.text}`}>{item.percentage}%</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* By eje */}
            {Object.entries(byEje).map(([eje, items]) => (
                <div key={eje} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <h4 className="font-semibold text-sm text-slate-700">{eje}</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {items.map(item => {
                            const color = getColor(item.percentage);
                            return (
                                <div key={item.oaCode} className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                                                    {item.oaCode}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {item.questionCount} pregunta{item.questionCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{item.description}</p>
                                        </div>
                                        <span className={`shrink-0 text-sm font-bold ${color.text}`}>
                                            {item.percentage}%
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-slate-400">
                                            {item.achievedStudents} de {item.totalStudents} alumnos logran el OA
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

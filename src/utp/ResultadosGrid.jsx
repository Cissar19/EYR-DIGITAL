import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, X, Minus, Lock, Download } from 'lucide-react';
import { useStudents } from '../context/StudentsContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { getOAByCode } from '../data/objetivosAprendizaje';

/**
 * Escala de notas chilena: 1.0–7.0, aprobación en 4.0 según exigencia.
 * p = fracción obtenida (0–1), e = fracción de exigencia (0–1)
 * p >= e → nota = 4 + 3(p-e)/(1-e)
 * p <  e → nota = 1 + 3p/e
 */
function calcularNota(earnedPts, totalPts, exigencia) {
    if (!totalPts) return null;
    const p = earnedPts / totalPts;
    const e = (exigencia ?? 60) / 100;
    if (e <= 0 || e >= 1) return null;
    const raw = p >= e ? 4 + 3 * (p - e) / (1 - e) : 1 + 3 * p / e;
    return Math.max(1, Math.min(7, Math.round(raw * 10) / 10));
}

function notaColor(nota) {
    if (nota === null) return 'text-slate-300';
    if (nota >= 4) return 'text-emerald-700';
    if (nota >= 3) return 'text-amber-600';
    return 'text-red-600';
}

/**
 * ResultadosGrid: clickable grid for marking student answers
 * Rows = students in the evaluacion's curso
 * Columns = questions P1..PN + Puntaje + Nota columns
 * Cells cycle: true (✓) → false (✗) → null (—) → true
 * Auto-saves with 500ms debounce per student
 */
export default function ResultadosGrid({ evaluacion }) {
    const { students } = useStudents();
    const { saveResults } = useEvaluaciones();

    // Students filtered by the evaluacion's curso, sorted by name
    // Normalize to handle accent mismatches (legacy "Basico" vs "Básico")
    const normalizeCurso = (c) => c?.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
    const cursoStudents = useMemo(() => {
        const evalCurso = normalizeCurso(evaluacion.curso);
        return students
            .filter(s => normalizeCurso(s.curso) === evalCurso)
            .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    }, [students, evaluacion.curso]);

    // Base results from evaluacion (server), merged with local overrides
    const questions = evaluacion.questions || [];

    const baseResults = useMemo(() => {
        const nq = evaluacion.totalQuestions ?? questions.length;
        const init = {};
        cursoStudents.forEach(s => {
            init[s.id] = evaluacion.results?.[s.id] || Array(nq).fill(true);
        });
        return init;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evaluacion.results, cursoStudents, evaluacion.totalQuestions, questions.length]);

    // Local overrides for unsaved changes (keyed by studentId)
    const [localOverrides, setLocalOverrides] = useState({});

    // Merged view: base + local overrides
    const localResults = useMemo(() => {
        const merged = { ...baseResults };
        Object.entries(localOverrides).forEach(([sid, answers]) => {
            merged[sid] = answers;
        });
        return merged;
    }, [baseResults, localOverrides]);

    // Debounced save per student
    const pendingSaves = useRef({});
    const timerRefs = useRef({});
    const [savedStudents, setSavedStudents] = useState(new Set());

    const debouncedSave = useCallback((studentId, answers) => {
        pendingSaves.current[studentId] = answers;
        if (timerRefs.current[studentId]) {
            clearTimeout(timerRefs.current[studentId]);
        }
        timerRefs.current[studentId] = setTimeout(async () => {
            await saveResults(evaluacion.id, studentId, pendingSaves.current[studentId]);
            delete pendingSaves.current[studentId];
            delete timerRefs.current[studentId];
            setSavedStudents(prev => { const s = new Set(prev); s.add(studentId); return s; });
            setTimeout(() => setSavedStudents(prev => { const s = new Set(prev); s.delete(studentId); return s; }), 1500);
        }, 500);
    }, [evaluacion.id, saveResults]);

    // Flush pending saves on unmount
    useEffect(() => {
        return () => {
            Object.entries(pendingSaves.current).forEach(([sid, answers]) => {
                saveResults(evaluacion.id, sid, answers);
            });
            Object.values(timerRefs.current).forEach(clearTimeout);
        };
    }, [evaluacion.id, saveResults]);

    const handleCellClick = (studentId, qIndex) => {
        setLocalOverrides(prev => {
            const nq = evaluacion.totalQuestions ?? questions.length;
            const current = prev[studentId] || localResults[studentId] || Array(nq).fill(true);
            const newAnswers = [...current];
            // Cycle: true → false → null → true
            if (newAnswers[qIndex] === true) {
                newAnswers[qIndex] = false;
            } else if (newAnswers[qIndex] === false) {
                newAnswers[qIndex] = null;
            } else {
                newAnswers[qIndex] = true;
            }
            debouncedSave(studentId, newAnswers);
            return { ...prev, [studentId]: newAnswers };
        });
    };

    // Score data for a student: earned pts, total pts, logro %, nota
    const getScoreData = (studentId) => {
        const answers = localResults[studentId];
        if (!answers) return null;
        if (!answers.some(a => a !== null && a !== undefined)) return null;
        const tp = questions.reduce((s, q) => s + (q.puntaje ?? 1), 0);
        const earned = questions.reduce((s, q, i) =>
            answers[i] === true ? s + (q.puntaje ?? 1) : s, 0);
        const nota = calcularNota(earned, tp, evaluacion.exigencia);
        return { earnedPts: earned, totalPts: tp, logro: tp ? Math.round(earned / tp * 100) : null, nota };
    };

    const totalPts = questions.reduce((s, q) => s + (q.puntaje ?? 1), 0);

    // Course summary (computed from current localResults)
    const summary = useMemo(() => {
        const notas = cursoStudents
            .map(s => getScoreData(s.id)?.nota)
            .filter(n => n !== null && n !== undefined);
        if (!notas.length) return null;
        const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
        const aprobados = notas.filter(n => n >= 4).length;
        return { promedio: Math.round(promedio * 10) / 10, aprobados, total: notas.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localResults, cursoStudents]);

    const isApproved = evaluacion.status === 'approved';

    const exportCSV = () => {
        const headers = [
            'Nombre',
            ...questions.map((_, i) => `P${i + 1}`),
            'Puntaje Obtenido',
            `Puntaje Máx (${totalPts})`,
            'Logro %',
            'Nota',
        ];
        const rows = cursoStudents.map(s => {
            const answers = localResults[s.id] || [];
            const score   = getScoreData(s.id);
            return [
                `"${(s.fullName || '').replace(/"/g, '""')}"`,
                ...questions.map((_, i) =>
                    answers[i] === true ? '1' : answers[i] === false ? '0' : ''),
                score ? score.earnedPts : '',
                totalPts,
                score ? `${score.logro}%` : '',
                score?.nota != null ? score.nota.toFixed(1) : '',
            ].join(',');
        });
        const csv  = [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${(evaluacion.name || 'evaluacion').replace(/[^a-zA-Z0-9_\-]/g, '_')}_${evaluacion.curso}_resultados.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isApproved) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Lock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Resultados bloqueados</p>
                <p className="text-xs text-slate-400 mt-1">
                    {evaluacion.status === 'rejected'
                        ? 'Esta evaluacion fue rechazada. Corrige y reenvia para aprobacion.'
                        : 'La evaluacion debe ser aprobada por UTP antes de ingresar resultados.'}
                </p>
            </div>
        );
    }

    if (cursoStudents.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No hay alumnos registrados en {evaluacion.curso}</p>
                <p className="text-xs text-slate-400 mt-1">Verifica que el curso tenga alumnos registrados en Inspectoria</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-600 min-w-[200px]">
                                Alumno
                            </th>
                            {questions.map((q, idx) => {
                                const oa = getOAByCode(q.oaCode);
                                return (
                                    <th
                                        key={idx}
                                        className="px-1 py-3 text-center text-xs font-semibold text-slate-600 min-w-[44px]"
                                        title={oa ? `${q.oaCode}: ${oa.description}` : q.oaCode}
                                    >
                                        <span className="block">P{q.number}</span>
                                        <span className="block text-[9px] font-normal text-slate-400 truncate max-w-[60px] mx-auto">
                                            {q.oaCode ? q.oaCode.split('-')[1] : '—'}
                                        </span>
                                    </th>
                                );
                            })}
                            <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 min-w-[64px] bg-slate-100">
                                <span className="block">Puntaje</span>
                                <span className="block text-[9px] font-normal text-slate-400">/{totalPts} pts</span>
                            </th>
                            <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 min-w-[52px] bg-indigo-50">
                                <span className="block">Nota</span>
                                <span className="block text-[9px] font-normal text-slate-400">1.0–7.0</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {cursoStudents.map((student, sIdx) => {
                            const answers = localResults[student.id] || [];
                            const score = getScoreData(student.id);
                            const rowBg = sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

                            return (
                                <tr key={student.id} className={rowBg}>
                                    <td className="sticky left-0 z-10 px-4 py-2.5 text-slate-800 font-medium text-xs whitespace-nowrap"
                                        style={{ backgroundColor: sIdx % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.5)' }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="block truncate max-w-[165px]">{student.fullName}</span>
                                            {savedStudents.has(student.id) && (
                                                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                            )}
                                        </div>
                                    </td>
                                    {questions.map((_, qIdx) => {
                                        const val = answers[qIdx];
                                        return (
                                            <td key={qIdx} className="px-1 py-1 text-center">
                                                <button
                                                    onClick={() => handleCellClick(student.id, qIdx)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all duration-150 ${
                                                        val === true
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : val === false
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {val === true ? <Check className="w-4 h-4" /> : val === false ? <X className="w-4 h-4" /> : <Minus className="w-3 h-3" />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    {/* Puntaje */}
                                    <td className="px-3 py-2.5 text-center bg-slate-50/80">
                                        {score ? (
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-[11px] font-bold text-slate-700">{score.earnedPts}/{score.totalPts}</span>
                                                <span className="text-[10px] text-slate-400">{score.logro}%</span>
                                            </div>
                                        ) : <span className="text-[10px] text-slate-300">—</span>}
                                    </td>
                                    {/* Nota */}
                                    <td className="px-3 py-2.5 text-center bg-indigo-50/60">
                                        {score?.nota != null ? (
                                            <span className={`text-base font-extrabold ${notaColor(score.nota)}`}>
                                                {score.nota.toFixed(1)}
                                            </span>
                                        ) : <span className="text-[10px] text-slate-300">—</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Resumen de notas */}
            {summary && (
                <div className="px-4 py-3 border-t border-slate-100 bg-indigo-50/40 flex items-center gap-6 flex-wrap">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Promedio</span>
                        <span className={`text-lg font-extrabold ${notaColor(summary.promedio)}`}>{summary.promedio.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Aprobados</span>
                        <span className="text-lg font-extrabold text-emerald-700">{summary.aprobados}<span className="text-xs font-medium text-slate-400">/{summary.total}</span></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Reprobados</span>
                        <span className="text-lg font-extrabold text-red-600">{summary.total - summary.aprobados}<span className="text-xs font-medium text-slate-400">/{summary.total}</span></span>
                    </div>
                    <div className="ml-auto text-right">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Escala</span>
                        <span className="text-[11px] text-slate-500">
                            Exigencia {evaluacion.exigencia ?? 60}% → Nota 4.0 &nbsp;·&nbsp; 1.0–7.0
                        </span>
                    </div>
                </div>
            )}

            {/* Leyenda + exportar */}
            <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-emerald-100 rounded inline-flex items-center justify-center"><Check className="w-3 h-3 text-emerald-700" /></span> Correcta</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-100 rounded inline-flex items-center justify-center"><X className="w-3 h-3 text-red-700" /></span> Incorrecta</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-slate-100 rounded inline-flex items-center justify-center"><Minus className="w-3 h-3 text-slate-300" /></span> Sin marcar</span>
                <span className="ml-auto flex items-center gap-3">
                    <span>Auto-guardado activado</span>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Download className="w-3 h-3" /> Exportar CSV
                    </button>
                </span>
            </div>
        </div>
    );
}

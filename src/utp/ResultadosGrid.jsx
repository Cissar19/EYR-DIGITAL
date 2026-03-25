import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, X, Minus } from 'lucide-react';
import { useStudents } from '../context/StudentsContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { getOAByCode } from '../data/objetivosAprendizaje';

/**
 * ResultadosGrid: clickable grid for marking student answers
 * Rows = students in the evaluacion's curso
 * Columns = questions P1..PN + "Logro" column
 * Cells cycle: null (gray) → true (green ✓) → false (red ✗) → null
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
    const baseResults = useMemo(() => {
        const init = {};
        cursoStudents.forEach(s => {
            init[s.id] = evaluacion.results?.[s.id] || Array(evaluacion.totalQuestions).fill(null);
        });
        return init;
    }, [evaluacion.results, cursoStudents, evaluacion.totalQuestions]);

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

    const debouncedSave = useCallback((studentId, answers) => {
        pendingSaves.current[studentId] = answers;
        if (timerRefs.current[studentId]) {
            clearTimeout(timerRefs.current[studentId]);
        }
        timerRefs.current[studentId] = setTimeout(() => {
            saveResults(evaluacion.id, studentId, pendingSaves.current[studentId]);
            delete pendingSaves.current[studentId];
            delete timerRefs.current[studentId];
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
            const current = prev[studentId] || localResults[studentId] || Array(evaluacion.totalQuestions).fill(null);
            const newAnswers = [...current];
            // Cycle: null → true → false → null
            if (newAnswers[qIndex] === null || newAnswers[qIndex] === undefined) {
                newAnswers[qIndex] = true;
            } else if (newAnswers[qIndex] === true) {
                newAnswers[qIndex] = false;
            } else {
                newAnswers[qIndex] = null;
            }
            debouncedSave(studentId, newAnswers);
            return { ...prev, [studentId]: newAnswers };
        });
    };

    // Calculate logro % for a student
    const getLogro = (studentId) => {
        const answers = localResults[studentId];
        if (!answers) return null;
        const answered = answers.filter(a => a !== null && a !== undefined);
        if (answered.length === 0) return null;
        const correct = answered.filter(a => a === true).length;
        return Math.round((correct / answered.length) * 100);
    };

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
                            {evaluacion.questions.map((q, idx) => {
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
                            <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 min-w-[60px] bg-slate-100">
                                Logro
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {cursoStudents.map((student, sIdx) => {
                            const answers = localResults[student.id] || [];
                            const logro = getLogro(student.id);

                            return (
                                <tr key={student.id} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="sticky left-0 z-10 px-4 py-2.5 text-slate-800 font-medium text-xs whitespace-nowrap"
                                        style={{ backgroundColor: sIdx % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.5)' }}
                                    >
                                        <span className="block truncate max-w-[180px]">{student.fullName}</span>
                                    </td>
                                    {evaluacion.questions.map((_, qIdx) => {
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
                                                    {val === true ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : val === false ? (
                                                        <X className="w-4 h-4" />
                                                    ) : (
                                                        <Minus className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-2.5 text-center">
                                        {logro !== null ? (
                                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                                                logro >= 70
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : logro >= 40
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-red-100 text-red-700'
                                            }`}>
                                                {logro}%
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-emerald-100 rounded inline-flex items-center justify-center"><Check className="w-3 h-3 text-emerald-700" /></span> Correcta</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-100 rounded inline-flex items-center justify-center"><X className="w-3 h-3 text-red-700" /></span> Incorrecta</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-slate-100 rounded inline-flex items-center justify-center"><Minus className="w-3 h-3 text-slate-300" /></span> Sin marcar</span>
                <span className="ml-auto">Auto-guardado activado</span>
            </div>
        </div>
    );
}

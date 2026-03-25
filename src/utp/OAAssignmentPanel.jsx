import React, { useState, useMemo } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { getOAsForCursoAsignatura, getEjesForAsignatura } from '../data/objetivosAprendizaje';

export default function OAAssignmentPanel({ evaluacion }) {
    const { updateEvaluacion } = useEvaluaciones();
    const [saving, setSaving] = useState(false);
    const [questions, setQuestions] = useState(() =>
        evaluacion.questions.map(q => ({ ...q }))
    );

    const availableOAs = useMemo(() => {
        return getOAsForCursoAsignatura(evaluacion.asignatura, evaluacion.curso);
    }, [evaluacion.asignatura, evaluacion.curso]);

    const ejes = useMemo(() => {
        return getEjesForAsignatura(evaluacion.asignatura, evaluacion.curso);
    }, [evaluacion.asignatura, evaluacion.curso]);

    const oasByEje = useMemo(() => {
        const map = {};
        ejes.forEach(eje => {
            map[eje] = availableOAs.filter(oa => oa.eje === eje);
        });
        return map;
    }, [availableOAs, ejes]);

    const assignedCount = questions.filter(q => q.oaCode).length;

    const handleOAChange = (index, oaCode) => {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, oaCode } : q));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateEvaluacion(evaluacion.id, { questions });
        } finally {
            setSaving(false);
        }
    };

    // Check if anything changed from the saved version
    const hasChanges = questions.some((q, i) => q.oaCode !== evaluacion.questions[i]?.oaCode);

    if (availableOAs.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No hay OAs disponibles para {evaluacion.asignatura} — {evaluacion.curso}</p>
                <p className="text-xs text-slate-400 mt-1">Verifica que la asignatura y curso tengan OAs registrados</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with counter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${assignedCount === questions.length ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            {assignedCount} de {questions.length} preguntas con OA asignado
                        </p>
                        {assignedCount < questions.length && (
                            <p className="text-xs text-slate-400">Selecciona un OA para cada pregunta</p>
                        )}
                    </div>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar OAs'}
                    </button>
                )}
            </div>

            {/* Question list */}
            <div className="space-y-2">
                {questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${q.oaCode ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                            <span className={`text-xs font-bold ${q.oaCode ? 'text-indigo-600' : 'text-slate-600'}`}>P{q.number}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <select
                                value={q.oaCode}
                                onChange={e => handleOAChange(idx, e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                            >
                                <option value="">Seleccionar OA...</option>
                                {ejes.map(eje => (
                                    <optgroup key={eje} label={eje}>
                                        {oasByEje[eje].map(oa => (
                                            <option key={oa.code} value={oa.code}>
                                                {oa.code} — {oa.description.slice(0, 80)}{oa.description.length > 80 ? '...' : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {q.oaCode && (
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                    {availableOAs.find(oa => oa.code === q.oaCode)?.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

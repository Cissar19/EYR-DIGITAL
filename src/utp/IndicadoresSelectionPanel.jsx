import React, { useState, useMemo, useCallback } from 'react';
import { Save, CheckSquare, Square, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { getIndicadoresForOA, getMinIndicadores, validateIndicadorSelection } from '../data/indicadoresAprendizaje';
import { getOAByCode } from '../data/objetivosAprendizaje';

export default function IndicadoresSelectionPanel({ evaluacion }) {
    const { updateEvaluacion } = useEvaluaciones();
    const [saving, setSaving] = useState(false);
    const [selections, setSelections] = useState(() => {
        // Initialize from saved data or empty
        return evaluacion.selectedIndicadores || {};
    });

    // Extract unique OA codes from questions
    const uniqueOAs = useMemo(() => {
        const codes = new Set();
        (evaluacion.questions || []).forEach(q => {
            if (q.oaCode) codes.add(q.oaCode);
        });
        return [...codes].sort();
    }, [evaluacion.questions]);

    // Build validation state for each OA
    const oaStates = useMemo(() => {
        return uniqueOAs.map(oaCode => {
            const indicadores = getIndicadoresForOA(oaCode);
            const selected = selections[oaCode] || [];
            const validation = validateIndicadorSelection(oaCode, selected);
            const oaInfo = getOAByCode(oaCode);
            return {
                oaCode,
                oaInfo,
                indicadores,
                selected,
                ...validation,
            };
        });
    }, [uniqueOAs, selections]);

    // Check if all OAs pass validation
    const allValid = oaStates.every(s => s.valid);

    // Check if anything changed from saved version
    const hasChanges = useMemo(() => {
        const saved = evaluacion.selectedIndicadores || {};
        if (uniqueOAs.length !== Object.keys(saved).length) {
            // Check if any OA was removed — need to clean up
            const savedKeys = Object.keys(saved);
            if (savedKeys.some(k => !uniqueOAs.includes(k))) return true;
        }
        for (const oaCode of uniqueOAs) {
            const current = (selections[oaCode] || []).slice().sort();
            const prev = (saved[oaCode] || []).slice().sort();
            if (current.length !== prev.length) return true;
            if (current.some((c, i) => c !== prev[i])) return true;
        }
        return false;
    }, [selections, evaluacion.selectedIndicadores, uniqueOAs]);

    const toggleIndicador = useCallback((oaCode, indicadorCode) => {
        setSelections(prev => {
            const current = prev[oaCode] || [];
            const next = current.includes(indicadorCode)
                ? current.filter(c => c !== indicadorCode)
                : [...current, indicadorCode];
            return { ...prev, [oaCode]: next };
        });
    }, []);

    const selectAllForOA = useCallback((oaCode) => {
        const indicadores = getIndicadoresForOA(oaCode);
        setSelections(prev => ({
            ...prev,
            [oaCode]: indicadores.map(i => i.code),
        }));
    }, []);

    const deselectAllForOA = useCallback((oaCode) => {
        setSelections(prev => ({
            ...prev,
            [oaCode]: [],
        }));
    }, []);

    const handleSave = async () => {
        if (!allValid) {
            toast.error('Selecciona al menos el 70% de los indicadores para cada OA');
            return;
        }
        setSaving(true);
        try {
            // Only save indicadores for OAs currently in questions (clean up removed OAs)
            const cleanedSelections = {};
            for (const oaCode of uniqueOAs) {
                cleanedSelections[oaCode] = selections[oaCode] || [];
            }
            await updateEvaluacion(evaluacion.id, { selectedIndicadores: cleanedSelections });
        } finally {
            setSaving(false);
        }
    };

    // No OAs assigned yet
    if (uniqueOAs.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Primero asigna OAs a las preguntas</p>
                <p className="text-xs text-slate-400 mt-1">Ve a la pestaña "Asignar OAs" para asociar un OA a cada pregunta</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with global status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${allValid ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            Indicadores de Evaluacion — {oaStates.filter(s => s.valid).length} de {oaStates.length} OAs completos
                        </p>
                        <p className="text-xs text-slate-400">
                            Selecciona al menos el 70% de los indicadores para cada OA
                        </p>
                    </div>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving || !allValid}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Indicadores'}
                    </button>
                )}
            </div>

            {/* OA cards */}
            <div className="space-y-3">
                {oaStates.map(state => {
                    const { oaCode, oaInfo, indicadores, selected, valid, total, required } = state;
                    const hasIndicadores = indicadores.length > 0;
                    const pct = total > 0 ? Math.round((selected.length / total) * 100) : 100;
                    const allSelected = selected.length === total && total > 0;

                    return (
                        <div key={oaCode} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {/* OA header */}
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            valid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {oaCode}
                                        </span>
                                        <p className="text-sm text-slate-600 truncate">
                                            {oaInfo?.description || 'OA sin descripcion'}
                                        </p>
                                    </div>
                                    {hasIndicadores && (
                                        <button
                                            onClick={() => allSelected ? deselectAllForOA(oaCode) : selectAllForOA(oaCode)}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap ml-3"
                                        >
                                            {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                        </button>
                                    )}
                                </div>

                                {/* Progress bar */}
                                {hasIndicadores && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-500">
                                                {selected.length} de {total} seleccionados (minimo {required})
                                            </span>
                                            <span className={`text-xs font-medium ${valid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {pct}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    valid ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Indicadores list */}
                            <div className="px-5 py-3">
                                {!hasIndicadores ? (
                                    <div className="flex items-center gap-2 py-2 text-slate-400">
                                        <Info className="w-4 h-4" />
                                        <span className="text-sm">No hay indicadores definidos para este OA (se valida automaticamente)</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {indicadores.map(ind => {
                                            const isSelected = selected.includes(ind.code);
                                            return (
                                                <button
                                                    key={ind.code}
                                                    onClick={() => toggleIndicador(oaCode, ind.code)}
                                                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-indigo-50 border border-indigo-200'
                                                            : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <span className={`text-[11px] font-mono ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                            {ind.code}
                                                        </span>
                                                        <p className={`text-sm ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>
                                                            {ind.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom save button for long lists */}
            {hasChanges && oaStates.length > 2 && (
                <div className="sticky bottom-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || !allValid}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {!allValid && <AlertTriangle className="w-4 h-4" />}
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : allValid ? 'Guardar Indicadores' : 'Completa el 70% para guardar'}
                    </button>
                </div>
            )}
        </div>
    );
}

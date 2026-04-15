import React, { useState } from 'react';
import { Download, Loader2, Info } from 'lucide-react';
import { ASIGNATURAS, getOAByCode } from '../data/objetivosAprendizaje';
import { getIndicadoresForOA } from '../data/indicadoresAprendizaje';
import { exportarPautaEspecificacion } from '../lib/pautaEspecificacionExport';
import { toast } from 'sonner';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

function getClave(q) {
    if (q.tipo === 'seleccion_multiple') return q.respuestaCorrecta?.toUpperCase() || '—';
    if (q.tipo === 'desarrollo')         return q.respuestaCorrecta || '(pauta del profesor)';
    if (q.tipo === 'verdadero_falso')    return (q.items || []).map((it, i) => `${i+1}) ${it.respuesta || '?'}`).join('  ');
    if (q.tipo === 'unir')               return (q.items || []).map((_, i) => `${i+1}→${String.fromCharCode(65+i)}`).join('  ');
    if (q.tipo === 'completar')          return (q.items || []).map((it, i) => `${i+1}) ${it.respuesta || '?'}`).join('  ');
    return '—';
}

function getItemLabel(q, questions) {
    const tiposEnOrden = [];
    questions.forEach(qq => { if (!tiposEnOrden.includes(qq.tipo)) tiposEnOrden.push(qq.tipo); });
    const itemIdx   = tiposEnOrden.indexOf(q.tipo);
    const itemRoman = ROMAN[itemIdx] ?? String(itemIdx + 1);
    const tipoGroup = questions.filter(qq => qq.tipo === q.tipo);
    const qIdx      = tipoGroup.findIndex(qq => qq.number === q.number);
    const subLetter = tipoGroup.length > 1 ? String.fromCharCode(97 + qIdx) : null;
    return subLetter ? `Ítem ${itemRoman} ${subLetter}` : `Ítem ${itemRoman}`;
}

export default function PautaEspecificacion({ evaluacion }) {
    const [exporting, setExporting] = useState(false);

    const questions = evaluacion.questions || [];
    const asigName  = ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name || evaluacion.asignatura || '';
    const totalPts  = questions.reduce((s, q) => s + (q.puntaje ?? 1), 0);

    // OA codes en orden de primera aparición
    const oaCodes = [];
    questions.forEach(q => {
        const k = q.oaCode || '__sin_oa__';
        if (!oaCodes.includes(k)) oaCodes.push(k);
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportarPautaEspecificacion({ evaluacion });
        } catch {
            toast.error('Error al exportar la pauta de especificación');
        } finally {
            setExporting(false);
        }
    };

    if (questions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Esta evaluación no tiene preguntas</p>
            </div>
        );
    }

    const sinHabilidad = questions.some(q => !q.habilidad);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-slate-500">
                    Pauta de especificación · {questions.length} preguntas · {totalPts} pts totales
                </p>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {exporting
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />}
                    {exporting ? 'Generando…' : 'Descargar .docx'}
                </button>
            </div>

            {/* Aviso si faltan habilidades */}
            {sinHabilidad && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Algunas preguntas no tienen habilidad asignada. Puedes asignarlas en la pestaña
                    <span className="font-semibold ml-1">Preguntas</span>.
                </div>
            )}

            {/* Vista previa del documento */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden max-w-3xl mx-auto">
                <div className="p-8 space-y-4">

                    {/* Encabezado */}
                    <div className="text-xs text-slate-700 space-y-0.5">
                        <p className="font-semibold">Centro Educacional Ernesto Yáñez Rivera</p>
                        <p>Unidad Técnica Pedagógica</p>
                        <p>Asignatura {asigName}</p>
                        {evaluacion.createdBy?.name && (
                            <p>Profesor/a {evaluacion.createdBy.name}</p>
                        )}
                    </div>

                    {/* Título */}
                    <div className="text-center space-y-0.5 py-1">
                        <h1 className="font-bold text-sm uppercase underline tracking-wide">
                            PAUTA DE ESPECIFICACIÓN EVALUACIÓN
                        </h1>
                        <p className="font-bold text-sm">{evaluacion.name || 'Sin título'}</p>
                        <p className="font-bold text-sm">{evaluacion.curso}</p>
                    </div>

                    {/* Descripción de OAs */}
                    {oaCodes.filter(c => c !== '__sin_oa__').map(code => {
                        const oa    = getOAByCode(code);
                        const short = code.includes('-') ? code.split('-').slice(1).join('-') : code;
                        return (
                            <div key={code} className="border border-slate-300 rounded px-3 py-2 text-xs text-slate-700">
                                <span className="font-bold">{short}</span>{' '}
                                {oa?.description || '(sin descripción)'}
                            </div>
                        );
                    })}

                    {/* Tabla principal */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-slate-400">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-400 px-3 py-2 text-left font-semibold w-[35%]">
                                        Indicadores de logro
                                    </th>
                                    <th className="border border-slate-400 px-3 py-2 text-center font-semibold w-[12%]">
                                        Habilidad
                                    </th>
                                    <th className="border border-slate-400 px-3 py-2 text-center font-semibold w-[15%]">
                                        N° de pregunta
                                    </th>
                                    <th className="border border-slate-400 px-3 py-2 text-left font-semibold w-[28%]">
                                        Clave
                                    </th>
                                    <th className="border border-slate-400 px-3 py-2 text-center font-semibold w-[10%]">
                                        Puntaje
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {oaCodes.map(oaCode => {
                                    const oaQs = oaCode === '__sin_oa__'
                                        ? questions.filter(q => !q.oaCode)
                                        : questions.filter(q => q.oaCode === oaCode);
                                    if (oaQs.length === 0) return null;

                                    const selectedCodes = evaluacion.selectedIndicadores?.[oaCode] || [];
                                    const allInd        = oaCode !== '__sin_oa__' ? getIndicadoresForOA(oaCode) : [];
                                    const selectedInd   = allInd.filter(i => selectedCodes.includes(i.code));

                                    return oaQs.map((q, idx) => (
                                        <tr key={q.number}>
                                            {idx === 0 && (
                                                <td
                                                    rowSpan={oaQs.length}
                                                    className="border border-slate-400 px-3 py-2 align-top"
                                                >
                                                    {selectedInd.length > 0 ? (
                                                        <ul className="space-y-1.5">
                                                            {selectedInd.map(ind => (
                                                                <li key={ind.code} className="text-slate-700 leading-snug">
                                                                    {ind.description}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Sin indicadores asignados</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="border border-slate-400 px-3 py-2 text-center">
                                                {q.habilidad
                                                    ? <span className="font-medium">{q.habilidad}</span>
                                                    : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="border border-slate-400 px-3 py-2 text-center font-medium">
                                                {getItemLabel(q, questions)}
                                            </td>
                                            <td className="border border-slate-400 px-3 py-2 text-slate-700 leading-snug">
                                                {getClave(q)}
                                            </td>
                                            <td className="border border-slate-400 px-3 py-2 text-center font-semibold">
                                                {q.puntaje ?? 1}
                                            </td>
                                        </tr>
                                    ));
                                })}

                                {/* Fila total */}
                                <tr className="bg-slate-50">
                                    <td className="border border-slate-400 px-3 py-2" colSpan={3} />
                                    <td className="border border-slate-400 px-3 py-2 text-right font-bold text-slate-800">
                                        {totalPts} puntos en total
                                    </td>
                                    <td className="border border-slate-400 px-3 py-2 text-center font-bold text-slate-800">
                                        {totalPts}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

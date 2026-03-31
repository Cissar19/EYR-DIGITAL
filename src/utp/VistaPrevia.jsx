import React, { useState, useEffect } from 'react';
import { Printer, Download, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ASIGNATURAS } from '../data/objetivosAprendizaje';
import { exportarPrueba } from '../lib/docxExport';
import { cargarFormato, DEFAULT_FORMATO } from './formatoConfig';
import { toast } from 'sonner';

const TIPOS_CON_ITEMS = ['verdadero_falso', 'unir', 'completar'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function completarTexto(texto) {
    // Reemplaza ___ por una línea visual
    return texto.split('___').reduce((acc, part, i) => {
        if (i === 0) return [part];
        return [...acc, <span key={i} className="inline-block border-b border-slate-600 w-20 mx-0.5" />, part];
    }, []);
}

export default function VistaPrevia({ evaluacion }) {
    const [exporting,   setExporting]   = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    const [formato,     setFormato]     = useState(DEFAULT_FORMATO);

    useEffect(() => {
        cargarFormato().then(setFormato);
    }, []);

    const preguntas = (evaluacion.questions || []).filter(
        q => q.enunciado || TIPOS_CON_ITEMS.includes(q.tipo)
    );

    // Agrupar por tipo en orden de aparición
    const tiposEnOrden = [];
    const gruposPorTipo = {};
    for (const p of preguntas) {
        if (!gruposPorTipo[p.tipo]) {
            gruposPorTipo[p.tipo] = [];
            tiposEnOrden.push(p.tipo);
        }
        gruposPorTipo[p.tipo].push(p);
    }

    const asignaturaLabel = ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name || evaluacion.asignatura;
    const instrucciones = evaluacion.instrucciones?.trim()
        || formato.instruccionesGenerales;

    let fechaLabel = evaluacion.date || '';
    try {
        const [y, m, d] = evaluacion.date.split('-');
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio',
                       'agosto','septiembre','octubre','noviembre','diciembre'];
        fechaLabel = `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
    } catch { /* formato inválido, usar valor original */ }

    const totalPuntos = preguntas.reduce((acc, p) => {
        if (TIPOS_CON_ITEMS.includes(p.tipo)) return acc + (p.items?.length || 1);
        return acc + 1;
    }, 0);

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportarPrueba({
                nombre:      evaluacion.name,
                asignatura:  asignaturaLabel,
                curso:       evaluacion.curso,
                fecha:       evaluacion.date,
                profesor:    evaluacion.createdBy?.name || '',
                instrucciones: evaluacion.instrucciones,
                preguntas,
            });
        } catch {
            toast.error('Error al exportar el documento');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500">Vista previa del documento para estudiantes</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAnswers(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-xl transition-colors ${
                            showAnswers
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {showAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {showAnswers ? 'Ocultar respuestas' : 'Ver clave'}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        {exporting ? 'Exportando…' : 'Descargar .docx'}
                    </button>
                </div>
            </div>

            {/* Hoja de prueba */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden max-w-2xl mx-auto print:shadow-none print:border-none print:max-w-none">
                <div className="p-8 space-y-4">

                    {/* Encabezado escuela */}
                    <div className="text-center space-y-0.5">
                        <p className="font-extrabold text-[#1B3A8C] text-sm tracking-wide uppercase">
                            Centro Educacional Ernesto Yáñez Rivera
                        </p>
                        <p className="text-xs text-slate-500">Huechuraba · Santiago</p>
                    </div>

                    {/* Título */}
                    <div className="text-center space-y-0.5">
                        <h1 className="font-bold text-[#1B3A8C] text-base uppercase tracking-wide">
                            {evaluacion.name || 'Sin título'}
                        </h1>
                        <p className="text-xs text-slate-500 italic">{asignaturaLabel} &nbsp;|&nbsp; {evaluacion.curso}</p>
                        {evaluacion.createdBy?.name && (
                            <p className="text-xs text-slate-500">Profesor(a): {evaluacion.createdBy.name}</p>
                        )}
                    </div>

                    {/* Tabla datos alumno */}
                    <table className="w-full border-collapse text-xs border border-[#1B3A8C]/30">
                        <tbody>
                            <tr>
                                <td className="border border-[#1B3A8C]/20 bg-[#E8EDF7] font-bold text-[#1B3A8C] px-2 py-1.5 w-[15%]">Nombre:</td>
                                <td className="border border-[#1B3A8C]/20 px-2 py-1.5 w-[35%]">&nbsp;</td>
                                <td className="border border-[#1B3A8C]/20 bg-[#E8EDF7] font-bold text-[#1B3A8C] px-2 py-1.5 w-[15%]">Fecha:</td>
                                <td className="border border-[#1B3A8C]/20 px-2 py-1.5 w-[35%]">{fechaLabel}</td>
                            </tr>
                            <tr>
                                <td className="border border-[#1B3A8C]/20 bg-[#E8EDF7] font-bold text-[#1B3A8C] px-2 py-1.5">Curso:</td>
                                <td className="border border-[#1B3A8C]/20 px-2 py-1.5">{evaluacion.curso}</td>
                                <td className="border border-[#1B3A8C]/20 bg-[#E8EDF7] font-bold text-[#1B3A8C] px-2 py-1.5">Puntaje:</td>
                                <td className="border border-[#1B3A8C]/20 px-2 py-1.5">_______ / {totalPuntos} pts</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Instrucciones generales */}
                    <p className="text-xs italic text-slate-500 border-l-2 border-[#1B3A8C]/20 pl-3">
                        {instrucciones}
                    </p>

                    {preguntas.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-8">
                            Agrega preguntas en la pestaña <span className="font-semibold">Preguntas</span> para ver la vista previa.
                        </p>
                    )}

                    {/* Secciones */}
                    {tiposEnOrden.map((tipo, sIdx) => {
                        const secItems = gruposPorTipo[tipo];
                        const roman = ROMAN[sIdx] || String(sIdx + 1);

                        return (
                            <div key={tipo} className="space-y-2">
                                {/* Encabezado sección */}
                                <div className="border-b border-[#1B3A8C]/20 pb-1">
                                    <p className="font-bold text-[#1B3A8C] text-xs uppercase tracking-wide">
                                        {roman}.&nbsp;&nbsp;{formato.titulosPorTipo[tipo] || tipo.toUpperCase()}
                                    </p>
                                    {formato.instruccionesPorTipo[tipo] && !['verdadero_falso','unir','completar'].includes(tipo) && (
                                        <p className="text-[11px] italic text-slate-500 mt-0.5">
                                            {formato.instruccionesPorTipo[tipo]}
                                            {tipo === 'seleccion_multiple' && ` (${secItems.length} pregunta${secItems.length !== 1 ? 's' : ''})`}
                                        </p>
                                    )}
                                </div>

                                {/* ── Selección múltiple ── */}
                                {tipo === 'seleccion_multiple' && (
                                    <div className="space-y-3">
                                        {secItems.map((p, qi) => (
                                            <div key={p.number}>
                                                <p className="text-xs font-medium text-slate-800">
                                                    {qi + 1}.&nbsp;&nbsp;{p.enunciado}
                                                </p>
                                                {p.imagen?.url && (
                                                    <img src={p.imagen.url} alt="" className="max-h-32 my-1 object-contain" />
                                                )}
                                                <div className="ml-5 mt-1 space-y-0.5">
                                                    {['a','b','c','d'].filter(l => p.alternativas?.[l]).map(l => {
                                                        const isCorrect = showAnswers && p.respuestaCorrecta === l;
                                                        return (
                                                            <p key={l} className={`text-xs ${isCorrect ? 'font-bold text-emerald-700' : 'text-slate-700'}`}>
                                                                {isCorrect && '✓ '}{l})&nbsp;&nbsp;{p.alternativas[l]}
                                                            </p>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Desarrollo ── */}
                                {tipo === 'desarrollo' && (
                                    <div className="space-y-4">
                                        {secItems.map((p, qi) => (
                                            <div key={p.number}>
                                                <p className="text-xs font-medium text-slate-800">
                                                    {qi + 1}.&nbsp;&nbsp;{p.enunciado}
                                                </p>
                                                {p.imagen?.url && (
                                                    <img src={p.imagen.url} alt="" className="max-h-32 my-1 object-contain" />
                                                )}
                                                {showAnswers && p.respuestaCorrecta ? (
                                                    <p className="ml-5 mt-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
                                                        {p.respuestaCorrecta}
                                                    </p>
                                                ) : (
                                                    <div className="ml-5 mt-2 space-y-2.5">
                                                        <div className="border-b border-slate-300 w-full" />
                                                        <div className="border-b border-slate-300 w-full" />
                                                        <div className="border-b border-slate-300 w-full" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Verdadero o Falso ── */}
                                {tipo === 'verdadero_falso' && (
                                    <div className="space-y-3">
                                        {secItems.map((p) => (
                                            <div key={p.number}>
                                                {p.enunciado && (
                                                    <p className="text-xs font-medium text-slate-800 mb-1">{p.enunciado}</p>
                                                )}
                                                {(p.instruccionItems || formato.instruccionesPorTipo.verdadero_falso) && (
                                                    <p className="text-[11px] italic text-slate-500 mb-1.5 ml-1">{p.instruccionItems || formato.instruccionesPorTipo.verdadero_falso}</p>
                                                )}
                                                <div className="space-y-1 ml-1">
                                                    {(p.items || []).map((item, idx) => (
                                                        <div key={item.id} className="flex items-center gap-2">
                                                            <span className="text-[11px] text-slate-400 w-5 text-right font-mono shrink-0">{idx + 1}.</span>
                                                            <span className="flex-1 text-xs text-slate-700">{item.texto}</span>
                                                            {showAnswers ? (
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${item.respuesta === 'V' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {item.respuesta}
                                                                </span>
                                                            ) : (
                                                                <div className="flex gap-1 shrink-0">
                                                                    <span className="border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-500">V</span>
                                                                    <span className="border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-500">F</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Unir ── */}
                                {tipo === 'unir' && (
                                    <div className="space-y-3">
                                        {secItems.map((p) => (
                                            <div key={p.number}>
                                                {p.enunciado && (
                                                    <p className="text-xs font-medium text-slate-800 mb-1">{p.enunciado}</p>
                                                )}
                                                {p.instruccionItems && (
                                                    <p className="text-[11px] italic text-slate-500 mb-1.5 ml-1">{p.instruccionItems}</p>
                                                )}
                                                <div className="grid grid-cols-2 gap-x-8 ml-1">
                                                    {/* Columna A */}
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-[#1B3A8C]/60 uppercase tracking-wide mb-1">Columna A</p>
                                                        {(p.items || []).map((item, idx) => (
                                                            <div key={item.id} className="flex items-center gap-1.5">
                                                                <span className="text-[11px] text-slate-400 font-mono w-4 shrink-0">{idx + 1}.</span>
                                                                <span className="text-xs text-slate-700">{item.izquierda}</span>
                                                                {showAnswers && (
                                                                    <span className="ml-auto text-[10px] text-violet-600 font-bold">
                                                                        → {String.fromCharCode(65 + idx)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Columna B */}
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-[#1B3A8C]/60 uppercase tracking-wide mb-1">Columna B</p>
                                                        {(p.items || []).map((item, idx) => (
                                                            <div key={item.id} className="flex items-center gap-1.5">
                                                                <span className="text-[11px] text-slate-400 font-mono w-4 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                                                                <span className="text-xs text-slate-700">{item.derecha}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Completar ── */}
                                {tipo === 'completar' && (
                                    <div className="space-y-3">
                                        {secItems.map((p) => (
                                            <div key={p.number}>
                                                {p.enunciado && (
                                                    <p className="text-xs font-medium text-slate-800 mb-1">{p.enunciado}</p>
                                                )}
                                                {p.instruccionItems && (
                                                    <p className="text-[11px] italic text-slate-500 mb-1.5 ml-1">{p.instruccionItems}</p>
                                                )}
                                                <div className="space-y-1.5 ml-1">
                                                    {(p.items || []).map((item, idx) => (
                                                        <div key={item.id} className="flex items-baseline gap-2">
                                                            <span className="text-[11px] text-slate-400 font-mono w-5 text-right shrink-0">{idx + 1}.</span>
                                                            <span className="text-xs text-slate-700">
                                                                {showAnswers && item.respuesta
                                                                    ? item.texto.split('___').reduce((acc, part, i) => {
                                                                        if (i === 0) return [<span key="s">{part}</span>];
                                                                        return [...acc, <span key={`a${i}`} className="font-bold text-emerald-700 underline">{item.respuesta}</span>, <span key={`p${i}`}>{part}</span>];
                                                                    }, [])
                                                                    : completarTexto(item.texto)
                                                                }
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Pie de página */}
                    {preguntas.length > 0 && (
                        <div className="pt-4 border-t border-[#1B3A8C]/15 text-center">
                            <p className="text-[10px] italic text-slate-400">
                                EYR Digital · Centro Educacional Ernesto Yáñez Rivera · Huechuraba
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

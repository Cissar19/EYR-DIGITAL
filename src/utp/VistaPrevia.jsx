import React, { useState, useEffect } from 'react';
import { Printer, Download, Eye, EyeOff, Loader2, FileText, Shuffle, ChevronDown, ChevronUp } from 'lucide-react';
import { ASIGNATURAS, getOAByCode } from '../data/objetivosAprendizaje';
import logoEyr from '../assets/logo_eyr.png';
import { exportarConFormato } from '../lib/templateExport';
import { exportarPauta } from '../lib/pautaExport';
import { generarVersionB } from '../lib/versionB';
import { cargarFormato, DEFAULT_FORMATO, DEFAULT_FORMAT_BLOCKS } from './formatoConfig';
import { fetchCollection } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import { toast } from 'sonner';

const PLANTILLA_META_DOC = ['app_config', 'utp_plantilla_meta'];

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
    const [exporting,     setExporting]     = useState(false);
    const [exportingPauta, setExportingPauta] = useState(false);
    const [exportingVB,   setExportingVB]   = useState(false);
    const [showAnswers,   setShowAnswers]   = useState(false);
    const [showEscala,    setShowEscala]    = useState(false);
    const [formato,       setFormato]       = useState(DEFAULT_FORMATO);
    const [formatoBlocks, setFormatoBlocks] = useState(null); // null = no cargado aún

    useEffect(() => {
        Promise.all([
            cargarFormato(),
            fetchCollection('formatos_prueba', orderBy('updatedAt', 'desc')),
        ]).then(([fmt, fmts]) => {
            setFormato(fmt);
            setFormatoBlocks(fmts?.[0]?.bloques || null);
        }).catch(() => {
            setFormatoBlocks(null);
        });
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

    const totalPuntos = evaluacion.totalPoints
        ?? preguntas.reduce((acc, p) => acc + (p.puntaje ?? 1), 0);

    // OAs únicos derivados de las preguntas
    // Guardamos { full: 'MA-OA3', short: 'OA3' } para buscar descripción pero mostrar sin prefijo
    const oasDePreguntas = Object.values(
        (evaluacion.questions || [])
            .map(q => q.oaCode).filter(Boolean)
            .reduce((acc, full) => {
                if (!acc[full]) {
                    acc[full] = { full, short: full.includes('-') ? full.split('-').slice(1).join('-') : full };
                }
                return acc;
            }, {})
    );

    // Block settings — from saved format or defaults matching EditorFormato DEFAULT_BLOCKS
    const headerBlock = formatoBlocks?.find(b => b.type === 'header') ?? {
        showUTP: true, showAsignaturaInHeader: true, showProfesorInHeader: true,
        showCalificacion: true, calificacionLabel: 'CALIFICACIÓN',
    };
    const infoBlock = formatoBlocks?.find(b => b.type === 'info_table') ?? {
        layout: 'n-c-f', showExigenciaRow: true, showOARow: true, showInstruccionesInTable: true,
        exigenciaLabel: 'Exigencia:', puntajeIdealLabel: 'Puntaje Ideal:', puntajeObtenidoLabel: 'Puntaje Obtenido:',
        oaLabel: 'Objetivo de Aprendizaje:', instrTableLabel: 'Instrucciones:',
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportarConFormato({ bloques: formatoBlocks ?? DEFAULT_FORMAT_BLOCKS, evaluacion });
        } catch {
            toast.error('Error al exportar el documento');
        } finally {
            setExporting(false);
        }
    };

    const handleExportPauta = async () => {
        setExportingPauta(true);
        try {
            await exportarPauta({ evaluacion });
        } catch {
            toast.error('Error al exportar la pauta');
        } finally {
            setExportingPauta(false);
        }
    };

    const handleExportVersionB = async () => {
        setExportingVB(true);
        try {
            const evalVB = generarVersionB(evaluacion);
            await exportarConFormato({ bloques: formatoBlocks ?? DEFAULT_FORMAT_BLOCKS, evaluacion: evalVB });
        } catch {
            toast.error('Error al generar Versión B');
        } finally {
            setExportingVB(false);
        }
    };

    // Escala de notas local
    const calcularNotaLocal = (pts, total, exig) => {
        if (!total) return null;
        const p = pts / total;
        const e = (exig ?? 60) / 100;
        if (e <= 0 || e >= 1) return null;
        const raw = p >= e ? 4 + 3 * (p - e) / (1 - e) : 1 + 3 * p / e;
        return Math.max(1, Math.min(7, Math.round(raw * 10) / 10));
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500">Vista previa del documento para estudiantes</p>
                </div>
                <div className="flex gap-2 flex-wrap">
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
                        onClick={handleExportPauta}
                        disabled={exportingPauta}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        {exportingPauta ? 'Generando…' : 'Pauta (.docx)'}
                    </button>
                    {preguntas.some(p => p.tipo === 'seleccion_multiple') && (
                        <button
                            onClick={handleExportVersionB}
                            disabled={exportingVB}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-violet-200 rounded-xl text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors disabled:opacity-50"
                        >
                            <Shuffle className="w-3.5 h-3.5" />
                            {exportingVB ? 'Generando…' : 'Versión B'}
                        </button>
                    )}
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

                    {/* Encabezado — 3 celdas: Logo | Info escuela | Calificación */}
                    <table className="w-full border-collapse text-xs border border-slate-500">
                        <tbody>
                            <tr>
                                <td className="border border-slate-500 p-2 text-center align-middle" style={{ width: '22%' }}>
                                    <img src={logoEyr} alt="Logo EYR" className="max-h-14 max-w-full object-contain mx-auto" />
                                </td>
                                <td className="border border-slate-500 p-2 text-center align-middle" style={{ width: headerBlock.showCalificacion ? '56%' : '78%' }}>
                                    <p className="font-bold text-sm text-slate-800 leading-tight">Centro Educacional Ernesto Yáñez Rivera</p>
                                    {(headerBlock.showUTP ?? true) && (
                                        <p className="text-[11px] text-slate-600 mt-0.5">Unidad Técnica Pedagógica</p>
                                    )}
                                    {(headerBlock.showAsignaturaInHeader ?? true) && (
                                        <p className="text-[11px] text-slate-600 mt-0.5">{asignaturaLabel}</p>
                                    )}
                                    {(headerBlock.showProfesorInHeader ?? true) && evaluacion.createdBy?.name && (
                                        <p className="text-[11px] text-slate-600 mt-0.5">Prof. {evaluacion.createdBy.name}</p>
                                    )}
                                </td>
                                {(headerBlock.showCalificacion ?? true) && (
                                    <td className="border border-slate-500 p-2 text-center align-middle" style={{ width: '22%' }}>
                                        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                                            {headerBlock.calificacionLabel || 'CALIFICACIÓN'}
                                        </p>
                                        <div className="h-10" />
                                    </td>
                                )}
                            </tr>
                        </tbody>
                    </table>

                    {/* Título evaluación */}
                    <div className="text-center py-1">
                        <h1 className="font-bold text-sm uppercase tracking-wide text-slate-800 underline decoration-slate-800">
                            {evaluacion.name || 'Sin título'}
                        </h1>
                    </div>

                    {/* Tabla datos alumno */}
                    <table className="w-full border-collapse text-xs border border-slate-500">
                        <tbody>
                            {/* Fila 1: layout columnas (Nombre / Curso / Fecha por defecto) */}
                            <tr>
                                <td className="border border-slate-500 px-2 py-1.5 font-medium" style={{ width: '50%' }}>
                                    Nombre: <span className="inline-block border-b border-slate-400 w-28 align-bottom" />
                                </td>
                                <td className="border border-slate-500 px-2 py-1.5 font-medium" style={{ width: '25%' }}>
                                    Curso: {evaluacion.curso}
                                </td>
                                <td className="border border-slate-500 px-2 py-1.5 font-medium" style={{ width: '25%' }}>
                                    Fecha: {fechaLabel}
                                </td>
                            </tr>
                            {/* Fila 2: Exigencia / Puntaje Ideal / Puntaje Obtenido */}
                            {(infoBlock.showExigenciaRow ?? true) && (
                                <tr>
                                    <td className="border border-slate-500 px-2 py-1.5">
                                        {infoBlock.exigenciaLabel || 'Exigencia:'}{' '}
                                        {evaluacion.exigencia ?? 60}%
                                    </td>
                                    <td className="border border-slate-500 px-2 py-1.5">
                                        {infoBlock.puntajeIdealLabel || 'Puntaje Ideal:'}{' '}{totalPuntos}
                                    </td>
                                    <td className="border border-slate-500 px-2 py-1.5">
                                        {infoBlock.puntajeObtenidoLabel || 'Puntaje Obtenido:'}{' '}___
                                    </td>
                                </tr>
                            )}
                            {/* Fila 3: OA */}
                            {(infoBlock.showOARow ?? true) && (
                                <tr>
                                    <td colSpan={3} className="border border-slate-500 px-2 py-1.5">
                                        <span className="font-medium text-slate-700 mr-1">
                                            {infoBlock.oaLabel || 'Objetivo de Aprendizaje:'}
                                        </span>
                                        {evaluacion.oa ? (
                                            <span>{evaluacion.oa}</span>
                                        ) : oasDePreguntas.length > 0 ? (
                                            oasDePreguntas.length <= 2 ? (
                                                // Pocos OAs: código corto + descripción completa
                                                <span>
                                                    {oasDePreguntas.map(({ full, short }, i) => {
                                                        const oa = getOAByCode(full);
                                                        return (
                                                            <span key={full}>
                                                                <span className="font-semibold">{short}</span>
                                                                {oa?.description ? `: ${oa.description}` : ''}
                                                                {i < oasDePreguntas.length - 1 ? ' · ' : ''}
                                                            </span>
                                                        );
                                                    })}
                                                </span>
                                            ) : (
                                                // Muchos OAs: solo códigos cortos
                                                <span className="font-semibold">
                                                    {oasDePreguntas.map(o => o.short).join(' · ')}
                                                </span>
                                            )
                                        ) : null}
                                    </td>
                                </tr>
                            )}
                            {/* Fila 4: Instrucciones */}
                            {(infoBlock.showInstruccionesInTable ?? true) && (
                                <tr>
                                    <td colSpan={3} className="border border-slate-500 px-2 py-1.5 italic text-slate-600">
                                        {infoBlock.instrTableLabel || 'Instrucciones:'}{' '}
                                        {instrucciones}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Instrucciones generales (solo si NO están en la tabla) */}
                    {!(infoBlock.showInstruccionesInTable ?? true) && instrucciones && (
                        <p className="text-xs italic text-slate-500 border-l-2 border-[#1B3A8C]/20 pl-3">
                            {instrucciones}
                        </p>
                    )}

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
                                                    <div className="ml-5 mt-5 space-y-5">
                                                        {Array.from({ length: 8 }).map((_, i) => (
                                                            <div key={i} className="border-b border-slate-300 w-full" />
                                                        ))}
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

                    {/* Escala de notas colapsable */}
                    {totalPuntos > 0 && (
                        <div className="border-t border-slate-200 pt-3">
                            <button
                                onClick={() => setShowEscala(v => !v)}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                {showEscala ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {showEscala ? 'Ocultar escala de notas' : 'Ver escala de notas'}
                            </button>
                            {showEscala && (
                                <div className="mt-3 overflow-x-auto">
                                    <table className="text-[10px] border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                <th className="border border-slate-300 px-2 py-1 font-semibold text-slate-600">Puntaje</th>
                                                <th className="border border-slate-300 px-2 py-1 font-semibold text-slate-600">% Logro</th>
                                                <th className="border border-slate-300 px-2 py-1 font-semibold text-slate-600">Nota</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: totalPuntos + 1 }, (_, i) => {
                                                const nota  = calcularNotaLocal(i, totalPuntos, evaluacion.exigencia);
                                                const logro = totalPuntos ? Math.round(i / totalPuntos * 100) : 0;
                                                const aprueba = nota !== null && nota >= 4;
                                                return (
                                                    <tr key={i} className={aprueba ? 'bg-emerald-50' : 'bg-orange-50'}>
                                                        <td className="border border-slate-200 px-2 py-0.5 text-center font-medium">
                                                            {i} / {totalPuntos}
                                                        </td>
                                                        <td className="border border-slate-200 px-2 py-0.5 text-center text-slate-500">
                                                            {logro}%
                                                        </td>
                                                        <td className={`border border-slate-200 px-2 py-0.5 text-center font-bold ${
                                                            aprueba ? 'text-emerald-700' : 'text-red-600'
                                                        }`}>
                                                            {nota !== null ? nota.toFixed(1) : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <p className="text-[9px] text-slate-400 mt-1.5">
                                        Exigencia {evaluacion.exigencia ?? 60}% → Nota 4.0 · Verde = aprueba · Naranja = reprueba
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

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

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, Eye, EyeOff, Loader2, FileText, Shuffle, FileDown } from 'lucide-react';
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
    const [exportingPdf,  setExportingPdf]  = useState(false);
    const [showAnswers,   setShowAnswers]   = useState(false);
    const [formato,       setFormato]       = useState(DEFAULT_FORMATO);
    const [formatoBlocks, setFormatoBlocks] = useState(null); // null = no cargado aún
    const previewRef = useRef(null);

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

    const handleExportPDF = async () => {
        const el = previewRef.current;
        if (!el) return;
        setExportingPdf(true);
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);

            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (_doc, clone) => {
                    clone.style.borderRadius = '0';
                    clone.style.boxShadow = 'none';
                    clone.style.border = 'none';
                },
            });

            const margin = 8;                     // mm
            const pageW  = 210;                   // A4 mm
            const pageH  = 297;
            const contentW = pageW - 2 * margin;  // 194 mm
            const sliceH_mm = pageH - 2 * margin; // 281 mm por página

            // Pixeles de canvas equivalentes a una página de contenido
            const sliceH_px = Math.round(sliceH_mm * canvas.width / contentW);

            // Detecta el mejor punto de corte dentro de ±15% del sliceH.
            // Busca la CORRIDA MÁS LARGA de filas blancas consecutivas,
            // que corresponde a gaps entre preguntas (≥12px) y no a los
            // micro-espacios entre alternativas (2px). Corta en el centro
            // de esa corrida para no partir listas de alternativas.
            const findBestCut = (targetY) => {
                const ctx    = canvas.getContext('2d');
                const search = Math.round(sliceH_px * 0.15);
                const from   = Math.max(targetY - search, 0);
                const to     = Math.min(targetY + search, canvas.height - 1);
                const minWhite = Math.round(canvas.width * 0.92); // umbral "fila blanca"

                let bestMid = targetY, bestLen = 0;
                let runStart = -1, runLen = 0;

                for (let y = from; y <= to; y++) {
                    const data = ctx.getImageData(0, y, canvas.width, 1).data;
                    let w = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) w++;
                    }
                    if (w >= minWhite) {
                        if (runStart < 0) runStart = y;
                        runLen++;
                    } else {
                        if (runLen > bestLen) {
                            bestLen = runLen;
                            bestMid = runStart + Math.floor(runLen / 2);
                        }
                        runStart = -1; runLen = 0;
                    }
                }
                if (runLen > bestLen) bestMid = runStart + Math.floor(runLen / 2);
                return bestMid;
            };

            // Calcular todos los puntos de corte
            const cuts = [];
            let pos = 0;
            while (pos + sliceH_px < canvas.height) {
                const cut = findBestCut(pos + sliceH_px);
                cuts.push(cut);
                pos = cut;
            }

            // Generar páginas con segmentos individuales
            const segments = [0, ...cuts, canvas.height];
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            for (let i = 0; i < segments.length - 1; i++) {
                const y0 = segments[i];
                const y1 = segments[i + 1];

                const slice = document.createElement('canvas');
                slice.width  = canvas.width;
                slice.height = y1 - y0;
                slice.getContext('2d').drawImage(canvas, 0, y0, canvas.width, y1 - y0, 0, 0, canvas.width, y1 - y0);

                const h_mm = (y1 - y0) * contentW / canvas.width;
                if (i > 0) pdf.addPage();
                pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentW, h_mm);
            }

            const name = (evaluacion.name || 'prueba')
                .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            pdf.save(`${name}.pdf`);
        } catch {
            toast.error('Error al generar PDF');
        } finally {
            setExportingPdf(false);
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
                        onClick={handleExportPDF}
                        disabled={exportingPdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-rose-200 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        {exportingPdf ? 'Generando…' : 'Descargar PDF'}
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
            <div ref={previewRef} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden max-w-2xl mx-auto print:shadow-none print:border-none print:max-w-none">
                <div className="p-8 flex flex-col" style={{ minHeight: '29.7cm' }}>
                <div className="flex-1 space-y-4">

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


                </div>

                    {/* Pie de página — siempre al fondo de la hoja */}
                    <div className="mt-auto pt-4 border-t border-[#1B3A8C]/15 text-center">
                        <p className="text-[10px] italic text-slate-400">
                            EYR Digital · Centro Educacional Ernesto Yáñez Rivera · Huechuraba
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

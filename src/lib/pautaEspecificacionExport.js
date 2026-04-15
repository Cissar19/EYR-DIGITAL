/**
 * pautaEspecificacionExport.js
 * Genera la Pauta de Especificación Evaluación en .docx:
 *   - Encabezado (colegio, UTP, asignatura, profesor)
 *   - Título de la evaluación y nivel
 *   - Descripción del OA
 *   - Tabla: Indicadores de logro | Habilidad | N° de pregunta | Clave | Puntaje
 *   - Total de puntos
 */
import {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    Packer, AlignmentType, WidthType, BorderStyle,
} from 'docx';
import { ASIGNATURAS, getOAByCode } from '../data/objetivosAprendizaje';
import { getIndicadoresForOA } from '../data/indicadoresAprendizaje';

const hp = (pt) => pt * 2;
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

const solidBorder = () => ({
    top:    { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left:   { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right:  { style: BorderStyle.SINGLE, size: 4, color: '000000' },
});

function tcell(text, { center = false, bold = false, shading, width, rowSpan } = {}) {
    const opts = {
        borders: solidBorder(),
        children: [new Paragraph({
            alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: String(text ?? '—'), bold, size: hp(9), color: '000000' })],
        })],
    };
    if (width)   opts.width   = { size: width, type: WidthType.PERCENTAGE };
    if (shading) opts.shading = { fill: shading };
    if (rowSpan) opts.rowSpan = rowSpan;
    return new TableCell(opts);
}

function tcellLines(lines, { width, rowSpan } = {}) {
    const opts = {
        borders: solidBorder(),
        children: lines.map((line, i) => new Paragraph({
            spacing: { before: i === 0 ? 40 : 20, after: i === lines.length - 1 ? 40 : 0 },
            children: [new TextRun({ text: String(line ?? ''), size: hp(9), color: '000000' })],
        })),
    };
    if (width)   opts.width   = { size: width, type: WidthType.PERCENTAGE };
    if (rowSpan) opts.rowSpan = rowSpan;
    return new TableCell(opts);
}

function par(text, { center = false, bold = false, size = 10, after = 80, underline = false } = {}) {
    return new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after },
        children: [new TextRun({ text, bold, size: hp(size), ...(underline ? { underline: {} } : {}) })],
    });
}

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

export async function exportarPautaEspecificacion({ evaluacion }) {
    const asigName  = ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name || evaluacion.asignatura || '';
    const questions = evaluacion.questions || [];
    const totalPts  = questions.reduce((s, q) => s + (q.puntaje ?? 1), 0);

    // OA codes en orden de primera aparición
    const oaCodes = [];
    questions.forEach(q => {
        const k = q.oaCode || '__sin_oa__';
        if (!oaCodes.includes(k)) oaCodes.push(k);
    });

    // ── Tabla ────────────────────────────────────────────────────────────────
    const headerRow = new TableRow({ children: [
        tcell('Indicadores de logro', { bold: true, center: true, shading: 'D9D9D9', width: 35 }),
        tcell('Habilidad',            { bold: true, center: true, shading: 'D9D9D9', width: 12 }),
        tcell('N° de pregunta',       { bold: true, center: true, shading: 'D9D9D9', width: 15 }),
        tcell('Clave',                { bold: true, center: true, shading: 'D9D9D9', width: 28 }),
        tcell('Puntaje',              { bold: true, center: true, shading: 'D9D9D9', width: 10 }),
    ]});

    const dataRows = [];

    for (const oaCode of oaCodes) {
        const oaQs = oaCode === '__sin_oa__'
            ? questions.filter(q => !q.oaCode)
            : questions.filter(q => q.oaCode === oaCode);
        if (oaQs.length === 0) continue;

        const selectedCodes = evaluacion.selectedIndicadores?.[oaCode] || [];
        const allInd        = oaCode !== '__sin_oa__' ? getIndicadoresForOA(oaCode) : [];
        const selectedInd   = allInd.filter(i => selectedCodes.includes(i.code));
        const indLines      = selectedInd.length > 0
            ? selectedInd.map(i => i.description)
            : ['(sin indicadores asignados)'];

        oaQs.forEach((q, idx) => {
            const cells = [];
            if (idx === 0) {
                cells.push(tcellLines(indLines, { rowSpan: oaQs.length, width: 35 }));
            }
            cells.push(tcell(q.habilidad || '—',        { center: true, width: 12 }));
            cells.push(tcell(getItemLabel(q, questions), { center: true, width: 15 }));
            cells.push(tcell(getClave(q),                { width: 28 }));
            cells.push(tcell(String(q.puntaje ?? 1),     { center: true, width: 10 }));
            dataRows.push(new TableRow({ children: cells }));
        });
    }

    // Fila total
    dataRows.push(new TableRow({ children: [
        tcell('', { width: 35 }),
        tcell('', { width: 12 }),
        tcell('', { width: 15 }),
        tcell(`${totalPts} puntos en total`, { bold: true, center: true, shading: 'D9D9D9', width: 28 }),
        tcell(String(totalPts),              { bold: true, center: true, shading: 'D9D9D9', width: 10 }),
    ]}));

    const mainTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
    });

    // ── Nodos OA ─────────────────────────────────────────────────────────────
    const oaNodes = oaCodes
        .filter(c => c !== '__sin_oa__')
        .map(code => {
            const oa    = getOAByCode(code);
            const short = code.includes('-') ? code.split('-').slice(1).join('-') : code;
            return par(`${short} ${oa?.description || '(sin descripción)'}`, { size: 9, after: 60 });
        });

    // ── Documento ─────────────────────────────────────────────────────────────
    const doc = new Document({
        sections: [{
            properties: { page: { margin: { top: 720, bottom: 720, left: 1008, right: 1008 } } },
            children: [
                par('Centro Educacional Ernesto Yáñez Rivera', { size: 9, after: 20 }),
                par('Unidad Técnica Pedagógica',               { size: 9, after: 20 }),
                par(`Asignatura ${asigName}`,                  { size: 9, after: 20 }),
                par(`Profesor/a ${evaluacion.createdBy?.name || ''}`, { size: 9, after: 100 }),
                par('PAUTA DE ESPECIFICACIÓN EVALUACIÓN',      { bold: true, size: 13, center: true, after: 20, underline: true }),
                par(evaluacion.name || '',                     { bold: true, size: 11, center: true, after: 10 }),
                par(evaluacion.curso || '',                    { bold: true, size: 11, center: true, after: 100 }),
                ...oaNodes,
                mainTable,
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pauta_especificacion_${(evaluacion.name || 'evaluacion')
        .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
}

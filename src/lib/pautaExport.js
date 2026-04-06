/**
 * pautaExport.js
 * Genera una pauta de corrección en .docx:
 *   - Tabla de respuestas por pregunta (tipo, OA, respuesta, puntaje)
 *   - Escala de notas completa (0 → totalPts → nota 1.0–7.0)
 */
import {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    Packer, AlignmentType, WidthType, BorderStyle,
} from 'docx';
import { ASIGNATURAS } from '../data/objetivosAprendizaje';

const hp = (pt) => pt * 2;

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre'];

const TIPO_LABELS = {
    seleccion_multiple: 'Sel. Múltiple',
    desarrollo:         'Desarrollo',
    verdadero_falso:    'V/F',
    unir:               'Unir',
    completar:          'Completar',
};

function calcularNota(earnedPts, totalPts, exigencia) {
    if (!totalPts) return null;
    const p = earnedPts / totalPts;
    const e = (exigencia ?? 60) / 100;
    if (e <= 0 || e >= 1) return null;
    const raw = p >= e ? 4 + 3 * (p - e) / (1 - e) : 1 + 3 * p / e;
    return Math.max(1, Math.min(7, Math.round(raw * 10) / 10));
}

const borders = (color = 'CCCCCC') => ({
    top:    { style: BorderStyle.SINGLE, size: 4, color },
    bottom: { style: BorderStyle.SINGLE, size: 4, color },
    left:   { style: BorderStyle.SINGLE, size: 4, color },
    right:  { style: BorderStyle.SINGLE, size: 4, color },
});

function cell(text, { center = false, bold = false, shading, color = '333333', width } = {}) {
    return new TableCell({
        borders: borders(),
        ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
        ...(shading ? { shading: { fill: shading } } : {}),
        children: [new Paragraph({
            alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: String(text ?? '—'), bold, size: hp(9), color })],
        })],
    });
}

function par(text, { center = false, bold = false, size = 10, after = 100, color = '333333' } = {}) {
    return new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after },
        children: [new TextRun({ text, bold, size: hp(size), color })],
    });
}

export async function exportarPauta({ evaluacion }) {
    const asigName = ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name || evaluacion.asignatura || '';
    const exigencia = evaluacion.exigencia ?? 60;
    const questions = evaluacion.questions || [];
    const totalPts = questions.reduce((s, q) => s + (q.puntaje ?? 1), 0);

    let fechaLabel = evaluacion.date || '';
    try {
        const [y, m, d] = evaluacion.date.split('-');
        fechaLabel = `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]} de ${y}`;
    } catch { /* usa valor original */ }

    // ── Tabla de respuestas ──────────────────────────────────────────────────
    const headerRow = new TableRow({ children: [
        cell('N°',             { bold: true, center: true, shading: 'E8E8F4', width: 6 }),
        cell('Tipo',           { bold: true, center: true, shading: 'E8E8F4', width: 13 }),
        cell('OA',             { bold: true, center: true, shading: 'E8E8F4', width: 10 }),
        cell('Respuesta / Pauta', { bold: true, shading: 'E8E8F4', width: 57 }),
        cell('Pts',            { bold: true, center: true, shading: 'E8E8F4', width: 9 }),
        cell('Acum.',          { bold: true, center: true, shading: 'E8E8F4', width: 5 }),
    ]});

    let acum = 0;
    const questionRows = questions.map((q, i) => {
        let respuesta = '';
        if (q.tipo === 'seleccion_multiple') {
            respuesta = q.respuestaCorrecta ? q.respuestaCorrecta.toUpperCase() : '—';
        } else if (q.tipo === 'desarrollo') {
            respuesta = q.respuestaCorrecta || '(pauta del profesor)';
        } else if (q.tipo === 'verdadero_falso') {
            respuesta = (q.items || []).map((it, idx) => `${idx + 1}) ${it.respuesta || '?'}`).join('   ');
        } else if (q.tipo === 'unir') {
            respuesta = (q.items || []).map((_, idx) => `${idx + 1}→${String.fromCharCode(65 + idx)}`).join('   ');
        } else if (q.tipo === 'completar') {
            respuesta = (q.items || []).map((it, idx) => `${idx + 1}) ${it.respuesta || '?'}`).join('   ');
        }
        const oaShort = q.oaCode
            ? (q.oaCode.includes('-') ? q.oaCode.split('-').slice(1).join('-') : q.oaCode)
            : '—';
        acum += q.puntaje ?? 1;

        return new TableRow({ children: [
            cell(i + 1,                         { center: true }),
            cell(TIPO_LABELS[q.tipo] || q.tipo, { center: true }),
            cell(oaShort,                        { center: true }),
            cell(respuesta),
            cell(`${q.puntaje ?? 1}`,            { center: true }),
            cell(acum,                            { center: true, color: '666666' }),
        ]});
    });

    const respuestasTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...questionRows],
    });

    // ── Escala de notas ──────────────────────────────────────────────────────
    const escalaHeader = new TableRow({ children: [
        cell('Puntaje', { bold: true, center: true, shading: 'E8E8F4', width: 34 }),
        cell('% Logro', { bold: true, center: true, shading: 'E8E8F4', width: 33 }),
        cell('Nota',    { bold: true, center: true, shading: 'E8E8F4', width: 33 }),
    ]});

    const escalaRows = Array.from({ length: totalPts + 1 }, (_, i) => {
        const nota = calcularNota(i, totalPts, exigencia);
        const logro = totalPts ? Math.round(i / totalPts * 100) : 0;
        const aprueba = nota !== null && nota >= 4.0;
        return new TableRow({ children: [
            cell(`${i} / ${totalPts}`, { center: true, shading: aprueba ? 'E8F5E9' : 'FFF8E1' }),
            cell(`${logro}%`,          { center: true }),
            cell(nota !== null ? nota.toFixed(1) : '—',
                { center: true, bold: aprueba, color: aprueba ? '2E7D32' : 'B71C1C' }),
        ]});
    });

    const escalaTable = new Table({
        width: { size: 45, type: WidthType.PERCENTAGE },
        rows: [escalaHeader, ...escalaRows],
    });

    // ── Documento ────────────────────────────────────────────────────────────
    const doc = new Document({
        sections: [{
            properties: { page: { margin: { top: 720, bottom: 720, left: 1008, right: 1008 } } },
            children: [
                par('PAUTA DE CORRECCIÓN', { bold: true, size: 14, center: true, after: 60 }),
                par(evaluacion.name || '', { bold: true, size: 11, center: true, after: 60 }),
                par(`${asigName}  ·  ${evaluacion.curso}  ·  ${fechaLabel}`, { center: true, after: 40 }),
                par(`Exigencia: ${exigencia}%  ·  Puntaje total: ${totalPts} pts`, { center: true, after: 200, color: '555555' }),
                par('RESPUESTAS', { bold: true, size: 11, after: 80, color: '1B3A8C' }),
                respuestasTable,
                new Paragraph({ spacing: { after: 360 }, children: [] }),
                par('ESCALA DE NOTAS', { bold: true, size: 11, after: 60, color: '1B3A8C' }),
                par(`Aprueba al ${exigencia}% de logro (nota 4.0)  ·  Verde = aprueba  ·  Amarillo = reprueba`,
                    { size: 9, after: 80, color: '888888' }),
                escalaTable,
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pauta_${(evaluacion.name || 'evaluacion')
        .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
}

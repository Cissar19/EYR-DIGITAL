/**
 * templateExport.js
 *
 * Maneja la exportación de pruebas usando plantillas .docx con docxtemplater.
 * Si no hay plantilla, se usa docxExport.js como respaldo.
 */
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    Packer, AlignmentType, WidthType, BorderStyle, ImageRun,
} from 'docx';
import { ASIGNATURAS } from '../data/objetivosAprendizaje';
import { getPlantillaBase64 } from './storageService';
import { generarSeccionesPreguntas } from './docxExport';

// ── Helpers ────────────────────────────────────────────────────────────────────

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatFecha(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]} de ${y}`;
}

function calcTotalPuntos(preguntas) {
    return preguntas.reduce((sum, p) => sum + (p.puntaje || 0), 0);
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const TIPOS_CON_ITEMS = ['verdadero_falso', 'unir', 'completar'];

// ── Datos para la plantilla ────────────────────────────────────────────────────

/**
 * Construye el objeto de datos para la sustitución de variables en la plantilla.
 *
 * Las secciones se ordenan según el tipo que aparece primero en la evaluación,
 * respetando el orden en que el profesor armó la prueba.
 *
 * @param {Object} evaluacion
 * @returns {Object}
 */
export function prepararDatosPlantilla(evaluacion) {
    const preguntas = (evaluacion.questions || []).filter(
        q => q.enunciado || TIPOS_CON_ITEMS.includes(q.tipo)
    );

    // Agrupar por tipo respetando el orden de primera aparición
    const tiposEnOrden = [];
    const gruposPorTipo = {};
    for (const p of preguntas) {
        if (!gruposPorTipo[p.tipo]) {
            gruposPorTipo[p.tipo] = [];
            tiposEnOrden.push(p.tipo);
        }
        gruposPorTipo[p.tipo].push(p);
    }

    /**
     * secciones: array ordenado según el orden del profesor.
     * Cada sección tiene:
     *  - roman, titulo, count
     *  - is_sm / is_desarrollo / is_vf / is_unir / is_completar  (condicionales)
     *  - preguntas: array de preguntas de la sección
     */
    const secciones = tiposEnOrden.map((tipo, idx) => {
        const secPreguntas = gruposPorTipo[tipo];
        return {
            roman:         ROMAN[idx] || String(idx + 1),
            tipo,
            count:         secPreguntas.length,
            is_sm:         tipo === 'seleccion_multiple',
            is_desarrollo: tipo === 'desarrollo',
            is_vf:         tipo === 'verdadero_falso',
            is_unir:       tipo === 'unir',
            is_completar:  tipo === 'completar',
            preguntas: secPreguntas.map((p, qi) => ({
                numero:    qi + 1,
                enunciado: p.enunciado || '',
                // SM
                alt_a: p.alternativas?.a || '',
                alt_b: p.alternativas?.b || '',
                alt_c: p.alternativas?.c || '',
                alt_d: p.alternativas?.d || '',
                // Tipos con ítems (VF, unir, completar)
                instruccion: p.instruccionItems || '',
                items: (p.items || []).map((item, iIdx) => ({
                    numero:    iIdx + 1,
                    texto:     item.texto     || '',
                    izquierda: item.izquierda || '',
                    derecha:   item.derecha   || '',
                    letra:     String.fromCharCode(65 + iIdx),
                })),
            })),
        };
    });

    const totalPuntos = preguntas.reduce((acc, p) => {
        if (TIPOS_CON_ITEMS.includes(p.tipo)) return acc + (p.items?.length || 1);
        return acc + 1;
    }, 0);

    return {
        titulo:        evaluacion.name || '',
        asignatura:    ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name || evaluacion.asignatura || '',
        curso:         evaluacion.curso || '',
        fecha:         formatFecha(evaluacion.date),
        profesor:      evaluacion.createdBy?.name || '',
        instrucciones: evaluacion.instrucciones || '',
        total_puntos:  totalPuntos,
        secciones,
    };
}

// ── Exportar con plantilla ─────────────────────────────────────────────────────

/**
 * Descarga la prueba usando la plantilla .docx guardada en Firestore (base64).
 * @param {Object} params
 * @param {Object} params.evaluacion - Objeto de evaluación
 */
export async function exportarConPlantilla({ evaluacion }) {
    const base64 = await getPlantillaBase64();
    if (!base64) {
        throw new Error('No se encontró la plantilla. Vuelve a subirla en Formato de Prueba.');
    }
    const zip = new PizZip(base64, { base64: true });
    let doc;
    try {
        doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    } catch (err) {
        throw new Error('La plantilla tiene un formato inválido: ' + err.message);
    }

    const data = prepararDatosPlantilla(evaluacion);

    try {
        doc.render(data);
    } catch (err) {
        const details = err.properties?.errors?.map(e => e.message).join(', ') || err.message;
        throw new Error('Error al procesar la plantilla: ' + details);
    }

    const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const nombreArchivo = (evaluacion.name || 'prueba')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${nombreArchivo}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ── Generador desde bloques (EditorFormato) ────────────────────────────────────

import { INFO_LAYOUTS } from '../utp/formatoLayouts';

/**
 * Genera y descarga una plantilla .docx a partir del array de bloques del editor visual.
 * @param {{ blocks: Array, nombreArchivo: string }} params
 */
export async function generarPlantillaDesdeBlocks({ blocks, nombreArchivo = 'plantilla_prueba' }) {
    // Helpers
    const hp  = (pt) => pt * 2;                             // puntos → half-points
    const hx  = (c)  => (c || '#000000').replace('#', '');  // hex sin #
    const nb  = () => ({ top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } });
    const cb  = () => ({ top: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' } });
    const cp  = (ch) => new Paragraph({ children: ch, spacing: { after: 60, before: 60 } });
    const tag = (text) => new Paragraph({ children: [new TextRun({ text, size: hp(10) })], spacing: { after: 0, before: 0 } });

    // Obtener valores de tipografía con fallback
    const tg = (typo, key, defaults) => ({
        color:     hx(typo?.[key]?.color     ?? defaults.color),
        size:      hp(typo?.[key]?.size      ?? defaults.size),
        bold:      typo?.[key]?.bold         ?? defaults.bold,
        italic:    typo?.[key]?.italic       ?? false,
        underline: typo?.[key]?.underline    ?? defaults.underline ?? false,
    });

    // Defaults tipográficos (mirrors EditorFormato.jsx T object)
    const TD = {
        schoolName:   { color: '#1B3A8C', size: 12, bold: true  },
        subtitle:     { color: '#888888', size:  9, bold: false },
        evalAsig:     { color: '#1B3A8C', size: 13, bold: true  },
        evalTitulo:   { color: '#333333', size: 12, bold: true,  underline: true },
        evalInfo:     { color: '#666666', size: 10, bold: false },
        tableLabel:   { color: '#888888', size: 10, bold: false },
        tableValue:   { color: '#4A4A4A', size: 10, bold: false },
        instrLabel:   { color: '#4A4A4A', size: 10, bold: true  },
        freeText:     { color: '#4A4A4A', size: 10, bold: false },
        sectionTitle: { color: '#1B3A8C', size: 11, bold: true  },
        question:     { color: '#4A4A4A', size: 10, bold: false },
    };

    const LGRAY = '888888';
    const children = [];

    for (const block of blocks) {
        if (block.type === 'header') {
            const snT = tg(block.typo, 'schoolName', TD.schoolName);
            const stT = tg(block.typo, 'subtitle',   TD.subtitle);
            const showCalif = block.showCalificacion ?? true;
            const sb = () => ({ top: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' }, left: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' } });
            const logoChildren = block.logoBase64
                ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new ImageRun({ data: block.logoBase64.split(',')[1], type: block.logoType || 'png', transformation: { width: 55, height: 55 } })] })]
                : [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: '[ LOGO ]', size: hp(9), color: 'AAAAAA' })] })];
            const infoChildren = [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: (block.schoolName || '').toUpperCase(), bold: snT.bold, size: snT.size, color: snT.color })] }),
                ...(block.schoolSubtitle ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: block.schoolSubtitle, bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
                ...((block.showUTP ?? true) ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: 'Unidad Técnica Pedagógica', bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
                ...((block.showAsignaturaInHeader ?? true) ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: 'Asignatura: {asignatura}', bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
                ...((block.showProfesorInHeader ?? true) ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'Profesor: {profesor}', bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
            ];
            const cells = [];
            if (block.showLogo) cells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: sb(), children: logoChildren }));
            cells.push(new TableCell({ width: { size: (block.showLogo ? 70 : showCalif ? 85 : 100), type: WidthType.PERCENTAGE }, borders: sb(), children: infoChildren }));
            if (showCalif) {
                cells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: sb(), verticalAlign: 'center', children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: block.calificacionLabel || 'CALIFICACIÓN', bold: true, size: hp(10), color: '333333' })] })] }));
            } else if (block.showLogo && block.logoSide === 'both') {
                cells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: sb(), children: logoChildren }));
            }
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } }, rows: [new TableRow({ children: cells })] }), new Paragraph({ children: [], spacing: { after: 80 } }));
        }

        else if (block.type === 'divider') {
            children.push(new Paragraph({ spacing: { before: 80, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: (block.thickness || 2) * 4, color: hx(block.color) } }, children: [] }));
        }

        else if (block.type === 'eval_title') {
            const aT = tg(block.typo, 'asignatura', TD.evalAsig);
            const tT = tg(block.typo, 'titulo',     TD.evalTitulo);
            const iT = tg(block.typo, 'info',       TD.evalInfo);
            const align = block.align === 'left' ? AlignmentType.LEFT : AlignmentType.CENTER;
            children.push(
                ...(block.showAsignatura ? [new Paragraph({ alignment: align, spacing: { after: 40 }, children: [new TextRun({ text: 'EVALUACIÓN DE {asignatura}', bold: aT.bold, size: aT.size, color: aT.color })] })] : []),
                new Paragraph({ alignment: align, spacing: { after: 40 }, children: [new TextRun({ text: '{titulo}', bold: tT.bold, size: tT.size, color: tT.color, underline: tT.underline ? {} : undefined })] }),
                new Paragraph({ alignment: align, spacing: { after: 120 }, children: [
                    ...(block.showCurso ? [new TextRun({ text: '{curso}', bold: iT.bold, size: iT.size, color: iT.color })] : []),
                    ...(block.showCurso && block.showProfesor ? [new TextRun({ text: '   ·   ', size: iT.size, color: iT.color })] : []),
                    ...(block.showProfesor ? [new TextRun({ text: 'Profesor(a): {profesor}', bold: iT.bold, size: iT.size, color: iT.color })] : []),
                ] }),
            );
        }

        else if (block.type === 'info_table') {
            const layout = INFO_LAYOUTS[block.layout] || INFO_LAYOUTS['n-f-p'];
            const labels = block.customLabels || {};
            const lT = tg(block.typo, 'label', TD.tableLabel);
            const vT = tg(block.typo, 'value', TD.tableValue);
            const nCols = layout.cols.length;
            const getCells = (cols) => cols.map(col => {
                const label = labels[col.field] ?? col.label;
                let valueRun;
                if (col.field === 'nombre')  valueRun = new TextRun({ text: '_______________________________', bold: vT.bold, size: vT.size, color: vT.color });
                else if (col.field === 'fecha')   valueRun = new TextRun({ text: '{fecha}',              bold: vT.bold, size: vT.size, color: vT.color });
                else if (col.field === 'puntaje') valueRun = new TextRun({ text: '____ / {total_puntos}', bold: vT.bold, size: vT.size, color: vT.color });
                else valueRun = new TextRun({ text: '_______________', bold: vT.bold, size: vT.size, color: vT.color });
                return new TableCell({ width: { size: col.w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: `${label}: `, bold: lT.bold, size: lT.size, color: lT.color }), valueRun])] });
            });
            const rows = [new TableRow({ children: getCells(layout.cols) })];
            if (block.showCursoRow) rows.push(new TableRow({ children: [new TableCell({ columnSpan: nCols, borders: cb(), children: [cp([new TextRun({ text: 'Curso: ', bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: '___________________', bold: vT.bold, size: vT.size, color: vT.color })])] })] }));
            if (block.showExigenciaRow && nCols >= 2) {
                const exCells = [
                    new TableCell({ width: { size: layout.cols[0].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: `${block.exigenciaLabel || 'Exigencia:'} `, bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: '____________', bold: vT.bold, size: vT.size, color: vT.color })])] }),
                    new TableCell({ width: { size: layout.cols[1].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: `${block.puntajeIdealLabel || 'Puntaje Ideal:'} `, bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: '____________', bold: vT.bold, size: vT.size, color: vT.color })])] }),
                ];
                if (nCols >= 3) exCells.push(new TableCell({ columnSpan: nCols - 2, borders: cb(), children: [cp([new TextRun({ text: `${block.puntajeObtenidoLabel || 'Puntaje Obtenido:'} `, bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: '____________', bold: vT.bold, size: vT.size, color: vT.color })])] }));
                rows.push(new TableRow({ children: exCells }));
            }
            if (block.showOARow) {
                rows.push(new TableRow({ children: [
                    new TableCell({ width: { size: layout.cols[0].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: block.oaLabel || 'Objetivo de Aprendizaje:', bold: lT.bold, size: lT.size, color: lT.color })])] }),
                    new TableCell({ columnSpan: nCols - 1, borders: cb(), children: [cp([new TextRun({ text: '{oa}', bold: vT.bold, size: vT.size, color: vT.color })])] }),
                ] }));
            }
            if (block.showInstruccionesInTable) {
                rows.push(new TableRow({ children: [
                    new TableCell({ width: { size: layout.cols[0].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: block.instrTableLabel || 'Instrucciones:', bold: lT.bold, size: lT.size, color: lT.color })])] }),
                    new TableCell({ columnSpan: nCols - 1, borders: cb(), children: [cp([new TextRun({ text: '{instrucciones}', bold: vT.bold, size: vT.size, color: vT.color })])] }),
                ] }));
            }
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }), new Paragraph({ children: [], spacing: { after: 120 } }));
        }

        else if (block.type === 'free_text') {
            const fT = tg(block.typo, 'text', TD.freeText);
            const align = block.align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
            children.push(new Paragraph({ alignment: align, spacing: { after: 80 }, children: [new TextRun({ text: block.content || '', bold: fT.bold, italics: fT.italic, size: fT.size, color: fT.color })] }));
        }

        else if (block.type === 'instructions') {
            const lT = tg(block.typo, 'label', TD.instrLabel);
            children.push(new Paragraph({ spacing: { after: 160 }, children: [
                new TextRun({ text: `${block.labelText || 'Instrucciones:'} `, bold: lT.bold, size: lT.size, color: lT.color }),
                new TextRun({ text: '{instrucciones}', size: lT.size, color: lT.color }),
            ] }));
        }

        else if (block.type === 'questions') {
            const sT = tg(block.typo, 'sectionTitle', TD.sectionTitle);
            const qT = tg(block.typo, 'question',     TD.question);
            children.push(
                tag('{#secciones}'),
                new Paragraph({ spacing: { before: 200, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D8F0' } }, children: [
                    new TextRun({ text: '{roman}. ', bold: sT.bold, size: sT.size, color: sT.color }),
                    new TextRun({ text: '{#is_sm}SELECCIÓN MÚLTIPLE{/is_sm}', bold: sT.bold, size: sT.size, color: sT.color }),
                    new TextRun({ text: '{#is_desarrollo}DESARROLLO{/is_desarrollo}', bold: sT.bold, size: sT.size, color: sT.color }),
                    new TextRun({ text: '{#is_vf}VERDADERO O FALSO{/is_vf}', bold: sT.bold, size: sT.size, color: sT.color }),
                    new TextRun({ text: '{#is_unir}UNIR CON FLECHAS{/is_unir}', bold: sT.bold, size: sT.size, color: sT.color }),
                    new TextRun({ text: '{#is_completar}COMPLETAR{/is_completar}', bold: sT.bold, size: sT.size, color: sT.color }),
                    new TextRun({ text: '  ({count} preguntas)', size: hp(9), color: LGRAY }),
                ] }),
                tag('{#preguntas}'),
                new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: '{numero}. ', bold: true, size: qT.size, color: qT.color }), new TextRun({ text: '{enunciado}', bold: qT.bold, size: qT.size, color: qT.color })] }),
                tag('{#is_sm}'),
                new Paragraph({ spacing: { after: 60 }, indent: { left: 360 }, children: [new TextRun({ text: 'a) {alt_a}   b) {alt_b}   c) {alt_c}   d) {alt_d}', size: qT.size, color: qT.color })] }),
                tag('{/is_sm}'),
                tag('{#is_vf}'), tag('{#items}'),
                new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: '{numero}. {texto}', size: qT.size, color: qT.color }), new TextRun({ text: '    [   ]', size: qT.size, color: LGRAY })] }),
                tag('{/items}'), tag('{/is_vf}'),
                tag('{#is_unir}'),
                new Table({ width: { size: 80, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } }, rows: [new TableRow({ children: [new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: 'Columna A', bold: true, size: hp(9), color: LGRAY })], spacing: { after: 40 } })] }), new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: 'Columna B', bold: true, size: hp(9), color: LGRAY })], spacing: { after: 40 } })] })] })] }),
                tag('{#items}'),
                new Table({ width: { size: 80, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } }, rows: [new TableRow({ children: [new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: '{numero}. {izquierda}', size: qT.size, color: qT.color })], spacing: { after: 60 } })] }), new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: '{letra}. {derecha}', size: qT.size, color: qT.color })], spacing: { after: 60 } })] })] })] }),
                tag('{/items}'), tag('{/is_unir}'),
                tag('{#is_completar}'), tag('{#items}'),
                new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: '{numero}. {texto}', size: qT.size, color: qT.color })] }),
                tag('{/items}'), tag('{/is_completar}'),
                tag('{#is_desarrollo}'),
                new Paragraph({ spacing: { before: 40, after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: '_______________________________________________________________________________', size: qT.size, color: 'CCCCCC' })] }),
                tag('{/is_desarrollo}'),
                tag('{/preguntas}'), tag('{/secciones}'),
            );
        }
    }

    const doc = new Document({
        sections: [{
            properties: { page: { size: { width: 12240, height: 18720 }, margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
            children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(nombreArchivo || 'plantilla').replace(/[^a-zA-Z0-9_\-]/g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ── Generador configurable ─────────────────────────────────────────────────────

/**
 * Genera y descarga una plantilla .docx a partir de un objeto de configuración.
 * @param {Object} config - Configuración del editor visual (EditorFormato)
 */
export async function generarPlantillaDesdeConfig(config) {
    const {
        schoolName    = 'Centro Educacional Ernesto Yáñez Rivera',
        schoolSubtitle = 'Huechuraba · Santiago',
        showLogo      = true,
        showEvalTitle = true,
        showAsignatura = true,
        showCurso     = true,
        showProfesor  = true,
        infoNombre    = true,
        infoFecha     = true,
        infoPuntaje   = true,
        infoCurso     = true,
        showInstructions = true,
        nombreArchivo = 'plantilla_prueba',
    } = config;

    const b = (pt) => pt * 2; // half-points → points
    const BLUE  = '1B3A8C';
    const GRAY  = '4A4A4A';
    const LGRAY = '888888';

    const nb = () => ({
        top:    { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left:   { style: BorderStyle.NONE, size: 0 },
        right:  { style: BorderStyle.NONE, size: 0 },
    });

    const cb = () => ({
        top:    { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
        left:   { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
        right:  { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
    });

    const cp = (children) => new Paragraph({ children, spacing: { after: 60, before: 60 } });

    const tag = (text) => new Paragraph({
        children: [new TextRun({ text, size: b(10) })],
        spacing: { after: 0, before: 0 },
    });

    const children = [];

    // ── Encabezado ───────────────────────────────────────────────────────────
    const headerCells = [];
    if (showLogo) {
        headerCells.push(
            new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                borders: nb(),
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                        children: [new TextRun({ text: '[ LOGO ]', size: b(9), color: 'AAAAAA' })],
                    }),
                ],
            })
        );
    }
    headerCells.push(
        new TableCell({
            width: { size: showLogo ? 64 : 100, type: WidthType.PERCENTAGE },
            borders: nb(),
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 20 },
                    children: [new TextRun({ text: schoolName.toUpperCase(), bold: true, size: b(11), color: BLUE })],
                }),
                ...(schoolSubtitle ? [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 0 },
                    children: [new TextRun({ text: schoolSubtitle, size: b(9), color: LGRAY })],
                })] : []),
            ],
        })
    );
    if (showLogo) {
        headerCells.push(
            new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                borders: nb(),
                children: [new Paragraph({ children: [] })],
            })
        );
    }

    children.push(
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } },
            rows: [new TableRow({ children: headerCells })],
        }),
        new Paragraph({
            spacing: { before: 120, after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE } },
            children: [],
        })
    );

    // ── Título evaluación ────────────────────────────────────────────────────
    if (showEvalTitle) {
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                    new TextRun({ text: showAsignatura ? 'EVALUACIÓN DE {asignatura}' : 'EVALUACIÓN', bold: true, size: b(13), color: BLUE }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [new TextRun({ text: '{titulo}', bold: true, size: b(12), color: GRAY })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 },
                children: [
                    ...(showCurso ? [new TextRun({ text: '{curso}', size: b(10), color: LGRAY })] : []),
                    ...(showCurso && showProfesor ? [new TextRun({ text: '   ·   ', size: b(10), color: LGRAY })] : []),
                    ...(showProfesor ? [new TextRun({ text: 'Profesor(a): {profesor}', size: b(10), color: LGRAY })] : []),
                ],
            })
        );
    }

    // ── Tabla alumno ─────────────────────────────────────────────────────────
    const infoRow1Cells = [];
    if (infoNombre) infoRow1Cells.push(new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE }, borders: cb(),
        children: [cp([new TextRun({ text: 'Nombre: ', size: b(10), color: LGRAY }), new TextRun({ text: '_______________________________', size: b(10), color: GRAY })])],
    }));
    if (infoFecha) infoRow1Cells.push(new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE }, borders: cb(),
        children: [cp([new TextRun({ text: 'Fecha: ', size: b(10), color: LGRAY }), new TextRun({ text: '{fecha}', size: b(10), color: GRAY })])],
    }));
    if (infoPuntaje) infoRow1Cells.push(new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE }, borders: cb(),
        children: [cp([new TextRun({ text: 'Puntaje: ', size: b(10), color: LGRAY }), new TextRun({ text: '____ / {total_puntos}', size: b(10), color: GRAY })])],
    }));

    const tableRows = [];
    if (infoRow1Cells.length) tableRows.push(new TableRow({ children: infoRow1Cells }));
    if (infoCurso) tableRows.push(new TableRow({
        children: [new TableCell({
            columnSpan: infoRow1Cells.length || 1, borders: cb(),
            children: [cp([new TextRun({ text: 'Curso: ', size: b(10), color: LGRAY }), new TextRun({ text: '___________________', size: b(10), color: GRAY })])],
        })],
    }));

    if (tableRows.length) {
        children.push(
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }),
            new Paragraph({ children: [], spacing: { after: 160 } })
        );
    }

    // ── Instrucciones ────────────────────────────────────────────────────────
    if (showInstructions) {
        children.push(
            new Paragraph({
                spacing: { after: 200 },
                children: [
                    new TextRun({ text: 'Instrucciones: ', bold: true, size: b(10), color: GRAY }),
                    new TextRun({ text: '{instrucciones}', size: b(10), color: GRAY }),
                ],
            })
        );
    }

    // ── Secciones (loop) ─────────────────────────────────────────────────────
    children.push(
        tag('{#secciones}'),
        new Paragraph({
            spacing: { before: 200, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D8F0' } },
            children: [
                new TextRun({ text: '{roman}. ', bold: true, size: b(11), color: BLUE }),
                new TextRun({ text: '{#is_sm}SELECCIÓN MÚLTIPLE{/is_sm}', bold: true, size: b(11), color: BLUE }),
                new TextRun({ text: '{#is_desarrollo}DESARROLLO{/is_desarrollo}', bold: true, size: b(11), color: BLUE }),
                new TextRun({ text: '{#is_vf}VERDADERO O FALSO{/is_vf}', bold: true, size: b(11), color: BLUE }),
                new TextRun({ text: '{#is_unir}UNIR CON FLECHAS{/is_unir}', bold: true, size: b(11), color: BLUE }),
                new TextRun({ text: '{#is_completar}COMPLETAR{/is_completar}', bold: true, size: b(11), color: BLUE }),
                new TextRun({ text: '  ({count} preguntas)', size: b(9), color: LGRAY }),
            ],
        }),
        tag('{#preguntas}'),
        new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
                new TextRun({ text: '{numero}. ', bold: true, size: b(10), color: GRAY }),
                new TextRun({ text: '{enunciado}', size: b(10), color: GRAY }),
            ],
        }),
        tag('{#is_sm}'),
        new Paragraph({
            spacing: { after: 60 }, indent: { left: 360 },
            children: [new TextRun({ text: 'a) {alt_a}   b) {alt_b}   c) {alt_c}   d) {alt_d}', size: b(10), color: GRAY })],
        }),
        tag('{/is_sm}'),
        tag('{#is_vf}'),
        tag('{#items}'),
        new Paragraph({
            spacing: { after: 40 }, indent: { left: 360 },
            children: [
                new TextRun({ text: '{numero}. {texto}', size: b(10), color: GRAY }),
                new TextRun({ text: '    [   ]', size: b(10), color: LGRAY }),
            ],
        }),
        tag('{/items}'),
        tag('{/is_vf}'),
        tag('{#is_unir}'),
        new Table({
            width: { size: 80, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } },
            rows: [new TableRow({ children: [
                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: 'Columna A', bold: true, size: b(9), color: LGRAY })], spacing: { after: 40 } })] }),
                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: 'Columna B', bold: true, size: b(9), color: LGRAY })], spacing: { after: 40 } })] }),
            ]})],
        }),
        tag('{#items}'),
        new Table({
            width: { size: 80, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } },
            rows: [new TableRow({ children: [
                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: '{numero}. {izquierda}', size: b(10), color: GRAY })], spacing: { after: 60 } })] }),
                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: nb(), children: [new Paragraph({ children: [new TextRun({ text: '{letra}. {derecha}', size: b(10), color: GRAY })], spacing: { after: 60 } })] }),
            ]})],
        }),
        tag('{/items}'),
        tag('{/is_unir}'),
        tag('{#is_completar}'),
        tag('{#items}'),
        new Paragraph({
            spacing: { after: 40 }, indent: { left: 360 },
            children: [new TextRun({ text: '{numero}. {texto}', size: b(10), color: GRAY })],
        }),
        tag('{/items}'),
        tag('{/is_completar}'),
        tag('{#is_desarrollo}'),
        new Paragraph({
            spacing: { before: 40, after: 120 }, indent: { left: 360 },
            children: [new TextRun({ text: '_______________________________________________________________________________', size: b(10), color: 'CCCCCC' })],
        }),
        tag('{/is_desarrollo}'),
        tag('{/preguntas}'),
        tag('{/secciones}'),
    );

    const doc = new Document({
        sections: [{
            properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
            children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(nombreArchivo || 'plantilla_prueba').replace(/[^a-zA-Z0-9_\-]/g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ── Plantilla de ejemplo ───────────────────────────────────────────────────────

const BLUE  = '1B3A8C';
const GRAY  = '4A4A4A';
const LGRAY = '888888';
const hp = (pt) => pt * 2;

function cellPad(children) {
    return new Paragraph({ children, spacing: { after: 60, before: 60 } });
}


function cellBorder() {
    return {
        top:    { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
        left:   { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
        right:  { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
    };
}

function noBorder() {
    return {
        top:    { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left:   { style: BorderStyle.NONE, size: 0 },
        right:  { style: BorderStyle.NONE, size: 0 },
    };
}

// Párrafo con tag de loop (solo el tag, sin texto adicional)
function loopTag(tag) {
    return new Paragraph({
        children: [new TextRun({ text: tag, size: hp(10) })],
        spacing: { after: 0, before: 0 },
    });
}

/**
 * Genera y descarga una plantilla básica funcional (.docx) lista para subir.
 * Incluye encabezado con logo placeholder, tabla de datos del alumno,
 * instrucciones y loop de secciones con todos los tipos de preguntas.
 */
export async function descargarPlantillaEjemplo() {
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, bottom: 720, left: 900, right: 900 },
                },
            },
            children: [
                // ── Logo placeholder + nombre del colegio ─────────────────────
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } },
                    rows: [
                        new TableRow({
                            children: [
                                // Logo (reemplazar por imagen real)
                                new TableCell({
                                    width: { size: 20, type: WidthType.PERCENTAGE },
                                    borders: noBorder(),
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { after: 0 },
                                            children: [new TextRun({ text: '[ LOGO ]', size: hp(9), color: 'AAAAAA' })],
                                        }),
                                    ],
                                }),
                                // Nombre colegio
                                new TableCell({
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    borders: noBorder(),
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { after: 20 },
                                            children: [new TextRun({ text: 'CENTRO EDUCACIONAL ERNESTO YÁÑEZ RIVERA', bold: true, size: hp(11), color: BLUE })],
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { after: 0 },
                                            children: [new TextRun({ text: 'Huechuraba · Santiago', size: hp(9), color: LGRAY })],
                                        }),
                                    ],
                                }),
                                // Espacio derecho
                                new TableCell({
                                    width: { size: 20, type: WidthType.PERCENTAGE },
                                    borders: noBorder(),
                                    children: [new Paragraph({ children: [] })],
                                }),
                            ],
                        }),
                    ],
                }),

                // Línea divisoria
                new Paragraph({
                    spacing: { before: 120, after: 120 },
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE } },
                    children: [],
                }),

                // ── Título de la evaluación ───────────────────────────────────
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [new TextRun({ text: 'EVALUACIÓN DE {asignatura}', bold: true, size: hp(13), color: BLUE })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [new TextRun({ text: '{titulo}', bold: true, size: hp(12), color: GRAY })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 160 },
                    children: [new TextRun({ text: '{curso}   ·   Profesor(a): {profesor}', size: hp(10), color: LGRAY })],
                }),

                // ── Tabla alumno / fecha / puntaje ────────────────────────────
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    borders: cellBorder(),
                                    children: [cellPad([
                                        new TextRun({ text: 'Nombre: ', size: hp(10), color: LGRAY }),
                                        new TextRun({ text: '_____________________________________', size: hp(10), color: GRAY }),
                                    ])],
                                }),
                                new TableCell({
                                    width: { size: 25, type: WidthType.PERCENTAGE },
                                    borders: cellBorder(),
                                    children: [cellPad([
                                        new TextRun({ text: 'Fecha: ', size: hp(10), color: LGRAY }),
                                        new TextRun({ text: '{fecha}', size: hp(10), color: GRAY }),
                                    ])],
                                }),
                                new TableCell({
                                    width: { size: 25, type: WidthType.PERCENTAGE },
                                    borders: cellBorder(),
                                    children: [cellPad([
                                        new TextRun({ text: 'Puntaje: ', size: hp(10), color: LGRAY }),
                                        new TextRun({ text: '____ / {total_puntos}', size: hp(10), color: GRAY }),
                                    ])],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 3,
                                    borders: cellBorder(),
                                    children: [cellPad([
                                        new TextRun({ text: 'Curso: ', size: hp(10), color: LGRAY }),
                                        new TextRun({ text: '_______________________', size: hp(10), color: GRAY }),
                                    ])],
                                }),
                            ],
                        }),
                    ],
                }),

                new Paragraph({ children: [], spacing: { after: 160 } }),

                // ── Instrucciones generales ───────────────────────────────────
                new Paragraph({
                    spacing: { after: 80 },
                    children: [
                        new TextRun({ text: 'Instrucciones generales: ', bold: true, size: hp(10), color: GRAY }),
                        new TextRun({ text: '{instrucciones}', size: hp(10), color: GRAY }),
                    ],
                }),

                new Paragraph({ children: [], spacing: { after: 200 } }),

                // ── Loop de secciones ─────────────────────────────────────────
                // IMPORTANTE: cada tag de loop va en su propio párrafo (paragraphLoop: true)

                loopTag('{#secciones}'),

                // Título de sección con condicionales por tipo
                new Paragraph({
                    spacing: { before: 200, after: 80 },
                    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D8F0' } },
                    children: [
                        new TextRun({ text: '{roman}. ', bold: true, size: hp(11), color: BLUE }),
                        new TextRun({ text: '{#is_sm}SELECCIÓN MÚLTIPLE{/is_sm}', bold: true, size: hp(11), color: BLUE }),
                        new TextRun({ text: '{#is_desarrollo}DESARROLLO{/is_desarrollo}', bold: true, size: hp(11), color: BLUE }),
                        new TextRun({ text: '{#is_vf}VERDADERO O FALSO{/is_vf}', bold: true, size: hp(11), color: BLUE }),
                        new TextRun({ text: '{#is_unir}UNIR CON FLECHAS{/is_unir}', bold: true, size: hp(11), color: BLUE }),
                        new TextRun({ text: '{#is_completar}COMPLETAR{/is_completar}', bold: true, size: hp(11), color: BLUE }),
                        new TextRun({ text: '  ({count} preguntas)', size: hp(9), color: LGRAY }),
                    ],
                }),

                // ── Loop de preguntas ──────────────────────────────────────
                loopTag('{#preguntas}'),

                // Enunciado de la pregunta
                new Paragraph({
                    spacing: { before: 120, after: 60 },
                    children: [
                        new TextRun({ text: '{numero}. ', bold: true, size: hp(10), color: GRAY }),
                        new TextRun({ text: '{enunciado}', size: hp(10), color: GRAY }),
                    ],
                }),

                // Selección múltiple: alternativas
                loopTag('{#is_sm}'),
                new Paragraph({
                    spacing: { after: 60 },
                    indent: { left: 360 },
                    children: [
                        new TextRun({ text: 'a) {alt_a}   b) {alt_b}   c) {alt_c}   d) {alt_d}', size: hp(10), color: GRAY }),
                    ],
                }),
                loopTag('{/is_sm}'),

                // Verdadero o Falso: ítems
                loopTag('{#is_vf}'),
                loopTag('{#items}'),
                new Paragraph({
                    spacing: { after: 40 },
                    indent: { left: 360 },
                    children: [
                        new TextRun({ text: '{numero}. {texto}', size: hp(10), color: GRAY }),
                        new TextRun({ text: '    [   ]', size: hp(10), color: LGRAY }),
                    ],
                }),
                loopTag('{/items}'),
                loopTag('{/is_vf}'),

                // Unir con flechas: tabla columna A / columna B
                loopTag('{#is_unir}'),
                new Table({
                    width: { size: 80, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    borders: noBorder(),
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Columna A', bold: true, size: hp(9), color: LGRAY })], spacing: { after: 40 } })],
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    borders: noBorder(),
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Columna B', bold: true, size: hp(9), color: LGRAY })], spacing: { after: 40 } })],
                                }),
                            ],
                        }),
                    ],
                }),
                loopTag('{#items}'),
                new Table({
                    width: { size: 80, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    borders: noBorder(),
                                    children: [new Paragraph({ children: [new TextRun({ text: '{numero}. {izquierda}', size: hp(10), color: GRAY })], spacing: { after: 60 } })],
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    borders: noBorder(),
                                    children: [new Paragraph({ children: [new TextRun({ text: '{letra}. {derecha}', size: hp(10), color: GRAY })], spacing: { after: 60 } })],
                                }),
                            ],
                        }),
                    ],
                }),
                loopTag('{/items}'),
                loopTag('{/is_unir}'),

                // Completar: ítems numerados
                loopTag('{#is_completar}'),
                loopTag('{#items}'),
                new Paragraph({
                    spacing: { after: 40 },
                    indent: { left: 360 },
                    children: [new TextRun({ text: '{numero}. {texto}', size: hp(10), color: GRAY })],
                }),
                loopTag('{/items}'),
                loopTag('{/is_completar}'),

                // Desarrollo: espacio para respuesta
                loopTag('{#is_desarrollo}'),
                new Paragraph({
                    spacing: { before: 40, after: 120 },
                    indent: { left: 360 },
                    children: [new TextRun({ text: '_______________________________________________________________________________', size: hp(10), color: 'CCCCCC' })],
                }),
                loopTag('{/is_desarrollo}'),

                loopTag('{/preguntas}'),
                loopTag('{/secciones}'),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_base_prueba.docx';
    link.click();
    URL.revokeObjectURL(link.href);
}

// ── Exportar evaluación con formato guardado ───────────────────────────────────

/**
 * Genera y descarga el .docx final de una evaluación aplicando el formato (bloques) guardado.
 * Los bloques definen el encabezado/tabla; las preguntas se generan del objeto evaluacion.
 * @param {{ bloques: Array, evaluacion: Object }} params
 */
export async function exportarConFormato({ bloques, evaluacion }) {
    const hp  = (pt) => pt * 2;
    const hx  = (c)  => (c || '#000000').replace('#', '');
    const nb  = () => ({ top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } });
    const cb  = () => ({ top: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' } });
    const cp  = (ch) => new Paragraph({ children: ch, spacing: { after: 60, before: 60 } });

    const tg = (typo, key, defaults) => ({
        color:     hx(typo?.[key]?.color     ?? defaults.color),
        size:      hp(typo?.[key]?.size      ?? defaults.size),
        bold:      typo?.[key]?.bold         ?? defaults.bold,
        italic:    typo?.[key]?.italic       ?? false,
        underline: typo?.[key]?.underline    ?? defaults.underline ?? false,
    });

    const TD = {
        schoolName:   { color: '#1B3A8C', size: 12, bold: true  },
        subtitle:     { color: '#888888', size:  9, bold: false },
        evalAsig:     { color: '#1B3A8C', size: 13, bold: true  },
        evalTitulo:   { color: '#333333', size: 12, bold: true,  underline: true },
        evalInfo:     { color: '#666666', size: 10, bold: false },
        tableLabel:   { color: '#888888', size: 10, bold: false },
        tableValue:   { color: '#4A4A4A', size: 10, bold: false },
        instrLabel:   { color: '#4A4A4A', size: 10, bold: true  },
        freeText:     { color: '#4A4A4A', size: 10, bold: false },
    };

    // Datos reales de la evaluación
    const asignaturaName = ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name || evaluacion.asignatura || '';
    const data = {
        titulo:       evaluacion.name        || '',
        asignatura:   asignaturaName,
        curso:        evaluacion.curso       || '',
        fecha:        formatFecha(evaluacion.date),
        profesor:     evaluacion.createdBy?.name || '',
        instrucciones: evaluacion.instrucciones || '',
        oa:           evaluacion.oa          || '',
        exigencia:    (evaluacion.exigencia != null ? evaluacion.exigencia : 60) + '%',
        total_puntos: evaluacion.totalPoints
            ?? (evaluacion.questions || []).reduce((acc, p) => acc + (p.puntaje ?? 1), 0),
    };

    // Variable substitution helper
    const subst = (text) => (text || '')
        .replace(/\{titulo\}/g,       data.titulo)
        .replace(/\{asignatura\}/g,   data.asignatura)
        .replace(/\{curso\}/g,        data.curso)
        .replace(/\{fecha\}/g,        data.fecha)
        .replace(/\{profesor\}/g,     data.profesor)
        .replace(/\{total_puntos\}/g, String(data.total_puntos))
        .replace(/\{oa\}/g,           data.oa)
        .replace(/\{instrucciones\}/g, data.instrucciones);

    const children = [];

    for (const block of (bloques || [])) {
        if (block.type === 'header') {
            const snT = tg(block.typo, 'schoolName', TD.schoolName);
            const stT = tg(block.typo, 'subtitle',   TD.subtitle);
            const showCalif = block.showCalificacion ?? true;
            const sb = () => ({ top: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' }, left: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'C0C0C0' } });
            const logoChildren = block.logoBase64
                ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new ImageRun({ data: block.logoBase64.split(',')[1], type: block.logoType || 'png', transformation: { width: 55, height: 55 } })] })]
                : [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: '[ LOGO ]', size: hp(9), color: 'AAAAAA' })] })];
            const infoChildren = [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: (block.schoolName || '').toUpperCase(), bold: snT.bold, size: snT.size, color: snT.color })] }),
                ...(block.schoolSubtitle ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: block.schoolSubtitle, bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
                ...((block.showUTP ?? true) ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: 'Unidad Técnica Pedagógica', bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
                ...((block.showAsignaturaInHeader ?? true) ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: `Asignatura: ${data.asignatura}`, bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
                ...((block.showProfesorInHeader ?? true) ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: `Profesor: ${data.profesor}`, bold: stT.bold, size: stT.size, color: stT.color })] })] : []),
            ];
            const cells = [];
            if (block.showLogo) cells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: sb(), children: logoChildren }));
            cells.push(new TableCell({ width: { size: (block.showLogo ? 70 : showCalif ? 85 : 100), type: WidthType.PERCENTAGE }, borders: sb(), children: infoChildren }));
            if (showCalif) cells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: sb(), children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: block.calificacionLabel || 'CALIFICACIÓN', bold: true, size: hp(10), color: '333333' })] })] }));
            else if (block.showLogo && block.logoSide === 'both') cells.push(new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: sb(), children: logoChildren }));
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 }, insideH: { style: BorderStyle.NONE, size: 0 }, insideV: { style: BorderStyle.NONE, size: 0 } }, rows: [new TableRow({ children: cells })] }), new Paragraph({ children: [], spacing: { after: 80 } }));
        }

        else if (block.type === 'divider') {
            children.push(new Paragraph({ spacing: { before: 80, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: (block.thickness || 2) * 4, color: hx(block.color) } }, children: [] }));
        }

        else if (block.type === 'eval_title') {
            const tT = tg(block.typo, 'titulo', TD.evalTitulo);
            const iT = tg(block.typo, 'info',   TD.evalInfo);
            const align = block.align === 'left' ? AlignmentType.LEFT : AlignmentType.CENTER;
            if (block.showAsignatura) children.push(new Paragraph({ alignment: align, spacing: { after: 40 }, children: [new TextRun({ text: `EVALUACIÓN DE ${data.asignatura}`.toUpperCase(), bold: true, size: hp(13), color: hx('#1B3A8C') })] }));
            children.push(new Paragraph({ alignment: align, spacing: { after: 40 }, children: [new TextRun({ text: data.titulo.toUpperCase(), bold: tT.bold, size: tT.size, color: tT.color, underline: tT.underline ? {} : undefined })] }));
            const infoRuns = [];
            if (block.showCurso && data.curso) infoRuns.push(new TextRun({ text: data.curso, bold: iT.bold, size: iT.size, color: iT.color }));
            if (block.showCurso && block.showProfesor && data.curso && data.profesor) infoRuns.push(new TextRun({ text: '   ·   ', size: iT.size, color: iT.color }));
            if (block.showProfesor && data.profesor) infoRuns.push(new TextRun({ text: `Profesor(a): ${data.profesor}`, bold: iT.bold, size: iT.size, color: iT.color }));
            if (infoRuns.length > 0) children.push(new Paragraph({ alignment: align, spacing: { after: 120 }, children: infoRuns }));
        }

        else if (block.type === 'info_table') {
            const layout = INFO_LAYOUTS[block.layout] || INFO_LAYOUTS['n-f-p'];
            const labels = block.customLabels || {};
            const lT = tg(block.typo, 'label', TD.tableLabel);
            const vT = tg(block.typo, 'value', TD.tableValue);
            const nCols = layout.cols.length;
            const getCells = (cols) => cols.map(col => {
                const label = labels[col.field] ?? col.label;
                let valueRun;
                if (col.field === 'nombre')  valueRun = new TextRun({ text: '_______________________________', bold: vT.bold, size: vT.size, color: vT.color });
                else if (col.field === 'curso')   valueRun = new TextRun({ text: data.curso, bold: vT.bold, size: vT.size, color: vT.color });
                else if (col.field === 'fecha')   valueRun = new TextRun({ text: data.fecha, bold: vT.bold, size: vT.size, color: vT.color });
                else if (col.field === 'puntaje') valueRun = new TextRun({ text: `___ / ${data.total_puntos} pts`, bold: vT.bold, size: vT.size, color: vT.color });
                else valueRun = new TextRun({ text: '_______________', bold: vT.bold, size: vT.size, color: vT.color });
                return new TableCell({ width: { size: col.w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: `${label}: `, bold: lT.bold, size: lT.size, color: lT.color }), valueRun])] });
            });
            const rows = [new TableRow({ children: getCells(layout.cols) })];
            if (block.showCursoRow) rows.push(new TableRow({ children: [new TableCell({ columnSpan: nCols, borders: cb(), children: [cp([new TextRun({ text: 'Curso: ', bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: data.curso, bold: vT.bold, size: vT.size, color: vT.color })])] })] }));
            if (block.showExigenciaRow && nCols >= 2) {
                const exCells = [
                    new TableCell({ width: { size: layout.cols[0].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: `${block.exigenciaLabel || 'Exigencia:'} `, bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: data.exigencia || '___', bold: vT.bold, size: vT.size, color: vT.color })])] }),
                    new TableCell({ width: { size: layout.cols[1].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: `${block.puntajeIdealLabel || 'Puntaje Ideal:'} `, bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: `${data.total_puntos} pts`, bold: vT.bold, size: vT.size, color: vT.color })])] }),
                ];
                if (nCols >= 3) exCells.push(new TableCell({ columnSpan: nCols - 2, borders: cb(), children: [cp([new TextRun({ text: `${block.puntajeObtenidoLabel || 'Puntaje Obtenido:'} `, bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: '___', bold: vT.bold, size: vT.size, color: vT.color })])] }));
                rows.push(new TableRow({ children: exCells }));
            }
            if (block.showOARow) rows.push(new TableRow({ children: [new TableCell({ width: { size: layout.cols[0].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: block.oaLabel || 'Objetivo de Aprendizaje:', bold: lT.bold, size: lT.size, color: lT.color })])] }), new TableCell({ columnSpan: nCols - 1, borders: cb(), children: [cp([new TextRun({ text: data.oa, bold: vT.bold, size: vT.size, color: vT.color })])] })] }));
            if (block.showInstruccionesInTable) rows.push(new TableRow({ children: [new TableCell({ width: { size: layout.cols[0].w, type: WidthType.PERCENTAGE }, borders: cb(), children: [cp([new TextRun({ text: block.instrTableLabel || 'Instrucciones:', bold: lT.bold, size: lT.size, color: lT.color })])] }), new TableCell({ columnSpan: nCols - 1, borders: cb(), children: [cp([new TextRun({ text: data.instrucciones, bold: vT.bold, size: vT.size, color: vT.color })])] })] }));
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }), new Paragraph({ children: [], spacing: { after: 120 } }));
        }

        else if (block.type === 'free_text') {
            const fT = tg(block.typo, 'text', TD.freeText);
            const align = block.align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
            children.push(new Paragraph({ alignment: align, spacing: { after: 80 }, children: [new TextRun({ text: subst(block.content || ''), bold: fT.bold, italics: fT.italic, size: fT.size, color: fT.color })] }));
        }

        else if (block.type === 'instructions') {
            const lT = tg(block.typo, 'label', TD.instrLabel);
            children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `${block.labelText || 'Instrucciones:'} `, bold: lT.bold, size: lT.size, color: lT.color }), new TextRun({ text: data.instrucciones, size: lT.size, color: lT.color })] }));
        }
    }

    // Pre-fetch imágenes para preguntas
    const preguntas = (evaluacion.questions || []).filter(q => q.enunciado || ['verdadero_falso','unir','completar'].includes(q.tipo));
    const imageBuffers = {};
    await Promise.all(preguntas.filter(p => p.imagen?.url).map(async (p) => {
        try { const res = await fetch(p.imagen.url); imageBuffers[p.number] = await res.arrayBuffer(); } catch {}
    }));

    // Secciones de preguntas
    children.push(...generarSeccionesPreguntas({ preguntas, instrucciones: data.instrucciones, imageBuffers }));

    const doc = new Document({
        sections: [{
            properties: { page: { size: { width: 12240, height: 18720 }, margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
            children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(evaluacion.name || 'prueba').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
}

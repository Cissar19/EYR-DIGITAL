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
    Packer, AlignmentType, WidthType, BorderStyle,
} from 'docx';
import { ASIGNATURAS } from '../data/objetivosAprendizaje';

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

// ── Datos para la plantilla ────────────────────────────────────────────────────

/**
 * Construye el objeto de datos para la sustitución de variables en la plantilla.
 * @param {Object} evaluacion - Objeto de evaluación con preguntas, metadatos, etc.
 * @returns {Object}
 */
export function prepararDatosPlantilla(evaluacion) {
    const preguntas = (evaluacion.questions || []).filter(q => q.enunciado);

    return {
        titulo: evaluacion.name || '',
        asignatura: ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name || evaluacion.asignatura || '',
        curso: evaluacion.curso || '',
        fecha: formatFecha(evaluacion.date),
        profesor: evaluacion.createdBy?.name || '',
        instrucciones: evaluacion.instrucciones || '',
        total_puntos: calcTotalPuntos(preguntas),

        // Preguntas de selección múltiple
        preguntas_sm: preguntas
            .filter(p => p.tipo === 'seleccion_multiple')
            .map((p, i) => ({
                numero: i + 1,
                enunciado: p.enunciado,
                alt_a: p.alternativas?.a || '',
                alt_b: p.alternativas?.b || '',
                alt_c: p.alternativas?.c || '',
                alt_d: p.alternativas?.d || '',
            })),

        // Preguntas de desarrollo
        preguntas_desarrollo: preguntas
            .filter(p => p.tipo === 'desarrollo')
            .map((p, i) => ({
                numero: i + 1,
                enunciado: p.enunciado,
            })),

        // Bloques verdadero/falso
        bloques_vf: preguntas
            .filter(p => p.tipo === 'verdadero_falso')
            .map((p) => ({
                instruccion: p.instruccionItems || '',
                enunciado: p.enunciado || '',
                items: (p.items || []).map((item, idx) => ({
                    numero: idx + 1,
                    texto: item.texto,
                })),
            })),

        // Bloques unir con flechas
        bloques_unir: preguntas
            .filter(p => p.tipo === 'unir')
            .map((p) => ({
                instruccion: p.instruccionItems || '',
                enunciado: p.enunciado || '',
                pares: (p.items || []).map((item, idx) => ({
                    numero: idx + 1,
                    izquierda: item.izquierda,
                    letra: String.fromCharCode(65 + idx),
                    derecha: item.derecha,
                })),
            })),

        // Bloques completar
        bloques_completar: preguntas
            .filter(p => p.tipo === 'completar')
            .map((p) => ({
                instruccion: p.instruccionItems || '',
                enunciado: p.enunciado || '',
                items: (p.items || []).map((item, idx) => ({
                    numero: idx + 1,
                    texto: item.texto,
                })),
            })),
    };
}

// ── Exportar con plantilla ─────────────────────────────────────────────────────

/**
 * Descarga la prueba usando la plantilla .docx subida.
 * @param {Object} params
 * @param {string} params.templateUrl - URL de la plantilla en Firebase Storage
 * @param {Object} params.evaluacion  - Objeto de evaluación
 */
export async function exportarConPlantilla({ templateUrl, evaluacion }) {
    const response = await fetch(templateUrl);
    if (!response.ok) {
        throw new Error('No se pudo descargar la plantilla del servidor');
    }
    const buffer = await response.arrayBuffer();

    const zip = new PizZip(buffer);
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

// ── Plantilla de ejemplo ───────────────────────────────────────────────────────

const BLUE = '1B3A8C';
const GRAY = '555555';
const hp = (pt) => pt * 2;

function p(children, opts = {}) {
    return new Paragraph({ children, spacing: { after: 80 }, ...opts });
}

function bold(text, color) {
    return new TextRun({ text, bold: true, size: hp(11), color: color || GRAY });
}

function normal(text) {
    return new TextRun({ text, size: hp(10), color: GRAY });
}

function mono(text) {
    return new TextRun({ text, size: hp(10), color: '1B6B3A', font: 'Courier New' });
}

function sectionTitle(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: hp(11), color: BLUE })],
        spacing: { before: 200, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D8F0' } },
    });
}

function varRow(variable, descripcion) {
    return new TableRow({
        children: [
            new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [mono(variable)], spacing: { after: 0 } })],
            }),
            new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [normal(descripcion)], spacing: { after: 0 } })],
            }),
        ],
    });
}

/**
 * Genera y descarga una plantilla de ejemplo (.docx) que muestra todas las
 * variables disponibles con comentarios de sintaxis docxtemplater.
 */
export async function descargarPlantillaEjemplo() {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // ── Encabezado escuela ────────────────────────────────────────
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [new TextRun({
                        text: 'CENTRO EDUCACIONAL ERNESTO YÁÑEZ RIVERA',
                        bold: true, size: hp(13), color: BLUE,
                    })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: 'Huechuraba · Santiago', size: hp(9), color: GRAY })],
                }),

                // ── Título de la prueba ───────────────────────────────────────
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [bold('{titulo}', BLUE)],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [normal('{asignatura}   |   {curso}')],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [normal('Profesor(a): {profesor}')],
                }),

                // ── Tabla alumno/fecha/puntaje ────────────────────────────────
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [p([normal('Nombre: ___________________________________')])],
                                }),
                                new TableCell({
                                    width: { size: 25, type: WidthType.PERCENTAGE },
                                    children: [p([normal('Fecha: {fecha}')])],
                                }),
                                new TableCell({
                                    width: { size: 25, type: WidthType.PERCENTAGE },
                                    children: [p([normal('Puntaje: ___ / {total_puntos}')])],
                                }),
                            ],
                        }),
                    ],
                }),

                new Paragraph({ children: [], spacing: { after: 120 } }),

                // ── Instrucciones ─────────────────────────────────────────────
                p([bold('Instrucciones: '), normal('{instrucciones}')]),

                new Paragraph({ children: [], spacing: { after: 200 } }),

                // ── Guía de variables ─────────────────────────────────────────
                sectionTitle('Variables disponibles (eliminar esta sección en tu plantilla real)'),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        varRow('{titulo}',        'Nombre de la evaluación'),
                        varRow('{asignatura}',     'Asignatura'),
                        varRow('{curso}',          'Curso'),
                        varRow('{fecha}',          'Fecha formateada (ej: 31 de marzo de 2026)'),
                        varRow('{profesor}',       'Nombre del profesor/a'),
                        varRow('{instrucciones}',  'Instrucciones generales'),
                        varRow('{total_puntos}',   'Total de puntos de la prueba'),
                    ],
                }),

                new Paragraph({ children: [], spacing: { after: 200 } }),

                // ── Selección múltiple loop ───────────────────────────────────
                sectionTitle('Selección múltiple: {#preguntas_sm} ... {/preguntas_sm}'),
                p([mono('{#preguntas_sm}')]),
                p([mono('{numero}. {enunciado}')]),
                p([mono('   a) {alt_a}')]),
                p([mono('   b) {alt_b}')]),
                p([mono('   c) {alt_c}')]),
                p([mono('   d) {alt_d}')]),
                p([mono('{/preguntas_sm}')]),

                new Paragraph({ children: [], spacing: { after: 120 } }),

                // ── Desarrollo loop ───────────────────────────────────────────
                sectionTitle('Desarrollo: {#preguntas_desarrollo} ... {/preguntas_desarrollo}'),
                p([mono('{#preguntas_desarrollo}')]),
                p([mono('{numero}. {enunciado}')]),
                p([mono('{/preguntas_desarrollo}')]),

                new Paragraph({ children: [], spacing: { after: 120 } }),

                // ── Verdadero/Falso loop ──────────────────────────────────────
                sectionTitle('Verdadero o Falso: {#bloques_vf} ... {/bloques_vf}'),
                p([mono('{#bloques_vf}')]),
                p([mono('{instruccion}')]),
                p([mono('{enunciado}')]),
                p([mono('{#items}{numero}. {texto}{/items}')]),
                p([mono('{/bloques_vf}')]),

                new Paragraph({ children: [], spacing: { after: 120 } }),

                // ── Unir loop ─────────────────────────────────────────────────
                sectionTitle('Unir con flechas: {#bloques_unir} ... {/bloques_unir}'),
                p([mono('{#bloques_unir}')]),
                p([mono('{instruccion}')]),
                p([mono('{enunciado}')]),
                p([mono('{#pares}{numero}. {izquierda}   {letra}. {derecha}{/pares}')]),
                p([mono('{/bloques_unir}')]),

                new Paragraph({ children: [], spacing: { after: 120 } }),

                // ── Completar loop ────────────────────────────────────────────
                sectionTitle('Completar: {#bloques_completar} ... {/bloques_completar}'),
                p([mono('{#bloques_completar}')]),
                p([mono('{instruccion}')]),
                p([mono('{enunciado}')]),
                p([mono('{#items}{numero}. {texto}{/items}')]),
                p([mono('{/bloques_completar}')]),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_ejemplo_prueba.docx';
    link.click();
    URL.revokeObjectURL(link.href);
}

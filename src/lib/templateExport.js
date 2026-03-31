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

                // ── Secciones loop ────────────────────────────────────────────
                sectionTitle('Secciones: {#secciones} ... {/secciones}  (orden del profesor)'),
                p([normal('Las secciones aparecen en el orden en que el profesor creó los tipos de preguntas.')]),
                p([normal('Ejemplo: si la primera pregunta es Verdadero/Falso, esa sección va primero.')]),
                new Paragraph({ children: [], spacing: { after: 80 } }),

                p([mono('{#secciones}')]),
                p([bold('  Variables de sección:')]),
                p([mono('    {roman}        '), normal('→  Número romano (I, II, III…)')]),
                p([mono('    {count}        '), normal('→  Cantidad de preguntas en la sección')]),
                p([mono('    {#is_sm}       '), normal('→  Bloque solo para Selección Múltiple')]),
                p([mono('    {#is_desarrollo}'), normal('→  Bloque solo para Desarrollo')]),
                p([mono('    {#is_vf}       '), normal('→  Bloque solo para Verdadero o Falso')]),
                p([mono('    {#is_unir}     '), normal('→  Bloque solo para Unir con Flechas')]),
                p([mono('    {#is_completar}'), normal('→  Bloque solo para Completar')]),
                new Paragraph({ children: [], spacing: { after: 80 } }),

                p([bold('  Preguntas dentro de cada sección: {#preguntas} ... {/preguntas}')]),
                p([mono('    {numero}       '), normal('→  Número de la pregunta dentro de la sección')]),
                p([mono('    {enunciado}    '), normal('→  Texto de la pregunta')]),
                p([mono('    {instruccion}  '), normal('→  Instrucción del bloque (VF, unir, completar)')]),
                p([mono('    {alt_a} {alt_b} {alt_c} {alt_d}'), normal('  →  Alternativas (solo SM)')]),
                new Paragraph({ children: [], spacing: { after: 80 } }),

                p([bold('  Ítems dentro de preguntas: {#items} ... {/items}')]),
                p([mono('    {numero}       '), normal('→  Número del ítem')]),
                p([mono('    {texto}        '), normal('→  Texto del ítem (VF, completar)')]),
                p([mono('    {izquierda}    '), normal('→  Columna A (unir)')]),
                p([mono('    {derecha}      '), normal('→  Columna B (unir)')]),
                p([mono('    {letra}        '), normal('→  Letra columna B: A, B, C… (unir)')]),
                p([mono('{/secciones}')]),

                new Paragraph({ children: [], spacing: { after: 200 } }),

                sectionTitle('Ejemplo de uso completo:'),
                p([mono('{#secciones}')]),
                p([mono('{roman}. {#is_sm}SELECCIÓN MÚLTIPLE{/is_sm}{#is_desarrollo}DESARROLLO{/is_desarrollo}{#is_vf}VERDADERO O FALSO{/is_vf}{#is_unir}UNIR CON FLECHAS{/is_unir}{#is_completar}COMPLETAR{/is_completar}')]),
                p([mono('{#preguntas}')]),
                p([mono('  {numero}. {enunciado}')]),
                p([mono('  {#is_sm}')]),
                p([mono('    a) {alt_a}  b) {alt_b}  c) {alt_c}  d) {alt_d}')]),
                p([mono('  {/is_sm}')]),
                p([mono('  {#is_vf}{#items}    {numero}. {texto}{/items}{/is_vf}')]),
                p([mono('  {#is_unir}{#items}    {numero}. {izquierda}   {letra}. {derecha}{/items}{/is_unir}')]),
                p([mono('  {#is_completar}{#items}    {numero}. {texto}{/items}{/is_completar}')]),
                p([mono('{/preguntas}')]),
                p([mono('{/secciones}')]),
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

/**
 * docxExport.js
 *
 * Genera un archivo .docx de la prueba con el formato EYR
 * directamente en el browser (sin servicios externos).
 *
 * Las secciones de preguntas se ordenan según el tipo que aparece primero
 * en la evaluación (respetando el orden del profesor).
 */
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Packer, AlignmentType, BorderStyle, WidthType, ShadingType,
  convertMillimetersToTwip,
} from 'docx';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** half-points (unidad de tamaño de fuente en docx) */
const hp = (pt) => pt * 2;

/** milímetros a twips */
const mm = convertMillimetersToTwip;

const BLUE  = '1B3A8C';
const GRAY  = '555555';
const LGRAY = '888888';
const LBLUE = 'E8EDF7';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const DEFAULT_TITULOS = {
  seleccion_multiple: 'SELECCIÓN MÚLTIPLE',
  desarrollo:         'DESARROLLO',
  verdadero_falso:    'VERDADERO O FALSO',
  unir:               'UNIR CON FLECHAS',
  completar:          'COMPLETAR',
};

const TIPOS_CON_ITEMS = ['verdadero_falso', 'unir', 'completar'];

// ── Bloques de encabezado ─────────────────────────────────────────────────────

function encabezadoEscuela() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: mm(1) },
      children: [new TextRun({
        text: 'CENTRO EDUCACIONAL ERNESTO YÁÑEZ RIVERA',
        bold: true, size: hp(13), color: BLUE,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: mm(3) },
      children: [new TextRun({
        text: 'Huechuraba · Santiago',
        size: hp(9), color: GRAY,
      })],
    }),
  ];
}

function tituloPrueba(nombre, asignatura, curso, profesor) {
  const items = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: mm(2), after: mm(1) },
      children: [new TextRun({
        text: nombre.toUpperCase(),
        bold: true, size: hp(15), color: BLUE,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: mm(1) },
      children: [new TextRun({
        text: `${asignatura}   |   ${curso}`,
        size: hp(10), italics: true, color: GRAY,
      })],
    }),
  ];

  if (profesor) {
    items.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: mm(3) },
      children: [new TextRun({
        text: `Profesor(a): ${profesor}`,
        size: hp(10), color: GRAY,
      })],
    }));
  }

  return items;
}

function tablaDatosAlumno(fechaLabel, curso, totalPuntos) {
  const labelCell = (text, widthPct = 15) => new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: LBLUE, fill: LBLUE },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: hp(10), color: BLUE })],
    })],
  });

  const valueCell = (text, widthPct = 35) => new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text, size: hp(10) })],
    })],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      bottom:  { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      left:    { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      right:   { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: BLUE },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: BLUE },
    },
    rows: [
      new TableRow({ children: [
        labelCell('Nombre:', 15),
        valueCell('', 35),
        labelCell('Fecha:', 15),
        valueCell(fechaLabel, 35),
      ]}),
      new TableRow({ children: [
        labelCell('Curso:', 15),
        valueCell(curso, 35),
        labelCell('Puntaje:', 15),
        valueCell(`_______ / ${totalPuntos} pts`, 35),
      ]}),
    ],
  });
}

function instruccionGeneral(texto) {
  return new Paragraph({
    spacing: { before: mm(4), after: mm(2) },
    children: [new TextRun({
      text: texto || 'Lee atentamente cada pregunta. Responde con letra clara y ordenada.',
      size: hp(10), italics: true, color: GRAY,
    })],
  });
}

function encabezadoSeccion(roman, titulo) {
  return new Paragraph({
    spacing: { before: mm(5), after: mm(2) },
    children: [new TextRun({ text: `${roman}.  ${titulo}`, bold: true, size: hp(11), color: BLUE })],
  });
}

function instruccionSeccion(texto) {
  return new Paragraph({
    spacing: { after: mm(3) },
    children: [new TextRun({ text: texto, size: hp(10), italics: true, color: GRAY })],
  });
}

function preguntaParrafo(num, enunciado) {
  return new Paragraph({
    spacing: { before: mm(2), after: mm(1) },
    children: [new TextRun({ text: `${num}.  ${enunciado}`, size: hp(11) })],
  });
}

function alternativaParrafo(letra, texto) {
  return new Paragraph({
    indent: { left: mm(10) },
    spacing: { after: mm(0.5) },
    children: [new TextRun({ text: `${letra})  ${texto}`, size: hp(11) })],
  });
}

function lineaRespuesta() {
  return new Paragraph({
    spacing: { before: mm(2) },
    children: [new TextRun({
      text: ' '.repeat(90),
      underline: {},
      size: hp(11),
    })],
  });
}

const IMG_MAX_WIDTH_PX = 400;

function imagenParrafo(buffer, aspectRatio = 1) {
  const width  = IMG_MAX_WIDTH_PX;
  const height = Math.max(1, Math.round(width / aspectRatio));
  return new Paragraph({
    spacing: { before: mm(2), after: mm(2) },
    children: [new ImageRun({
      data: buffer,
      transformation: { width, height },
    })],
  });
}

function piePagina() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: mm(6) },
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE } },
    children: [new TextRun({
      text: 'EYR Digital · Centro Educacional Ernesto Yáñez Rivera · Huechuraba',
      size: hp(9), italics: true, color: LGRAY,
    })],
  });
}

// ── Renderizadores por tipo ───────────────────────────────────────────────────

function renderVerdaderoFalso(preguntas) {
  const nodes = [];
  for (const p of preguntas) {
    if (p.enunciado) nodes.push(preguntaParrafo('', p.enunciado));

    const rows = (p.items || []).map((item, idx) => new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: `${idx + 1}.`, size: hp(10), color: GRAY })] })],
        }),
        new TableCell({
          width: { size: 72, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: item.texto, size: hp(10) })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, left: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, right: { style: BorderStyle.SINGLE, size: 4, color: BLUE } },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'V', bold: true, size: hp(10), color: BLUE })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, left: { style: BorderStyle.SINGLE, size: 4, color: BLUE }, right: { style: BorderStyle.SINGLE, size: 4, color: BLUE } },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'F', bold: true, size: hp(10), color: BLUE })] })],
        }),
      ],
    }));

    if (rows.length > 0) {
      nodes.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
        },
        rows,
      }));
    }
    nodes.push(new Paragraph({ children: [], spacing: { after: mm(3) } }));
  }
  return nodes;
}

function renderUnir(preguntas) {
  const nodes = [];
  for (const p of preguntas) {
    if (p.enunciado) nodes.push(preguntaParrafo('', p.enunciado));

    const items = p.items || [];
    const rows = items.map((item, idx) => new TableRow({
      children: [
        // Columna A
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: `${idx + 1}.`, size: hp(10), color: GRAY })] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: item.izquierda, size: hp(10) })] })],
        }),
        // Espacio
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [] })],
        }),
        // Columna B
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: `${String.fromCharCode(65 + idx)}.`, bold: true, size: hp(10), color: BLUE })] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: item.derecha, size: hp(10) })] })],
        }),
      ],
    }));

    // Header row for columns
    const headerRow = new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: 'Columna A', bold: true, size: hp(9), color: BLUE })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: 'Columna B', bold: true, size: hp(9), color: BLUE })] })],
        }),
      ],
    });

    if (rows.length > 0) {
      nodes.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
        },
        rows: [headerRow, ...rows],
      }));
    }
    nodes.push(new Paragraph({ children: [], spacing: { after: mm(3) } }));
  }
  return nodes;
}

function renderCompletar(preguntas) {
  const nodes = [];
  for (const p of preguntas) {
    if (p.enunciado) nodes.push(preguntaParrafo('', p.enunciado));

    for (const [idx, item] of (p.items || []).entries()) {
      // Reemplazar ___ por espacio subrayado
      const partes = item.texto.split('___');
      const runs = [];
      partes.forEach((parte, i) => {
        runs.push(new TextRun({ text: parte, size: hp(10) }));
        if (i < partes.length - 1) {
          runs.push(new TextRun({ text: '  '.repeat(12), underline: {}, size: hp(10) }));
        }
      });

      nodes.push(new Paragraph({
        indent: { left: mm(5) },
        spacing: { before: mm(1.5), after: mm(0.5) },
        children: [
          new TextRun({ text: `${idx + 1}.  `, size: hp(10), color: GRAY }),
          ...runs,
        ],
      }));
    }
    nodes.push(new Paragraph({ children: [], spacing: { after: mm(2) } }));
  }
  return nodes;
}

// ── Exportar ──────────────────────────────────────────────────────────────────

/**
 * Genera y descarga un .docx con la prueba formateada.
 * Las secciones respetan el orden del primer tipo que aparece en la evaluación.
 *
 * @param {{
 *   nombre: string,
 *   asignatura: string,
 *   curso: string,
 *   fecha: string,        // YYYY-MM-DD
 *   profesor: string,
 *   instrucciones?: string,
 *   preguntas: Array,
 *   formato?: Object,     // de formatoConfig (títulos e instrucciones por tipo)
 * }} params
 */
export async function exportarPrueba({ nombre, asignatura, curso, fecha, profesor, instrucciones, preguntas, formato }) {
  // Formatear fecha
  let fechaLabel = fecha;
  try {
    const [y, m, d] = fecha.split('-');
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio',
                   'agosto','septiembre','octubre','noviembre','diciembre'];
    fechaLabel = `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
  } catch (_) {}

  // Pre-fetch de imágenes
  const imageBuffers = {};
  await Promise.all(
    preguntas
      .filter(p => p.imagen?.url)
      .map(async (p) => {
        try {
          const res = await fetch(p.imagen.url);
          imageBuffers[p.number] = await res.arrayBuffer();
        } catch { /* exportar sin imagen si falla */ }
      })
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

  const totalPuntos = preguntas.reduce((acc, p) => {
    if (TIPOS_CON_ITEMS.includes(p.tipo)) return acc + (p.items?.length || 1);
    return acc + 1;
  }, 0);

  const titulosPorTipo      = formato?.titulosPorTipo      || DEFAULT_TITULOS;
  const instruccionesPorTipo = formato?.instruccionesPorTipo || {};

  const children = [
    ...encabezadoEscuela(),
    ...tituloPrueba(nombre, asignatura, curso, profesor),
    tablaDatosAlumno(fechaLabel, curso, totalPuntos),
    instruccionGeneral(instrucciones?.trim() || formato?.instruccionesGenerales),
  ];

  tiposEnOrden.forEach((tipo, sIdx) => {
    const secPreguntas = gruposPorTipo[tipo];
    const roman = ROMAN[sIdx] || String(sIdx + 1);
    const titulo = titulosPorTipo[tipo] || DEFAULT_TITULOS[tipo] || tipo.toUpperCase();

    children.push(encabezadoSeccion(roman, titulo));

    // Instrucción de sección
    const instruccionCustom = instruccionesPorTipo[tipo];
    if (tipo === 'seleccion_multiple') {
      const count = secPreguntas.length;
      children.push(instruccionSeccion(
        instruccionCustom || `Marca con una X la alternativa correcta. (${count} pregunta${count !== 1 ? 's' : ''})`
      ));
    } else if (tipo === 'desarrollo') {
      const count = secPreguntas.length;
      children.push(instruccionSeccion(
        instruccionCustom || `Responde con letra clara. (${count} pregunta${count !== 1 ? 's' : ''})`
      ));
    } else if (instruccionCustom) {
      children.push(instruccionSeccion(instruccionCustom));
    }

    // Contenido según tipo
    if (tipo === 'seleccion_multiple') {
      let qNum = 0;
      for (const p of secPreguntas) {
        qNum++;
        children.push(preguntaParrafo(qNum, p.enunciado));
        if (imageBuffers[p.number]) {
          children.push(imagenParrafo(imageBuffers[p.number], p.imagen?.aspectRatio));
        }
        const altKeys = Object.keys(p.alternativas || {})
          .filter(k => ['a','b','c','d'].includes(k)).sort();
        for (const letra of altKeys) {
          children.push(alternativaParrafo(letra, p.alternativas[letra]));
        }
      }

    } else if (tipo === 'desarrollo') {
      let qNum = 0;
      for (const p of secPreguntas) {
        qNum++;
        children.push(preguntaParrafo(qNum, p.enunciado));
        if (imageBuffers[p.number]) {
          children.push(imagenParrafo(imageBuffers[p.number], p.imagen?.aspectRatio));
        }
        children.push(lineaRespuesta());
        children.push(lineaRespuesta());
        children.push(lineaRespuesta());
      }

    } else if (tipo === 'verdadero_falso') {
      children.push(...renderVerdaderoFalso(secPreguntas));

    } else if (tipo === 'unir') {
      children.push(...renderUnir(secPreguntas));

    } else if (tipo === 'completar') {
      children.push(...renderCompletar(secPreguntas));
    }
  });

  children.push(piePagina());

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: mm(20), bottom: mm(20), left: mm(25), right: mm(25) },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${nombre} - ${curso}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

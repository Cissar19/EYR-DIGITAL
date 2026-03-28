/**
 * docxExport.js
 *
 * Genera un archivo .docx de la prueba con el formato EYR
 * directamente en el browser (sin servicios externos).
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

// ── Bloques de contenido ──────────────────────────────────────────────────────

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
      top:          { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      bottom:       { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      left:         { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      right:        { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      insideH:      { style: BorderStyle.SINGLE, size: 2, color: BLUE },
      insideV:      { style: BorderStyle.SINGLE, size: 2, color: BLUE },
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

function instruccionGeneral() {
  return new Paragraph({
    spacing: { before: mm(4), after: mm(2) },
    children: [new TextRun({
      text: 'Lee atentamente cada pregunta. Responde con letra clara y ordenada.',
      size: hp(10), italics: true, color: GRAY,
    })],
  });
}

function encabezadoSeccion(texto) {
  return new Paragraph({
    spacing: { before: mm(5), after: mm(2) },
    children: [new TextRun({ text: texto, bold: true, size: hp(11), color: BLUE })],
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

/**
 * Ancho usable en la página: 210mm - 25mm*2 = 160mm.
 * A 96 DPI: 160mm / 25.4 * 96 ≈ 605 px (unidad que usa ImageRun).
 * Limitamos a 400px para dejar margen a texto lateral.
 */
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

// ── Exportar ──────────────────────────────────────────────────────────────────

/**
 * Genera y descarga un .docx con la prueba formateada.
 *
 * @param {{
 *   nombre: string,
 *   asignatura: string,   // nombre completo
 *   curso: string,
 *   fecha: string,        // YYYY-MM-DD
 *   profesor: string,
 *   preguntas: Array<{ number, enunciado, alternativas, tipo }>
 * }} params
 */
export async function exportarPrueba({ nombre, asignatura, curso, fecha, profesor, preguntas }) {
  // Formatear fecha
  let fechaLabel = fecha;
  try {
    const [y, m, d] = fecha.split('-');
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio',
                   'agosto','septiembre','octubre','noviembre','diciembre'];
    fechaLabel = `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
  } catch (_) {}

  // Pre-fetch de imágenes: { [questionNumber]: ArrayBuffer }
  const imageBuffers = {};
  await Promise.all(
    preguntas
      .filter(p => p.imagen?.url)
      .map(async (p) => {
        try {
          const res = await fetch(p.imagen.url);
          imageBuffers[p.number] = await res.arrayBuffer();
        } catch {
          // Si falla la descarga, la pregunta se exporta sin imagen
        }
      })
  );

  const smPreguntas  = preguntas.filter(p => p.tipo === 'seleccion_multiple');
  const devPreguntas = preguntas.filter(p => p.tipo === 'desarrollo');
  const totalPuntos  = preguntas.length;

  const children = [
    ...encabezadoEscuela(),
    ...tituloPrueba(nombre, asignatura, curso, profesor),
    tablaDatosAlumno(fechaLabel, curso, totalPuntos),
    instruccionGeneral(),
  ];

  let qNum = 0;

  // Sección Selección Múltiple
  if (smPreguntas.length > 0) {
    children.push(encabezadoSeccion('I.  SECCIÓN SELECCIÓN MÚLTIPLE'));
    children.push(instruccionSeccion(
      `Marca con una X la alternativa correcta. (${smPreguntas.length} pregunta${smPreguntas.length !== 1 ? 's' : ''})`
    ));

    for (const p of smPreguntas) {
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
  }

  // Sección Desarrollo
  if (devPreguntas.length > 0) {
    const secNum = smPreguntas.length > 0 ? 'II.' : 'I.';
    children.push(encabezadoSeccion(`${secNum}  SECCIÓN DESARROLLO`));
    children.push(instruccionSeccion(
      `Responde con letra clara. (${devPreguntas.length} pregunta${devPreguntas.length !== 1 ? 's' : ''})`
    ));

    for (const p of devPreguntas) {
      qNum++;
      children.push(preguntaParrafo(qNum, p.enunciado));
      if (imageBuffers[p.number]) {
        children.push(imagenParrafo(imageBuffers[p.number], p.imagen?.aspectRatio));
      }
      children.push(lineaRespuesta());
      children.push(lineaRespuesta());
      children.push(lineaRespuesta());
    }
  }

  children.push(piePagina());

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top:    mm(20),
            bottom: mm(20),
            left:   mm(25),
            right:  mm(25),
          },
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

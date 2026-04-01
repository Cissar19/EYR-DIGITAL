/**
 * renderHtml.js
 * Genera el HTML de una prueba para convertir a PDF con puppeteer.
 * Replica la estructura visual de VistaPrevia.jsx.
 */

const ASIGNATURAS = [
    { code: 'MA', name: 'Matemática' },
    { code: 'LE', name: 'Lenguaje y Comunicación' },
    { code: 'CN', name: 'Ciencias Naturales' },
    { code: 'HI', name: 'Historia, Geografía y Cs. Sociales' },
    { code: 'IN', name: 'Inglés' },
    { code: 'AR', name: 'Artes Visuales' },
    { code: 'MU', name: 'Música' },
    { code: 'EF', name: 'Educación Física' },
    { code: 'TE', name: 'Tecnología' },
    { code: 'OR', name: 'Orientación' },
    { code: 'RE', name: 'Religión' },
    { code: 'OT', name: 'Otra' },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const LETRAS = ['a', 'b', 'c', 'd'];
const TIPOS_CON_ITEMS = ['verdadero_falso', 'unir', 'completar'];

const DEFAULT_FORMATO = {
    instruccionesGenerales: 'Lee atentamente cada pregunta. Responde con letra clara y ordenada.',
    titulosPorTipo: {
        seleccion_multiple: 'SELECCIÓN MÚLTIPLE',
        desarrollo: 'DESARROLLO',
        verdadero_falso: 'VERDADERO O FALSO',
        unir: 'UNIR CON FLECHAS',
        completar: 'COMPLETAR',
    },
    instruccionesPorTipo: {
        seleccion_multiple: 'Marca con una X la alternativa correcta.',
        desarrollo: 'Responde con letra clara y ordenada.',
        verdadero_falso: 'Escribe V si es verdadero o F si es falso según corresponda.',
        unir: 'Une con una línea cada concepto de la columna A con su definición en la columna B.',
        completar: 'Completa los espacios en blanco con la palabra o frase correcta.',
    },
};

function mergeFormato(data) {
    return {
        instruccionesGenerales: data?.instruccionesGenerales ?? DEFAULT_FORMATO.instruccionesGenerales,
        titulosPorTipo: { ...DEFAULT_FORMATO.titulosPorTipo, ...(data?.titulosPorTipo || {}) },
        instruccionesPorTipo: { ...DEFAULT_FORMATO.instruccionesPorTipo, ...(data?.instruccionesPorTipo || {}) },
    };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatFecha(dateStr) {
    try {
        const [y, m, d] = dateStr.split('-');
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio',
                       'agosto','septiembre','octubre','noviembre','diciembre'];
        return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
    } catch {
        return dateStr || '';
    }
}

function completarTextoHtml(texto) {
    return escapeHtml(texto).replace(/___/g, '<span class="blank"></span>');
}

function renderPregunta(p, formato) {
    const tipo = p.tipo;
    const imagenHtml = p.imagenUrl
        ? `<div class="pregunta-img"><img src="${escapeHtml(p.imagenUrl)}" alt="imagen" /></div>`
        : '';

    if (tipo === 'seleccion_multiple') {
        const alts = (p.alternativas || []).map((alt, i) =>
            `<div class="alternativa">${LETRAS[i] || i}) ${escapeHtml(alt.texto)}</div>`
        ).join('');
        return `
            <div class="pregunta">
                <div class="pregunta-enunciado">${p.number}. ${escapeHtml(p.enunciado)}</div>
                ${imagenHtml}
                <div class="alternativas">${alts}</div>
            </div>`;
    }

    if (tipo === 'desarrollo') {
        return `
            <div class="pregunta">
                <div class="pregunta-enunciado">${p.number}. ${escapeHtml(p.enunciado)}</div>
                ${imagenHtml}
                <div class="lineas-respuesta">
                    <div class="linea"></div>
                    <div class="linea"></div>
                    <div class="linea"></div>
                </div>
            </div>`;
    }

    if (tipo === 'verdadero_falso') {
        const instrHtml = p.instruccionItems
            ? `<div class="items-instruccion">${escapeHtml(p.instruccionItems)}</div>` : '';
        const itemsHtml = (p.items || []).map((item, i) =>
            `<div class="vf-item"><span class="vf-num">${i + 1}.</span> ${escapeHtml(item.texto)} <span class="vf-box"></span></div>`
        ).join('');
        return `
            <div class="pregunta">
                ${p.enunciado ? `<div class="pregunta-enunciado">${p.number}. ${escapeHtml(p.enunciado)}</div>` : ''}
                ${imagenHtml}
                ${instrHtml}
                <div class="vf-items">${itemsHtml}</div>
            </div>`;
    }

    if (tipo === 'unir') {
        const instrHtml = p.instruccionItems
            ? `<div class="items-instruccion">${escapeHtml(p.instruccionItems)}</div>` : '';
        const rowsHtml = (p.items || []).map((item, i) =>
            `<tr>
                <td class="unir-num">${i + 1}.</td>
                <td class="unir-izq">${escapeHtml(item.izquierda)}</td>
                <td class="unir-sep"></td>
                <td class="unir-num">${String.fromCharCode(65 + i)}.</td>
                <td class="unir-der">${escapeHtml(item.derecha)}</td>
            </tr>`
        ).join('');
        return `
            <div class="pregunta">
                ${p.enunciado ? `<div class="pregunta-enunciado">${p.number}. ${escapeHtml(p.enunciado)}</div>` : ''}
                ${imagenHtml}
                ${instrHtml}
                <table class="unir-table">${rowsHtml}</table>
            </div>`;
    }

    if (tipo === 'completar') {
        const instrHtml = p.instruccionItems
            ? `<div class="items-instruccion">${escapeHtml(p.instruccionItems)}</div>` : '';
        const itemsHtml = (p.items || []).map((item, i) =>
            `<div class="completar-item">${i + 1}. ${completarTextoHtml(item.texto)}</div>`
        ).join('');
        return `
            <div class="pregunta">
                ${p.enunciado ? `<div class="pregunta-enunciado">${p.number}. ${escapeHtml(p.enunciado)}</div>` : ''}
                ${imagenHtml}
                ${instrHtml}
                <div class="completar-items">${itemsHtml}</div>
            </div>`;
    }

    return '';
}

/**
 * Genera el HTML completo de la prueba.
 * @param {Object} evaluacion  — documento de Firestore
 * @param {Object} formatoData — documento app_config/utp_formato (puede ser null)
 * @returns {string} HTML listo para puppeteer
 */
function renderHtml(evaluacion, formatoData) {
    const formato = mergeFormato(formatoData);

    const asignaturaLabel = ASIGNATURAS.find(a => a.code === evaluacion.asignatura)?.name
        || evaluacion.asignatura || '';

    const fechaLabel = formatFecha(evaluacion.date);

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

    const totalPuntos = preguntas.reduce((acc, p) => {
        if (TIPOS_CON_ITEMS.includes(p.tipo)) return acc + (p.items?.length || 1);
        return acc + 1;
    }, 0);

    const instrucciones = evaluacion.instrucciones?.trim() || formato.instruccionesGenerales;

    // Generar secciones
    let secciones = '';
    tiposEnOrden.forEach((tipo, idx) => {
        const titulo = formato.titulosPorTipo[tipo] || tipo.toUpperCase();
        const instruccion = formato.instruccionesPorTipo[tipo] || '';
        const pregs = gruposPorTipo[tipo];
        const pregsHtml = pregs.map(p => renderPregunta(p, formato)).join('');

        secciones += `
            <div class="seccion">
                <div class="seccion-header">
                    <span class="seccion-roman">${ROMAN[idx] || idx + 1}.</span>
                    <span class="seccion-titulo">${escapeHtml(titulo)}</span>
                    <span class="seccion-puntos">(${pregs.reduce((a, p) =>
                        a + (TIPOS_CON_ITEMS.includes(p.tipo) ? (p.items?.length || 1) : 1), 0)} pts)</span>
                </div>
                ${instruccion ? `<div class="seccion-instruccion">${escapeHtml(instruccion)}</div>` : ''}
                ${pregsHtml}
            </div>`;
    });

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; background: white; }
  .page { padding: 18mm 20mm; }

  /* Encabezado */
  .header { text-align: center; margin-bottom: 8px; }
  .header-escuela { font-size: 13pt; font-weight: bold; color: #1B3A8C; }
  .header-ciudad { font-size: 9pt; color: #555; margin-top: 2px; }

  .titulo-prueba { font-size: 15pt; font-weight: bold; color: #1B3A8C; text-align: center; margin: 8px 0 2px; }
  .subtitulo { font-size: 10pt; color: #555; text-align: center; font-style: italic; margin-bottom: 2px; }
  .profesor { font-size: 10pt; color: #555; text-align: center; margin-bottom: 8px; }

  /* Tabla datos alumno */
  .datos-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt; }
  .datos-table td { border: 1.5px solid #1B3A8C; padding: 3px 6px; }
  .datos-table .lbl { background-color: #E8EDF7; font-weight: bold; color: #1B3A8C; width: 15%; }

  /* Instrucciones generales */
  .instrucciones { font-size: 10pt; font-style: italic; color: #555; margin-bottom: 12px; }

  /* Secciones */
  .seccion { margin-bottom: 14px; }
  .seccion-header { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; border-bottom: 1.5px solid #1B3A8C; padding-bottom: 2px; }
  .seccion-roman { font-weight: bold; font-size: 11pt; color: #1B3A8C; }
  .seccion-titulo { font-weight: bold; font-size: 11pt; color: #1B3A8C; flex: 1; }
  .seccion-puntos { font-size: 9pt; color: #888; }
  .seccion-instruccion { font-size: 9.5pt; font-style: italic; color: #555; margin-bottom: 6px; }

  /* Preguntas */
  .pregunta { margin-bottom: 10px; }
  .pregunta-enunciado { font-size: 11pt; margin-bottom: 4px; }
  .pregunta-img { margin: 4px 0; }
  .pregunta-img img { max-width: 380px; max-height: 200px; }

  /* Alternativas */
  .alternativas { margin-left: 16px; }
  .alternativa { font-size: 10.5pt; margin: 1px 0; }

  /* Desarrollo */
  .lineas-respuesta { margin-top: 4px; }
  .linea { border-bottom: 1px solid #aaa; margin-bottom: 10px; height: 14px; }

  /* Verdadero/Falso */
  .items-instruccion { font-size: 9.5pt; font-style: italic; color: #555; margin-bottom: 4px; }
  .vf-items { margin-left: 8px; }
  .vf-item { display: flex; align-items: center; gap: 8px; font-size: 10.5pt; margin: 3px 0; }
  .vf-num { font-weight: bold; min-width: 16px; }
  .vf-box { display: inline-block; border: 1px solid #555; width: 22px; height: 14px; margin-left: 6px; flex-shrink: 0; }

  /* Unir */
  .unir-table { margin-left: 8px; border-collapse: collapse; font-size: 10.5pt; }
  .unir-table td { padding: 2px 6px; }
  .unir-num { font-weight: bold; color: #1B3A8C; text-align: right; width: 20px; }
  .unir-izq { min-width: 140px; }
  .unir-sep { width: 40px; border-bottom: 1px solid #aaa; }
  .unir-der { min-width: 140px; }

  /* Completar */
  .completar-items { margin-left: 8px; }
  .completar-item { font-size: 10.5pt; margin: 4px 0; line-height: 1.8; }
  .blank { display: inline-block; border-bottom: 1px solid #333; width: 80px; margin: 0 2px; }

  /* Pie */
  .footer { margin-top: 18px; text-align: center; border-top: 2px solid #1B3A8C; padding-top: 4px; font-size: 9pt; font-style: italic; color: #888; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-escuela">CENTRO EDUCACIONAL ERNESTO YÁÑEZ RIVERA</div>
    <div class="header-ciudad">Huechuraba · Santiago</div>
  </div>

  <div class="titulo-prueba">${escapeHtml(evaluacion.name?.toUpperCase())}</div>
  <div class="subtitulo">${escapeHtml(asignaturaLabel)} &nbsp;|&nbsp; ${escapeHtml(evaluacion.curso)}</div>
  ${evaluacion.createdBy?.name
    ? `<div class="profesor">Profesor(a): ${escapeHtml(evaluacion.createdBy.name)}</div>` : ''}

  <table class="datos-table">
    <tr>
      <td class="lbl">Nombre:</td><td></td>
      <td class="lbl">Fecha:</td><td>${escapeHtml(fechaLabel)}</td>
    </tr>
    <tr>
      <td class="lbl">Curso:</td><td>${escapeHtml(evaluacion.curso)}</td>
      <td class="lbl">Puntaje:</td><td>_______ / ${totalPuntos} pts</td>
    </tr>
  </table>

  <div class="instrucciones">${escapeHtml(instrucciones)}</div>

  ${secciones}

  <div class="footer">EYR Digital · Centro Educacional Ernesto Yáñez Rivera · Huechuraba</div>
</div>
</body>
</html>`;
}

module.exports = { renderHtml };

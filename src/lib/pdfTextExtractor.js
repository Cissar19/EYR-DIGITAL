/**
 * pdfTextExtractor.js
 *
 * Extrae texto plano desde un objeto File de tipo PDF usando pdfjs-dist.
 * Agrupa los items de texto por posición Y para reconstruir las líneas.
 */
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

/**
 * @param {File} file
 * @returns {Promise<string>} Texto completo del PDF, con saltos de línea preservados
 */
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Agrupar items por coordenada Y (redondeada a 2px) para reconstruir líneas
    const lineMap = new Map();
    for (const item of content.items) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5] / 2) * 2;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], str: item.str });
    }

    // Ordenar de arriba a abajo (mayor Y = arriba en coord. PDF)
    const lines = [...lineMap.keys()]
      .sort((a, b) => b - a)
      .map(y =>
        lineMap.get(y)
          .sort((a, b) => a.x - b.x)
          .map(i => i.str)
          .join(' ')
          .trim()
      )
      .filter(line => line.length > 0);

    pageTexts.push(lines.join('\n'));
  }

  return pageTexts.join('\n');
}

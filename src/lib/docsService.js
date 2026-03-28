/**
 * docsService.js
 *
 * Llama al Google Apps Script para generar un Google Doc
 * con el formato EYR a partir de los datos de una evaluación.
 */

const APPS_SCRIPT_URL    = import.meta.env.VITE_APPS_SCRIPT_URL;
const APPS_SCRIPT_SECRET = import.meta.env.VITE_APPS_SCRIPT_SECRET;

/**
 * Crea un Google Doc formateado con la prueba y retorna su URL pública.
 *
 * @param {{
 *   nombre: string,
 *   curso: string,
 *   asignatura: string,   // nombre completo, no código
 *   fecha: string,        // YYYY-MM-DD
 *   profesor: string,
 *   preguntas: Array<{ number, enunciado, alternativas, tipo }>
 * }} params
 * @returns {Promise<string>} URL del Google Doc
 */
export async function crearPruebaEnDocs({ nombre, curso, asignatura, fecha, profesor, preguntas }) {
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
    throw new Error('Apps Script no está configurado (VITE_APPS_SCRIPT_URL / VITE_APPS_SCRIPT_SECRET).');
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      secret: APPS_SCRIPT_SECRET,
      crearPrueba: true,
      nombre,
      curso,
      asignatura,
      fecha,
      profesor,
      preguntas,
    }),
    redirect: 'follow',
  });

  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Error desconocido al crear documento');
  return result.url;
}

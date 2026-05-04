/**
 * seed_oas_faltantes.mjs
 * ──────────────────────
 * Sube OAs de Inglés, Orientación, Religión Evangélica y Religión Católica
 * a Firestore en curriculum/{year}/oas/{curso_slug}_{asignatura_slug}.
 *
 * Uso:
 *   node scripts/seed_oas_faltantes.mjs [--year 2025]
 *
 * Requisitos:
 *   - scripts/serviceAccountKey.json (Firebase Console → Configuración → Cuentas de servicio)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE  = join(__dirname, 'serviceAccountKey.json');

const YEAR = process.argv.includes('--year')
  ? process.argv[process.argv.indexOf('--year') + 1]
  : '2025';

// ─── Mapeo nivel → curso_slug ──────────────────────────────────────────────

const NIVEL_TO_SLUG = {
  '01': '1-basico', '02': '2-basico', '03': '3-basico', '04': '4-basico',
  '05': '5-basico', '06': '6-basico', '07': '7-basico', '08': '8-basico',
};

// ─── OA data (misma fuente que objetivosAprendizaje.js) ───────────────────
// Formato: { [code+level]: [ { eje, objectives: [ { code, description } ] } ] }
// Se convierte al formato Firestore: { ejes: [{ nombre, objetivos: [{ codigo, descripcion }] }] }

function groupByEje(oas) {
  const map = new Map();
  for (const oa of oas) {
    if (!map.has(oa.eje)) map.set(oa.eje, []);
    const num = oa.code.match(/OA(\d+)$/)?.[1] ?? oa.code;
    map.get(oa.eje).push({
      codigo:      `OA${String(parseInt(num, 10)).padStart(2, '0')}`,
      descripcion: oa.description,
    });
  }
  return [...map.entries()].map(([nombre, objetivos]) => ({ nombre, objetivos }));
}

const OA_DATA = {
  // ── INGLÉS ────────────────────────────────────────────────────────────────
  'IN01': [
    { code: 'IN01-OA01', eje: 'Comprension auditiva', description: 'Escuchar y reconocer sonidos simples del idioma inglés mediante rimas, canciones y juegos' },
    { code: 'IN01-OA02', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de vocabulario básico relacionado con su entorno inmediato mediante respuestas físicas' },
    { code: 'IN01-OA03', eje: 'Comprension lectora',  description: 'Reconocer palabras simples en inglés mediante asociación con imágenes' },
    { code: 'IN01-OA04', eje: 'Expresion oral',       description: 'Reproducir rimas, canciones y expresiones simples del inglés de forma coral y lúdica' },
    { code: 'IN01-OA05', eje: 'Expresion oral',       description: 'Participar en actividades lúdicas usando expresiones y vocabulario básico del inglés' },
    { code: 'IN01-OA06', eje: 'Expresion escrita',    description: 'Copiar palabras simples del vocabulario aprendido con apoyo visual' },
  ],
  'IN02': [
    { code: 'IN02-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de vocabulario y expresiones simples en contextos conocidos' },
    { code: 'IN02-OA02', eje: 'Comprension auditiva', description: 'Identificar palabras y expresiones frecuentes en textos orales breves y simples con apoyo visual' },
    { code: 'IN02-OA03', eje: 'Comprension lectora',  description: 'Leer y reconocer palabras y frases simples relacionadas con temas conocidos, con apoyo de imágenes' },
    { code: 'IN02-OA04', eje: 'Expresion oral',       description: 'Reproducir y producir rimas, canciones y diálogos muy breves para familiarizarse con los sonidos del inglés' },
    { code: 'IN02-OA05', eje: 'Expresion oral',       description: 'Expresarse oralmente con palabras y frases simples sobre temas conocidos usando apoyo visual' },
    { code: 'IN02-OA06', eje: 'Expresion escrita',    description: 'Escribir palabras y frases simples de acuerdo a un modelo y con apoyo de imágenes' },
  ],
  'IN03': [
    { code: 'IN03-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos simples y breves con repetición y apoyo visual' },
    { code: 'IN03-OA02', eje: 'Comprension auditiva', description: 'Identificar tema general, palabras clave y vocabulario temático en textos orales' },
    { code: 'IN03-OA03', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos breves y simples con palabras frecuentes y repetición, con apoyo visual' },
    { code: 'IN03-OA04', eje: 'Comprension lectora',  description: 'Identificar el propósito y las ideas generales en textos escritos simples relacionados con temas conocidos' },
    { code: 'IN03-OA05', eje: 'Expresion oral',       description: 'Reproducir canciones, rimas y diálogos breves para identificar y familiarizarse con los sonidos del inglés' },
    { code: 'IN03-OA06', eje: 'Expresion oral',       description: 'Expresarse oralmente en diálogos o presentaciones breves con apoyo visual sobre temas conocidos' },
    { code: 'IN03-OA07', eje: 'Expresion escrita',    description: 'Completar y escribir textos breves de acuerdo a un modelo, con apoyo de imágenes sobre temas conocidos' },
    { code: 'IN03-OA08', eje: 'Expresion escrita',    description: 'Escribir para realizar funciones como saludar, dar información personal básica y describir objetos simples' },
  ],
  'IN04': [
    { code: 'IN04-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples sobre temas conocidos' },
    { code: 'IN04-OA02', eje: 'Comprension auditiva', description: 'Identificar tema, ideas generales, información específica y vocabulario temático en textos orales' },
    { code: 'IN04-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, usar claves contextuales y visualizar aspectos del texto' },
    { code: 'IN04-OA04', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos no literarios simples con palabras frecuentes y repetición, con apoyo visual' },
    { code: 'IN04-OA05', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos literarios adaptados como cuentos, rimas y canciones' },
    { code: 'IN04-OA06', eje: 'Comprension lectora',  description: 'Leer comprensivamente identificando propósito, ideas generales, información explícita y palabras clave' },
    { code: 'IN04-OA07', eje: 'Expresion oral',       description: 'Reproducir y producir canciones, rimas y diálogos para familiarizarse con los sonidos del inglés' },
    { code: 'IN04-OA08', eje: 'Expresion oral',       description: 'Expresarse oralmente en diálogos y presentaciones con apoyo visual sobre temas del año' },
    { code: 'IN04-OA09', eje: 'Expresion oral',       description: 'Participar en diálogos para saludar, dar instrucciones, describir, expresar gustos y solicitar información' },
    { code: 'IN04-OA10', eje: 'Expresion escrita',    description: 'Completar y escribir textos no literarios y literarios breves de acuerdo a un modelo con apoyo visual' },
    { code: 'IN04-OA11', eje: 'Expresion escrita',    description: 'Escribir para describir, expresar gustos, dar información sobre temas conocidos y solicitar información' },
  ],
  'IN05': [
    { code: 'IN05-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples, tanto no literarios como literarios, enunciados en forma clara' },
    { code: 'IN05-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: tema general, información específica, palabras y expresiones clave, vocabulario temático, sonidos propios del inglés' },
    { code: 'IN05-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales en diversos formatos audiovisuales, usando estrategias como hacer predicciones, usar claves contextuales y apoyo visual' },
    { code: 'IN05-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a los textos escuchados expresando preferencias u opiniones o haciendo conexiones con experiencias personales' },
    { code: 'IN05-OA05', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos adaptados y auténticos simples no literarios con palabras de uso frecuente y apoyo visual' },
    { code: 'IN05-OA06', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos no literarios identificando: propósito, ideas generales, información explícita, palabras clave y vocabulario temático' },
    { code: 'IN05-OA07', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos literarios adaptados y auténticos simples, identificando tema, personajes, lugares, secuencia de eventos y vocabulario' },
    { code: 'IN05-OA08', eje: 'Comprension lectora',  description: 'Reaccionar a los textos leídos expresando preferencias u opiniones o haciendo conexiones con experiencias personales' },
    { code: 'IN05-OA09', eje: 'Expresion oral',       description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo de lenguaje visual o digital' },
    { code: 'IN05-OA10', eje: 'Expresion oral',       description: 'Participar en diálogos y actividades grupales ejecutando funciones como saludar, dar instrucciones, describir acciones, expresar gustos y solicitar información' },
    { code: 'IN05-OA11', eje: 'Expresion oral',       description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente y expresiones comunes' },
    { code: 'IN05-OA12', eje: 'Expresion escrita',    description: 'Completar y escribir, de acuerdo a un modelo, textos no literarios y literarios sobre temas conocidos o de otras asignaturas' },
    { code: 'IN05-OA13', eje: 'Expresion escrita',    description: 'Escribir, en forma guiada, para describir acciones cotidianas, expresar gustos, cantidades, información general sobre temas conocidos y solicitar información' },
  ],
  'IN06': [
    { code: 'IN06-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples, literarios y no literarios, en diversos formatos audiovisuales' },
    { code: 'IN06-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: propósito, tema, ideas generales, información específica, palabras y expresiones de uso frecuente, vocabulario temático' },
    { code: 'IN06-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, escuchar con un propósito, usar conocimientos previos y apoyos visuales' },
    { code: 'IN06-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a los textos escuchados, expresando opiniones, haciendo conexiones con experiencias personales' },
    { code: 'IN06-OA05', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos no literarios simples y adaptados con palabras de uso frecuente y apoyo visual' },
    { code: 'IN06-OA06', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos no literarios identificando: propósito, ideas generales, información explícita, palabras clave, vocabulario temático' },
    { code: 'IN06-OA07', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos literarios simples y adaptados con palabras de uso frecuente y apoyo visual' },
    { code: 'IN06-OA08', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos literarios identificando: tema, personajes, lugares, secuencia de eventos, ideas generales y vocabulario temático' },
    { code: 'IN06-OA09', eje: 'Expresion oral',       description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo visual o digital sobre temas del año' },
    { code: 'IN06-OA10', eje: 'Expresion oral',       description: 'Participar en diálogos ejecutando funciones como: saludar, describir acciones, lugares, objetos y personas, expresar gustos, preferencias, solicitar información' },
    { code: 'IN06-OA11', eje: 'Expresion oral',       description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente, expresiones de uso común' },
    { code: 'IN06-OA12', eje: 'Expresion escrita',    description: 'Completar y escribir de acuerdo a un modelo textos no literarios y literarios sobre temas de su vida diaria o de otras asignaturas' },
    { code: 'IN06-OA13', eje: 'Expresion escrita',    description: 'Escribir en forma guiada para describir acciones, lugares, objetos y personas, expresar gustos, preferencias y solicitar información' },
  ],
  'IN07': [
    { code: 'IN07-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples, en diversos formatos audiovisuales sobre temas cotidianos y del contexto escolar' },
    { code: 'IN07-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: propósito, tema, ideas relevantes, información específica, palabras y frases clave, expresiones de uso frecuente, vocabulario temático y conectores' },
    { code: 'IN07-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, escuchar con un propósito, usar conocimientos previos y hacer inferencias' },
    { code: 'IN07-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a textos escuchados expresando opiniones, haciendo conexiones con experiencias personales y respondiendo preguntas' },
    { code: 'IN07-OA05', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos no literarios simples, adaptados y auténticos, con palabras de uso frecuente, conectores y apoyo visual' },
    { code: 'IN07-OA06', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos no literarios identificando: propósito, tema, ideas relevantes, información específica, palabras clave y conectores' },
    { code: 'IN07-OA07', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos literarios simples, adaptados y auténticos, con palabras de uso frecuente y apoyo visual' },
    { code: 'IN07-OA08', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos literarios identificando: tema, personajes, lugares, secuencia de eventos, ideas relevantes y vocabulario' },
    { code: 'IN07-OA09', eje: 'Expresion oral',       description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo visual o digital sobre temas de interés personal y del contexto escolar' },
    { code: 'IN07-OA10', eje: 'Expresion oral',       description: 'Participar en diálogos ejecutando funciones como: saludar, dar instrucciones, describir, expresar gustos, preferencias, obligación, hacer sugerencias, pedir y dar información' },
    { code: 'IN07-OA11', eje: 'Expresion oral',       description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente, expresiones de uso común y conectores' },
    { code: 'IN07-OA12', eje: 'Expresion escrita',    description: 'Escribir historias cortas e información relevante de acuerdo a un modelo y usando herramientas digitales sobre temas del entorno cercano' },
    { code: 'IN07-OA13', eje: 'Expresion escrita',    description: 'Escribir para describir, expresar gustos, preferencias, cantidades, posesiones, expresar obligación, hacer sugerencias, pedir y dar información' },
  ],
  'IN08': [
    { code: 'IN08-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita e implícita en textos adaptados y auténticos simples, literarios y no literarios, en diversos formatos audiovisuales' },
    { code: 'IN08-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: propósito, tema, ideas relevantes, información específica, palabras, frases, expresiones, vocabulario temático, conectores y entonación del inglés' },
    { code: 'IN08-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, escuchar con un propósito, focalizar la atención en expresiones clave y hacer inferencias' },
    { code: 'IN08-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a textos escuchados expresando opiniones y sentimientos fundamentados, haciendo conexiones con experiencias personales' },
    { code: 'IN08-OA05', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos no literarios simples, adaptados y auténticos, con palabras de uso frecuente, expresiones de uso común y conectores' },
    { code: 'IN08-OA06', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos no literarios identificando: propósito, tema, ideas relevantes, información específica, palabras clave y conectores' },
    { code: 'IN08-OA07', eje: 'Comprension lectora',  description: 'Leer y demostrar comprensión de textos literarios simples, adaptados y auténticos, con palabras de uso frecuente y expresiones de uso común' },
    { code: 'IN08-OA08', eje: 'Comprension lectora',  description: 'Leer comprensivamente textos literarios identificando: tema, personajes, ambiente, secuencia de eventos, ideas relevantes y vocabulario' },
    { code: 'IN08-OA09', eje: 'Expresion oral',       description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo visual o digital sobre temas variados' },
    { code: 'IN08-OA10', eje: 'Expresion oral',       description: 'Participar en diálogos ejecutando funciones como: saludar, dar instrucciones, describir, expresar gustos, preferencias, obligación, necesidad, hacer sugerencias, expresar opiniones, acuerdo y desacuerdo' },
    { code: 'IN08-OA11', eje: 'Expresion oral',       description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente, expresiones de uso común, conectores y marcadores de secuencia' },
    { code: 'IN08-OA12', eje: 'Expresion escrita',    description: 'Escribir historias cortas e información relevante de acuerdo a un modelo y usando herramientas digitales sobre temas variados' },
    { code: 'IN08-OA13', eje: 'Expresion escrita',    description: 'Escribir para describir, expresar gustos, preferencias, cantidades, posesiones, expresar obligación, necesidad, hacer sugerencias, expresar opiniones, acuerdo y desacuerdo' },
  ],

  // ── ORIENTACIÓN ──────────────────────────────────────────────────────────
  'OR01': [
    { code: 'OR01-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reconocerse como persona única con características, gustos y habilidades propias' },
    { code: 'OR01-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Identificar y expresar sus emociones básicas en situaciones cotidianas' },
    { code: 'OR01-OA03', eje: 'Convivencia y Ciudadania',       description: 'Relacionarse con respeto y empatía con sus compañeros y adultos del entorno' },
    { code: 'OR01-OA04', eje: 'Convivencia y Ciudadania',       description: 'Reconocer y practicar normas básicas de convivencia en el hogar y la escuela' },
    { code: 'OR01-OA05', eje: 'Convivencia y Ciudadania',       description: 'Participar en actividades grupales respetando turnos y escuchando a los demás' },
  ],
  'OR02': [
    { code: 'OR02-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reconocer sus características personales, gustos e intereses que lo hacen único' },
    { code: 'OR02-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Identificar y regular sus emociones frente a situaciones cotidianas' },
    { code: 'OR02-OA03', eje: 'Convivencia y Ciudadania',       description: 'Demostrar empatía y respeto ante las diferencias individuales de sus compañeros' },
    { code: 'OR02-OA04', eje: 'Convivencia y Ciudadania',       description: 'Practicar normas de convivencia y resolver conflictos de manera pacífica y dialogada' },
    { code: 'OR02-OA05', eje: 'Convivencia y Ciudadania',       description: 'Valorar el trabajo colaborativo y el aporte de cada integrante del grupo' },
  ],
  'OR03': [
    { code: 'OR03-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reflexionar sobre sus fortalezas y áreas de mejora personal y académica' },
    { code: 'OR03-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar estrategias sencillas para regular sus emociones frente a situaciones de dificultad' },
    { code: 'OR03-OA03', eje: 'Convivencia y Ciudadania',       description: 'Establecer relaciones de amistad basadas en el respeto, la confianza y la comunicación' },
    { code: 'OR03-OA04', eje: 'Convivencia y Ciudadania',       description: 'Reconocer y valorar la diversidad de personas, culturas y estilos de vida' },
    { code: 'OR03-OA05', eje: 'Convivencia y Ciudadania',       description: 'Participar en decisiones del grupo y asumir compromisos y responsabilidades' },
  ],
  'OR04': [
    { code: 'OR04-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Identificar sus emociones, fortalezas y aspectos a desarrollar en diferentes contextos' },
    { code: 'OR04-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Aplicar estrategias de autorregulación emocional frente a situaciones de dificultad' },
    { code: 'OR04-OA03', eje: 'Convivencia y Ciudadania',       description: 'Valorar la amistad y las relaciones interpersonales basadas en la confianza y el respeto mutuo' },
    { code: 'OR04-OA04', eje: 'Convivencia y Ciudadania',       description: 'Analizar situaciones de conflicto y proponer soluciones pacíficas y democráticas' },
    { code: 'OR04-OA05', eje: 'Convivencia y Ciudadania',       description: 'Reconocer derechos y deberes en la comunidad escolar y familiar' },
  ],
  'OR05': [
    { code: 'OR05-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Analizar sus características personales, emociones y cómo influyen en sus relaciones' },
    { code: 'OR05-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar habilidades de comunicación efectiva: escucha activa, asertividad y empatía' },
    { code: 'OR05-OA03', eje: 'Convivencia y Ciudadania',       description: 'Valorar la diversidad cultural y respetar las diferencias entre las personas' },
    { code: 'OR05-OA04', eje: 'Convivencia y Ciudadania',       description: 'Promover relaciones de buen trato, rechazando toda forma de discriminación y violencia' },
    { code: 'OR05-OA05', eje: 'Convivencia y Ciudadania',       description: 'Participar activamente en la vida de la comunidad escolar ejerciendo sus derechos y deberes' },
  ],
  'OR06': [
    { code: 'OR06-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reflexionar sobre su identidad, valores personales y metas de desarrollo' },
    { code: 'OR06-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Reconocer factores que influyen en su bienestar emocional y en sus relaciones interpersonales' },
    { code: 'OR06-OA03', eje: 'Convivencia y Ciudadania',       description: 'Analizar críticamente situaciones de discriminación o violencia y proponer acciones de prevención' },
    { code: 'OR06-OA04', eje: 'Convivencia y Ciudadania',       description: 'Valorar la participación ciudadana y los mecanismos democráticos en distintas comunidades' },
    { code: 'OR06-OA05', eje: 'Convivencia y Ciudadania',       description: 'Reflexionar sobre el impacto de sus decisiones en el entorno y en la convivencia' },
  ],
  'OR07': [
    { code: 'OR07-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Analizar su proceso de desarrollo personal reconociendo cambios físicos, emocionales y sociales de la adolescencia' },
    { code: 'OR07-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar habilidades socioemocionales para enfrentar los desafíos de la adolescencia' },
    { code: 'OR07-OA03', eje: 'Convivencia y Ciudadania',       description: 'Analizar y valorar el diálogo y la resolución pacífica de conflictos en la convivencia' },
    { code: 'OR07-OA04', eje: 'Convivencia y Ciudadania',       description: 'Reconocer sus derechos y responsabilidades como ciudadano y miembro de distintas comunidades' },
    { code: 'OR07-OA05', eje: 'Proyecto de Vida',               description: 'Reflexionar sobre sus intereses, valores y habilidades en relación con sus metas futuras' },
    { code: 'OR07-OA06', eje: 'Proyecto de Vida',               description: 'Identificar factores que influyen en la toma de decisiones y establecer metas a corto plazo' },
  ],
  'OR08': [
    { code: 'OR08-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reflexionar sobre su identidad personal, valores y sentido de vida en la adolescencia' },
    { code: 'OR08-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar estrategias de autocuidado y bienestar emocional frente a los desafíos del entorno' },
    { code: 'OR08-OA03', eje: 'Convivencia y Ciudadania',       description: 'Analizar críticamente situaciones de inequidad, discriminación y violencia, proponiendo acciones de cambio' },
    { code: 'OR08-OA04', eje: 'Convivencia y Ciudadania',       description: 'Valorar la participación activa y responsable en la vida democrática de la comunidad' },
    { code: 'OR08-OA05', eje: 'Proyecto de Vida',               description: 'Elaborar un proyecto de vida considerando sus intereses, habilidades, valores y el contexto social' },
    { code: 'OR08-OA06', eje: 'Proyecto de Vida',               description: 'Analizar distintas opciones de desarrollo personal, académico y laboral de manera fundamentada' },
  ],

  // ── RELIGIÓN EVANGÉLICA ───────────────────────────────────────────────────
  'RE01': [
    { code: 'RE01-OA01', eje: 'Biblia',     description: 'Conocer relatos bíblicos sencillos sobre la creación y el cuidado de Dios por las personas y la naturaleza' },
    { code: 'RE01-OA02', eje: 'Fe y Vida',  description: 'Reconocer a Dios como Padre creador que ama y cuida a las personas' },
    { code: 'RE01-OA03', eje: 'Fe y Vida',  description: 'Expresar gratitud a Dios mediante la oración, el canto y acciones de cuidado del entorno' },
    { code: 'RE01-OA04', eje: 'Comunidad',  description: 'Valorar la familia y la comunidad escolar como espacios de amor y convivencia' },
    { code: 'RE01-OA05', eje: 'Comunidad',  description: 'Practicar valores como el amor, el respeto y la solidaridad en su vida cotidiana' },
  ],
  'RE02': [
    { code: 'RE02-OA01', eje: 'Biblia',     description: 'Identificar personajes y relatos bíblicos del Antiguo Testamento relacionados con la fe y la obediencia a Dios' },
    { code: 'RE02-OA02', eje: 'Fe y Vida',  description: 'Reconocer a Jesucristo como Hijo de Dios y modelo de vida para los creyentes' },
    { code: 'RE02-OA03', eje: 'Fe y Vida',  description: 'Expresar su fe mediante la oración personal y comunitaria' },
    { code: 'RE02-OA04', eje: 'Comunidad',  description: 'Valorar la comunidad cristiana como espacio de apoyo y crecimiento en la fe' },
    { code: 'RE02-OA05', eje: 'Comunidad',  description: 'Demostrar respeto y amor al prójimo en sus relaciones cotidianas' },
  ],
  'RE03': [
    { code: 'RE03-OA01', eje: 'Biblia',     description: 'Comprender relatos bíblicos del Nuevo Testamento sobre la vida y enseñanzas de Jesucristo' },
    { code: 'RE03-OA02', eje: 'Fe y Vida',  description: 'Identificar valores del Evangelio como el amor, la justicia y la misericordia y su aplicación en la vida' },
    { code: 'RE03-OA03', eje: 'Fe y Vida',  description: 'Practicar la oración y la lectura bíblica como medios de crecimiento espiritual' },
    { code: 'RE03-OA04', eje: 'Comunidad',  description: 'Reconocer el rol de la familia y la iglesia como espacios de formación en la fe evangélica' },
    { code: 'RE03-OA05', eje: 'Comunidad',  description: 'Demostrar actitudes de solidaridad y servicio al prójimo inspiradas en el Evangelio' },
  ],
  'RE04': [
    { code: 'RE04-OA01', eje: 'Biblia',     description: 'Analizar relatos y enseñanzas bíblicas identificando su mensaje central y su relevancia para la vida' },
    { code: 'RE04-OA02', eje: 'Fe y Vida',  description: 'Comprender el significado de la fe cristiana y cómo orienta las decisiones y acciones cotidianas' },
    { code: 'RE04-OA03', eje: 'Fe y Vida',  description: 'Reconocer la oración, el culto y el servicio como expresiones de la vida cristiana' },
    { code: 'RE04-OA04', eje: 'Comunidad',  description: 'Valorar la comunidad de fe como espacio de aprendizaje, apoyo y servicio' },
    { code: 'RE04-OA05', eje: 'Comunidad',  description: 'Aplicar principios bíblicos en sus relaciones interpersonales y en el cuidado del entorno' },
  ],
  'RE05': [
    { code: 'RE05-OA01', eje: 'Biblia',     description: 'Comprender el mensaje central de las Escrituras sobre la salvación y el llamado a seguir a Jesucristo' },
    { code: 'RE05-OA02', eje: 'Fe y Vida',  description: 'Analizar la relación entre los valores del Evangelio y los desafíos éticos de la vida cotidiana' },
    { code: 'RE05-OA03', eje: 'Fe y Vida',  description: 'Desarrollar una vida de oración y estudio bíblico como práctica espiritual personal' },
    { code: 'RE05-OA04', eje: 'Comunidad',  description: 'Valorar el servicio a los demás como expresión concreta del amor cristiano' },
    { code: 'RE05-OA05', eje: 'Comunidad',  description: 'Reconocer la diversidad dentro del protestantismo y el diálogo ecuménico como expresión de unidad' },
  ],
  'RE06': [
    { code: 'RE06-OA01', eje: 'Biblia',     description: 'Interpretar textos bíblicos relacionándolos con el contexto histórico y su mensaje para el mundo actual' },
    { code: 'RE06-OA02', eje: 'Fe y Vida',  description: 'Analizar dilemas éticos desde una perspectiva cristiana fundamentada en los valores del Evangelio' },
    { code: 'RE06-OA03', eje: 'Fe y Vida',  description: 'Reflexionar sobre su propia fe y su desarrollo espiritual en el contexto de la comunidad cristiana' },
    { code: 'RE06-OA04', eje: 'Comunidad',  description: 'Valorar el aporte de la Iglesia Evangélica a la sociedad chilena en educación, salud y bien común' },
    { code: 'RE06-OA05', eje: 'Comunidad',  description: 'Promover el respeto entre personas de distintas creencias y tradiciones religiosas' },
  ],
  'RE07': [
    { code: 'RE07-OA01', eje: 'Biblia',     description: 'Analizar el contexto histórico y teológico de los textos bíblicos y su relevancia para la vida contemporánea' },
    { code: 'RE07-OA02', eje: 'Fe y Vida',  description: 'Reflexionar sobre la identidad cristiana y su relación con la identidad personal en la adolescencia' },
    { code: 'RE07-OA03', eje: 'Fe y Vida',  description: 'Analizar decisiones y proyectos de vida a la luz de los valores del Evangelio' },
    { code: 'RE07-OA04', eje: 'Comunidad',  description: 'Reconocer el compromiso social del cristiano frente a la injusticia, la pobreza y el cuidado de la creación' },
    { code: 'RE07-OA05', eje: 'Comunidad',  description: 'Valorar el diálogo interreligioso y el respeto a la libertad de conciencia como principios democráticos' },
  ],
  'RE08': [
    { code: 'RE08-OA01', eje: 'Biblia',     description: 'Interpretar críticamente textos bíblicos aplicando su mensaje a situaciones actuales de la vida personal y social' },
    { code: 'RE08-OA02', eje: 'Fe y Vida',  description: 'Fundamentar su fe cristiana frente a preguntas sobre el sentido de la vida, el sufrimiento y la esperanza' },
    { code: 'RE08-OA03', eje: 'Fe y Vida',  description: 'Elaborar un proyecto de vida personal orientado por los valores del Evangelio' },
    { code: 'RE08-OA04', eje: 'Comunidad',  description: 'Analizar el rol de la Iglesia Evangélica en la historia de Chile y su aporte actual a la sociedad' },
    { code: 'RE08-OA05', eje: 'Comunidad',  description: 'Comprometerse con acciones concretas de servicio, justicia y cuidado del medio ambiente como expresión de fe' },
  ],

  // ── RELIGIÓN CATÓLICA ─────────────────────────────────────────────────────
  'RC01': [
    { code: 'RC01-OA01', eje: 'Dios y la Creacion',            description: 'Reconocer a Dios como creador del mundo y de las personas, que ama y cuida su creación' },
    { code: 'RC01-OA02', eje: 'Dios y la Creacion',            description: 'Valorar la naturaleza como regalo de Dios y practicar su cuidado' },
    { code: 'RC01-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Conocer episodios sencillos de la vida de Jesús y su mensaje de amor' },
    { code: 'RC01-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Reconocer la familia y la comunidad cristiana como espacios de amor y pertenencia' },
    { code: 'RC01-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Expresar su relación con Dios mediante la oración, el canto y signos religiosos sencillos' },
  ],
  'RC02': [
    { code: 'RC02-OA01', eje: 'Dios y la Creacion',            description: 'Reconocer a Dios Padre como origen de la vida y fuente del amor, a quien los seres humanos pueden conocer' },
    { code: 'RC02-OA02', eje: 'Jesucristo y el Evangelio',     description: 'Conocer la historia de Jesús de Nazaret, su mensaje del Reino de Dios y los milagros como signos de amor' },
    { code: 'RC02-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Reconocer a María como madre de Jesús y modelo de fe para los cristianos' },
    { code: 'RC02-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Conocer el Bautismo como sacramento de iniciación a la vida cristiana' },
    { code: 'RC02-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Practicar la oración personal y comunitaria como diálogo con Dios' },
  ],
  'RC03': [
    { code: 'RC03-OA01', eje: 'Dios y la Creacion',            description: 'Comprender la Biblia como Palabra de Dios y conocer relatos del Antiguo Testamento' },
    { code: 'RC03-OA02', eje: 'Jesucristo y el Evangelio',     description: 'Profundizar en las enseñanzas de Jesús: las bienaventuranzas y el mandamiento del amor' },
    { code: 'RC03-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Conocer la Pascua de Jesús (muerte y resurrección) como centro de la fe cristiana' },
    { code: 'RC03-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Reconocer la Eucaristía como memorial de la última cena de Jesús y sacramento de unidad' },
    { code: 'RC03-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Valorar la comunidad parroquial como espacio de celebración, servicio y fraternidad' },
  ],
  'RC04': [
    { code: 'RC04-OA01', eje: 'Dios y la Creacion',            description: 'Conocer la historia de salvación en el Antiguo Testamento: patriarcas, Moisés y los profetas' },
    { code: 'RC04-OA02', eje: 'Jesucristo y el Evangelio',     description: 'Profundizar en las parábolas del Evangelio y su mensaje sobre el Reino de Dios' },
    { code: 'RC04-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Reconocer a Jesucristo como plenitud de la revelación de Dios' },
    { code: 'RC04-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Conocer el sacramento de la Reconciliación como signo del perdón y la misericordia de Dios' },
    { code: 'RC04-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Valorar el servicio al prójimo, especialmente a los más pobres, como expresión de la fe cristiana' },
  ],
  'RC05': [
    { code: 'RC05-OA01', eje: 'Dios y la Creacion',            description: 'Comprender el significado de la Trinidad: Padre, Hijo y Espíritu Santo en la fe católica' },
    { code: 'RC05-OA02', eje: 'Jesucristo y el Evangelio',     description: 'Analizar el mensaje de justicia, paz y fraternidad de Jesús y su vigencia en el mundo actual' },
    { code: 'RC05-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Conocer el Credo como expresión de la fe de la Iglesia Católica' },
    { code: 'RC05-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Reconocer los siete sacramentos como signos de la presencia de Cristo en la vida de los creyentes' },
    { code: 'RC05-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Valorar el aporte de la Iglesia Católica a la educación, la salud y el bien común en Chile' },
  ],
  'RC06': [
    { code: 'RC06-OA01', eje: 'Dios y la Creacion',            description: 'Reflexionar sobre el ser humano como imagen de Dios, con dignidad, libertad y responsabilidad' },
    { code: 'RC06-OA02', eje: 'Jesucristo y el Evangelio',     description: 'Analizar la doctrina social de la Iglesia: solidaridad, justicia y opción preferencial por los pobres' },
    { code: 'RC06-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Comprender la moral cristiana como respuesta a la llamada de Dios y camino de plena realización' },
    { code: 'RC06-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Conocer la historia de la Iglesia Católica y su presencia en América Latina y Chile' },
    { code: 'RC06-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Valorar la diversidad de expresiones religiosas y promover el diálogo interreligioso' },
  ],
  'RC07': [
    { code: 'RC07-OA01', eje: 'Dios y la Creacion',            description: 'Analizar preguntas fundamentales sobre el sentido de la vida, el sufrimiento y la esperanza desde la fe cristiana' },
    { code: 'RC07-OA02', eje: 'Jesucristo y el Evangelio',     description: 'Reflexionar sobre la ética cristiana y los valores del Evangelio frente a los desafíos de la adolescencia' },
    { code: 'RC07-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Comprender el mensaje de la Resurrección como fundamento de la esperanza cristiana' },
    { code: 'RC07-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Reconocer el papel de los sacramentos de iniciación (Bautismo, Confirmación, Eucaristía) en la vida del creyente' },
    { code: 'RC07-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Analizar el compromiso social cristiano frente a la injusticia, la pobreza y el cuidado del medio ambiente' },
  ],
  'RC08': [
    { code: 'RC08-OA01', eje: 'Dios y la Creacion',            description: 'Reflexionar sobre la fe cristiana frente a corrientes del pensamiento contemporáneo y el ateísmo' },
    { code: 'RC08-OA02', eje: 'Jesucristo y el Evangelio',     description: 'Elaborar un proyecto de vida personal inspirado en los valores del Evangelio y la enseñanza social de la Iglesia' },
    { code: 'RC08-OA03', eje: 'Jesucristo y el Evangelio',     description: 'Analizar el diálogo fe-razón y la contribución del pensamiento cristiano a la cultura y la ciencia' },
    { code: 'RC08-OA04', eje: 'La Iglesia y los Sacramentos',  description: 'Conocer el Concilio Vaticano II y la renovación de la Iglesia en su misión evangelizadora' },
    { code: 'RC08-OA05', eje: 'La Iglesia y los Sacramentos',  description: 'Comprometerse con acciones de justicia, solidaridad y cuidado de la creación como respuesta a la fe' },
  ],
};

// ─── Mapeo código de asignatura → slug Firestore ──────────────────────────

const SUBJECT_SLUG = {
  IN: 'ingles',
  OR: 'orientacion',
  RE: 'religion-evangelica',
  RC: 'religion-catolica',
};

// ─── Main ──────────────────────────────────────────────────────────────────

if (!existsSync(KEY_FILE)) {
  console.error(`❌ No encontré ${KEY_FILE}`);
  console.error('   Descárgala desde Firebase Console → Configuración → Cuentas de servicio');
  process.exit(1);
}

const app = initializeApp({ credential: cert(KEY_FILE) });
const db  = getFirestore(app);

const oasCol = db.collection('curriculum').doc(YEAR).collection('oas');

let written = 0;
let skipped = 0;

for (const [key, oas] of Object.entries(OA_DATA)) {
  const subjectCode = key.slice(0, 2);   // 'IN', 'OR', 'RE', 'RC'
  const levelNum    = key.slice(2, 4);   // '01' … '08'
  const gradeSlug   = NIVEL_TO_SLUG[levelNum];
  const subjectSlug = SUBJECT_SLUG[subjectCode];

  if (!gradeSlug || !subjectSlug) {
    console.warn(`⚠ Sin mapeo para ${key} — omitido`);
    continue;
  }

  const docId = `${gradeSlug}_${subjectSlug}`;
  const ref   = oasCol.doc(docId);

  // Verificar si ya existe
  const snap = await ref.get();
  if (snap.exists) {
    console.log(`  ⏭  ${docId} ya existe, omitido`);
    skipped++;
    continue;
  }

  const ejes = groupByEje(oas);
  await ref.set({ curso_slug: gradeSlug, asignatura_slug: subjectSlug, ejes });
  console.log(`  ✅ ${docId} (${oas.length} OAs)`);
  written++;
}

console.log(`\n🎉 Listo: ${written} docs creados, ${skipped} omitidos (ya existían).`);
console.log(`   Ruta: curriculum/${YEAR}/oas/`);
process.exit(0);

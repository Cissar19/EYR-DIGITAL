/**
 * seed_cobertura_2026.mjs
 * ───────────────────────
 * Crea los documentos de cobertura curricular para el año 2026 en Firestore.
 * Ruta: schools/eyr/academicYears/2026/coverage/
 *
 * Fuentes:
 *   - Estados (pasados/faltantes): docs/OA-COMPLETADOS.md
 *   - OA basales por asignatura/nivel: src/lib/coverageConstants.js (BASALES_MINEDUC)
 *
 * Uso:
 *   node scripts/seed_cobertura_2026.mjs [--year 2026] [--dry-run]
 *
 * Requisitos:
 *   - scripts/serviceAccountKey.json (Firebase Console → Configuración → Cuentas de servicio)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE  = join(__dirname, 'serviceAccountKey.json');

const YEAR    = process.argv.includes('--year')
  ? process.argv[process.argv.indexOf('--year') + 1]
  : '2025';
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Etiquetas de asignatura ─────────────────────────────────────────────────

const SUBJECT_LABELS = {
  lenguaje:            'Lenguaje',
  lengua_y_literatura: 'Lengua y Literatura',
  matematica:          'Matemática',
  ciencias:            'Ciencias Nat.',
  historia:            'Historia',
  educacion_fisica:    'Ed. Física',
  musica:              'Música',
  artes:               'Artes',
  tecnologia:          'Tecnología',
  ingles:              'Inglés',
};

const GRADE_ORDER = ['1A','2A','3A','4A','5A','6A','7A','8A'];

// ─── OA Basales MINEDUC (de src/lib/coverageConstants.js) ────────────────────

const BASALES = {
  lenguaje: {
    '1A': ['OA01','OA03','OA04','OA05','OA08','OA09','OA10','OA11','OA13','OA18','OA21','OA23','OA25'],
    '2A': ['OA01','OA02','OA05','OA06','OA07','OA08','OA10','OA12','OA16','OA17','OA23','OA25','OA27','OA29'],
    '3A': ['OA01','OA04','OA05','OA06','OA07','OA09','OA12','OA17','OA18','OA24','OA26','OA28','OA30'],
    '4A': ['OA01','OA04','OA05','OA06','OA07','OA11','OA16','OA17','OA23','OA25','OA27','OA29'],
    '5A': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA10','OA11','OA12','OA13','OA14','OA15','OA17','OA18','OA24','OA26','OA28'],
    '6A': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA09','OA11','OA13','OA15','OA17','OA18','OA23','OA24','OA27','OA29'],
  },
  lengua_y_literatura: {
    '7A': ['OA02','OA03','OA06','OA07','OA09','OA12','OA16','OA19','OA21','OA22','OA24','OA25'],
    '8A': ['OA02','OA03','OA04','OA05','OA07','OA08','OA09','OA10','OA11','OA12','OA13','OA14','OA16','OA18','OA20','OA21','OA22','OA25','OA26'],
  },
  matematica: {
    '1A': ['OA03','OA04','OA06','OA08','OA09','OA11','OA13','OA14','OA18','OA19','OA20'],
    '2A': ['OA02','OA03','OA05','OA07','OA09','OA11','OA12','OA13','OA15','OA16','OA19','OA20','OA22'],
    '3A': ['OA02','OA03','OA05','OA06','OA08','OA09','OA10','OA11','OA12','OA15','OA21','OA22','OA25'],
    '4A': ['OA01','OA02','OA03','OA05','OA06','OA07','OA08','OA09','OA13','OA14','OA17','OA18','OA19','OA22','OA23','OA24','OA25','OA27'],
    '5A': ['OA01','OA03','OA04','OA06','OA07','OA09','OA10','OA12','OA13','OA14','OA17','OA18','OA19','OA21','OA22','OA23','OA24'],
    '6A': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA11','OA13','OA15','OA18','OA23','OA24'],
    '7A': ['OA01','OA04','OA07','OA08','OA09','OA12','OA14','OA15','OA17','OA18','OA20'],
    '8A': ['OA01','OA02','OA03','OA04','OA07','OA08','OA10','OA12','OA15','OA16','OA18','OA22'],
  },
  ciencias: {
    '1A': ['OA01','OA05','OA06','OA08','OA09','OA11'],
    '2A': ['OA03','OA05','OA07','OA08','OA09','OA11','OA12','OA14'],
    '3A': ['OA02','OA04','OA05','OA06','OA09','OA10','OA11','OA12'],
    '4A': ['OA01','OA02','OA03','OA06','OA07','OA09','OA10','OA12','OA15','OA18','OA19'],
    '5A': ['OA01','OA05','OA06','OA07','OA09','OA11','OA14','OA22','OA26'],
    '6A': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA09','OA11','OA12','OA15','OA16','OA17'],
    '7A': ['OA01','OA03','OA04','OA06','OA08','OA11','OA12','OA14','OA16','OA18','OA24'],
    '8A': ['OA02','OA04','OA05','OA07','OA10','OA11','OA12','OA14','OA15','OA16'],
  },
  historia: {
    '1A': ['OA02','OA04','OA06','OA07','OA09','OA10','OA12','OA14','OA15'],
    '2A': ['OA01','OA02','OA03','OA04','OA07','OA08','OA14','OA15','OA16'],
    '3A': ['OA03','OA04','OA05','OA07','OA08','OA11','OA14','OA15','OA16'],
    '4A': ['OA04','OA05','OA08','OA09','OA10','OA11','OA12','OA17'],
    '5A': ['OA01','OA05','OA06','OA07','OA09','OA11','OA14','OA22','OA26'],
    '6A': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA09','OA11','OA12','OA15','OA16','OA17'],
    '7A': ['OA01','OA02','OA03','OA05','OA07','OA09','OA12','OA13','OA14','OA19','OA22'],
    '8A': ['OA02','OA04','OA06','OA09','OA12','OA14','OA16','OA18','OA20','OA21'],
  },
  educacion_fisica: {
    '1A': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '2A': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '3A': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '4A': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '5A': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '6A': ['OA01','OA05','OA06','OA07','OA09'],
    '7A': ['OA01','OA03','OA04','OA05'],
    '8A': ['OA01','OA03','OA04','OA05'],
  },
  musica: {
    '1A': ['OA01','OA04','OA07'],
    '2A': ['OA01','OA04','OA07'],
    '3A': ['OA01','OA04','OA07'],
    '4A': ['OA02','OA04','OA07'],
    '5A': ['OA02','OA04','OA07'],
    '8A': ['OA01','OA03','OA07'],
  },
  artes: {
    '1A': ['OA01','OA04','OA05'],
    '2A': ['OA01','OA04','OA05'],
    '3A': ['OA01','OA04','OA05'],
    '4A': ['OA01','OA04','OA05','OA06','OA07'],
    '5A': ['OA01','OA04','OA05'],
    '6A': ['OA01','OA04','OA05'],
    '7A': ['OA01','OA03','OA07'],
    '8A': ['OA01','OA02','OA04','OA06'],
  },
  tecnologia: {
    '1A': ['OA01','OA03','OA06'],
    '2A': ['OA01','OA03','OA05','OA06','OA07'],
    '3A': ['OA03','OA04','OA05','OA06','OA07'],
    '4A': ['OA03','OA04','OA05'],
    '5A': ['OA03','OA04','OA05','OA06','OA07'],
    '6A': ['OA02','OA04','OA06'],
    '7A': ['OA01','OA02','OA04','OA06'],
    '8A': ['OA02','OA04','OA06'],
  },
  ingles: {
    '5A': ['OA01','OA02','OA05','OA08','OA09','OA10','OA12','OA14','OA15'],
    '6A': ['OA01','OA02','OA05','OA08','OA09','OA10','OA12','OA14','OA15'],
    '7A': ['OA01','OA02','OA07','OA08','OA09','OA12','OA13','OA14','OA16'],
    '8A': ['OA01','OA02','OA07','OA08','OA09','OA12','OA13','OA14','OA16'],
  },
};

// ─── OA Incompletos por nivel (docs/OA-COMPLETADOS.md) ───────────────────────
// Los OA que NO están aquí se consideran completos (true).
// Los que SÍ están aquí se marcan false (no cubiertos).
// Se incluyen también OAs no-basales explicitamente listados como incompletos.

const INCOMPLETOS = {
  '1A': {
    lenguaje:         ['OA18'],
    matematica:       [],
    ciencias:         [],
    historia:         [],
    educacion_fisica: [],
    musica:           [],
    artes:            [],
    tecnologia:       [],
  },
  '2A': {
    lenguaje:         [],
    matematica:       ['OA16'],
    ciencias:         [],
    historia:         ['OA16'],
    educacion_fisica: [],
    musica:           [],
    artes:            ['OA04'],
    tecnologia:       ['OA07'],
  },
  '3A': {
    lenguaje:         ['OA15'],           // OA15 no es basal en 3B lenguaje — se agrega de todas formas
    matematica:       ['OA10','OA11','OA12','OA15'],
    ciencias:         ['OA11','OA12'],
    historia:         ['OA03','OA04','OA11','OA14','OA15','OA16'],
    educacion_fisica: [],
    musica:           [],
    artes:            [],
    tecnologia:       [],
  },
  '4A': {
    lenguaje:         ['OA07','OA17','OA19','OA23','OA24'], // OA19, OA24 no son basales — se agregan
    matematica:       ['OA07','OA17','OA18'],
    ciencias:         [],
    historia:         [],
    educacion_fisica: [],
    musica:           [],
    artes:            [],
    tecnologia:       ['OA04'],
  },
  '5A': {
    lenguaje:         ['OA02','OA13','OA18','OA24','OA26'],
    matematica:       ['OA06','OA07','OA14','OA22'],
    ciencias:         [],
    historia:         [],
    educacion_fisica: [],
    musica:           [],
    artes:            [],
    tecnologia:       ['OA06','OA07'],
    ingles:           ['OA15'],
  },
  '6A': {
    lenguaje:         ['OA02','OA05','OA07','OA08','OA11','OA18'],
    matematica:       ['OA07','OA08','OA11','OA16','OA17','OA18','OA24'], // OA16, OA17 no son basales
    ciencias:         [],
    historia:         [],
    educacion_fisica: [],
    musica:           [],
    artes:            [],
    tecnologia:       ['OA06'],
    ingles:           ['OA01','OA02','OA15'],
  },
  '7A': {
    lengua_y_literatura: ['OA06','OA07','OA09','OA16','OA20','OA21'], // OA20 no es basal
    matematica:          ['OA19','OA20'],  // OA19 no es basal en 7A
    ciencias:            ['OA24'],
    historia:            [],
    educacion_fisica:    [],
    artes:               [],
    tecnologia:          ['OA06'],
    ingles:              ['OA12'],
  },
  '8A': {
    lengua_y_literatura: ['OA02','OA07','OA11','OA14','OA20','OA22'],
    matematica:          ['OA16','OA18'],
    ciencias:            [],
    historia:            [],
    educacion_fisica:    [],
    musica:              [],
    artes:               [],
    tecnologia:          ['OA06'],
    ingles:              ['OA09','OA12'],
  },
};

// ─── Profesores por grado/asignatura (extraídos de sección B en 2026) ────────
// Misma planta docente para sección A.

const TEACHERS = {
  '1A': {
    lenguaje:         { teacherId: 'placeholder_juan_figueroa_huinca',      teacherName: 'Juan Figueroa Huinca' },
    matematica:       { teacherId: 'placeholder_juan_figueroa_huinca',      teacherName: 'Juan Figueroa Huinca' },
    ciencias:         { teacherId: 'placeholder_juan_figueroa_huinca',      teacherName: 'Juan Figueroa Huinca' },
    historia:         { teacherId: 'placeholder_juan_figueroa_huinca',      teacherName: 'Juan Figueroa Huinca' },
    educacion_fisica: { teacherId: 'placeholder_francisco_perez_delgado',   teacherName: 'Francisco Pérez Delgado' },
    musica:           { teacherId: 'placeholder_daniela_alvarado_vera',     teacherName: 'Daniela Alvarado Vera' },
    artes:            { teacherId: 'placeholder_sofia_martinez_ormeno',     teacherName: 'Sofía Martínez Ormeño' },
    tecnologia:       { teacherId: 'placeholder_juan_figueroa_huinca',      teacherName: 'Juan Figueroa Huinca' },
    ingles:           { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
  '2A': {
    lenguaje:         { teacherId: 'placeholder_marisol_molina_vera',       teacherName: 'Marisol Molina Vera' },
    matematica:       { teacherId: 'placeholder_marisol_molina_vera',       teacherName: 'Marisol Molina Vera' },
    ciencias:         { teacherId: 'placeholder_marisol_molina_vera',       teacherName: 'Marisol Molina Vera' },
    historia:         { teacherId: 'placeholder_marisol_molina_vera',       teacherName: 'Marisol Molina Vera' },
    educacion_fisica: { teacherId: 'placeholder_francisco_perez_delgado',   teacherName: 'Francisco Pérez Delgado' },
    musica:           { teacherId: 'placeholder_daniela_alvarado_vera',     teacherName: 'Daniela Alvarado Vera' },
    artes:            { teacherId: 'placeholder_sofia_martinez_ormeno',     teacherName: 'Sofía Martínez Ormeño' },
    tecnologia:       { teacherId: 'placeholder_marisol_molina_vera',       teacherName: 'Marisol Molina Vera' },
    ingles:           { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
  '3A': {
    lenguaje:         { teacherId: 'placeholder_pamela_olivero_figueroa',   teacherName: 'Pamela Olivero Figueroa' },
    matematica:       { teacherId: 'placeholder_manuel_astudillo_figueroa', teacherName: 'Manuel Astudillo Figueroa' },
    ciencias:         { teacherId: 'placeholder_pamela_olivero_figueroa',   teacherName: 'Pamela Olivero Figueroa' },
    historia:         { teacherId: 'placeholder_alvaro_jara_barrientos',    teacherName: 'Alvaro Jara Barrientos' },
    educacion_fisica: { teacherId: null,                                     teacherName: null },
    musica:           { teacherId: 'placeholder_daniela_alvarado_vera',     teacherName: 'Daniela Alvarado Vera' },
    artes:            { teacherId: 'placeholder_sofia_martinez_ormeno',     teacherName: 'Sofía Martínez Ormeño' },
    tecnologia:       { teacherId: 'placeholder_pamela_olivero_figueroa',   teacherName: 'Pamela Olivero Figueroa' },
    ingles:           { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
  '4A': {
    lenguaje:         { teacherId: 'placeholder_pamela_olivero_figueroa',   teacherName: 'Pamela Olivero Figueroa' },
    matematica:       { teacherId: 'placeholder_manuel_astudillo_figueroa', teacherName: 'Manuel Astudillo Figueroa' },
    ciencias:         { teacherId: 'placeholder_jacqueline_duran_burgos',   teacherName: 'Jacqueline Durán Burgos' },
    historia:         { teacherId: 'placeholder_alvaro_jara_barrientos',    teacherName: 'Alvaro Jara Barrientos' },
    educacion_fisica: { teacherId: null,                                     teacherName: null },
    musica:           { teacherId: 'placeholder_daniela_alvarado_vera',     teacherName: 'Daniela Alvarado Vera' },
    artes:            { teacherId: 'placeholder_sofia_martinez_ormeno',     teacherName: 'Sofía Martínez Ormeño' },
    tecnologia:       { teacherId: 'placeholder_pamela_olivero_figueroa',   teacherName: 'Pamela Olivero Figueroa' },
    ingles:           { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
  '5A': {
    lenguaje:         { teacherId: 'placeholder_constanza_vargas_retamal',  teacherName: 'Constanza Vargas Retamal' },
    matematica:       { teacherId: 'placeholder_manuel_astudillo_figueroa', teacherName: 'Manuel Astudillo Figueroa' },
    ciencias:         { teacherId: 'placeholder_jacqueline_duran_burgos',   teacherName: 'Jacqueline Durán Burgos' },
    historia:         { teacherId: 'placeholder_alvaro_jara_barrientos',    teacherName: 'Alvaro Jara Barrientos' },
    educacion_fisica: { teacherId: 'placeholder_francisco_perez_delgado',   teacherName: 'Francisco Pérez Delgado' },
    musica:           { teacherId: 'placeholder_daniela_alvarado_vera',     teacherName: 'Daniela Alvarado Vera' },
    artes:            { teacherId: 'placeholder_sofia_martinez_ormeno',     teacherName: 'Sofía Martínez Ormeño' },
    tecnologia:       { teacherId: 'placeholder_pamela_olivero_figueroa',   teacherName: 'Pamela Olivero Figueroa' },
    ingles:           { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
  '6A': {
    lenguaje:         { teacherId: 'placeholder_constanza_vargas_retamal',  teacherName: 'Constanza Vargas Retamal' },
    matematica:       { teacherId: 'placeholder_manuel_astudillo_figueroa', teacherName: 'Manuel Astudillo Figueroa' },
    ciencias:         { teacherId: 'placeholder_jacqueline_duran_burgos',   teacherName: 'Jacqueline Durán Burgos' },
    historia:         { teacherId: 'placeholder_alvaro_jara_barrientos',    teacherName: 'Alvaro Jara Barrientos' },
    educacion_fisica: { teacherId: 'placeholder_francisco_perez_delgado',   teacherName: 'Francisco Pérez Delgado' },
    musica:           { teacherId: 'placeholder_daniela_alvarado_vera',     teacherName: 'Daniela Alvarado Vera' },
    artes:            { teacherId: 'placeholder_sofia_martinez_ormeno',     teacherName: 'Sofía Martínez Ormeño' },
    tecnologia:       { teacherId: 'placeholder_leslye_valencia_ramos',     teacherName: 'Leslye Valencia Ramos' },
    ingles:           { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
  '7A': {
    lengua_y_literatura: { teacherId: 'placeholder_constanza_vargas_retamal',  teacherName: 'Constanza Vargas Retamal' },
    matematica:          { teacherId: 'placeholder_eduardo_baeza_gonzalez',    teacherName: 'Eduardo Baeza González' },
    ciencias:            { teacherId: 'placeholder_jacqueline_duran_burgos',   teacherName: 'Jacqueline Durán Burgos' },
    historia:            { teacherId: 'placeholder_alvaro_jara_barrientos',    teacherName: 'Alvaro Jara Barrientos' },
    educacion_fisica:    { teacherId: null,                                     teacherName: null },
    artes:               { teacherId: null,                                     teacherName: null },
    tecnologia:          { teacherId: null,                                     teacherName: null },
    ingles:              { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
  '8A': {
    lengua_y_literatura: { teacherId: 'placeholder_constanza_vargas_retamal',  teacherName: 'Constanza Vargas Retamal' },
    matematica:          { teacherId: 'placeholder_eduardo_baeza_gonzalez',    teacherName: 'Eduardo Baeza González' },
    ciencias:            { teacherId: 'placeholder_jacqueline_duran_burgos',   teacherName: 'Jacqueline Durán Burgos' },
    historia:            { teacherId: 'placeholder_alvaro_jara_barrientos',    teacherName: 'Alvaro Jara Barrientos' },
    educacion_fisica:    { teacherId: 'placeholder_francisco_perez_delgado',   teacherName: 'Francisco Pérez Delgado' },
    musica:              { teacherId: 'placeholder_daniela_alvarado_vera',     teacherName: 'Daniela Alvarado Vera' },
    artes:               { teacherId: 'placeholder_sofia_martinez_ormeno',     teacherName: 'Sofía Martínez Ormeño' },
    tecnologia:          { teacherId: 'placeholder_pamela_olivero_figueroa',   teacherName: 'Pamela Olivero Figueroa' },
    ingles:              { teacherId: 'bvkn9KrVBuf0citT2j85EJfk7sz1',         teacherName: 'Virna Deborah Caniupil Ortiz' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye legacyOaStatus combinando basales y lista de incompletos.
 * Basales que no están en incompletos → true.
 * Incompletos (basal o no) → false.
 */
function buildLegacyOaStatus(basalesArr, incompletosArr) {
  const incompletosSet = new Set(incompletosArr);
  const status = {};
  // Basales
  for (const oa of basalesArr) {
    status[oa] = !incompletosSet.has(oa);
  }
  // No-basales explicitamente incompletos
  for (const oa of incompletosArr) {
    if (!(oa in status)) status[oa] = false;
  }
  return status;
}

/**
 * Construye basalesOas { OAxx: true, ... } a partir del array de basales.
 */
function buildBasalesOas(basalesArr) {
  return Object.fromEntries(basalesArr.map(oa => [oa, true]));
}

// ─── Construcción de bloques a crear ─────────────────────────────────────────

const blocks = [];

for (const [subject, gradesMap] of Object.entries(BASALES)) {
  for (const [grade, basalesArr] of Object.entries(gradesMap)) {
    const gradeNumber = GRADE_ORDER.indexOf(grade) + 1;
    const incompletosArr = INCOMPLETOS[grade]?.[subject] ?? [];
    const teacher        = TEACHERS[grade]?.[subject] ?? { teacherId: null, teacherName: null };

    blocks.push({
      grade,
      gradeNumber,
      subject,
      subjectLabel: SUBJECT_LABELS[subject] ?? subject,
      teacherId:    teacher.teacherId,
      teacherName:  teacher.teacherName,
      legacyOaStatus: buildLegacyOaStatus(basalesArr, incompletosArr),
      basalesOas:     buildBasalesOas(basalesArr),
      evaluaciones:   { sem1: null, sem2: null },
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (!existsSync(KEY_FILE)) {
  console.error(`❌ No encontré ${KEY_FILE}`);
  console.error('   Descárgala desde Firebase Console → Configuración → Cuentas de servicio');
  process.exit(1);
}

const app = initializeApp({ credential: cert(KEY_FILE) });
const db  = getFirestore(app);

const col = db.collection('schools').doc('eyr')
              .collection('academicYears').doc(YEAR)
              .collection('coverage');

// Verificar cuáles ya existen
console.log(`\n📋 Verificando datos existentes en schools/eyr/academicYears/${YEAR}/coverage/ …`);
const existing = await col.get();
const existingSet = new Set(
  existing.docs.map(d => `${d.data().grade}::${d.data().subject}`)
);
console.log(`   ${existingSet.size} bloques ya existen.`);

let created = 0;
let skipped = 0;

for (const block of blocks) {
  const key = `${block.grade}::${block.subject}`;
  if (existingSet.has(key)) {
    console.log(`  ⏭  ${block.grade} / ${block.subjectLabel} — ya existe, omitido`);
    skipped++;
    continue;
  }

  const pasados    = Object.values(block.legacyOaStatus).filter(Boolean).length;
  const total      = Object.keys(block.legacyOaStatus).length;
  const basalCount = Object.keys(block.basalesOas).length;

  if (DRY_RUN) {
    console.log(`  🔍 [DRY-RUN] ${block.grade} / ${block.subjectLabel} — ${pasados}/${total} OAs | ${block.teacherName ?? '(sin docente)'}`);
    created++;
    continue;
  }

  await col.add({
    ...block,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: null,
  });

  console.log(`  ✅ ${block.grade} / ${block.subjectLabel} — ${pasados}/${total} OAs | ${block.teacherName ?? '(sin docente)'}`);
  created++;
}

console.log(`\n🎉 Listo: ${created} bloques ${DRY_RUN ? 'simulados' : 'creados'}, ${skipped} omitidos (ya existían).`);
console.log(`   Ruta: schools/eyr/academicYears/${YEAR}/coverage/`);
process.exit(0);

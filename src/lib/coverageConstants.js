/**
 * Constantes compartidas del módulo Cobertura Curricular.
 */

export const SCHOOL_ID = 'eyr';

/** Código de curso → slug del currículum MINEDUC */
export const GRADE_TO_SLUG = {
  '1B': '1-basico',
  '2B': '2-basico',
  '3B': '3-basico',
  '4B': '4-basico',
  '5B': '5-basico',
  '6B': '6-basico',
  '7B': '7-basico',
  '8B': '8-basico',
};

export const SLUG_TO_GRADE = Object.fromEntries(
  Object.entries(GRADE_TO_SLUG).map(([k, v]) => [v, k])
);

/**
 * Slug de asignatura (coverage) → slug del currículum MINEDUC.
 * Ajustar si el scraper produce slugs distintos.
 */
export const SUBJECT_TO_CURRICULUM_SLUG = {
  lenguaje:              'lenguaje-comunicacion',
  lengua_y_literatura:   'lengua-literatura',
  matematica:            'matematica',
  ciencias:              'ciencias-naturales',
  historia:              'historia-geografia-ciencias-sociales',
  educacion_fisica:      'educacion-fisica-salud',
  musica:                'musica',
  artes:                 'artes-visuales',
  tecnologia:            'tecnologia',
  ingles:                'ingles',
  orientacion:           'orientacion',
  religion_evangelica:   'religion-evangelica',
  religion_catolica:     'religion-catolica',
};

/** Nombre legible de cada asignatura */
export const SUBJECT_LABELS = {
  lenguaje:              'Lenguaje',
  lengua_y_literatura:   'Lengua y Literatura',
  matematica:            'Matemática',
  ciencias:              'Ciencias Nat.',
  historia:              'Historia',
  educacion_fisica:      'Ed. Física',
  musica:                'Música',
  artes:                 'Artes',
  tecnologia:            'Tecnología',
  ingles:                'Inglés',
  orientacion:           'Orientación',
  religion_evangelica:   'Rel. Evangélica',
  religion_catolica:     'Rel. Católica',
};

/** Nombre legible de cada curso */
export const GRADE_LABELS = {
  '1B': '1°', '2B': '2°', '3B': '3°', '4B': '4°',
  '5B': '5°', '6B': '6°', '7B': '7°', '8B': '8°',
};

/** Nombre largo de cada curso */
export const GRADE_FULL_LABELS = {
  '1B': '1° Básico', '2B': '2° Básico', '3B': '3° Básico', '4B': '4° Básico',
  '5B': '5° Básico', '6B': '6° Básico', '7B': '7° Básico', '8B': '8° Básico',
};

/** Orden canónico de cursos */
export const GRADE_ORDER = ['1B','2B','3B','4B','5B','6B','7B','8B'];

/** Orden canónico de asignaturas para el grid */
export const SUBJECT_ORDER = [
  'lenguaje', 'lengua_y_literatura', 'matematica', 'ciencias',
  'historia', 'educacion_fisica', 'musica', 'artes', 'tecnologia',
  'ingles', 'orientacion', 'religion_evangelica', 'religion_catolica',
];

// ── OA Basales EYR ──────────────────────────────────────────────────────────

/**
 * OA basales por asignatura y curso según criterio EYR-Digital (docs/OA_BASALES.md).
 * Fuente única de verdad para filtros de reportes y cálculo de porcentajes basales.
 * Estructura: subject (coverage slug) → grade → array de códigos normalizados.
 *
 * Notas:
 *   - lenguaje          (Lenguaje y Comunicación) cubre 1B–6B
 *   - lengua_y_literatura (Lenguaje y Literatura) cubre 7B–8B
 *   - En 5B y 6B, ciencias e historia comparten el mismo listado ("Ciencias / Historia")
 *   - musica 6B–7B no tiene basales definidos (marcar manualmente con ★)
 */
export const BASALES_MINEDUC = {
  lenguaje: {
    '1B': ['OA01','OA03','OA04','OA05','OA08','OA09','OA10','OA11','OA13','OA18','OA21','OA23','OA25'],
    '2B': ['OA01','OA02','OA05','OA06','OA07','OA08','OA10','OA12','OA16','OA17','OA23','OA25','OA27','OA29'],
    '3B': ['OA01','OA04','OA05','OA06','OA07','OA09','OA12','OA17','OA18','OA24','OA26','OA28','OA30'],
    '4B': ['OA01','OA04','OA05','OA06','OA07','OA11','OA16','OA17','OA23','OA25','OA27','OA29'],
    '5B': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA10','OA11','OA12','OA13','OA14','OA15','OA17','OA18','OA24','OA26','OA28'],
    '6B': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA09','OA11','OA13','OA15','OA17','OA18','OA23','OA24','OA27','OA29'],
  },
  lengua_y_literatura: {
    '7B': ['OA02','OA03','OA06','OA07','OA09','OA12','OA16','OA19','OA21','OA22','OA24','OA25'],
    '8B': ['OA02','OA03','OA04','OA05','OA07','OA08','OA09','OA10','OA11','OA12','OA13','OA14','OA16','OA18','OA20','OA21','OA22','OA25','OA26'],
  },
  matematica: {
    '1B': ['OA03','OA04','OA06','OA08','OA09','OA11','OA13','OA14','OA18','OA19','OA20'],
    '2B': ['OA02','OA03','OA05','OA07','OA09','OA11','OA12','OA13','OA15','OA16','OA19','OA20','OA22'],
    '3B': ['OA02','OA03','OA05','OA06','OA08','OA09','OA10','OA11','OA12','OA15','OA21','OA22','OA25'],
    '4B': ['OA01','OA02','OA03','OA05','OA06','OA07','OA08','OA09','OA13','OA14','OA17','OA18','OA19','OA22','OA23','OA24','OA25','OA27'],
    '5B': ['OA01','OA03','OA04','OA06','OA07','OA09','OA10','OA12','OA13','OA14','OA17','OA18','OA19','OA21','OA22','OA23','OA24'],
    '6B': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA11','OA13','OA15','OA18','OA23','OA24'],
    '7B': ['OA01','OA04','OA07','OA08','OA09','OA12','OA14','OA15','OA17','OA18','OA20'],
    '8B': ['OA01','OA02','OA03','OA04','OA07','OA08','OA10','OA12','OA15','OA16','OA18','OA22'],
  },
  ciencias: {
    '1B': ['OA01','OA05','OA06','OA08','OA09','OA11'],
    '2B': ['OA03','OA05','OA07','OA08','OA09','OA11','OA12','OA14'],
    '3B': ['OA02','OA04','OA05','OA06','OA09','OA10','OA11','OA12'],
    '4B': ['OA01','OA02','OA03','OA06','OA07','OA09','OA10','OA12','OA15','OA18','OA19'],
    '5B': ['OA01','OA05','OA06','OA07','OA09','OA11','OA14','OA22','OA26'],
    '6B': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA09','OA11','OA12','OA15','OA16','OA17'],
    '7B': ['OA01','OA03','OA04','OA06','OA08','OA11','OA12','OA14','OA16','OA18','OA24'],
    '8B': ['OA02','OA04','OA05','OA07','OA10','OA11','OA12','OA14','OA15','OA16'],
  },
  historia: {
    '1B': ['OA02','OA04','OA06','OA07','OA09','OA10','OA12','OA14','OA15'],
    '2B': ['OA01','OA02','OA03','OA04','OA07','OA08','OA14','OA15','OA16'],
    '3B': ['OA03','OA04','OA05','OA07','OA08','OA11','OA14','OA15','OA16'],
    '4B': ['OA04','OA05','OA08','OA09','OA10','OA11','OA12','OA17'],
    '5B': ['OA01','OA05','OA06','OA07','OA09','OA11','OA14','OA22','OA26'],
    '6B': ['OA01','OA02','OA03','OA04','OA05','OA06','OA07','OA08','OA09','OA11','OA12','OA15','OA16','OA17'],
    '7B': ['OA01','OA02','OA03','OA05','OA07','OA09','OA12','OA13','OA14','OA19','OA22'],
    '8B': ['OA02','OA04','OA06','OA09','OA12','OA14','OA16','OA18','OA20','OA21'],
  },
  educacion_fisica: {
    '1B': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '2B': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '3B': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '4B': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '5B': ['OA01','OA05','OA06','OA07','OA09','OA11'],
    '6B': ['OA01','OA05','OA06','OA07','OA09'],
    '7B': ['OA01','OA03','OA04','OA05'],
    '8B': ['OA01','OA03','OA04','OA05'],
  },
  musica: {
    '1B': ['OA01','OA04','OA07'],
    '2B': ['OA01','OA04','OA07'],
    '3B': ['OA01','OA04','OA07'],
    '4B': ['OA02','OA04','OA07'],
    '5B': ['OA02','OA04','OA07'],
    '8B': ['OA01','OA03','OA07'],
  },
  artes: {
    '1B': ['OA01','OA04','OA05'],
    '2B': ['OA01','OA04','OA05'],
    '3B': ['OA01','OA04','OA05'],
    '4B': ['OA01','OA04','OA05','OA06','OA07'],
    '5B': ['OA01','OA04','OA05'],
    '6B': ['OA01','OA04','OA05'],
    '7B': ['OA01','OA03','OA07'],
    '8B': ['OA01','OA02','OA04','OA06'],
  },
  tecnologia: {
    '1B': ['OA01','OA03','OA06'],
    '2B': ['OA01','OA03','OA05','OA06','OA07'],
    '3B': ['OA03','OA04','OA05','OA06','OA07'],
    '4B': ['OA03','OA04','OA05'],
    '5B': ['OA03','OA04','OA05','OA06','OA07'],
    '6B': ['OA02','OA04','OA06'],
    '7B': ['OA01','OA02','OA04','OA06'],
    '8B': ['OA02','OA04','OA06'],
  },
  ingles: {
    '5B': ['OA01','OA02','OA05','OA08','OA09','OA10','OA12','OA14','OA15'],
    '6B': ['OA01','OA02','OA05','OA08','OA09','OA10','OA12','OA14','OA15'],
    '7B': ['OA01','OA02','OA07','OA08','OA09','OA12','OA13','OA14','OA16'],
    '8B': ['OA01','OA02','OA07','OA08','OA09','OA12','OA13','OA14','OA16'],
  },
};

/**
 * Retorna el Set de códigos OA basales predefinidos para subject+grade.
 * Set vacío si no hay parametrización para esa combinación.
 */
export function getBasalesMineduc(subject, grade) {
  return new Set(BASALES_MINEDUC[subject]?.[grade] ?? []);
}

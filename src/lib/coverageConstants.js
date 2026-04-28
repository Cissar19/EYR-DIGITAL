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
  lenguaje:            'lenguaje-comunicacion',
  lengua_y_literatura: 'lengua-literatura',
  matematica:          'matematica',
  ciencias:            'ciencias-naturales',
  historia:            'historia-geografia-ciencias-sociales',
  educacion_fisica:    'educacion-fisica-salud',
  musica:              'musica',
  artes:               'artes-visuales',
  tecnologia:          'tecnologia',
};

/** Nombre legible de cada asignatura */
export const SUBJECT_LABELS = {
  lenguaje:            'Lenguaje',
  lengua_y_literatura: 'Lengua y Literatura',
  matematica:          'Matemática',
  ciencias:            'Ciencias Nat.',
  historia:            'Historia',
  educacion_fisica:    'Ed. Física',
  musica:              'Música',
  artes:               'Artes',
  tecnologia:          'Tecnología',
};

/** Nombre legible de cada curso (sección A) */
export const GRADE_LABELS = {
  '1B': '1°A', '2B': '2°A', '3B': '3°A', '4B': '4°A',
  '5B': '5°A', '6B': '6°A', '7B': '7°A', '8B': '8°A',
};

/** Nombre largo de cada curso */
export const GRADE_FULL_LABELS = {
  '1B': '1° Básico A', '2B': '2° Básico A', '3B': '3° Básico A', '4B': '4° Básico A',
  '5B': '5° Básico A', '6B': '6° Básico A', '7B': '7° Básico A', '8B': '8° Básico A',
};

/** Orden canónico de cursos */
export const GRADE_ORDER = ['1B','2B','3B','4B','5B','6B','7B','8B'];

/** Orden canónico de asignaturas para el grid */
export const SUBJECT_ORDER = [
  'lenguaje', 'lengua_y_literatura', 'matematica', 'ciencias',
  'historia', 'educacion_fisica', 'musica', 'artes', 'tecnologia',
];

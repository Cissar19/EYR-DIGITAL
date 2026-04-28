/**
 * Tipos JSDoc para el módulo de Cobertura Curricular.
 * Usar en @type y @param para autocompletado en VS Code.
 *
 * Modelo Firestore:
 *   schools/{schoolId}/academicYears/{year}/coverage/{coverageId}
 */

/**
 * @typedef {'u1'|'u2'|'u3'|'u4'} UnitKey
 */

/**
 * @typedef {Record<UnitKey, Record<string, boolean>>} UnitTracking
 * Ej: { u1: { OA01: true, OA03: false }, u2: {}, u3: {}, u4: {} }
 */

/**
 * @typedef {'pending'|'partial'|'complete'} MigrationStatus
 */

/**
 * @typedef {Object} CoverageDoc
 * @property {string}          grade           - Código de curso, ej. "1B"
 * @property {number}          gradeNumber     - Número de grado (1-8)
 * @property {string}          subject         - Slug de asignatura, ej. "lenguaje"
 * @property {string}          subjectLabel    - Nombre legible, ej. "Lenguaje y Comunicación"
 * @property {string}          teacherId       - UID del docente en users/
 * @property {string}          teacherName     - Nombre denormalizado
 * @property {UnitTracking}    unitTracking    - Fuente de verdad de OAs por unidad
 * @property {Record<string,boolean>} [legacyOaStatus] - Estado heredado del Excel (sólo en migración)
 * @property {MigrationStatus} migrationStatus
 * @property {{ sem1: number|null, sem2: number|null }} evaluaciones
 * @property {number|null}     [excelTotalBasales] - Para auditoría vs MINEDUC
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {string}          updatedBy       - UID del usuario que editó por última vez
 */

/**
 * @typedef {Object} AcademicYearMeta
 * @property {string}  startDate  - "YYYY-MM-DD"
 * @property {string}  endDate    - "YYYY-MM-DD"
 * @property {boolean} active     - false cuando el año está cerrado (sólo lectura)
 */

/**
 * @typedef {Object} CoverageStats
 * @property {number} totalPasados
 * @property {number} totalBasales
 * @property {number} porcentaje    - 0-1
 * @property {Record<UnitKey, number>} porcentajePorUnidad
 */

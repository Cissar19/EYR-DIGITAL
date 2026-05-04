/**
 * Feriados legales de Chile – Mon-Fri únicamente (fines de semana omitidos).
 * Fuentes: Ley 2.977, Ley 19.973, Ley 20.629 y modificaciones.
 *
 * Regla de traslado: San Pedro y San Pablo (Jun 29) y Día de la Raza (Oct 12)
 * se trasladan al lunes más próximo cuando caen en día distinto al lunes.
 * El resto de feriados permanece en su fecha fija.
 */

const H = (date, name) => [date, name];

const RAW = [
  // ─── 2024 ────────────────────────────────────────────────────────────────
  H('2024-01-01', 'Año Nuevo'),
  H('2024-03-29', 'Viernes Santo'),
  // Mar 30 sábado → omitido
  H('2024-05-01', 'Día del Trabajo'),
  H('2024-05-21', 'Glorias Navales'),
  H('2024-07-01', 'San Pedro y San Pablo'),   // Jun 29 sábado → lun Jul 1
  H('2024-07-16', 'Virgen del Carmen'),
  H('2024-08-15', 'Asunción de la Virgen'),
  H('2024-09-18', 'Independencia Nacional'),
  H('2024-09-19', 'Glorias del Ejército'),
  H('2024-10-14', 'Encuentro de Dos Mundos'), // Oct 12 sábado → lun Oct 14
  H('2024-10-31', 'Día de las Iglesias Evangélicas'),
  H('2024-11-01', 'Día de Todos los Santos'),
  // Dic 8 domingo → omitido
  H('2024-12-25', 'Navidad'),

  // ─── 2025 ────────────────────────────────────────────────────────────────
  H('2025-01-01', 'Año Nuevo'),
  H('2025-04-18', 'Viernes Santo'),
  // Abr 19 sábado → omitido
  H('2025-05-01', 'Día del Trabajo'),
  H('2025-05-21', 'Glorias Navales'),
  H('2025-06-30', 'San Pedro y San Pablo'),   // Jun 29 domingo → lun Jun 30
  H('2025-07-16', 'Virgen del Carmen'),
  H('2025-08-15', 'Asunción de la Virgen'),
  H('2025-09-18', 'Independencia Nacional'),
  H('2025-09-19', 'Glorias del Ejército'),
  H('2025-10-13', 'Encuentro de Dos Mundos'), // Oct 12 domingo → lun Oct 13
  H('2025-10-31', 'Día de las Iglesias Evangélicas'),
  // Nov 1 sábado → omitido
  H('2025-12-08', 'Inmaculada Concepción'),
  H('2025-12-25', 'Navidad'),

  // ─── 2026 ────────────────────────────────────────────────────────────────
  H('2026-01-01', 'Año Nuevo'),
  H('2026-04-03', 'Viernes Santo'),
  // Abr 4 sábado → omitido
  H('2026-05-01', 'Día del Trabajo'),
  H('2026-05-21', 'Glorias Navales'),
  H('2026-06-29', 'San Pedro y San Pablo'),   // ya es lunes
  H('2026-07-16', 'Virgen del Carmen'),
  // Ago 15 sábado → omitido
  H('2026-09-18', 'Independencia Nacional'),
  // Sep 19 sábado → omitido
  H('2026-10-12', 'Encuentro de Dos Mundos'), // ya es lunes
  // Oct 31 sábado → omitido
  // Nov 1 domingo → omitido
  H('2026-12-08', 'Inmaculada Concepción'),
  H('2026-12-25', 'Navidad'),
];

/** Map fecha ISO → nombre del feriado */
export const CHILE_HOLIDAYS = Object.fromEntries(RAW);

/** Set de fechas ISO para lookup rápido */
export const CHILE_HOLIDAYS_SET = new Set(RAW.map(([d]) => d));

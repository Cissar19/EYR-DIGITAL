// ============================================
// ANALYTICS CONSTANTS — Asignaturas y Umbrales
// ============================================

export const SUBJECTS = [
  { id: 'lenguaje', name: 'Lenguaje', color: '#6366f1' },
  { id: 'matematicas', name: 'Matemáticas', color: '#f59e0b' },
  { id: 'ciencias', name: 'Ciencias', color: '#22c55e' },
  { id: 'historia', name: 'Historia', color: '#3b82f6' },
  { id: 'ingles', name: 'Inglés', color: '#8b5cf6' },
  { id: 'ed_fisica', name: 'Ed. Física', color: '#ec4899' },
  { id: 'artes', name: 'Artes', color: '#14b8a6' },
  { id: 'tecnologia', name: 'Tecnología', color: '#f97316' },
];

export const THRESHOLDS = {
  attendance: {
    excelente: 95,
    bueno: 90,
    aceptable: 85,
    // below 85 → crítico
  },
  simce: {
    excelente: 280,
    bueno: 260,
    aceptable: 240,
    // below 240 → crítico
  },
  adminDays: {
    optimo: 5,
    saludable: 3,
    preocupante: 1,
    // 0 → crítico
  },
  curriculum: {
    excelente: 90,
    bueno: 80,
    aceptable: 65,
    // below 65 → crítico
  },
};

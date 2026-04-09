/**
 * Horarios por defecto de profesores, mapeados por email.
 * Formato: { day, startTime, subject, course }
 */

// PAMELA OLIVERO - Profesora Jefe 5° (29 hrs)
const pamelaOlivero = [
    // Jefatura (todos los días)
    { day: 'Lunes', startTime: '08:00', subject: 'Jefatura', course: '5° Básico' },
    { day: 'Martes', startTime: '08:00', subject: 'Jefatura', course: '5° Básico' },
    { day: 'Miércoles', startTime: '08:00', subject: 'Jefatura', course: '5° Básico' },
    { day: 'Jueves', startTime: '08:00', subject: 'Jefatura', course: '5° Básico' },
    { day: 'Viernes', startTime: '08:00', subject: 'Jefatura', course: '5° Básico' },
    // Lunes
    { day: 'Lunes', startTime: '08:10', subject: 'C. Nat', course: '8° Básico' },
    { day: 'Lunes', startTime: '08:55', subject: 'C. Nat', course: '8° Básico' },
    { day: 'Lunes', startTime: '11:40', subject: 'C. Nat', course: '7° Básico' },
    { day: 'Lunes', startTime: '12:25', subject: 'C. Nat', course: '7° Básico' },
    { day: 'Lunes', startTime: '13:55', subject: 'T. Ciencias', course: '8° Básico' },
    { day: 'Lunes', startTime: '14:40', subject: 'T. Ciencias', course: '8° Básico' },
    // Martes
    { day: 'Martes', startTime: '09:55', subject: 'C. Nat', course: '8° Básico' },
    { day: 'Martes', startTime: '10:40', subject: 'C. Nat', course: '8° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'C. Nat', course: '4° Básico' },
    { day: 'Martes', startTime: '13:55', subject: 'T. Lenguaje', course: '5° Básico' },
    { day: 'Martes', startTime: '14:40', subject: 'T. Lenguaje', course: '5° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:10', subject: 'C. Nat', course: '5° Básico' },
    { day: 'Miércoles', startTime: '08:55', subject: 'C. Nat', course: '5° Básico' },
    { day: 'Miércoles', startTime: '11:40', subject: 'C. Nat', course: '6° Básico' },
    { day: 'Miércoles', startTime: '12:25', subject: 'C. Nat', course: '6° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'T. Ciencias', course: '7° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'T. Ciencias', course: '7° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '08:10', subject: 'Orientación', course: '5° Básico' },
    { day: 'Jueves', startTime: '09:55', subject: 'C. Nat', course: '7° Básico' },
    { day: 'Jueves', startTime: '10:40', subject: 'C. Nat', course: '7° Básico' },
    { day: 'Jueves', startTime: '11:40', subject: 'C. Nat', course: '4° Básico' },
    { day: 'Jueves', startTime: '12:25', subject: 'C. Nat', course: '4° Básico' },
    { day: 'Jueves', startTime: '13:55', subject: 'C. Nat', course: '3° Básico' },
    { day: 'Jueves', startTime: '14:40', subject: 'C. Nat', course: '3° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '08:55', subject: 'C. Nat', course: '3° Básico' },
    { day: 'Viernes', startTime: '09:55', subject: 'C. Nat', course: '5° Básico' },
    { day: 'Viernes', startTime: '10:40', subject: 'C. Nat', course: '5° Básico' },
    { day: 'Viernes', startTime: '11:40', subject: 'C. Nat', course: '6° Básico' },
    { day: 'Viernes', startTime: '12:25', subject: 'C. Nat', course: '6° Básico' },
];

// FRANCISCO PEREZ - Profesor Jefe 6° (29 hrs)
const franciscoPerez = [
    // Jefatura (todos los días)
    { day: 'Lunes', startTime: '08:00', subject: 'Jefatura', course: '6° Básico' },
    { day: 'Martes', startTime: '08:00', subject: 'Jefatura', course: '6° Básico' },
    { day: 'Miércoles', startTime: '08:00', subject: 'Jefatura', course: '6° Básico' },
    { day: 'Jueves', startTime: '08:00', subject: 'Jefatura', course: '6° Básico' },
    { day: 'Viernes', startTime: '08:00', subject: 'Jefatura', course: '6° Básico' },
    // Lunes
    { day: 'Lunes', startTime: '08:55', subject: 'Orientación', course: '6° Básico' },
    { day: 'Lunes', startTime: '09:55', subject: 'Ed. Física', course: '3° Básico' },
    { day: 'Lunes', startTime: '10:40', subject: 'Ed. Física', course: '3° Básico' },
    { day: 'Lunes', startTime: '11:40', subject: 'Ed. Física', course: '6° Básico' },
    { day: 'Lunes', startTime: '12:25', subject: 'Ed. Física', course: '6° Básico' },
    // Martes
    { day: 'Martes', startTime: '09:55', subject: 'Ed. Física', course: '1° Básico' },
    { day: 'Martes', startTime: '10:40', subject: 'Ed. Física', course: '1° Básico' },
    { day: 'Martes', startTime: '11:40', subject: 'Ed. Física', course: '7° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'Ed. Física', course: '7° Básico' },
    { day: 'Martes', startTime: '13:55', subject: 'Ed. Física', course: '4° Básico' },
    { day: 'Martes', startTime: '14:40', subject: 'Ed. Física', course: '4° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:10', subject: 'Ed. Física', course: '5° Básico' },
    { day: 'Miércoles', startTime: '08:55', subject: 'Ed. Física', course: '5° Básico' },
    { day: 'Miércoles', startTime: '09:55', subject: 'Ed. Física', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '10:40', subject: 'Ed. Física', course: 'Pre-Kinder A' },
    { day: 'Miércoles', startTime: '11:40', subject: 'Ed. Física', course: '2° Básico' },
    { day: 'Miércoles', startTime: '12:25', subject: 'Ed. Física', course: '2° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '09:55', subject: 'Ed. Física', course: '4° Básico' },
    { day: 'Jueves', startTime: '10:40', subject: 'Ed. Física', course: '4° Básico' },
    { day: 'Jueves', startTime: '11:40', subject: 'Ed. Física', course: '1° Básico' },
    { day: 'Jueves', startTime: '12:25', subject: 'Ed. Física', course: '1° Básico' },
    { day: 'Jueves', startTime: '13:55', subject: 'Ed. Física', course: '2° Básico' },
    { day: 'Jueves', startTime: '14:40', subject: 'Ed. Física', course: '2° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '09:55', subject: 'Ed. Física', course: '3° Básico' },
    { day: 'Viernes', startTime: '10:40', subject: 'Ed. Física', course: '3° Básico' },
    { day: 'Viernes', startTime: '11:40', subject: 'Ed. Física', course: '8° Básico' },
    { day: 'Viernes', startTime: '12:25', subject: 'Ed. Física', course: '8° Básico' },
];

// MAXIMILIANO BAHAMONDES - Profesor Jefe 7° (23 hrs)
const maximilianoBahamondes = [
    // Jefatura (todos los días)
    { day: 'Lunes', startTime: '08:00', subject: 'Jefatura', course: '7° Básico' },
    { day: 'Martes', startTime: '08:00', subject: 'Jefatura', course: '7° Básico' },
    { day: 'Miércoles', startTime: '08:00', subject: 'Jefatura', course: '7° Básico' },
    { day: 'Jueves', startTime: '08:00', subject: 'Jefatura', course: '7° Básico' },
    { day: 'Viernes', startTime: '08:00', subject: 'Jefatura', course: '7° Básico' },
    // Lunes
    { day: 'Lunes', startTime: '09:55', subject: 'Música/Arte', course: '8° Básico' },
    { day: 'Lunes', startTime: '10:40', subject: 'Música/Arte', course: '8° Básico' },
    { day: 'Lunes', startTime: '11:40', subject: 'Música', course: '1° Básico' },
    { day: 'Lunes', startTime: '12:25', subject: 'Música', course: '1° Básico' },
    // Martes
    { day: 'Martes', startTime: '11:40', subject: 'Música', course: '3° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'Música', course: '3° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '09:55', subject: 'Música/Arte', course: '7° Básico' },
    { day: 'Miércoles', startTime: '10:40', subject: 'Música/Arte', course: '7° Básico' },
    { day: 'Miércoles', startTime: '11:40', subject: 'Música/Arte', course: '8° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'Música', course: '5° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'Música', course: '5° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '09:55', subject: 'Música', course: '6° Básico' },
    { day: 'Jueves', startTime: '10:40', subject: 'Música', course: '6° Básico' },
    { day: 'Jueves', startTime: '11:40', subject: 'Música', course: '2° Básico' },
    { day: 'Jueves', startTime: '12:25', subject: 'Música', course: '2° Básico' },
    { day: 'Jueves', startTime: '14:40', subject: 'Música/Arte', course: '7° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '08:55', subject: 'Orientación', course: '7° Básico' },
    { day: 'Viernes', startTime: '09:55', subject: 'Música', course: '4° Básico' },
    { day: 'Viernes', startTime: '10:40', subject: 'Música', course: '4° Básico' },
];

// CONSTANZA VARGAS - Profesora Jefe 8° (30 hrs)
const constanzaVargas = [
    // Jefatura (todos los días)
    { day: 'Lunes', startTime: '08:00', subject: 'Jefatura', course: '8° Básico' },
    { day: 'Martes', startTime: '08:00', subject: 'Jefatura', course: '8° Básico' },
    { day: 'Miércoles', startTime: '08:00', subject: 'Jefatura', course: '8° Básico' },
    { day: 'Jueves', startTime: '08:00', subject: 'Jefatura', course: '8° Básico' },
    { day: 'Viernes', startTime: '08:00', subject: 'Jefatura', course: '8° Básico' },
    // Lunes
    { day: 'Lunes', startTime: '08:10', subject: 'Leng. y Lit.', course: '5° Básico' },
    { day: 'Lunes', startTime: '08:55', subject: 'Leng. y Lit.', course: '5° Básico' },
    { day: 'Lunes', startTime: '09:55', subject: 'Leng. y Lit.', course: '7° Básico' },
    { day: 'Lunes', startTime: '10:40', subject: 'Leng. y Lit.', course: '7° Básico' },
    { day: 'Lunes', startTime: '11:40', subject: 'Orientación', course: '8° Básico' },
    { day: 'Lunes', startTime: '13:55', subject: 'Taller Len', course: '7° Básico' },
    { day: 'Lunes', startTime: '14:40', subject: 'Taller Len', course: '7° Básico' },
    // Martes
    { day: 'Martes', startTime: '08:10', subject: 'Leng. y Lit.', course: '6° Básico' },
    { day: 'Martes', startTime: '08:55', subject: 'Leng. y Lit.', course: '6° Básico' },
    { day: 'Martes', startTime: '09:55', subject: 'Leng. y Lit.', course: '7° Básico' },
    { day: 'Martes', startTime: '10:40', subject: 'Leng. y Lit.', course: '7° Básico' },
    { day: 'Martes', startTime: '11:40', subject: 'Leng. y Lit.', course: '8° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'Leng. y Lit.', course: '8° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '09:55', subject: 'Leng. y Lit.', course: '8° Básico' },
    { day: 'Miércoles', startTime: '10:40', subject: 'Leng. y Lit.', course: '8° Básico' },
    { day: 'Miércoles', startTime: '11:40', subject: 'Leng. y Lit.', course: '5° Básico' },
    { day: 'Miércoles', startTime: '12:25', subject: 'Leng. y Lit.', course: '5° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '08:10', subject: 'Leng. y Lit.', course: '7° Básico' },
    { day: 'Jueves', startTime: '08:55', subject: 'Leng. y Lit.', course: '7° Básico' },
    { day: 'Jueves', startTime: '11:40', subject: 'Leng. y Lit.', course: '6° Básico' },
    { day: 'Jueves', startTime: '12:25', subject: 'Leng. y Lit.', course: '6° Básico' },
    { day: 'Jueves', startTime: '13:55', subject: 'Taller Len', course: '8° Básico' },
    { day: 'Jueves', startTime: '14:40', subject: 'Taller Len', course: '8° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '08:10', subject: 'Leng. y Lit.', course: '6° Básico' },
    { day: 'Viernes', startTime: '08:55', subject: 'Leng. y Lit.', course: '6° Básico' },
    { day: 'Viernes', startTime: '09:55', subject: 'Leng. y Lit.', course: '8° Básico' },
    { day: 'Viernes', startTime: '10:40', subject: 'Leng. y Lit.', course: '8° Básico' },
    { day: 'Viernes', startTime: '11:40', subject: 'Leng. y Lit.', course: '5° Básico' },
    { day: 'Viernes', startTime: '12:25', subject: 'Leng. y Lit.', course: '5° Básico' },
];

// BELÉN LEAL - Religión / FC (16 hrs)
const belenLeal = [
    // Martes
    { day: 'Martes', startTime: '08:10', subject: 'Religión / FC', course: '2° Básico' },
    { day: 'Martes', startTime: '08:55', subject: 'Religión / FC', course: '2° Básico' },
    { day: 'Martes', startTime: '09:55', subject: 'Religión / FC', course: '5° Básico' },
    { day: 'Martes', startTime: '10:40', subject: 'Religión / FC', course: '5° Básico' },
    { day: 'Martes', startTime: '11:40', subject: 'Religión / FC', course: '1° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'Religión / FC', course: '1° Básico' },
    { day: 'Martes', startTime: '13:55', subject: 'Religión / FC', course: '6° Básico' },
    { day: 'Martes', startTime: '14:40', subject: 'Religión / FC', course: '6° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '11:40', subject: 'Religión / FC', course: '3° Básico' },
    { day: 'Miércoles', startTime: '12:25', subject: 'Religión / FC', course: '3° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'Religión / FC', course: '8° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'Religión / FC', course: '8° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '09:55', subject: 'Religión / FC', course: '7° Básico' },
    { day: 'Viernes', startTime: '10:40', subject: 'Religión / FC', course: '7° Básico' },
    { day: 'Viernes', startTime: '11:40', subject: 'Religión / FC', course: '4° Básico' },
    { day: 'Viernes', startTime: '12:25', subject: 'Religión / FC', course: '4° Básico' },
];

// EDUARDO BAEZA - Matemática + T. Matemática (20 hrs)
const eduardoBaeza = [
    // Lunes
    { day: 'Lunes', startTime: '08:10', subject: 'Matemática', course: '7° Básico' },
    { day: 'Lunes', startTime: '08:55', subject: 'Matemática', course: '7° Básico' },
    { day: 'Lunes', startTime: '13:55', subject: 'T. Matemática', course: '7° Básico' },
    { day: 'Lunes', startTime: '14:40', subject: 'T. Matemática', course: '7° Básico' },
    // Martes
    { day: 'Martes', startTime: '08:10', subject: 'Matemática', course: '8° Básico' },
    { day: 'Martes', startTime: '08:55', subject: 'Matemática', course: '8° Básico' },
    { day: 'Martes', startTime: '13:55', subject: 'T. Matemática', course: '5° Básico' },
    { day: 'Martes', startTime: '14:40', subject: 'T. Matemática', course: '5° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:10', subject: 'Matemática', course: '7° Básico' },
    { day: 'Miércoles', startTime: '08:55', subject: 'Matemática', course: '7° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'T. Matemática', course: '6° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'T. Matemática', course: '6° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '08:10', subject: 'Matemática', course: '8° Básico' },
    { day: 'Jueves', startTime: '08:55', subject: 'Matemática', course: '8° Básico' },
    { day: 'Jueves', startTime: '13:55', subject: 'T. Matemática', course: '8° Básico' },
    { day: 'Jueves', startTime: '14:40', subject: 'T. Matemática', course: '8° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '08:10', subject: 'Matemática', course: '8° Básico' },
    { day: 'Viernes', startTime: '08:55', subject: 'Matemática', course: '8° Básico' },
    { day: 'Viernes', startTime: '11:40', subject: 'Matemática', course: '7° Básico' },
    { day: 'Viernes', startTime: '12:25', subject: 'Matemática', course: '7° Básico' },
];

// VIRNA CANIUPIL - Inglés (22 hrs)
const virnaCaniupil = [
    // Lunes
    { day: 'Lunes', startTime: '09:55', subject: 'Inglés', course: '5° Básico' },
    { day: 'Lunes', startTime: '10:40', subject: 'Inglés', course: '5° Básico' },
    { day: 'Lunes', startTime: '12:25', subject: 'Inglés', course: '8° Básico' },
    { day: 'Lunes', startTime: '13:55', subject: 'Inglés', course: '4° Básico' },
    { day: 'Lunes', startTime: '14:40', subject: 'Inglés', course: '4° Básico' },
    // Martes
    { day: 'Martes', startTime: '09:55', subject: 'Inglés', course: '6° Básico' },
    { day: 'Martes', startTime: '10:40', subject: 'Inglés', course: '6° Básico' },
    { day: 'Martes', startTime: '11:40', subject: 'Inglés', course: '5° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'Inglés', course: '5° Básico' },
    { day: 'Martes', startTime: '13:55', subject: 'Inglés', course: '3° Básico' },
    { day: 'Martes', startTime: '14:40', subject: 'Inglés', course: '3° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '09:55', subject: 'Inglés', course: '6° Básico' },
    { day: 'Miércoles', startTime: '10:40', subject: 'Inglés', course: '6° Básico' },
    { day: 'Miércoles', startTime: '11:40', subject: 'Inglés', course: '7° Básico' },
    { day: 'Miércoles', startTime: '12:25', subject: 'Inglés', course: '7° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'Inglés', course: '1° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'Inglés', course: '1° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '09:55', subject: 'Inglés', course: '2° Básico' },
    { day: 'Jueves', startTime: '10:40', subject: 'Inglés', course: '2° Básico' },
    { day: 'Jueves', startTime: '11:40', subject: 'Inglés', course: '8° Básico' },
    { day: 'Jueves', startTime: '12:25', subject: 'Inglés', course: '8° Básico' },
    { day: 'Jueves', startTime: '13:55', subject: 'Inglés', course: '7° Básico' },
];

// FILIPPA LEPORATI - Artes + Música/Arte + Tecnología (19 hrs)
const filippaLeporati = [
    // Lunes
    { day: 'Lunes', startTime: '09:55', subject: 'Música/Arte', course: '8° Básico' },
    { day: 'Lunes', startTime: '10:40', subject: 'Música/Arte', course: '8° Básico' },
    { day: 'Lunes', startTime: '13:55', subject: 'Artes', course: '6° Básico' },
    { day: 'Lunes', startTime: '14:40', subject: 'Artes', course: '6° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:10', subject: 'Artes', course: '4° Básico' },
    { day: 'Miércoles', startTime: '08:55', subject: 'Artes', course: '4° Básico' },
    { day: 'Miércoles', startTime: '09:55', subject: 'Música/Arte', course: '7° Básico' },
    { day: 'Miércoles', startTime: '10:40', subject: 'Música/Arte', course: '7° Básico' },
    { day: 'Miércoles', startTime: '11:40', subject: 'Música/Arte', course: '8° Básico' },
    { day: 'Miércoles', startTime: '12:25', subject: 'Tecnología', course: '8° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'Artes', course: '2° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'Artes', course: '2° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '08:10', subject: 'Artes', course: '3° Básico' },
    { day: 'Jueves', startTime: '08:55', subject: 'Artes', course: '3° Básico' },
    { day: 'Jueves', startTime: '09:55', subject: 'Artes', course: '1° Básico' },
    { day: 'Jueves', startTime: '10:40', subject: 'Artes', course: '1° Básico' },
    { day: 'Jueves', startTime: '11:40', subject: 'Artes', course: '5° Básico' },
    { day: 'Jueves', startTime: '12:25', subject: 'Artes', course: '5° Básico' },
    { day: 'Jueves', startTime: '14:40', subject: 'Música/Arte', course: '7° Básico' },
];

// MARÍA EUGENIA FUENTES - Religión / FC + Tecnología (17 hrs)
const mariaEugeniaFuentes = [
    // Martes
    { day: 'Martes', startTime: '08:10', subject: 'Religión / FC', course: '2° Básico' },
    { day: 'Martes', startTime: '08:55', subject: 'Religión / FC', course: '2° Básico' },
    { day: 'Martes', startTime: '09:55', subject: 'Religión / FC', course: '5° Básico' },
    { day: 'Martes', startTime: '10:40', subject: 'Religión / FC', course: '5° Básico' },
    { day: 'Martes', startTime: '11:40', subject: 'Religión / FC', course: '1° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'Religión / FC', course: '1° Básico' },
    { day: 'Martes', startTime: '13:55', subject: 'Religión / FC', course: '6° Básico' },
    { day: 'Martes', startTime: '14:40', subject: 'Religión / FC', course: '6° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '11:40', subject: 'Religión / FC', course: '3° Básico' },
    { day: 'Miércoles', startTime: '12:25', subject: 'Religión / FC', course: '3° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'Religión / FC', course: '8° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'Religión / FC', course: '8° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '08:10', subject: 'Tecnología', course: '7° Básico' },
    { day: 'Viernes', startTime: '09:55', subject: 'Religión / FC', course: '7° Básico' },
    { day: 'Viernes', startTime: '10:40', subject: 'Religión / FC', course: '7° Básico' },
    { day: 'Viernes', startTime: '11:40', subject: 'Religión / FC', course: '4° Básico' },
    { day: 'Viernes', startTime: '12:25', subject: 'Religión / FC', course: '4° Básico' },
];

// ÁLVARO JARA - Historia + Formación Ciudadana (33 hrs)
const alvaroJara = [
    // Lunes
    { day: 'Lunes', startTime: '08:10', subject: 'H. G. y Cs. S.', course: '3° Básico' },
    { day: 'Lunes', startTime: '08:55', subject: 'H. G. y Cs. S.', course: '3° Básico' },
    { day: 'Lunes', startTime: '11:40', subject: 'H. G. y Cs. S.', course: '4° Básico' },
    { day: 'Lunes', startTime: '12:25', subject: 'H. G. y Cs. S.', course: '4° Básico' },
    { day: 'Lunes', startTime: '13:55', subject: 'H. G. y Cs. S.', course: '5° Básico' },
    { day: 'Lunes', startTime: '14:40', subject: 'H. G. y Cs. S.', course: '5° Básico' },
    // Martes
    { day: 'Martes', startTime: '08:10', subject: 'H. G. y Cs. S.', course: '7° Básico' },
    { day: 'Martes', startTime: '08:55', subject: 'H. G. y Cs. S.', course: '7° Básico' },
    { day: 'Martes', startTime: '09:55', subject: 'For. Ciud.', course: '5° Básico' },
    { day: 'Martes', startTime: '10:40', subject: 'For. Ciud.', course: '5° Básico' },
    { day: 'Martes', startTime: '11:40', subject: 'H. G. y Cs. S.', course: '6° Básico' },
    { day: 'Martes', startTime: '12:25', subject: 'H. G. y Cs. S.', course: '6° Básico' },
    { day: 'Martes', startTime: '13:55', subject: 'For. Ciud.', course: '6° Básico' },
    { day: 'Martes', startTime: '14:40', subject: 'For. Ciud.', course: '6° Básico' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:10', subject: 'H. G. y Cs. S.', course: '8° Básico' },
    { day: 'Miércoles', startTime: '08:55', subject: 'H. G. y Cs. S.', course: '8° Básico' },
    { day: 'Miércoles', startTime: '09:55', subject: 'H. G. y Cs. S.', course: '5° Básico' },
    { day: 'Miércoles', startTime: '10:40', subject: 'H. G. y Cs. S.', course: '5° Básico' },
    { day: 'Miércoles', startTime: '11:40', subject: 'H. G. y Cs. S.', course: '4° Básico' },
    { day: 'Miércoles', startTime: '13:55', subject: 'For. Ciud.', course: '8° Básico' },
    { day: 'Miércoles', startTime: '14:40', subject: 'For. Ciud.', course: '8° Básico' },
    // Jueves
    { day: 'Jueves', startTime: '08:10', subject: 'H. G. y Cs. S.', course: '6° Básico' },
    { day: 'Jueves', startTime: '08:55', subject: 'H. G. y Cs. S.', course: '6° Básico' },
    { day: 'Jueves', startTime: '09:55', subject: 'H. G. y Cs. S.', course: '8° Básico' },
    { day: 'Jueves', startTime: '10:40', subject: 'H. G. y Cs. S.', course: '8° Básico' },
    { day: 'Jueves', startTime: '11:40', subject: 'H. G. y Cs. S.', course: '7° Básico' },
    { day: 'Jueves', startTime: '12:25', subject: 'H. G. y Cs. S.', course: '7° Básico' },
    // Viernes
    { day: 'Viernes', startTime: '08:10', subject: 'H. G. y Cs. S.', course: '3° Básico' },
    { day: 'Viernes', startTime: '09:55', subject: 'For. Ciud.', course: '7° Básico' },
    { day: 'Viernes', startTime: '10:40', subject: 'For. Ciud.', course: '7° Básico' },
    { day: 'Viernes', startTime: '11:40', subject: 'For. Ciud.', course: '4° Básico' },
    { day: 'Viernes', startTime: '12:25', subject: 'For. Ciud.', course: '4° Básico' },
];

// MELANIE CONTRERAS - Profesora Pre-Kinder A
const melanieContreras = [
    // Lunes
    { day: 'Lunes', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Lunes', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder A' },
    { day: 'Lunes', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder A' },
    { day: 'Lunes', startTime: '09:30', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Lunes', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder A' },
    { day: 'Lunes', startTime: '10:30', subject: 'Comprensión Sociocultural', course: 'Pre-Kinder A' },
    { day: 'Lunes', startTime: '11:00', subject: 'Entorno Natural', course: 'Pre-Kinder A' },
    // Martes
    { day: 'Martes', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Martes', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder A' },
    { day: 'Martes', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder A' },
    { day: 'Martes', startTime: '09:30', subject: 'Pensamiento Matemático', course: 'Pre-Kinder A' },
    { day: 'Martes', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder A' },
    { day: 'Martes', startTime: '10:30', subject: 'Lenguaje Artístico', course: 'Pre-Kinder A' },
    { day: 'Martes', startTime: '11:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Miércoles', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder A' },
    { day: 'Miércoles', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder A' },
    { day: 'Miércoles', startTime: '09:30', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Miércoles', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder A' },
    { day: 'Miércoles', startTime: '10:30', subject: 'Corporalidad y Movimiento', course: 'Pre-Kinder A' },
    { day: 'Miércoles', startTime: '11:00', subject: 'Pensamiento Matemático', course: 'Pre-Kinder A' },
    // Jueves
    { day: 'Jueves', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Jueves', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder A' },
    { day: 'Jueves', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder A' },
    { day: 'Jueves', startTime: '09:30', subject: 'Pensamiento Matemático', course: 'Pre-Kinder A' },
    { day: 'Jueves', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder A' },
    { day: 'Jueves', startTime: '10:30', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Jueves', startTime: '11:00', subject: 'Taller Entorno Natural', course: 'Pre-Kinder A' },
    // Viernes
    { day: 'Viernes', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder A' },
    { day: 'Viernes', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder A' },
    { day: 'Viernes', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder A' },
    { day: 'Viernes', startTime: '09:30', subject: 'Lenguaje Artístico', course: 'Pre-Kinder A' },
    { day: 'Viernes', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder A' },
    { day: 'Viernes', startTime: '10:30', subject: 'Comprensión Sociocultural', course: 'Pre-Kinder A' },
    { day: 'Viernes', startTime: '11:00', subject: 'Lenguaje Verbal (emociones)', course: 'Pre-Kinder A' },
];

// MARÍA JOSÉ SILVA - Profesora Pre-Kinder B
const mariaJoseSilva = [
    // Lunes
    { day: 'Lunes', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Lunes', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder B' },
    { day: 'Lunes', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder B' },
    { day: 'Lunes', startTime: '09:30', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Lunes', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder B' },
    { day: 'Lunes', startTime: '10:30', subject: 'Comprensión Sociocultural', course: 'Pre-Kinder B' },
    { day: 'Lunes', startTime: '11:00', subject: 'Entorno Natural', course: 'Pre-Kinder B' },
    // Martes
    { day: 'Martes', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Martes', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder B' },
    { day: 'Martes', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder B' },
    { day: 'Martes', startTime: '09:30', subject: 'Pensamiento Matemático', course: 'Pre-Kinder B' },
    { day: 'Martes', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder B' },
    { day: 'Martes', startTime: '10:30', subject: 'Lenguaje Artístico', course: 'Pre-Kinder B' },
    { day: 'Martes', startTime: '11:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Miércoles', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder B' },
    { day: 'Miércoles', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder B' },
    { day: 'Miércoles', startTime: '09:30', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Miércoles', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder B' },
    { day: 'Miércoles', startTime: '10:30', subject: 'Corporalidad y Movimiento', course: 'Pre-Kinder B' },
    { day: 'Miércoles', startTime: '11:00', subject: 'Pensamiento Matemático', course: 'Pre-Kinder B' },
    // Jueves
    { day: 'Jueves', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Jueves', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder B' },
    { day: 'Jueves', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder B' },
    { day: 'Jueves', startTime: '09:30', subject: 'Pensamiento Matemático', course: 'Pre-Kinder B' },
    { day: 'Jueves', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder B' },
    { day: 'Jueves', startTime: '10:30', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Jueves', startTime: '11:00', subject: 'Taller Entorno Natural', course: 'Pre-Kinder B' },
    // Viernes
    { day: 'Viernes', startTime: '08:00', subject: 'Lenguaje Verbal', course: 'Pre-Kinder B' },
    { day: 'Viernes', startTime: '08:30', subject: 'Hábitos Higiénicos', course: 'Pre-Kinder B' },
    { day: 'Viernes', startTime: '08:45', subject: 'Colación', course: 'Pre-Kinder B' },
    { day: 'Viernes', startTime: '09:30', subject: 'Lenguaje Artístico', course: 'Pre-Kinder B' },
    { day: 'Viernes', startTime: '10:00', subject: 'Patio', course: 'Pre-Kinder B' },
    { day: 'Viernes', startTime: '10:30', subject: 'Comprensión Sociocultural', course: 'Pre-Kinder B' },
    { day: 'Viernes', startTime: '11:00', subject: 'Lenguaje Verbal (emociones)', course: 'Pre-Kinder B' },
];

// CLAUDIA PINCHEIRA - Profesora Kinder B (jornada tarde)
const claudiaPincheira = [
    // Lunes
    { day: 'Lunes', startTime: '13:00', subject: 'Lenguaje Verbal', course: 'Kinder B' },
    { day: 'Lunes', startTime: '13:30', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Lunes', startTime: '13:45', subject: 'Lenguaje Verbal', course: 'Kinder B' },
    { day: 'Lunes', startTime: '14:45', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Lunes', startTime: '15:00', subject: 'Colación - Patio', course: 'Kinder B' },
    { day: 'Lunes', startTime: '16:00', subject: 'Taller Entorno Natural', course: 'Kinder B' },
    // Martes
    { day: 'Martes', startTime: '13:00', subject: 'Pensamiento Matemático', course: 'Kinder B' },
    { day: 'Martes', startTime: '13:30', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Martes', startTime: '13:45', subject: 'Pensamiento Matemático', course: 'Kinder B' },
    { day: 'Martes', startTime: '14:45', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Martes', startTime: '15:00', subject: 'Colación - Patio', course: 'Kinder B' },
    { day: 'Martes', startTime: '16:00', subject: 'Taller de Lenguaje/Artístico', course: 'Kinder B' },
    // Miércoles
    { day: 'Miércoles', startTime: '13:00', subject: 'Lenguaje Verbal', course: 'Kinder B' },
    { day: 'Miércoles', startTime: '13:30', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Miércoles', startTime: '13:45', subject: 'Lenguaje Verbal', course: 'Kinder B' },
    { day: 'Miércoles', startTime: '14:45', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Miércoles', startTime: '15:00', subject: 'Colación - Patio', course: 'Kinder B' },
    { day: 'Miércoles', startTime: '16:00', subject: 'Taller de Lenguaje Verbal', course: 'Kinder B' },
    // Jueves
    { day: 'Jueves', startTime: '13:00', subject: 'Pensamiento Matemático', course: 'Kinder B' },
    { day: 'Jueves', startTime: '13:30', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Jueves', startTime: '13:45', subject: 'Taller Corporalidad y Movimiento', course: 'Kinder B' },
    { day: 'Jueves', startTime: '14:45', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Jueves', startTime: '15:00', subject: 'Colación - Patio', course: 'Kinder B' },
    { day: 'Jueves', startTime: '16:00', subject: 'Taller Corporalidad y Movimiento Ed. Física', course: 'Kinder B' },
    // Viernes
    { day: 'Viernes', startTime: '13:00', subject: 'Lenguaje Verbal', course: 'Kinder B' },
    { day: 'Viernes', startTime: '13:30', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Viernes', startTime: '13:45', subject: 'Lenguaje Verbal', course: 'Kinder B' },
    { day: 'Viernes', startTime: '14:45', subject: 'Hábitos Higiénicos', course: 'Kinder B' },
    { day: 'Viernes', startTime: '15:00', subject: 'Colación - Patio', course: 'Kinder B' },
    { day: 'Viernes', startTime: '16:00', subject: 'Taller de Lenguaje Artístico', course: 'Kinder B' },
];

// CORINA CAMILO - Profesora Kinder A (jornada mañana)
const corinaCamilo = [
    // Lunes
    { day: 'Lunes', startTime: '08:00', subject: 'Convivencia y Ciudadanía', course: 'Kinder A' },
    { day: 'Lunes', startTime: '08:30', subject: 'Lenguaje Verbal', course: 'Kinder A' },
    { day: 'Lunes', startTime: '09:00', subject: 'Lenguaje Artístico', course: 'Kinder A' },
    { day: 'Lunes', startTime: '09:30', subject: 'Hábitos - Colación', course: 'Kinder A' },
    { day: 'Lunes', startTime: '10:00', subject: 'Patio', course: 'Kinder A' },
    { day: 'Lunes', startTime: '10:30', subject: 'Pensamiento Matemático', course: 'Kinder A' },
    { day: 'Lunes', startTime: '11:00', subject: 'Entorno Natural', course: 'Kinder A' },
    { day: 'Lunes', startTime: '11:30', subject: 'Comprensión Sociocultural', course: 'Kinder A' },
    // Martes
    { day: 'Martes', startTime: '08:00', subject: 'Convivencia y Ciudadanía', course: 'Kinder A' },
    { day: 'Martes', startTime: '08:30', subject: 'Lenguaje Verbal', course: 'Kinder A' },
    { day: 'Martes', startTime: '09:00', subject: 'Lenguaje Artístico', course: 'Kinder A' },
    { day: 'Martes', startTime: '09:30', subject: 'Hábitos - Colación', course: 'Kinder A' },
    { day: 'Martes', startTime: '10:00', subject: 'Patio', course: 'Kinder A' },
    { day: 'Martes', startTime: '10:30', subject: 'Pensamiento Matemático', course: 'Kinder A' },
    { day: 'Martes', startTime: '11:00', subject: 'Entorno Natural', course: 'Kinder A' },
    { day: 'Martes', startTime: '11:30', subject: 'Comprensión Sociocultural', course: 'Kinder A' },
    // Miércoles
    { day: 'Miércoles', startTime: '08:00', subject: 'Convivencia y Ciudadanía', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '08:30', subject: 'Lenguaje Verbal', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '09:00', subject: 'Lenguaje Artístico', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '09:30', subject: 'Hábitos - Colación', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '10:00', subject: 'Patio / Ed. Física', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '10:30', subject: 'Pensamiento Matemático', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '11:00', subject: 'Entorno Natural', course: 'Kinder A' },
    { day: 'Miércoles', startTime: '11:30', subject: 'Comprensión Sociocultural', course: 'Kinder A' },
    // Jueves
    { day: 'Jueves', startTime: '08:00', subject: 'Convivencia y Ciudadanía', course: 'Kinder A' },
    { day: 'Jueves', startTime: '08:30', subject: 'Lenguaje Verbal', course: 'Kinder A' },
    { day: 'Jueves', startTime: '09:00', subject: 'Lenguaje Artístico', course: 'Kinder A' },
    { day: 'Jueves', startTime: '09:30', subject: 'Hábitos - Colación', course: 'Kinder A' },
    { day: 'Jueves', startTime: '10:00', subject: 'Patio', course: 'Kinder A' },
    { day: 'Jueves', startTime: '10:30', subject: 'Pensamiento Matemático', course: 'Kinder A' },
    { day: 'Jueves', startTime: '11:00', subject: 'Entorno Natural', course: 'Kinder A' },
    { day: 'Jueves', startTime: '11:30', subject: 'Comprensión Sociocultural', course: 'Kinder A' },
    // Viernes
    { day: 'Viernes', startTime: '08:00', subject: 'Convivencia y Ciudadanía', course: 'Kinder A' },
    { day: 'Viernes', startTime: '08:30', subject: 'Lenguaje Verbal', course: 'Kinder A' },
    { day: 'Viernes', startTime: '09:00', subject: 'Lenguaje Artístico', course: 'Kinder A' },
    { day: 'Viernes', startTime: '09:30', subject: 'Hábitos - Colación', course: 'Kinder A' },
    { day: 'Viernes', startTime: '10:00', subject: 'Patio', course: 'Kinder A' },
    { day: 'Viernes', startTime: '10:30', subject: 'Pensamiento Matemático', course: 'Kinder A' },
    { day: 'Viernes', startTime: '11:00', subject: 'Entorno Natural', course: 'Kinder A' },
    { day: 'Viernes', startTime: '11:30', subject: 'Comprensión Sociocultural', course: 'Kinder A' },
];

/**
 * Mapeo email → horario por defecto
 */
export const DEFAULT_SCHEDULES = {
    'poliverof@eduhuechuraba.cl': pamelaOlivero,
    'fperezd@eduhuechuraba.cl': franciscoPerez,
    'mbahamondes@eduhuechuraba.cl': maximilianoBahamondes,
    'evargasr@eduhuechuraba.cl': constanzaVargas,
    'blealm@eduhuechuraba.cl': belenLeal,
    'ebaezag@eduhuechuraba.cl': eduardoBaeza,
    'vcaniupilo@eduhuechuraba.cl': virnaCaniupil,
    'fleporati@eduhuechuraba.cl': filippaLeporati,
    'mfuentesa@eduhuechuraba.cl': mariaEugeniaFuentes,
    'ajarab@eduhuechuraba.cl': alvaroJara,
    'mcontrerasd@eduhuechuraba.cl': melanieContreras,
    'msilvaa@eduhuechuraba.cl': mariaJoseSilva,
    'cpincheirag@eduhuechuraba.cl': claudiaPincheira,
    'ccamilot@eduhuechuraba.cl': corinaCamilo,
};

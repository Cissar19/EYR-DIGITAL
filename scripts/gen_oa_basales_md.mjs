/**
 * gen_oa_basales_md.mjs
 * ─────────────────────
 * Genera docs/OA-BASALES-DESCRIPCIONES.md cruzando el listado de OAs basales
 * con las descripciones del MINEDUC en src/data/objetivosAprendizaje.js
 *
 * Uso:
 *   node scripts/gen_oa_basales_md.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Importar datos desde la fuente
const { OA_DATA } = await import(join(root, 'src/data/objetivosAprendizaje.js'));

// ─────────────────────────────────────────────
//  Definición de OAs basales por nivel/asignatura
//  Fuente: docs/OA_BASALES.md
// ─────────────────────────────────────────────
const BASALES = {
    '1° Básico': {
        '01': { asig: 'Lenguaje y Comunicación', code: 'LE', numeros: [1,3,4,5,8,9,10,11,13,18,21,23,25] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [3,4,6,8,9,11,13,14,18,19,20] },
        '03': { asig: 'Ciencias Naturales', code: 'CN', numeros: [1,5,6,8,9,11] },
        '04': { asig: 'Historia, Geografía y Cs. Sociales', code: 'HI', numeros: [2,4,6,7,9,10,12,14,15] },
        '05': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,5,6,7,9,11] },
        '06': { asig: 'Música', code: 'MU', numeros: [1,4,7] },
        '07': { asig: 'Artes Visuales', code: 'AV', numeros: [1,4,5] },
        '08': { asig: 'Tecnología', code: 'TE', numeros: [1,3,6] },
    },
    '2° Básico': {
        '01': { asig: 'Lenguaje y Comunicación', code: 'LE', numeros: [1,2,5,6,7,8,10,12,16,17,23,25,27,29] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [2,3,5,7,9,11,12,13,15,16,19,20,22] },
        '03': { asig: 'Ciencias Naturales', code: 'CN', numeros: [3,5,7,8,9,11,12,14] },
        '04': { asig: 'Historia, Geografía y Cs. Sociales', code: 'HI', numeros: [1,2,3,4,7,8,14,15,16] },
        '05': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,5,6,7,9,11] },
        '06': { asig: 'Música', code: 'MU', numeros: [1,4,7] },
        '07': { asig: 'Artes Visuales', code: 'AV', numeros: [1,4,5] },
        '08': { asig: 'Tecnología', code: 'TE', numeros: [1,3,5,6,7] },
    },
    '3° Básico': {
        '01': { asig: 'Lenguaje y Comunicación', code: 'LE', numeros: [1,4,5,6,7,9,12,17,18,24,26,28,30] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [2,3,5,6,8,9,10,11,12,15,21,22,25] },
        '03': { asig: 'Ciencias Naturales', code: 'CN', numeros: [2,4,5,6,9,10,11,12] },
        '04': { asig: 'Historia, Geografía y Cs. Sociales', code: 'HI', numeros: [3,4,5,7,8,11,14,15,16] },
        '05': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,5,6,7,9,11] },
        '06': { asig: 'Música', code: 'MU', numeros: [1,4,7] },
        '07': { asig: 'Artes Visuales', code: 'AV', numeros: [1,4,5] },
        '08': { asig: 'Tecnología', code: 'TE', numeros: [3,4,5,6,7] },
    },
    '4° Básico': {
        '01': { asig: 'Lenguaje y Comunicación', code: 'LE', numeros: [1,4,5,6,7,11,16,17,23,25,27,29] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [1,2,3,5,6,7,8,9,13,14,17,18,19,22,23,24,25,27] },
        '03': { asig: 'Ciencias Naturales', code: 'CN', numeros: [1,2,3,6,7,9,10,12,15,18,19] },
        '04': { asig: 'Historia, Geografía y Cs. Sociales', code: 'HI', numeros: [4,5,8,9,10,11,12,17] },
        '05': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,5,6,7,9,11] },
        '06': { asig: 'Música', code: 'MU', numeros: [2,4,7] },
        '07': { asig: 'Artes Visuales', code: 'AV', numeros: [1,4,5,6,7] },
        '08': { asig: 'Tecnología', code: 'TE', numeros: [3,4,5] },
    },
    '5° Básico': {
        '01': { asig: 'Lenguaje y Comunicación', code: 'LE', numeros: [1,2,3,4,5,6,7,10,11,12,13,14,15,17,18,24,26,28] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [1,3,4,6,7,9,10,12,13,14,17,18,19,21,22,23,24] },
        '03': { asig: 'Ciencias Naturales / Historia', code: 'CN', numeros: [1,5,6,7,9,11,14,22,26] },
        '04': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,5,6,7,9,11] },
        '05': { asig: 'Música', code: 'MU', numeros: [2,4,7] },
        '06': { asig: 'Artes Visuales', code: 'AV', numeros: [1,4,5] },
        '07': { asig: 'Tecnología', code: 'TE', numeros: [3,4,5,6,7] },
        '08': { asig: 'Inglés', code: 'IN', numeros: [1,2,5,8,9,10,12,14,15] },
    },
    '6° Básico': {
        '01': { asig: 'Lenguaje y Comunicación', code: 'LE', numeros: [1,2,3,4,5,6,7,8,9,11,13,15,17,18,23,24,27,29] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [1,2,3,4,5,6,7,8,11,13,15,18,23,24] },
        '03': { asig: 'Ciencias Naturales / Historia', code: 'CN', numeros: [1,2,3,4,5,6,7,8,9,11,12,15,16,17] },
        '04': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,5,6,7,9] },
        '05': { asig: 'Artes Visuales', code: 'AV', numeros: [1,4,5] },
        '06': { asig: 'Tecnología', code: 'TE', numeros: [2,4,6] },
        '07': { asig: 'Inglés', code: 'IN', numeros: [1,2,5,8,9,10,12,14,15] },
    },
    '7° Básico': {
        '01': { asig: 'Lenguaje y Literatura', code: 'LE', numeros: [2,3,6,7,9,12,16,19,21,22,24,25] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [1,4,7,8,9,12,14,15,17,18,20] },
        '03': { asig: 'Ciencias Naturales', code: 'CN', numeros: [1,3,4,6,8,11,12,14,16,18,24] },
        '04': { asig: 'Historia, Geografía y Cs. Sociales', code: 'HI', numeros: [1,2,3,5,7,9,12,13,14,19,22] },
        '05': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,3,4,5] },
        '06': { asig: 'Artes Visuales', code: 'AV', numeros: [1,3,7] },
        '07': { asig: 'Tecnología', code: 'TE', numeros: [1,2,4,6] },
        '08': { asig: 'Inglés', code: 'IN', numeros: [1,2,7,8,9,12,13,14,16] },
    },
    '8° Básico': {
        '01': { asig: 'Lenguaje y Literatura', code: 'LE', numeros: [2,3,4,5,7,8,9,10,11,12,13,14,16,18,20,21,22,25,26] },
        '02': { asig: 'Matemática', code: 'MA', numeros: [1,2,3,4,7,8,10,12,15,16,18,22] },
        '03': { asig: 'Ciencias Naturales', code: 'CN', numeros: [2,4,5,7,10,11,12,14,15,16] },
        '04': { asig: 'Historia, Geografía y Cs. Sociales', code: 'HI', numeros: [2,4,6,9,12,14,16,18,20,21] },
        '05': { asig: 'Educación Física y Salud', code: 'EF', numeros: [1,3,4,5] },
        '06': { asig: 'Música', code: 'MU', numeros: [1,3,7] },
        '07': { asig: 'Artes Visuales', code: 'AV', numeros: [1,2,4,6] },
        '08': { asig: 'Tecnología', code: 'TE', numeros: [2,4,6] },
        '09': { asig: 'Inglés', code: 'IN', numeros: [1,2,7,8,9,12,13,14,16] },
    },
};

// ─────────────────────────────────────────────
//  Nivel → código numérico para clave en OA_DATA
// ─────────────────────────────────────────────
const NIVEL_CODE = {
    '1° Básico': '01',
    '2° Básico': '02',
    '3° Básico': '03',
    '4° Básico': '04',
    '5° Básico': '05',
    '6° Básico': '06',
    '7° Básico': '07',
    '8° Básico': '08',
};

// ─────────────────────────────────────────────
//  Generar markdown
// ─────────────────────────────────────────────
function oaNumToCode(n) {
    return `OA${String(n).padStart(2, '0')}`;
}

let md = `# OAs Basales con Descripciones — 1° a 8° Básico\n\n`;
md += `> Fuente: Bases Curriculares MINEDUC. Solo se listan los OAs definidos como basales para EYR Digital.\n\n`;

let totalOAs = 0;

for (const [nivel, asignaturas] of Object.entries(BASALES)) {
    md += `---\n\n## ${nivel}\n\n`;
    const nivelCode = NIVEL_CODE[nivel];

    for (const [, { asig, code, numeros }] of Object.entries(asignaturas)) {
        const dataKey = `${code}${nivelCode}`;
        const oaList = OA_DATA[dataKey] || [];

        // Construir mapa OA code → descripcion
        const oaMap = {};
        for (const oa of oaList) {
            // code es como "MA01-OA03" → extraer "OA03"
            const oaCode = oa.code.split('-')[1]; // "OA03"
            oaMap[oaCode] = oa;
        }

        md += `### ${asig}\n\n`;
        md += `| OA | Eje | Descripción |\n`;
        md += `|----|-----|-------------|\n`;

        for (const num of numeros) {
            const oaCode = oaNumToCode(num); // "OA03"
            const entry = oaMap[oaCode];
            if (entry) {
                md += `| **${oaCode}** | ${entry.eje} | ${entry.description} |\n`;
                totalOAs++;
            } else {
                md += `| **${oaCode}** | — | *(sin descripción en la base de datos)* |\n`;
                console.warn(`  ⚠ Sin datos: ${dataKey}-${oaCode}`);
            }
        }
        md += `\n`;
    }
}

md += `---\n\n*Total OAs basales: ${totalOAs}*\n`;

// ─────────────────────────────────────────────
//  Escribir archivo
// ─────────────────────────────────────────────
const outPath = join(root, 'docs/OA-BASALES-DESCRIPCIONES.md');
writeFileSync(outPath, md, 'utf-8');
console.log(`\n✓ Generado: docs/OA-BASALES-DESCRIPCIONES.md (${totalOAs} OAs basales)\n`);

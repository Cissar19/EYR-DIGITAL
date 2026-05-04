/**
 * set_profesores_jefe.mjs
 * ───────────────────────
 * Asigna isHeadTeacher + headTeacherOf a los docentes jefe de cada curso.
 *
 * Uso:
 *   node scripts/set_profesores_jefe.mjs
 *
 * Requisitos:
 *   - scripts/serviceAccountKey.json
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE  = join(__dirname, 'serviceAccountKey.json');

if (!existsSync(KEY_FILE)) {
    console.error('❌  No se encontró serviceAccountKey.json en scripts/');
    process.exit(1);
}

initializeApp({ credential: cert(KEY_FILE) });
const db = getFirestore();

// ── Profesores jefe confirmados ───────────────────────────────────────────────
// uid: de Firestore (colección users)
const ASIGNACIONES = [
    { uid: 'SATr2b8uxmZfE67HX9BjSR2xpmy1', name: 'Marisol Camila Molina Vera',         curso: '1° Básico' },
    { uid: 'X1uxyN5XQTYUjZ1Lig9TstPBVHF2', name: 'Juan Ricardo Figueroa Huinca',        curso: '2° Básico' },
    { uid: '9UNUWVGqhsO3awEO2zQ0JzIdGPT2', name: 'Leslye Nathaly Valencia Ramos',       curso: '3° Básico' },
    { uid: 'NLw24ms7Q4R3VQRB1guGOwLNR8s2', name: 'Manuel Alejandro Astudillo Figueroa', curso: '4° Básico' },
    { uid: 'jPUrM6q64jQUoIVzvKQksCmNJP13', name: 'Pamela Andrea Olivero Figueroa',      curso: '5° Básico' },
    { uid: 'H5qRWxtKB0Sr2trVIQpAnJA4HGX2', name: 'Francisco Javier Pérez Delgado',      curso: '6° Básico' },
    // 7° Básico: Maximiliano Bahamondes — no encontrado en backup, agregar manualmente
    { uid: 'APSPBmTFrUZFqv3hUvCiet2EKTG3', name: 'Eva Constanza Vargas Retamal',        curso: '8° Básico' },
];

async function run() {
    console.log('🏫  Asignando profesores jefe...\n');

    for (const { uid, name, curso } of ASIGNACIONES) {
        try {
            await db.collection('users').doc(uid).update({
                isHeadTeacher: true,
                headTeacherOf: curso,
            });
            console.log(`  ✓  ${curso.padEnd(12)} →  ${name}`);
        } catch (err) {
            console.error(`  ✗  ${curso} → ${name}: ${err.message}`);
        }
    }

    console.log('\n⚠️   7° Básico (Maximiliano Bahamondes) no fue encontrado en el backup.');
    console.log('     Asígnalo manualmente desde Administración → Usuarios.');
    console.log('\n✅  Listo.');
}

run();

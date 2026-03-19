/**
 * Importar matricula desde Excel a Firestore (coleccion 'students').
 * Uso: node scripts/importMatricula.mjs "/ruta/al/archivo.xlsx"
 *
 * - Lee la hoja "MATRICULA 2026"
 * - Deduplica por RUT (mantiene primera ocurrencia)
 * - Salta alumnos que ya existen en Firestore (mismo RUT)
 * - Crea documentos con la misma estructura que StudentsContext.addStudent
 */
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

// ── Load .env ──
const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
});

const firebaseConfig = {
    apiKey: envVars.VITE_FIREBASE_API_KEY,
    authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: envVars.VITE_FIREBASE_PROJECT_ID,
    storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: envVars.VITE_FIREBASE_APP_ID,
};

// ── Helpers ──
const sanitizeName = (str) => {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
};

const sanitizeText = (str) => (str || '').trim().replace(/\s+/g, ' ');

// ── Read Excel ──
const xlsxPath = process.argv[2];
if (!xlsxPath) {
    console.error('Uso: node scripts/importMatricula.mjs "/ruta/al/archivo.xlsx"');
    process.exit(1);
}

console.log(`\nLeyendo: ${xlsxPath}`);
const wb = XLSX.readFile(xlsxPath);
const sheetName = 'MATRICULA 2026';
const ws = wb.Sheets[sheetName];
if (!ws) {
    console.error(`No se encontro la hoja "${sheetName}". Hojas disponibles:`, wb.SheetNames);
    process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
// Skip header: [RUT, Nombres, Primer Apellido, Segundo Apellido, Establecimiento, col5, curso]
const dataRows = rows.slice(1).filter(r => r[0] && String(r[0]).trim());

console.log(`Filas con datos: ${dataRows.length}`);

// ── Deduplicate within Excel (keep first occurrence) ──
const seen = new Set();
const uniqueRows = [];
let dupeCount = 0;

for (const r of dataRows) {
    const rut = String(r[0]).trim();
    if (seen.has(rut)) {
        dupeCount++;
        continue;
    }
    seen.add(rut);
    uniqueRows.push(r);
}

console.log(`Alumnos unicos: ${uniqueRows.length} (${dupeCount} duplicados removidos del Excel)`);

// ── Map to student documents ──
const students = uniqueRows.map(r => {
    const rut = String(r[0]).trim();
    const firstName = sanitizeName(String(r[1] || ''));
    const paternalLastName = sanitizeName(String(r[2] || ''));
    const maternalLastName = sanitizeName(String(r[3] || ''));
    const curso = sanitizeText(String(r[6] || r[5] || ''));
    const fullName = [firstName, paternalLastName, maternalLastName].filter(Boolean).join(' ');

    return {
        rut,
        firstName,
        paternalLastName,
        maternalLastName,
        fullName,
        curso,
        birthDate: '',
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
        notes: '',
        importedFromSige: true,
    };
});

// Show course summary
const byCurso = {};
students.forEach(s => {
    byCurso[s.curso] = (byCurso[s.curso] || 0) + 1;
});
console.log('\nResumen por curso:');
Object.entries(byCurso).sort((a, b) => a[0].localeCompare(b[0])).forEach(([c, n]) => {
    console.log(`  ${c}: ${n} alumnos`);
});

// ── Connect to Firestore ──
console.log('\nConectando a Firestore...');
const app = initializeApp(firebaseConfig, 'import-matricula');
const auth = getAuth(app);
await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', envVars.SEED_DEFAULT_PASSWORD || '123456');
const db = getFirestore(app);

// ── Get existing students to avoid duplicates ──
console.log('Obteniendo alumnos existentes...');
const existingSnap = await getDocs(collection(db, 'students'));
const existingRuts = new Set();
existingSnap.docs.forEach(d => {
    const rut = d.data().rut;
    if (rut) existingRuts.add(rut);
});
console.log(`Alumnos existentes en DB: ${existingRuts.size}`);

// ── Filter out already-existing ──
const toImport = students.filter(s => !existingRuts.has(s.rut));
const skipped = students.length - toImport.length;
console.log(`\nA importar: ${toImport.length} nuevos (${skipped} ya existian en DB)`);

if (toImport.length === 0) {
    console.log('\nNo hay alumnos nuevos para importar. Saliendo.');
    await deleteApp(app);
    process.exit(0);
}

// ── Import ──
console.log('\nImportando...');
let imported = 0;
let errors = 0;
const col = collection(db, 'students');

for (const s of toImport) {
    try {
        await addDoc(col, s);
        imported++;
        if (imported % 50 === 0) {
            console.log(`  ...${imported}/${toImport.length}`);
        }
    } catch (err) {
        errors++;
        console.error(`  Error con ${s.rut}: ${err.message}`);
    }
}

console.log(`\n✅ Importacion completada:`);
console.log(`   Importados: ${imported}`);
console.log(`   Errores: ${errors}`);
console.log(`   Omitidos (duplicados Excel): ${dupeCount}`);
console.log(`   Omitidos (ya en DB): ${skipped}`);

await deleteApp(app);
process.exit(0);

/**
 * Upload assistant staff entry/exit schedules from Excel to Firestore.
 *
 * Usage:
 *   source .env && node scripts/uploadAssistantHours.js
 *
 * Reads: DISTRIBUCIÓN HORARIA ASISTENTES 2026.xlsx from Desktop (sheet "Hoja 7")
 * Appends to: Firestore collection "teacher_hours" (does NOT delete existing records)
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import XLSX from 'xlsx';
import { resolve } from 'path';

// ── Firebase config from env ──
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const ADMIN_EMAIL = 'dev@plataforma.cl';
const ADMIN_PASSWORD = process.env.SEED_DEFAULT_PASSWORD;
const COLLECTION = 'teacher_hours';

// ── Parse helpers ──
function parseTimeRange(str) {
    if (!str || typeof str !== 'string') return null;
    const clean = str.trim();
    if (!clean) return null;
    const parts = clean.split('-');
    if (parts.length !== 2) return null;
    return { entry: parts[0].trim(), exit: parts[1].trim() };
}

function titleCase(name) {
    return name
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function normalize(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// ── Parse Excel ──
const EXCEL_PATH = resolve(process.env.HOME, 'Desktop', 'DISTRIBUCIÓN HORARIA ASISTENTES 2026.xlsx');
console.log('📂 Leyendo:', EXCEL_PATH);

const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets['Hoja 7'];
if (!ws) {
    console.error('❌ No se encontró hoja "Hoja 7"');
    process.exit(1);
}

const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Headers at row 2 (index 2): ID RELOJ, Turno reloj, NOMBRE, LUNES, MARTES, MIÉRCOLES, JUEVES, VIERNES
const assistants = [];
for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const name = row[2]?.toString().trim();
    if (!name) continue;

    assistants.push({
        name: titleCase(name),
        idReloj: row[0] ? Number(row[0]) : null,
        turnoReloj: row[1] ? Number(row[1]) : null,
        schedule: {
            lunes: parseTimeRange(row[3]?.toString()),
            martes: parseTimeRange(row[4]?.toString()),
            miercoles: parseTimeRange(row[5]?.toString()),
            jueves: parseTimeRange(row[6]?.toString()),
            viernes: parseTimeRange(row[7]?.toString()),
        },
        type: 'asistente',
    });
}

console.log(`✅ ${assistants.length} asistentes parseados del Excel\n`);
assistants.forEach((t, i) => {
    const days = Object.entries(t.schedule)
        .filter(([, v]) => v)
        .map(([d, v]) => `${d.slice(0, 3)}:${v.entry}-${v.exit}`)
        .join(' | ');
    console.log(`  ${i + 1}. ${t.name} → ${days || '(sin horario)'}`);
});

// ── Upload to Firestore (APPEND, no delete) ──
console.log('\n🔐 Autenticando como admin...');
const app = initializeApp(firebaseConfig, 'upload-hours');
const authInstance = getAuth(app);
const db = getFirestore(app);

try {
    await signInWithEmailAndPassword(authInstance, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Autenticado\n');

    // Check existing names to avoid duplicates
    const existing = await getDocs(collection(db, COLLECTION));
    const existingNames = new Set();
    existing.forEach(docSnap => {
        const d = docSnap.data();
        if (d.name) existingNames.add(normalize(d.name));
    });
    console.log(`📋 ${existing.size} registros existentes en "${COLLECTION}"\n`);

    let added = 0;
    let skipped = 0;
    for (const assistant of assistants) {
        if (existingNames.has(normalize(assistant.name))) {
            console.log(`  ⏭️  ${assistant.name} (ya existe)`);
            skipped++;
            continue;
        }
        const docRef = doc(collection(db, COLLECTION));
        await setDoc(docRef, {
            ...assistant,
            createdAt: new Date().toISOString(),
        });
        console.log(`  ✅ ${assistant.name}`);
        added++;
    }

    console.log(`\n🎉 ${added} asistentes agregados, ${skipped} omitidos (ya existían)`);
    console.log(`📊 Total en "${COLLECTION}": ${existing.size + added}`);
} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    await deleteApp(app);
    process.exit(0);
}

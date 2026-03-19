/**
 * Upload teacher entry/exit schedules from Excel (SIGE) to Firestore.
 *
 * Usage:
 *   node scripts/uploadTeacherHours.js
 *
 * Requires: xlsx package (npm install xlsx --no-save)
 * Reads: DISTRIBUCIÓN HORARIA DOCENTES 2026.xlsx from Desktop
 * Writes to: Firestore collection "teacher_hours"
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import XLSX from 'xlsx';
import { readFileSync } from 'fs';
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

// ── Parse Excel ──
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

const EXCEL_PATH = resolve(process.env.HOME, 'Desktop', 'DISTRIBUCIÓN HORARIA DOCENTES 2026.xlsx');
console.log('📂 Leyendo:', EXCEL_PATH);

const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets['RESUMEN'];
if (!ws) {
    console.error('❌ No se encontró hoja RESUMEN');
    process.exit(1);
}

const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Headers at row 2 (index 2): ID RELOJ, TURNO RELOJ, NOMBRE, LUN, MAR, MIE, JUE, VIE, ATENCION
const teachers = [];
for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const name = row[2]?.toString().trim();
    if (!name) continue;

    teachers.push({
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
        atencionApoderados: row[8]?.toString().trim() || '',
    });
}

console.log(`✅ ${teachers.length} docentes parseados del Excel\n`);
teachers.forEach((t, i) => {
    const days = Object.entries(t.schedule)
        .filter(([, v]) => v)
        .map(([d, v]) => `${d.slice(0, 3)}:${v.entry}-${v.exit}`)
        .join(' | ');
    console.log(`  ${i + 1}. ${t.name} → ${days || '(sin horario)'}`);
});

// ── Upload to Firestore ──
console.log('\n🔐 Autenticando como admin...');
const app = initializeApp(firebaseConfig, 'upload-hours');
const authInstance = getAuth(app);
const db = getFirestore(app);

try {
    await signInWithEmailAndPassword(authInstance, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Autenticado\n');

    // Clear existing docs
    const existing = await getDocs(collection(db, COLLECTION));
    if (existing.size > 0) {
        console.log(`🗑️  Eliminando ${existing.size} registros existentes...`);
        for (const docSnap of existing.docs) {
            await deleteDoc(doc(db, COLLECTION, docSnap.id));
        }
    }

    // Upload new data
    console.log(`📤 Subiendo ${teachers.length} horarios...\n`);
    for (const teacher of teachers) {
        const docRef = doc(collection(db, COLLECTION));
        await setDoc(docRef, {
            ...teacher,
            createdAt: new Date().toISOString(),
        });
        console.log(`  ✅ ${teacher.name}`);
    }

    console.log(`\n🎉 ${teachers.length} horarios subidos a "${COLLECTION}"`);
} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    await deleteApp(app);
    process.exit(0);
}

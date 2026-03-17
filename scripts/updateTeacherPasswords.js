/**
 * Script: Cambiar la clave de todos los docentes (role=teacher) a "educacion2026"
 *
 * Flujo por cada docente:
 *   1. Crear app temporal → signIn con clave actual (123456)
 *   2. Si login exitoso → updatePassword a la nueva clave
 *   3. Cerrar app temporal
 *
 * Uso:  node scripts/updateTeacherPasswords.js
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// ── Parse .env ──
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

const OLD_PASSWORD = '123456';
const NEW_PASSWORD = 'educacion2026';

// ── Step 1: Get all teachers from Firestore ──
const mainApp = initializeApp(firebaseConfig, 'main-read');
const mainAuth = getAuth(mainApp);
const db = getFirestore(mainApp);

// Sign in as admin to read Firestore (security rules require auth)
const adminEmail = 'dev@plataforma.cl';
const adminPassword = envVars.SEED_DEFAULT_PASSWORD || OLD_PASSWORD;
await signInWithEmailAndPassword(mainAuth, adminEmail, adminPassword);

const snapshot = await getDocs(collection(db, 'users'));
const teachers = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.role === 'teacher');

console.log(`\nEncontrados ${teachers.length} docentes.\n`);
await deleteApp(mainApp);

// ── Step 2: For each teacher, sign in and change password ──
let success = 0;
let failed = 0;
let alreadyChanged = 0;

for (const teacher of teachers) {
    const appName = `temp-${teacher.id}-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, appName);
    const tempAuth = getAuth(tempApp);

    try {
        // Try signing in with old password
        const cred = await signInWithEmailAndPassword(tempAuth, teacher.email, OLD_PASSWORD);
        // Change password
        await updatePassword(cred.user, NEW_PASSWORD);
        console.log(`✅ ${teacher.name} (${teacher.email}) → clave cambiada`);
        success++;
    } catch (err) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            // Password was already different — maybe already changed or custom
            console.log(`⚠️  ${teacher.name} (${teacher.email}) → clave NO era 123456, no se cambió`);
            alreadyChanged++;
        } else if (err.code === 'auth/user-not-found') {
            console.log(`❌ ${teacher.name} (${teacher.email}) → usuario no existe en Auth`);
            failed++;
        } else {
            console.log(`❌ ${teacher.name} (${teacher.email}) → error: ${err.code || err.message}`);
            failed++;
        }
    }

    try { await deleteApp(tempApp); } catch (_) {}

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
}

console.log(`\n────────────────────────────`);
console.log(`Resumen:`);
console.log(`  ✅ Cambiadas:   ${success}`);
console.log(`  ⚠️  Ya distintas: ${alreadyChanged}`);
console.log(`  ❌ Fallidas:    ${failed}`);
console.log(`  📊 Total:       ${teachers.length}`);
console.log(`\nNueva clave para docentes: ${NEW_PASSWORD}\n`);

process.exit(0);

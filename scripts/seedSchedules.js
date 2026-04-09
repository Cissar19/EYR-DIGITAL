/**
 * Seed script: Escribe horarios por defecto en Firestore para todos los docentes.
 * Consulta la colección `users` para obtener el UID por email, luego escribe en `schedules/{uid}`.
 * Sobrescribe cualquier horario existente.
 *
 * Ejecutar con: node --env-file=.env scripts/seedSchedules.js
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { DEFAULT_SCHEDULES } from '../src/data/defaultSchedules.js';

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'SEED_DEFAULT_PASSWORD',
];

const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`);
    console.error('   Ejecuta con: node --env-file=.env scripts/seedSchedules.js');
    process.exit(1);
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'dev@plataforma.cl';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
    // 0. Autenticar como admin para tener permisos de escritura
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, process.env.SEED_DEFAULT_PASSWORD);
    console.log(`🔑 Autenticado como ${ADMIN_EMAIL}\n`);

    // 1. Obtener todos los usuarios de Firestore para mapear email → uid
    const usersSnap = await getDocs(collection(db, 'users'));
    const emailToUid = {};
    usersSnap.forEach(d => {
        const data = d.data();
        if (data.email) emailToUid[data.email] = d.id;
    });

    const emails = Object.keys(DEFAULT_SCHEDULES);
    console.log(`\n📅 Cargando horarios para ${emails.length} docentes...\n`);

    let ok = 0, skipped = 0;

    for (const email of emails) {
        const uid = emailToUid[email];
        if (!uid) {
            console.warn(`⚠️  Sin UID en Firestore para: ${email}`);
            skipped++;
            continue;
        }

        const blocks = DEFAULT_SCHEDULES[email];
        try {
            await setDoc(doc(db, 'schedules', uid), {
                userId: uid,
                blocks,
                updatedAt: serverTimestamp(),
            });
            console.log(`✅ ${email} → ${blocks.length} bloques`);
            ok++;
        } catch (err) {
            console.error(`❌ ${email}: ${err.message}`);
            skipped++;
        }
    }

    console.log(`\n📊 Resumen: ${ok} escritos, ${skipped} sin usuario en Firestore`);
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

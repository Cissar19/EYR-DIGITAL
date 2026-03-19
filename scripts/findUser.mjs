/**
 * Buscar usuario por email parcial en Firestore.
 * Uso: node scripts/findUser.mjs <busqueda>
 */
import fs from 'fs';
import path from 'path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

const search = (process.argv[2] || '').toLowerCase();

const app = initializeApp(firebaseConfig, 'search');
const auth = getAuth(app);
await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', envVars.SEED_DEFAULT_PASSWORD || '123456');

const db = getFirestore(app);
const snap = await getDocs(collection(db, 'users'));
const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

const matches = users.filter(u =>
    (u.email || '').toLowerCase().includes(search) ||
    (u.name || '').toLowerCase().includes(search)
);

console.log(`\nBusqueda: "${search}" — ${matches.length} resultado(s)\n`);
matches.forEach(u => {
    console.log(`  ${u.name} | ${u.email} | rol: ${u.role}`);
});

await deleteApp(app);
process.exit(0);

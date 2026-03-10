/**
 * Quick DB health check: authenticates, then lists all expected collections and doc counts
 * Run with: node --env-file=.env scripts/checkDb.js
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const COLLECTIONS = [
    'users',
    'schedules',
    'admin_requests',
    'admin_metrics',
    'lab_reservations',
    'inventory',
    'inventory_categories',
    'equipment',
    'equipment_folders',
    'equipment_requests',
    'print_requests',
    'tickets'
];

async function checkDb() {
    // Authenticate as super_admin
    console.log('🔑 Autenticando como dev@plataforma.cl...');
    await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
    console.log('✅ Autenticado\n');

    console.log(`🔍 Verificando Firestore (proyecto: ${process.env.VITE_FIREBASE_PROJECT_ID})\n`);
    console.log('Colección                  | Docs | Muestra');
    console.log('---------------------------|------|--------');

    let totalDocs = 0;
    let emptyCollections = [];

    for (const name of COLLECTIONS) {
        try {
            const snap = await getDocs(collection(db, name));
            const count = snap.size;
            totalDocs += count;
            let sample = '';
            if (count > 0) {
                const first = snap.docs[0].data();
                const keys = Object.keys(first).slice(0, 4).join(', ');
                sample = `campos: ${keys}`;
            } else {
                emptyCollections.push(name);
            }
            const status = count > 0 ? '✅' : '⚠️ ';
            console.log(`${status} ${name.padEnd(25)} | ${String(count).padStart(4)} | ${sample}`);
        } catch (err) {
            console.log(`❌ ${name.padEnd(25)} | ERROR: ${err.message}`);
        }
    }

    console.log(`\n📊 Total documentos: ${totalDocs}`);
    if (emptyCollections.length > 0) {
        console.log(`⚠️  Colecciones vacías: ${emptyCollections.join(', ')}`);
    } else {
        console.log('✅ Todas las colecciones tienen datos');
    }
    console.log('');

    await deleteApp(app);
}

checkDb().catch(err => {
    console.error('Error general:', err.message);
    process.exit(1);
});

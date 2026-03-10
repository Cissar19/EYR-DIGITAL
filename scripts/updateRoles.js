/**
 * Update roles for specific users in Firestore
 * Run with: node --env-file=.env scripts/updateRoles.js
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Roles to update: email -> new role
const ROLE_UPDATES = [
    { email: 'adm.ernestoyanez@eduhuechuraba.cl', newRole: 'super_admin', description: 'Damaris Contreras -> super_admin' },
    { email: 'utp.ernestoyanez@eduhuechuraba.cl', newRole: 'utp_head', description: 'Maria Paz Flores Corvalan -> utp_head' },
];

async function main() {
    console.log('Autenticando...');
    await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
    console.log('Autenticado\n');

    // Fetch all users
    const snap = await getDocs(collection(db, 'users'));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    for (const update of ROLE_UPDATES) {
        const user = users.find(u => u.email === update.email);
        if (!user) {
            console.log(`No encontrado: ${update.email}`);
            continue;
        }

        console.log(`${update.description}`);
        console.log(`  Nombre: ${user.name}`);
        console.log(`  Rol actual: ${user.role} -> ${update.newRole}`);

        await updateDoc(doc(db, 'users', user.id), { role: update.newRole });
        console.log(`  Actualizado\n`);
    }

    console.log('Listo!');
    await deleteApp(app);
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { initializeApp as initAdmin, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// ── Config ──
const USER_EMAIL = 'ernestoyanez@eduhuechuraba.cl';
const USER_PASSWORD = '123456';
const USER_NAME = 'Ernesto Yáñez Rivera';
const USER_ROLE = 'director';

const ADMIN_EMAIL = 'dev@plataforma.cl';
const ADMIN_PASSWORD = process.env.SEED_DEFAULT_PASSWORD;

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// ── Step 1: Use firebase-admin to update Auth password ──
const configPath = `${homedir()}/.config/configstore/firebase-tools.json`;
const cliConfig = JSON.parse(readFileSync(configPath, 'utf8'));
const refreshToken = cliConfig.tokens?.refresh_token;

if (!refreshToken) {
    console.error('No Firebase CLI refresh token. Run: firebase login');
    process.exit(1);
}

initAdmin({
    projectId: 'eyr-digital',
    credential: {
        getAccessToken: async () => {
            const res = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: cliConfig.tokens?.client_id || '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
                    client_secret: cliConfig.tokens?.client_secret || 'j9iVZfS8kkCEFUPaAeJV0sAi',
                }),
            });
            const data = await res.json();
            if (!data.access_token) throw new Error('Token fetch failed: ' + JSON.stringify(data));
            return { access_token: data.access_token, expires_in: data.expires_in };
        }
    },
});

const adminAuth = getAdminAuth();
let uid;

try {
    const existing = await adminAuth.getUserByEmail(USER_EMAIL);
    uid = existing.uid;
    console.log('Usuario Auth existe, uid:', uid);
    await adminAuth.updateUser(uid, { password: USER_PASSWORD });
    console.log('Contraseña actualizada a:', USER_PASSWORD);
} catch (e) {
    if (e.code === 'auth/user-not-found') {
        const created = await adminAuth.createUser({
            email: USER_EMAIL,
            password: USER_PASSWORD,
            displayName: USER_NAME,
        });
        uid = created.uid;
        console.log('Usuario Auth creado, uid:', uid);
    } else {
        console.error('Error Auth:', e.code, e.message);
        process.exit(1);
    }
}

// ── Step 2: Use client SDK as admin to write Firestore ──
const app = initializeApp(firebaseConfig, 'admin-session');
const clientAuth = getAuth(app);
const db = getFirestore(app);

try {
    await signInWithEmailAndPassword(clientAuth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Admin Firestore autenticado');

    await setDoc(doc(db, 'users', uid), {
        uid,
        name: USER_NAME,
        email: USER_EMAIL,
        role: USER_ROLE,
        avatar: null,
        hoursUsed: 0,
        createdAt: new Date().toISOString(),
        permissionOverrides: {
            schedules: true,
            days_tracking: true,
            replacements: true,
        },
    }, { merge: true });

    console.log('\nUsuario director listo:');
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Clave: ${USER_PASSWORD}`);
    console.log(`   Rol:   ${USER_ROLE} (ve todo, no edita)`);
    console.log(`   UID:   ${uid}`);
} catch (err) {
    console.error('Error Firestore:', err.message);
} finally {
    await deleteApp(app);
    process.exit(0);
}

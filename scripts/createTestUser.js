/**
 * Script puntual: Crea un usuario de prueba con email y contraseña específicos
 * Run: node --env-file=.env scripts/createTestUser.js
 */
import { execSync } from 'child_process';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID',
];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) { console.error(`❌ Faltan: ${missing.join(', ')}`); process.exit(1); }

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

// Usuario a crear
const USUARIO = {
    name: 'Usuario Prueba',
    email: 'usuarioprueba@eduhuechuraba.cl',
    password: 'educacion2026',
    role: 'teacher',
};

let _gcloudToken = null;
function getGcloudToken() {
    if (!_gcloudToken) {
        try { _gcloudToken = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim(); }
        catch { console.error('❌ gcloud auth login requerido'); process.exit(1); }
    }
    return _gcloudToken;
}

function toFirestoreFields(data) {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
        if (v === null || v === undefined) fields[k] = { nullValue: null };
        else if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
        else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
    }
    return fields;
}

async function getUidByEmail(email) {
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getGcloudToken()}`, 'Content-Type': 'application/json', 'X-Goog-User-Project': PROJECT_ID },
        body: JSON.stringify({ email: [email] }),
    });
    const data = await resp.json();
    return data.users?.[0]?.localId ?? null;
}

async function restDocExists(docId) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${docId}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${getGcloudToken()}` } });
    return resp.status !== 404;
}

async function restSetDoc(docId, data) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${docId}`;
    const resp = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getGcloudToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toFirestoreFields(data) }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${resp.status}`); }
}

async function main() {
    console.log(`\n🚀 Creando usuario: ${USUARIO.email} (${USUARIO.role})\n`);
    getGcloudToken();

    // 1. Verificar si ya existe en Auth
    let uid = await getUidByEmail(USUARIO.email);
    if (uid) {
        console.log(`⚠️  Ya existe en Firebase Auth (uid: ${uid})`);
    } else {
        // 2. Crear en Auth con contraseña específica
        const tempApp = initializeApp(firebaseConfig, 'temp-create-' + Date.now());
        const tempAuth = getAuth(tempApp);
        try {
            const cred = await createUserWithEmailAndPassword(tempAuth, USUARIO.email, USUARIO.password);
            uid = cred.user.uid;
            console.log(`✅ Creado en Firebase Auth — uid: ${uid}`);
        } finally {
            try { await deleteApp(tempApp); } catch (_) {}
        }
    }

    // 3. Verificar si ya tiene perfil Firestore
    if (await restDocExists(uid)) {
        console.log(`⚠️  Ya tiene perfil en Firestore — no se sobrescribe`);
        console.log(`\n✨ Listo! Email: ${USUARIO.email} | Pass: ${USUARIO.password}\n`);
        process.exit(0);
    }

    // 4. Crear perfil en Firestore
    await restSetDoc(uid, {
        uid,
        name: USUARIO.name,
        email: USUARIO.email,
        role: USUARIO.role,
        avatar: null,
        hoursUsed: 0,
        createdAt: new Date().toISOString(),
    });
    console.log(`✅ Perfil creado en Firestore`);
    console.log(`\n✨ Listo! Email: ${USUARIO.email} | Pass: ${USUARIO.password} | Rol: ${USUARIO.role}\n`);
    process.exit(0);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });

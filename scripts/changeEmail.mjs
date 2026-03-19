import { readFileSync } from 'fs';
import { homedir } from 'os';
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const OLD_EMAIL = 'm.denordenflycht@escuela.cl';
const NEW_EMAIL = 'mdenord@eduhuechuraba.cl';

// Parse .env
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

// Step 1: Update email in Firebase Auth via Admin SDK
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
            if (!data.access_token) throw new Error('Token fetch failed');
            return { access_token: data.access_token, expires_in: data.expires_in };
        }
    },
});

const adminAuth = getAdminAuth();
const user = await adminAuth.getUserByEmail(OLD_EMAIL);
await adminAuth.updateUser(user.uid, { email: NEW_EMAIL });
console.log(`✅ Firebase Auth: email cambiado de ${OLD_EMAIL} a ${NEW_EMAIL}`);

// Step 2: Update email in Firestore user doc
const app = initializeApp(firebaseConfig, 'update-email');
const clientAuth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(clientAuth, 'dev@plataforma.cl', envVars.SEED_DEFAULT_PASSWORD || '123456');
await updateDoc(doc(db, 'users', user.uid), { email: NEW_EMAIL });
console.log(`✅ Firestore: email actualizado en documento de usuario`);

await deleteApp(app);
console.log(`\n✅ Listo. ${user.uid} ahora usa ${NEW_EMAIL}\n`);
process.exit(0);

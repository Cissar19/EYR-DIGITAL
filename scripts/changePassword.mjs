/**
 * Cambiar clave de un usuario especifico.
 * Uso: node scripts/changePassword.mjs <email> <nuevaClave>
 */
import fs from 'fs';
import path from 'path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

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

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.log('Uso: node scripts/changePassword.mjs <email> <nuevaClave>');
    process.exit(1);
}

// Claves comunes a intentar
const tryPasswords = ['123456', 'educacion2026', envVars.SEED_DEFAULT_PASSWORD].filter(Boolean);
const unique = [...new Set(tryPasswords)];

const app = initializeApp(firebaseConfig, `change-pw-${Date.now()}`);
const auth = getAuth(app);

let changed = false;
for (const oldPw of unique) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, oldPw);
        await updatePassword(cred.user, newPassword);
        console.log(`\n✅ ${email} → clave cambiada a "${newPassword}" (clave anterior: "${oldPw}")\n`);
        changed = true;
        break;
    } catch (err) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            console.log(`  ⏩ Clave "${oldPw}" no funciona, probando siguiente...`);
        } else {
            console.log(`  ❌ Error: ${err.code || err.message}`);
            break;
        }
    }
}

if (!changed) {
    console.log(`\n❌ No se pudo cambiar la clave de ${email}. Ninguna clave conocida funciono.\n`);
}

try { await deleteApp(app); } catch (_) {}
process.exit(changed ? 0 : 1);

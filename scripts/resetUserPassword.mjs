/**
 * Resetear clave de un usuario usando Firebase Admin SDK.
 * No requiere conocer la clave actual.
 * Uso: node scripts/resetUserPassword.mjs <email> <nuevaClave>
 */
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.log('Uso: node scripts/resetUserPassword.mjs <email> <nuevaClave>');
    process.exit(1);
}

// Firebase CLI refresh token
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

try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(user.uid, { password: newPassword });
    console.log(`\n✅ ${email} → clave cambiada a "${newPassword}"\n`);
} catch (err) {
    if (err.code === 'auth/user-not-found') {
        console.error(`\n❌ Usuario ${email} no existe en Firebase Auth.\n`);
    } else {
        console.error(`\n❌ Error: ${err.code || err.message}\n`);
    }
    process.exit(1);
}

process.exit(0);

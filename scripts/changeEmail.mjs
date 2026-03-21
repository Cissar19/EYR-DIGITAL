import { readFileSync } from 'fs';
import { homedir } from 'os';
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Mapeo completo: [correo viejo en @escuela.cl, correo nuevo en @eduhuechuraba.cl]
const EMAIL_CHANGES = [
    // --- Institucionales ---
    ['director@escuela.cl', 'director@eduhuechuraba.cl'],
    ['utp@escuela.cl', 'utp@eduhuechuraba.cl'],
    ['inspectoria@escuela.cl', 'inspectoria@eduhuechuraba.cl'],
    ['impresiones@escuela.cl', 'impresiones@eduhuechuraba.cl'],
    // --- Staff ---
    ['c.araneda@escuela.cl', 'caranedan@eduhuechuraba.cl'],
    ['v.araya@escuela.cl', 'varayav@eduhuechuraba.cl'],
    ['c.arriagada@escuela.cl', 'carriagadaa@eduhuechuraba.cl'],
    ['n.bernales@escuela.cl', 'nbernalesc@eduhuechuraba.cl'],
    ['f.cano@escuela.cl', 'fcanoa@eduhuechuraba.cl'],
    ['n.cardona@escuela.cl', 'ncardonaa@eduhuechuraba.cl'],
    ['p.cerda@escuela.cl', 'pcerdar@eduhuechuraba.cl'],
    ['p.contador@escuela.cl', 'pcontadord@eduhuechuraba.cl'],
    ['p.contreras@escuela.cl', 'pcontrerasr@eduhuechuraba.cl'],
    ['j.contreras@escuela.cl', 'jcontrerasv@eduhuechuraba.cl'],
    ['j.cortes@escuela.cl', 'jcorteso@eduhuechuraba.cl'],
    ['a.estay@escuela.cl', 'aestayc@eduhuechuraba.cl'],
    ['a.farias@escuela.cl', 'afariasa@eduhuechuraba.cl'],
    ['n.flores@escuela.cl', 'nfloresn@eduhuechuraba.cl'],
    ['j.fuentes@escuela.cl', 'jfuentesp@eduhuechuraba.cl'],
    ['p.gomara@escuela.cl', 'pgomaram@eduhuechuraba.cl'],
    ['l.guerrero@escuela.cl', 'lguerrerom@eduhuechuraba.cl'],
    ['o.hermosilla@escuela.cl', 'ohermosillam@eduhuechuraba.cl'],
    ['a.lagos@escuela.cl', 'alagosg@eduhuechuraba.cl'],
    ['s.levio@escuela.cl', 'slevioc@eduhuechuraba.cl'],
    ['s.lillo@escuela.cl', 'slillop@eduhuechuraba.cl'],
    ['f.navarrete@escuela.cl', 'fnavarrett@eduhuechuraba.cl'],
    ['s.maldonado@escuela.cl', 'smaldonador@eduhuechuraba.cl'],
    ['y.manzo@escuela.cl', 'ymanzos@eduhuechuraba.cl'],
    ['l.moya@escuela.cl', 'lmoyac@eduhuechuraba.cl'],
    ['m.orellana@escuela.cl', 'morellanat@eduhuechuraba.cl'],
    ['m.paez@escuela.cl', 'mpaezo@eduhuechuraba.cl'],
    ['a.paez@escuela.cl', 'apaezr@eduhuechuraba.cl'],
    ['c.perez@escuela.cl', 'cperezg@eduhuechuraba.cl'],
    ['n.pizarro@escuela.cl', 'npizarroo@eduhuechuraba.cl'],
    ['k.reyes@escuela.cl', 'kreyesg@eduhuechuraba.cl'],
    ['m.riquelme@escuela.cl', 'mriquelmel@eduhuechuraba.cl'],
    ['m.rivera@escuela.cl', 'mriveram@eduhuechuraba.cl'],
    ['a.ruiz@escuela.cl', 'aruizc@eduhuechuraba.cl'],
    ['r.sanchez@escuela.cl', 'rsanchezs@eduhuechuraba.cl'],
    ['m.sandoval@escuela.cl', 'msandovalg@eduhuechuraba.cl'],
    ['c.silva@escuela.cl', 'csilvas@eduhuechuraba.cl'],
    ['m.valdes@escuela.cl', 'mvaldesl@eduhuechuraba.cl'],
    ['c.venegas@escuela.cl', 'cvenegass@eduhuechuraba.cl'],
    ['j.vidal@escuela.cl', 'jvidale@eduhuechuraba.cl'],
    ['y.villenas@escuela.cl', 'yvillenasl@eduhuechuraba.cl'],
    ['p.zenteno@escuela.cl', 'pzentenot@eduhuechuraba.cl'],
];

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

// Init Firebase Admin SDK
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

// Init Firestore client
const app = initializeApp(firebaseConfig, 'update-email');
const clientAuth = getAuth(app);
const db = getFirestore(app);
await signInWithEmailAndPassword(clientAuth, 'dev@plataforma.cl', envVars.SEED_DEFAULT_PASSWORD || '123456');

console.log(`\n🔄 Actualizando ${EMAIL_CHANGES.length} correos...\n`);

let ok = 0, skipped = 0, failed = 0;

for (const [oldEmail, newEmail] of EMAIL_CHANGES) {
    try {
        const user = await adminAuth.getUserByEmail(oldEmail);
        await adminAuth.updateUser(user.uid, { email: newEmail });
        await updateDoc(doc(db, 'users', user.uid), { email: newEmail });
        console.log(`✅ ${oldEmail} → ${newEmail}`);
        ok++;
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            console.log(`⏭️  ${oldEmail} (no existe, ya migrado?)`);
            skipped++;
        } else {
            console.error(`❌ ${oldEmail}: ${e.message}`);
            failed++;
        }
    }
}

await deleteApp(app);
console.log(`\n📊 Resumen: ${ok} actualizados, ${skipped} omitidos, ${failed} fallidos\n`);
process.exit(0);

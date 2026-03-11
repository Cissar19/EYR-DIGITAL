/**
 * Upload parsed teacher schedules to Firestore 'schedules' collection.
 * Reads parsed_schedules.json, maps teacher names to Firebase user UIDs,
 * and writes schedule documents.
 *
 * Run with: node --env-file=.env scripts/uploadSchedules.js
 */

import { readFileSync } from 'fs';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
    console.error(`Missing env vars: ${missing.join(', ')}`);
    console.error('Run with: node --env-file=.env scripts/uploadSchedules.js');
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

// Teacher name from Excel -> email in Firebase
const NAME_TO_EMAIL = {
    "Marisol Molina": "mmolinav@eduhuechuraba.cl",
    "Juan Figueroa": "jfigueroah@eduhuechuraba.cl",
    "Leslye Valencia": "lvalenciar@eduhuechuraba.cl",
    "Manuel Astudillo": "mastudillof@eduhuechuraba.cl",
    "Pamela Olivero": "poliverof@eduhuechuraba.cl",
    "Francisco Pérez": "fperezd@eduhuechuraba.cl",
    "Daniela Alvarado": "dalvaradov@eduhuechuraba.cl",
    "Constanza Vargas": "evargasr@eduhuechuraba.cl",
    "Belén Leal": "blealm@eduhuechuraba.cl",
    "Eduardo Baeza": "ebaezag@eduhuechuraba.cl",
    "Virna Caniupil": "vcaniupilo@eduhuechuraba.cl",
    "Filippa Leporati": "fleporati@eduhuechuraba.cl",
    "María Eugenia Fuentes": "mfuentesa@eduhuechuraba.cl",
    "Álvaro Jara": "ajarab@eduhuechuraba.cl",
    "Corina Camilo": "ccamilot@eduhuechuraba.cl",
    "María José Silva": "msilvaa@eduhuechuraba.cl",
    "Claudia Pincheira": "cpincheirag@eduhuechuraba.cl",
    // Daniela Lobos not in Firebase users
};

async function main() {
    // Read parsed schedules
    const schedulesData = JSON.parse(
        readFileSync(new URL('./parsed_schedules.json', import.meta.url), 'utf-8')
    );

    console.log(`\nLoaded ${schedulesData.length} teacher schedules from parsed_schedules.json\n`);

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Sign in as super_admin to have write access
    await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
    console.log('Authenticated as admin\n');

    // Fetch all users to build email -> uid map
    const usersSnap = await getDocs(collection(db, 'users'));
    const emailToUid = {};
    usersSnap.docs.forEach(d => {
        const data = d.data();
        if (data.email) {
            emailToUid[data.email] = d.id;
        }
    });
    console.log(`Found ${Object.keys(emailToUid).length} users in Firestore\n`);

    let uploaded = 0;
    let skipped = 0;
    let unmapped = 0;

    for (const teacher of schedulesData) {
        const email = NAME_TO_EMAIL[teacher.teacherName];
        if (!email) {
            console.log(`  ⚠ No email mapping for "${teacher.teacherName}" - skipped`);
            unmapped++;
            continue;
        }

        const uid = emailToUid[email];
        if (!uid) {
            console.log(`  ⚠ No user found for email ${email} (${teacher.teacherName}) - skipped`);
            skipped++;
            continue;
        }

        // Format blocks: only keep {day, startTime, subject, course}
        const blocks = teacher.blocks.map(b => ({
            day: b.day,
            startTime: b.startTime,
            subject: b.subject,
            course: b.course,
        }));

        await setDoc(doc(db, 'schedules', uid), {
            userId: uid,
            blocks: blocks,
        });

        console.log(`  ✅ ${teacher.teacherName} (${email}) → ${blocks.length} blocks`);
        uploaded++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Uploaded: ${uploaded}`);
    console.log(`  ⚠ Unmapped: ${unmapped}`);
    console.log(`  ⚠ Skipped (no user): ${skipped}`);
    console.log(`\nDone!\n`);

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const KEY_FILE = join(dirname(fileURLToPath(import.meta.url)), 'serviceAccountKey.json');
initializeApp({ credential: cert(KEY_FILE) });
const db = getFirestore();

const snap = await db.collection('users').doc('X1uxyN5XQTYUjZ1Lig9TstPBVHF2').get();
if (!snap.exists) { console.log('❌ Usuario no encontrado'); process.exit(1); }
const { name, role, isHeadTeacher, headTeacherOf } = snap.data();
console.log({ name, role, isHeadTeacher, headTeacherOf });

/**
 * Restablece la contraseña de todos los usuarios con rol "teacher" (y variantes).
 *
 * Uso: node scripts/resetTeacherPasswords.mjs [nuevaClave]
 *   Si no se indica clave, usa "educacion2026" por defecto.
 *
 * Requiere: serviceAccountKey.json en la raíz del proyecto.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const NEW_PASSWORD = process.argv[2] || 'educacion2026';

const TEACHER_ROLES = ['teacher'];

const serviceAccount = JSON.parse(readFileSync(join(ROOT, 'serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const adminAuth = getAdminAuth();
const db = getFirestore();

console.log(`\n🔑 Restableciendo contraseñas → "${NEW_PASSWORD}"\n`);

const snapshot = await db.collection('users')
    .where('role', 'in', TEACHER_ROLES)
    .get();

if (snapshot.empty) {
    console.log('⚠️  No se encontraron docentes en Firestore.');
    process.exit(0);
}

const users = snapshot.docs.map(d => ({ uid: d.data().uid, name: d.data().name, email: d.data().email }));
console.log(`👥 Docentes encontrados: ${users.length}\n`);

let ok = 0, errors = 0;

for (const u of users) {
    try {
        await adminAuth.updateUser(u.uid, { password: NEW_PASSWORD });
        console.log(`  ✅ ${u.name} (${u.email})`);
        ok++;
    } catch (err) {
        console.error(`  ❌ ${u.name} (${u.email}) → ${err.code || err.message}`);
        errors++;
    }
}

console.log(`\n📊 Resultado: ${ok} exitosos, ${errors} errores\n`);
process.exit(errors > 0 ? 1 : 0);

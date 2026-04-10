/**
 * linkTeacherHours.mjs
 * Matchea documentos de teacher_hours con usuarios de Firestore por nombre
 * y agrega el campo userId a cada doc de teacher_hours.
 *
 * Ejecutar: node --env-file=.env scripts/linkTeacherHours.mjs
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const normalize = (str) =>
    (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/**
 * Construye claves de matching para un nombre completo.
 * Estrategia: último = apellido materno, penúltimo = apellido paterno, primero = nombre.
 */
function buildKeys(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const keys = [];

    if (parts.length >= 3) {
        const firstName  = normalize(parts[0]);
        const paternal   = normalize(parts[parts.length - 2]);
        const maternal   = normalize(parts[parts.length - 1]);

        // Clave más específica
        keys.push(`${firstName}|${paternal}|${maternal}`);
        // Fallback: solo apellidos
        keys.push(`${paternal}|${maternal}`);
        // Fallback: nombre + apellido paterno
        keys.push(`${firstName}|${paternal}`);
    } else if (parts.length === 2) {
        keys.push(`${normalize(parts[0])}|${normalize(parts[1])}`);
    } else if (parts.length === 1) {
        keys.push(normalize(parts[0]));
    }

    return keys;
}

try {
    // Autenticar como admin
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'adm.ernestoyanez@eduhuechuraba.cl';
    const adminPass  = process.env.SEED_ADMIN_PASSWORD || process.env.SEED_DEFAULT_PASSWORD;
    await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    console.log(`✅ Autenticado como ${adminEmail}`);

    // Cargar todos los usuarios de Firestore
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`📋 ${users.length} usuarios cargados`);

    // Construir índice de usuarios por clave de nombre
    const userByKey = new Map();
    for (const u of users) {
        if (!u.name) continue;
        for (const key of buildKeys(u.name)) {
            if (userByKey.has(key)) {
                // Colisión: marcar como ambigua
                userByKey.set(key, '__ambiguous__');
            } else {
                userByKey.set(key, u);
            }
        }
    }

    // Cargar teacher_hours
    const thSnap = await getDocs(collection(db, 'teacher_hours'));
    console.log(`📋 ${thSnap.size} docs de teacher_hours`);

    let matched = 0;
    let unmatched = 0;
    let alreadyLinked = 0;

    for (const thDoc of thSnap.docs) {
        const data = thDoc.data();

        if (data.userId) {
            alreadyLinked++;
            continue;
        }

        if (!data.name) {
            console.warn(`  ⚠️  Doc sin nombre: ${thDoc.id}`);
            unmatched++;
            continue;
        }

        const keys = buildKeys(data.name);
        let foundUser = null;

        for (const key of keys) {
            const candidate = userByKey.get(key);
            if (candidate && candidate !== '__ambiguous__') {
                foundUser = candidate;
                break;
            }
        }

        if (foundUser) {
            await updateDoc(doc(db, 'teacher_hours', thDoc.id), { userId: foundUser.id });
            console.log(`  ✅ "${data.name}" → ${foundUser.name} (${foundUser.id})`);
            matched++;
        } else {
            console.warn(`  ❌ Sin match: "${data.name}" (claves: ${keys.join(', ')})`);
            unmatched++;
        }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   Enlazados ahora:    ${matched}`);
    console.log(`   Ya tenían userId:   ${alreadyLinked}`);
    console.log(`   Sin match:          ${unmatched}`);

    if (unmatched > 0) {
        console.log(`\n⚠️  Los sin match no serán considerados en permanencia.`);
        console.log(`   Revisa los nombres o agrégales userId manualmente en Firestore.`);
    }

} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    await deleteApp(app);
    process.exit(0);
}

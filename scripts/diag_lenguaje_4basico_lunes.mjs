/**
 * diag_lenguaje_4basico_lunes.mjs
 *
 * Diagnostica por qué no aparecen bloques del Lunes cuando
 * un docente intenta agendar Lenguaje en 4° Básico.
 *
 * Muestra todos los bloques de Lenguaje (LE) en 4° Básico
 * de cualquier docente, agrupados por día.
 *
 * Uso: node --env-file=.env scripts/diag_lenguaje_4basico_lunes.mjs
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey:     process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.VITE_FIREBASE_PROJECT_ID,
};

const COURSE   = '4° Básico';
const LE_NAMES = new Set(['Lenguaje', 'Leng. y Lit.', 'T. Lenguaje', 'Taller Len']);

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
  console.log('✓ Autenticado\n');

  // Cargar usuarios para mostrar nombres
  const usersSnap = await getDocs(collection(db, 'users'));
  const userMap = {};
  usersSnap.docs.forEach(d => {
    const u = d.data();
    userMap[d.id] = u.displayName || u.email || d.id;
  });

  const snap = await getDocs(collection(db, 'schedules'));

  let found = 0;

  for (const docSnap of snap.docs) {
    const uid    = docSnap.id;
    const blocks = docSnap.data().blocks || [];

    const leBlocks = blocks.filter(b =>
      b.course === COURSE && LE_NAMES.has(b.subject)
    );

    if (leBlocks.length === 0) continue;

    found++;
    const nombre = userMap[uid] || uid;
    console.log(`=== ${nombre} (${uid}) ===`);

    const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const byDay = {};
    DIAS.forEach(d => { byDay[d] = []; });

    leBlocks.forEach(b => {
      const day = b.day || '(sin día)';
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(b);
    });

    DIAS.forEach(dia => {
      const bs = byDay[dia];
      if (bs.length === 0) {
        console.log(`  ${dia}: *** SIN BLOQUES ***`);
      } else {
        bs.sort((a, b) => a.startTime.localeCompare(b.startTime));
        bs.forEach(b =>
          console.log(`  ${dia}: ${b.subject} | ${b.startTime} | curso="${b.course}"`)
        );
      }
    });
    console.log('');
  }

  if (found === 0) {
    console.log(`No hay ningún docente con bloques de Lenguaje en "${COURSE}".`);
    console.log('Posibles causas:');
    console.log('  - El nombre del curso está escrito diferente (ej: "4to Básico")');
    console.log('  - La asignatura tiene un nombre que no está en el mapeo (ej: "Leng.")');
    console.log('');
    console.log('Todos los valores únicos de course y subject en Firestore:');
    const allSnap = await getDocs(collection(db, 'schedules'));
    const courses  = new Set();
    const subjects = new Set();
    allSnap.docs.forEach(d => {
      (d.data().blocks || []).forEach(b => {
        if (b.course) courses.add(b.course);
        if (b.subject) subjects.add(b.subject);
      });
    });
    console.log('\nCursos:', [...courses].sort().join(', '));
    console.log('\nAsignaturas:', [...subjects].sort().join(', '));
  }

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await deleteApp(app);
  process.exit(0);
}

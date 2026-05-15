/**
 * fix_lenguaje_1basico_miercoles.mjs
 *
 * Corrige el horario de Lenguaje de 1° Básico en Miércoles:
 * mueve los bloques de la 3ª/4ª hora (09:55 y 10:40) a la 1ª/2ª hora (08:10 y 08:55).
 *
 * Uso: node --env-file=.env scripts/fix_lenguaje_1basico_miercoles.mjs
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const COURSE    = '1° Básico';
const DAY       = 'Miércoles';
const SUBJECTS  = new Set(['Lenguaje', 'Leng. y Lit.']);
const WRONG_TIMES = { '09:55': '08:10', '10:40': '08:55' };

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
  console.log('✓ Autenticado\n');

  const snap = await getDocs(collection(db, 'schedules'));

  let totalFixed = 0;

  for (const docSnap of snap.docs) {
    const data   = docSnap.data();
    const blocks = data.blocks || [];

    // Buscar bloques de Lenguaje en 1° Básico el Miércoles con hora incorrecta
    const wrongBlocks = blocks.filter(b =>
      b.course === COURSE &&
      b.day   === DAY &&
      SUBJECTS.has(b.subject) &&
      WRONG_TIMES[b.startTime]
    );

    if (wrongBlocks.length === 0) continue;

    console.log(`Docente UID: ${docSnap.id}`);
    console.log('  Bloques a corregir:');
    wrongBlocks.forEach(b =>
      console.log(`    ${b.subject} | ${b.day} | ${b.startTime}  →  ${WRONG_TIMES[b.startTime]}`)
    );

    // Aplicar la corrección
    const updatedBlocks = blocks.map(b => {
      if (
        b.course === COURSE &&
        b.day   === DAY &&
        SUBJECTS.has(b.subject) &&
        WRONG_TIMES[b.startTime]
      ) {
        return { ...b, startTime: WRONG_TIMES[b.startTime] };
      }
      return b;
    });

    await updateDoc(doc(db, 'schedules', docSnap.id), { blocks: updatedBlocks });
    console.log('  ✓ Horario actualizado\n');
    totalFixed++;
  }

  if (totalFixed === 0) {
    console.log('No se encontraron bloques con el error descrito (puede que ya estén corregidos).');
  } else {
    console.log(`\nListo — se corrigieron ${totalFixed} docente(s).`);
  }

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await deleteApp(app);
  process.exit(0);
}

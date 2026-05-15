/**
 * delete_cobertura_cursos_B_sin_docente.mjs
 *
 * Elimina de Firestore todos los documentos de cobertura curricular
 * donde:
 *   - grade termina en " B" (ej. "Kinder B", "Pre-Kinder B")
 *   - teacherId empieza con "sin_docente_"
 *
 * También elimina los usuarios placeholder correspondientes de la
 * colección `users` (IDs que empiecen con "sin_docente_" y refieran
 * a un curso terminado en "_b").
 *
 * Uso:
 *   node scripts/delete_cobertura_cursos_B_sin_docente.mjs
 *   node scripts/delete_cobertura_cursos_B_sin_docente.mjs --dry-run
 *
 * Requisitos:
 *   scripts/serviceAccountKey.json
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE  = join(__dirname, 'serviceAccountKey.json');
const DRY_RUN   = process.argv.includes('--dry-run');

const app = initializeApp({ credential: cert(KEY_FILE) });
const db  = getFirestore(app);

const SCHOOL_ID = 'eyr';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EXCLUIR = new Set(['Kinder B', 'Pre-Kinder B']);
const gradeEndsInB = (grade) => {
  const g = (grade || '').trim();
  return /\s*B$/.test(g) && !EXCLUIR.has(g);
};
const isSinDocente = (id) => (id || '').startsWith('sin_docente_');

// ─── Main ─────────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log('🔍 MODO DRY-RUN — no se eliminará nada\n');
}

// 1. Obtener todos los años académicos
const yearsSnap = await db
  .collection('schools').doc(SCHOOL_ID)
  .collection('academicYears')
  .get();

const years = yearsSnap.docs.map(d => d.id);
console.log(`Años académicos encontrados: ${years.join(', ')}\n`);

let totalDocs   = 0;
const toDelete  = []; // { year, docId, grade, subject, teacherName }

// 2. Recorrer coverage de cada año
for (const year of years) {
  const covSnap = await db
    .collection('schools').doc(SCHOOL_ID)
    .collection('academicYears').doc(year)
    .collection('coverage')
    .get();

  const matching = covSnap.docs.filter(d => {
    const data = d.data();
    return gradeEndsInB(data.grade) && isSinDocente(data.teacherId);
  });

  if (matching.length === 0) continue;

  console.log(`=== Año ${year} — ${matching.length} doc(s) a eliminar ===`);
  for (const d of matching) {
    const { grade, subject, subjectLabel, teacherName, teacherId } = d.data();
    const label = subjectLabel || subject;
    console.log(`  • [${d.id}]  ${grade} / ${label}  (teacherId: ${teacherId})`);
    toDelete.push({
      ref: d.ref,
      year,
      docId: d.id,
      grade,
      teacherId,
    });
    totalDocs++;
  }
  console.log('');
}

// 3. Buscar usuarios placeholder sin_docente_*_b_* en `users`
const usersSnap = await db.collection('users').get();
const EXCLUIR_SLUGS = new Set(['kinder_b', 'pre_kinder_b']);
const placeholderUsers = usersSnap.docs.filter(d => {
  if (!isSinDocente(d.id)) return false;
  // sin_docente_<grade_slug>_<subject_slug>  →  extraer grade_slug
  // ej: sin_docente_1_b_lenguaje → grade_slug candidato: "1_b"
  const withoutPrefix = d.id.replace(/^sin_docente_/, '');
  // El grade_slug termina en "_b" antes del siguiente segmento de asignatura
  const match = withoutPrefix.match(/^(.+_b)_[^_]+/);
  if (!match) return false;
  const gradeSlug = match[1];
  return !EXCLUIR_SLUGS.has(gradeSlug);
});

if (placeholderUsers.length > 0) {
  console.log(`=== Usuarios placeholder (users/) — ${placeholderUsers.length} a eliminar ===`);
  for (const u of placeholderUsers) {
    console.log(`  • [${u.id}]  "${u.data().name || u.data().displayName || ''}"`);
  }
  console.log('');
}

// 4. Resumen
const totalUsers = placeholderUsers.length;
console.log(`Total a eliminar: ${totalDocs} doc(s) de coverage + ${totalUsers} usuario(s) placeholder`);

if (totalDocs === 0 && totalUsers === 0) {
  console.log('\nNada que eliminar. ¿Ya está limpio?');
  process.exit(0);
}

if (DRY_RUN) {
  console.log('\n[DRY-RUN] Sin cambios. Vuelve a correr sin --dry-run para eliminar.');
  process.exit(0);
}

// 5. Eliminar en lotes de 500 (límite de Firestore)
console.log('\nEliminando...');

const BATCH_SIZE = 500;
const allRefs = [
  ...toDelete.map(d => d.ref),
  ...placeholderUsers.map(u => u.ref),
];

for (let i = 0; i < allRefs.length; i += BATCH_SIZE) {
  const batch = db.batch();
  allRefs.slice(i, i + BATCH_SIZE).forEach(ref => batch.delete(ref));
  await batch.commit();
  console.log(`  ✓ Lote ${Math.floor(i / BATCH_SIZE) + 1} eliminado (${Math.min(i + BATCH_SIZE, allRefs.length)}/${allRefs.length})`);
}

console.log(`\n✅ Listo. Eliminados ${totalDocs} registro(s) de cobertura y ${totalUsers} usuario(s) placeholder.`);
process.exit(0);

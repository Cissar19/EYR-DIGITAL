/**
 * cleanup_users_sin_email.mjs
 * ───────────────────────────
 * 1. Detecta usuarios placeholder en `users` (sin email, id = placeholder_*).
 * 2. Matchea cada uno con el usuario real (mismo primer nombre + ambos apellidos).
 * 3. Migra referencias en colecciones operativas Y en coverage.
 * 4. Elimina el documento placeholder.
 *
 * Uso:
 *   node scripts/cleanup_users_sin_email.mjs             # solo diagnóstico
 *   node scripts/cleanup_users_sin_email.mjs --migrate   # migra + elimina
 *
 * Requisitos:
 *   scripts/serviceAccountKey.json
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE  = join(__dirname, 'serviceAccountKey.json');
const MIGRATE   = process.argv.includes('--migrate');

if (!existsSync(KEY_FILE)) {
  console.error(`❌ No encontré ${KEY_FILE}`);
  process.exit(1);
}

initializeApp({ credential: cert(KEY_FILE) });
const db = getFirestore();

// ─── Normalización ────────────────────────────────────────────────────────────

const norm = s =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/**
 * Extrae clave de matching chilena: primer_nombre + apellido_paterno + apellido_materno.
 * Ignora segundos nombres (posición 1 cuando hay 4+ tokens).
 * "Juan Ricardo Figueroa Huinca" → "juan figueroa huinca"
 * "Juan Figueroa Huinca"         → "juan figueroa huinca"
 */
function nameKey(fullName) {
  const tokens = norm(fullName).split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return tokens.join(' ');
  if (tokens.length === 3) return tokens.join(' ');           // ya es primernombre+2apellidos
  // 4+ tokens: tomar primero + últimos dos
  return [tokens[0], tokens[tokens.length - 2], tokens[tokens.length - 1]].join(' ');
}

// ─── Colecciones/campos con refs de usuario ───────────────────────────────────

const SIMPLE_REFS = [
  { col: 'admin_requests',           field: 'userId' },
  { col: 'replacement_logs',         field: 'absentId' },
  { col: 'replacement_logs',         field: 'replacementId' },
  { col: 'replacement_logs',         field: 'assignedBy' },
  { col: 'agenda_noticias',          field: 'docenteId' },
  { col: 'agenda_contenido',         field: 'docenteId' },
  { col: 'medical_leaves',           field: 'userId' },
  { col: 'tasks',                    field: 'createdBy' },
  { col: 'tasks',                    field: 'assignedTo' },
  { col: 'todos',                    field: 'userId' },
  { col: 'workshops',                field: 'createdBy' },
  { col: 'lab_reservations',         field: 'userId' },
  { col: 'print_requests',           field: 'userId' },
  { col: 'equipment_requests',       field: 'userId' },
  { col: 'convivencia_reservations', field: 'userId' },
  { col: 'convivencia_blocks',       field: 'blockedBy' },
  { col: 'tickets',                  field: 'userId' },
  { col: 'entrevistas',              field: 'registeredBy' },
  { col: 'justificatives',           field: 'registeredBy' },
  { col: 'incentivo_transacciones',  field: 'registradoPorId' },
];

const DOC_ID_COLS = ['schedules', 'admin_metrics'];

// ─── Helpers de migración ─────────────────────────────────────────────────────

async function migrateField(col, field, oldId, newId) {
  const snap = await db.collection(col).where(field, '==', oldId).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { [field]: newId }));
  await batch.commit();
  return snap.size;
}

async function migrateDocId(col, oldId, newId) {
  const oldRef = db.collection(col).doc(oldId);
  const oldSnap = await oldRef.get();
  if (!oldSnap.exists) return null;
  const newRef = db.collection(col).doc(newId);
  const newSnap = await newRef.get();
  if (newSnap.exists) {
    await oldRef.delete();
    return 'dup_deleted';
  }
  await db.runTransaction(async t => { t.set(newRef, oldSnap.data()); t.delete(oldRef); });
  return 'moved';
}

async function migrateCoverage(oldId, newId, newName) {
  // Buscar en todos los años: schools/eyr/academicYears/*/coverage where teacherId == oldId
  const yearsSnap = await db.collection('schools').doc('eyr')
    .collection('academicYears').get();

  let total = 0;
  for (const yearDoc of yearsSnap.docs) {
    const coverageSnap = await yearDoc.ref.collection('coverage')
      .where('teacherId', '==', oldId).get();
    if (coverageSnap.empty) continue;
    const batch = db.batch();
    coverageSnap.docs.forEach(d =>
      batch.update(d.ref, { teacherId: newId, teacherName: newName })
    );
    await batch.commit();
    total += coverageSnap.size;
  }
  return total;
}

// ─── 1. Cargar usuarios ───────────────────────────────────────────────────────

console.log('\n📋 Cargando colección users …');
const snapshot = await db.collection('users').get();
const all      = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
const conEmail = all.filter(u => u.email && u.email.trim() !== '');
const sinEmail = all.filter(u => !u.email || u.email.trim() === '');

console.log(`   ${all.length} total | ${conEmail.length} con email | ${sinEmail.length} sin email\n`);

if (sinEmail.length === 0) {
  console.log('✅ No hay documentos sin email. Todo limpio.');
  process.exit(0);
}

// Índice de usuarios reales por clave de nombre
const realByKey = new Map();
for (const u of conEmail) {
  const k = nameKey(u.name);
  if (k) realByKey.set(k, u);
}

// ─── 2. Matchear ──────────────────────────────────────────────────────────────

const sinDocente = sinEmail.filter(u => u.id.startsWith('sin_docente_'));
const placeholders = sinEmail.filter(u => !u.id.startsWith('sin_docente_'));

const conMatch    = [];
const sinMatch    = [];

for (const u of placeholders) {
  const k = nameKey(u.name);
  const real = realByKey.get(k) ?? null;
  if (real) conMatch.push({ placeholder: u, real });
  else       sinMatch.push(u);
}

// ─── 3. Diagnóstico ───────────────────────────────────────────────────────────

console.log('📊 DIAGNÓSTICO\n');

if (conMatch.length) {
  console.log(`  ✅ Con match (se migrarán): ${conMatch.length}`);
  for (const { placeholder: p, real: r } of conMatch) {
    console.log(`     • "${p.name}"  [${p.id}]  →  [${r.id}]  ${r.email}`);
  }
}

if (sinMatch.length) {
  console.log(`\n  ⚠️  Sin match (se omitirán): ${sinMatch.length}`);
  for (const u of sinMatch) {
    console.log(`     • "${u.name}"  [${u.id}]`);
  }
}

if (sinDocente.length) {
  console.log(`\n  📌 "Sin docente" (vacantes — se omitirán): ${sinDocente.length}`);
  for (const u of sinDocente) {
    console.log(`     • "${u.name}"  [${u.id}]`);
  }
}

if (!MIGRATE) {
  console.log('\n💡 Para ejecutar la migración:');
  console.log('   node scripts/cleanup_users_sin_email.mjs --migrate\n');
  process.exit(0);
}

if (conMatch.length === 0) {
  console.log('\nNada que migrar.\n');
  process.exit(0);
}

// ─── 4. Migrar ────────────────────────────────────────────────────────────────

console.log('\n🔄 MIGRANDO …\n');

for (const { placeholder: p, real: r } of conMatch) {
  console.log(`\n  → "${p.name}"  [${p.id}]  ➜  [${r.id}]`);
  let total = 0;

  // Campos simples en colecciones operativas
  for (const { col, field } of SIMPLE_REFS) {
    try {
      const n = await migrateField(col, field, p.id, r.id);
      if (n > 0) { console.log(`     ✓ ${col}.${field}: ${n} doc(s)`); total += n; }
    } catch (e) {
      console.warn(`     ⚠ ${col}.${field}: ${e.message}`);
    }
  }

  // Docs donde docId == userId
  for (const col of DOC_ID_COLS) {
    try {
      const res = await migrateDocId(col, p.id, r.id);
      if (res === 'moved')       { console.log(`     ✓ ${col}: doc movido a ${r.id}`); total++; }
      if (res === 'dup_deleted') { console.log(`     ✓ ${col}: duplicado eliminado`); }
    } catch (e) {
      console.warn(`     ⚠ ${col}: ${e.message}`);
    }
  }

  // Coverage curricular
  try {
    const n = await migrateCoverage(p.id, r.id, r.name);
    if (n > 0) { console.log(`     ✓ coverage: ${n} bloque(s) actualizados`); total += n; }
  } catch (e) {
    console.warn(`     ⚠ coverage: ${e.message}`);
  }

  // Eliminar placeholder de users
  await db.collection('users').doc(p.id).delete();
  console.log(`     🗑  users/${p.id} eliminado  (${total} referencia(s) migradas)`);
}

console.log(`\n✅ Migración completa. ${conMatch.length} placeholder(s) procesados.\n`);
if (sinMatch.length + sinDocente.length > 0) {
  console.log(`   Omitidos: ${sinMatch.length} sin match + ${sinDocente.length} vacantes.\n`);
}
process.exit(0);

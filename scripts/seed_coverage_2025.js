/**
 * seed_coverage_2025.js
 * ─────────────────────
 * Importa cobertura-curricular-2025.json a Firestore.
 *
 * Uso:
 *   node scripts/seed_coverage_2025.js
 *
 * Requisitos:
 *   - scripts/serviceAccountKey.json  (descárgala desde Firebase Console)
 *   - curriculum/2025/oas/ debe estar poblado (corre upload_firestore.py primero)
 *
 * Idempotente: re-correrlo no duplica ni sobreescribe docs existentes.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCHOOL_ID = 'eyr';
const YEAR      = '2025';
const KEY_FILE  = join(__dirname, 'serviceAccountKey.json');
const DATA_FILE = join(__dirname, '..', 'docs', 'cobertura-curricular-2025.json');

// Corrige variaciones de nombres entre el Excel y los usuarios en Firestore.
// Clave = nombre en el JSON, Valor = nombre canónico para buscar en users/.
const TEACHER_ALIASES = {
  'Eduardo Baeza Gónzalez': 'Eduardo Baeza González',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Normaliza "OA011" → "OA11", "OA01" → "OA01" */
function normalizeOaKey(key) {
  const m = key.match(/^OA0*(\d+)$/);
  if (!m) return key;
  return `OA${String(parseInt(m[1], 10)).padStart(2, '0')}`;
}

function normalizeOaMap(obj) {
  const result = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const norm = normalizeOaKey(k);
    if (norm !== k) process.stdout.write(`      ⚠ OA key: "${k}" → "${norm}"\n`);
    result[norm] = v;
  }
  return result;
}

function normalizeSem(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !isNaN(v)) return v;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/** Crea users/{id} como placeholder si no existe y devuelve el id. */
async function ensurePlaceholder(db, id, displayName) {
  const ref = db.collection('users').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      name: displayName,
      role: 'teacher',
      placeholder: true,
      email: null,
      uid: null,
      createdAt: new Date().toISOString(),
    });
    console.log(`  👤 Placeholder creado: users/${id} ("${displayName}")`);
  }
  return id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validaciones previas
  if (!existsSync(KEY_FILE)) {
    console.error(`❌ No encontré ${KEY_FILE}`);
    console.error('   Descárgala desde Firebase Console → Configuración → Cuentas de servicio');
    process.exit(1);
  }
  if (!existsSync(DATA_FILE)) {
    console.error(`❌ No encontré ${DATA_FILE}`);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  const serviceAccount = JSON.parse(readFileSync(KEY_FILE, 'utf-8'));

  const app = initializeApp({ credential: cert(serviceAccount) });
  const db  = getFirestore(app);

  // Pre-requisito: curriculum/2025/oas/ debe tener docs
  console.log(`\n🔍 Verificando curriculum/${YEAR}/oas/ …`);
  const oasSnap = await db
    .collection('curriculum').doc(YEAR)
    .collection('oas').limit(1).get();
  if (oasSnap.empty) {
    console.error(`❌ curriculum/${YEAR}/oas/ está vacío.`);
    console.error('   Ejecuta primero:');
    console.error('     python scripts/scrape_mineduc.py');
    console.error('     python scripts/upload_firestore.py');
    process.exit(1);
  }
  console.log('   ✅ curriculum OK\n');

  // Crear/verificar doc de año académico
  const yearDocRef = db
    .collection('schools').doc(SCHOOL_ID)
    .collection('academicYears').doc(YEAR);
  if (!(await yearDocRef.get()).exists) {
    await yearDocRef.set({ startDate: '2025-03-03', endDate: '2025-12-19', active: true });
    console.log(`📅 Creado academicYears/${YEAR}\n`);
  }

  // Cargar usuarios existentes para resolver teacherName → teacherId
  const usersSnap = await db.collection('users').get();
  /** @type {Map<string, {id: string, name: string}>} */
  const usersMap = new Map();
  for (const uDoc of usersSnap.docs) {
    const d = uDoc.data();
    if (d.name) usersMap.set(toSlug(d.name), { id: uDoc.id, name: d.name });
  }

  const coverageRef = db
    .collection('schools').doc(SCHOOL_ID)
    .collection('academicYears').doc(YEAR)
    .collection('coverage');

  let created = 0, skipped = 0, pending = 0, complete = 0;
  const warnings = [];

  console.log(`📤 Importando bloques de cobertura ${YEAR} …\n`);

  for (const [grade, gradeData] of Object.entries(rawData.grades)) {
    console.log(`  ${grade} — ${gradeData.name}`);

    for (const block of gradeData.subjects) {
      const {
        subject, subjectLabel,
        teacher: rawTeacher,
        legacyOaStatus,
        unitTracking,
        migrationStatus,
        evaluaciones,
        excelTotalBasales,
      } = block;

      // Aplicar alias y resolver teacher
      const teacherName = TEACHER_ALIASES[rawTeacher] ?? rawTeacher;
      let teacherId;

      if (!teacherName.trim()) {
        const placeholderId = `sin_docente_${toSlug(grade)}_${toSlug(subject)}`;
        teacherId = await ensurePlaceholder(db, placeholderId, `Sin docente (${grade} ${subjectLabel})`);
        warnings.push(`Sin docente asignado: ${grade} / ${subject} → placeholder "${placeholderId}"`);
      } else {
        const slug = toSlug(teacherName);
        if (usersMap.has(slug)) {
          teacherId = usersMap.get(slug).id;
        } else {
          const placeholderId = `placeholder_${slug}`;
          teacherId = await ensurePlaceholder(db, placeholderId, teacherName);
          warnings.push(`Docente no encontrado en users/: "${teacherName}" → placeholder "${placeholderId}"`);
          usersMap.set(slug, { id: teacherId, name: teacherName });
        }
      }

      // Normalizar OA keys
      const normalizedLegacy   = normalizeOaMap(legacyOaStatus);
      const normalizedTracking = {
        u1: normalizeOaMap(unitTracking.u1),
        u2: normalizeOaMap(unitTracking.u2),
        u3: normalizeOaMap(unitTracking.u3),
        u4: normalizeOaMap(unitTracking.u4),
      };

      // Normalizar evaluaciones (convierte "Pendiente" → null, etc.)
      const normalizedEv = {
        sem1: normalizeSem(evaluaciones?.sem1),
        sem2: normalizeSem(evaluaciones?.sem2),
      };

      // Validar OAs del legacyOaStatus contra el currículum oficial
      const oaDocRef = db.collection('curriculum').doc(YEAR).collection('oas');
      // (validación ligera: sólo se loguea, no aborta)
      const oasInLegacy = Object.keys(normalizedLegacy);
      // omitimos consulta por OA individual para no saturar Firestore en seed;
      // la validación detallada se puede correr por separado.

      // DocId determinístico (idempotente)
      const teacherSlug = teacherName.trim() ? toSlug(teacherName) : `sin_docente_${toSlug(grade)}_${toSlug(subject)}`;
      const docId = `${grade}_${subject}_${teacherSlug}`;

      const docRef  = coverageRef.doc(docId);
      const existing = await docRef.get();

      if (existing.exists) {
        skipped++;
        process.stdout.write(`    ⏭  ${subject} — ya existe\n`);
        continue;
      }

      await docRef.set({
        grade,
        gradeNumber:     gradeData.gradeNumber,
        subject,
        subjectLabel,
        teacherId,
        teacherName:     teacherName.trim() || `Sin docente (${grade})`,
        unitTracking:    normalizedTracking,
        legacyOaStatus:  normalizedLegacy,
        migrationStatus,
        evaluaciones:    normalizedEv,
        excelTotalBasales: excelTotalBasales ?? null,
        createdAt:  Timestamp.now(),
        updatedAt:  Timestamp.now(),
        updatedBy:  'seed_script',
      });

      created++;
      if (migrationStatus === 'pending')  pending++;
      if (migrationStatus === 'complete') complete++;
      process.stdout.write(`    ✅ ${subject} (${migrationStatus})\n`);
    }
  }

  // ─── Resumen ────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────');
  console.log(`📊 Seed cobertura ${YEAR} completado`);
  console.log(`   Creados   : ${created}`);
  console.log(`   Saltados  : ${skipped}  (ya existían — idempotente)`);
  console.log(`   Complete  : ${complete}`);
  console.log(`   Pending   : ${pending}  ← UTP debe migrar estos bloques`);

  if (warnings.length) {
    console.log(`\n⚠  Advertencias (${warnings.length}):`);
    warnings.forEach(w => console.log(`   • ${w}`));
  }

  console.log('\nPróximos pasos:');
  console.log('  1. Abre la app → Cobertura Curricular');
  console.log(`  2. Los ${pending} bloques "pending" aparecerán con banner de migración`);
  console.log('  3. UTP asigna OAs a unidades desde /admin/cobertura/migrar/:id');
  console.log('─────────────────────────────────────────────────\n');

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});

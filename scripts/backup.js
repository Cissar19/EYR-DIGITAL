/**
 * Backup completo de Firestore → Excel (.xlsx)
 *
 * Crea un archivo Excel con una hoja por colección.
 * También guarda un JSON por colección como respaldo adicional.
 *
 * Uso:
 *   node --env-file=.env scripts/backup.js
 *
 * Requisito: serviceAccountKey.json en la raíz del proyecto
 * (descárgalo desde Firebase Console → Configuración → Cuentas de servicio)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Todas las colecciones de la app
const COLLECTIONS = [
  'users',
  'students',
  'schedules',
  'evaluaciones',
  'admin_requests',
  'admin_metrics',
  'convivencia_incidents',
  'convivencia_blocks',
  'convivencia_reservations',
  'entrevistas',
  'equipment',
  'equipment_folders',
  'equipment_requests',
  'inventory',
  'inventory_categories',
  'justificatives',
  'lab_reservations',
  'medical_leaves',
  'permissions_role_defaults',
  'print_requests',
  'replacement_logs',
  'tickets',
];

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(readFileSync(join(ROOT, 'serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Carpeta de destino: backups/YYYY-MM-DD/
const today = new Date().toISOString().slice(0, 10);
const backupDir = join(ROOT, 'backups', today);
mkdirSync(backupDir, { recursive: true });

async function fetchCollection(name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
}

function flattenDoc(doc) {
  const flat = {};
  for (const [key, val] of Object.entries(doc)) {
    if (val && typeof val === 'object' && val.constructor?.name === 'Timestamp') {
      flat[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      flat[key] = JSON.stringify(val);
    } else if (Array.isArray(val)) {
      flat[key] = JSON.stringify(val);
    } else {
      flat[key] = val;
    }
  }
  return flat;
}

async function main() {
  console.log(`\n📦 Backup Firestore → ${backupDir}\n`);

  const workbook = xlsx.utils.book_new();
  let totalDocs = 0;

  for (const name of COLLECTIONS) {
    process.stdout.write(`  → ${name}... `);
    try {
      const docs = await fetchCollection(name);
      totalDocs += docs.length;

      // JSON
      writeFileSync(join(backupDir, `${name}.json`), JSON.stringify(docs, null, 2));

      // Hoja Excel
      const flatDocs = docs.map(flattenDoc);
      const sheet = xlsx.utils.json_to_sheet(flatDocs);
      xlsx.utils.book_append_sheet(workbook, sheet, name.slice(0, 31)); // max 31 chars

      console.log(`${docs.length} docs ✓`);
    } catch (err) {
      console.log(`⚠️  error: ${err.message}`);
    }
  }

  // Guardar Excel
  const excelPath = join(backupDir, `backup_${today}.xlsx`);
  xlsx.writeFile(workbook, excelPath);

  console.log(`\n✅ Backup completo`);
  console.log(`   📊 Excel:  backups/${today}/backup_${today}.xlsx`);
  console.log(`   📁 JSONs:  backups/${today}/*.json`);
  console.log(`   📄 Total:  ${totalDocs} documentos en ${COLLECTIONS.length} colecciones\n`);

  process.exit(0);
}

main().catch(err => {
  console.error('Error en backup:', err);
  process.exit(1);
});

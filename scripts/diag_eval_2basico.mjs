import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const KEY_FILE = join(dirname(fileURLToPath(import.meta.url)), 'serviceAccountKey.json');
initializeApp({ credential: cert(KEY_FILE) });
const db = getFirestore();

const snap = await db.collection('evaluaciones').get();
console.log(`Total evaluaciones: ${snap.size}\n`);

const all = snap.docs.map(d => d.data());

// Cursos únicos
const cursos = [...new Set(all.map(e => e.curso))].sort();
console.log('Cursos en evaluaciones:', cursos);

// Filtrar 2° Básico
const dos = all.filter(e => e.curso === '2° Básico');
console.log(`\n'2° Básico': ${dos.length} evaluaciones`);

const byStatus = {};
for (const e of dos) {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
}
console.log('Por status:', byStatus);

// Aprobadas con oaCodes
const aprobadas = dos.filter(e => e.status === 'approved');
console.log(`\nAprobadas: ${aprobadas.length}`);
for (const e of aprobadas.slice(0, 5)) {
    const oaCodes = (e.questions || []).map(q => q.oaCode).filter(Boolean);
    console.log(`  [${e.asignatura}] "${e.name}" — ${oaCodes.length} preguntas con oaCode`);
}

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const KEY_FILE = join(dirname(fileURLToPath(import.meta.url)), 'serviceAccountKey.json');
initializeApp({ credential: cert(KEY_FILE) });
const db = getFirestore();

const snap = await db.collection('schools/eyr/academicYears/2026/coverage').get();
console.log(`Total bloques 2026: ${snap.size}\n`);

// Agrupar por grade → subjects
const byGrade = {};
for (const d of snap.docs) {
    const { grade, subject, migrationStatus, excelTotalBasales, unitTracking, legacyOaStatus } = d.data();
    if (!byGrade[grade]) byGrade[grade] = [];

    let pct = 0;
    if (migrationStatus === 'complete' && unitTracking && excelTotalBasales) {
        const pasados = new Set(
            ['u1','u2','u3','u4'].flatMap(u =>
                Object.entries(unitTracking[u] || {}).filter(([,v]) => v).map(([k]) => k)
            )
        ).size;
        pct = excelTotalBasales ? Math.round(pasados / excelTotalBasales * 100) : 0;
    } else if (legacyOaStatus && excelTotalBasales) {
        const pasados = Object.values(legacyOaStatus).filter(Boolean).length;
        pct = Math.round(pasados / excelTotalBasales * 100);
    }

    byGrade[grade].push({ subject, pct });
}

for (const [grade, subjects] of Object.entries(byGrade).sort()) {
    const avg = Math.round(subjects.reduce((a, s) => a + s.pct, 0) / subjects.length);
    console.log(`  ${grade}  (${subjects.length} asig, promedio ${avg}%):`);
    for (const s of subjects.sort((a,b) => a.subject.localeCompare(b.subject))) {
        console.log(`    ${s.subject.padEnd(22)} ${s.pct}%`);
    }
}

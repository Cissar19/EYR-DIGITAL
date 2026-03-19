import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import XLSX from 'xlsx';
import { resolve } from 'path';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

function normalize(str) {
  if (!str) return '';
  return str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Build teacher keys (same logic as attendanceParser.js)
function buildTeacherKeys(name) {
  const parts = name.trim().split(/\s+/);
  const keys = [];
  if (parts.length >= 3) {
    const paternal = normalize(parts[parts.length - 2]);
    const maternal = normalize(parts[parts.length - 1]);
    const firstName = normalize(parts[0]);
    keys.push(`${firstName}|${paternal}|${maternal}`);
    keys.push(`${paternal}|${maternal}`);
    keys.push(`${firstName}|${paternal}`);
  } else if (parts.length === 2) {
    keys.push(`${normalize(parts[0])}|${normalize(parts[1])}`);
  }
  return keys;
}

// Read marks Excel
const EXCEL_PATH = resolve(process.env.HOME, 'Desktop', 'EYR reporteDeMarcas_2026-02-16_2026-03-15_20260317074745.xlsx');
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Get unique people from marks
const markPeople = new Map();
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const firstName = (row[2] || '').toString().trim();
  const paternal = (row[3] || '').toString().trim();
  const maternal = (row[4] || '').toString().trim();
  const fullName = [firstName, paternal, maternal].filter(Boolean).join(' ');
  if (!fullName) continue;
  if (!markPeople.has(fullName)) {
    markPeople.set(fullName, { firstName, paternal, maternal, count: 0 });
  }
  markPeople.get(fullName).count++;
}

// Get teacher_hours from Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
const snap = await getDocs(collection(db, 'teacher_hours'));

const teacherByKey = new Map();
const teacherNames = [];
snap.forEach(doc => {
  const d = doc.data();
  if (!d.name) return;
  teacherNames.push(d.name);
  const keys = buildTeacherKeys(d.name);
  for (const key of keys) {
    if (!teacherByKey.has(key)) {
      teacherByKey.set(key, d.name);
    }
  }
});

console.log(`teacher_hours: ${teacherNames.length} registros`);
console.log(`Marcas: ${markPeople.size} personas únicas\n`);

const matched = [];
const unmatched = [];

for (const [fullName, info] of markPeople) {
  const fn = normalize(info.firstName);
  const pat = normalize(info.paternal);
  const mat = normalize(info.maternal);

  const exact = `${fn}|${pat}|${mat}`;
  const primary = `${pat}|${mat}`;
  const fallback = `${fn}|${pat}`;

  const match = teacherByKey.get(exact) || teacherByKey.get(primary) || teacherByKey.get(fallback);

  if (match) {
    matched.push({ markName: fullName, teacherName: match, key: teacherByKey.has(exact) ? 'exact' : teacherByKey.has(primary) ? 'primary' : 'fallback' });
  } else {
    unmatched.push({ markName: fullName, firstName: fn, paternal: pat, maternal: mat, marks: info.count,
      triedKeys: [exact, primary, fallback] });
  }
}

console.log(`✅ MATCHED (${matched.length}):`);
matched.forEach(m => console.log(`  ${m.markName} → ${m.teacherName} [${m.key}]`));

console.log(`\n❌ UNMATCHED (${unmatched.length}):`);
unmatched.forEach(u => {
  console.log(`  ${u.markName} (${u.marks} marcas)`);
  console.log(`    Keys probadas: ${u.triedKeys.join(' / ')}`);
});

await deleteApp(app);
process.exit(0);

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

const SURNAME_PARTICLES = new Set(['de', 'del', 'de la', 'los', 'las', 'lo', 'la']);

function buildTeacherKeys(name) {
  const parts = name.trim().split(/\s+/);
  const keys = [];
  if (parts.length >= 3) {
    let paternal = normalize(parts[parts.length - 2]);
    const maternal = normalize(parts[parts.length - 1]);
    const firstName = normalize(parts[0]);
    if (parts.length >= 4) {
      const maybeParticle = normalize(parts[parts.length - 3]);
      if (SURNAME_PARTICLES.has(maybeParticle)) {
        const compoundPaternal = `${maybeParticle} ${paternal}`;
        keys.push(`${firstName}|${compoundPaternal}|${maternal}`);
        keys.push(`${compoundPaternal}|${maternal}`);
      }
    }
    keys.push(`${firstName}|${paternal}|${maternal}`);
    keys.push(`${paternal}|${maternal}`);
    keys.push(`${firstName}|${paternal}`);
  } else if (parts.length === 2) {
    keys.push(`${normalize(parts[0])}|${normalize(parts[1])}`);
  }
  return keys;
}

const DAY_MAP = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' };

// Read marks
const EXCEL_PATH = resolve(process.env.HOME, 'Desktop', 'EYR reporteDeMarcas_2026-02-16_2026-03-15_20260317074745.xlsx');
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Parse marks
const marks = [];
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const firstName = (row[2] || '').toString().trim();
  const paternal = (row[3] || '').toString().trim();
  const maternal = (row[4] || '').toString().trim();
  const dateStr = (row[7] || '').toString().trim();
  const direction = (row[9] || '').toString().trim().toUpperCase();
  if (!firstName || !dateStr) continue;
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) continue;
  const [d, m, y] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  const dk = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  marks.push({ firstName, paternal, maternal, date, dateStr: dk, direction: direction === 'ENTRADA' ? 'ENTRADA' : 'SALIDA' });
}

// Get date range
const allDates = marks.map(m => m.date);
const minDate = new Date(Math.min(...allDates));
const maxDate = new Date(Math.max(...allDates));

// Generate all weekdays
const allWeekdays = [];
const cur = new Date(minDate);
while (cur <= maxDate) {
  if (cur.getDay() >= 1 && cur.getDay() <= 5) allWeekdays.push(new Date(cur));
  cur.setDate(cur.getDate() + 1);
}

// Get teacher_hours
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
const snap = await getDocs(collection(db, 'teacher_hours'));

const teachers = [];
const teacherByKey = new Map();
snap.forEach(doc => {
  const d = doc.data();
  if (!d.name || !d.schedule) return;
  teachers.push(d);
  const keys = buildTeacherKeys(d.name);
  for (const key of keys) {
    if (!teacherByKey.has(key)) teacherByKey.set(key, d);
  }
});

// Match marks to teachers
const personDayMap = new Map();
for (const mark of marks) {
  const fn = normalize(mark.firstName);
  const pat = normalize(mark.paternal);
  const mat = normalize(mark.maternal);
  const exact = `${fn}|${pat}|${mat}`;
  const primary = `${pat}|${mat}`;
  const fallback = `${fn}|${pat}`;
  const teacher = teacherByKey.get(exact) || teacherByKey.get(primary) || teacherByKey.get(fallback);
  if (!teacher) continue;
  const groupKey = `${teacher.name}|${mark.dateStr}`;
  if (!personDayMap.has(groupKey)) personDayMap.set(groupKey, { teacher, marks: [] });
  personDayMap.get(groupKey).marks.push(mark);
}

// Count absences per teacher
const teacherAbsences = new Map();
const teacherMarkDays = new Map();

for (const teacher of teachers) {
  teacherAbsences.set(teacher.name, []);
  teacherMarkDays.set(teacher.name, 0);
}

// Count mark days
for (const [key] of personDayMap) {
  const name = key.split('|')[0];
  teacherMarkDays.set(name, (teacherMarkDays.get(name) || 0) + 1);
}

// Find absences
for (const teacher of teachers) {
  for (const weekday of allWeekdays) {
    const dayKey = DAY_MAP[weekday.getDay()];
    const sched = teacher.schedule?.[dayKey];
    if (!sched?.entry) continue;
    const dk = `${weekday.getFullYear()}-${String(weekday.getMonth()+1).padStart(2,'0')}-${String(weekday.getDate()).padStart(2,'0')}`;
    const groupKey = `${teacher.name}|${dk}`;
    if (!personDayMap.has(groupKey)) {
      teacherAbsences.get(teacher.name)?.push(dk);
    }
  }
}

// Report
console.log(`Rango: ${minDate.toLocaleDateString('es-CL')} — ${maxDate.toLocaleDateString('es-CL')}`);
console.log(`Días hábiles: ${allWeekdays.length}`);
console.log(`Funcionarios en teacher_hours: ${teachers.length}\n`);

// Sort by absences descending
const sorted = teachers
  .map(t => ({
    name: t.name,
    markDays: teacherMarkDays.get(t.name) || 0,
    absences: teacherAbsences.get(t.name) || [],
    scheduleDays: Object.values(t.schedule).filter(v => v?.entry).length,
  }))
  .sort((a, b) => b.absences.length - a.absences.length);

console.log('=== FUNCIONARIOS CON MUCHAS AUSENCIAS (>5) ===\n');
for (const t of sorted) {
  if (t.absences.length <= 5) continue;
  const firstMark = [...personDayMap.keys()]
    .filter(k => k.startsWith(t.name + '|'))
    .map(k => k.split('|')[1])
    .sort()[0] || 'sin marcas';
  console.log(`${t.name}`);
  console.log(`  Días con marca: ${t.markDays} | Ausencias: ${t.absences.length} | Horario: ${t.scheduleDays} días/sem`);
  console.log(`  Primera marca: ${firstMark}`);
  if (t.markDays === 0) {
    console.log(`  ⚠️  SIN MARCAS EN TODO EL PERIODO — posible licencia/no trabaja aún`);
  } else if (t.absences.length > 10) {
    const absDates = t.absences.sort();
    console.log(`  Primeras ausencias: ${absDates.slice(0,5).join(', ')}...`);
    console.log(`  Últimas ausencias:  ${absDates.slice(-3).join(', ')}`);
  }
  console.log('');
}

console.log('\n=== RESUMEN TODOS ===\n');
console.log('Nombre | Marcas | Ausencias | Horario días/sem');
console.log('-'.repeat(70));
for (const t of sorted) {
  const flag = t.markDays === 0 ? ' ⚠️ SIN MARCAS' : t.absences.length > 15 ? ' ⚡' : '';
  console.log(`${t.name} | ${t.markDays} | ${t.absences.length} | ${t.scheduleDays}${flag}`);
}

await deleteApp(app);
process.exit(0);

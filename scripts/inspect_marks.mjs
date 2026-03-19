import XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const EXCEL_PATH = resolve(process.env.HOME, 'Desktop', 'EYR reporteDeMarcas_2026-02-16_2026-03-15_20260317074745.xlsx');
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Headers:', data[0]);
console.log('\nPrimeras 5 filas:');
for (let i = 1; i <= 5 && i < data.length; i++) {
    console.log(`  Fila ${i}:`, data[i]);
}

// Unique people
const people = new Set();
for (let i = 1; i < data.length; i++) {
    const name = [data[i][2], data[i][3], data[i][4]].filter(Boolean).join(' ');
    if (name.trim()) people.add(name.trim());
}
console.log(`\nTotal filas: ${data.length - 1}`);
console.log(`Personas únicas: ${people.size}`);
console.log('\nLista:');
[...people].sort().forEach(p => console.log(`  - ${p}`));

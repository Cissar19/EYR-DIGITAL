import XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const EXCEL_PATH = resolve(process.env.HOME, 'Desktop', 'DISTRIBUCIÓN HORARIA ASISTENTES 2026.xlsx');
const wb = XLSX.readFile(EXCEL_PATH);

console.log('Hojas:', wb.SheetNames);

for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`\n=== Hoja: "${sheetName}" (${data.length} filas) ===`);
    for (let i = 0; i < Math.min(10, data.length); i++) {
        console.log(`  Fila ${i}:`, data[i]);
    }
}

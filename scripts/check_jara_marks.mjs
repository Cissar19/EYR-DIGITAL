import XLSX from 'xlsx';
import { resolve } from 'path';

const EXCEL_PATH = resolve(process.env.HOME, 'Desktop', 'EYR reporteDeMarcas_2026-02-16_2026-03-15_20260317074745.xlsx');
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Marcas de JARA:');
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const paternal = (row[3] || '').toString().trim();
  if (paternal.toUpperCase() === 'JARA') {
    console.log(`  ${row[7]} | ${row[8]} | ${row[9]} | nombre=${row[2]} ${row[3]} ${row[4]}`);
  }
}

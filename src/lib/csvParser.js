/**
 * CSV Parser for SIGE student data imports.
 * - Auto-detects separator (;, ,, \t)
 * - Validates Chilean RUT (modulo-11)
 * - Flexible header mapping for SIGE exports
 * - Handles UTF-8 BOM
 */

// ── Chilean RUT validation (modulo-11) ──

function cleanRut(rut) {
    if (!rut || typeof rut !== 'string') return '';
    return rut.replace(/[.\s-]/g, '').toUpperCase().trim();
}

function validateRut(rut) {
    const clean = cleanRut(rut);
    if (clean.length < 2) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    if (!/^\d+$/.test(body)) return false;
    if (!/^[\dK]$/.test(dv)) return false;

    let sum = 0;
    let mul = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i], 10) * mul;
        mul = mul === 7 ? 2 : mul + 1;
    }
    const remainder = 11 - (sum % 11);
    const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);

    return dv === expected;
}

export function formatRut(rut) {
    const clean = cleanRut(rut);
    if (clean.length < 2) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted}-${dv}`;
}

// ── Header mapping (SIGE exports use varied column names) ──

const HEADER_MAP = {
    // RUT
    'rut': 'rut',
    'run': 'rut',
    'rut alumno': 'rut',
    'run alumno': 'rut',
    // First name
    'nombres': 'firstName',
    'nombre': 'firstName',
    'primer nombre': 'firstName',
    'first name': 'firstName',
    // Paternal last name
    'apellido paterno': 'paternalLastName',
    'ap paterno': 'paternalLastName',
    'paterno': 'paternalLastName',
    // Maternal last name
    'apellido materno': 'maternalLastName',
    'ap materno': 'maternalLastName',
    'materno': 'maternalLastName',
    // Full name (some exports combine it)
    'nombre completo': 'fullName',
    'alumno': 'fullName',
    // Curso
    'curso': 'curso',
    'grado': 'curso',
    'nivel': 'curso',
    // Birth date
    'fecha nacimiento': 'birthDate',
    'fecha de nacimiento': 'birthDate',
    'fec. nacimiento': 'birthDate',
    'nacimiento': 'birthDate',
    // Guardian
    'apoderado': 'guardianName',
    'nombre apoderado': 'guardianName',
    'tutor': 'guardianName',
    'telefono apoderado': 'guardianPhone',
    'telefono': 'guardianPhone',
    'celular apoderado': 'guardianPhone',
    'email apoderado': 'guardianEmail',
    'correo apoderado': 'guardianEmail',
};

function normalizeHeader(h) {
    return h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function mapHeaders(headers) {
    const mapping = {};
    headers.forEach((h, i) => {
        const norm = normalizeHeader(h);
        const mapped = HEADER_MAP[norm];
        if (mapped) mapping[i] = mapped;
    });
    return mapping;
}

// ── CSV Parsing ──

function stripBOM(text) {
    return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

function detectSeparator(firstLine) {
    const candidates = [';', ',', '\t'];
    let best = ',';
    let maxCount = 0;
    for (const sep of candidates) {
        const count = (firstLine.match(new RegExp(sep === '\t' ? '\t' : `\\${sep}`, 'g')) || []).length;
        if (count > maxCount) {
            maxCount = count;
            best = sep;
        }
    }
    return best;
}

function parseLine(line, separator) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === separator) {
                fields.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
    }
    fields.push(current.trim());
    return fields;
}

/**
 * Parse CSV text into student records.
 * @param {string} text - Raw CSV content
 * @returns {{ students: Array, errors: Array, headers: string[] }}
 */
export function parseCSV(text) {
    const clean = stripBOM(text);
    const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);

    if (lines.length < 2) {
        return { students: [], errors: ['El archivo esta vacio o no tiene datos'], headers: [] };
    }

    const separator = detectSeparator(lines[0]);
    const rawHeaders = parseLine(lines[0], separator);
    const headerMapping = mapHeaders(rawHeaders);

    if (!Object.values(headerMapping).includes('rut')) {
        return { students: [], errors: ['No se encontro columna de RUT en el CSV'], headers: rawHeaders };
    }

    const students = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseLine(lines[i], separator);
        const row = {};

        Object.entries(headerMapping).forEach(([colIndex, fieldName]) => {
            row[fieldName] = fields[parseInt(colIndex)] || '';
        });

        // Build full name if not provided
        if (!row.fullName && (row.firstName || row.paternalLastName)) {
            row.fullName = [row.firstName, row.paternalLastName, row.maternalLastName]
                .filter(Boolean)
                .join(' ');
        }

        // Validate RUT
        const rawRut = row.rut;
        if (!rawRut) {
            errors.push(`Fila ${i + 1}: RUT vacio`);
            continue;
        }

        if (!validateRut(rawRut)) {
            errors.push(`Fila ${i + 1}: RUT invalido (${rawRut})`);
            continue;
        }

        const formattedRut = formatRut(rawRut);

        students.push({
            rut: formattedRut,
            firstName: row.firstName || '',
            paternalLastName: row.paternalLastName || '',
            maternalLastName: row.maternalLastName || '',
            fullName: row.fullName || '',
            curso: row.curso || '',
            birthDate: row.birthDate || '',
            guardianName: row.guardianName || '',
            guardianPhone: row.guardianPhone || '',
            guardianEmail: row.guardianEmail || '',
        });
    }

    return { students, errors, headers: rawHeaders };
}

export { validateRut, cleanRut };

/**
 * Parser for attendance clock Excel files + tardiness calculation engine.
 *
 * Expected Excel columns:
 *   IDMARCA, RUT, NOMBRE, APELLIDO PATERNO, APELLIDO MATERNO, UNIDAD, PUESTO,
 *   FECHA MARCA (DD-MM-YYYY), HORA MARCA (HH:MM:SS), SENTIDO MARCA (ENTRADA/SALIDA),
 *   TURNO ASOCIADO, HP INICIO TURNO, HP TERMINO TURNO
 */
import * as XLSX from 'xlsx';

// ── Helpers ──

const DAY_MAP = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado',
};

const DAY_LABELS = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
};

/** Normalize string for comparison: lowercase, strip accents, trim */
function normalize(str) {
    if (!str) return '';
    return str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Parse "HH:MM" or "HH:MM:SS" to total minutes */
function timeToMinutes(t) {
    if (!t) return null;
    const parts = t.toString().trim().split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
}

/** Format minutes back to "HH:MM" */
function minutesToTime(mins) {
    if (mins == null) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse "DD-MM-YYYY" to a Date object (local time) */
function parseDateDMY(str) {
    if (!str) return null;
    const clean = str.toString().trim();
    const parts = clean.split(/[-/]/);
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
}

/** Format Date to "DD/MM/YYYY" */
function formatDate(date) {
    if (!date) return '-';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${date.getFullYear()}`;
}

/** Get "YYYY-MM-DD" key from Date for grouping */
function dateKey(date) {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ── Header mapping (flexible column names) ──

const HEADER_MAP = {
    'idmarca': 'id',
    'rut': 'rut',
    'nombre': 'firstName',
    'apellido paterno': 'paternalLastName',
    'apellido materno': 'maternalLastName',
    'unidad': 'unit',
    'puesto': 'position',
    'fecha marca': 'date',
    'fecha': 'date',
    'hora marca': 'time',
    'hora': 'time',
    'sentido marca': 'direction',
    'sentido': 'direction',
};

function normalizeHeader(h) {
    return h.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// ── Excel Parser ──

/**
 * Parse attendance Excel (ArrayBuffer) into raw mark records.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ marks: Array, errors: string[] }}
 */
export function parseAttendanceExcel(arrayBuffer) {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return { marks: [], errors: ['El archivo no contiene hojas de datos'] };

    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (raw.length < 2) return { marks: [], errors: ['El archivo está vacío o no tiene datos'] };

    // Map headers
    const headers = raw[0].map(h => normalizeHeader(h));
    const colMap = {};
    headers.forEach((h, i) => {
        if (HEADER_MAP[h]) colMap[HEADER_MAP[h]] = i;
    });

    // Validate required columns
    const required = ['firstName', 'paternalLastName', 'date', 'time', 'direction'];
    const missing = required.filter(f => colMap[f] === undefined);
    if (missing.length > 0) {
        return {
            marks: [],
            errors: [`Columnas faltantes: ${missing.join(', ')}. Columnas encontradas: ${raw[0].join(', ')}`],
        };
    }

    const marks = [];
    const errors = [];

    for (let i = 1; i < raw.length; i++) {
        const row = raw[i];
        if (!row || row.every(c => !c)) continue; // skip empty rows

        const firstName = (row[colMap.firstName] || '').toString().trim();
        const paternalLastName = (row[colMap.paternalLastName] || '').toString().trim();
        const maternalLastName = colMap.maternalLastName !== undefined
            ? (row[colMap.maternalLastName] || '').toString().trim()
            : '';
        const dateStr = (row[colMap.date] || '').toString().trim();
        const timeStr = (row[colMap.time] || '').toString().trim();
        const direction = (row[colMap.direction] || '').toString().trim().toUpperCase();

        if (!firstName && !paternalLastName) continue;
        if (!dateStr || !timeStr) {
            errors.push(`Fila ${i + 1}: fecha u hora vacía`);
            continue;
        }

        const date = parseDateDMY(dateStr);
        if (!date) {
            errors.push(`Fila ${i + 1}: fecha inválida "${dateStr}"`);
            continue;
        }

        marks.push({
            rut: colMap.rut !== undefined ? (row[colMap.rut] || '').toString().trim() : '',
            firstName,
            paternalLastName,
            maternalLastName,
            date,
            dateStr: dateKey(date),
            time: timeStr,
            timeMinutes: timeToMinutes(timeStr),
            direction: direction === 'ENTRADA' ? 'ENTRADA' : direction === 'SALIDA' ? 'SALIDA' : direction,
        });
    }

    return { marks, errors };
}

// ── Matching Engine ──

/**
 * Build a matching key from teacher_hours name.
 * teacher_hours.name is like "Daniela Paz Alvarado Vera"
 * We try to extract last two words as paternalLastName + maternalLastName.
 */
const SURNAME_PARTICLES = new Set(['de', 'del', 'de la', 'los', 'las', 'lo', 'la']);

function buildTeacherKeys(teacher) {
    const parts = teacher.name.trim().split(/\s+/);
    const keys = [];

    if (parts.length >= 3) {
        let paternal = normalize(parts[parts.length - 2]);
        const maternal = normalize(parts[parts.length - 1]);
        const firstName = normalize(parts[0]);

        // Check if word before paternal is a particle (e.g. "De Nordenflycht")
        if (parts.length >= 4) {
            const maybeParticle = normalize(parts[parts.length - 3]);
            if (SURNAME_PARTICLES.has(maybeParticle)) {
                const compoundPaternal = `${maybeParticle} ${paternal}`;
                keys.push(`${firstName}|${compoundPaternal}|${maternal}`);
                keys.push(`${compoundPaternal}|${maternal}`);
            }
        }

        // Most specific: firstName + paternal + maternal
        keys.push(`${firstName}|${paternal}|${maternal}`);

        // Fallback: paternal + maternal (may collide for same-surname families)
        keys.push(`${paternal}|${maternal}`);

        // Fallback: first name + paternal
        keys.push(`${firstName}|${paternal}`);
    } else if (parts.length === 2) {
        keys.push(`${normalize(parts[0])}|${normalize(parts[1])}`);
    }

    return keys;
}

function buildMarkPersonKey(mark) {
    const paternal = normalize(mark.paternalLastName);
    const maternal = normalize(mark.maternalLastName);
    const firstName = normalize(mark.firstName);

    return {
        exact: `${firstName}|${paternal}|${maternal}`,
        primary: `${paternal}|${maternal}`,
        fallback: `${firstName}|${paternal}`,
    };
}

// ── Main Processing ──

/**
 * Process attendance marks against expected schedules.
 * @param {Array} marks - From parseAttendanceExcel
 * @param {Array} teacherHours - From Firestore teacher_hours collection
 * @returns {{ summary, dailyRecords, unmatchedPeople, dateRange }}
 */
export function processAttendance(marks, teacherHours) {
    // Build teacher lookup by normalized key, tracking ambiguous keys
    const teacherByKey = new Map();
    const ambiguousKeys = new Set();
    for (const teacher of teacherHours) {
        if (!teacher.name || !teacher.schedule) continue;
        const keys = buildTeacherKeys(teacher);
        for (const key of keys) {
            if (teacherByKey.has(key)) {
                // Different teacher sharing the same key → ambiguous (e.g. siblings)
                if (teacherByKey.get(key).name !== teacher.name) {
                    ambiguousKeys.add(key);
                }
            } else {
                teacherByKey.set(key, teacher);
            }
        }
    }
    // Remove ambiguous keys to prevent siblings' marks from collapsing into one person
    for (const key of ambiguousKeys) {
        teacherByKey.delete(key);
    }

    // Group marks by person+date
    const personDayMap = new Map(); // "personKey|dateStr" -> { marks, personName, teacher }
    const personMarkCounts = new Map(); // "fullName" -> count (for unmatched tracking)
    const matchedPersons = new Set();

    for (const mark of marks) {
        const { exact, primary, fallback } = buildMarkPersonKey(mark);
        const teacher = teacherByKey.get(exact) || teacherByKey.get(primary) || teacherByKey.get(fallback);
        const fullName = [mark.firstName, mark.paternalLastName, mark.maternalLastName].filter(Boolean).join(' ');

        // Track all people for unmatched report
        personMarkCounts.set(fullName, (personMarkCounts.get(fullName) || 0) + 1);

        if (!teacher) continue;

        matchedPersons.add(fullName);
        const groupKey = `${teacher.name}|${mark.dateStr}`;

        if (!personDayMap.has(groupKey)) {
            personDayMap.set(groupKey, {
                teacher,
                personName: teacher.name,
                date: mark.date,
                dateStr: mark.dateStr,
                marks: [],
            });
        }
        personDayMap.get(groupKey).marks.push(mark);
    }

    // Determine date range from marks
    const allDates = marks.map(m => m.date).filter(Boolean);
    const minDate = allDates.length ? new Date(Math.min(...allDates)) : null;
    const maxDate = allDates.length ? new Date(Math.max(...allDates)) : null;

    // Generate all weekdays in range for absence detection
    const allWeekdayDates = [];
    if (minDate && maxDate) {
        const current = new Date(minDate);
        while (current <= maxDate) {
            const dow = current.getDay();
            if (dow >= 1 && dow <= 5) {
                allWeekdayDates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
    }

    // Process each person+day → daily records
    const dailyRecords = [];
    const teacherStats = new Map(); // teacherName -> stats

    function getOrCreateStats(name) {
        if (!teacherStats.has(name)) {
            teacherStats.set(name, {
                name,
                lateCount: 0,
                lateMinutes: 0,
                earlyExitCount: 0,
                earlyExitMinutes: 0,
                absences: 0,
            });
        }
        return teacherStats.get(name);
    }

    // Process actual marks
    for (const [, group] of personDayMap) {
        const { teacher, date, marks: dayMarks } = group;
        const dow = date.getDay();
        const dayKey = DAY_MAP[dow];

        if (!dayKey || !DAY_LABELS[dayKey]) continue; // weekend

        const expectedSchedule = teacher.schedule?.[dayKey];
        if (!expectedSchedule?.entry || !expectedSchedule?.exit) continue; // no schedule for this day

        const expectedEntryMin = timeToMinutes(expectedSchedule.entry);
        const expectedExitMin = timeToMinutes(expectedSchedule.exit);

        // First ENTRADA, last SALIDA
        const entries = dayMarks.filter(m => m.direction === 'ENTRADA').sort((a, b) => a.timeMinutes - b.timeMinutes);
        const exits = dayMarks.filter(m => m.direction === 'SALIDA').sort((a, b) => a.timeMinutes - b.timeMinutes);

        const actualEntry = entries.length > 0 ? entries[0].timeMinutes : null;
        const actualExit = exits.length > 0 ? exits[exits.length - 1].timeMinutes : null;

        const tardinessMinutes = (actualEntry != null && expectedEntryMin != null && actualEntry > expectedEntryMin)
            ? actualEntry - expectedEntryMin
            : 0;

        const earlyDepartureMinutes = (actualExit != null && expectedExitMin != null && actualExit < expectedExitMin)
            ? expectedExitMin - actualExit
            : 0;

        const stats = getOrCreateStats(teacher.name);
        if (tardinessMinutes > 0) {
            stats.lateCount++;
            stats.lateMinutes += tardinessMinutes;
        }
        if (earlyDepartureMinutes > 0) {
            stats.earlyExitCount++;
            stats.earlyExitMinutes += earlyDepartureMinutes;
        }

        dailyRecords.push({
            teacherName: teacher.name,
            date,
            dateFormatted: formatDate(date),
            dayOfWeek: DAY_LABELS[dayKey],
            expectedEntry: expectedSchedule.entry,
            actualEntry: actualEntry != null ? minutesToTime(actualEntry) : '-',
            tardinessMinutes,
            expectedExit: expectedSchedule.exit,
            actualExit: actualExit != null ? minutesToTime(actualExit) : '-',
            earlyDepartureMinutes,
            absent: false,
            marks: dayMarks,
        });
    }

    // Detect absences: teacher had schedule for a weekday but no marks.
    // Check ALL teachers in teacher_hours (not just those with marks) so that
    // teachers on medical leave or with zero marks still appear as absent.
    for (const teacher of teacherHours) {
        if (!teacher.name || !teacher.schedule) continue;

        for (const weekday of allWeekdayDates) {
            const dayKey = DAY_MAP[weekday.getDay()];
            const expectedSchedule = teacher.schedule?.[dayKey];
            if (!expectedSchedule?.entry) continue;

            const dk = dateKey(weekday);
            const groupKey = `${teacher.name}|${dk}`;
            if (personDayMap.has(groupKey)) continue; // has marks for this day

            const stats = getOrCreateStats(teacher.name);
            stats.absences++;

            dailyRecords.push({
                teacherName: teacher.name,
                date: weekday,
                dateFormatted: formatDate(weekday),
                dayOfWeek: DAY_LABELS[dayKey],
                expectedEntry: expectedSchedule.entry,
                actualEntry: '-',
                tardinessMinutes: 0,
                expectedExit: expectedSchedule.exit,
                actualExit: '-',
                earlyDepartureMinutes: 0,
                absent: true,
                marks: [],
            });
        }
    }

    // Sort daily records by date then teacher name
    dailyRecords.sort((a, b) => a.date - b.date || a.teacherName.localeCompare(b.teacherName));

    // Build summary
    const byTeacher = [...teacherStats.values()].sort((a, b) => b.lateMinutes - a.lateMinutes);

    const summary = {
        totalDays: allWeekdayDates.length,
        totalTeachers: teacherStats.size,
        totalLateEntries: byTeacher.reduce((s, t) => s + t.lateCount, 0),
        totalEarlyExits: byTeacher.reduce((s, t) => s + t.earlyExitCount, 0),
        totalAbsences: byTeacher.reduce((s, t) => s + t.absences, 0),
        byTeacher,
    };

    // Unmatched people (in marks but not in teacher_hours)
    const unmatchedPeople = [];
    for (const [name, count] of personMarkCounts) {
        if (!matchedPersons.has(name) || !matchedPersons.has(name)) {
            // Double check: was this person actually matched?
            if (matchedPersons.has(name)) continue;
            unmatchedPeople.push({ name, markCount: count });
        }
    }
    unmatchedPeople.sort((a, b) => b.markCount - a.markCount);

    return {
        summary,
        dailyRecords,
        unmatchedPeople,
        dateRange: {
            from: minDate ? formatDate(minDate) : '-',
            to: maxDate ? formatDate(maxDate) : '-',
        },
    };
}

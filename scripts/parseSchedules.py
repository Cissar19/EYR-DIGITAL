#!/usr/bin/env python3
"""
Parse teacher schedules from '2026 Horario Ernesto Yañez.xlsx'.
Reads PROFES JEFES and PROFES ASIGNATURAS sheets.
Outputs JSON to stdout and saves to parsed_schedules.json.
"""

import json, re, sys, openpyxl

EXCEL_PATH = "/Users/cisar/Downloads/2026 Horario Ernesto Yañez.xlsx"
OUTPUT_PATH = "/Users/cisar/.gemini/antigravity/scratch/school-admin-days/scripts/parsed_schedules.json"

HOMEROOM_COURSES = {
    "Marisol Molina": "1° Básico",
    "Juan Figueroa": "2° Básico",
    "Leslye Valencia": "3° Básico",
    "Manuel Astudillo": "4° Básico",
    "Pamela Olivero": "5° Básico",
    "Francisco Pérez": "6° Básico",
    "Daniela Alvarado": "7° Básico",
    "Constanza Vargas": "8° Básico",
}

NAME_CORRECTIONS = {
    "MARISOL MARISOL": "Marisol Molina",
    "MARISOL MOLINA": "Marisol Molina",
    "JUAN FIGUEROA": "Juan Figueroa",
    "LESLYE VALENCIA": "Leslye Valencia",
    "MANUEL ASTUDILLO": "Manuel Astudillo",
    "PAMELA OLIVERO": "Pamela Olivero",
    "FRANICISCO PEREZ": "Francisco Pérez",
    "FRANCISCO PEREZ": "Francisco Pérez",
    "FRANCISCO PÉREZ": "Francisco Pérez",
    "DANIELA ALVARADO": "Daniela Alvarado",
    "CONSTANZA VARGAS": "Constanza Vargas",
    "BELEN LEAL": "Belén Leal",
    "EDUARDO BAEZA": "Eduardo Baeza",
    "VIRNA CANIUPIL": "Virna Caniupil",
    "PROFESOR DE ARTES": "Filippa Leporati",
    "FILIPPA LEPORATI": "Filippa Leporati",
    "MARÍA EUGENIA FUENTES": "María Eugenia Fuentes",
    "MARIA EUGENIA FUENTES": "María Eugenia Fuentes",
    "ALVARO JARA": "Álvaro Jara",
    "ÁLVARO JARA": "Álvaro Jara",
    "CORINA CAMILO": "Corina Camilo",
    "DANIELA LOBOS": "Daniela Lobos",
    "MARIA JOSÉ SILVA": "María José Silva",
    "MARIA JOSE SILVA": "María José Silva",
    "MARÍA JOSÉ SILVA": "María José Silva",
    "MARIA JOSÉ": "María José Silva",
    "CLAUDIA PINCHEIRA": "Claudia Pincheira",
    "PROFESOR VOLANTE": "Profesor Volante",
}

DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
PIE_NAMES = {"Corina Camilo", "Daniela Lobos", "María José Silva", "Claudia Pincheira"}

# Normalize subject names to match ScheduleContext SUBJECTS_LIST
SUBJECT_MAP = {
    "LENG. Y LIT.": "Leng. y Lit.",
    "LENGUAJE": "Lenguaje",
    "MATEMAT.": "Matemática",
    "MATEMÁTICA": "Matemática",
    "HISTORIA": "Historia",
    "H. G. Y CS. S.": "H. G. y Cs. S.",
    "H. G. y Cs. S.": "H. G. y Cs. S.",
    "F. CIUDADANA": "For. Ciud.",
    "FORMA. C.": "For. Ciud.",
    "CIENCIAS": "C. Nat",
    "C. NAT": "C. Nat",
    "INGLÉS": "Inglés",
    "ARTES": "Artes",
    "MÚSICA": "Música",
    "MÚSICA/ARTE": "Música/Arte",
    "ED. FISICA": "Ed. Física",
    "Ed. Física": "Ed. Física",
    "TECNOLOGIA": "Tecnología",
    "TECNOLOGÍA": "Tecnología",
    "TECNOLÓGIA": "Tecnología",
    "ORIENTACIÓN": "Orientación",
    "Orientación": "Orientación",
    "RELIGIÓN": "Religión",
    "RELIGIÓN / FC": "Religión / FC",
    "T. LENGUAJE": "T. Lenguaje",
    "T. MATEMÁTICA": "T. Matemática",
    "TALLER LEN": "Taller Len",
    "TALLER MAT": "T. Matemática",
    "Taller ciencias": "T. Ciencias",
    "Taller CIencias": "T. Ciencias",
    "Taller Lenguaje": "T. Lenguaje",
    "Centro de estudiante": "Centro Estudiantes",
    "Coor - Javiera": "Coordinación PIE",
    "Jefatura": "Jefatura",
    "Coordinación PIE": "Coordinación PIE",
    "PAE": "PAE",
}


def normalize_subject(subj):
    if subj in SUBJECT_MAP:
        return SUBJECT_MAP[subj]
    # Try case-insensitive
    for k, v in SUBJECT_MAP.items():
        if k.upper() == subj.upper():
            return v
    return subj


def clean_name(raw):
    if not raw:
        return None
    name = raw.strip()
    # Reject time-like values ("08:00 A 08:10", "11:00 a 11:45")
    if re.match(r'^\d{2}:\d{2}\s*[Aa]\s*\d{2}:\d{2}', name):
        return None
    # Reject "RECREO", "ALMUERZO", "HORAS" etc.
    if re.match(r'^(RECREO|ALMUERZO|HORAS)', name, re.IGNORECASE):
        return None
    name = re.sub(r'\s*2026\s*$', '', name)
    name = re.sub(r'\s*\d+°\s*$', '', name)
    name = name.strip()
    upper = name.upper().strip()
    if upper in NAME_CORRECTIONS:
        return NAME_CORRECTIONS[upper]
    for key, val in NAME_CORRECTIONS.items():
        if key in upper or upper in key:
            return val
    return name


def parse_block_time(cell_value):
    if not cell_value or not isinstance(cell_value, str):
        return None
    m = re.match(r'(\d+)°\s+(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})', cell_value.strip())
    if m:
        return (int(m.group(1)), m.group(2), m.group(3))
    return None


def parse_jefatura_time(cell_value):
    if not cell_value or not isinstance(cell_value, str):
        return None
    m = re.match(r'08:00\s*[Aa]\s*08:10', cell_value.strip())
    if m:
        return ("08:00", "08:10")
    return None


SKIP_RE = [
    r'^\d+\s*[Hh]', r'^\d+\s*\(', r'^\(\d+',
    r'^RECREO', r'^ALMUERZO',
    r'^\d+°\s+\d{2}:\d{2}',
    r'^08:00\s*[Aa]\s*08:10',
    r'^HORAS$', r'^LUNES$', r'^MARTES$', r'^MIERCOLES$', r'^MIÉRCOLES$',
    r'^JUEVES$', r'^VIERNES$',
    r'^Departamento', r'^RED\s', r'^Actualizado',
    r'^\d+H\b', r'^\d+\s*HR', r'^\d+H\s*\(',
    r'^1\s*hora\s*de', r'^\d+\s*\(', r'^Constanza\s*$', r'^Belen\s*$',
    r'^\d+\s*$',
]


def is_skip(val):
    if not val or not isinstance(val, str):
        return True
    v = val.strip()
    if not v:
        return True
    for pat in SKIP_RE:
        if re.match(pat, v, re.IGNORECASE):
            return True
    return False


def parse_subject_course(val, homeroom_course=None):
    if not val or not isinstance(val, str):
        return None, None
    v = val.strip()
    if not v or is_skip(v):
        return None, None

    # Handle special entries
    if re.match(r'^JEFATURA', v, re.IGNORECASE):
        return "Jefatura", homeroom_course

    # Handle Prekinder/Kinder entries (Francisco Pérez teaches PE there)
    pk_match = re.match(r'^(Pre-?[Kk]inder|[Kk]inder)\s*([AB]?)$', v, re.IGNORECASE)
    if pk_match:
        level = pk_match.group(1).capitalize()
        suffix = pk_match.group(2).upper()
        course = f"{level} {suffix}".strip() if suffix else level
        return "Ed. Física", course

    # Extract trailing course number like "3°", "7°"
    m = re.match(r'^(.+?)\s+(\d+)°\s*$', v)
    if m:
        subject = m.group(1).strip()
        course = f"{m.group(2)}° Básico"
        return subject, course

    # No course suffix
    return v, homeroom_course


def parse_teacher_grid(ws, first_block, last_block, hours_col, day_cols,
                       teacher_name, homeroom_course=None, is_pie=False):
    blocks = []

    # Check for jefatura row (one row before first block usually)
    for check_row in range(max(1, first_block - 2), first_block):
        jef = parse_jefatura_time(ws.cell(row=check_row, column=hours_col).value)
        if jef:
            for i, dc in enumerate(day_cols):
                cv = ws.cell(row=check_row, column=dc).value
                if cv and isinstance(cv, str) and 'JEFATURA' in cv.upper():
                    blocks.append({
                        "day": DAYS[i],
                        "startTime": jef[0],
                        "subject": "Jefatura",
                        "course": homeroom_course or "",
                    })

    for row in range(first_block, last_block + 1):
        time_cell = ws.cell(row=row, column=hours_col).value
        parsed = parse_block_time(str(time_cell) if time_cell else "")
        if not parsed:
            continue

        _, start_time, end_time = parsed

        for i, dc in enumerate(day_cols):
            cv = ws.cell(row=row, column=dc).value
            if is_skip(cv):
                continue

            val = cv.strip()

            # PIE coordination blocks
            if is_pie:
                if re.match(r'(?:Coo?rdinaci[oó]n\s*(?:PIE|pie)|COOR-?\s*JAVIERA)', val, re.IGNORECASE):
                    blocks.append({
                        "day": DAYS[i],
                        "startTime": start_time,
                        "subject": "Coordinación PIE",
                        "course": "",
                    })
                    continue

            subject, course = parse_subject_course(val, homeroom_course)
            if subject:
                blocks.append({
                    "day": DAYS[i],
                    "startTime": start_time,
                    "subject": normalize_subject(subject),
                    "course": course or "",
                })

    return blocks


def find_teacher_grids(ws):
    teachers = []
    max_row = ws.max_row

    row = 1
    while row <= max_row:
        next_val1 = ws.cell(row=row + 1, column=1).value if row + 1 <= max_row else None
        next_val8 = ws.cell(row=row + 1, column=8).value if row + 1 <= max_row else None

        is_header = False
        if next_val1 and isinstance(next_val1, str) and 'HORAS' in next_val1.upper():
            is_header = True
        if next_val8 and isinstance(next_val8, str) and 'HORAS' in next_val8.upper():
            is_header = True

        if is_header:
            left_name = None
            right_name = None

            for c in [1, 3, 2]:
                v = ws.cell(row=row, column=c).value
                if v and isinstance(v, str) and len(v.strip()) > 3:
                    left_name = clean_name(v)
                    break

            for c in [8, 10, 9]:
                v = ws.cell(row=row, column=c).value
                if v and isinstance(v, str) and len(v.strip()) > 3:
                    right_name = clean_name(v)
                    break

            header_row = row + 1
            first_block = last_block = None
            for sr in range(header_row + 1, min(header_row + 20, max_row + 1)):
                for tc in [1, 8]:
                    tv = ws.cell(row=sr, column=tc).value
                    if tv and parse_block_time(str(tv)):
                        if first_block is None:
                            first_block = sr
                        last_block = sr

            if first_block and last_block:
                # Find per-side boundaries (left and right grids may differ)
                def find_side_bounds(hcol, start, end):
                    fb = lb = None
                    gap = 0
                    for sr in range(start, end + 1):
                        tv = ws.cell(row=sr, column=hcol).value
                        if tv and parse_block_time(str(tv)):
                            if fb is None:
                                fb = sr
                            lb = sr
                            gap = 0
                        else:
                            gap += 1
                            if lb is not None and gap >= 3:
                                break  # stop after 3 consecutive non-block rows
                    return fb, lb

                if left_name and left_name != "Profesor Volante":
                    lfb, llb = find_side_bounds(1, first_block, last_block)
                    if lfb and llb:
                        teachers.append({
                            'name': left_name,
                            'first_block': lfb,
                            'last_block': llb,
                            'hours_col': 1,
                            'day_cols': [2, 3, 4, 5, 6],
                        })
                if right_name and right_name != "Profesor Volante":
                    rfb, rlb = find_side_bounds(8, first_block, last_block)
                    if rfb and rlb:
                        teachers.append({
                            'name': right_name,
                            'first_block': rfb,
                            'last_block': rlb,
                            'hours_col': 8,
                            'day_cols': [9, 10, 11, 12, 13],
                        })

        row += 1

    return teachers


def main():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    all_teachers = {}

    # Parse PROFES JEFES
    ws = wb['PROFES JEFES ']
    for grid in find_teacher_grids(ws):
        name = grid['name']
        hc = HOMEROOM_COURSES.get(name)
        blocks = parse_teacher_grid(
            ws, grid['first_block'], grid['last_block'],
            grid['hours_col'], grid['day_cols'],
            name, homeroom_course=hc, is_pie=(name in PIE_NAMES),
        )
        if blocks:
            all_teachers[name] = blocks

    # Parse PROFES ASIGNATURAS
    ws2 = wb['PROFES ASIGNATURAS ']
    for grid in find_teacher_grids(ws2):
        name = grid['name']
        blocks = parse_teacher_grid(
            ws2, grid['first_block'], grid['last_block'],
            grid['hours_col'], grid['day_cols'],
            name, homeroom_course=None, is_pie=False,
        )
        if blocks:
            if name in all_teachers:
                all_teachers[name].extend(blocks)
            else:
                all_teachers[name] = blocks

    # Also parse Álvaro Jara from "Hoja 56" (he has a separate detailed grid there)
    if 'Hoja 56' in wb.sheetnames:
        ws3 = wb['Hoja 56']
        for grid in find_teacher_grids(ws3):
            name = grid['name']
            if name in PIE_NAMES:
                continue  # already parsed from PROFES JEFES
            blocks = parse_teacher_grid(
                ws3, grid['first_block'], grid['last_block'],
                grid['hours_col'], grid['day_cols'],
                name, homeroom_course=HOMEROOM_COURSES.get(name),
                is_pie=(name in PIE_NAMES),
            )
            if blocks:
                if name not in all_teachers or len(blocks) > len(all_teachers.get(name, [])):
                    all_teachers[name] = blocks

    result = []
    for name in sorted(all_teachers.keys()):
        result.append({"teacherName": name, "blocks": all_teachers[name]})

    print(f"Total teachers: {len(result)}", file=sys.stderr)
    for t in result:
        print(f"  {t['teacherName']}: {len(t['blocks'])} blocks", file=sys.stderr)

    output = json.dumps(result, ensure_ascii=False, indent=2)
    print(output)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(output)
    print(f"\nSaved to {OUTPUT_PATH}", file=sys.stderr)


if __name__ == '__main__':
    main()

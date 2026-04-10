import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Flag, FileDown, Loader2, Users, Hash, CheckSquare, Square, PenLine, X } from 'lucide-react';
import { toast } from 'sonner';
import logoUrl from '../assets/logo_eyr_pdf.jpeg';
import { useStudents } from '../context/StudentsContext';

const SCHOOL_NAME = 'Centro Educacional Ernesto Yañez Rivera';

// ── Orden canónico de cursos ──
const CURSOS_ORDER = [
    'Pre-Kinder', 'Kinder',
    '1° Básico', '2° Básico', '3° Básico', '4° Básico',
    '5° Básico', '6° Básico', '7° Básico', '8° Básico',
    'I Medio', 'II Medio', 'III Medio', 'IV Medio',
];

// ── Fuentes Montserrat desde jsDelivr ──
const FONT_BASE = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/static/';
let _fontCache = null;
let _fontLoadPromise = null;

async function _ab2b64(buffer) {
    const bytes = new Uint8Array(buffer);
    const CHUNK = 8192;
    let bin = '';
    for (let i = 0; i < bytes.length; i += CHUNK)
        bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    return btoa(bin);
}

async function _fetchFont(file) {
    const res = await fetch(FONT_BASE + file);
    if (!res.ok) throw new Error(`font 404: ${file}`);
    return _ab2b64(await res.arrayBuffer());
}

async function loadFonts() {
    if (_fontCache) return _fontCache;
    if (_fontLoadPromise) return _fontLoadPromise;
    _fontLoadPromise = Promise.all([
        _fetchFont('Montserrat-Bold.ttf'),
        _fetchFont('Montserrat-SemiBold.ttf'),
        _fetchFont('Montserrat-Italic.ttf'),
        _fetchFont('Montserrat-Black.ttf'),
    ]).then(([bold, semiBold, italic, black]) => {
        _fontCache = { bold, semiBold, italic, black };
        return _fontCache;
    });
    return _fontLoadPromise;
}

function registerFonts(doc, f) {
    doc.addFileToVFS('Mont-Bold.ttf',     f.bold);    doc.addFont('Mont-Bold.ttf',     'Mont', 'bold');
    doc.addFileToVFS('Mont-SemiBold.ttf', f.semiBold); doc.addFont('Mont-SemiBold.ttf', 'Mont', 'normal');
    doc.addFileToVFS('Mont-Italic.ttf',   f.italic);  doc.addFont('Mont-Italic.ttf',   'Mont', 'italic');
    doc.addFileToVFS('Mont-Black.ttf',    f.black);   doc.addFont('Mont-Black.ttf',    'MontBlack', 'normal');
}

// ── Logo ──
async function loadLogoBase64() {
    try {
        const res = await fetch(logoUrl);
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch { return null; }
}

// ── Tipografía dinámica ──
function fitFontSize(doc, text, maxWidth, fontName, fontStyle, fillRatio = 0.82) {
    let fs = 200;
    doc.setFont(fontName, fontStyle);
    doc.setFontSize(fs);
    const w = doc.getTextWidth(text);
    return Math.min(Math.floor(fs * ((maxWidth * fillRatio) / w)), 200);
}

function fitNameFontSize(doc, text, maxWidth, fontName) {
    const MAX = 22;
    doc.setFont(fontName, 'bold');
    doc.setFontSize(MAX);
    const w = doc.getTextWidth(text);
    return w <= maxWidth ? MAX : Math.max(9, Math.floor(MAX * (maxWidth / w)));
}

// ── Ceros ──
function formatNum(n, maxNum) {
    const digits = String(maxNum).length;
    return String(n).padStart(Math.max(digits, 3), '0');
}

// ── Generar PDF ──
async function generateBibsPDF({ startNum, title, subtitle, perPage, items }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const [logo, fonts] = await Promise.allSettled([loadLogoBase64(), loadFonts()]);

    const logoData = logo.status === 'fulfilled' ? logo.value : null;
    const hasFonts  = fonts.status === 'fulfilled';
    if (hasFonts) registerFonts(doc, fonts.value);

    const fText  = hasFonts ? 'Mont'      : 'helvetica';
    const fNum   = hasFonts ? 'MontBlack' : 'helvetica';
    const fNumSt = hasFonts ? 'normal'    : 'bold';

    const PT2MM     = 0.3528;   // 1 pt en mm
    const CAP_RATIO = 0.72;    // cap-height como fracción del font-size en mm

    const pageW = 210, pageH = 297;
    const mX = 8, mY = 8;
    const bibW = pageW - mX * 2;                                     // 194 mm
    const bibH = (pageH - mY * 2 - (perPage - 1) * 8) / perPage;

    const end      = startNum + items.length - 1;
    const nameMode = items[0]?.name !== undefined;
    const lineMode = !nameMode && items[0]?.withLines === true;

    // ── Layout pre-calculado (igual para todos los bibs) ──
    const small       = bibH < 80;
    const logoSize    = small ? 10 : 14;
    const hasSubtitle = subtitle.trim().length > 0 && !small;

    // Título
    const titleMaxFs = small ? 16 : 38;
    const titleFs    = Math.min(fitFontSize(doc, title.toUpperCase(), bibW, fText, 'bold', 0.92), titleMaxFs);
    const titleCapH  = titleFs * PT2MM * CAP_RATIO;

    // Colegio — escala al ancho, tope 20pt
    const schoolMaxFs = small ? 10 : 20;
    const schoolFs    = Math.min(fitFontSize(doc, SCHOOL_NAME, bibW, fText, 'normal', 0.90), schoolMaxFs);
    const schoolCapH  = schoolFs * PT2MM * CAP_RATIO;

    // Subtítulo — escala al ancho, tope 14pt
    const subtMaxFs  = small ? 8 : 14;
    const subtFs     = hasSubtitle
        ? Math.min(fitFontSize(doc, subtitle.trim(), bibW, fText, 'italic', 0.90), subtMaxFs)
        : 0;
    const subtCapH   = subtFs * PT2MM * CAP_RATIO;

    //  Posiciones relativas al top del bib (rX = distancia desde by)
    //  Regla: rBase = rTop + capHeight  →  top del glifo = rBase - capHeight
    const rLogoTop    = 4;
    const rLogoBot    = rLogoTop + logoSize;

    const rTitleTop   = rLogoBot + 3;
    const rTitleBase  = rTitleTop + titleCapH;

    const rSchoolTop  = rTitleBase + 3;
    const rSchoolBase = rSchoolTop + schoolCapH;

    const rSubtTop    = rSchoolBase + 2;
    const rSubtBase   = rSubtTop + subtCapH;

    const rHeaderEnd  = (hasSubtitle ? rSubtBase : rSchoolBase) + 3;  // 3 mm padding
    const headerH     = rHeaderEnd + 2;                               // 2 mm extra

    const numAreaY    = headerH;
    const numAreaH    = bibH - numAreaY;

    // Reserva para nombre/curso (adaptada a bibs pequeños)
    const nameReserve = (nameMode || lineMode) ? Math.min(28, numAreaH * 0.38) : 0;
    const numEffH     = numAreaH - nameReserve;

    // Número: restringido por ancho Y por altura disponible
    const fsByWidth  = fitFontSize(doc, formatNum(end, end), bibW, fNum, fNumSt, (nameMode || lineMode) ? 0.65 : 0.82);
    const fsByHeight = (numEffH - 4) / (PT2MM * CAP_RATIO);   // 4 mm = padding vertical
    const numFs      = Math.min(fsByWidth, fsByHeight, 200);
    const numCapH    = numFs * PT2MM * CAP_RATIO;

    for (let slot = 0; slot < items.length; slot++) {
        if (slot > 0 && slot % perPage === 0) doc.addPage();

        const { n, name, curso } = items[slot];
        const row = slot % perPage;
        const bx  = mX;
        const by  = mY + row * (bibH + 8);
        const cx  = bx + bibW / 2;

        // Fondo
        doc.setFillColor(255, 255, 255);
        doc.rect(bx, by, bibW, bibH, 'F');

        // Borde grueso
        doc.setDrawColor(15, 20, 60);
        doc.setLineWidth(1.8);
        doc.rect(bx, by, bibW, bibH, 'S');

        // Logo
        if (logoData) {
            try { doc.addImage(logoData, 'JPEG', cx - logoSize / 2, by + rLogoTop, logoSize, logoSize); } catch { /* */ }
        }

        // Título
        doc.setFont(fText, 'bold');
        doc.setFontSize(titleFs);
        doc.setTextColor(12, 18, 55);
        doc.text(title.toUpperCase(), cx, by + rTitleBase, { align: 'center' });

        // Colegio
        doc.setFont(fText, 'normal');
        doc.setFontSize(schoolFs);
        doc.setTextColor(55, 65, 95);
        doc.text(SCHOOL_NAME, cx, by + rSchoolBase, { align: 'center' });

        // Subtítulo
        if (hasSubtitle) {
            doc.setFont(fText, 'italic');
            doc.setFontSize(subtFs);
            doc.setTextColor(105, 115, 145);
            doc.text(subtitle.trim(), cx, by + rSubtBase, { align: 'center' });
        }

        // Número — centrado visual: baseline = mid_área + capHeight/2
        const numStr  = formatNum(n, end);
        const areaTop = by + numAreaY;
        const areaBot = by + bibH - nameReserve;
        const areaMid = (areaTop + areaBot) / 2;

        doc.setFont(fNum, fNumSt);
        doc.setFontSize(numFs);
        doc.setTextColor(10, 15, 50);
        doc.text(numStr, cx, areaMid + numCapH / 2, { align: 'center' });

        // Líneas en blanco para nombre + curso (modo solo números)
        if (lineMode) {
            const lineAreaTop = by + bibH - nameReserve;
            const rowH = nameReserve / 2;
            const labelFs = small ? 6 : 7;
            const lineX1 = bx + 8;
            const lineX2 = bx + bibW - 8;

            // Separador superior
            doc.setDrawColor(180, 185, 210);
            doc.setLineWidth(0.3);
            doc.line(lineX1, lineAreaTop + 1, lineX2, lineAreaTop + 1);

            doc.setFont(fText, 'normal');
            doc.setFontSize(labelFs);
            doc.setTextColor(130, 140, 170);

            // Fila nombre
            const nameLabelY = lineAreaTop + rowH * 0.55;
            const nameLineY  = lineAreaTop + rowH * 0.88;
            doc.text('Nombre:', lineX1, nameLabelY);
            doc.setDrawColor(50, 60, 100);
            doc.setLineWidth(0.5);
            doc.line(lineX1, nameLineY, lineX2, nameLineY);

            // Fila curso
            const cursoLabelY = lineAreaTop + rowH + rowH * 0.55;
            const cursoLineY  = lineAreaTop + rowH + rowH * 0.88;
            doc.setTextColor(130, 140, 170);
            doc.text('Curso:', lineX1, cursoLabelY);
            doc.setDrawColor(50, 60, 100);
            doc.line(lineX1, cursoLineY, lineX1 + (lineX2 - lineX1) * 0.45, cursoLineY);
        }

        // Nombre + curso
        if (nameMode && name) {
            const nameAreaTop = by + bibH - nameReserve;

            // Nombre centrado en la mitad superior del área de nombre
            const nameFontSize = fitNameFontSize(doc, name.toUpperCase(), bibW - 16, fText);
            const nameCapH     = nameFontSize * PT2MM * CAP_RATIO;
            const nameBase     = nameAreaTop + nameReserve * 0.38 + nameCapH;
            doc.setFont(fText, 'bold');
            doc.setFontSize(nameFontSize);
            doc.setTextColor(10, 15, 50);
            doc.text(name.toUpperCase(), cx, nameBase, { align: 'center' });

            // Curso — pill
            if (curso && nameReserve >= 16) {
                const cursoLabel = curso.toUpperCase();
                doc.setFont(fText, 'bold');
                doc.setFontSize(9);
                const tw       = doc.getTextWidth(cursoLabel);
                const pillPadX = 5;
                const pillPadY = 2;
                const pillH    = 9 * PT2MM + pillPadY * 2;
                const pillW    = tw + pillPadX * 2;
                const pillX    = cx - pillW / 2;
                const pillY    = by + bibH - 3 - pillH;

                doc.setFillColor(12, 18, 55);
                doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text(cursoLabel, cx, pillY + pillH - pillPadY, { align: 'center' });
            }
        }
    }

    const tag = nameMode ? 'con-nombres' : 'numeros';
    doc.save(`corrida-${tag}-${formatNum(startNum, end)}-${formatNum(end, end)}.pdf`);
}

// ── Layouts ──
const LAYOUTS = [
    { id: '1', label: '1 por página', perPage: 1, desc: 'Muy grande' },
    { id: '2', label: '2 por página', perPage: 2, desc: 'Recomendado' },
    { id: '4', label: '4 por página', perPage: 4, desc: 'Compacto' },
];

export default function CorridaEscolarView() {
    const { students, loading: studentsLoading } = useStudents();

    const [mode,          setMode]          = useState('numeros');   // 'numeros' | 'nombres' | 'manual'
    const [total,         setTotal]         = useState(100);
    const [startNum,      setStartNum]      = useState(1);
    const [title,         setTitle]         = useState('Primera Corrida Escolar');
    const [subtitle,      setSubtitle]      = useState('Celebrando el Día Mundial de la Actividad Física');
    const [layoutId,      setLayoutId]      = useState('2');
    const [selectedCursos, setSelectedCursos] = useState(new Set());
    const [generating,    setGenerating]    = useState(false);
    const [manualEntries, setManualEntries] = useState([]);   // [{name, curso}]
    const [manualName,    setManualName]    = useState('');
    const [manualCurso,   setManualCurso]   = useState('');

    const layout = LAYOUTS.find(l => l.id === layoutId);

    // ── Cursos disponibles desde los datos reales ──
    const cursosDisponibles = useMemo(() => {
        const counts = {};
        students.forEach(s => { if (s.curso) counts[s.curso] = (counts[s.curso] || 0) + 1; });
        const known   = CURSOS_ORDER.filter(c => counts[c]).map(c => ({ curso: c, count: counts[c] }));
        const unknown = Object.entries(counts)
            .filter(([c]) => !CURSOS_ORDER.includes(c))
            .sort(([a], [b]) => a.localeCompare(b, 'es'))
            .map(([curso, count]) => ({ curso, count }));
        return [...known, ...unknown];
    }, [students]);

    // ── Alumnos seleccionados, ordenados ──
    const selectedStudents = useMemo(() => {
        if (selectedCursos.size === 0) return [];
        return students
            .filter(s => selectedCursos.has(s.curso))
            .sort((a, b) => {
                const ia = CURSOS_ORDER.indexOf(a.curso);
                const ib = CURSOS_ORDER.indexOf(b.curso);
                const ca = ia === -1 ? 999 : ia;
                const cb = ib === -1 ? 999 : ib;
                if (ca !== cb) return ca - cb;
                return a.fullName.localeCompare(b.fullName, 'es');
            });
    }, [students, selectedCursos]);

    const toggleCurso = (c) => setSelectedCursos(prev => {
        const next = new Set(prev);
        next.has(c) ? next.delete(c) : next.add(c);
        return next;
    });

    const toggleAll = () => {
        if (selectedCursos.size === cursosDisponibles.length) {
            setSelectedCursos(new Set());
        } else {
            setSelectedCursos(new Set(cursosDisponibles.map(c => c.curso)));
        }
    };

    const addManualEntry = () => {
        const n = manualName.trim();
        if (!n) return;
        setManualEntries(prev => [...prev, { name: n, curso: manualCurso.trim() }]);
        setManualName('');
        setManualCurso('');
    };

    const removeManualEntry = (idx) => setManualEntries(prev => prev.filter((_, i) => i !== idx));

    // Cálculos de preview
    const count = mode === 'numeros' ? total : mode === 'nombres' ? selectedStudents.length : manualEntries.length;
    const end   = startNum + count - 1;
    const pages = Math.ceil(count / layout.perPage);

    const handleGenerate = async () => {
        if (mode === 'numeros' && (total < 1 || total > 600)) return;
        if (mode === 'nombres' && selectedStudents.length === 0) return;
        if (mode === 'manual' && manualEntries.length === 0) return;

        setGenerating(true);
        try {
            let items;
            if (mode === 'numeros') {
                items = Array.from({ length: total }, (_, i) => ({ n: startNum + i, withLines: true }));
            } else if (mode === 'nombres') {
                items = selectedStudents.map((s, i) => ({
                    n: startNum + i,
                    name: s.fullName,
                    curso: s.curso,
                }));
            } else {
                items = manualEntries.map((e, i) => ({
                    n: startNum + i,
                    name: e.name,
                    curso: e.curso,
                }));
            }
            await generateBibsPDF({ startNum, title, subtitle, perPage: layout.perPage, items });
            toast.success(`PDF listo — ${count} letreros (${formatNum(startNum, end)} al ${formatNum(end, end)})`);
        } catch (err) {
            console.error(err);
            toast.error('No se pudo generar el PDF');
        } finally {
            setGenerating(false);
        }
    };

    const canGenerate = mode === 'numeros'
        ? total >= 1 && total <= 600
        : mode === 'nombres'
        ? selectedStudents.length > 0
        : manualEntries.length > 0;

    return (
        <div className="max-w-xl mx-auto pb-20 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Flag className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Corrida Escolar</h1>
                    <p className="text-slate-500 text-sm">Genera los letreros para los participantes.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-5">

                {/* Modo */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de letrero</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'numeros', label: 'Solo números', Icon: Hash },
                            { id: 'nombres', label: 'Con nombres',  Icon: Users },
                            { id: 'manual',  label: 'Manual',       Icon: PenLine },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setMode(id)}
                                className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border font-bold text-xs transition-all
                                    ${mode === id
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Título */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Título del evento</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Primera Corrida Escolar"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                {/* Subtítulo */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Subtítulo <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                        type="text"
                        value={subtitle}
                        onChange={e => setSubtitle(e.target.value)}
                        placeholder="Celebrando el Día Mundial de la Actividad Física"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                {/* ── MODO NÚMEROS ── */}
                {mode === 'numeros' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Número inicial</label>
                            <input
                                type="number" min={1} max={600}
                                value={startNum}
                                onChange={e => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                Total <span className="text-slate-400 font-normal">(máx. 600)</span>
                            </label>
                            <input
                                type="number" min={1} max={600}
                                value={total}
                                onChange={e => setTotal(Math.min(600, Math.max(1, parseInt(e.target.value) || 1)))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* ── MODO NOMBRES ── */}
                {mode === 'nombres' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700">Seleccionar cursos</label>
                            {cursosDisponibles.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="text-xs text-indigo-600 font-semibold hover:underline"
                                >
                                    {selectedCursos.size === cursosDisponibles.length ? 'Ninguno' : 'Todos'}
                                </button>
                            )}
                        </div>

                        {studentsLoading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando alumnos…
                            </div>
                        ) : cursosDisponibles.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No hay alumnos registrados.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {cursosDisponibles.map(({ curso, count }) => {
                                    const sel = selectedCursos.has(curso);
                                    return (
                                        <button
                                            key={curso}
                                            type="button"
                                            onClick={() => toggleCurso(curso)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left
                                                ${sel
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {sel
                                                    ? <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                                                    : <Square className="w-3.5 h-3.5 shrink-0 text-slate-300" />}
                                                {curso}
                                            </span>
                                            <span className={`text-xs font-bold ml-2 shrink-0 ${sel ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Número inicial */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Número inicial</label>
                            <input
                                type="number" min={1}
                                value={startNum}
                                onChange={e => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* ── MODO MANUAL ── */}
                {mode === 'manual' && (
                    <div className="space-y-3">
                        {/* Formulario de ingreso */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del alumno</label>
                                <input
                                    type="text"
                                    value={manualName}
                                    onChange={e => setManualName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addManualEntry()}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Curso</label>
                                <input
                                    type="text"
                                    value={manualCurso}
                                    onChange={e => setManualCurso(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addManualEntry()}
                                    placeholder="Ej: 5° Básico"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addManualEntry}
                                disabled={!manualName.trim()}
                                className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm transition-all"
                            >
                                +
                            </button>
                        </div>

                        {/* Lista de entradas */}
                        {manualEntries.length > 0 && (
                            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                {manualEntries.map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm"
                                    >
                                        <span className="font-medium text-slate-700 truncate mr-2">{entry.name}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {entry.curso && (
                                                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                                                    {entry.curso}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeManualEntry(idx)}
                                                className="text-slate-300 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Número inicial */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Número inicial</label>
                            <input
                                type="number" min={1}
                                value={startNum}
                                onChange={e => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Layout */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Letreros por página</label>
                    <div className="grid grid-cols-3 gap-3">
                        {LAYOUTS.map(l => (
                            <button
                                key={l.id} type="button"
                                onClick={() => setLayoutId(l.id)}
                                className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl border font-bold text-sm transition-all
                                    ${layoutId === l.id
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {l.label}
                                <span className={`text-[10px] font-normal ${layoutId === l.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {l.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="flex items-center justify-around p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                    <div className="text-center">
                        <p className="text-xl font-extrabold text-slate-800">{count > 0 ? formatNum(startNum, end) : '---'}</p>
                        <p className="text-xs text-slate-500">primer número</p>
                    </div>
                    <div className="text-slate-300 text-lg">→</div>
                    <div className="text-center">
                        <p className="text-xl font-extrabold text-slate-800">{count > 0 ? formatNum(end, end) : '---'}</p>
                        <p className="text-xs text-slate-500">último número</p>
                    </div>
                    <div className="text-slate-300 text-lg">=</div>
                    <div className="text-center">
                        <p className="text-xl font-extrabold text-indigo-700">{count > 0 ? pages : 0}</p>
                        <p className="text-xs text-slate-500">páginas A4</p>
                    </div>
                </div>

                {/* Info nombres */}
                {mode === 'nombres' && selectedStudents.length > 0 && (
                    <p className="text-xs text-slate-500 text-center -mt-2">
                        {selectedCursos.size} {selectedCursos.size === 1 ? 'curso' : 'cursos'} · {selectedStudents.length} alumnos
                        · ordenados por curso y nombre
                    </p>
                )}
                {mode === 'manual' && manualEntries.length > 0 && (
                    <p className="text-xs text-slate-500 text-center -mt-2">
                        {manualEntries.length} {manualEntries.length === 1 ? 'participante' : 'participantes'} ingresados
                    </p>
                )}

                {/* Botón */}
                <button
                    onClick={handleGenerate}
                    disabled={generating || !canGenerate}
                    className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                    {generating
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando PDF…</>
                        : <><FileDown className="w-5 h-5" /> Descargar PDF</>
                    }
                </button>
            </div>
        </div>
    );
}

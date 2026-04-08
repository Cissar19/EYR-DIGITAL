import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Flag, FileDown, Loader2, Users, Hash, CheckSquare, Square } from 'lucide-react';
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

    const pageW = 210, pageH = 297;
    const mX = 8, mY = 8;
    const bibW = pageW - mX * 2;
    const bibH = (pageH - mY * 2 - (perPage - 1) * 8) / perPage;

    // Header adaptativo según espacio disponible
    const headerH  = bibH < 80 ? 24 : 38;
    const numAreaY = headerH + 4;
    const numAreaH = bibH - numAreaY;

    const end = startNum + items.length - 1;
    const nameMode = items[0]?.name !== undefined;

    for (let slot = 0; slot < items.length; slot++) {
        if (slot > 0 && slot % perPage === 0) doc.addPage();

        const { n, name, curso } = items[slot];
        const row = slot % perPage;
        const bx  = mX;
        const by  = mY + row * (bibH + 8);

        // Fondo
        doc.setFillColor(255, 255, 255);
        doc.rect(bx, by, bibW, bibH, 'F');

        // Borde grueso
        doc.setDrawColor(15, 20, 60);
        doc.setLineWidth(1.8);
        doc.rect(bx, by, bibW, bibH, 'S');

        // ── Header centrado ──
        const cx = bx + bibW / 2;

        // Logo centrado
        const logoSize = bibH < 80 ? 10 : 14;
        const logoX = cx - logoSize / 2;
        const logoY = by + 4;
        if (logoData) {
            try { doc.addImage(logoData, 'JPEG', logoX, logoY, logoSize, logoSize); } catch { /* */ }
        }

        let textY = by + logoSize + 7;

        // Título centrado
        doc.setFont(fText, 'bold');
        doc.setFontSize(bibH < 80 ? 10 : 13);
        doc.setTextColor(12, 18, 55);
        doc.text(title.toUpperCase(), cx, textY, { align: 'center', maxWidth: bibW - 10 });
        textY += bibH < 80 ? 5 : 6;

        // Colegio centrado
        doc.setFont(fText, 'normal');
        doc.setFontSize(bibH < 80 ? 7 : 8.5);
        doc.setTextColor(55, 65, 95);
        doc.text(SCHOOL_NAME, cx, textY, { align: 'center', maxWidth: bibW - 10 });
        textY += 5;

        // Subtítulo centrado
        if (subtitle.trim() && bibH >= 80) {
            doc.setFont(fText, 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(105, 115, 145);
            doc.text(subtitle.trim(), cx, textY, { align: 'center', maxWidth: bibW - 10 });
        }

        // Número — centrado visual (baseline = centro_área + capHeight/2)
        const numStr = formatNum(n, end);
        const fillRatio = nameMode ? 0.65 : 0.82;
        const nameReserve = nameMode ? 32 : 0;
        const fs = fitFontSize(doc, numStr, bibW, fNum, fNumSt, fillRatio);
        doc.setFont(fNum, fNumSt);
        doc.setFontSize(fs);
        doc.setTextColor(10, 15, 50);
        const areaTop     = by + numAreaY;
        const areaBot     = by + bibH - nameReserve;
        const areaMid     = (areaTop + areaBot) / 2;
        const capHeightMm = fs * 0.3528 * 0.72;   // pt → mm × ratio cap-height
        const numCenterY  = areaMid + capHeightMm / 2;
        doc.text(numStr, bx + bibW / 2, numCenterY, { align: 'center' });

        // Nombre + curso (solo modo nombres)
        if (nameMode && name) {
            // Nombre
            const nameFontSize = fitNameFontSize(doc, name.toUpperCase(), bibW - 16, fText);
            doc.setFont(fText, 'bold');
            doc.setFontSize(nameFontSize);
            doc.setTextColor(10, 15, 50);
            doc.text(name.toUpperCase(), bx + bibW / 2, by + bibH - 20, { align: 'center' });

            // Curso — pill con fondo oscuro y texto blanco Montserrat Bold
            if (curso) {
                const cursoLabel = curso.toUpperCase();
                doc.setFont(fText, 'bold');
                doc.setFontSize(9);
                const tw       = doc.getTextWidth(cursoLabel);
                const pillPadX = 5;
                const pillPadY = 2.2;
                const pillH    = 9 * 0.3528 + pillPadY * 2;   // ~5.4mm
                const pillW    = tw + pillPadX * 2;
                const pillX    = bx + bibW / 2 - pillW / 2;
                const pillY    = by + bibH - 4 - pillH;

                doc.setFillColor(12, 18, 55);
                doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'F');

                doc.setTextColor(255, 255, 255);
                doc.text(cursoLabel, bx + bibW / 2, pillY + pillH - pillPadY, { align: 'center' });
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

    const [mode,          setMode]          = useState('numeros');   // 'numeros' | 'nombres'
    const [total,         setTotal]         = useState(100);
    const [startNum,      setStartNum]      = useState(1);
    const [title,         setTitle]         = useState('Primera Corrida Escolar');
    const [subtitle,      setSubtitle]      = useState('Celebrando el Día Mundial de la Actividad Física');
    const [layoutId,      setLayoutId]      = useState('2');
    const [selectedCursos, setSelectedCursos] = useState(new Set());
    const [generating,    setGenerating]    = useState(false);

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

    // Cálculos de preview
    const end   = mode === 'numeros' ? startNum + total - 1 : startNum + selectedStudents.length - 1;
    const count = mode === 'numeros' ? total : selectedStudents.length;
    const pages = Math.ceil(count / layout.perPage);

    const handleGenerate = async () => {
        if (mode === 'numeros' && (total < 1 || total > 600)) return;
        if (mode === 'nombres' && selectedStudents.length === 0) return;

        setGenerating(true);
        try {
            let items;
            if (mode === 'numeros') {
                items = Array.from({ length: total }, (_, i) => ({ n: startNum + i }));
            } else {
                items = selectedStudents.map((s, i) => ({
                    n: startNum + i,
                    name: s.fullName,
                    curso: s.curso,
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
        : selectedStudents.length > 0;

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
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setMode('numeros')}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm transition-all
                                ${mode === 'numeros'
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Hash className="w-4 h-4" />
                            Solo números
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('nombres')}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm transition-all
                                ${mode === 'nombres'
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Users className="w-4 h-4" />
                            Con nombres
                        </button>
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

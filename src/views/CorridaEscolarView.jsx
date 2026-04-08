import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Flag, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoUrl from '../assets/logo_eyr_pdf.jpeg';

const SCHOOL_NAME = 'Centro Educacional Ernesto Yañez Rivera';

// ── Fuentes Montserrat desde jsDelivr (CORS abierto) ──
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

// ── Cargar logo como base64 ──
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

// ── Font size dinámico para el número ──
function fitFontSize(doc, text, maxWidth, fontName, fontStyle) {
    let fs = 200;
    doc.setFont(fontName, fontStyle);
    doc.setFontSize(fs);
    const w = doc.getTextWidth(text);
    return Math.min(Math.floor(fs * ((maxWidth * 0.82) / w)), 200);
}

// ── Formatear número con ceros ──
function formatNum(n, maxNum) {
    const digits = String(maxNum).length;
    return String(n).padStart(Math.max(digits, 3), '0');
}

// ── Generar PDF ──
async function generateBibsPDF({ total, startNum, title, subtitle, perPage }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const [logo, fonts] = await Promise.allSettled([loadLogoBase64(), loadFonts()]);

    const logoData = logo.status === 'fulfilled' ? logo.value : null;
    const hasFonts  = fonts.status === 'fulfilled';
    if (hasFonts) registerFonts(doc, fonts.value);

    // Aliases de fuente (fallback a helvetica si la red falló)
    const fText   = hasFonts ? 'Mont'      : 'helvetica';
    const fNum    = hasFonts ? 'MontBlack' : 'helvetica';
    const fNumSt  = hasFonts ? 'normal'    : 'bold';

    const pageW = 210, pageH = 297;
    const mX = 8, mY = 8;
    const bibW = pageW - mX * 2;
    const bibH = (pageH - mY * 2 - (perPage - 1) * 8) / perPage;

    const headerH = 28;
    const dividerY = headerH + 2;
    const numAreaY = dividerY + 4;
    const numAreaH = bibH - numAreaY;

    const end = startNum + total - 1;
    let slot = 0;

    for (let n = startNum; n <= end; n++) {
        if (slot > 0 && slot % perPage === 0) doc.addPage();

        const row = slot % perPage;
        const bx  = mX;
        const by  = mY + row * (bibH + 8);

        // Fondo blanco
        doc.setFillColor(255, 255, 255);
        doc.rect(bx, by, bibW, bibH, 'F');

        // Borde sutil
        doc.setDrawColor(210, 218, 235);
        doc.setLineWidth(0.3);
        doc.rect(bx, by, bibW, bibH, 'S');

        // Logo
        const logoSize = 15;
        const logoX = bx + 6;
        const logoY = by + (headerH - logoSize) / 2;
        if (logoData) {
            try { doc.addImage(logoData, 'JPEG', logoX, logoY, logoSize, logoSize); } catch { /* */ }
        }

        const textX = logoX + logoSize + 5;
        const textW = bibW - logoSize - 14;

        // Título del evento
        doc.setFont(fText, 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(12, 18, 55);
        doc.text(title.toUpperCase(), textX, by + 9.5, { maxWidth: textW });

        // Nombre del colegio
        doc.setFont(fText, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 95);
        doc.text(SCHOOL_NAME, textX, by + 17, { maxWidth: textW });

        // Subtítulo
        if (subtitle.trim()) {
            doc.setFont(fText, 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(105, 115, 145);
            doc.text(subtitle.trim(), textX, by + 24, { maxWidth: textW });
        }

        // Línea divisora
        doc.setDrawColor(215, 222, 240);
        doc.setLineWidth(0.35);
        doc.line(bx + 4, by + dividerY, bx + bibW - 4, by + dividerY);

        // Número
        const numStr = formatNum(n, end);
        const fs = fitFontSize(doc, numStr, bibW, fNum, fNumSt);
        doc.setFont(fNum, fNumSt);
        doc.setFontSize(fs);
        doc.setTextColor(10, 15, 50);
        const numCenterY = by + numAreaY + numAreaH * 0.62;
        doc.text(numStr, bx + bibW / 2, numCenterY, { align: 'center' });

        slot++;
    }

    doc.save(`corrida-${formatNum(startNum, end)}-${formatNum(end, end)}.pdf`);
}

// ── Opciones de layout ──
const LAYOUTS = [
    { id: '1', label: '1 por página', perPage: 1, desc: 'Muy grande' },
    { id: '2', label: '2 por página', perPage: 2, desc: 'Recomendado' },
    { id: '4', label: '4 por página', perPage: 4, desc: 'Compacto' },
];

export default function CorridaEscolarView() {
    const [total,      setTotal]      = useState(100);
    const [startNum,   setStartNum]   = useState(1);
    const [title,      setTitle]      = useState('Primera Corrida Escolar');
    const [subtitle,   setSubtitle]   = useState('Celebrando el Día Mundial de la Actividad Física');
    const [layoutId,   setLayoutId]   = useState('2');
    const [generating, setGenerating] = useState(false);

    const layout = LAYOUTS.find(l => l.id === layoutId);
    const end    = startNum + total - 1;
    const pages  = Math.ceil(total / layout.perPage);

    const handleGenerate = async () => {
        if (total < 1 || total > 600) return;
        setGenerating(true);
        try {
            await generateBibsPDF({ total, startNum, title, subtitle, perPage: layout.perPage });
            toast.success(`PDF listo — números ${formatNum(startNum, end)} al ${formatNum(end, end)}`);
        } catch (err) {
            console.error(err);
            toast.error('No se pudo generar el PDF');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto pb-20 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Flag className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Corrida Escolar</h1>
                    <p className="text-slate-500 text-sm">Genera los números para los participantes.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-5">

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

                {/* Rango */}
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

                {/* Layout */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Números por página</label>
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
                        <p className="text-xl font-extrabold text-slate-800">{formatNum(startNum, end)}</p>
                        <p className="text-xs text-slate-500">primer número</p>
                    </div>
                    <div className="text-slate-300 text-lg">→</div>
                    <div className="text-center">
                        <p className="text-xl font-extrabold text-slate-800">{formatNum(end, end)}</p>
                        <p className="text-xs text-slate-500">último número</p>
                    </div>
                    <div className="text-slate-300 text-lg">=</div>
                    <div className="text-center">
                        <p className="text-xl font-extrabold text-indigo-700">{pages}</p>
                        <p className="text-xs text-slate-500">páginas A4</p>
                    </div>
                </div>

                {/* Botón */}
                <button
                    onClick={handleGenerate}
                    disabled={generating || total < 1 || total > 600}
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

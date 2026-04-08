import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Flag, FileDown, Hash, AlignJustify, LayoutGrid, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoUrl from '../assets/logo_eyr_pdf.jpeg';

// ── Color palette ──
const I900 = [29, 27, 109];
const I700 = [55, 48, 163];
const I100 = [224, 231, 255];
const I50  = [238, 242, 255];
const WHITE = [255, 255, 255];
const GRAY  = [100, 116, 139];

const LAYOUTS = [
    { id: 'grande',   label: 'Grande',   cols: 1, rows: 2, perPage: 2, desc: '2 por página' },
    { id: 'normal',   label: 'Normal',   cols: 2, rows: 2, perPage: 4, desc: '4 por página' },
    { id: 'compacto', label: 'Compacto', cols: 2, rows: 3, perPage: 6, desc: '6 por página' },
];

async function loadLogoBase64() {
    try {
        const res = await fetch(logoUrl);
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function numFontSize(n, bibW) {
    const digits = String(n).length;
    if (digits === 1) return 130;
    if (digits === 2) return 110;
    if (digits === 3) return 85;
    return 68;
}

async function generateBibsPDF({ total, startNum, eventName, layout }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logoB64 = await loadLogoBase64();

    const pageW = 210;
    const pageH = 297;
    const margin = 7;
    const gap = 4;
    const { cols, rows } = layout;
    const perPage = cols * rows;

    const bibW = (pageW - 2 * margin - (cols - 1) * gap) / cols;
    const bibH = (pageH - 2 * margin - (rows - 1) * gap) / rows;

    const topStripH = 18;
    const btmStripH = 7;
    const numAreaY  = topStripH;
    const numAreaH  = bibH - topStripH - btmStripH;

    const end = startNum + total - 1;
    let slot = 0;

    for (let n = startNum; n <= end; n++) {
        if (slot > 0 && slot % perPage === 0) {
            doc.addPage();
        }
        const col = slot % cols;
        const row = Math.floor((slot % perPage) / cols);

        const x = margin + col * (bibW + gap);
        const y = margin + row * (bibH + gap);

        // ── Background ──
        doc.setFillColor(...WHITE);
        doc.rect(x, y, bibW, bibH, 'F');

        // ── Top strip ──
        doc.setFillColor(...I700);
        doc.rect(x, y, bibW, topStripH, 'F');

        // Logo
        if (logoB64) {
            const logoS = topStripH - 4;
            try {
                doc.addImage(logoB64, 'JPEG', x + 3, y + 2, logoS, logoS);
            } catch { /* logo load failed */ }
        }

        // School name
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        const schoolX = x + (logoB64 ? topStripH + 2 : 4);
        doc.text('Centro Educacional Ernesto Yañez Rivera', schoolX, y + 7, { maxWidth: bibW - topStripH - 5 });

        // Event name
        doc.setFontSize(7);
        if (eventName.trim()) {
            doc.text(eventName.trim().toUpperCase(), schoolX, y + 14, { maxWidth: bibW - topStripH - 5 });
        }

        // ── Border ──
        doc.setDrawColor(...I700);
        doc.setLineWidth(0.8);
        doc.rect(x, y, bibW, bibH, 'S');

        // ── Number ──
        const fs = numFontSize(n, bibW);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fs);
        doc.setTextColor(...I900);
        const numY = y + topStripH + numAreaH * 0.55;
        doc.text(String(n), x + bibW / 2, numY, { align: 'center' });

        // ── Bottom strip ──
        doc.setFillColor(...I50);
        doc.rect(x, y + bibH - btmStripH, bibW, btmStripH, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(...GRAY);
        doc.text('EYR Huechuraba', x + bibW / 2, y + bibH - 2, { align: 'center' });

        slot++;
    }

    // ── Dashed cut lines between bibs ──
    // (Only drawn once as page-level guides are complex; border serves as cut guide)

    const fileName = `corrida-escolar-${startNum}-${end}.pdf`;
    doc.save(fileName);
}

export default function CorridaEscolarView() {
    const [total,     setTotal]     = useState(100);
    const [startNum,  setStartNum]  = useState(1);
    const [eventName, setEventName] = useState('Corrida Escolar');
    const [layoutId,  setLayoutId]  = useState('normal');
    const [generating, setGenerating] = useState(false);

    const layout = LAYOUTS.find(l => l.id === layoutId);
    const end    = startNum + total - 1;

    const handleGenerate = async () => {
        if (total < 1 || total > 600) return;
        setGenerating(true);
        try {
            await generateBibsPDF({ total, startNum, eventName, layout });
            toast.success(`PDF generado: números ${startNum} al ${end}`);
        } catch (err) {
            console.error(err);
            toast.error('No se pudo generar el PDF');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Flag className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Corrida Escolar</h1>
                    <p className="text-slate-500 text-sm">Genera los números para los participantes listos para imprimir.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-6">

                {/* Event name */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre del evento</label>
                    <input
                        type="text"
                        value={eventName}
                        onChange={e => setEventName(e.target.value)}
                        placeholder="Ej: Corrida Escolar 2025"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    />
                </div>

                {/* Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Número inicial</label>
                        <input
                            type="number"
                            min={1} max={600}
                            value={startNum}
                            onChange={e => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Total de participantes
                            <span className="ml-1.5 text-slate-400 font-normal">(máx. 600)</span>
                        </label>
                        <input
                            type="number"
                            min={1} max={600}
                            value={total}
                            onChange={e => setTotal(Math.min(600, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                        />
                    </div>
                </div>

                {/* Layout selector */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tamaño de número</label>
                    <div className="grid grid-cols-3 gap-3">
                        {LAYOUTS.map(l => (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => setLayoutId(l.id)}
                                className={`flex flex-col items-center gap-1 px-3 py-3.5 rounded-xl border font-bold text-xs transition-all
                                    ${layoutId === l.id
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {l.id === 'grande'   && <AlignJustify className="w-5 h-5" />}
                                {l.id === 'normal'   && <LayoutGrid className="w-5 h-5" />}
                                {l.id === 'compacto' && <Hash className="w-5 h-5" />}
                                {l.label}
                                <span className={`text-[10px] font-normal ${layoutId === l.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {l.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview info */}
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm">
                    <div className="text-center px-4 border-r border-indigo-200">
                        <p className="text-2xl font-extrabold text-indigo-700">{total}</p>
                        <p className="text-xs text-indigo-500 font-medium">participantes</p>
                    </div>
                    <div className="text-center px-4 border-r border-indigo-200">
                        <p className="text-2xl font-extrabold text-indigo-700">{startNum}–{end}</p>
                        <p className="text-xs text-indigo-500 font-medium">rango de números</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-2xl font-extrabold text-indigo-700">{Math.ceil(total / (layout.cols * layout.rows))}</p>
                        <p className="text-xs text-indigo-500 font-medium">páginas A4</p>
                    </div>
                </div>

                {/* Generate button */}
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

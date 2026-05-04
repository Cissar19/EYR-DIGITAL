import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoEyrUrl from '../assets/logo_eyr_pdf.jpeg';
import { getOAByCode } from '../data/objetivosAprendizaje';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Cache para el lookup de OAs de Firestore (colección curriculum)
let _oaLookupCache = null;

async function fetchOALookup() {
    if (_oaLookupCache) return _oaLookupCache;
    const snap = await getDocs(collection(db, 'curriculum'));
    const map = {};
    snap.docs.forEach(d => {
        const data = d.data();
        (data.ejes || []).forEach(eje => {
            (eje.objetivos || []).forEach(oa => {
                if (oa.codigo) map[oa.codigo] = { eje: eje.nombre, description: oa.descripcion };
            });
        });
    });
    _oaLookupCache = map;
    return map;
}

/** Load an image URL and return a base64 data URL */
async function loadImageAsDataUrl(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

/** Parse "HH:MM" to total minutes (local helper for PDF export) */
function timeToMinutes(t) {
    if (!t || t === '-') return null;
    const parts = t.toString().trim().split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
}

/**
 * Exports attendance/tardiness report as a formatted PDF.
 *
 * @param {Object} params
 * @param {Object} params.dateRange - { from, to } formatted date strings
 * @param {Object} params.summary  - KPI summary with totalTeachers, totalLateEntries, etc.
 * @param {Array}  params.records  - filtered daily records currently visible
 * @param {string} [params.fileName] - original Excel file name
 */
export function exportAttendancePDF({ dateRange, summary, records, fileName }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 14;
    const marginR = 14;
    const contentW = pageW - marginL - marginR;
    let y = 18;

    const mainColor = [55, 48, 163]; // indigo-700
    const headerBg = [238, 242, 255]; // indigo-50

    // ─── HEADER ───
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text('Escuela y Recinto Huechuraba', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Reporte de Atrasos', pageW / 2, y, { align: 'center' });
    y += 9;

    // ─── Date range bar ───
    doc.setFillColor(...headerBg);
    doc.roundedRect(marginL, y, contentW, 9, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    const periodText = `Periodo: ${dateRange.from} — ${dateRange.to}`;
    doc.text(periodText, pageW / 2, y + 6.5, { align: 'center' });
    if (fileName) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(fileName, pageW - marginR - 2, y + 6.5, { align: 'right' });
    }
    y += 14;

    // ─── KPIs ───
    const kpis = [
        { label: 'Funcionarios', value: String(summary.totalTeachers || 0) },
        { label: 'Total Atrasos', value: String(summary.totalLateEntries || 0) },
        { label: 'Sal. Anticipadas', value: String(summary.totalEarlyExits || 0) },
        { label: 'Ausencias', value: String(summary.totalAbsences || 0) },
    ];
    const kpiW = contentW / kpis.length;
    for (let i = 0; i < kpis.length; i++) {
        const x = marginL + i * kpiW;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x + 1, y, kpiW - 2, 14, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(kpis[i].value, x + kpiW / 2, y + 8, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(kpis[i].label, x + kpiW / 2, y + 12.5, { align: 'center' });
    }
    y += 19;

    // ─── RANKING (top 10 with most late minutes) ───
    const ranked = (summary.byTeacher || []).filter(t => t.lateCount > 0).slice(0, 10);
    if (ranked.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('RANKING DE ATRASOS', marginL, y);
        y += 2;
        doc.setDrawColor(...mainColor);
        doc.setLineWidth(0.4);
        doc.line(marginL, y, marginL + 48, y);
        y += 4;

        const rankRows = ranked.map((t, i) => [
            `#${i + 1}`,
            t.name,
            String(t.lateCount),
            `${t.lateMinutes} min`,
            t.earlyExitCount > 0 ? String(t.earlyExitCount) : '-',
            t.absences > 0 ? String(t.absences) : '-',
        ]);

        autoTable(doc, {
            startY: y,
            margin: { left: marginL, right: marginR },
            head: [['#', 'Funcionario', 'Atrasos', 'Min. Atraso', 'Sal. Ant.', 'Ausencias']],
            body: rankRows,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [226, 232, 240],
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: [245, 158, 11], // amber-500
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
            },
            alternateRowStyles: { fillColor: [255, 251, 235] }, // amber-50
            columnStyles: {
                0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: contentW * 0.35 },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 28, halign: 'center' },
                4: { cellWidth: 22, halign: 'center' },
                5: { cellWidth: 22, halign: 'center' },
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 3) {
                    const mins = parseInt(data.cell.raw);
                    if (mins > 120) {
                        data.cell.styles.textColor = [185, 28, 28]; // red-700
                        data.cell.styles.fontStyle = 'bold';
                    } else if (mins > 60) {
                        data.cell.styles.textColor = [180, 83, 9]; // amber-700
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ─── DETAIL TABLE ───
    if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 18;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DETALLE DE REGISTROS', marginL, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${records.length} registro${records.length !== 1 ? 's' : ''}`, marginL + 52, y);
    y += 2;
    doc.setDrawColor(...mainColor);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, marginL + 48, y);
    y += 4;

    const detailRows = records.map(rec => {
        const effectiveEntry = rec.editedEntry || rec.actualEntry || '-';
        const effectiveExit = rec.editedExit || rec.actualExit || '-';

        let tardStr = '-';
        if (rec.absent) tardStr = '';
        else if (rec.tardinessMinutes > 0 && !rec.justified) tardStr = `+${rec.tardinessMinutes}`;
        else if (!rec.absent) tardStr = '0';

        let earlyStr = '-';
        if (rec.absent) earlyStr = '';
        else if (rec.earlyDepartureMinutes > 0 && !rec.justified) earlyStr = `-${rec.earlyDepartureMinutes}`;
        else if (!rec.absent) earlyStr = '0';

        // Debt
        let debtStr = '-';
        if (!rec.absent && !rec.justified) {
            const exitMin = timeToMinutes(effectiveExit);
            const expectedExitMin = timeToMinutes(rec.expectedExit);
            const overtime = (exitMin != null && expectedExitMin != null && exitMin > expectedExitMin)
                ? exitMin - expectedExitMin : 0;
            const debt = (rec.tardinessMinutes || 0) + (rec.earlyDepartureMinutes || 0) - overtime;
            debtStr = debt > 0 ? `${debt}` : debt < 0 ? `+${Math.abs(debt)}` : '0';
        }

        // Status
        let status = '';
        if (rec.absent) status = 'Ausente';
        else if (rec.justified) status = 'Justificado';
        else if (rec.editedEntry || rec.editedExit) status = 'Editado';

        return [
            rec.teacherName || '',
            rec.dateFormatted || '',
            rec.dayOfWeek || '',
            rec.expectedEntry || '-',
            rec.absent ? 'AUS' : effectiveEntry,
            tardStr,
            rec.expectedExit || '-',
            rec.absent ? '' : effectiveExit,
            earlyStr,
            debtStr,
            status,
        ];
    });

    autoTable(doc, {
        startY: y,
        margin: { left: marginL, right: marginR },
        head: [['Nombre', 'Fecha', 'Día', 'Ent.Esp.', 'Ent.Real', 'Atraso', 'Sal.Esp.', 'Sal.Real', 'Sal.Ant.', 'Deuda', 'Estado']],
        body: detailRows,
        styles: {
            fontSize: 7.5,
            cellPadding: 1.8,
            lineColor: [226, 232, 240],
            lineWidth: 0.2,
            overflow: 'ellipsize',
        },
        headStyles: {
            fillColor: mainColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.5,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: contentW * 0.17 },
            1: { cellWidth: contentW * 0.08, halign: 'center', font: 'courier' },
            2: { cellWidth: contentW * 0.07, halign: 'center' },
            3: { cellWidth: contentW * 0.07, halign: 'center', font: 'courier' },
            4: { cellWidth: contentW * 0.07, halign: 'center', font: 'courier' },
            5: { cellWidth: contentW * 0.07, halign: 'center' },
            6: { cellWidth: contentW * 0.07, halign: 'center', font: 'courier' },
            7: { cellWidth: contentW * 0.07, halign: 'center', font: 'courier' },
            8: { cellWidth: contentW * 0.07, halign: 'center' },
            9: { cellWidth: contentW * 0.07, halign: 'center' },
            10: { cellWidth: contentW * 0.12, halign: 'center' },
        },
        didParseCell: (data) => {
            if (data.section !== 'body') return;
            // Highlight tardiness
            if (data.column.index === 5) {
                const val = parseInt(data.cell.raw);
                if (val > 15) {
                    data.cell.styles.textColor = [185, 28, 28];
                    data.cell.styles.fontStyle = 'bold';
                } else if (val > 0) {
                    data.cell.styles.textColor = [180, 83, 9];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
            // Highlight early departure
            if (data.column.index === 8) {
                const raw = data.cell.raw;
                if (raw && raw.startsWith('-')) {
                    data.cell.styles.textColor = [180, 83, 9];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
            // Highlight debt
            if (data.column.index === 9) {
                const val = parseInt(data.cell.raw);
                if (val > 30) {
                    data.cell.styles.textColor = [185, 28, 28];
                    data.cell.styles.fontStyle = 'bold';
                } else if (val > 10) {
                    data.cell.styles.textColor = [180, 83, 9];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
            // Status colors
            if (data.column.index === 10) {
                const text = data.cell.raw;
                if (text === 'Ausente') {
                    data.cell.styles.textColor = [126, 34, 206]; // purple
                    data.cell.styles.fontStyle = 'bold';
                } else if (text === 'Justificado') {
                    data.cell.styles.textColor = [5, 122, 85]; // emerald
                    data.cell.styles.fontStyle = 'bold';
                } else if (text === 'Editado') {
                    data.cell.styles.textColor = [29, 78, 216]; // blue
                }
            }
            // Absent entry
            if (data.column.index === 4 && data.cell.raw === 'AUS') {
                data.cell.styles.textColor = [126, 34, 206];
                data.cell.styles.fontStyle = 'bold';
            }
        },
    });

    // ─── FOOTER (on every page) ───
    const totalPages = doc.internal.getNumberOfPages();
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Generado ${timestamp} — EYR Digital`, marginL, pageH - 8);
        doc.text(`Página ${i} de ${totalPages}`, pageW - marginR, pageH - 8, { align: 'right' });
    }

    // ─── SAVE ───
    const safeFrom = (dateRange.from || '').replace(/\//g, '');
    const safeTo = (dateRange.to || '').replace(/\//g, '');
    doc.save(`Atrasos_${safeFrom}_${safeTo}.pdf`);
}

/**
 * Exports all Control Sano records for a single student as a clinical record (ficha clínica).
 *
 * @param {Object} student   - { fullName, rut, curso }
 * @param {Array}  registros - all control_sano docs for this student
 */
export async function exportControlSanoPDF({ student, registros }) {
    const logoDataUrl = await loadImageAsDataUrl(logoEyrUrl);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const mL = 14, mR = 14, mBot = 14;
    const cW = pageW - mL - mR;

    // ── Palette ──
    const TEAL       = [13, 148, 136];
    const TEAL_LIGHT = [204, 251, 241];
    const TEAL_MED   = [94, 234, 212];
    const AMBER      = [180, 83, 9];
    const AMBER_BG   = [255, 251, 235];
    const AMBER_BD   = [217, 119, 6];
    const S900 = [15, 23, 42];
    const S700 = [51, 65, 85];
    const S500 = [100, 116, 139];
    const S300 = [148, 163, 184];
    const S100 = [241, 245, 249];
    const S050 = [248, 250, 252];
    const WHITE = [255, 255, 255];

    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

    const fmtDate = (d) => {
        if (!d) return '—';
        const [yy, mm, dd] = d.split('-');
        return `${dd}/${mm}/${yy}`;
    };

    const DERIV_MAP = {
        dental: 'Dental', nutricionista: 'Nutricionista',
        pediatra: 'Pediatra', psicologia: 'Psicología', saludMental: 'Salud Mental',
    };

    let y = 14;

    // ────────────────────────────────────────
    // PAGE BREAK HELPER
    // ────────────────────────────────────────
    const addPage = () => {
        doc.addPage();
        y = 8;
        // Mini logo
        doc.addImage(logoDataUrl, 'JPEG', mL, y, 10, 10);
        // Running header
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...TEAL);
        doc.text('FICHA CLÍNICA · CONTROL SANO', mL + 13, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S500);
        doc.text(student.fullName || '', pageW - mR, y + 5, { align: 'right' });
        // Divider
        doc.setDrawColor(...TEAL);
        doc.setLineWidth(0.3);
        doc.line(mL, y + 12, pageW - mR, y + 12);
        y += 17;
    };

    const checkBreak = (needed) => {
        if (y + needed > pageH - mBot - 10) addPage();
    };

    // ────────────────────────────────────────
    // HEADER
    // ────────────────────────────────────────

    // Top accent bar
    doc.setFillColor(...TEAL);
    doc.rect(0, 0, pageW * 0.6, 5, 'F');
    doc.setFillColor(...TEAL_MED);
    doc.rect(pageW * 0.6, 0, pageW * 0.4, 5, 'F');
    y = 10;

    // Logo (square shield, 26×26 mm)
    const logoSize = 26;
    doc.addImage(logoDataUrl, 'JPEG', mL, y, logoSize, logoSize);

    // Institution text — to the right of the logo
    const textX = mL + logoSize + 5;
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEAL);
    doc.text('Centro Educacional', textX, y + 7);
    doc.text('Ernesto Yañez Rivera', textX, y + 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...S500);
    doc.text('Lasana 6664, Huechuraba · Enfermería', textX, y + 20);

    // Right: document type
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...S900);
    doc.text('FICHA CLÍNICA', pageW - mR, y + 7, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...S500);
    doc.text('Control Sano', pageW - mR, y + 13, { align: 'right' });
    doc.text(`Emitido: ${timestamp}`, pageW - mR, y + 19, { align: 'right' });

    y += logoSize + 4;

    // Divider
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.5);
    doc.line(mL, y, pageW - mR, y);
    y += 8;

    // ────────────────────────────────────────
    // PATIENT IDENTIFICATION
    // ────────────────────────────────────────
    const patH = 26;
    doc.setFillColor(...TEAL_LIGHT);
    doc.roundedRect(mL, y, cW, patH, 3, 3, 'F');
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.4);
    doc.roundedRect(mL, y, cW, patH, 3, 3, 'S');

    // "PACIENTE" label vertical bar
    doc.setFillColor(...TEAL);
    doc.roundedRect(mL, y, 5, patH, 2, 2, 'F');
    doc.rect(mL + 2, y, 3, patH, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...S900);
    doc.text(student.fullName || '—', mL + 10, y + 9);

    doc.setFontSize(8.5);
    const patFields = [
        { label: 'RUT',   val: student.rut || '—' },
        { label: 'Curso', val: student.curso || '—' },
        { label: 'N° controles', val: String(registros.length) },
    ];
    let px = mL + 10;
    patFields.forEach(f => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...S500);
        doc.text(f.label + ':', px, y + 18);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S900);
        doc.text(f.val, px + doc.getTextWidth(f.label + ':') + 1.5, y + 18);
        px += 58;
    });

    y += patH + 10;

    // ────────────────────────────────────────
    // SECTION TITLE
    // ────────────────────────────────────────
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...S500);
    doc.text('HISTORIAL DE CONTROLES', mL, y);
    doc.setDrawColor(...S300);
    doc.setLineWidth(0.2);
    doc.line(mL + doc.getTextWidth('HISTORIAL DE CONTROLES') + 3, y - 1, pageW - mR, y - 1);
    y += 6;

    // ────────────────────────────────────────
    // CONTROL CARDS
    // ────────────────────────────────────────
    const sorted = registros.slice().sort((a, b) => (b.fecha > a.fecha ? 1 : -1));

    sorted.forEach((r, idx) => {
        const derivList = Object.entries(DERIV_MAP).filter(([k]) => r.derivaciones?.[k]).map(([, v]) => v);
        const hasDiag  = !!r.diagnostico?.trim();
        const hasObs   = !!r.observaciones?.trim();
        const hasDeriv = derivList.length > 0;

        // ── Pre-calculate text heights ──
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        const diagLines = hasDiag  ? doc.splitTextToSize(r.diagnostico.trim(), cW - 18) : [];
        const obsLines  = hasObs   ? doc.splitTextToSize(r.observaciones.trim(), cW - 18) : [];
        const lineH = 4.5;

        let cardH = 10;       // top pad + date row
        cardH += 6;           // separator line gap
        cardH += 24;          // metric boxes (box 16 + label 5 + gap 3)
        if (hasDiag)  cardH += 5 + diagLines.length * lineH + 3;
        if (hasDeriv) cardH += 5 + 8 + 3;
        if (hasObs)   cardH += 5 + obsLines.length * lineH + 3;
        cardH += 6;           // footer padding

        checkBreak(cardH + 4);

        // ── Card shell ──
        doc.setFillColor(...S050);
        doc.roundedRect(mL, y, cW, cardH, 3, 3, 'F');
        doc.setDrawColor(...S100);
        doc.setLineWidth(0.25);
        doc.roundedRect(mL, y, cW, cardH, 3, 3, 'S');

        // Left accent strip
        doc.setFillColor(...TEAL);
        doc.roundedRect(mL, y, 4, cardH, 2, 2, 'F');
        doc.rect(mL + 2, y, 2, cardH, 'F');

        const cx  = mL + 8;
        let cy = y + 7;

        // ── Date + control index ──
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...TEAL);
        doc.text(fmtDate(r.fecha), cx, cy);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S500);
        doc.text(`Control N° ${idx + 1}`, cx + doc.getTextWidth(fmtDate(r.fecha)) + 4, cy);

        if (r.registradoPor) {
            doc.setFontSize(7);
            doc.setTextColor(...S300);
            doc.text(`Registrado por: ${r.registradoPor}`, mL + cW - 3, cy, { align: 'right' });
        }

        cy += 3;
        doc.setDrawColor(...S100);
        doc.setLineWidth(0.2);
        doc.line(cx, cy, mL + cW - 3, cy);
        cy += 5;

        // ── Metric boxes ──
        const metrics = [];
        metrics.push({ label: 'PESO',          value: r.peso != null ? String(r.peso) : null,                     unit: 'kg'    });
        metrics.push({ label: 'TALLA',         value: r.talla != null ? String(r.talla) : null,                   unit: 'cm'    });
        metrics.push({ label: 'CIRC. ABD.',    value: r.circunferenciaAbdominal != null ? String(r.circunferenciaAbdominal) : null, unit: 'cm' });

        if (r.peso != null && r.talla != null && r.talla > 0) {
            const imc = (r.peso / Math.pow(r.talla / 100, 2)).toFixed(1);
            metrics.push({ label: 'IMC', value: imc, unit: 'kg/m²' });
        }

        const boxW = 32;
        const boxH = 16;
        metrics.forEach((m, mi) => {
            const bx = cx + mi * (boxW + 4);
            doc.setFillColor(...WHITE);
            doc.setDrawColor(...S100);
            doc.setLineWidth(0.3);
            doc.roundedRect(bx, cy, boxW, boxH, 2, 2, 'FD');

            if (m.value != null) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...S900);
                doc.text(m.value, bx + boxW / 2, cy + 8.5, { align: 'center' });
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...TEAL);
                doc.text(m.unit, bx + boxW / 2, cy + 13, { align: 'center' });
            } else {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...S300);
                doc.text('—', bx + boxW / 2, cy + 9, { align: 'center' });
            }

            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...S500);
            doc.text(m.label, bx + boxW / 2, cy + boxH + 4, { align: 'center' });
        });

        cy += boxH + 8;

        // ── Diagnóstico ──
        if (hasDiag) {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...S700);
            doc.text('DIAGNÓSTICO', cx, cy);
            cy += 4.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...S900);
            doc.text(diagLines, cx, cy);
            cy += diagLines.length * lineH + 4;
        }

        // ── Derivaciones ──
        if (hasDeriv) {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...S700);
            doc.text('DERIVACIONES', cx, cy);
            cy += 4;

            let dx = cx;
            derivList.forEach(d => {
                const pillW = doc.getTextWidth(d) + 7;
                doc.setFillColor(...AMBER_BG);
                doc.setDrawColor(...AMBER_BD);
                doc.setLineWidth(0.3);
                doc.roundedRect(dx, cy, pillW, 6.5, 1.5, 1.5, 'FD');
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...AMBER);
                doc.text(d, dx + 3.5, cy + 4.5);
                dx += pillW + 3;
            });
            cy += 10;
        }

        // ── Observaciones ──
        if (hasObs) {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...S700);
            doc.text('OBSERVACIONES', cx, cy);
            cy += 4.5;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(...S500);
            doc.text(obsLines, cx, cy);
            cy += obsLines.length * lineH + 3;
        }

        y += cardH + 4;
    });

    // ────────────────────────────────────────
    // SIGNATURE AREA
    // ────────────────────────────────────────
    checkBreak(28);
    y += 6;

    doc.setDrawColor(...S300);
    doc.setLineWidth(0.3);
    const sigW = 65;
    doc.line(mL, y + 18, mL + sigW, y + 18);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...S500);
    doc.text('Firma y Timbre Enfermera(o)', mL, y + 23);

    // ────────────────────────────────────────
    // FOOTER — all pages
    // ────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const ph = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S300);
        doc.text(`Generado ${timestamp} — EYR Digital`, mL, ph - 6);
        doc.text(`Página ${i} de ${totalPages}`, pageW - mR, ph - 6, { align: 'right' });
    }

    const safeName = (student.fullName || 'alumno').replace(/\s+/g, '_');
    doc.save(`FichaControlSano_${safeName}.pdf`);
}

/**
 * Exports absences and replacement suggestions as a formatted PDF.
 *
 * @param {Object} params
 * @param {string} params.dateLabel - e.g. "Viernes 13 de Marzo 2026"
 * @param {string} params.dateStr   - e.g. "2026-03-13"
 * @param {Object} params.groupedAbsences - { [typeLabel]: absenceItem[] }
 * @param {Object|null} params.replacementData - { teacherSections, totalUncovered }
 * @param {Array}  params.logs - replacement log entries for the date
 */
export function exportAbsencesPDF({ dateLabel, dateStr, groupedAbsences, replacementData, logs = [] }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 18;
    const marginR = 18;
    const contentW = pageW - marginL - marginR;
    let y = 20;

    const mainColor = [55, 48, 163]; // indigo-700
    const headerBg = [238, 242, 255]; // indigo-50

    // ─── HEADER ───
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text('Escuela y Recinto Huechuraba', pageW / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Reporte de Ausencias y Reemplazos', pageW / 2, y, { align: 'center' });
    y += 10;

    // Date bar
    doc.setFillColor(...headerBg);
    doc.roundedRect(marginL, y, contentW, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text(dateLabel, pageW / 2, y + 7, { align: 'center' });
    y += 16;

    // ─── SECTION 1: AUSENCIAS ───
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('AUSENCIAS DEL DÍA', marginL, y);
    y += 2;

    // Underline
    doc.setDrawColor(...mainColor);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, marginL + 52, y);
    y += 6;

    const typeEntries = Object.entries(groupedAbsences);

    if (typeEntries.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text('No hay ausencias registradas para este día.', marginL, y);
        y += 10;
    } else {
        for (const [typeLabel, items] of typeEntries) {
            // Check page break
            if (y > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text(typeLabel.toUpperCase(), marginL, y);
            y += 4;

            const rows = items.map(item => {
                let jornada = '—';
                if (item.isHalfDay === 'am') jornada = 'AM';
                else if (item.isHalfDay === 'pm') jornada = 'PM';
                else if (item.isHalfDay === true) jornada = '½ Día';

                return [
                    item.userName || '',
                    item.roleLabel || '',
                    jornada,
                    item.reason || item.diagnosis || '—',
                ];
            });

            autoTable(doc, {
                startY: y,
                margin: { left: marginL, right: marginR },
                head: [['Nombre', 'Rol', 'Jornada', 'Motivo']],
                body: rows,
                styles: {
                    fontSize: 9,
                    cellPadding: 2.5,
                    lineColor: [226, 232, 240],
                    lineWidth: 0.3,
                },
                headStyles: {
                    fillColor: mainColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: contentW * 0.32 },
                    1: { cellWidth: contentW * 0.22 },
                    2: { cellWidth: contentW * 0.16 },
                    3: { cellWidth: contentW * 0.30 },
                },
            });

            y = doc.lastAutoTable.finalY + 6;
        }
    }

    // ─── SECTION 2: REEMPLAZOS SUGERIDOS ───
    if (replacementData && replacementData.teacherSections.length > 0) {
        if (y > doc.internal.pageSize.getHeight() - 50) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('REEMPLAZOS SUGERIDOS', marginL, y);
        y += 2;

        doc.setDrawColor(13, 148, 136); // teal-600
        doc.setLineWidth(0.5);
        doc.line(marginL, y, marginL + 58, y);
        y += 6;

        for (const teacher of replacementData.teacherSections) {
            if (y > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                y = 20;
            }

            // Teacher name + absence type
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(`${teacher.userName}`, marginL, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const nameW = doc.getTextWidth(teacher.userName + ' ');
            doc.text(`— ${teacher.typeLabel}`, marginL + nameW, y);
            y += 5;

            const rows = teacher.blocks.map(block => {
                // Check if block is assigned
                const assignedLog = logs.find(
                    l => l.date === dateStr && l.absentId === teacher.userId && l.startTime === block.startTime
                );

                let candidateText;
                if (assignedLog) {
                    candidateText = `ASIGNADO: ${assignedLog.replacementName}`;
                } else if (block.candidates.length === 0) {
                    candidateText = 'Sin candidatos';
                } else {
                    // Show top 3 candidates with match level
                    candidateText = block.candidates.slice(0, 3).map(c => {
                        const levelLabel = c.matchLevel === 'exact' ? 'Ideal'
                            : c.matchLevel === 'related' ? 'Afín'
                            : 'Disponible';
                        return `${c.firstName} [${levelLabel}]`;
                    }).join(', ');
                    if (block.candidates.length > 3) {
                        candidateText += ` (+${block.candidates.length - 3})`;
                    }
                }

                return [
                    block.startTime || '',
                    block.subject || '—',
                    block.course || '—',
                    candidateText,
                ];
            });

            autoTable(doc, {
                startY: y,
                margin: { left: marginL, right: marginR },
                head: [['Hora', 'Asignatura', 'Curso', 'Candidatos']],
                body: rows,
                styles: {
                    fontSize: 8.5,
                    cellPadding: 2.5,
                    lineColor: [226, 232, 240],
                    lineWidth: 0.3,
                },
                headStyles: {
                    fillColor: [13, 148, 136], // teal-600
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8.5,
                },
                alternateRowStyles: { fillColor: [240, 253, 250] }, // teal-50
                columnStyles: {
                    0: { cellWidth: contentW * 0.12 },
                    1: { cellWidth: contentW * 0.22 },
                    2: { cellWidth: contentW * 0.16 },
                    3: { cellWidth: contentW * 0.50 },
                },
                didParseCell: (data) => {
                    // Highlight assigned rows in green
                    if (data.section === 'body' && data.column.index === 3) {
                        const text = data.cell.raw || '';
                        if (text.startsWith('ASIGNADO:')) {
                            data.cell.styles.textColor = [5, 122, 85]; // emerald-700
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
            });

            y = doc.lastAutoTable.finalY + 6;
        }
    }

    // ─── FOOTER (on every page) ───
    const totalPages = doc.internal.getNumberOfPages();
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Generado ${timestamp} — EYR Digital`, marginL, pageH - 10);
        doc.text(`Página ${i} de ${totalPages}`, pageW - marginR, pageH - 10, { align: 'right' });
    }

    // ─── SAVE ───
    const safeDateStr = dateStr.replace(/-/g, '');
    doc.save(`Ausencias_${safeDateStr}.pdf`);
}

// ============================================
// AUSENCIAS SEMANALES — Con logo y consolidado
// ============================================

/**
 * Exports weekly absences (consolidado) + selected day detail as a styled PDF.
 *
 * @param {Object} params
 * @param {string} params.weekLabel       - e.g. "Semana del 7 al 11 de Abril 2026"
 * @param {Array}  params.weekDays        - [{ dateStr, date, dayNum, dayName }]
 * @param {Array}  params.weekConsolidado - [{ userId, userName, roleLabel, days: {dateStr: absence} }]
 * @param {string} params.dateLabel       - e.g. "Lunes 7 de Abril 2026"
 * @param {string} params.dateStr         - e.g. "2026-04-07"
 * @param {Object} params.groupedAbsences - { [typeLabel]: absenceItem[] }
 */
export async function exportWeeklyAbsencesPDF({ weekLabel, weekDays, weekConsolidado, dateLabel, dateStr, groupedAbsences }) {
    const logoDataUrl = await loadImageAsDataUrl(logoEyrUrl);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const mL = 14, mR = 14, mBot = 16;
    const cW = pageW - mL - mR;

    // ── Palette ──
    const I900  = [30, 27, 75];
    const I700  = [67, 56, 202];
    const I500  = [99, 102, 241];
    const I100  = [224, 231, 255];
    const I50   = [238, 242, 255];
    const ROSE100 = [255, 228, 230]; const ROSE700 = [190, 18, 60];
    const AMB100  = [254, 243, 199]; const AMB700  = [180, 83, 9];
    const VIO100  = [237, 233, 254]; const VIO700  = [109, 40, 217];
    const TEA100  = [204, 251, 241]; const TEA700  = [15, 118, 110];
    const LIM100  = [236, 252, 203]; const LIM700  = [63, 98, 18];
    const S900 = [15, 23, 42];
    const S500 = [100, 116, 139];
    const S300 = [148, 163, 184];
    const S200 = [203, 213, 225];
    const S100 = [241, 245, 249];
    const S50  = [248, 250, 252];
    const WHITE = [255, 255, 255];

    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    let y = 0;

    // ── Helpers ──
    const getPillColors = (text) => {
        if (text === 'Lic. Med.')  return [ROSE100, ROSE700];
        if (text === 'Día Adm.')   return [I100, I700];
        if (text === '½ AM')       return [AMB100, AMB700];
        if (text === '½ PM')       return [VIO100, VIO700];
        if (text === '½ Día')      return [TEA100, TEA700];
        if (text === 'Perm. H.')   return [LIM100, LIM700];
        return null;
    };

    const accentFor = (typeLabel) => {
        if (typeLabel === 'Licencia Médica')   return ROSE700;
        if (typeLabel?.includes('Mañana'))     return AMB700;
        if (typeLabel?.includes('Tarde'))      return VIO700;
        if (typeLabel?.includes('½'))          return TEA700;
        if (typeLabel === 'Permiso de Horas')  return LIM700;
        return I700;
    };

    const bgFor = (typeLabel) => {
        if (typeLabel === 'Licencia Médica')  return [255, 244, 244];
        if (typeLabel?.includes('Mañana'))    return [255, 252, 244];
        if (typeLabel?.includes('Tarde'))     return [251, 249, 255];
        if (typeLabel?.includes('½'))         return [245, 253, 252];
        return WHITE;
    };

    // ── Continuation page mini-header ──
    const addPageHeader = () => {
        doc.addPage();
        y = 8;
        doc.addImage(logoDataUrl, 'JPEG', mL, y, 8, 8);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...I700);
        doc.text('AUSENCIAS SEMANALES', mL + 11, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S500);
        doc.text(weekLabel, pageW - mR, y + 5, { align: 'right' });
        doc.setDrawColor(...S200);
        doc.setLineWidth(0.2);
        doc.line(mL, y + 11, pageW - mR, y + 11);
        y += 17;
    };

    const checkBreak = (needed) => {
        if (y + needed > pageH - mBot - 10) addPageHeader();
    };

    // ── Section header: card-strip style ──
    const drawSection = (title, subtitle = '') => {
        checkBreak(12);
        doc.setFillColor(...I50);
        doc.rect(mL, y, cW, 10, 'F');
        doc.setFillColor(...I700);
        doc.rect(mL, y, 3, 10, 'F');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...I900);
        doc.text(title, mL + 7, y + 6.8);
        if (subtitle) {
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...S500);
            doc.text(subtitle, pageW - mR, y + 6.8, { align: 'right' });
        }
        y += 13;
    };

    // ── HEADER ──────────────────────────────────────
    doc.setFillColor(...I900);
    doc.rect(0, 0, pageW * 0.6, 5, 'F');
    doc.setFillColor(...I500);
    doc.rect(pageW * 0.6, 0, pageW * 0.4, 5, 'F');
    y = 10;

    const logoSize = 24;
    doc.addImage(logoDataUrl, 'JPEG', mL, y, logoSize, logoSize);

    const textX = mL + logoSize + 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...I700);
    doc.text('Centro Educacional', textX, y + 7);
    doc.text('Ernesto Yañez Rivera', textX, y + 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...S500);
    doc.text('Lasana 6664, Huechuraba · Inspectoría', textX, y + 20);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...S900);
    doc.text('AUSENCIAS', pageW - mR, y + 8, { align: 'right' });
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...S500);
    doc.text('REPORTE SEMANAL', pageW - mR, y + 15, { align: 'right' });

    y += logoSize + 4;
    doc.setDrawColor(...S200);
    doc.setLineWidth(0.3);
    doc.line(mL, y, pageW - mR, y);
    y += 5;

    // Week label — solid dark pill
    doc.setFillColor(...I900);
    doc.roundedRect(mL, y, cW, 9, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(weekLabel, pageW / 2, y + 6, { align: 'center' });
    y += 13;

    // ── SECTION 1: CONSOLIDADO SEMANAL ─────────────
    const totalAbsent = weekConsolidado.length;
    drawSection(
        'Ausencias de la Semana',
        totalAbsent > 0 ? `${totalAbsent} ${totalAbsent === 1 ? 'persona' : 'personas'} con ausencias` : 'Sin ausencias'
    );

    if (weekConsolidado.length === 0) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...S300);
        doc.text('Sin ausencias registradas esta semana.', mL, y);
        y += 10;
    } else {
        // Col 0: Persona (nombre + rol dibujados manualmente, 2 líneas)
        // Col 1–5: un día cada uno — 65% del ancho total
        const personColW = cW * 0.35;
        const dayColW    = (cW * 0.65) / 5;

        const weekRows = weekConsolidado.map(entry => {
            const row = [entry.userName]; // rol se dibuja en didDrawCell con data.row.index
            weekDays.forEach(day => {
                const abs = entry.days[day.dateStr];
                if (!abs) row.push('');
                else if (abs.typeLabel === 'Licencia Médica') row.push('Lic. Med.');
                else if (abs.isHalfDay === 'am')  row.push('½ AM');
                else if (abs.isHalfDay === 'pm')  row.push('½ PM');
                else if (abs.isHalfDay === true)  row.push('½ Día');
                else if (abs.type === 'hour_permission') row.push('Perm. H.');
                else row.push('Día Adm.');
            });
            return row;
        });

        const dayHeaders = weekDays.map(d => {
            const date = new Date(d.dateStr + 'T12:00:00');
            return `${d.dayName}\n${date.getDate()}`;
        });

        autoTable(doc, {
            startY: y,
            margin: { left: mL, right: mR },
            head: [['Persona', ...dayHeaders]],
            body: weekRows,
            styles: {
                fontSize: 8,
                cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
                lineWidth: 0,
                fillColor: WHITE,
                textColor: S900,
                valign: 'middle',
                halign: 'center',
                minCellHeight: 14,
            },
            headStyles: {
                fillColor: I900,
                textColor: WHITE,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
                cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
                lineWidth: 0,
                minCellHeight: 12,
            },
            columnStyles: {
                0: { cellWidth: personColW, halign: 'left' },
                1: { cellWidth: dayColW },
                2: { cellWidth: dayColW },
                3: { cellWidth: dayColW },
                4: { cellWidth: dayColW },
                5: { cellWidth: dayColW },
            },
            didParseCell: (data) => {
                // Limpia el texto de todas las celdas body — se dibujan en didDrawCell
                if (data.section === 'body') data.cell.text = [];
            },
            didDrawCell: (data) => {
                if (data.section !== 'body') return;

                // Separador horizontal entre filas
                doc.setDrawColor(...S100);
                doc.setLineWidth(0.25);
                doc.line(
                    data.cell.x, data.cell.y + data.cell.height,
                    data.cell.x + data.cell.width, data.cell.y + data.cell.height
                );

                // Columna 0: Nombre (bold) + Rol (gris, línea 2)
                if (data.column.index === 0) {
                    const entry = weekConsolidado[data.row.index];
                    if (!entry) return; // remainder rows tienen index = -1
                    const { x: cx, y: cy, height: ch } = data.cell;
                    const px = cx + 4;
                    const midY = cy + ch / 2;

                    doc.setFontSize(8.5);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...S900);
                    doc.text(entry.userName, px, midY - 1.5);

                    doc.setFontSize(6.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...S500);
                    doc.text(entry.roleLabel, px, midY + 4);
                }

                // Columnas 1–5: pill badge del día
                if (data.column.index >= 1) {
                    const rawText = data.cell.raw || '';
                    if (!rawText) return;
                    const colors = getPillColors(rawText);
                    if (!colors) return;
                    const [bg, fg] = colors;

                    const { x: cx, y: cy, width: cw, height: ch } = data.cell;
                    const pillW = Math.min(cw - 4, cw * 0.82);
                    const pillH = 7;
                    const pillX = cx + (cw - pillW) / 2;
                    const pillY = cy + (ch - pillH) / 2;

                    doc.setFillColor(...bg);
                    doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'F');
                    doc.setFontSize(6.5);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...fg);
                    doc.text(rawText, pillX + pillW / 2, pillY + pillH / 2 + 2.2, { align: 'center' });
                }
            },
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    // ── SECTION 2: AUSENCIAS DEL DÍA (card rows) ───
    if (dateLabel && groupedAbsences) {
        const typeEntries = Object.entries(groupedAbsences);
        const totalDaily = typeEntries.reduce((sum, [, items]) => sum + items.length, 0);

        drawSection(
            `Ausencias del Día  —  ${dateLabel}`,
            totalDaily > 0 ? `${totalDaily} ${totalDaily === 1 ? 'persona' : 'personas'}` : ''
        );

        if (typeEntries.length === 0) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(...S300);
            doc.text('Sin ausencias registradas para este día.', mL, y);
            y += 10;
        } else {
            for (const [typeLabel, items] of typeEntries) {
                checkBreak(6 + items.length * 14);

                // Group label
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...S500);
                doc.text(typeLabel.toUpperCase(), mL, y);
                y += 4;

                for (const item of items) {
                    checkBreak(13);

                    const cardH = 12;
                    const accent = accentFor(item.typeLabel);
                    const cardBg = bgFor(item.typeLabel);
                    const initials = (item.userName || '').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

                    // Card background
                    doc.setFillColor(...cardBg);
                    doc.rect(mL, y, cW, cardH, 'F');

                    // Left accent strip
                    doc.setFillColor(...accent);
                    doc.rect(mL, y, 3, cardH, 'F');

                    // Avatar circle with initials
                    const avX = mL + 9;
                    const avY = y + cardH / 2;
                    doc.setFillColor(...accent);
                    doc.circle(avX, avY, 3.5, 'F');
                    doc.setFontSize(5.5);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...WHITE);
                    doc.text(initials, avX, avY + 1.8, { align: 'center' });

                    // Name (bold)
                    const contentX = mL + 15;
                    doc.setFontSize(8.5);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...S900);
                    doc.text(item.userName || '', contentX, y + 4.8);
                    const nameW = doc.getTextWidth(item.userName || ''); // measure at 8.5pt

                    // Role inline (gray, lighter)
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...S500);
                    doc.text(`· ${item.roleLabel || ''}`, contentX + nameW + 2, y + 4.8);

                    // Motivo / Diagnosis (second line, truncated)
                    const motivoText = item.reason || item.diagnosis || '';
                    if (motivoText && motivoText !== '—') {
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(...S500);
                        const maxW = cW - 55;
                        let m = motivoText;
                        while (doc.getTextWidth(m) > maxW && m.length > 3) m = m.slice(0, -1);
                        if (m !== motivoText) m += '…';
                        doc.text(m, contentX, y + 9.5);
                    }

                    // Right badge
                    let badgeText = null, badgeBg = I50, badgeFg = I700;
                    if (item.typeLabel === 'Licencia Médica' && item.daysLeft !== undefined) {
                        badgeText = item.daysLeft === 0 ? 'Último día' : `${item.daysLeft}d restantes`;
                        badgeBg = item.daysLeft === 0 ? [209, 250, 229] : item.daysLeft <= 2 ? AMB100 : ROSE100;
                        badgeFg = item.daysLeft === 0 ? [6, 95, 70] : item.daysLeft <= 2 ? AMB700 : ROSE700;
                    } else if (item.isHalfDay === 'am') {
                        badgeText = 'Mañana'; badgeBg = AMB100; badgeFg = AMB700;
                    } else if (item.isHalfDay === 'pm') {
                        badgeText = 'Tarde'; badgeBg = VIO100; badgeFg = VIO700;
                    } else if (item.isHalfDay === true) {
                        badgeText = 'Medio Día'; badgeBg = TEA100; badgeFg = TEA700;
                    }

                    if (badgeText) {
                        doc.setFontSize(6);
                        doc.setFont('helvetica', 'bold');
                        const bW = doc.getTextWidth(badgeText) + 7;
                        const bH = 5;
                        const bX = mL + cW - bW - 3;
                        const bY = y + (cardH - bH) / 2;
                        doc.setFillColor(...badgeBg);
                        doc.roundedRect(bX, bY, bW, bH, 1.5, 1.5, 'F');
                        doc.setTextColor(...badgeFg);
                        doc.text(badgeText, bX + bW / 2, bY + bH / 2 + 1.8, { align: 'center' });
                    }

                    // Separator line below card
                    doc.setDrawColor(...S200);
                    doc.setLineWidth(0.2);
                    doc.line(mL + 3, y + cardH, mL + cW, y + cardH);

                    y += cardH + 1.5;
                }

                y += 3;
            }
        }
    }

    // ── LEGEND ──────────────────────────────────────
    checkBreak(12);
    y += 3;
    doc.setFillColor(...S50);
    doc.rect(mL, y, cW, 9, 'F');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...S500);
    doc.text('LEYENDA', mL + 4, y + 6);

    const LEGEND = [
        { text: 'Día Adm.', bg: I100,    fg: I700 },
        { text: '½ AM',     bg: AMB100,  fg: AMB700 },
        { text: '½ PM',     bg: VIO100,  fg: VIO700 },
        { text: 'Lic. Med.',bg: ROSE100, fg: ROSE700 },
        { text: 'Perm. H.', bg: LIM100,  fg: LIM700 },
    ];
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    let lx = mL + 20;
    const lPillH = 5;
    const lPillY = y + (9 - lPillH) / 2;
    LEGEND.forEach(({ text, bg, fg }) => {
        const lPillW = doc.getTextWidth(text) + 7;
        doc.setFillColor(...bg);
        doc.roundedRect(lx, lPillY, lPillW, lPillH, 1.5, 1.5, 'F');
        doc.setTextColor(...fg);
        doc.text(text, lx + lPillW / 2, lPillY + lPillH / 2 + 1.8, { align: 'center' });
        lx += lPillW + 3;
    });
    y += 12;

    // ── FOOTER (todas las páginas) ──────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const ph = doc.internal.pageSize.getHeight();
        doc.setDrawColor(...S200);
        doc.setLineWidth(0.25);
        doc.line(mL, ph - 12, pageW - mR, ph - 12);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S300);
        doc.text(`Generado ${timestamp} — EYR Digital`, mL, ph - 8);
        doc.text(`Página ${i} de ${totalPages}`, pageW - mR, ph - 8, { align: 'right' });
    }

    const safeDateStr = dateStr ? dateStr.replace(/-/g, '') : 'semana';
    doc.save(`Ausencias_Semanales_${safeDateStr}.pdf`);
}

// ============================================
// ENTREVISTAS — Acta Individual
// ============================================

/**
 * Exports a single entrevista as a formal "acta" PDF with signature lines.
 *
 * @param {Object} params
 * @param {Object} params.entrevista - The entrevista record
 */
export function exportEntrevistaActaPDF({ entrevista }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginL = 22;
    const marginR = 22;
    const contentW = pageW - marginL - marginR;
    let y = 22;

    const mainColor = [55, 48, 163];
    const headerBg = [238, 242, 255];

    const reasonLabels = { conducta: 'Conducta', asistencia: 'Asistencia', academico: 'Academico', otro: 'Otro' };
    const participantLabels = { alumno: 'Alumno', apoderado: 'Apoderado' };

    function formatDateShort(d) {
        if (!d) return '';
        const [yy, mm, dd] = d.split('-');
        return `${dd}/${mm}/${yy}`;
    }

    // ─── HEADER ───
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text('Escuela y Recinto Huechuraba', pageW / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Acta de Entrevista — Inspectoria', pageW / 2, y, { align: 'center' });
    y += 10;

    // Date bar
    doc.setFillColor(...headerBg);
    doc.roundedRect(marginL, y, contentW, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text(`Fecha: ${formatDateShort(entrevista.date)}`, pageW / 2, y + 7, { align: 'center' });
    y += 16;

    // ─── STUDENT INFO TABLE ───
    const infoRows = [
        ['Alumno', entrevista.studentName || ''],
        ['RUT', entrevista.studentRut || ''],
        ['Curso', entrevista.studentCurso || ''],
        ['Participantes', participantLabels[entrevista.participants] || entrevista.participants],
    ];
    if (entrevista.parentName) {
        infoRows.push(['Apoderado', entrevista.parentName]);
    }

    autoTable(doc, {
        startY: y,
        margin: { left: marginL, right: marginR },
        body: infoRows,
        styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [226, 232, 240],
            lineWidth: 0.3,
        },
        columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold', textColor: [55, 48, 163] },
            1: { cellWidth: contentW - 35 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = doc.lastAutoTable.finalY + 8;

    // ─── MOTIVO ───
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('MOTIVO', marginL, y);
    y += 2;
    doc.setDrawColor(...mainColor);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, marginL + 20, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 48, 163);
    doc.text(reasonLabels[entrevista.reason] || entrevista.reason, marginL, y);
    y += 5;

    if (entrevista.reasonDetail) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(entrevista.reasonDetail, contentW);
        doc.text(lines, marginL, y);
        y += lines.length * 5 + 4;
    }

    // ─── RESUMEN ───
    if (entrevista.summary) {
        y += 2;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('RESUMEN DE LO CONVERSADO', marginL, y);
        y += 2;
        doc.setDrawColor(...mainColor);
        doc.line(marginL, y, marginL + 58, y);
        y += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(entrevista.summary, contentW);
        doc.text(lines, marginL, y);
        y += lines.length * 5 + 4;
    }

    // ─── COMPROMISOS ───
    if (entrevista.commitments) {
        y += 2;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('COMPROMISOS / ACUERDOS', marginL, y);
        y += 2;
        doc.setDrawColor(...mainColor);
        doc.line(marginL, y, marginL + 54, y);
        y += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(entrevista.commitments, contentW);
        doc.text(lines, marginL, y);
        y += lines.length * 5 + 4;
    }

    // ─── SIGNATURE LINES ───
    const sigY = Math.max(y + 20, pageH - 65);
    const sigW = (contentW - 20) / 3;

    const signatures = ['Inspector(a)', 'Apoderado(a)', 'Alumno(a)'];
    signatures.forEach((label, i) => {
        const x = marginL + i * (sigW + 10);
        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.3);
        doc.line(x, sigY, x + sigW, sigY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(label, x + sigW / 2, sigY + 5, { align: 'center' });
    });

    // ─── FOOTER ───
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado ${timestamp} — EYR Digital`, marginL, pageH - 10);
    if (entrevista.registeredBy?.name) {
        doc.text(`Registrado por: ${entrevista.registeredBy.name}`, pageW - marginR, pageH - 10, { align: 'right' });
    }

    // ─── SAVE ───
    const safeName = (entrevista.studentName || 'alumno').replace(/\s+/g, '_').substring(0, 30);
    doc.save(`Acta_Entrevista_${safeName}_${entrevista.date}.pdf`);
}

// ============================================
// ENTREVISTAS — Reporte Resumen
// ============================================

/**
 * Exports a summary report of filtered entrevistas.
 *
 * @param {Object} params
 * @param {Array}  params.entrevistas - Filtered entrevista records
 * @param {Object} params.stats       - { total, byReason, topCursos }
 * @param {Object} params.filters     - Active filter labels for display
 */
export function exportEntrevistasResumenPDF({ entrevistas, stats, filters }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 14;
    const marginR = 14;
    const contentW = pageW - marginL - marginR;
    let y = 18;

    const mainColor = [55, 48, 163];
    const headerBg = [238, 242, 255];

    const reasonLabels = { conducta: 'Conducta', asistencia: 'Asistencia', academico: 'Academico', otro: 'Otro' };
    const participantLabels = { alumno: 'Alumno', apoderado: 'Apoderado' };

    function formatDateShort(d) {
        if (!d) return '';
        const [yy, mm, dd] = d.split('-');
        return `${dd}/${mm}/${yy}`;
    }

    // ─── HEADER ───
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text('Escuela y Recinto Huechuraba', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Reporte de Entrevistas — Inspectoria', pageW / 2, y, { align: 'center' });
    y += 9;

    // ─── Active filters bar ───
    const filterParts = [];
    if (filters.curso) filterParts.push(`Curso: ${filters.curso}`);
    if (filters.reason) filterParts.push(`Motivo: ${reasonLabels[filters.reason] || filters.reason}`);
    if (filters.participants) filterParts.push(`Participantes: ${participantLabels[filters.participants] || filters.participants}`);
    const filterText = filterParts.length > 0 ? filterParts.join(' | ') : 'Sin filtros';

    doc.setFillColor(...headerBg);
    doc.roundedRect(marginL, y, contentW, 9, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text(filterText, pageW / 2, y + 6.5, { align: 'center' });
    y += 14;

    // ─── KPIs ───
    const reasons = ['conducta', 'asistencia', 'academico', 'otro'];
    const kpis = [
        { label: 'Total', value: String(stats.total || 0) },
        ...reasons.map(r => ({ label: reasonLabels[r], value: String(stats.byReason?.[r] || 0) })),
    ];
    const kpiW = contentW / kpis.length;
    for (let i = 0; i < kpis.length; i++) {
        const x = marginL + i * kpiW;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x + 1, y, kpiW - 2, 14, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(kpis[i].value, x + kpiW / 2, y + 8, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(kpis[i].label, x + kpiW / 2, y + 12.5, { align: 'center' });
    }
    y += 19;

    // ─── TABLE ───
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DETALLE DE ENTREVISTAS', marginL, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${entrevistas.length} registro${entrevistas.length !== 1 ? 's' : ''}`, marginL + 55, y);
    y += 2;
    doc.setDrawColor(...mainColor);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, marginL + 50, y);
    y += 4;

    const rows = entrevistas.map(e => [
        formatDateShort(e.date),
        e.studentName || '',
        e.studentCurso || '',
        reasonLabels[e.reason] || e.reason,
        participantLabels[e.participants] || e.participants,
        e.parentName || '—',
        (e.reasonDetail || e.summary || '').substring(0, 60) + ((e.reasonDetail || e.summary || '').length > 60 ? '...' : ''),
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: marginL, right: marginR },
        head: [['Fecha', 'Alumno', 'Curso', 'Motivo', 'Participantes', 'Apoderado', 'Detalle']],
        body: rows,
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [226, 232, 240],
            lineWidth: 0.2,
            overflow: 'ellipsize',
        },
        headStyles: {
            fillColor: mainColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: contentW * 0.08, halign: 'center', font: 'courier' },
            1: { cellWidth: contentW * 0.18 },
            2: { cellWidth: contentW * 0.10, halign: 'center' },
            3: { cellWidth: contentW * 0.10, halign: 'center' },
            4: { cellWidth: contentW * 0.10, halign: 'center' },
            5: { cellWidth: contentW * 0.16 },
            6: { cellWidth: contentW * 0.28 },
        },
    });

    // ─── FOOTER ───
    const totalPages = doc.internal.getNumberOfPages();
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Generado ${timestamp} — EYR Digital`, marginL, pH - 8);
        doc.text(`Página ${i} de ${totalPages}`, pageW - marginR, pH - 8, { align: 'right' });
    }

    // ─── SAVE ───
    const safeDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`Entrevistas_Resumen_${safeDate}.pdf`);
}

/**
 * Exports the approved admin-day requests history as a PDF table.
 *
 * @param {Array}  requests  - approved request objects (already filtered)
 * @param {Object} filters   - { month, type } labels for subtitle
 */
export function exportAdminDaysHistoryPDF(requests, filters = {}) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginL = 14;
    const marginR = 14;
    const contentW = pageW - marginL - marginR;
    const mainColor = [55, 48, 163];
    let y = 18;

    // ─── HEADER ───
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text('Centro Educacional Ernesto Yañez Rivera', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Historial de Días Administrativos Aprobados', pageW / 2, y, { align: 'center' });
    y += 8;

    // Subtitle filters
    const subtitleParts = [];
    if (filters.month && filters.month !== 'all') subtitleParts.push(`Mes: ${filters.monthLabel}`);
    if (filters.type && filters.type !== 'all') subtitleParts.push(`Tipo: ${filters.typeLabel}`);
    if (filters.search) subtitleParts.push(`Persona: ${filters.search}`);
    const subtitle = subtitleParts.length > 0 ? subtitleParts.join('  •  ') : 'Todos los registros';

    doc.setFillColor(238, 242, 255);
    doc.roundedRect(marginL, y, contentW, 9, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mainColor);
    doc.text(subtitle, pageW / 2, y + 6, { align: 'center' });
    y += 14;

    // ─── KPI chips ───
    const byType = {};
    requests.forEach(r => {
        const key = r.type || (r.reason?.startsWith('[Excepcion]') ? 'special' : r.isHalfDay ? 'half_day' : 'day');
        byType[key] = (byType[key] || 0) + 1;
    });
    const kpis = [
        { label: 'Total registros', value: String(requests.length) },
        { label: 'Días completos', value: String(byType['day'] || 0) },
        { label: 'Medios días', value: String(byType['half_day'] || 0) },
        { label: 'Perm. Horas', value: String(byType['hour_permission'] || 0) },
        { label: 'Descuentos', value: String(byType['discount'] || 0) },
    ];
    const kpiW = contentW / kpis.length;
    for (let i = 0; i < kpis.length; i++) {
        const x = marginL + i * kpiW;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x + 1, y, kpiW - 2, 14, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(kpis[i].value, x + kpiW / 2, y + 8, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(kpis[i].label, x + kpiW / 2, y + 12.5, { align: 'center' });
    }
    y += 20;

    // ─── TABLE ───
    const getTypeLabel = (r) => {
        if (r.type === 'hour_return') return 'Devolucion Horas';
        if (r.type === 'hour_permission') return 'Permiso Horas';
        if (r.type === 'discount') return 'Descuento';
        if (r.reason?.startsWith('[Excepcion]')) return 'Excepcion';
        if (r.isHalfDay === 'am') return 'Medio Dia AM';
        if (r.isHalfDay === 'pm') return 'Medio Dia PM';
        if (r.isHalfDay) return 'Medio Dia';
        return 'Dia Admin.';
    };

    const formatDateStr = (d) => {
        if (!d) return '';
        const date = new Date(d + 'T12:00:00');
        return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const rows = requests.map(r => [
        formatDateStr(r.date),
        r.userName || '',
        getTypeLabel(r),
        (r.reason || '').replace(/^\[(Excepcion|Horas|Devolucion|Descuento)\]\s*/, ''),
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Funcionario', 'Tipo', 'Motivo']],
        body: rows,
        margin: { left: marginL, right: marginR },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
            fillColor: mainColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 55 },
            2: { cellWidth: 35 },
            3: { cellWidth: 'auto' },
        },
        didDrawPage: () => {
            const totalPages = doc.internal.getNumberOfPages();
            const timestamp = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.text(`Generado ${timestamp} — EYR Digital`, marginL, pageH - 8);
                doc.text(`Pagina ${i} de ${totalPages}`, pageW - marginR, pageH - 8, { align: 'right' });
            }
        },
    });

    const safeDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`Historial_DiasAdmin_${safeDate}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDARIO DE EVALUACIONES — UTP
// ─────────────────────────────────────────────────────────────────────────────

const ASIG_FULL_PDF = {
    MA: 'Matemática', LE: 'Lenguaje', CN: 'Ciencias Naturales', HI: 'Historia',
    IN: 'Inglés', EF: 'Ed. Física', AV: 'Artes Visuales', MU: 'Música',
    TE: 'Tecnología', OR: 'Orientación',
};

const ASIG_COLORS_PDF = {
    MA: [37, 99, 235],   // blue-600
    LE: [124, 58, 237],  // violet-600
    CN: [5, 150, 105],   // emerald-600
    HI: [180, 83, 9],    // amber-700
    IN: [2, 132, 199],   // sky-600
    EF: [234, 88, 12],   // orange-600
    AV: [162, 28, 175],  // fuchsia-700
    MU: [190, 18, 60],   // rose-700
    TE: [71, 85, 105],   // slate-600
    OR: [13, 148, 136],  // teal-600
};

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Exports the evaluation calendar as a week-by-week PDF (Mon–Fri, one month).
 * Layout: 2 weeks per page, each week with its own "Semana N" label strip.
 * Pills show: subject/course, eval name, professor, and block/time.
 */
export async function exportCalendarioPDF({ evaluaciones, selectedCurso, mesLabel, year, month, holidays = {} }) {
    const [logoDataUrl, oaLookup] = await Promise.all([
        loadImageAsDataUrl(logoEyrUrl),
        fetchOALookup(),
    ]);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // 297
    const pageH  = doc.internal.pageSize.getHeight(); // 210
    const mL = 10, mR = 10, mT = 8, mBot = 8;
    const cW = pageW - mL - mR; // 277

    // ── Paleta institucional EYR ──────────────────
    // Colores del logo: azul marino, dorado, rojo oscuro
    const NAVY       = [22,  38,  90];   // azul marino del escudo
    const NAVY_DIM   = [60,  80, 140];   // azul marino medio (acento)
    const NAVY_LIGHT = [220, 228, 248];  // azul marino claro (fondo hoy)
    const GOLD       = [196, 148,   0];  // dorado de la llama/franja
    const GOLD_LIGHT = [255, 243, 195];  // dorado claro (no usado, reserva)
    const RED       = [220,  38,  38];  // rojo feriado
    const RED_LIGHT = [254, 226, 226];  // fondo feriado
    const S900 = [15, 23, 42];
    const S700 = [51, 65, 85];
    const S500 = [100, 116, 139];
    const S300 = [148, 163, 184];
    const S200 = [203, 213, 225];
    const S100 = [241, 245, 249];
    const WHITE     = [255, 255, 255];
    const WHITE_DIM = [210, 218, 240];

    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const todayStr = now.toISOString().slice(0, 10);

    const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // ── Build Mon–Fri month grid ──────────────────
    const buildGrid = (yr, mo) => {
        const firstDay = new Date(yr, mo, 1);
        const lastDay  = new Date(yr, mo + 1, 0);
        const start    = new Date(firstDay);
        const startDow = start.getDay();
        start.setDate(start.getDate() - (startDow === 0 ? 6 : startDow - 1));
        const end    = new Date(lastDay);
        const endDow = end.getDay();
        if      (endDow === 0) end.setDate(end.getDate() - 2);
        else if (endDow === 6) end.setDate(end.getDate() - 1);
        else if (endDow < 5)  end.setDate(end.getDate() + (5 - endDow));
        const weeks  = [];
        const cursor = new Date(start);
        while (cursor <= end) {
            const week = [];
            for (let d = 0; d < 5; d++) {
                const day = new Date(cursor);
                day.setDate(cursor.getDate() + d);
                week.push({
                    dateStr: day.toISOString().slice(0, 10),
                    inMonth: day.getMonth() === mo && day.getFullYear() === yr,
                    dayNum:  day.getDate(),
                });
            }
            weeks.push(week);
            cursor.setDate(cursor.getDate() + 7);
        }
        return weeks;
    };

    // ── Index evaluaciones by date ────────────────
    const evalsByDate = {};
    evaluaciones.forEach(e => {
        if (!e.date) return;
        if (!evalsByDate[e.date]) evalsByDate[e.date] = [];
        evalsByDate[e.date].push(e);
    });

    const DIAS_HEADER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const weeks  = buildGrid(year, month);
    const nWeeks = weeks.length;
    const colW   = cW / 5;

    // ── Pagination: 2 weeks per page ─────────────
    const pages = [];
    for (let i = 0; i < nWeeks; i += 2) pages.push(weeks.slice(i, i + 2));

    // ── Layout constants ─────────────────────────
    const HEADER_H     = 32;
    const RUN_HEADER_H = 18;
    const DAY_ROW_H    = 6;   // column names, once per page
    const WEEK_LABEL_H = 9;   // "SEMANA N · fecha" strip per week
    const FOOTER_H     = 7;
    const PILL_H       = 16;  // tall pill for 4 lines of detail
    const PILL_GAP     = 1.5;
    const PILL_TOP     = 9;   // offset from cell top to first pill
    const pillW        = colW - 3;

    // DATA_H per week: space below week label, within a page
    // P1 avail = 210 - 8 - 32 - 6 - 7 - 8 = 149mm; 2 weeks → (149 - 2×9) / 2 = 65.5mm
    // Pn avail = 210 - 8 - 18 - 6 - 7 - 8 = 163mm; 2 weeks → (163 - 18) / 2 = 72.5mm; 1 week → min(75, 154)
    const dataHForPage = (avail, numW) => Math.min(75, (avail - numW * WEEK_LABEL_H) / numW);

    // ── Week label text ───────────────────────────
    const weekRangeLabel = (week, n) => {
        const d1 = new Date(week[0].dateStr + 'T12:00:00');
        const d5 = new Date(week[4].dateStr + 'T12:00:00');
        const sameM = d1.getMonth() === d5.getMonth();
        const range = sameM
            ? `${d1.getDate()} al ${d5.getDate()} de ${MESES_ES[d1.getMonth()]}`
            : `${d1.getDate()} ${MESES_ES[d1.getMonth()].slice(0,3)}. – ${d5.getDate()} ${MESES_ES[d5.getMonth()].slice(0,3)}.`;
        return `SEMANA ${n}   ·   ${range}`;
    };

    // ── Draw helpers ─────────────────────────────
    const drawDayNameRow = (topY) => {
        DIAS_HEADER.forEach((dia, i) => {
            const cx = mL + i * colW;
            doc.setFillColor(...NAVY_LIGHT);
            doc.rect(cx, topY, colW, DAY_ROW_H, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...NAVY);
            doc.text(dia.toUpperCase(), cx + colW / 2, topY + 4.3, { align: 'center' });
        });
        // outer border
        doc.setDrawColor(...NAVY);
        doc.setLineWidth(0.25);
        doc.rect(mL, topY, cW, DAY_ROW_H);
    };

    const drawWeekLabel = (topY, labelText) => {
        doc.setFillColor(...NAVY);
        doc.rect(mL, topY, cW, WEEK_LABEL_H, 'F');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...WHITE);
        doc.text(labelText, mL + 5, topY + 6.2);
    };

    const drawWeekCells = (week, cellsTop, dataH) => {
        week.forEach(({ dateStr, inMonth, dayNum }, di) => {
            const cx         = mL + di * colW;
            const isToday    = dateStr === todayStr;
            const isHoliday  = inMonth && !!holidays[dateStr];
            const holidayName = isHoliday ? holidays[dateStr] : null;

            // Cell fill
            if (!inMonth)         doc.setFillColor(...S100);
            else if (isHoliday)   doc.setFillColor(...RED_LIGHT);
            else if (isToday)     doc.setFillColor(...NAVY_LIGHT);
            else                  doc.setFillColor(...WHITE);
            doc.rect(cx, cellsTop, colW, dataH, 'F');

            // Cell border
            doc.setDrawColor(...S200);
            doc.setLineWidth(0.15);
            doc.rect(cx, cellsTop, colW, dataH);

            // Day number + holiday label
            if (isToday) {
                doc.setFillColor(...NAVY);
                doc.roundedRect(cx + 2, cellsTop + 2, 9, 9, 4.5, 4.5, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...WHITE);
                doc.text(String(dayNum), cx + 6.5, cellsTop + 8.3, { align: 'center' });
            } else if (isHoliday) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...RED);
                doc.text(String(dayNum), cx + 4, cellsTop + 6.5);
                // Nombre del feriado en línea propia debajo del número
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...RED);
                const label = doc.splitTextToSize(holidayName, colW - 5)[0];
                doc.text(label, cx + 3, cellsTop + 13);
            } else {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...(!inMonth ? S300 : S700));
                doc.text(String(dayNum), cx + 4, cellsTop + 8.5);
            }

            // Pills — altura dinámica: 1 eval = celda completa, 2 = mitad, etc.
            const evals    = evalsByDate[dateStr] || [];
            const pillTopY = isHoliday ? PILL_TOP + 8 : PILL_TOP;
            const availH   = dataH - pillTopY - 1;
            const MIN_PILL_H = 10;
            const maxFit   = Math.max(1, Math.floor((availH + PILL_GAP) / (MIN_PILL_H + PILL_GAP)));
            const showCount = Math.min(evals.length, maxFit);
            const dynPillH  = showCount > 0
                ? (availH - (showCount - 1) * PILL_GAP) / showCount
                : PILL_H;

            // Escala tipográfica según altura de pill (PILL_H=16 es la baseline)
            const scale    = Math.min(1.8, Math.max(0.7, dynPillH / PILL_H));
            const fs       = base => Math.round(base * scale * 2) / 2; // redondeo a 0.5pt
            const accentW  = Math.min(6.5, 3.5 * Math.min(scale, 1.6));

            let evalY = cellsTop + pillTopY;

            evals.slice(0, showCount).forEach(ev => {
                const asigColor = ASIG_COLORS_PDF[ev.asignatura] || S700;
                const darkColor = asigColor.map(c => Math.max(0, c - 60));

                // Pill body
                doc.setFillColor(...asigColor);
                doc.roundedRect(cx + 1.5, evalY, pillW, dynPillH, 1.5, 1.5, 'F');

                // Left dark accent
                doc.setFillColor(...darkColor);
                doc.roundedRect(cx + 1.5, evalY, accentW, dynPillH, 1.5, 1.5, 'F');
                doc.rect(cx + 1.5 + accentW * 0.5, evalY, accentW * 0.5, dynPillH, 'F');

                const tx  = cx + 1.5 + accentW + 1.5;
                const mxW = pillW - accentW - 4;

                // Slot: "Bloque 3 · 08:00–09:00"
                const slot    = ev.slots?.[0];
                const slotStr = slot
                    ? [slot.label,
                       slot.startTime && slot.endTime
                           ? `${slot.startTime}–${slot.endTime}`
                           : (slot.startTime || '')]
                       .filter(Boolean).join(' · ')
                    : null;

                // Construir líneas de texto según modo
                const textLines = !selectedCurso && ev.curso
                    ? [
                        { text: ev.curso,                                          size: fs(9),   style: 'bold',   color: WHITE,     truncate: true },
                        { text: ASIG_FULL_PDF[ev.asignatura] || ev.asignatura,     size: fs(7),   style: 'normal', color: WHITE,     truncate: true },
                        ev.createdBy?.name ? { text: `Prof. ${ev.createdBy.name}`, size: fs(6.5), style: 'normal', color: WHITE_DIM, truncate: true } : null,
                        slotStr            ? { text: slotStr,                      size: fs(6),   style: 'normal', color: WHITE_DIM, truncate: true } : null,
                    ].filter(Boolean)
                    : [
                        { text: ASIG_FULL_PDF[ev.asignatura] || ev.asignatura,     size: fs(8),   style: 'bold',   color: WHITE,     truncate: true },
                        { text: ev.name || '—',                                    size: fs(7),   style: 'normal', color: WHITE,     truncate: true },
                        ev.createdBy?.name ? { text: `Prof. ${ev.createdBy.name}`, size: fs(6.5), style: 'normal', color: WHITE_DIM, truncate: true } : null,
                        slotStr            ? { text: slotStr,                      size: fs(6),   style: 'normal', color: WHITE_DIM, truncate: true } : null,
                    ].filter(Boolean);

                // Líneas que caben: mínimo 3.8mm por línea sin importar la escala
                const maxLns   = Math.max(1, Math.floor((dynPillH - 4) / 3.8));
                const visLines = textLines.slice(0, maxLns);

                // Distribuir líneas para ocupar toda la altura (space-between)
                const PAD      = Math.max(2.5, dynPillH * 0.06);
                const innerH   = dynPillH - 2 * PAD;
                const LEADING  = visLines.length > 1 ? innerH / visLines.length : innerH;
                const textStart = evalY + PAD + LEADING * 0.65;

                visLines.forEach((ln, i) => {
                    doc.setFontSize(ln.size);
                    doc.setFont('helvetica', ln.style);
                    doc.setTextColor(...ln.color);
                    const txt = ln.truncate ? doc.splitTextToSize(ln.text, mxW)[0] : ln.text;
                    doc.text(txt, tx, textStart + i * LEADING);
                });

                evalY += dynPillH + PILL_GAP;
            });

            // Overflow
            if (evals.length > showCount) {
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...S500);
                doc.text(`+${evals.length - showCount} más`, cx + 3.5, evalY + 4.5);
            }
        });

        // Outer border for cells row
        doc.setDrawColor(...NAVY);
        doc.setLineWidth(0.35);
        doc.rect(mL, cellsTop, cW, dataH);
    };

    const drawPage = (pageWeeks, weekStartNum, isFirst) => {
        const topH  = isFirst ? HEADER_H : RUN_HEADER_H;
        const avail = pageH - mT - topH - DAY_ROW_H - FOOTER_H - mBot;
        const dataH = dataHForPage(avail, pageWeeks.length);
        // Day name columns
        const dayRowY = mT + topH;
        drawDayNameRow(dayRowY);

        // Each week section
        let curY = dayRowY + DAY_ROW_H;
        pageWeeks.forEach((week, wi) => {
            drawWeekLabel(curY, weekRangeLabel(week, weekStartNum + wi));
            curY += WEEK_LABEL_H;
            drawWeekCells(week, curY, dataH);
            curY += dataH;
        });
    };

    const drawRunningHeader = () => {
        doc.setFillColor(...NAVY);
        doc.rect(0, 0, pageW, 3, 'F');
        doc.addImage(logoDataUrl, 'JPEG', mL, mT + 1, 12, 12);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text('CALENDARIO DE EVALUACIONES', mL + 16, mT + 6);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S500);
        doc.text('Centro Educacional Ernesto Yañez Rivera · EYR Digital', mL + 16, mT + 11);
        const sub = [selectedCurso ? `Curso: ${selectedCurso}` : 'Todos los cursos', mesLabel].filter(Boolean).join('   ·   ');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...S700);
        doc.text(sub, pageW - mR, mT + 8, { align: 'right' });
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.6);
        doc.line(mL, mT + 14, pageW - mR, mT + 14);
    };

    const drawFooter = (n, total) => {
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S300);
        doc.text(`Generado ${timestamp} — EYR Digital`, mL, pageH - mBot);
        doc.text(`Página ${n} de ${total}`, pageW - mR, pageH - mBot, { align: 'right' });
    };

    // ── PAGE 1: Big header ────────────────────────
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW * 0.6, 3.5, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(pageW * 0.6, 0, pageW * 0.4, 3.5, 'F');

    doc.addImage(logoDataUrl, 'JPEG', mL, mT, 20, 20);
    const tx0 = mL + 23;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Centro Educacional Ernesto Yañez Rivera', tx0, mT + 8);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...S500);
    doc.text('Lasana 6664, Huechuraba · Unidad Técnico Pedagógica', tx0, mT + 14);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('CALENDARIO DE EVALUACIONES', pageW - mR, mT + 8, { align: 'right' });
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(
        [selectedCurso ? `Curso: ${selectedCurso}` : 'Todos los cursos', mesLabel].filter(Boolean).join('   ·   '),
        pageW - mR, mT + 16, { align: 'right' }
    );
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...S300);
    doc.text(`Emitido: ${timestamp}`, pageW - mR, mT + 23, { align: 'right' });
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(mL, mT + 27, pageW - mR, mT + 27);

    drawPage(pages[0], 1, true);

    // ── Pages 2+ ─────────────────────────────────
    for (let p = 1; p < pages.length; p++) {
        doc.addPage();
        drawRunningHeader();
        drawPage(pages[p], p * 2 + 1, false); // week numbers: page 0→1,2; page 1→3,4; etc.
    }

    // ── Leyenda de OAs ────────────────────────────
    const evalsWithOas = [...evaluaciones]
        .filter(e => e.oaCodes?.length > 0)
        .sort((a, b) =>
            (a.date || '').localeCompare(b.date || '') ||
            (a.curso || '').localeCompare(b.curso || '')
        );

    if (evalsWithOas.length > 0) {
        doc.addPage();
        drawRunningHeader();

        const legendTitleY = mT + RUN_HEADER_H + 4;
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text('LEYENDA DE OBJETIVOS DE APRENDIZAJE', mL, legendTitleY);
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.line(mL, legendTitleY + 2.5, pageW - mR, legendTitleY + 2.5);

        // Build table rows — eval info only on first OA row per evaluación
        const legendBody = [];
        const firstInGroup = new Set();
        let rowIdx = 0;
        evalsWithOas.forEach(ev => {
            const dateLabel = ev.date
                ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL', {
                      day: 'numeric', month: 'short', year: 'numeric',
                  })
                : '—';
            ev.oaCodes.forEach((code, i) => {
                const oa        = oaLookup[code] || getOAByCode(code);
                const shortCode = code.includes('-') ? code.split('-').slice(1).join('-') : code;
                if (i === 0) firstInGroup.add(rowIdx);
                legendBody.push([
                    i === 0 ? (ev.name || '—') : '',
                    i === 0 ? dateLabel : '',
                    i === 0 ? (ASIG_FULL_PDF[ev.asignatura] || ev.asignatura || '—') : '',
                    i === 0 ? (ev.curso || '—') : '',
                    shortCode,
                    oa?.eje || '—',
                    oa?.description || '(Sin descripción)',
                ]);
                rowIdx++;
            });
        });

        autoTable(doc, {
            startY: legendTitleY + 6,
            head: [['Evaluación', 'Fecha', 'Asignatura', 'Curso', 'OA', 'Eje', 'Descripción']],
            body: legendBody,
            margin: { left: mL, right: mR, top: mT + RUN_HEADER_H + 2 },
            theme: 'grid',
            styles: {
                fontSize: 6.5,
                cellPadding: 2,
                lineColor: S200,
                lineWidth: 0.15,
                textColor: S900,
                overflow: 'linebreak',
                minCellHeight: 8,
            },
            headStyles: {
                fillColor: NAVY,
                textColor: WHITE,
                fontStyle: 'bold',
                fontSize: 7.5,
                cellPadding: [2.5, 2],
            },
            columnStyles: {
                0: { cellWidth: 38, fontStyle: 'bold' },
                1: { cellWidth: 22 },
                2: { cellWidth: 26 },
                3: { cellWidth: 14, halign: 'center' },
                4: { cellWidth: 14, fontStyle: 'bold', halign: 'center', textColor: NAVY_DIM },
                5: { cellWidth: 30 },
                6: { cellWidth: 133 },
            },
            didParseCell: (data) => {
                if (data.section === 'body' && firstInGroup.has(data.row.index)) {
                    data.cell.styles.fillColor = NAVY_LIGHT;
                }
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) drawRunningHeader();
            },
        });
    }

    // ── Footers ───────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
    }

    const cursoSuffix = selectedCurso ? `_${selectedCurso.replace(/\s+°/g, '').replace(/\s+/g, '')}` : '';
    doc.save(`CalendarioEvaluaciones${cursoSuffix}_${mesLabel?.replace(/\s/g, '') || 'todos'}.pdf`);
}

// ─── exportAgendaSemanalPDF ────────────────────────────────────────────────────
export async function exportAgendaSemanalPDF({ agendaDocs, mesLabel, selectedCurso }) {
    const logoDataUrl = await loadImageAsDataUrl(logoEyrUrl);

    const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // 297
    const pageH = doc.internal.pageSize.getHeight();  // 210
    const mL = 14, mR = 14, mT = 8;

    const NAVY       = [22,  38,  90];
    const NAVY_LIGHT = [220, 228, 248];
    const GOLD       = [196, 148,   0];
    const S900 = [15, 23, 42];
    const S500 = [100, 116, 139];
    const S300 = [148, 163, 184];
    const S200 = [203, 213, 225];
    const S100 = [241, 245, 249];
    const WHITE = [255, 255, 255];

    const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const filtered = selectedCurso
        ? agendaDocs.filter(d => d.curso === selectedCurso)
        : agendaDocs;

    // Group by weekStart
    const byWeek = {};
    filtered.forEach(docData => {
        const ws = docData.weekStart;
        if (!ws) return;
        if (!byWeek[ws]) byWeek[ws] = [];
        byWeek[ws].push(docData);
    });
    const weekStarts = Object.keys(byWeek).sort();

    const weekRangeLabel = (ws) => {
        const d1 = new Date(ws + 'T12:00:00');
        const d5 = new Date(d1);
        d5.setDate(d5.getDate() + 4);
        const sameM = d1.getMonth() === d5.getMonth();
        return sameM
            ? `${d1.getDate()} al ${d5.getDate()} de ${MESES_ES[d1.getMonth()]} ${d1.getFullYear()}`
            : `${d1.getDate()} ${MESES_ES[d1.getMonth()].slice(0,3)}. – ${d5.getDate()} ${MESES_ES[d5.getMonth()].slice(0,3)}. ${d5.getFullYear()}`;
    };

    const buildRows = (weekDocs) =>
        [...weekDocs]
            .sort((a, b) => (a.docenteName || '').localeCompare(b.docenteName || '') || (a.curso || '').localeCompare(b.curso || ''))
            .map(docData => {
                const byDia = {};
                (docData.entries || []).forEach(e => {
                    if (!byDia[e.dia]) byDia[e.dia] = [];
                    byDia[e.dia].push(`${e.asignatura}: ${e.texto}`);
                });
                return [
                    docData.docenteName || '—',
                    docData.curso || '—',
                    byDia['lunes']?.join('\n') || '',
                    byDia['martes']?.join('\n') || '',
                    byDia['miercoles']?.join('\n') || '',
                    byDia['jueves']?.join('\n') || '',
                    byDia['viernes']?.join('\n') || '',
                ];
            });

    // ── Big header (page 1) ───────────────────────
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW * 0.6, 3.5, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(pageW * 0.6, 0, pageW * 0.4, 3.5, 'F');

    doc.addImage(logoDataUrl, 'JPEG', mL, mT, 20, 20);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
    doc.text('Centro Educacional Ernesto Yañez Rivera', mL + 23, mT + 8);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...S500);
    doc.text('Lasana 6664, Huechuraba · Unidad Técnico Pedagógica', mL + 23, mT + 14);

    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
    doc.text('AGENDA SEMANAL', pageW - mR, mT + 8, { align: 'right' });
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
    const headerSub = [selectedCurso ? `Curso: ${selectedCurso}` : 'Todos los cursos', mesLabel].filter(Boolean).join('   ·   ');
    doc.text(headerSub, pageW - mR, mT + 16, { align: 'right' });
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...S300);
    doc.text(`Emitido: ${timestamp}`, pageW - mR, mT + 23, { align: 'right' });
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.8);
    doc.line(mL, mT + 27, pageW - mR, mT + 27);

    let startY = mT + 31;

    weekStarts.forEach((ws, wi) => {
        const rows = buildRows(byWeek[ws]);
        if (rows.length === 0) return;

        autoTable(doc, {
            startY,
            margin: { left: mL, right: mR, top: 22, bottom: 10 },
            head: [
                [{ content: `SEMANA ${wi + 1}   ·   ${weekRangeLabel(ws)}`, colSpan: 7,
                   styles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5,
                              halign: 'left', cellPadding: { left: 4, top: 2.5, bottom: 2.5, right: 4 } } }],
                ['Docente', 'Curso', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(h => ({
                    content: h,
                    styles: { fillColor: NAVY_LIGHT, textColor: NAVY, fontStyle: 'bold', fontSize: 7.5,
                               halign: 'center', cellPadding: { left: 3, top: 2, bottom: 2, right: 3 } }
                })),
            ],
            body: rows,
            styles: {
                fontSize: 7.5,
                cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                textColor: S900,
                lineColor: S200,
                lineWidth: 0.15,
                overflow: 'linebreak',
                valign: 'top',
            },
            columnStyles: {
                0: { cellWidth: 32, fontStyle: 'bold' },
                1: { cellWidth: 22, halign: 'center' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 'auto' },
                5: { cellWidth: 'auto' },
                6: { cellWidth: 'auto' },
            },
            alternateRowStyles: { fillColor: S100 },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFillColor(...NAVY);
                    doc.rect(0, 0, pageW * 0.6, 3.5, 'F');
                    doc.setFillColor(...GOLD);
                    doc.rect(pageW * 0.6, 0, pageW * 0.4, 3.5, 'F');
                    doc.addImage(logoDataUrl, 'JPEG', mL, mT + 1, 12, 12);
                    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
                    doc.text('AGENDA SEMANAL', mL + 16, mT + 6);
                    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...S500);
                    doc.text('Centro Educacional Ernesto Yañez Rivera · EYR Digital', mL + 16, mT + 11);
                    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...[51, 65, 85]);
                    doc.text(headerSub, pageW - mR, mT + 8, { align: 'right' });
                    doc.setDrawColor(...GOLD); doc.setLineWidth(0.6);
                    doc.line(mL, mT + 14, pageW - mR, mT + 14);
                }
                doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...S300);
                doc.text(`Generado ${timestamp} — EYR Digital`, mL, pageH - 5);
                doc.text(`Página ${data.pageNumber}`, pageW - mR, pageH - 5, { align: 'right' });
            },
        });

        startY = doc.lastAutoTable.finalY + 7;
    });

    if (weekStarts.length === 0) {
        doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(...S500);
        doc.text('No hay agenda registrada para el período seleccionado.', pageW / 2, pageH / 2, { align: 'center' });
    }

    const cursoSuffix = selectedCurso ? `_${selectedCurso.replace(/\s+°/g, '').replace(/\s+/g, '')}` : '';
    doc.save(`AgendaSemanal${cursoSuffix}_${mesLabel?.replace(/\s/g, '') || 'todos'}.pdf`);
}


// ─────────────────────────────────────────────────────────────────────────────
// AGENDA SEMANAL — tarjetas por día (diseño HTML de referencia)
// ─────────────────────────────────────────────────────────────────────────────

// Emoji como imagen: el canvas del browser sí tiene fuente del sistema (Segoe Emoji, Apple Emoji, Noto).
// Se renderiza el emoji en un canvas 40×40 px y se inserta como PNG en jsPDF.
const _emojiCache = {};
function _emojiPng(emoji, px = 40) {
    const key = `${emoji}_${px}`;
    if (_emojiCache[key]) return _emojiCache[key];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext('2d');
    ctx.font = `${Math.floor(px * 0.78)}px serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, px / 2, px / 2);
    const url = canvas.toDataURL('image/png');
    _emojiCache[key] = url;
    return url;
}
// Añade un emoji como imagen PNG en el doc. x,y = top-left en mm; s = tamaño cuadrado en mm.
function _emojiAt(doc, emoji, x, y, s = 5) {
    doc.addImage(_emojiPng(emoji), 'PNG', x, y, s, s);
}

const ASIG_ICONS_PDF = {
    MA: '🔢', LE: '📖', CN: '🌿', HI: '🏛️', IN: '🌎',
    EF: '⚽', AV: '🎨', MU: '🎵', TE: '💻', OR: '⭐',
};
const DAY_ICONS_PDF = {
    lunes: '📅', martes: '✏️', miercoles: '💡', jueves: '🔬', viernes: '🍳',
};
const DIAS_ORDER_AGENDA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const DAY_NAME_AGENDA   = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes' };
const DAY_COLOR_AGENDA  = {
    lunes:     [255,  94,  91],
    martes:    [  0, 194, 168],
    miercoles: [230, 160,   0],
    jueves:    [123,  94, 167],
    viernes:   [255, 140,  66],
};
const MESES_ES_AGENDA = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
    'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/** Returns { dia: { iso, label, holiday } } for each weekday */
function _agendaWeekInfo(weekStart, holidays) {
    const mon = new Date(weekStart + 'T12:00:00');
    const info = {};
    DIAS_ORDER_AGENDA.forEach((dia, i) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        info[dia] = {
            iso,
            label:   `${d.getDate()} de ${MESES_ES_AGENDA[d.getMonth()]}`,
            holiday: holidays[iso] || null,
        };
    });
    return info;
}

/** Returns a human-readable week range, e.g. "5 – 9 de Mayo 2026" */
function _agendaWeekLabel(weekStart) {
    const mon = new Date(weekStart + 'T12:00:00');
    const d5  = new Date(mon); d5.setDate(mon.getDate() + 4);
    const sameM = mon.getMonth() === d5.getMonth();
    return sameM
        ? `${mon.getDate()} – ${d5.getDate()} de ${MESES_ES_AGENDA[mon.getMonth()]} ${mon.getFullYear()}`
        : `${mon.getDate()} ${MESES_ES_AGENDA[mon.getMonth()].slice(0,3)}. – ${d5.getDate()} ${MESES_ES_AGENDA[d5.getMonth()].slice(0,3)}. ${d5.getFullYear()}`;
}

/**
 * Draw full hero header (first page of each agenda export).
 * Returns the Y at which the card content area starts.
 */
function _drawAgendaHeroHeader(doc, { logoDataUrl, weekLabel, curso, docenteName, pageW, mL }) {
    const HDR_H    = 62;
    const NAVY     = [45,  45, 142];
    const NAVY_MED = [75,  75, 165];
    const GOLD     = [255, 200,   0];
    const WHITE    = [255, 255, 255];

    // Background
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, HDR_H, 'F');

    // Decorative circles (blended with navy to simulate transparency)
    doc.setFillColor(115, 52, 110);   // coral blended at ~25%
    doc.circle(pageW - 16, -8, 28, 'F');
    doc.setFillColor(92, 86, 48);     // gold blended
    doc.circle(pageW - 60, 20, 18, 'F');
    doc.setFillColor(28, 72, 95);     // teal blended
    doc.circle(mL + 8, 56, 14, 'F');

    // Gold bottom stripe
    doc.setFillColor(...GOLD);
    doc.rect(0, HDR_H - 3, pageW, 3, 'F');

    // Logo
    doc.addImage(logoDataUrl, 'JPEG', mL, 8, 14, 14);

    // School badge pill (top, next to logo)
    const schoolText = 'Centro Educacional Ernesto Yanez Rivera';
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    const stW = doc.getTextWidth(schoolText);
    doc.setFillColor(58, 58, 155);
    doc.roundedRect(mL + 17, 9, stW + 16, 8, 4, 4, 'F');
    doc.setTextColor(210, 215, 255);
    doc.text(schoolText, mL + 25, 14.2);

    // Title
    doc.setFontSize(26); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
    doc.text('AGENDA SEMANAL', mL, 33);

    // Week label (gold)
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GOLD);
    doc.text(weekLabel, mL, 42);

    // Badges: 🎓 curso  +  👨‍🏫 docente
    const badgeData = [
        { icon: '🎓', text: curso || '—' },
        { icon: '👨‍🏫', text: docenteName || '—' },
    ];
    let bx = mL;
    badgeData.forEach(({ icon, text }) => {
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
        const tw = doc.getTextWidth(text) + 24; // extra para el emoji
        doc.setFillColor(...NAVY_MED);
        doc.roundedRect(bx, 47, tw, 11, 5.5, 5.5, 'F');
        _emojiAt(doc, icon, bx + 3, 48.5, 5);
        doc.setTextColor(...WHITE);
        doc.text(text, bx + 10, 54);
        bx += tw + 6;
    });

    return HDR_H + 6;
}

/**
 * Draw slim running header (continuation pages).
 * Returns the Y at which content starts.
 */
function _drawAgendaMiniHeader(doc, { logoDataUrl, weekLabel, pageW, mL, mR }) {
    const NAVY  = [45,  45, 142];
    const GOLD  = [255, 200,   0];
    const WHITE = [255, 255, 255];
    const H = 13;

    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, H, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, H - 2, pageW, 2, 'F');
    doc.addImage(logoDataUrl, 'JPEG', mL, 1.5, 8, 8);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
    doc.text('AGENDA SEMANAL', mL + 11, 8);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GOLD);
    doc.text(weekLabel, pageW - mR, 8, { align: 'right' });

    return H + 4;
}

/**
 * Draw static "Avisos Importantes" card.
 * Returns Y after the card.
 */
function _drawAvisosCard(doc, y, { pageH, mL, cW, onNewPage }) {
    const NAVY     = [45,  45, 142];
    const WHITE    = [255, 255, 255];
    const CARD_R   = 6;
    const HDR_H    = 22;
    const PAD      = 7;
    const infoH1   = 18;
    const infoH2   = 24;
    const cardH    = HDR_H + PAD + infoH1 + 5 + infoH2 + PAD;

    if (y + cardH > pageH - 18) {
        doc.addPage();
        y = onNewPage(doc);
    }

    // Card shadow
    doc.setFillColor(200, 200, 220);
    doc.roundedRect(mL + 1, y + 2, cW, cardH, CARD_R, CARD_R, 'F');

    // Card bg
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.roundedRect(mL, y, cW, cardH, CARD_R, CARD_R, 'FD');

    // Card header (navy)
    doc.setFillColor(...NAVY);
    doc.roundedRect(mL, y, cW, HDR_H, CARD_R, CARD_R, 'F');
    doc.rect(mL, y + HDR_H - CARD_R, cW, CARD_R, 'F');

    // Lighter overlay right half (gradient effect)
    doc.setFillColor(68, 68, 175);
    doc.roundedRect(mL + cW * 0.5, y, cW * 0.5, HDR_H, CARD_R, CARD_R, 'F');
    doc.rect(mL + cW * 0.5, y, cW * 0.5, HDR_H - CARD_R, 'F');

    // Icon box
    const iconSz = 13;
    doc.setFillColor(68, 68, 142);
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0);
    doc.roundedRect(mL + 6, y + (HDR_H - iconSz) / 2, iconSz, iconSz, 3, 3, 'F');
    // Emoji 📢 como imagen PNG
    _emojiAt(doc, '📢', mL + 6 + 1.5, y + (HDR_H - iconSz) / 2 + 1.5, iconSz - 3);

    // Header text
    doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
    doc.text('Avisos Importantes', mL + 6 + iconSz + 5, y + 13);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(190, 200, 250);
    doc.text('Para tener en cuenta', mL + 6 + iconSz + 5, y + 19.5);

    let cy = y + HDR_H + PAD;

    // Box 1: horario (yellow)
    doc.setFillColor(255, 251, 225);
    doc.setDrawColor(255, 200, 0);
    doc.setLineWidth(0.8);
    doc.roundedRect(mL + 4, cy, cW - 8, infoH1, 4, 4, 'FD');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 70, 0);
    doc.text('Horario de ingreso:', mL + 9, cy + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 40, 0);
    doc.text('7:45 a 8:00 hrs. Desde el lunes 11 de marzo se registran los atrasos.', mL + 9, cy + 13.5, {
        maxWidth: cW - 16,
    });
    cy += infoH1 + 5;

    // Box 2: inasistencias (teal)
    doc.setFillColor(230, 248, 242);
    doc.setDrawColor(0, 194, 168);
    doc.roundedRect(mL + 4, cy, cW - 8, infoH2, 4, 4, 'FD');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 60, 50);
    doc.text('Inasistencias:', mL + 9, cy + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 40, 35);
    doc.text('Justificar al correo de Inspectoria General:', mL + 9, cy + 13);
    doc.setTextColor(45, 45, 142);
    doc.text('inspectoria.ernestoyañez@eduhuechuraba.cl', mL + 9, cy + 19);

    return y + cardH + 6;
}

/**
 * Draw all day cards for one week into the document.
 * Returns Y after the last card.
 */
function _drawAgendaDayCards(doc, {
    weekStart, entries, holidays, evaluaciones = [],
    pageW, pageH, mL, mR, cW,
    startY, onNewPage,
}) {
    const CARD_R     = 6;
    const HDR_CARD_H = 22;
    const PILL_H     = 9;
    const PILL_R     = 4.5;
    const ENTRY_H    = 6.5;
    const CARD_PAD   = 6;
    const CARD_GAP   = 5;
    const SEC_LBL_H  = 6;
    const SEC_PAD    = 3;
    const WHITE      = [255, 255, 255];
    const DARK       = [40,  40,  50];
    const MUTED      = [120, 120, 140];
    const LINE_CLR   = [220, 220, 230];

    const dayInfo = _agendaWeekInfo(weekStart, holidays);
    const byDia   = {};
    (entries || []).forEach(e => {
        if (!byDia[e.dia]) byDia[e.dia] = [];
        byDia[e.dia].push(e);
    });

    const evalsByIso = {};
    (evaluaciones || []).forEach(ev => {
        if (!ev.date) return;
        if (!evalsByIso[ev.date]) evalsByIso[ev.date] = [];
        evalsByIso[ev.date].push(ev);
    });

    let y = startY;

    DIAS_ORDER_AGENDA.forEach(dia => {
        const diaEntries = byDia[dia] || [];
        const info       = dayInfo[dia];
        const dayEvals   = evalsByIso[info.iso] || [];
        const color      = DAY_COLOR_AGENDA[dia];
        const hasContent = diaEntries.length > 0 || info.holiday || dayEvals.length > 0;
        if (!hasContent) return;

        const isAmber  = dia === 'miercoles';
        const hdrClr   = isAmber ? [42, 42, 42] : WHITE;
        // "Clases del día": deriva de las entradas escritas por los docentes del curso.
        const asigs = [...new Set(diaEntries.map(e => e.asignatura))];

        // ── Measure heights ──────────────────────────────────────────────
        doc.setFontSize(8);
        // Pills row count
        let pillRowW = 0, pillRows = 1;
        asigs.forEach(asig => {
            const name = ASIG_FULL_PDF[asig] || asig;
            const pw   = doc.getTextWidth(name) + 24;
            if (pillRowW + pw + 4 > cW - CARD_PAD * 2 - 4) {
                pillRows++; pillRowW = pw + 4;
            } else { pillRowW += pw + 4; }
        });

        // Entry lines
        let entriesActualH = 0;
        diaEntries.forEach((entry, ei) => {
            const label  = (ASIG_FULL_PDF[entry.asignatura] || entry.asignatura) + ':';
            const labelW = doc.getTextWidth(label) + 2;
            const maxW   = cW - CARD_PAD * 2 - 12 - labelW;
            const lines  = doc.splitTextToSize(entry.texto || '', maxW);
            entriesActualH += lines.length * ENTRY_H;
            if (ei < diaEntries.length - 1) entriesActualH += 5;
        });

        const pillsH   = asigs.length > 0
            ? SEC_LBL_H + SEC_PAD + pillRows * PILL_H + (pillRows - 1) * 3 + SEC_PAD
            : 0;
        const dividerH = pillsH > 0 && diaEntries.length > 0 ? 7 : 0;
        const entriesH = diaEntries.length > 0 ? SEC_LBL_H + SEC_PAD + entriesActualH : 0;
        const holidayH = info.holiday && diaEntries.length === 0 && dayEvals.length === 0 ? 14 : 0;
        const evalDivH = (pillsH > 0 || diaEntries.length > 0) && dayEvals.length > 0 ? 7 : 0;
        const evalH    = dayEvals.length > 0
            ? SEC_LBL_H + SEC_PAD + dayEvals.length * ENTRY_H + Math.max(0, dayEvals.length - 1) * 2
            : 0;
        const contentH = CARD_PAD + pillsH + dividerH + entriesH + evalDivH + evalH + holidayH + CARD_PAD;
        const cardH    = HDR_CARD_H + Math.max(18, contentH);

        // Page break
        if (y + cardH > pageH - 18) {
            doc.addPage();
            y = onNewPage(doc);
        }

        // ── Card shadow ───────────────────────────────────────────────────
        doc.setFillColor(200, 200, 220);
        doc.setDrawColor(0, 0, 0); doc.setLineWidth(0);
        doc.roundedRect(mL + 1.5, y + 2.5, cW, cardH, CARD_R, CARD_R, 'F');

        // ── Card background + colored border ─────────────────────────────
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...color.map(c => Math.min(255, c + 80)));
        doc.setLineWidth(0.7);
        doc.roundedRect(mL, y, cW, cardH, CARD_R, CARD_R, 'FD');

        // ── Card header ───────────────────────────────────────────────────
        doc.setFillColor(...color);
        doc.roundedRect(mL, y, cW, HDR_CARD_H, CARD_R, CARD_R, 'F');
        doc.setLineWidth(0);
        doc.rect(mL, y + HDR_CARD_H - CARD_R, cW, CARD_R, 'F');

        // Day icon box (frosted: blend color with white at 22%)
        const iconSz = 13;
        const iconBX = mL + CARD_PAD;
        const iconBY = y + (HDR_CARD_H - iconSz) / 2;
        doc.setFillColor(
            Math.round(color[0] * 0.78 + 255 * 0.22),
            Math.round(color[1] * 0.78 + 255 * 0.22),
            Math.round(color[2] * 0.78 + 255 * 0.22)
        );
        doc.roundedRect(iconBX, iconBY, iconSz, iconSz, 3, 3, 'F');

        // Day emoji como imagen PNG dentro de la caja
        if (DAY_ICONS_PDF[dia]) {
            _emojiAt(doc, DAY_ICONS_PDF[dia], iconBX + 1.5, iconBY + 1.5, iconSz - 3);
        }

        // Day name (large bold)
        const nameX = iconBX + iconSz + 4;
        doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(...hdrClr);
        doc.text(DAY_NAME_AGENDA[dia].toUpperCase(), nameX, y + 13);

        // Date (smaller, translucent)
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
        doc.setTextColor(...(isAmber ? [80, 80, 80] : [220, 228, 248]));
        doc.text(info.label, nameX, y + 19.5);

        // Holiday badge (right side of card header)
        if (info.holiday) {
            doc.setFontSize(7); doc.setFont('helvetica', 'bold');
            const hText = info.holiday;
            const hW = doc.getTextWidth(hText) + 14;
            doc.setFillColor(...color.map(c => Math.max(0, c - 55)));
            doc.setLineWidth(0);
            doc.roundedRect(pageW - mR - hW - 1, y + 4, hW, 10, 5, 5, 'F');
            doc.setTextColor(...WHITE);
            doc.text(hText, pageW - mR - hW / 2 - 1, y + 10.5, { align: 'center' });
        }

        // ── Card body ─────────────────────────────────────────────────────
        let cy = y + HDR_CARD_H + CARD_PAD;

        if (info.holiday && diaEntries.length === 0 && dayEvals.length === 0) {
            doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.setTextColor(...MUTED);
            doc.text('Feriado — sin clases', mL + CARD_PAD + 2, cy + 7);
        } else {
            // ── "📚 Clases del día" section ───────────────────────────────
            if (asigs.length > 0) {
                // Section label: emoji 📚 + texto
                _emojiAt(doc, '📚', mL + CARD_PAD + 1, cy + 0.2, 5);
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
                doc.setTextColor(...color.map(c => Math.max(0, c - 10)));
                doc.text('Clases del dia', mL + CARD_PAD + 7.5, cy + SEC_LBL_H - 0.5);
                cy += SEC_LBL_H + SEC_PAD;

                // Subject pills (white bg, colored border, emoji + name)
                let px = mL + CARD_PAD + 2;
                asigs.forEach(asig => {
                    const asigName  = ASIG_FULL_PDF[asig]  || asig;
                    const asigColor = ASIG_COLORS_PDF[asig] || color;
                    const asigIcon  = ASIG_ICONS_PDF[asig]  || '';
                    doc.setFontSize(8);
                    const nameW = doc.getTextWidth(asigName);
                    const pillW = nameW + (asigIcon ? 19 : 12);

                    if (px + pillW > pageW - mR - CARD_PAD) {
                        px = mL + CARD_PAD + 2;
                        cy += PILL_H + 3;
                    }

                    // Pill: white fill + colored border
                    doc.setFillColor(255, 255, 255);
                    doc.setDrawColor(...asigColor);
                    doc.setLineWidth(0.6);
                    doc.roundedRect(px, cy, pillW, PILL_H, PILL_R, PILL_R, 'FD');

                    // Emoji icon dentro del pill
                    let tx = px + 5;
                    if (asigIcon) {
                        _emojiAt(doc, asigIcon, px + 2, cy + 1, 5.5);
                        tx = px + 9;
                    }

                    // Subject name
                    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...asigColor.map(c => Math.max(0, c - 20)));
                    doc.text(asigName, tx, cy + PILL_H * 0.7);
                    px += pillW + 4;
                });
                cy += PILL_H + SEC_PAD + 2;
            }

            // ── Divider ───────────────────────────────────────────────────
            if (asigs.length > 0 && diaEntries.length > 0) {
                doc.setDrawColor(...LINE_CLR);
                doc.setLineWidth(0.4);
                doc.line(mL + CARD_PAD, cy, pageW - mR - CARD_PAD, cy);
                cy += 5;
            }

            // ── "🎒 Materiales necesarios" section ────────────────────────
            if (diaEntries.length > 0) {
                // Section label con emoji 🎒
                _emojiAt(doc, '🎒', mL + CARD_PAD + 1, cy + 0.2, 5);
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
                doc.setTextColor(...color.map(c => Math.max(0, c - 10)));
                doc.text('Materiales necesarios', mL + CARD_PAD + 7.5, cy + SEC_LBL_H - 0.5);
                cy += SEC_LBL_H + SEC_PAD;

                diaEntries.forEach((entry, ei) => {
                    const asigColor = ASIG_COLORS_PDF[entry.asignatura] || color;
                    const asigIcon  = ASIG_ICONS_PDF[entry.asignatura]  || '';
                    const label     = (ASIG_FULL_PDF[entry.asignatura]  || entry.asignatura) + ':';

                    // Emoji bullet o círculo coloreado
                    if (asigIcon) {
                        _emojiAt(doc, asigIcon, mL + CARD_PAD + 1, cy + 0.5, 5);
                    } else {
                        doc.setFillColor(...asigColor);
                        doc.setLineWidth(0);
                        doc.circle(mL + CARD_PAD + 3.5, cy + 3.2, 1.8, 'F');
                    }

                    // Subject label (bold, colored)
                    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...asigColor.map(c => Math.max(0, c - 20)));
                    const labelW = doc.getTextWidth(label) + 2;
                    doc.text(label, mL + CARD_PAD + 10, cy + 4.5);

                    // Entry text
                    doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
                    const maxW  = cW - CARD_PAD * 2 - 12 - labelW;
                    const lines = doc.splitTextToSize(entry.texto || '', maxW);
                    lines.forEach((ln, li) => {
                        doc.text(ln, mL + CARD_PAD + 10 + labelW, cy + 4.5 + li * ENTRY_H);
                    });
                    cy += lines.length * ENTRY_H;

                    // Dashed separator between entries (drawn as dotted short segments)
                    if (ei < diaEntries.length - 1) {
                        doc.setDrawColor(200, 200, 215);
                        doc.setLineWidth(0.25);
                        const x1 = mL + CARD_PAD + 4, x2 = pageW - mR - CARD_PAD;
                        const sy = cy + 2;
                        for (let dx = x1; dx < x2; dx += 3) {
                            doc.line(dx, sy, Math.min(dx + 1.5, x2), sy);
                        }
                        cy += 5;
                    }
                });
            }

            // ── "📝 Evaluaciones" section ─────────────────────────────────
            if (dayEvals.length > 0) {
                if (pillsH > 0 || diaEntries.length > 0) {
                    doc.setDrawColor(...LINE_CLR);
                    doc.setLineWidth(0.4);
                    doc.line(mL + CARD_PAD, cy, pageW - mR - CARD_PAD, cy);
                    cy += 5;
                }
                _emojiAt(doc, '📝', mL + CARD_PAD + 1, cy + 0.2, 5);
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
                doc.setTextColor(...color.map(c => Math.max(0, c - 10)));
                doc.text('Evaluaciones', mL + CARD_PAD + 7.5, cy + SEC_LBL_H - 0.5);
                cy += SEC_LBL_H + SEC_PAD;

                dayEvals.forEach((ev, ei) => {
                    const asigColor = ASIG_COLORS_PDF[ev.asignatura] || color;
                    const asigIcon  = ASIG_ICONS_PDF[ev.asignatura]  || '';
                    const label     = (ASIG_FULL_PDF[ev.asignatura]  || ev.asignatura) + ':';
                    if (asigIcon) {
                        _emojiAt(doc, asigIcon, mL + CARD_PAD + 1, cy + 0.5, 5);
                    } else {
                        doc.setFillColor(...asigColor); doc.setLineWidth(0);
                        doc.circle(mL + CARD_PAD + 3.5, cy + 3.2, 1.8, 'F');
                    }
                    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...asigColor.map(c => Math.max(0, c - 20)));
                    const labelW = doc.getTextWidth(label) + 2;
                    doc.text(label, mL + CARD_PAD + 10, cy + 4.5);
                    doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
                    doc.text(ev.name || '', mL + CARD_PAD + 10 + labelW, cy + 4.5);
                    cy += ENTRY_H;
                    if (ei < dayEvals.length - 1) cy += 2;
                });
            }
        }

        y += cardH + CARD_GAP;
    });

    return y;
}

// ─── exportAgendaSemanalCardPDF ────────────────────────────────────────────────
/**
 * Exporta la agenda semanal de un docente con layout de tarjetas por día.
 * Diseño basado en el HTML de referencia (Agenda Semanal.html).
 */
export async function exportAgendaSemanalCardPDF({ weekStart, curso, docenteName, entries, holidays = {} }) {
    const logoDataUrl = await loadImageAsDataUrl(logoEyrUrl);
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const mL = 13, mR = 13;
    const cW = pageW - mL - mR;

    const weekLabel = _agendaWeekLabel(weekStart);
    let currentWeekLabel = weekLabel;

    const onNewPage = (d) => _drawAgendaMiniHeader(d, {
        logoDataUrl, weekLabel: currentWeekLabel, pageW, mL, mR,
    });

    let y = _drawAgendaHeroHeader(doc, { logoDataUrl, weekLabel, curso, docenteName, pageW, mL });

    y = _drawAgendaDayCards(doc, {
        weekStart, entries, holidays, pageW, pageH, mL, mR, cW,
        startY: y, onNewPage,
    });

    _drawAvisosCard(doc, y, { pageH, mL, cW, onNewPage });

    // Footer on all pages
    const now = new Date();
    const ts = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 45, 142);
        doc.text('¡Que tengan una excelente semana!', pageW / 2, pageH - 9, { align: 'center' });
        _emojiAt(doc, '🌟', pageW / 2 - 46, pageH - 12.5, 5);
        _emojiAt(doc, '🌟', pageW / 2 + 41, pageH - 12.5, 5);
        doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 140);
        doc.text(`Generado ${ts} — EYR Digital`, mL, pageH - 4);
        doc.text(`Página ${i} de ${totalPages}`, pageW - mR, pageH - 4, { align: 'right' });
    }

    const cursoLabel = (curso || 'agenda').replace(/[^\w]/g, '');
    doc.save(`AgendaSemanal_${cursoLabel}_${weekStart}.pdf`);
}

// ─── exportAgendaMensualCardPDF ────────────────────────────────────────────────
/**
 * Exporta la agenda del mes completo como un único PDF.
 * Genera una sección de tarjetas por cada agendaDoc del mes.
 * Retorna false si no hay docs para exportar.
 */
export async function exportAgendaMensualCardPDF({ agendaDocs, selectedCurso, mesLabel, holidays = {}, evaluaciones = [], weekStart: forcedWeekStart = null, profesorJefeName = '' }) {
    // Agrupar por (weekStart + curso) y unir todas las entradas de los docentes.
    // Así "Clases del día" muestra TODAS las asignaturas del curso, no solo las del docente.
    const grouped = new Map();
    agendaDocs
        .filter(d => !selectedCurso || d.curso === selectedCurso)
        .forEach(d => {
            const key = `${d.weekStart}|||${d.curso}`;
            if (!grouped.has(key)) {
                grouped.set(key, { weekStart: d.weekStart, curso: d.curso, entries: [] });
            }
            grouped.get(key).entries.push(...(d.entries || []));
        });

    let docs = [...grouped.values()].sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));

    // Si no hay agenda_contenido pero sí hay evaluaciones (o se forzó un weekStart),
    // crear un doc sintético para que se genere la grilla de días con las pruebas.
    if (docs.length === 0) {
        if (evaluaciones.length === 0 && !forcedWeekStart) return false;
        const ws = forcedWeekStart || evaluaciones[0].date; // fallback aproximado
        docs = [{ weekStart: ws, curso: selectedCurso || null, entries: [] }];
    }

    const logoDataUrl = await loadImageAsDataUrl(logoEyrUrl);
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const mL = 13, mR = 13;
    const cW = pageW - mL - mR;
    const NAVY  = [45, 45, 142];
    const MUTED = [120, 120, 140];

    const now = new Date();
    const ts = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    let y = 0;
    let isFirst = true;
    let currentWeekLabel = '';

    for (const agendaDoc of docs) {
        const { weekStart, curso, entries } = agendaDoc;
        const weekLabel = _agendaWeekLabel(weekStart);
        currentWeekLabel = weekLabel;

        const onNewPage = (d) => _drawAgendaMiniHeader(d, {
            logoDataUrl, weekLabel: currentWeekLabel, pageW, mL, mR,
        });

        if (isFirst) {
            y = _drawAgendaHeroHeader(doc, { logoDataUrl, weekLabel, curso, docenteName: profesorJefeName, pageW, mL });
        } else {
            doc.addPage();
            y = _drawAgendaMiniHeader(doc, { logoDataUrl, weekLabel, pageW, mL, mR });
            // Week separator band
            doc.setFillColor(238, 241, 255);
            doc.rect(mL, y, cW, 9, 'F');
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
            doc.text(`Semana: ${weekLabel}`, mL + 4, y + 6.2);
            y += 13;
        }

        // Filtrar evaluaciones de esta semana (weekStart = lunes, weekStart+4 = viernes)
        const wsDate = new Date(weekStart + 'T12:00:00');
        const weDates = Array.from({ length: 5 }, (_, i) => {
            const d = new Date(wsDate); d.setDate(wsDate.getDate() + i);
            return d.toISOString().slice(0, 10);
        });
        const weekEvals = evaluaciones.filter(ev =>
            weDates.includes(ev.date) && (!selectedCurso || ev.curso === selectedCurso)
        );

        y = _drawAgendaDayCards(doc, {
            weekStart, entries, holidays, evaluaciones: weekEvals, pageW, pageH, mL, mR, cW,
            startY: y, onNewPage,
        });

        isFirst = false;
    }

    // "Avisos Importantes" card at the end
    const onNewPageFinal = (d) => _drawAgendaMiniHeader(d, {
        logoDataUrl, weekLabel: currentWeekLabel, pageW, mL, mR,
    });
    _drawAvisosCard(doc, y, { pageH, mL, cW, onNewPage: onNewPageFinal });

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
        doc.text('¡Que tengan una excelente semana!', pageW / 2, pageH - 9, { align: 'center' });
        doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED);
        doc.text(`Generado ${ts} — EYR Digital`, mL, pageH - 4);
        doc.text(`Página ${i} de ${totalPages}`, pageW - mR, pageH - 4, { align: 'right' });
    }

    const cursoLabel = (selectedCurso || 'todos').replace(/[^\w]/g, '');
    const mesSlug    = (mesLabel || '').replace(/\s+/g, '_');
    doc.save(`AgendaSemanal_${cursoLabel}_${mesSlug}.pdf`);
    return true;
}

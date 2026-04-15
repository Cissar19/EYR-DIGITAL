import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoEyrUrl from '../assets/logo_eyr_pdf.jpeg';

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
        doc.text(`Generado ${timestamp} — EYR Huechuraba`, marginL, pageH - 8);
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
    doc.text('Escuela Huechuraba · Enfermería', textX, y + 20);

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
        const ccW = cW - 12;
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
        doc.text(`Generado ${timestamp} — EYR Huechuraba`, mL, ph - 6);
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
        doc.text(`Generado ${timestamp} — EYR Huechuraba`, marginL, pageH - 10);
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
    doc.text('Escuela Huechuraba · Inspectoría', textX, y + 20);

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
        doc.text(`Generado ${timestamp} — EYR Huechuraba`, mL, ph - 8);
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
    doc.text(`Generado ${timestamp} — EYR Huechuraba`, marginL, pageH - 10);
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
        doc.text(`Generado ${timestamp} — EYR Huechuraba`, marginL, pH - 8);
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
        didDrawPage: (data) => {
            const totalPages = doc.internal.getNumberOfPages();
            const timestamp = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.text(`Generado ${timestamp} — EYR Huechuraba`, marginL, pageH - 8);
                doc.text(`Pagina ${i} de ${totalPages}`, pageW - marginR, pageH - 8, { align: 'right' });
            }
        },
    });

    const safeDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`Historial_DiasAdmin_${safeDate}.pdf`);
}

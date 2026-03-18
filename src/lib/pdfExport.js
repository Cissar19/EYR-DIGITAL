import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

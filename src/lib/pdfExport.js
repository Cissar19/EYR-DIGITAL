import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

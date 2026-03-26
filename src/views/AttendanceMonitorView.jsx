import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Upload, Search, AlertTriangle, ChevronDown, ChevronUp,
    FileSpreadsheet, Users, CalendarDays, LogIn, LogOut, UserX,
    Filter, ArrowUpDown, X, CheckCircle2, Save, Trash2, Eye, Pencil, Check,
    History, ChevronLeft, Download,
} from 'lucide-react';
import { subscribeToCollection, createDocument, removeDocument, updateDocument } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import { parseAttendanceExcel, processAttendance } from '../lib/attendanceParser';
import { useAuth, canEdit as canEditHelper } from '../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { exportAttendancePDF } from '../lib/pdfExport';

const PAGE_SIZE = 25;

const MONTH_OPTIONS = [
    { value: '01', label: 'Ene' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
    { value: '04', label: 'Abr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' }, { value: '08', label: 'Ago' }, { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dic' },
];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

/** Parse "HH:MM" to total minutes */
function timeToMinutes(t) {
    if (!t || t === '-') return null;
    const parts = t.toString().trim().split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
}

/** Recalculate summary KPIs from dailyRecords, respecting justified/edited fields */
function recalculateSummary(dailyRecords, originalSummary) {
    const teacherStats = new Map();
    for (const rec of dailyRecords) {
        if (!teacherStats.has(rec.teacherName)) {
            teacherStats.set(rec.teacherName, {
                name: rec.teacherName,
                lateCount: 0, lateMinutes: 0,
                earlyExitCount: 0, earlyExitMinutes: 0,
                absences: 0,
            });
        }
        const stats = teacherStats.get(rec.teacherName);
        if (rec.justified) continue;
        if (rec.absent) { stats.absences++; continue; }

        const effectiveEntry = rec.editedEntry || rec.actualEntry;
        const effectiveExit = rec.editedExit || rec.actualExit;

        const entryMin = timeToMinutes(effectiveEntry);
        const expectedEntryMin = timeToMinutes(rec.expectedEntry);
        const tardiness = (entryMin != null && expectedEntryMin != null && entryMin > expectedEntryMin)
            ? entryMin - expectedEntryMin : 0;
        if (tardiness > 0) { stats.lateCount++; stats.lateMinutes += tardiness; }

        const exitMin = timeToMinutes(effectiveExit);
        const expectedExitMin = timeToMinutes(rec.expectedExit);
        const earlyDep = (exitMin != null && expectedExitMin != null && exitMin < expectedExitMin)
            ? expectedExitMin - exitMin : 0;
        if (earlyDep > 0) { stats.earlyExitCount++; stats.earlyExitMinutes += earlyDep; }
    }

    const byTeacher = [...teacherStats.values()].sort((a, b) => b.lateMinutes - a.lateMinutes);
    return {
        totalDays: originalSummary.totalDays,
        totalTeachers: teacherStats.size,
        totalLateEntries: byTeacher.reduce((s, t) => s + t.lateCount, 0),
        totalEarlyExits: byTeacher.reduce((s, t) => s + t.earlyExitCount, 0),
        totalAbsences: byTeacher.reduce((s, t) => s + t.absences, 0),
        byTeacher,
    };
}

export default function AttendanceMonitorView() {
    const { user } = useAuth();
    const userCanEdit = canEditHelper(user);

    // Teacher hours from Firestore
    const [teacherHours, setTeacherHours] = useState([]);
    const [loadingHours, setLoadingHours] = useState(true);

    // Saved reports from Firestore
    const [savedReports, setSavedReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);

    // View state: 'idle' | 'processing' | 'preview' | 'viewing' | 'error'
    //   idle     = shows history + upload zone
    //   processing = file being parsed
    //   preview  = processed data shown, not yet saved
    //   viewing  = viewing a saved report from history
    //   error    = parse/processing error
    const [viewState, setViewState] = useState('idle');
    const [results, setResults] = useState(null);
    const [parseErrors, setParseErrors] = useState([]);
    const [fileName, setFileName] = useState('');
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [filterFromDay, setFilterFromDay] = useState('');
    const [filterFromMonth, setFilterFromMonth] = useState('');
    const [filterToDay, setFilterToDay] = useState('');
    const [filterToMonth, setFilterToMonth] = useState('');
    const [onlyIssues, setOnlyIssues] = useState(false);
    const [page, setPage] = useState(1);

    // Collapsible sections
    const [showDashboard, setShowDashboard] = useState(true);
    const [showUnmatched, setShowUnmatched] = useState(false);
    const [showAllRanking, setShowAllRanking] = useState(false);

    // Inline editing
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({ entry: '', exit: '', justified: false, justification: '' });
    const [savingEdit, setSavingEdit] = useState(false);

    // Subscribe to teacher_hours
    useEffect(() => {
        const unsub = subscribeToCollection('teacher_hours', (docs) => {
            setTeacherHours(docs);
            setLoadingHours(false);
        });
        return () => unsub();
    }, []);

    // Subscribe to saved reports
    useEffect(() => {
        const unsub = subscribeToCollection('attendance_reports', (docs) => {
            setSavedReports(docs);
            setLoadingReports(false);
        }, orderBy('createdAt', 'desc'));
        return () => unsub();
    }, []);

    // File handler
    const handleFile = useCallback(async (file) => {
        if (!file) return;
        setViewState('processing');
        setFileName(file.name);
        setParseErrors([]);
        setResults(null);

        try {
            const buffer = await file.arrayBuffer();
            const { marks, errors: pErrors } = parseAttendanceExcel(buffer);

            if (pErrors.length > 0) setParseErrors(pErrors);
            if (marks.length === 0) {
                setViewState('error');
                setParseErrors(prev => [...prev, 'No se encontraron marcaciones válidas en el archivo']);
                return;
            }

            const result = processAttendance(marks, teacherHours);
            setResults(result);
            setViewState('preview');
            setPage(1);
        } catch (err) {
            console.error('Error processing file:', err);
            setViewState('error');
            setParseErrors(prev => [...prev, `Error al procesar: ${err.message}`]);
        }
    }, [teacherHours]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleReset = () => {
        setViewState('idle');
        setResults(null);
        setParseErrors([]);
        setFileName('');
        setSearch('');
        setFilterDay('');
        setFilterFromDay(''); setFilterFromMonth('');
        setFilterToDay(''); setFilterToMonth('');
        setOnlyIssues(false);
        setPage(1);
        setEditingIndex(null);
        setEditForm({ entry: '', exit: '', justified: false, justification: '' });
    };

    // Save report to Firestore
    const handleSaveReport = async () => {
        if (!results || saving) return;
        setSaving(true);
        try {
            // Strip marks[] from dailyRecords to reduce size
            const cleanRecords = results.dailyRecords.map(({ marks, ...rest }) => rest);

            await createDocument('attendance_reports', {
                fileName: fileName || 'Sin nombre',
                uploadedBy: user?.id || user?.uid || '',
                uploadedByName: user?.name || user?.displayName || 'Desconocido',
                dateRange: results.dateRange,
                summary: results.summary,
                dailyRecords: cleanRecords,
                unmatchedPeople: results.unmatchedPeople || [],
            });
            toast.success('Reporte guardado exitosamente');
            handleReset();
        } catch (err) {
            console.error('Error saving report:', err);
            toast.error('Error al guardar el reporte');
        } finally {
            setSaving(false);
        }
    };

    // Delete a saved report
    const handleDeleteReport = async (reportId) => {
        setDeletingId(reportId);
        try {
            await removeDocument('attendance_reports', reportId);
            toast.success('Reporte eliminado');
            // If we were viewing this report, go back
            if (viewState === 'viewing' && results?._reportId === reportId) {
                handleReset();
            }
        } catch (err) {
            console.error('Error deleting report:', err);
            toast.error('Error al eliminar el reporte');
        } finally {
            setDeletingId(null);
        }
    };

    // View a saved report
    const handleViewReport = (report) => {
        setResults({
            dateRange: report.dateRange,
            summary: report.summary,
            dailyRecords: report.dailyRecords || [],
            unmatchedPeople: report.unmatchedPeople || [],
            _reportId: report.id,
        });
        setFileName(report.fileName || '');
        setViewState('viewing');
        setPage(1);
        setSearch('');
        setFilterDay('');
        setFilterFromDay(''); setFilterFromMonth('');
        setFilterToDay(''); setFilterToMonth('');
        setOnlyIssues(false);
        setEditingIndex(null);
        setEditForm({ entry: '', exit: '', justified: false, justification: '' });
    };

    // ── Inline editing handlers ──

    const handleStartEdit = (originalIndex) => {
        const rec = results.dailyRecords[originalIndex];
        setEditingIndex(originalIndex);
        setEditForm({
            entry: rec.editedEntry || (rec.actualEntry !== '-' ? rec.actualEntry : ''),
            exit: rec.editedExit || (rec.actualExit !== '-' ? rec.actualExit : ''),
            justified: rec.justified || false,
            justification: rec.justification || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditForm({ entry: '', exit: '', justified: false, justification: '' });
    };

    const handleSaveEdit = async () => {
        if (editingIndex == null || !results?._reportId || savingEdit) return;
        setSavingEdit(true);
        try {
            const updatedRecords = [...results.dailyRecords];
            const rec = { ...updatedRecords[editingIndex] };

            // Store edited values only if different from original
            if (editForm.entry && editForm.entry !== rec.actualEntry) {
                rec.editedEntry = editForm.entry;
            } else {
                delete rec.editedEntry;
            }
            if (editForm.exit && editForm.exit !== rec.actualExit) {
                rec.editedExit = editForm.exit;
            } else {
                delete rec.editedExit;
            }

            rec.justified = editForm.justified || false;
            rec.justification = editForm.justified ? (editForm.justification || '') : '';

            // Recalculate tardiness/early departure from effective values
            if (!rec.absent) {
                const effectiveEntry = rec.editedEntry || rec.actualEntry;
                const effectiveExit = rec.editedExit || rec.actualExit;

                const entryMin = timeToMinutes(effectiveEntry);
                const expectedEntryMin = timeToMinutes(rec.expectedEntry);
                rec.tardinessMinutes = (entryMin != null && expectedEntryMin != null && entryMin > expectedEntryMin)
                    ? entryMin - expectedEntryMin : 0;

                const exitMin = timeToMinutes(effectiveExit);
                const expectedExitMin = timeToMinutes(rec.expectedExit);
                rec.earlyDepartureMinutes = (exitMin != null && expectedExitMin != null && exitMin < expectedExitMin)
                    ? expectedExitMin - exitMin : 0;
            }

            // Track who edited
            if (rec.editedEntry || rec.editedExit || rec.justified) {
                rec.editedBy = user?.name || user?.displayName || 'Desconocido';
                rec.editedAt = new Date().toISOString();
            } else {
                delete rec.editedBy;
                delete rec.editedAt;
            }

            updatedRecords[editingIndex] = rec;
            const newSummary = recalculateSummary(updatedRecords, results.summary);

            await updateDocument('attendance_reports', results._reportId, {
                dailyRecords: updatedRecords,
                summary: newSummary,
            });

            setResults(prev => ({ ...prev, dailyRecords: updatedRecords, summary: newSummary }));
            setEditingIndex(null);
            setEditForm({ entry: '', exit: '', justified: false, justification: '' });
            toast.success('Registro actualizado');
        } catch (err) {
            console.error('Error updating record:', err);
            toast.error('Error al actualizar el registro');
        } finally {
            setSavingEdit(false);
        }
    };

    // Filtered records
    const filteredRecords = useMemo(() => {
        if (!results) return [];
        let list = results.dailyRecords.map((r, i) => ({ ...r, _originalIndex: i }));

        if (search.trim()) {
            const norm = normalizeSearch(search);
            list = list.filter(r => normalizeSearch(r.teacherName).includes(norm));
        }
        if (filterDay) {
            list = list.filter(r => r.dayOfWeek === filterDay);
        }
        if (filterFromDay && filterFromMonth) {
            const year = results.dateRange?.from?.split('/')[2] || new Date().getFullYear();
            const fromVal = new Date(year, filterFromMonth - 1, filterFromDay);
            list = list.filter(r => {
                const [d, m, y] = r.dateFormatted.split('/');
                return new Date(y, m - 1, d) >= fromVal;
            });
        }
        if (filterToDay && filterToMonth) {
            const year = results.dateRange?.from?.split('/')[2] || new Date().getFullYear();
            const toVal = new Date(year, filterToMonth - 1, filterToDay);
            list = list.filter(r => {
                const [d, m, y] = r.dateFormatted.split('/');
                return new Date(y, m - 1, d) <= toVal;
            });
        }
        if (onlyIssues) {
            list = list.filter(r => !r.justified && (r.tardinessMinutes > 0 || r.earlyDepartureMinutes > 0 || r.absent));
        }

        return list;
    }, [results, search, filterDay, filterFromDay, filterFromMonth, filterToDay, filterToMonth, onlyIssues]);

    // Summary derived from filtered records so dashboard reacts to filters
    const displaySummary = useMemo(() => {
        if (!results) return null;
        const hasFilters = search || filterDay || (filterFromDay && filterFromMonth) || (filterToDay && filterToMonth) || onlyIssues;
        if (!hasFilters) return results.summary;
        return recalculateSummary(filteredRecords, results.summary);
    }, [results, filteredRecords, search, filterDay, filterFromDay, filterFromMonth, filterToDay, filterToMonth, onlyIssues]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
    const paginatedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [search, filterDay, filterFromDay, filterFromMonth, filterToDay, filterToMonth, onlyIssues]);

    if (loadingHours || loadingReports) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-slate-400 font-medium">Cargando datos...</div>
            </div>
        );
    }

    const showingResults = viewState === 'preview' || viewState === 'viewing';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Monitor de Horas</h1>
                    </div>
                </div>
                {showingResults && (
                    <div className="flex items-center gap-2">
                        {viewState === 'preview' && userCanEdit && (
                            <button
                                onClick={handleSaveReport}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-bold text-white transition-colors flex items-center gap-2 disabled:opacity-60"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Guardando...' : 'Guardar en sistema'}
                            </button>
                        )}
                        <button
                            onClick={() => exportAttendancePDF({
                                dateRange: results.dateRange,
                                summary: displaySummary,
                                records: filteredRecords,
                                fileName,
                            })}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Exportar PDF
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-600 transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Volver
                        </button>
                    </div>
                )}
            </div>

            {/* Upload Area — shown in idle and error states */}
            {(viewState === 'idle' || viewState === 'processing' || viewState === 'error') && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={cn(
                        "relative bg-white rounded-3xl border-2 border-dashed p-8 text-center transition-all",
                        viewState === 'processing'
                            ? "border-amber-300 bg-amber-50/50"
                            : viewState === 'error'
                                ? "border-red-300 bg-red-50/50"
                                : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer"
                    )}
                    onClick={() => {
                        if (viewState !== 'processing') document.getElementById('attendance-file-input')?.click();
                    }}
                >
                    <input
                        id="attendance-file-input"
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />

                    {viewState === 'processing' ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center animate-pulse">
                                <FileSpreadsheet className="w-6 h-6 text-amber-600" />
                            </div>
                            <p className="text-sm font-bold text-amber-700">Procesando {fileName}...</p>
                            <div className="w-48 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                        </div>
                    ) : viewState === 'error' ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <p className="text-sm font-bold text-red-700">Error al procesar</p>
                            {parseErrors.map((e, i) => (
                                <p key={i} className="text-xs text-red-500">{e}</p>
                            ))}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                className="mt-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-xs font-bold text-red-700 transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">
                                    Arrastra el Excel de marcaciones aquí
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    o haz clic para seleccionar archivo (.xlsx)
                                </p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                {teacherHours.length} funcionarios con horario registrado en el sistema
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* History of saved reports — shown in idle state */}
            {viewState === 'idle' && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-400" />
                        Reportes Guardados
                        {savedReports.length > 0 && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {savedReports.length}
                            </span>
                        )}
                    </h2>

                    {savedReports.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100/5 p-12 text-center shadow-sm">
                            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-medium">No hay reportes guardados</p>
                            <p className="text-xs text-slate-400 mt-1">Sube un Excel de marcaciones para comenzar</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {savedReports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    onView={() => handleViewReport(report)}
                                    onDelete={userCanEdit ? () => handleDeleteReport(report.id) : null}
                                    deleting={deletingId === report.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Results (preview or viewing saved) */}
            {showingResults && results && (
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Preview badge */}
                        {viewState === 'preview' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                <p className="text-sm font-medium text-amber-700">
                                    Vista previa — este reporte aún no ha sido guardado
                                </p>
                            </div>
                        )}

                        {/* Date range badge */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                            <CalendarDays className="w-4 h-4" />
                            <span className="font-medium">Periodo: {results.dateRange.from} — {results.dateRange.to}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-medium">{displaySummary.totalTeachers} funcionarios procesados</span>
                            {fileName && (
                                <>
                                    <span className="text-slate-300">|</span>
                                    <span className="font-mono text-xs text-slate-400">{fileName}</span>
                                </>
                            )}
                        </div>

                        {/* Dashboard KPIs */}
                        <div>
                            <button
                                onClick={() => setShowDashboard(v => !v)}
                                className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:text-slate-900 mb-3 transition-colors"
                            >
                                {showDashboard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                Dashboard
                            </button>
                            <AnimatePresence>
                                {showDashboard && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <KPICard
                                                icon={CalendarDays}
                                                label="Días Analizados"
                                                value={displaySummary.totalDays}
                                                color="indigo"
                                            />
                                            <KPICard
                                                icon={LogIn}
                                                label="Total Atrasos"
                                                value={displaySummary.totalLateEntries}
                                                color="red"
                                            />
                                            <KPICard
                                                icon={LogOut}
                                                label="Salidas Anticipadas"
                                                value={displaySummary.totalEarlyExits}
                                                color="amber"
                                            />
                                            <KPICard
                                                icon={UserX}
                                                label="Ausencias"
                                                value={displaySummary.totalAbsences}
                                                color="purple"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Ranking de Atrasos */}
                        {displaySummary.byTeacher.filter(t => t.lateCount > 0).length > 0 && (() => {
                            const ranked = displaySummary.byTeacher.filter(t => t.lateCount > 0);
                            const visible = showAllRanking ? ranked : ranked.slice(0, 9);
                            return (
                                <div>
                                    <h2 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        Ranking de Atrasos
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                            {ranked.length} funcionario{ranked.length !== 1 ? 's' : ''}
                                        </span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {visible.map((teacher, i) => {
                                            const severity = teacher.lateMinutes > 120
                                                ? 'red'
                                                : teacher.lateMinutes > 60
                                                    ? 'amber'
                                                    : 'yellow';
                                            return (
                                                <motion.div
                                                    key={teacher.name}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => setSearch(teacher.name)}
                                                    className={cn(
                                                        "bg-white rounded-xl border-l-4 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                                                        severity === 'red' && "border-l-red-500",
                                                        severity === 'amber' && "border-l-amber-500",
                                                        severity === 'yellow' && "border-l-yellow-400",
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800 truncate hover:text-indigo-700 transition-colors">{teacher.name}</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-xs text-slate-500">
                                                                    <span className="font-bold text-red-600">{teacher.lateCount}</span> atrasos
                                                                </span>
                                                                <span className="text-xs text-slate-500">
                                                                    <span className="font-bold text-red-600">{teacher.lateMinutes}</span> min total
                                                                </span>
                                                            </div>
                                                            {teacher.earlyExitCount > 0 && (
                                                                <p className="text-[10px] text-amber-600 mt-1">
                                                                    + {teacher.earlyExitCount} salidas anticipadas ({teacher.earlyExitMinutes} min)
                                                                </p>
                                                            )}
                                                            {teacher.absences > 0 && (
                                                                <p className="text-[10px] text-purple-600 mt-0.5">
                                                                    + {teacher.absences} ausencia{teacher.absences > 1 ? 's' : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className={cn(
                                                            "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                                                            severity === 'red' && "bg-red-100 text-red-700",
                                                            severity === 'amber' && "bg-amber-100 text-amber-700",
                                                            severity === 'yellow' && "bg-yellow-100 text-yellow-700",
                                                        )}>
                                                            #{i + 1}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    {ranked.length > 9 && (
                                        <button
                                            onClick={() => setShowAllRanking(v => !v)}
                                            className="mt-3 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            {showAllRanking ? (
                                                <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
                                            ) : (
                                                <><ChevronDown className="w-3.5 h-3.5" /> Ver todos ({ranked.length})</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Filters */}
                        <div className="bg-white rounded-3xl border border-slate-100/5 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar funcionario..."
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <select value={filterFromDay} onChange={(e) => setFilterFromDay(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400">
                                        <option value="">Día</option>
                                        {DAY_OPTIONS.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
                                    </select>
                                    <select value={filterFromMonth} onChange={(e) => setFilterFromMonth(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400">
                                        <option value="">Mes</option>
                                        {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <span className="text-xs text-slate-400 font-bold">—</span>
                                    <select value={filterToDay} onChange={(e) => setFilterToDay(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400">
                                        <option value="">Día</option>
                                        {DAY_OPTIONS.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
                                    </select>
                                    <select value={filterToMonth} onChange={(e) => setFilterToMonth(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400">
                                        <option value="">Mes</option>
                                        {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <button
                                        onClick={() => { const d = new Date(); setFilterToDay(String(d.getDate()).padStart(2,'0')); setFilterToMonth(String(d.getMonth()+1).padStart(2,'0')); }}
                                        className={cn(
                                            "px-2.5 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap",
                                            filterToDay && filterToMonth && filterToDay === String(new Date().getDate()).padStart(2,'0') && filterToMonth === String(new Date().getMonth()+1).padStart(2,'0')
                                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300"
                                        )}
                                    >
                                        Hasta hoy
                                    </button>
                                    {(filterFromDay || filterFromMonth || filterToDay || filterToMonth) && (
                                        <button
                                            onClick={() => { setFilterFromDay(''); setFilterFromMonth(''); setFilterToDay(''); setFilterToMonth(''); }}
                                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Limpiar fechas"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={filterDay}
                                    onChange={(e) => setFilterDay(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-400"
                                >
                                    <option value="">Todos los días</option>
                                    <option value="Lunes">Lunes</option>
                                    <option value="Martes">Martes</option>
                                    <option value="Miércoles">Miércoles</option>
                                    <option value="Jueves">Jueves</option>
                                    <option value="Viernes">Viernes</option>
                                </select>
                                <button
                                    onClick={() => setOnlyIssues(v => !v)}
                                    className={cn(
                                        "px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors flex items-center gap-1.5",
                                        onlyIssues
                                            ? "border-red-300 bg-red-50 text-red-700"
                                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-red-300"
                                    )}
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    Solo incidencias
                                </button>
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Detail Table */}
                        <div className="overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-100/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100/50">
                                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[180px]">Docente</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Fecha</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[80px]">Día</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[75px]">Ent. Esperada</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[75px]">Ent. Real</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[70px]">Atraso</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[75px]">Sal. Esperada</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[75px]">Sal. Real</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[70px]">Sal. Ant.</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[70px]">Deuda</th>
                                            {viewState === 'viewing' && (
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[80px]">Estado</th>
                                            )}
                                            {viewState === 'viewing' && userCanEdit && (
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[50px]"></th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/5">
                                        {paginatedRecords.map((rec, idx) => {
                                            const isEditing = viewState === 'viewing' && userCanEdit && editingIndex === rec._originalIndex;
                                            return (
                                                <React.Fragment key={`${rec.teacherName}-${rec.dateFormatted}-${idx}`}>
                                                    <tr className={cn(
                                                        "hover:bg-slate-50/50 transition-colors",
                                                        rec.justified
                                                            ? "bg-emerald-50/60"
                                                            : rec.absent
                                                                ? "bg-purple-50/60"
                                                                : rec.tardinessMinutes > 15
                                                                    ? "bg-red-50/60"
                                                                    : rec.tardinessMinutes > 0
                                                                        ? "bg-amber-50/40"
                                                                        : rec.earlyDepartureMinutes > 0
                                                                            ? "bg-amber-50/30"
                                                                            : idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                                    )}>
                                                        <td className="py-2.5 px-4">
                                                            <span className="font-bold text-slate-800 text-xs">{rec.teacherName}</span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center text-xs font-mono text-slate-600">{rec.dateFormatted}</td>
                                                        <td className="py-2.5 px-3 text-center text-xs text-slate-600">{rec.dayOfWeek}</td>
                                                        <td className="py-2.5 px-3 text-center text-xs font-mono text-slate-500">{rec.expectedEntry}</td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            {isEditing && !rec.absent ? (
                                                                <input
                                                                    type="time"
                                                                    value={editForm.entry}
                                                                    onChange={(e) => setEditForm(f => ({ ...f, entry: e.target.value }))}
                                                                    className="w-24 px-2 py-1 rounded-lg border border-indigo-300 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                                />
                                                            ) : rec.absent ? (
                                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">AUSENTE</span>
                                                            ) : (
                                                                <span className={cn(
                                                                    "text-xs font-mono font-bold",
                                                                    rec.tardinessMinutes > 0 && !rec.justified ? "text-red-600" : "text-emerald-600"
                                                                )}>
                                                                    {rec.editedEntry || rec.actualEntry}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            {rec.tardinessMinutes > 0 && !rec.justified ? (
                                                                <span className={cn(
                                                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                                                    rec.tardinessMinutes > 15
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-amber-100 text-amber-700"
                                                                )}>
                                                                    +{rec.tardinessMinutes} min
                                                                </span>
                                                            ) : !rec.absent ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                                                            ) : null}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center text-xs font-mono text-slate-500">{rec.expectedExit}</td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            {isEditing && !rec.absent ? (
                                                                <input
                                                                    type="time"
                                                                    value={editForm.exit}
                                                                    onChange={(e) => setEditForm(f => ({ ...f, exit: e.target.value }))}
                                                                    className="w-24 px-2 py-1 rounded-lg border border-indigo-300 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                                />
                                                            ) : !rec.absent ? (
                                                                <span className={cn(
                                                                    "text-xs font-mono font-bold",
                                                                    rec.earlyDepartureMinutes > 0 && !rec.justified ? "text-amber-600" : "text-emerald-600"
                                                                )}>
                                                                    {rec.editedExit || rec.actualExit}
                                                                </span>
                                                            ) : null}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            {rec.earlyDepartureMinutes > 0 && !rec.justified ? (
                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                                    -{rec.earlyDepartureMinutes} min
                                                                </span>
                                                            ) : !rec.absent ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                                                            ) : null}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            {(() => {
                                                                if (rec.absent || rec.justified) return null;
                                                                const effectiveExit = rec.editedExit || rec.actualExit;
                                                                const exitMin = timeToMinutes(effectiveExit);
                                                                const expectedExitMin = timeToMinutes(rec.expectedExit);
                                                                const overtime = (exitMin != null && expectedExitMin != null && exitMin > expectedExitMin)
                                                                    ? exitMin - expectedExitMin : 0;
                                                                const debt = (rec.tardinessMinutes || 0) + (rec.earlyDepartureMinutes || 0) - overtime;
                                                                if (debt > 0) return (
                                                                    <span className={cn(
                                                                        "text-xs font-black px-2 py-0.5 rounded-full",
                                                                        debt > 30 ? "bg-red-100 text-red-700" : debt > 10 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                                                    )}>
                                                                        {debt} min
                                                                    </span>
                                                                );
                                                                if (debt < 0) return (
                                                                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                                        +{Math.abs(debt)} min
                                                                    </span>
                                                                );
                                                                return <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />;
                                                            })()}
                                                        </td>
                                                        {viewState === 'viewing' && (
                                                            <td className="py-2.5 px-3 text-center">
                                                                {rec.justified ? (
                                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap" title={rec.justification || ''}>
                                                                        Justificado
                                                                    </span>
                                                                ) : (rec.editedEntry || rec.editedExit) ? (
                                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                        Editado
                                                                    </span>
                                                                ) : null}
                                                            </td>
                                                        )}
                                                        {viewState === 'viewing' && userCanEdit && (
                                                            <td className="py-2.5 px-3 text-center">
                                                                {isEditing ? (
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            onClick={handleSaveEdit}
                                                                            disabled={savingEdit}
                                                                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors disabled:opacity-50"
                                                                            title="Guardar"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                                            title="Cancelar"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleStartEdit(rec._originalIndex)}
                                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                                        title="Editar registro"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                    {isEditing && (
                                                        <tr className="bg-indigo-50/50 border-b border-slate-200">
                                                            <td colSpan={12} className="py-3 px-4">
                                                                <div className="flex items-center gap-4 flex-wrap">
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={editForm.justified}
                                                                            onChange={(e) => setEditForm(f => ({ ...f, justified: e.target.checked }))}
                                                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                        />
                                                                        <span className="text-xs font-bold text-slate-700">Justificado</span>
                                                                    </label>
                                                                    {editForm.justified && (
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.justification}
                                                                            onChange={(e) => setEditForm(f => ({ ...f, justification: e.target.value }))}
                                                                            placeholder="Motivo de justificación..."
                                                                            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {paginatedRecords.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm font-medium">No hay registros que coincidan</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                                    <span className="text-xs text-slate-500">
                                        Página {page} de {totalPages}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Unmatched People */}
                        {results.unmatchedPeople.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setShowUnmatched(v => !v)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <UserX className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-600">
                                            Personas sin horario registrado
                                        </span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {results.unmatchedPeople.length}
                                        </span>
                                    </div>
                                    {showUnmatched
                                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                        : <ChevronDown className="w-4 h-4 text-slate-400" />
                                    }
                                </button>
                                <AnimatePresence>
                                    {showUnmatched && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4">
                                                <p className="text-xs text-slate-400 mb-3">
                                                    Estas personas registraron marcaciones pero no tienen horario en el sistema (personal administrativo, auxiliares, etc.)
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {results.unmatchedPeople.map(p => (
                                                        <div
                                                            key={p.name}
                                                            className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                                                        >
                                                            <span className="text-xs font-medium text-slate-600 truncate">{p.name}</span>
                                                            <span className="text-[10px] text-slate-400 ml-2 shrink-0">{p.markCount} marcas</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Parse errors (if any) */}
                        {parseErrors.length > 0 && (
                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                                <p className="text-xs font-bold text-amber-700 mb-2">
                                    Advertencias del parseo ({parseErrors.length})
                                </p>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {parseErrors.slice(0, 20).map((e, i) => (
                                        <p key={i} className="text-[10px] text-amber-600 font-mono">{e}</p>
                                    ))}
                                    {parseErrors.length > 20 && (
                                        <p className="text-[10px] text-amber-500">...y {parseErrors.length - 20} más</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}

// ── Report Card Component ──

function ReportCard({ report, onView, onDelete, deleting }) {
    const date = report.createdAt?.toDate?.();
    const formattedDate = date
        ? date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
    const formattedTime = date
        ? date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        : '';

    const s = report.summary || {};

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                    <p className="text-xs font-mono text-slate-400 truncate">{report.fileName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {formattedDate} {formattedTime && `a las ${formattedTime}`}
                    </p>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            {report.dateRange && (
                <p className="text-xs font-medium text-slate-600 mb-2">
                    {report.dateRange.from} — {report.dateRange.to}
                </p>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                    <p className="text-lg font-black text-red-600">{s.totalLateEntries || 0}</p>
                    <p className="text-[10px] text-slate-400">Atrasos</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-black text-amber-600">{s.totalEarlyExits || 0}</p>
                    <p className="text-[10px] text-slate-400">Sal. Ant.</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-black text-purple-600">{s.totalAbsences || 0}</p>
                    <p className="text-[10px] text-slate-400">Ausencias</p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3">
                <Users className="w-3 h-3" />
                <span>{s.totalTeachers || 0} funcionarios · {s.totalDays || 0} días</span>
            </div>

            {report.uploadedByName && (
                <p className="text-[10px] text-slate-400 mb-3">
                    Subido por {report.uploadedByName}
                </p>
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={onView}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Ver reporte
                </button>
                {onDelete && (
                    <button
                        onClick={onDelete}
                        disabled={deleting}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ── KPI Card Component ──

const COLOR_MAP = {
    indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-500', label: 'text-indigo-600', value: 'text-indigo-700' },
    red: { bg: 'bg-red-100', icon: 'text-red-500', label: 'text-red-600', value: 'text-red-700' },
    amber: { bg: 'bg-amber-100', icon: 'text-amber-500', label: 'text-amber-600', value: 'text-amber-700' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-500', label: 'text-purple-600', value: 'text-purple-700' },
};

function KPICard({ icon: Icon, label, value, color }) {
    const c = COLOR_MAP[color] || COLOR_MAP.indigo;
    return (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", c.icon)} />
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", c.label)}>{label}</span>
            </div>
            <span className={cn("text-2xl font-black", c.value)}>{value}</span>
        </div>
    );
}

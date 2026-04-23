import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FileCheck, Plus, Search, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Pencil, Trash2, User, Calendar, History, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import { useAuth, canEdit } from '../context/AuthContext';
import { useJustificatives } from '../context/JustificativesContext';
import { useStudents } from '../context/StudentsContext';
import { cn } from '../lib/utils';

const CURSOS = [
    'Pre-Kinder', 'Kinder',
    '1° Básico', '2° Básico', '3° Básico', '4° Básico',
    '5° Básico', '6° Básico', '7° Básico', '8° Básico',
];

const TYPES = [
    { value: 'medico', label: 'Medico', color: 'bg-red-100 text-red-700' },
    { value: 'otro', label: 'Otro', color: 'bg-slate-100 text-slate-700' },
];

const getTypeConfig = (type) => TYPES.find(t => t.value === type) || TYPES[3];

const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

const STUDENTS_PER_PAGE = 10;

export default function JustificativesView() {
    const { user } = useAuth();
    const { justificatives, addJustificative, updateJustificative, deleteJustificative } = useJustificatives();
    const { students } = useStudents();
    const userCanEdit = canEdit(user);

    // Filters
    const [search, setSearch] = useState('');
    const [filterCurso, setFilterCurso] = useState('');

    // UI state
    const [showModal, setShowModal] = useState(false);
    const [modalStudent, setModalStudent] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [dashboardOpen, setDashboardOpen] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [page, setPage] = useState(1);
    const filtersRef = useRef(null);

    // Close filters dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (filtersRef.current && !filtersRef.current.contains(e.target)) setFiltersOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Index: justificatives by studentId
    const justByStudent = useMemo(() => {
        const map = {};
        justificatives.forEach(j => {
            if (!map[j.studentId]) map[j.studentId] = [];
            map[j.studentId].push(j);
        });
        return map;
    }, [justificatives]);

    // Filtered students
    const filteredStudents = useMemo(() => {
        let list = students;
        if (search.trim()) {
            const norm = normalizeSearch(search);
            list = list.filter(s =>
                normalizeSearch(s.fullName).includes(norm) ||
                normalizeSearch(s.rut).includes(norm)
            );
        }
        if (filterCurso) list = list.filter(s => s.curso === filterCurso);
        return list;
    }, [students, search, filterCurso]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const paginatedStudents = useMemo(() => {
        const start = (safePage - 1) * STUDENTS_PER_PAGE;
        return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
    }, [filteredStudents, safePage]);

    // Reset page on filter change
    React.useEffect(() => { setPage(1); }, [search, filterCurso]);

    // Dashboard KPIs (current month)
    const monthStats = useMemo(() => {
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthItems = justificatives.filter(j => j.date?.startsWith(monthPrefix));

        const byType = {};
        TYPES.forEach(t => { byType[t.value] = 0; });
        const byCurso = {};
        monthItems.forEach(j => {
            byType[j.type] = (byType[j.type] || 0) + 1;
            if (j.studentCurso) byCurso[j.studentCurso] = (byCurso[j.studentCurso] || 0) + 1;
        });

        const topCursos = Object.entries(byCurso)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return { total: monthItems.length, byType, topCursos };
    }, [justificatives]);

    const openCreateFor = useCallback((student) => {
        setModalStudent(student);
        setEditingItem(null);
        setShowModal(true);
    }, []);

    const openEdit = useCallback((item) => {
        setModalStudent(null);
        setEditingItem(item);
        setShowModal(true);
    }, []);

    const handleDelete = async (id) => {
        await deleteJustificative(id);
        setDeleteConfirm(null);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-eyr-primary-container/40 rounded-xl">
                        <FileCheck className="w-6 h-6 text-eyr-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-eyr-on-surface font-headline">Justificativos</h1>
                        <p className="text-sm text-eyr-on-variant">Registro de inasistencias justificadas</p>
                    </div>
                </div>
            </div>

            {/* Dashboard KPIs */}
            <div className="bg-white rounded-3xl border border-eyr-outline-variant/10 shadow-sm overflow-hidden">
                <button onClick={() => setDashboardOpen(v => !v)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-eyr-surface-low transition-colors">
                    <span className="font-semibold text-eyr-on-surface text-sm">Resumen del Mes</span>
                    <ChevronDown className={cn('w-4 h-4 text-eyr-on-variant transition-transform duration-200', dashboardOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                    {dashboardOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-[#e0e7ff] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Total</span>
                                    <div>
                                        <p className="text-3xl font-extrabold text-indigo-900">{monthStats.total}</p>
                                        <p className="text-indigo-700 font-semibold text-sm">Justificativos</p>
                                    </div>
                                </div>
                                <div className="bg-[#fee2e2] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-red-600 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Médico</span>
                                    <div>
                                        <p className="text-3xl font-extrabold text-red-900">{monthStats.byType.medico || 0}</p>
                                        <p className="text-red-700 font-semibold text-sm">Certificados</p>
                                    </div>
                                </div>
                                <div className="bg-[#f1f5f9] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Otro</span>
                                    <div>
                                        <p className="text-3xl font-extrabold text-slate-700">{monthStats.byType.otro || 0}</p>
                                        <p className="text-slate-600 font-semibold text-sm">Motivo otro</p>
                                    </div>
                                </div>
                                <div className="bg-[#d1fae5] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-emerald-600 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Top cursos</span>
                                    <div>
                                        {monthStats.topCursos.length === 0
                                            ? <p className="text-sm text-emerald-600">Sin datos</p>
                                            : monthStats.topCursos.map(([curso, count]) => (
                                                <p key={curso} className="text-xs text-emerald-800 truncate font-medium">{curso}: <span className="font-bold">{count}</span></p>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-eyr-on-variant" />
                    <input
                        type="text"
                        placeholder="Buscar alumno por nombre o RUT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none text-sm"
                    />
                </div>
                <div ref={filtersRef} className="relative">
                    <button
                        onClick={() => setFiltersOpen(v => !v)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                            filterCurso
                                ? 'border-eyr-primary/30 bg-eyr-primary-container/20 text-eyr-primary'
                                : 'bg-white text-eyr-on-variant border-eyr-outline-variant/30 hover:bg-eyr-surface-low'
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtros
                        {filterCurso && (
                            <span className="w-5 h-5 bg-eyr-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                        )}
                    </button>
                    <AnimatePresence>
                        {filtersOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-72 bg-white border border-eyr-outline-variant/20 rounded-2xl shadow-xl z-30 overflow-hidden"
                            >
                                <div className="px-4 py-3 border-b border-eyr-outline-variant/10 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-eyr-on-surface">Filtros</span>
                                    {filterCurso && (
                                        <button onClick={() => setFilterCurso('')} className="text-xs text-eyr-primary hover:opacity-70 font-medium">Limpiar</button>
                                    )}
                                </div>
                                <div className="p-4">
                                    <label className="block text-xs font-medium text-eyr-on-variant mb-2">Curso</label>
                                    <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
                                        {CURSOS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setFilterCurso(filterCurso === c ? '' : c)}
                                                className={cn(
                                                    'px-3 py-2 rounded-lg text-xs font-medium text-left transition-all',
                                                    filterCurso === c
                                                        ? 'bg-eyr-primary-container/20 text-eyr-primary ring-1 ring-eyr-primary/30'
                                                        : 'bg-eyr-surface-low text-eyr-on-variant hover:bg-eyr-surface-high'
                                                )}
                                            >{c}</button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {filterCurso && (
                <div className="flex items-center gap-2">
                    <p className="text-xs text-eyr-on-variant">{filteredStudents.length} alumno{filteredStudents.length !== 1 ? 's' : ''}</p>
                    <button onClick={() => setFilterCurso('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-eyr-primary-container/20 text-eyr-primary rounded-full text-[11px] font-medium hover:bg-eyr-primary-container/30 transition-colors">
                        {filterCurso}<X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Student list */}
            <div className="space-y-2">
                {paginatedStudents.length === 0 && (
                    <div className="bg-white rounded-3xl border border-eyr-outline-variant/10 p-12 text-center shadow-sm">
                        <User className="w-10 h-10 text-eyr-on-variant/30 mx-auto mb-3" />
                        <p className="text-eyr-on-variant font-medium">No se encontraron alumnos</p>
                    </div>
                )}
                {paginatedStudents.map(student => {
                    const studentJusts = justByStudent[student.id] || [];
                    const isExpanded = expandedStudent === student.id;

                    return (
                        <div key={student.id} className="bg-white rounded-3xl border border-eyr-outline-variant/10 shadow-sm overflow-hidden transition-all hover:border-eyr-primary/20">
                            <div className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 rounded-xl bg-eyr-primary-container/40 flex items-center justify-center text-sm font-bold text-eyr-primary shrink-0">
                                    {student.fullName?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-eyr-on-surface text-sm">{student.fullName}</span>
                                        {student.curso && (
                                            <span className="text-[10px] bg-eyr-primary-container/30 text-eyr-primary px-2 py-0.5 rounded-full font-medium">{student.curso}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-eyr-on-variant font-mono mt-0.5">{student.rut}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {studentJusts.length > 0 && (
                                        <button
                                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                                            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                                                isExpanded ? 'bg-eyr-primary-container/20 text-eyr-primary' : 'bg-eyr-surface-high text-eyr-on-variant hover:bg-eyr-surface-high'
                                            )}
                                        >
                                            <History className="w-3.5 h-3.5" />
                                            {studentJusts.length}
                                            <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                                        </button>
                                    )}
                                    {userCanEdit && (
                                        <button
                                            onClick={() => openCreateFor(student)}
                                            className="flex items-center gap-2 bg-eyr-primary text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all text-sm font-bold"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="hidden sm:inline">Registrar</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && studentJusts.length > 0 && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                        <div className="border-t border-eyr-outline-variant/10 bg-eyr-surface-low/50 px-4 py-3 space-y-2">
                                            {studentJusts.map(item => {
                                                const typeConf = getTypeConfig(item.type);
                                                return (
                                                    <div key={item.id} className="flex items-start gap-3 bg-white rounded-2xl p-3 border border-eyr-outline-variant/20">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeConf.color}`}>{typeConf.label}</span>
                                                                <span className="text-xs text-eyr-on-variant flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />{formatDate(item.date)}
                                                                </span>
                                                            </div>
                                                            {item.diagnosis && <p className="text-sm text-eyr-on-surface mt-1 font-medium">Dx: {item.diagnosis}</p>}
                                                            {item.attachmentNote && <p className="text-[11px] text-eyr-on-variant mt-1">Adjunto: {item.attachmentNote}</p>}
                                                            {item.registeredBy?.name && (
                                                                <p className="text-[11px] text-eyr-on-variant mt-1 flex items-center gap-1">
                                                                    <User className="w-3 h-3" />{item.registeredBy.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {userCanEdit && (
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button onClick={() => openEdit(item)} className="p-1.5 text-eyr-on-variant hover:text-eyr-primary hover:bg-eyr-primary-container/20 rounded-lg transition-colors">
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 text-eyr-on-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                            className="px-6 py-3 text-base font-bold rounded-full border border-eyr-outline-variant/30 text-eyr-on-variant hover:bg-eyr-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            Anterior
                        </button>
                        <span className="text-sm text-eyr-on-variant px-3">
                            Página <span className="font-semibold text-eyr-on-surface">{safePage}</span> de <span className="font-semibold text-eyr-on-surface">{totalPages}</span>
                        </span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                            className="px-6 py-3 text-base font-bold rounded-full border border-eyr-outline-variant/30 text-eyr-on-variant hover:bg-eyr-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <ModalContainer onClose={() => setShowModal(false)} maxWidth="max-w-md">
                    <JustificativeForm
                        editing={editingItem}
                        preselectedStudent={modalStudent}
                        students={students}
                        user={user}
                        onSave={async (data) => {
                            if (editingItem) {
                                const ok = await updateJustificative(editingItem.id, data);
                                if (ok) setShowModal(false);
                            } else {
                                await addJustificative(data);
                            }
                        }}
                        onDone={() => setShowModal(false)}
                        onClose={() => setShowModal(false)}
                    />
                </ModalContainer>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <ModalContainer onClose={() => setDeleteConfirm(null)} maxWidth="max-w-sm" noGradient>
                    <div className="p-6">
                        <h3 className="font-headline font-extrabold text-eyr-on-surface mb-2">Eliminar justificativo</h3>
                        <p className="text-sm text-eyr-on-variant mb-5">Esta accion no se puede deshacer.</p>
                    </div>
                    <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                        <button onClick={() => setDeleteConfirm(null)} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-full px-8 py-4 text-base font-bold transition-all">Cancelar</button>
                        <button onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 text-white rounded-full font-extrabold px-12 py-4 text-base shadow-xl hover:bg-red-700 transition-all">Eliminar</button>
                    </div>
                </ModalContainer>
            )}
        </div>
    );
}

// ── Form ──

function JustificativeForm({ editing, preselectedStudent, students, user, onSave, onDone, onClose }) {
    // When editing, find the student; when creating with preselected, use that
    const lockedStudent = preselectedStudent || (editing ? students.find(s => s.id === editing.studentId) : null);

    const todayStr = new Date().toISOString().slice(0, 10);
    const [dateFrom, setDateFrom] = useState(editing?.date || todayStr);
    const [dateTo, setDateTo] = useState(editing?.date || todayStr);
    const [type, setType] = useState(editing?.type || '');
    const [diagnosis, setDiagnosis] = useState(editing?.diagnosis || '');
    const [attachmentNote, setAttachmentNote] = useState(editing?.attachmentNote || '');
    const [saving, setSaving] = useState(false);

    // Generate all dates in range [from, to]
    const datesInRange = useMemo(() => {
        const dates = [];
        const start = new Date(dateFrom + 'T12:00:00');
        const end = new Date(dateTo + 'T12:00:00');
        const current = new Date(start);
        while (current <= end) {
            dates.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [dateFrom, dateTo]);

    const handleSubmit = async () => {
        if (!lockedStudent || !type) return;
        if (type === 'medico' && !diagnosis.trim()) return;
        setSaving(true);
        try {
            const baseData = {
                studentId: lockedStudent.id,
                studentName: lockedStudent.fullName || '',
                studentRut: lockedStudent.rut || '',
                studentCurso: lockedStudent.curso || '',
                type,
                diagnosis: type === 'medico' ? diagnosis : '',
                attachmentNote,
                registeredBy: { id: user.uid, name: user.name },
            };

            if (editing) {
                // Editing: single date update
                await onSave({ ...baseData, date: dateFrom });
            } else {
                // Creating: one justificative per day in range
                for (const d of datesInRange) {
                    await onSave({ ...baseData, date: d });
                }
                onDone?.();
            }
        } finally {
            setSaving(false);
        }
    };

    const isValid = lockedStudent && type && dateFrom && (type !== 'medico' || diagnosis.trim());
    const rangeCount = datesInRange.length;

    return (
        <div className="w-full flex flex-col">
            <div className="flex items-center justify-between px-8 pt-7 pb-5 shrink-0">
                <h3 className="font-headline font-extrabold text-eyr-on-surface text-xl">{editing ? 'Editar Justificativo' : 'Nuevo Justificativo'}</h3>
                <button onClick={onClose} className="p-1 text-eyr-on-variant hover:bg-eyr-surface-high rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-8 pb-4 space-y-3.5 overflow-y-auto flex-1">
                {/* Student (locked) */}
                {lockedStudent && (
                    <div>
                        <label className="block text-xs font-medium text-eyr-on-variant mb-1">Alumno</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-eyr-surface-low border border-eyr-outline-variant/20 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-eyr-primary-container/40 flex items-center justify-center text-[11px] font-bold text-eyr-primary shrink-0">
                                {lockedStudent.fullName?.charAt(0)}
                            </div>
                            <span className="font-medium text-sm text-eyr-on-surface truncate">{lockedStudent.fullName}</span>
                            {lockedStudent.curso && (
                                <span className="text-[10px] bg-eyr-primary-container/30 text-eyr-primary px-1.5 py-0.5 rounded-full shrink-0">{lockedStudent.curso}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Date - mini calendar with range */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">
                        {editing ? 'Fecha *' : 'Fecha(s) *'}
                    </label>
                    <MiniCalendar
                        startDate={dateFrom}
                        endDate={dateTo}
                        onRangeChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
                        singleMode={!!editing}
                    />
                    {!editing && rangeCount > 1 && (
                        <p className="text-xs text-eyr-primary font-medium mt-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {rangeCount} dias seleccionados: {formatDate(dateFrom)} — {formatDate(dateTo)}
                        </p>
                    )}
                </div>

                {/* Type pills */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">Tipo *</label>
                    <div className="flex flex-wrap gap-2">
                        {TYPES.map(t => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setType(t.value)}
                                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${type === t.value
                                    ? `${t.color} ring-2 ring-offset-1 ring-current`
                                    : 'bg-eyr-surface-high text-eyr-on-variant hover:bg-eyr-surface-high'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Diagnosis (only for medico) */}
                {type === 'medico' && (
                    <div>
                        <label className="block text-xs font-medium text-eyr-on-variant mb-1">Diagnostico medico *</label>
                        <input
                            type="text"
                            value={diagnosis}
                            onChange={e => setDiagnosis(e.target.value)}
                            placeholder="Ej: Amigdalitis aguda, control dental, etc."
                            className="w-full px-3 py-2 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none"
                        />
                    </div>
                )}

                {/* Attachment note */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">Nota de documento adjunto</label>
                    <input
                        type="text"
                        value={attachmentNote}
                        onChange={e => setAttachmentNote(e.target.value)}
                        placeholder="Ej: Certificado medico entregado en inspectoria"
                        className="w-full px-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none"
                    />
                </div>
            </div>

            <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0 mt-4">
                <button onClick={onClose} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-full px-8 py-4 text-base font-bold transition-all">Cancelar</button>
                <button
                    onClick={handleSubmit}
                    disabled={!isValid || saving}
                    className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-full font-extrabold px-12 py-4 text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {saving ? 'Guardando...' : editing ? 'Actualizar' : rangeCount > 1 ? `Registrar ${rangeCount} dias` : 'Registrar'}
                </button>
            </div>
        </div>
    );
}

// ── Mini Calendar ──

const DAYS_HEADER = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function MiniCalendar({ startDate, endDate, onRangeChange, singleMode }) {
    const initial = startDate ? new Date(startDate + 'T12:00:00') : new Date();
    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());
    // Track whether next click sets a new start (true) or sets end (false)
    const [pickingStart, setPickingStart] = useState(false);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        let startWeekday = firstDay.getDay() - 1;
        if (startWeekday < 0) startWeekday = 6;

        const cells = [];
        for (let i = 0; i < startWeekday; i++) cells.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
        return cells;
    }, [viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleSelect = (day) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (singleMode) {
            onRangeChange(dateStr, dateStr);
            return;
        }

        if (pickingStart || !startDate) {
            // First click: set start, clear end
            onRangeChange(dateStr, dateStr);
            setPickingStart(false);
        } else {
            // Second click: set end (ensure from <= to)
            if (dateStr < startDate) {
                onRangeChange(dateStr, startDate);
            } else {
                onRangeChange(startDate, dateStr);
            }
            setPickingStart(true);
        }
    };

    // Check if a date string falls within the range
    const isInRange = (dateStr) => {
        if (!startDate || !endDate) return false;
        return dateStr >= startDate && dateStr <= endDate;
    };
    const isRangeStart = (dateStr) => dateStr === startDate;
    const isRangeEnd = (dateStr) => dateStr === endDate;
    const hasRange = startDate && endDate && startDate !== endDate;

    return (
        <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-1">
                <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold text-slate-700">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
            {/* Hint */}
            {!singleMode && (
                <p className="text-[10px] text-slate-400 text-center mb-1">
                    {pickingStart || !startDate
                        ? 'Selecciona el primer dia'
                        : startDate === endDate
                            ? 'Selecciona el ultimo dia del rango'
                            : 'Clic en un dia para nueva seleccion'
                    }
                </p>
            )}
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-0.5">
                {DAYS_HEADER.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">{d}</div>
                ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
                {days.map((day, i) => {
                    if (day === null) return <div key={`blank-${i}`} />;
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const inRange = isInRange(dateStr);
                    const isStart = isRangeStart(dateStr);
                    const isEnd = isRangeEnd(dateStr);
                    const isToday = dateStr === todayStr;
                    const isSingleSelected = isStart && isEnd;

                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => handleSelect(day)}
                            className={`h-7 flex items-center justify-center text-[11px] font-medium transition-all
                                ${isSingleSelected
                                    ? 'bg-indigo-600 text-white rounded-md'
                                    : isStart && hasRange
                                        ? 'bg-indigo-600 text-white rounded-l-md'
                                        : isEnd && hasRange
                                            ? 'bg-indigo-600 text-white rounded-r-md'
                                            : inRange && hasRange
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : isToday
                                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 rounded-md'
                                                    : 'text-slate-700 hover:bg-slate-100 rounded-md'
                                }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

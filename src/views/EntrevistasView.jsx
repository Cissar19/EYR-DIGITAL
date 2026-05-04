import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Search, X, ChevronDown, ChevronUp, Pencil, Trash2, User, Users, Calendar, SlidersHorizontal, Download, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import { useAuth, canEdit } from '../context/AuthContext';
import { useEntrevistas } from '../context/EntrevistasContext';
import { useStudents } from '../context/StudentsContext';
import { exportEntrevistaActaPDF, exportEntrevistasResumenPDF } from '../lib/pdfExport';

const CURSOS = [
    'Pre-Kinder', 'Kinder',
    '1° Básico', '2° Básico', '3° Básico', '4° Básico',
    '5° Básico', '6° Básico', '7° Básico', '8° Básico',
];

const REASONS = [
    { value: 'conducta', label: 'Conducta', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
    { value: 'asistencia', label: 'Asistencia', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
    { value: 'academico', label: 'Academico', color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
    { value: 'otro', label: 'Otro', color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
];

const PARTICIPANTS_OPTIONS = [
    { value: 'alumno', label: 'Entrevista Alumno', short: 'Alumno', color: 'bg-teal-100 text-teal-700', icon: User },
    { value: 'apoderado', label: 'Entrevista Apoderado', short: 'Apoderado', color: 'bg-purple-100 text-purple-700', icon: Users },
];

const getReasonConfig = (reason) => REASONS.find(r => r.value === reason) || REASONS[3];
const getParticipantsConfig = (p) => PARTICIPANTS_OPTIONS.find(o => o.value === p) || PARTICIPANTS_OPTIONS[0];

const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

const ITEMS_PER_PAGE = 12;

export default function EntrevistasView() {
    const { user } = useAuth();
    const { entrevistas, addEntrevista, updateEntrevista, deleteEntrevista } = useEntrevistas();
    const { students } = useStudents();
    const userCanEdit = canEdit(user);

    // Filters
    const [search, setSearch] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    const [filterReason, setFilterReason] = useState('');
    const [filterParticipants, setFilterParticipants] = useState('');

    // UI state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [dashboardOpen, setDashboardOpen] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [page, setPage] = useState(1);
    const filtersRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (filtersRef.current && !filtersRef.current.contains(e.target)) setFiltersOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Filtered entrevistas (directly, not by student)
    const filteredEntrevistas = useMemo(() => {
        let list = entrevistas;
        if (search.trim()) {
            const norm = normalizeSearch(search);
            list = list.filter(e =>
                normalizeSearch(e.studentName).includes(norm) ||
                normalizeSearch(e.studentRut).includes(norm) ||
                normalizeSearch(e.parentName).includes(norm)
            );
        }
        if (filterCurso) list = list.filter(e => e.studentCurso === filterCurso);
        if (filterReason) list = list.filter(e => e.reason === filterReason);
        if (filterParticipants) list = list.filter(e => e.participants === filterParticipants);
        return list;
    }, [entrevistas, search, filterCurso, filterReason, filterParticipants]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredEntrevistas.length / ITEMS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const paginatedEntrevistas = useMemo(() => {
        const start = (safePage - 1) * ITEMS_PER_PAGE;
        return filteredEntrevistas.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEntrevistas, safePage]);

    React.useEffect(() => { setPage(1); }, [search, filterCurso, filterReason, filterParticipants]);

    // Dashboard KPIs (current month)
    const monthStats = useMemo(() => {
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthItems = entrevistas.filter(e => e.date?.startsWith(monthPrefix));

        const byReason = {};
        REASONS.forEach(r => { byReason[r.value] = 0; });
        const byCurso = {};
        monthItems.forEach(e => {
            byReason[e.reason] = (byReason[e.reason] || 0) + 1;
            if (e.studentCurso) byCurso[e.studentCurso] = (byCurso[e.studentCurso] || 0) + 1;
        });

        const topCursos = Object.entries(byCurso)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return { total: monthItems.length, byReason, topCursos };
    }, [entrevistas]);

    const activeFilterCount = [filterCurso, filterReason, filterParticipants].filter(Boolean).length;

    const openCreate = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setDeleteConfirm(null);
        deleteEntrevista(id);
    };

    const handleDownloadResumen = () => {
        const stats = {
            total: filteredEntrevistas.length,
            byReason: {},
        };
        REASONS.forEach(r => { stats.byReason[r.value] = 0; });
        filteredEntrevistas.forEach(e => {
            stats.byReason[e.reason] = (stats.byReason[e.reason] || 0) + 1;
        });

        exportEntrevistasResumenPDF({
            entrevistas: filteredEntrevistas,
            stats,
            filters: { curso: filterCurso, reason: filterReason, participants: filterParticipants },
        });
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-eyr-primary-container/40 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-eyr-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-eyr-on-surface font-headline">Entrevistas</h1>
                        <p className="text-sm text-eyr-on-variant">Registro de entrevistas de inspectoría</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {filteredEntrevistas.length > 0 && (
                        <button
                            onClick={handleDownloadResumen}
                            className="flex items-center gap-2 px-5 py-3 rounded-full border border-eyr-outline-variant/30 text-sm font-semibold text-eyr-on-variant hover:bg-eyr-surface-low transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Reporte</span>
                        </button>
                    )}
                    {userCanEdit && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-8 py-4 rounded-full bg-eyr-primary text-white font-bold text-base hover:opacity-90 transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Nueva Entrevista
                        </button>
                    )}
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
                            <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="bg-[#e0e7ff] p-5 rounded-3xl flex flex-col justify-between h-28 col-span-2 sm:col-span-1">
                                    <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Total</span>
                                    <div>
                                        <p className="text-3xl font-extrabold text-indigo-900">{monthStats.total}</p>
                                        <p className="text-indigo-700 font-semibold text-sm">Entrevistas</p>
                                    </div>
                                </div>
                                <div className="bg-[#fee2e2] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-red-600 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Conducta</span>
                                    <p className="text-3xl font-extrabold text-red-900">{monthStats.byReason.conducta || 0}</p>
                                </div>
                                <div className="bg-[#fef3c7] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-amber-600 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Asistencia</span>
                                    <p className="text-3xl font-extrabold text-amber-900">{monthStats.byReason.asistencia || 0}</p>
                                </div>
                                <div className="bg-[#e0e7ff] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Académico</span>
                                    <p className="text-3xl font-extrabold text-indigo-900">{monthStats.byReason.academico || 0}</p>
                                </div>
                                <div className="bg-[#f1f5f9] p-5 rounded-3xl flex flex-col justify-between h-28">
                                    <span className="text-xs font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">Otro</span>
                                    <p className="text-3xl font-extrabold text-slate-700">{monthStats.byReason.otro || 0}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-eyr-on-variant" />
                    <input
                        type="text"
                        placeholder="Buscar por alumno, RUT o apoderado..."
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
                            activeFilterCount > 0
                                ? 'border-eyr-primary/30 bg-eyr-primary-container/20 text-eyr-primary'
                                : 'bg-white text-eyr-on-variant border-eyr-outline-variant/30 hover:bg-eyr-surface-low'
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtros
                        {activeFilterCount > 0 && (
                            <span className="w-5 h-5 bg-eyr-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
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
                                    {activeFilterCount > 0 && (
                                        <button onClick={() => { setFilterCurso(''); setFilterReason(''); setFilterParticipants(''); }} className="text-xs text-eyr-primary hover:opacity-70 font-medium">Limpiar</button>
                                    )}
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-eyr-on-variant mb-2">Curso</label>
                                        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                                            {CURSOS.map(c => (
                                                <button key={c} onClick={() => setFilterCurso(filterCurso === c ? '' : c)}
                                                    className={cn('px-3 py-2 rounded-lg text-xs font-medium text-left transition-all',
                                                        filterCurso === c ? 'bg-eyr-primary-container/20 text-eyr-primary ring-1 ring-eyr-primary/30' : 'bg-eyr-surface-low text-eyr-on-variant hover:bg-eyr-surface-high'
                                                    )}
                                                >{c}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-eyr-on-variant mb-2">Motivo</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {REASONS.map(r => (
                                                <button key={r.value} onClick={() => setFilterReason(filterReason === r.value ? '' : r.value)}
                                                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                                        filterReason === r.value ? `${r.color} ring-1 ring-current` : 'bg-eyr-surface-low text-eyr-on-variant hover:bg-eyr-surface-high'
                                                    )}
                                                >{r.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-eyr-on-variant mb-2">Tipo</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {PARTICIPANTS_OPTIONS.map(p => (
                                                <button key={p.value} onClick={() => setFilterParticipants(filterParticipants === p.value ? '' : p.value)}
                                                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                                        filterParticipants === p.value ? `${p.color} ring-1 ring-current` : 'bg-eyr-surface-low text-eyr-on-variant hover:bg-eyr-surface-high'
                                                    )}
                                                >{p.short}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-eyr-on-variant">{filteredEntrevistas.length} entrevista{filteredEntrevistas.length !== 1 ? 's' : ''}</p>
                    {filterCurso && <button onClick={() => setFilterCurso('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-eyr-primary-container/20 text-eyr-primary rounded-full text-[11px] font-medium">{filterCurso}<X className="w-3 h-3" /></button>}
                    {filterReason && <button onClick={() => setFilterReason('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-eyr-primary-container/20 text-eyr-primary rounded-full text-[11px] font-medium">{getReasonConfig(filterReason).label}<X className="w-3 h-3" /></button>}
                    {filterParticipants && <button onClick={() => setFilterParticipants('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-eyr-primary-container/20 text-eyr-primary rounded-full text-[11px] font-medium">{getParticipantsConfig(filterParticipants).short}<X className="w-3 h-3" /></button>}
                </div>
            )}

            {/* Entrevista cards */}
            <div className="space-y-3">
                {paginatedEntrevistas.length === 0 && (
                    <div className="bg-white rounded-3xl border border-eyr-outline-variant/10 p-12 text-center shadow-sm">
                        <MessageSquare className="w-10 h-10 text-eyr-on-variant/30 mx-auto mb-3" />
                        <p className="text-eyr-on-variant font-medium">No se encontraron entrevistas</p>
                        <p className="text-xs text-eyr-on-variant mt-1">Haz clic en "Nueva Entrevista" para registrar una</p>
                    </div>
                )}

                {paginatedEntrevistas.map(item => {
                    const reasonConf = getReasonConfig(item.reason);
                    const partConf = getParticipantsConfig(item.participants);
                    const PartIcon = partConf.icon;

                    return (
                        <div key={item.id} className={cn('bg-white rounded-3xl border overflow-hidden transition-all hover:shadow-md', reasonConf.border)}>
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', partConf.color)}>
                                        <PartIcon className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-eyr-on-surface">{item.studentName}</span>
                                            {item.studentCurso && (
                                                <span className="text-[10px] bg-eyr-surface-high text-eyr-on-variant px-2 py-0.5 rounded-full font-medium">{item.studentCurso}</span>
                                            )}
                                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', reasonConf.color)}>{reasonConf.label}</span>
                                        </div>

                                        <div className="flex items-center gap-3 mt-1 text-xs text-eyr-on-variant">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.date)}</span>
                                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', partConf.color)}>{partConf.short}</span>
                                            {item.parentName && item.participants === 'apoderado' && (
                                                <span>Apoderado: <span className="text-eyr-on-surface font-medium">{item.parentName}</span></span>
                                            )}
                                        </div>

                                        {item.reasonDetail && (
                                            <p className="text-sm text-eyr-on-surface mt-3">{item.reasonDetail}</p>
                                        )}

                                        {(item.summary || item.commitments) && (
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {item.summary && (
                                                    <div className="bg-eyr-surface-low rounded-2xl p-3">
                                                        <p className="text-[10px] font-semibold text-eyr-on-variant uppercase tracking-wide mb-1">Resumen</p>
                                                        <p className="text-xs text-eyr-on-surface leading-relaxed">{item.summary}</p>
                                                    </div>
                                                )}
                                                {item.commitments && (
                                                    <div className="bg-eyr-primary-container/15 rounded-2xl p-3">
                                                        <p className="text-[10px] font-semibold text-eyr-primary/70 uppercase tracking-wide mb-1">Compromisos</p>
                                                        <p className="text-xs text-eyr-on-surface leading-relaxed">{item.commitments}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {item.registeredBy?.name && (
                                            <p className="text-[11px] text-eyr-on-variant mt-3 flex items-center gap-1">
                                                <User className="w-3 h-3" />Registrado por {item.registeredBy.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => exportEntrevistaActaPDF({ entrevista: item })}
                                            className="p-2 text-eyr-on-variant hover:text-eyr-primary hover:bg-eyr-primary-container/20 rounded-xl transition-colors" title="Descargar acta PDF">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        {userCanEdit && (
                                            <>
                                                <button onClick={() => openEdit(item)} className="p-2 text-eyr-on-variant hover:text-eyr-primary hover:bg-eyr-primary-container/20 rounded-xl transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(item.id)} className="p-2 text-eyr-on-variant hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                <ModalContainer onClose={() => setShowModal(false)} maxWidth="max-w-xl">
                    <EntrevistaForm
                        editing={editingItem}
                        students={students}
                        user={user}
                        onSave={async (data) => {
                            if (editingItem) {
                                const ok = await updateEntrevista(editingItem.id, data);
                                if (ok) setShowModal(false);
                            } else {
                                const ok = await addEntrevista(data);
                                if (ok) setShowModal(false);
                            }
                        }}
                        onClose={() => setShowModal(false)}
                    />
                </ModalContainer>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <ModalContainer onClose={() => setDeleteConfirm(null)} maxWidth="max-w-sm" noGradient>
                    <div className="p-6">
                        <h3 className="font-headline font-extrabold text-eyr-on-surface mb-2">Eliminar entrevista</h3>
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

// ── Form with student search ──

function EntrevistaForm({ editing, students, user, onSave, onClose }) {
    const [selectedStudent, setSelectedStudent] = useState(
        editing ? students.find(s => s.id === editing.studentId) || null : null
    );
    const [studentSearch, setStudentSearch] = useState('');

    const filteredStudents = useMemo(() => {
        if (!studentSearch.trim()) return [];
        const norm = normalizeSearch(studentSearch);
        return students.filter(s =>
            normalizeSearch(s.fullName).includes(norm) ||
            normalizeSearch(s.rut).includes(norm)
        ).slice(0, 6);
    }, [students, studentSearch]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const [date, setDate] = useState(editing?.date || todayStr);
    const [participants, setParticipants] = useState(editing?.participants || '');
    const [parentName, setParentName] = useState(editing?.parentName || '');
    const [reason, setReason] = useState(editing?.reason || '');
    const [reasonDetail, setReasonDetail] = useState(editing?.reasonDetail || '');
    const [summary, setSummary] = useState(editing?.summary || '');
    const [commitments, setCommitments] = useState(editing?.commitments || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!editing && participants === 'apoderado' && !parentName && selectedStudent?.guardianName) {
            setParentName(selectedStudent.guardianName);
        }
    }, [participants, editing, selectedStudent, parentName]);

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setStudentSearch('');
    };

    const handleSubmit = async () => {
        if (!selectedStudent || !participants || !reason) return;
        if (participants === 'apoderado' && !parentName.trim()) return;
        setSaving(true);
        try {
            await onSave({
                studentId: selectedStudent.id,
                studentName: selectedStudent.fullName || '',
                studentRut: selectedStudent.rut || '',
                studentCurso: selectedStudent.curso || '',
                date,
                participants,
                parentName: participants === 'apoderado' ? parentName : '',
                reason,
                reasonDetail,
                summary,
                commitments,
                registeredBy: { id: user.uid, name: user.name },
            });
        } finally {
            setSaving(false);
        }
    };

    const needsParent = participants === 'apoderado';
    const isValid = selectedStudent && participants && reason && date && (!needsParent || parentName.trim());

    return (
        <>
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-5 shrink-0">
                <h3 className="font-headline font-extrabold text-eyr-on-surface text-xl">{editing ? 'Editar Entrevista' : 'Nueva Entrevista'}</h3>
                <button onClick={onClose} className="p-1.5 text-eyr-on-variant hover:bg-eyr-surface-high rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
                {/* Student search / selected */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">Alumno *</label>
                    {selectedStudent ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-eyr-surface-low border border-eyr-outline-variant/20 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-eyr-primary-container/40 flex items-center justify-center text-xs font-bold text-eyr-primary shrink-0">
                                {selectedStudent.fullName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm text-eyr-on-surface block truncate">{selectedStudent.fullName}</span>
                                <span className="text-[11px] text-eyr-on-variant font-mono">{selectedStudent.rut}</span>
                            </div>
                            {selectedStudent.curso && (
                                <span className="text-[10px] bg-eyr-primary-container/30 text-eyr-primary px-1.5 py-0.5 rounded-full shrink-0">{selectedStudent.curso}</span>
                            )}
                            {!editing && (
                                <button onClick={() => { setSelectedStudent(null); setParentName(''); }} className="p-1 text-eyr-on-variant hover:text-eyr-on-surface hover:bg-eyr-surface-high rounded-lg transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                placeholder="Buscar alumno por nombre o RUT..."
                                className="w-full pl-9 pr-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none"
                                autoFocus
                            />
                            {filteredStudents.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-52 overflow-y-auto">
                                    {filteredStudents.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleSelectStudent(s)}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-eyr-primary-container/10 text-left transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-eyr-primary-container/40 flex items-center justify-center text-[10px] font-bold text-eyr-primary shrink-0">
                                                {s.fullName?.charAt(0)}
                                            </div>
                                            <span className="text-sm text-eyr-on-surface truncate flex-1">{s.fullName}</span>
                                            {s.curso && <span className="text-[10px] text-slate-400">{s.curso}</span>}
                                            <span className="text-[10px] text-slate-400 font-mono">{s.rut}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Date + Type side by side */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-eyr-on-variant mb-1">Fecha *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-eyr-on-variant mb-1">Motivo *</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full px-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none bg-white"
                        >
                            <option value="">Seleccionar...</option>
                            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Participants: 2 cards */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">Tipo de entrevista *</label>
                    <div className="grid grid-cols-2 gap-3">
                        {PARTICIPANTS_OPTIONS.map(p => {
                            const Icon = p.icon;
                            const isActive = participants === p.value;
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setParticipants(p.value)}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${isActive
                                        ? `${p.color} border-current`
                                        : 'border-eyr-outline-variant/30 text-eyr-on-variant hover:border-eyr-outline-variant/60 hover:text-eyr-on-surface'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm font-semibold">{p.short}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Parent name (conditional) */}
                {needsParent && (
                    <div>
                        <label className="block text-xs font-medium text-eyr-on-variant mb-1">Nombre apoderado *</label>
                        <input
                            type="text"
                            value={parentName}
                            onChange={e => setParentName(e.target.value)}
                            placeholder="Nombre del apoderado"
                            className="w-full px-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none"
                        />
                    </div>
                )}

                {/* Reason detail */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">Detalle del motivo</label>
                    <textarea value={reasonDetail} onChange={e => setReasonDetail(e.target.value)}
                        placeholder="Descripcion del motivo de la entrevista..." rows={2}
                        className="w-full px-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none resize-none"
                    />
                </div>

                {/* Summary */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">Resumen de lo conversado</label>
                    <textarea value={summary} onChange={e => setSummary(e.target.value)}
                        placeholder="Resumen de los temas tratados..." rows={3}
                        className="w-full px-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none resize-none"
                    />
                </div>

                {/* Commitments */}
                <div>
                    <label className="block text-xs font-medium text-eyr-on-variant mb-1">Compromisos / Acuerdos</label>
                    <textarea value={commitments} onChange={e => setCommitments(e.target.value)}
                        placeholder="Compromisos acordados..." rows={2}
                        className="w-full px-3 py-2.5 border border-eyr-outline-variant/30 rounded-xl text-sm focus:ring-4 focus:ring-eyr-primary/10 focus:border-eyr-primary focus:outline-none resize-none"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                <button onClick={onClose} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-full px-8 py-4 text-base font-bold transition-all">Cancelar</button>
                <button onClick={handleSubmit} disabled={!isValid || saving}
                    className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-full font-extrabold px-12 py-4 text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar'}
                </button>
            </div>
        </>
    );
}


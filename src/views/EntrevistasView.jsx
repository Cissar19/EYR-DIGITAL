import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Search, X, ChevronDown, ChevronUp, Pencil, Trash2, User, Users, Calendar, SlidersHorizontal, Download, FileText } from 'lucide-react';
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

    const handleDelete = async (id) => {
        await deleteEntrevista(id);
        setDeleteConfirm(null);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                        <MessageSquare className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-slate-800">Entrevistas</h1>
                        <p className="text-sm text-slate-500">Registro de entrevistas de inspectoria</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {filteredEntrevistas.length > 0 && (
                        <button
                            onClick={handleDownloadResumen}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Reporte</span>
                        </button>
                    )}
                    {userCanEdit && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nueva</span> Entrevista
                        </button>
                    )}
                </div>
            </div>

            {/* Dashboard KPIs */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button onClick={() => setDashboardOpen(v => !v)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <span className="font-semibold text-slate-700 text-sm">Resumen del Mes</span>
                    {dashboardOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                <AnimatePresence>
                    {dashboardOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-indigo-700">{monthStats.total}</p>
                                    <p className="text-[11px] text-indigo-500 font-medium">Total</p>
                                </div>
                                {REASONS.map(r => (
                                    <div key={r.value} className={`${r.color} rounded-xl p-3 text-center`}>
                                        <p className="text-2xl font-bold">{monthStats.byReason[r.value]}</p>
                                        <p className="text-[11px] font-medium">{r.label}</p>
                                    </div>
                                ))}
                                <div className="bg-emerald-50 rounded-xl p-3 col-span-2 sm:col-span-1 lg:col-span-2">
                                    <p className="text-[11px] text-emerald-600 font-medium mb-1">Top Cursos</p>
                                    {monthStats.topCursos.length === 0 && <p className="text-xs text-slate-400">Sin datos</p>}
                                    {monthStats.topCursos.map(([curso, count]) => (
                                        <p key={curso} className="text-xs text-emerald-700 truncate">{curso}: <span className="font-bold">{count}</span></p>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por alumno, RUT o apoderado..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                        />
                    </div>

                    <div ref={filtersRef} className="relative">
                        <button
                            onClick={() => setFiltersOpen(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${activeFilterCount > 0
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">Filtros</span>
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
                            )}
                        </button>

                        <AnimatePresence>
                            {filtersOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-30 overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">Filtros</span>
                                        {activeFilterCount > 0 && (
                                            <button onClick={() => { setFilterCurso(''); setFilterReason(''); setFilterParticipants(''); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Limpiar</button>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-2">Curso</label>
                                            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                                                {CURSOS.map(c => (
                                                    <button key={c} onClick={() => setFilterCurso(filterCurso === c ? '' : c)}
                                                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${filterCurso === c ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                                    >{c}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-2">Motivo</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {REASONS.map(r => (
                                                    <button key={r.value} onClick={() => setFilterReason(filterReason === r.value ? '' : r.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterReason === r.value ? `${r.color} ring-1 ring-current` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                                    >{r.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-2">Tipo</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {PARTICIPANTS_OPTIONS.map(p => (
                                                    <button key={p.value} onClick={() => setFilterParticipants(filterParticipants === p.value ? '' : p.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterParticipants === p.value ? `${p.color} ring-1 ring-current` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
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

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <p className="text-xs text-slate-400">{filteredEntrevistas.length} entrevista{filteredEntrevistas.length !== 1 ? 's' : ''}</p>
                    {filterCurso && (
                        <button onClick={() => setFilterCurso('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-medium hover:bg-indigo-200 transition-colors">
                            {filterCurso}<X className="w-3 h-3" />
                        </button>
                    )}
                    {filterReason && (
                        <button onClick={() => setFilterReason('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-medium hover:bg-indigo-200 transition-colors">
                            {getReasonConfig(filterReason).label}<X className="w-3 h-3" />
                        </button>
                    )}
                    {filterParticipants && (
                        <button onClick={() => setFilterParticipants('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-medium hover:bg-indigo-200 transition-colors">
                            {getParticipantsConfig(filterParticipants).short}<X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Entrevista cards */}
            <div className="space-y-3">
                {paginatedEntrevistas.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No se encontraron entrevistas</p>
                        <p className="text-xs text-slate-400 mt-1">Haz clic en "Nueva Entrevista" para registrar una</p>
                    </div>
                )}

                {paginatedEntrevistas.map(item => {
                    const reasonConf = getReasonConfig(item.reason);
                    const partConf = getParticipantsConfig(item.participants);
                    const PartIcon = partConf.icon;

                    return (
                        <div key={item.id} className={`bg-white rounded-2xl border ${reasonConf.border} overflow-hidden transition-all hover:shadow-md hover:shadow-slate-100`}>
                            <div className="p-5">
                                {/* Top row: type icon + student + date + actions */}
                                <div className="flex items-start gap-4">
                                    {/* Type icon */}
                                    <div className={`w-11 h-11 rounded-xl ${partConf.color} flex items-center justify-center shrink-0`}>
                                        <PartIcon className="w-5 h-5" />
                                    </div>

                                    {/* Main content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header line */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-slate-800">{item.studentName}</span>
                                            {item.studentCurso && (
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{item.studentCurso}</span>
                                            )}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${reasonConf.color}`}>{reasonConf.label}</span>
                                        </div>

                                        {/* Meta line */}
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.date)}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${partConf.color}`}>{partConf.short}</span>
                                            {item.parentName && item.participants === 'apoderado' && (
                                                <span>Apoderado: <span className="text-slate-600 font-medium">{item.parentName}</span></span>
                                            )}
                                        </div>

                                        {/* Detail */}
                                        {item.reasonDetail && (
                                            <p className="text-sm text-slate-700 mt-3">{item.reasonDetail}</p>
                                        )}

                                        {/* Summary & Commitments in a subtle grid */}
                                        {(item.summary || item.commitments) && (
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {item.summary && (
                                                    <div className="bg-slate-50 rounded-xl p-3">
                                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Resumen</p>
                                                        <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                                                    </div>
                                                )}
                                                {item.commitments && (
                                                    <div className="bg-indigo-50/50 rounded-xl p-3">
                                                        <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide mb-1">Compromisos</p>
                                                        <p className="text-xs text-slate-600 leading-relaxed">{item.commitments}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer: registered by */}
                                        {item.registeredBy?.name && (
                                            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
                                                <User className="w-3 h-3" />Registrado por {item.registeredBy.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => exportEntrevistaActaPDF({ entrevista: item })}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Descargar acta PDF"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        {userCanEdit && (
                                            <>
                                                <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            Anterior
                        </button>
                        <span className="text-sm text-slate-500 px-3">
                            Pagina <span className="font-semibold text-slate-700">{safePage}</span> de <span className="font-semibold text-slate-700">{totalPages}</span>
                        </span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
                        <button onClick={() => setDeleteConfirm(null)} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-all">Cancelar</button>
                        <button onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 text-white rounded-2xl font-extrabold px-8 py-3 shadow-xl hover:bg-red-700 transition-all">Eliminar</button>
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
                <button onClick={onClose} className="p-1.5 text-eyr-on-variant hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
                {/* Student search / selected */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Alumno *</label>
                    {selectedStudent ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                                {selectedStudent.fullName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm text-slate-800 block truncate">{selectedStudent.fullName}</span>
                                <span className="text-[11px] text-slate-400 font-mono">{selectedStudent.rut}</span>
                            </div>
                            {selectedStudent.curso && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full shrink-0">{selectedStudent.curso}</span>
                            )}
                            {!editing && (
                                <button onClick={() => { setSelectedStudent(null); setParentName(''); }} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
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
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                autoFocus
                            />
                            {filteredStudents.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-52 overflow-y-auto">
                                    {filteredStudents.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleSelectStudent(s)}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                                                {s.fullName?.charAt(0)}
                                            </div>
                                            <span className="text-sm text-slate-800 truncate flex-1">{s.fullName}</span>
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
                        <label className="block text-xs font-medium text-slate-500 mb-1">Fecha *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Motivo *</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                        >
                            <option value="">Seleccionar...</option>
                            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Participants: 2 cards */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de entrevista *</label>
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
                                        : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
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
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nombre apoderado *</label>
                        <input
                            type="text"
                            value={parentName}
                            onChange={e => setParentName(e.target.value)}
                            placeholder="Nombre del apoderado"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                        />
                    </div>
                )}

                {/* Reason detail */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Detalle del motivo</label>
                    <textarea value={reasonDetail} onChange={e => setReasonDetail(e.target.value)}
                        placeholder="Descripcion del motivo de la entrevista..." rows={2}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
                    />
                </div>

                {/* Summary */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Resumen de lo conversado</label>
                    <textarea value={summary} onChange={e => setSummary(e.target.value)}
                        placeholder="Resumen de los temas tratados..." rows={3}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
                    />
                </div>

                {/* Commitments */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Compromisos / Acuerdos</label>
                    <textarea value={commitments} onChange={e => setCommitments(e.target.value)}
                        placeholder="Compromisos acordados..." rows={2}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                <button onClick={onClose} className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-all">Cancelar</button>
                <button onClick={handleSubmit} disabled={!isValid || saving}
                    className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar'}
                </button>
            </div>
        </>
    );
}


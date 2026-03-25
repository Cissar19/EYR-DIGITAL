import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GraduationCap, Plus, Search, X, ChevronDown, ChevronUp, Trash2, Calendar, ArrowLeft, SlidersHorizontal, ClipboardList, BarChart3, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, canEdit, isManagement } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';
import CrearEvaluacionModal from './CrearEvaluacionModal';
import ResultadosGrid from './ResultadosGrid';
import ResumenOA from './ResumenOA';
import OAAssignmentPanel from './OAAssignmentPanel';

const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

const getAsignaturaName = (code) => ASIGNATURAS.find(a => a.code === code)?.name || code;

export default function UTPView() {
    const { user } = useAuth();
    const { evaluaciones, loading, addEvaluacion, deleteEvaluacion } = useEvaluaciones();
    const userCanEdit = canEdit(user);
    const userIsManagement = isManagement(user);

    // Teachers and utp_head can also create evaluations
    const canCreateEval = userCanEdit || user?.role === 'teacher' || user?.role === 'utp_head';

    // View mode: 'list' or 'detail'
    const [selectedEval, setSelectedEval] = useState(null);
    const [detailTab, setDetailTab] = useState('grid'); // 'grid' | 'resumen' | 'oas'

    // Filters
    const [search, setSearch] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    const [filterAsignatura, setFilterAsignatura] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const filtersRef = useRef(null);

    // Modal
    const [showCreate, setShowCreate] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Dashboard
    const [dashboardOpen, setDashboardOpen] = useState(true);

    useEffect(() => {
        const handler = (e) => {
            if (filtersRef.current && !filtersRef.current.contains(e.target)) setFiltersOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Filter evaluaciones: teachers see only theirs, management sees all
    const filteredEvaluaciones = useMemo(() => {
        let list = evaluaciones;

        // Teachers only see their own
        if (!userIsManagement) {
            list = list.filter(e => e.createdBy?.id === user?.uid);
        }

        if (search.trim()) {
            const norm = normalizeSearch(search);
            list = list.filter(e =>
                normalizeSearch(e.name).includes(norm) ||
                normalizeSearch(e.createdBy?.name).includes(norm)
            );
        }
        if (filterCurso) list = list.filter(e => e.curso === filterCurso);
        if (filterAsignatura) list = list.filter(e => e.asignatura === filterAsignatura);

        return list;
    }, [evaluaciones, user, userIsManagement, search, filterCurso, filterAsignatura]);

    // Group evaluaciones by curso+asignatura for card view
    const groupedEvaluaciones = useMemo(() => {
        const groups = {};
        filteredEvaluaciones.forEach(e => {
            const key = `${e.curso}|||${e.asignatura}`;
            if (!groups[key]) {
                groups[key] = { curso: e.curso, asignatura: e.asignatura, items: [] };
            }
            groups[key].items.push(e);
        });
        // Sort groups: by curso then asignatura
        return Object.values(groups).sort((a, b) => {
            const cursoCompare = a.curso.localeCompare(b.curso);
            if (cursoCompare !== 0) return cursoCompare;
            return getAsignaturaName(a.asignatura).localeCompare(getAsignaturaName(b.asignatura));
        });
    }, [filteredEvaluaciones]);

    // KPIs
    const kpis = useMemo(() => {
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const list = userIsManagement ? evaluaciones : evaluaciones.filter(e => e.createdBy?.id === user?.uid);

        const total = list.length;
        const thisMonth = list.filter(e => e.date?.startsWith(monthPrefix)).length;

        const byAsignatura = {};
        list.forEach(e => {
            byAsignatura[e.asignatura] = (byAsignatura[e.asignatura] || 0) + 1;
        });
        const topAsignaturas = Object.entries(byAsignatura)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([code, count]) => ({ name: getAsignaturaName(code), count }));

        // Average questions
        const avgQuestions = total > 0
            ? Math.round(list.reduce((sum, e) => sum + (e.totalQuestions || 0), 0) / total)
            : 0;

        return { total, thisMonth, topAsignaturas, avgQuestions };
    }, [evaluaciones, user, userIsManagement]);

    const activeFilterCount = [filterCurso, filterAsignatura].filter(Boolean).length;

    // If viewing detail, find the live version from evaluaciones
    const liveEval = selectedEval ? evaluaciones.find(e => e.id === selectedEval.id) || selectedEval : null;

    // Permission to delete: admin can delete any, teacher/utp_head can only delete their own
    const canDeleteEval = (item) => {
        if (userCanEdit) return true;
        if (canCreateEval && item.createdBy?.id === user?.uid) return true;
        return false;
    };

    const handleDelete = async (id) => {
        await deleteEvaluacion(id);
        setDeleteConfirm(null);
    };

    // ── Detail View ──
    if (liveEval) {
        return (
            <div className="space-y-6">
                {/* Back header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedEval(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-slate-800 truncate">{liveEval.name}</h1>
                        <p className="text-sm text-slate-500">
                            {getAsignaturaName(liveEval.asignatura)} — {liveEval.curso} — {formatDate(liveEval.date)} — {liveEval.totalQuestions} preguntas
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setDetailTab('grid')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            detailTab === 'grid'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <ClipboardList className="w-4 h-4" /> Resultados
                    </button>
                    <button
                        onClick={() => setDetailTab('resumen')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            detailTab === 'resumen'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" /> Resumen OA
                    </button>
                    <button
                        onClick={() => setDetailTab('oas')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            detailTab === 'oas'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" /> Asignar OAs
                    </button>
                </div>

                {detailTab === 'grid' ? (
                    <ResultadosGrid evaluacion={liveEval} />
                ) : detailTab === 'resumen' ? (
                    <ResumenOA evaluacion={liveEval} />
                ) : (
                    <OAAssignmentPanel evaluacion={liveEval} key={liveEval.id + '-' + liveEval.questions?.map(q => q.oaCode).join(',')} />
                )}
            </div>
        );
    }

    // ── List View (grouped cards) ──
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-slate-800">Evaluaciones UTP</h1>
                        <p className="text-sm text-slate-500">Evaluaciones por Objetivos de Aprendizaje</p>
                    </div>
                </div>
                {canCreateEval && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nueva</span> Evaluacion
                    </button>
                )}
            </div>

            {/* KPIs */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button onClick={() => setDashboardOpen(v => !v)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <span className="font-semibold text-slate-700 text-sm">Resumen</span>
                    {dashboardOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                <AnimatePresence>
                    {dashboardOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-indigo-700">{kpis.total}</p>
                                    <p className="text-[11px] text-indigo-500 font-medium">Total</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-700">{kpis.thisMonth}</p>
                                    <p className="text-[11px] text-blue-500 font-medium">Este Mes</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-700">{kpis.avgQuestions}</p>
                                    <p className="text-[11px] text-purple-500 font-medium">Preguntas Prom.</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3">
                                    <p className="text-[11px] text-emerald-600 font-medium mb-1">Top Asignaturas</p>
                                    {kpis.topAsignaturas.length === 0 && <p className="text-xs text-slate-400">Sin datos</p>}
                                    {kpis.topAsignaturas.map(a => (
                                        <p key={a.name} className="text-xs text-emerald-700 truncate">{a.name}: <span className="font-bold">{a.count}</span></p>
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
                            placeholder="Buscar evaluacion..."
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
                                            <button onClick={() => { setFilterCurso(''); setFilterAsignatura(''); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Limpiar</button>
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
                                            <label className="block text-xs font-medium text-slate-500 mb-2">Asignatura</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ASIGNATURAS.map(a => (
                                                    <button key={a.code} onClick={() => setFilterAsignatura(filterAsignatura === a.code ? '' : a.code)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterAsignatura === a.code ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                                    >{a.name}</button>
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
                    <p className="text-xs text-slate-400">{filteredEvaluaciones.length} evaluacion{filteredEvaluaciones.length !== 1 ? 'es' : ''}</p>
                    {filterCurso && (
                        <button onClick={() => setFilterCurso('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-medium hover:bg-indigo-200 transition-colors">
                            {filterCurso}<X className="w-3 h-3" />
                        </button>
                    )}
                    {filterAsignatura && (
                        <button onClick={() => setFilterAsignatura('')} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-medium hover:bg-indigo-200 transition-colors">
                            {getAsignaturaName(filterAsignatura)}<X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Evaluaciones grouped by curso+asignatura */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <p className="text-slate-400">Cargando evaluaciones...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedEvaluaciones.length === 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No se encontraron evaluaciones</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {canCreateEval ? 'Haz clic en "Nueva Evaluacion" para crear una' : 'Aun no tienes evaluaciones registradas'}
                            </p>
                        </div>
                    )}

                    {groupedEvaluaciones.map(group => (
                        <div key={`${group.curso}-${group.asignatura}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {/* Card header */}
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">{group.curso}</span>
                                    <span className="font-semibold text-sm text-slate-700">{getAsignaturaName(group.asignatura)}</span>
                                </div>
                                <span className="text-xs text-slate-400">{group.items.length} evaluacion{group.items.length !== 1 ? 'es' : ''}</span>
                            </div>

                            {/* Evaluaciones list inside card */}
                            <div className="divide-y divide-slate-100">
                                {group.items.map(item => {
                                    const answeredCount = Object.keys(item.results || {}).length;

                                    return (
                                        <div
                                            key={item.id}
                                            className="px-5 py-3 hover:bg-slate-50/50 transition-colors cursor-pointer flex items-center gap-4"
                                            onClick={() => { setSelectedEval(item); setDetailTab('grid'); }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-sm text-slate-800">{item.name}</span>
                                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.date)}</span>
                                                    <span>{item.totalQuestions} preg.</span>
                                                    <span>{answeredCount} alumno{answeredCount !== 1 ? 's' : ''}</span>
                                                </div>
                                                {item.createdBy?.name && (
                                                    <p className="text-[11px] text-slate-400 mt-1">Por {item.createdBy.name}</p>
                                                )}
                                            </div>

                                            {/* Delete button */}
                                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                {canDeleteEval(item) && (
                                                    <button
                                                        onClick={() => setDeleteConfirm(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <CrearEvaluacionModal
                        onClose={() => setShowCreate(false)}
                        onSave={async (data) => {
                            const ok = await addEvaluacion(data);
                            if (ok) setShowCreate(false);
                        }}
                        user={user}
                    />
                )}
            </AnimatePresence>

            {/* Delete confirm */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()} className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                            <h3 className="font-bold text-slate-800 mb-2">Eliminar evaluacion</h3>
                            <p className="text-sm text-slate-500 mb-5">Se eliminaran todos los resultados asociados. Esta accion no se puede deshacer.</p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors">Eliminar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

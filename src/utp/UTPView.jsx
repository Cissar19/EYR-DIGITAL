import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus, Search, X, ChevronDown, ChevronUp, Trash2, Calendar, ArrowLeft, SlidersHorizontal, ClipboardList, BarChart3, BookOpen, TrendingUp, ListChecks, ExternalLink, CheckCircle2, XCircle, Clock, Send, ShieldCheck, MessageSquare, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, canEdit, isManagement } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';
import CrearEvaluacionModal from './CrearEvaluacionModal';
import ResultadosGrid from './ResultadosGrid';
import ResumenOA from './ResumenOA';
import OAAssignmentPanel from './OAAssignmentPanel';
import IndicadoresSelectionPanel from './IndicadoresSelectionPanel';

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
    const { evaluaciones, loading, addEvaluacion, deleteEvaluacion, approveEvaluacion, rejectEvaluacion, resubmitEvaluacion } = useEvaluaciones();
    const userCanEdit = canEdit(user);
    const userIsManagement = isManagement(user);

    // Teachers and utp_head can also create evaluations
    const canCreateEval = userCanEdit || user?.role === 'teacher' || user?.role === 'utp_head';

    // Who can approve: utp_head, super_admin, admin
    const userCanApprove = userCanEdit || user?.role === 'utp_head';

    // View mode: 'list' or 'detail'
    const [selectedEval, setSelectedEval] = useState(null);
    const [detailTab, setDetailTab] = useState('grid'); // 'grid' | 'resumen' | 'oas' | 'indicadores'

    // Filters
    const [search, setSearch] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    const [filterAsignatura, setFilterAsignatura] = useState('');

    // Modal
    const [showCreate, setShowCreate] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Reject modal
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // Dashboard
    const [dashboardOpen, setDashboardOpen] = useState(true);

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

    const approverInfo = { id: user?.uid, name: user?.displayName || user?.name || '' };

    const handleApprove = async (id) => {
        await approveEvaluacion(id, approverInfo);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        await rejectEvaluacion(rejectTarget, rejectReason.trim(), approverInfo);
        setRejectTarget(null);
        setRejectReason('');
    };

    const handleResubmit = async (id) => {
        await resubmitEvaluacion(id);
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        if (status === 'approved') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Aprobada
            </span>
        );
        if (status === 'rejected') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
                <XCircle className="w-3 h-3" /> Rechazada
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                <Clock className="w-3 h-3" /> Pendiente
            </span>
        );
    };

    // Pending evaluaciones for approvers
    const pendingEvaluaciones = useMemo(() => {
        if (!userCanApprove) return [];
        return evaluaciones.filter(e => e.status === 'pending' || !e.status);
    }, [evaluaciones, userCanApprove]);

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
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-800 truncate">{liveEval.name}</h1>
                            <StatusBadge status={liveEval.status || 'pending'} />
                        </div>
                        <p className="text-sm text-slate-500">
                            {getAsignaturaName(liveEval.asignatura)} — {liveEval.curso} — {formatDate(liveEval.date)} — {liveEval.totalQuestions} preguntas
                            {liveEval.driveLink && (
                                <>
                                    {' — '}
                                    <a href={liveEval.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                                        Ver prueba <ExternalLink className="w-3 h-3" />
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                    {/* Approve/Reject buttons for approvers */}
                    {userCanApprove && (liveEval.status === 'pending' || !liveEval.status) && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => handleApprove(liveEval.id)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Aprobar
                            </button>
                            <button
                                onClick={() => { setRejectTarget(liveEval.id); setRejectReason(''); }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                <XCircle className="w-4 h-4" /> Rechazar
                            </button>
                        </div>
                    )}
                </div>

                {/* Status banners */}
                {(liveEval.status === 'pending' || !liveEval.status) && !userCanApprove && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-sm text-amber-700">Esta evaluacion esta pendiente de aprobacion por UTP. No puedes ingresar resultados hasta que sea aprobada.</p>
                    </div>
                )}

                {liveEval.status === 'rejected' && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-700">Evaluacion rechazada</p>
                            {liveEval.rejectionReason && (
                                <p className="text-sm text-red-600 mt-0.5">Motivo: {liveEval.rejectionReason}</p>
                            )}
                        </div>
                        {liveEval.createdBy?.id === user?.uid && (
                            <button
                                onClick={() => handleResubmit(liveEval.id)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shrink-0"
                            >
                                <Send className="w-4 h-4" /> Reenviar
                            </button>
                        )}
                    </div>
                )}

                {liveEval.status === 'approved' && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <p className="text-sm text-emerald-700">
                            Aprobada{liveEval.approvedBy?.name ? ` por ${liveEval.approvedBy.name}` : ''}
                        </p>
                    </div>
                )}

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
                    <button
                        onClick={() => setDetailTab('indicadores')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            detailTab === 'indicadores'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <ListChecks className="w-4 h-4" /> Indicadores
                    </button>
                </div>

                {detailTab === 'grid' ? (
                    <ResultadosGrid evaluacion={liveEval} />
                ) : detailTab === 'resumen' ? (
                    <ResumenOA evaluacion={liveEval} />
                ) : detailTab === 'indicadores' ? (
                    <IndicadoresSelectionPanel evaluacion={liveEval} key={liveEval.id + '-indicadores-' + liveEval.questions?.map(q => q.oaCode).join(',')} />
                ) : (
                    <OAAssignmentPanel evaluacion={liveEval} key={liveEval.id + '-' + liveEval.questions?.map(q => q.oaCode).join(',')} />
                )}
            </div>
        );
    }

    // ── List View ──
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Evaluaciones UTP</h1>
                </div>
                {canCreateEval && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-sm text-sm font-semibold shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Nueva Evaluacion
                    </button>
                )}
            </div>

            {/* Bento KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#e0e7ff] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Acumulado</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-indigo-900">{kpis.total}</p>
                        <p className="text-indigo-700 font-semibold">Total Evaluaciones</p>
                    </div>
                </div>
                <div className="bg-[#e0f2fe] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <Calendar className="w-5 h-5 text-sky-600" />
                        </div>
                        <span className="text-xs font-bold text-sky-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Reciente</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-sky-900">{kpis.thisMonth}</p>
                        <p className="text-sky-700 font-semibold">Este Mes</p>
                    </div>
                </div>
                <div className="bg-[#f5f3ff] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <ClipboardList className="w-5 h-5 text-violet-600" />
                        </div>
                        <span className="text-xs font-bold text-violet-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Promedio</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-violet-900">{kpis.avgQuestions}</p>
                        <p className="text-violet-700 font-semibold">Preguntas Prom.</p>
                    </div>
                </div>
                <div className="bg-[#f0fdf4] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Destacado</span>
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-emerald-900 truncate">
                            {kpis.topAsignaturas[0]?.name || '—'}
                        </p>
                        <p className="text-emerald-700 font-semibold">Top Asignaturas</p>
                    </div>
                </div>
            </div>

            {/* Pending review banner */}
            {!loading && userCanApprove && pendingEvaluaciones.length > 0 && (
                <div className="bg-[#fffbeb] rounded-3xl p-6 overflow-hidden relative shadow-sm">
                    <div className="absolute right-0 top-0 opacity-10 select-none pointer-events-none">
                        <MessageSquare className="w-[120px] h-[120px] text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                        <h2 className="text-lg font-bold text-amber-900">Pendientes de revisión ({pendingEvaluaciones.length})</h2>
                    </div>
                    <div className="space-y-3">
                        {pendingEvaluaciones.map(item => (
                            <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border border-amber-200/50">
                                <div
                                    className="flex items-center gap-4 cursor-pointer"
                                    onClick={() => { setSelectedEval(item); setDetailTab('grid'); }}
                                >
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold text-xl shrink-0">
                                        {item.totalQuestions}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <GraduationCap className="w-3.5 h-3.5" />{item.curso}
                                            </span>
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <BookOpen className="w-3.5 h-3.5" />{getAsignaturaName(item.asignatura)}
                                            </span>
                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />{formatDate(item.date)}
                                            </span>
                                            {item.createdBy?.name && (
                                                <span className="text-sm text-slate-500 italic">Por {item.createdBy.name}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleApprove(item.id)}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-emerald-700 bg-[#f0fdf4] hover:bg-emerald-100 transition-all border border-emerald-200"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                                    </button>
                                    <button
                                        onClick={() => { setRejectTarget(item.id); setRejectReason(''); }}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-rose-700 bg-[#fef2f2] hover:bg-rose-100 transition-all border border-rose-200"
                                    >
                                        <XCircle className="w-4 h-4" /> Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Historial de Evaluaciones */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Historial de Evaluaciones</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar evaluacion..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-3 py-2 bg-white border border-slate-200/20 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none w-48 transition-all"
                            />
                        </div>
                        <select
                            value={filterCurso}
                            onChange={e => setFilterCurso(e.target.value)}
                            className={`py-2 pl-3 pr-8 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all appearance-none bg-no-repeat cursor-pointer ${filterCurso ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200/20 bg-white text-slate-600'}`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center' }}
                        >
                            <option value="">Todos los cursos</option>
                            {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={filterAsignatura}
                            onChange={e => setFilterAsignatura(e.target.value)}
                            className={`py-2 pl-3 pr-8 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all appearance-none bg-no-repeat cursor-pointer ${filterAsignatura ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200/20 bg-white text-slate-600'}`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center' }}
                        >
                            <option value="">Todas las asignaturas</option>
                            {ASIGNATURAS.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100/5">
                        <p className="text-slate-400">Cargando evaluaciones...</p>
                    </div>
                ) : filteredEvaluaciones.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100/5 p-12 text-center shadow-sm">
                        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No se encontraron evaluaciones</p>
                        <p className="text-xs text-slate-400 mt-1">
                            {canCreateEval ? 'Haz clic en "Nueva Evaluacion" para crear una' : 'Aun no tienes evaluaciones registradas'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-100/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asignatura / Nivel</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Preguntas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Alumnos</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/5">
                                {filteredEvaluaciones
                                    .slice()
                                    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                                    .map(item => {
                                        const answeredCount = Object.keys(item.results || {}).length;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                onClick={() => { setSelectedEval(item); setDetailTab('grid'); }}
                                            >
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={item.status || 'pending'} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">{item.name}</span>
                                                        <span className="text-xs text-slate-500 mt-0.5">{getAsignaturaName(item.asignatura)} · {item.curso}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{formatDate(item.date)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-sm font-bold text-slate-700">{item.totalQuestions}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 text-sm font-medium text-slate-600">
                                                        <Users className="w-4 h-4 text-slate-400" />
                                                        {answeredCount}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    {canDeleteEval(item) && (
                                                        <button
                                                            onClick={() => setDeleteConfirm(item.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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

            {/* Reject modal */}
            <AnimatePresence>
                {rejectTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setRejectTarget(null)}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()} className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                            <h3 className="font-bold text-slate-800 mb-2">Rechazar evaluacion</h3>
                            <p className="text-sm text-slate-500 mb-3">Indica el motivo del rechazo para que el profesor pueda corregir.</p>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Motivo del rechazo..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-3 justify-end mt-4">
                                <button onClick={() => setRejectTarget(null)} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim()}
                                    className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Rechazar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

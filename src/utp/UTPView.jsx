import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus, Search, X, ChevronDown, ChevronUp, Trash2, Calendar, ArrowLeft, SlidersHorizontal, ClipboardList, BarChart3, BookOpen, TrendingUp, ListChecks, ExternalLink, CheckCircle2, XCircle, Clock, Send, ShieldCheck, MessageSquare, Users, FileQuestion, FileText, Loader2, ScanEye, Copy, Table2, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, canEdit, isManagement } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { ASIGNATURAS, CURSOS } from '../data/objetivosAprendizaje';
import { toast } from 'sonner';
import { exportarConFormato } from '../lib/templateExport';
import { DEFAULT_FORMAT_BLOCKS } from './formatoConfig';
import { fetchCollection } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import CrearEvaluacionModal from './CrearEvaluacionModal';
import ModalContainer from '../components/ModalContainer';
import ResultadosGrid from './ResultadosGrid';
import ResumenOA from './ResumenOA';
import OAAssignmentPanel from './OAAssignmentPanel';
import IndicadoresSelectionPanel from './IndicadoresSelectionPanel';
import PreguntasPanel from './PreguntasPanel';
import VistaPrevia from './VistaPrevia';
import TablaEspecificaciones from './TablaEspecificaciones';
import CoberturaOA from './CoberturaOA';
import ComentariosPanel from './ComentariosPanel';

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
    const { evaluaciones, loading, deleteEvaluacion, duplicateEvaluacion, approveEvaluacion, rejectEvaluacion, resubmitEvaluacion, updateEvaluacion } = useEvaluaciones();
    const userCanEdit = canEdit(user);
    const userIsManagement = isManagement(user);

    // Teachers and utp_head can also create evaluations
    const canCreateEval = userCanEdit || user?.role === 'teacher' || user?.role === 'utp_head';

    // Who can approve: utp_head, super_admin, admin
    const userCanApprove = userCanEdit || user?.role === 'utp_head';

    // View mode: 'list' | 'detail'
    const [viewMode, setViewMode] = useState('list');
    const [selectedEval, setSelectedEval] = useState(null);
    const [detailTab, setDetailTab] = useState('preguntas'); // 'preguntas' | 'oas' | 'indicadores' | 'grid' | 'resumen'

    // Filters
    const [search, setSearch] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    const [filterAsignatura, setFilterAsignatura] = useState('');

    // Modal
    const [showCreate, setShowCreate] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Navegación post-creación manual: espera a que la eval aparezca en el store
    const [pendingNavEvalId, setPendingNavEvalId] = useState(null);
    React.useEffect(() => {
        if (!pendingNavEvalId) return;
        const found = evaluaciones.find(e => e.id === pendingNavEvalId);
        if (found) {
            setSelectedEval(found);
            setDetailTab('preguntas');
            setPendingNavEvalId(null);
        }
    }, [evaluaciones, pendingNavEvalId]);

    // Reject modal
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

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

    // Exigencia + OA inline editing
    const [evalExigencia, setEvalExigencia] = React.useState('');
    const [evalOA, setEvalOA] = React.useState('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        if (liveEval) {
            setEvalExigencia(liveEval.exigencia ?? 60);
            setEvalOA(liveEval.oa ?? '');
        }
    }, [liveEval?.id]); // intentional: only reset when switching evals, not on every update

    const handleSaveExigencia = async () => {
        if (!liveEval) return;
        const val = evalExigencia !== '' ? Number(evalExigencia) : null;
        if (val === (liveEval.exigencia ?? null)) return;
        await updateEvaluacion(liveEval.id, { exigencia: val });
    };
    const handleSaveOA = async () => {
        if (!liveEval) return;
        if (evalOA === (liveEval.oa ?? '')) return;
        await updateEvaluacion(liveEval.id, { oa: evalOA });
    };

    // Google Docs generation
    const [generatingDocs, setGeneratingDocs] = useState(false);

    const [formatos, setFormatos]         = useState([]);
    const [selectedFormatoId, setSelectedFormatoId] = useState('__default__');

    React.useEffect(() => {
        fetchCollection('formatos_prueba', orderBy('updatedAt', 'desc'))
            .then(setFormatos)
            .catch(() => {});
    }, []);

    const handleGenerarDocs = async () => {
        if (!liveEval) return;
        setGeneratingDocs(true);
        try {
            const formato = selectedFormatoId !== '__default__'
                ? formatos.find(f => f.id === selectedFormatoId)
                : formatos[0];
            await exportarConFormato({ bloques: formato?.bloques ?? DEFAULT_FORMAT_BLOCKS, evaluacion: liveEval });
        } catch (err) {
            toast.error('No se pudo generar el archivo: ' + err.message);
        } finally {
            setGeneratingDocs(false);
        }
    };

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

    const handleDuplicate = async (id) => {
        const userInfo = { id: user?.uid, name: user?.displayName || user?.name || '' };
        const newId = await duplicateEvaluacion(id, userInfo);
        if (newId) setPendingNavEvalId(newId);
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#53ddfc]/20 text-[#004b58]">
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
                        className="p-2 text-eyr-on-variant hover:text-eyr-on-surface hover:bg-eyr-surface-high rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-eyr-on-surface font-headline truncate">{liveEval.name}</h1>
                            <StatusBadge status={liveEval.status || 'pending'} />
                        </div>
                        <p className="text-sm text-eyr-on-variant">
                            {getAsignaturaName(liveEval.asignatura)} — {liveEval.curso} — {formatDate(liveEval.date)} — {liveEval.totalQuestions} preguntas
                            {liveEval.driveLink && (
                                <>
                                    {' — '}
                                    <a href={liveEval.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-eyr-primary hover:text-eyr-primary-dim font-medium">
                                        Ver prueba <ExternalLink className="w-3 h-3" />
                                    </a>
                                </>
                            )}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                            <label className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">Exigencia:</span>
                                <div className="flex items-center gap-0.5">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={evalExigencia}
                                        onChange={e => setEvalExigencia(e.target.value)}
                                        onBlur={handleSaveExigencia}
                                        placeholder="60"
                                        className="w-14 px-1.5 py-0.5 border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 rounded-lg text-xs text-center outline-none bg-transparent hover:bg-white focus:bg-white transition-all"
                                    />
                                    <span className="text-xs text-slate-400">%</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                                <span className="text-xs text-slate-500 shrink-0">OA:</span>
                                <input
                                    type="text"
                                    value={evalOA}
                                    onChange={e => setEvalOA(e.target.value)}
                                    onBlur={handleSaveOA}
                                    placeholder="Objetivo de aprendizaje trabajado…"
                                    className="flex-1 min-w-0 px-1.5 py-0.5 border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 rounded-lg text-xs outline-none bg-transparent hover:bg-white focus:bg-white transition-all"
                                />
                            </label>
                        </div>
                        {liveEval.questions?.some(q => q.enunciado) && (
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                            {formatos.length > 1 && (
                                <select
                                    value={selectedFormatoId}
                                    onChange={e => setSelectedFormatoId(e.target.value)}
                                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 bg-white focus:ring-2 focus:ring-violet-200 outline-none">
                                    <option value="__default__">{formatos[0]?.nombre || 'Formato por defecto'}</option>
                                    {formatos.slice(1).map(f => (
                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={handleGenerarDocs}
                                disabled={generatingDocs}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-eyr-primary hover:text-eyr-primary-dim disabled:opacity-50 transition-colors"
                            >
                                {generatingDocs
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando…</>
                                    : <><FileText className="w-3.5 h-3.5" /> Descargar prueba (.docx)</>
                                }
                            </button>
                            </div>
                        )}
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
                <div className="flex gap-1 bg-eyr-surface-high rounded-xl p-1 w-fit flex-wrap">
                    {[
                        { id: 'preguntas',   icon: FileQuestion,  label: 'Preguntas' },
                        { id: 'oas',         icon: BookOpen,      label: 'Asignar OAs' },
                        { id: 'indicadores', icon: ListChecks,    label: 'Indicadores' },
                        { id: 'preview',     icon: ScanEye,       label: 'Vista previa' },
                        { id: 'grid',        icon: ClipboardList, label: 'Resultados' },
                        { id: 'resumen',     icon: BarChart3,     label: 'Resumen OA' },
                        { id: 'tabla',       icon: Table2,        label: 'Tabla espec.' },
                        { id: 'comentarios', icon: MessageSquare, label: 'Comentarios' },
                    ].map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setDetailTab(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                detailTab === id
                                    ? 'bg-white text-eyr-on-surface shadow-sm'
                                    : 'text-eyr-on-variant hover:text-eyr-on-surface'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>

                {detailTab === 'grid' ? (
                    <ResultadosGrid evaluacion={liveEval} />
                ) : detailTab === 'preguntas' ? (
                    <PreguntasPanel evaluacion={liveEval} />
                ) : detailTab === 'resumen' ? (
                    <ResumenOA evaluacion={liveEval} />
                ) : detailTab === 'indicadores' ? (
                    <IndicadoresSelectionPanel evaluacion={liveEval} key={liveEval.id + '-indicadores-' + liveEval.questions?.map(q => q.oaCode).join(',')} />
                ) : detailTab === 'preview' ? (
                    <VistaPrevia evaluacion={liveEval} />
                ) : detailTab === 'tabla' ? (
                    <TablaEspecificaciones evaluacion={liveEval} />
                ) : detailTab === 'comentarios' ? (
                    <ComentariosPanel evaluacion={liveEval} />
                ) : (
                    <OAAssignmentPanel evaluacion={liveEval} key={liveEval.id + '-' + liveEval.questions?.map(q => q.oaCode).join(',')} />
                )}
            </div>
        );
    }

    // ── Cobertura View ──
    if (viewMode === 'cobertura') {
        return <CoberturaOA onBack={() => setViewMode('list')} />;
    }

    // ── List View ──
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-eyr-primary-container/40 rounded-xl shrink-0">
                        <GraduationCap className="w-6 h-6 text-eyr-primary" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-eyr-on-surface font-headline">Evaluaciones UTP</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setViewMode('cobertura')}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-eyr-outline-variant/20 bg-eyr-surface-low text-eyr-on-variant hover:bg-eyr-surface-high text-sm font-semibold transition-all"
                    >
                        <Map className="w-4 h-4" /> Cobertura OA
                    </button>
                    {canCreateEval && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 bg-eyr-primary text-white px-5 py-3 rounded-xl hover:bg-eyr-primary-dim transition-all shadow-sm text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" /> Nueva Evaluación
                        </button>
                    )}
                </div>
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
                                    onClick={() => { setSelectedEval(item); setDetailTab('preguntas'); }}
                                >
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold text-xl shrink-0">
                                        {item.totalQuestions}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-eyr-on-surface">{item.name}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <span className="text-sm text-eyr-on-variant flex items-center gap-1">
                                                <GraduationCap className="w-3.5 h-3.5" />{item.curso}
                                            </span>
                                            <span className="text-sm text-eyr-on-variant flex items-center gap-1">
                                                <BookOpen className="w-3.5 h-3.5" />{getAsignaturaName(item.asignatura)}
                                            </span>
                                            <span className="text-sm text-eyr-on-variant flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />{formatDate(item.date)}
                                            </span>
                                            {item.createdBy?.name && (
                                                <span className="text-sm text-eyr-on-variant italic">Por {item.createdBy.name}</span>
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
                    <h2 className="text-xl font-bold text-eyr-on-surface font-headline">Historial de Evaluaciones</h2>
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            showFilters || filterCurso || filterAsignatura || search
                                ? 'border-eyr-primary/30 bg-eyr-surface-mid text-eyr-primary'
                                : 'border-eyr-outline-variant/20 bg-eyr-surface-low text-eyr-on-variant hover:bg-eyr-surface-high'
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtros Avanzados
                        {(filterCurso || filterAsignatura || search) && (
                            <span className="w-2 h-2 bg-eyr-primary rounded-full" />
                        )}
                    </button>
                </div>

                {/* Panel de filtros colapsable */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-wrap gap-3 p-4 bg-eyr-surface-low rounded-2xl border border-eyr-outline-variant/20"
                        >
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eyr-on-variant" />
                                <input
                                    type="text"
                                    placeholder="Buscar evaluación..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-eyr-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-eyr-primary/20 focus:border-eyr-primary outline-none transition-all text-eyr-on-surface placeholder:text-eyr-on-variant"
                                />
                            </div>
                            <select
                                value={filterCurso}
                                onChange={e => setFilterCurso(e.target.value)}
                                className={`py-2 pl-3 pr-8 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-eyr-primary/20 transition-all appearance-none bg-no-repeat cursor-pointer ${
                                    filterCurso
                                        ? 'border-eyr-primary/30 bg-eyr-surface-mid text-eyr-primary'
                                        : 'border-eyr-outline-variant/20 bg-white text-eyr-on-variant'
                                }`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23635984' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center' }}
                            >
                                <option value="">Todos los cursos</option>
                                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select
                                value={filterAsignatura}
                                onChange={e => setFilterAsignatura(e.target.value)}
                                className={`py-2 pl-3 pr-8 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-eyr-primary/20 transition-all appearance-none bg-no-repeat cursor-pointer ${
                                    filterAsignatura
                                        ? 'border-eyr-primary/30 bg-eyr-surface-mid text-eyr-primary'
                                        : 'border-eyr-outline-variant/20 bg-white text-eyr-on-variant'
                                }`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23635984' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center' }}
                            >
                                <option value="">Todas las asignaturas</option>
                                {ASIGNATURAS.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                            </select>
                            {(filterCurso || filterAsignatura || search) && (
                                <button
                                    onClick={() => { setFilterCurso(''); setFilterAsignatura(''); setSearch(''); }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-eyr-on-variant hover:text-eyr-on-surface transition-colors rounded-xl hover:bg-eyr-surface-high"
                                >
                                    <X className="w-3.5 h-3.5" /> Limpiar
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-eyr-outline-variant/5">
                        <p className="text-eyr-on-variant">Cargando evaluaciones...</p>
                    </div>
                ) : filteredEvaluaciones.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-eyr-outline-variant/5 p-12 text-center shadow-sm">
                        <GraduationCap className="w-10 h-10 text-eyr-outline-variant mx-auto mb-3" />
                        <p className="text-eyr-on-variant font-medium">No se encontraron evaluaciones</p>
                        <p className="text-xs text-eyr-on-variant/70 mt-1">
                            {canCreateEval ? 'Haz clic en "Nueva Evaluación" para crear una' : 'Aún no tienes evaluaciones registradas'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden bg-white rounded-3xl shadow-sm border border-eyr-outline-variant/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-eyr-surface-high/50">
                                    <th className="px-6 py-4 text-xs font-bold text-eyr-on-variant uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eyr-on-variant uppercase tracking-wider">Asignatura / Nivel</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eyr-on-variant uppercase tracking-wider text-center">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eyr-on-variant uppercase tracking-wider text-center">Preguntas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eyr-on-variant uppercase tracking-wider text-center">Alumnos</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eyr-on-variant uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-eyr-outline-variant/10">
                                {filteredEvaluaciones
                                    .slice()
                                    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                                    .map(item => {
                                        const answeredCount = Object.keys(item.results || {}).length;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-eyr-surface-low/50 transition-colors cursor-pointer group"
                                                onClick={() => { setSelectedEval(item); setDetailTab('preguntas'); }}
                                            >
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={item.status || 'pending'} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-eyr-on-surface">{item.name}</span>
                                                        <span className="text-xs text-eyr-on-variant mt-0.5">{getAsignaturaName(item.asignatura)} · {item.curso}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-medium text-eyr-on-variant">{formatDate(item.date)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-eyr-surface-highest px-3 py-1 rounded-lg text-sm font-bold text-eyr-on-surface">{item.totalQuestions}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 text-sm font-medium text-eyr-on-variant">
                                                        <Users className="w-4 h-4 text-eyr-outline" />
                                                        {answeredCount}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canCreateEval && (
                                                            <button
                                                                onClick={() => handleDuplicate(item.id)}
                                                                title="Duplicar evaluación"
                                                                className="p-2 text-eyr-on-variant hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {canDeleteEval(item) && (
                                                            <button
                                                                onClick={() => setDeleteConfirm(item.id)}
                                                                className="p-2 text-eyr-on-variant hover:text-red-500 hover:bg-red-50/10 rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
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
                        onCreated={(evalId, isManual) => {
                            if (isManual) setPendingNavEvalId(evalId);
                        }}
                        user={user}
                    />
                )}
            </AnimatePresence>

            {/* Delete confirm */}
            <AnimatePresence>
                {deleteConfirm && (
                    <ModalContainer onClose={() => setDeleteConfirm(null)} maxWidth="max-w-sm">
                        <div className="px-8 pt-8 pb-4">
                            <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface mb-2">Eliminar evaluación</h3>
                            <p className="text-sm text-eyr-on-variant">Se eliminarán todos los resultados asociados. Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="p-6 bg-eyr-surface-mid flex justify-end gap-3 shrink-0">
                            <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-2xl font-bold text-eyr-on-variant hover:bg-eyr-surface-high transition-colors">Cancelar</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="px-5 py-2.5 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors">Eliminar</button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* Reject modal */}
            <AnimatePresence>
                {rejectTarget && (
                    <ModalContainer onClose={() => setRejectTarget(null)} maxWidth="max-w-sm">
                        <div className="px-8 pt-8 pb-4 space-y-3">
                            <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface">Rechazar evaluación</h3>
                            <p className="text-sm text-eyr-on-variant">Indica el motivo del rechazo para que el profesor pueda corregir.</p>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Motivo del rechazo..."
                                className="w-full px-4 py-3 rounded-2xl bg-eyr-surface-low border border-transparent focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none resize-none text-sm text-eyr-on-surface"
                                rows={3}
                                autoFocus
                            />
                        </div>
                        <div className="p-6 bg-eyr-surface-mid flex justify-end gap-3 shrink-0">
                            <button onClick={() => setRejectTarget(null)} className="px-5 py-2.5 rounded-2xl font-bold text-eyr-on-variant hover:bg-eyr-surface-high transition-colors">Cancelar</button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="px-5 py-2.5 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Rechazar
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>
        </div>
    );
}

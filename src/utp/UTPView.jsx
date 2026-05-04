import React, { useState, useMemo } from 'react';
import { GraduationCap, Plus, Search, X, ChevronDown, ChevronUp, Trash2, Calendar, ArrowLeft, SlidersHorizontal, ClipboardList, BarChart3, BookOpen, TrendingUp, ListChecks, ExternalLink, CheckCircle2, XCircle, Clock, Send, ShieldCheck, MessageSquare, Users, FileQuestion, FileText, Loader2, ScanEye, Copy, Table2, Map, ClipboardCheck } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
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
import PautaEspecificacion from './PautaEspecificacion';
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
        if (userCanEdit || user?.role === 'utp_head') return true;
        if (canCreateEval && item.createdBy?.id === user?.uid) return true;
        return false;
    };

    const handleDelete = (id) => {
        setDeleteConfirm(null);
        deleteEvaluacion(id);
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

    // ── Design tokens (del prototipo Editor Evaluacion UTP) ──
    const DT = {
        primary: '#7B5BE0', primaryDark: '#5028B8',
        pink: '#EC5BA1', coral: '#FF7A4D', amber: '#F4B400',
        mint: '#2BB673', sky: '#3B8FE5',
        bgSoft: '#F4F1FB', ink: '#2a1a3a', muted: '#7a6a8a',
        line: 'rgba(20,10,40,0.06)',
    };

    // ── Detail View ──
    if (liveEval) {
        const statusLabel = liveEval.status === 'approved' ? 'APROBADA'
            : liveEval.status === 'rejected' ? 'RECHAZADA' : 'PENDIENTE';
        const statusColors = liveEval.status === 'approved'
            ? { bg:'#D9F5E4', color:'#0F7B3F', dot:'#2BB673' }
            : liveEval.status === 'rejected'
            ? { bg:'#FFE4E4', color:'#B91C1C', dot:'#EF4444' }
            : { bg:'#FFF1C8', color:'#9A6A00', dot:'#F4B400' };

        return (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* Fila superior: volver + aprobar/rechazar */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button
                        onClick={() => setSelectedEval(null)}
                        style={{
                            display:'flex', alignItems:'center', justifyContent:'center',
                            width:34, height:34, borderRadius:10, border:`1.5px solid ${DT.line}`,
                            background:'white', color:DT.muted, cursor:'pointer', flexShrink:0,
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div style={{ flex:1 }} />
                    {userCanApprove && (liveEval.status === 'pending' || !liveEval.status) && (
                        <div style={{ display:'flex', gap:8 }}>
                            <button
                                onClick={() => handleApprove(liveEval.id)}
                                style={{
                                    display:'inline-flex', alignItems:'center', gap:6,
                                    padding:'8px 14px', borderRadius:10, border:'none',
                                    background:DT.mint, color:'white',
                                    fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                                }}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                            </button>
                            <button
                                onClick={() => { setRejectTarget(liveEval.id); setRejectReason(''); }}
                                style={{
                                    display:'inline-flex', alignItems:'center', gap:6,
                                    padding:'8px 14px', borderRadius:10, border:'none',
                                    background:'#EF4444', color:'white',
                                    fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                                }}
                            >
                                <XCircle className="w-3.5 h-3.5" /> Rechazar
                            </button>
                        </div>
                    )}
                </div>

                {/* Header card */}
                <div style={{
                    background:'white', borderRadius:18, padding:'18px 22px',
                    border:`1px solid ${DT.line}`,
                    boxShadow:'0 1px 3px rgba(40,20,80,0.04)',
                    display:'flex', alignItems:'center', gap:18, flexWrap:'wrap',
                }}>
                    <div style={{
                        width:54, height:54, borderRadius:14, flexShrink:0,
                        background:`linear-gradient(135deg, ${DT.primary}, ${DT.pink})`,
                        display:'flex', alignItems:'center', justifyContent:'center', color:'white',
                    }}>
                        <FileText className="w-6 h-6" />
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                            <h1 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:'-0.025em', color:DT.ink }}>{liveEval.name}</h1>
                            <span style={{
                                display:'inline-flex', alignItems:'center', gap:5,
                                padding:'4px 10px', borderRadius:8,
                                background:statusColors.bg, color:statusColors.color,
                                fontSize:11, fontWeight:600, letterSpacing:0.4,
                            }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:statusColors.dot }}/>
                                {statusLabel}
                            </span>
                        </div>
                        <div style={{ fontSize:13, color:DT.muted, fontWeight:600, display:'flex', flexWrap:'wrap', gap:'3px 12px' }}>
                            <span style={{ color:DT.ink, fontWeight:700 }}>{getAsignaturaName(liveEval.asignatura)}</span>
                            <span>·</span>
                            <span>{liveEval.curso}</span>
                            <span>·</span>
                            <span>{formatDate(liveEval.date)}</span>
                            <span>·</span>
                            <span>{liveEval.totalQuestions || 0} preguntas</span>
                            {liveEval.driveLink && (
                                <>
                                    <span>·</span>
                                    <a href={liveEval.driveLink} target="_blank" rel="noopener noreferrer"
                                        style={{ color:DT.primary, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                                        Ver prueba <ExternalLink className="w-3 h-3" />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Stat cards: Exigencia y OA (editables) */}
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        <div style={{
                            padding:'8px 14px', borderRadius:12,
                            background:`${DT.coral}10`, border:`1.5px solid ${DT.coral}25`,
                            minWidth:100,
                        }}>
                            <div style={{ fontSize:10, fontWeight:600, color:DT.coral, letterSpacing:0.4, textTransform:'uppercase', marginBottom:3 }}>Exigencia</div>
                            <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
                                <input
                                    type="number" min="0" max="100"
                                    value={evalExigencia}
                                    onChange={e => setEvalExigencia(e.target.value)}
                                    onBlur={handleSaveExigencia}
                                    placeholder="60"
                                    style={{
                                        width:40, border:'none', background:'transparent',
                                        fontSize:15, fontWeight:600, color:DT.ink,
                                        outline:'none', padding:0, fontFamily:'inherit',
                                        fontVariantNumeric:'tabular-nums',
                                    }}
                                />
                                <span style={{ fontSize:13, fontWeight:600, color:DT.muted }}>%</span>
                            </div>
                        </div>
                        <div style={{
                            padding:'8px 14px', borderRadius:12,
                            background:`${DT.primary}10`, border:`1.5px solid ${DT.primary}25`,
                            maxWidth:220,
                        }}>
                            <div style={{ fontSize:10, fontWeight:600, color:DT.primary, letterSpacing:0.4, textTransform:'uppercase', marginBottom:3 }}>OA</div>
                            <input
                                type="text"
                                value={evalOA}
                                onChange={e => setEvalOA(e.target.value)}
                                onBlur={handleSaveOA}
                                placeholder="Código OA…"
                                style={{
                                    width:'100%', border:'none', background:'transparent',
                                    fontSize:13, fontWeight:600, color:DT.ink,
                                    outline:'none', padding:0, fontFamily:'inherit',
                                }}
                            />
                        </div>
                        {/* Descargar .docx */}
                        {liveEval.questions?.some(q => q.enunciado) && (
                            <div style={{
                                padding:'8px 14px', borderRadius:12,
                                background:`${DT.mint}10`, border:`1.5px solid ${DT.mint}25`,
                                display:'flex', flexDirection:'column', gap:4,
                            }}>
                                <div style={{ fontSize:10, fontWeight:600, color:DT.mint, letterSpacing:0.4, textTransform:'uppercase' }}>Exportar</div>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    {formatos.length > 1 && (
                                        <select
                                            value={selectedFormatoId}
                                            onChange={e => setSelectedFormatoId(e.target.value)}
                                            style={{
                                                padding:'2px 6px', border:`1px solid ${DT.line}`,
                                                borderRadius:6, fontSize:11, color:DT.ink,
                                                background:'white', outline:'none', fontFamily:'inherit',
                                            }}>
                                            <option value="__default__">{formatos[0]?.nombre || 'Por defecto'}</option>
                                            {formatos.slice(1).map(f => (
                                                <option key={f.id} value={f.id}>{f.nombre}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        onClick={handleGenerarDocs}
                                        disabled={generatingDocs}
                                        style={{
                                            display:'inline-flex', alignItems:'center', gap:5,
                                            border:'none', background:'transparent',
                                            fontSize:12, fontWeight:700, color:DT.mint,
                                            cursor:'pointer', padding:0, fontFamily:'inherit',
                                            opacity: generatingDocs ? 0.6 : 1,
                                        }}
                                    >
                                        {generatingDocs
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando…</>
                                            : <><FileText className="w-3.5 h-3.5" /> .docx</>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status banners */}
                {(liveEval.status === 'pending' || !liveEval.status) && !userCanApprove && (
                    <div style={{
                        background:'linear-gradient(90deg, #FFF7E0, #FFF1C8)',
                        border:'1.5px solid #F4D26B', borderRadius:14,
                        padding:'14px 18px', display:'flex', alignItems:'center', gap:14,
                    }}>
                        <div style={{
                            width:36, height:36, borderRadius:10, flexShrink:0,
                            background:DT.amber, color:'white',
                            display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                            <Clock className="w-5 h-5" />
                        </div>
                        <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'#7a5400', marginBottom:2 }}>Pendiente de aprobación por UTP</div>
                            <div style={{ fontSize:12, color:'#9A6A00', fontWeight:500, lineHeight:1.4 }}>
                                Esta evaluación está pendiente de aprobación. No podrás ingresar resultados hasta que sea aprobada.
                            </div>
                        </div>
                    </div>
                )}

                {liveEval.status === 'rejected' && (
                    <div style={{
                        background:'#FFF5F5', border:'1.5px solid #FECACA', borderRadius:14,
                        padding:'14px 18px', display:'flex', alignItems:'center', gap:14,
                    }}>
                        <div style={{
                            width:36, height:36, borderRadius:10, flexShrink:0,
                            background:'#EF4444', color:'white',
                            display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                            <XCircle className="w-5 h-5" />
                        </div>
                        <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'#B91C1C', marginBottom:2 }}>Evaluación rechazada</div>
                            {liveEval.rejectionReason && (
                                <div style={{ fontSize:12, color:'#DC2626', fontWeight:500 }}>Motivo: {liveEval.rejectionReason}</div>
                            )}
                        </div>
                        {liveEval.createdBy?.id === user?.uid && (
                            <button
                                onClick={() => handleResubmit(liveEval.id)}
                                style={{
                                    display:'inline-flex', alignItems:'center', gap:6,
                                    padding:'8px 14px', borderRadius:10, border:'none',
                                    background:'#6366F1', color:'white',
                                    fontSize:12.5, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:'inherit',
                                }}
                            >
                                <Send className="w-3.5 h-3.5" /> Reenviar
                            </button>
                        )}
                    </div>
                )}

                {liveEval.status === 'approved' && (
                    <div style={{
                        background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:14,
                        padding:'12px 18px', display:'flex', alignItems:'center', gap:12,
                    }}>
                        <ShieldCheck className="w-5 h-5 shrink-0" style={{ color:DT.mint }} />
                        <span style={{ fontSize:13, fontWeight:600, color:'#166534' }}>
                            Aprobada{liveEval.approvedBy?.name ? ` por ${liveEval.approvedBy.name}` : ''}
                        </span>
                    </div>
                )}

                {/* TabsBar — estilo del diseño: contenedor con gradiente violeta/rosa */}
                <div style={{
                    background:`linear-gradient(135deg, ${DT.primary}10, ${DT.pink}10)`,
                    border:`1.5px solid ${DT.primary}20`,
                    borderRadius:16, padding:8,
                    display:'flex', flexWrap:'wrap', gap:4,
                }}>
                    {[
                        { id: 'preguntas',   Icon: FileQuestion,  label: 'Preguntas' },
                        { id: 'oas',         Icon: BookOpen,      label: 'Asignar OAs' },
                        { id: 'indicadores', Icon: ListChecks,    label: 'Indicadores' },
                        { id: 'preview',     Icon: ScanEye,       label: 'Vista previa' },
                        { id: 'grid',        Icon: ClipboardList, label: 'Resultados' },
                        { id: 'resumen',     Icon: BarChart3,     label: 'Resumen OA' },
                        { id: 'tabla',       Icon: Table2,        label: 'Tabla espec.' },
                        { id: 'pauta_esp',   Icon: ClipboardCheck,label: 'Pauta espec.' },
                        { id: 'comentarios', Icon: MessageSquare, label: 'Comentarios' },
                    ].map((tab) => {
                        const isActive = detailTab === tab.id;
                        const TabIcon = tab.Icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setDetailTab(tab.id)}
                                style={{
                                    display:'inline-flex', alignItems:'center', gap:7,
                                    padding:'9px 14px', borderRadius:11, border:'none',
                                    background: isActive ? 'white' : 'transparent',
                                    color: isActive ? DT.primaryDark : DT.muted,
                                    fontSize:13, fontWeight: isActive ? 700 : 600,
                                    cursor:'pointer', fontFamily:'inherit',
                                    boxShadow: isActive ? '0 4px 10px -4px rgba(80,40,184,0.25)' : 'none',
                                    transition:'all .15s',
                                }}
                            >
                                <TabIcon className="w-3.5 h-3.5" style={{ strokeWidth: isActive ? 2.4 : 2 }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Panel content */}
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
                ) : detailTab === 'pauta_esp' ? (
                    <PautaEspecificacion evaluacion={liveEval} />
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
                        <div className="flex flex-wrap gap-3 p-4 bg-eyr-surface-low rounded-2xl border border-eyr-outline-variant/20">
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
                        </div>
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

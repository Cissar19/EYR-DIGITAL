import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    CalendarDays, ChevronLeft, ChevronRight, Plus, Pin, X, BookOpen,
    Clock, User, Pencil, Trash2, CheckCircle, XCircle, AlertCircle,
    ChevronDown, FileDown, Loader2, NotebookPen, Table2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, canEdit, isAdmin } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import { useHolidays } from '../context/HolidaysContext';
import { useSchedule } from '../context/ScheduleContext';
import { useCourseSchedule } from '../context/CourseScheduleContext';
import { exportCalendarioPDF, exportAgendaMensualCardPDF, exportAgendaTabularPDF } from '../lib/pdfExport';
import { toast } from 'sonner';
import CrearEvaluacionModal from './CrearEvaluacionModal';
import { AgendaSemanalModal } from './AgendaSemanal';
import { CURSOS } from '../data/objetivosAprendizaje';

// ── Design tokens (idénticos al calendario desktop) ───────────────────────────
const PRIMARY      = '#1F6F6B';
const PRIMARY_2    = '#2A8C87';
const PRIMARY_SOFT = '#DCEDEB';
const ACCENT       = '#E96C4F';
const HONEY        = '#F0B341';
const INK          = '#1F2A2E';
const INK_2        = '#4A5560';
const INK_3        = '#8A95A0';
const LINE         = '#ECE3D2';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const ASIG_FULL = {
    MA:'Matemática', LE:'Lenguaje', CN:'Ciencias Naturales', HI:'Historia',
    IN:'Inglés', EF:'Ed. Física', AV:'Artes Visuales', MU:'Música',
    TE:'Tecnología', OR:'Orientación',
};

const SUB_COLORS = {
    MA:{ color:'#2F6FE0', soft:'#E0EAFB' }, LE:{ color:'#C84B5A', soft:'#F8DEE2' },
    CN:{ color:'#2E8B57', soft:'#DEEEE3' }, HI:{ color:'#B66A2C', soft:'#F4E0CC' },
    IN:{ color:'#6B4FB8', soft:'#E5DEF4' }, EF:{ color:'#D9762B', soft:'#F8E1CC' },
    AV:{ color:'#B83E8E', soft:'#F4D7E7' }, MU:{ color:'#7E3FAA', soft:'#EBDDF3' },
    TE:{ color:'#1F8A95', soft:'#D4ECEF' }, OR:{ color:'#4D8C42', soft:'#DEEBD9' },
};

function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const start    = new Date(firstDay);
    const dow      = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
    const end    = new Date(lastDay);
    const endDow = end.getDay();
    if (endDow === 0)      end.setDate(end.getDate() - 2);
    else if (endDow === 6) end.setDate(end.getDate() - 1);
    else if (endDow < 5)   end.setDate(end.getDate() + (5 - endDow));
    const weeks  = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        const week = [];
        for (let d = 0; d < 5; d++) {
            const day = new Date(cursor);
            day.setDate(cursor.getDate() + d);
            week.push({ dateStr: day.toISOString().slice(0, 10), inMonth: day.getMonth() === month && day.getFullYear() === year });
        }
        weeks.push(week);
        cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
}

// ── Bottom-sheet de detalle de evaluación ─────────────────────────────────────
function EvalDetailSheet({ ev, onClose, onEdit, onDelete, canCRUD, canEditEval, onApprove, onReject }) {
    const sc      = SUB_COLORS[ev.asignatura];
    const pending = ev.pendingChanges;
    const [confirmDelete, setConfirmDelete] = useState(false);

    const dateLabel = ev.date
        ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long' })
        : '—';

    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            className="cal-modal-overlay"
            style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(31,42,46,.32)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation:'calFadeIn .2s ease-out' }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="cal-modal-inner"
                style={{ background:'#fff', border:`1px solid ${LINE}`, boxShadow:'0 24px 60px -20px rgba(31,42,46,.22)', display:'flex', flexDirection:'column', overflow:'hidden' }}
            >
                <div className="cal-modal-pull" aria-hidden />
                <div style={{ height:5, flexShrink:0, background:`linear-gradient(90deg, ${sc?.color||PRIMARY}, ${ACCENT}, ${HONEY})` }} />

                {/* Cabecera */}
                <div className="cal-modal-head" style={{ padding:'18px 20px 14px', display:'flex', alignItems:'flex-start', gap:12, borderBottom:`1px solid ${LINE}`, flexShrink:0 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:sc?.soft||PRIMARY_SOFT, color:sc?.color||PRIMARY, display:'grid', placeItems:'center', flexShrink:0 }}>
                        <CalendarDays className="w-4 h-4" />
                    </div>
                    <div style={{ flex:1 }}>
                        <h2 style={{ fontSize:17, fontWeight:700, color:INK, margin:0, letterSpacing:'-0.2px' }}>{ev.name}</h2>
                        <p style={{ fontSize:12, color:INK_2, marginTop:2, textTransform:'capitalize' }}>{dateLabel}</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', color:INK_2, flexShrink:0 }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Cuerpo */}
                <div className="cal-modal-body" style={{ padding:'16px 20px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', gap:8, padding:'12px 14px', background:sc?.soft||PRIMARY_SOFT, borderRadius:10, border:`1px solid ${LINE}`, alignItems:'center' }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:sc?.color||PRIMARY, color:'#fff', display:'grid', placeItems:'center', flexShrink:0 }}>
                            <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p style={{ fontSize:10, fontWeight:700, color:sc?.color||PRIMARY, textTransform:'uppercase', letterSpacing:'0.1em' }}>{ASIG_FULL[ev.asignatura]||ev.asignatura}</p>
                            <p style={{ fontSize:13, fontWeight:700, color:INK }}>{ev.curso}</p>
                        </div>
                    </div>

                    {ev.slots?.length > 0 && (
                        <div style={{ padding:'12px 14px', background:'#FBF7F1', borderRadius:10, border:`1px solid ${LINE}` }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
                                <Clock className="w-3.5 h-3.5" style={{ color:INK_3 }} />
                                <p style={{ fontSize:10, fontWeight:700, color:INK_2, textTransform:'uppercase', letterSpacing:'0.1em' }}>Horario</p>
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                {ev.slots.map((s, i) => (
                                    <div key={i} style={{ padding:'6px 10px', borderRadius:8, background:'#fff', border:`1px solid ${LINE}` }}>
                                        <span style={{ fontSize:10, fontWeight:800, color:PRIMARY }}>{s.day}</span>
                                        <span style={{ fontSize:11, fontWeight:600, color:INK, marginLeft:4 }}>{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {ev.oaCodes?.length > 0 && (
                        <div style={{ padding:'12px 14px', background:'#FBF7F1', borderRadius:10, border:`1px solid ${LINE}` }}>
                            <p style={{ fontSize:10, fontWeight:700, color:INK_2, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>OA a evaluar</p>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                {ev.oaCodes.map(code => (
                                    <span key={code} style={{ padding:'3px 8px', borderRadius:5, background:'#FBEDC9', color:'#6b4a06', fontSize:10, fontWeight:700 }}>{code.split('-').pop()}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {ev.createdBy?.name && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#FBF7F1', borderRadius:10, border:`1px solid ${LINE}` }}>
                            <User className="w-3.5 h-3.5" style={{ color:INK_3, flexShrink:0 }} />
                            <div>
                                <p style={{ fontSize:10, fontWeight:700, color:INK_3, textTransform:'uppercase', letterSpacing:'0.1em' }}>Creado por</p>
                                <p style={{ fontSize:12, fontWeight:600, color:INK }}>{ev.createdBy.name}</p>
                            </div>
                        </div>
                    )}

                    {pending && (
                        <div style={{ padding:'12px 14px', borderRadius:10, border:'2px solid #fcd34d', background:'#fffbeb' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                                <AlertCircle className="w-3.5 h-3.5" style={{ color:'#d97706', flexShrink:0 }} />
                                <p style={{ fontSize:12, fontWeight:700, color:'#92400e' }}>Cambios pendientes de aprobación</p>
                            </div>
                            {canCRUD && (
                                <div style={{ display:'flex', gap:8 }}>
                                    <button onClick={onApprove} className="flex items-center gap-1 hover:brightness-95 transition-colors" style={{ padding:'7px 14px', borderRadius:8, background:'#10b981', color:'#fff', fontSize:12, fontWeight:700 }}>
                                        <CheckCircle className="w-3 h-3" /> Aprobar
                                    </button>
                                    <button onClick={onReject} className="flex items-center gap-1 hover:bg-red-200 transition-colors" style={{ padding:'7px 14px', borderRadius:8, background:'#fee2e2', color:'#dc2626', fontSize:12, fontWeight:700 }}>
                                        <XCircle className="w-3 h-3" /> Rechazar
                                    </button>
                                </div>
                            )}
                            {!canCRUD && <p style={{ fontSize:12, color:'#d97706', fontStyle:'italic', marginTop:8 }}>En revisión por la jefa UTP.</p>}
                        </div>
                    )}
                </div>

                {/* Pie */}
                <div className="cal-modal-foot" style={{ padding:'12px 20px', borderTop:`1px solid ${LINE}`, background:'#FAF6EE', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {(canCRUD || canEditEval) && !confirmDelete && (
                        <>
                            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 hover:bg-red-50 rounded-xl transition-colors" style={{ padding:'8px 12px', color:'#dc2626', fontSize:13, fontWeight:600 }}>
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </button>
                            <button onClick={onEdit} className="flex items-center gap-1.5 hover:bg-slate-100 rounded-xl transition-colors" style={{ padding:'8px 12px', color:PRIMARY, fontSize:13, fontWeight:600 }}>
                                <Pencil className="w-3.5 h-3.5" /> Editar
                            </button>
                        </>
                    )}
                    {confirmDelete && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:'#dc2626', flex:1 }}>¿Eliminar evaluación?</span>
                            <button onClick={() => setConfirmDelete(false)} className="hover:bg-slate-100 rounded-xl transition-colors" style={{ padding:'8px 12px', fontSize:13, fontWeight:600, color:INK_2 }}>No</button>
                            <button onClick={onDelete} className="hover:brightness-95 rounded-xl transition-colors" style={{ padding:'8px 12px', fontSize:13, fontWeight:700, background:'#dc2626', color:'#fff' }}>Sí</button>
                        </div>
                    )}
                    {!confirmDelete && (
                        <button onClick={onClose} className="ml-auto hover:bg-slate-100 rounded-xl transition-colors" style={{ padding:'8px 18px', fontSize:13, fontWeight:600, color:INK_2 }}>Cerrar</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function CalendarioMobile() {
    const { user, getAllUsers }                  = useAuth();
    const { evaluaciones, deleteEvaluacion, approvePendingChanges, rejectPendingChanges } = useEvaluaciones();
    const { allHolidays }                        = useHolidays();
    const { getSchedule, getAllSchedules }        = useSchedule();
    const { getCourseSchedule, getCourseAssistant } = useCourseSchedule();

    const today       = useMemo(() => new Date(), []);
    const todayStr    = useMemo(() => today.toISOString().slice(0, 10), [today]);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const canCreateEval = canEdit(user) || user?.role === 'teacher' || user?.role === 'utp_head';
    const canCRUD       = isAdmin(user) || user?.role === 'utp_head';
    const isTeacher     = user?.role === 'teacher';

    const [selectedMonth, setSelectedMonth]   = useState(currentMonth);
    const [selectedCurso, setSelectedCurso]   = useState(null);
    const [selectedDate, setSelectedDate]     = useState(null);
    const [evalModal, setEvalModal]           = useState(null);
    const [showCreate, setShowCreate]         = useState(null);
    const [showAgenda, setShowAgenda]         = useState(false);
    const [cursoDropdown, setCursoDropdown]   = useState(false);
    const cursoDropdownRef                    = useRef(null);
    const dateRefs                            = useRef({});

    // ── Export state ──────────────────────────────────────────────────────────
    const [exportingPdf, setExportingPdf]           = useState(false);
    const [exportingAgenda, setExportingAgenda]     = useState(false);
    const [exportingTabular, setExportingTabular]   = useState(false);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const [showAgendaExportModal, setShowAgendaExportModal]   = useState(false);
    const [showTabularExportModal, setShowTabularExportModal] = useState(false);
    const [agendaExportWeek, setAgendaExportWeek] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
        d.setHours(0, 0, 0, 0);
        return d.toISOString().slice(0, 10);
    });
    const [agendaExportCurso, setAgendaExportCurso] = useState(null);
    const exportDropdownRef = useRef(null);

    const cursoOptions = useMemo(() => {
        if (isTeacher) {
            const blocks = getSchedule(user?.uid);
            const set = new Set(blocks.map(b => b.course).filter(c => CURSOS.includes(c)));
            if (user?.isHeadTeacher && user?.headTeacherOf && CURSOS.includes(user.headTeacherOf))
                set.add(user.headTeacherOf);
            return [null, ...CURSOS.filter(c => set.has(c))];
        }
        return [null, ...CURSOS];
    }, [isTeacher, getSchedule, user?.uid, user?.isHeadTeacher, user?.headTeacherOf]);

    const realCursos         = useMemo(() => cursoOptions.filter(c => c !== null), [cursoOptions]);
    const agendaCursoIdx     = realCursos.indexOf(agendaExportCurso);
    const canPrevAgendaCurso = agendaCursoIdx > 0;
    const canNextAgendaCurso = agendaCursoIdx < realCursos.length - 1;

    const agendaExportWeekLabel = useMemo(() => {
        const mon = new Date(agendaExportWeek + 'T12:00:00');
        const fri = new Date(mon); fri.setDate(fri.getDate() + 4);
        const fmt = d => d.toLocaleDateString('es-CL', { day:'numeric', month:'short' });
        return `${fmt(mon)} – ${fmt(fri)}`;
    }, [agendaExportWeek]);

    const agendaExportWeekDays = useMemo(() => {
        const mon = new Date(agendaExportWeek + 'T12:00:00');
        return ['Lun','Mar','Mié','Jue','Vie'].map((label, i) => {
            const d = new Date(mon); d.setDate(mon.getDate() + i);
            const iso = d.toISOString().slice(0, 10);
            return { label, date: d.getDate(), iso, isToday: iso === todayStr };
        });
    }, [agendaExportWeek, todayStr]);

    const agendaExportWeekOfMonth = useMemo(() => {
        const mon = new Date(agendaExportWeek + 'T12:00:00');
        const monthName = mon.toLocaleDateString('es-CL', { month:'long' });
        const firstDow = new Date(mon.getFullYear(), mon.getMonth(), 1).getDay();
        const adjFirst = firstDow === 0 ? 1 : firstDow;
        const weekNum = Math.ceil((mon.getDate() + adjFirst - 1) / 7);
        const ordinals = ['Primera','Segunda','Tercera','Cuarta','Quinta'];
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
        return `${ordinals[Math.min(weekNum - 1, 4)]} semana de ${cap(monthName)}`;
    }, [agendaExportWeek]);

    const agendaExportProfesorJefe = useMemo(() => {
        if (!agendaExportCurso) return null;
        return getAllUsers().find(u => u.isHeadTeacher && u.headTeacherOf === agendaExportCurso) ?? null;
    }, [getAllUsers, agendaExportCurso]);

    // Cerrar dropdowns con click fuera
    useEffect(() => {
        const h = (e) => {
            if (cursoDropdownRef.current && !cursoDropdownRef.current.contains(e.target)) setCursoDropdown(false);
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) setExportDropdownOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // Scroll al grupo de fecha seleccionado
    useEffect(() => {
        if (!selectedDate) return;
        const el = dateRefs.current[selectedDate];
        if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    }, [selectedDate]);

    const filteredEvals = useMemo(() => {
        if (!selectedCurso) return evaluaciones;
        return evaluaciones.filter(e => e.curso === selectedCurso);
    }, [evaluaciones, selectedCurso]);

    const prefix = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const monthEvals = useMemo(() => filteredEvals.filter(e => e.date?.startsWith(prefix)), [filteredEvals, prefix]);

    const evalsByDate = useMemo(() => {
        const map = {};
        monthEvals.forEach(e => {
            if (!e.date) return;
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [monthEvals]);

    const agendaGroups = useMemo(() => {
        const sorted = [...monthEvals].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const groups = {};
        sorted.forEach(ev => {
            const key = ev.date || '__sin_fecha__';
            if (!groups[key]) groups[key] = [];
            groups[key].push(ev);
        });
        return Object.entries(groups);
    }, [monthEvals]);

    const weeks = useMemo(() => buildMonthGrid(currentYear, selectedMonth), [currentYear, selectedMonth]);

    const canGoPrev = selectedMonth > currentMonth;
    const canGoNext = selectedMonth < 11;

    // ── Export handlers ───────────────────────────────────────────────────────
    const goAgendaExportWeek = (delta) => {
        const d = new Date(agendaExportWeek + 'T12:00:00');
        d.setDate(d.getDate() + delta * 7);
        setAgendaExportWeek(d.toISOString().slice(0, 10));
    };

    const handleAgendaExportPDF = async () => {
        setExportingAgenda(true);
        try {
            const constraints = [where('weekStart', '==', agendaExportWeek)];
            if (agendaExportCurso) constraints.push(where('curso', '==', agendaExportCurso));
            const snap = await getDocs(query(collection(db, 'agenda_contenido'), ...constraints));
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            const monDate = new Date(agendaExportWeek + 'T12:00:00');
            const weekDates = Array.from({ length: 5 }, (_, i) => {
                const d = new Date(monDate); d.setDate(monDate.getDate() + i);
                return d.toISOString().slice(0, 10);
            });
            const weekEvals = evaluaciones.filter(ev =>
                ev.date && weekDates.includes(ev.date) &&
                (!agendaExportCurso || ev.curso === agendaExportCurso)
            );
            const nextWeekDates = weekDates.map(iso => {
                const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 7);
                return d.toISOString().slice(0, 10);
            });
            const nextWeekEvals = evaluaciones.filter(ev =>
                ev.date && nextWeekDates.includes(ev.date) &&
                (!agendaExportCurso || ev.curso === agendaExportCurso)
            );
            const nextConstraints = [where('weekStart', '==', nextWeekDates[0])];
            if (agendaExportCurso) nextConstraints.push(where('curso', '==', agendaExportCurso));
            const nextSnap = await getDocs(query(collection(db, 'agenda_contenido'), ...nextConstraints));
            const nextWeekEntries = nextSnap.docs.flatMap(d => d.data().entries || []);

            const normalizeDay = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const officialBlocks = agendaExportCurso ? getCourseSchedule(agendaExportCurso) : null;
            const scheduleByDay = {};
            if (officialBlocks && officialBlocks.length > 0) {
                officialBlocks.forEach(block => {
                    const key = normalizeDay(block.day);
                    if (!scheduleByDay[key]) scheduleByDay[key] = [];
                    if (!scheduleByDay[key].some(b => b.startTime === block.startTime))
                        scheduleByDay[key].push({ subject: block.subject, startTime: block.startTime });
                });
            } else {
                const allSch = getAllSchedules();
                Object.values(allSch).forEach(blocks => {
                    (blocks || []).forEach(block => {
                        if (!agendaExportCurso || block.course === agendaExportCurso) {
                            const key = normalizeDay(block.day);
                            if (!scheduleByDay[key]) scheduleByDay[key] = [];
                            if (!scheduleByDay[key].some(b => b.subject === block.subject && b.startTime === block.startTime))
                                scheduleByDay[key].push({ subject: block.subject, startTime: block.startTime });
                        }
                    });
                });
            }
            Object.keys(scheduleByDay).forEach(k => scheduleByDay[k].sort((a, b) => (a.startTime||'').localeCompare(b.startTime||'')));

            const ok = await exportAgendaMensualCardPDF({
                agendaDocs: docs,
                selectedCurso: agendaExportCurso,
                mesLabel: agendaExportWeekLabel,
                holidays: allHolidays,
                evaluaciones: weekEvals,
                weekStart: agendaExportWeek,
                profesorJefeName: agendaExportProfesorJefe?.name || '',
                scheduleByDay,
                nextWeekEvaluaciones: nextWeekEvals,
                nextWeekEntries,
            });
            if (!ok) toast.error('No hay nada agendado para esa semana');
            else setShowAgendaExportModal(false);
        } catch {
            toast.error('Error al exportar');
        } finally {
            setExportingAgenda(false);
        }
    };

    const handleTabularExportPDF = async () => {
        setExportingTabular(true);
        try {
            const normalizeDay = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const constraints = [where('weekStart', '==', agendaExportWeek)];
            if (agendaExportCurso) constraints.push(where('curso', '==', agendaExportCurso));
            const snap = await getDocs(query(collection(db, 'agenda_contenido'), ...constraints));
            const agendaEntries = snap.docs.flatMap(d => d.data().entries || []);

            const monDate = new Date(agendaExportWeek + 'T12:00:00');
            const weekDates = Array.from({ length: 5 }, (_, i) => {
                const d = new Date(monDate); d.setDate(monDate.getDate() + i);
                return d.toISOString().slice(0, 10);
            });
            const weekEvals = evaluaciones.filter(ev =>
                ev.date && weekDates.includes(ev.date) &&
                (!agendaExportCurso || ev.curso === agendaExportCurso)
            );

            const noticiaConstraints = [where('weekStart', '==', agendaExportWeek)];
            if (agendaExportCurso) noticiaConstraints.push(where('curso', '==', agendaExportCurso));
            const noticiaSnap = await getDocs(query(collection(db, 'agenda_noticias'), ...noticiaConstraints));
            const materialesTexto = noticiaSnap.docs
                .map(d => d.data()).filter(d => d.tipo === 'materiales' && d.texto).map(d => d.texto).join('\n');
            const materialesByDay = materialesTexto
                ? { lunes: materialesTexto, martes: materialesTexto, miercoles: materialesTexto, jueves: materialesTexto, viernes: materialesTexto }
                : {};

            const officialBlocks = agendaExportCurso ? getCourseSchedule(agendaExportCurso) : null;
            const schedByDay = {};
            if (officialBlocks && officialBlocks.length > 0) {
                officialBlocks.forEach(block => {
                    const key = normalizeDay(block.day);
                    if (!schedByDay[key]) schedByDay[key] = [];
                    if (!schedByDay[key].some(b => b.startTime === block.startTime))
                        schedByDay[key].push({ subject: block.subject, startTime: block.startTime });
                });
            } else {
                const allSch = getAllSchedules();
                Object.values(allSch).forEach(blocks => {
                    (blocks || []).forEach(block => {
                        if (!agendaExportCurso || block.course === agendaExportCurso) {
                            const key = normalizeDay(block.day);
                            if (!schedByDay[key]) schedByDay[key] = [];
                            if (!schedByDay[key].some(b => b.subject === block.subject && b.startTime === block.startTime))
                                schedByDay[key].push({ subject: block.subject, startTime: block.startTime });
                        }
                    });
                });
            }
            Object.keys(schedByDay).forEach(k => schedByDay[k].sort((a, b) => (a.startTime||'').localeCompare(b.startTime||'')));

            const allUsersData = getAllUsers();
            const allSch = getAllSchedules();
            const profJefe = allUsersData.find(u => u.isHeadTeacher && u.headTeacherOf === agendaExportCurso);
            const docenteUids = new Set();
            Object.entries(allSch).forEach(([uid, blocks]) => {
                if ((blocks || []).some(b => b.course === agendaExportCurso)) docenteUids.add(uid);
            });
            const otrosDocentes = [...docenteUids]
                .map(uid => allUsersData.find(u => u.id === uid)?.name)
                .filter(n => n && n !== profJefe?.name);
            const profesores = profJefe ? [profJefe.name, ...otrosDocentes].slice(0, 2) : otrosDocentes.slice(0, 2);
            const asistente = getCourseAssistant(agendaExportCurso)?.name || '';

            let avisosExtra = [];
            if (agendaExportCurso) {
                const avisosSnap = await getDoc(doc(db, 'avisos_profesor_jefe', agendaExportCurso));
                if (avisosSnap.exists()) avisosExtra = (avisosSnap.data().avisos || []).map(a => a.texto).filter(Boolean);
            }

            await exportAgendaTabularPDF({
                weekStart: agendaExportWeek,
                selectedCurso: agendaExportCurso,
                profesores,
                asistente,
                scheduleByDay: schedByDay,
                entries: agendaEntries,
                evaluaciones: weekEvals,
                materialesByDay,
                salidaByDay: {},
                holidays: allHolidays,
                avisosExtra,
            });
            setShowTabularExportModal(false);
        } catch {
            toast.error('Error al exportar');
        } finally {
            setExportingTabular(false);
        }
    };

    return (
        <div className="relative flex-1 min-h-0 overflow-y-auto sm:hidden">
            {/* Fondo animado */}
            <div aria-hidden style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden', background:['radial-gradient(ellipse 80% 60% at 80% 0%, #DCEDEB 0%, transparent 55%)','radial-gradient(ellipse 70% 50% at 0% 100%, #FBEDC9 0%, transparent 55%)','#FBF7F1'].join(', ') }}>
                <div style={{ position:'absolute', inset:'-20%', backgroundRepeat:'repeat', opacity:0.4, backgroundImage:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='none' stroke='%231F6F6B' stroke-opacity='0.08' stroke-width='1'><circle cx='60' cy='60' r='3'/><circle cx='0' cy='0' r='2'/><circle cx='120' cy='0' r='2'/><circle cx='0' cy='120' r='2'/><circle cx='120' cy='120' r='2'/></g></svg>")`, animation:'calDriftA 60s linear infinite' }} />
            </div>

            <div className="relative z-10 px-4 pt-5 pb-24 space-y-4">

                {/* ── Cabecera ─────────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <div style={{ width:46, height:46, borderRadius:13, flexShrink:0, background:`linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_2})`, boxShadow:`0 8px 20px -8px ${PRIMARY}`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-headline text-xl font-bold" style={{ color:INK, letterSpacing:'-0.4px' }}>Calendario</h1>
                        <p className="text-xs mt-0.5" style={{ color:INK_2 }}>
                            {canCreateEval ? 'Toca un día para fijar una prueba' : 'Evaluaciones programadas'}
                        </p>
                    </div>
                    {/* Export dropdown */}
                    <div className="relative" ref={exportDropdownRef}>
                        <button
                            onClick={() => setExportDropdownOpen(o => !o)}
                            disabled={exportingPdf || exportingAgenda || exportingTabular}
                            className="flex items-center gap-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
                            style={{ padding:'9px 12px', background:'rgba(255,255,255,0.85)', border:`1px solid ${LINE}`, color:INK_2 }}
                        >
                            {(exportingPdf || exportingAgenda || exportingTabular)
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <FileDown className="w-4 h-4" />}
                            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {exportDropdownOpen && (
                                <motion.div
                                    initial={{ opacity:0, y:-6, scale:0.97 }}
                                    animate={{ opacity:1, y:0, scale:1 }}
                                    exit={{ opacity:0, y:-6, scale:0.97 }}
                                    transition={{ duration:0.15 }}
                                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border overflow-hidden z-50"
                                    style={{ borderColor:LINE, minWidth:210 }}
                                >
                                    <button
                                        onClick={() => {
                                            setExportDropdownOpen(false);
                                            const d = new Date(); const day = d.getDay();
                                            d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0,0,0,0);
                                            setAgendaExportWeek(d.toISOString().slice(0, 10));
                                            setAgendaExportCurso(selectedCurso ?? realCursos[0] ?? null);
                                            setShowAgendaExportModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 text-left"
                                        style={{ color:INK }}
                                    >
                                        <NotebookPen className="w-4 h-4 shrink-0" style={{ color:INK_3 }} />
                                        Agenda semanal
                                    </button>
                                    <div style={{ height:1, background:LINE, margin:'0 12px' }} />
                                    <button
                                        onClick={async () => {
                                            setExportDropdownOpen(false);
                                            setExportingPdf(true);
                                            try {
                                                await exportCalendarioPDF({
                                                    evaluaciones: filteredEvals,
                                                    selectedCurso,
                                                    mesLabel: `${MESES[selectedMonth]} ${currentYear}`,
                                                    year: currentYear,
                                                    month: selectedMonth,
                                                    holidays: allHolidays,
                                                });
                                            } finally {
                                                setExportingPdf(false);
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 text-left"
                                        style={{ color:INK }}
                                    >
                                        <CalendarDays className="w-4 h-4 shrink-0" style={{ color:INK_3 }} />
                                        Calendario mensual
                                    </button>
                                    <div style={{ height:1, background:LINE, margin:'0 12px' }} />
                                    <button
                                        onClick={() => {
                                            setExportDropdownOpen(false);
                                            const d = new Date(); const day = d.getDay();
                                            d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0,0,0,0);
                                            setAgendaExportWeek(d.toISOString().slice(0, 10));
                                            setAgendaExportCurso(selectedCurso ?? realCursos[0] ?? null);
                                            setShowTabularExportModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 text-left"
                                        style={{ color:INK }}
                                    >
                                        <Table2 className="w-4 h-4 shrink-0" style={{ color:INK_3 }} />
                                        Tabla de agenda
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {canCreateEval && isTeacher && (
                        <button
                            onClick={() => setShowAgenda(true)}
                            className="flex items-center gap-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                            style={{ padding:'9px 12px', background:'rgba(255,255,255,0.85)', border:`1px solid ${LINE}`, color:INK_2 }}
                        >
                            <NotebookPen className="w-4 h-4" />
                        </button>
                    )}
                    {canCreateEval && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                            style={{ padding:'9px 14px', background:HONEY, color:'#2a1f04', boxShadow:`0 4px 12px -4px ${HONEY}` }}
                        >
                            <Pin className="w-4 h-4" /> Fijar
                        </button>
                    )}
                </div>

                {/* ── Mes + Curso ───────────────────────────────────────── */}
                <div className="flex items-center gap-2">
                    {/* Selector de mes */}
                    <div className="flex items-center gap-0.5 px-1 rounded-full shrink-0" style={{ background:ACCENT, boxShadow:`0 4px 12px -6px ${ACCENT}` }}>
                        <button onClick={() => canGoPrev && setSelectedMonth(m => m-1)} disabled={!canGoPrev} className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-white/15 transition-colors" style={{ color:'rgba(255,255,255,0.85)' }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-2 text-sm font-semibold" style={{ color:'#fff', minWidth:82, textAlign:'center' }}>
                            {MESES[selectedMonth]}
                        </span>
                        <button onClick={() => canGoNext && setSelectedMonth(m => m+1)} disabled={!canGoNext} className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-white/15 transition-colors" style={{ color:'rgba(255,255,255,0.85)' }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Selector de curso */}
                    <div className="relative flex-1" ref={cursoDropdownRef}>
                        <button
                            onClick={() => setCursoDropdown(o => !o)}
                            className="w-full flex items-center justify-between gap-2 rounded-xl text-sm font-semibold transition-all"
                            style={{ padding:'8px 12px', background:'rgba(255,255,255,0.85)', border:`1px solid ${LINE}`, color:selectedCurso ? PRIMARY : INK_2 }}
                        >
                            <span className="truncate">{selectedCurso ?? 'Todos los cursos'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-150 ${cursoDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {cursoDropdown && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-2xl shadow-xl bg-white overflow-hidden border overflow-y-auto" style={{ borderColor:LINE, maxHeight:220 }}>
                                {cursoOptions.map(c => (
                                    <button
                                        key={c ?? '__todos__'}
                                        onClick={() => { setSelectedCurso(c); setCursoDropdown(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                        style={c === selectedCurso ? { background:PRIMARY, color:'#fff' } : { color:INK }}
                                    >
                                        {c ?? 'Todos los cursos'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Mini calendario con puntos ────────────────────────── */}
                <div style={{ background:'rgba(255,255,255,0.82)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', borderRadius:18, border:`1px solid ${LINE}`, overflow:'hidden', boxShadow:'0 4px 14px -4px rgba(31,42,46,.08)' }}>
                    {/* Cabeceras de día */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', background:'rgba(251,247,241,0.9)', borderBottom:`1px solid ${LINE}` }}>
                        {['Lun','Mar','Mié','Jue','Vie'].map(d => (
                            <div key={d} style={{ padding:'7px 2px', textAlign:'center', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:INK_2 }}>{d}</div>
                        ))}
                    </div>
                    {weeks.map((week, wi) => (
                        <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderBottom: wi < weeks.length-1 ? `1px solid ${LINE}` : 'none' }}>
                            {week.map(({ dateStr, inMonth }) => {
                                const dayNum  = parseInt(dateStr.split('-')[2]);
                                const isToday = dateStr === todayStr;
                                const isPast  = dateStr < todayStr;
                                const evals   = evalsByDate[dateStr] || [];
                                const holiday = inMonth ? allHolidays[dateStr] : null;
                                const isActive = selectedDate === dateStr;
                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => inMonth && setSelectedDate(s => s === dateStr ? null : dateStr)}
                                        style={{
                                            padding:'6px 2px 8px', textAlign:'center',
                                            cursor: inMonth ? 'pointer' : 'default',
                                            background: isActive ? PRIMARY_SOFT : holiday ? 'rgba(254,226,226,0.4)' : !inMonth ? 'rgba(244,236,223,0.6)' : 'transparent',
                                            transition:'background .15s',
                                        }}
                                    >
                                        <div style={{
                                            width:26, height:26, borderRadius:'50%', margin:'0 auto',
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            background: isToday ? PRIMARY : 'transparent',
                                            color: isToday ? '#fff' : holiday ? '#DC2626' : !inMonth || isPast ? INK_3 : INK_2,
                                            fontSize:12, fontWeight: isToday ? 700 : inMonth ? 500 : 400,
                                        }}>
                                            {dayNum}
                                        </div>
                                        {evals.length > 0 && (
                                            <div style={{ display:'flex', gap:2, justifyContent:'center', marginTop:3 }}>
                                                {evals.slice(0, 3).map((e, i) => (
                                                    <div key={i} style={{ width:5, height:5, borderRadius:'50%', background: SUB_COLORS[e.asignatura]?.color || INK_3 }} />
                                                ))}
                                            </div>
                                        )}
                                        {holiday && evals.length === 0 && (
                                            <div style={{ display:'flex', justifyContent:'center', marginTop:3 }}>
                                                <div style={{ width:5, height:5, borderRadius:'50%', background:'#DC2626' }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* ── Lista agenda ──────────────────────────────────────── */}
                {agendaGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center rounded-3xl" style={{ background:'rgba(255,255,255,0.72)', border:`1px solid ${LINE}` }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:PRIMARY_SOFT, color:PRIMARY }}>
                            <CalendarDays className="w-7 h-7" />
                        </div>
                        <p className="text-base font-bold" style={{ color:INK }}>
                            {selectedCurso ? `Sin evaluaciones en ${selectedCurso}` : 'Sin evaluaciones este mes'}
                        </p>
                        <p className="text-sm" style={{ color:INK_3 }}>{MESES[selectedMonth]} {currentYear}</p>
                        {canCreateEval && (
                            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 mt-1 rounded-xl font-bold text-sm transition-all hover:-translate-y-px" style={{ padding:'10px 20px', background:PRIMARY, color:'#fff', boxShadow:`0 6px 14px -6px ${PRIMARY}` }}>
                                <Plus className="w-4 h-4" /> Fijar una prueba
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {agendaGroups.map(([dateStr, evals]) => {
                            const date     = new Date(dateStr + 'T12:00:00');
                            const isToday  = dateStr === todayStr;
                            const isPast   = dateStr < todayStr;
                            const holiday  = allHolidays[dateStr];
                            const isActive = selectedDate === dateStr;
                            const dayLabel = date.toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long' });

                            return (
                                <div key={dateStr} ref={el => { dateRefs.current[dateStr] = el; }}>
                                    {/* Cabecera de fecha */}
                                    <div className="flex items-center gap-2.5 mb-2 px-1">
                                        <div style={{
                                            width:34, height:34, borderRadius:9, flexShrink:0,
                                            background: isToday ? PRIMARY : isActive ? PRIMARY_SOFT : 'rgba(255,255,255,0.7)',
                                            color: isToday ? '#fff' : isActive ? PRIMARY : isPast ? INK_3 : INK_2,
                                            border: `1px solid ${isToday ? PRIMARY : LINE}`,
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            fontSize:13, fontWeight:700,
                                        }}>
                                            {date.getDate()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p style={{ fontSize:13, fontWeight:700, color: isToday ? PRIMARY : INK, textTransform:'capitalize', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {dayLabel}
                                            </p>
                                            {holiday && (
                                                <p style={{ fontSize:10, color:'#DC2626', fontWeight:600 }}>{holiday}</p>
                                            )}
                                        </div>
                                        <span style={{ fontSize:11, color:INK_3, fontWeight:600, shrink:0 }}>
                                            {evals.length} eval{evals.length !== 1 ? 's.' : '.'}
                                        </span>
                                    </div>

                                    {/* Tarjetas de evaluación */}
                                    <div className="space-y-2 pl-1">
                                        {evals.map(ev => {
                                            const sc = SUB_COLORS[ev.asignatura];
                                            return (
                                                <button
                                                    key={ev.id}
                                                    onClick={() => setEvalModal({ type:'detail', data:ev })}
                                                    className="w-full text-left rounded-2xl transition-all active:scale-[0.99]"
                                                    style={{
                                                        padding:'12px 14px',
                                                        background:'rgba(255,255,255,0.9)',
                                                        border:`1px solid ${LINE}`,
                                                        borderLeft:`4px solid ${sc?.color||INK_3}`,
                                                        boxShadow:'0 2px 6px rgba(31,42,46,.05)',
                                                        display:'flex', gap:10, alignItems:'flex-start',
                                                    }}
                                                >
                                                    <div style={{ width:36, height:36, borderRadius:9, background:sc?.soft||'#f1f5f9', color:sc?.color||INK_3, display:'grid', placeItems:'center', flexShrink:0 }}>
                                                        <BookOpen className="w-4 h-4" />
                                                    </div>
                                                    <div style={{ flex:1, minWidth:0 }}>
                                                        <p style={{ fontSize:14, fontWeight:700, color:INK, lineHeight:1.3 }}>{ev.name}</p>
                                                        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, flexWrap:'wrap' }}>
                                                            <span style={{ padding:'2px 7px', borderRadius:4, background:sc?.soft||'#f1f5f9', color:sc?.color||INK_3, fontSize:11, fontWeight:700 }}>
                                                                {ASIG_FULL[ev.asignatura]||ev.asignatura}
                                                            </span>
                                                            <span style={{ fontSize:12, color:INK_2 }}>{ev.curso}</span>
                                                        </div>
                                                    </div>
                                                    {ev.pendingChanges && (
                                                        <span style={{ width:8, height:8, borderRadius:'50%', background:HONEY, border:'2px solid #fff', flexShrink:0, marginTop:4 }} title="Cambios pendientes" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Modales ───────────────────────────────────────────────── */}
            {evalModal?.type === 'detail' && (
                <EvalDetailSheet
                    ev={evalModal.data}
                    onClose={() => setEvalModal(null)}
                    canCRUD={canCRUD}
                    canEditEval={canCRUD || (canCreateEval && evalModal.data?.createdBy?.id === user?.uid)}
                    onEdit={() => setEvalModal({ type:'edit', data:evalModal.data })}
                    onDelete={() => { deleteEvaluacion(evalModal.data.id); setEvalModal(null); }}
                    onApprove={async () => { await approvePendingChanges(evalModal.data.id, evalModal.data.pendingChanges); setEvalModal(null); }}
                    onReject={async () => { await rejectPendingChanges(evalModal.data.id); setEvalModal(null); }}
                />
            )}

            <AnimatePresence>
                {showAgenda && (
                    <AgendaSemanalModal user={user} onClose={() => setShowAgenda(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(showCreate || evalModal?.type === 'edit') && (
                    <CrearEvaluacionModal
                        key={evalModal?.type === 'edit' ? `edit-${evalModal.data.id}` : 'create'}
                        onClose={() => { setShowCreate(null); setEvalModal(null); }}
                        onCreated={() => { setShowCreate(null); setEvalModal(null); }}
                        user={user}
                        evalId={evalModal?.type === 'edit' ? evalModal.data.id : undefined}
                        initialData={evalModal?.type === 'edit' ? evalModal.data : undefined}
                    />
                )}
            </AnimatePresence>

            {/* ── Modal exportar agenda semanal ─────────────────────────── */}
            {showAgendaExportModal && (
                <div onClick={() => setShowAgendaExportModal(false)} className="cal-modal-overlay" style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(31,42,46,.32)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation:'calFadeIn .2s ease-out' }}>
                    <div onClick={e => e.stopPropagation()} className="cal-modal-inner" style={{ background:'#fff', border:`1px solid ${LINE}`, boxShadow:'0 24px 60px -20px rgba(31,42,46,.22), 0 8px 18px -10px rgba(31,42,46,.10)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                        <div className="cal-modal-pull" aria-hidden />
                        <div style={{ height:6, flexShrink:0, background:`linear-gradient(90deg, ${PRIMARY}, ${ACCENT}, ${HONEY})` }} />
                        {/* Head */}
                        <div className="cal-modal-head" style={{ padding:'18px 20px 14px', display:'flex', alignItems:'flex-start', gap:12, borderBottom:`1px solid ${LINE}`, flexShrink:0 }}>
                            <div style={{ width:40, height:40, borderRadius:10, background:PRIMARY_SOFT, color:PRIMARY, display:'grid', placeItems:'center', flexShrink:0 }}>
                                <NotebookPen className="w-5 h-5" />
                            </div>
                            <div style={{ flex:1 }}>
                                <h2 style={{ fontSize:17, fontWeight:700, color:INK, margin:0 }}>Exportar agenda semanal</h2>
                                <p style={{ fontSize:12, color:INK_2, marginTop:2 }}>{agendaExportWeekOfMonth}</p>
                            </div>
                            <button onClick={() => setShowAgendaExportModal(false)} className="hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', color:INK_2, flexShrink:0 }}>
                                <X size={16} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="cal-modal-body" style={{ padding:'16px 20px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:14 }}>
                            {/* Curso */}
                            <div>
                                <p style={{ fontSize:11, fontWeight:700, color:INK_3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Curso</p>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    <button onClick={() => canPrevAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx - 1])} disabled={!canPrevAgendaCurso} className="disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', border:`1px solid ${LINE}`, background:'#fff', color:PRIMARY, flexShrink:0 }}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div style={{ flex:1, textAlign:'center', padding:'6px', background:PRIMARY_SOFT, borderRadius:10, fontSize:14, fontWeight:700, color:PRIMARY }}>
                                        {agendaExportCurso ?? '—'}
                                    </div>
                                    <button onClick={() => canNextAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx + 1])} disabled={!canNextAgendaCurso} className="disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', border:`1px solid ${LINE}`, background:'#fff', color:PRIMARY, flexShrink:0 }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            {/* Semana */}
                            <div>
                                <p style={{ fontSize:11, fontWeight:700, color:INK_3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Semana</p>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                                    <button onClick={() => goAgendaExportWeek(-1)} className="hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', color:PRIMARY, border:`1px solid ${LINE}`, background:'#fff', flexShrink:0 }}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div style={{ flex:1, textAlign:'center' }}>
                                        <div style={{ fontSize:13, fontWeight:700, color:INK }}>{agendaExportWeekLabel}</div>
                                        <div style={{ fontSize:11, color:INK_3, marginTop:2 }}>{agendaExportWeekOfMonth}</div>
                                    </div>
                                    <button onClick={() => goAgendaExportWeek(1)} className="hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', color:PRIMARY, border:`1px solid ${LINE}`, background:'#fff', flexShrink:0 }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4 }}>
                                    {agendaExportWeekDays.map(day => (
                                        <div key={day.iso} style={{ textAlign:'center', padding:'7px 3px', borderRadius:8, background: day.isToday ? PRIMARY_SOFT : '#FAF6EE', border: day.isToday ? `1.5px solid ${PRIMARY}` : `1px solid ${LINE}` }}>
                                            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color: day.isToday ? PRIMARY : INK_3 }}>{day.label}</div>
                                            <div style={{ fontSize:14, fontWeight: day.isToday ? 800 : 600, color: day.isToday ? PRIMARY : INK, marginTop:1 }}>{day.date}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Foot */}
                        <div className="cal-modal-foot" style={{ padding:'12px 20px', borderTop:`1px solid ${LINE}`, background:'#FAF6EE', display:'flex', gap:8, flexShrink:0 }}>
                            <button onClick={() => setShowAgendaExportModal(false)} className="hover:bg-slate-100 rounded-xl transition-colors" style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, color:INK_2 }}>Cancelar</button>
                            <button onClick={handleAgendaExportPDF} disabled={exportingAgenda} className="flex items-center justify-center gap-2 hover:brightness-95 rounded-xl transition-all" style={{ flex:1, padding:'10px', fontSize:13, fontWeight:700, background:PRIMARY, color:'#fff', opacity: exportingAgenda ? 0.7 : 1 }}>
                                {exportingAgenda ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                {exportingAgenda ? 'Exportando…' : 'Exportar PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal exportar tabla de agenda ────────────────────────── */}
            {showTabularExportModal && (
                <div onClick={() => setShowTabularExportModal(false)} className="cal-modal-overlay" style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(31,42,46,.32)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', animation:'calFadeIn .2s ease-out' }}>
                    <div onClick={e => e.stopPropagation()} className="cal-modal-inner" style={{ background:'#fff', border:`1px solid ${LINE}`, boxShadow:'0 24px 60px -20px rgba(31,42,46,.22), 0 8px 18px -10px rgba(31,42,46,.10)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                        <div className="cal-modal-pull" aria-hidden />
                        <div style={{ height:6, flexShrink:0, background:`linear-gradient(90deg, ${PRIMARY}, ${ACCENT}, ${HONEY})` }} />
                        {/* Head */}
                        <div className="cal-modal-head" style={{ padding:'18px 20px 14px', display:'flex', alignItems:'flex-start', gap:12, borderBottom:`1px solid ${LINE}`, flexShrink:0 }}>
                            <div style={{ width:40, height:40, borderRadius:10, background:'#EEF0FF', color:'#3730A3', display:'grid', placeItems:'center', flexShrink:0 }}>
                                <Table2 className="w-5 h-5" />
                            </div>
                            <div style={{ flex:1 }}>
                                <h2 style={{ fontSize:17, fontWeight:700, color:INK, margin:0 }}>Tabla de agenda</h2>
                                <p style={{ fontSize:12, color:INK_2, marginTop:2 }}>Hoja oficio horizontal</p>
                            </div>
                            <button onClick={() => setShowTabularExportModal(false)} className="hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', color:INK_2, flexShrink:0 }}>
                                <X size={16} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="cal-modal-body" style={{ padding:'16px 20px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:14 }}>
                            {/* Curso */}
                            <div>
                                <p style={{ fontSize:11, fontWeight:700, color:INK_3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Curso</p>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    <button onClick={() => canPrevAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx - 1])} disabled={!canPrevAgendaCurso} className="disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', border:`1px solid ${LINE}`, background:'#fff', color:PRIMARY, flexShrink:0 }}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div style={{ flex:1, textAlign:'center', padding:'6px', background:'#EEF0FF', borderRadius:10, fontSize:14, fontWeight:700, color:'#3730A3' }}>
                                        {agendaExportCurso ?? '—'}
                                    </div>
                                    <button onClick={() => canNextAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx + 1])} disabled={!canNextAgendaCurso} className="disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', border:`1px solid ${LINE}`, background:'#fff', color:PRIMARY, flexShrink:0 }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            {/* Semana */}
                            <div>
                                <p style={{ fontSize:11, fontWeight:700, color:INK_3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Semana</p>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <button onClick={() => goAgendaExportWeek(-1)} className="hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', color:PRIMARY, border:`1px solid ${LINE}`, background:'#fff', flexShrink:0 }}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div style={{ flex:1, textAlign:'center' }}>
                                        <div style={{ fontSize:13, fontWeight:700, color:INK }}>{agendaExportWeekLabel}</div>
                                        <div style={{ fontSize:11, color:INK_3, marginTop:2 }}>{agendaExportWeekOfMonth}</div>
                                    </div>
                                    <button onClick={() => goAgendaExportWeek(1)} className="hover:bg-slate-100 rounded-lg transition-colors" style={{ width:30, height:30, display:'grid', placeItems:'center', color:PRIMARY, border:`1px solid ${LINE}`, background:'#fff', flexShrink:0 }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            {/* Info */}
                            <div style={{ padding:'10px 14px', borderRadius:10, background:'#EEF0FF', border:'1px solid rgba(55,48,163,0.15)' }}>
                                <p style={{ fontSize:12, color:'#3730A3', margin:0, lineHeight:1.5 }}>
                                    El PDF se genera automáticamente con el horario oficial, los profesores del curso, las evaluaciones y los materiales de agenda.
                                </p>
                            </div>
                        </div>
                        {/* Foot */}
                        <div className="cal-modal-foot" style={{ padding:'12px 20px', borderTop:`1px solid ${LINE}`, background:'#FAF6EE', display:'flex', gap:8, flexShrink:0 }}>
                            <button onClick={() => setShowTabularExportModal(false)} className="hover:bg-slate-100 rounded-xl transition-colors" style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, color:INK_2 }}>Cancelar</button>
                            <button onClick={handleTabularExportPDF} disabled={exportingTabular} className="flex items-center justify-center gap-2 hover:brightness-95 rounded-xl transition-all" style={{ flex:1, padding:'10px', fontSize:13, fontWeight:700, background:'#3730A3', color:'#fff', opacity: exportingTabular ? 0.7 : 1 }}>
                                {exportingTabular ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                {exportingTabular ? 'Exportando…' : 'Exportar PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

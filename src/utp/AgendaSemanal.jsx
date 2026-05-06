import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    collection, query, where, onSnapshot,
    addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
    setDoc, getDoc, getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, isAdmin, ROLES } from '../context/AuthContext';
import {
    ChevronLeft, ChevronRight, ChevronDown, Plus, X,
    Megaphone, Package, Calendar, MessageCircle,
    CalendarRange, User, Pencil, Trash2,
    Save, BookOpen, Loader2, FileDown,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { COURSES_LIST, useSchedule } from '../context/ScheduleContext';
import { toast } from 'sonner';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { CHILE_HOLIDAYS } from '../data/chileHolidays';
import { exportAgendaSemanalCardPDF } from '../lib/pdfExport';

// ── Design tokens V3 (agenda modal) ──────────────────────────────────────────
const V3_PRIMARY    = '#7B5BE0';
const V3_PINK       = '#EC5BA1';
const V3_TEXT_DARK  = '#2a1a3a';
const V3_TEXT_MED   = '#3a2a44';
const V3_TEXT_MUTED = '#7a6a8a';
const V3_TEXT_SOFT  = '#9a8aaa';
const V3_BG_FIELD   = '#FAFAFD';
const V3_ACT_BG     = '#F1ECFF';
const V3_ACT_TEXT   = '#5028B8';

const V3_DAY_COLOR = { lunes:'#FF7A4D', martes:'#FF7A4D', miercoles:'#26B7BB', jueves:'#7B5BE0', viernes:'#26B7BB' };
const V3_DAY_SHORT = { lunes:'LUN', martes:'MAR', miercoles:'MIÉ', jueves:'JUE', viernes:'VIE' };

// ─── CustomSelect — reemplaza <select> nativo ────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, buttonStyle, maxWidth, dropUp = false }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Normalize to { value, label }
    const normalized = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
    const selected = normalized.find(o => o.value === value);

    return (
        <div ref={ref} style={{ position: 'relative', maxWidth }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', fontFamily: 'inherit',
                    ...buttonStyle,
                }}
            >
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected?.label ?? placeholder ?? ''}
                </span>
                <ChevronDown
                    size={13}
                    style={{ flexShrink: 0, opacity: 0.55, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s' }}
                />
            </button>
            {open && (
                <div style={{
                    position: 'absolute',
                    ...(dropUp ? { bottom: 'calc(100% + 4px)' } : { top: 'calc(100% + 4px)' }),
                    left: 0, right: 0,
                    background: '#fff', borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.09)',
                    boxShadow: '0 8px 28px -6px rgba(0,0,0,0.18)',
                    zIndex: 9999, overflowY: 'auto', maxHeight: 240,
                }}>
                    {placeholder && (
                        <div
                            onClick={() => { onChange(''); setOpen(false); }}
                            style={{
                                padding: '9px 14px', fontSize: 13, color: V3_TEXT_SOFT,
                                cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8f8fb'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            {placeholder}
                        </div>
                    )}
                    {normalized.map(o => {
                        const isSelected = o.value === value;
                        return (
                            <div
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                style={{
                                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                                    fontWeight: isSelected ? 700 : 500,
                                    color: isSelected ? V3_ACT_TEXT : V3_TEXT_MED,
                                    background: isSelected ? V3_ACT_BG : 'transparent',
                                    transition: 'background .1s',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f5f3ff'; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {o.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const V3SumLine = ({ k, v }) => (
    <div style={{ marginBottom:7 }}>
        <div style={{ fontSize:11, fontWeight:800, opacity:0.7, letterSpacing:0.8, textTransform:'uppercase', marginBottom:1 }}>{k}</div>
        <div style={{ fontSize:14, fontWeight:700, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v}</div>
    </div>
);

// ─── Permisos ────────────────────────────────────────────────────────────────
const canManageAssignments = (user) =>
    isAdmin(user) || user?.role === ROLES.UTP_HEAD;

// ─── Tipos de noticia ────────────────────────────────────────────────────────
const TIPOS_NOTICIA = [
    { value: 'materiales', label: 'Solicitud de materiales', icon: Package,       color: 'amber'   },
    { value: 'comunicado', label: 'Comunicado',              icon: Megaphone,     color: 'blue'    },
    { value: 'actividad',  label: 'Actividad especial',      icon: Calendar,      color: 'emerald' },
    { value: 'otro',       label: 'Otro',                    icon: MessageCircle, color: 'slate'   },
];
const TIPO_META   = Object.fromEntries(TIPOS_NOTICIA.map(t => [t.value, t]));
const TIPO_COLORS = {
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'text-amber-500'   },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    icon: 'text-blue-500'    },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-700',   icon: 'text-slate-500'   },
};

// ─── Colores por curso ────────────────────────────────────────────────────────
const COURSE_COLORS = {
    'Pre-Kinder':   { pill: 'bg-pink-500',    light: 'bg-pink-50',     border: 'border-pink-200',    text: 'text-pink-700'    },
    'Pre-Kinder A': { pill: 'bg-pink-500',    light: 'bg-pink-50',     border: 'border-pink-200',    text: 'text-pink-700'    },
    'Pre-Kinder B': { pill: 'bg-pink-500',    light: 'bg-pink-50',     border: 'border-pink-200',    text: 'text-pink-700'    },
    'Kinder':       { pill: 'bg-purple-500',  light: 'bg-purple-50',   border: 'border-purple-200',  text: 'text-purple-700'  },
    'Kinder A':     { pill: 'bg-purple-500',  light: 'bg-purple-50',   border: 'border-purple-200',  text: 'text-purple-700'  },
    'Kinder B':     { pill: 'bg-purple-500',  light: 'bg-purple-50',   border: 'border-purple-200',  text: 'text-purple-700'  },
    '1° Básico':    { pill: 'bg-violet-500',  light: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-700'  },
    '2° Básico':    { pill: 'bg-blue-500',    light: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-700'    },
    '3° Básico':    { pill: 'bg-cyan-500',    light: 'bg-cyan-50',     border: 'border-cyan-200',    text: 'text-cyan-700'    },
    '4° Básico':    { pill: 'bg-teal-500',    light: 'bg-teal-50',     border: 'border-teal-200',    text: 'text-teal-700'    },
    '5° Básico':    { pill: 'bg-emerald-500', light: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700' },
    '6° Básico':    { pill: 'bg-amber-500',   light: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700'   },
    '7° Básico':    { pill: 'bg-orange-500',  light: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700'  },
    '8° Básico':    { pill: 'bg-rose-500',    light: 'bg-rose-50',     border: 'border-rose-200',    text: 'text-rose-700'    },
};
const DEFAULT_COLOR = { pill: 'bg-slate-400', light: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };

function courseAbbrev(curso) {
    if (curso.startsWith('Pre-Kinder')) return curso === 'Pre-Kinder' ? 'PK' : `PK${curso.slice(-1)}`;
    if (curso.startsWith('Kinder'))     return curso === 'Kinder'     ? 'K'  : `K${curso.slice(-1)}`;
    const m = curso.match(/^(\d+)°/);
    return m ? `${m[1]}°` : curso.slice(0, 2);
}

// ─── Constantes de agenda ─────────────────────────────────────────────────────
const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const DIA_LABELS = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes',
};
// Mapeo del campo `day` del horario (con tilde/mayúscula) → clave interna
const SCHEDULE_DAY_TO_DIA = {
    'Lunes': 'lunes', 'Martes': 'martes', 'Miércoles': 'miercoles',
    'Jueves': 'jueves', 'Viernes': 'viernes',
};

function makeAgendaDocId(weekStart, docenteId, curso) {
    return `${weekStart}__${docenteId}__${curso.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
function getMondayOf(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);
    return d;
}
function toISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate()+n); return d; }
function formatWeekLabel(weekStart) {
    const mon = new Date(weekStart + 'T12:00:00');
    const fri = addDays(mon, 4);
    const fmt = d => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    return `${fmt(mon)} – ${fmt(fri)}`;
}
const WEEK_ORDINALS = ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta'];
function getWeekOfMonthLabel(weekStart) {
    const mon = new Date(weekStart + 'T12:00:00');
    const dow = new Date(mon.getFullYear(), mon.getMonth(), 1).getDay();
    const firstMonday = dow === 0 ? 2 : dow === 1 ? 1 : 9 - dow;
    const weekNum = Math.floor((mon.getDate() - firstMonday) / 7) + 1;
    const monthName = mon.toLocaleDateString('es-CL', { month: 'long' });
    const month = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${WEEK_ORDINALS[Math.min(weekNum - 1, 4)]} semana de ${month}`;
}

// ─── Vista de gestión (módulo principal) ──────────────────────────────────────
export default function AgendaSemanal() {
    const { user } = useAuth();
    return <ManagementAgendaView user={user} />;
}

// ─── Vista de gestión ─────────────────────────────────────────────────────────
function ManagementAgendaView({ user }) {
    const { getAllUsers } = useAuth();
    const { getSchedule } = useSchedule();
    const canManage = canManageAssignments(user);

    const [weekStart, setWeekStart] = useState(() => toISO(getMondayOf(new Date())));
    const [assignments, setAssignments] = useState([]);
    const [noticias,    setNoticias]    = useState([]);
    const [loading,     setLoading]     = useState(true);

    const [courseModal,  setCourseModal]  = useState(null);
    const [noticiaModal, setNoticiaModal] = useState(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setAssignments([]);
        const q = query(collection(db, 'agenda_semanal'), where('weekStart', '==', weekStart));
        return onSnapshot(q,
            snap => { setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
            err  => { console.error('agenda_semanal:', err); setLoading(false); }
        );
    }, [weekStart]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNoticias([]);
        const q = query(collection(db, 'agenda_noticias'), where('weekStart', '==', weekStart));
        return onSnapshot(q,
            snap => setNoticias(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            err  => console.error('agenda_noticias:', err)
        );
    }, [weekStart]);

    const teachers = useMemo(() =>
        getAllUsers().filter(u =>
            ['teacher', 'utp_head', 'director', 'admin', 'super_admin'].includes(u.role)
        )
    , [getAllUsers]);

    const goWeek = delta => {
        const d = new Date(weekStart + 'T12:00:00');
        d.setDate(d.getDate() + delta * 7);
        setWeekStart(toISO(getMondayOf(d)));
    };

    const handleDeleteAssignment = (id) => {
        deleteDoc(doc(db, 'agenda_semanal', id)).catch(() => toast.error('Error al eliminar'));
    };

    const handleDeleteNoticia = (id) => {
        toast.success('Noticia eliminada');
        deleteDoc(doc(db, 'agenda_noticias', id)).catch(() => toast.error('Error al eliminar'));
    };

    const openNoticiaModal = assignment => {
        const existing = noticias.find(
            n => n.curso === assignment.curso && n.docenteId === assignment.docenteId
        ) ?? null;
        setNoticiaModal({ assignment, existing });
    };

    const modalCursoAssignments = courseModal ? assignments.filter(a => a.curso === courseModal) : [];
    const modalCursoNoticias    = courseModal ? noticias.filter(n => n.curso === courseModal)    : [];

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 space-y-6 animate-fade-in-up">

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-eyr-on-surface">Agenda Semanal</h1>
                    <p className="text-sm text-slate-500">Asignación de docentes por curso</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-card">
                    <button onClick={() => goWeek(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-slate-700 min-w-[175px] text-center px-1">
                        {formatWeekLabel(weekStart)}
                    </span>
                    <button onClick={() => goWeek(1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <SkeletonGrid />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {COURSES_LIST.map(curso => {
                        const count = new Set(assignments.filter(a => a.curso === curso).map(a => a.docenteId)).size;
                        const hasNoticia = noticias.some(n => n.curso === curso);
                        return (
                            <CourseCard
                                key={curso}
                                curso={curso}
                                count={count}
                                hasNoticia={hasNoticia}
                                onClick={() => setCourseModal(curso)}
                            />
                        );
                    })}
                </div>
            )}

            {courseModal && (
                <CourseModal
                    curso={courseModal}
                    weekStart={weekStart}
                    weekLabel={formatWeekLabel(weekStart)}
                    assignments={modalCursoAssignments}
                    noticias={modalCursoNoticias}
                    teachers={teachers}
                    user={user}
                    canManage={canManage}
                    getSchedule={getSchedule}
                    onDeleteAssignment={handleDeleteAssignment}
                    onOpenNoticia={openNoticiaModal}
                    onDeleteNoticia={handleDeleteNoticia}
                    onClose={() => setCourseModal(null)}
                />
            )}

            {noticiaModal && (
                <NoticiaModal
                    assignment={noticiaModal.assignment}
                    existing={noticiaModal.existing}
                    weekStart={weekStart}
                    weekLabel={formatWeekLabel(weekStart)}
                    onClose={() => setNoticiaModal(null)}
                />
            )}
        </div>
    );
}

// ─── Modal de agenda semanal (para profesores, desde CalendarioEvaluaciones) ──
export function AgendaSemanalModal({ user, onClose }) {
    const { getSchedule } = useSchedule();
    const { getAllUsers } = useAuth();

    const [weekStart,      setWeekStart]      = useState(() => toISO(getMondayOf(new Date())));
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [localEntries,   setLocalEntries]   = useState([]);
    const [saveStatus,     setSaveStatus]     = useState('idle'); // 'idle' | 'pending' | 'saving' | 'saved'
    const [loading,        setLoading]        = useState(false);
    const [focusedDay,     setFocusedDay]     = useState(null);
    const [exporting,        setExporting]        = useState(false);
    const [deleteAgendaState, setDeleteAgendaState] = useState('idle'); // 'idle' | 'confirm' | 'deleting'
    const [showExportModal,  setShowExportModal]  = useState(false);
    const [exportWeekStart,  setExportWeekStart]  = useState(() => toISO(getMondayOf(new Date())));
    const autoSaveTimer     = useRef(null);
    const savedTimer        = useRef(null);
    const selectedCourseRef = useRef(selectedCourse);
    useEffect(() => { selectedCourseRef.current = selectedCourse; }, [selectedCourse]);

    const profesorJefe = useMemo(() => {
        if (!selectedCourse) return null;
        return getAllUsers().find(u => u.isHeadTeacher && u.headTeacherOf === selectedCourse) ?? null;
    }, [getAllUsers, selectedCourse]);

    const teacherBlocks  = useMemo(() => getSchedule(user.uid), [user.uid, getSchedule]);
    const teacherCourses = useMemo(() =>
        [...new Set(teacherBlocks.map(b => b.course).filter(Boolean))]
    , [teacherBlocks]);
    const courseSubjects = useMemo(() => {
        const map = {};
        teacherCourses.forEach(c => {
            map[c] = [...new Set(
                teacherBlocks.filter(b => b.course === c && b.subject).map(b => b.subject)
            )];
        });
        return map;
    }, [teacherBlocks, teacherCourses]);

    // Días en que el docente tiene clases para el curso seleccionado
    const courseDays = useMemo(() => {
        if (!selectedCourse) return new Set();
        return new Set(
            teacherBlocks
                .filter(b => b.course === selectedCourse && b.day)
                .map(b => SCHEDULE_DAY_TO_DIA[b.day])
                .filter(Boolean)
        );
    }, [teacherBlocks, selectedCourse]);

    // Seleccionar el primer curso por defecto
    useEffect(() => {
        if (teacherCourses.length > 0 && !teacherCourses.includes(selectedCourse)) {
            setSelectedCourse(teacherCourses[0]);
        }
    }, [teacherCourses]); // eslint-disable-line

    // Resetear día enfocado al cambiar semana o curso
    useEffect(() => { setFocusedDay(null); setDeleteAgendaState('idle'); }, [weekStart, selectedCourse]);

    // Cargar agenda guardada desde Firestore
    useEffect(() => {
        if (!selectedCourse) return;
        let cancelled = false;
        clearTimeout(autoSaveTimer.current);
        setLoading(true);
        setLocalEntries([]);
        setSaveStatus('idle');
        const docId = makeAgendaDocId(weekStart, user.uid, selectedCourse);
        getDoc(doc(db, 'agenda_contenido', docId))
            .then(snap => {
                if (!cancelled) {
                    setLocalEntries(snap.exists() ? (snap.data().entries ?? []) : []);
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [weekStart, selectedCourse, user.uid]);

    const doSave = useCallback(async (entries, course) => {
        if (!course) return;
        setSaveStatus('saving');
        try {
            const docId = makeAgendaDocId(weekStart, user.uid, course);
            await setDoc(doc(db, 'agenda_contenido', docId), {
                weekStart,
                curso: course,
                docenteId: user.uid,
                docenteName: user.name || user.displayName || user.email,
                entries,
                updatedAt: serverTimestamp(),
            });
            setSaveStatus('saved');
            clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
        } catch {
            toast.error('Error al guardar');
            setSaveStatus('pending');
        }
    }, [weekStart, user]); // eslint-disable-line react-hooks/exhaustive-deps

    const goWeek = delta => {
        const d = new Date(weekStart + 'T12:00:00');
        d.setDate(d.getDate() + delta * 7);
        setWeekStart(toISO(getMondayOf(d)));
    };

    const addEntry = (dia, asignatura, texto) => {
        const id = crypto.randomUUID();
        setLocalEntries(prev => {
            const next = [...prev, { id, dia, asignatura, texto }];
            scheduleAutoSave(next);
            return next;
        });
    };

    const removeEntry = id => {
        setLocalEntries(prev => {
            const next = prev.filter(e => e.id !== id);
            scheduleAutoSave(next);
            return next;
        });
    };

    const handleDeleteAgenda = async () => {
        setDeleteAgendaState('deleting');
        try {
            clearTimeout(autoSaveTimer.current);
            const docId = makeAgendaDocId(weekStart, user.uid, selectedCourse);
            await deleteDoc(doc(db, 'agenda_contenido', docId));
            setLocalEntries([]);
            setSaveStatus('idle');
            toast.success('Agenda eliminada');
        } catch {
            toast.error('Error al eliminar');
        } finally {
            setDeleteAgendaState('idle');
        }
    };

    const goExportWeek = delta => {
        const d = new Date(exportWeekStart + 'T12:00:00');
        d.setDate(d.getDate() + delta * 7);
        setExportWeekStart(toISO(getMondayOf(d)));
    };

    const handleExportPDF = async () => {
        if (!selectedCourse) return;
        setExporting(true);
        try {
            const snap = await getDocs(query(
                collection(db, 'agenda_contenido'),
                where('weekStart', '==', exportWeekStart),
                where('curso', '==', selectedCourse),
            ));
            const allEntries = snap.docs.flatMap(d => d.data().entries ?? []);
            if (allEntries.length === 0) {
                toast.error('No hay agenda registrada para esa semana');
                return;
            }
            await exportAgendaSemanalCardPDF({
                weekStart:   exportWeekStart,
                curso:       selectedCourse,
                docenteName: profesorJefe?.name || user.name || user.displayName || '',
                entries:     allEntries,
                holidays:    CHILE_HOLIDAYS,
            });
            setShowExportModal(false);
        } catch {
            toast.error('Error al exportar');
        } finally {
            setExporting(false);
        }
    };

    const scheduleAutoSave = (entries) => {
        setSaveStatus('pending');
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            // usar ref para acceder al curso actual sin stale closure
            doSave(entries, selectedCourseRef.current);
        }, 1200);
    };


    const dayDates = useMemo(() => {
        const mon = new Date(weekStart + 'T12:00:00');
        return Object.fromEntries(
            DIAS.map((dia, i) => {
                const d = addDays(mon, i);
                return [dia, d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })];
            })
        );
    }, [weekStart]);

    const dayISO = useMemo(() => {
        const mon = new Date(weekStart + 'T12:00:00');
        return Object.fromEntries(DIAS.map((dia, i) => [dia, toISO(addDays(mon, i))]));
    }, [weekStart]);

    const totalEntries = localEntries.length;

    return (
        <>
        <div onClick={onClose} style={{
            position:'fixed', inset:0, zIndex:200,
            background:'rgba(28,18,50,0.45)',
            backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:24,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width:960, maxWidth:'calc(100vw - 48px)',
                maxHeight:'calc(100vh - 48px)',
                background:'#FFFFFF',
                borderRadius:24,
                boxShadow:'0 30px 80px -20px rgba(40,20,80,0.5), 0 12px 30px -12px rgba(40,20,80,0.3)',
                overflow:'hidden',
                border:'1px solid rgba(20,10,40,0.05)',
                display:'grid',
                gridTemplateColumns:'220px 1fr',
            }}>

                {/* ── Sidebar ── */}
                <div style={{
                    position:'relative',
                    background:'linear-gradient(160deg, #7B5BE0 0%, #EC5BA1 100%)',
                    color:'white', padding:'24px 20px',
                    overflow:'hidden', display:'flex', flexDirection:'column',
                }}>
                    {/* orbe de fondo */}
                    <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.10)', animation:'calFloatA 9s ease-in-out infinite', pointerEvents:'none' }}/>
                    <div style={{ position:'absolute', bottom:-80, left:-60, width:260, height:260, borderRadius:'50%', background:'rgba(255,255,255,0.07)', animation:'calFloatB 11s ease-in-out infinite', animationDelay:'-4s', pointerEvents:'none' }}/>
                    {/* símbolos flotantes */}
                    {[
                      { sym:'π',  top:  6, left: 12, size:52, op:0.18, anim:'calSymA', dur:'8s',  del:'-1s'   },
                      { sym:'∑',  top: 18, right:12, size:44, op:0.16, anim:'calSymB', dur:'10s', del:'-3s'   },
                      { sym:'√',  top: 68, left: 24, size:36, op:0.15, anim:'calSymC', dur:'7s',  del:'-5s'   },
                      { sym:'×',  top: 95, right: 6, size:42, op:0.16, anim:'calSymD', dur:'9s',  del:'-2s'   },
                      { sym:'∞',  top:145, left:  6, size:34, op:0.14, anim:'calSymA', dur:'12s', del:'-7s'   },
                      { sym:'÷',  top:175, right:22, size:30, op:0.15, anim:'calSymB', dur:'6s',  del:'-1.5s' },
                      { sym:'²',  top:200, left: 48, size:28, op:0.13, anim:'calSymC', dur:'11s', del:'-8s'   },
                      { sym:'A',  top:225, right:10, size:46, op:0.13, anim:'calSymD', dur:'8s',  del:'-4s'   },
                      { sym:'¿',  top:265, left: 12, size:38, op:0.14, anim:'calSymA', dur:'9s',  del:'-6s'   },
                      { sym:'⚛',  top:295, right:16, size:36, op:0.15, anim:'calSymB', dur:'13s', del:'-3s'   },
                      { sym:'∆',  top:330, left: 32, size:30, op:0.13, anim:'calSymC', dur:'7s',  del:'-9s'   },
                      { sym:'«»', top:360, right: 4, size:28, op:0.14, anim:'calSymD', dur:'10s', del:'-5s'   },
                      { sym:'ñ',  top:390, left:  8, size:34, op:0.12, anim:'calSymA', dur:'8s',  del:'-2s'   },
                      { sym:'=',  top:420, right:28, size:30, op:0.14, anim:'calSymB', dur:'6s',  del:'-7s'   },
                    ].map(({ sym, top, left, right, size, op, anim, dur, del }) => (
                      <div key={sym+top} style={{
                        position:'absolute', top, left, right,
                        fontSize:size, fontWeight:900, color:'white', opacity:op,
                        animation:`${anim} ${dur} ease-in-out infinite`,
                        animationDelay:del,
                        pointerEvents:'none', userSelect:'none', lineHeight:1,
                        fontFamily:'ui-monospace, "Plus Jakarta Sans", system-ui',
                        textShadow:'0 2px 12px rgba(0,0,0,0.25)',
                      }}>
                        {sym}
                      </div>
                    ))}

                    <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column' }}>
                        {/* icon */}
                        <div style={{
                            width:44, height:44, borderRadius:13,
                            background:'rgba(255,255,255,0.22)',
                            border:'1px solid rgba(255,255,255,0.4)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            marginBottom:18,
                        }}>
                            <CalendarRange size={20} color="white"/>
                        </div>

                        <div style={{ fontSize:13, fontWeight:800, opacity:1, letterSpacing:1.4, textTransform:'uppercase', marginBottom:8, textShadow:'0 1px 6px rgba(0,0,0,0.25)' }}>
                            UTP · Docentes
                        </div>
                        <div style={{ fontSize:28, fontWeight:900, lineHeight:1.15, letterSpacing:-0.5, marginBottom:10, whiteSpace:'pre-line', textShadow:'0 2px 10px rgba(0,0,0,0.3)' }}>
                            {'Agenda\nSemanal'}
                        </div>
                        <div style={{ fontSize:14, opacity:1, lineHeight:1.6, marginBottom:20, textShadow:'0 1px 6px rgba(0,0,0,0.2)' }}>
                            Registra lo que los alumnos deben traer o hacer cada día.
                        </div>

                        {/* Week label (solo referencia) */}
                        <div style={{
                            background:'rgba(255,255,255,0.15)',
                            border:'1px solid rgba(255,255,255,0.25)',
                            borderRadius:10, padding:'7px 12px',
                            textAlign:'center', lineHeight:1.4,
                            marginBottom:12,
                        }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.8)', letterSpacing:0.3, marginBottom:2 }}>
                                {getWeekOfMonthLabel(weekStart)}
                            </div>
                            <div style={{ fontSize:13, fontWeight:700, color:'white' }}>
                                {formatWeekLabel(weekStart)}
                            </div>
                        </div>

                        {/* Summary card */}
                        <div style={{
                            background:'rgba(255,255,255,0.16)',
                            border:'1px solid rgba(255,255,255,0.25)',
                            borderRadius:14, padding:'12px 14px',
                            fontSize:12,
                        }}>
                            <div style={{ fontSize:11, fontWeight:800, opacity:1, letterSpacing:0.8, textTransform:'uppercase', marginBottom:8, textShadow:'0 1px 4px rgba(0,0,0,0.2)' }}>
                                Resumen
                            </div>
                            <V3SumLine k="Curso" v={selectedCourse || '—'}/>
                            <V3SumLine k="Profesor Jefe" v={profesorJefe?.name || '—'}/>
                            <V3SumLine k="Entradas" v={totalEntries > 0 ? `${totalEntries} entrada${totalEntries !== 1 ? 's' : ''}` : '—'}/>
                            {saveStatus === 'pending' && (
                                <div style={{ marginTop:8, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.75)', letterSpacing:0.4 }}>
                                    ● Guardando pronto…
                                </div>
                            )}
                            {saveStatus === 'saving' && (
                                <div style={{ marginTop:8, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:0.4 }}>
                                    ↑ Guardando…
                                </div>
                            )}
                            {saveStatus === 'saved' && (
                                <div style={{ marginTop:8, fontSize:12, fontWeight:700, color:'rgba(180,255,180,0.95)', letterSpacing:0.4 }}>
                                    ✓ Guardado
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right side ── */}
                <div style={{ display:'flex', flexDirection:'column', minHeight:0 }}>

                    {/* Top bar */}
                    <div style={{
                        padding:'14px 20px',
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        borderBottom:'1px solid rgba(20,10,40,0.06)',
                        flexShrink:0, gap:8,
                    }}>
                        {/* Course dropdown */}
                        <div style={{ flex:1, minWidth:0 }}>
                            {teacherCourses.length > 0 ? (
                                <CustomSelect
                                    value={selectedCourse || ''}
                                    onChange={val => setSelectedCourse(val)}
                                    options={teacherCourses}
                                    maxWidth={220}
                                    buttonStyle={{
                                        width:'100%',
                                        padding:'8px 12px', borderRadius:10,
                                        border:`1.5px solid ${V3_PRIMARY}30`,
                                        background:V3_ACT_BG, color:V3_ACT_TEXT,
                                        fontSize:14, fontWeight:700,
                                    }}
                                />
                            ) : null}
                        </div>

                        {/* Week nav */}
                        <div style={{
                            display:'flex', alignItems:'center', gap:2,
                            background:'rgba(0,0,0,0.04)', borderRadius:10,
                            padding:'4px', flexShrink:0,
                        }}>
                            <button onClick={() => goWeek(-1)} style={{
                                width:28, height:28, borderRadius:7, border:'none',
                                background:'transparent', color:V3_TEXT_MUTED,
                                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                                transition:'background .12s, color .12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background='white'; e.currentTarget.style.color=V3_TEXT_DARK; }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=V3_TEXT_MUTED; }}
                            >
                                <ChevronLeft size={14}/>
                            </button>
                            <div style={{ textAlign:'center', padding:'0 8px' }}>
                                <div style={{ fontSize:13, fontWeight:700, color:V3_TEXT_DARK, whiteSpace:'nowrap' }}>
                                    {formatWeekLabel(weekStart)}
                                </div>
                                <div style={{ fontSize:10, fontWeight:600, color:V3_TEXT_SOFT, marginTop:1, whiteSpace:'nowrap' }}>
                                    {getWeekOfMonthLabel(weekStart)}
                                </div>
                            </div>
                            <button onClick={() => goWeek(1)} style={{
                                width:28, height:28, borderRadius:7, border:'none',
                                background:'transparent', color:V3_TEXT_MUTED,
                                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                                transition:'background .12s, color .12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background='white'; e.currentTarget.style.color=V3_TEXT_DARK; }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=V3_TEXT_MUTED; }}
                            >
                                <ChevronRight size={14}/>
                            </button>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>

                            {/* Eliminar agenda */}
                            {localEntries.length > 0 && (
                                deleteAgendaState === 'confirm' ? (
                                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                        <span style={{ fontSize:11, fontWeight:700, color:'#EF4444', whiteSpace:'nowrap' }}>¿Eliminar agenda?</span>
                                        <button
                                            onClick={handleDeleteAgenda}
                                            style={{
                                                padding:'4px 10px', borderRadius:7, border:'none',
                                                background:'#EF4444', color:'white',
                                                fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                                            }}
                                        >
                                            Sí
                                        </button>
                                        <button
                                            onClick={() => setDeleteAgendaState('idle')}
                                            style={{
                                                padding:'4px 10px', borderRadius:7, border:'1px solid rgba(0,0,0,0.1)',
                                                background:'white', color:V3_TEXT_MUTED,
                                                fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                                            }}
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : deleteAgendaState === 'deleting' ? (
                                    <Loader2 size={13} style={{ animation:'spin 1s linear infinite', color:'#EF4444' }}/>
                                ) : (
                                    <button
                                        onClick={() => setDeleteAgendaState('confirm')}
                                        title="Eliminar agenda de esta semana"
                                        style={{
                                            height:32, padding:'0 10px', borderRadius:10,
                                            border:'1px solid rgba(239,68,68,0.25)',
                                            background:'rgba(254,242,242,0.8)', color:'#EF4444',
                                            cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                                            fontSize:12, fontWeight:700, flexShrink:0,
                                            transition:'all .15s',
                                        }}
                                    >
                                        <Trash2 size={12}/> Eliminar
                                    </button>
                                )
                            )}

                            {/* Indicador de auto-guardado */}
                            <div style={{
                                display:'flex', alignItems:'center', gap:5,
                                padding:'6px 12px', borderRadius:10,
                                background: saveStatus === 'saved' ? 'rgba(34,197,94,0.1)' : saveStatus === 'saving' ? 'rgba(123,91,224,0.08)' : 'transparent',
                                transition:'all .3s',
                                fontSize:12, fontWeight:700,
                                color: saveStatus === 'saved' ? '#16a34a' : saveStatus === 'saving' ? V3_TEXT_MUTED : 'transparent',
                                minWidth:110,
                            }}>
                                {saveStatus === 'saving' && <Loader2 size={12} style={{ animation:'spin 1s linear infinite', flexShrink:0 }}/>}
                                {saveStatus === 'saved'  && <Save size={12} style={{ flexShrink:0 }}/>}
                                {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'saved' ? 'Guardado' : ''}
                            </div>

                            <button onClick={onClose} style={{
                                width:32, height:32, borderRadius:10,
                                border:'1px solid rgba(0,0,0,0.06)',
                                background:V3_BG_FIELD, color:V3_TEXT_MUTED,
                                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                            }}>
                                <X size={14} strokeWidth={2.4}/>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{
                        padding:'16px 20px', overflowY:'auto', flex:1,
                        scrollbarWidth:'thin', scrollbarColor:'rgba(123,91,224,0.25) transparent',
                        overflowX:'clip',
                    }}>
                        {teacherCourses.length === 0 ? (
                            <EmptyNoCourses />
                        ) : loading ? (
                            <SkeletonDays />
                        ) : selectedCourse ? (
                            <LayoutGroup>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {focusedDay ? (
                                        <motion.div
                                            key={`focused-${focusedDay}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.18, ease: 'easeOut' }}
                                            style={{ display:'flex', flexDirection:'column', gap:10 }}
                                        >
                                            <motion.button
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                                onClick={() => setFocusedDay(null)}
                                                style={{
                                                    alignSelf:'flex-start',
                                                    display:'flex', alignItems:'center', gap:8,
                                                    padding:'9px 18px', borderRadius:10, border:'none',
                                                    background:'rgba(0,0,0,0.07)', color:V3_TEXT_MUTED,
                                                    fontSize:15, fontWeight:700, cursor:'pointer',
                                                    fontFamily:'inherit',
                                                }}
                                            >
                                                <ChevronLeft size={17}/> Todos los días
                                            </motion.button>
                                            <motion.div
                                                layoutId={`dc-${focusedDay}`}
                                                layout
                                                transition={{ type:'spring', stiffness:280, damping:30, mass:0.8 }}
                                                style={{ borderRadius:14 }}
                                            >
                                                <DayCard
                                                    dia={focusedDay}
                                                    dateLabel={dayDates[focusedDay]}
                                                    dateISO={dayISO[focusedDay]}
                                                    entries={localEntries.filter(e => e.dia === focusedDay)}
                                                    asignaturas={courseSubjects[selectedCourse] ?? []}
                                                    onAdd={(asig, txt) => addEntry(focusedDay, asig, txt)}
                                                    onRemove={removeEntry}
                                                    isActive={courseDays.size === 0 || courseDays.has(focusedDay)}
                                                    focused
                                                />
                                            </motion.div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="grid"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.16, ease: 'easeOut' }}
                                            style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}
                                        >
                                            {DIAS.map(dia => {
                                                const dayActive = courseDays.size === 0 || courseDays.has(dia);
                                                return (
                                                <motion.div
                                                    key={dia}
                                                    layoutId={`dc-${dia}`}
                                                    layout
                                                    transition={{ type:'spring', stiffness:280, damping:30, mass:0.8 }}
                                                    whileHover={dayActive ? { scale: 1.10, zIndex: 10, boxShadow:'0 16px 40px -8px rgba(0,0,0,0.22)', transition: { type:'spring', stiffness:400, damping:26 } } : {}}
                                                    style={{ borderRadius:14, position:'relative', zIndex:1, cursor: dayActive ? 'pointer' : 'default' }}
                                                    onClick={() => { if (dayActive) setFocusedDay(dia); }}
                                                >
                                                    <DayCard
                                                        dia={dia}
                                                        dateLabel={dayDates[dia]}
                                                        dateISO={dayISO[dia]}
                                                        entries={localEntries.filter(e => e.dia === dia)}
                                                        asignaturas={courseSubjects[selectedCourse] ?? []}
                                                        onAdd={(asig, txt) => addEntry(dia, asig, txt)}
                                                        onRemove={removeEntry}
                                                        isActive={dayActive}
                                                        onFocus={() => setFocusedDay(dia)}
                                                    />
                                                </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </LayoutGroup>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>

        {/* ── Modal selector de semana para exportar ── */}
        {showExportModal && (
            <div
                onClick={() => setShowExportModal(false)}
                style={{
                    position:'fixed', inset:0, zIndex:300,
                    background:'rgba(28,18,50,0.55)',
                    backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    padding:24,
                }}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        width:380, maxWidth:'calc(100vw - 48px)',
                        background:'#fff',
                        borderRadius:20,
                        boxShadow:'0 24px 60px -16px rgba(40,20,80,0.4)',
                        overflow:'hidden',
                        border:'1px solid rgba(123,91,224,0.12)',
                    }}
                >
                    {/* Banda superior degradado */}
                    <div style={{ height:5, background:'linear-gradient(90deg, #7B5BE0, #EC5BA1)' }} />

                    {/* Cabecera */}
                    <div style={{ padding:'20px 22px 16px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{
                                width:36, height:36, borderRadius:10, flexShrink:0,
                                background:'linear-gradient(135deg, #7B5BE0, #EC5BA1)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                            }}>
                                <FileDown size={16} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize:15, fontWeight:800, color:V3_TEXT_DARK }}>Exportar agenda en PDF</div>
                                <div style={{ fontSize:12, color:V3_TEXT_MUTED, marginTop:1 }}>Selecciona la semana a exportar</div>
                            </div>
                            <button
                                onClick={() => setShowExportModal(false)}
                                style={{
                                    marginLeft:'auto', width:28, height:28, borderRadius:8,
                                    border:'1px solid rgba(0,0,0,0.08)', background:V3_BG_FIELD,
                                    color:V3_TEXT_MUTED, cursor:'pointer',
                                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                                }}
                            >
                                <X size={13} strokeWidth={2.4} />
                            </button>
                        </div>
                    </div>

                    {/* Selector de semana */}
                    <div style={{ padding:'20px 22px' }}>
                        {/* Curso (solo lectura) */}
                        <div style={{
                            marginBottom:16, padding:'10px 14px', borderRadius:10,
                            background:V3_ACT_BG, border:'1px solid rgba(123,91,224,0.18)',
                            fontSize:13, fontWeight:700, color:V3_ACT_TEXT,
                            display:'flex', alignItems:'center', gap:6,
                        }}>
                            <span style={{ fontSize:11, fontWeight:600, color:'#8B7ACA', textTransform:'uppercase', letterSpacing:0.5 }}>Curso</span>
                            <span style={{ marginLeft:4 }}>{selectedCourse}</span>
                        </div>

                        {/* Navegador de semana */}
                        <div style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'12px 14px', borderRadius:12,
                            border:'1.5px solid rgba(123,91,224,0.2)',
                            background:'white',
                        }}>
                            <button
                                onClick={() => goExportWeek(-1)}
                                style={{
                                    width:30, height:30, borderRadius:8, border:'none',
                                    background:'rgba(123,91,224,0.08)', color:V3_PRIMARY,
                                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                                    flexShrink:0,
                                }}
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <div style={{ flex:1, textAlign:'center' }}>
                                <div style={{ fontSize:13, fontWeight:800, color:V3_TEXT_DARK }}>
                                    {formatWeekLabel(exportWeekStart)}
                                </div>
                                <div style={{ fontSize:11, color:V3_TEXT_MUTED, marginTop:2 }}>
                                    {getWeekOfMonthLabel(exportWeekStart)}
                                </div>
                            </div>
                            <button
                                onClick={() => goExportWeek(1)}
                                style={{
                                    width:30, height:30, borderRadius:8, border:'none',
                                    background:'rgba(123,91,224,0.08)', color:V3_PRIMARY,
                                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                                    flexShrink:0,
                                }}
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Botones */}
                    <div style={{ padding:'0 22px 20px', display:'flex', gap:8 }}>
                        <button
                            onClick={() => setShowExportModal(false)}
                            style={{
                                flex:1, padding:'10px', borderRadius:10,
                                border:'1px solid rgba(0,0,0,0.1)', background:'white',
                                color:V3_TEXT_MUTED, fontSize:13, fontWeight:700,
                                cursor:'pointer', fontFamily:'inherit',
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            style={{
                                flex:1, padding:'10px', borderRadius:10, border:'none',
                                background:'linear-gradient(135deg, #7B5BE0, #EC5BA1)',
                                color:'white', fontSize:13, fontWeight:800,
                                cursor: exporting ? 'not-allowed' : 'pointer',
                                fontFamily:'inherit', display:'flex', alignItems:'center',
                                justifyContent:'center', gap:6,
                                opacity: exporting ? 0.7 : 1,
                            }}
                        >
                            {exporting
                                ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} />
                                : <FileDown size={13} />
                            }
                            {exporting ? 'Exportando…' : 'Exportar PDF'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

// ─── Tarjeta de día (V3) ──────────────────────────────────────────────────────
function DayCard({ dia, dateLabel, dateISO, entries, asignaturas, onAdd, onRemove, onFocus, focused, isActive = true }) {
    const holiday = dateISO ? CHILE_HOLIDAYS[dateISO] : null;
    const c = isActive ? (V3_DAY_COLOR[dia] || V3_PRIMARY) : '#CBD5E1';
    // En modo enfocado el formulario arranca abierto
    const [showForm, setShowForm] = useState(() => !!focused && isActive && !holiday);
    const [form, setForm]         = useState({ asignatura: asignaturas[0] ?? '', texto: '' });
    const textareaRef = React.useRef(null);

    // Auto-resize del textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
    }, [form.texto]);

    const handleToggleForm = () => {
        if (!isActive || holiday) return;
        if (!showForm) setForm({ asignatura: asignaturas[0] ?? '', texto: '' });
        setShowForm(s => !s);
    };

    const handleAdd = () => {
        if (!form.texto.trim()) { toast.error('Escribe qué deben traer'); return; }
        onAdd(form.asignatura.trim() || 'General', form.texto.trim());
        // En modo enfocado mantener el formulario abierto para seguir agregando
        if (focused) {
            setForm(f => ({ ...f, texto: '' }));
            setTimeout(() => textareaRef.current?.focus(), 0);
        } else {
            setForm(f => ({ ...f, texto: '' }));
            setShowForm(false);
        }
    };

    return (
        <div style={{
            background: holiday ? '#FFF5F5' : isActive ? 'white' : '#F8FAFC',
            borderRadius:14,
            border: holiday ? '1.5px solid #FECACA' : !isActive ? '1.5px solid rgba(0,0,0,0.04)' : showForm ? `1.5px solid ${c}40` : '1.5px solid rgba(0,0,0,0.06)',
            display:'flex', flexDirection:'column', overflow:'hidden',
            boxShadow: isActive && showForm ? `0 6px 18px -6px ${c}40` : '0 1px 4px rgba(0,0,0,0.04)',
            transition:'all .15s',
            opacity: isActive ? 1 : 0.5,
            ...(focused ? { minHeight:320 } : {}),
        }}>
            {/* Header */}
            <div style={{
                position:'relative', padding:'10px 12px 10px 16px',
                background: holiday ? '#FEE2E220' : isActive ? `${c}08` : 'transparent',
                borderBottom:'1px solid rgba(0,0,0,0.05)',
                display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
                <div style={{ position:'absolute', left:0, top:6, bottom:6, width:3, borderRadius:2, background: holiday ? '#EF4444' : c }}/>
                <div
                    onClick={isActive && !holiday ? onFocus : undefined}
                    style={{ cursor: isActive && !holiday && onFocus ? 'pointer' : 'default' }}
                >
                    <div style={{ fontSize:13, fontWeight:800, color: holiday ? '#DC2626' : c, letterSpacing:0.6, textTransform:'uppercase' }}>
                        {focused ? DIA_LABELS[dia] : (V3_DAY_SHORT[dia] || DIA_LABELS[dia])}
                    </div>
                    {holiday ? (
                        <div style={{ fontSize:11, fontWeight:700, color:'#DC2626', marginTop:1, lineHeight:1.2 }}>{holiday}</div>
                    ) : (
                        <div style={{ fontSize:12, color:V3_TEXT_MUTED, marginTop:1 }}>{dateLabel}</div>
                    )}
                </div>
                {isActive && !holiday ? (
                    <button onClick={handleToggleForm} style={{
                        width:24, height:24, borderRadius:7, border:'none',
                        background: showForm ? `${c}20` : 'rgba(0,0,0,0.04)',
                        color: showForm ? c : V3_TEXT_SOFT,
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all .15s',
                    }}>
                        {showForm ? <X size={12}/> : <Plus size={12}/>}
                    </button>
                ) : null}
            </div>

            {/* Entries / empty state */}
            <div style={{ flex:1, padding:'8px 10px', minHeight:40 }}>
                {holiday ? (
                    <p style={{ fontSize:11, color:'#FCA5A5', textAlign:'center', padding:'10px 0' }}>Feriado</p>
                ) : !isActive ? (
                    <p style={{ fontSize:11, color:'rgba(0,0,0,0.25)', textAlign:'center', padding:'10px 0' }}>Sin clases</p>
                ) : entries.length === 0 && !showForm ? (
                    <p style={{ fontSize:12, color:'rgba(0,0,0,0.18)', textAlign:'center', padding:'10px 0' }}>Sin entradas</p>
                ) : (
                    entries.map(e => (
                        <EntryItem key={e.id} entry={e} color={c} onRemove={() => onRemove(e.id)} />
                    ))
                )}
            </div>

            {/* Add form */}
            {isActive && !holiday && showForm && (
                <div style={{
                    borderTop:'1px solid rgba(0,0,0,0.05)',
                    padding:'8px 10px',
                    background:`${c}05`,
                    display:'flex', flexDirection:'column', gap:6,
                }}>
                    {asignaturas.length > 0 ? (
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            {asignaturas.map(a => (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, asignatura: a }))}
                                    style={{
                                        padding:'4px 10px', borderRadius:20,
                                        fontSize:12, fontWeight:700, cursor:'pointer',
                                        fontFamily:'inherit', transition:'all .12s',
                                        border: form.asignatura === a ? `1.5px solid ${c}` : '1.5px solid rgba(0,0,0,0.1)',
                                        background: form.asignatura === a ? `${c}15` : 'white',
                                        color: form.asignatura === a ? c : V3_TEXT_MUTED,
                                    }}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <input
                            value={form.asignatura}
                            onChange={e => setForm(f => ({ ...f, asignatura: e.target.value }))}
                            placeholder="Asignatura…"
                            style={{
                                width:'100%', padding:'7px 9px', borderRadius:8,
                                border:'1px solid rgba(0,0,0,0.1)', background:'white',
                                fontSize:13, color:V3_TEXT_MED, outline:'none',
                                fontFamily:'inherit', boxSizing:'border-box',
                            }}
                        />
                    )}
                    <textarea
                        ref={textareaRef}
                        value={form.texto}
                        onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
                        }}
                        placeholder="Qué deben traer o hacer… (Enter para agregar, Shift+Enter nueva línea)"
                        autoFocus={focused}
                        rows={2}
                        style={{
                            width:'100%', padding:'7px 9px', borderRadius:8,
                            border:`1px solid ${c}40`, background:'white',
                            fontSize:13, color:V3_TEXT_MED, outline:'none',
                            fontFamily:'inherit', boxSizing:'border-box',
                            resize:'none', overflow:'hidden', lineHeight:1.5,
                            minHeight:56,
                        }}
                    />
                    <button onClick={handleAdd} style={{
                        width:'100%', padding:'7px', borderRadius:8, border:'none',
                        background:c, color:'white',
                        fontSize:13, fontWeight:800, cursor:'pointer',
                        fontFamily:'inherit',
                    }}>
                        Agregar
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Ítem de entrada (V3) ─────────────────────────────────────────────────────
function EntryItem({ entry, color, onRemove }) {
    const [hover, setHover] = useState(false);
    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display:'flex', alignItems:'flex-start', gap:6,
                padding:'5px 6px', borderRadius:8, marginBottom:3,
                background: hover ? 'rgba(0,0,0,0.03)' : 'transparent',
                transition:'background .12s',
            }}>
            <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:800, color: color || V3_PRIMARY, textTransform:'uppercase', letterSpacing:0.6, marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {entry.asignatura}
                </div>
                <div style={{ fontSize:13, color:V3_TEXT_DARK, lineHeight:1.4 }}>{entry.texto}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{
                padding:2, borderRadius:5, border:'none',
                background:'transparent', color:'transparent',
                cursor:'pointer', flexShrink:0, marginTop:2,
                ...(hover ? { color:'#EF4444', background:'#FEF2F2' } : {}),
                transition:'all .12s',
            }}>
                <X size={10}/>
            </button>
        </div>
    );
}


// ─── Card por curso (vista gestión) ──────────────────────────────────────────
function CourseCard({ curso, count, hasNoticia, onClick }) {
    const c = COURSE_COLORS[curso] ?? DEFAULT_COLOR;
    const hasData = count > 0;
    return (
        <button
            onClick={onClick}
            className={cn(
                'bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-all text-left w-full p-4 flex flex-col gap-2',
                hasData ? c.border : 'border-slate-100 hover:border-slate-200'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={cn('inline-flex items-center justify-center rounded-lg text-xs font-bold text-white w-9 h-7 shrink-0', hasData ? c.pill : 'bg-slate-300')}>
                    {courseAbbrev(curso)}
                </span>
                {hasData && <span className={cn('text-[11px] font-semibold tabular-nums', c.text)}>{count}</span>}
            </div>
            <p className={cn('text-xs font-semibold leading-tight', hasData ? c.text : 'text-slate-400')}>{curso}</p>
            {hasNoticia && <span className="text-[10px] text-indigo-500 font-medium">● noticia</span>}
        </button>
    );
}

// ─── Modal de detalle del curso ───────────────────────────────────────────────
function CourseModal({
    curso, weekStart, weekLabel,
    assignments, noticias, teachers, user,
    canManage, getSchedule,
    onDeleteAssignment, onDeleteNoticia, onClose,
}) {
    const c = COURSE_COLORS[curso] ?? DEFAULT_COLOR;
    const [showForm, setShowForm] = useState(false);

    const noticiasMap = useMemo(() =>
        Object.fromEntries(noticias.map(n => [n.docenteId, n]))
    , [noticias]);

    const uniqueAssignments = useMemo(() => {
        const seen = new Set();
        return assignments.filter(a => {
            if (seen.has(a.docenteId)) return false;
            seen.add(a.docenteId);
            return true;
        });
    }, [assignments]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
                <div className={cn('px-6 pt-5 pb-4 rounded-t-2xl flex items-center gap-3 shrink-0', c.light)}>
                    <span className={cn('inline-flex items-center justify-center rounded-lg text-xs font-bold text-white w-9 h-7 shrink-0', c.pill)}>
                        {courseAbbrev(curso)}
                    </span>
                    <div className="flex-1 min-w-0">
                        <h2 className={cn('text-base font-bold', c.text)}>{curso}</h2>
                        <p className="text-xs text-slate-500">{weekLabel}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
                    {uniqueAssignments.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Sin docentes asignados esta semana</p>
                    ) : (
                        uniqueAssignments.map(assignment => {
                            const noticia = noticiasMap[assignment.docenteId] ?? null;
                            const meta    = noticia ? TIPO_META[noticia.tipo]  : null;
                            const palette = meta    ? TIPO_COLORS[meta.color]  : null;
                            return (
                                <div key={assignment.id} className="space-y-2">
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <User size={14} className="text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{assignment.docenteName}</p>
                                            {assignment.asignatura && (
                                                <p className="text-xs text-slate-400 truncate max-w-[240px]">
                                                    {assignment.asignatura.split(' / ').slice(0, 2).join(' / ')}
                                                    {assignment.asignatura.split(' / ').length > 2 && ` +${assignment.asignatura.split(' / ').length - 2}`}
                                                </p>
                                            )}
                                        </div>
                                        {canManage && (
                                            <button
                                                onClick={() => onDeleteAssignment(assignment.id)}
                                                className="p-1.5 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition-all"
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                    {noticia && (
                                        <div className={cn('ml-11 rounded-xl border px-3 py-2 text-xs', palette?.bg, palette?.border)}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-1.5 min-w-0">
                                                    {meta && React.createElement(meta.icon, { size: 12, className: cn('shrink-0 mt-0.5', palette?.icon) })}
                                                    <div className="min-w-0">
                                                        <span className={cn('font-semibold', palette?.text)}>{meta?.label}</span>
                                                        <p className="text-slate-600 mt-0.5 leading-snug">{noticia.texto}</p>
                                                    </div>
                                                </div>
                                                {canManage && (
                                                    <button onClick={() => onDeleteNoticia(noticia.id)} className="p-1 rounded hover:bg-red-100 text-red-400 shrink-0">
                                                        <Trash2 size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {canManage && (
                    <div className="px-6 pb-5 pt-3 border-t border-slate-100 shrink-0">
                        {showForm ? (
                            <AddTeacherForm
                                curso={curso}
                                weekStart={weekStart}
                                teachers={teachers}
                                user={user}
                                getSchedule={getSchedule}
                                existingIds={new Set(assignments.map(a => a.docenteId))}
                                onDone={() => setShowForm(false)}
                            />
                        ) : (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-xs font-medium text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            >
                                <Plus size={13} /> Agregar docente
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Formulario inline de agregar docente ─────────────────────────────────────
function AddTeacherForm({ curso, weekStart, teachers, user, getSchedule, existingIds, onDone }) {
    const c = COURSE_COLORS[curso] ?? DEFAULT_COLOR;
    const [docenteId, setDocenteId] = useState('');
    const [nota,      setNota]      = useState('');
    const [saving,    setSaving]    = useState(false);

    const available = useMemo(() => teachers.filter(t => !existingIds.has(t.id)), [teachers, existingIds]);

    const autoAsignatura = useMemo(() => {
        if (!docenteId) return null;
        const subjects = [...new Set(
            getSchedule(docenteId).filter(b => b.course === curso && b.subject).map(b => b.subject)
        )];
        return subjects.length > 0 ? subjects.join(' / ') : null;
    }, [docenteId, curso, getSchedule]);

    const handleSave = async () => {
        if (!docenteId) { toast.error('Selecciona un docente'); return; }
        const teacher = teachers.find(t => t.id === docenteId);
        setSaving(true);
        try {
            await addDoc(collection(db, 'agenda_semanal'), {
                weekStart, curso, docenteId,
                docenteName: teacher?.name ?? '',
                asignatura: autoAsignatura ?? '',
                nota,
                createdBy: { id: user.uid, name: user.displayName || user.email },
                createdAt: serverTimestamp(),
            });
            toast.success('Docente asignado');
            onDone();
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3">
            <CustomSelect
                value={docenteId}
                onChange={val => setDocenteId(val)}
                options={available.map(t => ({ value: t.id, label: t.name }))}
                placeholder="Seleccionar docente..."
                dropUp
                buttonStyle={{
                    width: '100%', padding: '10px 12px', borderRadius: 12,
                    border: '1px solid #e2e8f0', background: 'white',
                    fontSize: 14, color: docenteId ? V3_TEXT_DARK : V3_TEXT_SOFT,
                }}
            />
            {docenteId && (
                <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-xs border',
                    autoAsignatura ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                )}>
                    <span className="font-semibold shrink-0">Asignatura:</span>
                    <span>{autoAsignatura ?? 'Sin horario registrado para este curso'}</span>
                </div>
            )}
            <input
                type="text"
                value={nota}
                onChange={e => setNota(e.target.value)}
                placeholder="Nota opcional…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-eyr-primary/40"
            />
            <div className="flex gap-2">
                <button onClick={onDone} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn('flex-1 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50', c.pill, 'hover:opacity-90')}
                >
                    {saving ? 'Guardando…' : 'Guardar'}
                </button>
            </div>
        </div>
    );
}

// ─── Modal de noticia ─────────────────────────────────────────────────────────
function NoticiaModal({ assignment, existing, weekStart, weekLabel, onClose }) {
    const c = COURSE_COLORS[assignment.curso] ?? DEFAULT_COLOR;
    const [form, setForm] = useState({ tipo: existing?.tipo ?? 'materiales', texto: existing?.texto ?? '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.texto.trim()) { toast.error('Escribe el contenido'); return; }
        setSaving(true);
        try {
            if (existing) {
                await updateDoc(doc(db, 'agenda_noticias', existing.id), {
                    tipo: form.tipo, texto: form.texto.trim(), updatedAt: serverTimestamp(),
                });
                toast.success('Noticia actualizada');
            } else {
                await addDoc(collection(db, 'agenda_noticias'), {
                    weekStart, curso: assignment.curso,
                    docenteId: assignment.docenteId,
                    docenteName: assignment.docenteName,
                    tipo: form.tipo, texto: form.texto.trim(),
                    createdAt: serverTimestamp(),
                });
                toast.success('Noticia publicada');
            }
            onClose();
        } catch { toast.error('Error al guardar'); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className={cn('px-6 pt-5 pb-4 rounded-t-2xl flex items-center gap-3', c.light)}>
                    <span className={cn('inline-flex items-center justify-center rounded-lg text-xs font-bold text-white w-9 h-7 shrink-0', c.pill)}>
                        {courseAbbrev(assignment.curso)}
                    </span>
                    <div>
                        <h2 className={cn('text-base font-bold', c.text)}>{existing ? 'Editar noticia' : 'Publicar noticia'}</h2>
                        <p className="text-xs text-slate-500">{assignment.curso} · {weekLabel}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-black/5 text-slate-400"><X size={16} /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {TIPOS_NOTICIA.map(({ value, label, icon, color }) => {
                            const p = TIPO_COLORS[color];
                            const active = form.tipo === value;
                            return (
                                <button key={value} type="button"
                                    onClick={() => setForm(f => ({ ...f, tipo: value }))}
                                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left',
                                        active ? cn(p.bg, p.border, p.text) : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                    )}
                                >
                                    {React.createElement(icon, { size: 13, className: active ? p.icon : 'text-slate-400' })}
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <textarea
                        value={form.texto}
                        onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                        rows={3}
                        placeholder="Describe lo que necesitas o quieres comunicar…"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-eyr-primary/40"
                    />
                </div>
                <div className="px-6 pb-5 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={saving}
                        className={cn('flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50', c.pill, 'hover:opacity-90')}
                    >
                        {saving ? 'Guardando…' : existing ? 'Actualizar' : 'Publicar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Empty / Skeleton ─────────────────────────────────────────────────────────
function EmptyNoCourses() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold">Sin cursos en tu horario</p>
            <p className="text-sm text-slate-400 mt-1">Contacta a UTP para registrar tu horario en el sistema.</p>
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-7 rounded-lg bg-slate-200" />
                    </div>
                    <div className="h-3 w-20 rounded bg-slate-100" />
                </div>
            ))}
        </div>
    );
}

function SkeletonDays() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-card animate-pulse overflow-hidden">
                    <div className="h-11 bg-slate-50 border-b border-slate-100" />
                    <div className="p-3 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-4/5" />
                        <div className="h-3 bg-slate-100 rounded w-3/5" />
                    </div>
                </div>
            ))}
        </div>
    );
}

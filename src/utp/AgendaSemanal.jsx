import React, { useState, useEffect, useMemo } from 'react';
import {
    collection, query, where, onSnapshot,
    addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
    setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, isAdmin, ROLES } from '../context/AuthContext';
import {
    ChevronLeft, ChevronRight, Plus, X,
    Megaphone, Package, Calendar, MessageCircle,
    CalendarRange, User, Pencil, Trash2,
    FileDown, Save, BookOpen,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { COURSES_LIST, useSchedule } from '../context/ScheduleContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ModalContainer from '../components/ModalContainer';

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
function formatWeekLabelLong(weekStart) {
    const mon = new Date(weekStart + 'T12:00:00');
    const fri = addDays(mon, 4);
    const fmtL = d => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
    const year = mon.getFullYear();
    return `${fmtL(mon)} al ${fmtL(fri)} de ${year}`;
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

    const handleDeleteAssignment = async id => {
        try { await deleteDoc(doc(db, 'agenda_semanal', id)); }
        catch { toast.error('Error al eliminar'); }
    };

    const handleDeleteNoticia = async id => {
        try { await deleteDoc(doc(db, 'agenda_noticias', id)); toast.success('Noticia eliminada'); }
        catch { toast.error('Error al eliminar'); }
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

    const [weekStart,      setWeekStart]      = useState(() => toISO(getMondayOf(new Date())));
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [localEntries,   setLocalEntries]   = useState([]);
    const [isDirty,        setIsDirty]        = useState(false);
    const [loading,        setLoading]        = useState(false);
    const [saving,         setSaving]         = useState(false);

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

    // Seleccionar el primer curso por defecto
    useEffect(() => {
        if (teacherCourses.length > 0 && !teacherCourses.includes(selectedCourse)) {
            setSelectedCourse(teacherCourses[0]);
        }
    }, [teacherCourses]); // eslint-disable-line

    // Cargar agenda guardada desde Firestore
    useEffect(() => {
        if (!selectedCourse) return;
        let cancelled = false;
        setLoading(true);
        setLocalEntries([]);
        setIsDirty(false);
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

    const goWeek = delta => {
        const d = new Date(weekStart + 'T12:00:00');
        d.setDate(d.getDate() + delta * 7);
        setWeekStart(toISO(getMondayOf(d)));
    };

    const addEntry = (dia, asignatura, texto) => {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setLocalEntries(prev => [...prev, { id, dia, asignatura, texto }]);
        setIsDirty(true);
    };

    const removeEntry = id => {
        setLocalEntries(prev => prev.filter(e => e.id !== id));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!selectedCourse || saving) return;
        setSaving(true);
        try {
            const docId = makeAgendaDocId(weekStart, user.uid, selectedCourse);
            await setDoc(doc(db, 'agenda_contenido', docId), {
                weekStart,
                curso: selectedCourse,
                docenteId: user.uid,
                docenteName: user.name || user.displayName || user.email,
                entries: localEntries,
                updatedAt: serverTimestamp(),
            });
            setIsDirty(false);
            toast.success('Agenda guardada');
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPDF = () => {
        if (!selectedCourse) return;
        exportAgendaPDF({
            weekStart,
            curso: selectedCourse,
            docenteName: user.name || user.displayName || user.email,
            entries: localEntries,
        });
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

    const col = selectedCourse ? (COURSE_COLORS[selectedCourse] ?? DEFAULT_COLOR) : DEFAULT_COLOR;

    return (
        <ModalContainer onClose={onClose} maxWidth="max-w-5xl">
            {/* Cabecera */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-800">Agenda Semanal</h2>
                    <p className="text-xs text-slate-500">Completa lo que los alumnos deben traer o hacer cada día</p>
                </div>

                {/* Navegación semana */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1">
                    <button onClick={() => goWeek(-1)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500">
                        <ChevronLeft size={15} />
                    </button>
                    <span className="text-sm font-medium text-slate-700 min-w-[165px] text-center">
                        {formatWeekLabel(weekStart)}
                    </span>
                    <button onClick={() => goWeek(1)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500">
                        <ChevronRight size={15} />
                    </button>
                </div>

                {/* Guardar */}
                <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                        isDirty
                            ? 'bg-eyr-primary text-white hover:opacity-90'
                            : 'bg-slate-100 text-slate-400 cursor-default'
                    )}
                >
                    <Save size={14} />
                    {saving ? 'Guardando…' : 'Guardar'}
                </button>

                {/* PDF */}
                <button
                    onClick={handleExportPDF}
                    disabled={!selectedCourse || localEntries.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-default"
                >
                    <FileDown size={14} />
                    PDF
                </button>

                {/* Cerrar */}
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Cuerpo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {teacherCourses.length === 0 ? (
                    <EmptyNoCourses />
                ) : (
                    <>
                        {/* Selector de curso (si hay varios) */}
                        {teacherCourses.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                {teacherCourses.map(c => {
                                    const cc = COURSE_COLORS[c] ?? DEFAULT_COLOR;
                                    const active = selectedCourse === c;
                                    return (
                                        <button
                                            key={c}
                                            onClick={() => setSelectedCourse(c)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                                                active
                                                    ? cn(cc.pill, 'text-white border-transparent shadow-sm')
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            )}
                                        >
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Badge si hay un solo curso */}
                        {teacherCourses.length === 1 && selectedCourse && (
                            <div className="flex items-center gap-2">
                                <span className={cn('inline-flex items-center justify-center rounded-lg text-xs font-bold text-white w-9 h-7', col.pill)}>
                                    {courseAbbrev(selectedCourse)}
                                </span>
                                <span className={cn('text-sm font-bold', col.text)}>{selectedCourse}</span>
                            </div>
                        )}

                        {/* Grilla de días */}
                        {loading ? (
                            <SkeletonDays />
                        ) : selectedCourse ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {DIAS.map(dia => (
                                    <DayCard
                                        key={dia}
                                        dia={dia}
                                        dateLabel={dayDates[dia]}
                                        entries={localEntries.filter(e => e.dia === dia)}
                                        asignaturas={courseSubjects[selectedCourse] ?? []}
                                        onAdd={(asig, txt) => addEntry(dia, asig, txt)}
                                        onRemove={removeEntry}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {isDirty && (
                            <p className="text-xs text-amber-600 text-right">Hay cambios sin guardar</p>
                        )}
                    </>
                )}
            </div>
        </ModalContainer>
    );
}

// ─── Tarjeta de día ───────────────────────────────────────────────────────────
function DayCard({ dia, dateLabel, entries, asignaturas, onAdd, onRemove }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState({ asignatura: '', texto: '' });

    const handleToggleForm = () => {
        if (!showForm) setForm({ asignatura: asignaturas[0] ?? '', texto: '' });
        setShowForm(s => !s);
    };

    const handleAdd = () => {
        if (!form.texto.trim()) { toast.error('Escribe qué deben traer'); return; }
        onAdd(form.asignatura.trim() || 'General', form.texto.trim());
        setForm(f => ({ ...f, texto: '' }));
        setShowForm(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
                <div>
                    <p className="text-xs font-bold text-slate-700">{DIA_LABELS[dia]}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{dateLabel}</p>
                </div>
                <button
                    onClick={handleToggleForm}
                    className={cn(
                        'p-1 rounded-lg transition-colors',
                        showForm ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                    )}
                    title={showForm ? 'Cancelar' : 'Agregar'}
                >
                    {showForm ? <X size={13} /> : <Plus size={13} />}
                </button>
            </div>

            <div className="flex-1 p-3 space-y-2">
                {entries.length === 0 && !showForm && (
                    <p className="text-[11px] text-slate-300 text-center py-4">Sin entradas</p>
                )}
                {entries.map(e => (
                    <EntryItem key={e.id} entry={e} onRemove={() => onRemove(e.id)} />
                ))}
            </div>

            {showForm && (
                <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/60">
                    {asignaturas.length > 0 ? (
                        <select
                            value={form.asignatura}
                            onChange={e => setForm(f => ({ ...f, asignatura: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-eyr-primary/40"
                        >
                            {asignaturas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    ) : (
                        <input
                            value={form.asignatura}
                            onChange={e => setForm(f => ({ ...f, asignatura: e.target.value }))}
                            placeholder="Asignatura…"
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-eyr-primary/40"
                        />
                    )}
                    <input
                        value={form.texto}
                        onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="Qué deben traer o hacer…"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-eyr-primary/40"
                        autoFocus
                    />
                    <button
                        onClick={handleAdd}
                        className="w-full py-1.5 rounded-lg bg-eyr-primary text-white text-xs font-semibold hover:opacity-90 transition-all"
                    >
                        Agregar
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Ítem de entrada ──────────────────────────────────────────────────────────
function EntryItem({ entry, onRemove }) {
    return (
        <div className="flex items-start gap-2 group rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate leading-tight">
                    {entry.asignatura}
                </p>
                <p className="text-xs text-slate-700 leading-snug mt-0.5">{entry.texto}</p>
            </div>
            <button
                onClick={onRemove}
                className="p-0.5 rounded text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-50 transition-all shrink-0 mt-1"
            >
                <X size={11} />
            </button>
        </div>
    );
}

// ─── Exportar PDF ─────────────────────────────────────────────────────────────
function exportAgendaPDF({ weekStart, curso, docenteName, entries }) {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.width;

    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageW, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('AGENDA SEMANAL', pageW / 2, 13, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text('Centro Educacional Ernesto Yañez Rivera · Huechuraba', pageW / 2, 22, { align: 'center' });

    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Semana del ${formatWeekLabelLong(weekStart)}`, 14, 40);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.text(`Curso: ${curso}`, 14, 48);
    pdf.text(`Docente: ${docenteName}`, 14, 54);
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(14, 58, pageW - 14, 58);

    const mon = new Date(weekStart + 'T12:00:00');
    const body = DIAS.map((dia, i) => {
        const d = addDays(mon, i);
        const dateStr = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
        const diaEntries = entries.filter(e => e.dia === dia);
        const content = diaEntries.length > 0
            ? diaEntries.map(e => `\u2022 ${e.asignatura}: ${e.texto}`).join('\n')
            : '\u2014';
        return [
            { content: `${DIA_LABELS[dia]}\n${dateStr}`, styles: { fontStyle: 'bold', valign: 'top' } },
            { content, styles: { valign: 'top' } },
        ];
    });

    autoTable(pdf, {
        startY: 62,
        head: [['Día', 'Qué deben traer / Actividad']],
        body,
        columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 'auto' } },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 4 },
        bodyStyles: { fontSize: 9, cellPadding: 4, lineColor: [220, 220, 220] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { lineWidth: 0.2 },
        didDrawPage: () => {
            const h = pdf.internal.pageSize.height;
            pdf.setFontSize(7);
            pdf.setTextColor(160, 160, 160);
            pdf.text(`${curso} · Semana ${formatWeekLabel(weekStart)}`, 14, h - 8);
        },
    });

    const finalY = pdf.lastAutoTable?.finalY ?? 200;
    if (finalY < 240) {
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text('Firma del apoderado: _______________________________', 14, finalY + 18);
        pdf.text('Firma del alumno/a:   _______________________________', 14, finalY + 30);
    }

    pdf.save(`Agenda ${curso} - semana ${weekStart}.pdf`);
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
            <select
                value={docenteId}
                onChange={e => setDocenteId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-eyr-primary/40"
            >
                <option value="">Seleccionar docente...</option>
                {available.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
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

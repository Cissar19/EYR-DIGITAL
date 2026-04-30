import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Plus, Pin, X,
    Clock, BookOpen, User, Pencil, Trash2, CheckCircle, XCircle, AlertCircle,
    FileDown, Loader2, NotebookPen, Users, Layers,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useAuth, canEdit } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import CrearEvaluacionModal from './CrearEvaluacionModal';
import { AgendaSemanalModal } from './AgendaSemanal';
import ModalContainer from '../components/ModalContainer';
import { CURSOS } from '../data/objetivosAprendizaje';
import { exportCalendarioPDF } from '../lib/pdfExport';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Legacy Tailwind classes — used only in EvalDetailModal & EditarFechasModal
const ASIG_COLORS = {
    MA: 'bg-blue-600 text-white',
    LE: 'bg-violet-600 text-white',
    CN: 'bg-emerald-600 text-white',
    HI: 'bg-amber-500 text-white',
    IN: 'bg-sky-500 text-white',
    EF: 'bg-orange-500 text-white',
    AV: 'bg-fuchsia-600 text-white',
    MU: 'bg-rose-600 text-white',
    TE: 'bg-slate-600 text-white',
    OR: 'bg-teal-600 text-white',
};

const ASIG_FULL = {
    MA: 'Matemática', LE: 'Lenguaje', CN: 'Ciencias Naturales', HI: 'Historia',
    IN: 'Inglés', EF: 'Ed. Física', AV: 'Artes Visuales', MU: 'Música',
    TE: 'Tecnología', OR: 'Orientación',
};

// New design color palette — mature educational colors
const SUB_COLORS = {
    MA: { color: '#2F6FE0', soft: '#E0EAFB' },
    LE: { color: '#C84B5A', soft: '#F8DEE2' },
    CN: { color: '#2E8B57', soft: '#DEEEE3' },
    HI: { color: '#B66A2C', soft: '#F4E0CC' },
    IN: { color: '#6B4FB8', soft: '#E5DEF4' },
    EF: { color: '#D9762B', soft: '#F8E1CC' },
    AV: { color: '#B83E8E', soft: '#F4D7E7' },
    MU: { color: '#7E3FAA', soft: '#EBDDF3' },
    TE: { color: '#1F8A95', soft: '#D4ECEF' },
    OR: { color: '#4D8C42', soft: '#DEEBD9' },
};

const SUBJECTS_LIST = Object.entries(ASIG_FULL).map(([key, name]) => ({ key, name }));

// Design tokens
const PRIMARY   = '#1F6F6B';
const PRIMARY_2 = '#2A8C87';
const PRIMARY_SOFT = '#DCEDEB';
const ACCENT    = '#E96C4F';
const HONEY     = '#F0B341';
const INK       = '#1F2A2E';
const INK_2     = '#4A5560';
const INK_3     = '#8A95A0';
const LINE      = '#ECE3D2';

// ─── Build Mon-Fri grid for a given year+month ────────────────────────────────
function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    const start = new Date(firstDay);
    const startDow = start.getDay();
    start.setDate(start.getDate() - (startDow === 0 ? 6 : startDow - 1));

    const end = new Date(lastDay);
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
            week.push({
                dateStr: day.toISOString().slice(0, 10),
                inMonth: day.getMonth() === month && day.getFullYear() === year,
            });
        }
        weeks.push(week);
        cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
}

// ─── Animated background ──────────────────────────────────────────────────────
function AnimatedBg() {
    return (
        <div
            aria-hidden
            style={{
                position: 'fixed', inset: 0, zIndex: 0,
                pointerEvents: 'none', overflow: 'hidden',
                background: [
                    'radial-gradient(ellipse 80% 60% at 80% 0%, #DCEDEB 0%, transparent 55%)',
                    'radial-gradient(ellipse 70% 50% at 0% 100%, #FBEDC9 0%, transparent 55%)',
                    '#FBF7F1',
                ].join(', '),
            }}
        >
            {/* Dot pattern — slow drift */}
            <div style={{
                position: 'absolute', inset: '-20%', backgroundRepeat: 'repeat', opacity: 0.55,
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='none' stroke='%231F6F6B' stroke-opacity='0.08' stroke-width='1'><circle cx='60' cy='60' r='3'/><circle cx='0' cy='0' r='2'/><circle cx='120' cy='0' r='2'/><circle cx='0' cy='120' r='2'/><circle cx='120' cy='120' r='2'/></g></svg>")`,
                animation: 'calDriftA 60s linear infinite',
            }} />
            {/* Wave pattern — slower drift */}
            <div style={{
                position: 'absolute', inset: '-20%', backgroundRepeat: 'repeat', opacity: 0.55,
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><g fill='none' stroke='%23E96C4F' stroke-opacity='0.07' stroke-width='1.2'><path d='M0,100 Q50,60 100,100 T200,100'/><path d='M0,150 Q50,110 100,150 T200,150'/><path d='M0,50 Q50,10 100,50 T200,50'/></g></svg>")`,
                animation: 'calDriftB 90s linear infinite',
            }} />
            {/* Blob 1 — teal, top-right */}
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(60px)',
                width: 480, height: 480, background: '#1F6F6B',
                top: -120, right: -120, opacity: 0.12,
                animation: 'calFloatA 18s ease-in-out infinite',
            }} />
            {/* Blob 2 — coral, bottom-center */}
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(60px)',
                width: 380, height: 380, background: '#E96C4F',
                bottom: -120, left: '20%', opacity: 0.10,
                animation: 'calFloatB 22s ease-in-out infinite',
            }} />
            {/* Blob 3 — honey, left-mid */}
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(60px)',
                width: 300, height: 300, background: '#F0B341',
                top: '40%', left: -100, opacity: 0.12,
                animation: 'calFloatC 26s ease-in-out infinite',
            }} />
        </div>
    );
}

// ─── EvalDetailModal ──────────────────────────────────────────────────────────
function EvalDetailModal({ eval: ev, onClose, onEdit, onDelete, canCRUD, onApprove, onReject }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const pending = ev.pendingChanges;
    const dateLabel = ev.date
        ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    return (
        <ModalContainer onClose={onClose} maxWidth="max-w-lg">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0">
                <div className="flex-1 pr-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 ${ASIG_COLORS[ev.asignatura] || 'bg-slate-100 text-slate-600'}`}>
                        {ASIG_FULL[ev.asignatura] || ev.asignatura}
                    </div>
                    <h2 className="text-xl font-headline font-extrabold text-eyr-on-surface tracking-tight leading-tight">{ev.name}</h2>
                    <p className="text-sm text-inst-navy font-semibold mt-1 capitalize">{dateLabel}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-red-50 text-eyr-on-variant hover:text-red-500 transition-all shrink-0">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="px-8 py-4 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-eyr-surface-low">
                    <BookOpen className="w-4 h-4 text-inst-navy shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-eyr-on-variant">Curso</p>
                        <p className="text-sm font-semibold text-eyr-on-surface">{ev.curso}</p>
                    </div>
                </div>

                {ev.slots && ev.slots.length > 0 && (
                    <div className="p-4 rounded-2xl bg-eyr-surface-low space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-inst-navy shrink-0" />
                            <p className="text-xs font-bold text-eyr-on-variant">Horario</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ev.slots.map((s, i) => (
                                <div key={i} className="flex flex-col px-3 py-2 rounded-xl bg-white border border-eyr-outline-variant/20">
                                    <span className="text-xs font-extrabold text-inst-navy">{s.day}</span>
                                    <span className="text-xs font-semibold text-eyr-on-surface">{s.label}</span>
                                    {s.startTime && <span className="text-[11px] text-eyr-on-variant/60">{s.startTime}{s.endTime ? `–${s.endTime}` : ''}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {ev.oaCodes && ev.oaCodes.length > 0 && (
                    <div className="p-4 rounded-2xl bg-eyr-surface-low space-y-2">
                        <p className="text-xs font-bold text-eyr-on-variant">OA a evaluar</p>
                        <div className="flex flex-wrap gap-1.5">
                            {ev.oaCodes.map(code => (
                                <span key={code} className="px-2.5 py-1 rounded-lg bg-inst-navy/10 text-inst-navy text-xs font-bold">
                                    {code.split('-').pop()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {ev.createdBy?.name && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-eyr-surface-low">
                        <User className="w-4 h-4 text-eyr-on-variant shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-eyr-on-variant">Creado por</p>
                            <p className="text-sm font-semibold text-eyr-on-surface">{ev.createdBy.name}</p>
                        </div>
                    </div>
                )}

                {pending && (
                    <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 space-y-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <p className="text-sm font-bold text-amber-700">Cambios pendientes de aprobación</p>
                        </div>
                        {pending.name && pending.name !== ev.name && (
                            <div>
                                <p className="text-xs font-bold text-amber-600 mb-0.5">Nuevo título</p>
                                <p className="text-sm font-semibold text-amber-900">{pending.name}</p>
                            </div>
                        )}
                        {pending.oaCodes?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-amber-600 mb-1">Nuevos OA</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {pending.oaCodes.map(code => (
                                        <span key={code} className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 text-xs font-bold">
                                            {code.split('-').pop()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {pending.slots?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-amber-600 mb-1">Nuevo horario</p>
                                <div className="flex flex-wrap gap-2">
                                    {pending.slots.map((s, i) => (
                                        <div key={i} className="px-3 py-1.5 rounded-xl bg-amber-200 text-amber-900 text-xs font-semibold">
                                            {s.day} · {s.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {pending.submittedBy?.name && (
                            <p className="text-xs text-amber-600">Propuesto por <strong>{pending.submittedBy.name}</strong></p>
                        )}
                        {canCRUD && (
                            <div className="flex gap-2 pt-1">
                                <button onClick={onApprove} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all">
                                    <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                                </button>
                                <button onClick={onReject} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-bold hover:bg-red-200 transition-all">
                                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                                </button>
                            </div>
                        )}
                        {!canCRUD && (
                            <p className="text-xs text-amber-500 italic">En revisión por la jefa UTP.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="p-6 bg-eyr-surface-mid shrink-0 flex items-center gap-3">
                {canCRUD && !confirmDelete && (
                    <>
                        <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all">
                            <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                        <button onClick={onEdit} className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-inst-navy hover:bg-inst-navy/10 transition-all">
                            <Pencil className="w-4 h-4" /> Editar
                        </button>
                    </>
                )}
                {confirmDelete && (
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-semibold text-red-600 flex-1">¿Eliminar esta evaluación?</span>
                        <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-eyr-on-variant hover:bg-eyr-surface-high transition-all">
                            Cancelar
                        </button>
                        <button onClick={onDelete} className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all">
                            Sí, eliminar
                        </button>
                    </div>
                )}
                {!confirmDelete && (
                    <button onClick={onClose} className="ml-auto px-6 py-3 rounded-2xl font-bold text-eyr-on-variant hover:bg-eyr-surface-high transition-all">
                        Cerrar
                    </button>
                )}
            </div>
        </ModalContainer>
    );
}

// ─── EditarFechasModal ────────────────────────────────────────────────────────
function EditarFechasModal({ evaluaciones, user, canCRUD, onEdit, onClose }) {
    const myEvals = canCRUD
        ? [...evaluaciones].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        : evaluaciones.filter(e => e.createdBy?.id === user.uid).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return (
        <ModalContainer onClose={onClose} maxWidth="max-w-xl">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0">
                <div>
                    <h2 className="text-2xl font-headline font-extrabold text-eyr-on-surface tracking-tight">Editar fechas</h2>
                    <p className="text-sm text-eyr-on-variant mt-0.5">
                        {canCRUD ? 'Todas las evaluaciones programadas' : 'Tus evaluaciones programadas'}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-red-50 text-eyr-on-variant hover:text-red-500 transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="px-8 py-4 overflow-y-auto space-y-2">
                {myEvals.length === 0 && (
                    <p className="text-sm text-eyr-on-variant text-center py-8">No hay evaluaciones programadas.</p>
                )}
                {myEvals.map(ev => {
                    const dateLabel = ev.date
                        ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
                        : '—';
                    return (
                        <div key={ev.id} className="flex items-center gap-3 p-3 rounded-2xl bg-eyr-surface-low hover:bg-eyr-surface-high transition-colors">
                            <div className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-extrabold ${ASIG_COLORS[ev.asignatura] || 'bg-slate-100 text-slate-600'}`}>
                                {ev.curso}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-eyr-on-surface truncate">{ev.name}</p>
                                <p className="text-xs text-eyr-on-variant capitalize">{dateLabel} · {ASIG_FULL[ev.asignatura] || ev.asignatura}</p>
                            </div>
                            {ev.pendingChanges && (
                                <span title="Cambios pendientes">
                                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                </span>
                            )}
                            <button
                                onClick={() => onEdit(ev)}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-inst-navy hover:bg-inst-navy/10 transition-all"
                            >
                                <Pencil className="w-3.5 h-3.5" /> Editar
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 bg-eyr-surface-mid shrink-0">
                <button onClick={onClose} className="w-full px-6 py-3 rounded-2xl font-bold text-eyr-on-variant hover:bg-eyr-surface-high transition-all">
                    Cerrar
                </button>
            </div>
        </ModalContainer>
    );
}

// ─── Pill selector (curso / mes) ──────────────────────────────────────────────
function PillSelector({ value, label, onPrev, onNext, canPrev, canNext, onOpen, isOpen, dropdownRef, bg, children }) {
    return (
        <div
            className="flex items-center gap-1 p-1 rounded-full"
            style={{ background: bg, boxShadow: `0 4px 12px -6px ${bg}` }}
        >
            <button
                onClick={onPrev}
                disabled={!canPrev}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'rgba(255,255,255,0.8)' }}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={onOpen}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/15 transition-colors"
                    style={{ color: '#fff', fontWeight: 600, fontSize: 13, minWidth: label === 'mes' ? 160 : 130 }}
                >
                    <span className="flex-1 text-center">{value}</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border overflow-hidden z-50"
                            style={{ borderColor: LINE }}
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button
                onClick={onNext}
                disabled={!canNext}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'rgba(255,255,255,0.8)' }}
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CalendarioEvaluaciones() {
    const { user } = useAuth();
    const { evaluaciones, deleteEvaluacion, approvePendingChanges, rejectPendingChanges } = useEvaluaciones();
    const canCreateEval = canEdit(user) || user?.role === 'teacher' || user?.role === 'utp_head';
    const canCRUD = canEdit(user) || user?.role === 'utp_head';
    const isTeacher = user?.role === 'teacher';

    const [selectedDate, setSelectedDate]         = useState(null);
    const [showFijar, setShowFijar]               = useState(false);
    const [showAgenda, setShowAgenda]             = useState(false);
    const [evalModal, setEvalModal]               = useState(null);
    const [selectedAsignatura, setSelectedAsignatura] = useState(null);

    const today        = useMemo(() => new Date(), []);
    const todayStr     = useMemo(() => today.toISOString().slice(0, 10), [today]);
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth();

    const availableMonths = useMemo(() => {
        const months = [];
        for (let m = currentMonth; m <= 11; m++) {
            months.push({ value: m, label: `${MESES[m]} ${currentYear}` });
        }
        return months;
    }, [currentMonth, currentYear]);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedCurso, setSelectedCurso] = useState(null);
    const [exportingPdf, setExportingPdf]   = useState(false);

    const weeks = useMemo(() => buildMonthGrid(currentYear, selectedMonth), [currentYear, selectedMonth]);

    const relevantEvals = useMemo(() => {
        if (canCRUD) return evaluaciones;
        return evaluaciones.filter(e => e.createdBy?.id === user?.uid);
    }, [evaluaciones, canCRUD, user?.uid]);

    const filteredEvals = useMemo(() => {
        let evs = selectedCurso ? relevantEvals.filter(e => e.curso === selectedCurso) : relevantEvals;
        if (selectedAsignatura) evs = evs.filter(e => e.asignatura === selectedAsignatura);
        return evs;
    }, [relevantEvals, selectedCurso, selectedAsignatura]);

    const evalsByDate = useMemo(() => {
        const map = {};
        filteredEvals.forEach(e => {
            if (!e.date) return;
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [filteredEvals]);

    // Stats for the selected month
    const stats = useMemo(() => {
        const pfx = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const monthEvs = relevantEvals.filter(e => e.date?.startsWith(pfx));

        const mon = new Date(today);
        const dow = mon.getDay();
        mon.setDate(mon.getDate() - (dow === 0 ? 6 : dow - 1));
        const weekStart = mon.toISOString().slice(0, 10);
        const fri = new Date(mon);
        fri.setDate(fri.getDate() + 4);
        const weekEnd = fri.toISOString().slice(0, 10);

        return {
            total:       monthEvs.length,
            semana:      monthEvs.filter(e => e.date >= weekStart && e.date <= weekEnd).length,
            cursos:      new Set(monthEvs.map(e => e.curso)).size,
            asignaturas: new Set(monthEvs.map(e => e.asignatura)).size,
        };
    }, [relevantEvals, selectedMonth, currentYear, today]);

    const canGoPrev = selectedMonth > currentMonth;
    const canGoNext = selectedMonth < 11;

    const [dropdownOpen, setDropdownOpen]         = useState(false);
    const [cursoDropdownOpen, setCursoDropdownOpen] = useState(false);
    const dropdownRef     = useRef(null);
    const cursoDropdownRef = useRef(null);

    const cursoOptions = useMemo(() => [null, ...CURSOS], []);
    const cursoIdx     = cursoOptions.indexOf(selectedCurso);
    const canPrevCurso = cursoIdx > 0;
    const canNextCurso = cursoIdx < cursoOptions.length - 1;

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
            if (cursoDropdownRef.current && !cursoDropdownRef.current.contains(e.target)) setCursoDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative flex-1 min-h-0 overflow-y-auto">
            <AnimatedBg />

            <div className="relative z-10 p-6 md:p-10 pb-16 max-w-7xl mx-auto space-y-5">

                {/* ── Page header ────────────────────────────────────────── */}
                <div className="flex items-start gap-4">
                    <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_2})`,
                        boxShadow: `0 8px 20px -8px ${PRIMARY}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                    }}>
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h1 className="font-headline text-[28px] leading-tight font-bold" style={{ color: INK, letterSpacing: '-0.5px' }}>
                            Calendario de Evaluaciones
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: INK_2 }}>
                            {canCreateEval ? 'Haz clic en un día para programar una evaluación' : 'Vista general de evaluaciones programadas'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {isTeacher && (
                            <button
                                onClick={() => setShowAgenda(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px active:translate-y-0"
                                style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK_2, boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                            >
                                <NotebookPen className="w-4 h-4" />
                                Agenda Semanal
                            </button>
                        )}
                        <button
                            onClick={async () => {
                                setExportingPdf(true);
                                try {
                                    await exportCalendarioPDF({
                                        evaluaciones: filteredEvals,
                                        selectedCurso,
                                        mesLabel: `${MESES[selectedMonth]} ${currentYear}`,
                                        year: currentYear,
                                        month: selectedMonth,
                                    });
                                } finally {
                                    setExportingPdf(false);
                                }
                            }}
                            disabled={exportingPdf}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-60"
                            style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK_2, boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                        >
                            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                            PDF
                        </button>
                        {canCreateEval && (
                            <>
                                <button
                                    onClick={() => setEvalModal({ type: 'list' })}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
                                    style={{ background: '#fff', border: `1.5px solid ${PRIMARY}`, color: PRIMARY, boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                                >
                                    <Pencil className="w-4 h-4" /> Editar fechas
                                </button>
                                <button
                                    onClick={() => setShowFijar(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-px active:translate-y-0"
                                    style={{ background: HONEY, color: '#2a1f04', boxShadow: `0 6px 14px -6px ${HONEY}` }}
                                >
                                    <Pin className="w-4 h-4" /> Fijar una prueba
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Filter row ─────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    {canCreateEval && (
                        <PillSelector
                            label="curso"
                            value={selectedCurso ?? 'Todos los cursos'}
                            bg={PRIMARY}
                            canPrev={canPrevCurso}
                            canNext={canNextCurso}
                            onPrev={() => canPrevCurso && setSelectedCurso(cursoOptions[cursoIdx - 1])}
                            onNext={() => canNextCurso && setSelectedCurso(cursoOptions[cursoIdx + 1])}
                            isOpen={cursoDropdownOpen}
                            onOpen={() => setCursoDropdownOpen(o => !o)}
                            dropdownRef={cursoDropdownRef}
                        >
                            {cursoOptions.map((c) => (
                                <button
                                    key={c ?? '__todos__'}
                                    onClick={() => { setSelectedCurso(c); setCursoDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                    style={c === selectedCurso ? { background: PRIMARY, color: '#fff' } : { color: INK }}
                                >
                                    {c ?? 'Todos los cursos'}
                                </button>
                            ))}
                        </PillSelector>
                    )}

                    <PillSelector
                        label="mes"
                        value={`${MESES[selectedMonth]} ${currentYear}`}
                        bg={ACCENT}
                        canPrev={canGoPrev}
                        canNext={canGoNext}
                        onPrev={() => canGoPrev && setSelectedMonth(m => m - 1)}
                        onNext={() => canGoNext && setSelectedMonth(m => m + 1)}
                        isOpen={dropdownOpen}
                        onOpen={() => setDropdownOpen(o => !o)}
                        dropdownRef={dropdownRef}
                    >
                        {availableMonths.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => { setSelectedMonth(value); setDropdownOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                style={value === selectedMonth ? { background: ACCENT, color: '#fff' } : { color: INK }}
                            >
                                {label}
                            </button>
                        ))}
                    </PillSelector>
                </div>

                {/* ── Calendar grid ──────────────────────────────────────── */}
                <div
                    className="rounded-3xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: `1px solid ${LINE}`,
                        boxShadow: '0 6px 18px -6px rgba(31,42,46,.10), 0 2px 6px rgba(31,42,46,.04)',
                    }}
                >
                    {/* Day headers */}
                    <div
                        className="grid grid-cols-5"
                        style={{ background: 'rgba(251,247,241,0.9)', borderBottom: `1px solid ${LINE}` }}
                    >
                        {DIAS.map(d => (
                            <div
                                key={d}
                                className="px-4 py-3 text-left"
                                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_2 }}
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Empty state */}
                    {selectedCurso && filteredEvals.length === 0 && (
                        <div className="py-16 flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: PRIMARY_SOFT, color: PRIMARY }}>
                                <CalendarDays className="w-7 h-7" />
                            </div>
                            <p className="text-base font-bold" style={{ color: PRIMARY }}>Sin evaluaciones en {selectedCurso}</p>
                            <p className="text-sm" style={{ color: INK_3 }}>No hay evaluaciones agendadas para este mes</p>
                        </div>
                    )}

                    {/* Weeks */}
                    {weeks.map((week, wi) => (
                        <div
                            key={wi}
                            className="grid grid-cols-5"
                            style={wi < weeks.length - 1 ? { borderBottom: `1px solid ${LINE}` } : {}}
                        >
                            {week.map(({ dateStr, inMonth }, di) => {
                                const isPast    = dateStr < todayStr;
                                const isToday   = dateStr === todayStr;
                                const evals     = evalsByDate[dateStr] || [];
                                const dayNum    = parseInt(dateStr.split('-')[2]);
                                const clickable = inMonth && !isPast && canCreateEval;
                                const dimmed    = !inMonth;

                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => clickable && setSelectedDate(dateStr)}
                                        className="group transition-colors flex flex-col"
                                        style={{
                                            minHeight: 118,
                                            padding: '10px 12px 12px',
                                            borderRight: di < 4 ? `1px solid ${LINE}` : 'none',
                                            cursor: clickable ? 'pointer' : 'default',
                                            background: dimmed
                                                ? 'rgba(244,236,223,0.7)'
                                                : isPast
                                                    ? 'rgba(251,247,241,0.5)'
                                                    : isToday
                                                        ? 'rgba(220,237,235,0.55)'
                                                        : 'rgba(255,255,255,0.35)',
                                        }}
                                    >
                                        {/* Day number */}
                                        <div
                                            className="mb-1.5 shrink-0"
                                            style={
                                                isToday
                                                    ? {
                                                        width: 26, height: 26, borderRadius: '50%',
                                                        background: PRIMARY, color: '#fff',
                                                        display: 'grid', placeItems: 'center',
                                                        fontSize: 13, fontWeight: 700, marginLeft: -3,
                                                    }
                                                    : {
                                                        fontSize: 13,
                                                        fontWeight: dimmed ? 400 : 600,
                                                        color: dimmed || isPast ? INK_3 : INK_2,
                                                    }
                                            }
                                        >
                                            {dayNum}
                                        </div>

                                        {/* Event chips */}
                                        <div className="flex flex-col gap-1 flex-1">
                                            {evals.slice(0, 3).map(e => {
                                                const sc = SUB_COLORS[e.asignatura];
                                                return (
                                                    <button
                                                        key={e.id}
                                                        type="button"
                                                        onClick={(ev) => { ev.stopPropagation(); setEvalModal({ type: 'detail', data: e }); }}
                                                        className="w-full flex items-center gap-1.5 text-left transition-transform hover:translate-x-0.5 active:scale-95"
                                                        title={`${e.curso} · ${e.name}`}
                                                        style={{
                                                            padding: '5px 8px',
                                                            borderRadius: 7,
                                                            fontSize: 11.5,
                                                            fontWeight: 600,
                                                            lineHeight: 1.2,
                                                            background: sc?.soft || '#f1f5f9',
                                                            color: sc?.color || '#475569',
                                                            borderLeft: `3px solid ${sc?.color || '#94a3b8'}`,
                                                        }}
                                                    >
                                                        <span
                                                            className="rounded-full shrink-0"
                                                            style={{ width: 6, height: 6, background: sc?.color || '#94a3b8', flexShrink: 0 }}
                                                        />
                                                        <span className="truncate">{e.name}</span>
                                                        {e.pendingChanges && (
                                                            <span
                                                                className="ml-auto shrink-0"
                                                                title="Cambios pendientes"
                                                                style={{ width: 6, height: 6, borderRadius: '50%', background: HONEY, border: '1.5px solid rgba(255,255,255,0.8)', flexShrink: 0 }}
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                            {evals.length > 3 && (
                                                <span style={{ fontSize: 11, color: INK_3, fontWeight: 600, padding: '2px 4px' }}>
                                                    +{evals.length - 3} más
                                                </span>
                                            )}
                                            {clickable && evals.length === 0 && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto flex items-center gap-1 text-xs" style={{ color: PRIMARY }}>
                                                    <Plus className="w-3 h-3" /> Agregar
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* ── Subject legend — filter chips ──────────────────────── */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedAsignatura(null)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:-translate-y-px"
                        style={!selectedAsignatura
                            ? { background: INK, color: '#fff', border: '1px solid transparent', boxShadow: '0 2px 8px -2px rgba(31,42,46,.35)' }
                            : { background: 'rgba(255,255,255,0.8)', color: INK_2, border: `1px solid ${LINE}` }
                        }
                    >
                        <span className="w-2 h-2 rounded-full" style={{ background: !selectedAsignatura ? '#fff' : INK_3 }} />
                        Todas
                    </button>
                    {SUBJECTS_LIST.map(s => {
                        const sc     = SUB_COLORS[s.key];
                        const active = selectedAsignatura === s.key;
                        return (
                            <button
                                key={s.key}
                                onClick={() => setSelectedAsignatura(active ? null : s.key)}
                                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:-translate-y-px"
                                style={active
                                    ? { background: sc?.color, color: '#fff', border: '1px solid transparent', boxShadow: `0 2px 8px -2px ${sc?.color}` }
                                    : { background: 'rgba(255,255,255,0.8)', color: INK_2, border: `1px solid ${LINE}` }
                                }
                            >
                                <span className="w-2 h-2 rounded-full" style={{ background: active ? '#fff' : sc?.color }} />
                                {s.name}
                            </button>
                        );
                    })}
                </div>

                {/* ── Stats strip ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { num: stats.total,       label: 'Evaluaciones este mes', bg: PRIMARY_SOFT,  color: PRIMARY,    icon: <CalendarDays className="w-5 h-5" /> },
                        { num: stats.semana,      label: 'Esta semana',           bg: '#FBE4DB',     color: ACCENT,     icon: <Clock className="w-5 h-5" /> },
                        { num: stats.cursos,      label: 'Cursos activos',        bg: '#FBEDC9',     color: '#B86A00',  icon: <Users className="w-5 h-5" /> },
                        { num: stats.asignaturas, label: 'Asignaturas',           bg: '#DEEEE3',     color: '#2E8B57',  icon: <Layers className="w-5 h-5" /> },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 rounded-2xl p-4"
                            style={{
                                background: 'rgba(255,255,255,0.72)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: `1px solid ${LINE}`,
                                boxShadow: '0 1px 2px rgba(31,42,46,.04)',
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: item.bg, color: item.color }}
                            >
                                {item.icon}
                            </div>
                            <div>
                                <div className="font-headline text-2xl leading-none font-bold" style={{ color: INK }}>{item.num}</div>
                                <div className="text-xs mt-1" style={{ color: INK_2 }}>{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Modals ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showAgenda && (
                    <AgendaSemanalModal user={user} onClose={() => setShowAgenda(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedDate && (
                    <CrearEvaluacionModal
                        onClose={() => setSelectedDate(null)}
                        onCreated={() => setSelectedDate(null)}
                        user={user}
                        defaultDate={selectedDate}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFijar && (
                    <CrearEvaluacionModal
                        onClose={() => setShowFijar(false)}
                        onCreated={() => setShowFijar(false)}
                        user={user}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {evalModal?.type === 'detail' ? (
                    <EvalDetailModal
                        key="detail"
                        eval={evalModal.data}
                        onClose={() => setEvalModal(null)}
                        canCRUD={canCRUD}
                        onEdit={() => setEvalModal({ type: 'edit', data: evalModal.data })}
                        onDelete={async () => { await deleteEvaluacion(evalModal.data.id); setEvalModal(null); }}
                        onApprove={async () => { await approvePendingChanges(evalModal.data.id, evalModal.data.pendingChanges); setEvalModal(null); }}
                        onReject={async () => { await rejectPendingChanges(evalModal.data.id); setEvalModal(null); }}
                    />
                ) : evalModal?.type === 'list' ? (
                    <EditarFechasModal
                        key="list"
                        evaluaciones={evaluaciones}
                        user={user}
                        canCRUD={canCRUD}
                        onEdit={(ev) => setEvalModal({ type: 'edit', data: ev })}
                        onClose={() => setEvalModal(null)}
                    />
                ) : evalModal?.type === 'edit' ? (
                    <CrearEvaluacionModal
                        key={`edit-${evalModal.data.id}`}
                        onClose={() => setEvalModal(null)}
                        onCreated={() => setEvalModal(null)}
                        user={user}
                        evalId={evalModal.data.id}
                        initialData={evalModal.data}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    );
}

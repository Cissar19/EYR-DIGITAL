import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Plus, Pin, X, Clock, BookOpen, User, Pencil, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, canEdit } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import CrearEvaluacionModal from './CrearEvaluacionModal';
import ModalContainer from '../components/ModalContainer';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

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

const ASIG_SHORT = {
    MA: 'Mate', LE: 'Leng', CN: 'C.N.', HI: 'Hist', IN: 'Ing',
    EF: 'Ed.F', AV: 'Arte', MU: 'Mús', TE: 'Tec', OR: 'Orien',
};

const ASIG_FULL = {
    MA: 'Matemática', LE: 'Lenguaje', CN: 'Ciencias Naturales', HI: 'Historia',
    IN: 'Inglés', EF: 'Ed. Física', AV: 'Artes Visuales', MU: 'Música',
    TE: 'Tecnología', OR: 'Orientación',
};

function EvalDetailModal({ eval: ev, onClose, onEdit, onDelete, canCRUD, onApprove, onReject }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const pending = ev.pendingChanges;
    const dateLabel = ev.date
        ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    return (
        <ModalContainer onClose={onClose} maxWidth="max-w-lg">
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0">
                <div className="flex-1 pr-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 ${ASIG_COLORS[ev.asignatura] || 'bg-slate-100 text-slate-600'}`}>
                        {ASIG_FULL[ev.asignatura] || ev.asignatura}
                    </div>
                    <h2 className="text-xl font-headline font-extrabold text-eyr-on-surface tracking-tight leading-tight">{ev.name}</h2>
                    <p className="text-sm text-eyr-primary font-semibold mt-1 capitalize">{dateLabel}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-red-50 text-eyr-on-variant hover:text-red-500 transition-all shrink-0">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="px-8 py-4 overflow-y-auto space-y-4">
                {/* Curso */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-eyr-surface-low">
                    <BookOpen className="w-4 h-4 text-eyr-primary shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-eyr-on-variant">Curso</p>
                        <p className="text-sm font-semibold text-eyr-on-surface">{ev.curso}</p>
                    </div>
                </div>

                {/* Horario */}
                {ev.slots && ev.slots.length > 0 && (
                    <div className="p-4 rounded-2xl bg-eyr-surface-low space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-eyr-primary shrink-0" />
                            <p className="text-xs font-bold text-eyr-on-variant">Horario</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ev.slots.map((s, i) => (
                                <div key={i} className="flex flex-col px-3 py-2 rounded-xl bg-white border border-eyr-outline-variant/20">
                                    <span className="text-xs font-extrabold text-eyr-primary">{s.day}</span>
                                    <span className="text-xs font-semibold text-eyr-on-surface">{s.label}</span>
                                    {s.startTime && <span className="text-[11px] text-eyr-on-variant/60">{s.startTime}{s.endTime ? `–${s.endTime}` : ''}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* OA */}
                {ev.oaCodes && ev.oaCodes.length > 0 && (
                    <div className="p-4 rounded-2xl bg-eyr-surface-low space-y-2">
                        <p className="text-xs font-bold text-eyr-on-variant">OA a evaluar</p>
                        <div className="flex flex-wrap gap-1.5">
                            {ev.oaCodes.map(code => (
                                <span key={code} className="px-2.5 py-1 rounded-lg bg-eyr-primary/10 text-eyr-primary text-xs font-bold">
                                    {code.split('-').pop()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Creado por */}
                {ev.createdBy?.name && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-eyr-surface-low">
                        <User className="w-4 h-4 text-eyr-on-variant shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-eyr-on-variant">Creado por</p>
                            <p className="text-sm font-semibold text-eyr-on-surface">{ev.createdBy.name}</p>
                        </div>
                    </div>
                )}

                {/* Cambios pendientes */}
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
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
                        >
                            <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-eyr-primary hover:bg-eyr-primary-container/20 transition-all"
                        >
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
                    <button
                        onClick={onClose}
                        className="ml-auto px-6 py-3 rounded-2xl font-bold text-eyr-on-variant hover:bg-eyr-surface-high transition-all"
                    >
                        Cerrar
                    </button>
                )}
            </div>
        </ModalContainer>
    );
}

// Build Mon-Fri week grid for a given year+month (0-indexed)
function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday of the week containing the first day
    const start = new Date(firstDay);
    const startDow = start.getDay();
    start.setDate(start.getDate() - (startDow === 0 ? 6 : startDow - 1));

    // Friday of the week containing the last day
    const end = new Date(lastDay);
    const endDow = end.getDay();
    if (endDow === 0) end.setDate(end.getDate() - 2);
    else if (endDow === 6) end.setDate(end.getDate() - 1);
    else if (endDow < 5) end.setDate(end.getDate() + (5 - endDow));

    const weeks = [];
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
                                onClick={() => { onEdit(ev); onClose(); }}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-eyr-primary hover:bg-eyr-primary-container/20 transition-all"
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

export default function CalendarioEvaluaciones() {
    const { user } = useAuth();
    const { evaluaciones, deleteEvaluacion, approvePendingChanges, rejectPendingChanges } = useEvaluaciones();
    const canCreateEval = canEdit(user) || user?.role === 'teacher' || user?.role === 'utp_head';
    const canCRUD = canEdit(user) || user?.role === 'utp_head';
    const [selectedDate, setSelectedDate] = useState(null);
    const [showFijar, setShowFijar] = useState(false);
    const [showEditarFechas, setShowEditarFechas] = useState(false);
    const [selectedEval, setSelectedEval] = useState(null);
    const [editEval, setEditEval] = useState(null);

    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => today.toISOString().slice(0, 10), [today]);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Available months from current to December
    const availableMonths = useMemo(() => {
        const months = [];
        for (let m = currentMonth; m <= 11; m++) {
            months.push({ value: m, label: `${MESES[m]} ${currentYear}` });
        }
        return months;
    }, [currentMonth, currentYear]);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const weeks = useMemo(() => buildMonthGrid(currentYear, selectedMonth), [currentYear, selectedMonth]);

    const evalsByDate = useMemo(() => {
        const map = {};
        evaluaciones.forEach(e => {
            if (!e.date) return;
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [evaluaciones]);

    const canGoPrev = selectedMonth > currentMonth;
    const canGoNext = selectedMonth < 11;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-2.5 bg-eyr-primary-container/40 rounded-xl shrink-0">
                        <CalendarDays className="w-6 h-6 text-eyr-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-eyr-on-surface font-headline">Calendario de Evaluaciones</h1>
                        <p className="text-sm text-eyr-on-variant">
                            {canCreateEval ? 'Haz clic en un día para programar una evaluación' : 'Vista general de evaluaciones programadas'}
                        </p>
                    </div>
                </div>

                {canCreateEval && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowEditarFechas(true)}
                            className="flex items-center gap-2 bg-white border border-eyr-primary text-eyr-primary px-5 py-3 rounded-xl hover:bg-eyr-primary-container/20 transition-all shadow-sm text-sm font-semibold"
                        >
                            <Pencil className="w-4 h-4" /> Editar fechas
                        </button>
                        <button
                            onClick={() => setShowFijar(true)}
                            className="flex items-center gap-2 bg-eyr-primary text-white px-5 py-3 rounded-xl hover:bg-eyr-primary-dim transition-all shadow-sm text-sm font-semibold"
                        >
                            <Pin className="w-4 h-4" /> Fijar una prueba
                        </button>
                    </div>
                )}

                {/* Month selector */}
                <div className="flex items-center gap-1 shrink-0 bg-eyr-primary rounded-2xl p-1 shadow-md shadow-eyr-primary/30">
                    <button
                        onClick={() => canGoPrev && setSelectedMonth(m => m - 1)}
                        disabled={!canGoPrev}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Custom dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(o => !o)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                            style={{ minWidth: '190px' }}
                        >
                            <span className="flex-1 text-center text-base font-bold text-white">
                                {MESES[selectedMonth]} {currentYear}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-white/80 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-eyr-outline-variant/10 overflow-hidden z-50"
                                >
                                    {availableMonths.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            onClick={() => { setSelectedMonth(value); setDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors
                                                ${value === selectedMonth
                                                    ? 'bg-eyr-primary text-white'
                                                    : 'text-eyr-on-surface hover:bg-eyr-surface-high'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => canGoNext && setSelectedMonth(m => m + 1)}
                        disabled={!canGoNext}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="bg-white rounded-3xl border border-eyr-outline-variant/10 overflow-hidden shadow-sm">
                {/* Day headers */}
                <div className="grid grid-cols-5 border-b border-eyr-outline-variant/10">
                    {DIAS.map(d => (
                        <div key={d} className="px-4 py-3 text-center text-xs font-bold text-eyr-on-variant uppercase tracking-wider bg-eyr-surface-high/40">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div key={wi} className={`grid grid-cols-5 ${wi < weeks.length - 1 ? 'border-b border-eyr-outline-variant/10' : ''}`}>
                        {week.map(({ dateStr, inMonth }) => {
                            const isPast = dateStr < todayStr;
                            const isToday = dateStr === todayStr;
                            const evals = evalsByDate[dateStr] || [];
                            const dayNum = parseInt(dateStr.split('-')[2]);
                            const clickable = inMonth && !isPast && canCreateEval;
                            const dimmed = !inMonth;

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => clickable && setSelectedDate(dateStr)}
                                    className={`min-h-[140px] p-3 border-r last:border-r-0 border-eyr-outline-variant/10 group transition-colors flex flex-col gap-1.5
                                        ${dimmed ? 'bg-slate-50/60' : isPast ? 'bg-slate-50/30' : isToday ? 'bg-indigo-50/50' : 'bg-white'}
                                        ${clickable ? 'cursor-pointer hover:bg-eyr-primary-container/10' : ''}
                                    `}
                                >
                                    {/* Day number */}
                                    <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition-colors
                                        ${isToday ? 'bg-eyr-primary text-white' : dimmed ? 'text-slate-300' : isPast ? 'text-slate-300' : 'text-eyr-on-surface'}
                                    `}>
                                        {dayNum}
                                    </div>

                                    {/* Evaluaciones */}
                                    <div className="flex flex-col gap-1 flex-1">
                                        {evals.map(e => (
                                            <button
                                                key={e.id}
                                                type="button"
                                                onClick={(ev) => { ev.stopPropagation(); setSelectedEval(e); }}
                                                className={`w-full text-left px-3 py-2.5 rounded-xl hover:brightness-90 active:scale-95 transition-all relative ${ASIG_COLORS[e.asignatura] || 'bg-slate-100 text-slate-600'}`}
                                                title={`${e.curso} · ${e.name}`}
                                            >
                                                <div className="text-xs font-extrabold leading-none">{e.curso}</div>
                                                <div className="text-[11px] font-semibold opacity-80 mt-1 truncate">{ASIG_FULL[e.asignatura] || e.asignatura}</div>
                                                {e.pendingChanges && (
                                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 border border-white" title="Cambios pendientes" />
                                                )}
                                            </button>
                                        ))}
                                        {clickable && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto flex items-center gap-1 text-eyr-primary/60 text-xs">
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

            {/* Leyenda de colores */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(ASIG_FULL).map(([code, name]) => (
                    <div key={code} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${ASIG_COLORS[code] || 'bg-slate-100 text-slate-600'}`}>
                        {name}
                    </div>
                ))}
            </div>

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

            <AnimatePresence>
                {selectedEval && (
                    <EvalDetailModal
                        eval={selectedEval}
                        onClose={() => setSelectedEval(null)}
                        canCRUD={canCRUD}
                        onEdit={() => { setEditEval(selectedEval); setSelectedEval(null); }}
                        onDelete={async () => {
                            await deleteEvaluacion(selectedEval.id);
                            setSelectedEval(null);
                        }}
                        onApprove={async () => {
                            await approvePendingChanges(selectedEval.id, selectedEval.pendingChanges);
                            setSelectedEval(null);
                        }}
                        onReject={async () => {
                            await rejectPendingChanges(selectedEval.id);
                            setSelectedEval(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditarFechas && (
                    <EditarFechasModal
                        evaluaciones={evaluaciones}
                        user={user}
                        canCRUD={canCRUD}
                        onEdit={(ev) => setEditEval(ev)}
                        onClose={() => setShowEditarFechas(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editEval && (
                    <CrearEvaluacionModal
                        onClose={() => setEditEval(null)}
                        onCreated={() => setEditEval(null)}
                        user={user}
                        evalId={editEval.id}
                        initialData={editEval}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

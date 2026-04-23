import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckSquare, Square, Trash2, Plus, CheckCircle2, Clock,
    ListChecks, Loader2, Pencil, Check, X, Pin, PinOff,
    Search, SortAsc, Calendar, MessageSquare, Flag, Send,
    AlertCircle, ChevronDown, ChevronLeft, ChevronRight,
    CalendarDays, Sparkles, PartyPopper,
    Target, Flame, Zap, Star,
} from 'lucide-react';
import { useTodos } from '../context/TodoContext';
import { cn } from '../lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = [
    { key: 'indigo',  bg: '#e0e7ff', text: '#3730a3', dot: '#6366f1', label: 'Índigo'  },
    { key: 'sky',     bg: '#e0f2fe', text: '#075985', dot: '#0ea5e9', label: 'Celeste' },
    { key: 'violet',  bg: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6', label: 'Violeta' },
    { key: 'emerald', bg: '#d1fae5', text: '#065f46', dot: '#10b981', label: 'Verde'   },
    { key: 'amber',   bg: '#fef3c7', text: '#78350f', dot: '#f59e0b', label: 'Ámbar'   },
    { key: 'rose',    bg: '#fee2e2', text: '#881337', dot: '#f43f5e', label: 'Rosa'     },
    { key: 'slate',   bg: '#f1f5f9', text: '#334155', dot: '#64748b', label: 'Gris'    },
    { key: 'teal',    bg: '#ccfbf1', text: '#134e4a', dot: '#14b8a6', label: 'Teal'    },
];
const PRIORITIES = [
    { key: 'alta',  label: 'Alta',  cls: 'bg-rose-100 text-rose-700' },
    { key: 'media', label: 'Media', cls: 'bg-amber-100 text-amber-700' },
    { key: 'baja',  label: 'Baja',  cls: 'bg-emerald-100 text-emerald-700' },
];
const STATUSES = [
    { key: 'pendiente',   label: 'Pendiente',   icon: Square,       color: '#94a3b8' },
    { key: 'en_progreso', label: 'En progreso', icon: Clock,        color: '#f59e0b' },
    { key: 'completado',  label: 'Completado',  icon: CheckCircle2, color: '#10b981' },
];
const SORT_OPTIONS = [
    { key: 'reciente',  label: 'Más reciente' },
    { key: 'prioridad', label: 'Prioridad'    },
    { key: 'fecha',     label: 'Fecha límite' },
];
const STATUS_TABS = [
    { key: 'todas',       label: 'Todas'       },
    { key: 'pendiente',   label: 'Pendiente'   },
    { key: 'en_progreso', label: 'En progreso' },
    { key: 'completado',  label: 'Completado'  },
];
const WEEK_DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEK_DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const getColor    = (key) => COLORS.find(c => c.key === key) ?? COLORS[0];
const getPriority = (key) => PRIORITIES.find(p => p.key === key) ?? PRIORITIES[1];
const getStatus   = (key) => STATUSES.find(s => s.key === key) ?? STATUSES[0];
const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 };

// ── Date helpers ──────────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().split('T')[0];

const daysUntil = (dateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due   = new Date(dateStr + 'T00:00:00');
    return Math.round((due - today) / 86400000);
};

const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completado') return false;
    return daysUntil(dueDate) < 0;
};

const formatDateShort = (d) => {
    if (!d) return null;
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

const daysLabel = (n) => {
    if (n < 0)  return { text: `Vencida hace ${Math.abs(n)} día${Math.abs(n) !== 1 ? 's' : ''}`, cls: 'text-red-600 bg-red-50 border-red-200' };
    if (n === 0) return { text: 'Hoy',    cls: 'text-orange-600 bg-orange-50 border-orange-200' };
    if (n === 1) return { text: 'Mañana', cls: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (n <= 7)  return { text: `En ${n} días`, cls: 'text-sky-600 bg-sky-50 border-sky-200' };
    return { text: `En ${n} días`, cls: 'text-slate-500 bg-slate-50 border-slate-200' };
};

// ── Week grid helpers ─────────────────────────────────────────────────────────
const getWeekDays = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = today.getDay();                     // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7)); // go to Mon
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        return d;
    });
};

// ── Motivational messages ─────────────────────────────────────────────────────
function getMessages(todos) {
    const todayStr = toDateStr(new Date());
    const completedTotal   = todos.filter(t => t.status === 'completado').length;
    const inProgressCount  = todos.filter(t => t.status === 'en_progreso').length;
    const overdueItems     = todos.filter(t => isOverdue(t.dueDate, t.status));
    const dueTodayItems    = todos.filter(t => t.dueDate === todayStr && t.status !== 'completado');
    const dueTomorrow      = todos.filter(t => t.dueDate && daysUntil(t.dueDate) === 1 && t.status !== 'completado');
    const highPriority     = todos.filter(t => t.priority === 'alta' && t.status === 'pendiente');

    const msgs = [];

    if (completedTotal > 0) msgs.push({
        icon: PartyPopper, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200',
        text: `¡Muy bien! Has completado ${completedTotal} tarea${completedTotal > 1 ? 's' : ''}.`,
    });
    if (overdueItems.length > 0) msgs.push({
        icon: Flame, color: 'text-red-500', bg: 'bg-red-50 border-red-200',
        text: `Tienes ${overdueItems.length} tarea${overdueItems.length > 1 ? 's' : ''} vencida${overdueItems.length > 1 ? 's' : ''}. ¡Ponlas al día!`,
    });
    if (dueTodayItems.length > 0) msgs.push({
        icon: Target, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200',
        text: `Hoy vence${dueTodayItems.length > 1 ? 'n' : ''} ${dueTodayItems.length} tarea${dueTodayItems.length > 1 ? 's' : ''}. ¡Enfócate!`,
    });
    if (dueTomorrow.length > 0) msgs.push({
        icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200',
        text: `Recuerda: "${dueTomorrow[0].text}" vence mañana.`,
    });
    if (inProgressCount > 0) msgs.push({
        icon: Clock, color: 'text-sky-500', bg: 'bg-sky-50 border-sky-200',
        text: `Tienes ${inProgressCount} tarea${inProgressCount > 1 ? 's' : ''} en progreso. ¡Casi listo!`,
    });
    if (highPriority.length > 0 && dueTodayItems.length === 0) msgs.push({
        icon: Star, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200',
        text: `"${highPriority[0].text}" es de alta prioridad y está pendiente.`,
    });
    if (msgs.length === 0) msgs.push({
        icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200',
        text: 'Organiza tu semana y mantente al día con tus tareas.',
    });
    return msgs;
}

// ── Calendar modal ────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CAL_HEADERS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function CalendarModal({ value, onChange, onClose }) {
    const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
    const init  = value ? new Date(value + 'T00:00:00') : today;
    const [yr,  setYr]  = useState(init.getFullYear());
    const [mo,  setMo]  = useState(init.getMonth());

    const prevMo = () => { if (mo === 0) { setYr(y => y-1); setMo(11); } else setMo(m => m-1); };
    const nextMo = () => { if (mo === 11) { setYr(y => y+1); setMo(0);  } else setMo(m => m+1); };

    const cells = useMemo(() => {
        const first = new Date(yr, mo, 1);
        const last  = new Date(yr, mo + 1, 0);
        const pad   = (first.getDay() + 6) % 7; // Mon = 0
        const arr   = [];
        for (let i = pad; i > 0; i--) {
            const d = new Date(first); d.setDate(d.getDate() - i);
            arr.push({ date: d, current: false });
        }
        for (let d = 1; d <= last.getDate(); d++) arr.push({ date: new Date(yr, mo, d), current: true });
        while (arr.length % 7 !== 0) {
            const prev = arr[arr.length - 1].date;
            const nxt  = new Date(prev); nxt.setDate(prev.getDate() + 1);
            arr.push({ date: nxt, current: false });
        }
        return arr;
    }, [yr, mo]);

    return createPortal(
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <motion.div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs"
                initial={{ scale: 0.9, y: 24, opacity: 0 }}
                animate={{ scale: 1,   y: 0,  opacity: 1 }}
                exit   ={{ scale: 0.9, y: 24, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}>

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="font-headline font-extrabold text-xl text-eyr-on-surface capitalize leading-tight">
                            {MONTH_NAMES[mo]}
                        </p>
                        <p className="text-xs font-semibold text-eyr-on-variant">{yr}</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={prevMo} className="w-8 h-8 rounded-xl border border-eyr-outline-variant/20 flex items-center justify-center hover:bg-eyr-surface-low transition-colors text-eyr-on-variant">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={nextMo} className="w-8 h-8 rounded-xl border border-eyr-outline-variant/20 flex items-center justify-center hover:bg-eyr-surface-low transition-colors text-eyr-on-variant">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                    {CAL_HEADERS.map(h => (
                        <div key={h} className="text-center text-[10px] font-bold text-eyr-on-variant/50 py-1">{h}</div>
                    ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-0.5">
                    {cells.map((cell, i) => {
                        const ds         = toDateStr(cell.date);
                        const isToday    = ds === toDateStr(today);
                        const isSelected = ds === value;
                        const isPast     = cell.date < today && !isToday;
                        return (
                            <button key={i}
                                onClick={() => { onChange(ds); onClose(); }}
                                disabled={!cell.current}
                                className={cn(
                                    'w-full aspect-square rounded-xl text-sm font-semibold transition-all flex items-center justify-center',
                                    !cell.current  && 'opacity-0 pointer-events-none',
                                    isSelected     && 'bg-eyr-primary text-white shadow-lg scale-105',
                                    isToday  && !isSelected && 'bg-eyr-primary/10 text-eyr-primary font-extrabold ring-1 ring-eyr-primary/40',
                                    !isSelected && !isToday && cell.current && !isPast && 'hover:bg-eyr-surface-low text-eyr-on-surface',
                                    isPast   && !isSelected && 'text-eyr-on-variant/35',
                                )}>
                                {cell.date.getDate()}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-eyr-outline-variant/10">
                    <button onClick={() => { onChange(''); onClose(); }}
                        className="text-xs font-semibold text-eyr-on-variant hover:text-red-500 transition-colors">
                        Sin fecha
                    </button>
                    <button onClick={() => { onChange(toDateStr(today)); onClose(); }}
                        className="px-4 py-1.5 rounded-xl bg-eyr-primary/10 text-eyr-primary text-xs font-bold hover:bg-eyr-primary/20 transition-colors">
                        Hoy
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

// ── Add form ──────────────────────────────────────────────────────────────────
const addDays = (n) => {
    const d = new Date(); d.setDate(d.getDate() + n); return toDateStr(d);
};
const DATE_SHORTCUTS = [
    { label: 'Hoy',      get: () => addDays(0) },
    { label: 'Mañana',   get: () => addDays(1) },
    { label: 'En 7 días',get: () => addDays(7) },
];

function AddTodoForm({ onAdd }) {
    const [open,         setOpen]         = useState(false);
    const [text,         setText]         = useState('');
    const [color,        setColor]        = useState('indigo');
    const [priority,     setPriority]     = useState('media');
    const [dueDate,      setDueDate]      = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    const submit = async () => {
        if (!text.trim()) return;
        await onAdd({ text, color, priority, dueDate: dueDate || null });
        setText(''); setDueDate(''); setOpen(false);
    };

    const selectShortcut = (get) => {
        const val = get();
        setDueDate(prev => prev === val ? '' : val);
    };

    if (!open) return (
        <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-eyr-primary text-white font-bold text-base hover:opacity-90 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Nueva tarea
        </button>
    );

    return (
        <>
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full bg-white rounded-3xl border border-eyr-outline-variant/20 shadow-xl p-6 space-y-5">

            {/* Text input */}
            <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
                placeholder="¿Qué necesitas hacer?"
                className="w-full text-lg font-semibold text-eyr-on-surface placeholder:text-eyr-on-variant/40 bg-transparent border-b-2 border-eyr-outline-variant/20 pb-2 focus:outline-none focus:border-eyr-primary transition-colors" />

            {/* Color + Priority */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-eyr-on-variant font-medium mr-1">Color</span>
                    {COLORS.map(c => (
                        <button key={c.key} onClick={() => setColor(c.key)} title={c.label}
                            style={{ background: c.dot }}
                            className={cn('w-5 h-5 rounded-full transition-all', color === c.key ? 'ring-2 ring-offset-2 ring-eyr-primary scale-125' : 'opacity-50 hover:opacity-100 hover:scale-110')} />
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-eyr-on-variant font-medium mr-1">Prioridad</span>
                    {PRIORITIES.map(p => (
                        <button key={p.key} onClick={() => setPriority(p.key)}
                            className={cn('px-3 py-1 rounded-full text-xs font-bold transition-all border',
                                priority === p.key ? p.cls + ' border-transparent' : 'border-eyr-outline-variant/20 text-eyr-on-variant hover:bg-eyr-surface-low'
                            )}>{p.label}</button>
                    ))}
                </div>
            </div>

            {/* Date picker */}
            <div>
                <p className="text-xs font-semibold text-eyr-on-variant mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Fecha límite
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                    {DATE_SHORTCUTS.map(s => {
                        const val    = s.get();
                        const active = dueDate === val;
                        return (
                            <button key={s.label} onClick={() => selectShortcut(s.get)}
                                className={cn(
                                    'px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                    active
                                        ? 'bg-eyr-primary text-white border-transparent shadow-sm'
                                        : 'border-eyr-outline-variant/30 text-eyr-on-variant hover:bg-eyr-surface-low hover:border-eyr-primary/30'
                                )}>
                                {s.label}
                            </button>
                        );
                    })}

                    {/* Custom date chip or calendar trigger */}
                    {dueDate && !DATE_SHORTCUTS.some(s => s.get() === dueDate) ? (
                        <button onClick={() => setShowCalendar(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-eyr-primary text-white border border-transparent shadow-sm hover:opacity-90 transition-opacity">
                            <Calendar className="w-3 h-3" />
                            {formatDateShort(dueDate)}
                            <span onClick={e => { e.stopPropagation(); setDueDate(''); }} className="hover:opacity-70">
                                <X className="w-3 h-3" />
                            </span>
                        </button>
                    ) : (
                        <button onClick={() => setShowCalendar(true)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 border-eyr-outline-variant/30 text-eyr-on-variant hover:bg-eyr-surface-low hover:border-eyr-primary/30">
                            <CalendarDays className="w-3.5 h-3.5" /> Elegir fecha
                        </button>
                    )}

                    {dueDate && (
                        <button onClick={() => setDueDate('')}
                            className="text-[10px] text-eyr-on-variant hover:text-red-500 transition-colors flex items-center gap-0.5">
                            <X className="w-3 h-3" /> Quitar
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => { setOpen(false); setDueDate(''); }}
                    className="px-6 py-3 rounded-full text-base font-bold text-eyr-on-variant hover:bg-eyr-surface-low transition-colors border border-eyr-outline-variant/20">Cancelar</button>
                <button onClick={submit} disabled={!text.trim()}
                    className="flex items-center gap-1.5 px-7 py-3 rounded-full bg-eyr-primary text-white text-base font-bold disabled:opacity-40 hover:opacity-90 transition-all">
                    <Check className="w-3.5 h-3.5" /> Agregar
                </button>
            </div>
        </motion.div>

        <AnimatePresence>
            {showCalendar && (
                <CalendarModal
                    value={dueDate}
                    onChange={setDueDate}
                    onClose={() => setShowCalendar(false)}
                />
            )}
        </AnimatePresence>
        </>
    );
}

// ── Todo card (grid view) ─────────────────────────────────────────────────────
function TodoCard({ todo, onClick, onUpdate }) {
    const color    = getColor(todo.color);
    const priority = getPriority(todo.priority);
    const overdue  = isOverdue(todo.dueDate, todo.status);
    const done     = todo.status === 'completado';
    const inProg   = todo.status === 'en_progreso';
    const dl       = todo.dueDate ? daysLabel(daysUntil(todo.dueDate)) : null;

    const cycleStatus = (e) => {
        e.stopPropagation();
        const order = ['pendiente', 'en_progreso', 'completado'];
        const next  = order[(order.indexOf(todo.status) + 1) % order.length];
        const msg   = next === 'completado' ? '¡Tarea completada!' : next === 'en_progreso' ? 'Tarea en progreso' : 'Tarea pendiente';
        onUpdate(todo.id, { status: next }, msg);
    };

    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick} style={{ background: color.bg }}
            className="rounded-3xl p-4 flex flex-col gap-3 group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">

            {todo.pinned && (
                <div className="absolute top-3 right-3" style={{ color: color.dot }}>
                    <Pin className="w-3.5 h-3.5 opacity-70" />
                </div>
            )}

            {/* Main row: check button + text */}
            <div className="flex items-center gap-3 pr-5">
                {/* Big status button */}
                <button
                    onClick={cycleStatus}
                    title={done ? 'Marcar pendiente' : inProg ? 'Marcar completada' : 'Marcar en progreso'}
                    className={cn(
                        'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 shadow-sm active:scale-95',
                        done  && 'border-emerald-500 bg-emerald-500 text-white shadow-emerald-200',
                        inProg && !done && 'border-amber-400 bg-amber-50 text-amber-500 hover:border-amber-500',
                        !done && !inProg && 'border-slate-300 bg-white/70 text-transparent hover:border-eyr-primary hover:text-eyr-primary/50 hover:bg-eyr-primary/5',
                    )}>
                    {done   && <Check className="w-5 h-5" strokeWidth={3} />}
                    {inProg && !done && <Clock className="w-5 h-5" />}
                    {!done && !inProg && <Check className="w-5 h-5 transition-opacity" />}
                </button>

                <span className={cn('flex-1 text-sm font-semibold leading-snug transition-all', done && 'line-through opacity-40')}
                    style={{ color: color.text }}>
                    {todo.text}
                </span>
            </div>

            {/* Status label strip */}
            <div className="flex items-center gap-2 pl-1 flex-wrap">
                <span className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-full border',
                    done   && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    inProg && !done && 'bg-amber-50 text-amber-700 border-amber-200',
                    !done && !inProg && 'bg-white/60 text-slate-500 border-slate-200',
                )}>
                    {done ? 'Completada' : inProg ? 'En progreso' : 'Pendiente'}
                </span>
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1', priority.cls)}>
                    <Flag className="w-2.5 h-2.5" />{priority.label}
                </span>
                {dl && (
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border flex items-center gap-1', dl.cls)}>
                        {overdue && <AlertCircle className="w-2.5 h-2.5" />}
                        <Calendar className="w-2.5 h-2.5" />
                        {dl.text}
                    </span>
                )}
                {(todo.notes?.length > 0) && (
                    <span className="text-[10px] font-medium flex items-center gap-1 bg-white/60 px-2 py-1 rounded-full ml-auto" style={{ color: color.text }}>
                        <MessageSquare className="w-2.5 h-2.5" />{todo.notes.length}
                    </span>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: color.dot }} />
        </motion.div>
    );
}

// ── Weekly mini-card ──────────────────────────────────────────────────────────
function WeekTodoChip({ todo, onClick, onUpdate }) {
    const color  = getColor(todo.color);
    const done   = todo.status === 'completado';
    const inProg = todo.status === 'en_progreso';

    const cycleStatus = (e) => {
        e.stopPropagation();
        const order = ['pendiente', 'en_progreso', 'completado'];
        const next  = order[(order.indexOf(todo.status) + 1) % order.length];
        const msg   = next === 'completado' ? '¡Tarea completada!' : next === 'en_progreso' ? 'Tarea en progreso' : 'Tarea pendiente';
        onUpdate(todo.id, { status: next }, msg);
    };

    return (
        <motion.div layout initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
            onClick={onClick} style={{ background: color.bg, borderLeft: `3px solid ${color.dot}` }}
            className="rounded-xl px-2.5 py-2 text-xs cursor-pointer hover:shadow-md transition-all group">
            <div className="flex items-center gap-2">
                <button onClick={cycleStatus}
                    title={done ? 'Marcar pendiente' : 'Marcar completada'}
                    className={cn(
                        'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90',
                        done   && 'bg-emerald-500 border-emerald-500 text-white',
                        inProg && !done && 'border-amber-400 text-amber-500 bg-amber-50',
                        !done && !inProg && 'border-slate-300 bg-white/70 text-transparent hover:border-eyr-primary hover:text-eyr-primary/50',
                    )}>
                    {done   && <Check className="w-3 h-3" strokeWidth={3} />}
                    {inProg && !done && <Clock className="w-3 h-3" />}
                    {!done && !inProg && <Check className="w-3 h-3" />}
                </button>
                <span className={cn('font-semibold leading-tight truncate', done && 'line-through opacity-40')} style={{ color: color.text }}>
                    {todo.text}
                </span>
            </div>
        </motion.div>
    );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function TodoDetailPanel({ todo, onClose, onUpdate, onDelete, addTodoNote, deleteTodoNote }) {
    const color    = getColor(todo.color);
    const priority = getPriority(todo.priority);
    const overdue  = isOverdue(todo.dueDate, todo.status);
    const dl       = todo.dueDate ? daysLabel(daysUntil(todo.dueDate)) : null;

    const [editingTitle,  setEditingTitle]  = useState(false);
    const [titleDraft,    setTitleDraft]    = useState(todo.text);
    const [description,   setDescription]   = useState(todo.description || '');
    const [descEditing,   setDescEditing]   = useState(false);
    const [noteText,      setNoteText]      = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showDateCal,   setShowDateCal]   = useState(false);
    const titleRef = useRef(null);

    useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);
    useEffect(() => { setTitleDraft(todo.text); setDescription(todo.description || ''); }, [todo.id]);

    const saveTitle = () => { if (titleDraft.trim()) onUpdate(todo.id, { text: titleDraft.trim() }, 'Título actualizado'); setEditingTitle(false); };
    const saveDesc  = () => { onUpdate(todo.id, { description: description.trim() || null }, 'Descripción guardada'); setDescEditing(false); };
    const sendNote  = async () => { if (!noteText.trim()) return; await addTodoNote(todo.id, noteText.trim()); setNoteText(''); };

    const cycleStatus = () => {
        const order = ['pendiente', 'en_progreso', 'completado'];
        const next = order[(order.indexOf(todo.status) + 1) % order.length];
        const msg = next === 'completado' ? '¡Tarea completada!' : next === 'en_progreso' ? 'Tarea en progreso' : 'Tarea pendiente';
        onUpdate(todo.id, { status: next }, msg);
    };

    const currentStatus = getStatus(todo.status);
    const StatusIcon = currentStatus.icon;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
                <div className="h-1.5 w-full shrink-0" style={{ background: color.dot }} />

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-eyr-outline-variant/10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {editingTitle ? (
                                <div className="flex gap-2 items-center">
                                    <input ref={titleRef} value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                                        className="flex-1 text-lg font-bold border-b-2 border-eyr-primary outline-none bg-transparent" />
                                    <button onClick={saveTitle} className="text-eyr-primary"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingTitle(false)} className="text-eyr-on-variant"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/title cursor-pointer" onClick={() => setEditingTitle(true)}>
                                    <h2 className={cn('text-lg font-bold text-eyr-on-surface leading-tight', todo.status === 'completado' && 'line-through text-eyr-on-variant')}>
                                        {todo.text}
                                    </h2>
                                    <Pencil className="w-3.5 h-3.5 text-eyr-on-variant opacity-0 group-hover/title:opacity-100 transition-opacity" />
                                </div>
                            )}
                            {dl && (
                                <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border mt-2', dl.cls)}>
                                    <Calendar className="w-3 h-3" /> {dl.text}
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-eyr-surface-low transition-colors shrink-0">
                            <X className="w-5 h-5 text-eyr-on-variant" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <button onClick={cycleStatus}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                            style={{ borderColor: color.dot + '40', color: currentStatus.color, background: color.bg }}>
                            <StatusIcon className="w-3.5 h-3.5" />{currentStatus.label}<ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
                        <span className={cn('px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1', priority.cls)}>
                            <Flag className="w-3 h-3" />{priority.label}
                        </span>
                        <button onClick={() => onUpdate(todo.id, { pinned: !todo.pinned }, todo.pinned ? 'Tarea desfijada' : 'Tarea fijada')}
                            className={cn('ml-auto p-1.5 rounded-xl transition-colors', todo.pinned ? 'text-amber-500 bg-amber-50' : 'text-eyr-on-variant hover:bg-eyr-surface-low')}
                            title={todo.pinned ? 'Desfijar' : 'Fijar'}>
                            {todo.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Color */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2">Color</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button key={c.key} onClick={() => onUpdate(todo.id, { color: c.key })} title={c.label}
                                    style={{ background: c.bg, borderColor: todo.color === c.key ? c.dot : 'transparent' }}
                                    className={cn('w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center', todo.color === c.key ? 'scale-110 shadow-sm' : 'hover:scale-105')}>
                                    <div className="w-3 h-3 rounded-full" style={{ background: c.dot }} />
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Priority */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2">Prioridad</label>
                        <div className="flex gap-2">
                            {PRIORITIES.map(p => (
                                <button key={p.key} onClick={() => onUpdate(todo.id, { priority: p.key }, 'Prioridad actualizada')}
                                    className={cn('flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                                        todo.priority === p.key ? p.cls + ' border-transparent shadow-sm' : 'border-eyr-outline-variant/20 text-eyr-on-variant hover:bg-eyr-surface-low'
                                    )}>{p.label}</button>
                            ))}
                        </div>
                    </div>
                    {/* Due date */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha límite
                        </label>
                        <button onClick={() => setShowDateCal(true)}
                            className={cn('w-full px-3 py-2.5 rounded-xl border text-sm text-left flex items-center gap-2 transition-colors hover:border-eyr-primary/40',
                                overdue ? 'border-red-300 text-red-600 bg-red-50' : 'border-eyr-outline-variant/30 text-eyr-on-surface bg-white')}>
                            <CalendarDays className="w-4 h-4 shrink-0 text-eyr-on-variant" />
                            <span className={todo.dueDate ? '' : 'text-eyr-on-variant italic'}>
                                {todo.dueDate ? new Date(todo.dueDate + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'long' }) : 'Sin fecha'}
                            </span>
                            {todo.dueDate && (
                                <span onClick={e => { e.stopPropagation(); onUpdate(todo.id, { dueDate: null }, 'Fecha eliminada'); }}
                                    className="ml-auto text-eyr-on-variant hover:text-red-500 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </button>
                        {overdue && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Esta tarea está vencida</p>}
                    </div>
                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2">Descripción</label>
                        {descEditing ? (
                            <div className="space-y-2">
                                <textarea autoFocus value={description} onChange={e => setDescription(e.target.value)} rows={4}
                                    placeholder="Agrega detalles…"
                                    className="w-full px-3 py-2.5 rounded-xl border border-eyr-primary/30 text-sm focus:outline-none bg-white resize-none" />
                                <div className="flex gap-2">
                                    <button onClick={saveDesc} className="flex items-center gap-1 px-3 py-1.5 bg-eyr-primary text-white rounded-lg text-xs font-semibold">
                                        <Check className="w-3 h-3" /> Guardar
                                    </button>
                                    <button onClick={() => { setDescEditing(false); setDescription(todo.description || ''); }} className="px-3 py-1.5 text-eyr-on-variant text-xs">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => setDescEditing(true)}
                                className="min-h-[60px] px-3 py-2.5 rounded-xl bg-eyr-surface-low border border-eyr-outline-variant/10 text-sm cursor-pointer hover:border-eyr-primary/30 transition-colors">
                                {todo.description
                                    ? <p className="text-eyr-on-surface whitespace-pre-wrap">{todo.description}</p>
                                    : <p className="text-eyr-on-variant italic">Clic para agregar descripción…</p>}
                            </div>
                        )}
                    </div>
                    {/* Notes */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Notas {todo.notes?.length > 0 && `(${todo.notes.length})`}
                        </label>
                        <div className="space-y-2 mb-3">
                            <AnimatePresence>
                                {(todo.notes || []).map(note => (
                                    <motion.div key={note.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="group/note bg-eyr-surface-low rounded-xl px-3 py-2.5 border border-eyr-outline-variant/10">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-eyr-on-variant">
                                                {new Date(note.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button onClick={() => deleteTodoNote(todo.id, note.id)} className="opacity-0 group-hover/note:opacity-100 transition-opacity">
                                                <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-eyr-on-surface whitespace-pre-wrap">{note.text}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="flex gap-2">
                            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNote(); } }}
                                placeholder="Escribir nota… (Enter para guardar)"
                                className="flex-1 px-3 py-2 rounded-xl border border-eyr-outline-variant/30 text-sm focus:outline-none focus:border-eyr-primary resize-none bg-white" />
                            <button onClick={sendNote} disabled={!noteText.trim()}
                                className="self-end p-2.5 rounded-xl bg-eyr-primary text-white hover:opacity-90 disabled:opacity-40 transition-all">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-eyr-outline-variant/10 flex items-center justify-between">
                    <span className="text-xs text-eyr-on-variant">
                        {todo.createdAt?.toDate ? `Creada ${todo.createdAt.toDate().toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}` : ''}
                    </span>
                    <button onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                </div>
            </motion.div>

            {/* Date calendar modal */}
            <AnimatePresence>
                {showDateCal && (
                    <CalendarModal
                        value={todo.dueDate || ''}
                        onChange={val => onUpdate(todo.id, { dueDate: val || null }, val ? 'Fecha actualizada' : 'Fecha eliminada')}
                        onClose={() => setShowDateCal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Delete confirmation modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
                        <motion.div className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-xs flex flex-col items-center gap-5"
                            initial={{ scale: 0.88, y: 20, opacity: 0 }}
                            animate={{ scale: 1,    y: 0,  opacity: 1 }}
                            exit   ={{ scale: 0.88, y: 20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 300 }}>
                            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-headline font-extrabold text-lg text-eyr-on-surface">¿Eliminar tarea?</p>
                                <p className="text-sm text-eyr-on-variant mt-1 leading-snug">
                                    "<span className="font-semibold text-eyr-on-surface">{todo.text}</span>" se eliminará permanentemente.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-eyr-outline-variant/20 text-sm font-semibold text-eyr-on-variant hover:bg-eyr-surface-low transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={() => { onDelete(todo.id); onClose(); }}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-sm">
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
}

// ── Day modal ─────────────────────────────────────────────────────────────────
function DayModal({ day, todos, onClose, onSelect, onUpdate, onAdd }) {
    const todayStr  = toDateStr(new Date());
    const ds        = toDateStr(day);
    const isToday   = ds === todayStr;
    const isPast    = ds < todayStr;
    const dl        = daysLabel(daysUntil(ds));

    const done     = todos.filter(t => t.status === 'completado').length;
    const pending  = todos.filter(t => t.status === 'pendiente').length;
    const inProg   = todos.filter(t => t.status === 'en_progreso').length;

    const [quickText,    setQuickText]    = useState('');
    const [quickColor,   setQuickColor]   = useState('indigo');
    const [quickPriority,setQuickPriority]= useState('media');
    const [adding,       setAdding]       = useState(false);
    const inputRef = useRef(null);
    useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

    const submit = async () => {
        if (!quickText.trim()) return;
        await onAdd({ text: quickText.trim(), color: quickColor, priority: quickPriority, dueDate: ds });
        setQuickText('');
        setAdding(false);
    };

    const dayName = day.toLocaleDateString('es-CL', { weekday: 'long' });
    const dayNum  = day.getDate();
    const monthName = day.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    // Accent color based on state
    const accentBg  = isToday ? '#e0e7ff' : isPast ? '#f1f5f9' : '#f0fdf4';
    const accentDot = isToday ? '#6366f1' : isPast ? '#94a3b8' : '#10b981';

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Color accent top */}
                <div className="h-1.5 w-full shrink-0" style={{ background: accentDot }} />

                {/* Header bento */}
                <div className="px-6 pt-5 pb-4" style={{ background: accentBg }}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentDot }}>
                                {isToday ? '— Hoy' : dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                            </p>
                            <div className="flex items-end gap-3">
                                <span className="text-6xl font-extrabold leading-none text-eyr-on-surface">{dayNum}</span>
                                <div className="mb-1">
                                    <p className="text-base font-bold text-eyr-on-surface capitalize">{dayName}</p>
                                    <p className="text-xs text-eyr-on-variant capitalize">{monthName}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/10 transition-colors">
                            <X className="w-5 h-5 text-eyr-on-variant" />
                        </button>
                    </div>

                    {/* Mini KPIs */}
                    <div className="flex gap-2 mt-4">
                        {[
                            { label: 'Total',      value: todos.length, cls: 'bg-white/70 text-eyr-on-surface' },
                            { label: 'Pendiente',  value: pending,      cls: 'bg-white/70 text-amber-700' },
                            { label: 'En progreso',value: inProg,       cls: 'bg-white/70 text-sky-700' },
                            { label: 'Listo',      value: done,         cls: 'bg-white/70 text-emerald-700' },
                        ].map(kpi => (
                            <div key={kpi.label} className={cn('flex-1 rounded-2xl px-3 py-2 text-center', kpi.cls)}>
                                <p className="text-xl font-extrabold">{kpi.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wide opacity-70">{kpi.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Days label badge */}
                    {!isToday && (
                        <div className="mt-3">
                            <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border', dl.cls)}>
                                <Calendar className="w-3 h-3" /> {dl.text}
                            </span>
                        </div>
                    )}
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    {todos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-eyr-on-variant">
                            <Calendar className="w-10 h-10 opacity-20" />
                            <p className="text-sm font-semibold">No hay tareas para este día</p>
                            <button onClick={() => setAdding(true)} className="text-sm text-eyr-primary hover:underline font-medium">
                                + Agregar tarea
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {todos.map(todo => {
                                const color    = getColor(todo.color);
                                const priority = getPriority(todo.priority);
                                const status   = getStatus(todo.status);
                                const StatusIcon = status.icon;
                                const cycleStatus = (e) => {
                                    e.stopPropagation();
                                    const order = ['pendiente', 'en_progreso', 'completado'];
                                    const next = order[(order.indexOf(todo.status) + 1) % order.length];
                                    const msg = next === 'completado' ? '¡Tarea completada!' : next === 'en_progreso' ? 'Tarea en progreso' : 'Tarea pendiente';
                                    onUpdate(todo.id, { status: next }, msg);
                                };
                                return (
                                    <motion.div
                                        key={todo.id}
                                        layout
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        onClick={() => { onSelect(todo); onClose(); }}
                                        style={{ background: color.bg, borderLeft: `4px solid ${color.dot}` }}
                                        className="rounded-2xl px-4 py-3 cursor-pointer hover:shadow-md transition-all group flex items-start gap-3"
                                    >
                                        <button onClick={cycleStatus} className="shrink-0 mt-0.5 hover:scale-125 transition-transform" title={status.label}>
                                            <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn('text-sm font-semibold text-eyr-on-surface group-hover:text-eyr-primary transition-colors truncate',
                                                todo.status === 'completado' && 'line-through opacity-50'
                                            )} style={{ color: color.text }}>
                                                {todo.text}
                                            </p>
                                            {todo.description && (
                                                <p className="text-xs text-eyr-on-variant mt-0.5 line-clamp-1">{todo.description}</p>
                                            )}
                                        </div>
                                        <span className={cn('shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full', priority.cls)}>
                                            {priority.label}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Quick add */}
                <div className="px-4 pb-5 pt-2 border-t border-eyr-outline-variant/10">
                    {adding ? (
                        <div className="space-y-3">
                            <input
                                ref={inputRef}
                                value={quickText}
                                onChange={e => setQuickText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false); }}
                                placeholder="Nueva tarea para este día…"
                                className="w-full px-4 py-2.5 rounded-2xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none text-sm"
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    {COLORS.map(c => (
                                        <button key={c.key} onClick={() => setQuickColor(c.key)} title={c.label}
                                            style={{ background: c.dot }}
                                            className={cn('w-4 h-4 rounded-full transition-all',
                                                quickColor === c.key ? 'ring-2 ring-offset-1 ring-eyr-primary scale-125' : 'opacity-50 hover:opacity-100 hover:scale-110'
                                            )} />
                                    ))}
                                </div>
                                <div className="flex items-center gap-1">
                                    {PRIORITIES.map(p => (
                                        <button key={p.key} onClick={() => setQuickPriority(p.key)}
                                            className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                                                quickPriority === p.key ? p.cls + ' border-transparent' : 'border-eyr-outline-variant/20 text-eyr-on-variant'
                                            )}>{p.label}</button>
                                    ))}
                                </div>
                                <div className="flex gap-2 ml-auto">
                                    <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-eyr-on-variant border border-eyr-outline-variant/20 rounded-xl hover:bg-eyr-surface-low transition-colors">Cancelar</button>
                                    <button onClick={submit} disabled={!quickText.trim()}
                                        className="px-3 py-1.5 text-xs font-bold bg-eyr-primary text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-eyr-outline-variant/30 text-sm font-semibold text-eyr-on-variant hover:border-eyr-primary/40 hover:text-eyr-primary hover:bg-eyr-primary/5 transition-all">
                            <Plus className="w-4 h-4" /> Agregar tarea para este día
                        </button>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// ── Weekly view ───────────────────────────────────────────────────────────────
function WeeklyView({ todos, onSelect, onUpdate, onAdd }) {
    const weekDays = useMemo(() => getWeekDays(), []);
    const todayStr = toDateStr(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    // Map dateStr → todos
    const byDate = useMemo(() => {
        const map = {};
        todos.forEach(t => {
            if (t.dueDate) {
                if (!map[t.dueDate]) map[t.dueDate] = [];
                map[t.dueDate].push(t);
            }
        });
        return map;
    }, [todos]);

    // Todos without a due date or outside this week
    const withoutDate = todos.filter(t => !t.dueDate && t.status !== 'completado');

    // Upcoming: todos with due date sorted by days
    const upcoming = useMemo(() => todos
        .filter(t => t.dueDate && t.status !== 'completado')
        .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)),
    [todos]);

    // Messages
    const messages = useMemo(() => getMessages(todos), [todos]);

    return (
        <div className="space-y-8">
            {/* ── Motivational messages ── */}
            <div className="space-y-2">
                {messages.slice(0, 3).map((msg, i) => {
                    const Icon = msg.icon;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                            className={cn('flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-semibold', msg.bg)}>
                            <Icon className={cn('w-4 h-4 shrink-0', msg.color)} />
                            <span className="text-eyr-on-surface">{msg.text}</span>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Weekly calendar ── */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-5 h-5 text-eyr-primary" />
                    <h2 className="text-base font-bold text-eyr-on-surface font-headline">Vista semanal</h2>
                    <span className="text-xs text-eyr-on-variant bg-eyr-surface-high px-2.5 py-1 rounded-full font-medium ml-auto">
                        {weekDays[0].toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </span>
                </div>

                <div className="grid grid-cols-7 gap-2 overflow-x-auto">
                    {weekDays.map((day, i) => {
                        const ds    = toDateStr(day);
                        const isToday = ds === todayStr;
                        const isPast  = ds < todayStr;
                        const dayTodos = byDate[ds] || [];

                        return (
                            <div
                                key={ds}
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    'rounded-2xl p-3 min-h-[160px] flex flex-col gap-2 border transition-all cursor-pointer',
                                    isToday
                                        ? 'bg-eyr-primary-container/30 border-eyr-primary/30 shadow-sm hover:shadow-md'
                                        : isPast
                                            ? 'bg-eyr-surface-low/60 border-eyr-outline-variant/10 opacity-80 hover:opacity-100 hover:shadow-sm'
                                            : 'bg-white border-eyr-outline-variant/15 hover:shadow-md hover:border-eyr-primary/20'
                                )}
                            >
                                {/* Day header */}
                                <div className="text-center mb-1">
                                    <p className={cn('text-[10px] font-bold uppercase tracking-wider', isToday ? 'text-eyr-primary' : 'text-eyr-on-variant')}>
                                        {WEEK_DAYS_ES[i]}
                                    </p>
                                    <div className={cn('text-sm font-extrabold mx-auto w-7 h-7 flex items-center justify-center rounded-full',
                                        isToday ? 'bg-eyr-primary text-white' : 'text-eyr-on-surface'
                                    )}>
                                        {day.getDate()}
                                    </div>
                                </div>

                                {/* Tasks for this day */}
                                <div className="flex flex-col gap-1.5 flex-1">
                                    {dayTodos.length > 0 ? (
                                        dayTodos.map(t => (
                                            <div key={t.id} onClick={e => e.stopPropagation()}>
                                                <WeekTodoChip todo={t} onClick={() => onSelect(t)} onUpdate={onUpdate} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <span className="text-[10px] text-eyr-on-variant/30 font-medium">+</span>
                                        </div>
                                    )}
                                </div>

                                {dayTodos.length > 0 && (
                                    <div className="text-center">
                                        <span className="text-[9px] font-bold text-eyr-on-variant/50">
                                            {dayTodos.filter(t => t.status === 'completado').length}/{dayTodos.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Próximas tareas (días restantes) ── */}
            {upcoming.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-eyr-primary" />
                        <h2 className="text-base font-extrabold text-eyr-on-surface font-headline">Próximas tareas</h2>
                        <span className="ml-auto text-xs font-semibold text-eyr-on-variant bg-eyr-surface-high px-2.5 py-1 rounded-full">{upcoming.length}</span>
                    </div>
                    <div className="space-y-2">
                        {upcoming.map((todo, idx) => {
                            const color    = getColor(todo.color);
                            const priority = getPriority(todo.priority);
                            const n        = daysUntil(todo.dueDate);
                            const dl       = daysLabel(n);
                            const done     = todo.status === 'completado';
                            const inProg   = todo.status === 'en_progreso';
                            const overdue  = n < 0;

                            const cycleStatus = (e) => {
                                e.stopPropagation();
                                const order = ['pendiente', 'en_progreso', 'completado'];
                                const next = order[(order.indexOf(todo.status) + 1) % order.length];
                                const msg = next === 'completado' ? '¡Tarea completada!' : next === 'en_progreso' ? 'Tarea en progreso' : 'Tarea pendiente';
                                onUpdate(todo.id, { status: next }, msg);
                            };

                            // Days badge accent
                            const dayNum   = Math.abs(n);
                            const dayLabel = overdue ? 'vencida' : n === 0 ? 'hoy' : n === 1 ? 'mañana' : `día${dayNum !== 1 ? 's' : ''}`;
                            const accentBg = overdue ? '#fef2f2' : n === 0 ? '#fff7ed' : n <= 3 ? '#fefce8' : '#f0fdf4';
                            const accentTx = overdue ? '#dc2626' : n === 0 ? '#ea580c' : n <= 3 ? '#ca8a04' : '#16a34a';

                            return (
                                <motion.div key={todo.id} layout
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
                                    onClick={() => onSelect(todo)}
                                    className="flex items-stretch bg-white rounded-2xl border border-eyr-outline-variant/15 hover:shadow-lg hover:border-eyr-primary/25 transition-all cursor-pointer group overflow-hidden">

                                    {/* Days accent panel */}
                                    <div className="w-[72px] flex flex-col items-center justify-center shrink-0 py-3 gap-0.5"
                                        style={{ background: accentBg }}>
                                        <span className="text-2xl font-extrabold font-headline leading-none" style={{ color: accentTx }}>
                                            {overdue ? dayNum : n === 0 ? '!' : n}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: accentTx + 'bb' }}>
                                            {dayLabel}
                                        </span>
                                    </div>

                                    {/* Color strip */}
                                    <div className="w-1 shrink-0 self-stretch" style={{ background: color.dot }} />

                                    {/* Content */}
                                    <div className="flex items-center gap-3 flex-1 px-4 py-3 min-w-0">
                                        {/* Big check circle */}
                                        <button onClick={cycleStatus}
                                            title={done ? 'Marcar pendiente' : 'Marcar completada'}
                                            className={cn(
                                                'shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all active:scale-90',
                                                done   && 'border-emerald-500 bg-emerald-500 text-white',
                                                inProg && !done && 'border-amber-400 text-amber-500 bg-amber-50',
                                                !done && !inProg && 'border-slate-300 bg-white text-transparent hover:border-eyr-primary hover:text-eyr-primary/50',
                                            )}>
                                            {done   && <Check className="w-4 h-4" strokeWidth={3} />}
                                            {inProg && !done && <Clock className="w-4 h-4" />}
                                            {!done  && !inProg && <Check className="w-4 h-4" />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <p className={cn('text-sm font-semibold text-eyr-on-surface truncate group-hover:text-eyr-primary transition-colors', done && 'line-through opacity-50')}>
                                                {todo.text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', priority.cls)}>
                                                    <Flag className="w-2.5 h-2.5" />{priority.label}
                                                </span>
                                                <span className="text-[10px] text-eyr-on-variant">{formatDateShort(todo.dueDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Sin fecha ── */}
            {withoutDate.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-eyr-on-variant mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Sin fecha asignada ({withoutDate.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {withoutDate.map(t => {
                            const c = getColor(t.color);
                            return (
                                <button key={t.id} onClick={() => onSelect(t)}
                                    style={{ background: c.bg, color: c.text, borderColor: c.dot + '30' }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:shadow-md transition-all">
                                    {t.text}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Day modal ── */}
            <AnimatePresence>
                {selectedDay && (
                    <DayModal
                        day={selectedDay}
                        todos={byDate[toDateStr(selectedDay)] || []}
                        onClose={() => setSelectedDay(null)}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                        onAdd={onAdd}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function TodoView() {
    const { todos, loading, addTodo, updateTodo, deleteTodo, addTodoNote, deleteTodoNote } = useTodos();

    const [mainTab,      setMainTab]      = useState('semana'); // 'mis' | 'semana'
    const [statusTab,    setStatusTab]    = useState('todas');
    const [search,       setSearch]       = useState('');
    const [sortBy,       setSortBy]       = useState('reciente');
    const [showSort,     setShowSort]     = useState(false);
    const [selectedTodo, setSelectedTodo] = useState(null);

    const counts = useMemo(() => ({
        todas:       todos.length,
        pendiente:   todos.filter(t => t.status === 'pendiente').length,
        en_progreso: todos.filter(t => t.status === 'en_progreso').length,
        completado:  todos.filter(t => t.status === 'completado').length,
    }), [todos]);

    const completionPct = todos.length > 0 ? Math.round((counts.completado / todos.length) * 100) : 0;
    const overdueCount  = todos.filter(t => isOverdue(t.dueDate, t.status)).length;

    const filtered = useMemo(() => {
        let list = statusTab === 'todas' ? todos : todos.filter(t => t.status === statusTab);
        if (search.trim()) {
            const q = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            list = list.filter(t => t.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q));
        }
        return [...list].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            if (sortBy === 'prioridad') return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
            if (sortBy === 'fecha') {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            }
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });
    }, [todos, statusTab, search, sortBy]);

    const liveTodo = selectedTodo ? todos.find(t => t.id === selectedTodo.id) : null;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-eyr-primary-container/40 rounded-xl">
                        <CheckSquare className="w-6 h-6 text-eyr-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-eyr-on-surface font-headline">Mis Tareas</h1>
                        <p className="text-sm text-eyr-on-variant">Lista personal de tareas</p>
                    </div>
                </div>
                <AddTodoForm onAdd={addTodo} />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#e0e7ff] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl"><ListChecks className="w-5 h-5 text-indigo-600" /></div>
                        <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Total</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-indigo-900">{counts.todas}</p>
                        <p className="text-indigo-700 font-semibold mb-2">Tareas</p>
                        <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
                            <motion.div className="h-full rounded-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                        </div>
                        <p className="text-[10px] text-indigo-600 mt-1 font-semibold">{completionPct}% completado</p>
                    </div>
                </div>
                <div className="bg-[#e0f2fe] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl"><Square className="w-5 h-5 text-sky-600" /></div>
                        <span className="text-xs font-bold text-sky-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Pendiente</span>
                    </div>
                    <div><p className="text-4xl font-extrabold text-sky-900">{counts.pendiente}</p><p className="text-sky-700 font-semibold">Sin iniciar</p></div>
                </div>
                <div className="bg-[#fef3c7] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl"><Clock className="w-5 h-5 text-amber-600" /></div>
                        <span className="text-xs font-bold text-amber-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">En progreso</span>
                    </div>
                    <div><p className="text-4xl font-extrabold text-amber-900">{counts.en_progreso}</p><p className="text-amber-700 font-semibold">En curso</p></div>
                </div>
                <div className={cn('p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all', overdueCount > 0 ? 'bg-[#fee2e2]' : 'bg-[#d1fae5]')}>
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            {overdueCount > 0 ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <span className={cn('text-xs font-bold bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider', overdueCount > 0 ? 'text-red-600' : 'text-emerald-600')}>
                            {overdueCount > 0 ? 'Vencidas' : 'Listo'}
                        </span>
                    </div>
                    <div>
                        <p className={cn('text-4xl font-extrabold', overdueCount > 0 ? 'text-red-900' : 'text-emerald-900')}>{overdueCount > 0 ? overdueCount : counts.completado}</p>
                        <p className={cn('font-semibold', overdueCount > 0 ? 'text-red-700' : 'text-emerald-700')}>{overdueCount > 0 ? 'Vencidas' : 'Completadas'}</p>
                    </div>
                </div>
            </div>

            {/* Main tabs */}
            <div className="bg-eyr-surface-high rounded-xl p-1 w-fit flex gap-0.5">
                {[{ key: 'semana', label: 'Esta semana', icon: CalendarDays }, { key: 'mis', label: 'Todas las tareas', icon: ListChecks }].map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.key} onClick={() => setMainTab(t.key)}
                            className={cn('flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                                mainTab === t.key ? 'bg-white text-eyr-on-surface shadow-sm' : 'text-eyr-on-variant hover:text-eyr-on-surface')}>
                            <Icon className="w-4 h-4" />{t.label}
                        </button>
                    );
                })}
            </div>

            {/* ══ SEMANA ══ */}
            {mainTab === 'semana' && !loading && (
                <WeeklyView todos={todos} onSelect={setSelectedTodo} onUpdate={updateTodo} onAdd={addTodo} />
            )}

            {/* ══ MIS TAREAS (grid) ══ */}
            {mainTab === 'mis' && (
                <>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="bg-eyr-surface-high rounded-xl p-1 flex flex-wrap gap-0.5">
                            {STATUS_TABS.map(t => (
                                <button key={t.key} onClick={() => setStatusTab(t.key)}
                                    className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5',
                                        statusTab === t.key ? 'bg-white text-eyr-on-surface shadow-sm' : 'text-eyr-on-variant hover:text-eyr-on-surface')}>
                                    {t.label}
                                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                        statusTab === t.key ? 'bg-eyr-surface-high text-eyr-on-variant' : 'bg-eyr-surface-low text-eyr-on-variant'
                                    )}>{counts[t.key]}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 flex-1 sm:justify-end">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-eyr-on-variant" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
                                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none text-sm" />
                                {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-eyr-on-variant" /></button>}
                            </div>
                            <div className="relative">
                                <button onClick={() => setShowSort(v => !v)}
                                    className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all bg-white',
                                        showSort ? 'border-eyr-primary text-eyr-primary' : 'border-eyr-outline-variant/30 text-eyr-on-variant hover:bg-eyr-surface-low')}>
                                    <SortAsc className="w-3.5 h-3.5" />
                                    {SORT_OPTIONS.find(s => s.key === sortBy)?.label}
                                </button>
                                <AnimatePresence>
                                    {showSort && (
                                        <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                                            className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-eyr-outline-variant/20 shadow-lg z-10 overflow-hidden min-w-[160px]">
                                            {SORT_OPTIONS.map(s => (
                                                <button key={s.key} onClick={() => { setSortBy(s.key); setShowSort(false); }}
                                                    className={cn('w-full text-left px-4 py-2.5 text-sm transition-colors',
                                                        sortBy === s.key ? 'bg-eyr-primary/10 text-eyr-primary font-semibold' : 'text-eyr-on-surface hover:bg-eyr-surface-low'
                                                    )}>{s.label}</button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-eyr-on-variant">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-eyr-on-variant">
                            <CheckSquare className="w-12 h-12 opacity-20" />
                            <p className="font-semibold">{search ? 'No hay resultados.' : statusTab === 'todas' ? 'Aún no tienes tareas. ¡Crea una!' : 'No hay tareas en esta categoría.'}</p>
                        </div>
                    ) : (
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filtered.map(todo => (
                                    <TodoCard key={todo.id} todo={todo} onClick={() => setSelectedTodo(todo)} onUpdate={updateTodo} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </>
            )}

            {/* Detail panel */}
            <AnimatePresence>
                {liveTodo && (
                    <TodoDetailPanel todo={liveTodo} onClose={() => setSelectedTodo(null)}
                        onUpdate={updateTodo} onDelete={deleteTodo}
                        addTodoNote={addTodoNote} deleteTodoNote={deleteTodoNote} />
                )}
            </AnimatePresence>
        </div>
    );
}

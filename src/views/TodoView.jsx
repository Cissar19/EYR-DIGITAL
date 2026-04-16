import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckSquare, Square, Trash2, Plus, CheckCircle2, Clock,
    ListChecks, Loader2, Pencil, Check, X, Pin, PinOff,
    Search, SortAsc, Calendar, MessageSquare, Flag, Send,
    AlertCircle, ChevronDown, BarChart2,
} from 'lucide-react';
import { useTodos } from '../context/TodoContext';
import { cn } from '../lib/utils';

// ── Constants ──────────────────────────────────────────────────────────────────
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
    { key: 'alta',  label: 'Alta',  cls: 'bg-rose-100 text-rose-700',       ring: '#f43f5e' },
    { key: 'media', label: 'Media', cls: 'bg-amber-100 text-amber-700',     ring: '#f59e0b' },
    { key: 'baja',  label: 'Baja',  cls: 'bg-emerald-100 text-emerald-700', ring: '#10b981' },
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

const TABS = [
    { key: 'todas',       label: 'Todas'       },
    { key: 'pendiente',   label: 'Pendiente'   },
    { key: 'en_progreso', label: 'En progreso' },
    { key: 'completado',  label: 'Completado'  },
];

const getColor    = (key) => COLORS.find(c => c.key === key) ?? COLORS[0];
const getPriority = (key) => PRIORITIES.find(p => p.key === key) ?? PRIORITIES[1];
const getStatus   = (key) => STATUSES.find(s => s.key === key) ?? STATUSES[0];

const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 };

const formatDate = (d) => {
    if (!d) return null;
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completado') return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(dueDate + 'T00:00:00') < today;
};

// ── Add form ──────────────────────────────────────────────────────────────────
function AddTodoForm({ onAdd }) {
    const [open,     setOpen]     = useState(false);
    const [text,     setText]     = useState('');
    const [color,    setColor]    = useState('indigo');
    const [priority, setPriority] = useState('media');
    const [dueDate,  setDueDate]  = useState('');
    const inputRef = useRef(null);

    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    const submit = async () => {
        if (!text.trim()) return;
        await onAdd({ text, color, priority, dueDate: dueDate || null });
        setText(''); setDueDate(''); setOpen(false);
    };

    if (!open) return (
        <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-eyr-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
        >
            <Plus className="w-4 h-4" /> Nueva tarea
        </button>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full bg-white rounded-3xl border border-eyr-outline-variant/20 shadow-xl p-6 space-y-4"
        >
            <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
                placeholder="¿Qué necesitas hacer?"
                className="w-full text-lg font-semibold text-eyr-on-surface placeholder:text-eyr-on-variant/40 bg-transparent border-b-2 border-eyr-outline-variant/20 pb-2 focus:outline-none focus:border-eyr-primary transition-colors"
            />

            <div className="flex flex-wrap items-center gap-4">
                {/* Color */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-eyr-on-variant font-medium mr-1">Color</span>
                    {COLORS.map(c => (
                        <button
                            key={c.key} onClick={() => setColor(c.key)} title={c.label}
                            style={{ background: c.dot }}
                            className={cn('w-5 h-5 rounded-full transition-all',
                                color === c.key ? 'ring-2 ring-offset-2 ring-eyr-primary scale-125' : 'opacity-50 hover:opacity-100 hover:scale-110'
                            )}
                        />
                    ))}
                </div>

                {/* Priority */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-eyr-on-variant font-medium mr-1">Prioridad</span>
                    {PRIORITIES.map(p => (
                        <button key={p.key} onClick={() => setPriority(p.key)}
                            className={cn('px-3 py-1 rounded-full text-xs font-bold transition-all border',
                                priority === p.key ? p.cls + ' border-transparent' : 'border-eyr-outline-variant/20 text-eyr-on-variant hover:bg-eyr-surface-low'
                            )}>{p.label}</button>
                    ))}
                </div>

                {/* Due date */}
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-eyr-on-variant" />
                    <input
                        type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        className="text-xs text-eyr-on-surface bg-eyr-surface-low border border-eyr-outline-variant/20 rounded-lg px-2 py-1 focus:outline-none focus:border-eyr-primary"
                    />
                </div>
            </div>

            <div className="flex gap-2 pt-1">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-eyr-on-variant hover:bg-eyr-surface-low transition-colors border border-eyr-outline-variant/20">
                    Cancelar
                </button>
                <button onClick={submit} disabled={!text.trim()}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-eyr-primary text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all">
                    <Check className="w-3.5 h-3.5" /> Agregar
                </button>
            </div>
        </motion.div>
    );
}

// ── Todo card ─────────────────────────────────────────────────────────────────
function TodoCard({ todo, onClick, onUpdate, onDelete }) {
    const color    = getColor(todo.color);
    const priority = getPriority(todo.priority);
    const status   = getStatus(todo.status);
    const overdue  = isOverdue(todo.dueDate, todo.status);
    const done     = todo.status === 'completado';
    const StatusIcon = status.icon;

    const cycleStatus = (e) => {
        e.stopPropagation();
        const order = ['pendiente', 'en_progreso', 'completado'];
        const next = order[(order.indexOf(todo.status) + 1) % order.length];
        onUpdate(todo.id, { status: next });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            style={{ background: color.bg }}
            className="rounded-3xl p-5 flex flex-col gap-3 group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
        >
            {/* Pin indicator */}
            {todo.pinned && (
                <div className="absolute top-3 right-3" style={{ color: color.dot }}>
                    <Pin className="w-3.5 h-3.5 opacity-70" />
                </div>
            )}

            {/* Status + text */}
            <div className="flex items-start gap-3 pr-5">
                <button
                    onClick={cycleStatus}
                    className="shrink-0 mt-0.5 transition-all hover:scale-125"
                    title={status.label}
                >
                    <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
                </button>
                <span
                    className={cn('flex-1 text-sm font-semibold leading-snug', done && 'line-through opacity-50')}
                    style={{ color: color.text }}
                >
                    {todo.text}
                </span>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Priority */}
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', priority.cls)}>
                    <Flag className="w-2.5 h-2.5" />
                    {priority.label}
                </span>

                {/* Due date */}
                {todo.dueDate && (
                    <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
                        overdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-white/60 text-current'
                    )} style={{ color: overdue ? undefined : color.text }}>
                        {overdue && <AlertCircle className="w-2.5 h-2.5" />}
                        <Calendar className="w-2.5 h-2.5" />
                        {overdue ? 'Vencida · ' : ''}{formatDate(todo.dueDate)}
                    </span>
                )}

                {/* Notes count */}
                {(todo.notes?.length > 0) && (
                    <span className="text-[10px] font-medium flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full ml-auto" style={{ color: color.text }}>
                        <MessageSquare className="w-2.5 h-2.5" />
                        {todo.notes.length}
                    </span>
                )}
            </div>

            {/* Hover color strip at bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: color.dot }}
            />
        </motion.div>
    );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function TodoDetailPanel({ todo, onClose, onUpdate, onDelete, addTodoNote, deleteTodoNote }) {
    const color    = getColor(todo.color);
    const priority = getPriority(todo.priority);
    const overdue  = isOverdue(todo.dueDate, todo.status);

    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft,   setTitleDraft]   = useState(todo.text);
    const [description,  setDescription]  = useState(todo.description || '');
    const [descEditing,  setDescEditing]  = useState(false);
    const [noteText,     setNoteText]     = useState('');
    const titleRef = useRef(null);

    useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);

    const saveTitle = () => {
        if (titleDraft.trim()) onUpdate(todo.id, { text: titleDraft.trim() });
        setEditingTitle(false);
    };

    const saveDesc = () => {
        onUpdate(todo.id, { description: description.trim() || null });
        setDescEditing(false);
    };

    const sendNote = async () => {
        if (!noteText.trim()) return;
        await addTodoNote(todo.id, noteText.trim());
        setNoteText('');
    };

    const cycleStatus = () => {
        const order = ['pendiente', 'en_progreso', 'completado'];
        const next = order[(order.indexOf(todo.status) + 1) % order.length];
        onUpdate(todo.id, { status: next });
    };

    const currentStatus = getStatus(todo.status);
    const StatusIcon = currentStatus.icon;

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden"
            >
                {/* Color accent bar */}
                <div className="h-1.5 w-full shrink-0" style={{ background: color.dot }} />

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-eyr-outline-variant/10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {editingTitle ? (
                                <div className="flex gap-2 items-center">
                                    <input
                                        ref={titleRef}
                                        value={titleDraft}
                                        onChange={e => setTitleDraft(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                                        className="flex-1 text-lg font-bold border-b-2 border-eyr-primary outline-none bg-transparent"
                                    />
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
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-eyr-surface-low transition-colors shrink-0">
                            <X className="w-5 h-5 text-eyr-on-variant" />
                        </button>
                    </div>

                    {/* Status + pin row */}
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={cycleStatus}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                            style={{ borderColor: color.dot + '40', color: currentStatus.color, background: color.bg }}
                        >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {currentStatus.label}
                            <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>

                        <span className={cn('px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1', priority.cls)}>
                            <Flag className="w-3 h-3" />{priority.label}
                        </span>

                        <button
                            onClick={() => onUpdate(todo.id, { pinned: !todo.pinned })}
                            className={cn('ml-auto p-1.5 rounded-xl transition-colors', todo.pinned ? 'text-amber-500 bg-amber-50' : 'text-eyr-on-variant hover:bg-eyr-surface-low')}
                            title={todo.pinned ? 'Desfijar' : 'Fijar'}
                        >
                            {todo.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Color picker */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2">Color</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c.key} onClick={() => onUpdate(todo.id, { color: c.key })} title={c.label}
                                    style={{ background: c.bg, borderColor: todo.color === c.key ? c.dot : 'transparent' }}
                                    className={cn('w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center',
                                        todo.color === c.key ? 'scale-110 shadow-sm' : 'hover:scale-105'
                                    )}
                                >
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
                                <button
                                    key={p.key}
                                    onClick={() => onUpdate(todo.id, { priority: p.key })}
                                    className={cn('flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                                        todo.priority === p.key ? p.cls + ' border-transparent shadow-sm' : 'border-eyr-outline-variant/20 text-eyr-on-variant hover:bg-eyr-surface-low'
                                    )}
                                >{p.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Due date */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha límite
                        </label>
                        <input
                            type="date"
                            value={todo.dueDate || ''}
                            onChange={e => onUpdate(todo.id, { dueDate: e.target.value || null })}
                            className={cn(
                                'w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-eyr-primary bg-white transition-colors',
                                overdue ? 'border-red-300 text-red-600' : 'border-eyr-outline-variant/30'
                            )}
                        />
                        {overdue && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Esta tarea está vencida
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2">Descripción</label>
                        {descEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    autoFocus
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Agrega detalles…"
                                    className="w-full px-3 py-2.5 rounded-xl border border-eyr-primary/30 text-sm focus:outline-none bg-white resize-none"
                                />
                                <div className="flex gap-2">
                                    <button onClick={saveDesc} className="flex items-center gap-1 px-3 py-1.5 bg-eyr-primary text-white rounded-lg text-xs font-semibold">
                                        <Check className="w-3 h-3" /> Guardar
                                    </button>
                                    <button onClick={() => { setDescEditing(false); setDescription(todo.description || ''); }} className="px-3 py-1.5 text-eyr-on-variant text-xs">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setDescEditing(true)}
                                className="min-h-[60px] px-3 py-2.5 rounded-xl bg-eyr-surface-low border border-eyr-outline-variant/10 text-sm cursor-pointer hover:border-eyr-primary/30 transition-colors"
                            >
                                {todo.description
                                    ? <p className="text-eyr-on-surface whitespace-pre-wrap">{todo.description}</p>
                                    : <p className="text-eyr-on-variant italic">Clic para agregar descripción…</p>
                                }
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant block mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Notas {todo.notes?.length > 0 && `(${todo.notes.length})`}
                        </label>

                        {/* Existing notes */}
                        <div className="space-y-2 mb-3">
                            <AnimatePresence>
                                {(todo.notes || []).map(note => (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group/note bg-eyr-surface-low rounded-xl px-3 py-2.5 border border-eyr-outline-variant/10"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-eyr-on-variant">
                                                {new Date(note.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                onClick={() => deleteTodoNote(todo.id, note.id)}
                                                className="opacity-0 group-hover/note:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-eyr-on-surface whitespace-pre-wrap">{note.text}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Add note */}
                        <div className="flex gap-2">
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNote(); } }}
                                placeholder="Escribir nota… (Enter para guardar)"
                                rows={2}
                                className="flex-1 px-3 py-2 rounded-xl border border-eyr-outline-variant/30 text-sm focus:outline-none focus:border-eyr-primary resize-none bg-white"
                            />
                            <button
                                onClick={sendNote}
                                disabled={!noteText.trim()}
                                className="self-end p-2.5 rounded-xl bg-eyr-primary text-white hover:opacity-90 disabled:opacity-40 transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-eyr-outline-variant/10 flex items-center justify-between">
                    <span className="text-xs text-eyr-on-variant">
                        {todo.createdAt?.toDate
                            ? `Creada ${todo.createdAt.toDate().toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`
                            : ''}
                    </span>
                    <button
                        onClick={() => { if (confirm('¿Eliminar esta tarea?')) { onDelete(todo.id); onClose(); } }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function TodoView() {
    const { todos, loading, addTodo, updateTodo, deleteTodo, addTodoNote, deleteTodoNote } = useTodos();

    const [tab,          setTab]          = useState('todas');
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
        let list = tab === 'todas' ? todos : todos.filter(t => t.status === tab);
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
    }, [todos, tab, search, sortBy]);

    // Sync selected todo with live data
    const liveTodo = selectedTodo ? todos.find(t => t.id === selectedTodo.id) : null;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">

            {/* ── Header ── */}
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

            {/* ── Bento KPIs ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total + progress */}
                <div className="bg-[#e0e7ff] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <ListChecks className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Total</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-indigo-900">{counts.todas}</p>
                        <p className="text-indigo-700 font-semibold mb-2">Tareas</p>
                        <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                        <p className="text-[10px] text-indigo-600 mt-1 font-semibold">{completionPct}% completado</p>
                    </div>
                </div>

                <div className="bg-[#e0f2fe] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <Square className="w-5 h-5 text-sky-600" />
                        </div>
                        <span className="text-xs font-bold text-sky-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Pendiente</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-sky-900">{counts.pendiente}</p>
                        <p className="text-sky-700 font-semibold">Sin iniciar</p>
                    </div>
                </div>

                <div className="bg-[#fef3c7] p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">En progreso</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-amber-900">{counts.en_progreso}</p>
                        <p className="text-amber-700 font-semibold">En curso</p>
                    </div>
                </div>

                <div className={cn("p-6 rounded-3xl flex flex-col justify-between h-40 hover:shadow-lg transition-all", overdueCount > 0 ? "bg-[#fee2e2]" : "bg-[#d1fae5]")}>
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            {overdueCount > 0
                                ? <AlertCircle className="w-5 h-5 text-red-500" />
                                : <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            }
                        </div>
                        <span className={cn("text-xs font-bold bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider", overdueCount > 0 ? "text-red-600" : "text-emerald-600")}>
                            {overdueCount > 0 ? 'Vencidas' : 'Listo'}
                        </span>
                    </div>
                    <div>
                        <p className={cn("text-4xl font-extrabold", overdueCount > 0 ? "text-red-900" : "text-emerald-900")}>
                            {overdueCount > 0 ? overdueCount : counts.completado}
                        </p>
                        <p className={cn("font-semibold", overdueCount > 0 ? "text-red-700" : "text-emerald-700")}>
                            {overdueCount > 0 ? 'Vencidas' : 'Completadas'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Filters row ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Tabs */}
                <div className="bg-eyr-surface-high rounded-xl p-1 flex flex-wrap gap-0.5">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5',
                                tab === t.key ? 'bg-white text-eyr-on-surface shadow-sm' : 'text-eyr-on-variant hover:text-eyr-on-surface'
                            )}
                        >
                            {t.label}
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                tab === t.key ? 'bg-eyr-surface-high text-eyr-on-variant' : 'bg-eyr-surface-low text-eyr-on-variant'
                            )}>{counts[t.key]}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 flex-1 sm:justify-end">
                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-eyr-on-variant" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar…"
                            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none text-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-eyr-on-variant" />
                            </button>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSort(v => !v)}
                            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all bg-white',
                                showSort ? 'border-eyr-primary text-eyr-primary' : 'border-eyr-outline-variant/30 text-eyr-on-variant hover:bg-eyr-surface-low'
                            )}
                        >
                            <SortAsc className="w-3.5 h-3.5" />
                            {SORT_OPTIONS.find(s => s.key === sortBy)?.label}
                        </button>
                        <AnimatePresence>
                            {showSort && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-eyr-outline-variant/20 shadow-lg z-10 overflow-hidden min-w-[160px]"
                                >
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

            {/* ── Grid ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-eyr-on-variant">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando…
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-eyr-on-variant">
                    <CheckSquare className="w-12 h-12 opacity-20" />
                    <p className="font-semibold">
                        {search ? 'No hay resultados para esa búsqueda.' : tab === 'todas' ? 'Aún no tienes tareas. ¡Crea una!' : 'No hay tareas en esta categoría.'}
                    </p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(todo => (
                            <TodoCard
                                key={todo.id}
                                todo={todo}
                                onClick={() => setSelectedTodo(todo)}
                                onUpdate={updateTodo}
                                onDelete={deleteTodo}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Detail panel ── */}
            <AnimatePresence>
                {liveTodo && (
                    <TodoDetailPanel
                        todo={liveTodo}
                        onClose={() => setSelectedTodo(null)}
                        onUpdate={updateTodo}
                        onDelete={deleteTodo}
                        addTodoNote={addTodoNote}
                        deleteTodoNote={deleteTodoNote}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

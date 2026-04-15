import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckSquare, Square, Trash2, Plus, CheckCircle2,
    Clock, ListChecks, Loader2, Pencil, Check, X,
} from 'lucide-react';
import { useTodos } from '../context/TodoContext';
import { cn } from '../lib/utils';

// ── Palette ───────────────────────────────────────────────────────────────────
const COLORS = [
    { key: 'indigo',  bg: '#e0e7ff', text: '#3730a3', dot: '#6366f1', label: 'Índigo' },
    { key: 'sky',     bg: '#e0f2fe', text: '#075985', dot: '#0ea5e9', label: 'Celeste' },
    { key: 'violet',  bg: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6', label: 'Violeta' },
    { key: 'emerald', bg: '#d1fae5', text: '#065f46', dot: '#10b981', label: 'Verde' },
    { key: 'amber',   bg: '#fef3c7', text: '#78350f', dot: '#f59e0b', label: 'Ámbar' },
    { key: 'rose',    bg: '#fee2e2', text: '#881337', dot: '#f43f5e', label: 'Rosa' },
    { key: 'slate',   bg: '#f1f5f9', text: '#334155', dot: '#64748b', label: 'Gris' },
    { key: 'teal',    bg: '#ccfbf1', text: '#134e4a', dot: '#14b8a6', label: 'Teal' },
];

const PRIORITIES = [
    { key: 'alta',  label: 'Alta',  cls: 'bg-rose-100 text-rose-700' },
    { key: 'media', label: 'Media', cls: 'bg-amber-100 text-amber-700' },
    { key: 'baja',  label: 'Baja',  cls: 'bg-emerald-100 text-emerald-700' },
];

const TABS = [
    { key: 'todas',       label: 'Todas' },
    { key: 'pendiente',   label: 'Pendiente' },
    { key: 'en_progreso', label: 'En progreso' },
    { key: 'completado',  label: 'Completado' },
];

const getColor = (key) => COLORS.find(c => c.key === key) ?? COLORS[0];
const getPriority = (key) => PRIORITIES.find(p => p.key === key) ?? PRIORITIES[1];

// ── Add form ──────────────────────────────────────────────────────────────────
function AddTodoForm({ onAdd }) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [color, setColor] = useState('indigo');
    const [priority, setPriority] = useState('media');
    const inputRef = useRef(null);

    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    const submit = async () => {
        if (!text.trim()) return;
        await onAdd({ text, color, priority });
        setText('');
        setOpen(false);
    };

    return (
        <div>
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-eyr-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Nueva tarea
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-eyr-outline-variant/20 shadow-lg p-5 space-y-4"
                >
                    <input
                        ref={inputRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
                        placeholder="¿Qué necesitas hacer?"
                        className="w-full text-base font-semibold text-eyr-on-surface placeholder:text-eyr-on-variant/50 bg-transparent border-b border-eyr-outline-variant/30 pb-2 focus:outline-none focus:border-eyr-primary"
                    />
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Color picker */}
                        <div className="flex items-center gap-1.5">
                            {COLORS.map(c => (
                                <button
                                    key={c.key}
                                    onClick={() => setColor(c.key)}
                                    title={c.label}
                                    style={{ background: c.dot }}
                                    className={cn(
                                        'w-5 h-5 rounded-full transition-all',
                                        color === c.key ? 'ring-2 ring-offset-2 ring-eyr-primary scale-125' : 'opacity-60 hover:opacity-100 hover:scale-110'
                                    )}
                                />
                            ))}
                        </div>
                        {/* Priority */}
                        <div className="flex items-center gap-1.5">
                            {PRIORITIES.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => setPriority(p.key)}
                                    className={cn(
                                        'px-3 py-1 rounded-full text-xs font-bold transition-all border',
                                        priority === p.key ? p.cls + ' border-transparent' : 'border-eyr-outline-variant/20 text-eyr-on-variant hover:bg-eyr-surface-low'
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1" />
                        <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl text-eyr-on-variant hover:bg-eyr-surface-low transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={submit}
                            disabled={!text.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-eyr-primary text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all"
                        >
                            <Check className="w-3.5 h-3.5" /> Agregar
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ── Todo card ─────────────────────────────────────────────────────────────────
function TodoCard({ todo, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(todo.text);
    const inputRef = useRef(null);
    const color = getColor(todo.color);
    const priority = getPriority(todo.priority);
    const done = todo.status === 'completado';

    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

    const cycleStatus = () => {
        const order = ['pendiente', 'en_progreso', 'completado'];
        const next = order[(order.indexOf(todo.status) + 1) % order.length];
        onUpdate(todo.id, { status: next });
    };

    const saveEdit = () => {
        if (draft.trim()) onUpdate(todo.id, { text: draft.trim() });
        setEditing(false);
    };

    const StatusIcon = done ? CheckCircle2 : todo.status === 'en_progreso' ? Clock : Square;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ background: color.bg }}
            className="rounded-3xl p-5 flex flex-col gap-3 group hover:shadow-lg transition-all min-h-[120px]"
        >
            {/* Top row */}
            <div className="flex items-start gap-3">
                <button
                    onClick={cycleStatus}
                    className="shrink-0 mt-0.5 transition-transform hover:scale-110"
                    title="Cambiar estado"
                >
                    <StatusIcon
                        className="w-5 h-5"
                        style={{ color: done ? '#10b981' : todo.status === 'en_progreso' ? '#f59e0b' : color.dot }}
                    />
                </button>

                {editing ? (
                    <input
                        ref={inputRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
                        className="flex-1 text-sm font-semibold bg-white/60 rounded-xl px-3 py-1.5 focus:outline-none"
                        style={{ color: color.text }}
                    />
                ) : (
                    <span
                        onDoubleClick={() => setEditing(true)}
                        className={cn('flex-1 text-sm font-semibold leading-snug cursor-text', done && 'line-through opacity-60')}
                        style={{ color: color.text }}
                    >
                        {todo.text}
                    </span>
                )}

                {/* Actions (visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                        onClick={() => setEditing(e => !e)}
                        className="p-1.5 rounded-xl hover:bg-white/60 transition-colors"
                        style={{ color: color.dot }}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(todo.id)}
                        className="p-1.5 rounded-xl hover:bg-white/60 transition-colors"
                        style={{ color: color.dot }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Bottom row */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', priority.cls)}>
                    {priority.label}
                </span>
                {/* Color picker dots */}
                <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {COLORS.map(c => (
                        <button
                            key={c.key}
                            onClick={() => onUpdate(todo.id, { color: c.key })}
                            title={c.label}
                            style={{ background: c.dot }}
                            className={cn(
                                'w-3 h-3 rounded-full transition-all',
                                todo.color === c.key ? 'ring-1 ring-offset-1 ring-slate-400 scale-125' : 'opacity-50 hover:opacity-100 hover:scale-110'
                            )}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function TodoView() {
    const { todos, loading, addTodo, updateTodo, deleteTodo } = useTodos();
    const [tab, setTab] = useState('todas');

    const counts = {
        todas: todos.length,
        pendiente: todos.filter(t => t.status === 'pendiente').length,
        en_progreso: todos.filter(t => t.status === 'en_progreso').length,
        completado: todos.filter(t => t.status === 'completado').length,
    };

    const filtered = tab === 'todas' ? todos : todos.filter(t => t.status === tab);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
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

            {/* Bento KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#e0e7ff] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <ListChecks className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Total</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-indigo-900">{counts.todas}</p>
                        <p className="text-indigo-700 font-semibold">Tareas</p>
                    </div>
                </div>
                <div className="bg-[#e0f2fe] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
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
                <div className="bg-[#fef3c7] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
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
                <div className="bg-[#d1fae5] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Listo</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-emerald-900">{counts.completado}</p>
                        <p className="text-emerald-700 font-semibold">Completadas</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-eyr-surface-high rounded-xl p-1 w-fit flex flex-wrap gap-0.5">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5',
                            tab === t.key
                                ? 'bg-white text-eyr-on-surface shadow-sm'
                                : 'text-eyr-on-variant hover:text-eyr-on-surface'
                        )}
                    >
                        {t.label}
                        <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            tab === t.key ? 'bg-eyr-surface-high text-eyr-on-variant' : 'bg-eyr-surface-low text-eyr-on-variant'
                        )}>
                            {counts[t.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-eyr-on-variant">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando…
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-eyr-on-variant">
                    <CheckSquare className="w-12 h-12 opacity-20" />
                    <p className="font-semibold">
                        {tab === 'todas' ? 'Aún no tienes tareas. ¡Crea una!' : 'No hay tareas en esta categoría.'}
                    </p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(todo => (
                            <TodoCard
                                key={todo.id}
                                todo={todo}
                                onUpdate={updateTodo}
                                onDelete={deleteTodo}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, User, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const COLS = [
    { key: 'pendiente',   label: 'Pendiente',   dot: 'bg-amber-400',   bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',   addBg: 'hover:bg-amber-100' },
    { key: 'en_progreso', label: 'En progreso', dot: 'bg-blue-400',    bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700',    addBg: 'hover:bg-blue-100' },
    { key: 'cumplido',    label: 'Cumplido',    dot: 'bg-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700', addBg: 'hover:bg-emerald-100' },
];

const NEW_FORM = { texto: '', responsable: '', plazo: '' };

function formatDate(d) {
    if (!d) return null;
    const date = new Date(d + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdue = date < today;
    const str = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    return { str, overdue };
}

export default function PizarraCompromisos({ workshopId, compromisos: initial, users, onSave }) {
    const [items,   setItems]   = useState(() => initial || []);
    const [adding,  setAdding]  = useState(null);
    const [form,    setForm]    = useState(NEW_FORM);

    useEffect(() => {
        setItems(initial || []);
    }, [workshopId]);

    const persist = (next) => { setItems(next); onSave(next); };

    const addItem = (col) => {
        if (!form.texto.trim()) return;
        const next = [...items, { id: crypto.randomUUID(), texto: form.texto.trim(), responsable: form.responsable, plazo: form.plazo, columna: col }];
        persist(next);
        setForm(NEW_FORM);
        setAdding(null);
    };

    const moveItem = (id, col) => persist(items.map(i => i.id === id ? { ...i, columna: col } : i));
    const deleteItem = (id) => persist(items.filter(i => i.id !== id));

    return (
        <div className="space-y-5 pb-10">
            <div>
                <h2 className="text-base font-bold text-eyr-on-surface">Pizarra de compromisos</h2>
                <p className="text-xs text-eyr-on-variant">{items.length} compromiso{items.length !== 1 ? 's' : ''} · Los cambios se guardan automáticamente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COLS.map(col => {
                    const colItems = items.filter(i => (i.columna || 'pendiente') === col.key);
                    return (
                        <div key={col.key} className={cn('rounded-2xl border p-4 space-y-3 min-h-56', col.bg, col.border)}>
                            {/* Column header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn('w-2 h-2 rounded-full shrink-0', col.dot)} />
                                    <span className={cn('text-sm font-bold', col.text)}>{col.label}</span>
                                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/70', col.text)}>
                                        {colItems.length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { setAdding(col.key); setForm(NEW_FORM); }}
                                    className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-white/60 transition-all', col.text, col.addBg)}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Inline add form */}
                            <AnimatePresence>
                                {adding === col.key && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="bg-white rounded-xl p-3 space-y-2 shadow-sm"
                                    >
                                        <textarea
                                            autoFocus
                                            value={form.texto}
                                            onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addItem(col.key); } }}
                                            placeholder="Descripción del compromiso…"
                                            rows={2}
                                            className="w-full text-sm px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-eyr-primary resize-none"
                                        />
                                        <select
                                            value={form.responsable}
                                            onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-eyr-primary bg-white"
                                        >
                                            <option value="">Responsable…</option>
                                            {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                        </select>
                                        <input
                                            type="date"
                                            value={form.plazo}
                                            onChange={e => setForm(f => ({ ...f, plazo: e.target.value }))}
                                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-eyr-primary"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => addItem(col.key)}
                                                disabled={!form.texto.trim()}
                                                className="flex-1 py-1.5 bg-eyr-primary text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all"
                                            >
                                                Agregar
                                            </button>
                                            <button onClick={() => setAdding(null)} className="px-2 text-slate-400 hover:text-slate-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Cards */}
                            <AnimatePresence mode="popLayout">
                                {colItems.map(item => {
                                    const date = formatDate(item.plazo);
                                    const others = COLS.filter(c => c.key !== col.key);
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-white rounded-xl p-3 shadow-sm group"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="text-sm text-eyr-on-surface font-medium leading-snug flex-1">
                                                    {item.texto}
                                                </p>
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0 mt-0.5"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-eyr-on-variant/60 flex-wrap">
                                                {item.responsable && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {item.responsable.split(' ')[0]}
                                                    </span>
                                                )}
                                                {date && (
                                                    <span className={cn('flex items-center gap-1', date.overdue && 'text-red-500 font-semibold')}>
                                                        <Calendar className="w-3 h-3" />
                                                        {date.str}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Move buttons */}
                                            <div className="flex gap-1.5 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {others.map(o => (
                                                    <button
                                                        key={o.key}
                                                        onClick={() => moveItem(item.id, o.key)}
                                                        className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-all', o.bg, o.text, o.border)}
                                                    >
                                                        <ArrowRight className="w-2.5 h-2.5" /> {o.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {colItems.length === 0 && adding !== col.key && (
                                <p className={cn('text-xs text-center py-6 font-medium opacity-40', col.text)}>
                                    Sin compromisos
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

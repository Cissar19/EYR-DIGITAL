import React, { useState, useEffect } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

const RACI_CYCLE = ['', 'R', 'A', 'C', 'I'];

const RACI_STYLE = {
    R: { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-300',     label: 'Responsable' },
    A: { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-300',  label: 'Aprueba' },
    C: { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300',    label: 'Consulta' },
    I: { bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-300',   label: 'Informa' },
    '': { bg: 'bg-white',      text: 'text-slate-200',   border: 'border-slate-100',   label: '' },
};

const DEFAULT_DATA = { tareas: [], personas: [], celdas: {} };

export default function TablaResponsabilidades({ workshopId, responsabilidades: initial, users, onSave }) {
    const [data,     setData]    = useState(() => initial || DEFAULT_DATA);
    const [isDirty,  setIsDirty] = useState(false);
    const [saving,   setSaving]  = useState(false);
    const [newTarea, setNewTarea] = useState('');

    useEffect(() => {
        setData(initial || DEFAULT_DATA);
        setIsDirty(false);
    }, [workshopId]);

    const update = fn => { setData(prev => fn(prev)); setIsDirty(true); };

    const save = async () => {
        setSaving(true);
        await onSave(data);
        setIsDirty(false);
        setSaving(false);
    };

    // ── Personas ──
    const addPersona = name => {
        if (!name || data.personas.includes(name)) return;
        update(d => ({ ...d, personas: [...d.personas, name] }));
    };

    const removePersona = name => {
        update(d => {
            const celdas = { ...d.celdas };
            d.tareas.forEach(t => { delete celdas[`${t.id}_${name}`]; });
            return { ...d, personas: d.personas.filter(p => p !== name), celdas };
        });
    };

    // ── Tareas ──
    const addTarea = () => {
        if (!newTarea.trim()) return;
        update(d => ({ ...d, tareas: [...d.tareas, { id: crypto.randomUUID(), nombre: newTarea.trim() }] }));
        setNewTarea('');
    };

    const updateTareaNombre = (id, val) =>
        update(d => ({ ...d, tareas: d.tareas.map(t => t.id === id ? { ...t, nombre: val } : t) }));

    const removeTarea = id => {
        update(d => {
            const celdas = { ...d.celdas };
            d.personas.forEach(p => { delete celdas[`${id}_${p}`]; });
            return { ...d, tareas: d.tareas.filter(t => t.id !== id), celdas };
        });
    };

    // ── Celdas ──
    const cycleCell = (tareaId, persona) => {
        const key = `${tareaId}_${persona}`;
        update(d => {
            const current = d.celdas[key] ?? '';
            const idx = RACI_CYCLE.indexOf(current);
            const next = RACI_CYCLE[(idx + 1) % RACI_CYCLE.length];
            const celdas = { ...d.celdas };
            if (next === '') { delete celdas[key]; } else { celdas[key] = next; }
            return { ...d, celdas };
        });
    };

    const hasData = data.tareas.length > 0 && data.personas.length > 0;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-base font-bold text-eyr-on-surface">Tabla de responsabilidades</h2>
                    <p className="text-xs text-eyr-on-variant">Haz clic en una celda para asignar R → A → C → I</p>
                </div>
                <button
                    onClick={save}
                    disabled={!isDirty || saving}
                    className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all',
                        isDirty
                            ? 'bg-eyr-primary text-white hover:opacity-90 shadow-sm'
                            : 'text-eyr-on-variant/40 cursor-default'
                    )}
                >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Guardando…' : isDirty ? 'Guardar tabla' : 'Guardado'}
                </button>
            </div>

            {/* Agregar personas */}
            <div className="bg-white rounded-2xl border border-eyr-outline-variant/20 p-5">
                <label className="text-xs font-bold text-eyr-on-variant/60 uppercase tracking-wide block mb-2.5">
                    Personas
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {data.personas.map(p => (
                        <span key={p} className="inline-flex items-center gap-1.5 bg-eyr-primary/10 text-eyr-primary text-sm font-semibold px-3 py-1.5 rounded-full">
                            <span className="w-5 h-5 rounded-full bg-eyr-primary text-white text-[10px] font-bold flex items-center justify-center">
                                {p.charAt(0).toUpperCase()}
                            </span>
                            {p}
                            <button onClick={() => removePersona(p)} className="hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {data.personas.length === 0 && (
                        <span className="text-xs text-eyr-on-variant/40 italic">Sin personas agregadas</span>
                    )}
                </div>
                <select
                    value=""
                    onChange={e => { if (e.target.value) addPersona(e.target.value); }}
                    className="text-sm px-3 py-2 rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:outline-none bg-white"
                >
                    <option value="">Agregar persona…</option>
                    {users.filter(u => !data.personas.includes(u.name)).map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                </select>
            </div>

            {/* Matriz */}
            {hasData && (
                <div className="bg-white rounded-2xl border border-eyr-outline-variant/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-eyr-surface-low border-b border-eyr-outline-variant/10">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-eyr-on-variant sticky left-0 bg-eyr-surface-low min-w-52">
                                        Tarea / Actividad
                                    </th>
                                    {data.personas.map(p => (
                                        <th key={p} className="px-3 py-3 text-center min-w-28">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-7 h-7 rounded-full bg-eyr-primary text-white text-xs font-bold flex items-center justify-center">
                                                    {p.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[10px] font-bold text-eyr-on-variant truncate max-w-24 block">
                                                    {p.split(' ')[0]}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="w-8" />
                                </tr>
                            </thead>
                            <tbody>
                                {data.tareas.map((tarea, idx) => (
                                    <tr key={tarea.id} className={cn(
                                        'border-b border-eyr-outline-variant/10 group',
                                        idx % 2 === 1 && 'bg-eyr-surface-low/20'
                                    )}>
                                        <td className={cn('px-5 py-3 sticky left-0', idx % 2 === 1 ? 'bg-eyr-surface-low/20' : 'bg-white')}>
                                            <input
                                                value={tarea.nombre}
                                                onChange={e => updateTareaNombre(tarea.id, e.target.value)}
                                                className="text-sm font-medium text-eyr-on-surface bg-transparent focus:outline-none w-full"
                                            />
                                        </td>
                                        {data.personas.map(p => {
                                            const val = data.celdas[`${tarea.id}_${p}`] ?? '';
                                            const s = RACI_STYLE[val];
                                            return (
                                                <td key={p} className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => cycleCell(tarea.id, p)}
                                                        title={s.label || 'Clic para asignar'}
                                                        className={cn(
                                                            'w-9 h-9 rounded-xl border-2 text-sm font-extrabold transition-all hover:scale-110 mx-auto flex items-center justify-center',
                                                            s.bg, s.text, s.border
                                                        )}
                                                    >
                                                        {val || <span className="text-slate-200 text-xs">+</span>}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="px-2 py-3">
                                            <button
                                                onClick={() => removeTarea(tarea.id)}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add task row */}
                    <div className="flex items-center gap-2 px-5 py-3 border-t border-eyr-outline-variant/10 bg-eyr-surface-low/20">
                        <input
                            value={newTarea}
                            onChange={e => setNewTarea(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTarea()}
                            placeholder="Nueva tarea o actividad…"
                            className="flex-1 text-sm px-3 py-2 rounded-xl border border-eyr-outline-variant/20 focus:border-eyr-primary focus:outline-none bg-white"
                        />
                        <button
                            onClick={addTarea}
                            disabled={!newTarea.trim()}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-eyr-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                    </div>
                </div>
            )}

            {!hasData && data.personas.length > 0 && (
                <div className="bg-white rounded-2xl border border-eyr-outline-variant/20 p-5 space-y-3">
                    <label className="text-xs font-bold text-eyr-on-variant/60 uppercase tracking-wide block">
                        Tareas
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            value={newTarea}
                            onChange={e => setNewTarea(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTarea()}
                            placeholder="Primera tarea o actividad…"
                            className="flex-1 text-sm px-3 py-2 rounded-xl border border-eyr-outline-variant/20 focus:border-eyr-primary focus:outline-none bg-white"
                            autoFocus
                        />
                        <button
                            onClick={addTarea}
                            disabled={!newTarea.trim()}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-eyr-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                    </div>
                </div>
            )}

            {data.personas.length === 0 && (
                <div className="py-14 text-center text-eyr-on-variant/40">
                    <p className="font-semibold">Agrega personas para comenzar la tabla</p>
                </div>
            )}

            {/* Leyenda RACI */}
            {data.personas.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-2">
                    {(['R', 'A', 'C', 'I']).map(k => {
                        const s = RACI_STYLE[k];
                        return (
                            <div key={k} className="flex items-center gap-2.5">
                                <span className={cn('w-8 h-8 rounded-xl border-2 text-sm font-extrabold flex items-center justify-center', s.bg, s.text, s.border)}>
                                    {k}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-eyr-on-surface leading-none">{s.label}</p>
                                    <p className="text-[10px] text-eyr-on-variant/50 mt-0.5">
                                        {k === 'R' && 'Quien ejecuta la tarea'}
                                        {k === 'A' && 'Autoridad y aprobación final'}
                                        {k === 'C' && 'Aporta información o criterio'}
                                        {k === 'I' && 'Debe ser notificado del avance'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

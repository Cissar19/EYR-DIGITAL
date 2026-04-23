import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Save, ClipboardList, ChevronDown, ChevronUp, UserPlus, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

const normalizeText = t => t?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
const getInitials = name => {
    const parts = name?.trim().split(' ').filter(Boolean) || [];
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.[0] || '?');
};

const DEFAULT_ACTA = { fecha: '', participantes: [], temas: [] };

export default function ActaReunion({ workshopId, acta: initialActa, users, onSave }) {
    const [data,         setData]       = useState(() => initialActa || DEFAULT_ACTA);
    const [isDirty,      setIsDirty]    = useState(false);
    const [saving,       setSaving]     = useState(false);
    const [collapsed,    setCollapsed]  = useState({});
    const [showPicker,   setShowPicker] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const pickerRef = useRef(null);

    useEffect(() => {
        if (!showPicker) return;
        const handler = e => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPicker]);

    useEffect(() => {
        setData(initialActa || DEFAULT_ACTA);
        setIsDirty(false);
    }, [workshopId]);

    const update = fn => { setData(prev => fn(prev)); setIsDirty(true); };

    const save = async () => {
        setSaving(true);
        await onSave(data);
        setIsDirty(false);
        setSaving(false);
    };

    // ── Participantes ──
    const addParticipante = name => {
        if (!name || data.participantes.includes(name)) return;
        update(d => ({ ...d, participantes: [...d.participantes, name] }));
    };
    const removeParticipante = name =>
        update(d => ({ ...d, participantes: d.participantes.filter(p => p !== name) }));

    // ── Temas ──
    const addTema = () => {
        const id = crypto.randomUUID();
        update(d => ({ ...d, temas: [...d.temas, { id, titulo: '', notas: '', acuerdos: [] }] }));
        setCollapsed(c => ({ ...c, [id]: false }));
    };
    const updateTema  = (id, field, val) =>
        update(d => ({ ...d, temas: d.temas.map(t => t.id === id ? { ...t, [field]: val } : t) }));
    const deleteTema  = id =>
        update(d => ({ ...d, temas: d.temas.filter(t => t.id !== id) }));

    // ── Acuerdos ──
    const addAcuerdo = temaId =>
        update(d => ({
            ...d, temas: d.temas.map(t => t.id === temaId
                ? { ...t, acuerdos: [...t.acuerdos, { id: crypto.randomUUID(), texto: '', responsable: '', plazo: '', cumplido: false }] }
                : t),
        }));
    const updateAcuerdo = (temaId, aId, field, val) =>
        update(d => ({
            ...d, temas: d.temas.map(t => t.id === temaId
                ? { ...t, acuerdos: t.acuerdos.map(a => a.id === aId ? { ...a, [field]: val } : a) }
                : t),
        }));
    const deleteAcuerdo = (temaId, aId) =>
        update(d => ({
            ...d, temas: d.temas.map(t => t.id === temaId
                ? { ...t, acuerdos: t.acuerdos.filter(a => a.id !== aId) }
                : t),
        }));

    const totalAcuerdos = data.temas.reduce((s, t) => s + t.acuerdos.length, 0);
    const cumplidos     = data.temas.reduce((s, t) => s + t.acuerdos.filter(a => a.cumplido).length, 0);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl">
                        <ClipboardList className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-eyr-on-surface">Acta de reunión</h2>
                        {totalAcuerdos > 0 && (
                            <p className="text-xs text-eyr-on-variant">
                                {cumplidos}/{totalAcuerdos} acuerdos cumplidos
                            </p>
                        )}
                    </div>
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
                    {saving ? 'Guardando…' : isDirty ? 'Guardar acta' : 'Guardado'}
                </button>
            </div>

            {/* Fecha y participantes */}
            <div className="bg-white rounded-2xl border border-eyr-outline-variant/20 p-5 space-y-4">
                <div>
                    <label className="text-xs font-bold text-eyr-on-variant/60 uppercase tracking-wide block mb-1.5">
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={data.fecha}
                        onChange={e => update(d => ({ ...d, fecha: e.target.value }))}
                        className="px-3 py-2 text-sm rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:outline-none bg-white"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-eyr-on-variant/60 uppercase tracking-wide block mb-2">
                        Participantes
                    </label>
                    {/* Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {data.participantes.map(p => (
                            <div key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-eyr-primary-container/30 border border-eyr-primary/20 rounded-full text-xs font-medium text-eyr-primary">
                                <span className="w-5 h-5 rounded-full bg-eyr-primary/20 flex items-center justify-center text-[9px] font-bold">
                                    {getInitials(p).toUpperCase()}
                                </span>
                                {p.split(' ')[0]}
                                <button onClick={() => removeParticipante(p)} className="text-eyr-primary/60 hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {data.participantes.length === 0 && (
                            <span className="text-xs text-eyr-on-variant italic">Sin participantes</span>
                        )}
                    </div>
                    {/* Picker */}
                    <div className="relative" ref={pickerRef}>
                        <button
                            onClick={() => { setShowPicker(v => !v); setPickerSearch(''); }}
                            className="flex items-center gap-1.5 text-xs text-eyr-primary hover:opacity-80 font-medium transition-opacity"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            Agregar participante
                        </button>
                        {showPicker && (
                            <div className="absolute z-20 mt-1 w-64 bg-white rounded-xl shadow-lg border border-eyr-outline-variant/20 overflow-hidden">
                                <div className="p-2 border-b border-eyr-outline-variant/10">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-eyr-on-variant/40 pointer-events-none" />
                                        <input
                                            autoFocus
                                            value={pickerSearch}
                                            onChange={e => setPickerSearch(e.target.value)}
                                            placeholder="Buscar…"
                                            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-eyr-outline-variant/30 focus:outline-none focus:border-eyr-primary"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-44 overflow-y-auto">
                                    {users
                                        .filter(u => !data.participantes.includes(u.name))
                                        .filter(u => !pickerSearch || normalizeText(u.name).includes(normalizeText(pickerSearch)))
                                        .map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => { addParticipante(u.name); setShowPicker(false); setPickerSearch(''); }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-eyr-surface-low transition-colors flex items-center gap-2.5"
                                            >
                                                <span className="w-6 h-6 rounded-full bg-eyr-surface-high flex items-center justify-center text-[10px] font-bold text-eyr-on-variant shrink-0">
                                                    {getInitials(u.name).toUpperCase()}
                                                </span>
                                                {u.name}
                                            </button>
                                        ))
                                    }
                                    {users.filter(u => !data.participantes.includes(u.name) && (!pickerSearch || normalizeText(u.name).includes(normalizeText(pickerSearch)))).length === 0 && (
                                        <p className="px-3 py-3 text-xs text-eyr-on-variant/50 text-center">No hay más usuarios</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Temas */}
            <div className="space-y-3">
                {data.temas.map((tema, idx) => (
                    <div key={tema.id} className="bg-white rounded-2xl border border-eyr-outline-variant/20 overflow-hidden">
                        {/* Tema header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-eyr-surface-low border-b border-eyr-outline-variant/10">
                            <span className="w-6 h-6 rounded-full bg-eyr-primary/10 text-eyr-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                            </span>
                            <input
                                value={tema.titulo}
                                onChange={e => updateTema(tema.id, 'titulo', e.target.value)}
                                placeholder="Título del tema…"
                                className="flex-1 bg-transparent text-sm font-bold text-eyr-on-surface focus:outline-none placeholder:font-normal placeholder:text-eyr-on-variant/40"
                            />
                            <button
                                onClick={() => setCollapsed(c => ({ ...c, [tema.id]: !c[tema.id] }))}
                                className="text-eyr-on-variant/40 hover:text-eyr-on-variant transition-colors p-1"
                            >
                                {collapsed[tema.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                            <button onClick={() => deleteTema(tema.id)} className="text-eyr-on-variant/30 hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {!collapsed[tema.id] && (
                            <div className="px-5 py-4 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-eyr-on-variant/50 uppercase tracking-wide block mb-1.5">
                                        Notas / desarrollo
                                    </label>
                                    <textarea
                                        value={tema.notas}
                                        onChange={e => updateTema(tema.id, 'notas', e.target.value)}
                                        placeholder="Resumen de lo discutido…"
                                        rows={2}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-eyr-outline-variant/20 focus:border-eyr-primary focus:outline-none resize-none bg-eyr-surface-low/50 placeholder:text-eyr-on-variant/30"
                                    />
                                </div>

                                {/* Acuerdos */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-bold text-eyr-on-variant/50 uppercase tracking-wide">
                                            Acuerdos
                                        </label>
                                        <button
                                            onClick={() => addAcuerdo(tema.id)}
                                            className="text-xs font-semibold text-eyr-primary hover:opacity-80 flex items-center gap-1 transition-opacity"
                                        >
                                            <Plus className="w-3 h-3" /> Agregar acuerdo
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {tema.acuerdos.map(a => (
                                            <div key={a.id} className={cn(
                                                'flex items-start gap-2.5 p-3 rounded-xl border transition-colors',
                                                a.cumplido
                                                    ? 'bg-emerald-50 border-emerald-200/60'
                                                    : 'bg-white border-eyr-outline-variant/20'
                                            )}>
                                                {/* Checkbox */}
                                                <button
                                                    onClick={() => updateAcuerdo(tema.id, a.id, 'cumplido', !a.cumplido)}
                                                    className={cn(
                                                        'mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all',
                                                        a.cumplido
                                                            ? 'bg-emerald-500 border-emerald-500'
                                                            : 'border-eyr-outline-variant/50 hover:border-eyr-primary'
                                                    )}
                                                >
                                                    {a.cumplido && <Check className="w-2.5 h-2.5 text-white" />}
                                                </button>
                                                {/* Campos */}
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <input
                                                        value={a.texto}
                                                        onChange={e => updateAcuerdo(tema.id, a.id, 'texto', e.target.value)}
                                                        placeholder="Descripción del acuerdo…"
                                                        className={cn(
                                                            'text-sm focus:outline-none bg-transparent placeholder:text-eyr-on-variant/30',
                                                            a.cumplido && 'line-through text-eyr-on-variant/50'
                                                        )}
                                                    />
                                                    <select
                                                        value={a.responsable}
                                                        onChange={e => updateAcuerdo(tema.id, a.id, 'responsable', e.target.value)}
                                                        className="text-xs rounded-lg border border-eyr-outline-variant/20 px-2 py-1.5 bg-white focus:outline-none focus:border-eyr-primary"
                                                    >
                                                        <option value="">Responsable…</option>
                                                        {users.map(u => (
                                                            <option key={u.id} value={u.name}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="date"
                                                        value={a.plazo}
                                                        onChange={e => updateAcuerdo(tema.id, a.id, 'plazo', e.target.value)}
                                                        className="text-xs rounded-lg border border-eyr-outline-variant/20 px-2 py-1.5 bg-white focus:outline-none focus:border-eyr-primary"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => deleteAcuerdo(tema.id, a.id)}
                                                    className="text-eyr-on-variant/30 hover:text-red-500 mt-0.5 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {tema.acuerdos.length === 0 && (
                                            <p className="text-xs text-eyr-on-variant/30 italic pl-1">
                                                Sin acuerdos — haz clic en "Agregar acuerdo"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Agregar tema */}
            <button
                onClick={addTema}
                className="w-full py-4 border-2 border-dashed border-eyr-outline-variant/30 rounded-2xl text-sm font-semibold text-eyr-on-variant/50 hover:border-eyr-primary/40 hover:text-eyr-primary transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Agregar tema
            </button>
        </div>
    );
}

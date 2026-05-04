import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Search, Users, ChevronDown, Calendar, Sun, Moon, ArrowRight, User, Filter, Plus, Pencil, Trash2, X, Save, Check } from 'lucide-react';
import { subscribeToCollection, setDocument, removeDocument, createDocument } from '../lib/firestoreService';
import { useAuth, canEdit as canEditHelper } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const DAYS = [
    { key: 'lunes', label: 'Lunes', short: 'Lun' },
    { key: 'martes', label: 'Martes', short: 'Mar' },
    { key: 'miercoles', label: 'Miércoles', short: 'Mié' },
    { key: 'jueves', label: 'Jueves', short: 'Jue' },
    { key: 'viernes', label: 'Viernes', short: 'Vie' },
];

const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

function getTodayIndex() {
    const jsDay = new Date().getDay();
    if (jsDay >= 1 && jsDay <= 5) return jsDay - 1;
    return -1;
}

function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function totalWeeklyHours(schedule) {
    let total = 0;
    for (const day of DAYS) {
        const slot = schedule?.[day.key];
        if (slot?.entry && slot?.exit) {
            total += timeToMinutes(slot.exit) - timeToMinutes(slot.entry);
        }
    }
    return total;
}

function formatHoursMinutes(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({ teacher, onClose, onSave, onDelete }) {
    const isNew = !teacher?.id;
    const [name, setName] = useState(teacher?.name || '');
    const [idReloj, setIdReloj] = useState(teacher?.idReloj || '');
    const [schedule, setSchedule] = useState(() => {
        const base = {};
        for (const d of DAYS) {
            base[d.key] = {
                entry: teacher?.schedule?.[d.key]?.entry || '',
                exit: teacher?.schedule?.[d.key]?.exit || '',
            };
        }
        return base;
    });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const handleSlot = (dayKey, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], [field]: value },
        }));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }
        setSaving(true);
        // Clean up empty slots
        const cleanSchedule = {};
        for (const d of DAYS) {
            const slot = schedule[d.key];
            if (slot.entry && slot.exit) {
                cleanSchedule[d.key] = slot;
            }
        }
        await onSave({ name: name.trim(), idReloj: idReloj.trim(), schedule: cleanSchedule }, teacher?.id);
        setSaving(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-800">
                        {isNew ? 'Agregar funcionario' : 'Editar horario'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Nombre completo"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                        />
                    </div>

                    {/* ID Reloj */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">ID Reloj (opcional)</label>
                        <input
                            type="text"
                            value={idReloj}
                            onChange={e => setIdReloj(e.target.value)}
                            placeholder="Ej: 42"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Horarios por día */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Horario semanal</label>
                        <div className="space-y-2">
                            {DAYS.map(d => (
                                <div key={d.key} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-xs font-bold text-slate-600 w-10 shrink-0">{d.short}</span>
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="time"
                                            value={schedule[d.key].entry}
                                            onChange={e => handleSlot(d.key, 'entry', e.target.value)}
                                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-mono text-emerald-700 focus:outline-none focus:border-indigo-400 transition-all"
                                        />
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                        <input
                                            type="time"
                                            value={schedule[d.key].exit}
                                            onChange={e => handleSlot(d.key, 'exit', e.target.value)}
                                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-mono text-red-500 focus:outline-none focus:border-indigo-400 transition-all"
                                        />
                                        {/* Clear day */}
                                        {(schedule[d.key].entry || schedule[d.key].exit) && (
                                            <button
                                                onClick={() => handleSlot(d.key, 'entry', '') || handleSlot(d.key, 'exit', '')}
                                                className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Deja vacío el día si el funcionario no trabaja ese día.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 gap-3">
                    {!isNew && (
                        confirmDelete ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-600 font-medium">¿Confirmar eliminación?</span>
                                <button
                                    onClick={() => onDelete(teacher.id, teacher.name)}
                                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                                >
                                    Eliminar
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs font-bold transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar
                            </button>
                        )
                    )}
                    <div className={cn("flex items-center gap-2 ml-auto", isNew && "w-full justify-end")}>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            Guardar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    , document.body);
}

// ── Main View ───────────────────────────────────────────────────────────────
export default function TeacherHoursView() {
    const { user } = useAuth();
    const userCanEdit = canEditHelper(user);

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [sortBy, setSortBy] = useState('name');
    const [editMode, setEditMode] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null); // null = closed, {} = new, teacher obj = editing

    const todayIndex = useMemo(() => getTodayIndex(), []);

    useEffect(() => {
        const unsub = subscribeToCollection('teacher_hours', (docs) => {
            setTeachers(docs.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Filtered + sorted ──
    const filtered = useMemo(() => {
        let list = [...teachers];

        if (search.trim()) {
            const norm = normalizeSearch(search);
            list = list.filter(t => normalizeSearch(t.name).includes(norm));
        }

        if (filterDay) {
            list = list.filter(t => t.schedule?.[filterDay]?.entry);
        }

        if (sortBy === 'entry') {
            const dayKey = filterDay || DAYS[todayIndex >= 0 ? todayIndex : 0].key;
            list.sort((a, b) => {
                const aTime = timeToMinutes(a.schedule?.[dayKey]?.entry);
                const bTime = timeToMinutes(b.schedule?.[dayKey]?.entry);
                return aTime - bTime;
            });
        } else if (sortBy === 'hours') {
            list.sort((a, b) => totalWeeklyHours(b.schedule) - totalWeeklyHours(a.schedule));
        } else {
            list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        return list;
    }, [teachers, search, filterDay, sortBy, todayIndex]);

    // ── Stats ──
    const stats = useMemo(() => {
        const todayKey = todayIndex >= 0 ? DAYS[todayIndex].key : null;
        const presentToday = todayKey
            ? teachers.filter(t => t.schedule?.[todayKey]?.entry).length
            : 0;

        let earliest = null;
        let latest = null;
        if (todayKey) {
            for (const t of teachers) {
                const slot = t.schedule?.[todayKey];
                if (!slot?.entry) continue;
                if (!earliest || timeToMinutes(slot.entry) < timeToMinutes(earliest)) earliest = slot.entry;
                if (!latest || timeToMinutes(slot.exit) > timeToMinutes(latest)) latest = slot.exit;
            }
        }

        return { total: teachers.length, presentToday, earliest, latest };
    }, [teachers, todayIndex]);

    // ── CRUD ──
    const handleSave = async (data, docId) => {
        try {
            if (docId) {
                await setDocument('teacher_hours', docId, data);
                toast.success('Horario actualizado', { description: data.name });
            } else {
                await createDocument('teacher_hours', data);
                toast.success('Funcionario agregado', { description: data.name });
            }
            setEditingTeacher(null);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar');
        }
    };

    const handleDelete = (docId, name) => {
        setEditingTeacher(null);
        removeDocument('teacher_hours', docId)
            .then(() => toast.info('Funcionario eliminado', { description: name }))
            .catch(err => { console.error(err); toast.error('Error al eliminar'); });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-slate-400 font-medium">Cargando horarios...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-indigo-600" />
                        </div>
                        Horarios de Permanencia
                    </h1>
                    <p className="text-slate-500 mt-1 text-lg">Horarios de entrada y salida del personal</p>
                </div>

                {/* Admin controls */}
                {userCanEdit && (
                    <div className="flex items-center gap-2 shrink-0">
                        {editMode && (
                            <button
                                onClick={() => setEditingTeacher({})}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar funcionario
                            </button>
                        )}
                        <button
                            onClick={() => setEditMode(e => !e)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors border",
                                editMode
                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {editMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                            {editMode ? 'Listo' : 'Editar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Edit mode banner */}
            {editMode && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium"
                >
                    <Pencil className="w-4 h-4 shrink-0" />
                    Modo edición activo — haz clic en el ícono de editar junto a cada funcionario para modificar su horario.
                </motion.div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Docentes</span>
                    </div>
                    <span className="text-2xl font-black text-indigo-700">{stats.total}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Presentes Hoy</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-700">{stats.presentToday}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {stats.total}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Primera Entrada</span>
                    </div>
                    <span className="text-2xl font-black text-amber-700">{stats.earliest || '-'}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Moon className="w-4 h-4 text-purple-500" />
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Última Salida</span>
                    </div>
                    <span className="text-2xl font-black text-purple-700">{stats.latest || '-'}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar funcionario..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-400"
                    >
                        <option value="">Todos los dias</option>
                        {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-400"
                    >
                        <option value="name">Ordenar: Nombre</option>
                        <option value="entry">Ordenar: Entrada</option>
                        <option value="hours">Ordenar: Horas Semanales</option>
                    </select>

                    {/* View toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-colors", viewMode === 'table' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500")}
                        >
                            Tabla
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-colors", viewMode === 'cards' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500")}
                        >
                            Tarjetas
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ TABLE VIEW ═══ */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left py-3 px-4 font-bold text-slate-600 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Docente</th>
                                    {DAYS.map((d, i) => (
                                        <th key={d.key} className={cn(
                                            "py-3 px-3 font-bold text-slate-600 text-center min-w-[130px]",
                                            i === todayIndex && "bg-indigo-50 text-indigo-700"
                                        )}>
                                            <div>{d.label}</div>
                                            {i === todayIndex && <span className="text-[9px] uppercase tracking-wider text-indigo-500 font-bold">Hoy</span>}
                                        </th>
                                    ))}
                                    <th className="py-3 px-3 font-bold text-slate-600 text-center min-w-[90px]">Hrs/Sem</th>
                                    {editMode && <th className="py-3 px-3 w-12" />}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((teacher, idx) => {
                                    const weeklyMin = totalWeeklyHours(teacher.schedule);
                                    return (
                                        <tr key={teacher.id} className={cn("border-b border-slate-100 hover:bg-slate-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                                            <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                                                        {teacher.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-sm">{teacher.name}</span>
                                                        {teacher.idReloj && (
                                                            <span className="block text-[10px] text-slate-400 font-mono">ID: {teacher.idReloj}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {DAYS.map((d, i) => {
                                                const slot = teacher.schedule?.[d.key];
                                                const isToday = i === todayIndex;
                                                return (
                                                    <td key={d.key} className={cn(
                                                        "py-3 px-3 text-center",
                                                        isToday && "bg-indigo-50/50"
                                                    )}>
                                                        {slot?.entry ? (
                                                            <div className={cn(
                                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold",
                                                                isToday
                                                                    ? "bg-indigo-100 text-indigo-700"
                                                                    : "bg-slate-100 text-slate-700"
                                                            )}>
                                                                <span className="text-emerald-600">{slot.entry}</span>
                                                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                                                <span className="text-red-500">{slot.exit}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 font-medium">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-3 px-3 text-center">
                                                <span className={cn(
                                                    "text-xs font-bold px-2.5 py-1 rounded-lg",
                                                    weeklyMin > 2400 ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {formatHoursMinutes(weeklyMin)}
                                                </span>
                                            </td>
                                            {editMode && (
                                                <td className="py-3 px-3 text-center">
                                                    <button
                                                        onClick={() => setEditingTeacher(teacher)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors mx-auto"
                                                        title="Editar horario"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No hay funcionarios que coincidan</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ CARDS VIEW ═══ */}
            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(teacher => {
                        const weeklyMin = totalWeeklyHours(teacher.schedule);
                        return (
                            <motion.div
                                key={teacher.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                                            {teacher.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 text-base truncate">{teacher.name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                {teacher.idReloj && <span className="font-mono">ID: {teacher.idReloj}</span>}
                                                <span className="font-bold text-indigo-500">{formatHoursMinutes(weeklyMin)}/sem</span>
                                            </div>
                                        </div>
                                        {editMode && (
                                            <button
                                                onClick={() => setEditingTeacher(teacher)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/60 text-indigo-600 hover:bg-white transition-colors shrink-0"
                                                title="Editar horario"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Schedule Grid */}
                                <div className="p-3 space-y-1.5">
                                    {DAYS.map((d, i) => {
                                        const slot = teacher.schedule?.[d.key];
                                        const isToday = i === todayIndex;
                                        return (
                                            <div key={d.key} className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded-lg",
                                                isToday ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50/50",
                                                !slot?.entry && "opacity-40"
                                            )}>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-xs font-bold w-8",
                                                        isToday ? "text-indigo-700" : "text-slate-500"
                                                    )}>
                                                        {d.short}
                                                    </span>
                                                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                                </div>
                                                {slot?.entry ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                                        <span className="text-emerald-600">{slot.entry}</span>
                                                        <ArrowRight className="w-3 h-3 text-slate-300" />
                                                        <span className="text-red-500">{slot.exit}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300">Libre</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No hay funcionarios que coincidan</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingTeacher !== null && (
                    <EditModal
                        teacher={editingTeacher}
                        onClose={() => setEditingTeacher(null)}
                        onSave={handleSave}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

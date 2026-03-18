import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Search, Users, ChevronDown, Calendar, Sun, Moon, ArrowRight, User, Filter } from 'lucide-react';
import { subscribeToCollection } from '../lib/firestoreService';
import { cn } from '../lib/utils';

const DAYS = [
    { key: 'lunes', label: 'Lunes', short: 'Lun' },
    { key: 'martes', label: 'Martes', short: 'Mar' },
    { key: 'miercoles', label: 'Miércoles', short: 'Mié' },
    { key: 'jueves', label: 'Jueves', short: 'Jue' },
    { key: 'viernes', label: 'Viernes', short: 'Vie' },
];

const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

// Detect which day is today (0=Mon .. 4=Fri, -1 = weekend)
function getTodayIndex() {
    const jsDay = new Date().getDay(); // 0=Sun, 1=Mon .. 6=Sat
    if (jsDay >= 1 && jsDay <= 5) return jsDay - 1;
    return -1;
}

// Parse time string "HH:MM" to minutes for sorting/comparison
function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

// Compute total hours for a schedule
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

export default function TeacherHoursView() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
    const [sortBy, setSortBy] = useState('name'); // 'name' | 'entry' | 'hours'

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

        // Sort
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

        // Earliest entry today
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
            </div>

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
                                            <h3 className="font-bold text-slate-800 text-sm truncate">{teacher.name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                {teacher.idReloj && <span className="font-mono">ID: {teacher.idReloj}</span>}
                                                <span className="font-bold text-indigo-500">{formatHoursMinutes(weeklyMin)}/sem</span>
                                            </div>
                                        </div>
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
        </div>
    );
}
